"""
Django Models for all domains
"""

import uuid
from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

# Import new auth models
from .tenant import Tenant
from .user import User, TenantUser, UserManager
from .notification import Notification, NotificationPreference
from .billing import BillingAccount, StripeWebhookEvent
from .location import LocationMarketData
from .document_activity import DocumentActivity, DocumentComment
from .investor import (
    InvestorPortfolio,
    Investment,
    InvestmentExpense,
    InvestmentIncome,
    PerformanceSnapshot,
    InvestorReport,
    MarketplacePackage,
    PackageReservation,
    InvestmentType,
    InvestmentStatus,
)
from .automation import AutomationRule, AutomationLog
from .workflow import Workflow, WorkflowInstance
from .sla import SLA, SLAInstance
from .custom_fields import CustomField, CustomFieldValue

# Export all models
__all__ = [
    "Tenant",
    "User",
    "TenantUser",
    "UserManager",
    "UserProfile",
    "DocumentFolder",
    "Document",
    "DocumentVersion",
    "DocumentActivity",
    "DocumentComment",
    "LocationMarketData",
    "SocialAccount",
    "SocialPost",
    "Permission",
    "Role",
    "FeatureFlag",
    "Task",
    "TaskLabel",
    "TaskComment",
    "TaskSubtask",
    "TaskAttachment",
    "TaskActivity",
    "Project",
    "Board",
    "BoardStatus",
    "Property",
    "Address",
    "ContactPerson",
    "PropertyFeatures",
    "PropertyImage",
    "PropertyDocument",
    "ExposeVersion",
    "PublishJob",
    "IntegrationSettings",
    "PropertyMetrics",
    "PropertyMetricsSnapshot",
    "Contact",
    "Appointment",
    "Attendee",
    "AuditLog",
    "Notification",
    "NotificationPreference",
    "BillingAccount",
    "StripeWebhookEvent",
    "Team",
    "Channel",
    "ChannelMembership",
    "Message",
    "Reaction",
    "Attachment",
    "ResourceLink",
    "InvestorPortfolio",
    "Investment",
    "InvestmentExpense",
    "InvestmentIncome",
    "PerformanceSnapshot",
    "InvestorReport",
    "MarketplacePackage",
    "PackageReservation",
    "InvestmentType",
    "InvestmentStatus",
    "AutomationRule",
    "AutomationLog",
    "Workflow",
    "WorkflowInstance",
    "SLA",
    "SLAInstance",
    "CustomField",
    "CustomFieldValue",
]


class UserProfile(models.Model):
    """Extended user profile"""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="users")
    role = models.CharField(
        max_length=20,
        choices=[
            ("admin", "Admin"),
            ("employee", "Employee"),
            ("customer", "Customer"),
        ],
    )
    roles = models.ManyToManyField(
        "Role", related_name="users", blank=True
    )  # RBAC roles
    avatar = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    last_login = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_profiles"
        indexes = [
            models.Index(fields=["tenant", "role"]),
            models.Index(fields=["tenant", "is_active"]),
        ]

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.tenant.name})"


# Document Models
class DocumentFolder(models.Model):
    """Document folder model"""

    id = models.AutoField(primary_key=True)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="document_folders"
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="subfolders",
    )
    color = models.CharField(max_length=7, default="#3B82F6")  # Hex color
    icon = models.CharField(max_length=50, blank=True, null=True)
    is_system = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "document_folders"
        indexes = [
            models.Index(fields=["tenant", "parent"]),
            models.Index(fields=["tenant", "name"]),
        ]

    def __str__(self):
        return self.name


class Document(models.Model):
    """Document model"""

    DOCUMENT_TYPES = [
        ("contract", "Contract"),
        ("expose", "Expose"),
        ("energy_certificate", "Energy Certificate"),
        ("floor_plan", "Floor Plan"),
        ("photo", "Photo"),
        ("video", "Video"),
        ("document", "Document"),
        ("presentation", "Presentation"),
        ("spreadsheet", "Spreadsheet"),
        ("pdf", "PDF"),
        ("other", "Other"),
    ]

    DOCUMENT_CATEGORIES = [
        ("legal", "Legal"),
        ("marketing", "Marketing"),
        ("technical", "Technical"),
        ("financial", "Financial"),
        ("administrative", "Administrative"),
        ("other", "Other"),
    ]

    DOCUMENT_STATUSES = [
        ("draft", "Draft"),
        ("active", "Active"),
        ("archived", "Archived"),
        ("deleted", "Deleted"),
    ]

    VISIBILITY_CHOICES = [
        ("public", "Public"),
        ("private", "Private"),
        ("team", "Team"),
        ("restricted", "Restricted"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="documents"
    )
    name = models.CharField(max_length=255)
    original_name = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    category = models.CharField(max_length=50, choices=DOCUMENT_CATEGORIES)
    status = models.CharField(
        max_length=50, choices=DOCUMENT_STATUSES, default="active"
    )
    visibility = models.CharField(
        max_length=20, choices=VISIBILITY_CHOICES, default="private"
    )
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
    folder = models.ForeignKey(
        DocumentFolder, on_delete=models.SET_NULL, blank=True, null=True
    )

    class Meta:
        db_table = "documents"
        indexes = [
            models.Index(fields=["tenant", "type"]),
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["tenant", "uploaded_at"]),
            models.Index(fields=["tenant", "folder"]),
            models.Index(fields=["tenant", "is_favorite"]),
        ]

    def __str__(self):
        return self.title


