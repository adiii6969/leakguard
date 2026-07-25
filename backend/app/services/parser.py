"""
Statement Parser
-----------------
Extracts raw transactions from an uploaded CSV, Excel, or PDF bank
statement. Operates entirely in-memory on the uploaded bytes — nothing
is written to disk or object storage, in line with the privacy-first
design (see database/schema.sql comments on the `statements` table).
"""
import io
import re
from datetime import datetime

import pandas as pd
import pdfplumber

from app.models.schemas import ParsedTransaction

# Column name aliases we try to match against, in priority order.
DATE_COLUMNS = ["date", "txn date", "transaction date", "value date", "posting date"]
DESC_COLUMNS = ["description", "narration", "particulars", "details", "merchant"]
AMOUNT_COLUMNS = ["amount", "debit", "withdrawal", "amount (inr)", "debit amount"]

DATE_FORMATS = ["%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%m/%d/%Y", "%d %b %Y", "%d-%b-%Y"]

# Matches a line item's amount even when embedded in free text, e.g.
# "NETFLIX.COM  649.00 INR" or "-649.00"
AMOUNT_PATTERN = re.compile(r"-?\d[\d,]*\.\d{2}")
DATE_PATTERN = re.compile(r"\d{1,2}[/-][A-Za-z0-9]{1,3}[/-]\d{2,4}")


class UnsupportedFileError(Exception):
    pass


def parse_statement(file_bytes: bytes, filename: str) -> list[ParsedTransaction]:
    ext = filename.lower().rsplit(".", 1)[-1]
    if ext == "csv":
        return _parse_csv(file_bytes)
    if ext in ("xlsx", "xls"):
        return _parse_excel(file_bytes)
    if ext == "pdf":
        return _parse_pdf(file_bytes)
    raise UnsupportedFileError(f"Unsupported file type: .{ext}")


def _find_column(columns: list[str], candidates: list[str]) -> str | None:
    lowered = {c.lower().strip(): c for c in columns}
    for cand in candidates:
        if cand in lowered:
            return lowered[cand]
    # fallback: partial match
    for cand in candidates:
        for col_lower, original in lowered.items():
            if cand in col_lower:
                return original
    return None


def _parse_date(value) -> datetime | None:
    if pd.isna(value):
        return None
    if isinstance(value, (pd.Timestamp, datetime)):
        return value
    text = str(value).strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    try:
        return pd.to_datetime(text, dayfirst=True, errors="raise")
    except Exception:
        return None


def _dataframe_to_transactions(df: pd.DataFrame) -> list[ParsedTransaction]:
    columns = list(df.columns)
    date_col = _find_column(columns, DATE_COLUMNS)
    desc_col = _find_column(columns, DESC_COLUMNS)
    amount_col = _find_column(columns, AMOUNT_COLUMNS)

    if not (date_col and desc_col and amount_col):
        raise UnsupportedFileError(
            "Could not identify date/description/amount columns in statement."
        )

    transactions: list[ParsedTransaction] = []
    for _, row in df.iterrows():
        txn_date = _parse_date(row[date_col])
        if txn_date is None:
            continue
        try:
            amount = abs(float(str(row[amount_col]).replace(",", "").strip()))
        except (ValueError, TypeError):
            continue
        if amount <= 0:
            continue
        description = str(row[desc_col]).strip()
        if not description or description.lower() == "nan":
            continue
        transactions.append(
            ParsedTransaction(
                raw_description=description,
                amount=amount,
                txn_date=txn_date.date(),
            )
        )
    return transactions


def _parse_csv(file_bytes: bytes) -> list[ParsedTransaction]:
    df = pd.read_csv(io.BytesIO(file_bytes))
    return _dataframe_to_transactions(df)


def _parse_excel(file_bytes: bytes) -> list[ParsedTransaction]:
    df = pd.read_excel(io.BytesIO(file_bytes))
    return _dataframe_to_transactions(df)


def _parse_pdf(file_bytes: bytes) -> list[ParsedTransaction]:
    """
    Bank statement PDFs are usually tabular. We first try pdfplumber's
    table extraction; if that yields nothing usable (scanned/irregular
    statements), we fall back to line-by-line regex extraction.
    """
    transactions: list[ParsedTransaction] = []

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if not table or len(table) < 2:
                    continue
                header, *rows = table
                header = [str(h or "").strip() for h in header]
                try:
                    df = pd.DataFrame(rows, columns=header)
                    transactions.extend(_dataframe_to_transactions(df))
                except UnsupportedFileError:
                    continue

        if not transactions:
            for page in pdf.pages:
                text = page.extract_text() or ""
                for line in text.split("\n"):
                    date_match = DATE_PATTERN.search(line)
                    amount_matches = AMOUNT_PATTERN.findall(line)
                    if not date_match or not amount_matches:
                        continue
                    txn_date = _parse_date(date_match.group())
                    if txn_date is None:
                        continue
                    amount = abs(float(amount_matches[-1].replace(",", "")))
                    description = line.replace(date_match.group(), "").strip()
                    description = AMOUNT_PATTERN.sub("", description).strip()
                    if amount <= 0 or not description:
                        continue
                    transactions.append(
                        ParsedTransaction(
                            raw_description=description,
                            amount=amount,
                            txn_date=txn_date.date(),
                        )
                    )

    if not transactions:
        raise UnsupportedFileError(
            "Could not extract any transactions from this PDF. "
            "It may be a scanned image without a text layer."
        )
    return transactions
