from pydantic import BaseModel
from typing import Optional


class Alert(BaseModel):
    alert_id: str
    transaction_id: str
    status: str
    fraud_score: float
    timestamp: str
    from_bank_id: str
    from_bank_name: str
    from_account: str
    to_bank_id: str
    to_bank_name: str
    to_account: str
    amount_paid: float
    payment_currency: str
    payment_format: str


class AlertSummary(BaseModel):
    total: int
    by_status: dict[str, int]
    today_new: int


class StatusUpdate(BaseModel):
    status: str


class StatusUpdateResponse(BaseModel):
    alert_id: str
    status: str
    updated_at: str
