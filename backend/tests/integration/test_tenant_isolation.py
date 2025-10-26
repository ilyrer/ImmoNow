"""
Tenant Isolation Tests

Tests to ensure proper data isolation between tenants.
These tests verify that tenants cannot access each other's data.
"""
import pytest
from django.test import TestCase
from django.db import IntegrityError
from asgiref.sync import sync_to_async

from app.db.models import Tenant, User, TenantUser, Property, Document, BillingAccount
from app.services.properties_service import PropertiesService
from app.services.documents_service import DocumentsService
from app.services.user_service import UserService
from app.core.errors import NotFoundError, ValidationError


class TestTenantIsolation(TenantIsolationTestCase):
    """Test tenant data isolation"""
    
    def test_tenant_user_cannot_access_other_tenant_properties(self):
        """User from Tenant A cannot see properties from Tenant B"""
        # User A tries to access Property B
        service = PropertiesService(str(self.tenant_a.id))
        
        # This should return None or raise NotFoundError
        with self.assertRaises(NotFoundError):
            sync_to_async(service.get_property)(str(self.property_b.id))
    
    def test_tenant_user_cannot_access_other_tenant_documents(self):
        """User from Tenant A cannot see documents from Tenant B"""
        # Create document for tenant B
        document_b = Document.objects.create(
            tenant=self.tenant_b,
            name="Secret Document",
            url="https://example.com/secret.pdf",
            size=1024,
            uploaded_by=self.user_b
        )
        
        # User A tries to access Document B
        service = DocumentsService(str(self.tenant_a.id))
        
        # This should return None or raise NotFoundError
        with self.assertRaises(NotFoundError):
            sync_to_async(service.get_document)(str(document_b.id))
    
    def test_tenant_user_cannot_access_other_tenant_users(self):
        """User from Tenant A cannot see users from Tenant B"""
        service = UserService(str(self.tenant_a.id))
        
        # Get all users for tenant A
        users = sync_to_async(service.get_tenant_users)()
        
        # Should only contain user A, not user B
        user_emails = [user.email for user in users]
        self.assertIn("user-a@example.com", user_emails)
        self.assertNotIn("user-b@example.com", user_emails)
    
    def test_tenant_user_cannot_create_cross_tenant_relationships(self):
        """User cannot create relationships across tenants"""
        # User A tries to create a property for Tenant B
        with self.assertRaises(ValidationError):
            Property.objects.create(
                tenant=self.tenant_b,  # Wrong tenant!
                title="Unauthorized Property",
                property_type="apartment",
                status="available",
                price=300000,
                area=80,
                rooms=2,
                created_by=self.user_a  # User A from Tenant A
            )
    
    def test_tenant_user_cannot_modify_other_tenant_data(self):
        """User cannot modify data from other tenants"""
        # User A tries to modify Property B
        service = PropertiesService(str(self.tenant_a.id))
        
        with self.assertRaises(NotFoundError):
            sync_to_async(service.update_property)(
                str(self.property_b.id),
                {"title": "Hacked Property"}
            )
    
    def test_tenant_user_cannot_delete_other_tenant_data(self):
        """User cannot delete data from other tenants"""
        # User A tries to delete Property B
        service = PropertiesService(str(self.tenant_a.id))
        
        with self.assertRaises(NotFoundError):
            sync_to_async(service.delete_property)(str(self.property_b.id))
    
    def test_tenant_isolation_in_property_queries(self):
        """Property queries are properly filtered by tenant"""
        # Get properties for tenant A
        properties_a = Property.objects.filter(tenant=self.tenant_a)
        self.assertEqual(properties_a.count(), 1)
        self.assertEqual(properties_a.first(), self.property_a)
        
        # Get properties for tenant B
        properties_b = Property.objects.filter(tenant=self.tenant_b)
        self.assertEqual(properties_b.count(), 1)
        self.assertEqual(properties_b.first(), self.property_b)
        
        # Verify no cross-contamination
        self.assertNotEqual(properties_a.first(), properties_b.first())
    
    def test_tenant_isolation_in_document_queries(self):
        """Document queries are properly filtered by tenant"""
        # Create documents for both tenants
        doc_a = Document.objects.create(
            tenant=self.tenant_a,
            name="Document A",
            url="https://example.com/doc-a.pdf",
            size=1024,
            uploaded_by=self.user_a
        )
        
        doc_b = Document.objects.create(
            tenant=self.tenant_b,
            name="Document B",
            url="https://example.com/doc-b.pdf",
            size=2048,
            uploaded_by=self.user_b
        )
        
        # Get documents for tenant A
        documents_a = Document.objects.filter(tenant=self.tenant_a)
        self.assertEqual(documents_a.count(), 1)
        self.assertEqual(documents_a.first(), doc_a)
        
        # Get documents for tenant B
        documents_b = Document.objects.filter(tenant=self.tenant_b)
        self.assertEqual(documents_b.count(), 1)
        self.assertEqual(documents_b.first(), doc_b)
    
    def test_tenant_isolation_in_user_queries(self):
        """User queries are properly filtered by tenant"""
        # Get users for tenant A
        users_a = TenantUser.objects.filter(tenant=self.tenant_a, is_active=True)
        self.assertEqual(users_a.count(), 1)
        self.assertEqual(users_a.first().user, self.user_a)
        
        # Get users for tenant B
        users_b = TenantUser.objects.filter(tenant=self.tenant_b, is_active=True)
        self.assertEqual(users_b.count(), 1)
        self.assertEqual(users_b.first().user, self.user_b)
    
    def test_tenant_isolation_in_billing_queries(self):
        """Billing queries are properly filtered by tenant"""
        # Get billing for tenant A
        billing_a = BillingAccount.objects.filter(tenant=self.tenant_a)
        self.assertEqual(billing_a.count(), 1)
        self.assertEqual(billing_a.first(), self.billing_a)
        
        # Get billing for tenant B
        billing_b = BillingAccount.objects.filter(tenant=self.tenant_b)
        self.assertEqual(billing_b.count(), 1)
        self.assertEqual(billing_b.first(), self.billing_b)


