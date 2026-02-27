import io
import logging

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.data_store import DataStore, get_data_store
from app.services.upload_service import UploadService
from app.services.alert_service import AlertService
from app.schemas.upload import RowsUploadRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/upload", tags=["upload"])

_upload_service: UploadService | None = None
_alert_service: AlertService | None = None


def get_upload_service(ds: DataStore = Depends(get_data_store)) -> UploadService:
    global _upload_service
    if _upload_service is None:
        _upload_service = UploadService(ds)
    return _upload_service


def get_alert_service(ds: DataStore = Depends(get_data_store)) -> AlertService:
    global _alert_service
    if _alert_service is None:
        _alert_service = AlertService(ds)
    return _alert_service


@router.post("/csv")
async def upload_csv(
    file: UploadFile = File(...),
    svc: UploadService = Depends(get_upload_service),
    alert_svc: AlertService = Depends(get_alert_service),
):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=422,
            detail={"code": "INVALID_FILE", "message": "Only CSV files are accepted"},
        )

    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail={"code": "PARSE_ERROR", "message": f"Failed to parse CSV: {str(e)}"},
        )

    try:
        result = svc.process_dataframe(df)
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail={"code": "VALIDATION_ERROR", "message": str(e)},
        )

    # Create alerts for flagged rows
    if result["flagged_count"] > 0:
        flagged_df = svc.data_store.flagged_subset.tail(result["flagged_count"])
        alert_svc.add_new_alerts(flagged_df)

    return {"data": result}


@router.post("/rows")
def upload_rows(
    body: RowsUploadRequest,
    svc: UploadService = Depends(get_upload_service),
    alert_svc: AlertService = Depends(get_alert_service),
):
    if not body.rows:
        raise HTTPException(
            status_code=422,
            detail={"code": "EMPTY_ROWS", "message": "At least one row is required"},
        )

    rows_data = [row.model_dump() for row in body.rows]
    df = pd.DataFrame(rows_data)

    try:
        result = svc.process_dataframe(df)
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail={"code": "VALIDATION_ERROR", "message": str(e)},
        )

    if result["flagged_count"] > 0:
        flagged_df = svc.data_store.flagged_subset.tail(result["flagged_count"])
        alert_svc.add_new_alerts(flagged_df)

    return {"data": result}
