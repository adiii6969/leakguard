"""
Silent Price Hike Detector
----------------------------
Subscriptions often raise prices quietly between cycles. Given the
chronological amount history for one merchant, this flags any
cycle-over-cycle increase above the configured threshold and reports
the magnitude — this is what "silent price increases" in the product
spec refers to.
"""
from dataclasses import dataclass

from app.core.config import get_settings

settings = get_settings()


@dataclass
class PriceHikeResult:
    detected: bool
    previous_amount: float | None = None
    current_amount: float | None = None
    increase_pct: float | None = None


def detect_price_hike(amounts_chronological: list[float]) -> PriceHikeResult:
    if len(amounts_chronological) < 2:
        return PriceHikeResult(detected=False)

    previous, current = amounts_chronological[-2], amounts_chronological[-1]
    if previous <= 0:
        return PriceHikeResult(detected=False)

    increase_pct = ((current - previous) / previous) * 100

    if increase_pct >= settings.price_hike_threshold_pct:
        return PriceHikeResult(
            detected=True,
            previous_amount=previous,
            current_amount=current,
            increase_pct=round(increase_pct, 2),
        )
    return PriceHikeResult(
        detected=False,
        previous_amount=previous,
        current_amount=current,
        increase_pct=round(increase_pct, 2),
    )
