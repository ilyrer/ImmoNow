"""
Investor Service
"""
from typing import List
from datetime import datetime
from django.db import models

from app.db.models import Property, Tenant
from app.schemas.investor import (
    InvestorPortfolioResponse, InvestorAssetResponse, PortfolioKPIsResponse
)


class InvestorService:
    """Investor service for portfolio management"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_portfolio(self) -> InvestorPortfolioResponse:
        """Get investor portfolio data"""
        
        # Get properties (simplified - in real app would have investor-specific properties)
        properties = Property.objects.filter(tenant_id=self.tenant_id)
        
        # Build assets (simplified data)
        assets = []
        total_value = 0
        total_cashflow = 0
        total_roi = 0
        
        for prop in properties:
            # Mock calculations - in real app would use actual investment data
            value = float(prop.price or 0)
            monthly_rent = value * 0.004  # 4% annual yield / 12 months
            roi = 4.0  # Mock ROI
            cashflow = monthly_rent * 12  # Annual cashflow
            
            asset = InvestorAssetResponse(
                id=str(prop.id),
                address=prop.location,
                city=prop.location.split(',')[0] if ',' in prop.location else prop.location,
                type=prop.property_type,
                sqm=prop.living_area or 0,
                value=value,
                roi=roi,
                cashflow=cashflow,
                status=prop.status,
                purchase_date=prop.created_at,
                purchase_price=value * 0.9,  # Mock purchase price
                current_value=value,
                monthly_rent=monthly_rent,
                occupancy_rate=0.95,  # Mock occupancy
                maintenance_costs=value * 0.01,  # 1% maintenance
                property_tax=value * 0.005,  # 0.5% property tax
                insurance=value * 0.002  # 0.2% insurance
            )
            
            assets.append(asset)
            total_value += value
            total_cashflow += cashflow
            total_roi += roi
        
        # Calculate KPIs
        asset_count = len(assets)
        average_roi = total_roi / asset_count if asset_count > 0 else 0
        monthly_income = total_cashflow / 12
        annual_return = total_cashflow
        portfolio_growth = 0.05  # Mock 5% growth
        
        kpis = PortfolioKPIsResponse(
            total_value=total_value,
            average_roi=average_roi,
            total_cashflow=total_cashflow,
            vacancy_rate=0.05,  # Mock 5% vacancy
            asset_count=asset_count,
            monthly_income=monthly_income,
            annual_return=annual_return,
            portfolio_growth=portfolio_growth
        )
        
        return InvestorPortfolioResponse(
            assets=assets,
            kpis=kpis,
            generated_at=datetime.utcnow()
        )
