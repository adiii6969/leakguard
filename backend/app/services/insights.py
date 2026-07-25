"""
Financial Insights & Prediction Service
------------------------------------------
- Future spending prediction: simple trend-based projection of monthly
  spend over the next N months from active subscriptions (accounts for
  known yearly renewals landing in a future month).
- Savings predictor: projects cumulative savings if the user accepts
  all pending "cancel"/"downgrade" recommendations.
- Quick insights: human-readable highlights for the dashboard.
"""
from dataclasses import dataclass
from datetime import date

MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]


@dataclass
class MonthlyForecast:
    month_label: str
    forecast_month: date
    predicted_spend: float
    predicted_savings_if_actioned: float


def predict_future_spending(
    subscriptions: list[dict],  # active subs: amount, billing_cycle, next_renewal
    pending_savings_monthly: float,
    months_ahead: int = 6,
) -> list[MonthlyForecast]:
    base_monthly = 0.0
    for sub in subscriptions:
        if sub.get("status") != "active":
            continue
        cycle = sub.get("billing_cycle", "monthly")
        amount = sub.get("amount", 0)
        if cycle == "monthly":
            base_monthly += amount
        elif cycle == "yearly":
            base_monthly += amount / 12
        elif cycle == "quarterly":
            base_monthly += amount / 3
        elif cycle == "weekly":
            base_monthly += amount * 4.33

    today = date.today()
    forecasts: list[MonthlyForecast] = []
    cumulative_savings = 0.0

    for i in range(1, months_ahead + 1):
        month_index = (today.month - 1 + i) % 12
        year = today.year + ((today.month - 1 + i) // 12)
        forecast_month = date(year, month_index + 1, 1)
        cumulative_savings += pending_savings_monthly
        forecasts.append(
            MonthlyForecast(
                month_label=MONTH_NAMES[month_index],
                forecast_month=forecast_month,
                predicted_spend=round(base_monthly, 2),
                predicted_savings_if_actioned=round(cumulative_savings, 2),
            )
        )
    return forecasts


def generate_quick_insights(
    dashboard_summary: dict,
    subscriptions: list[dict],
    recommendations: list[dict],
) -> list[str]:
    insights: list[str] = []

    if dashboard_summary.get("duplicate_count", 0) > 0:
        insights.append(
            f"You have {dashboard_summary['duplicate_count']} duplicate or overlapping "
            "subscriptions — consolidating could cut costs immediately."
        )

    if dashboard_summary.get("price_hike_count", 0) > 0:
        insights.append(
            f"{dashboard_summary['price_hike_count']} subscription(s) silently raised "
            "prices since your last statement."
        )

    if dashboard_summary.get("unused_count", 0) > 0:
        insights.append(
            f"{dashboard_summary['unused_count']} subscription(s) show no recent usage signal."
        )

    high_priority = [r for r in recommendations if r.get("priority") == "high"]
    if high_priority:
        total_savings = sum(r.get("estimated_monthly_savings", 0) for r in high_priority)
        insights.append(
            f"Acting on your {len(high_priority)} high-priority recommendation(s) could "
            f"save you ~{total_savings:.0f}/month."
        )

    if not insights:
        insights.append("No major leaks detected — your subscriptions look healthy.")

    return insights
