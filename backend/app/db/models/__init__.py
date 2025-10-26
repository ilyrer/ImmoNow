"""
Django Models for all domains
"""
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

# Import new auth models
from .tenant import Tenant
from .user import User, TenantUser, UserManager
from .email_log import EmailLog, EmailTemplateUsage
from .notification import Notification, NotificationPreference
from .billing import BillingAccount, StripeWebhookEvent
from .communications import (
    Conversation, ConversationParticipant, Message, MessageReadReceipt,
    MessageAttachment, TypingIndicator, UserPresence, MessageMention, MessageReaction
)

# Import admin models
from .employee import Employee, EmployeeCompensation
from .payroll import PayrollRun, PayrollEntry
from .employee_document import DocumentType, EmployeeDocument, DocumentTemplate
from .invitation import UserInvitation, InvitationLog

# Import HR models
from .hr import (
    LeaveRequest, Attendance, Overtime, Expense, HRDocument,
    LeaveType, LeaveStatus, ExpenseCategory, ExpenseStatus, DocumentType as HRDocumentType
)

# Export all models
__all__ = [
    'Tenant',
    'User', 
    'TenantUser',
    'UserManager',
    'UserProfile',
    'DocumentFolder',
    'Document',
    'DocumentVersion',
    'SocialAccount',
    'SocialPost',
    'SocialTemplate',
    'InvestorProperty',
    'InvestorReport',
    'MarketplacePackage',
    'PerformanceSnapshot',
    'VacancyRecord',
    'CostRecord',
    'ROISimulation',
    'PackageReservation',
    'Permission',
    'Role',
    'FeatureFlag',
    'Task',
    'TaskLabel',
    'TaskComment',
    'Property',
    'Address',
    'ContactPerson',
    'PropertyFeatures',
    'PropertyImage',
    'PropertyContact',
    'PropertyDocument',
    'ExposeVersion',
    'PublishJob',
    'IntegrationSettings',
    'TenantUsage',
    'PropertyViewEvent',
    'PropertyInquiryEvent',
    'Contact',
    'Appointment',
    'Attendee',
    'AuditLog',
    'Notification',
    'NotificationPreference',
    'EmailLog',
    'EmailTemplateUsage',
    'BillingAccount',
    'StripeWebhookEvent',
    'Conversation',
    'ConversationParticipant',
    'Message',
    'MessageReadReceipt',
    'MessageAttachment',
    'TypingIndicator',
    'UserPresence',
    'MessageMention',
    'MessageReaction',
    # Admin models
    'Employee',
    'EmployeeCompensation',
    'PayrollRun',
    'PayrollEntry',
    'DocumentType',
    'EmployeeDocument',
    'DocumentTemplate',
    'UserInvitation',
    'InvitationLog',
    # HR models
    'LeaveRequest',
    'Attendance',
    'Overtime',
    'Expense',
    'HRDocument',
    'LeaveType',
    'LeaveStatus',
    'ExpenseCategory',
    'ExpenseStatus',
    'HRDocumentType',
]


class UserProfile(models.Model):
    """Extended user profile"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='users')
    role = models.CharField(max_length=20, choices=[
        ('admin', 'Admin'),
        ('employee', 'Employee'),
        ('customer', 'Customer'),
    ])
    roles = models.ManyToManyField('Role', related_name='users', blank=True)  # RBAC roles
    avatar = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    last_login = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_profiles'
        indexes = [
            models.Index(fields=['tenant', 'role']),
            models.Index(fields=['tenant', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} ({self.tenant.name})"


# Document Models
class DocumentFolder(models.Model):
    """Document folder model"""
    id = models.AutoField(primary_key=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='document_folders')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True, related_name='subfolders')
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color
    icon = models.CharField(max_length=50, blank=True, null=True)
    is_system = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'document_folders'
        indexes = [
            models.Index(fields=['tenant', 'parent']),
            models.Index(fields=['tenant', 'name']),
        ]
    
    def __str__(self):
        return self.name


class Document(models.Model):
    """Document model"""
    DOCUMENT_TYPES = [
        ('contract', 'Contract'),
        ('expose', 'Expose'),
        ('energy_certificate', 'Energy Certificate'),
        ('floor_plan', 'Floor Plan'),
        ('photo', 'Photo'),
        ('video', 'Video'),
        ('document', 'Document'),
        ('presentation', 'Presentation'),
        ('spreadsheet', 'Spreadsheet'),
        ('pdf', 'PDF'),
        ('other', 'Other'),
    ]
    
    DOCUMENT_CATEGORIES = [
        ('legal', 'Legal'),
        ('marketing', 'Marketing'),
        ('technical', 'Technical'),
        ('financial', 'Financial'),
        ('administrative', 'Administrative'),
        ('other', 'Other'),
    ]
    
    DOCUMENT_STATUSES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('archived', 'Archived'),
        ('deleted', 'Deleted'),
    ]
    
    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
        ('team', 'Team'),
        ('restricted', 'Restricted'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='documents')
    name = models.CharField(max_length=255)
    original_name = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    category = models.CharField(max_length=50, choices=DOCUMENT_CATEGORIES)
    status = models.CharField(max_length=50, choices=DOCUMENT_STATUSES, default='active')
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='private')
    size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)
    url = models.URLField()
    thumbnail_url = models.URLField(blank=True, null=True)
    checksum = models.CharField(max_length=64, blank=True, null=True)  # SHA256 hash
    search_vector = models.TextField(blank=True, null=True)  # For full-text search
    ocr_text = models.TextField(blank=True, null=True)  # OCR extracted text
    property_id = models.UUIDField(blank=True, null=True)
    property_title = models.CharField(max_length=255, blank=True, null=True)
    contact_id = models.UUIDField(blank=True, null=True)
    contact_name = models.CharField(max_length=255, blank=True, null=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    version = models.IntegerField(default=1)
    tags = models.JSONField(default=list, blank=True)
    description = models.TextField(blank=True, null=True)
    expiry_date = models.DateTimeField(blank=True, null=True)
    is_favorite = models.BooleanField(default=False)
    view_count = models.IntegerField(default=0)
    download_count = models.IntegerField(default=0)
    folder = models.ForeignKey(DocumentFolder, on_delete=models.SET_NULL, blank=True, null=True)
    
    class Meta:
        db_table = 'documents'
        indexes = [
            models.Index(fields=['tenant', 'type']),
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['tenant', 'uploaded_at']),
            models.Index(fields=['tenant', 'folder']),
            models.Index(fields=['tenant', 'is_favorite']),
        ]
    
    def __str__(self):
        return self.title


class DocumentVersion(models.Model):
    """Document version model for versioning"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField()
    file_url = models.URLField()
    file_size = models.BigIntegerField()
    checksum = models.CharField(max_length=64)  # SHA256 hash
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    change_notes = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'document_versions'
        indexes = [
            models.Index(fields=['document', 'version_number']),
            models.Index(fields=['document', 'created_at']),
        ]
        unique_together = ['document', 'version_number']
    
    def __str__(self):
        return f"{self.document.title} v{self.version_number}"


