from pydantic import BaseModel


class HeatmapEntry(BaseModel):
    day_of_week: str
    hour: int
    count: int


class CurrencyPaymentEntry(BaseModel):
    payment_format: str
    currency: str
    total_count: int
    fraud_count: int
    fraud_rate: float


class HighRiskBank(BaseModel):
    bank_id: str
    bank_name: str
    fraud_transaction_count: int
    fraud_total_amount: float


class FeatureImportanceEntry(BaseModel):
    feature: str
    importance: float


class PatternDistributionEntry(BaseModel):
    pattern_type: str
    count: int
    total_amount: float
