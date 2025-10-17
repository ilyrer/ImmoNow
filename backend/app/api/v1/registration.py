"""
Payment-First Registration API
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from asgiref.sync import sync_to_async
import os
from dotenv import load_dotenv

# ENV-Datei explizit laden
load_dotenv("env.local")
load_dotenv("../env.local")
load_dotenv("../../env.local")

from app.services.auth_service import AuthService
from app.core.billing_config import PLAN_LIMITS, STRIPE_PRICE_MAP
from app.db.models import User, Tenant
from app.core.errors import UnauthorizedError, NotFoundError

router = APIRouter(tags=["Registration"])
security = HTTPBearer()


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Get current authenticated user from JWT token"""
    try:
        token = credentials.credentials
        user = await AuthService.get_current_user(token)
        return user
    except UnauthorizedError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_tenant_id_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """Extract tenant_id from JWT token"""
    try:
        token = credentials.credentials
        payload = AuthService.decode_token(token)
        return str(payload.tenant_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


# ============================================================================
# PAYMENT-FIRST REGISTRATION ENDPOINTS
# ============================================================================

@router.post("/create-checkout")
async def create_registration_checkout(
    request: Dict[str, Any]
):
    """
    Erstellt Stripe Checkout Session für Registrierung
    Speichert Registrierungsdaten in Session Metadata
    
    Args:
        request: {
            "plan": "starter|pro|enterprise",
            "email": "user@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "phone": "+1234567890"
        }
    """
    try:
        import stripe
        
        # Stripe API Key setzen
        stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
        if not stripe.api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Stripe configuration missing"
            )
        
        # Debug: Logge alle ENV-Variablen
        print(f"🔍 DEBUG: STRIPE_SECRET_KEY: {os.getenv('STRIPE_SECRET_KEY')[:20] if os.getenv('STRIPE_SECRET_KEY') else 'None'}...")
        print(f"🔍 DEBUG: STRIPE_PRICE_STARTER: {os.getenv('STRIPE_PRICE_STARTER')}")
        print(f"🔍 DEBUG: STRIPE_PRICE_PRO: {os.getenv('STRIPE_PRICE_PRO')}")
        print(f"🔍 DEBUG: STRIPE_PRICE_ENTERPRISE: {os.getenv('STRIPE_PRICE_ENTERPRISE')}")
        
        # Validiere Plan
        plan = request.get('plan', 'starter')
        if plan not in STRIPE_PRICE_MAP:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid plan: {plan}"
            )
        
        price_id = STRIPE_PRICE_MAP[plan]
        if not price_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Plan {plan} not available"
            )
        
        # Definiere Preise in Cent (Ganzzahlen)
        plan_prices = {
            'starter': 1999,    # €19.99
            'pro': 4999,        # €49.99
            'enterprise': 9999  # €99.99
        }
        
        price_amount = plan_prices.get(plan, 1999)  # Default: Starter
        
        # Erstelle Stripe Checkout Session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            mode='payment',  # Einmalige Zahlung statt Subscription
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f'{plan.title()} Plan',
                        'description': f'{plan.title()} Plan für ImmoNow'
                    },
                    'unit_amount': price_amount,  # Preis in Cent
                },
                'quantity': 1
            }],
            success_url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/registration/complete?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/register",
            metadata={
                'email': request.get('email'),
                'first_name': request.get('first_name'),
                'last_name': request.get('last_name'),
                'phone': request.get('phone', ''),
                'plan': plan
            },
            customer_email=request.get('email'),
            allow_promotion_codes=True
        )
        
        return {
            "checkout_url": session.url,
            "session_id": session.id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout session: {str(e)}"
        )


@router.post("/complete")
async def complete_registration(
    request: Dict[str, Any]
):
    """
    Vervollständigt Registrierung nach erfolgreicher Zahlung
    Wird von Frontend nach Stripe Payment aufgerufen
    
    Args:
        request: {
            "session_id": "cs_xxx",
            "company_name": "Company Name",
            "password": "secure_password"
        }
    """
    try:
        import stripe
        
        # Stripe API Key setzen
        stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
        if not stripe.api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Stripe configuration missing"
            )
        
        # Validiere Stripe Session
        session_id = request.get('session_id')
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status != 'paid':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment not completed"
            )
        
        # Extrahiere Daten aus Session Metadata
        email = session.metadata.get('email')
        first_name = session.metadata.get('first_name')
        last_name = session.metadata.get('last_name')
        phone = session.metadata.get('phone', '')
        plan = session.metadata.get('plan')
        
        # Zusätzliche Daten aus Request
        company_name = request.get('company_name')
        password = request.get('password')
        
        # Erstelle Tenant mit bezahltem Plan
        from app.db.models import Tenant, BillingAccount
        
        tenant = Tenant.objects.create(
            name=company_name,
            slug=AuthService.slugify(company_name),
            email=email,
            plan=plan,
            subscription_status='active',
            is_active=True,
            subscription_start_date=timezone.now()
        )
        
        # Setze Limits basierend auf Plan
        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS['starter'])
        tenant.max_users = limits['users']
        tenant.max_properties = limits['properties']
        tenant.storage_limit_gb = limits['storage_gb']
        tenant.save()
        
        # Erstelle BillingAccount mit bezahltem Plan
        BillingAccount.objects.create(
            tenant=tenant,
            stripe_customer_id=session.customer,
            stripe_subscription_id=session.subscription,
            plan_key=plan,
            status='active',
            current_period_end=timezone.now() + timedelta(days=30)  # 30 Tage
        )
        
        # Erstelle User
        user = User.objects.create(
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            is_active=True,
            email_verified=True,  # Email ist bereits verifiziert durch Stripe
            password=AuthService.hash_password(password)
        )
        
        # Erstelle Tenant-User Beziehung
        from app.db.models import TenantUser
        tenant_user = TenantUser.objects.create(
            user=user,
            tenant=tenant,
            role='owner',
            can_manage_properties=True,
            can_manage_documents=True,
            can_manage_users=True,
            can_view_analytics=True,
            can_export_data=True,
            scopes=['read', 'write', 'delete'],
            is_active=True,
            joined_at=timezone.now()
        )
        
        # Generiere Tokens
        access_token = AuthService.create_access_token(
            user_id=str(user.id),
            email=user.email,
            tenant_id=str(tenant.id),
            tenant_slug=tenant.slug,
            role=tenant_user.role
        )
        
        refresh_token = AuthService.create_refresh_token(
            user_id=str(user.id),
            email=user.email,
            tenant_id=str(tenant.id)
        )
        
        return {
            "message": "Registration completed successfully!",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name
            },
            "tenant": {
                "id": tenant.id,
                "name": tenant.name,
                "slug": tenant.slug,
                "plan": tenant.plan
            },
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": 3600
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete registration: {str(e)}"
        )


@router.get("/plans")
async def get_available_plans():
    """
    Verfügbare Pläne für Registrierung (OHNE Free Plan)
    
    Returns:
        Dict mit allen verfügbaren Plänen
    """
    return {
        "plans": {
            plan: {
                **limits,
                "price_id": STRIPE_PRICE_MAP.get(plan),
                "available": STRIPE_PRICE_MAP.get(plan) is not None
            }
            for plan, limits in PLAN_LIMITS.items()
            if plan != 'free'  # Free Plan nicht für Registrierung verfügbar
        }
    }
