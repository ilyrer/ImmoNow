"""
Investor Service
"""
import uuid
import math
from typing import List, Dict, Any
from datetime import datetime, timedelta
from django.db import models
from asgiref.sync import sync_to_async

from app.db.models import (
    Property, Tenant, InvestorProperty, InvestorReport, MarketplacePackage,
    PerformanceSnapshot, VacancyRecord, CostRecord, ROISimulation, PackageReservation
)
from app.schemas.investor import (
    InvestorPortfolioResponse, InvestorAssetResponse, PortfolioKPIsResponse,
    InvestorPositionResponse, PerformanceResponse, PerformanceDataPoint,
    VacancyAnalyticsResponse, CostAnalyticsResponse, InvestorReportResponse,
    GenerateReportRequest, MarketplacePackageResponse, ReservePackageRequest,
    ROISimulationRequest, ROISimulationResponse, PerformanceSnapshotResponse,
    VacancyRecordResponse, CostRecordResponse, SavedSimulationResponse,
    SaveSimulationRequest, PackageReservationResponse
)
from app.core.errors import NotFoundError, ValidationError


class InvestorService:
    """Investor service for portfolio management"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_portfolio(self) -> InvestorPortfolioResponse:
        """Get investor portfolio data with real calculations"""
        
        # Get properties with investor data
        properties = await sync_to_async(list)(
            Property.objects.filter(tenant_id=self.tenant_id).select_related('investor_data')
        )
        
        assets = []
        total_value = 0
        total_cashflow = 0
        total_roi = 0
        total_vacancy_cost = 0
        
        for prop in properties:
            # Use real investor data if available, otherwise calculate from property data
            if hasattr(prop, 'investor_data') and prop.investor_data:
                investor_data = prop.investor_data
                value = float(investor_data.current_value)
                monthly_rent = float(investor_data.monthly_rent)
                occupancy_rate = float(investor_data.occupancy_rate) / 100
                maintenance_costs = float(investor_data.maintenance_costs)
                property_tax = float(investor_data.property_tax)
                insurance = float(investor_data.insurance)
                purchase_price = float(investor_data.purchase_price)
                purchase_date = investor_data.purchase_date
            else:
                # Fallback calculations for properties without investor data
                value = float(prop.price or 0)
                monthly_rent = value * 0.004  # 4% annual yield / 12 months
                occupancy_rate = 0.95
                maintenance_costs = value * 0.01  # 1% maintenance
                property_tax = value * 0.005  # 0.5% property tax
                insurance = value * 0.002  # 0.2% insurance
                purchase_price = value * 0.9
                purchase_date = prop.created_at.date()
            
            # Calculate ROI and cashflow
            annual_rent = monthly_rent * 12
            annual_costs = maintenance_costs + property_tax + insurance
            net_annual_income = annual_rent * occupancy_rate - annual_costs
            roi = (net_annual_income / value) * 100 if value > 0 else 0
            
            # Calculate vacancy cost
            vacancy_cost = annual_rent * (1 - occupancy_rate)
            total_vacancy_cost += vacancy_cost
            
            asset = InvestorAssetResponse(
                id=str(prop.id),
                address=prop.location,
                city=prop.location.split(',')[0] if ',' in prop.location else prop.location,
                type=prop.property_type,
                sqm=prop.living_area or 0,
                value=value,
                roi=roi,
                cashflow=net_annual_income,
                status=prop.status,
                purchase_date=purchase_date,
                purchase_price=purchase_price,
                current_value=value,
                monthly_rent=monthly_rent,
                occupancy_rate=occupancy_rate * 100,
                maintenance_costs=maintenance_costs,
                property_tax=property_tax,
                insurance=insurance
            )
            
            assets.append(asset)
            total_value += value
            total_cashflow += net_annual_income
            total_roi += roi
        
        # Calculate KPIs
        asset_count = len(assets)
        average_roi = total_roi / asset_count if asset_count > 0 else 0
        monthly_income = total_cashflow / 12
        annual_return = total_cashflow
        vacancy_rate = (total_vacancy_cost / total_value * 100) if total_value > 0 else 0
        
        # Calculate portfolio growth (simplified)
        portfolio_growth = 0.05  # Would be calculated from historical data
        
        kpis = PortfolioKPIsResponse(
            total_value=total_value,
            average_roi=average_roi,
            total_cashflow=total_cashflow,
            vacancy_rate=vacancy_rate,
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
    
    async def get_positions(self) -> List[InvestorPositionResponse]:
        """Get individual investor positions"""
        
        properties = await sync_to_async(list)(
            Property.objects.filter(tenant_id=self.tenant_id)
        )
        
        positions = []
        for prop in properties:
            value = float(prop.price or 0)
            monthly_rent = value * 0.004  # 4% annual yield / 12 months
            roi = 4.0
            cashflow = monthly_rent * 12
            
            position = InvestorPositionResponse(
                id=str(prop.id),
                property_id=str(prop.id),
                property_title=prop.title,
                address=prop.location,
                city=prop.location.split(',')[0] if ',' in prop.location else prop.location,
                type=prop.property_type,
                sqm=prop.living_area or 0,
                purchase_date=prop.created_at,
                purchase_price=value * 0.9,
                current_value=value,
                monthly_rent=monthly_rent,
                occupancy_rate=0.95,
                roi=roi,
                cashflow=cashflow,
                maintenance_costs=value * 0.01,
                property_tax=value * 0.005,
                insurance=value * 0.002,
                net_yield=roi - 1.5,  # Net yield after costs
                status=prop.status
            )
            positions.append(position)
        
        return positions
    
    async def get_performance(self, period: str) -> PerformanceResponse:
        """Get performance data for specified period"""
        
        # Calculate date range based on period
        end_date = datetime.utcnow().date()
        if period == 'day':
            start_date = end_date - timedelta(days=30)  # Last 30 days
        elif period == 'week':
            start_date = end_date - timedelta(days=90)  # Last 90 days
        elif period == 'month':
            start_date = end_date - timedelta(days=365)  # Last year
        elif period == 'year':
            start_date = end_date - timedelta(days=365*3)  # Last 3 years
        else:
            start_date = end_date - timedelta(days=365)  # Default to last year
        
        # Get performance snapshots from database
        snapshots = await sync_to_async(list)(
            PerformanceSnapshot.objects.filter(
                tenant_id=self.tenant_id,
                snapshot_date__gte=start_date,
                snapshot_date__lte=end_date
            ).order_by('snapshot_date')
        )
        
        data_points = []
        for snapshot in snapshots:
            data_points.append(PerformanceDataPoint(
                date=snapshot.snapshot_date,
                value=float(snapshot.total_portfolio_value),
                roi=float(snapshot.average_roi),
                cashflow=float(snapshot.total_cashflow),
                vacancy_rate=float(snapshot.vacancy_rate)
            ))
        
        # Calculate performance metrics
        if len(data_points) >= 2:
            first_value = data_points[0].value
            last_value = data_points[-1].value
            total_return = (last_value - first_value) / first_value if first_value > 0 else 0
            
            # Calculate annualized return
            days_diff = (data_points[-1].date - data_points[0].date).days
            annualized_return = (1 + total_return) ** (365 / days_diff) - 1 if days_diff > 0 else 0
            
            # Calculate volatility (simplified)
            returns = []
            for i in range(1, len(data_points)):
                daily_return = (data_points[i].value - data_points[i-1].value) / data_points[i-1].value
                returns.append(daily_return)
            
            if returns:
                avg_return = sum(returns) / len(returns)
                variance = sum((r - avg_return) ** 2 for r in returns) / len(returns)
                volatility = variance ** 0.5
                sharpe_ratio = avg_return / volatility if volatility > 0 else 0
            else:
                volatility = 0
                sharpe_ratio = 0
        else:
            total_return = 0
            annualized_return = 0
            volatility = 0
            sharpe_ratio = 0
        
        return PerformanceResponse(
            period=period,
            data_points=data_points,
            total_return=total_return,
            annualized_return=annualized_return,
            volatility=volatility,
            sharpe_ratio=sharpe_ratio
        )
    
    async def get_vacancy_analytics(self) -> VacancyAnalyticsResponse:
        """Get vacancy analytics"""
        
        # Get recent vacancy records (last 12 months)
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=365)
        
        vacancy_records = await sync_to_async(list)(
            VacancyRecord.objects.filter(
                tenant_id=self.tenant_id,
                record_date__gte=start_date
            ).order_by('record_date')
        )
        
        # Calculate vacancy trend
        vacancy_trend = []
        monthly_data = {}
        
        for record in vacancy_records:
            month_key = record.record_date.strftime('%Y-%m')
            if month_key not in monthly_data:
                monthly_data[month_key] = {
                    'total_rate': 0,
                    'total_units': 0,
                    'vacant_units': 0,
                    'count': 0
                }
            
            monthly_data[month_key]['total_rate'] += float(record.vacancy_rate)
            monthly_data[month_key]['total_units'] += record.total_units
            monthly_data[month_key]['vacant_units'] += record.vacant_units
            monthly_data[month_key]['count'] += 1
        
        for month, data in monthly_data.items():
            avg_rate = data['total_rate'] / data['count'] if data['count'] > 0 else 0
            vacancy_trend.append({
                "month": month,
                "vacancy_rate": avg_rate,
                "vacant_units": data['vacant_units'],
                "total_units": data['total_units']
            })
        
        # Get current vacancy by property
        properties_by_vacancy = []
        properties = await sync_to_async(list)(
            Property.objects.filter(tenant_id=self.tenant_id)
        )
        
        for prop in properties:
            # Get latest vacancy record for this property
            latest_record = await sync_to_async(
                VacancyRecord.objects.filter(
                    tenant_id=self.tenant_id,
                    property=prop
                ).order_by('-record_date').first
            )()
            
            vacancy_rate = float(latest_record.vacancy_rate) if latest_record else 0.0
            properties_by_vacancy.append({
                "property_id": str(prop.id),
                "title": prop.title,
                "vacancy_rate": vacancy_rate
            })
        
        # Calculate current and average vacancy rates
        current_vacancy_rate = 0.0
        average_vacancy_rate = 0.0
        total_vacancy_costs = 0.0
        
        if vacancy_trend:
            current_vacancy_rate = vacancy_trend[-1]['vacancy_rate']
            average_vacancy_rate = sum(t['vacancy_rate'] for t in vacancy_trend) / len(vacancy_trend)
        
        # Calculate total vacancy costs
        for record in vacancy_records:
            total_vacancy_costs += float(record.vacancy_costs)
        
        # Generate recommendations
        recommendations = []
        if current_vacancy_rate > 0.1:  # > 10%
            recommendations.append("Optimize pricing strategy for vacant units")
        if current_vacancy_rate > 0.05:  # > 5%
            recommendations.append("Improve marketing for high-vacancy properties")
        if average_vacancy_rate > 0.08:  # > 8%
            recommendations.append("Consider renovation for outdated units")
        
        return VacancyAnalyticsResponse(
            current_vacancy_rate=current_vacancy_rate,
            average_vacancy_rate=average_vacancy_rate,
            vacancy_trend=vacancy_trend,
            properties_by_vacancy=properties_by_vacancy,
            vacancy_costs=total_vacancy_costs,
            recommendations=recommendations
        )
    
    async def get_cost_analytics(self) -> CostAnalyticsResponse:
        """Get cost analytics"""
        
        try:
            # Get recent cost records (last 12 months)
            end_date = datetime.utcnow().date()
            start_date = end_date - timedelta(days=365)
            
            cost_records = await sync_to_async(list)(
                CostRecord.objects.filter(
                    tenant_id=self.tenant_id,
                    record_date__gte=start_date
                ).order_by('record_date')
            )
            
            # Calculate cost trend by month
            cost_trend = []
            monthly_data = {}
            
            for record in cost_records:
                try:
                    month_key = record.record_date.strftime('%Y-%m')
                    if month_key not in monthly_data:
                        monthly_data[month_key] = {
                            'maintenance': 0,
                            'utilities': 0,
                            'management': 0,
                            'insurance': 0,
                            'property_tax': 0,
                            'other': 0,
                            'total': 0
                        }
                    
                    category = record.category
                    amount = float(record.amount) if record.amount else 0.0
                    monthly_data[month_key]['total'] += amount
                    
                    if category in monthly_data[month_key]:
                        monthly_data[month_key][category] += amount
                except (ValueError, TypeError, AttributeError) as e:
                    print(f"Error processing cost record {record.id}: {e}")
                    continue
            
            for month, data in monthly_data.items():
                cost_trend.append({
                    "month": month,
                    "total_costs": data['total'],
                    "maintenance": data['maintenance'],
                    "utilities": data['utilities'],
                    "management": data['management'],
                    "insurance": data['insurance'],
                    "property_tax": data['property_tax'],
                    "other": data['other']
                })
            
            # Calculate costs by category
            costs_by_category = {
                "maintenance": 0.0,
                "utilities": 0.0,
                "management": 0.0,
                "insurance": 0.0,
                "property_tax": 0.0,
                "other": 0.0
            }
            
            total_costs = 0.0
            for record in cost_records:
                try:
                    category = record.category
                    amount = float(record.amount) if record.amount else 0.0
                    total_costs += amount
                    
                    if category in costs_by_category:
                        costs_by_category[category] += amount
                except (ValueError, TypeError, AttributeError) as e:
                    print(f"Error processing cost record {record.id}: {e}")
                    continue
            
            # Calculate cost per sqm
            properties = await sync_to_async(list)(
                Property.objects.filter(tenant_id=self.tenant_id)
            )
            
            total_sqm = sum((prop.living_area or 0) for prop in properties)
            cost_per_sqm = total_costs / total_sqm if total_sqm > 0 else 0
            
            # Calculate maintenance efficiency (simplified)
            maintenance_efficiency = 0.85  # Would be calculated based on maintenance vs property age, etc.
            
            # Generate recommendations
            recommendations = []
            if total_costs > 0:  # Only calculate percentages if there are costs
                try:
                    if costs_by_category['maintenance'] / total_costs > 0.4:  # > 40% maintenance
                        recommendations.append("Implement preventive maintenance program")
                    if costs_by_category['utilities'] / total_costs > 0.25:  # > 25% utilities
                        recommendations.append("Negotiate better utility rates")
                    if costs_by_category['management'] / total_costs > 0.15:  # > 15% management
                        recommendations.append("Optimize management processes")
                except ZeroDivisionError:
                    recommendations = ["Start tracking property costs"]
            else:
                # Default recommendations when no costs are recorded
                recommendations = [
                    "Start tracking property costs",
                    "Implement cost monitoring system",
                    "Set up regular maintenance schedules"
                ]
            
            return CostAnalyticsResponse(
                total_costs=total_costs,
                costs_by_category=costs_by_category,
                cost_trend=cost_trend,
                cost_per_sqm=cost_per_sqm,
                maintenance_efficiency=maintenance_efficiency,
                recommendations=recommendations
            )
            
        except Exception as e:
            print(f"Error in get_cost_analytics: {e}")
            # Return empty response with default values
            return CostAnalyticsResponse(
                total_costs=0.0,
                costs_by_category={
                    "maintenance": 0.0,
                    "utilities": 0.0,
                    "management": 0.0,
                    "insurance": 0.0,
                    "property_tax": 0.0,
                    "other": 0.0
                },
                cost_trend=[],
                cost_per_sqm=0.0,
                maintenance_efficiency=0.85,
                recommendations=["Start tracking property costs"]
            )
    
    async def get_reports(self) -> List[InvestorReportResponse]:
        """Get investor reports list"""
        
        # Get reports from database (if InvestorReport model exists)
        # For now, return empty list since we don't have real reports yet
        return []
    
    async def generate_report(self, request: GenerateReportRequest, user_id: str) -> InvestorReportResponse:
        """Generate investor report"""
        
        report_id = str(uuid.uuid4())
        
        # Mock report generation - in real app would generate PDF/Excel
        summary = {
            "total_value": 2500000.0,
            "total_return": 0.12,
            "vacancy_rate": 0.03,
            "cost_efficiency": 0.85,
            "top_performing_property": "Hamburg Apartment",
            "recommendations": [
                "Consider expanding portfolio in Hamburg",
                "Optimize maintenance costs",
                "Review insurance coverage"
            ]
        }
        
        return InvestorReportResponse(
            id=report_id,
            title=f"{request.report_type.title()} Report {request.period_start.strftime('%Y-%m')}",
            report_type=request.report_type,
            period_start=request.period_start,
            period_end=request.period_end,
            generated_at=datetime.utcnow(),
            status="generated",
            file_url=f"https://reports.example.com/{report_id}.pdf",
            summary=summary
        )
    
    async def get_marketplace_packages(self) -> List[MarketplacePackageResponse]:
        """Get marketplace packages from database"""
        
        packages = await sync_to_async(list)(
            MarketplacePackage.objects.filter(
                tenant_id=self.tenant_id,
                status__in=['available', 'reserved']
            ).order_by('-created_at')
        )
        
        package_responses = []
        for package in packages:
            package_responses.append(MarketplacePackageResponse(
                id=str(package.id),
                title=package.title,
                description=package.description,
                location=package.location,
                total_value=float(package.total_value),
                expected_roi=float(package.expected_roi),
                min_investment=float(package.min_investment),
                max_investors=package.max_investors,
                current_investors=package.current_investors,
                status=package.status,
                created_at=package.created_at,
                expires_at=package.expires_at,
                property_count=package.property_count,
                property_types=package.property_types
            ))
        
        return package_responses
    
    async def reserve_package(self, package_id: str, request: ReservePackageRequest, user_id: str) -> Dict[str, Any]:
        """Reserve a marketplace package"""
        
        try:
            package = await sync_to_async(MarketplacePackage.objects.get)(
                id=package_id,
                tenant_id=self.tenant_id,
                status='available'
            )
            
            # Check if package has available slots
            if package.current_investors >= package.max_investors:
                raise ValidationError("Package is fully subscribed")
            
            # Check minimum investment
            if request.investment_amount < float(package.min_investment):
                raise ValidationError(f"Minimum investment is {package.min_investment}")
            
            # Update package
            await sync_to_async(package.__setattr__)('current_investors', package.current_investors + 1)
            if package.current_investors >= package.max_investors:
                await sync_to_async(package.__setattr__)('status', 'sold_out')
            await sync_to_async(package.save)()
            
            # In a real app, would create a reservation record
            reservation_id = str(uuid.uuid4())
            
            return {
                "status": "reserved",
                "reservation_id": reservation_id,
                "package_id": package_id,
                "investment_amount": request.investment_amount,
                "reserved_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(days=7),
                "message": "Package reserved successfully. You will be contacted within 24 hours."
            }
            
        except MarketplacePackage.DoesNotExist:
            raise NotFoundError("Marketplace package not found")
    
    async def simulate_roi(self, request: ROISimulationRequest) -> ROISimulationResponse:
        """Simulate ROI for investment scenario"""
        
        # Calculate loan details
        loan_amount = request.property_value - request.down_payment
        monthly_interest_rate = request.interest_rate / 12 / 100
        total_payments = request.loan_term_years * 12
        
        # Monthly mortgage payment
        if monthly_interest_rate > 0:
            monthly_mortgage = loan_amount * (
                monthly_interest_rate * (1 + monthly_interest_rate) ** total_payments
            ) / ((1 + monthly_interest_rate) ** total_payments - 1)
        else:
            monthly_mortgage = loan_amount / total_payments
        
        # Monthly expenses
        monthly_maintenance = request.property_value * request.maintenance_rate / 12 / 100
        monthly_property_tax = request.property_value * request.property_tax_rate / 12 / 100
        monthly_insurance = request.property_value * request.insurance_rate / 12 / 100
        monthly_management = request.monthly_rent * request.management_fee_rate / 100
        
        # Vacancy adjustment
        effective_rent = request.monthly_rent * (1 - request.vacancy_rate / 100)
        
        # Monthly cashflow
        monthly_cashflow = effective_rent - monthly_mortgage - monthly_maintenance - monthly_property_tax - monthly_insurance - monthly_management
        annual_cashflow = monthly_cashflow * 12
        
        # ROI calculations
        annual_roi = (annual_cashflow / request.down_payment) * 100
        cash_on_cash_return = annual_roi
        
        # 5-year and 10-year projections
        appreciation_5y = request.property_value * (1 + request.appreciation_rate / 100) ** 5
        appreciation_10y = request.property_value * (1 + request.appreciation_rate / 100) ** 10
        
        total_return_5y = ((appreciation_5y - request.property_value) + (annual_cashflow * 5)) / request.down_payment * 100
        total_return_10y = ((appreciation_10y - request.property_value) + (annual_cashflow * 10)) / request.down_payment * 100
        
        # Break-even analysis
        break_even_months = request.down_payment / monthly_cashflow if monthly_cashflow > 0 else 0
        
        # NPV calculation (simplified)
        discount_rate = 0.08  # 8% discount rate
        npv = -request.down_payment
        for year in range(1, 11):
            npv += annual_cashflow / (1 + discount_rate) ** year
        npv += appreciation_10y / (1 + discount_rate) ** 10
        
        # IRR calculation (simplified)
        irr = annual_roi  # Simplified approximation
        
        # Different scenarios
        scenarios = [
            {
                "scenario": "Conservative",
                "vacancy_rate": request.vacancy_rate + 2,
                "appreciation_rate": request.appreciation_rate - 1,
                "annual_roi": annual_roi - 1,
                "total_return_5y": total_return_5y - 5
            },
            {
                "scenario": "Optimistic",
                "vacancy_rate": max(0, request.vacancy_rate - 2),
                "appreciation_rate": request.appreciation_rate + 1,
                "annual_roi": annual_roi + 1,
                "total_return_5y": total_return_5y + 5
            },
            {
                "scenario": "Base Case",
                "vacancy_rate": request.vacancy_rate,
                "appreciation_rate": request.appreciation_rate,
                "annual_roi": annual_roi,
                "total_return_5y": total_return_5y
            }
        ]
        
        return ROISimulationResponse(
            monthly_cashflow=monthly_cashflow,
            annual_cashflow=annual_cashflow,
            annual_roi=annual_roi,
            total_return_5y=total_return_5y,
            total_return_10y=total_return_10y,
            break_even_months=break_even_months,
            net_present_value=npv,
            internal_rate_return=irr,
            cash_on_cash_return=cash_on_cash_return,
            scenarios=scenarios
        )
    
    async def save_simulation(self, request: SaveSimulationRequest, user_id: str) -> SavedSimulationResponse:
        """Save ROI simulation to database"""
        
        # First calculate the simulation results
        roi_request = ROISimulationRequest(
            property_value=request.property_value,
            down_payment=request.down_payment,
            interest_rate=request.interest_rate,
            loan_term_years=request.loan_term_years,
            monthly_rent=request.monthly_rent,
            vacancy_rate=request.vacancy_rate,
            maintenance_rate=request.maintenance_rate,
            property_tax_rate=request.property_tax_rate,
            insurance_rate=request.insurance_rate,
            management_fee_rate=request.management_fee_rate,
            appreciation_rate=request.appreciation_rate
        )
        
        simulation_result = await self.simulate_roi(roi_request)
        
        # Generate ROI projection (30 years)
        roi_projection = []
        for year in range(1, 31):
            year_roi = simulation_result.annual_roi + (year * 0.1)  # Simplified growth
            roi_projection.append(year_roi)
        
        # Create simulation record
        simulation = ROISimulation(
            tenant_id=self.tenant_id,
            name=request.name,
            scenario=request.scenario,
            property_value=request.property_value,
            down_payment=request.down_payment,
            interest_rate=request.interest_rate,
            loan_term_years=request.loan_term_years,
            monthly_rent=request.monthly_rent,
            vacancy_rate=request.vacancy_rate,
            maintenance_rate=request.maintenance_rate,
            property_tax_rate=request.property_tax_rate,
            insurance_rate=request.insurance_rate,
            management_fee_rate=request.management_fee_rate,
            appreciation_rate=request.appreciation_rate,
            monthly_cashflow=simulation_result.monthly_cashflow,
            annual_cashflow=simulation_result.annual_cashflow,
            annual_roi=simulation_result.annual_roi,
            total_return_5y=simulation_result.total_return_5y,
            total_return_10y=simulation_result.total_return_10y,
            break_even_months=simulation_result.break_even_months,
            net_present_value=simulation_result.net_present_value,
            internal_rate_return=simulation_result.internal_rate_return,
            cash_on_cash_return=simulation_result.cash_on_cash_return,
            roi_projection=roi_projection,
            scenarios=simulation_result.scenarios,
            created_by_id=user_id
        )
        
        await sync_to_async(simulation.save)()
        
        return SavedSimulationResponse(
            id=str(simulation.id),
            name=simulation.name,
            scenario=simulation.scenario,
            property_value=float(simulation.property_value),
            down_payment=float(simulation.down_payment),
            interest_rate=float(simulation.interest_rate),
            loan_term_years=simulation.loan_term_years,
            monthly_rent=float(simulation.monthly_rent),
            vacancy_rate=float(simulation.vacancy_rate),
            maintenance_rate=float(simulation.maintenance_rate),
            property_tax_rate=float(simulation.property_tax_rate),
            insurance_rate=float(simulation.insurance_rate),
            management_fee_rate=float(simulation.management_fee_rate),
            appreciation_rate=float(simulation.appreciation_rate),
            monthly_cashflow=float(simulation.monthly_cashflow),
            annual_cashflow=float(simulation.annual_cashflow),
            annual_roi=float(simulation.annual_roi),
            total_return_5y=float(simulation.total_return_5y),
            total_return_10y=float(simulation.total_return_10y),
            break_even_months=simulation.break_even_months,
            net_present_value=float(simulation.net_present_value),
            internal_rate_return=float(simulation.internal_rate_return),
            cash_on_cash_return=float(simulation.cash_on_cash_return),
            roi_projection=simulation.roi_projection,
            scenarios=simulation.scenarios,
            created_at=simulation.created_at
        )
    
    async def get_saved_simulations(self) -> List[SavedSimulationResponse]:
        """Get all saved simulations for tenant"""
        
        simulations = await sync_to_async(list)(
            ROISimulation.objects.filter(
                tenant_id=self.tenant_id
            ).order_by('-created_at')
        )
        
        saved_simulations = []
        for simulation in simulations:
            saved_simulations.append(SavedSimulationResponse(
                id=str(simulation.id),
                name=simulation.name,
                scenario=simulation.scenario,
                property_value=float(simulation.property_value),
                down_payment=float(simulation.down_payment),
                interest_rate=float(simulation.interest_rate),
                loan_term_years=simulation.loan_term_years,
                monthly_rent=float(simulation.monthly_rent),
                vacancy_rate=float(simulation.vacancy_rate),
                maintenance_rate=float(simulation.maintenance_rate),
                property_tax_rate=float(simulation.property_tax_rate),
                insurance_rate=float(simulation.insurance_rate),
                management_fee_rate=float(simulation.management_fee_rate),
                appreciation_rate=float(simulation.appreciation_rate),
                monthly_cashflow=float(simulation.monthly_cashflow),
                annual_cashflow=float(simulation.annual_cashflow),
                annual_roi=float(simulation.annual_roi),
                total_return_5y=float(simulation.total_return_5y),
                total_return_10y=float(simulation.total_return_10y),
                break_even_months=simulation.break_even_months,
                net_present_value=float(simulation.net_present_value),
                internal_rate_return=float(simulation.internal_rate_return),
                cash_on_cash_return=float(simulation.cash_on_cash_return),
                roi_projection=simulation.roi_projection,
                scenarios=simulation.scenarios,
                created_at=simulation.created_at
            ))
        
        return saved_simulations
    
    async def delete_simulation(self, simulation_id: str) -> bool:
        """Delete a saved simulation"""
        
        try:
            simulation = await sync_to_async(ROISimulation.objects.get)(
                id=simulation_id,
                tenant_id=self.tenant_id
            )
            await sync_to_async(simulation.delete)()
            return True
        except ROISimulation.DoesNotExist:
            raise NotFoundError("Simulation not found")
