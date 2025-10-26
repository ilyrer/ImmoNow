"""
Test Suite für AdminConsole HR APIs
Vollständige Tests für alle HR-Endpunkte (Urlaub, Anwesenheit, Überstunden, Spesen, Dokumente)
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import json
from datetime import datetime, date

# Test API Key (aus dem Plan)
API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMzVmZmRlZi05ZTA1LTQxZmMtOGNmOS04NmE5ZDY0NjYyOTkiLCJlbWFpbCI6Im5leHVyaS5zZXJ2dXNzc3NAZ21haWwuY29tIiwidGVuYW50X2lkIjoiNzE5MDQ0MDgtZjQ2Ny00ZjdlLWIxZjktMDZiM2Q4ZmM1MjRkIiwidGVuYW50X3NsdWciOiJzZXJ2dXMtZ21iaGhoIiwicm9sZSI6Im93bmVyIiwiZXhwIjoxNzYxMTQzMzI1LCJpYXQiOjE3NjExNDE1MjUsInR5cGUiOiJhY2Nlc3MiLCJzY29wZXMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIiwiYWRtaW4iXX0.pxW25aKify5dmEspAs-Sg8ySLEf1thHd1bpsfC0Zp0Y'

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "X-Tenant-ID": "71904408-f467-4f7e-b1f9-06b3d8fc524d"
}

# Test Employee ID
TEST_EMPLOYEE_ID = "14f7db5b-2272-406b-a02a-4fe9fcdfdfe9"


class TestLeaveRequestsAPI:
    """Test-Klasse für Leave Request APIs"""
    
    def test_get_leave_requests_success(self):
        """Test: GET /hr/leave-requests - Erfolgreiche Abfrage"""
        from app.main import app
        client = TestClient(app)
        
        response = client.get("/api/v1/hr/leave-requests", headers=HEADERS)
        
        assert response.status_code == 200
        data = response.json()
        assert "leave_requests" in data
        assert "total" in data
        assert "page" in data
        assert "size" in data
        assert "pages" in data
    
    def test_get_leave_requests_with_filters(self):
        """Test: GET /hr/leave-requests mit Filtern"""
        from app.main import app
        client = TestClient(app)
        
        filters = [
            {"employee_id": TEST_EMPLOYEE_ID},
            {"status": "pending"},
            {"status": "approved"},
            {"status": "rejected"},
            {"page": 1, "size": 10}
        ]
        
        for filter_params in filters:
            response = client.get("/api/v1/hr/leave-requests", headers=HEADERS, params=filter_params)
            assert response.status_code == 200
            data = response.json()
            assert "leave_requests" in data
    
    def test_create_leave_request_success(self):
        """Test: POST /hr/leave-requests - Erfolgreiche Erstellung"""
        from app.main import app
        client = TestClient(app)
        
        leave_data = {
            "start_date": "2024-02-01",
            "end_date": "2024-02-05",
            "leave_type": "vacation",
            "reason": "Urlaub",
            "days_count": 5
        }
        
        response = client.post(
            "/api/v1/hr/leave-requests",
            headers=HEADERS,
            json=leave_data
        )
        
        assert response.status_code == 201
        data = response.json()
        
        # Prüfe erforderliche Felder
        required_fields = [
            "id", "employee_id", "start_date", "end_date",
            "leave_type", "status", "days_count"
        ]
        for field in required_fields:
            assert field in data
    
    def test_approve_leave_request_success(self):
        """Test: PUT /hr/leave-requests/{id}/approve - Erfolgreiche Genehmigung"""
        from app.main import app
        client = TestClient(app)
        
        # Erstelle zuerst einen Leave Request
        leave_data = {
            "start_date": "2024-02-01",
            "end_date": "2024-02-05",
            "leave_type": "vacation",
            "reason": "Urlaub",
            "days_count": 5
        }
        
        create_response = client.post(
            "/api/v1/hr/leave-requests",
            headers=HEADERS,
            json=leave_data
        )
        
        if create_response.status_code == 201:
            leave_id = create_response.json()["id"]
            
            approval_data = {
                "approved": True,
                "manager_notes": "Genehmigt"
            }
            
            response = client.put(
                f"/api/v1/hr/leave-requests/{leave_id}/approve",
                headers=HEADERS,
                json=approval_data
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "approved"


class TestAttendanceAPI:
    """Test-Klasse für Attendance APIs"""
    
    def test_get_attendance_success(self):
        """Test: GET /hr/attendance - Erfolgreiche Abfrage"""
        from app.main import app
        client = TestClient(app)
        
        response = client.get("/api/v1/hr/attendance", headers=HEADERS)
        
        assert response.status_code == 200
        data = response.json()
        assert "attendance_records" in data
        assert "total" in data
    
    def test_get_attendance_with_filters(self):
        """Test: GET /hr/attendance mit Filtern"""
        from app.main import app
        client = TestClient(app)
        
        filters = [
            {"employee_id": TEST_EMPLOYEE_ID},
            {"start_date": "2024-01-01"},
            {"end_date": "2024-01-31"},
            {"page": 1, "size": 10}
        ]
        
        for filter_params in filters:
            response = client.get("/api/v1/hr/attendance", headers=HEADERS, params=filter_params)
            assert response.status_code == 200
            data = response.json()
            assert "attendance_records" in data
    
    def test_record_attendance_success(self):
        """Test: POST /hr/attendance - Erfolgreiche Erfassung"""
        from app.main import app
        client = TestClient(app)
        
        attendance_data = {
            "date": "2024-01-15",
            "check_in": "09:00",
            "check_out": "17:00",
            "notes": "Normaler Arbeitstag"
        }
        
        response = client.post(
            "/api/v1/hr/attendance",
            headers=HEADERS,
            json=attendance_data
        )
        
        assert response.status_code == 201
        data = response.json()
        
        required_fields = ["id", "employee_id", "date", "check_in", "check_out"]
        for field in required_fields:
            assert field in data


class TestOvertimeAPI:
    """Test-Klasse für Overtime APIs"""
    
    def test_get_overtime_success(self):
        """Test: GET /hr/overtime - Erfolgreiche Abfrage"""
        from app.main import app
        client = TestClient(app)
        
        response = client.get("/api/v1/hr/overtime", headers=HEADERS)
        
        assert response.status_code == 200
        data = response.json()
        assert "overtime_records" in data
        assert "total" in data
    
    def test_get_overtime_with_filters(self):
        """Test: GET /hr/overtime mit Filtern"""
        from app.main import app
        client = TestClient(app)
        
        filters = [
            {"employee_id": TEST_EMPLOYEE_ID},
            {"approved": True},
            {"approved": False},
            {"page": 1, "size": 10}
        ]
        
        for filter_params in filters:
            response = client.get("/api/v1/hr/overtime", headers=HEADERS, params=filter_params)
            assert response.status_code == 200
            data = response.json()
            assert "overtime_records" in data
    
    def test_submit_overtime_success(self):
        """Test: POST /hr/overtime - Erfolgreiche Einreichung"""
        from app.main import app
        client = TestClient(app)
        
        overtime_data = {
            "date": "2024-01-15",
            "hours": 2.5,
            "reason": "Projektabschluss",
            "notes": "Zusätzliche Arbeit am Projekt"
        }
        
        response = client.post(
            "/api/v1/hr/overtime",
            headers=HEADERS,
            json=overtime_data
        )
        
        assert response.status_code == 201
        data = response.json()
        
        required_fields = ["id", "employee_id", "date", "hours", "reason"]
        for field in required_fields:
            assert field in data
    
    def test_approve_overtime_success(self):
        """Test: PUT /hr/overtime/{id}/approve - Erfolgreiche Genehmigung"""
        from app.main import app
        client = TestClient(app)
        
        # Erstelle zuerst Overtime
        overtime_data = {
            "date": "2024-01-15",
            "hours": 2.5,
            "reason": "Projektabschluss"
        }
        
        create_response = client.post(
            "/api/v1/hr/overtime",
            headers=HEADERS,
            json=overtime_data
        )
        
        if create_response.status_code == 201:
            overtime_id = create_response.json()["id"]
            
            approval_data = {
                "approved": True,
                "manager_notes": "Genehmigt"
            }
            
            response = client.put(
                f"/api/v1/hr/overtime/{overtime_id}/approve",
                headers=HEADERS,
                json=approval_data
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["approved"] == True


class TestExpensesAPI:
    """Test-Klasse für Expenses APIs"""
    
    def test_get_expenses_success(self):
        """Test: GET /hr/expenses - Erfolgreiche Abfrage"""
        from app.main import app
        client = TestClient(app)
        
        response = client.get("/api/v1/hr/expenses", headers=HEADERS)
        
        assert response.status_code == 200
        data = response.json()
        assert "expenses" in data
        assert "total" in data
    
    def test_get_expenses_with_filters(self):
        """Test: GET /hr/expenses mit Filtern"""
        from app.main import app
        client = TestClient(app)
        
        filters = [
            {"employee_id": TEST_EMPLOYEE_ID},
            {"status": "pending"},
            {"status": "approved"},
            {"status": "rejected"},
            {"page": 1, "size": 10}
        ]
        
        for filter_params in filters:
            response = client.get("/api/v1/hr/expenses", headers=HEADERS, params=filter_params)
            assert response.status_code == 200
            data = response.json()
            assert "expenses" in data
    
    def test_submit_expense_success(self):
        """Test: POST /hr/expenses - Erfolgreiche Einreichung"""
        from app.main import app
        client = TestClient(app)
        
        expense_data = {
            "date": "2024-01-15",
            "amount": 25.50,
            "category": "travel",
            "description": "Taxi zum Kunden",
            "receipt_number": "R123456"
        }
        
        response = client.post(
            "/api/v1/hr/expenses",
            headers=HEADERS,
            json=expense_data
        )
        
        assert response.status_code == 201
        data = response.json()
        
        required_fields = ["id", "employee_id", "date", "amount", "category", "description"]
        for field in required_fields:
            assert field in data
    
    def test_approve_expense_success(self):
        """Test: PUT /hr/expenses/{id}/approve - Erfolgreiche Genehmigung"""
        from app.main import app
        client = TestClient(app)
        
        # Erstelle zuerst Expense
        expense_data = {
            "date": "2024-01-15",
            "amount": 25.50,
            "category": "travel",
            "description": "Taxi zum Kunden"
        }
        
        create_response = client.post(
            "/api/v1/hr/expenses",
            headers=HEADERS,
            json=expense_data
        )
        
        if create_response.status_code == 201:
            expense_id = create_response.json()["id"]
            
            approval_data = {
                "approved": True,
                "manager_notes": "Genehmigt"
            }
            
            response = client.put(
                f"/api/v1/hr/expenses/{expense_id}/approve",
                headers=HEADERS,
                json=approval_data
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "approved"


class TestDocumentsAPI:
    """Test-Klasse für Documents APIs"""
    
    def test_get_documents_success(self):
        """Test: GET /hr/documents/{employee_id} - Erfolgreiche Abfrage"""
        from app.main import app
        client = TestClient(app)
        
        response = client.get(f"/api/v1/hr/documents/{TEST_EMPLOYEE_ID}", headers=HEADERS)
        
        assert response.status_code == 200
        data = response.json()
        assert "documents" in data
        assert "total" in data
    
    def test_get_documents_with_filters(self):
        """Test: GET /hr/documents/{employee_id} mit Filtern"""
        from app.main import app
        client = TestClient(app)
        
        filters = [
            {"document_type": "contract"},
            {"document_type": "certificate"},
            {"page": 1, "size": 10}
        ]
        
        for filter_params in filters:
            response = client.get(
                f"/api/v1/hr/documents/{TEST_EMPLOYEE_ID}",
                headers=HEADERS,
                params=filter_params
            )
            assert response.status_code == 200
            data = response.json()
            assert "documents" in data
    
    def test_upload_document_success(self):
        """Test: POST /hr/documents/upload - Erfolgreiche Upload"""
        from app.main import app
        client = TestClient(app)
        
        # Simuliere File Upload
        files = {
            "file": ("test_document.pdf", b"fake pdf content", "application/pdf")
        }
        
        data = {
            "employee_id": TEST_EMPLOYEE_ID,
            "document_type": "contract",
            "description": "Arbeitsvertrag"
        }
        
        response = client.post(
            "/api/v1/hr/documents/upload",
            headers=HEADERS,
            files=files,
            data=data
        )
        
        assert response.status_code == 201
        response_data = response.json()
        
        required_fields = ["id", "employee_id", "document_type", "file_name"]
        for field in required_fields:
            assert field in response_data
    
    def test_download_document_success(self):
        """Test: GET /hr/documents/{document_id}/download - Erfolgreicher Download"""
        from app.main import app
        client = TestClient(app)
        
        # Test mit einem Dummy-Document ID
        test_document_id = "test-document-id"
        
        response = client.get(
            f"/api/v1/hr/documents/{test_document_id}/download",
            headers=HEADERS
        )
        
        # Kann 200 (Download) oder 404 (nicht gefunden) sein
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            assert "content-type" in response.headers


class TestHRValidation:
    """Test-Klasse für HR-Validierung"""
    
    def test_invalid_date_formats(self):
        """Test: Ungültige Datumsformate"""
        from app.main import app
        client = TestClient(app)
        
        invalid_dates = [
            "invalid-date",
            "2024-13-01",  # Ungültiger Monat
            "2024-01-32",  # Ungültiger Tag
            "01-01-2024",  # Falsches Format
        ]
        
        for invalid_date in invalid_dates:
            response = client.get(
                "/api/v1/hr/attendance",
                headers=HEADERS,
                params={"start_date": invalid_date}
            )
            assert response.status_code == 400
    
    def test_invalid_amount_values(self):
        """Test: Ungültige Beträge"""
        from app.main import app
        client = TestClient(app)
        
        invalid_amounts = [
            -10.50,  # Negativer Betrag
            0,       # Null-Betrag
            "invalid",  # String statt Zahl
        ]
        
        for amount in invalid_amounts:
            expense_data = {
                "date": "2024-01-15",
                "amount": amount,
                "category": "travel",
                "description": "Test"
            }
            
            response = client.post(
                "/api/v1/hr/expenses",
                headers=HEADERS,
                json=expense_data
            )
            assert response.status_code in [400, 422]
    
    def test_invalid_hours_values(self):
        """Test: Ungültige Stunden-Werte"""
        from app.main import app
        client = TestClient(app)
        
        invalid_hours = [
            -2.5,    # Negative Stunden
            0,       # Null-Stunden
            "invalid",  # String statt Zahl
        ]
        
        for hours in invalid_hours:
            overtime_data = {
                "date": "2024-01-15",
                "hours": hours,
                "reason": "Test"
            }
            
            response = client.post(
                "/api/v1/hr/overtime",
                headers=HEADERS,
                json=overtime_data
            )
            assert response.status_code in [400, 422]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
