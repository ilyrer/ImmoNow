"""
Django Admin für Investor App
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import (
    InvestorPortfolio, Investment, InvestmentExpense,
    InvestmentIncome, PerformanceSnapshot, InvestorReport,
    MarketplacePackage, PackageReservation, InvestmentType,
    InvestmentStatus,
)


class InvestmentInline(admin.TabularInline):
    """Investment Inline Admin"""
    model = Investment
    extra = 0
    fields = ('property', 'investment_type', 'status', 'amount', 'purchase_date')


@admin.register(InvestorPortfolio)
class InvestorPortfolioAdmin(admin.ModelAdmin):
    """Investor Portfolio Admin"""
    
    list_display = ('name', 'owner', 'tenant', 'created_at')
    list_filter = ('tenant', 'created_at')
    search_fields = ('name', 'description', 'owner__email')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')
    
    fieldsets = (
        (None, {'fields': ('tenant', 'name', 'description', 'owner')}),
        (_('Important dates'), {'fields': ('id', 'created_at', 'updated_at')}),
    )
    
    inlines = [InvestmentInline]


@admin.register(Investment)
class InvestmentAdmin(admin.ModelAdmin):
    """Investment Admin"""
    
    list_display = ('portfolio', 'related_property', 'investment_type', 'status', 'purchase_price', 'current_value', 'purchase_date', 'created_at')
    list_filter = ('investment_type', 'status', 'portfolio', 'purchase_date', 'created_at')
    search_fields = ('portfolio__name', 'related_property__title', 'notes')
    ordering = ('-purchase_date',)
    readonly_fields = ('id', 'created_at')
    
    fieldsets = (
        (None, {'fields': ('tenant', 'portfolio', 'related_property', 'investment_type', 'status')}),
        (_('Financial'), {
            'fields': ('purchase_price', 'current_value', 'purchase_date', 'currency')
        }),
        (_('Performance'), {
            'fields': ('target_roi', 'actual_roi', 'monthly_rental_income', 'monthly_expenses', 'occupancy_rate')
        }),
        (_('Details'), {
            'fields': ('notes',)
        }),
        (_('Important dates'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(InvestmentExpense)
class InvestmentExpenseAdmin(admin.ModelAdmin):
    """Investment Expense Admin"""
    
    list_display = ('investment', 'expense_type', 'amount', 'date', 'created_at')
    list_filter = ('expense_type', 'date', 'created_at')
    search_fields = ('investment__property__title', 'description')
    ordering = ('-date',)
    readonly_fields = ('id', 'created_at')


@admin.register(InvestmentIncome)
class InvestmentIncomeAdmin(admin.ModelAdmin):
    """Investment Income Admin"""
    
    list_display = ('investment', 'income_type', 'amount', 'date', 'created_at')
    list_filter = ('income_type', 'date', 'created_at')
    search_fields = ('investment__property__title', 'description')
    ordering = ('-date',)
    readonly_fields = ('id', 'created_at')


@admin.register(PerformanceSnapshot)
class PerformanceSnapshotAdmin(admin.ModelAdmin):
    """Performance Snapshot Admin"""
    
    list_display = ('investment', 'snapshot_date', 'property_value', 'total_equity', 'roi_ytd')
    list_filter = ('snapshot_date',)
    search_fields = ('investment__portfolio__name',)
    ordering = ('-snapshot_date',)
    readonly_fields = ('id', 'investment', 'snapshot_date', 'created_at')
    
    fieldsets = (
        (None, {'fields': ('investment', 'snapshot_date')}),
        (_('Financial'), {
            'fields': ('property_value', 'total_equity', 'total_income_ytd', 'total_expenses_ytd', 'net_cashflow_ytd', 'roi_ytd', 'occupancy_rate')
        }),
        (_('Market Data'), {
            'fields': ('market_average_price_sqm', 'market_average_rent_sqm')
        }),
        (_('Important dates'), {
            'fields': ('id', 'created_at')
        }),
    )


@admin.register(MarketplacePackage)
class MarketplacePackageAdmin(admin.ModelAdmin):
    """Marketplace Package Admin"""
    
    list_display = ('title', 'total_value', 'expected_roi', 'status', 'expires_at', 'created_at')
    list_filter = ('status', 'created_at', 'expires_at')
    search_fields = ('title', 'description', 'location')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')

    fieldsets = (
        (None, {'fields': ('tenant', 'title', 'description', 'location')}),
        (_('Financial'), {
            'fields': ('total_value', 'min_investment', 'expected_roi')
        }),
        (_('Package Details'), {
            'fields': ('property_count', 'property_types', 'max_investors', 'current_investors')
        }),
        (_('Status'), {
            'fields': ('status', 'expires_at')
        }),
        (_('Important dates'), {
            'fields': ('id', 'created_at')
        }),
    )


@admin.register(PackageReservation)
class PackageReservationAdmin(admin.ModelAdmin):
    """Package Reservation Admin"""
    
    list_display = ('package', 'investor', 'status', 'investment_amount', 'created_at', 'expires_at')
    list_filter = ('status', 'created_at', 'expires_at')
    search_fields = ('package__title', 'investor__email')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')
    
    fieldsets = (
        (None, {'fields': ('package', 'investor', 'status', 'investment_amount')}),
        (_('Dates'), {
            'fields': ('expires_at',)
        }),
        (_('Important dates'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )
