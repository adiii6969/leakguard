"""
Recurring Subscription Detector
--------------------------------
Given a merchant's transaction history (already normalized), decides:
  1. Is this actually recurring (vs a one-off purchase)?
  2. What's the billing cycle (weekly/monthly/quarterly/yearly)?
  3. What's the current/last amount and next predicted renewal date?
"""
from dataclasses import dataclass, field
from datetime import date, timedelta
from statistics import mean, pstdev

from app.core.config import get_settings

settings = get_settings()

CYCLE_DAY_RANGES = {
    "weekly": (5, 9),
    "monthly": (25, 35),
    "quarterly": (80, 100),
    "yearly": (350, 380),
}


@dataclass
class RecurringResult:
    is_recurring: bool
    billing_cycle: str = "monthly"
    amounts: list[float] = field(default_factory=list)
    last_amount: float = 0.0
    first_seen: date | None = None
    last_charged: date | None = None
    next_renewal: date | None = None
    occurrences: int = 0


def _infer_cycle(gaps_days: list[float]) -> str | None:
    if not gaps_days:
        return None
    avg_gap = mean(gaps_days)
    for cycle, (low, high) in CYCLE_DAY_RANGES.items():
        if low <= avg_gap <= high:
            return cycle
    return None


def detect_recurring(transactions: list[dict]) -> RecurringResult:
    """
    transactions: list of {"amount": float, "txn_date": date} for a
    single normalized merchant, already sorted or not (we sort here).
    """
    if len(transactions) < settings.recurring_min_occurrences:
        return RecurringResult(is_recurring=False, occurrences=len(transactions))

    txns = sorted(transactions, key=lambda t: t["txn_date"])
    dates = [t["txn_date"] for t in txns]
    amounts = [t["amount"] for t in txns]

    gaps = [(dates[i] - dates[i - 1]).days for i in range(1, len(dates))]
    cycle = _infer_cycle(gaps)

    if cycle is None:
        # Irregular spacing — likely not a subscription (e.g. random
        # purchases from the same retailer).
        return RecurringResult(is_recurring=False, occurrences=len(txns), amounts=amounts)

    # Amount consistency check: subscriptions charge (roughly) the
    # same amount each cycle. Allow generous variance to still catch
    # price hikes (that's a separate detector) but reject wildly
    # inconsistent one-off spend patterns.
    if len(amounts) >= 2:
        variance_ratio = pstdev(amounts) / mean(amounts) if mean(amounts) else 1
        if variance_ratio > 0.6:
            return RecurringResult(is_recurring=False, occurrences=len(txns), amounts=amounts)

    cycle_days = mean(range(*CYCLE_DAY_RANGES[cycle]))
    next_renewal = dates[-1] + timedelta(days=round(cycle_days))

    return RecurringResult(
        is_recurring=True,
        billing_cycle=cycle,
        amounts=amounts,
        last_amount=amounts[-1],
        first_seen=dates[0],
        last_charged=dates[-1],
        next_renewal=next_renewal,
        occurrences=len(txns),
    )
