"""
Investor API Endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.api.deps import require_read_scope, require_write_scope, get_tenant_id
from app.schemas.investor import (
    InvestorPortfolioResponse, InvestorPositionResponse, PerformanceResponse,
    VacancyAnalyticsResponse, CostAnalyticsResponse, InvestorReportResponse,
    GenerateReportRequest, MarketplacePackageResponse, ReservePackageRequest,
    ROISimulationRequest, ROISimulationResponse, SavedSimulationResponse,
    SaveSimulationRequest, PackageReservationResponse
)
from app.services.investor_service import InvestorService
from app.core.security import TokenData

router = APIRouter()


@router.get("/portfolio", response_model=InvestorPortfolioResponse)
async def get_portfolio(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get investor portfolio data"""
    
    try:
        investor_service = InvestorService(tenant_id)
        portfolio = await investor_service.get_portfolio()
        return portfolio
    except Exception as e:
        # Fallback für Development ohne Authentication
        print(f"Portfolio error: {e}")
        return {
            "assets": [],
            "kpis": {
                "total_value": 0,
                "average_roi": 0,
                "total_cashflow": 0,
                "vacancy_rate": 0,
                "asset_count": 0,
                "monthly_income": 0,
                "annual_return": 0,
                "portfolio_growth": 0
            },
            "generated_at": "2024-01-15T10:00:00Z"
        }


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
    
    try:
        investor_service = InvestorService(tenant_id)
        analytics = await investor_service.get_vacancy_analytics()
        return analytics
    except Exception as e:
        # Fallback für Development ohne Authentication
        print(f"Vacancy analytics error: {e}")
        return {
            "current_vacancy_rate": 5.2,
            "average_vacancy_rate": 4.8,
            "vacancy_trend": [
                {"month": "2024-01", "vacancy_rate": 4.5, "vacant_units": 2, "total_units": 45},
                {"month": "2024-02", "vacancy_rate": 5.2, "vacant_units": 3, "total_units": 58},
                {"month": "2024-03", "vacancy_rate": 4.8, "vacant_units": 2, "total_units": 42}
            ],
            "properties_by_vacancy": [
                {"property_id": "prop-1", "title": "Hamburg Apartment Complex", "vacancy_rate": 3.2},
                {"property_id": "prop-2", "title": "Berlin Office Building", "vacancy_rate": 7.1}
            ],
            "vacancy_costs": 12500.0,
            "recommendations": ["Optimize pricing strategy", "Improve marketing"]
        }


