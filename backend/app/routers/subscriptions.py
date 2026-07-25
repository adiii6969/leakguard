from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import CurrentUser, get_current_user
from app.db.supabase_client import get_user_client
from app.models.schemas import SubscriptionOut, SubscriptionStatus

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


@router.get("", response_model=list[SubscriptionOut])
def list_subscriptions(
    status_filter: SubscriptionStatus | None = None,
    category: str | None = None,
    user: CurrentUser = Depends(get_current_user),
):
    db = get_user_client(user.access_token)
    query = db.table("subscriptions").select("*").eq("user_id", user.id)
    if status_filter:
        query = query.eq("status", status_filter)
    if category:
        query = query.eq("category", category)
    rows = query.order("leak_score", desc=True).execute().data or []
    return rows


@router.get("/{subscription_id}", response_model=SubscriptionOut)
def get_subscription(subscription_id: str, user: CurrentUser = Depends(get_current_user)):
    db = get_user_client(user.access_token)
    row = (
        db.table("subscriptions")
        .select("*")
        .eq("id", subscription_id)
        .eq("user_id", user.id)
        .maybe_single()
        .execute()
        .data
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
    return row


@router.patch("/{subscription_id}/status", response_model=SubscriptionOut)
def update_subscription_status(
    subscription_id: str,
    new_status: SubscriptionStatus,
    user: CurrentUser = Depends(get_current_user),
):
    db = get_user_client(user.access_token)
    existing = (
        db.table("subscriptions")
        .select("id")
        .eq("id", subscription_id)
        .eq("user_id", user.id)
        .maybe_single()
        .execute()
        .data
    )
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")

    updated = (
        db.table("subscriptions")
        .update({"status": new_status})
        .eq("id", subscription_id)
        .execute()
        .data[0]
    )
    return updated
