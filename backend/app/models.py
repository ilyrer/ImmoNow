"""
Django Models - Legacy Import Point
This file is kept for backward compatibility during migration.
All models have been moved to their respective Django apps.

New code should import directly from the app modules:
- from accounts.models import User, Tenant
- from properties.models import Property
- etc.
"""

# Import from new apps for backward compatibility
from accounts.models import (
    User,
    UserManager,
    TenantUser,
    Tenant,
    UserProfile,
    Permission,
    Role,
    FeatureFlag,
)
from common.models import AuditLog
from billing.models import BillingAccount, StripeWebhookEvent
from notifications.models import Notification, NotificationPreference
from locations.models import LocationMarketData
from custom_fields.models import CustomField, CustomFieldValue
from automation.models import AutomationRule, AutomationLog
from workflow.models import Workflow, WorkflowInstance
from sla.models import SLA, SLAInstance
from investor.models import (
    InvestorPortfolio,
    Investment,
    InvestmentExpense,
    InvestmentIncome,
    PerformanceSnapshot,
    InvestorReport,
    MarketplacePackage,
    PackageReservation,
    InvestmentType,
    InvestmentStatus,
)
from contacts.models import Contact
from appointments.models import Appointment, Attendee
from documents.models import (
    Document,
    DocumentFolder,
    DocumentVersion,
    DocumentActivity,
    DocumentComment,
)
from properties.models import (
    Property,
    Address,
    ContactPerson,
    PropertyFeatures,
    PropertyImage,
    PropertyDocument,
    PropertyMetrics,
    PropertyMetricsSnapshot,
    ExposeVersion,
    PublishJob,
    IntegrationSettings,
)
from tasks.models import (
    Task,
    TaskLabel,
    TaskComment,
    TaskSubtask,
    TaskAttachment,
    TaskActivity,
    Project,
    Board,
    BoardStatus,
    TaskPriority,
    TaskStatus,
)
from communications.models import (
    Team,
    Channel,
    ChannelMembership,
    Message,
    Reaction,
    Attachment,
    ResourceLink,
    SocialAccount,
    SocialPost,
)

__all__ = [
    # Accounts
    'Tenant',
    'User',
    'UserManager',
    'TenantUser',
    'UserProfile',
    'Permission',
    'Role',
    'FeatureFlag',
    # Common
    'AuditLog',
    # Billing
    'BillingAccount',
    'StripeWebhookEvent',
    # Notifications
    'Notification',
    'NotificationPreference',
    # Locations
    'LocationMarketData',
    # Custom Fields
    'CustomField',
    'CustomFieldValue',
    # Automation
    'AutomationRule',
    'AutomationLog',
    # Workflow
    'Workflow',
    'WorkflowInstance',
    # SLA
    'SLA',
    'SLAInstance',
    # Investor
    'InvestorPortfolio',
    'Investment',
    'InvestmentExpense',
    'InvestmentIncome',
    'PerformanceSnapshot',
    'InvestorReport',
    'MarketplacePackage',
    'PackageReservation',
    'InvestmentType',
    'InvestmentStatus',
    # Contacts
    'Contact',
    # Appointments
    'Appointment',
    'Attendee',
    # Documents
    'DocumentFolder',
    'Document',
    'DocumentVersion',
    'DocumentActivity',
    'DocumentComment',
    # Properties
    'Property',
    'Address',
    'ContactPerson',
    'PropertyFeatures',
    'PropertyImage',
    'PropertyDocument',
    'ExposeVersion',
    'PublishJob',
    'IntegrationSettings',
    'PropertyMetrics',
    'PropertyMetricsSnapshot',
    # Tasks
    'Task',
    'TaskLabel',
    'TaskComment',
    'TaskSubtask',
    'TaskAttachment',
    'TaskActivity',
    'Project',
    'Board',
    'BoardStatus',
    'TaskPriority',
    'TaskStatus',
    # Communications
    'Team',
    'Channel',
    'ChannelMembership',
    'Message',
    'Reaction',
    'Attachment',
    'ResourceLink',
    'SocialAccount',
    'SocialPost',
]
