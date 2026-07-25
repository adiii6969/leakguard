"""
AI Recommendation Engine
--------------------------
Calls Google Gemini to turn detected subscription signals into one of
the seven recommendation actions the product defines: cancel,
downgrade, keep, alternative, family_plan, cashback, switch_plan.

Gemini is prompted to return strict JSON so we can persist it directly
against the `recommendations` table. If the API call fails or returns
malformed output, we fall back to a deterministic rule-based
recommendation so the feature degrades gracefully rather than breaking
the dashboard.
"""
import json
import logging

from google import genai
from google.genai import types

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

VALID_ACTIONS = {"cancel", "downgrade", "keep", "alternative", "family_plan", "cashback", "switch_plan"}

SYSTEM_PROMPT = """You are LeakGuard AI's subscription advisor. Given one \
detected subscription's data, choose the single best recommended action \
and explain it briefly and concretely for the user.

Valid actions (choose exactly one):
- cancel: subscription looks unused or redundant, drop it entirely
- downgrade: a cheaper tier of the same service would likely suffice
- keep: it's fairly priced and being used, no action needed
- alternative: a materially cheaper competing service exists
- family_plan: splitting cost across a family/group plan would save money
- cashback: keep it, but route payment through a card/offer for cashback
- switch_plan: switching billing cycle (e.g. monthly->yearly or vice versa) saves money

Respond with ONLY a JSON object, no markdown fences, matching exactly:
{"action": "<one of the valid actions>", "title": "<5-8 word action title>", \
"reasoning": "<1-2 sentence concrete reasoning>", \
"estimated_monthly_savings": <number, 0 if none>}
"""


def _build_user_prompt(subscription: dict) -> str:
    return (
        f"Merchant: {subscription['merchant_name']}\n"
        f"Category: {subscription.get('category', 'Other')}\n"
        f"Amount: {subscription['amount']} {subscription.get('currency', 'INR')} "
        f"per {subscription.get('billing_cycle', 'monthly')}\n"
        f"Price hike detected: {subscription.get('price_hike_detected', False)} "
        f"({subscription.get('price_hike_pct', 0)}% increase)\n"
        f"Is duplicate of another active subscription: {subscription.get('is_duplicate', False)}\n"
        f"Status: {subscription.get('status', 'active')}\n"
        f"Leak score (0-100, higher = more wasteful): {subscription.get('leak_score', 0)}\n"
    )


def _fallback_recommendation(subscription: dict) -> dict:
    """Deterministic rules used if Gemini is unavailable or errors out."""
    amount = subscription["amount"]
    if subscription.get("is_duplicate"):
        return {
            "action": "cancel",
            "title": "Cancel this duplicate subscription",
            "reasoning": "This overlaps with another active subscription you already pay for.",
            "estimated_monthly_savings": amount,
        }
    if subscription.get("status") == "unused":
        return {
            "action": "cancel",
            "title": "Cancel this unused subscription",
            "reasoning": "No recent activity suggests you're not getting value from this.",
            "estimated_monthly_savings": amount,
        }
    if subscription.get("price_hike_detected"):
        return {
            "action": "downgrade",
            "title": "Review plan after price increase",
            "reasoning": f"Price rose {subscription.get('price_hike_pct', 0)}% — a lower tier may still meet your needs.",
            "estimated_monthly_savings": round(amount * 0.3, 2),
        }
    return {
        "action": "keep",
        "title": "Keep — fairly priced and active",
        "reasoning": "No leak signals detected for this subscription right now.",
        "estimated_monthly_savings": 0,
    }


def generate_recommendation(subscription: dict) -> dict:
    """Returns a dict matching the `recommendations` table's shape (minus ids)."""
    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=_build_user_prompt(subscription),
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.3,
                response_mime_type="application/json",
            ),
        )
        parsed = json.loads(response.text)
        if parsed.get("action") not in VALID_ACTIONS:
            raise ValueError(f"Gemini returned invalid action: {parsed.get('action')}")

        monthly = float(parsed.get("estimated_monthly_savings", 0) or 0)
        return {
            "action": parsed["action"],
            "title": parsed["title"],
            "reasoning": parsed["reasoning"],
            "estimated_monthly_savings": monthly,
            "estimated_yearly_savings": round(monthly * 12, 2),
            "priority": _priority_for_score(subscription.get("leak_score", 0)),
        }
    except Exception:
        logger.exception("Gemini recommendation failed for %s, using fallback", subscription.get("merchant_name"))
        fallback = _fallback_recommendation(subscription)
        monthly = fallback["estimated_monthly_savings"]
        return {
            **fallback,
            "estimated_yearly_savings": round(monthly * 12, 2),
            "priority": _priority_for_score(subscription.get("leak_score", 0)),
        }


def _priority_for_score(leak_score: int) -> str:
    if leak_score >= 70:
        return "high"
    if leak_score >= 40:
        return "medium"
    return "low"


def generate_recommendations_batch(subscriptions: list[dict]) -> list[dict]:
    """Generates one recommendation per subscription. Sequential by design —
    Gemini calls are cheap/fast for this payload size and this keeps rate
    limiting simple; parallelize with asyncio.gather if throughput demands it."""
    return [
        {**generate_recommendation(sub), "subscription_id": sub["id"]}
        for sub in subscriptions
    ]