# Social Media Models
class SocialAccount(models.Model):
    """Social media account model"""
    PLATFORM_CHOICES = [
        ('facebook', 'Facebook'),
        ('linkedin', 'LinkedIn'),
        ('twitter', 'Twitter'),
        ('instagram', 'Instagram'),
        ('tiktok', 'TikTok'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='social_accounts')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    account_id = models.CharField(max_length=255)  # Platform-specific account ID
    account_name = models.CharField(max_length=255)
    access_token = models.TextField()  # Encrypted token
    refresh_token = models.TextField(blank=True, null=True)  # Encrypted refresh token
    token_expires_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    last_sync_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'social_accounts'
        indexes = [
            models.Index(fields=['tenant', 'platform']),
            models.Index(fields=['tenant', 'is_active']),
        ]
        unique_together = ['tenant', 'platform', 'account_id']
    
    def __str__(self):
        return f"{self.platform}: {self.account_name}"


class SocialPost(models.Model):
    """Social media post model"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('published', 'Published'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='social_posts')
    account = models.ForeignKey(SocialAccount, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    media_urls = models.JSONField(default=list, blank=True)  # List of media URLs
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    scheduled_at = models.DateTimeField(blank=True, null=True)
    published_at = models.DateTimeField(blank=True, null=True)
    platform_post_id = models.CharField(max_length=255, blank=True, null=True)  # Platform's post ID
    metrics = models.JSONField(default=dict, blank=True)  # reach, clicks, comments, shares
    error_message = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'social_posts'
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['tenant', 'scheduled_at']),
            models.Index(fields=['tenant', 'published_at']),
            models.Index(fields=['account', 'status']),
        ]
    
    def __str__(self):
        return f"{self.account.platform}: {self.content[:50]}..."


class SocialTemplate(models.Model):
    """Social media post template model"""
    TEMPLATE_TYPE_CHOICES = [
        ('property_sale', 'Property Sale'),
        ('property_rent', 'Property Rent'),
        ('market_update', 'Market Update'),
        ('company_news', 'Company News'),
        ('investment_tip', 'Investment Tip'),
        ('general', 'General'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='social_templates')
    name = models.CharField(max_length=255)
    template_type = models.CharField(max_length=50, choices=TEMPLATE_TYPE_CHOICES)
    content_template = models.TextField()
    hashtags = models.JSONField(default=list, blank=True)
    platforms = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'social_templates'
        indexes = [
            models.Index(fields=['tenant', 'template_type']),
            models.Index(fields=['tenant', 'is_active']),
            models.Index(fields=['tenant', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.template_type})"




# RBAC Models
class Permission(models.Model):
    """Permission model for RBAC"""
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)  # e.g. 'properties:read', 'contacts:write'
    description = models.TextField()
    category = models.CharField(max_length=50)  # 'properties', 'contacts', 'documents', etc.
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'permissions'
        indexes = [
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return self.name


class Role(models.Model):
    """Role model for RBAC"""
    id = models.AutoField(primary_key=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='roles')
    name = models.CharField(max_length=100)
    description = models.TextField()
    permissions = models.ManyToManyField(Permission, related_name='roles')
    is_system = models.BooleanField(default=False)  # Admin, Manager, User
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'roles'
        indexes = [
            models.Index(fields=['tenant', 'is_system']),
        ]
        unique_together = ['tenant', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.tenant.name})"


class FeatureFlag(models.Model):
    """Feature flag model"""
    id = models.AutoField(primary_key=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='feature_flags', blank=True, null=True)  # Null = global
    name = models.CharField(max_length=100)
    description = models.TextField()
    is_enabled = models.BooleanField(default=False)
    rollout_percentage = models.IntegerField(default=0)  # 0-100
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'feature_flags'
        indexes = [
            models.Index(fields=['tenant', 'is_enabled']),
        ]
        unique_together = ['tenant', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.tenant.name if self.tenant else 'Global'})"


# Task Models
class TaskPriority(models.TextChoices):
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    URGENT = 'urgent', 'Urgent'


class TaskStatus(models.TextChoices):
    BACKLOG = 'backlog', 'Backlog'
    TODO = 'todo', 'To Do'
    IN_PROGRESS = 'in_progress', 'In Progress'
    REVIEW = 'review', 'Review'
    DONE = 'done', 'Done'
    BLOCKED = 'blocked', 'Blocked'


class Task(models.Model):
    """Task model"""
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('review', 'Review'),
        ('done', 'Done'),
        ('blocked', 'Blocked'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    assignee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks', null=True, blank=True)
    due_date = models.DateTimeField()
    start_date = models.DateTimeField(blank=True, null=True)
    progress = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    estimated_hours = models.IntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(1000)])
    actual_hours = models.IntegerField(blank=True, null=True, validators=[MinValueValidator(0)])
    position = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    tags = models.JSONField(default=list, blank=True)
    property_id = models.UUIDField(blank=True, null=True)
    financing_status = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    archived = models.BooleanField(default=False)
    
    # New Kanban fields
    story_points = models.IntegerField(null=True, blank=True)
    sprint = models.ForeignKey('Sprint', on_delete=models.SET_NULL, null=True, blank=True)
    labels = models.ManyToManyField('TaskLabel', blank=True, related_name='tasks')
    blocked_reason = models.TextField(blank=True, null=True)
    blocked_by_task = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    epic_link = models.UUIDField(null=True, blank=True)
    issue_type = models.CharField(max_length=50, default='task', choices=[
        ('task', 'Task'),
        ('story', 'Story'),
        ('bug', 'Bug'),
        ('epic', 'Epic')
    ])
    
    class Meta:
        db_table = 'tasks'
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['tenant', 'priority']),
            models.Index(fields=['tenant', 'assignee']),
            models.Index(fields=['tenant', 'due_date']),
            models.Index(fields=['tenant', 'created_at']),
        ]
    
    def __str__(self):
        return self.title


class TaskLabel(models.Model):
    """Task label model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='task_labels')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#3B82F6')
    description = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'task_labels'
        unique_together = ['tenant', 'name']
    
    def __str__(self):
        return self.name


