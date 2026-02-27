from pydantic import BaseModel
from typing import Optional


class TransactionRow(BaseModel):
    timestamp: str
    from_bank: str
    from_account: str
    to_bank: str
    to_account: str
    amount_received: float
    receiving_currency: str
    amount_paid: float
    payment_currency: str
    payment_format: str


class RowsUploadRequest(BaseModel):
    rows: list[TransactionRow]


class UploadResult(BaseModel):
    total_rows: int
    flagged_count: int
    new_alerts_count: int
    transaction_ids: list[str]
