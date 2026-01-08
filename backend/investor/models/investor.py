"""
Investor Models
Django models for investor portfolio management
"""

import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal


class InvestorPortfolio(models.Model):
    """Investor Portfolio - main container for all investments"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="investor_portfolios"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name="portfolios")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "investor_portfolios"
        indexes = [
            models.Index(fields=["tenant", "owner"]),
            models.Index(fields=["created_at"]),
        ]
        app_label = 'investor'

    def __str__(self):
        return f"{self.name} - {self.owner.email}"


class InvestmentType(models.TextChoices):
    """Investment types"""

    DIRECT = "direct", "Direct Property"
    FUND = "fund", "Investment Fund"
    REIT = "reit", "REIT"
    CROWDFUNDING = "crowdfunding", "Crowdfunding"
    SHARES = "shares", "Property Shares"


class InvestmentStatus(models.TextChoices):
    """Investment status"""

    ACTIVE = "active", "Active"
    PENDING = "pending", "Pending"
    SOLD = "sold", "Sold"
    EXITED = "exited", "Exited"
    DEFAULTED = "defaulted", "Defaulted"


class Investment(models.Model):
    """Individual Investment - represents a single investment in a property or fund"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="investments"
    )
    portfolio = models.ForeignKey(
        InvestorPortfolio, on_delete=models.CASCADE, related_name="investments"
    )

    # Investment details
    related_property = models.ForeignKey(
        "properties.Property",
        on_delete=models.CASCADE,
        related_name="investments",
        null=True,
        blank=True,
    )
    investment_type = models.CharField(
        max_length=20, choices=InvestmentType.choices, default=InvestmentType.DIRECT
    )
    status = models.CharField(
        max_length=20, choices=InvestmentStatus.choices, default=InvestmentStatus.ACTIVE
    )

    # Financial data
    purchase_price = models.DecimalField(
        max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    current_value = models.DecimalField(
        max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    purchase_date = models.DateField()
    currency = models.CharField(max_length=3, default="EUR")

    # Performance metrics
    target_roi = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("-100")),
            MaxValueValidator(Decimal("1000")),
        ],
        help_text="Target ROI in percentage",
    )
    actual_roi = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("-100")),
            MaxValueValidator(Decimal("1000")),
        ],
        default=Decimal("0"),
        help_text="Actual ROI in percentage",
    )

    # Monthly/Annual cash flows
    monthly_rental_income = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )
    monthly_expenses = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )

    # Occupancy
    occupancy_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0")), MaxValueValidator(Decimal("100"))],
        default=Decimal("100"),
        help_text="Occupancy rate in percentage",
    )

    # Additional info
    notes = models.TextField(blank=True, null=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "investments"
        indexes = [
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["portfolio"]),
            models.Index(fields=["related_property"]),
            models.Index(fields=["purchase_date"]),
        ]
        app_label = 'investor'

    def __str__(self):
        if self.related_property:
            return f"Investment in {self.related_property.title}"
        return f"Investment {self.id}"

    @property
    def net_cashflow(self):
        """Calculate net monthly cashflow"""
        return self.monthly_rental_income - self.monthly_expenses

    @property
    def annual_cashflow(self):
        """Calculate annual cashflow"""
        return self.net_cashflow * 12


