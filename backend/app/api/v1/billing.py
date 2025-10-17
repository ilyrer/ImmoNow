"""
Billing API Endpoints für Stripe Integration
"""

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
from django.conf import settings
from asgiref.sync import sync_to_async

from app.services.billing_service import BillingService
from app.services.auth_service import AuthService
from app.core.billing_config import PLAN_LIMITS, STRIPE_PRICE_MAP
from app.db.models import User, BillingAccount
from app.core.errors import UnauthorizedError, NotFoundError
from django.utils import timezone

router = APIRouter(prefix="/billing", tags=["Billing"])
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
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ============================================================================
# STRIPE WEBHOOK ENDPOINT
# ============================================================================

@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    """
    Stripe Webhook Handler mit Signaturprüfung und Idempotenz
    
    Verarbeitet folgende Events:
    - checkout.session.completed: Upgrade auf bezahlten Plan
    - customer.subscription.updated: Status-Änderungen
    - customer.subscription.deleted: Downgrade zu Free
    - invoice.payment_succeeded: Zahlung erfolgreich
    - invoice.payment_failed: Zahlung fehlgeschlagen
    """
    try:
        # Stripe API Key setzen
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        # Payload und Signatur holen
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        if not sig_header:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing stripe-signature header"
            )
        
        # Event konstruieren mit Signaturprüfung
        try:
            event = stripe.Webhook.construct_event(
                payload, 
                sig_header, 
                settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid payload: {str(e)}"
            )
        except stripe.error.SignatureVerificationError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid signature: {str(e)}"
            )
        
        # Idempotenz prüfen
        if await BillingService.is_event_processed(event['id']):
            return {"status": "already_processed", "event_id": event['id']}
        
        # Event speichern für Idempotenz
        await BillingService.store_webhook_event(
            event['id'],
            event['type'],
            event.to_dict()
        )
        
        # Event verarbeiten basierend auf Type
        event_type = event['type']
        event_data = event['data']['object']
        
        if event_type == 'checkout.session.completed':
            await BillingService.handle_checkout_completed(event_data)
            
        elif event_type == 'customer.subscription.updated':
            await BillingService.handle_subscription_updated(event_data)
            
        elif event_type == 'customer.subscription.deleted':
            await BillingService.handle_subscription_deleted(event_data)
            
        elif event_type == 'invoice.payment_succeeded':
            await BillingService.handle_invoice_payment_succeeded(event_data)
            
        elif event_type == 'invoice.payment_failed':
            await BillingService.handle_invoice_payment_failed(event_data)
            
        else:
            print(f"ℹ️ BillingService: Unhandled event type: {event_type}")
        
        return {
            "status": "success",
            "event_id": event['id'],
            "event_type": event_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ BillingService: Webhook error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook processing failed: {str(e)}"
        )


# ============================================================================
# BILLING INFO ENDPOINTS
# ============================================================================

@router.get("/me")
async def get_billing_info(
    tenant_id: str = Depends(get_tenant_id_from_token),
    current_user: User = Depends(get_current_user)
):
    """
    Billing-Info für aktuellen Tenant
    
    Returns:
        Dict mit Plan-Info, Status, Limits und Usage
    """
    try:
        # Hole BillingAccount
        billing = await sync_to_async(BillingAccount.objects.select_related('tenant').get)(
            tenant_id=tenant_id
        )
        
        # Hole Limits für aktuellen Plan
        limits = PLAN_LIMITS[billing.plan_key]
        
        # Hole aktuelle Usage (vereinfacht - später durch UsageService ersetzen)
        from app.db.models import UserProfile, Property
        users_count = await sync_to_async(UserProfile.objects.filter(
            tenant_id=tenant_id, 
            is_active=True
        ).count)()
        
        properties_count = await sync_to_async(Property.objects.filter(
            tenant_id=tenant_id
        ).count)()
        
        usage = {
            'users': users_count,
            'properties': properties_count,
            'storage_mb': 0,  # TODO: Implementieren
        }
        
        return {
            "plan_key": billing.plan_key,
            "status": billing.status,
            "limits": limits,
            "usage": usage,
            "current_period_end": billing.current_period_end,
            "cancel_at_period_end": billing.cancel_at_period_end,
            "stripe_customer_id": billing.stripe_customer_id,
            "meta": billing.meta
        }
        
    except BillingAccount.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Billing account not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get billing info: {str(e)}"
        )


# ============================================================================
# STRIPE CHECKOUT & PORTAL ENDPOINTS
# ============================================================================

@router.post("/portal")
async def create_portal_session(
    tenant_id: str = Depends(get_tenant_id_from_token),
    current_user: User = Depends(get_current_user)
):
    """
    Stripe Customer Portal URL erstellen
    
    Ermöglicht Kunden ihre Subscription zu verwalten
    """
    try:
        # Stripe API Key setzen
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        # Hole BillingAccount
        billing = await sync_to_async(BillingAccount.objects.get)(
            tenant_id=tenant_id
        )
        
        # Erstelle Portal Session
        session = stripe.billing_portal.Session.create(
            customer=billing.stripe_customer_id,
            return_url=f"{settings.FRONTEND_URL}/dashboard"
        )
        
        return {"url": session.url}
        
    except BillingAccount.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Billing account not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create portal session: {str(e)}"
        )


