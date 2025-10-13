"""
Notification Service
Business logic für automatische Notifications und Helper-Funktionen
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from django.utils import timezone

from app.models import (
    Notification, 
    NotificationPreference,
    User, 
    Tenant,
    Property,
    Contact,
    Task,
    Appointment,
)
from app.db.models.notification import (
    NotificationType,
    NotificationCategory,
    NotificationPriority,
)


class NotificationService:
    """Service for creating and managing notifications"""
    
    @staticmethod
    def create_notification(
        tenant: Tenant,
        user: User,
        title: str,
        message: str,
        type: NotificationType = NotificationType.INFO,
        category: NotificationCategory = NotificationCategory.SYSTEM,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        action_url: Optional[str] = None,
        action_label: Optional[str] = None,
        related_entity_type: Optional[str] = None,
        related_entity_id: Optional[str] = None,
        related_entity_title: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        expires_at: Optional[datetime] = None,
        created_by: Optional[User] = None,
    ) -> Notification:
        """Create a new notification"""
        
        # Check user preferences
        try:
            pref = NotificationPreference.objects.get(
                tenant=tenant,
                user=user,
                category=category.value
            )
            
            # Check if category is enabled
            if not pref.enabled or not pref.in_app_enabled:
                return None
            
            # Check minimum priority
            priority_order = {
                NotificationPriority.LOW: 0,
                NotificationPriority.NORMAL: 1,
                NotificationPriority.HIGH: 2,
                NotificationPriority.URGENT: 3,
            }
            
            min_priority_enum = NotificationPriority(pref.min_priority)
            if priority_order[priority] < priority_order[min_priority_enum]:
                return None
            
        except NotificationPreference.DoesNotExist:
            # No preference set, allow notification
            pass
        
        notification = Notification.objects.create(
            tenant=tenant,
            user=user,
            type=type.value,
            category=category.value,
            priority=priority.value,
            title=title,
            message=message,
            action_url=action_url,
            action_label=action_label,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            related_entity_title=related_entity_title,
            metadata=metadata or {},
            expires_at=expires_at,
            created_by=created_by,
        )
        
        return notification
    
    @staticmethod
    def notify_property_status_change(
        property_obj: Property,
        old_status: str,
        new_status: str,
        user: User,
    ):
        """Create notification for property status change"""
        return NotificationService.create_notification(
            tenant=property_obj.tenant,
            user=user,
            title=f"Immobilie Status geändert",
            message=f'Die Immobilie "{property_obj.title}" wurde von {old_status} zu {new_status} geändert.',
            type=NotificationType.INFO,
            category=NotificationCategory.PROPERTY,
            priority=NotificationPriority.NORMAL,
            action_url=f"/properties/{property_obj.id}",
            action_label="Immobilie anzeigen",
            related_entity_type="property",
            related_entity_id=str(property_obj.id),
            related_entity_title=property_obj.title,
            metadata={
                "icon": "building",
                "color": "blue"
            }
        )
    
    @staticmethod
    def notify_new_contact(
        contact: Contact,
        user: User,
    ):
        """Create notification for new contact"""
        return NotificationService.create_notification(
            tenant=contact.tenant,
            user=user,
            title="Neuer Kontakt hinzugefügt",
            message=f'Der Kontakt "{contact.name}" wurde erfolgreich hinzugefügt.',
            type=NotificationType.SUCCESS,
            category=NotificationCategory.CONTACT,
            priority=NotificationPriority.NORMAL,
            action_url=f"/contacts/{contact.id}",
            action_label="Kontakt anzeigen",
            related_entity_type="contact",
            related_entity_id=str(contact.id),
            related_entity_title=contact.name,
            metadata={
                "icon": "user-plus",
                "color": "green"
            }
        )
    
    @staticmethod
    def notify_task_assigned(
        task: Task,
        assignee: User,
        assigner: User,
    ):
        """Create notification for task assignment"""
        return NotificationService.create_notification(
            tenant=task.tenant,
            user=assignee,
            title="Neue Aufgabe zugewiesen",
            message=f'{assigner.get_full_name()} hat Ihnen die Aufgabe "{task.title}" zugewiesen.',
            type=NotificationType.INFO,
            category=NotificationCategory.TASK,
            priority=NotificationPriority(task.priority) if task.priority in [p.value for p in NotificationPriority] else NotificationPriority.NORMAL,
            action_url=f"/tasks/{task.id}",
            action_label="Aufgabe anzeigen",
            related_entity_type="task",
            related_entity_id=str(task.id),
            related_entity_title=task.title,
            created_by=assigner,
            metadata={
                "icon": "clipboard-check",
                "color": "blue",
                "assignerName": assigner.get_full_name()
            }
        )
    
    @staticmethod
    def notify_task_due_soon(
        task: Task,
        user: User,
    ):
        """Create notification for task due soon"""
        hours_until_due = (task.due_date - timezone.now()).total_seconds() / 3600
        
        if hours_until_due <= 24:
            message = f'Die Aufgabe "{task.title}" ist in {int(hours_until_due)} Stunden fällig!'
            priority = NotificationPriority.HIGH
        else:
            days_until_due = int(hours_until_due / 24)
            message = f'Die Aufgabe "{task.title}" ist in {days_until_due} Tagen fällig.'
            priority = NotificationPriority.NORMAL
        
        return NotificationService.create_notification(
            tenant=task.tenant,
            user=user,
            title="Aufgabe fällig bald",
            message=message,
            type=NotificationType.WARNING,
            category=NotificationCategory.TASK,
            priority=priority,
            action_url=f"/tasks/{task.id}",
            action_label="Aufgabe anzeigen",
            related_entity_type="task",
            related_entity_id=str(task.id),
            related_entity_title=task.title,
            metadata={
                "icon": "clock",
                "color": "orange"
            }
        )
    
    @staticmethod
    def notify_appointment_reminder(
        appointment: Appointment,
        user: User,
        minutes_before: int = 30,
    ):
        """Create notification for appointment reminder"""
        return NotificationService.create_notification(
            tenant=appointment.tenant,
            user=user,
            title="Termin-Erinnerung",
            message=f'Ihr Termin "{appointment.title}" beginnt in {minutes_before} Minuten.',
            type=NotificationType.REMINDER,
            category=NotificationCategory.APPOINTMENT,
            priority=NotificationPriority.HIGH,
            action_url=f"/appointments/{appointment.id}",
            action_label="Termin anzeigen",
            related_entity_type="appointment",
            related_entity_id=str(appointment.id),
            related_entity_title=appointment.title,
            metadata={
                "icon": "calendar",
                "color": "purple",
                "startTime": appointment.start_datetime.isoformat()
            }
        )
    
    @staticmethod
    def notify_document_uploaded(
        document_title: str,
        document_id: str,
        uploader: User,
        recipient: User,
        tenant: Tenant,
    ):
        """Create notification for document upload"""
        return NotificationService.create_notification(
            tenant=tenant,
            user=recipient,
            title="Neues Dokument hochgeladen",
            message=f'{uploader.get_full_name()} hat das Dokument "{document_title}" hochgeladen.',
            type=NotificationType.INFO,
            category=NotificationCategory.DOCUMENT,
            priority=NotificationPriority.NORMAL,
            action_url=f"/documents/{document_id}",
            action_label="Dokument anzeigen",
            related_entity_type="document",
            related_entity_id=document_id,
            related_entity_title=document_title,
            created_by=uploader,
            metadata={
                "icon": "file-text",
                "color": "blue",
                "uploaderName": uploader.get_full_name()
            }
        )
    
    @staticmethod
    def notify_system_message(
        tenant: Tenant,
        users: List[User],
        title: str,
        message: str,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        action_url: Optional[str] = None,
        action_label: Optional[str] = None,
    ) -> List[Notification]:
        """Send system notification to multiple users"""
        notifications = []
        
        for user in users:
            notification = NotificationService.create_notification(
                tenant=tenant,
                user=user,
                title=title,
                message=message,
                type=NotificationType.INFO,
                category=NotificationCategory.SYSTEM,
                priority=priority,
                action_url=action_url,
                action_label=action_label,
                metadata={
                    "icon": "info",
                    "color": "blue"
                }
            )
            if notification:
                notifications.append(notification)
        
        return notifications
    
    @staticmethod
    def cleanup_expired_notifications():
        """Delete expired notifications"""
        deleted_count, _ = Notification.objects.filter(
            expires_at__lte=timezone.now()
        ).delete()
        
        return deleted_count
    
    @staticmethod
    def cleanup_old_read_notifications(days: int = 30):
        """Delete old read notifications"""
        cutoff_date = timezone.now() - timedelta(days=days)
        deleted_count, _ = Notification.objects.filter(
            read=True,
            read_at__lte=cutoff_date
        ).delete()
        
        return deleted_count
