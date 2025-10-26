"""
Invitation Service
Service für Benutzereinladungen und Token-Verwaltung
"""

from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import secrets
import logging
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

from app.db.models import UserInvitation, User
from app.schemas.invitation import (
    InvitationAcceptRequest, InvitationValidateRequest, InvitationValidateResponse
)
from app.core.errors import NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class InvitationService:
    """Service für Benutzereinladungen"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def create_invitation(
        self,
        email: str,
        first_name: str,
        last_name: str,
        role: str = 'agent',
        department: Optional[str] = None,
        position: Optional[str] = None,
        message: Optional[str] = None,
        invited_by: str = None
    ) -> Dict[str, Any]:
        """Einladung erstellen"""
        
        # Generate secure token
        token = secrets.token_urlsafe(32)
        
        # Set expiration (7 days from now)
        expires_at = datetime.now() + timedelta(days=7)
        
        # Mock implementation - in real implementation, save to database
        invitation_data = {
            'invitation_id': 'inv_' + secrets.token_urlsafe(8),
            'email': email,
            'token': token,
            'expires_at': expires_at.isoformat(),
            'invitation_url': f"{settings.FRONTEND_URL}/accept-invitation/{token}",
            'message': 'Einladung erfolgreich erstellt'
        }
        
        # Send invitation email (mock)
        logger.info(f"Invitation email sent to {email} with token {token}")
        
        return invitation_data
    
    async def validate_invitation(self, token: str) -> InvitationValidateResponse:
        """Einladungstoken validieren"""
        
        # Mock implementation
        if len(token) < 10:  # Simple validation
            raise ValidationError("Ungültiger Einladungstoken")
        
        return InvitationValidateResponse(
            is_valid=True,
            email='max.mustermann@example.com',
            first_name='Max',
            last_name='Mustermann',
            expires_at=(datetime.now() + timedelta(days=7)).isoformat(),
            message='Token ist gültig'
        )
    
    async def accept_invitation(
        self,
        token: str,
        password: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Einladung annehmen und Benutzerkonto erstellen"""
        
        # Mock implementation
        user_data = {
            'id': '3',
            'email': 'max.mustermann@example.com',
            'first_name': first_name or 'Max',
            'last_name': last_name or 'Mustermann',
            'is_active': True,
            'is_staff': False,
            'is_superuser': False,
            'created_at': datetime.now().isoformat(),
            'last_login': None,
            'roles': [{'id': 1, 'name': 'agent'}],
            'employee_number': 'EMP003',
            'department': 'IT',
            'position': 'Software Developer'
        }
        
        logger.info(f"User account created for token {token}")
        
        return user_data
    
    async def resend_invitation(self, invitation_id: str, resent_by: str) -> bool:
        """Einladung erneut senden"""
        
        # Mock implementation
        logger.info(f"Invitation {invitation_id} resent by {resent_by}")
        return True