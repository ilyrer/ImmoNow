"""
Market API Endpoints (Live-Daten)
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
import time

from app.api.deps import require_read_scope, get_tenant_id
from app.core.security import TokenData
from app.services.market_service import MarketService


router = APIRouter()


@router.get("/trends")
async def get_trends(
    city: str = Query(..., min_length=2),
    postal_code: str = Query(..., min_length=3),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    started = time.time()
    service = MarketService(tenant_id)
    data = await service.get_trends(city=city, postal_code=postal_code)
    data["_metrics"] = {"latency_ms": int((time.time() - started) * 1000)}
    return data


@router.get("/poi")
async def get_poi(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius: int = Query(1200, ge=200, le=3000),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    started = time.time()
    service = MarketService(tenant_id)
    data = await service.get_poi_summary(lat=lat, lng=lng, radius=radius)
    data["_metrics"] = {"latency_ms": int((time.time() - started) * 1000)}
    return data


@router.get("/hpi")
async def get_hpi(
    region: Optional[str] = Query(None),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    started = time.time()
    service = MarketService(tenant_id)
    data = await service.get_hpi(region=region)
    data["_metrics"] = {"latency_ms": int((time.time() - started) * 1000)}
    return data


@router.get("/health")
async def health():
    return {"status": "ok"}


