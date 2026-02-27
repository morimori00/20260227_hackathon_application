from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.data_store import DataStore, get_data_store
from app.services.network_service import NetworkService

router = APIRouter(prefix="/api/v1", tags=["network"])


def get_network_service(ds: DataStore = Depends(get_data_store)) -> NetworkService:
    return NetworkService(ds)


@router.get("/network")
def get_network(
    account_id: str = Query(...),
    hops: int = Query(2, ge=1, le=5),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    svc: NetworkService = Depends(get_network_service),
):
    return {"data": svc.get_network(account_id, hops, start_date, end_date)}