class TaskComment(models.Model):
    """Task comment model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True, related_name='replies')
    
    class Meta:
        db_table = 'task_comments'
        indexes = [
            models.Index(fields=['task', 'timestamp']),
        ]
    
    def __str__(self):
        return f"Comment by {self.author.get_full_name()} on {self.task.title}"


class TaskSubtask(models.Model):
    """Subtask model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
    title = models.CharField(max_length=200)
    completed = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'task_subtasks'
        ordering = ['order']
    
    def __str__(self):
        return self.title


class TaskAttachment(models.Model):
    """Task attachment model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    name = models.CharField(max_length=255)
    file_url = models.URLField()
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'task_attachments'
    
    def __str__(self):
        return self.name


class TaskWatcher(models.Model):
    """Task watcher model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='watchers')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'task_watchers'
        unique_together = ['task', 'user']
    
    def __str__(self):
        return f"{self.user.username} watching {self.task.title}"


class Sprint(models.Model):
    """Sprint model for agile planning"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    goal = models.TextField(blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=[
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('completed', 'Completed')
    ], default='planning')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'sprints'
    
    def __str__(self):
        return self.name


# Property Models
class PropertyType(models.TextChoices):
    APARTMENT = 'apartment', 'Apartment'
    HOUSE = 'house', 'House'
    COMMERCIAL = 'commercial', 'Commercial'
    LAND = 'land', 'Land'
    OFFICE = 'office', 'Office'
    RETAIL = 'retail', 'Retail'
    INDUSTRIAL = 'industrial', 'Industrial'


class Property(models.Model):
    """Property model"""
    PROPERTY_TYPE_CHOICES = [
        ('apartment', 'Apartment'),
        ('house', 'House'),
        ('commercial', 'Commercial'),
        ('land', 'Land'),
        ('office', 'Office'),
        ('retail', 'Retail'),
        ('industrial', 'Industrial'),
    ]
    
    PRICE_TYPE_CHOICES = [
        ('sale', 'Sale'),
        ('rent', 'Rent'),
    ]
    
    STATUS_CHOICES = [
        ('vorbereitung', 'Vorbereitung'),
        ('aktiv', 'Aktiv'),
        ('reserviert', 'Reserviert'),
        ('verkauft', 'Verkauft'),
        ('zurückgezogen', 'Zurückgezogen'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='properties')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, default='vorbereitung', choices=STATUS_CHOICES)
    property_type = models.CharField(max_length=50, choices=PROPERTY_TYPE_CHOICES)
    
    # Price fields
    price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    price_currency = models.CharField(max_length=3, default='EUR')
    price_type = models.CharField(max_length=20, choices=PRICE_TYPE_CHOICES, default='sale')
    
    location = models.CharField(max_length=255)
    
    # Area fields
    living_area = models.IntegerField(blank=True, null=True, help_text="Wohnfläche in m²")
    total_area = models.IntegerField(blank=True, null=True, help_text="Gesamtfläche in m²")
    plot_area = models.IntegerField(blank=True, null=True, help_text="Grundstücksfläche in m²")
    
    # Room fields
    rooms = models.IntegerField(blank=True, null=True, help_text="Anzahl Zimmer")
    bedrooms = models.IntegerField(blank=True, null=True, help_text="Anzahl Schlafzimmer")
    bathrooms = models.IntegerField(blank=True, null=True, help_text="Anzahl Bäder")
    floors = models.IntegerField(blank=True, null=True, help_text="Anzahl Etagen")
    
    # Building info
    year_built = models.IntegerField(blank=True, null=True)
    energy_class = models.CharField(
        max_length=10, 
        blank=True, 
        null=True,
        choices=[
            ('A+', 'A+'),
            ('A', 'A'),
            ('B', 'B'),
            ('C', 'C'),
            ('D', 'D'),
            ('E', 'E'),
            ('F', 'F'),
            ('G', 'G'),
            ('H', 'H'),
        ],
        help_text="Energieeffizienzklasse"
    )
    energy_consumption = models.IntegerField(blank=True, null=True, help_text="kWh/m²a")
    heating_type = models.CharField(max_length=100, blank=True, null=True)
    
    # Energy Certificate fields
    energy_certificate_type = models.CharField(max_length=50, blank=True, null=True, choices=[
        ('bedarfsausweis', 'Bedarfsausweis'),
        ('verbrauchsausweis', 'Verbrauchsausweis'),
    ])
    energy_certificate_valid_until = models.DateField(blank=True, null=True)
    energy_certificate_issue_date = models.DateField(blank=True, null=True)
    co2_emissions = models.IntegerField(blank=True, null=True, help_text="CO₂-Emissionen in kg/m²a")
    
    # Location coordinates
    coordinates_lat = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    coordinates_lng = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    
    # Additional data
    amenities = models.JSONField(default=list, blank=True, help_text="Liste von Ausstattungsmerkmalen")
    tags = models.JSONField(default=list, blank=True, help_text="Tags für Kategorisierung")
    
    # Equipment and additional information
    equipment_description = models.TextField(blank=True, null=True, help_text="Detaillierte Ausstattungsbeschreibung")
    additional_info = models.TextField(blank=True, null=True, help_text="Sonstige Angaben und Informationen")
    
    # PropStack-style additional fields
    internal_id = models.CharField(max_length=50, blank=True, null=True, help_text="Auftragnummer - eindeutige interne Referenznummer")
    unit_number = models.CharField(max_length=50, blank=True, null=True, help_text="Einheitennummer")
    project_id = models.CharField(max_length=100, blank=True, null=True, help_text="Projekt-ID oder Projektname")
    floor_number = models.CharField(max_length=20, blank=True, null=True, help_text="Etage (z.B. EG, 1.OG, 2.OG, DG)")
    condition_status = models.CharField(max_length=50, blank=True, null=True, choices=[
        ('neuwertig', 'Neuwertig'),
        ('saniert', 'Saniert'),
        ('renovierungsbedürftig', 'Renovierungsbedürftig'),
        ('modernisiert', 'Modernisiert'),
        ('altbau', 'Altbau'),
        ('unsaniert', 'Unsaniert'),
    ], help_text="Zustand der Immobilie")
    availability_date = models.DateField(blank=True, null=True, help_text="Verfügbar ab")
    commission = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text="Provision in %")
    parking_type = models.CharField(max_length=50, blank=True, null=True, choices=[
        ('garage', 'Garage'),
        ('carport', 'Carport'),
        ('tiefgarage', 'Tiefgarage'),
        ('außenstellplatz', 'Außenstellplatz'),
        ('keine', 'Keine'),
    ], help_text="Art der Stellplätze")
    object_description = models.TextField(blank=True, null=True, help_text="Objektbeschreibung (zusätzlich zu description)")
    location_description = models.TextField(blank=True, null=True, help_text="Lagebeschreibung")
    last_modernization = models.IntegerField(blank=True, null=True, help_text="Jahr der letzten Modernisierung")
    construction_phase = models.CharField(max_length=50, blank=True, null=True, help_text="Baujahr-Text (z.B. 'ca. 1990', 'Neubau')")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'properties'
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['tenant', 'property_type']),
            models.Index(fields=['tenant', 'price']),
            models.Index(fields=['tenant', 'created_at']),
            models.Index(fields=['tenant', 'internal_id']),
            models.Index(fields=['internal_id']),
        ]
    
    def __str__(self):
        return self.title


class PropertyContact(models.Model):
    """Junction table for Property-Contact relationships"""
    ROLE_CHOICES = [
        ('owner', 'Eigentümer'),
        ('agent', 'Makler'),
        ('manager', 'Verwalter'),
        ('tenant', 'Mieter'),
        ('buyer', 'Käufer'),
        ('interested', 'Interessent'),
        ('contact_person', 'Ansprechpartner'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='property_contacts')
    contact = models.ForeignKey('Contact', on_delete=models.CASCADE, related_name='property_contacts')
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, help_text="Rolle des Kontakts")
    is_primary = models.BooleanField(default=False, help_text="Hauptkontakt für diese Rolle")
    notes = models.TextField(blank=True, null=True, help_text="Notizen zur Verknüpfung")
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'property_contacts'
        indexes = [
            models.Index(fields=['property', 'role']),
            models.Index(fields=['contact', 'role']),
            models.Index(fields=['property', 'is_primary']),
        ]
        unique_together = ['property', 'contact', 'role']
    
    def __str__(self):
        return f"{self.property.title} - {self.contact.name} ({self.get_role_display()})"


class PortalConnection(models.Model):
    """OAuth-Verbindungen zu Immobilienportalen"""
    PORTAL_CHOICES = [
        ('immoscout24', 'Immoscout24'),
        ('immowelt', 'Immowelt'),
        ('kleinanzeigen', 'eBay Kleinanzeigen'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='portal_connections')
    portal = models.CharField(max_length=50, choices=PORTAL_CHOICES, help_text="Portal-Name")
    
    # OAuth-Daten
    access_token = models.TextField(help_text="OAuth Access Token")
    refresh_token = models.TextField(blank=True, null=True, help_text="OAuth Refresh Token")
    token_expires_at = models.DateTimeField(help_text="Token-Ablaufzeit")
    scope = models.TextField(help_text="OAuth Scopes (kommagetrennt)")
    
    # Portal-spezifische Daten
    portal_user_id = models.CharField(max_length=100, help_text="Benutzer-ID im Portal")
    portal_username = models.CharField(max_length=200, blank=True, null=True, help_text="Benutzername im Portal")
    portal_email = models.EmailField(blank=True, null=True, help_text="E-Mail im Portal")
    
    # Status
    is_active = models.BooleanField(default=True, help_text="Verbindung ist aktiv")
    last_sync_at = models.DateTimeField(blank=True, null=True, help_text="Letzte Synchronisation")
    last_error = models.TextField(blank=True, null=True, help_text="Letzter Fehler")
    
    # Metadaten
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'portal_connections'
        unique_together = ['tenant', 'portal']
        indexes = [
            models.Index(fields=['tenant', 'portal']),
            models.Index(fields=['portal', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.get_portal_display()} - {self.tenant.name}"
    
    def is_token_expired(self):
        """Prüft ob der Token abgelaufen ist"""
        return timezone.now() >= self.token_expires_at
    
    def needs_refresh(self):
        """Prüft ob der Token bald abläuft (5 Minuten vorher)"""
        return timezone.now() >= self.token_expires_at - timedelta(minutes=5)


class PortalPublishJob(models.Model):
    """Veröffentlichungs-Jobs für Portale"""
    STATUS_CHOICES = [
        ('pending', 'Ausstehend'),
        ('publishing', 'Wird veröffentlicht'),
        ('published', 'Veröffentlicht'),
        ('failed', 'Fehlgeschlagen'),
        ('paused', 'Pausiert'),
        ('unpublished', 'Zurückgezogen'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='portal_jobs')
    portal_connection = models.ForeignKey(PortalConnection, on_delete=models.CASCADE, related_name='publish_jobs')
    
    # Portal-spezifische IDs
    portal_property_id = models.CharField(max_length=100, blank=True, null=True, help_text="Property-ID im Portal")
    portal_url = models.URLField(blank=True, null=True, help_text="URL der Veröffentlichung")
    
    # Status und Metadaten
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, null=True, help_text="Fehlermeldung")
    retry_count = models.IntegerField(default=0, help_text="Anzahl Wiederholungsversuche")
    
    # Portal-spezifische Daten
    portal_data = models.JSONField(default=dict, help_text="Portal-spezifische Daten")
    sync_data = models.JSONField(default=dict, help_text="Synchronisierte Daten")
    
    # Metadaten
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(blank=True, null=True, help_text="Veröffentlichungszeit")
    last_sync_at = models.DateTimeField(blank=True, null=True, help_text="Letzte Synchronisation")
    
    class Meta:
        db_table = 'portal_publish_jobs'
        unique_together = ['property', 'portal_connection']
        indexes = [
            models.Index(fields=['property', 'status']),
            models.Index(fields=['portal_connection', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.property.title} - {self.portal_connection.get_portal_display()} ({self.get_status_display()})"


class PortalSyncLog(models.Model):
    """Log für Portal-Synchronisationen"""
    LOG_LEVEL_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warnung'),
        ('error', 'Fehler'),
        ('success', 'Erfolg'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    portal_connection = models.ForeignKey(PortalConnection, on_delete=models.CASCADE, related_name='sync_logs')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='sync_logs', blank=True, null=True)
    
    level = models.CharField(max_length=20, choices=LOG_LEVEL_CHOICES)
    message = models.TextField(help_text="Log-Nachricht")
    details = models.JSONField(default=dict, help_text="Zusätzliche Details")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'portal_sync_logs'
        indexes = [
            models.Index(fields=['portal_connection', 'created_at']),
            models.Index(fields=['property', 'created_at']),
            models.Index(fields=['level', 'created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_level_display()} - {self.message[:50]}"


# Add to __all__ export
__all__ = [
    'User', 'Tenant', 'TenantUser', 'AuditLog', 'NotificationPreference', 'Notification',
    'Contact', 'ContactPerson', 'Property', 'Address', 'PropertyFeatures', 'PropertyImage', 
    'PropertyDocument', 'PropertyContact', 'PortalConnection', 'PortalPublishJob', 'PortalSyncLog',
    'Task', 'Project', 'Sprint', 'Label', 'Attachment', 'Comment', 'Subtask',
    'InvestorProperty', 'InvestorReport', 'MarketplacePackage', 'CostRecord', 'PackageReservation',
    'PerformanceSnapshot', 'UsageTracking', 'Employee', 'AnnualLeave', 'Expense', 'ExpenseCategory',
    'TikTokAccount', 'TikTokVideo', 'TikTokAnalytics', 'HRDocument', 'Payroll', 'TimeTracking',
]


# Investor Models

class InvestorProperty(models.Model):
    """Extended property data for investors"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.OneToOneField(Property, on_delete=models.CASCADE, related_name='investor_data')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='investor_properties')
    purchase_date = models.DateField()
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2)
    current_value = models.DecimalField(max_digits=12, decimal_places=2)
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    occupancy_rate = models.DecimalField(max_digits=5, decimal_places=2, default=100.0)
    maintenance_costs = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    property_tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    insurance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    management_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'investor_properties'
        indexes = [
            models.Index(fields=['tenant', 'purchase_date']),
            models.Index(fields=['tenant', 'current_value']),
        ]
    
    def __str__(self):
        return f"Investor Data for {self.property.title}"


