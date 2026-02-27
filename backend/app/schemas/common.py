from pydantic import BaseModel
from typing import Any


class Meta(BaseModel):
    total: int
    page: int
    per_page: int


class PaginatedResponse(BaseModel):
    data: list[Any]
    meta: Meta


class DataResponse(BaseModel):
    data: Any


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail
