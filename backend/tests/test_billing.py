"""
Unit Tests für Stripe Billing Integration
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from django.test import TestCase
from django.utils import timezone
from datetime import datetime, timedelta

from app.core.billing_config import (
    PLAN_LIMITS, STRIPE_PRICE_MAP, get_plan_from_price_id,
    get_plan_limits, is_unlimited, get_next_plan, get_required_plan_for_limit
)
from app.core.billing_guard import BillingGuard
from app.services.billing_service import BillingService
from app.db.models import BillingAccount, Tenant, UserProfile, Property


class TestBillingConfig(TestCase):
    """Tests für Billing-Konfiguration"""
    
    def test_plan_limits_structure(self):
        """Teste dass alle Pläne korrekte Limits haben"""
        required_keys = ['users', 'properties', 'storage_gb', 'analytics']
        
        for plan_key, limits in PLAN_LIMITS.items():
            for key in required_keys:
                self.assertIn(key, limits, f"Plan {plan_key} missing {key}")
    
    def test_get_plan_from_price_id(self):
        """Teste Price ID zu Plan Mapping"""
        # Mock settings
        with patch('app.core.billing_config.settings') as mock_settings:
            mock_settings.STRIPE_PRICE_STARTER = 'price_starter_123'
            mock_settings.STRIPE_PRICE_PRO = 'price_pro_456'
            mock_settings.STRIPE_PRICE_ENTERPRISE = 'price_enterprise_789'
            
            # Teste bekannte Price IDs
            self.assertEqual(get_plan_from_price_id('price_starter_123'), 'starter')
            self.assertEqual(get_plan_from_price_id('price_pro_456'), 'pro')
            self.assertEqual(get_plan_from_price_id('price_enterprise_789'), 'enterprise')
            
            # Teste unbekannte Price ID
            with self.assertRaises(ValueError):
                get_plan_from_price_id('unknown_price_id')
    
    def test_get_plan_limits(self):
        """Teste Plan-Limits Abruf"""
        limits = get_plan_limits('free')
        self.assertEqual(limits['users'], 2)
        self.assertEqual(limits['properties'], 5)
        self.assertEqual(limits['storage_gb'], 1)
        
        # Teste unbekannten Plan
        with self.assertRaises(KeyError):
            get_plan_limits('unknown_plan')
    
    def test_is_unlimited(self):
        """Teste Unlimited-Check"""
        self.assertFalse(is_unlimited('free', 'users'))
        self.assertFalse(is_unlimited('starter', 'users'))
        self.assertFalse(is_unlimited('pro', 'users'))
        self.assertTrue(is_unlimited('enterprise', 'users'))
        self.assertTrue(is_unlimited('enterprise', 'properties'))
    
    def test_get_next_plan(self):
        """Teste nächster Plan"""
        self.assertEqual(get_next_plan('free'), 'starter')
        self.assertEqual(get_next_plan('starter'), 'pro')
        self.assertEqual(get_next_plan('pro'), 'enterprise')
        self.assertIsNone(get_next_plan('enterprise'))
        self.assertIsNone(get_next_plan('unknown'))
    
    def test_get_required_plan_for_limit(self):
        """Teste erforderlicher Plan für Limit"""
        self.assertEqual(get_required_plan_for_limit('free', 'users'), 'starter')
        self.assertEqual(get_required_plan_for_limit('free', 'properties'), 'starter')
        self.assertEqual(get_required_plan_for_limit('starter', 'users'), 'pro')
        self.assertIsNone(get_required_plan_for_limit('enterprise', 'users'))


class TestBillingGuard(TestCase):
    """Tests für Billing Guard"""
    
    def setUp(self):
        """Setup Test-Daten"""
        self.tenant = Tenant.objects.create(
            name="Test Tenant",
            slug="test-tenant",
            email="test@example.com"
        )
        
        self.billing_account = BillingAccount.objects.create(
            tenant=self.tenant,
            stripe_customer_id="cus_test123",
            plan_key="free",
            status="active"
        )
    
    @pytest.mark.asyncio
    async def test_check_subscription_status_active(self):
        """Teste aktive Subscription"""
        billing = await BillingGuard.check_subscription_status(str(self.tenant.id))
        self.assertEqual(billing.plan_key, "free")
        self.assertEqual(billing.status, "active")
    
    @pytest.mark.asyncio
    async def test_check_subscription_status_inactive(self):
        """Teste inaktive Subscription"""
        self.billing_account.status = "canceled"
        await self.billing_account.asave()
        
        with pytest.raises(Exception):  # HTTPException wird zu Exception in Tests
            await BillingGuard.check_subscription_status(str(self.tenant.id))
    
    @pytest.mark.asyncio
    async def test_check_limit_properties_free(self):
        """Teste Property-Limit für Free Plan"""
        # Erstelle 5 Properties (Free Limit)
        for i in range(5):
            Property.objects.create(
                tenant=self.tenant,
                title=f"Property {i}",
                property_type="apartment",
                location="Test Location"
            )
        
        # 6. Property sollte Limit erreichen
        with pytest.raises(Exception):  # HTTPException wird zu Exception in Tests
            await BillingGuard.check_limit(str(self.tenant.id), 'properties', 'create')
    
    @pytest.mark.asyncio
    async def test_check_limit_users_free(self):
        """Teste User-Limit für Free Plan"""
        # Erstelle 2 UserProfiles (Free Limit)
        for i in range(2):
            user = UserProfile.objects.create(
                tenant=self.tenant,
                role="employee",
                is_active=True
            )
        
        # 3. User sollte Limit erreichen
        with pytest.raises(Exception):  # HTTPException wird zu Exception in Tests
            await BillingGuard.check_limit(str(self.tenant.id), 'users', 'create')
    
    @pytest.mark.asyncio
    async def test_check_feature_access(self):
        """Teste Feature-Zugriff"""
        # Free Plan hat keine erweiterten Features
        self.assertFalse(await BillingGuard.check_feature_access(str(self.tenant.id), 'integrations'))
        self.assertFalse(await BillingGuard.check_feature_access(str(self.tenant.id), 'reporting'))
        
        # Upgrade zu Pro Plan
        self.billing_account.plan_key = "pro"
        await self.billing_account.asave()
        
        self.assertTrue(await BillingGuard.check_feature_access(str(self.tenant.id), 'integrations'))
        self.assertTrue(await BillingGuard.check_feature_access(str(self.tenant.id), 'reporting'))


class TestBillingService(TestCase):
    """Tests für Billing Service"""
    
    def setUp(self):
        """Setup Test-Daten"""
        self.tenant = Tenant.objects.create(
            name="Test Tenant",
            slug="test-tenant",
            email="test@example.com"
        )
        
        self.billing_account = BillingAccount.objects.create(
            tenant=self.tenant,
            stripe_customer_id="cus_test123",
            plan_key="free",
            status="active"
        )
    
    @pytest.mark.asyncio
    async def test_is_event_processed(self):
        """Teste Event-Idempotenz"""
        # Event noch nicht verarbeitet
        is_processed = await BillingService.is_event_processed("evt_test123")
        self.assertFalse(is_processed)
        
        # Event speichern
        await BillingService.store_webhook_event(
            "evt_test123",
            "checkout.session.completed",
            {"test": "data"}
        )
        
        # Event jetzt verarbeitet
        is_processed = await BillingService.is_event_processed("evt_test123")
        self.assertTrue(is_processed)
    
    @pytest.mark.asyncio
    @patch('app.services.billing_service.stripe')
    async def test_handle_checkout_completed(self, mock_stripe):
        """Teste Checkout-Completed Handler"""
        # Mock Stripe Subscription
        mock_subscription = {
            'id': 'sub_test123',
            'items': {
                'data': [{
                    'price': {'id': 'price_starter_123'}
                }]
            },
            'current_period_end': int(timezone.now().timestamp()) + 86400
        }
        
        mock_stripe.Subscription.retrieve.return_value = mock_subscription
        
        # Mock get_plan_from_price_id
        with patch('app.services.billing_service.get_plan_from_price_id') as mock_get_plan:
            mock_get_plan.return_value = 'starter'
            
            # Teste Handler
            session_data = {
                'customer': 'cus_test123',
                'subscription': 'sub_test123'
            }
            
            await BillingService.handle_checkout_completed(session_data)
            
            # Prüfe dass BillingAccount aktualisiert wurde
            await self.billing_account.arefresh_from_db()
            self.assertEqual(self.billing_account.plan_key, 'starter')
            self.assertEqual(self.billing_account.status, 'active')
            self.assertIsNotNone(self.billing_account.current_period_end)
    
    @pytest.mark.asyncio
    async def test_handle_subscription_deleted(self):
        """Teste Subscription-Deleted Handler"""
        # Setze initialen Plan
        self.billing_account.plan_key = "pro"
        self.billing_account.stripe_subscription_id = "sub_test123"
        await self.billing_account.asave()
        
        # Teste Handler
        subscription_data = {
            'id': 'sub_test123',
            'customer': 'cus_test123'
        }
        
        await BillingService.handle_subscription_deleted(subscription_data)
        
        # Prüfe Downgrade zu Free
        await self.billing_account.arefresh_from_db()
        self.assertEqual(self.billing_account.plan_key, 'free')
        self.assertEqual(self.billing_account.status, 'canceled')
        self.assertIsNone(self.billing_account.stripe_subscription_id)


class TestUsageService(TestCase):
    """Tests für Usage Service"""
    
    def setUp(self):
        """Setup Test-Daten"""
        self.tenant = Tenant.objects.create(
            name="Test Tenant",
            slug="test-tenant",
            email="test@example.com"
        )
    
    @pytest.mark.asyncio
    async def test_get_usage_snapshot_empty(self):
        """Teste Usage-Snapshot für leeren Tenant"""
        from app.services.usage_service import UsageService
        
        usage = await UsageService.get_usage_snapshot(str(self.tenant.id))
        
        self.assertEqual(usage['users'], 0)
        self.assertEqual(usage['properties'], 0)
        self.assertEqual(usage['storage_mb'], 0)
        self.assertIn('timestamp', usage)
    
    @pytest.mark.asyncio
    async def test_get_usage_vs_limits(self):
        """Teste Usage vs Limits Vergleich"""
        from app.services.usage_service import UsageService
        
        # Erstelle BillingAccount
        BillingAccount.objects.create(
            tenant=self.tenant,
            stripe_customer_id="cus_test123",
            plan_key="free",
            status="active"
        )
        
        usage_vs_limits = await UsageService.get_usage_vs_limits(str(self.tenant.id))
        
        self.assertEqual(usage_vs_limits['plan_key'], 'free')
        self.assertEqual(usage_vs_limits['status'], 'active')
        self.assertEqual(usage_vs_limits['users']['limit'], 2)
        self.assertEqual(usage_vs_limits['properties']['limit'], 5)
        self.assertEqual(usage_vs_limits['storage']['limit_gb'], 1)
        self.assertFalse(usage_vs_limits['features']['integrations'])


if __name__ == '__main__':
    pytest.main([__file__])

