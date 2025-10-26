"""
Tests für Storage Guard und Billing Limits
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi import HTTPException
from app.core.billing_guard import BillingGuard
from app.db.models import TenantUsage, Tenant, BillingAccount


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
    usage.active_users_count = 5
    usage.storage_bytes_used = 2 * 1024**3  # 2 GB
    usage.properties_count = 10
    usage.documents_count = 50
    return usage


@pytest.fixture
def mock_billing_account():
    """Mock BillingAccount"""
    account = MagicMock()
    account.plan_key = "pro"
    account.status = "active"
    return account


class TestStorageGuard:
    """Test Storage Guard Funktionalität"""
    
    @pytest.mark.asyncio
    async def test_storage_limit_check_under_limit(self, mock_tenant, mock_tenant_usage):
        """Test Storage-Check unter Limit"""
        with patch('app.core.billing_guard.sync_to_async') as mock_sync, \
             patch('app.core.billing_guard.PLAN_LIMITS', {'pro': {'storage_gb': 10}}):
            
            # Mock TenantUsage.objects.get
            mock_sync.return_value.return_value = mock_tenant_usage
            
            # Sollte nicht werfen
            await BillingGuard._check_storage_limit(
                tenant_id="test-tenant-id",
                limits={'storage_gb': 10},
                additional_count=1000,  # 1 GB zusätzlich
                current_plan="pro"
            )
    
    @pytest.mark.asyncio
    async def test_storage_limit_check_exceeds_limit(self, mock_tenant, mock_tenant_usage):
        """Test Storage-Check über Limit"""
        with patch('app.core.billing_guard.sync_to_async') as mock_sync, \
             patch('app.core.billing_guard.PLAN_LIMITS', {'pro': {'storage_gb': 2}}):
            
            # Mock TenantUsage.objects.get
            mock_sync.return_value.return_value = mock_tenant_usage
            
            # Sollte HTTPException werfen
            with pytest.raises(HTTPException) as exc_info:
                await BillingGuard._check_storage_limit(
                    tenant_id="test-tenant-id",
                    limits={'storage_gb': 2},
                    additional_count=1000,  # 1 GB zusätzlich
                    current_plan="pro"
                )
            
            assert exc_info.value.status_code == 403
            assert "PLAN_LIMIT_REACHED" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_storage_limit_unlimited(self, mock_tenant):
        """Test Storage-Check mit unbegrenztem Limit"""
        with patch('app.core.billing_guard.PLAN_LIMITS', {'enterprise': {'storage_gb': -1}}):
            
            # Sollte nicht werfen bei unbegrenztem Limit
            await BillingGuard._check_storage_limit(
                tenant_id="test-tenant-id",
                limits={'storage_gb': -1},
                additional_count=10000,  # 10 GB zusätzlich
                current_plan="enterprise"
            )
    
    @pytest.mark.asyncio
    async def test_storage_limit_tenant_usage_not_found(self, mock_tenant):
        """Test Storage-Check wenn TenantUsage nicht existiert"""
        with patch('app.core.billing_guard.sync_to_async') as mock_sync, \
             patch('app.core.billing_guard.storage_service') as mock_storage_service, \
             patch('app.core.billing_guard.PLAN_LIMITS', {'pro': {'storage_gb': 5}}):
            
            # Mock TenantUsage.DoesNotExist
            mock_sync.return_value.side_effect = Exception("DoesNotExist")
            mock_storage_service.get_tenant_storage_size.return_value = 1024**3  # 1 GB
            
            # Sollte nicht werfen
            await BillingGuard._check_storage_limit(
                tenant_id="test-tenant-id",
                limits={'storage_gb': 5},
                additional_count=1000,  # 1 GB zusätzlich
                current_plan="pro"
            )


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
             patch('app.core.billing_guard.PLAN_LIMITS', {'pro': {'users': 5}}):
            
            # Mock TenantUsage.objects.get
            mock_sync.return_value.return_value = mock_tenant_usage
            
            # Sollte HTTPException werfen
            with pytest.raises(HTTPException) as exc_info:
                await BillingGuard._check_seat_limit(
                    tenant_id="test-tenant-id",
                    limits={'users': 5},
                    additional_count=1,
                    current_plan="pro"
                )
            
            assert exc_info.value.status_code == 403
            assert "PLAN_LIMIT_REACHED" in str(exc_info.value.detail)


class TestReconcileStorage:
    """Test Storage Reconciliation"""
    
    @pytest.mark.asyncio
    async def test_reconcile_storage_command(self):
        """Test Reconcile Storage Command"""
        from app.management.commands.reconcile_storage import Command
        
        with patch('app.management.commands.reconcile_storage.Tenant') as mock_tenant_model, \
             patch('app.management.commands.reconcile_storage.TenantUsage') as mock_usage_model, \
             patch('app.management.commands.reconcile_storage.UserProfile') as mock_user_model, \
             patch('app.management.commands.reconcile_storage.Property') as mock_property_model, \
             patch('app.management.commands.reconcile_storage.storage_service') as mock_storage_service:
            
            # Mock Tenant
            mock_tenant = MagicMock()
            mock_tenant.id = "test-tenant-id"
            mock_tenant.name = "Test Tenant"
            mock_tenant_model.objects.all.return_value = [mock_tenant]
            
            # Mock TenantUsage
            mock_usage = MagicMock()
            mock_usage_model.objects.get_or_create.return_value = (mock_usage, True)
            
            # Mock Counts
            mock_user_model.objects.filter.return_value.count.return_value = 5
            mock_property_model.objects.filter.return_value.count.return_value = 10
            mock_storage_service.get_tenant_storage_size.return_value = 2 * 1024**3  # 2 GB
            
            # Führe Command aus
            command = Command()
            await command.reconcile_tenant("test-tenant-id", dry_run=False, force=True)
            
            # Verifiziere dass TenantUsage aktualisiert wurde
            assert mock_usage.active_users_count == 5
            assert mock_usage.properties_count == 10
            assert mock_usage.storage_bytes_used == 2 * 1024**3
