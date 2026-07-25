import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import dashboard, history, recommendations, reports, settings as settings_router, subscriptions, upload

logging.basicConfig(level=logging.INFO)
settings = get_settings()

app = FastAPI(
    title="LeakGuard AI API",
    description="Privacy-first AI subscription leak detector — backend service.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(dashboard.router)
app.include_router(subscriptions.router)
app.include_router(recommendations.router)
app.include_router(reports.router)
app.include_router(history.router)
app.include_router(settings_router.router)


@app.get("/health", tags=["meta"])
def health_check():
    return {"status": "ok", "service": "leakguard-ai-backend"}
