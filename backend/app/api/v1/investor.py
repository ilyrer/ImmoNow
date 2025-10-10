"""
Investor API Endpoints
"""
from fastapi import APIRouter, Depends

from app.api.deps import require_read_scope, get_tenant_id
from app.core.security import TokenData
from app.schemas.investor import InvestorPortfolioResponse
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
