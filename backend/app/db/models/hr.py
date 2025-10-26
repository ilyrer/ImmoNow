"""
HR Models
Mitarbeiterverwaltung, Urlaubsanträge, Anwesenheit, Überstunden, Spesen
"""

import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
from enum import Enum


class LeaveType(models.TextChoices):
    """Urlaubstypen"""
    VACATION = 'vacation', 'Urlaub'
    SICK = 'sick', 'Krankheit'
    PERSONAL = 'personal', 'Persönlich'
    MATERNITY = 'maternity', 'Mutterschutz'
    PATERNITY = 'paternity', 'Vaterschaftsurlaub'
    STUDY = 'study', 'Bildungsurlaub'
    OTHER = 'other', 'Sonstiges'


class LeaveStatus(models.TextChoices):
    """Status von Urlaubsanträgen"""
    PENDING = 'pending', 'Ausstehend'
    APPROVED = 'approved', 'Genehmigt'
    REJECTED = 'rejected', 'Abgelehnt'
    CANCELLED = 'cancelled', 'Storniert'


class ExpenseCategory(models.TextChoices):
    """Spesenkategorien"""
    TRAVEL = 'travel', 'Reisekosten'
    MEALS = 'meals', 'Verpflegung'
    TRANSPORT = 'transport', 'Transport'
    ACCOMMODATION = 'accommodation', 'Unterkunft'
    COMMUNICATION = 'communication', 'Kommunikation'
    OFFICE_SUPPLIES = 'office_supplies', 'Büromaterial'
    TRAINING = 'training', 'Fortbildung'
    CLIENT_ENTERTAINMENT = 'client_entertainment', 'Kundenbetreuung'
    OTHER = 'other', 'Sonstiges'


class ExpenseStatus(models.TextChoices):
    """Status von Spesenanträgen"""
    SUBMITTED = 'submitted', 'Eingereicht'
    APPROVED = 'approved', 'Genehmigt'
    REJECTED = 'rejected', 'Abgelehnt'
    PAID = 'paid', 'Bezahlt'


class DocumentType(models.TextChoices):
    """Dokumenttypen"""
    CONTRACT = 'contract', 'Arbeitsvertrag'
    CERTIFICATE = 'certificate', 'Zeugnis'
    ID_CARD = 'id_card', 'Personalausweis'
    PASSPORT = 'passport', 'Reisepass'
    DRIVER_LICENSE = 'driver_license', 'Führerschein'
    QUALIFICATION = 'qualification', 'Qualifikation'
    TRAINING_CERTIFICATE = 'training_certificate', 'Fortbildungsnachweis'
    MEDICAL_CERTIFICATE = 'medical_certificate', 'Arbeitsunfähigkeitsbescheinigung'
    OTHER = 'other', 'Sonstiges'


class LeaveRequest(models.Model):
    """
    Urlaubsanträge
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='leave_requests')
    employee = models.ForeignKey('Employee', on_delete=models.CASCADE, related_name='leave_requests')
    
    # Urlaubsdetails
    start_date = models.DateField(help_text="Urlaubsbeginn")
    end_date = models.DateField(help_text="Urlaubsende")
    leave_type = models.CharField(max_length=20, choices=LeaveType.choices, default=LeaveType.VACATION)
    days_count = models.DecimalField(max_digits=4, decimal_places=1, help_text="Anzahl Urlaubstage")
    reason = models.TextField(blank=True, null=True, help_text="Begründung")
    
    # Status und Genehmigung
    status = models.CharField(max_length=20, choices=LeaveStatus.choices, default=LeaveStatus.PENDING)
    approved_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leave_requests')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True, help_text="Ablehnungsgrund")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'leave_requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'employee']),
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['employee', 'start_date']),
            models.Index(fields=['start_date', 'end_date']),
        ]
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.start_date} bis {self.end_date} ({self.get_status_display()})"
    
    @property
    def is_pending(self):
        return self.status == LeaveStatus.PENDING
    
    @property
    def is_approved(self):
        return self.status == LeaveStatus.APPROVED


class Attendance(models.Model):
    """
    Anwesenheitserfassung
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='attendance_records')
    employee = models.ForeignKey('Employee', on_delete=models.CASCADE, related_name='attendance_records')
    
    # Anwesenheitsdaten
    date = models.DateField(help_text="Datum")
    check_in = models.TimeField(null=True, blank=True, help_text="Check-in Zeit")
    check_out = models.TimeField(null=True, blank=True, help_text="Check-out Zeit")
    hours_worked = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, help_text="Gearbeitete Stunden")
    location = models.CharField(max_length=100, blank=True, null=True, help_text="Arbeitsort")
    notes = models.TextField(blank=True, null=True, help_text="Notizen")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'attendance'
        ordering = ['-date', '-check_in']
        unique_together = ['employee', 'date']
        indexes = [
            models.Index(fields=['tenant', 'employee']),
            models.Index(fields=['employee', 'date']),
            models.Index(fields=['date']),
        ]
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.date} ({self.check_in} - {self.check_out})"
    
    def save(self, *args, **kwargs):
        # Automatische Berechnung der Arbeitsstunden
        if self.check_in and self.check_out:
            from datetime import datetime, date
            
            # Kombiniere Datum mit Zeit für Berechnung
            check_in_dt = datetime.combine(self.date, self.check_in)
            check_out_dt = datetime.combine(self.date, self.check_out)
            
            # Berechne Differenz
            if check_out_dt > check_in_dt:
                delta = check_out_dt - check_in_dt
                self.hours_worked = Decimal(str(delta.total_seconds() / 3600))
        
        super().save(*args, **kwargs)