class DocumentVersion(models.Model):
    """Document version model for versioning"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        Document, on_delete=models.CASCADE, related_name="versions"
    )
    version_number = models.IntegerField()
    file_url = models.URLField()
    file_size = models.BigIntegerField()
    checksum = models.CharField(max_length=64)  # SHA256 hash
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    change_notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "document_versions"
        indexes = [
            models.Index(fields=["document", "version_number"]),
            models.Index(fields=["document", "created_at"]),
        ]
        unique_together = ["document", "version_number"]

    def __str__(self):
        return f"{self.document.title} v{self.version_number}"


# Social Media Models
class SocialAccount(models.Model):
    """Social media account model - supports multiple accounts per platform"""

    PLATFORM_CHOICES = [
        ("facebook", "Facebook"),
        ("linkedin", "LinkedIn"),
        ("twitter", "Twitter"),
        ("instagram", "Instagram"),
        ("youtube", "YouTube"),
        ("tiktok", "TikTok"),
        ("pinterest", "Pinterest"),
        ("immoscout24", "ImmoScout24"),
        ("immowelt", "Immowelt"),
        ("immonet", "Immonet"),
        ("ebay_kleinanzeigen", "eBay Kleinanzeigen"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="social_accounts"
    )
    platform = models.CharField(max_length=30, choices=PLATFORM_CHOICES)
    account_id = models.CharField(max_length=255)  # Platform-specific account ID
    account_name = models.CharField(max_length=255)
    account_label = models.CharField(
        max_length=100, blank=True, null=True
    )  # Custom label for multi-account
    access_token = models.TextField()  # Encrypted token
    refresh_token = models.TextField(blank=True, null=True)  # Encrypted refresh token
    token_expires_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_sync_at = models.DateTimeField(blank=True, null=True)
    # Account metadata
    follower_count = models.IntegerField(blank=True, null=True)
    following_count = models.IntegerField(blank=True, null=True)
    post_count = models.IntegerField(blank=True, null=True)
    profile_url = models.URLField(blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)

    class Meta:
        db_table = "social_accounts"
        indexes = [
            models.Index(fields=["tenant", "platform"]),
            models.Index(fields=["tenant", "is_active"]),
        ]
        unique_together = ["tenant", "platform", "account_id"]

    def __str__(self):
        return f"{self.platform}: {self.account_name}"


class SocialPost(models.Model):
    """Social media post model"""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("scheduled", "Scheduled"),
        ("published", "Published"),
        ("failed", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="social_posts"
    )
    account = models.ForeignKey(
        SocialAccount, on_delete=models.CASCADE, related_name="posts"
    )
    content = models.TextField()
    media_urls = models.JSONField(default=list, blank=True)  # List of media URLs
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    scheduled_at = models.DateTimeField(blank=True, null=True)
    published_at = models.DateTimeField(blank=True, null=True)
    platform_post_id = models.CharField(
        max_length=255, blank=True, null=True
    )  # Platform's post ID
    metrics = models.JSONField(
        default=dict, blank=True
    )  # reach, clicks, comments, shares
    error_message = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "social_posts"
        indexes = [
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["tenant", "scheduled_at"]),
            models.Index(fields=["tenant", "published_at"]),
            models.Index(fields=["account", "status"]),
        ]

    def __str__(self):
        return f"{self.account.platform}: {self.content[:50]}..."


# RBAC Models
class Permission(models.Model):
    """Permission model for RBAC"""

    id = models.AutoField(primary_key=True)
    name = models.CharField(
        max_length=100, unique=True
    )  # e.g. 'properties:read', 'contacts:write'
    description = models.TextField()
    category = models.CharField(
        max_length=50
    )  # 'properties', 'contacts', 'documents', etc.
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "permissions"
        indexes = [
            models.Index(fields=["category"]),
        ]

    def __str__(self):
        return self.name


class Role(models.Model):
    """Role model for RBAC"""

    id = models.AutoField(primary_key=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="roles")
    name = models.CharField(max_length=100)
    description = models.TextField()
    permissions = models.ManyToManyField(Permission, related_name="roles")
    is_system = models.BooleanField(default=False)  # Admin, Manager, User
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        db_table = "roles"
        indexes = [
            models.Index(fields=["tenant", "is_system"]),
        ]
        unique_together = ["tenant", "name"]

    def __str__(self):
        return f"{self.name} ({self.tenant.name})"


class FeatureFlag(models.Model):
    """Feature flag model"""

    id = models.AutoField(primary_key=True)
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="feature_flags",
        blank=True,
        null=True,
    )  # Null = global
    name = models.CharField(max_length=100)
    description = models.TextField()
    is_enabled = models.BooleanField(default=False)
    rollout_percentage = models.IntegerField(default=0)  # 0-100
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        db_table = "feature_flags"
        indexes = [
            models.Index(fields=["tenant", "is_enabled"]),
        ]
        unique_together = ["tenant", "name"]

    def __str__(self):
        return f"{self.name} ({self.tenant.name if self.tenant else 'Global'})"


# Task Models
class TaskPriority(models.TextChoices):
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"
    URGENT = "urgent", "Urgent"


class TaskStatus(models.TextChoices):
    BACKLOG = "backlog", "Backlog"
    TODO = "todo", "To Do"
    IN_PROGRESS = "in_progress", "In Progress"
    REVIEW = "review", "Review"
    DONE = "done", "Done"
    BLOCKED = "blocked", "Blocked"
    ON_HOLD = "on_hold", "On Hold"
    CANCELLED = "cancelled", "Cancelled"


class Project(models.Model):
    """Projekt innerhalb eines Tenants (Workspace)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="projects"
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=7, default="#0A84FF")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "projects"
        unique_together = ["tenant", "name"]
        indexes = [
            models.Index(fields=["tenant", "name"]),
        ]

    def __str__(self):
        return self.name


