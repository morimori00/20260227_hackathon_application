from pydantic import BaseModel
from typing import Optional


class Node(BaseModel):
    id: str
    bank_id: str
    bank_name: str
    entity_name: Optional[str] = None
    total_amount: float
    transaction_count: int
    fraud_score: float
    is_origin: bool = False


class Edge(BaseModel):
    id: str
    source: str
    target: str
    amount: float
    currency: str
    timestamp: str
    payment_format: str
    prediction: int
    fraud_score: float


class Pattern(BaseModel):
    type: str
    detail: str
    transaction_ids: list[str]
    total_amount: float


class NetworkResponse(BaseModel):
    nodes: list[Node]
    edges: list[Edge]
    patterns: list[Pattern]
    truncated: bool = False
