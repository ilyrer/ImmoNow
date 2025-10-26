"""
User Invitation Schemas
Pydantic models for user invitation operations
"""

from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class InvitationStatus(str, Enum):
    """Invitation status"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class InvitationRole(str, Enum):
    """Invitation roles"""
    OWNER = "owner"
    ADMIN = "admin"
    MANAGER = "manager"
    AGENT = "agent"
    VIEWER = "viewer"


class InvitationAction(str, Enum):
    """Invitation actions"""
    SENT = "sent"
    RESENT = "resent"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


# User Invitation Schemas
class UserInvitationBase(BaseModel):
    """Base user invitation schema"""
    email: EmailStr = Field(..., description="E-Mail-Adresse")
    first_name: str = Field(..., description="Vorname")
    last_name: str = Field(..., description="Nachname")
    role: InvitationRole = Field(default=InvitationRole.AGENT, description="Rolle")
    message: Optional[str] = Field(None, description="Persönliche Nachricht")
    department: Optional[str] = Field(None, description="Abteilung")
    position: Optional[str] = Field(None, description="Position")
    permissions: Dict[str, Any] = Field(default_factory=dict, description="Spezifische Berechtigungen")


class UserInvitationCreate(UserInvitationBase):
    """Schema for creating a user invitation"""
    pass


class UserInvitationUpdate(BaseModel):
    """Schema for updating a user invitation"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[InvitationRole] = None
    message: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None


class UserInvitationResponse(UserInvitationBase):
    """Schema for user invitation response"""
    id: str
    token: str
    expires_at: datetime
    status: InvitationStatus
    accepted_at: Optional[datetime] = None
    user_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    invited_by: str
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def invitation_url(self) -> str:
        return f"/accept-invitation/{self.token}"
    
    @property
    def is_expired(self) -> bool:
        return datetime.now() > self.expires_at
    
    @property
    def is_valid(self) -> bool:
        return (
            self.status == InvitationStatus.PENDING and 
            not self.is_expired and
            self.user_id is None
        )
    
    @property
    def days_until_expiry(self) -> int:
        delta = self.expires_at - datetime.now()
        return max(0, delta.days)
    
    class Config:
        from_attributes = True


# Invitation Log Schemas
class InvitationLogBase(BaseModel):
    """Base invitation log schema"""
    action: InvitationAction = Field(..., description="Aktion")
    details: Optional[str] = Field(None, description="Zusätzliche Details")
    ip_address: Optional[str] = Field(None, description="IP-Adresse")
    user_agent: Optional[str] = Field(None, description="User Agent")


class InvitationLogCreate(InvitationLogBase):
    """Schema for creating an invitation log"""
    invitation_id: str = Field(..., description="Einladungs-ID")


class InvitationLogResponse(InvitationLogBase):
    """Schema for invitation log response"""
    id: str
    invitation_id: str
    created_at: datetime
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True


# Invitation List Response
class UserInvitationListResponse(BaseModel):
    """Schema for user invitation list response"""
    invitations: List[UserInvitationResponse]
    total: int
    page: int
    size: int
    pages: int


# Invitation Accept Request
class InvitationAcceptRequest(BaseModel):
    """Request for accepting an invitation"""
    token: str = Field(..., description="Einladungstoken")
    password: str = Field(..., min_length=8, description="Passwort")
    password_confirm: str = Field(..., description="Passwort bestätigen")
    
    @validator('password_confirm')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwörter stimmen nicht überein')
        return v


# Invitation Validate Request
class InvitationValidateRequest(BaseModel):
    """Request for validating an invitation token"""
    token: str = Field(..., description="Einladungstoken")


# Invitation Validate Response
class InvitationValidateResponse(BaseModel):
    """Response for invitation validation"""
    is_valid: bool
    invitation: Optional[UserInvitationResponse] = None
    error_message: Optional[str] = None


# Invitation Resend Request
class InvitationResendRequest(BaseModel):
    """Request for resending an invitation"""
    invitation_id: str = Field(..., description="Einladungs-ID")
    message: Optional[str] = Field(None, description="Neue Nachricht")


# Invitation Cancel Request
class InvitationCancelRequest(BaseModel):
    """Request for cancelling an invitation"""
    invitation_id: str = Field(..., description="Einladungs-ID")
    reason: Optional[str] = Field(None, description="Grund für Stornierung")


# Invitation Statistics
class InvitationStats(BaseModel):
    """Invitation statistics"""
    total_invitations: int
    pending_invitations: int
    accepted_invitations: int
    expired_invitations: int
    cancelled_invitations: int
    invitations_by_role: Dict[str, int]
    invitations_by_department: Dict[str, int]
    average_acceptance_time_hours: Optional[float] = None
    invitations_expiring_soon: int  # Within 24 hours


# Bulk Invitation Request
class BulkInvitationRequest(BaseModel):
    """Request for bulk invitations"""
    invitations: List[UserInvitationCreate] = Field(..., min_items=1, max_items=50)
    message: Optional[str] = Field(None, description="Gemeinsame Nachricht")


# Bulk Invitation Response
class BulkInvitationResponse(BaseModel):
    """Response for bulk invitations"""
    successful: List[UserInvitationResponse]
    failed: List[Dict[str, Any]]  # Contains invitation data and error message
    total_sent: int
    total_failed: int
