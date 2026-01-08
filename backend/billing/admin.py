"""
Django Admin für Billing App
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import BillingAccount, StripeWebhookEvent


@admin.register(BillingAccount)
class BillingAccountAdmin(admin.ModelAdmin):
    """Billing Account Admin"""

    list_display = ('tenant', 'stripe_customer_id', 'stripe_subscription_id', 'plan_key', 'status', 'created_at')
    list_filter = ('plan_key', 'status', 'created_at')
    search_fields = ('tenant__name', 'stripe_customer_id', 'stripe_subscription_id')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')

    fieldsets = (
        (None, {'fields': ('tenant', 'stripe_customer_id', 'stripe_subscription_id')}),
        (_('Subscription Details'), {
            'fields': ('plan_key', 'status', 'current_period_end', 'cancel_at_period_end')
        }),
        (_('Trial'), {
            'fields': ('trial_days', 'trial_end')
        }),
        (_('Metadata'), {
            'fields': ('meta',)
        }),
        (_('Important dates'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(StripeWebhookEvent)
class StripeWebhookEventAdmin(admin.ModelAdmin):
    """Stripe Webhook Event Admin"""

    list_display = ('event_id', 'event_type', 'processed_at')
    list_filter = ('event_type', 'processed_at')
    search_fields = ('event_id', 'event_type', 'payload')
    ordering = ('-processed_at',)
    readonly_fields = ('id', 'event_id', 'payload', 'processed_at')

    def has_add_permission(self, request):
        """Webhook events are created automatically"""
        return False

    def has_change_permission(self, request, obj=None):
        """Webhook events should not be manually changed"""
        return False