class Overtime(models.Model):
    """
    Überstundenerfassung
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='overtime_records')
    employee = models.ForeignKey('Employee', on_delete=models.CASCADE, related_name='overtime_records')
    
    # Überstundendetails
    date = models.DateField(help_text="Datum")
    hours = models.DecimalField(max_digits=4, decimal_places=2, help_text="Überstunden")
    rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('1.0'), help_text="Überstundenzuschlag")
    reason = models.TextField(help_text="Begründung")
    
    # Genehmigung
    approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_overtime')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True, help_text="Ablehnungsgrund")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'overtime'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['tenant', 'employee']),
            models.Index(fields=['employee', 'date']),
            models.Index(fields=['approved']),
        ]
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.date} ({self.hours}h)"
    
    @property
    def total_amount(self):
        """Berechne Gesamtbetrag der Überstunden"""
        # Annahme: Grundstundenlohn wird aus Employee-Model geholt
        # Hier vereinfacht - in der Praxis würde man den Stundenlohn aus der Gehaltsstruktur holen
        base_hourly_rate = Decimal('25.00')  # Placeholder
        return self.hours * base_hourly_rate * self.rate


class Expense(models.Model):
    """
    Spesenerfassung
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='expenses')
    employee = models.ForeignKey('Employee', on_delete=models.CASCADE, related_name='expenses')
    
    # Spesendetails
    date = models.DateField(help_text="Datum der Ausgabe")
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Betrag")
    category = models.CharField(max_length=30, choices=ExpenseCategory.choices, help_text="Kategorie")
    description = models.TextField(help_text="Beschreibung")
    receipt_url = models.URLField(blank=True, null=True, help_text="Beleg-URL")
    
    # Status und Genehmigung
    status = models.CharField(max_length=20, choices=ExpenseStatus.choices, default=ExpenseStatus.SUBMITTED)
    approved_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_expenses')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True, help_text="Ablehnungsgrund")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'expenses'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['tenant', 'employee']),
            models.Index(fields=['employee', 'date']),
            models.Index(fields=['status']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.date} ({self.amount}€)"


class HRDocument(models.Model):
    """
    Mitarbeiter-spezifische Dokumente
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='hr_documents')
    employee = models.ForeignKey('Employee', on_delete=models.CASCADE, related_name='hr_documents')
    
    # Dokumentdetails
    title = models.CharField(max_length=200, help_text="Titel")
    document_type = models.CharField(max_length=30, choices=DocumentType.choices, help_text="Dokumenttyp")
    file_url = models.URLField(help_text="Datei-URL")
    file_size = models.IntegerField(null=True, blank=True, help_text="Dateigröße in Bytes")
    mime_type = models.CharField(max_length=100, blank=True, null=True, help_text="MIME-Typ")
    
    # Metadaten
    description = models.TextField(blank=True, null=True, help_text="Beschreibung")
    expires_at = models.DateField(null=True, blank=True, help_text="Ablaufdatum")
    is_confidential = models.BooleanField(default=False, help_text="Vertraulich")
    
    # Upload-Info
    uploaded_by = models.ForeignKey('User', on_delete=models.CASCADE, related_name='uploaded_hr_documents')
    
    # Timestamps
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'hr_documents'
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['tenant', 'employee']),
            models.Index(fields=['employee', 'document_type']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['is_confidential']),
        ]
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.title}"
    
    @property
    def is_expired(self):
        """Prüfe ob Dokument abgelaufen ist"""
        if not self.expires_at:
            return False
        return self.expires_at < timezone.now().date()
    
    @property
    def file_extension(self):
        """Extrahiere Dateiendung"""
        if self.file_url:
            return self.file_url.split('.')[-1].lower()
        return None
