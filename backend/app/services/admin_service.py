"""
Admin Service for RBAC and Feature Flags
"""
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from asgiref.sync import sync_to_async
from django.db import transaction
from django.db.models import Q, Count

from app.db.models import (
    User, UserProfile, Tenant, Permission, Role, FeatureFlag,
    Property, ContactPerson, Document, Task, AuditLog, Employee, UserInvitation
)
from app.schemas.admin import (
    PermissionResponse, RoleResponse, CreateRoleRequest, UpdateRoleRequest,
    FeatureFlagResponse, CreateFeatureFlagRequest, UpdateFeatureFlagRequest,
    UserResponse, TenantResponse, AuditLogResponse, SystemStatsResponse,
    InviteUserRequest, InviteUserResponse, BulkUserActionRequest, BulkUserActionResponse,
    UserActivationRequest, UserDeletionRequest, ResendInvitationRequest,
    UserListResponse, UserStats, UserStatus
)
from app.core.errors import NotFoundError, ValidationError
from app.services.audit import AuditService
from app.services.invitation_service import InvitationService

logger = logging.getLogger(__name__)


class AdminService:
    """Admin service for RBAC and system management"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.audit_service = AuditService(tenant_id)
        self.invitation_service = InvitationService(tenant_id)
    
    async def get_permissions(self) -> List[PermissionResponse]:
        """Get all permissions"""
        
        def _get_permissions():
            permissions = Permission.objects.all().order_by('category', 'name')
            return list(permissions)
        
        permissions = await sync_to_async(_get_permissions)()
        return [PermissionResponse.model_validate(p) for p in permissions]
    
    async def get_roles(self) -> List[RoleResponse]:
        """Get all roles for tenant"""
        
        def _get_roles():
            roles = Role.objects.filter(tenant_id=self.tenant_id).prefetch_related('permissions').order_by('name')
            return list(roles)
        
        roles = await sync_to_async(_get_roles)()
        
        role_responses = []
        for role in roles:
            permissions = [PermissionResponse.model_validate(p) for p in role.permissions.all()]
            role_responses.append(RoleResponse(
                id=role.id,
                name=role.name,
                description=role.description,
                permissions=permissions,
                is_system=role.is_system,
                created_at=role.created_at,
                created_by=str(role.created_by_id)
            ))
        
        return role_responses
    
    async def create_role(
        self,
        role_data: CreateRoleRequest,
        user_id: str
    ) -> RoleResponse:
        """Create a new role"""
        
        def _create_role():
            # Check if role name already exists
            if Role.objects.filter(tenant_id=self.tenant_id, name=role_data.name).exists():
                raise ValidationError("Role with this name already exists")
            
            # Get permissions
            permissions = Permission.objects.filter(id__in=role_data.permission_ids)
            
            # Create role
            role = Role.objects.create(
                tenant_id=self.tenant_id,
                name=role_data.name,
                description=role_data.description,
                created_by_id=user_id
            )
            
            # Add permissions
            role.permissions.set(permissions)
            
            return role
        
        role = await sync_to_async(_create_role)()
        
        # Log role creation
        await self.audit_service.audit_action(
            user_id=user_id,
            action='create_role',
            resource_type='role',
            resource_id=str(role.id),
            description=f'Created role: {role.name}'
        )
        
        permissions = [PermissionResponse.model_validate(p) for p in role.permissions.all()]
        return RoleResponse(
            id=role.id,
            name=role.name,
            description=role.description,
            permissions=permissions,
            is_system=role.is_system,
            created_at=role.created_at,
            created_by=str(role.created_by_id)
        )
    
    async def update_role(
        self,
        role_id: int,
        role_data: UpdateRoleRequest,
        user_id: str
    ) -> RoleResponse:
        """Update a role"""
        
        def _update_role():
            try:
                role = Role.objects.get(id=role_id, tenant_id=self.tenant_id)
                
                # Check if it's a system role
                if role.is_system:
                    raise ValidationError("Cannot modify system roles")
                
                # Update fields
                if role_data.name:
                    # Check if new name already exists
                    if Role.objects.filter(tenant_id=self.tenant_id, name=role_data.name).exclude(id=role_id).exists():
                        raise ValidationError("Role with this name already exists")
                    role.name = role_data.name
                
                if role_data.description is not None:
                    role.description = role_data.description
                
                if role_data.permission_ids:
                    permissions = Permission.objects.filter(id__in=role_data.permission_ids)
                    role.permissions.set(permissions)
                
                role.save()
                return role
                
            except Role.DoesNotExist:
                raise NotFoundError("Role not found")
        
        role = await sync_to_async(_update_role)()
        
        # Log role update
        await self.audit_service.audit_action(
            user_id=user_id,
            action='update_role',
            resource_type='role',
            resource_id=str(role_id),
            description=f'Updated role: {role.name}'
        )
        
        permissions = [PermissionResponse.model_validate(p) for p in role.permissions.all()]
        return RoleResponse(
            id=role.id,
            name=role.name,
            description=role.description,
            permissions=permissions,
            is_system=role.is_system,
            created_at=role.created_at,
            created_by=str(role.created_by_id)
        )
    
    async def delete_role(self, role_id: int, user_id: str) -> bool:
        """Delete a role"""
        
        def _delete_role():
            try:
                role = Role.objects.get(id=role_id, tenant_id=self.tenant_id)
                
                # Check if it's a system role
                if role.is_system:
                    raise ValidationError("Cannot delete system roles")
                
                # Check if role is assigned to users
                user_count = UserProfile.objects.filter(roles=role).count()
                if user_count > 0:
                    raise ValidationError(f"Cannot delete role assigned to {user_count} users")
                
                role_name = role.name
                role.delete()
                return role_name
                
            except Role.DoesNotExist:
                raise NotFoundError("Role not found")
        
        role_name = await sync_to_async(_delete_role)()
        
        # Log role deletion
        await self.audit_service.audit_action(
            user_id=user_id,
            action='delete_role',
            resource_type='role',
            resource_id=str(role_id),
            description=f'Deleted role: {role_name}'
        )
        
        return True
    
    async def get_users(
        self,
        page: int = 1,
        size: int = 20,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        role: Optional[str] = None
    ) -> UserListResponse:
        """Benutzer mit Filterung und Paginierung abrufen"""
        
        def _get_users():
            # Since UserProfile doesn't exist, work directly with User
            queryset = User.objects.all()
            
            # Apply filters
            if search:
                queryset = queryset.filter(
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search) |
                    Q(email__icontains=search)
                )
            
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active)
            
            # Get total count
            total = queryset.count()
            
            # Apply pagination
            offset = (page - 1) * size
            users = list(queryset.order_by('last_name', 'first_name')[offset:offset + size])
            
            return users, total
        
        users, total = await sync_to_async(_get_users)()
        
        # Convert to response format
        user_responses = []
        for user in users:
            # Create empty roles list since we don't have UserProfile
            roles = []
            
            # Determine user status
            status = UserStatus.ACTIVE if user.is_active else UserStatus.INACTIVE
            
            user_responses.append(UserResponse(
                id=str(user.id),
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                is_active=user.is_active,
                status=status,
                roles=roles,
                tenant_name="Demo Tenant",  # Default tenant name
                last_login=user.last_login,
                created_at=user.created_at,
                employee_number=None,
                department=None,
                position=None
            ))
        
        return UserListResponse(
            users=user_responses,
            total=total,
            page=page,
            size=size,
            pages=(total + size - 1) // size
        )
    
    async def get_user_stats(self) -> UserStats:
        """Benutzer-Statistiken abrufen"""
        
        def _get_user_stats():
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()
            inactive_users = total_users - active_users
            
            # Get users by role (empty for now since we don't have UserProfile)
            users_by_role = {}
            
            # Get users by department (empty for now)
            users_by_department = {}
            
            # Recent registrations (last 30 days)
            thirty_days_ago = datetime.now() - timedelta(days=30)
            recent_registrations = User.objects.filter(
                created_at__gte=thirty_days_ago
            ).count()
            
            # Users without login
            users_without_login = User.objects.filter(
                last_login__isnull=True
            ).count()
            
            return {
                'total_users': total_users,
                'active_users': active_users,
                'inactive_users': inactive_users,
                'invited_users': 0,  # TODO: implement invitation tracking
                'users_by_role': users_by_role,
                'users_by_department': users_by_department,
                'recent_registrations': recent_registrations,
                'users_without_login': users_without_login
            }
        
        stats = await sync_to_async(_get_user_stats)()
        return UserStats(**stats)
    
    async def invite_user(self, invite_request: InviteUserRequest, invited_by: str) -> InviteUserResponse:
        """Benutzer einladen"""
        
        # Use invitation service
        return await self.invitation_service.create_invitation(
            email=invite_request.email,
            first_name=invite_request.first_name,
            last_name=invite_request.last_name,
            role=invite_request.role,
            department=invite_request.department,
            position=invite_request.position,
            message=invite_request.message,
            invited_by=invited_by
        )
    
    async def activate_user(self, activation_request: UserActivationRequest, activated_by: str) -> bool:
        """Benutzer aktivieren/deaktivieren"""
        
        def _activate_user():
            try:
                user = User.objects.get(id=activation_request.user_id)
                user.is_active = activation_request.is_active
                user.save()
                return True
            except User.DoesNotExist:
                raise NotFoundError("User not found")
        
        await sync_to_async(_activate_user)()
        
        # Log activation
        await self.audit_service.audit_action(
            user_id=activated_by,
            action='activate_user' if activation_request.is_active else 'deactivate_user',
            resource_type='user',
            resource_id=activation_request.user_id,
            description=f'User {"activated" if activation_request.is_active else "deactivated"}'
        )
        
        return True
    
    async def delete_user(self, deletion_request: UserDeletionRequest, deleted_by: str) -> bool:
        """Benutzer löschen"""
        
        def _delete_user():
            try:
                user = User.objects.get(id=deletion_request.user_id)
                user_email = user.email
                
                if deletion_request.anonymize_data:
                    # Anonymize user data
                    user.first_name = "Deleted"
                    user.last_name = "User"
                    user.email = f"deleted_{user.id}@example.com"
                    user.save()
                
                user.delete()
                return user_email
            except User.DoesNotExist:
                raise NotFoundError("User not found")
        
        user_email = await sync_to_async(_delete_user)()
        
        # Log deletion
        await self.audit_service.audit_action(
            user_id=deleted_by,
            action='delete_user',
            resource_type='user',
            resource_id=deletion_request.user_id,
            description=f'User deleted: {user_email}'
        )
        
        return True
    
    async def resend_invitation(self, resend_request: ResendInvitationRequest, resent_by: str) -> bool:
        """Einladung erneut senden"""
        
        # Mock implementation for now
        return True
    
    async def bulk_user_action(self, bulk_request: BulkUserActionRequest, action_by: str) -> BulkUserActionResponse:
        """Bulk-Benutzeraktionen ausführen"""
        
        successful = []
        failed = []
        
        for user_id in bulk_request.user_ids:
            try:
                if bulk_request.action == 'activate':
                    await self.activate_user(UserActivationRequest(user_id=user_id, is_active=True), action_by)
                elif bulk_request.action == 'deactivate':
                    await self.activate_user(UserActivationRequest(user_id=user_id, is_active=False), action_by)
                elif bulk_request.action == 'delete':
                    await self.delete_user(UserDeletionRequest(user_id=user_id), action_by)
                
                successful.append(user_id)
            except Exception as e:
                failed.append({'user_id': user_id, 'error': str(e)})
        
        return BulkUserActionResponse(
            successful=successful,
            failed=failed,
            total_processed=len(bulk_request.user_ids),
            total_failed=len(failed)
        )
    
    async def get_feature_flags(self) -> List[FeatureFlagResponse]:
        """Get all feature flags"""
        
        def _get_feature_flags():
            flags = FeatureFlag.objects.filter(tenant_id=self.tenant_id).order_by('name')
            return list(flags)
        
        flags = await sync_to_async(_get_feature_flags)()
        return [FeatureFlagResponse.model_validate(f) for f in flags]
    
    async def create_feature_flag(
        self,
        flag_data: CreateFeatureFlagRequest,
        user_id: str
    ) -> FeatureFlagResponse:
        """Create a new feature flag"""
        
        def _create_feature_flag():
            flag = FeatureFlag.objects.create(
                tenant_id=self.tenant_id,
                name=flag_data.name,
                description=flag_data.description,
                is_enabled=flag_data.is_enabled,
                rollout_percentage=flag_data.rollout_percentage or 0,
                created_by_id=user_id
            )
            return flag
        
        flag = await sync_to_async(_create_feature_flag)()
        
        # Log creation
        await self.audit_service.audit_action(
            user_id=user_id,
            action='create_feature_flag',
            resource_type='feature_flag',
            resource_id=str(flag.id),
            description=f'Created feature flag: {flag.name}'
        )
        
        return FeatureFlagResponse.model_validate(flag)
    
    async def update_feature_flag(
        self,
        flag_id: int,
        flag_data: UpdateFeatureFlagRequest,
        user_id: str
    ) -> FeatureFlagResponse:
        """Update a feature flag"""
        
        def _update_feature_flag():
            try:
                flag = FeatureFlag.objects.get(id=flag_id, tenant_id=self.tenant_id)
                
                if flag_data.name:
                    flag.name = flag_data.name
                if flag_data.description is not None:
                    flag.description = flag_data.description
                if flag_data.is_enabled is not None:
                    flag.is_enabled = flag_data.is_enabled
                if flag_data.rollout_percentage is not None:
                    flag.rollout_percentage = flag_data.rollout_percentage
                
                flag.save()
                return flag
            except FeatureFlag.DoesNotExist:
                raise NotFoundError("Feature flag not found")
        
        flag = await sync_to_async(_update_feature_flag)()
        
        # Log update
        await self.audit_service.audit_action(
            user_id=user_id,
            action='update_feature_flag',
            resource_type='feature_flag',
            resource_id=str(flag_id),
            description=f'Updated feature flag: {flag.name}'
        )
        
        return FeatureFlagResponse.model_validate(flag)
    
    async def get_audit_logs(
        self,
        page: int = 1,
        size: int = 20,
        resource_type: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[AuditLogResponse]:
        """Get audit logs"""
        
        def _get_audit_logs():
            queryset = AuditLog.objects.filter(tenant_id=self.tenant_id)
            
            if resource_type:
                queryset = queryset.filter(resource_type=resource_type)
            if user_id:
                queryset = queryset.filter(user_id=user_id)
            
            offset = (page - 1) * size
            logs = list(queryset.order_by('-created_at')[offset:offset + size])
            return logs
        
        logs = await sync_to_async(_get_audit_logs)()
        return [AuditLogResponse.model_validate(log) for log in logs]
    
    async def get_system_stats(self) -> SystemStatsResponse:
        """Get system statistics"""
        
        def _get_system_stats():
            total_users = User.objects.count()
            total_properties = Property.objects.filter(tenant_id=self.tenant_id).count()
            total_contacts = ContactPerson.objects.filter(tenant_id=self.tenant_id).count()
            total_tasks = Task.objects.filter(tenant_id=self.tenant_id).count()
            
            # Active users today
            today = datetime.now().date()
            active_users_today = User.objects.filter(
                last_login__date=today
            ).count()
            
            # This month stats
            this_month = datetime.now().replace(day=1)
            properties_created_this_month = Property.objects.filter(
                tenant_id=self.tenant_id,
                created_at__gte=this_month
            ).count()
            
            contacts_created_this_month = ContactPerson.objects.filter(
                tenant_id=self.tenant_id,
                created_at__gte=this_month
            ).count()
            
            tasks_completed_this_month = Task.objects.filter(
                tenant_id=self.tenant_id,
                status='completed',
                updated_at__gte=this_month
            ).count()
            
            return {
                'total_users': total_users,
                'total_tenants': 1,  # Single tenant system
                'active_users': active_users_today,
                'total_properties': total_properties,
                'total_contacts': total_contacts,
                'total_documents': 0,  # Placeholder
                'total_tasks': total_tasks,
                'system_health': {
                    'status': 'healthy',
                    'uptime': '99.9%',
                    'last_backup': datetime.now().isoformat()
                },
                'recent_activity': []  # Empty for now
            }
        
        stats = await sync_to_async(_get_system_stats)()
        return SystemStatsResponse(**stats)
    
    async def get_tenants(self) -> List[TenantResponse]:
        """Get all tenants"""
        
        def _get_tenants():
            tenants = Tenant.objects.all().order_by('name')
            return list(tenants)
        
        tenants = await sync_to_async(_get_tenants)()
        
        tenant_responses = []
        for tenant in tenants:
            user_count = User.objects.count()  # Total users since we don't have tenant-specific users
            property_count = Property.objects.filter(tenant_id=tenant.id).count()
            
            tenant_responses.append(TenantResponse(
                id=str(tenant.id),
                name=tenant.name,
                domain=tenant.domain,
                is_active=tenant.is_active,
                created_at=tenant.created_at,
                plan=tenant.plan,
                user_count=user_count,
                property_count=property_count
            ))
        
        return tenant_responses