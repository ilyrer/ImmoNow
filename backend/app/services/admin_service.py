"""
Admin Service for RBAC and Feature Flags
"""
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from asgiref.sync import sync_to_async

from accounts.models import User, UserProfile, Tenant, Permission, Role, FeatureFlag
from properties.models import Property, ContactPerson
from documents.models import Document
from tasks.models import Task
from common.models import AuditLog
from app.schemas.admin import (
    PermissionResponse, RoleResponse, CreateRoleRequest, UpdateRoleRequest,
    FeatureFlagResponse, CreateFeatureFlagRequest, UpdateFeatureFlagRequest,
    UserResponse, TenantResponse, AuditLogResponse, SystemStatsResponse
)
from app.core.errors import NotFoundError, ValidationError
from app.services.audit import AuditService

logger = logging.getLogger(__name__)


class AdminService:
    """Admin service for RBAC and system management"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.audit_service = AuditService(tenant_id)
    
    async def get_permissions(self) -> List[PermissionResponse]:
        """Get all permissions"""
        
        permissions = await sync_to_async(list)(
            Permission.objects.all().order_by('category', 'name')
        )
        
        return [PermissionResponse.model_validate(p) for p in permissions]
    
    async def get_roles(self) -> List[RoleResponse]:
        """Get all roles for tenant"""
        
        roles = await sync_to_async(list)(
            Role.objects.filter(tenant_id=self.tenant_id)
            .prefetch_related('permissions')
            .order_by('name')
        )
        
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
        
        # Check if role name already exists
        existing_role = await sync_to_async(
            Role.objects.filter(tenant_id=self.tenant_id, name=role_data.name).exists
        )()
        
        if existing_role:
            raise ValidationError("Role with this name already exists")
        
        # Get permissions
        permissions = await sync_to_async(list)(
            Permission.objects.filter(id__in=role_data.permission_ids)
        )
        
        if len(permissions) != len(role_data.permission_ids):
            raise ValidationError("Some permissions not found")
        
        # Create role
        role = await sync_to_async(Role.objects.create)(
            tenant_id=self.tenant_id,
            name=role_data.name,
            description=role_data.description,
            created_by_id=user_id
        )
        
        # Add permissions
        await sync_to_async(role.permissions.set)(permissions)
        
        # Log role creation
        await self.audit_service.audit_action(
            user_id=user_id,
            action='create_role',
            resource_type='role',
            resource_id=str(role.id),
            description=f'Created role: {role.name}'
        )
        
        return RoleResponse(
            id=role.id,
            name=role.name,
            description=role.description,
            permissions=[PermissionResponse.model_validate(p) for p in permissions],
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
        
        try:
            role = await sync_to_async(Role.objects.get)(
                id=role_id,
                tenant_id=self.tenant_id
            )
            
            # Check if it's a system role
            if role.is_system:
                raise ValidationError("Cannot modify system roles")
            
            # Update fields
            if role_data.name is not None:
                # Check if new name already exists
                existing_role = await sync_to_async(
                    Role.objects.filter(tenant_id=self.tenant_id, name=role_data.name)
                    .exclude(id=role_id).exists
                )()
                
                if existing_role:
                    raise ValidationError("Role with this name already exists")
                
                await sync_to_async(role.__setattr__)('name', role_data.name)
            
            if role_data.description is not None:
                await sync_to_async(role.__setattr__)('description', role_data.description)
            
            await sync_to_async(role.save)()
            
            # Update permissions if provided
            if role_data.permission_ids is not None:
                permissions = await sync_to_async(list)(
                    Permission.objects.filter(id__in=role_data.permission_ids)
                )
                
                if len(permissions) != len(role_data.permission_ids):
                    raise ValidationError("Some permissions not found")
                
                await sync_to_async(role.permissions.set)(permissions)
            
            # Log role update
            await self.audit_service.audit_action(
                user_id=user_id,
                action='update_role',
                resource_type='role',
                resource_id=str(role.id),
                description=f'Updated role: {role.name}'
            )
            
            # Get updated permissions
            permissions = await sync_to_async(list)(role.permissions.all())
            
            return RoleResponse(
                id=role.id,
                name=role.name,
                description=role.description,
                permissions=[PermissionResponse.model_validate(p) for p in permissions],
                is_system=role.is_system,
                created_at=role.created_at,
                created_by=str(role.created_by_id)
            )
            
        except Role.DoesNotExist:
            raise NotFoundError("Role not found")
    
    async def delete_role(self, role_id: int, user_id: str) -> None:
        """Delete a role"""
        
        try:
            role = await sync_to_async(Role.objects.get)(
                id=role_id,
                tenant_id=self.tenant_id
            )
            
            # Check if it's a system role
            if role.is_system:
                raise ValidationError("Cannot delete system roles")
            
            # Check if role is assigned to users
            user_count = await sync_to_async(
                UserProfile.objects.filter(roles=role).count
            )()
            
            if user_count > 0:
                raise ValidationError(f"Cannot delete role assigned to {user_count} users")
            
            role_name = role.name
            await sync_to_async(role.delete)()
            
            # Log role deletion
            await self.audit_service.audit_action(
                user_id=user_id,
                action='delete_role',
                resource_type='role',
                resource_id=str(role_id),
                description=f'Deleted role: {role_name}'
            )
            
        except Role.DoesNotExist:
            raise NotFoundError("Role not found")
    
    async def get_users(self) -> List[UserResponse]:
        """Get all users for tenant"""
        
        user_profiles = await sync_to_async(list)(
            UserProfile.objects.filter(tenant_id=self.tenant_id)
            .select_related('user', 'tenant')
            .prefetch_related('roles__permissions')
            .order_by('user__last_name', 'user__first_name')
        )
        
        user_responses = []
        for profile in user_profiles:
            roles = []
            for role in profile.roles.all():
                permissions = [PermissionResponse.model_validate(p) for p in role.permissions.all()]
                roles.append(RoleResponse(
                    id=role.id,
                    name=role.name,
                    description=role.description,
                    permissions=permissions,
                    is_system=role.is_system,
                    created_at=role.created_at,
                    created_by=str(role.created_by_id)
                ))
            
            user_responses.append(UserResponse(
                id=str(profile.user.id),
                email=profile.user.email,
                first_name=profile.user.first_name,
                last_name=profile.user.last_name,
                is_active=profile.is_active,
                roles=roles,
                tenant_name=profile.tenant.name,
                last_login=profile.last_login,
                created_at=profile.created_at
            ))
        
        return user_responses
    
    async def update_user_roles(
        self,
        user_id: str,
        role_data: List[int],
        admin_user_id: str
    ) -> UserResponse:
        """Update user roles"""
        
        try:
            profile = await sync_to_async(UserProfile.objects.get)(
                user_id=user_id,
                tenant_id=self.tenant_id
            )
            
            # Get roles
            roles = await sync_to_async(list)(
                Role.objects.filter(id__in=role_data, tenant_id=self.tenant_id)
            )
            
            if len(roles) != len(role_data):
                raise ValidationError("Some roles not found")
            
            # Update roles
            await sync_to_async(profile.roles.set)(roles)
            
            # Log role assignment
            await self.audit_service.audit_action(
                user_id=admin_user_id,
                action='assign_roles',
                resource_type='user',
                resource_id=str(user_id),
                description=f'Assigned roles to user: {profile.user.get_full_name()}'
            )
            
            # Return updated user
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
            
            return UserResponse(
                id=str(profile.user.id),
                email=profile.user.email,
                first_name=profile.user.first_name,
                last_name=profile.user.last_name,
                is_active=profile.is_active,
                roles=role_responses,
                tenant_name=profile.tenant.name,
                last_login=profile.last_login,
                created_at=profile.created_at
            )
            
        except UserProfile.DoesNotExist:
            raise NotFoundError("User not found")
    
    async def get_feature_flags(self) -> List[FeatureFlagResponse]:
        """Get feature flags for tenant"""
        
        flags = await sync_to_async(list)(
            FeatureFlag.objects.filter(tenant_id=self.tenant_id)
            .order_by('name')
        )
        
        flag_responses = []
        for flag in flags:
            flag_responses.append(FeatureFlagResponse(
                id=flag.id,
                name=flag.name,
                description=flag.description,
                is_enabled=flag.is_enabled,
                rollout_percentage=flag.rollout_percentage,
                created_at=flag.created_at,
                created_by=str(flag.created_by_id)
            ))
        
        return flag_responses
    
    async def create_feature_flag(
        self,
        flag_data: CreateFeatureFlagRequest,
        user_id: str
    ) -> FeatureFlagResponse:
        """Create a feature flag"""
        
        # Check if flag name already exists
        existing_flag = await sync_to_async(
            FeatureFlag.objects.filter(tenant_id=self.tenant_id, name=flag_data.name).exists
        )()
        
        if existing_flag:
            raise ValidationError("Feature flag with this name already exists")
        
        # Create flag
        flag = await sync_to_async(FeatureFlag.objects.create)(
            tenant_id=self.tenant_id,
            name=flag_data.name,
            description=flag_data.description,
            is_enabled=flag_data.is_enabled,
            rollout_percentage=flag_data.rollout_percentage,
            created_by_id=user_id
        )
        
        # Log flag creation
        await self.audit_service.audit_action(
            user_id=user_id,
            action='create_feature_flag',
            resource_type='feature_flag',
            resource_id=str(flag.id),
            description=f'Created feature flag: {flag.name}'
        )
        
        return FeatureFlagResponse(
            id=flag.id,
            name=flag.name,
            description=flag.description,
            is_enabled=flag.is_enabled,
            rollout_percentage=flag.rollout_percentage,
            created_at=flag.created_at,
            created_by=str(flag.created_by_id)
        )
    
    async def update_feature_flag(
        self,
        flag_id: int,
        flag_data: UpdateFeatureFlagRequest,
        user_id: str
    ) -> FeatureFlagResponse:
        """Update a feature flag"""
        
        try:
            flag = await sync_to_async(FeatureFlag.objects.get)(
                id=flag_id,
                tenant_id=self.tenant_id
            )
            
            # Update fields
            if flag_data.name is not None:
                # Check if new name already exists
                existing_flag = await sync_to_async(
                    FeatureFlag.objects.filter(tenant_id=self.tenant_id, name=flag_data.name)
                    .exclude(id=flag_id).exists
                )()
                
                if existing_flag:
                    raise ValidationError("Feature flag with this name already exists")
                
                await sync_to_async(flag.__setattr__)('name', flag_data.name)
            
            if flag_data.description is not None:
                await sync_to_async(flag.__setattr__)('description', flag_data.description)
            
            if flag_data.is_enabled is not None:
                await sync_to_async(flag.__setattr__)('is_enabled', flag_data.is_enabled)
            
            if flag_data.rollout_percentage is not None:
                await sync_to_async(flag.__setattr__)('rollout_percentage', flag_data.rollout_percentage)
            
            await sync_to_async(flag.save)()
            
            # Log flag update
            await self.audit_service.audit_action(
                user_id=user_id,
                action='update_feature_flag',
                resource_type='feature_flag',
                resource_id=str(flag.id),
                description=f'Updated feature flag: {flag.name}'
            )
            
            return FeatureFlagResponse(
                id=flag.id,
                name=flag.name,
                description=flag.description,
                is_enabled=flag.is_enabled,
                rollout_percentage=flag.rollout_percentage,
                created_at=flag.created_at,
                created_by=str(flag.created_by_id)
            )
            
        except FeatureFlag.DoesNotExist:
            raise NotFoundError("Feature flag not found")
    
    async def get_audit_logs(
        self,
        limit: int = 100,
        offset: int = 0,
        resource_type: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> tuple[List[AuditLogResponse], int]:
        """Get audit logs"""
        
        queryset = AuditLog.objects.filter(tenant_id=self.tenant_id)
        
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        total = await sync_to_async(queryset.count)()
        
        logs = await sync_to_async(list)(
            queryset.order_by('-timestamp')[offset:offset + limit]
        )
        
        log_responses = []
        for log in logs:
            # Get user name
            user_name = "Unknown"
            try:
                user = await sync_to_async(User.objects.get)(id=log.user_id)
                user_name = user.get_full_name()
            except User.DoesNotExist:
                pass
            
            log_responses.append(AuditLogResponse(
                id=str(log.id),
                user_id=log.user_id,
                user_name=user_name,
                action=log.action,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                description=log.description,
                ip_address=log.ip_address,
                user_agent=log.user_agent,
                timestamp=log.timestamp
            ))
        
        return log_responses, total
    
    async def get_system_stats(self) -> SystemStatsResponse:
        """Get system statistics"""
        
        # Get counts
        total_users = await sync_to_async(UserProfile.objects.filter(tenant_id=self.tenant_id).count)()
        active_users = await sync_to_async(UserProfile.objects.filter(tenant_id=self.tenant_id, is_active=True).count)()
        total_properties = await sync_to_async(Property.objects.filter(tenant_id=self.tenant_id).count)()
        total_contacts = await sync_to_async(ContactPerson.objects.filter(tenant_id=self.tenant_id).count)()
        total_documents = await sync_to_async(Document.objects.filter(tenant_id=self.tenant_id).count)()
        total_tasks = await sync_to_async(Task.objects.filter(tenant_id=self.tenant_id).count)()
        
        # Get recent activity
        recent_logs, _ = await self.get_audit_logs(limit=10)
        
        # System health (mock data)
        system_health = {
            "database": "healthy",
            "api": "healthy",
            "storage": "healthy",
            "uptime": "99.9%"
        }
        
        return SystemStatsResponse(
            total_users=total_users,
            total_tenants=1,  # Single tenant for now
            active_users=active_users,
            total_properties=total_properties,
            total_contacts=total_contacts,
            total_documents=total_documents,
            total_tasks=total_tasks,
            system_health=system_health,
            recent_activity=recent_logs
        )
