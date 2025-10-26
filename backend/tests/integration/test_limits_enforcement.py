"""
Limits Enforcement Tests

Tests to ensure proper enforcement of subscription limits (seats, storage, properties).
These tests verify that limits are checked before operations and enforced correctly.
"""
import pytest
from django.test import TestCase
from django.db import IntegrityError
from asgiref.sync import sync_to_async
from unittest.mock import patch, MagicMock

from app.db.models import Tenant, User, TenantUser, Property, Document, BillingAccount
from app.services.properties_service import PropertiesService
from app.services.documents_service import DocumentsService
from app.services.user_service import UserService
from app.services.storage_tracking_service import StorageTrackingService
from app.core.billing_guard import BillingGuard
from app.core.billing_config import PLAN_LIMITS
from app.core.errors import NotFoundError, ValidationError, ForbiddenError


class TestSeatLimitEnforcement(TestCase):
    """Test seat limit enforcement"""
    
    def setUp(self):
        """Set up test data"""
        # Create tenant with limited seats
        self.tenant = Tenant.objects.create(
            name="Test Tenant",
            slug="test-tenant",
            company_email="test@example.com",
            plan="starter",  # 5 users max
            max_users=5,
            max_properties=25,
            storage_limit_gb=10,
            is_active=True
        )
        
        # Create billing account
        self.billing = BillingAccount.objects.create(
            tenant=self.tenant,
            stripe_customer_id="cus_test",
            stripe_subscription_id="sub_test",
            plan_key="starter",
            status="active"
        )
        
        # Create users up to limit
        self.users = []
        for i in range(5):
            user = User.objects.create(
                email=f"user{i}@example.com",
                first_name=f"User{i}",
                last_name="Test",
                is_active=True,
                email_verified=True
            )
            
            TenantUser.objects.create(
                user=user,
                tenant=self.tenant,
                role="agent",
                is_active=True
            )
            self.users.append(user)
    
    def test_seat_limit_enforcement_on_user_invite(self):
        """Test that seat limit is enforced when inviting users"""
        from app.services.user_service import UserService
        
        service = UserService(str(self.tenant.id))
        
        # Try to invite 6th user (should fail)
        with self.assertRaises(ForbiddenError) as context:
            sync_to_async(service.invite_user)(
                email="user6@example.com",
                first_name="User6",
                last_name="Test",
                role="agent"
            )
        
        self.assertIn("User limit reached", str(context.exception))
        self.assertIn("5", str(context.exception))  # Current limit
    
    def test_seat_limit_enforcement_on_user_registration(self):
        """Test that seat limit is enforced during registration"""
        from app.services.auth_service import AuthService
        from app.schemas.auth import RegisterRequest
        
        # Try to register 6th user (should fail)
        register_request = RegisterRequest(
            email="user6@example.com",
            password="testpassword123",
            first_name="User6",
            last_name="Test",
            tenant_name="Test Tenant",
            company_email="test@example.com"
        )
        
        with self.assertRaises(ForbiddenError) as context:
            sync_to_async(AuthService.register_user)(register_request)
        
        self.assertIn("User limit reached", str(context.exception))
    
    def test_seat_limit_allows_exact_limit(self):
        """Test that exact limit is allowed"""
        from app.services.user_service import UserService
        
        service = UserService(str(self.tenant.id))
        
        # Should succeed (we're at exactly 5 users, which is the limit)
        # This test verifies the limit check is inclusive
        result = sync_to_async(service.get_tenant_users)()
        self.assertEqual(len(result), 5)
    
    def test_seat_limit_with_inactive_users(self):
        """Test that inactive users don't count towards limit"""
        # Deactivate one user
        tenant_user = TenantUser.objects.get(user=self.users[0])
        tenant_user.is_active = False
        tenant_user.save()
        
        from app.services.user_service import UserService
        service = UserService(str(self.tenant.id))
        
        # Should be able to invite new user now
        new_user = sync_to_async(service.invite_user)(
            email="newuser@example.com",
            first_name="New",
            last_name="User",
            role="agent"
        )
        
        self.assertIsNotNone(new_user)
    
    def test_seat_limit_with_plan_upgrade(self):
        """Test that plan upgrade increases seat limit"""
        # Upgrade to Pro plan (20 users max)
        self.tenant.plan = "pro"
        self.tenant.max_users = 20
        self.tenant.save()
        
        from app.services.user_service import UserService
        service = UserService(str(self.tenant.id))
        
        # Should be able to invite more users now
        for i in range(15):  # Add 15 more users (total 20)
            new_user = sync_to_async(service.invite_user)(
                email=f"newuser{i}@example.com",
                first_name=f"New{i}",
                last_name="User",
                role="agent"
            )
            self.assertIsNotNone(new_user)
    
    def test_seat_limit_enforcement_in_billing_guard(self):
        """Test BillingGuard seat limit check"""
        # Test with current limit
        with self.assertRaises(ForbiddenError):
            sync_to_async(BillingGuard.check_limit)(
                str(self.tenant.id),
                'users',
                'create',
                additional_count=1
            )
        
        # Test with no additional count (should pass)
        sync_to_async(BillingGuard.check_limit)(
            str(self.tenant.id),
            'users',
            'create',
            additional_count=0
        )


