"""
Appointment Models
"""
import uuid
from django.db import models


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
        'accounts.Tenant', on_delete=models.CASCADE, related_name="appointments"
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
    created_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)

    class Meta:
        db_table = "appointments"
        indexes = [
            models.Index(fields=["tenant", "start_datetime"]),
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["tenant", "type"]),
        ]
        app_label = 'appointments'

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
        app_label = 'appointments'

    def __str__(self):
        return f"{self.name} ({self.appointment.title})"