class Board(models.Model):
    """Board pro Projekt/Team mit konfigurierbaren Status/WIP."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="boards")
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="boards", blank=True, null=True
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    team = models.CharField(max_length=100, blank=True, null=True)
    wip_limit = models.IntegerField(
        blank=True, null=True, validators=[MinValueValidator(1), MaxValueValidator(500)]
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="created_boards"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "boards"
        indexes = [
            models.Index(fields=["tenant", "project"]),
            models.Index(fields=["tenant", "name"]),
        ]
        unique_together = ["tenant", "name"]

    def __str__(self):
        return self.name


class BoardStatus(models.Model):
    """Konfigurierter Status pro Board (inkl. Reihenfolge/WIP/Transition)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name="statuses")
    key = models.CharField(max_length=50)  # z.B. todo, in_progress
    title = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default="#8E8E93")
    order = models.IntegerField(default=0)
    wip_limit = models.IntegerField(
        blank=True, null=True, validators=[MinValueValidator(1), MaxValueValidator(500)]
    )
    is_terminal = models.BooleanField(default=False)
    allow_from = models.JSONField(default=list, blank=True)  # erlaubte Vorgänger
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "board_statuses"
        unique_together = ["board", "key"]
        indexes = [
            models.Index(fields=["board", "order"]),
            models.Index(fields=["board", "key"]),
        ]

    def __str__(self):
        return f"{self.board.name}:{self.title}"


