from fastapi import APIRouter, Depends

from app.core.security import CurrentUser, get_current_user
from app.db.supabase_client import get_user_client
from app.models.schemas import CategoryBreakdown, DashboardSummary, LeakScorePoint
from app.services.insights import generate_quick_insights

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(user: CurrentUser = Depends(get_current_user)):
    db = get_user_client(user.access_token)
    row = (
        db.table("v_dashboard_summary")
        .select("*")
        .eq("user_id", user.id)
        .maybe_single()
        .execute()
        .data
    ) or {}

    monthly = float(row.get("monthly_spend", 0) or 0)
    pending = (
        db.table("recommendations")
        .select("estimated_monthly_savings")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .execute()
        .data
        or []
    )
    potential_savings = sum(r["estimated_monthly_savings"] for r in pending)

    return DashboardSummary(
        monthly_spend=monthly,
        yearly_spend=round(monthly * 12, 2),
        potential_savings=round(potential_savings, 2),
        leak_score=int(row.get("avg_leak_score") or 0),
        active_subscriptions=int(row.get("active_subscriptions", 0) or 0),
        duplicate_count=int(row.get("duplicate_count", 0) or 0),
        price_hike_count=int(row.get("price_hike_count", 0) or 0),
        unused_count=int(row.get("unused_count", 0) or 0),
    )


@router.get("/categories", response_model=list[CategoryBreakdown])
def get_category_breakdown(user: CurrentUser = Depends(get_current_user)):
    db = get_user_client(user.access_token)
    rows = (
        db.table("v_category_breakdown")
        .select("*")
        .eq("user_id", user.id)
        .execute()
        .data
        or []
    )
    return [
        CategoryBreakdown(
            category=r["category"],
            subscription_count=r["subscription_count"],
            total_amount=float(r["total_amount"]),
        )
        for r in rows
    ]


@router.get("/renewals")
def get_upcoming_renewals(user: CurrentUser = Depends(get_current_user)):
    db = get_user_client(user.access_token)
    return (
        db.table("v_upcoming_renewals")
        .select("*")
        .eq("user_id", user.id)
        .execute()
        .data
        or []
    )


@router.get("/leak-score-history", response_model=list[LeakScorePoint])
def get_leak_score_history(user: CurrentUser = Depends(get_current_user)):
    db = get_user_client(user.access_token)
    rows = (
        db.table("leak_score_history")
        .select("score, monthly_spend, potential_savings, recorded_at")
        .eq("user_id", user.id)
        .order("recorded_at", desc=False)
        .limit(90)
        .execute()
        .data
        or []
    )
    return rows


@router.get("/quick-insights", response_model=list[str])
def get_quick_insights(user: CurrentUser = Depends(get_current_user)):
    db = get_user_client(user.access_token)
    summary_row = (
        db.table("v_dashboard_summary").select("*").eq("user_id", user.id).maybe_single().execute().data
    ) or {}
    subs = db.table("subscriptions").select("*").eq("user_id", user.id).execute().data or []
    recs = db.table("recommendations").select("*").eq("user_id", user.id).eq("status", "pending").execute().data or []
    return generate_quick_insights(summary_row, subs, recs)