class InvestmentExpense(models.Model):
    """Expenses associated with an investment"""

    EXPENSE_TYPE_CHOICES = [
        ("maintenance", "Maintenance"),
        ("utilities", "Utilities"),
        ("property_tax", "Property Tax"),
        ("insurance", "Insurance"),
        ("management", "Management Fee"),
        ("hoa", "HOA Fee"),
        ("mortgage", "Mortgage Payment"),
        ("other", "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    investment = models.ForeignKey(
        Investment, on_delete=models.CASCADE, related_name="expenses"
    )

    expense_type = models.CharField(max_length=50, choices=EXPENSE_TYPE_CHOICES)
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    is_recurring = models.BooleanField(default=False)
    recurring_frequency = models.CharField(
        max_length=20,
        choices=[
            ("monthly", "Monthly"),
            ("quarterly", "Quarterly"),
            ("annual", "Annual"),
        ],
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "investment_expenses"
        indexes = [
            models.Index(fields=["investment", "date"]),
            models.Index(fields=["expense_type"]),
        ]
        app_label = 'investor'

    def __str__(self):
        return f"{self.expense_type} - {self.amount} EUR"


class InvestmentIncome(models.Model):
    """Income associated with an investment"""

    INCOME_TYPE_CHOICES = [
        ("rental", "Rental Income"),
        ("parking", "Parking"),
        ("storage", "Storage"),
        ("appreciation", "Property Appreciation"),
        ("dividend", "Dividend"),
        ("other", "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    investment = models.ForeignKey(
        Investment, on_delete=models.CASCADE, related_name="income"
    )

    income_type = models.CharField(max_length=50, choices=INCOME_TYPE_CHOICES)
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    is_recurring = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "investment_income"
        indexes = [
            models.Index(fields=["investment", "date"]),
            models.Index(fields=["income_type"]),
        ]
        app_label = 'investor'

    def __str__(self):
        return f"{self.income_type} - {self.amount} EUR"


class PerformanceSnapshot(models.Model):
    """Historical performance snapshots for tracking over time"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    investment = models.ForeignKey(
        Investment, on_delete=models.CASCADE, related_name="performance_snapshots"
    )

    snapshot_date = models.DateField()
    property_value = models.DecimalField(max_digits=15, decimal_places=2)
    total_equity = models.DecimalField(max_digits=15, decimal_places=2)
    total_income_ytd = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )
    total_expenses_ytd = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )
    net_cashflow_ytd = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )
    roi_ytd = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0"))
    occupancy_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("100")
    )

    # Market data
    market_average_price_sqm = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    market_average_rent_sqm = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "performance_snapshots"
        indexes = [
            models.Index(fields=["investment", "snapshot_date"]),
        ]
        unique_together = ["investment", "snapshot_date"]
        app_label = 'investor'

    def __str__(self):
        return f"Snapshot for {self.investment} on {self.snapshot_date}"


class InvestorReport(models.Model):
    """Generated investor reports"""

    REPORT_TYPE_CHOICES = [
        ("monthly", "Monthly"),
        ("quarterly", "Quarterly"),
        ("annual", "Annual"),
        ("custom", "Custom"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("generating", "Generating"),
        ("generated", "Generated"),
        ("failed", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="investor_reports"
    )
    portfolio = models.ForeignKey(
        InvestorPortfolio,
        on_delete=models.CASCADE,
        related_name="reports",
        null=True,
        blank=True,
    )

    title = models.CharField(max_length=255)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    period_start = models.DateField()
    period_end = models.DateField()

    # Report data (stored as JSON)
    summary = models.JSONField(default=dict)

    # File storage
    file_url = models.URLField(blank=True, null=True)
    file_path = models.CharField(max_length=500, blank=True, null=True)

    generated_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, related_name="generated_reports"
    )
    generated_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "investor_reports"
        indexes = [
            models.Index(fields=["tenant", "created_at"]),
            models.Index(fields=["portfolio"]),
            models.Index(fields=["report_type"]),
        ]
        app_label = 'investor'

    def __str__(self):
        return f"{self.title} ({self.report_type})"


class MarketplacePackage(models.Model):
    """Investment packages available on the marketplace"""

    STATUS_CHOICES = [
        ("available", "Available"),
        ("reserved", "Reserved"),
        ("sold", "Sold"),
        ("expired", "Expired"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="marketplace_packages"
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    location = models.CharField(max_length=255)

    # Financial info
    total_value = models.DecimalField(max_digits=15, decimal_places=2)
    min_investment = models.DecimalField(max_digits=15, decimal_places=2)
    expected_roi = models.DecimalField(max_digits=5, decimal_places=2)

    # Package details
    property_count = models.IntegerField(default=1)
    property_types = models.JSONField(default=list)  # List of property types

    # Investor limits
    max_investors = models.IntegerField()
    current_investors = models.IntegerField(default=0)

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="available"
    )

    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "marketplace_packages"
        indexes = [
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["expires_at"]),
        ]
        app_label = 'investor'

    def __str__(self):
        return self.title


class PackageReservation(models.Model):
    """Reservations for marketplace packages"""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("expired", "Expired"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    package = models.ForeignKey(
        MarketplacePackage, on_delete=models.CASCADE, related_name="reservations"
    )
    investor = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name="package_reservations"
    )

    investment_amount = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "package_reservations"
        indexes = [
            models.Index(fields=["package", "status"]),
            models.Index(fields=["investor"]),
        ]
        app_label = 'investor'

    def __str__(self):
        return f"Reservation by {self.investor.email} for {self.package.title}"
