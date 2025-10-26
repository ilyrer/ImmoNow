"""
Test Suite für AdminConsole Employee APIs
Vollständige Tests für alle Employee-Endpunkte
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import json

# Test API Key (aus dem Plan)
API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMzVmZmRlZi05ZTA1LTQxZmMtOGNmOS04NmE5ZDY0NjYyOTkiLCJlbWFpbCI6Im5leHVyaS5zZXJ2dXNzc3NAZ21haWwuY29tIiwidGVuYW50X2lkIjoiNzE5MDQ0MDgtZjQ2Ny00ZjdlLWIxZjktMDZiM2Q4ZmM1MjRkIiwidGVuYW50X3NsdWciOiJzZXJ2dXMtZ21iaGhoIiwicm9sZSI6Im93bmVyIiwiZXhwIjoxNzYxMTQzMzI1LCJpYXQiOjE3NjExNDE1MjUsInR5cGUiOiJhY2Nlc3MiLCJzY29wZXMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIiwiYWRtaW4iXX0.pxW25aKify5dmEspAs-Sg8ySLEf1thHd1bpsfC0Zp0Y'

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "X-Tenant-ID": "71904408-f467-4f7e-b1f9-06b3d8fc524d"
}

# Test Employee ID
TEST_EMPLOYEE_ID = "14f7db5b-2272-406b-a02a-4fe9fcdfdfe9"

class TestEmployeesAPI:
    """Test-Klasse für Employee APIs"""
    
    def test_get_employees_success(self):
        """Test: GET /admin/employees - Erfolgreiche Abfrage"""
        from app.main import app
        client = TestClient(app)
        
        response = client.get("/api/v1/admin/employees", headers=HEADERS)
        
        assert response.status_code == 200
        data = response.json()
        assert "employees" in data
        assert "total" in data
        assert "page" in data
        assert "size" in data
        assert "pages" in data
        
        # Prüfe Struktur der Employee-Objekte
        if data["employees"]:
            employee = data["employees"][0]
            required_fields = [
                "id", "user_id", "user_first_name", "user_last_name", 
                "user_email", "employee_number", "department", "position"
            ]
            for field in required_fields:
                assert field in employee
    
    def test_get_employees_with_filters(self):
        """Test: GET /admin/employees mit Filtern"""
        from app.main import app
        client = TestClient(app)
        
        # Test mit verschiedenen Filtern
        filters = [
            {"search": "test"},
            {"department": "IT"},
            {"position": "Manager"},
            {"is_active": True},
            {"page": 1, "size": 10}
        ]
        
        for filter_params in filters:
            response = client.get("/api/v1/admin/employees", headers=HEADERS, params=filter_params)
            assert response.status_code == 200
            data = response.json()
            assert "employees" in data
    
    def test_get_employee_stats_success(self):
        """Test: GET /admin/employees/stats - Erfolgreiche Statistiken"""
        from app.main import app
        client = TestClient(app)
        
        response = client.get("/api/v1/admin/employees/stats", headers=HEADERS)
        
        assert response.status_code == 200
        data = response.json()
        
        # Prüfe erforderliche Statistik-Felder
        required_stats = [
            "total_employees", "active_employees", "inactive_employees",
            "employees_by_department", "employees_by_position", 
            "employees_by_employment_type", "average_tenure_months",
            "employees_on_leave", "recent_hires", "upcoming_anniversaries"
        ]
        
        for stat in required_stats:
            assert stat in data
    
    def test_get_employee_detail_success(self):
        """Test: GET /admin/employees/{id}/detail - Erfolgreiche Detail-Abfrage"""
        from app.main import app
        client = TestClient(app)
        
        response = client.get(
            f"/api/v1/admin/employees/{TEST_EMPLOYEE_ID}/detail",
            headers=HEADERS
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Prüfe erforderliche Detail-Felder
        required_fields = [
            "id", "employee_number", "full_name", "email", "department",
            "position", "employment_type", "is_active", "created_at", "updated_at"
        ]
        
        for field in required_fields:
            assert field in data
    
    def test_update_employee_detail_success(self):
        """Test: PUT /admin/employees/{id}/detail - Erfolgreiche Aktualisierung"""
        from app.main import app
        client = TestClient(app)
        
        update_data = {
            "department": "IT",
            "position": "Senior Developer",
            "work_email": "test@company.com"
        }
        
        response = client.put(
            f"/api/v1/admin/employees/{TEST_EMPLOYEE_ID}/detail",
            headers=HEADERS,
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Prüfe, dass die Daten aktualisiert wurden
        assert data["department"] == "IT"
        assert data["position"] == "Senior Developer"
        assert data["work_email"] == "test@company.com"
    
    def test_get_employee_compensation_success(self):
        """Test: GET /admin/employees/{id}/compensation - Erfolgreiche Vergütungs-Abfrage"""
        from app.main import app
        client = TestClient(app)
        
        response = client.get(
            f"/api/v1/admin/employees/{TEST_EMPLOYEE_ID}/compensation",
            headers=HEADERS
        )
        
        # Kann 200 (mit Daten) oder 404 (keine Vergütung) sein
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            required_fields = [
                "id", "employee_id", "employee_name", "base_salary",
                "currency", "gross_amount", "net_amount"
            ]
            for field in required_fields:
                assert field in data
    
    def test_get_employee_payslips_success(self):
        """Test: GET /admin/employees/{id}/payslips - Erfolgreiche Lohnabrechnungen"""
        from app.main import app
        client = TestClient(app)
        
        response = client.get(
            f"/api/v1/admin/employees/{TEST_EMPLOYEE_ID}/payslips",
            headers=HEADERS
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "payslips" in data
        assert "total" in data
    
    def test_download_payslip_pdf_success(self):
        """Test: GET /admin/employees/{id}/payslips/{payslip_id}/pdf - PDF Download"""
        from app.main import app
        client = TestClient(app)
        
        # Test mit einem Dummy-Payslip ID
        test_payslip_id = "test-payslip-id"
        
        response = client.get(
            f"/api/v1/admin/employees/{TEST_EMPLOYEE_ID}/payslips/{test_payslip_id}/pdf",
            headers=HEADERS
        )
        
        # Kann 200 (PDF) oder 404 (nicht gefunden) sein
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            assert response.headers["content-type"] == "application/pdf"
    
    def test_unauthorized_access(self):
        """Test: Unauthorisierter Zugriff"""
        from app.main import app
        client = TestClient(app)
        
        # Test ohne Authorization Header
        response = client.get("/api/v1/admin/employees")
        assert response.status_code == 401
    
    def test_invalid_employee_id(self):
        """Test: Ungültige Employee ID"""
        from app.main import app
        client = TestClient(app)
        
        invalid_id = "invalid-uuid"
        response = client.get(
            f"/api/v1/admin/employees/{invalid_id}/detail",
            headers=HEADERS
        )
        
        # Sollte 404 oder 400 zurückgeben
        assert response.status_code in [400, 404]
    
    def test_pagination_parameters(self):
        """Test: Paginierung-Parameter"""
        from app.main import app
        client = TestClient(app)
        
        # Test verschiedene Paginierung-Parameter
        pagination_tests = [
            {"page": 1, "size": 5},
            {"page": 2, "size": 10},
            {"page": 1, "size": 100},  # Max size
        ]
        
        for params in pagination_tests:
            response = client.get("/api/v1/admin/employees", headers=HEADERS, params=params)
            assert response.status_code == 200
            data = response.json()
            assert data["page"] == params["page"]
            assert data["size"] == params["size"]
            assert len(data["employees"]) <= params["size"]


class TestEmployeeValidation:
    """Test-Klasse für Employee-Validierung"""
    
    def test_invalid_page_parameter(self):
        """Test: Ungültige Page-Parameter"""
        from app.main import app
        client = TestClient(app)
        
        invalid_params = [
            {"page": 0},  # Page muss >= 1 sein
            {"page": -1},
            {"size": 0},  # Size muss >= 1 sein
            {"size": 101},  # Size muss <= 100 sein
        ]
        
        for params in invalid_params:
            response = client.get("/api/v1/admin/employees", headers=HEADERS, params=params)
            assert response.status_code == 422  # Validation Error
    
    def test_invalid_update_data(self):
        """Test: Ungültige Update-Daten"""
        from app.main import app
        client = TestClient(app)
        
        invalid_updates = [
            {"department": ""},  # Leere Strings
            {"position": None},  # None-Werte
            {"invalid_field": "test"},  # Ungültige Felder
        ]
        
        for update_data in invalid_updates:
            response = client.put(
                f"/api/v1/admin/employees/{TEST_EMPLOYEE_ID}/detail",
                headers=HEADERS,
                json=update_data
            )
            # Kann 200 (ignoriert ungültige Felder) oder 422 (Validation Error) sein
            assert response.status_code in [200, 422]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
