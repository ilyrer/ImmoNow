"""
Tests für Seat Guard Funktionalität
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi import HTTPException
from app.core.billing_guard import BillingGuard
from app.db.models import TenantUsage, TenantUser, UserProfile


@pytest.fixture
def mock_tenant():
    """Mock Tenant"""
    tenant = MagicMock()
    tenant.id = "test-tenant-id"
    tenant.name = "Test Tenant"
    return tenant


@pytest.fixture
def mock_tenant_usage():
    """Mock TenantUsage"""
    usage = MagicMock()
    usage.active_users_count = 3
    usage.storage_bytes_used = 1024**3  # 1 GB
    usage.properties_count = 5
    usage.documents_count = 20
    return usage


class TestSeatGuard:
    """Test Seat Guard Funktionalität"""
    
    @pytest.mark.asyncio
    async def test_seat_limit_check_under_limit(self, mock_tenant, mock_tenant_usage):
        """Test Seat-Check unter Limit"""
        with patch('app.core.billing_guard.sync_to_async') as mock_sync, \
             patch('app.core.billing_guard.PLAN_LIMITS', {'pro': {'users': 10}}):
            
            # Mock TenantUsage.objects.get
            mock_sync.return_value.return_value = mock_tenant_usage
            
            # Sollte nicht werfen
            await BillingGuard._check_seat_limit(
                tenant_id="test-tenant-id",
                limits={'users': 10},
                additional_count=1,
                current_plan="pro"
            )
    
    @pytest.mark.asyncio
    async def test_seat_limit_check_exceeds_limit(self, mock_tenant, mock_tenant_usage):
        """Test Seat-Check über Limit"""
        with patch('app.core.billing_guard.sync_to_async') as mock_sync, \
             patch('app.core.billing_guard.PLAN_LIMITS', {'pro': {'users': 3}}):
            
            # Mock TenantUsage.objects.get
            mock_sync.return_value.return_value = mock_tenant_usage
            
            # Sollte HTTPException werfen
            with pytest.raises(HTTPException) as exc_info:
                await BillingGuard._check_seat_limit(
                    tenant_id="test-tenant-id",
                    limits={'users': 3},
                    additional_count=1,
                    current_plan="pro"
                )
            
            assert exc_info.value.status_code == 403
            assert "PLAN_LIMIT_REACHED" in str(exc_info.value.detail)
            assert "users" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_seat_limit_unlimited(self, mock_tenant):
        """Test Seat-Check mit unbegrenztem Limit"""
        with patch('app.core.billing_guard.PLAN_LIMITS', {'enterprise': {'users': -1}}):
            
            # Sollte nicht werfen bei unbegrenztem Limit
            await BillingGuard._check_seat_limit(
                tenant_id="test-tenant-id",
                limits={'users': -1},
                additional_count=100,
                current_plan="enterprise"
            )
    
    @pytest.mark.asyncio
    async def test_seat_limit_exact_limit(self, mock_tenant, mock_tenant_usage):
        """Test Seat-Check bei exaktem Limit"""
        with patch('app.core.billing_guard.sync_to_async') as mock_sync, \
             patch('app.core.billing_guard.PLAN_LIMITS', {'pro': {'users': 3}}):
            
            # Mock TenantUsage.objects.get
            mock_sync.return_value.return_value = mock_tenant_usage
            
            # Sollte HTTPException werfen wenn zusätzlicher User hinzugefügt wird
            with pytest.raises(HTTPException) as exc_info:
                await BillingGuard._check_seat_limit(
                    tenant_id="test-tenant-id",
                    limits={'users': 3},
                    additional_count=1,
                    current_plan="pro"
                )
            
            assert exc_info.value.status_code == 403
    
    @pytest.mark.asyncio
    async def test_seat_limit_zero_additional(self, mock_tenant, mock_tenant_usage):
        """Test Seat-Check mit 0 zusätzlichen Usern"""
        with patch('app.core.billing_guard.sync_to_async') as mock_sync, \
             patch('app.core.billing_guard.PLAN_LIMITS', {'pro': {'users': 3}}):
            
            # Mock TenantUsage.objects.get
            mock_sync.return_value.return_value = mock_tenant_usage
            
            # Sollte nicht werfen bei 0 zusätzlichen Usern
            await BillingGuard._check_seat_limit(
                tenant_id="test-tenant-id",
                limits={'users': 3},
                additional_count=0,
                current_plan="pro"
            )


class TestUserInviteBlocking:
    """Test User Invite Blocking bei voller Kapazität"""
    
    @pytest.mark.asyncio
    async def test_block_user_invite_when_full(self, mock_tenant, mock_tenant_usage):
        """Test dass User-Invite blockiert wird wenn Kapazität voll ist"""
        with patch('app.core.billing_guard.sync_to_async') as mock_sync, \
             patch('app.core.billing_guard.PLAN_LIMITS', {'pro': {'users': 3}}):
            
            # Mock TenantUsage.objects.get
            mock_sync.return_value.return_value = mock_tenant_usage
            
            # Sollte HTTPException werfen
            with pytest.raises(HTTPException) as exc_info:
                await BillingGuard._check_seat_limit(
                    tenant_id="test-tenant-id",
                    limits={'users': 3},
                    additional_count=1,  # Versuche einen User hinzuzufügen
                    current_plan="pro"
                )
            
            assert exc_info.value.status_code == 403
            detail = exc_info.value.detail
            assert "users" in detail["resource"]
            assert detail["current_users"] == 3
            assert detail["limit_users"] == 3
    
    @pytest.mark.asyncio
    async def test_allow_user_when_under_limit(self, mock_tenant, mock_tenant_usage):
        """Test dass User-Invite erlaubt wird wenn unter Limit"""
        with patch('app.core.billing_guard.sync_to_async') as mock_sync, \
             patch('app.core.billing_guard.PLAN_LIMITS', {'pro': {'users': 10}}):
            
            # Mock TenantUsage.objects.get
            mock_sync.return_value.return_value = mock_tenant_usage
            
            # Sollte nicht werfen
            await BillingGuard._check_seat_limit(
                tenant_id="test-tenant-id",
                limits={'users': 10},
                additional_count=1,  # Füge einen User hinzu
                current_plan="pro"
            )
    
    @pytest.mark.asyncio
    async def test_multiple_user_invite_blocking(self, mock_tenant, mock_tenant_usage):
        """Test dass mehrere User-Invites blockiert werden"""
        with patch('app.core.billing_guard.sync_to_async') as mock_sync, \
             patch('app.core.billing_guard.PLAN_LIMITS', {'pro': {'users': 5}}):
            
            # Mock TenantUsage.objects.get
            mock_sync.return_value.return_value = mock_tenant_usage
            
            # Sollte HTTPException werfen bei 3 zusätzlichen Usern
            with pytest.raises(HTTPException) as exc_info:
                await BillingGuard._check_seat_limit(
                    tenant_id="test-tenant-id",
                    limits={'users': 5},
                    additional_count=3,  # Versuche 3 User hinzuzufügen
                    current_plan="pro"
                )
            
            assert exc_info.value.status_code == 403
            detail = exc_info.value.detail
            assert detail["current_users"] == 3
            assert detail["limit_users"] == 5


class TestSeatGuardIntegration:
    """Integration Tests für Seat Guard"""
    
    @pytest.mark.asyncio
    async def test_seat_guard_with_real_limits(self, mock_tenant, mock_tenant_usage):
        """Test Seat Guard mit echten Plan-Limits"""
        # Simuliere verschiedene Plan-Limits
        plan_limits = {
            'free': {'users': 2},
            'starter': {'users': 5},
            'pro': {'users': 20},
            'enterprise': {'users': -1}
        }
        
        with patch('app.core.billing_guard.sync_to_async') as mock_sync, \
             patch('app.core.billing_guard.PLAN_LIMITS', plan_limits):
            
            # Mock TenantUsage.objects.get
            mock_sync.return_value.return_value = mock_tenant_usage
            
            # Free Plan - sollte blockieren
            with pytest.raises(HTTPException):
                await BillingGuard._check_seat_limit(
                    tenant_id="test-tenant-id",
                    limits={'users': 2},
                    additional_count=1,
                    current_plan="free"
                )
            
            # Starter Plan - sollte erlauben
            await BillingGuard._check_seat_limit(
                tenant_id="test-tenant-id",
                limits={'users': 5},
                additional_count=1,
                current_plan="starter"
            )
            
            # Pro Plan - sollte erlauben
            await BillingGuard._check_seat_limit(
                tenant_id="test-tenant-id",
                limits={'users': 20},
                additional_count=1,
                current_plan="pro"
            )
            
            # Enterprise Plan - sollte erlauben (unbegrenzt)
            await BillingGuard._check_seat_limit(
                tenant_id="test-tenant-id",
                limits={'users': -1},
                additional_count=100,
                current_plan="enterprise"
            )