class TestStorageLimitEnforcement(TestCase):
    """Test storage limit enforcement"""
    
    def setUp(self):
        """Set up test data"""
        # Create tenant with limited storage
        self.tenant = Tenant.objects.create(
            name="Test Tenant",
            slug="test-tenant",
            company_email="test@example.com",
            plan="starter",  # 10 GB max
            max_users=5,
            max_properties=25,
            storage_limit_gb=10,
            storage_bytes_used=9 * 1024 * 1024 * 1024,  # 9 GB used
            is_active=True
        )
        
        # Create billing account
        self.billing = BillingAccount.objects.create(
            tenant=self.tenant,
            stripe_customer_id="cus_test",
            stripe_subscription_id="sub_test",
            plan_key="starter",
            status="active"
        )
        
        # Create user
        self.user = User.objects.create(
            email="user@example.com",
            first_name="User",
            last_name="Test",
            is_active=True,
            email_verified=True
        )
        
        TenantUser.objects.create(
            user=self.user,
            tenant=self.tenant,
            role="admin",
            is_active=True
        )
    
    def test_storage_limit_enforcement_on_document_upload(self):
        """Test that storage limit is enforced on document upload"""
        from app.services.documents_service import DocumentsService
        
        service = DocumentsService(str(self.tenant.id))
        
        # Try to upload 2GB file (should fail - would exceed 10GB limit)
        with self.assertRaises(ForbiddenError) as context:
            sync_to_async(service.create_document)(
                name="Large Document",
                url="https://example.com/large.pdf",
                size=2 * 1024 * 1024 * 1024,  # 2GB
                uploaded_by_id=str(self.user.id)
            )
        
        self.assertIn("Storage limit exceeded", str(context.exception))
    
    def test_storage_limit_enforcement_on_property_image_upload(self):
        """Test that storage limit is enforced on property image upload"""
        # Create property first
        property = Property.objects.create(
            tenant=self.tenant,
            title="Test Property",
            property_type="apartment",
            status="available",
            price=300000,
            area=80,
            rooms=2,
            created_by=self.user
        )
        
        from app.services.properties_service import PropertiesService
        service = PropertiesService(str(self.tenant.id))
        
        # Try to upload large image (should fail)
        with self.assertRaises(ForbiddenError) as context:
            sync_to_async(service.upload_property_images)(
                str(property.id),
                files=[MagicMock(size=2 * 1024 * 1024 * 1024)]  # 2GB file
            )
        
        self.assertIn("Storage limit exceeded", str(context.exception))
    
    def test_storage_limit_allows_small_uploads(self):
        """Test that small uploads within limit are allowed"""
        from app.services.documents_service import DocumentsService
        
        service = DocumentsService(str(self.tenant.id))
        
        # Upload 500MB file (should succeed)
        document = sync_to_async(service.create_document)(
            name="Small Document",
            url="https://example.com/small.pdf",
            size=500 * 1024 * 1024,  # 500MB
            uploaded_by_id=str(self.user.id)
        )
        
        self.assertIsNotNone(document)
    
    def test_storage_limit_with_plan_upgrade(self):
        """Test that plan upgrade increases storage limit"""
        # Upgrade to Pro plan (50 GB max)
        self.tenant.plan = "pro"
        self.tenant.storage_limit_gb = 50
        self.tenant.save()
        
        from app.services.documents_service import DocumentsService
        service = DocumentsService(str(self.tenant.id))
        
        # Should be able to upload larger file now
        document = sync_to_async(service.create_document)(
            name="Large Document",
            url="https://example.com/large.pdf",
            size=2 * 1024 * 1024 * 1024,  # 2GB
            uploaded_by_id=str(self.user.id)
        )
        
        self.assertIsNotNone(document)
    
    def test_storage_limit_enforcement_in_storage_tracking_service(self):
        """Test StorageTrackingService limit check"""
        # Test with limit exceeded
        with self.assertRaises(ValidationError):
            sync_to_async(StorageTrackingService.check_storage_limit)(
                str(self.tenant.id),
                2 * 1024 * 1024 * 1024  # 2GB
            )
        
        # Test with small file (should pass)
        sync_to_async(StorageTrackingService.check_storage_limit)(
            str(self.tenant.id),
            100 * 1024 * 1024  # 100MB
        )
    
    def test_storage_usage_calculation(self):
        """Test storage usage calculation"""
        # Create some documents
        Document.objects.create(
            tenant=self.tenant,
            name="Doc 1",
            url="https://example.com/doc1.pdf",
            size=1024 * 1024,  # 1MB
            uploaded_by=self.user
        )
        
        Document.objects.create(
            tenant=self.tenant,
            name="Doc 2",
            url="https://example.com/doc2.pdf",
            size=2 * 1024 * 1024,  # 2MB
            uploaded_by=self.user
        )
        
        # Calculate usage
        usage = sync_to_async(StorageTrackingService.calculate_storage_usage)(
            str(self.tenant.id)
        )
        
        # Should include both documents
        self.assertGreaterEqual(usage, 3 * 1024 * 1024)  # At least 3MB


