from pydantic import BaseModel
from typing import Optional


class TransactionSummary(BaseModel):
    id: str
    timestamp: str
    from_bank_id: str
    from_bank_name: str
    from_account: str
    to_bank_id: str
    to_bank_name: str
    to_account: str
    amount_received: float
    receiving_currency: str
    amount_paid: float
    payment_currency: str
    payment_format: str
    prediction: int
    fraud_score: float


class FeatureImportance(BaseModel):
    feature: str
    importance: float


class TransactionDetail(TransactionSummary):
    from_entity_name: Optional[str] = None
    to_entity_name: Optional[str] = None
    feature_importances: list[FeatureImportance] = []
