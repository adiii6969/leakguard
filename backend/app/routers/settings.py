from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import CurrentUser, get_current_user
from app.db.supabase_client import get_user_client
from app.models.schemas import ProfileOut, ProfileUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/profile", response_model=ProfileOut)
def get_profile(user: CurrentUser = Depends(get_current_user)):
    db = get_user_client(user.access_token)
    row = db.table("profiles").select("*").eq("id", user.id).maybe_single().execute().data
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return row


@router.patch("/profile", response_model=ProfileOut)
def update_profile(payload: ProfileUpdate, user: CurrentUser = Depends(get_current_user)):
    db = get_user_client(user.access_token)
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not updates:
        row = db.table("profiles").select("*").eq("id", user.id).maybe_single().execute().data
        return row
    row = db.table("profiles").update(updates).eq("id", user.id).execute().data[0]
    return row


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
def delete_account_data(user: CurrentUser = Depends(get_current_user)):
    """Privacy-first data deletion: wipes all derived data for the user.
    Actual auth.users deletion should be triggered via Supabase Admin API
    from a trusted context (service role), not exposed directly here."""
    db = get_user_client(user.access_token)
    for table in ["recommendations", "subscriptions", "transactions", "statements",
                  "leak_score_history", "spending_predictions", "reports"]:
        db.table(table).delete().eq("user_id", user.id).execute()