class InvestorReport(models.Model):
    """Investor report model"""
    REPORT_TYPE_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annual', 'Annual'),
        ('custom', 'Custom'),
    ]
    
    STATUS_CHOICES = [
        ('generating', 'Generating'),
        ('generated', 'Generated'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='investor_reports')
    title = models.CharField(max_length=255)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE_CHOICES)
    period_start = models.DateField()
    period_end = models.DateField()
    generated_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='generating')
    file_url = models.URLField(blank=True, null=True)
    summary = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'investor_reports'
        indexes = [
            models.Index(fields=['tenant', 'report_type']),
            models.Index(fields=['tenant', 'generated_at']),
            models.Index(fields=['tenant', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.report_type})"


class MarketplacePackage(models.Model):
    """Marketplace investment package model"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('available', 'Available'),
        ('reserved', 'Reserved'),
        ('sold_out', 'Sold Out'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='marketplace_packages')
    title = models.CharField(max_length=255)
    description = models.TextField()
    location = models.CharField(max_length=255)
    total_value = models.DecimalField(max_digits=12, decimal_places=2)
    expected_roi = models.DecimalField(max_digits=5, decimal_places=2)
    min_investment = models.DecimalField(max_digits=12, decimal_places=2)
    max_investors = models.IntegerField()
    current_investors = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    expires_at = models.DateTimeField()
    property_count = models.IntegerField()
    property_types = models.JSONField(default=list, blank=True)
    properties = models.ManyToManyField(Property, blank=True, related_name='marketplace_packages')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'marketplace_packages'
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['tenant', 'expires_at']),
            models.Index(fields=['tenant', 'expected_roi']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.location}"


class PerformanceSnapshot(models.Model):
    """Performance snapshot for historical tracking"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='performance_snapshots')
    snapshot_date = models.DateField()
    total_portfolio_value = models.DecimalField(max_digits=12, decimal_places=2)
    average_roi = models.DecimalField(max_digits=5, decimal_places=2)
    total_cashflow = models.DecimalField(max_digits=12, decimal_places=2)
    vacancy_rate = models.DecimalField(max_digits=5, decimal_places=2)
    asset_count = models.IntegerField()
    monthly_income = models.DecimalField(max_digits=10, decimal_places=2)
    annual_return = models.DecimalField(max_digits=12, decimal_places=2)
    portfolio_growth = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'performance_snapshots'
        indexes = [
            models.Index(fields=['tenant', 'snapshot_date']),
            models.Index(fields=['tenant', 'created_at']),
        ]
        unique_together = ['tenant', 'snapshot_date']
    
    def __str__(self):
        return f"Performance Snapshot {self.snapshot_date} - {self.tenant.name}"


class VacancyRecord(models.Model):
    """Vacancy tracking record for properties"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='vacancy_records')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='vacancy_records')
    record_date = models.DateField()
    vacancy_rate = models.DecimalField(max_digits=5, decimal_places=2)
    vacant_units = models.IntegerField(default=0)
    total_units = models.IntegerField(default=1)
    vacancy_costs = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'vacancy_records'
        indexes = [
            models.Index(fields=['tenant', 'record_date']),
            models.Index(fields=['property', 'record_date']),
            models.Index(fields=['tenant', 'property', 'record_date']),
        ]
    
    def __str__(self):
        return f"Vacancy Record {self.property.title} - {self.record_date}"


class CostRecord(models.Model):
    """Cost tracking record for properties"""
    COST_CATEGORIES = [
        ('maintenance', 'Maintenance'),
        ('utilities', 'Utilities'),
        ('management', 'Management'),
        ('insurance', 'Insurance'),
        ('property_tax', 'Property Tax'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='cost_records')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='cost_records')
    record_date = models.DateField()
    category = models.CharField(max_length=50, choices=COST_CATEGORIES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    invoice_number = models.CharField(max_length=100, blank=True, null=True)
    vendor = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'cost_records'
        indexes = [
            models.Index(fields=['tenant', 'record_date']),
            models.Index(fields=['property', 'record_date']),
            models.Index(fields=['tenant', 'category', 'record_date']),
        ]
    
    def __str__(self):
        return f"Cost Record {self.property.title} - {self.category} - {self.record_date}"


class ROISimulation(models.Model):
    """Saved ROI simulation"""
    SCENARIO_CHOICES = [
        ('optimistic', 'Optimistic'),
        ('realistic', 'Realistic'),
        ('pessimistic', 'Pessimistic'),
        ('custom', 'Custom'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='roi_simulations')
    name = models.CharField(max_length=255)
    scenario = models.CharField(max_length=50, choices=SCENARIO_CHOICES)
    
    # Investment parameters
    property_value = models.DecimalField(max_digits=12, decimal_places=2)
    down_payment = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    loan_term_years = models.IntegerField()
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    vacancy_rate = models.DecimalField(max_digits=5, decimal_places=2)
    maintenance_rate = models.DecimalField(max_digits=5, decimal_places=2)
    property_tax_rate = models.DecimalField(max_digits=5, decimal_places=2)
    insurance_rate = models.DecimalField(max_digits=5, decimal_places=2)
    management_fee_rate = models.DecimalField(max_digits=5, decimal_places=2)
    appreciation_rate = models.DecimalField(max_digits=5, decimal_places=2)
    
    # Results
    monthly_cashflow = models.DecimalField(max_digits=10, decimal_places=2)
    annual_cashflow = models.DecimalField(max_digits=12, decimal_places=2)
    annual_roi = models.DecimalField(max_digits=5, decimal_places=2)
    total_return_5y = models.DecimalField(max_digits=5, decimal_places=2)
    total_return_10y = models.DecimalField(max_digits=5, decimal_places=2)
    break_even_months = models.IntegerField()
    net_present_value = models.DecimalField(max_digits=12, decimal_places=2)
    internal_rate_return = models.DecimalField(max_digits=5, decimal_places=2)
    cash_on_cash_return = models.DecimalField(max_digits=5, decimal_places=2)
    
    # Additional data
    roi_projection = models.JSONField(default=list, blank=True)  # Array of ROI values over time
    scenarios = models.JSONField(default=list, blank=True)  # Different scenario results
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'roi_simulations'
        indexes = [
            models.Index(fields=['tenant', 'created_at']),
            models.Index(fields=['tenant', 'scenario']),
            models.Index(fields=['tenant', 'name']),
        ]
    
    def __str__(self):
        return f"ROI Simulation: {self.name} ({self.scenario})"


class PackageReservation(models.Model):
    """Marketplace package reservation"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='package_reservations')
    package = models.ForeignKey(MarketplacePackage, on_delete=models.CASCADE, related_name='reservations')
    investor_name = models.CharField(max_length=255)
    investor_email = models.EmailField()
    investor_phone = models.CharField(max_length=50, blank=True, null=True)
    investment_amount = models.DecimalField(max_digits=12, decimal_places=2)
    contact_preference = models.CharField(max_length=50, default='email')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reserved_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    confirmed_at = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'package_reservations'
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['package', 'status']),
            models.Index(fields=['tenant', 'reserved_at']),
        ]
    
    def __str__(self):
        return f"Reservation: {self.investor_name} - {self.package.title}"


