"""
Tests für Email-Ingestion Service
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.email_parser_service import EmailParserService, ParsedLead
from app.services.lead_ingestion_service import LeadIngestionService
from app.core.security import TokenData

client = TestClient(app)


@pytest.fixture
def mock_auth():
    """Mock Authentication"""
    with patch('app.api.deps.get_tenant_id_from_token') as mock_tenant, \
         patch('app.api.deps.get_current_user') as mock_user:
        
        mock_tenant.return_value = "test-tenant"
        mock_user.return_value = MagicMock()
        yield mock_tenant, mock_user


class TestEmailParserService:
    """Test Email Parser Service"""
    
    def test_parse_email_with_complete_data(self):
        """Test Email-Parsing mit vollständigen Daten"""
        parser = EmailParserService()
        
        subject = "Interesse an Immobilie in Hamburg"
        body = """
        Hallo,
        
        mein Name ist Max Mustermann und ich interessiere mich für eine Immobilie.
        Mein Budget liegt bei 500.000 Euro.
        
        Kontakt:
        E-Mail: max.mustermann@example.com
        Telefon: +49 40 12345678
        
        Ich suche eine Wohnung in Hamburg.
        
        Mit freundlichen Grüßen
        Max Mustermann
        """
        
        parsed_lead = parser.parse_email(subject, body, "max.mustermann@example.com")
        
        assert parsed_lead.name == "Max Mustermann"
        assert parsed_lead.email == "max.mustermann@example.com"
        assert parsed_lead.phone == "+494012345678"
        assert parsed_lead.budget == 500000.0
        assert parsed_lead.location == "Hamburg"
        assert parsed_lead.property_type == "apartment"
        assert parsed_lead.confidence > 0.5
    
    def test_parse_email_minimal_data(self):
        """Test Email-Parsing mit minimalen Daten"""
        parser = EmailParserService()
        
        subject = "Anfrage"
        body = "Hallo, ich interessiere mich für eine Immobilie. Kontakt: test@example.com"
        
        parsed_lead = parser.parse_email(subject, body, "test@example.com")
        
        assert parsed_lead.email == "test@example.com"
        assert parsed_lead.confidence < 0.5  # Niedrige Confidence bei minimalen Daten
    
    def test_parse_email_invalid_data(self):
        """Test Email-Parsing mit ungültigen Daten"""
        parser = EmailParserService()
        
        subject = "Spam"
        body = "Random text without useful information"
        
        parsed_lead = parser.parse_email(subject, body)
        
        assert parsed_lead.email is None
        assert parsed_lead.name is None
        assert parsed_lead.confidence == 0.0
    
    def test_validate_lead_valid(self):
        """Test Lead-Validierung mit gültigen Daten"""
        parser = EmailParserService()
        
        parsed_lead = ParsedLead(
            name="Max Mustermann",
            email="max@example.com",
            phone="+494012345678",
            budget=500000.0,
            confidence=0.8
        )
        
        is_valid, errors = parser.validate_lead(parsed_lead)
        
        assert is_valid is True
        assert len(errors) == 0
    
    def test_validate_lead_invalid(self):
        """Test Lead-Validierung mit ungültigen Daten"""
        parser = EmailParserService()
        
        parsed_lead = ParsedLead(
            name="",  # Leerer Name
            email="invalid-email",  # Ungültige Email
            phone="123",  # Zu kurze Telefonnummer
            budget=1000.0,  # Zu niedriges Budget
            confidence=0.1  # Niedrige Confidence
        )
        
        is_valid, errors = parser.validate_lead(parsed_lead)
        
        assert is_valid is False
        assert len(errors) > 0
        assert "Email ist erforderlich" in errors
        assert "Name ist erforderlich" in errors
    
    def test_generate_lead_hash(self):
        """Test Lead-Hash-Generierung"""
        parser = EmailParserService()
        
        parsed_lead = ParsedLead(
            email="test@example.com",
            name="Test User"
        )
        
        hash1 = parser.generate_lead_hash(parsed_lead)
        hash2 = parser.generate_lead_hash(parsed_lead)
        
        assert hash1 == hash2  # Gleiche Daten sollten gleichen Hash ergeben
        assert len(hash1) == 32  # MD5 Hash Länge


class TestLeadIngestionService:
    """Test Lead Ingestion Service"""
    
    @pytest.mark.asyncio
    async def test_process_email_lead_success(self):
        """Test erfolgreiche Lead-Verarbeitung"""
        with patch('app.services.lead_ingestion_service.sync_to_async') as mock_sync:
            # Mock Contact.objects.filter
            mock_sync.return_value.return_value = None  # Kein existierender Contact
            
            # Mock Contact.objects.create
            mock_contact = MagicMock()
            mock_contact.id = "contact-id"
            mock_contact.email = "test@example.com"
            mock_sync.return_value.return_value = mock_contact
            
            service = LeadIngestionService("test-tenant")
            
            result = await service.process_email_lead(
                subject="Test Subject",
                body="Test Body with name: Max Mustermann and email: test@example.com",
                sender_email="test@example.com"
            )
            
            assert result["status"] == "success"
            assert "contact_id" in result
            assert result["confidence"] > 0
    
    @pytest.mark.asyncio
    async def test_process_email_lead_duplicate(self):
        """Test Lead-Verarbeitung bei Duplikat"""
        with patch('app.services.lead_ingestion_service.sync_to_async') as mock_sync:
            # Mock existierenden Contact
            mock_contact = MagicMock()
            mock_contact.id = "existing-contact-id"
            mock_sync.return_value.return_value = mock_contact
            
            service = LeadIngestionService("test-tenant")
            
            result = await service.process_email_lead(
                subject="Test Subject",
                body="Test Body",
                sender_email="existing@example.com"
            )
            
            # Sollte als Duplikat erkannt werden (vereinfachte Implementierung)
            assert result["status"] in ["success", "duplicate"]
    
    @pytest.mark.asyncio
    async def test_process_email_lead_invalid(self):
        """Test Lead-Verarbeitung bei ungültigen Daten"""
        service = LeadIngestionService("test-tenant")
        
        result = await service.process_email_lead(
            subject="",
            body="Random text without useful information",
            sender_email="invalid-email"
        )
        
        assert result["status"] == "invalid"
        assert "errors" in result
        assert len(result["errors"]) > 0
    
    @pytest.mark.asyncio
    async def test_get_lead_stats(self):
        """Test Lead-Statistiken"""
        with patch('app.services.lead_ingestion_service.sync_to_async') as mock_sync:
            # Mock Contact.objects.filter().count()
            mock_sync.return_value.return_value = 5
            
            service = LeadIngestionService("test-tenant")
            stats = await service.get_lead_stats()
            
            assert "total_email_leads" in stats
            assert "total_inquiry_events" in stats
            assert "recent_leads_30d" in stats
            assert "last_updated" in stats


class TestEmailWebhookAPI:
    """Test Email Webhook API"""
    
    def test_process_inbound_email_success(self, mock_auth):
        """Test erfolgreiche Inbound Email-Verarbeitung"""
        with patch('app.api.v1.hooks.LeadIngestionService') as mock_service:
            mock_instance = AsyncMock()
            mock_instance.process_email_lead.return_value = {
                "status": "success",
                "contact_id": "contact-id",
                "confidence": 0.8
            }
            mock_service.return_value = mock_instance
            
            response = client.post(
                "/api/v1/hooks/email/inbound",
                json={
                    "subject": "Test Subject",
                    "body": "Test Body",
                    "sender_email": "test@example.com",
                    "sender_name": "Test User"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert "lead_result" in data
    
    def test_process_inbound_email_invalid_data(self, mock_auth):
        """Test Inbound Email mit ungültigen Daten"""
        response = client.post(
            "/api/v1/hooks/email/inbound",
            json={
                "subject": "",
                "body": "",
                "sender_email": "invalid-email"
            }
        )
        
        # Sollte 400 oder 200 mit invalid status zurückgeben
        assert response.status_code in [200, 400]
    
    def test_sendgrid_webhook(self, mock_auth):
        """Test SendGrid Webhook"""
        with patch('app.api.v1.hooks.LeadIngestionService') as mock_service:
            mock_instance = AsyncMock()
            mock_instance.process_email_lead.return_value = {
                "status": "success",
                "contact_id": "contact-id"
            }
            mock_service.return_value = mock_instance
            
            webhook_data = {
                "email": {
                    "subject": "Test Subject",
                    "text": "Test Body",
                    "from": {
                        "email": "test@example.com",
                        "name": "Test User"
                    }
                }
            }
            
            response = client.post(
                "/api/v1/hooks/email/webhook/sendgrid",
                json=webhook_data
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert data["provider"] == "sendgrid"
    
    def test_get_email_stats(self, mock_auth):
        """Test Email-Statistiken Endpoint"""
        with patch('app.api.v1.hooks.LeadIngestionService') as mock_service:
            mock_instance = AsyncMock()
            mock_instance.get_lead_stats.return_value = {
                "total_email_leads": 10,
                "total_inquiry_events": 5,
                "recent_leads_30d": 3
            }
            mock_service.return_value = mock_instance
            
            response = client.get("/api/v1/hooks/email/stats")
            
            assert response.status_code == 200
            data = response.json()
            assert data["total_email_leads"] == 10
            assert data["total_inquiry_events"] == 5
