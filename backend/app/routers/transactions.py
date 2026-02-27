from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional

from app.data_store import DataStore, get_data_store
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/api/v1", tags=["transactions"])


def get_transaction_service(ds: DataStore = Depends(get_data_store)) -> TransactionService:
    return TransactionService(ds)


@router.get("/transactions")
def get_transactions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    from_bank: Optional[str] = None,
    to_bank: Optional[str] = None,
    account_id: Optional[str] = None,
    currency: Optional[str] = None,
    payment_format: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    prediction: Optional[int] = None,
    sort_by: str = "timestamp",
    sort_order: str = "desc",
    svc: TransactionService = Depends(get_transaction_service),
):
    records, total = svc.get_transactions(
        page=page, per_page=per_page,
        from_bank=from_bank, to_bank=to_bank,
        account_id=account_id, currency=currency,
        payment_format=payment_format,
        min_amount=min_amount, max_amount=max_amount,
        start_date=start_date, end_date=end_date,
        prediction=prediction,
        sort_by=sort_by, sort_order=sort_order,
    )
    return {"data": records, "meta": {"total": total, "page": page, "per_page": per_page}}


@router.get("/transactions/{transaction_id}")
def get_transaction_detail(
    transaction_id: str,
    svc: TransactionService = Depends(get_transaction_service),
):
    result = svc.get_transaction_detail(transaction_id)
    if result is None:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Transaction not found"})
    return {"data": result}