class Task(models.Model):
    """Task model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="tasks")
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="tasks", blank=True, null=True
    )
    board = models.ForeignKey(
        Board, on_delete=models.CASCADE, related_name="tasks", blank=True, null=True
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    priority = models.CharField(
        max_length=20, choices=TaskPriority.choices, default=TaskPriority.MEDIUM
    )
    status = models.CharField(
        max_length=30, choices=TaskStatus.choices, default=TaskStatus.TODO
    )
    assignee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="assigned_tasks"
    )
    due_date = models.DateTimeField()
    start_date = models.DateTimeField(blank=True, null=True)
    progress = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    estimated_hours = models.IntegerField(
        default=1, validators=[MinValueValidator(1), MaxValueValidator(1000)]
    )
    actual_hours = models.IntegerField(
        blank=True, null=True, validators=[MinValueValidator(0)]
    )
    tags = models.JSONField(default=list, blank=True)
    labels = models.ManyToManyField("TaskLabel", related_name="tasks", blank=True)
    property_id = models.UUIDField(blank=True, null=True)
    financing_status = models.CharField(max_length=50, blank=True, null=True)
    story_points = models.IntegerField(
        blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(200)]
    )
    ai_score = models.FloatField(blank=True, null=True)
    impact_score = models.FloatField(blank=True, null=True)
    effort_score = models.FloatField(blank=True, null=True)
    complexity = models.CharField(max_length=50, blank=True, null=True)
    dependencies = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="created_tasks"
    )
    archived = models.BooleanField(default=False)

    class Meta:
        db_table = "tasks"
        indexes = [
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["tenant", "priority"]),
            models.Index(fields=["tenant", "assignee"]),
            models.Index(fields=["tenant", "project"]),
            models.Index(fields=["tenant", "board"]),
            models.Index(fields=["tenant", "due_date"]),
            models.Index(fields=["tenant", "created_at"]),
        ]

    def __str__(self):
        return self.title


class TaskLabel(models.Model):
    """Task label model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="task_labels"
    )
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default="#3B82F6")
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "task_labels"
        unique_together = ["tenant", "name"]

    def __str__(self):
        return self.name


class TaskComment(models.Model):
    """Task comment model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, blank=True, null=True, related_name="replies"
    )

    class Meta:
        db_table = "task_comments"
        indexes = [
            models.Index(fields=["task", "timestamp"]),
        ]

    def __str__(self):
        return f"Comment by {self.author.get_full_name()} on {self.task.title}"


class TaskSubtask(models.Model):
    """Subtasks/Checklisten für Tasks."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="subtasks")
    title = models.CharField(max_length=200)
    completed = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    assignee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="subtasks", blank=True, null=True
    )
    due_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "task_subtasks"
        indexes = [
            models.Index(fields=["task", "order"]),
            models.Index(fields=["task", "completed"]),
        ]

    def __str__(self):
        return f"{self.title} ({'done' if self.completed else 'open'})"


class TaskAttachment(models.Model):
    """Anhänge zu Tasks."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="attachments")
    name = models.CharField(max_length=255)
    url = models.CharField(max_length=500)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    size = models.IntegerField(blank=True, null=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "task_attachments"
        indexes = [
            models.Index(fields=["task"]),
        ]

    def __str__(self):
        return self.name


class TaskActivity(models.Model):
    """Activity/Audit-Log auf Task-Ebene."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="activities")
    action = models.CharField(
        max_length=50
    )  # created, updated, moved, comment, ai_proposed
    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    old_values = models.JSONField(default=dict, blank=True)
    new_values = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "task_activities"
        indexes = [
            models.Index(fields=["task", "created_at"]),
            models.Index(fields=["action"]),
        ]

    def __str__(self):
        return f"{self.action} ({self.task_id})"


# Property Models
class PropertyType(models.TextChoices):
    APARTMENT = "apartment", "Apartment"
    HOUSE = "house", "House"
    COMMERCIAL = "commercial", "Commercial"
    LAND = "land", "Land"
    OFFICE = "office", "Office"
    RETAIL = "retail", "Retail"
    INDUSTRIAL = "industrial", "Industrial"