@router.post("/checkout")
async def create_checkout_session(
    plan: str,
    tenant_id: str = Depends(get_tenant_id_from_token),
    current_user: User = Depends(get_current_user)
):
    """
    Stripe Checkout Session erstellen
    
    Args:
        plan: Plan identifier (starter, pro, enterprise)
    """
    try:
        # Validierung
        if plan not in STRIPE_PRICE_MAP:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid plan: {plan}"
            )
        
        price_id = STRIPE_PRICE_MAP[plan]
        if not price_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Free plan cannot be purchased"
            )
        
        # Stripe API Key setzen
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        # Hole BillingAccount
        billing = await sync_to_async(BillingAccount.objects.get)(
            tenant_id=tenant_id
        )
        
        # Erstelle Checkout Session
        session = stripe.checkout.Session.create(
            customer=billing.stripe_customer_id,
            mode='subscription',
            line_items=[{
                'price': price_id,
                'quantity': 1
            }],
            success_url=f"{settings.FRONTEND_URL}/dashboard?billing=success",
            cancel_url=f"{settings.FRONTEND_URL}/dashboard?billing=canceled",
            metadata={
                'tenant_id': tenant_id,
                'plan': plan
            }
        )
        
        return {"url": session.url}
        
    except BillingAccount.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Billing account not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout session: {str(e)}"
        )


# ============================================================================
# PLAN INFO ENDPOINTS
# ============================================================================

@router.get("/me")
async def get_billing_info(
    tenant_id: str = Depends(get_tenant_id_from_token),
    current_user: User = Depends(get_current_user)
):
    """
    Aktuelle Billing-Informationen für den Tenant
    
    Returns:
        Dict mit Plan-Info, Status, Limits und Usage
    """
    try:
        billing = await sync_to_async(BillingAccount.objects.get)(
            tenant_id=tenant_id
        )
        
        # Hole aktuelle Limits
        limits = PLAN_LIMITS.get(billing.plan_key, PLAN_LIMITS['free'])
        
        # Berechne aktuelle Usage (vereinfacht)
        from app.db.models import UserProfile, Property
        
        current_users = await sync_to_async(UserProfile.objects.filter(
            tenant_id=tenant_id,
            is_active=True
        ).count)()
        
        current_properties = await sync_to_async(Property.objects.filter(
            tenant_id=tenant_id
        ).count)()
        
        # Storage-Berechnung (vereinfacht)
        current_storage_mb = 0  # TODO: Implementiere echte Storage-Berechnung
        
        return {
            "plan_key": billing.plan_key,
            "status": billing.status,
            "limits": limits,
            "usage": {
                "users": current_users,
                "properties": current_properties,
                "storage_mb": current_storage_mb
            },
            "current_period_end": billing.current_period_end.isoformat() if billing.current_period_end else None,
            "cancel_at_period_end": billing.cancel_at_period_end,
            "trial_end": billing.trial_end.isoformat() if billing.trial_end else None,
            "trial_days": billing.trial_days
        }
        
    except BillingAccount.DoesNotExist:
        # Fallback für Tenants ohne BillingAccount
        limits = PLAN_LIMITS['free']
        return {
            "plan_key": "free",
            "status": "active",
            "limits": limits,
            "usage": {
                "users": 0,
                "properties": 0,
                "storage_mb": 0
            },
            "current_period_end": None,
            "cancel_at_period_end": False,
            "trial_end": None,
            "trial_days": 14
        }


@router.get("/trial-status")
async def get_trial_status(
    tenant_id: str = Depends(get_tenant_id_from_token),
    current_user: User = Depends(get_current_user)
):
    """
    Prüft Trial-Status für Modal-Anzeige
    
    Returns:
        Dict mit Trial-Status und verbleibenden Tagen
    """
    try:
        billing = await sync_to_async(BillingAccount.objects.get)(
            tenant_id=tenant_id
        )
        
        if billing.status == 'trialing' and billing.trial_end:
            days_remaining = (billing.trial_end - timezone.now()).days
            is_expired = days_remaining < 0
            
            return {
                "status": "trialing",
                "trial_end": billing.trial_end.isoformat(),
                "days_remaining": max(0, days_remaining),
                "is_expired": is_expired,
                "show_payment_modal": is_expired
            }
        
        return {
            "status": billing.status,
            "show_payment_modal": False
        }
        
    except BillingAccount.DoesNotExist:
        return {
            "status": "active",
            "show_payment_modal": False
        }


@router.get("/plans")
async def get_available_plans():
    """
    Verfügbare Pläne und deren Limits
    
    Returns:
        Dict mit allen verfügbaren Plänen und deren Features
    """
    return {
        "plans": PLAN_LIMITS,
        "price_map": {
            plan: price_id is not None 
            for plan, price_id in STRIPE_PRICE_MAP.items()
        }
    }