@pytest.mark.asyncio
class TestAsyncTenantIsolation:
    """Async tenant isolation tests"""
    
    async def test_cross_tenant_property_access_blocked(
        self, tenant_a, tenant_b, user_a, user_b, property_a
    ):
        """User from Tenant B cannot access Property from Tenant A"""
        # User B tries to access Property A
        service = PropertiesService(str(tenant_b.id))
        
        # This should raise NotFoundError
        with pytest.raises(NotFoundError):
            await service.get_property(str(property_a.id))
    
    async def test_cross_tenant_document_access_blocked(
        self, tenant_a, tenant_b, user_a, user_b
    ):
        """User from Tenant B cannot access Document from Tenant A"""
        # Create document for tenant A
        document_a = await sync_to_async(Document.objects.create)(
            tenant=tenant_a,
            name="Secret Document A",
            url="https://example.com/secret-a.pdf",
            size=1024,
            uploaded_by=user_a
        )
        
        # User B tries to access Document A
        service = DocumentsService(str(tenant_b.id))
        
        # This should raise NotFoundError
        with pytest.raises(NotFoundError):
            await service.get_document(str(document_a.id))
    
    async def test_cross_tenant_user_access_blocked(
        self, tenant_a, tenant_b, user_a, user_b
    ):
        """User from Tenant B cannot see users from Tenant A"""
        service = UserService(str(tenant_b.id))
        
        # Get all users for tenant B
        users = await service.get_tenant_users()
        
        # Should only contain user B, not user A
        user_emails = [user.email for user in users]
        assert "user-b@example.com" in user_emails
        assert "user-a@example.com" not in user_emails
    
    async def test_cross_tenant_property_creation_blocked(
        self, tenant_a, tenant_b, user_a, user_b
    ):
        """User cannot create properties for other tenants"""
        service = PropertiesService(str(tenant_a.id))
        
        # User A tries to create property for Tenant B
        with pytest.raises(ValidationError):
            await service.create_property(
                title="Unauthorized Property",
                property_type="apartment",
                status="available",
                price=300000,
                area=80,
                rooms=2,
                created_by_id=str(user_a.id),
                tenant_id=str(tenant_b.id)  # Wrong tenant!
            )
    
    async def test_cross_tenant_property_update_blocked(
        self, tenant_a, tenant_b, user_a, user_b, property_a
    ):
        """User cannot update properties from other tenants"""
        service = PropertiesService(str(tenant_b.id))
        
        # User B tries to update Property A
        with pytest.raises(NotFoundError):
            await service.update_property(
                str(property_a.id),
                {"title": "Hacked Property"}
            )
    
    async def test_cross_tenant_property_deletion_blocked(
        self, tenant_a, tenant_b, user_a, user_b, property_a
    ):
        """User cannot delete properties from other tenants"""
        service = PropertiesService(str(tenant_b.id))
        
        # User B tries to delete Property A
        with pytest.raises(NotFoundError):
            await service.delete_property(str(property_a.id))
    
    async def test_tenant_isolation_in_async_queries(
        self, tenant_a, tenant_b, property_a, property_b
    ):
        """Async queries properly filter by tenant"""
        # Get properties for tenant A
        properties_a = await sync_to_async(list)(
            Property.objects.filter(tenant=tenant_a)
        )
        assert len(properties_a) == 1
        assert properties_a[0] == property_a
        
        # Get properties for tenant B
        properties_b = await sync_to_async(list)(
            Property.objects.filter(tenant=tenant_b)
        )
        assert len(properties_b) == 1
        assert properties_b[0] == property_b
        
        # Verify no cross-contamination
        assert properties_a[0] != properties_b[0]


