"""
Django Models - DEPRECATED
All models have been moved to their respective Django apps.

This file is kept empty. All models are now in:
- accounts.models (User, Tenant, UserProfile, etc.)
- properties.models (Property, Address, etc.)
- contacts.models (Contact)
- documents.models (Document, DocumentFolder, etc.)
- tasks.models (Task, Project, Board, etc.)
- appointments.models (Appointment, Attendee)
- communications.models (Team, Channel, Message, etc.)
- investor.models (InvestorPortfolio, Investment, etc.)
- notifications.models (Notification, NotificationPreference)
- billing.models (BillingAccount, StripeWebhookEvent)
- automation.models (AutomationRule, AutomationLog)
- workflow.models (Workflow, WorkflowInstance)
- sla.models (SLA, SLAInstance)
- locations.models (LocationMarketData)
- custom_fields.models (CustomField, CustomFieldValue)
- common.models (AuditLog)

For backward compatibility, use app.models which re-exports from the new apps.
"""

# Empty - all models moved to new apps
__all__ = []
