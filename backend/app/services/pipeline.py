"""
Analysis Pipeline
-------------------
Wires every detection module together in the order defined by the
product's flow diagram:

  Extract -> Normalize Merchant -> Detect Recurring -> Detect Duplicate
  -> Detect Price Hike -> Leak Score -> AI Recommendation -> Persist

This is the single place that owns "what happens after a statement is
uploaded" so routers stay thin.
"""
import logging
from statistics import mean

from supabase import Client

from app.models.schemas import ParsedTransaction
from app.services.duplicate_detector import detect_duplicates
from app.services.leak_score_engine import LeakScoreInputs, compute_leak_score
from app.services.merchant_normalizer import group_by_merchant
from app.services.price_hike_detector import detect_price_hike
from app.services.recommendation_engine import generate_recommendations_batch
from app.services.recurring_detector import detect_recurring

logger = logging.getLogger(__name__)


def run_pipeline(
    db: Client,
    user_id: str,
    statement_id: str,
    transactions: list[ParsedTransaction],
) -> dict:
    """Runs the full pipeline and persists results. Returns a summary dict."""

    # 1. Load merchant directory (shared reference table)
    merchant_rows = db.table("merchants").select("*").execute().data or []

    # 2. Normalize + group transactions by merchant
    txn_dicts = [
        {"raw_description": t.raw_description, "amount": t.amount, "txn_date": t.txn_date}
        for t in transactions
    ]
    grouped = group_by_merchant(txn_dicts, merchant_rows)

    # Persist raw transactions (used for history/charts; purged after 90d)
    if txn_dicts:
        txn_rows = []
        for merchant_name, txns in grouped.items():
            category = txns[0].get("category", "Other")
            for t in txns:
                txn_rows.append({
                    "user_id": user_id,
                    "statement_id": statement_id,
                    "raw_description": t["raw_description"],
                    "merchant_normalized": merchant_name,
                    "amount": t["amount"],
                    "txn_date": t["txn_date"].isoformat(),
                    "category": category,
                })
        db.table("transactions").insert(txn_rows).execute()

    # 3. Detect recurring subscriptions per merchant
    detected_subs: list[dict] = []
    for merchant_name, txns in grouped.items():
        recurring = detect_recurring(txns)
        if not recurring.is_recurring:
            continue
        category = txns[0].get("category", "Other")
        price_hike = detect_price_hike(recurring.amounts)
        detected_subs.append({
            "user_id": user_id,
            "merchant_name": merchant_name,
            "category": category,
            "amount": recurring.last_amount,
            "previous_amount": price_hike.previous_amount,
            "billing_cycle": recurring.billing_cycle,
            "first_seen": recurring.first_seen.isoformat(),
            "last_charged": recurring.last_charged.isoformat(),
            "next_renewal": recurring.next_renewal.isoformat() if recurring.next_renewal else None,
            "status": "active",
            "price_hike_detected": price_hike.detected,
            "price_hike_pct": price_hike.increase_pct,
            "confidence": 0.9,  # refined below once we track merchant match confidence per-txn
        })

    if not detected_subs:
        return {"subscriptions_found": 0, "transactions_found": len(transactions)}

    # 4. Detect duplicates (needs ids, so upsert first without dup flags,
    #    then patch). Upsert on (user_id, merchant_name) to avoid duplicate
    #    rows across repeated uploads of overlapping statements.
    upserted = (
        db.table("subscriptions")
        .upsert(detected_subs, on_conflict="user_id,merchant_name")
        .execute()
        .data
    )

    avg_amount = mean(s["amount"] for s in upserted) if upserted else 0
    duplicate_flags = detect_duplicates(upserted)
    dup_map = {f.subscription_id: f.duplicate_of for f in duplicate_flags}

    # 5. Compute leak scores + patch duplicate flags
    for sub in upserted:
        is_dup = sub["id"] in dup_map
        score = compute_leak_score(LeakScoreInputs(
            price_hike_detected=sub.get("price_hike_detected", False),
            price_hike_pct=sub.get("price_hike_pct"),
            is_duplicate=is_dup,
            is_unused=sub.get("status") == "unused",
            amount=sub["amount"],
            user_avg_amount=avg_amount,
            merchant_confidence=sub.get("confidence", 0.8),
        ))
        db.table("subscriptions").update({
            "is_duplicate": is_dup,
            "duplicate_of": dup_map.get(sub["id"]),
            "leak_score": score,
        }).eq("id", sub["id"]).execute()
        sub["is_duplicate"] = is_dup
        sub["leak_score"] = score

    # 6. AI recommendations
    try:
        recommendations = generate_recommendations_batch(upserted)
        if recommendations:
            db.table("recommendations").insert(
                [{**r, "user_id": user_id} for r in recommendations]
            ).execute()
    except Exception:
        logger.exception("Recommendation generation failed; subscriptions still saved")

    # 7. Snapshot leak score history for trend charts
    try:
        db.rpc("snapshot_leak_score", {"p_user_id": user_id}).execute()
    except Exception:
        logger.exception("Leak score snapshot failed (non-fatal)")

    return {
        "subscriptions_found": len(upserted),
        "transactions_found": len(transactions),
    }
