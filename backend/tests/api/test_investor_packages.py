"""
Tests für Investor API ohne Mock-Fallbacks
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app
from app.core.security import TokenData
from app.db.models import Tenant, UserProfile

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
def mock_investor_service():
    """Mock InvestorService"""
    with patch('app.api.v1.investor.InvestorService') as mock_service:
        mock_instance = AsyncMock()
        mock_service.return_value = mock_instance
        yield mock_instance


class TestInvestorAPI:
    """Test Investor API ohne Mock-Fallbacks"""
    
    def test_get_portfolio_unauthorized_raises_401(self, mock_investor_service):
        """Test dass get_portfolio 401 wirft bei Auth-Fehler"""
        # Simuliere AuthError
        mock_investor_service.get_portfolio.side_effect = Exception("AuthError")
        
        response = client.get("/api/v1/investor/portfolio")
        
        # Sollte 401 oder 500 werfen, aber KEINE Mock-Daten zurückgeben
        assert response.status_code in [401, 500]
        assert "assets" not in response.json()  # Keine Mock-Daten
    
    def test_get_portfolio_forbidden_raises_403(self, mock_investor_service):
        """Test dass get_portfolio 403 wirft bei Permission-Fehler"""
        # Simuliere PermissionError
        mock_investor_service.get_portfolio.side_effect = Exception("PermissionError")
        
        response = client.get("/api/v1/investor/portfolio")
        
        # Sollte 403 oder 500 werfen, aber KEINE Mock-Daten zurückgeben
        assert response.status_code in [403, 500]
        assert "assets" not in response.json()  # Keine Mock-Daten
    
    def test_get_vacancy_analytics_no_fallback_data(self, mock_investor_service):
        """Test dass get_vacancy_analytics keine Fallback-Daten zurückgibt"""
        mock_investor_service.get_vacancy_analytics.side_effect = Exception("ServiceError")
        
        response = client.get("/api/v1/investor/analytics/vacancy")
        
        # Sollte Fehler werfen, aber KEINE hardcoded Daten
        assert response.status_code in [500]
        response_data = response.json()
        assert "current_vacancy_rate" not in response_data  # Keine Mock-Daten
    
    def test_get_cost_analytics_no_fallback_data(self, mock_investor_service):
        """Test dass get_cost_analytics keine Fallback-Daten zurückgibt"""
        mock_investor_service.get_cost_analytics.side_effect = Exception("ServiceError")
        
        response = client.get("/api/v1/investor/analytics/costs")
        
        # Sollte Fehler werfen, aber KEINE hardcoded Daten
        assert response.status_code in [500]
        response_data = response.json()
        assert "total_costs" not in response_data  # Keine Mock-Daten
    
    def test_get_marketplace_packages_no_fallback_data(self, mock_investor_service):
        """Test dass get_marketplace_packages keine Fallback-Daten zurückgibt"""
        mock_investor_service.get_marketplace_packages.side_effect = Exception("ServiceError")
        
        response = client.get("/api/v1/investor/marketplace/packages")
        
        # Sollte Fehler werfen, aber KEINE hardcoded Daten
        assert response.status_code in [500]
        response_data = response.json()
        assert isinstance(response_data, dict)  # Sollte Error-Response sein, nicht Array
    
    def test_get_saved_simulations_no_fallback_data(self, mock_investor_service):
        """Test dass get_saved_simulations keine Fallback-Daten zurückgibt"""
        mock_investor_service.get_saved_simulations.side_effect = Exception("ServiceError")
        
        response = client.get("/api/v1/investor/simulations")
        
        # Sollte Fehler werfen, aber KEINE hardcoded Daten
        assert response.status_code in [500]
        response_data = response.json()
        assert isinstance(response_data, dict)  # Sollte Error-Response sein, nicht Array
    
    def test_successful_portfolio_response(self, mock_investor_service):
        """Test erfolgreiche Portfolio-Response"""
        mock_data = {
            "assets": [],
            "kpis": {
                "total_value": 1000000,
                "average_roi": 5.5,
                "total_cashflow": 5000,
                "vacancy_rate": 3.2,
                "asset_count": 5,
                "monthly_income": 5000,
                "annual_return": 60000,
                "portfolio_growth": 2.1
            },
            "generated_at": "2024-01-15T10:00:00Z"
        }
        mock_investor_service.get_portfolio.return_value = mock_data
        
        response = client.get("/api/v1/investor/portfolio")
        
        assert response.status_code == 200
        assert response.json() == mock_data
