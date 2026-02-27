from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional

from app.data_store import DataStore, get_data_store
from app.services.account_service import AccountService

router = APIRouter(prefix="/api/v1", tags=["accounts"])


def get_account_service(ds: DataStore = Depends(get_data_store)) -> AccountService:
    return AccountService(ds)


@router.get("/accounts/{account_id}")
def get_account_profile(
    account_id: str,
    svc: AccountService = Depends(get_account_service),
):
    result = svc.get_account_profile(account_id)
    if result is None:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Account not found"})
    return {"data": result}


@router.get("/accounts/{account_id}/transactions")
def get_account_transactions(
    account_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    direction: str = Query("all", pattern="^(sent|received|all)$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    svc: AccountService = Depends(get_account_service),
):
    records, total = svc.get_account_transactions(
        account_id, direction=direction,
        start_date=start_date, end_date=end_date,
        page=page, per_page=per_page,
    )
    return {"data": records, "meta": {"total": total, "page": page, "per_page": per_page}}


@router.get("/accounts/{account_id}/counterparties")
def get_counterparties(
    account_id: str,
    direction: str = Query("all", pattern="^(sent|received|all)$"),
    sort_by: str = Query("transaction_count"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    svc: AccountService = Depends(get_account_service),
):
    records, total = svc.get_counterparties(
        account_id, direction=direction,
        sort_by=sort_by, sort_order=sort_order,
        page=page, per_page=per_page,
    )
    return {"data": records, "meta": {"total": total, "page": page, "per_page": per_page}}


@router.get("/accounts/{account_id}/timeline")
def get_timeline(
    account_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    svc: AccountService = Depends(get_account_service),
):
    result = svc.get_timeline(account_id, start_date=start_date, end_date=end_date)
    return {"data": result}
