"""
Finance API Endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.api.deps import (
    require_read_scope, require_write_scope, require_delete_scope,
    get_tenant_id
)
from app.core.security import TokenData
from app.core.errors import NotFoundError, ValidationError
from app.schemas.finance import (
    FinancingCalculationRequest, FinancingCalculationResponse,
    InvestmentAnalysisRequest, InvestmentAnalysisResponse,
    BankComparisonRequest, BankComparisonResponse,
    FinancingScenario, CreateScenarioRequest, UpdateScenarioRequest,
    ExportRequest, ExportResponse
)
from app.schemas.common import PaginatedResponse
from app.core.pagination import PaginationParams, get_pagination_offset
from app.services.finance_service import FinanceService

router = APIRouter()


@router.post("/calculate", response_model=FinancingCalculationResponse)
async def calculate_financing(
    calculation_request: FinancingCalculationRequest,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Calculate financing options"""
    
    finance_service = FinanceService(tenant_id)
    calculation = await finance_service.calculate_financing(calculation_request)
    
    return calculation


@router.post("/analyze-investment", response_model=InvestmentAnalysisResponse)
async def analyze_investment(
    analysis_request: InvestmentAnalysisRequest,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Analyze investment potential"""
    
    finance_service = FinanceService(tenant_id)
    analysis = await finance_service.analyze_investment(analysis_request)
    
    return analysis


@router.post("/compare-banks", response_model=BankComparisonResponse)
async def compare_banks(
    comparison_request: BankComparisonRequest,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Compare bank offers"""
    
    finance_service = FinanceService(tenant_id)
    comparison = await finance_service.compare_banks(comparison_request)
    
    return comparison


@router.get("/scenarios", response_model=PaginatedResponse[FinancingScenario])
async def get_financing_scenarios(
    pagination: PaginationParams = Depends(),
    search: Optional[str] = Query(None, description="Search term"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get financing scenarios"""
    
    offset = get_pagination_offset(pagination.page, pagination.size)
    
    finance_service = FinanceService(tenant_id)
    scenarios, total = await finance_service.get_scenarios(
        offset=offset,
        limit=pagination.size,
        search=search,
        user_id=current_user.user_id
    )
    
    return PaginatedResponse.create(
        items=scenarios,
        total=total,
        page=pagination.page,
        size=pagination.size
    )


@router.post("/scenarios", response_model=FinancingScenario, status_code=status.HTTP_201_CREATED)
async def create_financing_scenario(
    scenario_data: CreateScenarioRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a financing scenario"""
    
    finance_service = FinanceService(tenant_id)
    scenario = await finance_service.create_scenario(scenario_data, current_user.user_id)
    
    return scenario


@router.get("/scenarios/{scenario_id}", response_model=FinancingScenario)
async def get_financing_scenario(
    scenario_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get a specific financing scenario"""
    
    finance_service = FinanceService(tenant_id)
    scenario = await finance_service.get_scenario(scenario_id, current_user.user_id)
    
    if not scenario:
        raise NotFoundError("Scenario not found")
    
    return scenario


@router.put("/scenarios/{scenario_id}", response_model=FinancingScenario)
async def update_financing_scenario(
    scenario_id: str,
    scenario_data: UpdateScenarioRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update a financing scenario"""
    
    finance_service = FinanceService(tenant_id)
    scenario = await finance_service.update_scenario(
        scenario_id, scenario_data, current_user.user_id
    )
    
    if not scenario:
        raise NotFoundError("Scenario not found")
    
    return scenario


@router.delete("/scenarios/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_financing_scenario(
    scenario_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a financing scenario"""
    
    finance_service = FinanceService(tenant_id)
    await finance_service.delete_scenario(scenario_id, current_user.user_id)


@router.post("/export", response_model=ExportResponse)
async def export_calculation(
    calculation_request: FinancingCalculationRequest,
    export_request: ExportRequest,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Export financing calculation"""
    
    finance_service = FinanceService(tenant_id)
    calculation = await finance_service.calculate_financing(calculation_request)
    export_result = await finance_service.export_calculation(
        calculation, export_request, current_user.user_id
    )
    
    return export_result
