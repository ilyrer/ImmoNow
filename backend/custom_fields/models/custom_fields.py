"""
Custom Fields Models
"""
import uuid
from django.db import models
from django.utils import timezone


class CustomField(models.Model):
    """Custom Field Definition"""
    
    FIELD_TYPE_CHOICES = [
        ("text", "Text"),
        ("number", "Number"),
        ("date", "Date"),
        ("dropdown", "Dropdown"),
        ("checkbox", "Checkbox"),
        ("user", "User"),
    ]
    
    RESOURCE_TYPE_CHOICES = [
        ("task", "Task"),
        ("property", "Property"),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('accounts.Tenant', on_delete=models.CASCADE, related_name="custom_fields")
    name = models.CharField(max_length=200)
    key = models.CharField(max_length=100, help_text="Unique key (e.g. 'custom_property_size')")
    field_type = models.CharField(max_length=50, choices=FIELD_TYPE_CHOICES)
    resource_type = models.CharField(max_length=50, choices=RESOURCE_TYPE_CHOICES, default="task")
    
    # Field Configuration
    description = models.TextField(blank=True, null=True)
    required = models.BooleanField(default=False)
    default_value = models.TextField(blank=True, null=True)
    
    # Options für Dropdown
    options = models.JSONField(default=list, blank=True, help_text="Options for dropdown field")
    
    # Metadata
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name="created_custom_fields", blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        db_table = "custom_fields"
        unique_together = ["tenant", "key", "resource_type"]
        indexes = [
            models.Index(fields=["tenant", "resource_type", "is_active"]),
            models.Index(fields=["key"]),
        ]
        app_label = 'custom_fields'
    
    def __str__(self):
        return f"{self.name} ({self.field_type})"


class CustomFieldValue(models.Model):
    """Custom Field Value für ein Resource (Task/Property)"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    custom_field = models.ForeignKey(
        CustomField, on_delete=models.CASCADE, related_name="values"
    )
    tenant = models.ForeignKey('accounts.Tenant', on_delete=models.CASCADE, related_name="custom_field_values")
    
    # Resource (Task oder Property)
    resource_type = models.CharField(max_length=50)  # "task" oder "property"
    resource_id = models.UUIDField()
    
    # Value (als Text gespeichert, wird je nach field_type interpretiert)
    value = models.TextField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "custom_field_values"
        unique_together = ["custom_field", "resource_type", "resource_id"]
        indexes = [
            models.Index(fields=["resource_type", "resource_id"]),
            models.Index(fields=["tenant", "resource_type"]),
        ]
        app_label = 'custom_fields'
    
    def __str__(self):
        return f"{self.custom_field.name}: {self.value}"