class Property(models.Model):
    """Property model"""

    PROPERTY_TYPE_CHOICES = [
        ("apartment", "Apartment"),
        ("house", "House"),
        ("commercial", "Commercial"),
        ("land", "Land"),
        ("office", "Office"),
        ("retail", "Retail"),
        ("industrial", "Industrial"),
    ]

    PRICE_TYPE_CHOICES = [
        ("sale", "Sale"),
        ("rent", "Rent"),
    ]

    STATUS_CHOICES = [
        ("akquise", "Akquise"),
        ("vorbereitung", "Vorbereitung"),
        ("aktiv", "Aktiv"),
        ("reserviert", "Reserviert"),
        ("verkauft", "Verkauft"),
        ("zurückgezogen", "Zurückgezogen"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="properties"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=50, default="vorbereitung", choices=STATUS_CHOICES
    )
    property_type = models.CharField(max_length=50, choices=PROPERTY_TYPE_CHOICES)

    # Price fields
    price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    price_currency = models.CharField(max_length=3, default="EUR")
    price_type = models.CharField(
        max_length=20, choices=PRICE_TYPE_CHOICES, default="sale"
    )

    location = models.CharField(max_length=255)

    # Area fields
    living_area = models.IntegerField(
        blank=True, null=True, help_text="Wohnfläche in m²"
    )
    total_area = models.IntegerField(
        blank=True, null=True, help_text="Gesamtfläche in m²"
    )
    plot_area = models.IntegerField(
        blank=True, null=True, help_text="Grundstücksfläche in m²"
    )

    # Room fields
    rooms = models.IntegerField(blank=True, null=True, help_text="Anzahl Zimmer")
    bedrooms = models.IntegerField(
        blank=True, null=True, help_text="Anzahl Schlafzimmer"
    )
    bathrooms = models.IntegerField(blank=True, null=True, help_text="Anzahl Bäder")
    floors = models.IntegerField(blank=True, null=True, help_text="Anzahl Etagen")

    # Building info
    year_built = models.IntegerField(blank=True, null=True)
    energy_class = models.CharField(max_length=10, blank=True, null=True)
    energy_consumption = models.IntegerField(blank=True, null=True, help_text="kWh/m²a")
    heating_type = models.CharField(max_length=100, blank=True, null=True)

    # Energy Certificate fields
    energy_certificate_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        choices=[
            ("bedarfsausweis", "Bedarfsausweis"),
            ("verbrauchsausweis", "Verbrauchsausweis"),
        ],
    )
    energy_certificate_valid_until = models.DateField(blank=True, null=True)
    energy_certificate_issue_date = models.DateField(blank=True, null=True)
    co2_emissions = models.IntegerField(
        blank=True, null=True, help_text="CO₂-Emissionen in kg/m²a"
    )

    # Location coordinates
    coordinates_lat = models.DecimalField(
        max_digits=9, decimal_places=6, blank=True, null=True
    )
    coordinates_lng = models.DecimalField(
        max_digits=9, decimal_places=6, blank=True, null=True
    )

    # Additional data
    amenities = models.JSONField(
        default=list, blank=True, help_text="Liste von Ausstattungsmerkmalen"
    )
    tags = models.JSONField(
        default=list, blank=True, help_text="Tags für Kategorisierung"
    )

    # Auto-publish settings for portal integration
    auto_publish_enabled = models.BooleanField(
        default=False, help_text="Automatisch auf Portalen aktualisieren"
    )
    auto_publish_portals = models.JSONField(
        default=list, blank=True, help_text="Liste von Portalen für Auto-Publish"
    )
    auto_publish_interval_hours = models.IntegerField(
        default=2,
        help_text="Intervall in Stunden für Auto-Publish (2.4h = 10x täglich)",
    )
    last_auto_published_at = models.DateTimeField(
        blank=True, null=True, help_text="Letzter Auto-Publish Zeitpunkt"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        db_table = "properties"
        indexes = [
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["tenant", "property_type"]),
            models.Index(fields=["tenant", "price"]),
            models.Index(fields=["tenant", "created_at"]),
        ]

    def __str__(self):
        return self.title


class Address(models.Model):
    """Address model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.OneToOneField(
        Property, on_delete=models.CASCADE, related_name="address"
    )
    street = models.CharField(max_length=255)
    house_number = models.CharField(max_length=20, blank=True, null=True)
    city = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=10)
    postal_code = models.CharField(
        max_length=10, blank=True, null=True, help_text="Alias für zip_code"
    )
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, default="Deutschland")

    class Meta:
        db_table = "addresses"

    def __str__(self):
        return f"{self.street}, {self.zip_code} {self.city}"


class ContactPerson(models.Model):
    """Contact person model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="contact_persons"
    )
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    role = models.CharField(max_length=100)

    class Meta:
        db_table = "contact_persons"

    def __str__(self):
        return f"{self.name} ({self.role})"


