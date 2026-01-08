"""
Billing Service für Stripe Webhook-Verarbeitung
"""

import stripe
from datetime import datetime
from typing import Dict, Any
from django.conf import settings
from django.utils import timezone
from asgiref.sync import sync_to_async

from billing.models import BillingAccount, StripeWebhookEvent
from app.core.billing_config import get_plan_from_price_id, PLAN_LIMITS


class BillingService:
    """Service für Stripe Billing-Operationen"""
    
    @staticmethod
    async def handle_checkout_completed(session: Dict[str, Any]) -> None:
        """
        Handle checkout.session.completed event
        
        Args:
            session: Stripe checkout session object
        """
        try:
            customer_id = session['customer']
            subscription_id = session['subscription']
            
            # Hole Subscription Details
            subscription = stripe.Subscription.retrieve(subscription_id)
            price_id = subscription['items']['data'][0]['price']['id']
            plan_key = get_plan_from_price_id(price_id)
            
            # Update BillingAccount
            billing = await sync_to_async(BillingAccount.objects.get)(
                stripe_customer_id=customer_id
            )
            
            billing.stripe_subscription_id = subscription_id
            billing.plan_key = plan_key
            billing.status = 'active'
            billing.current_period_end = datetime.fromtimestamp(
                subscription['current_period_end']
            )
            billing.cancel_at_period_end = subscription.get('cancel_at_period_end', False)
            
            # Update meta mit Subscription-Details
            billing.meta.update({
                'subscription_id': subscription_id,
                'price_id': price_id,
                'last_webhook': 'checkout.session.completed',
                'webhook_timestamp': timezone.now().isoformat()
            })
            
            await sync_to_async(billing.save)()
            
            print(f"✅ BillingService: Checkout completed for customer {customer_id}")
            print(f"✅ BillingService: Upgraded to plan {plan_key}")
            
        except Exception as e:
            print(f"❌ BillingService: Error handling checkout completed: {str(e)}")
            raise
    
    @staticmethod
    async def handle_subscription_updated(subscription: Dict[str, Any]) -> None:
        """
        Handle customer.subscription.updated event
        
        Args:
            subscription: Stripe subscription object
        """
        try:
            subscription_id = subscription['id']
            customer_id = subscription['customer']
            
            # Finde BillingAccount
            billing = await sync_to_async(BillingAccount.objects.get)(
                stripe_customer_id=customer_id
            )
            
            # Update Status basierend auf Subscription Status
            stripe_status = subscription['status']
            status_mapping = {
                'active': 'active',
                'trialing': 'trialing',
                'past_due': 'past_due',
                'canceled': 'canceled',
                'incomplete': 'incomplete',
                'incomplete_expired': 'canceled',
                'unpaid': 'past_due'
            }
            
            billing.status = status_mapping.get(stripe_status, 'active')
            billing.current_period_end = datetime.fromtimestamp(
                subscription['current_period_end']
            )
            billing.cancel_at_period_end = subscription.get('cancel_at_period_end', False)
            
            # Update meta
            billing.meta.update({
                'last_webhook': 'customer.subscription.updated',
                'webhook_timestamp': timezone.now().isoformat(),
                'stripe_status': stripe_status
            })
            
            await sync_to_async(billing.save)()
            
            print(f"✅ BillingService: Subscription updated for customer {customer_id}")
            print(f"✅ BillingService: Status changed to {billing.status}")
            
        except Exception as e:
            print(f"❌ BillingService: Error handling subscription updated: {str(e)}")
            raise
    
    @staticmethod
    async def handle_subscription_deleted(subscription: Dict[str, Any]) -> None:
        """
        Handle customer.subscription.deleted event
        
        Args:
            subscription: Stripe subscription object
        """
        try:
            subscription_id = subscription['id']
            customer_id = subscription['customer']
            
            # Finde BillingAccount
            billing = await sync_to_async(BillingAccount.objects.get)(
                stripe_customer_id=customer_id
            )
            
            # Downgrade zu Free Plan
            billing.stripe_subscription_id = None
            billing.plan_key = 'free'
            billing.status = 'canceled'
            billing.current_period_end = None
            billing.cancel_at_period_end = False
            
            # Update meta
            billing.meta.update({
                'last_webhook': 'customer.subscription.deleted',
                'webhook_timestamp': timezone.now().isoformat(),
                'canceled_subscription_id': subscription_id
            })
            
            await sync_to_async(billing.save)()
            
            print(f"✅ BillingService: Subscription deleted for customer {customer_id}")
            print(f"✅ BillingService: Downgraded to free plan")
            
        except Exception as e:
            print(f"❌ BillingService: Error handling subscription deleted: {str(e)}")
            raise
    
    @staticmethod
    async def handle_invoice_payment_succeeded(invoice: Dict[str, Any]) -> None:
        """
        Handle invoice.payment_succeeded event
        
        Args:
            invoice: Stripe invoice object
        """
        try:
            customer_id = invoice['customer']
            
            # Finde BillingAccount
            billing = await sync_to_async(BillingAccount.objects.get)(
                stripe_customer_id=customer_id
            )
            
            # Update meta mit Payment-Info
            billing.meta.update({
                'last_webhook': 'invoice.payment_succeeded',
                'webhook_timestamp': timezone.now().isoformat(),
                'last_payment_date': timezone.now().isoformat(),
                'invoice_id': invoice['id']
            })
            
            await sync_to_async(billing.save)()
            
            print(f"✅ BillingService: Payment succeeded for customer {customer_id}")
            
        except Exception as e:
            print(f"❌ BillingService: Error handling payment succeeded: {str(e)}")
            raise
    
    @staticmethod
    async def handle_invoice_payment_failed(invoice: Dict[str, Any]) -> None:
        """
        Handle invoice.payment_failed event
        
        Args:
            invoice: Stripe invoice object
        """
        try:
            customer_id = invoice['customer']
            
            # Finde BillingAccount
            billing = await sync_to_async(BillingAccount.objects.get)(
                stripe_customer_id=customer_id
            )
            
            # Setze Status auf past_due
            billing.status = 'past_due'
            
            # Update meta mit Payment-Failure-Info
            billing.meta.update({
                'last_webhook': 'invoice.payment_failed',
                'webhook_timestamp': timezone.now().isoformat(),
                'last_payment_failure': timezone.now().isoformat(),
                'invoice_id': invoice['id']
            })
            
            await sync_to_async(billing.save)()
            
            print(f"✅ BillingService: Payment failed for customer {customer_id}")
            print(f"✅ BillingService: Status set to past_due")
            
        except Exception as e:
            print(f"❌ BillingService: Error handling payment failed: {str(e)}")
            raise
    
    @staticmethod
    async def is_event_processed(event_id: str) -> bool:
        """
        Prüfe ob Event bereits verarbeitet wurde (Idempotenz)
        
        Args:
            event_id: Stripe Event ID
            
        Returns:
            True wenn bereits verarbeitet, False sonst
        """
        return await sync_to_async(StripeWebhookEvent.objects.filter(
            event_id=event_id
        ).exists)()
    
    @staticmethod
    async def store_webhook_event(event_id: str, event_type: str, payload: Dict[str, Any]) -> None:
        """
        Speichere Webhook Event für Idempotenz
        
        Args:
            event_id: Stripe Event ID
            event_type: Event Type
            payload: Event Payload
        """
        await sync_to_async(StripeWebhookEvent.objects.create)(
            event_id=event_id,
            event_type=event_type,
            payload=payload
        )

