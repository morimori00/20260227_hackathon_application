from pydantic import BaseModel
from typing import Optional


class AccountSummary(BaseModel):
    total_transactions: int
    total_sent: float
    total_received: float
    flagged_transactions: int


class AccountProfile(BaseModel):
    account_id: str
    bank_id: str
    bank_name: str
    entity_id: Optional[str] = None
    entity_name: Optional[str] = None
    summary: AccountSummary


class Counterparty(BaseModel):
    account_id: str
    bank_id: str
    bank_name: str
    transaction_count: int
    total_amount: float
    last_transaction_date: str
    has_flagged_transactions: bool


class TimelineEntry(BaseModel):
    date: str
    sent_amount: float
    received_amount: float
    sent_count: int
    received_count: int
    has_flagged: bool
