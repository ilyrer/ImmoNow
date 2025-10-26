"""
Test configuration and fixtures for ImmoNow
"""
import pytest
import asyncio
from typing import Generator, AsyncGenerator
from django.test import TestCase
from django.conf import settings
from django.db import transaction
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async

from app.db.models import Tenant, TenantUser, Property, Document, BillingAccount
from app.core.billing_config import PLAN_LIMITS

User = get_user_model()


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def tenant_a() -> Tenant:
    """Create test tenant A"""
    tenant = await sync_to_async(Tenant.objects.create)(
        name="Test Tenant A",
        slug="test-tenant-a",
        company_email="test-a@example.com",
        plan="starter",
        max_users=5,
        max_properties=25,
        storage_limit_gb=10,
        is_active=True
    )
    return tenant


@pytest.fixture
async def tenant_b() -> Tenant:
    """Create test tenant B"""
    tenant = await sync_to_async(Tenant.objects.create)(
        name="Test Tenant B", 
        slug="test-tenant-b",
        company_email="test-b@example.com",
        plan="pro",
        max_users=20,
        max_properties=100,
        storage_limit_gb=50,
        is_active=True
    )
    return tenant


@pytest.fixture
async def user_a(tenant_a: Tenant) -> User:
    """Create test user A for tenant A"""
    user = await sync_to_async(User.objects.create)(
        email="user-a@example.com",
        first_name="User",
        last_name="A",
        is_active=True,
        email_verified=True
    )
    
    # Create tenant-user relationship
    await sync_to_async(TenantUser.objects.create)(
        user=user,
        tenant=tenant_a,
        role="admin",
        can_manage_properties=True,
        can_manage_documents=True,
        can_manage_users=True,
        can_view_analytics=True,
        can_export_data=True,
        scopes=["read", "write", "delete", "admin"],
        is_active=True
    )
    
    return user


@pytest.fixture
async def user_b(tenant_b: Tenant) -> User:
    """Create test user B for tenant B"""
    user = await sync_to_async(User.objects.create)(
        email="user-b@example.com",
        first_name="User",
        last_name="B",
        is_active=True,
        email_verified=True
    )
    
    # Create tenant-user relationship
    await sync_to_async(TenantUser.objects.create)(
        user=user,
        tenant=tenant_b,
        role="agent",
        can_manage_properties=False,
        can_manage_documents=True,
        can_manage_users=False,
        can_view_analytics=False,
        can_export_data=False,
        scopes=["read", "write"],
        is_active=True
    )
    
    return user


@pytest.fixture
async def property_a(tenant_a: Tenant, user_a: User) -> Property:
    """Create test property A for tenant A"""
    property = await sync_to_async(Property.objects.create)(
        tenant=tenant_a,
        title="Test Property A",
        property_type="apartment",
        status="available",
        price=500000,
        area=120,
        rooms=3,
        created_by=user_a
    )
    return property


@pytest.fixture
async def property_b(tenant_b: Tenant, user_b: User) -> Property:
    """Create test property B for tenant B"""
    property = await sync_to_async(Property.objects.create)(
        tenant=tenant_b,
        title="Test Property B",
        property_type="house",
        status="sold",
        price=750000,
        area=200,
        rooms=4,
        created_by=user_b
    )
    return property


@pytest.fixture
async def billing_account_a(tenant_a: Tenant) -> BillingAccount:
    """Create billing account for tenant A"""
    billing = await sync_to_async(BillingAccount.objects.create)(
        tenant=tenant_a,
        stripe_customer_id="cus_test_a",
        plan_key="starter",
        status="active"
    )
    return billing


@pytest.fixture
async def billing_account_b(tenant_b: Tenant) -> BillingAccount:
    """Create billing account for tenant B"""
    billing = await sync_to_async(BillingAccount.objects.create)(
        tenant=tenant_b,
        stripe_customer_id="cus_test_b",
        plan_key="pro",
        status="active"
    )
    return billing


@pytest.fixture
async def document_a(tenant_a: Tenant, user_a: User) -> Document:
    """Create test document A for tenant A"""
    document = await sync_to_async(Document.objects.create)(
        tenant=tenant_a,
        name="Test Document A",
        url="https://example.com/doc-a.pdf",
        size=1024000,  # 1MB
        uploaded_by=user_a
    )
    return document


@pytest.fixture
async def document_b(tenant_b: Tenant, user_b: User) -> Document:
    """Create test document B for tenant B"""
    document = await sync_to_async(Document.objects.create)(
        tenant=tenant_b,
        name="Test Document B",
        url="https://example.com/doc-b.pdf",
        size=2048000,  # 2MB
        uploaded_by=user_b
    )
    return document


