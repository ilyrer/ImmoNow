"""
Finance Service
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from asgiref.sync import sync_to_async
import math

from app.schemas.finance import (
    FinancingCalculationRequest, FinancingCalculationResponse,
    InvestmentAnalysisRequest, InvestmentAnalysisResponse,
    BankComparisonRequest, BankComparisonResponse,
    FinancingScenario, CreateScenarioRequest, UpdateScenarioRequest,
    ExportRequest, ExportResponse
)
from app.core.errors import NotFoundError, ValidationError


class FinanceService:
    """Service for financial calculations and analysis"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def calculate_financing(
        self,
        calculation_request: FinancingCalculationRequest
    ) -> FinancingCalculationResponse:
        """Calculate financing options"""
        
        # Calculate loan amount
        loan_amount = calculation_request.property_value - calculation_request.down_payment
        
        # Calculate monthly interest rate
        monthly_rate = calculation_request.interest_rate / 100 / 12
        
        # Calculate number of payments
        num_payments = calculation_request.loan_term_years * 12
        
        # Calculate monthly payment using PMT formula
        if monthly_rate > 0:
            monthly_payment = loan_amount * (
                monthly_rate * (1 + monthly_rate) ** num_payments
            ) / ((1 + monthly_rate) ** num_payments - 1)
        else:
            monthly_payment = loan_amount / num_payments
        
        # Calculate total payment and interest
        total_payment = monthly_payment * num_payments
        total_interest = total_payment - loan_amount
        
        # Calculate LTV ratio
        ltv_ratio = (loan_amount / calculation_request.property_value) * 100
        
        # Generate amortization schedule
        amortization_schedule = []
        remaining_balance = loan_amount
        
        for month in range(1, min(num_payments + 1, 13)):  # First 12 months
            interest_payment = remaining_balance * monthly_rate
            principal_payment = monthly_payment - interest_payment
            remaining_balance -= principal_payment
            
            amortization_schedule.append({
                "month": month,
                "payment": round(monthly_payment, 2),
                "principal": round(principal_payment, 2),
                "interest": round(interest_payment, 2),
                "balance": round(max(remaining_balance, 0), 2)
            })
        
        # Calculate payment breakdown
        payment_breakdown = {
            "principal": round(monthly_payment - (loan_amount * monthly_rate), 2),
            "interest": round(loan_amount * monthly_rate, 2),
            "taxes": calculation_request.additional_costs.get("taxes", 0) if calculation_request.additional_costs else 0,
            "insurance": calculation_request.additional_costs.get("insurance", 0) if calculation_request.additional_costs else 0
        }
        
        # Calculate total costs
        total_costs = {
            "loan_amount": round(loan_amount, 2),
            "down_payment": round(calculation_request.down_payment, 2),
            "total_interest": round(total_interest, 2),
            "additional_costs": sum(calculation_request.additional_costs.values()) if calculation_request.additional_costs else 0
        }
        
        return FinancingCalculationResponse(
            monthly_payment=round(monthly_payment, 2),
            total_payment=round(total_payment, 2),
            total_interest=round(total_interest, 2),
            loan_amount=round(loan_amount, 2),
            down_payment=round(calculation_request.down_payment, 2),
            property_value=round(calculation_request.property_value, 2),
            loan_to_value_ratio=round(ltv_ratio, 2),
            amortization_schedule=amortization_schedule,
            payment_breakdown=payment_breakdown,
            total_costs=total_costs
        )
    
    async def analyze_investment(
        self,
        analysis_request: InvestmentAnalysisRequest
    ) -> InvestmentAnalysisResponse:
        """Analyze investment potential"""
        
        # Calculate total investment
        total_investment = analysis_request.purchase_price + analysis_request.renovation_costs
        
        # Calculate monthly cash flow
        monthly_cash_flow = analysis_request.monthly_rent - analysis_request.operating_expenses
        
        # Calculate annual cash flow
        annual_cash_flow = monthly_cash_flow * 12
        
        # Calculate NOI
        net_operating_income = annual_cash_flow
        
        # Calculate cap rate
        cap_rate = (net_operating_income / analysis_request.property_value) * 100
        
        # Calculate cash on cash return
        cash_on_cash_return = (annual_cash_flow / total_investment) * 100
        
        # Calculate IRR (simplified)
        total_return = analysis_request.property_value * (1 + analysis_request.appreciation_rate / 100) ** analysis_request.holding_period_years
        irr = ((total_return / total_investment) ** (1 / analysis_request.holding_period_years) - 1) * 100
        
        # Calculate NPV
        npv = total_return - total_investment
        
        # Calculate GRM
        gross_rent_multiplier = analysis_request.property_value / (analysis_request.monthly_rent * 12)
        
        # Break even analysis
        break_even_analysis = {
            "monthly_rent_needed": analysis_request.operating_expenses,
            "occupancy_rate_needed": (analysis_request.operating_expenses / analysis_request.monthly_rent) * 100,
            "months_to_break_even": total_investment / monthly_cash_flow if monthly_cash_flow > 0 else None
        }
        
        # Sensitivity analysis
        sensitivity_analysis = {
            "rent_decrease_10": {
                "monthly_cash_flow": monthly_cash_flow * 0.9,
                "annual_cash_flow": annual_cash_flow * 0.9,
                "cap_rate": cap_rate * 0.9
            },
            "rent_increase_10": {
                "monthly_cash_flow": monthly_cash_flow * 1.1,
                "annual_cash_flow": annual_cash_flow * 1.1,
                "cap_rate": cap_rate * 1.1
            }
        }
        
        return InvestmentAnalysisResponse(
            total_investment=round(total_investment, 2),
            monthly_cash_flow=round(monthly_cash_flow, 2),
            annual_cash_flow=round(annual_cash_flow, 2),
            net_operating_income=round(net_operating_income, 2),
            cap_rate=round(cap_rate, 2),
            cash_on_cash_return=round(cash_on_cash_return, 2),
            internal_rate_of_return=round(irr, 2),
            net_present_value=round(npv, 2),
            gross_rent_multiplier=round(gross_rent_multiplier, 2),
            break_even_analysis=break_even_analysis,
            sensitivity_analysis=sensitivity_analysis
        )
    
    async def compare_banks(
        self,
        comparison_request: BankComparisonRequest
    ) -> BankComparisonResponse:
        """Compare bank offers"""
        
        # TODO: Implement real bank comparison logic
        # For now, return mock data
        offers = [
            {
                "bank_name": "Deutsche Bank",
                "interest_rate": 3.5,
                "monthly_payment": 1250.0,
                "total_payment": 450000.0,
                "total_interest": 150000.0,
                "fees": {"processing": 2000, "appraisal": 500},
                "conditions": ["Minimum 20% down payment", "Good credit score required"],
                "approval_probability": 85.0,
                "processing_time_days": 14
            },
            {
                "bank_name": "Commerzbank",
                "interest_rate": 3.7,
                "monthly_payment": 1280.0,
                "total_payment": 460800.0,
                "total_interest": 160800.0,
                "fees": {"processing": 1500, "appraisal": 400},
                "conditions": ["Minimum 15% down payment", "Flexible terms"],
                "approval_probability": 90.0,
                "processing_time_days": 10
            }
        ]
        
        # Find best offer
        best_offer = min(offers, key=lambda x: x["total_payment"])
        
        # Calculate savings comparison
        savings_comparison = {
            "monthly_savings": best_offer["monthly_payment"] - offers[1]["monthly_payment"],
            "total_savings": best_offer["total_payment"] - offers[1]["total_payment"],
            "interest_savings": best_offer["total_interest"] - offers[1]["total_interest"]
        }
        
        return BankComparisonResponse(
            offers=offers,
            best_offer=best_offer,
            savings_comparison=savings_comparison,
            recommendation=f"Deutsche Bank offers the best terms with {savings_comparison['total_savings']}€ total savings",
            analysis_date=datetime.utcnow()
        )
    
    async def get_scenarios(
        self,
        offset: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        user_id: str = None
    ) -> tuple[List[FinancingScenario], int]:
        """Get financing scenarios"""
        
        # TODO: Implement real database queries
        scenarios = [
            FinancingScenario(
                id="scenario-1",
                name="First Home Purchase",
                description="Standard financing for first-time homebuyer",
                calculation=FinancingCalculationResponse(
                    monthly_payment=1200.0,
                    total_payment=432000.0,
                    total_interest=132000.0,
                    loan_amount=300000.0,
                    down_payment=50000.0,
                    property_value=350000.0,
                    loan_to_value_ratio=85.7,
                    amortization_schedule=[],
                    payment_breakdown={},
                    total_costs={}
                ),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        ]
        
        return scenarios, len(scenarios)
    
    async def create_scenario(
        self,
        scenario_data: CreateScenarioRequest,
        user_id: str
    ) -> FinancingScenario:
        """Create a financing scenario"""
        
        # Calculate financing first
        calculation = await self.calculate_financing(scenario_data.calculation_request)
        
        # TODO: Implement real database creation
        scenario = FinancingScenario(
            id="scenario-new",
            name=scenario_data.name,
            description=scenario_data.description,
            calculation=calculation,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        return scenario
    
    async def get_scenario(
        self,
        scenario_id: str,
        user_id: str
    ) -> Optional[FinancingScenario]:
        """Get a specific financing scenario"""
        
        # TODO: Implement real database query
        if scenario_id == "scenario-1":
            return FinancingScenario(
                id="scenario-1",
                name="First Home Purchase",
                description="Standard financing for first-time homebuyer",
                calculation=FinancingCalculationResponse(
                    monthly_payment=1200.0,
                    total_payment=432000.0,
                    total_interest=132000.0,
                    loan_amount=300000.0,
                    down_payment=50000.0,
                    property_value=350000.0,
                    loan_to_value_ratio=85.7,
                    amortization_schedule=[],
                    payment_breakdown={},
                    total_costs={}
                ),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        
        return None
    
    async def update_scenario(
        self,
        scenario_id: str,
        scenario_data: UpdateScenarioRequest,
        user_id: str
    ) -> Optional[FinancingScenario]:
        """Update a financing scenario"""
        
        # TODO: Implement real database update
        if scenario_id == "scenario-1":
            return FinancingScenario(
                id="scenario-1",
                name=scenario_data.name or "First Home Purchase",
                description=scenario_data.description or "Updated scenario",
                calculation=FinancingCalculationResponse(
                    monthly_payment=1200.0,
                    total_payment=432000.0,
                    total_interest=132000.0,
                    loan_amount=300000.0,
                    down_payment=50000.0,
                    property_value=350000.0,
                    loan_to_value_ratio=85.7,
                    amortization_schedule=[],
                    payment_breakdown={},
                    total_costs={}
                ),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        
        return None
    
    async def delete_scenario(
        self,
        scenario_id: str,
        user_id: str
    ) -> None:
        """Delete a financing scenario"""
        
        # TODO: Implement real database deletion
        pass
    
    async def export_calculation(
        self,
        calculation: FinancingCalculationResponse,
        export_request: ExportRequest,
        user_id: str
    ) -> ExportResponse:
        """Export financing calculation"""
        
        # TODO: Implement real export functionality
        export_result = ExportResponse(
            file_url=f"/exports/financing-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.{export_request.format}",
            file_name=f"financing-calculation.{export_request.format}",
            file_size=1024,
            expires_at=datetime.utcnow()
        )
        
        return export_result