class Address(models.Model):
    """Address model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.OneToOneField(Property, on_delete=models.CASCADE, related_name='address')
    street = models.CharField(max_length=255)
    house_number = models.CharField(max_length=20, blank=True, null=True)
    city = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=10)
    postal_code = models.CharField(max_length=10, blank=True, null=True, help_text="Alias für zip_code")
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, default='Deutschland')
    
    class Meta:
        db_table = 'addresses'
    
    def __str__(self):
        return f"{self.street}, {self.zip_code} {self.city}"


class ContactPerson(models.Model):
    """Contact person model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='contact_persons')
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    role = models.CharField(max_length=100)
    
    class Meta:
        db_table = 'contact_persons'
    
    def __str__(self):
        return f"{self.name} ({self.role})"


class PropertyFeatures(models.Model):
    """Property features model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.OneToOneField(Property, on_delete=models.CASCADE, related_name='features')
    bedrooms = models.IntegerField(blank=True, null=True)
    bathrooms = models.IntegerField(blank=True, null=True)
    year_built = models.IntegerField(blank=True, null=True)
    energy_class = models.CharField(
        max_length=10, 
        blank=True, 
        null=True,
        choices=[
            ('A+', 'A+'),
            ('A', 'A'),
            ('B', 'B'),
            ('C', 'C'),
            ('D', 'D'),
            ('E', 'E'),
            ('F', 'F'),
            ('G', 'G'),
            ('H', 'H'),
        ],
        help_text="Energieeffizienzklasse"
    )
    heating_type = models.CharField(max_length=100, blank=True, null=True)
    parking_spaces = models.IntegerField(blank=True, null=True)
    balcony = models.BooleanField(default=False)
    garden = models.BooleanField(default=False)
    elevator = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'property_features'
    
    def __str__(self):
        return f"Features for {self.property.title}"


class PropertyImage(models.Model):
    """Property image model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    file = models.FileField(upload_to='tenants/{tenant_id}/properties/{property_id}/images/', blank=True, null=True)
    url = models.URLField(blank=True, null=True)
    thumbnail_url = models.URLField(blank=True, null=True)
    alt_text = models.CharField(max_length=255, blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    size = models.IntegerField(default=0, help_text="File size in bytes")
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'property_images'
        indexes = [
            models.Index(fields=['property', 'order']),
            models.Index(fields=['property', 'is_primary']),
        ]
    
    def __str__(self):
        return f"Image for {self.property.title}"


class PropertyDocument(models.Model):
    """Property document model"""
    DOCUMENT_TYPE_CHOICES = [
        ('expose', 'Exposé'),
        ('floor_plan', 'Grundriss'),
        ('energy_certificate', 'Energieausweis'),
        ('contract', 'Vertrag'),
        ('protocol', 'Protokoll'),
        ('other', 'Sonstiges'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='properties/documents/%Y/%m/')
    url = models.URLField(blank=True, null=True)
    name = models.CharField(max_length=255)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES, default='other')
    size = models.IntegerField(default=0, help_text="File size in bytes")
    mime_type = models.CharField(max_length=100)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'property_documents'
        indexes = [
            models.Index(fields=['property', 'document_type']),
            models.Index(fields=['property', 'uploaded_at']),
        ]
    
    def __str__(self):
        return f"{self.name} for {self.property.title}"


# Contact Models
class Contact(models.Model):
    """Contact model"""
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='contacts')
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    company = models.CharField(max_length=255, blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=50, default='Lead')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    location = models.CharField(max_length=255, blank=True, null=True)
    avatar = models.URLField(blank=True, null=True)
    
    # Budget field - main potential value for CIM matching
    budget = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, help_text="Hauptbudget / Potenzialwert")
    budget_currency = models.CharField(max_length=3, default='EUR')
    
    # Legacy fields - will be migrated to budget
    budget_min = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    budget_max = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    
    preferences = models.JSONField(default=dict, blank=True)
    lead_score = models.IntegerField(default=0)
    last_contact = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'contacts'
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['tenant', 'lead_score']),
            models.Index(fields=['tenant', 'created_at']),
            models.Index(fields=['tenant', 'priority']),
            models.Index(fields=['tenant', 'category']),
        ]
    
    def __str__(self):
        return self.name