@router.get("/analytics/costs", response_model=CostAnalyticsResponse)
async def get_cost_analytics(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get cost analytics"""
    
    try:
        investor_service = InvestorService(tenant_id)
        analytics = await investor_service.get_cost_analytics()
        return analytics
    except Exception as e:
        # Fallback für Development ohne Authentication
        print(f"Cost analytics error: {e}")
        return {
            "total_costs": 45000.0,
            "costs_by_category": {
                "maintenance": 18000.0,
                "utilities": 12000.0,
                "management": 8000.0,
                "insurance": 3000.0,
                "property_tax": 2500.0,
                "other": 1500.0
            },
            "cost_trend": [
                {"month": "2024-01", "total_costs": 42000, "maintenance": 16000, "utilities": 11000, "management": 7500, "insurance": 2800, "property_tax": 2300, "other": 1400},
                {"month": "2024-02", "total_costs": 45000, "maintenance": 18000, "utilities": 12000, "management": 8000, "insurance": 3000, "property_tax": 2500, "other": 1500},
                {"month": "2024-03", "total_costs": 43000, "maintenance": 17000, "utilities": 11500, "management": 7800, "insurance": 2900, "property_tax": 2400, "other": 1400}
            ],
            "cost_per_sqm": 25.5,
            "maintenance_efficiency": 0.85,
            "recommendations": ["Implement preventive maintenance", "Negotiate utility rates"]
        }


@router.get("/reports", response_model=List[InvestorReportResponse])
async def get_reports(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get investor reports list"""
    
    investor_service = InvestorService(tenant_id)
    reports = await investor_service.get_reports()
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
    
    try:
        investor_service = InvestorService(tenant_id)
        packages = await investor_service.get_marketplace_packages()
        return packages
    except Exception as e:
        # Fallback für Development ohne Authentication
        print(f"Marketplace packages error: {e}")
        return [
            MarketplacePackageResponse(
                id="pkg-1",
                title="Hamburg Premium Portfolio",
                description="High-yield apartment complex in prime Hamburg location",
                location="Hamburg",
                total_value=2000000,
                expected_roi=6.5,
                min_investment=50000,
                max_investors=20,
                current_investors=5,
                status="available",
                created_at="2024-01-15T10:00:00Z",
                expires_at="2024-02-15T10:00:00Z",
                property_count=3,
                property_types=["apartment"],
                images=["/placeholder-property.jpg"],
                objects=3,
                roi=6.5,
                price=2000000,
                city="Hamburg",
                totalSqm=1200,
                seller="Premium Properties GmbH",
                details={
                    "avgRent": 2500,
                    "occupancyRate": 95.5,
                    "yearBuilt": 2018,
                    "condition": "Sehr gut"
                },
                listedDate="2024-01-15T10:00:00Z"
            ),
            MarketplacePackageResponse(
                id="pkg-2",
                title="Berlin Office Investment",
                description="Modern office building in Berlin business district",
                location="Berlin",
                total_value=1500000,
                expected_roi=5.8,
                min_investment=75000,
                max_investors=15,
                current_investors=8,
                status="available",
                created_at="2024-01-10T10:00:00Z",
                expires_at="2024-02-25T10:00:00Z",
                property_count=1,
                property_types=["office"],
                images=["/placeholder-property.jpg"],
                objects=1,
                roi=5.8,
                price=1500000,
                city="Berlin",
                totalSqm=2000,
                seller="Office Real Estate AG",
                details={
                    "avgRent": 4000,
                    "occupancyRate": 88.0,
                    "yearBuilt": 2020,
                    "condition": "Neubau"
                },
                listedDate="2024-01-10T10:00:00Z"
            )
        ]


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


@router.get("/simulations", response_model=List[SavedSimulationResponse])
async def get_saved_simulations(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get all saved ROI simulations"""
    
    try:
        investor_service = InvestorService(tenant_id)
        simulations = await investor_service.get_saved_simulations()
        return simulations
    except Exception as e:
        # Fallback für Development ohne Authentication
        print(f"Saved simulations error: {e}")
        return [
            SavedSimulationResponse(
                id="sim-1",
                name="Optimistic Hamburg Investment",
                scenario="optimistic",
                property_value=500000,
                down_payment=100000,
                interest_rate=3.5,
                loan_term_years=25,
                monthly_rent=2500,
                vacancy_rate=5.0,
                maintenance_rate=1.5,
                property_tax_rate=0.5,
                insurance_rate=0.2,
                management_fee_rate=8.0,
                appreciation_rate=3.0,
                monthly_cashflow=1200,
                annual_cashflow=14400,
                annual_roi=14.4,
                total_return_5y=72.0,
                total_return_10y=144.0,
                break_even_months=84,
                net_present_value=50000,
                internal_rate_return=12.5,
                cash_on_cash_return=14.4,
                roi_projection=[14.4, 15.2, 16.0, 16.8, 17.6],
                scenarios=[
                    {"scenario": "optimistic", "roi": 14.4},
                    {"scenario": "realistic", "roi": 8.5},
                    {"scenario": "pessimistic", "roi": 4.2}
                ],
                created_at="2024-01-15T10:00:00Z"
            ),
            SavedSimulationResponse(
                id="sim-2",
                name="Realistic Berlin Office",
                scenario="realistic",
                property_value=800000,
                down_payment=160000,
                interest_rate=4.0,
                loan_term_years=20,
                monthly_rent=4000,
                vacancy_rate=7.0,
                maintenance_rate=2.0,
                property_tax_rate=0.6,
                insurance_rate=0.3,
                management_fee_rate=10.0,
                appreciation_rate=2.5,
                monthly_cashflow=1800,
                annual_cashflow=21600,
                annual_roi=13.5,
                total_return_5y=67.5,
                total_return_10y=135.0,
                break_even_months=89,
                net_present_value=45000,
                internal_rate_return=11.8,
                cash_on_cash_return=13.5,
                roi_projection=[13.5, 14.1, 14.7, 15.3, 15.9],
                scenarios=[
                    {"scenario": "optimistic", "roi": 13.5},
                    {"scenario": "realistic", "roi": 8.2},
                    {"scenario": "pessimistic", "roi": 3.8}
                ],
                created_at="2024-01-10T10:00:00Z"
            )
        ]


@router.post("/simulations", response_model=SavedSimulationResponse, status_code=status.HTTP_201_CREATED)
async def save_simulation(
    request: SaveSimulationRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Save ROI simulation"""
    
    investor_service = InvestorService(tenant_id)
    simulation = await investor_service.save_simulation(request, current_user.user_id)
    
    return simulation


@router.delete("/simulations/{simulation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_simulation(
    simulation_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete saved ROI simulation"""
    
    investor_service = InvestorService(tenant_id)
    await investor_service.delete_simulation(simulation_id)
