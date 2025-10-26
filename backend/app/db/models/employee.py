"""
Employee Models
Mitarbeiter- und Gehaltsverwaltung
"""

import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal

from .tenant import Tenant
from .user import User


class Employee(models.Model):
    """
    Employee Model
    Erweiterte Mitarbeiterdaten mit Department, Position, etc.
    """
    
    DEPARTMENT_CHOICES = [
        ('management', 'Management'),
        ('sales', 'Verkauf'),
        ('marketing', 'Marketing'),
        ('admin', 'Administration'),
        ('it', 'IT'),
        ('hr', 'Personalwesen'),
        ('finance', 'Finanzen'),
        ('legal', 'Recht'),
        ('other', 'Sonstiges'),
    ]
    
    POSITION_CHOICES = [
        ('ceo', 'Geschäftsführer'),
        ('manager', 'Manager'),
        ('senior_agent', 'Senior Makler'),
        ('agent', 'Makler'),
        ('junior_agent', 'Junior Makler'),
        ('assistant', 'Assistent'),
        ('intern', 'Praktikant'),
        ('other', 'Sonstiges'),
    ]
    
    EMPLOYMENT_TYPE_CHOICES = [
        ('full_time', 'Vollzeit'),
        ('part_time', 'Teilzeit'),
        ('contract', 'Vertrag'),
        ('intern', 'Praktikum'),
        ('freelance', 'Freelance'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='employees')
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    
    # Basic Info
    employee_number = models.CharField(max_length=20, unique=True, help_text="Mitarbeiternummer")
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES, default='sales')
    position = models.CharField(max_length=50, choices=POSITION_CHOICES, default='agent')
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, default='full_time')
    
    # Employment Dates
    start_date = models.DateField(help_text="Einstellungsdatum")
    end_date = models.DateField(null=True, blank=True, help_text="Austrittsdatum")
    
    # Contact Info
    work_email = models.EmailField(blank=True, null=True, help_text="Arbeits-E-Mail")
    work_phone = models.CharField(max_length=50, blank=True, null=True, help_text="Arbeits-Telefon")
    office_location = models.CharField(max_length=100, blank=True, null=True, help_text="Bürostandort")
    
    # Manager
    manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    
    # Status
    is_active = models.BooleanField(default=True)
    is_on_leave = models.BooleanField(default=False)
    leave_start = models.DateField(null=True, blank=True)
    leave_end = models.DateField(null=True, blank=True)
    
    # HR Fields
    annual_leave_days = models.IntegerField(default=30, help_text="Jährliche Urlaubstage")
    remaining_leave_days = models.IntegerField(default=30, help_text="Verbleibende Urlaubstage")
    overtime_balance = models.DecimalField(max_digits=8, decimal_places=2, default=0.0, help_text="Überstunden-Saldo")
    expense_limit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Spesen-Limit")
    
    # Additional Info
    notes = models.TextField(blank=True, null=True, help_text="Interne Notizen")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_employees')
    
    class Meta:
        db_table = 'employees'
        ordering = ['employee_number']
        indexes = [
            models.Index(fields=['tenant', 'is_active']),
            models.Index(fields=['tenant', 'department']),
            models.Index(fields=['tenant', 'position']),
            models.Index(fields=['employee_number']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} ({self.employee_number})"
    
    @property
    def full_name(self):
        return self.user.get_full_name()
    
    @property
    def email(self):
        return self.work_email or self.user.email
    
    @property
    def is_currently_employed(self):
        """Check if employee is currently employed"""
        if not self.is_active:
            return False
        if self.end_date and self.end_date < timezone.now().date():
            return False
        return True


class EmployeeCompensation(models.Model):
    """
    Employee Compensation Model
    Gehalts- und Provisionsdaten
    """
    
    SALARY_TYPE_CHOICES = [
        ('monthly', 'Monatlich'),
        ('annual', 'Jährlich'),
        ('hourly', 'Stündlich'),
    ]
    
    COMMISSION_TYPE_CHOICES = [
        ('percentage', 'Prozent'),
        ('fixed', 'Fester Betrag'),
        ('tiered', 'Gestaffelt'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='compensation')
    
    # Base Salary
    base_salary = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Grundgehalt"
    )
    salary_type = models.CharField(max_length=20, choices=SALARY_TYPE_CHOICES, default='monthly')
    currency = models.CharField(max_length=3, default='EUR')
    
    # Commission
    commission_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        help_text="Provisionssatz in Prozent"
    )
    commission_type = models.CharField(max_length=20, choices=COMMISSION_TYPE_CHOICES, default='percentage')
    commission_threshold = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text="Mindestumsatz für Provision"
    )
    
    # Bonuses
    monthly_bonus = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text="Monatlicher Bonus"
    )
    annual_bonus = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text="Jährlicher Bonus"
    )
    
    # Benefits
    car_allowance = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text="Fahrzeugzuschuss"
    )
    phone_allowance = models.DecimalField(
        max_digits=6, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text="Telefonzuschuss"
    )
    other_allowances = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text="Sonstige Zuschüsse"
    )
    
    # Tax Info
    tax_class = models.CharField(max_length=10, default='1', help_text="Steuerklasse")
    social_security_number = models.CharField(max_length=20, blank=True, null=True, help_text="Sozialversicherungsnummer")
    
    # Effective Dates
    effective_from = models.DateField(help_text="Gültig ab")
    effective_until = models.DateField(null=True, blank=True, help_text="Gültig bis")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_compensations')
    
    class Meta:
        db_table = 'employee_compensations'
        ordering = ['-effective_from']
        indexes = [
            models.Index(fields=['employee', 'effective_from']),
        ]
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.base_salary} {self.currency}"
    
    @property
    def is_current(self):
        """Check if this compensation is currently active"""
        today = timezone.now().date()
        if self.effective_from > today:
            return False
        if self.effective_until and self.effective_until < today:
            return False
        return True
    
    @property
    def total_monthly_gross(self):
        """Calculate total monthly gross salary"""
        monthly_base = self.base_salary
        if self.salary_type == 'annual':
            monthly_base = self.base_salary / 12
        elif self.salary_type == 'hourly':
            monthly_base = self.base_salary * 160  # Assume 160 hours per month
        
        return monthly_base + self.monthly_bonus + self.car_allowance + self.phone_allowance + self.other_allowances