# Appointment Models
class AppointmentType(models.TextChoices):
    VIEWING = 'viewing', 'Viewing'
    CALL = 'call', 'Call'
    MEETING = 'meeting', 'Meeting'
    CONSULTATION = 'consultation', 'Consultation'
    SIGNING = 'signing', 'Signing'
    INSPECTION = 'inspection', 'Inspection'


class AppointmentStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    CONFIRMED = 'confirmed', 'Confirmed'
    CANCELLED = 'cancelled', 'Cancelled'
    COMPLETED = 'completed', 'Completed'
    NO_SHOW = 'no_show', 'No Show'


class Appointment(models.Model):
    """Appointment model"""
    TYPE_CHOICES = [
        ('viewing', 'Viewing'),
        ('call', 'Call'),
        ('meeting', 'Meeting'),
        ('consultation', 'Consultation'),
        ('signing', 'Signing'),
        ('inspection', 'Inspection'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
        ('no_show', 'No Show'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='appointments')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='draft')
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    location = models.CharField(max_length=255, blank=True, null=True)
    property_id = models.UUIDField(blank=True, null=True)
    property_title = models.CharField(max_length=255, blank=True, null=True)
    contact_id = models.UUIDField(blank=True, null=True)
    contact_name = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'appointments'
        indexes = [
            models.Index(fields=['tenant', 'start_datetime']),
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['tenant', 'type']),
        ]
    
    def __str__(self):
        return self.title