class TestPropertyLimitEnforcement(TestCase):
    """Test property limit enforcement"""
    
    def setUp(self):
        """Set up test data"""
        # Create tenant with limited properties
        self.tenant = Tenant.objects.create(
            name="Test Tenant",
            slug="test-tenant",
            company_email="test@example.com",
            plan="starter",  # 25 properties max
            max_users=5,
            max_properties=25,
            storage_limit_gb=10,
            is_active=True
        )
        
        # Create billing account
        self.billing = BillingAccount.objects.create(
            tenant=self.tenant,
            stripe_customer_id="cus_test",
            stripe_subscription_id="sub_test",
            plan_key="starter",
            status="active"
        )
        
        # Create user
        self.user = User.objects.create(
            email="user@example.com",
            first_name="User",
            last_name="Test",
            is_active=True,
            email_verified=True
        )
        
        TenantUser.objects.create(
            user=self.user,
            tenant=self.tenant,
            role="admin",
            is_active=True
        )
        
        # Create properties up to limit
        self.properties = []
        for i in range(25):
            property = Property.objects.create(
                tenant=self.tenant,
                title=f"Test Property {i}",
                property_type="apartment",
                status="available",
                price=300000,
                area=80,
                rooms=2,
                created_by=self.user
            )
            self.properties.append(property)
    
    def test_property_limit_enforcement_on_creation(self):
        """Test that property limit is enforced on creation"""
        from app.services.properties_service import PropertiesService
        
        service = PropertiesService(str(self.tenant.id))
        
        # Try to create 26th property (should fail)
        with self.assertRaises(ForbiddenError) as context:
            sync_to_async(service.create_property)(
                title="Test Property 26",
                property_type="apartment",
                status="available",
                price=300000,
                area=80,
                rooms=2,
                created_by_id=str(self.user.id)
            )
        
        self.assertIn("Property limit reached", str(context.exception))
        self.assertIn("25", str(context.exception))  # Current limit
    
    def test_property_limit_allows_exact_limit(self):
        """Test that exact limit is allowed"""
        from app.services.properties_service import PropertiesService
        
        service = PropertiesService(str(self.tenant.id))
        
        # Should succeed (we're at exactly 25 properties, which is the limit)
        result = sync_to_async(service.get_properties)()
        self.assertEqual(len(result), 25)
    
    def test_property_limit_with_plan_upgrade(self):
        """Test that plan upgrade increases property limit"""
        # Upgrade to Pro plan (100 properties max)
        self.tenant.plan = "pro"
        self.tenant.max_properties = 100
        self.tenant.save()
        
        from app.services.properties_service import PropertiesService
        service = PropertiesService(str(self.tenant.id))
        
        # Should be able to create more properties now
        for i in range(75):  # Add 75 more properties (total 100)
            property = sync_to_async(service.create_property)(
                title=f"Test Property {i + 25}",
                property_type="apartment",
                status="available",
                price=300000,
                area=80,
                rooms=2,
                created_by_id=str(self.user.id)
            )
            self.assertIsNotNone(property)
    
    def test_property_limit_enforcement_in_billing_guard(self):
        """Test BillingGuard property limit check"""
        # Test with current limit
        with self.assertRaises(ForbiddenError):
            sync_to_async(BillingGuard.check_limit)(
                str(self.tenant.id),
                'properties',
                'create',
                additional_count=1
            )
        
        # Test with no additional count (should pass)
        sync_to_async(BillingGuard.check_limit)(
            str(self.tenant.id),
            'properties',
            'create',
            additional_count=0
        )