class PropertyFeatures(models.Model):
    """Property features model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.OneToOneField(
        Property, on_delete=models.CASCADE, related_name="features"
    )
    bedrooms = models.IntegerField(blank=True, null=True)
    bathrooms = models.IntegerField(blank=True, null=True)
    year_built = models.IntegerField(blank=True, null=True)
    energy_class = models.CharField(max_length=10, blank=True, null=True)
    heating_type = models.CharField(max_length=100, blank=True, null=True)
    parking_spaces = models.IntegerField(blank=True, null=True)
    balcony = models.BooleanField(default=False)
    garden = models.BooleanField(default=False)
    elevator = models.BooleanField(default=False)

    class Meta:
        db_table = "property_features"

    def __str__(self):
        return f"Features for {self.property.title}"


class PropertyImage(models.Model):
    """Property image model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="images"
    )
    file = models.FileField(upload_to="properties/images/%Y/%m/", blank=True, null=True)
    url = models.URLField(blank=True, null=True)
    thumbnail_url = models.URLField(blank=True, null=True)
    alt_text = models.CharField(max_length=255, blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    size = models.IntegerField(default=0, help_text="File size in bytes")
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        db_table = "property_images"
        indexes = [
            models.Index(fields=["property", "order"]),
            models.Index(fields=["property", "is_primary"]),
        ]

    def __str__(self):
        return f"Image for {self.property.title}"


class PropertyDocument(models.Model):
    """Property document model"""

    DOCUMENT_TYPE_CHOICES = [
        ("expose", "Exposé"),
        ("floor_plan", "Grundriss"),
        ("energy_certificate", "Energieausweis"),
        ("contract", "Vertrag"),
        ("protocol", "Protokoll"),
        ("other", "Sonstiges"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="documents"
    )
    file = models.FileField(upload_to="properties/documents/%Y/%m/")
    url = models.URLField(blank=True, null=True)
    name = models.CharField(max_length=255)
    document_type = models.CharField(
        max_length=50, choices=DOCUMENT_TYPE_CHOICES, default="other"
    )
    size = models.IntegerField(default=0, help_text="File size in bytes")
    mime_type = models.CharField(max_length=100)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        db_table = "property_documents"
        indexes = [
            models.Index(fields=["property", "document_type"]),
            models.Index(fields=["property", "uploaded_at"]),
        ]

    def __str__(self):
        return f"{self.name} for {self.property.title}"


# Contact Models
class Contact(models.Model):
    """Contact model"""

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="contacts"
    )
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    company = models.CharField(max_length=255, blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=50, default="Lead")
    priority = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default="medium"
    )
    location = models.CharField(max_length=255, blank=True, null=True)
    avatar = models.URLField(blank=True, null=True)

    # Budget field - main potential value for CIM matching
    budget = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Hauptbudget / Potenzialwert",
    )
    budget_currency = models.CharField(max_length=3, default="EUR")

    # Legacy fields - will be migrated to budget
    budget_min = models.DecimalField(
        max_digits=12, decimal_places=2, blank=True, null=True
    )
    budget_max = models.DecimalField(
        max_digits=12, decimal_places=2, blank=True, null=True
    )

    preferences = models.JSONField(default=dict, blank=True)
    lead_score = models.IntegerField(default=0)
    lead_score_details = models.JSONField(
        default=dict, blank=True, help_text="Detailed lead score breakdown and signals"
    )
    last_contact = models.DateTimeField(blank=True, null=True)

    # Additional information fields
    additional_info = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional contact information like birth_date, source, etc.",
    )
    address = models.JSONField(
        default=dict, blank=True, help_text="Contact address details"
    )
    notes = models.TextField(
        blank=True, null=True, help_text="Internal notes about contact"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "contacts"
        indexes = [
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["tenant", "lead_score"]),
            models.Index(fields=["tenant", "created_at"]),
            models.Index(fields=["tenant", "priority"]),
            models.Index(fields=["tenant", "category"]),
        ]

    def __str__(self):
        return self.name


# Appointment Models
class AppointmentType(models.TextChoices):
    VIEWING = "viewing", "Viewing"
    CALL = "call", "Call"
    MEETING = "meeting", "Meeting"
    CONSULTATION = "consultation", "Consultation"
    SIGNING = "signing", "Signing"
    INSPECTION = "inspection", "Inspection"


class AppointmentStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    CONFIRMED = "confirmed", "Confirmed"
    CANCELLED = "cancelled", "Cancelled"
    COMPLETED = "completed", "Completed"
    NO_SHOW = "no_show", "No Show"


class Appointment(models.Model):
    """Appointment model"""

    TYPE_CHOICES = [
        ("viewing", "Viewing"),
        ("call", "Call"),
        ("meeting", "Meeting"),
        ("consultation", "Consultation"),
        ("signing", "Signing"),
        ("inspection", "Inspection"),
    ]

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
        ("no_show", "No Show"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="appointments"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="draft")
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
        db_table = "appointments"
        indexes = [
            models.Index(fields=["tenant", "start_datetime"]),
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["tenant", "type"]),
        ]

    def __str__(self):
        return self.title


class Attendee(models.Model):
    """Appointment attendee model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    appointment = models.ForeignKey(
        Appointment, on_delete=models.CASCADE, related_name="attendees"
    )
    name = models.CharField(max_length=255)
    email = models.EmailField()
    role = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("accepted", "Accepted"),
            ("declined", "Declined"),
        ],
        default="pending",
    )

    class Meta:
        db_table = "attendees"

    def __str__(self):
        return f"{self.name} ({self.appointment.title})"


# Audit Log Model
class AuditLog(models.Model):
    """Audit log model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="audit_logs",
        null=True,
        blank=True,
    )
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
        db_table = "audit_logs"
        indexes = [
            models.Index(fields=["tenant", "timestamp"]),
            models.Index(fields=["tenant", "user", "timestamp"]),
            models.Index(fields=["tenant", "resource_type", "resource_id"]),
        ]

    def __str__(self):
        return f"{self.action} {self.resource_type} {self.resource_id} by {self.user.get_full_name()}"


