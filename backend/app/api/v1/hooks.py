"""
Inbound Email Webhook API für Lead-Ingestion
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr
import logging
from datetime import datetime

from app.api.deps import get_tenant_id, get_current_user
from app.core.security import TokenData
from app.db.models import User
from app.services.lead_ingestion_service import LeadIngestionService
from app.core.errors import ValidationError, NotFoundError
from app.core.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter()


class InboundEmailRequest(BaseModel):
    """Request model für Inbound Email"""
    subject: str
    body: str
    sender_email: EmailStr
    sender_name: Optional[str] = None
    property_id: Optional[str] = None
    source_url: Optional[str] = None
    provider: Optional[str] = None  # z.B. 'sendgrid', 'mailgun', 'ses'


class EmailWebhookRequest(BaseModel):
    """Request model für Provider-Webhooks"""
    to: EmailStr
    from_email: EmailStr
    from_name: Optional[str] = None
    subject: str
    text: str
    html: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    attachments: Optional[list] = None


@router.post("/email/inbound")
async def process_inbound_email(
    request: InboundEmailRequest,
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user)
):
    """
    Verarbeite Inbound Email für Lead-Ingestion
    
    Provider-agnostischer Endpoint für Email-Verarbeitung
    """
    # Feature Flag Check
    if not settings.EMAIL_INGESTION:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email ingestion is currently disabled"
        )
    
    try:
        logger.info(f"Processing inbound email from {request.sender_email} for tenant {tenant_id}")
        
        # Initialisiere Lead Ingestion Service
        lead_service = LeadIngestionService(tenant_id)
        
        # Verarbeite Email-Lead
        result = await lead_service.process_email_lead(
            subject=request.subject,
            body=request.body,
            sender_email=request.sender_email,
            sender_name=request.sender_name,
            property_id=request.property_id,
            source_url=request.source_url
        )
        
        # Log Ergebnis
        logger.info(f"Lead processing result: {result['status']} for {request.sender_email}")
        
        return {
            "status": "success",
            "lead_result": result,
            "processed_at": datetime.now().isoformat()
        }
        
    except ValidationError as e:
        logger.warning(f"Validation error processing email: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation error: {str(e)}"
        )
    except NotFoundError as e:
        logger.warning(f"Not found error processing email: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error processing inbound email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process email: {str(e)}"
        )


@router.post("/email/webhook/sendgrid")
async def sendgrid_webhook(
    request: Request,
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user)
):
    """
    SendGrid Inbound Email Webhook
    
    Verarbeitet SendGrid-spezifische Webhook-Daten
    """
    try:
        # Parse SendGrid Webhook Data
        webhook_data = await request.json()
        
        # Extrahiere Email-Daten aus SendGrid Format
        email_data = webhook_data.get('email', {})
        
        subject = email_data.get('subject', '')
        body = email_data.get('text', '') or email_data.get('html', '')
        sender_email = email_data.get('from', {}).get('email', '')
        sender_name = email_data.get('from', {}).get('name', '')
        
        # Extrahiere Property-ID aus Headers oder Body
        property_id = None
        headers = email_data.get('headers', {})
        if 'X-Property-ID' in headers:
            property_id = headers['X-Property-ID']
        
        logger.info(f"Processing SendGrid webhook from {sender_email}")
        
        # Verarbeite über Lead Ingestion Service
        lead_service = LeadIngestionService(tenant_id)
        result = await lead_service.process_email_lead(
            subject=subject,
            body=body,
            sender_email=sender_email,
            sender_name=sender_name,
            property_id=property_id,
            source_url="sendgrid"
        )
        
        return {
            "status": "success",
            "lead_result": result,
            "provider": "sendgrid"
        }
        
    except Exception as e:
        logger.error(f"Error processing SendGrid webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process SendGrid webhook: {str(e)}"
        )


@router.post("/email/webhook/mailgun")
async def mailgun_webhook(
    request: Request,
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user)
):
    """
    Mailgun Inbound Email Webhook
    
    Verarbeitet Mailgun-spezifische Webhook-Daten
    """
    try:
        # Parse Mailgun Webhook Data
        webhook_data = await request.form()
        
        # Extrahiere Email-Daten aus Mailgun Format
        subject = webhook_data.get('subject', '')
        body = webhook_data.get('body-plain', '') or webhook_data.get('body-html', '')
        sender_email = webhook_data.get('sender', '')
        sender_name = webhook_data.get('from', '').replace(f'<{sender_email}>', '').strip()
        
        # Extrahiere Property-ID aus Headers
        property_id = None
        headers = webhook_data.get('message-headers', '')
        if 'X-Property-ID' in headers:
            property_id = headers['X-Property-ID']
        
        logger.info(f"Processing Mailgun webhook from {sender_email}")
        
        # Verarbeite über Lead Ingestion Service
        lead_service = LeadIngestionService(tenant_id)
        result = await lead_service.process_email_lead(
            subject=subject,
            body=body,
            sender_email=sender_email,
            sender_name=sender_name,
            property_id=property_id,
            source_url="mailgun"
        )
        
        return {
            "status": "success",
            "lead_result": result,
            "provider": "mailgun"
        }
        
    except Exception as e:
        logger.error(f"Error processing Mailgun webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process Mailgun webhook: {str(e)}"
        )


@router.post("/email/webhook/ses")
async def ses_webhook(
    request: Request,
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user)
):
    """
    AWS SES Inbound Email Webhook
    
    Verarbeitet SES-spezifische Webhook-Daten
    """
    try:
        # Parse SES Webhook Data
        webhook_data = await request.json()
        
        # Extrahiere Email-Daten aus SES Format
        message = webhook_data.get('Message', {})
        content = message.get('content', {})
        
        subject = content.get('subject', '')
        body = content.get('text', '') or content.get('html', '')
        sender_email = content.get('from', {}).get('email', '')
        sender_name = content.get('from', {}).get('name', '')
        
        # Extrahiere Property-ID aus Headers
        property_id = None
        headers = content.get('headers', {})
        if 'X-Property-ID' in headers:
            property_id = headers['X-Property-ID']
        
        logger.info(f"Processing SES webhook from {sender_email}")
        
        # Verarbeite über Lead Ingestion Service
        lead_service = LeadIngestionService(tenant_id)
        result = await lead_service.process_email_lead(
            subject=subject,
            body=body,
            sender_email=sender_email,
            sender_name=sender_name,
            property_id=property_id,
            source_url="ses"
        )
        
        return {
            "status": "success",
            "lead_result": result,
            "provider": "ses"
        }
        
    except Exception as e:
        logger.error(f"Error processing SES webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process SES webhook: {str(e)}"
        )


@router.get("/email/stats")
async def get_email_lead_stats(
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user)
):
    """
    Hole Email-Lead Statistiken
    """
    try:
        lead_service = LeadIngestionService(tenant_id)
        stats = await lead_service.get_lead_stats()
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting email lead stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get email lead stats: {str(e)}"
        )


@router.post("/email/reprocess")
async def reprocess_failed_leads(
    limit: int = 10,
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user)
):
    """
    Verarbeite fehlgeschlagene Leads erneut
    """
    try:
        lead_service = LeadIngestionService(tenant_id)
        result = await lead_service.reprocess_failed_leads(limit=limit)
        
        return result
        
    except Exception as e:
        logger.error(f"Error reprocessing failed leads: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reprocess leads: {str(e)}"
        )