class TestTenantIsolationEdgeCases(TenantIsolationTestCase):
    """Test edge cases in tenant isolation"""
    
    def test_tenant_with_no_users(self):
        """Test tenant with no active users"""
        # Create tenant with no users
        empty_tenant = Tenant.objects.create(
            name="Empty Tenant",
            slug="empty-tenant",
            company_email="empty@example.com",
            plan="free",
            max_users=2,
            max_properties=5,
            storage_limit_gb=1,
            is_active=True
        )
        
        # Verify no users
        users = TenantUser.objects.filter(tenant=empty_tenant, is_active=True)
        self.assertEqual(users.count(), 0)
    
    def test_tenant_with_inactive_users(self):
        """Test tenant with inactive users"""
        # Create inactive user
        inactive_user = User.objects.create(
            email="inactive@example.com",
            first_name="Inactive",
            last_name="User",
            is_active=False,
            email_verified=True
        )
        
        TenantUser.objects.create(
            user=inactive_user,
            tenant=self.tenant_a,
            role="agent",
            is_active=False  # Inactive tenant user
        )
        
        # Verify only active users are returned
        active_users = TenantUser.objects.filter(
            tenant=self.tenant_a, 
            is_active=True
        )
        self.assertEqual(active_users.count(), 1)
        self.assertEqual(active_users.first().user, self.user_a)
    
    def test_tenant_with_multiple_properties(self):
        """Test tenant with multiple properties"""
        # Create additional properties for tenant A
        property_a2 = Property.objects.create(
            tenant=self.tenant_a,
            title="Test Property A2",
            property_type="house",
            status="rented",
            price=600000,
            area=150,
            rooms=4,
            created_by=self.user_a
        )
        
        property_a3 = Property.objects.create(
            tenant=self.tenant_a,
            title="Test Property A3",
            property_type="commercial",
            status="available",
            price=800000,
            area=200,
            rooms=0,
            created_by=self.user_a
        )
        
        # Verify all properties belong to tenant A
        properties_a = Property.objects.filter(tenant=self.tenant_a)
        self.assertEqual(properties_a.count(), 3)
        
        # Verify properties don't belong to tenant B
        properties_b = Property.objects.filter(tenant=self.tenant_b)
        self.assertEqual(properties_b.count(), 1)
    
    def test_tenant_isolation_with_soft_deletes(self):
        """Test tenant isolation with soft deleted records"""
        # Soft delete property A
        self.property_a.is_active = False
        self.property_a.save()
        
        # Verify property A is not returned in active queries
        active_properties_a = Property.objects.filter(
            tenant=self.tenant_a,
            is_active=True
        )
        self.assertEqual(active_properties_a.count(), 0)
        
        # Verify property B is still active
        active_properties_b = Property.objects.filter(
            tenant=self.tenant_b,
            is_active=True
        )
        self.assertEqual(active_properties_b.count(), 1)
    
    def test_tenant_isolation_with_cascading_deletes(self):
        """Test tenant isolation with cascading deletes"""
        # Create document for property A
        document = Document.objects.create(
            tenant=self.tenant_a,
            name="Property Document",
            url="https://example.com/property-doc.pdf",
            size=1024,
            uploaded_by=self.user_a
        )
        
        # Delete tenant A
        self.tenant_a.delete()
        
        # Verify property A is deleted
        properties_a = Property.objects.filter(tenant=self.tenant_a)
        self.assertEqual(properties_a.count(), 0)
        
        # Verify document is deleted
        documents_a = Document.objects.filter(tenant=self.tenant_a)
        self.assertEqual(documents_a.count(), 0)
        
        # Verify tenant B data is unaffected
        properties_b = Property.objects.filter(tenant=self.tenant_b)
        self.assertEqual(properties_b.count(), 1)


