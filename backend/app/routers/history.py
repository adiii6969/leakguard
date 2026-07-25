from fastapi import APIRouter, Depends

from app.core.security import CurrentUser, get_current_user
from app.db.supabase_client import get_user_client
from app.models.schemas import SpendingForecast
from app.services.insights import predict_future_spending

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("/statements")
def list_statements(user: CurrentUser = Depends(get_current_user)):
    db = get_user_client(user.access_token)
    return (
        db.table("statements")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .execute()
        .data
        or []
    )


@router.get("/forecast", response_model=list[SpendingForecast])
def get_forecast(months: int = 6, user: CurrentUser = Depends(get_current_user)):
    db = get_user_client(user.access_token)
    subs = (
        db.table("subscriptions")
        .select("amount, billing_cycle, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .execute()
        .data
        or []
    )
    pending = (
        db.table("recommendations")
        .select("estimated_monthly_savings")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .execute()
        .data
        or []
    )
    pending_monthly_savings = sum(r["estimated_monthly_savings"] for r in pending)

    forecasts = predict_future_spending(subs, pending_monthly_savings, months_ahead=months)
    results = [
        SpendingForecast(
            forecast_month=f.forecast_month,
            predicted_spend=f.predicted_spend,
            predicted_savings_if_actioned=f.predicted_savings_if_actioned,
        )
        for f in forecasts
    ]

    # persist for reference / auditability
    if results:
        db.table("spending_predictions").upsert(
            [
                {
                    "user_id": user.id,
                    "forecast_month": r.forecast_month.isoformat(),
                    "predicted_spend": r.predicted_spend,
                    "predicted_savings_if_actioned": r.predicted_savings_if_actioned,
                }
                for r in results
            ],
            on_conflict="user_id,forecast_month",
        ).execute()

    return results
