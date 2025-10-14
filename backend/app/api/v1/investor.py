"""
Investor API Endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.api.deps import require_read_scope, require_write_scope, get_tenant_id
from app.core.security import TokenData
from app.schemas.investor import (
    InvestorPortfolioResponse, InvestorPositionResponse, PerformanceResponse,
    VacancyAnalyticsResponse, CostAnalyticsResponse, InvestorReportResponse,
    GenerateReportRequest, MarketplacePackageResponse, ReservePackageRequest,
    ROISimulationRequest, ROISimulationResponse
)
from app.services.investor_service import InvestorService

router = APIRouter()


@router.get("/portfolio", response_model=InvestorPortfolioResponse)
async def get_portfolio(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get investor portfolio data"""
    
    investor_service = InvestorService(tenant_id)
    portfolio = await investor_service.get_portfolio()
    
    return portfolio


@router.get("/positions", response_model=List[InvestorPositionResponse])
async def get_positions(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get individual investor positions"""
    
    investor_service = InvestorService(tenant_id)
    positions = await investor_service.get_positions()
    
    return positions


@router.get("/performance", response_model=PerformanceResponse)
async def get_performance(
    range: str = Query(..., description="Performance period: day, week, month, year"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get performance data for specified period"""
    
    if range not in ['day', 'week', 'month', 'year']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid range. Must be one of: day, week, month, year"
        )
    
    investor_service = InvestorService(tenant_id)
    performance = await investor_service.get_performance(range)
    
    return performance


@router.get("/analytics/vacancy", response_model=VacancyAnalyticsResponse)
async def get_vacancy_analytics(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get vacancy analytics"""
    
    investor_service = InvestorService(tenant_id)
    analytics = await investor_service.get_vacancy_analytics()
    
    return analytics


@router.get("/analytics/costs", response_model=CostAnalyticsResponse)
async def get_cost_analytics(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get cost analytics"""
    
    investor_service = InvestorService(tenant_id)
    analytics = await investor_service.get_cost_analytics()
    
    return analytics


@router.get("/reports", response_model=List[InvestorReportResponse])
async def get_reports(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get investor reports list"""
    
    # Mock reports list - in real app would fetch from database
    reports = [
        InvestorReportResponse(
            id="report-1",
            title="Monthly Report 2024-01",
            report_type="monthly",
            period_start="2024-01-01T00:00:00Z",
            period_end="2024-01-31T23:59:59Z",
            generated_at="2024-02-01T10:00:00Z",
            status="generated",
            file_url="https://reports.example.com/report-1.pdf",
            summary={"total_value": 2500000.0, "total_return": 0.12}
        ),
        InvestorReportResponse(
            id="report-2",
            title="Quarterly Report Q4 2023",
            report_type="quarterly",
            period_start="2023-10-01T00:00:00Z",
            period_end="2023-12-31T23:59:59Z",
            generated_at="2024-01-15T10:00:00Z",
            status="generated",
            file_url="https://reports.example.com/report-2.pdf",
            summary={"total_value": 2400000.0, "total_return": 0.11}
        )
    ]
    
    return reports


@router.post("/reports/generate", response_model=InvestorReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_report(
    request: GenerateReportRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Generate new investor report"""
    
    investor_service = InvestorService(tenant_id)
    report = await investor_service.generate_report(request, current_user.user_id)
    
    return report


@router.get("/reports/{report_id}/export")
async def export_report(
    report_id: str,
    format: str = Query(..., description="Export format: pdf, csv, excel"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Export investor report in specified format"""
    
    if format not in ['pdf', 'csv', 'excel']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid format. Must be one of: pdf, csv, excel"
        )
    
    # Mock export - in real app would generate and return file
    return {
        "status": "success",
        "message": f"Report {report_id} exported as {format.upper()}",
        "download_url": f"https://reports.example.com/{report_id}.{format}",
        "expires_at": "2024-12-31T23:59:59Z"
    }


@router.get("/marketplace/packages", response_model=List[MarketplacePackageResponse])
async def get_marketplace_packages(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get marketplace packages"""
    
    investor_service = InvestorService(tenant_id)
    packages = await investor_service.get_marketplace_packages()
    
    return packages


@router.post("/marketplace/packages/{package_id}/reserve", status_code=status.HTTP_201_CREATED)
async def reserve_package(
    package_id: str,
    request: ReservePackageRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Reserve a marketplace package"""
    
    investor_service = InvestorService(tenant_id)
    result = await investor_service.reserve_package(package_id, request, current_user.user_id)
    
    return result


@router.post("/simulations/roi", response_model=ROISimulationResponse)
async def simulate_roi(
    request: ROISimulationRequest,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Simulate ROI for investment scenario"""
    
    investor_service = InvestorService(tenant_id)
    simulation = await investor_service.simulate_roi(request)
    
    return simulation
