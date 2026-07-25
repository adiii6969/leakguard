import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.core.config import get_settings
from app.core.security import CurrentUser, get_current_user
from app.db.supabase_client import get_user_client
from app.models.schemas import UploadResult
from app.services.parser import UnsupportedFileError, parse_statement
from app.services.pipeline import run_pipeline

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("", response_model=UploadResult)
async def upload_statement(
    file: UploadFile,
    user: CurrentUser = Depends(get_current_user),
):
    ext = file.filename.lower().rsplit(".", 1)[-1] if "." in file.filename else ""
    if ext not in ("csv", "pdf", "xlsx", "xls"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV, PDF, and Excel statements are supported.",
        )

    file_bytes = await file.read()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.max_upload_size_mb}MB limit.",
        )

    db = get_user_client(user.access_token)

    statement = (
        db.table("statements")
        .insert({
            "user_id": user.id,
            "file_name": file.filename,
            "file_type": "pdf" if ext == "pdf" else ("csv" if ext == "csv" else "xlsx"),
            "status": "processing",
        })
        .execute()
        .data[0]
    )

    try:
        transactions = parse_statement(file_bytes, file.filename)
        # `file_bytes` is discarded here — never written to disk or storage,
        # consistent with the privacy-first design.
        del file_bytes

        result = run_pipeline(db, user.id, statement["id"], transactions)

        db.table("statements").update({
            "status": "completed",
            "transactions_found": result["transactions_found"],
            "subscriptions_found": result["subscriptions_found"],
            "completed_at": "now()",
        }).eq("id", statement["id"]).execute()

        return UploadResult(
            statement_id=statement["id"],
            file_name=file.filename,
            transactions_found=result["transactions_found"],
            subscriptions_found=result["subscriptions_found"],
            status="completed",
        )

    except UnsupportedFileError as exc:
        db.table("statements").update({
            "status": "failed", "error_message": str(exc),
        }).eq("id", statement["id"]).execute()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    except Exception as exc:
        logger.exception("Pipeline failed for statement %s", statement["id"])
        db.table("statements").update({
            "status": "failed", "error_message": "Internal processing error.",
        }).eq("id", statement["id"]).execute()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process statement.",
        ) from exc
