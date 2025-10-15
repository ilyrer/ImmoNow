"""
Plans API Endpoints
"""

from fastapi import APIRouter
from typing import List
from pydantic import BaseModel

router = APIRouter()

class PlanResponse(BaseModel):
    """Plan response schema"""
    id: str
    name: str
    description: str
    price: float
    currency: str
    billing_cycle: str
    features: List[str]
    max_users: int
    max_properties: int
    storage_limit_gb: int
    is_popular: bool = False

@router.get("/", response_model=List[PlanResponse])
async def get_plans():
    """Get available subscription plans"""
    
    plans = [
        PlanResponse(
            id="free",
            name="Free",
            description="Perfect for getting started",
            price=0.0,
            currency="EUR",
            billing_cycle="monthly",
            features=[
                "Up to 2 users",
                "Up to 5 properties",
                "1GB storage",
                "Basic support"
            ],
            max_users=2,
            max_properties=5,
            storage_limit_gb=1
        ),
        PlanResponse(
            id="basic",
            name="Basic",
            description="For small teams",
            price=79.0,
            currency="EUR",
            billing_cycle="monthly",
            features=[
                "Up to 5 users",
                "Up to 25 properties",
                "10GB storage",
                "Email support",
                "Basic analytics"
            ],
            max_users=5,
            max_properties=25,
            storage_limit_gb=10
        ),
        PlanResponse(
            id="professional",
            name="Professional",
            description="For growing businesses",
            price=299.0,
            currency="EUR",
            billing_cycle="monthly",
            features=[
                "Up to 20 users",
                "Up to 100 properties",
                "50GB storage",
                "Priority support",
                "Advanced analytics",
                "API access",
                "Custom integrations"
            ],
            max_users=20,
            max_properties=100,
            storage_limit_gb=50,
            is_popular=True
        ),
        PlanResponse(
            id="enterprise",
            name="Enterprise",
            description="For large organizations",
            price=499.0,
            currency="EUR",
            billing_cycle="monthly",
            features=[
                "Up to 100 users",
                "Up to 1000 properties",
                "500GB storage",
                "24/7 support",
                "Full analytics suite",
                "Full API access",
                "Custom integrations",
                "Dedicated account manager",
                "SLA guarantee"
            ],
            max_users=100,
            max_properties=1000,
            storage_limit_gb=500
        )
    ]
    
    return plans
