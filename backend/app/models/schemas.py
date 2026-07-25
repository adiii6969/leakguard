from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

BillingCycle = Literal["monthly", "yearly", "weekly", "quarterly"]
SubscriptionStatus = Literal["active", "cancelled", "paused", "unused"]
RecommendationAction = Literal[
    "cancel", "downgrade", "keep", "alternative", "family_plan", "cashback", "switch_plan"
]


# ---------------------------------------------------------------- Upload
class ParsedTransaction(BaseModel):
    raw_description: str
    amount: float
    txn_date: date
    currency: str = "INR"


class UploadResult(BaseModel):
    statement_id: str
    file_name: str
    transactions_found: int
    subscriptions_found: int
    status: Literal["processing", "completed", "failed"]


# ---------------------------------------------------------------- Subscription
class SubscriptionOut(BaseModel):
    id: str
    merchant_name: str
    category: str
    plan_name: str | None = None
    amount: float
    previous_amount: float | None = None
    currency: str
    billing_cycle: BillingCycle
    first_seen: date
    last_charged: date
    next_renewal: date | None = None
    status: SubscriptionStatus
    is_duplicate: bool
    duplicate_of: str | None = None
    price_hike_detected: bool
    price_hike_pct: float | None = None
    leak_score: int
    confidence: float


# ---------------------------------------------------------------- Recommendation
class RecommendationOut(BaseModel):
    id: str
    subscription_id: str
    action: RecommendationAction
    title: str
    reasoning: str
    estimated_monthly_savings: float
    estimated_yearly_savings: float
    priority: Literal["low", "medium", "high"]
    status: Literal["pending", "accepted", "dismissed"]


class RecommendationStatusUpdate(BaseModel):
    status: Literal["accepted", "dismissed"]


# ---------------------------------------------------------------- Dashboard
class DashboardSummary(BaseModel):
    monthly_spend: float
    yearly_spend: float
    potential_savings: float
    leak_score: int
    active_subscriptions: int
    duplicate_count: int
    price_hike_count: int
    unused_count: int


class CategoryBreakdown(BaseModel):
    category: str
    subscription_count: int
    total_amount: float


class LeakScorePoint(BaseModel):
    score: int
    monthly_spend: float
    potential_savings: float
    recorded_at: datetime


# ---------------------------------------------------------------- Predictions
class SpendingForecast(BaseModel):
    forecast_month: date
    predicted_spend: float
    predicted_savings_if_actioned: float


# ---------------------------------------------------------------- Settings
class ProfileOut(BaseModel):
    id: str
    full_name: str | None = None
    currency: str
    monthly_budget: float | None = None
    theme: Literal["dark", "light", "system"]
    notifications_enabled: bool


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    currency: str | None = None
    monthly_budget: float | None = None
    theme: Literal["dark", "light", "system"] | None = None
    notifications_enabled: bool | None = None
