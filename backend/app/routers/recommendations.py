from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import CurrentUser, get_current_user
from app.db.supabase_client import get_user_client
from app.models.schemas import RecommendationOut, RecommendationStatusUpdate

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("", response_model=list[RecommendationOut])
def list_recommendations(
    status_filter: str | None = None,
    user: CurrentUser = Depends(get_current_user),
):
    db = get_user_client(user.access_token)
    query = db.table("recommendations").select("*").eq("user_id", user.id)
    if status_filter:
        query = query.eq("status", status_filter)
    rows = query.order("priority", desc=True).execute().data or []
    return rows


@router.patch("/{recommendation_id}", response_model=RecommendationOut)
def update_recommendation_status(
    recommendation_id: str,
    payload: RecommendationStatusUpdate,
    user: CurrentUser = Depends(get_current_user),
):
    db = get_user_client(user.access_token)
    existing = (
        db.table("recommendations")
        .select("id, subscription_id, action")
        .eq("id", recommendation_id)
        .eq("user_id", user.id)
        .maybe_single()
        .execute()
        .data
    )
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")

    updated = (
        db.table("recommendations")
        .update({"status": payload.status})
        .eq("id", recommendation_id)
        .execute()
        .data[0]
    )

    # If the user accepted a "cancel" recommendation, reflect it on the
    # underlying subscription immediately.
    if payload.status == "accepted" and existing["action"] == "cancel":
        db.table("subscriptions").update({"status": "cancelled"}).eq(
            "id", existing["subscription_id"]
        ).execute()

    return updated
