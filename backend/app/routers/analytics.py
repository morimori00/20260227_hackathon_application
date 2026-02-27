from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.data_store import DataStore, get_data_store
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/v1", tags=["analytics"])


def get_analytics_service(ds: DataStore = Depends(get_data_store)) -> AnalyticsService:
    return AnalyticsService(ds)


@router.get("/analytics/heatmap")
def get_heatmap(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    svc: AnalyticsService = Depends(get_analytics_service),
):
    return {"data": svc.get_heatmap(start_date, end_date)}


@router.get("/analytics/currency-payment-matrix")
def get_currency_payment_matrix(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    svc: AnalyticsService = Depends(get_analytics_service),
):
    return {"data": svc.get_currency_payment_matrix(start_date, end_date)}


@router.get("/analytics/high-risk-banks")
def get_high_risk_banks(
    metric: str = Query("count", pattern="^(count|amount)$"),
    limit: int = Query(10, ge=1, le=50),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    svc: AnalyticsService = Depends(get_analytics_service),
):
    return {"data": svc.get_high_risk_banks(metric, limit, start_date, end_date)}


@router.get("/analytics/feature-importances")
def get_feature_importances(
    svc: AnalyticsService = Depends(get_analytics_service),
):
    return {"data": svc.get_feature_importances()}


@router.get("/analytics/pattern-distribution")
def get_pattern_distribution(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    svc: AnalyticsService = Depends(get_analytics_service),
):
    return {"data": svc.get_pattern_distribution(start_date, end_date)}
