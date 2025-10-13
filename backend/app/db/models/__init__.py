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
from .notification import Notification, NotificationPreference

# Export all models
__all__ = [
    'Tenant',
    'User', 
    'TenantUser',
    'UserManager',
    'UserProfile',
    'DocumentFolder',
    'Document',
    'Task',
    'TaskLabel',
    'TaskComment',
    'Property',
    'Address',
    'ContactPerson',
    'PropertyFeatures',
    'PropertyImage',
    'PropertyDocument',
    'Contact',
    'Appointment',
    'Attendee',
    'AuditLog',
    'Notification',
    'NotificationPreference',
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


# Task Models
class TaskPriority(models.TextChoices):
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    URGENT = 'urgent', 'Urgent'


class TaskStatus(models.TextChoices):
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
    assignee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks')
    due_date = models.DateTimeField()
    start_date = models.DateTimeField(blank=True, null=True)
    progress = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    estimated_hours = models.IntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(1000)])
    actual_hours = models.IntegerField(blank=True, null=True, validators=[MinValueValidator(0)])
    tags = models.JSONField(default=list, blank=True)
    property_id = models.UUIDField(blank=True, null=True)
    financing_status = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    archived = models.BooleanField(default=False)
    
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
    energy_class = models.CharField(max_length=10, blank=True, null=True)
    energy_consumption = models.IntegerField(blank=True, null=True, help_text="kWh/m²a")
    heating_type = models.CharField(max_length=100, blank=True, null=True)
    
    # Location coordinates
    coordinates_lat = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    coordinates_lng = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    
    # Additional data
    amenities = models.JSONField(default=list, blank=True, help_text="Liste von Ausstattungsmerkmalen")
    tags = models.JSONField(default=list, blank=True, help_text="Tags für Kategorisierung")
    
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
        ]
    
    def __str__(self):
        return self.title


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
    energy_class = models.CharField(max_length=10, blank=True, null=True)
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
    file = models.FileField(upload_to='properties/images/%Y/%m/', blank=True, null=True)
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
