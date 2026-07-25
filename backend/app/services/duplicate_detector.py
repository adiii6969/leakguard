"""
Duplicate Subscription Detector
---------------------------------
Flags two kinds of duplication:
  1. Exact duplicates — the same normalized merchant billed twice in
     one cycle (e.g. a family member re-subscribed on a shared card).
  2. Category overlap — multiple active subscriptions in the same
     category that plausibly serve the same purpose (e.g. Netflix +
     Prime Video + Hotstar, all "Streaming"). These aren't flagged as
     hard duplicates but surfaced for the recommendation engine to
     consider consolidation.
"""
from dataclasses import dataclass

from rapidfuzz import fuzz

from app.core.config import get_settings

settings = get_settings()

OVERLAP_PRONE_CATEGORIES = {"Streaming", "Music", "Storage", "Food", "Fitness"}


@dataclass
class DuplicateFlag:
    subscription_id: str
    duplicate_of: str
    reason: str  # "exact_merchant" | "category_overlap"


def find_exact_duplicates(subscriptions: list[dict]) -> list[DuplicateFlag]:
    """
    subscriptions: [{"id", "merchant_name", "amount", "billing_cycle"}]
    Flags subscriptions whose merchant name is a near-exact fuzzy match
    of another active subscription — almost certainly the same service
    billed under two slightly different descriptors.
    """
    flags: list[DuplicateFlag] = []
    seen: list[dict] = []

    for sub in subscriptions:
        match_found = False
        for existing in seen:
            score = fuzz.token_sort_ratio(
                sub["merchant_name"].upper(), existing["merchant_name"].upper()
            )
            if score >= settings.duplicate_match_threshold:
                flags.append(
                    DuplicateFlag(
                        subscription_id=sub["id"],
                        duplicate_of=existing["id"],
                        reason="exact_merchant",
                    )
                )
                match_found = True
                break
        if not match_found:
            seen.append(sub)

    return flags


def find_category_overlaps(subscriptions: list[dict]) -> list[DuplicateFlag]:
    """
    Groups active subscriptions by category and flags every subscription
    beyond the first in categories prone to redundant overlap.
    """
    flags: list[DuplicateFlag] = []
    by_category: dict[str, list[dict]] = {}

    for sub in subscriptions:
        if sub.get("category") in OVERLAP_PRONE_CATEGORIES:
            by_category.setdefault(sub["category"], []).append(sub)

    for category, subs in by_category.items():
        if len(subs) < 2:
            continue
        primary = max(subs, key=lambda s: s.get("amount", 0))
        for sub in subs:
            if sub["id"] != primary["id"]:
                flags.append(
                    DuplicateFlag(
                        subscription_id=sub["id"],
                        duplicate_of=primary["id"],
                        reason="category_overlap",
                    )
                )
    return flags


def detect_duplicates(subscriptions: list[dict]) -> list[DuplicateFlag]:
    exact = find_exact_duplicates(subscriptions)
    exact_ids = {f.subscription_id for f in exact}
    overlaps = [
        f for f in find_category_overlaps(subscriptions) if f.subscription_id not in exact_ids
    ]
    return exact + overlaps
