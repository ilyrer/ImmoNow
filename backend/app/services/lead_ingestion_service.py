"""
Lead Ingestion Service für Email-basierte Lead-Erfassung
"""
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from asgiref.sync import sync_to_async

from app.db.models import Contact, Tenant, PropertyInquiryEvent
from app.services.email_parser_service import EmailParserService, ParsedLead
from app.core.errors import NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class LeadIngestionService:
    """Service für Lead-Ingestion und Deduplication"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.email_parser = EmailParserService()
    
    async def process_email_lead(
        self,
        subject: str,
        body: str,
        sender_email: str,
        sender_name: Optional[str] = None,
        property_id: Optional[str] = None,
        source_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Verarbeite Email-Lead
        
        Args:
            subject: Email-Betreff
            body: Email-Body
            sender_email: Absender-Email
            sender_name: Absender-Name (optional)
            property_id: Property-ID falls spezifisch
            source_url: Quelle-URL (optional)
            
        Returns:
            Dict mit Lead-Status und Details
        """
        try:
            # Parse Email
            parsed_lead = self.email_parser.parse_email(subject, body, sender_email)
            
            # Validiere Lead
            is_valid, validation_errors = self.email_parser.validate_lead(parsed_lead)
            
            if not is_valid:
                logger.warning(f"Invalid lead from {sender_email}: {validation_errors}")
                return {
                    "status": "invalid",
                    "errors": validation_errors,
                    "confidence": parsed_lead.confidence
                }
            
            # Prüfe auf Duplikate
            lead_hash = self.email_parser.generate_lead_hash(parsed_lead)
            is_duplicate = await self._check_duplicate(lead_hash)
            
            if is_duplicate:
                logger.info(f"Duplicate lead detected: {sender_email}")
                return {
                    "status": "duplicate",
                    "message": "Lead bereits vorhanden",
                    "confidence": parsed_lead.confidence
                }
            
            # Erstelle oder aktualisiere Contact
            contact = await self._create_or_update_contact(parsed_lead, sender_name)
            
            # Erstelle Inquiry Event falls Property spezifiziert
            inquiry_event = None
            if property_id:
                inquiry_event = await self._create_inquiry_event(
                    contact, property_id, parsed_lead, source_url
                )
            
            # Speichere Lead-Hash für Deduplication
            await self._save_lead_hash(lead_hash, contact.id)
            
            logger.info(f"Successfully processed lead: {contact.email} (confidence: {parsed_lead.confidence})")
            
            return {
                "status": "success",
                "contact_id": str(contact.id),
                "inquiry_event_id": str(inquiry_event.id) if inquiry_event else None,
                "confidence": parsed_lead.confidence,
                "is_new_contact": True  # TODO: Implementiere Check für existierende Contacts
            }
            
        except Exception as e:
            logger.error(f"Error processing email lead: {e}")
            return {
                "status": "error",
                "message": f"Fehler bei Lead-Verarbeitung: {str(e)}"
            }
    
    async def _check_duplicate(self, lead_hash: str) -> bool:
        """Prüfe auf Lead-Duplikate"""
        try:
            # TODO: Implementiere LeadHash Model für Deduplication
            # Für jetzt: Prüfe über Contact-Email
            from app.db.models import Contact
            
            # Vereinfachte Duplikat-Prüfung über Email
            # In Production: Verwende dediziertes LeadHash Model
            return False  # Placeholder
            
        except Exception as e:
            logger.error(f"Error checking duplicate: {e}")
            return False
    
    async def _create_or_update_contact(self, parsed_lead: ParsedLead, sender_name: Optional[str] = None) -> Contact:
        """Erstelle oder aktualisiere Contact"""
        try:
            # Prüfe ob Contact bereits existiert
            existing_contact = await sync_to_async(Contact.objects.filter(
                tenant_id=self.tenant_id,
                email=parsed_lead.email
            ).first)()
            
            if existing_contact:
                # Aktualisiere existierenden Contact
                await sync_to_async(existing_contact.__setattr__)('name', parsed_lead.name or existing_contact.name)
                await sync_to_async(existing_contact.__setattr__)('phone', parsed_lead.phone or existing_contact.phone)
                await sync_to_async(existing_contact.save)()
                return existing_contact
            
            # Erstelle neuen Contact
            contact_data = {
                'tenant_id': self.tenant_id,
                'name': parsed_lead.name or sender_name or 'Unbekannt',
                'email': parsed_lead.email,
                'phone': parsed_lead.phone,
                'source': 'email',
                'notes': f"Lead aus Email (Confidence: {parsed_lead.confidence:.2f})"
            }
            
            contact = await sync_to_async(Contact.objects.create)(**contact_data)
            return contact
            
        except Exception as e:
            logger.error(f"Error creating/updating contact: {e}")
            raise
    
    async def _create_inquiry_event(
        self,
        contact: Contact,
        property_id: str,
        parsed_lead: ParsedLead,
        source_url: Optional[str] = None
    ) -> PropertyInquiryEvent:
        """Erstelle Property Inquiry Event"""
        try:
            # Verifiziere dass Property existiert
            from app.db.models import Property
            property_obj = await sync_to_async(Property.objects.get)(
                id=property_id,
                tenant_id=self.tenant_id
            )
            
            # Erstelle Inquiry Event
            inquiry_data = {
                'tenant_id': self.tenant_id,
                'property': property_obj,
                'contact': contact,
                'contact_name': contact.name,
                'contact_email': contact.email,
                'contact_phone': contact.phone,
                'source': 'email',
                'inquiry_type': 'general',
                'message': parsed_lead.message or f"Email-Anfrage: {parsed_lead.raw_text[:200]}..."
            }
            
            inquiry_event = await sync_to_async(PropertyInquiryEvent.objects.create)(**inquiry_data)
            return inquiry_event
            
        except Property.DoesNotExist:
            raise NotFoundError(f"Property {property_id} not found")
        except Exception as e:
            logger.error(f"Error creating inquiry event: {e}")
            raise
    
    async def _save_lead_hash(self, lead_hash: str, contact_id: str):
        """Speichere Lead-Hash für Deduplication"""
        try:
            # TODO: Implementiere LeadHash Model
            # Für jetzt: Log für Debugging
            logger.info(f"Lead hash saved: {lead_hash} for contact {contact_id}")
            
        except Exception as e:
            logger.error(f"Error saving lead hash: {e}")
    
    async def get_lead_stats(self) -> Dict[str, Any]:
        """Hole Lead-Statistiken für Tenant"""
        try:
            from app.db.models import Contact, PropertyInquiryEvent
            
            # Zähle Email-Leads
            email_leads_count = await sync_to_async(Contact.objects.filter(
                tenant_id=self.tenant_id,
                source='email'
            ).count)()
            
            # Zähle Inquiry Events
            inquiry_events_count = await sync_to_async(PropertyInquiryEvent.objects.filter(
                tenant_id=self.tenant_id,
                source='email'
            ).count)()
            
            # Zähle Leads der letzten 30 Tage
            thirty_days_ago = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            thirty_days_ago = thirty_days_ago.replace(day=thirty_days_ago.day - 30)
            
            recent_leads_count = await sync_to_async(Contact.objects.filter(
                tenant_id=self.tenant_id,
                source='email',
                created_at__gte=thirty_days_ago
            ).count)()
            
            return {
                'total_email_leads': email_leads_count,
                'total_inquiry_events': inquiry_events_count,
                'recent_leads_30d': recent_leads_count,
                'last_updated': datetime.now()
            }
            
        except Exception as e:
            logger.error(f"Error getting lead stats: {e}")
            return {
                'total_email_leads': 0,
                'total_inquiry_events': 0,
                'recent_leads_30d': 0,
                'last_updated': datetime.now()
            }
    
    async def reprocess_failed_leads(self, limit: int = 10) -> Dict[str, Any]:
        """Verarbeite fehlgeschlagene Leads erneut"""
        try:
            # TODO: Implementiere FailedLead Model für Retry-Logik
            # Für jetzt: Placeholder
            return {
                'status': 'not_implemented',
                'message': 'Failed lead reprocessing not yet implemented'
            }
            
        except Exception as e:
            logger.error(f"Error reprocessing failed leads: {e}")
            return {
                'status': 'error',
                'message': f"Fehler bei Lead-Reprocessing: {str(e)}"
            }