@pytest.mark.asyncio
async def test_cross_tenant_file_access_blocked(
    tenant_a, tenant_b, user_a, user_b, property_image_a
):
    """Test: User von Tenant B darf File von Tenant A nicht über API zugreifen"""
    
    from app.services.storage_service import StorageService
    service = StorageService()
    
    # Versuche, File von Tenant A über Tenant B Service zu lesen
    try:
        file_content = await service.get_file_content(
            file_path=property_image_a.file.path,
            tenant_id=str(tenant_b.id)
        )
        assert False, "File-Zugriff sollte blockiert werden"
    except PermissionError:
        pass  # Erwartetes Verhalten


@pytest.mark.asyncio
async def test_cross_tenant_api_access_blocked(
    tenant_a, tenant_b, user_a, user_b, property_a, api_client
):
    """Test: User von Tenant B kann nicht über API auf Tenant A Daten zugreifen"""
    
    # Login als User B
    login_response = await api_client.post("/auth/login", json={
        "email": user_b.email,
        "password": "testpassword123"
    })
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Versuche, Property A über API zu lesen
    response = await api_client.get(
        f"/api/v1/properties/{property_a.id}",
        headers=headers
    )
    
    assert response.status_code == 404  # Property nicht gefunden (Tenant-Filter)


@pytest.mark.asyncio
async def test_cross_tenant_websocket_access_blocked(
    tenant_a, tenant_b, user_a, user_b, websocket_client
):
    """Test: User von Tenant B kann nicht auf Tenant A WebSocket-Räume zugreifen"""
    
    # Login als User B
    login_response = await websocket_client.post("/auth/login", json={
        "email": user_b.email,
        "password": "testpassword123"
    })
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    
    # Versuche, WebSocket-Verbindung zu Tenant A zu öffnen
    try:
        async with websocket_client.websocket_connect(
            f"/ws/kanban/{tenant_a.id}/",
            headers={"Authorization": f"Bearer {token}"}
        ) as websocket:
            # Sende Test-Nachricht
            await websocket.send_json({"type": "test_message"})
            response = await websocket.receive_json()
            
            # Sollte Fehler oder keine Daten von Tenant A zurückgeben
            assert response.get("error") is not None or response.get("data") is None
    except Exception as e:
        # WebSocket-Verbindung sollte fehlschlagen oder blockiert werden
        assert "permission" in str(e).lower() or "forbidden" in str(e).lower()


@pytest.mark.asyncio
async def test_tenant_isolation_in_bulk_operations(
    tenant_a, tenant_b, user_a, user_b, properties_a, properties_b
):
    """Test: Bulk-Operationen respektieren Tenant-Isolation"""
    
    from app.services.properties_service import PropertiesService
    
    # Service für Tenant A
    service_a = PropertiesService(tenant_id=str(tenant_a.id))
    properties_a_result = await service_a.get_properties()
    
    # Service für Tenant B  
    service_b = PropertiesService(tenant_id=str(tenant_b.id))
    properties_b_result = await service_b.get_properties()
    
    # Tenant A sollte nur seine Properties sehen
    assert len(properties_a_result) == len(properties_a)
    for prop in properties_a_result:
        assert prop.tenant_id == str(tenant_a.id)
    
    # Tenant B sollte nur seine Properties sehen
    assert len(properties_b_result) == len(properties_b)
    for prop in properties_b_result:
        assert prop.tenant_id == str(tenant_b.id)
    
    # Keine Überschneidungen
    tenant_a_ids = {prop.id for prop in properties_a_result}
    tenant_b_ids = {prop.id for prop in properties_b_result}
    assert len(tenant_a_ids.intersection(tenant_b_ids)) == 0


@pytest.mark.asyncio
async def test_cross_tenant_contact_access_blocked(
    tenant_a, tenant_b, user_a, user_b, contact_a
):
    """Test: User von Tenant B darf Contact von Tenant A nicht sehen"""
    
    from app.services.contacts_service import ContactsService
    service = ContactsService(tenant_id=str(tenant_b.id))
    
    contact = await service.get_contact(str(contact_a.id))
    
    assert contact is None  # Contact nicht gefunden (Tenant-Filter)


@pytest.mark.asyncio
async def test_cross_tenant_task_access_blocked(
    tenant_a, tenant_b, user_a, user_b, task_a
):
    """Test: User von Tenant B darf Task von Tenant A nicht sehen"""
    
    from app.services.tasks_service import TasksService
    service = TasksService(tenant_id=str(tenant_b.id))
    
    task = await service.get_task(str(task_a.id))
    
    assert task is None  # Task nicht gefunden (Tenant-Filter)