# Expose Models
class ExposeVersion(models.Model):
    """Expose version model for AI-generated exposés"""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="expose_versions"
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    audience = models.CharField(
        max_length=50,
        choices=[
            ("kauf", "Kauf"),
            ("miete", "Miete"),
            ("investor", "Investor"),
        ],
    )
    tone = models.CharField(
        max_length=50,
        choices=[
            ("neutral", "Neutral"),
            ("elegant", "Elegant"),
            ("kurz", "Kurz"),
        ],
    )
    language = models.CharField(
        max_length=10,
        choices=[
            ("de", "Deutsch"),
            ("en", "English"),
        ],
    )
    length = models.CharField(
        max_length=20,
        choices=[
            ("short", "Kurz"),
            ("standard", "Standard"),
            ("long", "Lang"),
        ],
    )
    keywords = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    version_number = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        db_table = "expose_versions"
        indexes = [
            models.Index(fields=["property", "status"]),
            models.Index(fields=["property", "created_at"]),
            models.Index(fields=["property", "version_number"]),
        ]
        unique_together = ["property", "version_number"]

    def __str__(self):
        return f"{self.property.title} - Exposé v{self.version_number}"


# Publishing Models
class PublishJob(models.Model):
    """Publish job model for tracking property publications"""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("publishing", "Publishing"),
        ("published", "Published"),
        ("failed", "Failed"),
        ("unpublished", "Unpublished"),
    ]

    PORTAL_CHOICES = [
        ("immoscout24", "ImmoScout24"),
        ("immowelt", "Immowelt"),
        ("ebay_kleinanzeigen", "eBay Kleinanzeigen"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="publish_jobs"
    )
    portal = models.CharField(max_length=50, choices=PORTAL_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    portal_property_id = models.CharField(
        max_length=255, blank=True, null=True
    )  # ID on the portal
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
        db_table = "publish_jobs"
        indexes = [
            models.Index(fields=["property", "status"]),
            models.Index(fields=["property", "portal"]),
            models.Index(fields=["property", "created_at"]),
        ]

    def __str__(self):
        return f"{self.property.title} - {self.portal} ({self.status})"


# Integration Settings Model
class IntegrationSettings(models.Model):
    """Integration settings model for API keys and configurations"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(
        Tenant, on_delete=models.CASCADE, related_name="integration_settings"
    )

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
        db_table = "integration_settings"

    def __str__(self):
        return f"Integration Settings for {self.tenant.name}"


# Property Metrics Models
class PropertyMetrics(models.Model):
    """
    Aggregated property performance metrics.
    Stores cumulative metrics that are synced from portals.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.OneToOneField(
        Property, on_delete=models.CASCADE, related_name="metrics"
    )

    # Aggregated metrics from all portals
    total_views = models.IntegerField(
        default=0, help_text="Total page views across all portals"
    )
    total_inquiries = models.IntegerField(default=0, help_text="Total contact requests")
    total_favorites = models.IntegerField(default=0, help_text="Total saves/favorites")
    total_clicks = models.IntegerField(default=0, help_text="Total clicks on listing")
    total_visits = models.IntegerField(default=0, help_text="Total scheduled visits")

    # Portal-specific metrics (JSON for flexibility)
    immoscout_views = models.IntegerField(default=0)
    immoscout_inquiries = models.IntegerField(default=0)
    immoscout_favorites = models.IntegerField(default=0)

    immowelt_views = models.IntegerField(default=0)
    immowelt_inquiries = models.IntegerField(default=0)
    immowelt_favorites = models.IntegerField(default=0)

    # Calculated fields
    conversion_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0, help_text="Inquiries/Views * 100"
    )
    avg_view_duration = models.IntegerField(
        default=0, help_text="Average view duration in seconds"
    )

    # Timestamps
    last_synced_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "property_metrics"
        indexes = [
            models.Index(fields=["property"]),
            models.Index(fields=["total_views"]),
            models.Index(fields=["total_inquiries"]),
            models.Index(fields=["last_synced_at"]),
        ]

    def __str__(self):
        return f"Metrics for {self.property.title}"

    def calculate_totals(self):
        """Calculate total metrics from portal-specific values"""
        self.total_views = self.immoscout_views + self.immowelt_views
        self.total_inquiries = self.immoscout_inquiries + self.immowelt_inquiries
        self.total_favorites = self.immoscout_favorites + self.immowelt_favorites

        if self.total_views > 0:
            self.conversion_rate = (self.total_inquiries / self.total_views) * 100
        else:
            self.conversion_rate = 0

    def save(self, *args, **kwargs):
        self.calculate_totals()
        super().save(*args, **kwargs)


class PropertyMetricsSnapshot(models.Model):
    """
    Daily snapshot of property metrics for historical tracking and charts.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="metrics_snapshots"
    )

    # Daily metrics
    date = models.DateField()
    views = models.IntegerField(default=0)
    inquiries = models.IntegerField(default=0)
    favorites = models.IntegerField(default=0)
    clicks = models.IntegerField(default=0)
    visits = models.IntegerField(default=0)

    # Source breakdown
    immoscout_views = models.IntegerField(default=0)
    immoscout_inquiries = models.IntegerField(default=0)
    immowelt_views = models.IntegerField(default=0)
    immowelt_inquiries = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "property_metrics_snapshots"
        unique_together = [["property", "date"]]
        indexes = [
            models.Index(fields=["property", "date"]),
            models.Index(fields=["date"]),
        ]
        ordering = ["-date"]

    def __str__(self):
        return f"Metrics for {self.property.title} on {self.date}"


# --- Communications Models ---


class Team(models.Model):
    """Team of users for communication context"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="teams")
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="teams_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "teams"
        unique_together = [["tenant", "name"]]
        indexes = [
            models.Index(fields=["tenant", "name"]),
        ]

    def __str__(self):
        return self.name


class Channel(models.Model):
    """Channel within a team for messaging"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="channels"
    )
    team = models.ForeignKey(
        Team, on_delete=models.CASCADE, related_name="channels", null=True, blank=True
    )
    name = models.CharField(max_length=120)
    topic = models.CharField(max_length=255, blank=True, null=True)
    is_private = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="channels_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "channels"
        unique_together = [["tenant", "name", "team"]]
        indexes = [
            models.Index(fields=["tenant", "team"]),
            models.Index(fields=["tenant", "is_private"]),
        ]

    def __str__(self):
        return self.name


class ChannelMembership(models.Model):
    """Membership with role for channel"""

    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("member", "Member"),
        ("guest", "Guest"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="channel_memberships"
    )
    channel = models.ForeignKey(
        Channel, on_delete=models.CASCADE, related_name="memberships"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="channel_memberships"
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="member")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "channel_memberships"
        unique_together = [["channel", "user"]]
        indexes = [
            models.Index(fields=["tenant", "channel"]),
            models.Index(fields=["tenant", "user"]),
        ]

    def __str__(self):
        return f"{self.user.email} in {self.channel.name}"


class Message(models.Model):
    """Channel message (supports threads and soft delete)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="messages"
    )
    channel = models.ForeignKey(
        Channel, on_delete=models.CASCADE, related_name="messages"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="messages")
    content = models.TextField()
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, related_name="replies", null=True, blank=True
    )
    has_attachments = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    edited_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "messages"
        indexes = [
            models.Index(fields=["tenant", "channel"]),
            models.Index(fields=["tenant", "parent"]),
            models.Index(fields=["tenant", "created_at"]),
        ]
        ordering = ["created_at"]

    def __str__(self):
        return f"Message by {self.user.email} in {self.channel.name}"


