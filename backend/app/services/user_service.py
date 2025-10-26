"""
User Service for tenant user management
"""
from typing import List, Optional, Dict, Any
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction

from app.db.models import TenantUser, Tenant
from app.schemas.user import UserResponse
from app.core.errors import NotFoundError, ConflictError, ValidationError
from app.services.email_service import EmailService

User = get_user_model()


class UserService:
    """Service for managing tenant users"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def invite_user(
        self,
        email: str,
        first_name: str,
        last_name: str,
        role: str = "agent",
        phone: Optional[str] = None,
        department: Optional[str] = None,
        invited_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Invite a new user to the tenant
        
        Args:
            email: User email
            first_name: User first name
            last_name: User last name
            role: User role (agent, manager, admin, viewer)
            phone: User phone number
            department: User department
            invited_by: ID of user who sent the invitation
            
        Returns:
            Dict with user data and invitation status
        """
        
        # Check if user already exists
        existing_user = await sync_to_async(User.objects.filter(email=email).first)()
        
        if existing_user:
            # Check if user is already in this tenant
            existing_tenant_user = await sync_to_async(
                TenantUser.objects.filter(
                    user=existing_user,
                    tenant_id=self.tenant_id
                ).first
            )()
            
            if existing_tenant_user:
                raise ConflictError(f"User {email} is already a member of this tenant")
            
            # User exists but not in this tenant - add them
            user = existing_user
        else:
            # Create new user
            user = await sync_to_async(User.objects.create)(
                email=email,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                is_active=True,
                email_verified=False,  # Will be verified when they accept invitation
                password="",  # No password set - will be set when they accept invitation
                created_at=timezone.now()
            )
        
        # Create tenant-user relationship
        tenant_user = await sync_to_async(TenantUser.objects.create)(
            user=user,
            tenant_id=self.tenant_id,
            role=role,
            can_manage_properties=role in ['admin', 'manager'],
            can_manage_documents=role in ['admin', 'manager'],
            can_manage_users=role == 'admin',
            can_view_analytics=role in ['admin', 'manager'],
            can_export_data=role in ['admin', 'manager'],
            scopes=self._get_scopes_for_role(role),
            is_active=True,
            joined_at=timezone.now(),
            invited_by=invited_by,
            department=department
        )
        
        # Send invitation email
        invitation_sent = False
        try:
            await EmailService.send_user_invitation(
                user_email=email,
                tenant_name=await self._get_tenant_name(),
                inviter_name=await self._get_inviter_name(invited_by),
                invitation_link=self._generate_invitation_link(user.id)
            )
            invitation_sent = True
        except Exception as e:
            # Log error but don't fail the invitation
            print(f"Failed to send invitation email: {e}")
        
        return {
            "user": UserResponse.model_validate(user),
            "invitation_sent": invitation_sent
        }
    
    async def get_tenant_users(self) -> List[UserResponse]:
        """Get all users in the tenant"""
        
        tenant_users = await sync_to_async(list)(
            TenantUser.objects.filter(
                tenant_id=self.tenant_id,
                is_active=True
            ).select_related('user')
        )
        
        return [UserResponse.model_validate(tu.user) for tu in tenant_users]
    
    async def update_user_role(self, user_id: str, role: str) -> None:
        """Update user role in tenant"""
        
        # Validate role
        valid_roles = ['owner', 'admin', 'manager', 'agent', 'viewer']
        if role not in valid_roles:
            raise ValidationError(f"Invalid role: {role}. Valid roles: {valid_roles}")
        
        # Find tenant user
        tenant_user = await sync_to_async(
            TenantUser.objects.filter(
                user_id=user_id,
                tenant_id=self.tenant_id
            ).first
        )()
        
        if not tenant_user:
            raise NotFoundError(f"User {user_id} not found in tenant")
        
        # Update role and permissions
        tenant_user.role = role
        tenant_user.can_manage_properties = role in ['admin', 'manager']
        tenant_user.can_manage_documents = role in ['admin', 'manager']
        tenant_user.can_manage_users = role == 'admin'
        tenant_user.can_view_analytics = role in ['admin', 'manager']
        tenant_user.can_export_data = role in ['admin', 'manager']
        tenant_user.scopes = self._get_scopes_for_role(role)
        
        await sync_to_async(tenant_user.save)()
    
    async def remove_user(self, user_id: str) -> None:
        """Remove user from tenant (soft delete)"""
        
        tenant_user = await sync_to_async(
            TenantUser.objects.filter(
                user_id=user_id,
                tenant_id=self.tenant_id
            ).first
        )()
        
        if not tenant_user:
            raise NotFoundError(f"User {user_id} not found in tenant")
        
        # Soft delete - deactivate
        tenant_user.is_active = False
        tenant_user.left_at = timezone.now()
        
        await sync_to_async(tenant_user.save)()
    
    def _get_scopes_for_role(self, role: str) -> List[str]:
        """Get scopes for a given role"""
        role_scopes = {
            'owner': ['read', 'write', 'delete', 'admin'],
            'admin': ['read', 'write', 'delete', 'admin'],
            'manager': ['read', 'write'],
            'agent': ['read', 'write'],
            'viewer': ['read']
        }
        return role_scopes.get(role, ['read'])
    
    async def _get_tenant_name(self) -> str:
        """Get tenant name"""
        tenant = await sync_to_async(Tenant.objects.get)(id=self.tenant_id)
        return tenant.name
    
    async def _get_inviter_name(self, inviter_id: Optional[str]) -> str:
        """Get inviter name"""
        if not inviter_id:
            return "System"
        
        try:
            inviter = await sync_to_async(User.objects.get)(id=inviter_id)
            return f"{inviter.first_name} {inviter.last_name}"
        except User.DoesNotExist:
            return "Unknown User"
    
    def _generate_invitation_link(self, user_id: str) -> str:
        """Generate invitation link for user"""
        # This would typically be a frontend URL
        return f"/invitation/{user_id}?tenant={self.tenant_id}"
