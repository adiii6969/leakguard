"""
Merchant Normalizer
--------------------
Bank statement descriptions are messy: "NFLX*NETFLIX.COM 08-JUL",
"AMAZON PRIME MEM*2K3JD8", "SPOTIFY  AB  IRL". This module strips
transaction noise and fuzzy-matches the cleaned text against the
canonical `merchants` directory using RapidFuzz, so every transaction
from the same real-world merchant collapses to one identity — which
is the precondition for recurring/duplicate/price-hike detection.
"""
import re
from dataclasses import dataclass

from rapidfuzz import fuzz, process

from app.core.config import get_settings

settings = get_settings()

# Noise commonly appended by payment processors / banks.
NOISE_PATTERNS = [
    r"\bPOS\b", r"\bUPI\b", r"\bNEFT\b", r"\bIMPS\b", r"\bREF\s*NO.*",
    r"\bTXN\s*ID.*", r"\*\w{4,}$", r"#\d+$", r"\d{2}[-/]\w{3}[-/]\d{2,4}",
    r"\b\d{6,}\b", r"\bINR\b", r"\bDEBIT\b", r"\bCREDIT\b", r"\bAUTOPAY\b",
]
NOISE_RE = re.compile("|".join(NOISE_PATTERNS), re.IGNORECASE)


@dataclass
class MerchantMatch:
    canonical_name: str
    category: str
    merchant_id: str | None
    confidence: float  # 0-1
    matched: bool


def clean_description(raw: str) -> str:
    text = NOISE_RE.sub(" ", raw)
    text = re.sub(r"[^A-Za-z0-9&+.\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize_merchant(
    raw_description: str,
    merchant_directory: list[dict],  # rows from public.merchants
) -> MerchantMatch:
    """
    merchant_directory rows look like:
      {"id": ..., "canonical_name": "Netflix", "category": "Streaming",
       "aliases": ["NETFLIX.COM", "NFLX*NETFLIX"]}
    """
    cleaned = clean_description(raw_description)
    if not cleaned:
        return MerchantMatch(raw_description.strip().title(), "Other", None, 0.0, False)

    # Build a flat searchable index: alias/name -> merchant row
    choices: dict[str, dict] = {}
    for m in merchant_directory:
        choices[m["canonical_name"].upper()] = m
        for alias in m.get("aliases", []):
            choices[alias.upper()] = m

    best = process.extractOne(
        cleaned.upper(), choices.keys(), scorer=fuzz.WRatio
    )

    if best and best[1] >= settings.merchant_match_threshold:
        matched_row = choices[best[0]]
        return MerchantMatch(
            canonical_name=matched_row["canonical_name"],
            category=matched_row["category"],
            merchant_id=matched_row.get("id"),
            confidence=round(best[1] / 100, 3),
            matched=True,
        )

    # No confident match — fall back to a title-cased version of the
    # cleaned description as a provisional merchant identity.
    fallback_name = " ".join(w.capitalize() for w in cleaned.split()[:4])
    return MerchantMatch(
        canonical_name=fallback_name or raw_description.strip().title(),
        category="Other",
        merchant_id=None,
        confidence=0.3,
        matched=False,
    )


def group_by_merchant(
    transactions: list[dict],  # {"raw_description","amount","txn_date"}
    merchant_directory: list[dict],
) -> dict[str, list[dict]]:
    """Returns {canonical_merchant_name: [transactions...]}"""
    grouped: dict[str, list[dict]] = {}
    for txn in transactions:
        match = normalize_merchant(txn["raw_description"], merchant_directory)
        txn = {**txn, "merchant_normalized": match.canonical_name, "category": match.category}
        grouped.setdefault(match.canonical_name, []).append(txn)
    return grouped
