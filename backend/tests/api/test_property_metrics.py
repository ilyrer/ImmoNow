"""
Tests für Property Metrics API
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
from app.main import app
from app.core.security import TokenData
from app.db.models import Property, PropertyViewEvent, PropertyInquiryEvent, Tenant

client = TestClient(app)


@pytest.fixture
def mock_auth():
    """Mock Authentication"""
    with patch('app.api.deps.require_read_scope') as mock_read, \
         patch('app.api.deps.get_tenant_id') as mock_tenant:
        
        mock_read.return_value = TokenData(
            sub="test-user",
            tenant_id="test-tenant",
            scopes=["read"]
        )
        mock_tenant.return_value = "test-tenant"
        yield mock_read, mock_tenant


@pytest.fixture
def mock_property():
    """Mock Property"""
    property = MagicMock()
    property.id = "test-property-id"
    property.title = "Test Property"
    property.tenant_id = "test-tenant"
    property.created_at = "2024-01-01T00:00:00Z"
    return property


@pytest.fixture
def mock_property_metrics_service():
    """Mock PropertyMetricsService"""
    with patch('app.api.v1.property_metrics.PropertyMetricsService') as mock_service:
        mock_instance = AsyncMock()
        mock_service.return_value = mock_instance
        yield mock_instance


class TestPropertyMetricsAPI:
    """Test Property Metrics API"""
    
    def test_track_property_view_success(self, mock_property_metrics_service, mock_property):
        """Test erfolgreiches Property View Tracking"""
        mock_event = MagicMock()
        mock_event.id = "event-id"
        mock_event.created_at = "2024-01-15T10:00:00Z"
        mock_property_metrics_service.track_property_view.return_value = mock_event
        
        response = client.post("/api/v1/analytics/properties/test-property-id/track-view")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["property_id"] == "test-property-id"
        assert "event_id" in data
        assert "tracked_at" in data
    
    def test_track_property_view_property_not_found(self, mock_property_metrics_service):
        """Test Property View Tracking wenn Property nicht existiert"""
        from app.core.errors import NotFoundError
        mock_property_metrics_service.track_property_view.side_effect = NotFoundError("Property not found")
        
        response = client.post("/api/v1/analytics/properties/non-existent-id/track-view")
        
        assert response.status_code == 404
        assert "Property not found" in response.json()["detail"]
    
    def test_track_property_inquiry_success(self, mock_property_metrics_service):
        """Test erfolgreiches Property Inquiry Tracking"""
        mock_event = MagicMock()
        mock_event.id = "inquiry-id"
        mock_event.created_at = "2024-01-15T10:00:00Z"
        mock_property_metrics_service.track_property_inquiry.return_value = mock_event
        
        inquiry_data = {
            "contact_name": "John Doe",
            "contact_email": "john@example.com",
            "contact_phone": "+49123456789",
            "source": "web",
            "inquiry_type": "general",
            "message": "Interested in this property"
        }
        
        response = client.post(
            "/api/v1/analytics/properties/test-property-id/track-inquiry",
            json=inquiry_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["property_id"] == "test-property-id"
        assert "event_id" in data
        assert "tracked_at" in data
    
    def test_get_property_metrics_success(self, mock_property_metrics_service):
        """Test erfolgreiche Property Metrics Abfrage"""
        mock_metrics = {
            "property_id": "test-property-id",
            "property_title": "Test Property",
            "views": 150,
            "inquiries": 12,
            "dom": 45,
            "recent_views": 25,
            "recent_inquiries": 3,
            "conversion_rate": 8.0,
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z",
            "last_updated": "2024-01-15T10:00:00Z"
        }
        mock_property_metrics_service.get_property_metrics.return_value = mock_metrics
        
        response = client.get("/api/v1/analytics/properties/test-property-id/metrics")
        
        assert response.status_code == 200
        data = response.json()
        assert data["property_id"] == "test-property-id"
        assert data["views"] == 150
        assert data["inquiries"] == 12
        assert data["dom"] == 45
        assert data["conversion_rate"] == 8.0
    
    def test_get_property_metrics_not_found(self, mock_property_metrics_service):
        """Test Property Metrics wenn Property nicht existiert"""
        from app.core.errors import NotFoundError
        mock_property_metrics_service.get_property_metrics.side_effect = NotFoundError("Property not found")
        
        response = client.get("/api/v1/analytics/properties/non-existent-id/metrics")
        
        assert response.status_code == 404
        assert "Property not found" in response.json()["detail"]
    
    def test_get_top_performing_properties(self, mock_property_metrics_service):
        """Test Top Performing Properties Abfrage"""
        mock_properties = [
            {
                "property_id": "prop-1",
                "title": "Property 1",
                "location": "Hamburg",
                "price": 500000,
                "status": "active",
                "views": 200,
                "inquiries": 15,
                "dom": 30,
                "conversion_rate": 7.5,
                "property_type": "apartment",
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "property_id": "prop-2",
                "title": "Property 2",
                "location": "Berlin",
                "price": 750000,
                "status": "active",
                "views": 180,
                "inquiries": 12,
                "dom": 45,
                "conversion_rate": 6.7,
                "property_type": "house",
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
        mock_property_metrics_service.get_top_performing_properties.return_value = mock_properties
        
        response = client.get("/api/v1/analytics/properties/top?limit=2&period_days=30")
        
        assert response.status_code == 200
        data = response.json()
        assert "top_properties" in data
        assert len(data["top_properties"]) == 2
        assert data["period_days"] == 30
        assert data["limit"] == 2
        assert "generated_at" in data
    
    def test_get_property_analytics_summary(self, mock_property_metrics_service):
        """Test Property Analytics Summary"""
        mock_summary = {
            "total_properties": 25,
            "total_views": 1500,
            "total_inquiries": 120,
            "avg_views_per_property": 60.0,
            "avg_inquiries_per_property": 4.8,
            "conversion_rate": 8.0,
            "recent_views_30d": 300,
            "recent_inquiries_30d": 25,
            "last_updated": "2024-01-15T10:00:00Z"
        }
        mock_property_metrics_service.get_property_analytics_summary.return_value = mock_summary
        
        response = client.get("/api/v1/analytics/properties/summary")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_properties"] == 25
        assert data["total_views"] == 1500
        assert data["total_inquiries"] == 120
        assert data["avg_views_per_property"] == 60.0
        assert data["conversion_rate"] == 8.0
    
    def test_get_property_view_trend(self, mock_property_metrics_service):
        """Test Property View Trend"""
        mock_trend = [
            {"date": "2024-01-01", "views": 5},
            {"date": "2024-01-02", "views": 8},
            {"date": "2024-01-03", "views": 12},
            {"date": "2024-01-04", "views": 7},
            {"date": "2024-01-05", "views": 15}
        ]
        mock_property_metrics_service.get_property_view_trend.return_value = mock_trend
        
        response = client.get("/api/v1/analytics/properties/test-property-id/view-trend?days=5")
        
        assert response.status_code == 200
        data = response.json()
        assert data["property_id"] == "test-property-id"
        assert "trend_data" in data
        assert len(data["trend_data"]) == 5
        assert data["period_days"] == 5
        assert "generated_at" in data
    
    def test_get_property_view_trend_not_found(self, mock_property_metrics_service):
        """Test Property View Trend wenn Property nicht existiert"""
        from app.core.errors import NotFoundError
        mock_property_metrics_service.get_property_view_trend.side_effect = NotFoundError("Property not found")
        
        response = client.get("/api/v1/analytics/properties/non-existent-id/view-trend")
        
        assert response.status_code == 404
        assert "Property not found" in response.json()["detail"]
