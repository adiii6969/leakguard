"""
Leak Score Engine
------------------
Produces a 0-100 "leak score" per subscription — how much of a money
leak this subscription represents — as a weighted composite of signal
strength. Higher = worse (more likely wasted spend).

Weights (sum to 100):
  price_hike        30  — silent price increase since last cycle
  duplicate         25  — overlaps with / duplicates another active sub
  unused_signal      20  — long gap since last usage-adjacent charge
                            pattern (proxy: no recent renewal skips)
  cost_pressure      15  — amount relative to user's other subscriptions
  low_confidence     10  — merchant match confidence (noisy detection
                            itself is a minor risk signal — we flag it
                            for the user to verify)
"""
from dataclasses import dataclass


@dataclass
class LeakScoreInputs:
    price_hike_detected: bool
    price_hike_pct: float | None
    is_duplicate: bool
    is_unused: bool
    amount: float
    user_avg_amount: float
    merchant_confidence: float  # 0-1


def compute_leak_score(inputs: LeakScoreInputs) -> int:
    score = 0.0

    if inputs.price_hike_detected:
        pct = inputs.price_hike_pct or 0
        # Scale the price-hike weight by severity, capped at the full 30.
        score += min(30, 15 + pct)

    if inputs.is_duplicate:
        score += 25

    if inputs.is_unused:
        score += 20

    if inputs.user_avg_amount > 0:
        cost_ratio = inputs.amount / inputs.user_avg_amount
        score += min(15, max(0, (cost_ratio - 1) * 15))

    score += (1 - inputs.merchant_confidence) * 10

    return max(0, min(100, round(score)))


def compute_portfolio_score(subscription_scores: list[int]) -> int:
    """Overall account-level leak score — simple average, floor 0."""
    if not subscription_scores:
        return 0
    return round(sum(subscription_scores) / len(subscription_scores))