class Reaction(models.Model):
    """Emoji reactions for messages"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="reactions"
    )
    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name="reactions"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reactions")
    emoji = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reactions"
        unique_together = [["message", "user", "emoji"]]
        indexes = [
            models.Index(fields=["tenant", "message"]),
        ]

    def __str__(self):
        return f"{self.emoji} by {self.user.email}"


class Attachment(models.Model):
    """File attachment for messages"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="attachments"
    )
    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name="attachments"
    )
    file_url = models.URLField()
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100, blank=True, null=True)
    file_size = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "attachments"
        indexes = [
            models.Index(fields=["tenant", "message"]),
        ]

    def __str__(self):
        return self.file_name


class ResourceLink(models.Model):
    """Reference to another resource (contact/property) from a message"""

    RESOURCE_CHOICES = [
        ("contact", "Contact"),
        ("property", "Property"),
        ("task", "Task"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="resource_links"
    )
    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name="resource_links"
    )
    resource_type = models.CharField(max_length=20, choices=RESOURCE_CHOICES)
    resource_id = models.UUIDField()
    label = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "resource_links"
        indexes = [
            models.Index(fields=["tenant", "resource_type"]),
            models.Index(fields=["resource_id"]),
        ]

    def __str__(self):
        return f"{self.resource_type}:{self.resource_id}"
