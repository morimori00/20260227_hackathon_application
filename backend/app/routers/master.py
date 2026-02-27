from fastapi import APIRouter, Depends, Query

from app.data_store import DataStore, get_data_store
from app.services.master_service import MasterService

router = APIRouter(prefix="/api/v1", tags=["master"])


def get_master_service(ds: DataStore = Depends(get_data_store)) -> MasterService:
    return MasterService(ds)


@router.get("/master/banks")
def get_banks(svc: MasterService = Depends(get_master_service)):
    return {"data": svc.get_banks()}


@router.get("/master/currencies")
def get_currencies(svc: MasterService = Depends(get_master_service)):
    return {"data": svc.get_currencies()}


@router.get("/master/payment-formats")
def get_payment_formats(svc: MasterService = Depends(get_master_service)):
    return {"data": svc.get_payment_formats()}


@router.get("/accounts/search")
def search_accounts(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=100),
    svc: MasterService = Depends(get_master_service),
):
    return {"data": svc.search_accounts(q, limit)}
