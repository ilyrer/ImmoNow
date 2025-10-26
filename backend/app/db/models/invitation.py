"""
User Invitation Model
Token-basierte Mitarbeitereinladungen
"""

import uuid
import secrets
from django.db import models
from django.utils import timezone
from datetime import timedelta

from .tenant import Tenant
from .user import User


class UserInvitation(models.Model):
    """
    User Invitation Model
    Token-basierte Mitarbeitereinladungen mit E-Mail-Verifizierung
    """
    
    STATUS_CHOICES = [
        ('pending', 'Ausstehend'),
        ('accepted', 'Angenommen'),
        ('expired', 'Abgelaufen'),
        ('cancelled', 'Storniert'),
    ]
    
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('admin', 'Administrator'),
        ('manager', 'Manager'),
        ('agent', 'Agent'),
        ('viewer', 'Viewer'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='invitations')
    
    # Invitation Details
    email = models.EmailField(help_text="E-Mail-Adresse des eingeladenen Benutzers")
    first_name = models.CharField(max_length=100, help_text="Vorname")
    last_name = models.CharField(max_length=100, help_text="Nachname")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='agent', help_text="Rolle")
    
    # Token
    token = models.CharField(max_length=64, unique=True, help_text="Einladungstoken")
    expires_at = models.DateTimeField(help_text="Ablaufdatum")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    accepted_at = models.DateTimeField(null=True, blank=True, help_text="Angenommen am")
    
    # User (set when invitation is accepted)
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='invitation'
    )
    
    # Invitation Details
    message = models.TextField(blank=True, null=True, help_text="Persönliche Nachricht")
    department = models.CharField(max_length=50, blank=True, null=True, help_text="Abteilung")
    position = models.CharField(max_length=100, blank=True, null=True, help_text="Position")
    
    # Permissions (stored as JSON for flexibility)
    permissions = models.JSONField(
        default=dict,
        help_text="Spezifische Berechtigungen"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    
    class Meta:
        db_table = 'user_invitations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['email']),
            models.Index(fields=['token']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Invitation for {self.email} ({self.status})"
    
    @classmethod
    def create_invitation(cls, tenant, email, first_name, last_name, role, invited_by, **kwargs):
        """Create a new invitation with secure token"""
        # Generate secure token
        token = secrets.token_urlsafe(48)
        
        # Set expiry date (7 days from now)
        expires_at = timezone.now() + timedelta(days=7)
        
        # Create invitation
        invitation = cls.objects.create(
            tenant=tenant,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            token=token,
            expires_at=expires_at,
            invited_by=invited_by,
            **kwargs
        )
        
        return invitation
    
    @property
    def is_expired(self):
        """Check if invitation is expired"""
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self):
        """Check if invitation is valid (not expired and pending)"""
        return (
            self.status == 'pending' and 
            not self.is_expired and
            self.user is None
        )
    
    @property
    def full_name(self):
        """Return full name"""
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def invitation_url(self):
        """Generate invitation URL"""
        return f"/accept-invitation/{self.token}"
    
    @property
    def days_until_expiry(self):
        """Calculate days until expiry"""
        delta = self.expires_at - timezone.now()
        return max(0, delta.days)
    
    def accept(self, user):
        """Accept the invitation and link to user"""
        if not self.is_valid:
            raise ValueError("Invitation is not valid")
        
        self.user = user
        self.status = 'accepted'
        self.accepted_at = timezone.now()
        self.save()
        
        # Create tenant membership
        user.assign_to_tenant(
            tenant=self.tenant,
            role=self.role,
            **self.permissions
        )
    
    def cancel(self):
        """Cancel the invitation"""
        if self.status != 'pending':
            raise ValueError("Only pending invitations can be cancelled")
        
        self.status = 'cancelled'
        self.save()
    
    def resend(self, invited_by):
        """Resend invitation with new token and expiry"""
        if self.status != 'pending':
            raise ValueError("Only pending invitations can be resent")
        
        # Generate new token and expiry
        self.token = secrets.token_urlsafe(48)
        self.expires_at = timezone.now() + timedelta(days=7)
        self.invited_by = invited_by
        self.save()
        
        return self
    
    def mark_as_expired(self):
        """Mark invitation as expired"""
        if self.status == 'pending':
            self.status = 'expired'
            self.save()


class InvitationLog(models.Model):
    """
    Invitation Log Model
    Protokollierung von Einladungsaktivitäten
    """
    
    ACTION_CHOICES = [
        ('sent', 'Gesendet'),
        ('resent', 'Erneut gesendet'),
        ('accepted', 'Angenommen'),
        ('expired', 'Abgelaufen'),
        ('cancelled', 'Storniert'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invitation = models.ForeignKey(UserInvitation, on_delete=models.CASCADE, related_name='logs')
    
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    details = models.TextField(blank=True, null=True, help_text="Zusätzliche Details")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'invitation_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['invitation', 'action']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.invitation.email} - {self.action}"