class TenantIsolationTestCase(TestCase):
    """Base test case for tenant isolation tests"""
    
    def setUp(self):
        """Set up test data"""
        # Create tenants
        self.tenant_a = Tenant.objects.create(
            name="Test Tenant A",
            slug="test-tenant-a",
            company_email="test-a@example.com",
            plan="starter",
            max_users=5,
            max_properties=25,
            storage_limit_gb=10,
            is_active=True
        )
        
        self.tenant_b = Tenant.objects.create(
            name="Test Tenant B",
            slug="test-tenant-b", 
            company_email="test-b@example.com",
            plan="pro",
            max_users=20,
            max_properties=100,
            storage_limit_gb=50,
            is_active=True
        )
        
        # Create users
        self.user_a = User.objects.create(
            email="user-a@example.com",
            first_name="User",
            last_name="A",
            is_active=True,
            email_verified=True
        )
        
        self.user_b = User.objects.create(
            email="user-b@example.com",
            first_name="User", 
            last_name="B",
            is_active=True,
            email_verified=True
        )
        
        # Create tenant-user relationships
        self.tenant_user_a = TenantUser.objects.create(
            user=self.user_a,
            tenant=self.tenant_a,
            role="admin",
            is_active=True
        )
        
        self.tenant_user_b = TenantUser.objects.create(
            user=self.user_b,
            tenant=self.tenant_b,
            role="agent",
            is_active=True
        )
        
        # Create properties
        self.property_a = Property.objects.create(
            tenant=self.tenant_a,
            title="Test Property A",
            property_type="apartment",
            status="available",
            price=500000,
            area=120,
            rooms=3,
            created_by=self.user_a
        )
        
        self.property_b = Property.objects.create(
            tenant=self.tenant_b,
            title="Test Property B",
            property_type="house",
            status="sold",
            price=750000,
            area=200,
            rooms=4,
            created_by=self.user_b
        )
        
        # Create billing accounts
        self.billing_a = BillingAccount.objects.create(
            tenant=self.tenant_a,
            stripe_customer_id="cus_test_a",
            plan_key="starter",
            status="active"
        )
        
        self.billing_b = BillingAccount.objects.create(
            tenant=self.tenant_b,
            stripe_customer_id="cus_test_b",
            plan_key="pro",
            status="active"
        )


class LimitsEnforcementTestCase(TestCase):
    """Base test case for limits enforcement tests"""
    
    def setUp(self):
        """Set up test data for limits testing"""
        # Create tenant with limited plan
        self.tenant = Tenant.objects.create(
            name="Limited Tenant",
            slug="limited-tenant",
            company_email="limited@example.com",
            plan="starter",
            max_users=5,
            max_properties=25,
            storage_limit_gb=10,
            is_active=True
        )
        
        # Create billing account
        self.billing = BillingAccount.objects.create(
            tenant=self.tenant,
            stripe_customer_id="cus_limited",
            plan_key="starter",
            status="active"
        )
        
        # Create admin user
        self.admin_user = User.objects.create(
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            is_active=True,
            email_verified=True
        )
        
        self.tenant_user = TenantUser.objects.create(
            user=self.admin_user,
            tenant=self.tenant,
            role="admin",
            is_active=True
        )


# Pytest configuration
def pytest_configure(config):
    """Configure pytest for Django"""
    import django
    from django.conf import settings
    
    if not settings.configured:
        settings.configure(
            DEBUG=True,
            DATABASES={
                'default': {
                    'ENGINE': 'django.db.backends.sqlite3',
                    'NAME': ':memory:',
                }
            },
            INSTALLED_APPS=[
                'django.contrib.auth',
                'django.contrib.contenttypes',
                'app',
            ],
            USE_TZ=True,
            SECRET_KEY='test-secret-key',
        )
    
    django.setup()


# Async test helpers
async def create_test_tenant(name: str, plan: str = "starter") -> Tenant:
    """Helper to create test tenant"""
    limits = PLAN_LIMITS[plan]
    tenant = await sync_to_async(Tenant.objects.create)(
        name=name,
        slug=name.lower().replace(" ", "-"),
        company_email=f"{name.lower().replace(' ', '.')}@example.com",
        plan=plan,
        max_users=limits['users'],
        max_properties=limits['properties'],
        storage_limit_gb=limits['storage_gb'],
        is_active=True
    )
    return tenant


async def create_test_user(email: str, tenant: Tenant, role: str = "agent") -> User:
    """Helper to create test user"""
    user = await sync_to_async(User.objects.create)(
        email=email,
        first_name="Test",
        last_name="User",
        is_active=True,
        email_verified=True
    )
    
    await sync_to_async(TenantUser.objects.create)(
        user=user,
        tenant=tenant,
        role=role,
        is_active=True
    )
    
    return user
