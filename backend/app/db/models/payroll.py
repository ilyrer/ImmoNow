"""
Payroll Models
Lohnabrechnung und Gehaltsverwaltung
"""

import uuid
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal

from .tenant import Tenant
from .user import User
from .employee import Employee


class PayrollRun(models.Model):
    """
    Payroll Run Model
    Lohnabrechnungsläufe mit Status-Tracking
    """
    
    STATUS_CHOICES = [
        ('draft', 'Entwurf'),
        ('approved', 'Genehmigt'),
        ('paid', 'Bezahlt'),
        ('cancelled', 'Storniert'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='payroll_runs')
    
    # Period Info
    period = models.CharField(max_length=7, help_text="Format: YYYY-MM")
    period_start = models.DateField(help_text="Periode von")
    period_end = models.DateField(help_text="Periode bis")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Totals
    total_gross = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    total_net = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    total_taxes = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    total_social_security = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Employee Count
    employee_count = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    # Users
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_payroll_runs')
    approved_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='approved_payroll_runs'
    )
    
    # Notes
    notes = models.TextField(blank=True, null=True, help_text="Interne Notizen")
    
    class Meta:
        db_table = 'payroll_runs'
        ordering = ['-period', '-created_at']
        unique_together = ['tenant', 'period']
        indexes = [
            models.Index(fields=['tenant', 'period']),
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['period']),
        ]
    
    def __str__(self):
        return f"Payroll {self.period} ({self.status})"
    
    @property
    def is_editable(self):
        """Check if payroll run can be edited"""
        return self.status == 'draft'
    
    @property
    def can_be_approved(self):
        """Check if payroll run can be approved"""
        return self.status == 'draft' and self.employee_count > 0
    
    @property
    def can_be_paid(self):
        """Check if payroll run can be marked as paid"""
        return self.status == 'approved'


class PayrollEntry(models.Model):
    """
    Payroll Entry Model
    Einzelne Gehaltsabrechnungen pro Mitarbeiter
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payroll_run = models.ForeignKey(PayrollRun, on_delete=models.CASCADE, related_name='entries')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payroll_entries')
    
    # Base Salary
    base_salary = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Variable Pay
    commission = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    bonuses = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    overtime = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Allowances
    car_allowance = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    phone_allowance = models.DecimalField(
        max_digits=6, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    other_allowances = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Deductions
    income_tax = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    social_security_employee = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    health_insurance = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    pension_insurance = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    unemployment_insurance = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    other_deductions = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Totals
    gross_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    total_deductions = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    net_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Currency
    currency = models.CharField(max_length=3, default='EUR')
    
    # Working Days
    working_days = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    total_days = models.IntegerField(default=30, validators=[MinValueValidator(1)])
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payroll_entries'
        ordering = ['employee__employee_number']
        unique_together = ['payroll_run', 'employee']
        indexes = [
            models.Index(fields=['payroll_run', 'employee']),
            models.Index(fields=['employee']),
        ]
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.payroll_run.period}"
    
    def calculate_totals(self):
        """Calculate gross, deductions and net amounts"""
        # Gross amount
        self.gross_amount = (
            self.base_salary + 
            self.commission + 
            self.bonuses + 
            self.overtime + 
            self.car_allowance + 
            self.phone_allowance + 
            self.other_allowances
        )
        
        # Total deductions
        self.total_deductions = (
            self.income_tax + 
            self.social_security_employee + 
            self.health_insurance + 
            self.pension_insurance + 
            self.unemployment_insurance + 
            self.other_deductions
        )
        
        # Net amount
        self.net_amount = self.gross_amount - self.total_deductions
        
        return {
            'gross': self.gross_amount,
            'deductions': self.total_deductions,
            'net': self.net_amount
        }
    
    def save(self, *args, **kwargs):
        """Override save to calculate totals"""
        self.calculate_totals()
        super().save(*args, **kwargs)
