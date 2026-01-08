"""
Contact Model
"""
import uuid
from django.db import models


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
        'accounts.Tenant', on_delete=models.CASCADE, related_name="contacts"
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
        app_label = 'contacts'

    def __str__(self):
        return self.name
