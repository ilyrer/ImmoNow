"""
DSGVO Compliance Service
Handles data export, deletion, and anonymization for GDPR compliance
"""

import json
import zipfile
import io
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from django.db import transaction
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from asgiref.sync import sync_to_async

from app.db.models import (
    User, Tenant, TenantUser, Property, PropertyImage, PropertyDocument,
    Document, Contact, Task, TaskComment, TaskAttachment,
    SocialPost, InvestorProperty, MarketplacePackage,
    BillingAccount, AuditLog
)
from app.middleware.structured_logging import (
    log_audit_event,
    log_business_event,
    get_current_tenant_id,
    get_current_user_id
)


class DSGVOComplianceService:
    """Service for DSGVO compliance operations"""
    
    @staticmethod
    @sync_to_async
    @transaction.atomic
    async def export_user_data(user_id: str) -> Dict[str, Any]:
        """
        Export all user data for DSGVO compliance
        
        Args:
            user_id: User ID to export data for
            
        Returns:
            Dictionary containing all user data
        """
        try:
            user = await sync_to_async(User.objects.get)(id=user_id)
            
            # Collect all user data
            export_data = {
                "export_info": {
                    "exported_at": datetime.utcnow().isoformat() + "Z",
                    "user_id": str(user.id),
                    "email": user.email,
                    "export_type": "full_user_data"
                },
                "user_profile": {
                    "id": str(user.id),
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "phone": user.phone,
                    "is_active": user.is_active,
                    "email_verified": user.email_verified,
                    "created_at": user.created_at.isoformat() if user.created_at else None,
                    "last_login": user.last_login.isoformat() if user.last_login else None,
                    "updated_at": user.updated_at.isoformat() if user.updated_at else None
                },
                "tenant_memberships": [],
                "properties": [],
                "documents": [],
                "contacts": [],
                "tasks": [],
                "social_posts": [],
                "audit_logs": []
            }
            
            # Get tenant memberships
            tenant_users = await sync_to_async(list)(
                TenantUser.objects.filter(user_id=user_id).select_related('tenant')
            )
            
            for tenant_user in tenant_users:
                tenant_data = {
                    "tenant_id": str(tenant_user.tenant.id),
                    "tenant_name": tenant_user.tenant.name,
                    "tenant_slug": tenant_user.tenant.slug,
                    "role": tenant_user.role,
                    "scopes": tenant_user.scopes,
                    "can_manage_properties": tenant_user.can_manage_properties,
                    "can_manage_documents": tenant_user.can_manage_documents,
                    "can_manage_users": tenant_user.can_manage_users,
                    "can_view_analytics": tenant_user.can_view_analytics,
                    "can_export_data": tenant_user.can_export_data,
                    "is_active": tenant_user.is_active,
                    "joined_at": tenant_user.joined_at.isoformat() if tenant_user.joined_at else None
                }
                export_data["tenant_memberships"].append(tenant_data)
            
            # Get properties created by user
            properties = await sync_to_async(list)(
                Property.objects.filter(created_by_id=user_id).select_related('address', 'features')
            )
            
            for property in properties:
                property_data = {
                    "id": str(property.id),
                    "title": property.title,
                    "property_type": property.property_type,
                    "status": property.status,
                    "price": float(property.price) if property.price else None,
                    "area": property.area,
                    "rooms": property.rooms,
                    "description": property.description,
                    "address": {
                        "street": property.address.street if property.address else None,
                        "city": property.address.city if property.address else None,
                        "postal_code": property.address.postal_code if property.address else None,
                        "country": property.address.country if property.address else None
                    } if property.address else None,
                    "features": {
                        "balcony": property.features.balcony if property.features else None,
                        "elevator": property.features.elevator if property.features else None,
                        "parking": property.features.parking if property.features else None,
                        "garden": property.features.garden if property.features else None
                    } if property.features else None,
                    "created_at": property.created_at.isoformat() if property.created_at else None,
                    "updated_at": property.updated_at.isoformat() if property.updated_at else None
                }
                export_data["properties"].append(property_data)
            
            # Get documents uploaded by user
            documents = await sync_to_async(list)(
                Document.objects.filter(uploaded_by_id=user_id)
            )
            
            for document in documents:
                document_data = {
                    "id": str(document.id),
                    "name": document.name,
                    "url": document.url,
                    "document_type": document.document_type,
                    "size": document.size,
                    "mime_type": document.mime_type,
                    "description": document.description,
                    "tags": document.tags,
                    "uploaded_at": document.uploaded_at.isoformat() if document.uploaded_at else None,
                    "updated_at": document.updated_at.isoformat() if document.updated_at else None
                }
                export_data["documents"].append(document_data)
            
            # Get contacts created by user
            contacts = await sync_to_async(list)(
                Contact.objects.filter(created_by_id=user_id)
            )
            
            for contact in contacts:
                contact_data = {
                    "id": str(contact.id),
                    "first_name": contact.first_name,
                    "last_name": contact.last_name,
                    "email": contact.email,
                    "phone": contact.phone,
                    "company": contact.company,
                    "contact_type": contact.contact_type,
                    "notes": contact.notes,
                    "created_at": contact.created_at.isoformat() if contact.created_at else None,
                    "updated_at": contact.updated_at.isoformat() if contact.updated_at else None
                }
                export_data["contacts"].append(contact_data)
            
            # Get tasks assigned to user
            tasks = await sync_to_async(list)(
                Task.objects.filter(assigned_to_id=user_id).select_related('property', 'created_by')
            )
            
            for task in tasks:
                task_data = {
                    "id": str(task.id),
                    "title": task.title,
                    "description": task.description,
                    "status": task.status,
                    "priority": task.priority,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "property": {
                        "id": str(task.property.id),
                        "title": task.property.title
                    } if task.property else None,
                    "created_by": {
                        "id": str(task.created_by.id),
                        "name": f"{task.created_by.first_name} {task.created_by.last_name}"
                    } if task.created_by else None,
                    "created_at": task.created_at.isoformat() if task.created_at else None,
                    "updated_at": task.updated_at.isoformat() if task.updated_at else None
                }
                export_data["tasks"].append(task_data)
            
            # Get social posts by user
            social_posts = await sync_to_async(list)(
                SocialPost.objects.filter(author_id=user_id)
            )
            
            for post in social_posts:
                post_data = {
                    "id": str(post.id),
                    "content": post.content,
                    "platform": post.platform,
                    "status": post.status,
                    "scheduled_at": post.scheduled_at.isoformat() if post.scheduled_at else None,
                    "published_at": post.published_at.isoformat() if post.published_at else None,
                    "created_at": post.created_at.isoformat() if post.created_at else None
                }
                export_data["social_posts"].append(post_data)
            
            # Get audit logs for user
            audit_logs = await sync_to_async(list)(
                AuditLog.objects.filter(user_id=user_id).order_by('-created_at')[:100]
            )
            
            for log in audit_logs:
                log_data = {
                    "id": str(log.id),
                    "event_type": log.event_type,
                    "resource_type": log.resource_type,
                    "resource_id": log.resource_id,
                    "action": log.action,
                    "details": log.details,
                    "ip_address": log.ip_address,
                    "user_agent": log.user_agent,
                    "created_at": log.created_at.isoformat() if log.created_at else None
                }
                export_data["audit_logs"].append(log_data)
            
            # Log export event
            log_audit_event(
                event_type="user_data_exported",
                resource_type="user",
                resource_id=str(user.id),
                action="export",
                details={
                    "export_type": "full_user_data",
                    "properties_count": len(export_data["properties"]),
                    "documents_count": len(export_data["documents"]),
                    "contacts_count": len(export_data["contacts"]),
                    "tasks_count": len(export_data["tasks"])
                },
                user_id=str(user.id),
                tenant_id=get_current_tenant_id()
            )
            
            return export_data
            
        except Exception as e:
            log_audit_event(
                event_type="user_data_export_failed",
                resource_type="user",
                resource_id=user_id,
                action="export",
                details={"error": str(e)},
                user_id=get_current_user_id(),
                tenant_id=get_current_tenant_id()
            )
            raise
    
    @staticmethod
    @sync_to_async
    @transaction.atomic
    async def delete_user_data(user_id: str, soft_delete: bool = True) -> Dict[str, Any]:
        """
        Delete user data for DSGVO compliance
        
        Args:
            user_id: User ID to delete data for
            soft_delete: If True, anonymize data instead of hard delete
            
        Returns:
            Dictionary containing deletion summary
        """
        try:
            user = await sync_to_async(User.objects.get)(id=user_id)
            
            deletion_summary = {
                "user_id": str(user.id),
                "email": user.email,
                "deletion_type": "soft_delete" if soft_delete else "hard_delete",
                "deleted_at": datetime.utcnow().isoformat() + "Z",
                "deleted_items": {
                    "user_profile": False,
                    "tenant_memberships": 0,
                    "properties": 0,
                    "documents": 0,
                    "contacts": 0,
                    "tasks": 0,
                    "social_posts": 0,
                    "audit_logs": 0
                }
            }
            
            if soft_delete:
                # Anonymize user data
                anonymized_email = f"deleted_user_{hash(user.email)}@anonymized.local"
                anonymized_name = f"Deleted User {hash(user.email)}"
                
                # Anonymize user profile
                user.email = anonymized_email
                user.first_name = anonymized_name
                user.last_name = ""
                user.phone = ""
                user.is_active = False
                user.email_verified = False
                await sync_to_async(user.save)()
                deletion_summary["deleted_items"]["user_profile"] = True
                
                # Anonymize tenant memberships
                tenant_users = await sync_to_async(list)(
                    TenantUser.objects.filter(user_id=user_id)
                )
                for tenant_user in tenant_users:
                    tenant_user.is_active = False
                    await sync_to_async(tenant_user.save)()
                deletion_summary["deleted_items"]["tenant_memberships"] = len(tenant_users)
                
                # Anonymize properties (keep structure, anonymize personal data)
                properties = await sync_to_async(list)(
                    Property.objects.filter(created_by_id=user_id)
                )
                for property in properties:
                    # Keep property data but remove personal references
                    property.description = f"[Content anonymized - previously by {anonymized_name}]"
                    await sync_to_async(property.save)()
                deletion_summary["deleted_items"]["properties"] = len(properties)
                
                # Anonymize documents
                documents = await sync_to_async(list)(
                    Document.objects.filter(uploaded_by_id=user_id)
                )
                for document in documents:
                    document.name = f"[Anonymized] {document.name}"
                    document.description = f"[Content anonymized - previously by {anonymized_name}]"
                    await sync_to_async(document.save)()
                deletion_summary["deleted_items"]["documents"] = len(documents)
                
                # Anonymize contacts
                contacts = await sync_to_async(list)(
                    Contact.objects.filter(created_by_id=user_id)
                )
                for contact in contacts:
                    contact.first_name = f"Contact {hash(contact.email)}"
                    contact.last_name = ""
                    contact.email = f"contact_{hash(contact.email)}@anonymized.local"
                    contact.phone = ""
                    contact.company = ""
                    contact.notes = f"[Content anonymized - previously by {anonymized_name}]"
                    await sync_to_async(contact.save)()
                deletion_summary["deleted_items"]["contacts"] = len(contacts)
                
                # Anonymize tasks
                tasks = await sync_to_async(list)(
                    Task.objects.filter(assigned_to_id=user_id)
                )
                for task in tasks:
                    task.title = f"[Anonymized] {task.title}"
                    task.description = f"[Content anonymized - previously by {anonymized_name}]"
                    await sync_to_async(task.save)()
                deletion_summary["deleted_items"]["tasks"] = len(tasks)
                
                # Anonymize social posts
                social_posts = await sync_to_async(list)(
                    SocialPost.objects.filter(author_id=user_id)
                )
                for post in social_posts:
                    post.content = f"[Content anonymized - previously by {anonymized_name}]"
                    await sync_to_async(post.save)()
                deletion_summary["deleted_items"]["social_posts"] = len(social_posts)
                
                # Anonymize audit logs
                audit_logs = await sync_to_async(list)(
                    AuditLog.objects.filter(user_id=user_id)
                )
                for log in audit_logs:
                    log.details = f"[Content anonymized - previously by {anonymized_name}]"
                    await sync_to_async(log.save)()
                deletion_summary["deleted_items"]["audit_logs"] = len(audit_logs)
                
            else:
                # Hard delete (use with caution)
                # Delete tenant memberships
                tenant_users_count = await sync_to_async(
                    TenantUser.objects.filter(user_id=user_id).count
                )()
                await sync_to_async(TenantUser.objects.filter(user_id=user_id).delete)()
                deletion_summary["deleted_items"]["tenant_memberships"] = tenant_users_count
                
                # Delete user-created properties (be careful with shared data)
                properties_count = await sync_to_async(
                    Property.objects.filter(created_by_id=user_id).count
                )()
                await sync_to_async(Property.objects.filter(created_by_id=user_id).delete)()
                deletion_summary["deleted_items"]["properties"] = properties_count
                
                # Delete user-uploaded documents
                documents_count = await sync_to_async(
                    Document.objects.filter(uploaded_by_id=user_id).count
                )()
                await sync_to_async(Document.objects.filter(uploaded_by_id=user_id).delete)()
                deletion_summary["deleted_items"]["documents"] = documents_count
                
                # Delete user-created contacts
                contacts_count = await sync_to_async(
                    Contact.objects.filter(created_by_id=user_id).count
                )()
                await sync_to_async(Contact.objects.filter(created_by_id=user_id).delete)()
                deletion_summary["deleted_items"]["contacts"] = contacts_count
                
                # Delete user tasks
                tasks_count = await sync_to_async(
                    Task.objects.filter(assigned_to_id=user_id).count
                )()
                await sync_to_async(Task.objects.filter(assigned_to_id=user_id).delete)()
                deletion_summary["deleted_items"]["tasks"] = tasks_count
                
                # Delete social posts
                social_posts_count = await sync_to_async(
                    SocialPost.objects.filter(author_id=user_id).count
                )()
                await sync_to_async(SocialPost.objects.filter(author_id=user_id).delete)()
                deletion_summary["deleted_items"]["social_posts"] = social_posts_count
                
                # Delete audit logs
                audit_logs_count = await sync_to_async(
                    AuditLog.objects.filter(user_id=user_id).count
                )()
                await sync_to_async(AuditLog.objects.filter(user_id=user_id).delete)()
                deletion_summary["deleted_items"]["audit_logs"] = audit_logs_count
                
                # Finally delete user
                await sync_to_async(user.delete)()
                deletion_summary["deleted_items"]["user_profile"] = True
            
            # Log deletion event
            log_audit_event(
                event_type="user_data_deleted",
                resource_type="user",
                resource_id=str(user.id),
                action="delete",
                details={
                    "deletion_type": "soft_delete" if soft_delete else "hard_delete",
                    "deleted_items": deletion_summary["deleted_items"]
                },
                user_id=get_current_user_id(),
                tenant_id=get_current_tenant_id()
            )
            
            return deletion_summary
            
        except Exception as e:
            log_audit_event(
                event_type="user_data_deletion_failed",
                resource_type="user",
                resource_id=user_id,
                action="delete",
                details={"error": str(e)},
                user_id=get_current_user_id(),
                tenant_id=get_current_tenant_id()
            )
            raise
    
    @staticmethod
    @sync_to_async
    @transaction.atomic
    async def export_tenant_data(tenant_id: str) -> Dict[str, Any]:
        """
        Export all tenant data for DSGVO compliance
        
        Args:
            tenant_id: Tenant ID to export data for
            
        Returns:
            Dictionary containing all tenant data
        """
        try:
            tenant = await sync_to_async(Tenant.objects.get)(id=tenant_id)
            
            # Collect all tenant data
            export_data = {
                "export_info": {
                    "exported_at": datetime.utcnow().isoformat() + "Z",
                    "tenant_id": str(tenant.id),
                    "tenant_name": tenant.name,
                    "export_type": "full_tenant_data"
                },
                "tenant_info": {
                    "id": str(tenant.id),
                    "name": tenant.name,
                    "slug": tenant.slug,
                    "company_email": tenant.company_email,
                    "company_phone": tenant.company_phone,
                    "plan": tenant.plan,
                    "max_users": tenant.max_users,
                    "max_properties": tenant.max_properties,
                    "storage_limit_gb": tenant.storage_limit_gb,
                    "storage_bytes_used": tenant.storage_bytes_used,
                    "is_active": tenant.is_active,
                    "created_at": tenant.created_at.isoformat() if tenant.created_at else None,
                    "updated_at": tenant.updated_at.isoformat() if tenant.updated_at else None
                },
                "users": [],
                "properties": [],
                "documents": [],
                "contacts": [],
                "tasks": [],
                "billing": None
            }
            
            # Get all users in tenant
            users = await sync_to_async(list)(
                User.objects.filter(tenantuser__tenant_id=tenant_id).distinct()
            )
            
            for user in users:
                user_data = {
                    "id": str(user.id),
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "phone": user.phone,
                    "is_active": user.is_active,
                    "email_verified": user.email_verified,
                    "created_at": user.created_at.isoformat() if user.created_at else None,
                    "last_login": user.last_login.isoformat() if user.last_login else None
                }
                export_data["users"].append(user_data)
            
            # Get all properties in tenant
            properties = await sync_to_async(list)(
                Property.objects.filter(tenant_id=tenant_id).select_related('address', 'features', 'created_by')
            )
            
            for property in properties:
                property_data = {
                    "id": str(property.id),
                    "title": property.title,
                    "property_type": property.property_type,
                    "status": property.status,
                    "price": float(property.price) if property.price else None,
                    "area": property.area,
                    "rooms": property.rooms,
                    "description": property.description,
                    "created_by": {
                        "id": str(property.created_by.id),
                        "name": f"{property.created_by.first_name} {property.created_by.last_name}"
                    } if property.created_by else None,
                    "created_at": property.created_at.isoformat() if property.created_at else None,
                    "updated_at": property.updated_at.isoformat() if property.updated_at else None
                }
                export_data["properties"].append(property_data)
            
            # Get all documents in tenant
            documents = await sync_to_async(list)(
                Document.objects.filter(tenant_id=tenant_id).select_related('uploaded_by')
            )
            
            for document in documents:
                document_data = {
                    "id": str(document.id),
                    "name": document.name,
                    "url": document.url,
                    "document_type": document.document_type,
                    "size": document.size,
                    "mime_type": document.mime_type,
                    "description": document.description,
                    "tags": document.tags,
                    "uploaded_by": {
                        "id": str(document.uploaded_by.id),
                        "name": f"{document.uploaded_by.first_name} {document.uploaded_by.last_name}"
                    } if document.uploaded_by else None,
                    "uploaded_at": document.uploaded_at.isoformat() if document.uploaded_at else None,
                    "updated_at": document.updated_at.isoformat() if document.updated_at else None
                }
                export_data["documents"].append(document_data)
            
            # Get all contacts in tenant
            contacts = await sync_to_async(list)(
                Contact.objects.filter(tenant_id=tenant_id).select_related('created_by')
            )
            
            for contact in contacts:
                contact_data = {
                    "id": str(contact.id),
                    "first_name": contact.first_name,
                    "last_name": contact.last_name,
                    "email": contact.email,
                    "phone": contact.phone,
                    "company": contact.company,
                    "contact_type": contact.contact_type,
                    "notes": contact.notes,
                    "created_by": {
                        "id": str(contact.created_by.id),
                        "name": f"{contact.created_by.first_name} {contact.created_by.last_name}"
                    } if contact.created_by else None,
                    "created_at": contact.created_at.isoformat() if contact.created_at else None,
                    "updated_at": contact.updated_at.isoformat() if contact.updated_at else None
                }
                export_data["contacts"].append(contact_data)
            
            # Get all tasks in tenant
            tasks = await sync_to_async(list)(
                Task.objects.filter(tenant_id=tenant_id).select_related('property', 'assigned_to', 'created_by')
            )
            
            for task in tasks:
                task_data = {
                    "id": str(task.id),
                    "title": task.title,
                    "description": task.description,
                    "status": task.status,
                    "priority": task.priority,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "assigned_to": {
                        "id": str(task.assigned_to.id),
                        "name": f"{task.assigned_to.first_name} {task.assigned_to.last_name}"
                    } if task.assigned_to else None,
                    "created_by": {
                        "id": str(task.created_by.id),
                        "name": f"{task.created_by.first_name} {task.created_by.last_name}"
                    } if task.created_by else None,
                    "created_at": task.created_at.isoformat() if task.created_at else None,
                    "updated_at": task.updated_at.isoformat() if task.updated_at else None
                }
                export_data["tasks"].append(task_data)
            
            # Get billing information
            try:
                billing = await sync_to_async(BillingAccount.objects.get)(tenant_id=tenant_id)
                export_data["billing"] = {
                    "id": str(billing.id),
                    "stripe_customer_id": billing.stripe_customer_id,
                    "stripe_subscription_id": billing.stripe_subscription_id,
                    "plan_key": billing.plan_key,
                    "status": billing.status,
                    "current_period_start": billing.current_period_start.isoformat() if billing.current_period_start else None,
                    "current_period_end": billing.current_period_end.isoformat() if billing.current_period_end else None,
                    "cancel_at_period_end": billing.cancel_at_period_end,
                    "trial_end": billing.trial_end.isoformat() if billing.trial_end else None,
                    "created_at": billing.created_at.isoformat() if billing.created_at else None
                }
            except BillingAccount.DoesNotExist:
                export_data["billing"] = None
            
            # Log export event
            log_audit_event(
                event_type="tenant_data_exported",
                resource_type="tenant",
                resource_id=str(tenant.id),
                action="export",
                details={
                    "export_type": "full_tenant_data",
                    "users_count": len(export_data["users"]),
                    "properties_count": len(export_data["properties"]),
                    "documents_count": len(export_data["documents"]),
                    "contacts_count": len(export_data["contacts"]),
                    "tasks_count": len(export_data["tasks"])
                },
                user_id=get_current_user_id(),
                tenant_id=str(tenant.id)
            )
            
            return export_data
            
        except Exception as e:
            log_audit_event(
                event_type="tenant_data_export_failed",
                resource_type="tenant",
                resource_id=tenant_id,
                action="export",
                details={"error": str(e)},
                user_id=get_current_user_id(),
                tenant_id=get_current_tenant_id()
            )
            raise
    
    @staticmethod
    @sync_to_async
    @transaction.atomic
    async def delete_tenant_data(tenant_id: str, soft_delete: bool = True) -> Dict[str, Any]:
        """
        Delete tenant data for DSGVO compliance
        
        Args:
            tenant_id: Tenant ID to delete data for
            soft_delete: If True, anonymize data instead of hard delete
            
        Returns:
            Dictionary containing deletion summary
        """
        try:
            tenant = await sync_to_async(Tenant.objects.get)(id=tenant_id)
            
            deletion_summary = {
                "tenant_id": str(tenant.id),
                "tenant_name": tenant.name,
                "deletion_type": "soft_delete" if soft_delete else "hard_delete",
                "deleted_at": datetime.utcnow().isoformat() + "Z",
                "deleted_items": {
                    "tenant_info": False,
                    "users": 0,
                    "properties": 0,
                    "documents": 0,
                    "contacts": 0,
                    "tasks": 0,
                    "billing": False
                }
            }
            
            if soft_delete:
                # Anonymize tenant data
                tenant.name = f"Deleted Tenant {hash(tenant.name)}"
                tenant.company_email = f"deleted_{hash(tenant.company_email)}@anonymized.local"
                tenant.company_phone = ""
                tenant.is_active = False
                await sync_to_async(tenant.save)()
                deletion_summary["deleted_items"]["tenant_info"] = True
                
                # Deactivate all users in tenant
                users_count = await sync_to_async(
                    User.objects.filter(tenantuser__tenant_id=tenant_id).count
                )()
                
                tenant_users = await sync_to_async(list)(
                    TenantUser.objects.filter(tenant_id=tenant_id)
                )
                for tenant_user in tenant_users:
                    tenant_user.is_active = False
                    await sync_to_async(tenant_user.save)()
                
                deletion_summary["deleted_items"]["users"] = users_count
                
                # Anonymize properties
                properties = await sync_to_async(list)(
                    Property.objects.filter(tenant_id=tenant_id)
                )
                for property in properties:
                    property.title = f"[Anonymized] {property.title}"
                    property.description = f"[Content anonymized - tenant deleted]"
                    await sync_to_async(property.save)()
                deletion_summary["deleted_items"]["properties"] = len(properties)
                
                # Anonymize documents
                documents = await sync_to_async(list)(
                    Document.objects.filter(tenant_id=tenant_id)
                )
                for document in documents:
                    document.name = f"[Anonymized] {document.name}"
                    document.description = f"[Content anonymized - tenant deleted]"
                    await sync_to_async(document.save)()
                deletion_summary["deleted_items"]["documents"] = len(documents)
                
                # Anonymize contacts
                contacts = await sync_to_async(list)(
                    Contact.objects.filter(tenant_id=tenant_id)
                )
                for contact in contacts:
                    contact.first_name = f"Contact {hash(contact.email)}"
                    contact.last_name = ""
                    contact.email = f"contact_{hash(contact.email)}@anonymized.local"
                    contact.phone = ""
                    contact.company = ""
                    contact.notes = f"[Content anonymized - tenant deleted]"
                    await sync_to_async(contact.save)()
                deletion_summary["deleted_items"]["contacts"] = len(contacts)
                
                # Anonymize tasks
                tasks = await sync_to_async(list)(
                    Task.objects.filter(tenant_id=tenant_id)
                )
                for task in tasks:
                    task.title = f"[Anonymized] {task.title}"
                    task.description = f"[Content anonymized - tenant deleted]"
                    await sync_to_async(task.save)()
                deletion_summary["deleted_items"]["tasks"] = len(tasks)
                
                # Cancel billing
                try:
                    billing = await sync_to_async(BillingAccount.objects.get)(tenant_id=tenant_id)
                    billing.status = "cancelled"
                    billing.cancel_at_period_end = True
                    await sync_to_async(billing.save)()
                    deletion_summary["deleted_items"]["billing"] = True
                except BillingAccount.DoesNotExist:
                    pass
                
            else:
                # Hard delete (use with extreme caution)
                # Delete all related data
                users_count = await sync_to_async(
                    User.objects.filter(tenantuser__tenant_id=tenant_id).count
                )()
                await sync_to_async(User.objects.filter(tenantuser__tenant_id=tenant_id).delete)()
                deletion_summary["deleted_items"]["users"] = users_count
                
                properties_count = await sync_to_async(
                    Property.objects.filter(tenant_id=tenant_id).count
                )()
                await sync_to_async(Property.objects.filter(tenant_id=tenant_id).delete)()
                deletion_summary["deleted_items"]["properties"] = properties_count
                
                documents_count = await sync_to_async(
                    Document.objects.filter(tenant_id=tenant_id).count
                )()
                await sync_to_async(Document.objects.filter(tenant_id=tenant_id).delete)()
                deletion_summary["deleted_items"]["documents"] = documents_count
                
                contacts_count = await sync_to_async(
                    Contact.objects.filter(tenant_id=tenant_id).count
                )()
                await sync_to_async(Contact.objects.filter(tenant_id=tenant_id).delete)()
                deletion_summary["deleted_items"]["contacts"] = contacts_count
                
                tasks_count = await sync_to_async(
                    Task.objects.filter(tenant_id=tenant_id).count
                )()
                await sync_to_async(Task.objects.filter(tenant_id=tenant_id).delete)()
                deletion_summary["deleted_items"]["tasks"] = tasks_count
                
                # Delete billing
                billing_count = await sync_to_async(
                    BillingAccount.objects.filter(tenant_id=tenant_id).count
                )()
                await sync_to_async(BillingAccount.objects.filter(tenant_id=tenant_id).delete)()
                deletion_summary["deleted_items"]["billing"] = billing_count > 0
                
                # Finally delete tenant
                await sync_to_async(tenant.delete)()
                deletion_summary["deleted_items"]["tenant_info"] = True
            
            # Log deletion event
            log_audit_event(
                event_type="tenant_data_deleted",
                resource_type="tenant",
                resource_id=str(tenant.id),
                action="delete",
                details={
                    "deletion_type": "soft_delete" if soft_delete else "hard_delete",
                    "deleted_items": deletion_summary["deleted_items"]
                },
                user_id=get_current_user_id(),
                tenant_id=get_current_tenant_id()
            )
            
            return deletion_summary
            
        except Exception as e:
            log_audit_event(
                event_type="tenant_data_deletion_failed",
                resource_type="tenant",
                resource_id=tenant_id,
                action="delete",
                details={"error": str(e)},
                user_id=get_current_user_id(),
                tenant_id=get_current_tenant_id()
            )
            raise
    
    @staticmethod
    def create_export_zip(export_data: Dict[str, Any], filename: str) -> bytes:
        """
        Create a ZIP file containing the exported data
        
        Args:
            export_data: The exported data dictionary
            filename: Name for the ZIP file
            
        Returns:
            ZIP file as bytes
        """
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Add main data file
            zip_file.writestr(
                f"{filename}.json",
                json.dumps(export_data, indent=2, ensure_ascii=False)
            )
            
            # Add metadata file
            metadata = {
                "export_info": export_data.get("export_info", {}),
                "created_at": datetime.utcnow().isoformat() + "Z",
                "format_version": "1.0",
                "dsgvo_compliant": True
            }
            zip_file.writestr(
                "metadata.json",
                json.dumps(metadata, indent=2, ensure_ascii=False)
            )
            
            # Add README file
            readme_content = f"""
# DSGVO Data Export

This ZIP file contains a complete export of user/tenant data in compliance with GDPR (DSGVO) regulations.

## Contents

- `{filename}.json` - Main data export
- `metadata.json` - Export metadata
- `README.txt` - This file

## Data Structure

The main JSON file contains the following sections:
- export_info: Export metadata
- user_profile/tenant_info: Basic profile information
- tenant_memberships: Tenant associations
- properties: Property data
- documents: Document information
- contacts: Contact information
- tasks: Task information
- social_posts: Social media posts
- audit_logs: Audit trail

## Privacy Notice

This export contains personal data as defined by GDPR Article 4(1).
The data should be handled according to applicable privacy laws.

## Export Date

{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
"""
            zip_file.writestr("README.txt", readme_content)
        
        zip_buffer.seek(0)
        return zip_buffer.getvalue()
