import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.core.security import CurrentUser, get_current_user
from app.db.supabase_client import get_user_client

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/generate")
def generate_report(user: CurrentUser = Depends(get_current_user)):
    db = get_user_client(user.access_token)

    summary = (
        db.table("v_dashboard_summary").select("*").eq("user_id", user.id).maybe_single().execute().data
    ) or {}
    subs = (
        db.table("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("leak_score", desc=True)
        .execute()
        .data
        or []
    )
    recs = (
        db.table("recommendations")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .execute()
        .data
        or []
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("LeakGuard AI — Subscription Leak Report", styles["Title"]),
        Spacer(1, 12),
        Paragraph(
            f"Active subscriptions: {summary.get('active_subscriptions', 0)} &nbsp;|&nbsp; "
            f"Monthly spend: {summary.get('monthly_spend', 0):.2f} &nbsp;|&nbsp; "
            f"Leak score: {summary.get('avg_leak_score', 0)}/100",
            styles["Normal"],
        ),
        Spacer(1, 20),
        Paragraph("Active Subscriptions", styles["Heading2"]),
    ]

    sub_table_data = [["Merchant", "Category", "Amount", "Cycle", "Leak Score"]]
    for s in subs:
        sub_table_data.append([
            s["merchant_name"], s["category"], f"{s['amount']:.2f}",
            s["billing_cycle"], str(s["leak_score"]),
        ])
    sub_table = Table(sub_table_data, hAlign="LEFT")
    sub_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
    ]))
    story += [sub_table, Spacer(1, 20), Paragraph("Recommendations", styles["Heading2"])]

    rec_table_data = [["Action", "Title", "Est. Monthly Savings"]]
    for r in recs:
        rec_table_data.append([r["action"], r["title"], f"{r['estimated_monthly_savings']:.2f}"])
    rec_table = Table(rec_table_data, hAlign="LEFT")
    rec_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
    ]))
    story.append(rec_table)

    doc.build(story)
    buffer.seek(0)

    db.table("reports").insert({
        "user_id": user.id,
        "storage_path": "generated-on-demand",
        "summary": summary,
    }).execute()

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=leakguard-report.pdf"},
    )
