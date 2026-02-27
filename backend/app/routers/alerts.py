from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional

from app.data_store import DataStore, get_data_store
from app.services.alert_service import AlertService
from app.schemas.alert import StatusUpdate

router = APIRouter(prefix="/api/v1", tags=["alerts"])

_alert_service: AlertService | None = None


def get_alert_service(ds: DataStore = Depends(get_data_store)) -> AlertService:
    global _alert_service
    if _alert_service is None:
        _alert_service = AlertService(ds)
    return _alert_service


@router.get("/alerts")
def get_alerts(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    from_bank: Optional[str] = None,
    to_bank: Optional[str] = None,
    currency: Optional[str] = None,
    payment_format: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    min_score: Optional[float] = None,
    max_score: Optional[float] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    sort_by: str = "fraud_score",
    sort_order: str = "desc",
    svc: AlertService = Depends(get_alert_service),
):
    records, total = svc.get_alerts(
        page=page, per_page=per_page,
        status=status, from_bank=from_bank, to_bank=to_bank,
        currency=currency, payment_format=payment_format,
        min_amount=min_amount, max_amount=max_amount,
        min_score=min_score, max_score=max_score,
        start_date=start_date, end_date=end_date,
        sort_by=sort_by, sort_order=sort_order,
    )
    return {"data": records, "meta": {"total": total, "page": page, "per_page": per_page}}


@router.get("/alerts/summary")
def get_alert_summary(svc: AlertService = Depends(get_alert_service)):
    return {"data": svc.get_alert_summary()}


@router.patch("/alerts/{alert_id}/status")
def update_alert_status(
    alert_id: str,
    body: StatusUpdate,
    svc: AlertService = Depends(get_alert_service),
):
    valid_statuses = {"pending", "investigating", "resolved", "false_positive"}
    if body.status not in valid_statuses:
        raise HTTPException(status_code=422, detail={"code": "INVALID_STATUS", "message": f"Status must be one of: {', '.join(valid_statuses)}"})

    result = svc.update_alert_status(alert_id, body.status)
    if result is None:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Alert not found"})
    return {"data": result}