class TestUnlimitedPlanLimits(TestCase):
    """Test unlimited plan limits"""
    
    def setUp(self):
        """Set up test data"""
        # Create tenant with unlimited plan
        self.tenant = Tenant.objects.create(
            name="Test Tenant",
            slug="test-tenant",
            company_email="test@example.com",
            plan="enterprise",  # Unlimited
            max_users=-1,  # Unlimited
            max_properties=-1,  # Unlimited
            storage_limit_gb=500,  # 500 GB
            is_active=True
        )
        
        # Create billing account
        self.billing = BillingAccount.objects.create(
            tenant=self.tenant,
            stripe_customer_id="cus_test",
            stripe_subscription_id="sub_test",
            plan_key="enterprise",
            status="active"
        )
        
        # Create user
        self.user = User.objects.create(
            email="user@example.com",
            first_name="User",
            last_name="Test",
            is_active=True,
            email_verified=True
        )
        
        TenantUser.objects.create(
            user=self.user,
            tenant=self.tenant,
            role="admin",
            is_active=True
        )
    
    def test_unlimited_user_limit(self):
        """Test that unlimited user limit allows any number of users"""
        from app.services.user_service import UserService
        
        service = UserService(str(self.tenant.id))
        
        # Should be able to invite many users
        for i in range(100):
            new_user = sync_to_async(service.invite_user)(
                email=f"user{i}@example.com",
                first_name=f"User{i}",
                last_name="Test",
                role="agent"
            )
            self.assertIsNotNone(new_user)
    
    def test_unlimited_property_limit(self):
        """Test that unlimited property limit allows any number of properties"""
        from app.services.properties_service import PropertiesService
        
        service = PropertiesService(str(self.tenant.id))
        
        # Should be able to create many properties
        for i in range(100):
            property = sync_to_async(service.create_property)(
                title=f"Test Property {i}",
                property_type="apartment",
                status="available",
                price=300000,
                area=80,
                rooms=2,
                created_by_id=str(self.user.id)
            )
            self.assertIsNotNone(property)
    
    def test_unlimited_limits_in_billing_guard(self):
        """Test BillingGuard with unlimited limits"""
        # Should pass for any count
        sync_to_async(BillingGuard.check_limit)(
            str(self.tenant.id),
            'users',
            'create',
            additional_count=1000
        )
        
        sync_to_async(BillingGuard.check_limit)(
            str(self.tenant.id),
            'properties',
            'create',
            additional_count=1000
        )


class TestLimitEnforcementEdgeCases(TestCase):
    """Test edge cases in limit enforcement"""
    
    def setUp(self):
        """Set up test data"""
        # Create tenant
        self.tenant = Tenant.objects.create(
            name="Test Tenant",
            slug="test-tenant",
            company_email="test@example.com",
            plan="starter",
            max_users=5,
            max_properties=25,
            storage_limit_gb=10,
            is_active=True
        )
        
        # Create billing account
        self.billing = BillingAccount.objects.create(
            tenant=self.tenant,
            stripe_customer_id="cus_test",
            stripe_subscription_id="sub_test",
            plan_key="starter",
            status="active"
        )
    
    def test_limit_enforcement_with_inactive_tenant(self):
        """Test limit enforcement with inactive tenant"""
        # Deactivate tenant
        self.tenant.is_active = False
        self.tenant.save()
        
        # Should still enforce limits
        with self.assertRaises(ForbiddenError):
            sync_to_async(BillingGuard.check_limit)(
                str(self.tenant.id),
                'users',
                'create',
                additional_count=1
            )
    
    def test_limit_enforcement_with_cancelled_billing(self):
        """Test limit enforcement with cancelled billing"""
        # Cancel billing
        self.billing.status = "cancelled"
        self.billing.save()
        
        # Should still enforce limits
        with self.assertRaises(ForbiddenError):
            sync_to_async(BillingGuard.check_limit)(
                str(self.tenant.id),
                'users',
                'create',
                additional_count=1
            )
    
    def test_limit_enforcement_with_trial_tenant(self):
        """Test limit enforcement with trial tenant"""
        # Set trial end date
        from datetime import datetime, timedelta
        self.billing.trial_end = datetime.utcnow() + timedelta(days=30)
        self.billing.save()
        
        # Should still enforce limits
        with self.assertRaises(ForbiddenError):
            sync_to_async(BillingGuard.check_limit)(
                str(self.tenant.id),
                'users',
                'create',
                additional_count=1
            )
    
    def test_limit_enforcement_with_invalid_tenant_id(self):
        """Test limit enforcement with invalid tenant ID"""
        # Should raise error for invalid tenant
        with self.assertRaises(NotFoundError):
            sync_to_async(BillingGuard.check_limit)(
                "invalid-tenant-id",
                'users',
                'create',
                additional_count=1
            )
    
    def test_limit_enforcement_with_invalid_resource(self):
        """Test limit enforcement with invalid resource"""
        # Should raise error for invalid resource
        with self.assertRaises(ValidationError):
            sync_to_async(BillingGuard.check_limit)(
                str(self.tenant.id),
                'invalid_resource',
                'create',
                additional_count=1
            )