class Attendee(models.Model):
    """Appointment attendee model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='attendees')
    name = models.CharField(max_length=255)
    email = models.EmailField()
    role = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ], default='pending')
    
    class Meta:
        db_table = 'attendees'
    
    def __str__(self):
        return f"{self.name} ({self.appointment.title})"


# Audit Log Model
class AuditLog(models.Model):
    """Audit log model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='audit_logs', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=50)
    resource_type = models.CharField(max_length=50)
    resource_id = models.CharField(max_length=100)
    old_values = models.JSONField(default=dict, blank=True)
    new_values = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    
    class Meta:
        db_table = 'audit_logs'
        indexes = [
            models.Index(fields=['tenant', 'timestamp']),
            models.Index(fields=['tenant', 'user', 'timestamp']),
            models.Index(fields=['tenant', 'resource_type', 'resource_id']),
        ]
    
    def __str__(self):
        return f"{self.action} {self.resource_type} {self.resource_id} by {self.user.get_full_name()}"


# Expose Models
class ExposeVersion(models.Model):
    """Expose version model for AI-generated exposés"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='expose_versions')
    title = models.CharField(max_length=255)
    content = models.TextField()
    audience = models.CharField(max_length=50, choices=[
        ('kauf', 'Kauf'),
        ('miete', 'Miete'),
        ('investor', 'Investor'),
    ])
    tone = models.CharField(max_length=50, choices=[
        ('neutral', 'Neutral'),
        ('elegant', 'Elegant'),
        ('kurz', 'Kurz'),
    ])
    language = models.CharField(max_length=10, choices=[
        ('de', 'Deutsch'),
        ('en', 'English'),
    ])
    length = models.CharField(max_length=20, choices=[
        ('short', 'Kurz'),
        ('standard', 'Standard'),
        ('long', 'Lang'),
    ])
    keywords = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    version_number = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'expose_versions'
        indexes = [
            models.Index(fields=['property', 'status']),
            models.Index(fields=['property', 'created_at']),
            models.Index(fields=['property', 'version_number']),
        ]
        unique_together = ['property', 'version_number']
    
    def __str__(self):
        return f"{self.property.title} - Exposé v{self.version_number}"


# Publishing Models
class PublishJob(models.Model):
    """Publish job model for tracking property publications"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('publishing', 'Publishing'),
        ('published', 'Published'),
        ('failed', 'Failed'),
        ('unpublished', 'Unpublished'),
    ]
    
    PORTAL_CHOICES = [
        ('immoscout24', 'ImmoScout24'),
        ('immowelt', 'Immowelt'),
        ('ebay_kleinanzeigen', 'eBay Kleinanzeigen'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='publish_jobs')
    portal = models.CharField(max_length=50, choices=PORTAL_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    portal_property_id = models.CharField(max_length=255, blank=True, null=True)  # ID on the portal
    portal_url = models.URLField(blank=True, null=True)  # URL to the published property
    error_message = models.TextField(blank=True, null=True)
    retry_count = models.IntegerField(default=0)
    scheduled_at = models.DateTimeField(blank=True, null=True)
    published_at = models.DateTimeField(blank=True, null=True)
    unpublished_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'publish_jobs'
        indexes = [
            models.Index(fields=['property', 'status']),
            models.Index(fields=['property', 'portal']),
            models.Index(fields=['property', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.property.title} - {self.portal} ({self.status})"


# Integration Settings Model
class IntegrationSettings(models.Model):
    """Integration settings model for API keys and configurations"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='integration_settings')
    
    # Google Maps
    google_maps_api_key = models.TextField(blank=True, null=True)  # Encrypted
    
    # ImmoScout24
    immoscout_client_id = models.TextField(blank=True, null=True)  # Encrypted
    immoscout_client_secret = models.TextField(blank=True, null=True)  # Encrypted
    immoscout_access_token = models.TextField(blank=True, null=True)  # Encrypted
    immoscout_refresh_token = models.TextField(blank=True, null=True)  # Encrypted
    immoscout_token_expires_at = models.DateTimeField(blank=True, null=True)
    
    # Other portals (future)
    immowelt_api_key = models.TextField(blank=True, null=True)  # Encrypted
    ebay_api_key = models.TextField(blank=True, null=True)  # Encrypted
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'integration_settings'
    
    def __str__(self):
        return f"Integration Settings for {self.tenant.name}"


# Usage Tracking Models
class TenantUsage(models.Model):
    """Tenant usage tracking for billing limits enforcement"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='usage')
    active_users_count = models.IntegerField(default=0, help_text="Number of active users")
    storage_bytes_used = models.BigIntegerField(default=0, help_text="Storage used in bytes")
    properties_count = models.IntegerField(default=0, help_text="Number of properties")
    documents_count = models.IntegerField(default=0, help_text="Number of documents")
    last_reconciled_at = models.DateTimeField(blank=True, null=True, help_text="Last storage reconciliation")
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'tenant_usage'
        indexes = [
            models.Index(fields=['tenant', 'updated_at']),
        ]
    
    def __str__(self):
        return f"Usage for {self.tenant.name}"
    
    @property
    def storage_gb_used(self):
        """Convert bytes to GB"""
        return self.storage_bytes_used / (1024 ** 3)
    
    @property
    def storage_mb_used(self):
        """Convert bytes to MB"""
        return self.storage_bytes_used / (1024 ** 2)


class PropertyViewEvent(models.Model):
    """Property view tracking for analytics"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='property_view_events')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='view_events')
    viewer_fingerprint = models.CharField(max_length=64, null=True, blank=True, help_text="Anonymous viewer identifier")
    viewer_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    referrer = models.URLField(blank=True, null=True)
    source = models.CharField(max_length=50, default='web', choices=[
        ('web', 'Web'),
        ('mobile', 'Mobile'),
        ('api', 'API'),
        ('email', 'Email'),
        ('social', 'Social Media'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'property_view_events'
        indexes = [
            models.Index(fields=['tenant', 'property', 'created_at']),
            models.Index(fields=['tenant', 'created_at']),
            models.Index(fields=['property', 'created_at']),
        ]
    
    def __str__(self):
        return f"View of {self.property.title} at {self.created_at}"


class PropertyInquiryEvent(models.Model):
    """Property inquiry tracking for analytics"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='property_inquiry_events')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='inquiry_events')
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='property_inquiries', null=True, blank=True)
    contact_name = models.CharField(max_length=255, blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=50, blank=True, null=True)
    source = models.CharField(max_length=50, default='web', choices=[
        ('web', 'Web'),
        ('mobile', 'Mobile'),
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('social', 'Social Media'),
        ('portal', 'Portal'),
    ])
    inquiry_type = models.CharField(max_length=50, default='general', choices=[
        ('general', 'General Inquiry'),
        ('viewing', 'Viewing Request'),
        ('price', 'Price Inquiry'),
        ('financing', 'Financing Question'),
        ('other', 'Other'),
    ])
    message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'property_inquiry_events'
        indexes = [
            models.Index(fields=['tenant', 'property', 'created_at']),
            models.Index(fields=['tenant', 'created_at']),
            models.Index(fields=['property', 'created_at']),
            models.Index(fields=['contact', 'created_at']),
        ]
    
    def __str__(self):
        return f"Inquiry for {self.property.title} from {self.contact_name or self.contact_email}"
