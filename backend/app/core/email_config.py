"""
Email Configuration and Template Management
Konfiguration für SendGrid/Mailgun und E-Mail-Template-Definitionen
"""

import os
from typing import Dict, Any, Optional
from enum import Enum
from dataclasses import dataclass
from django.conf import settings


class EmailProvider(Enum):
    """Supported email providers"""
    SENDGRID = "sendgrid"
    MAILGUN = "mailgun"
    SMTP = "smtp"
    CONSOLE = "console"


@dataclass
class EmailTemplate:
    """Email template configuration"""
    name: str
    subject_template: str
    html_template: str
    text_template: Optional[str] = None
    category: Optional[str] = None
    priority: str = "normal"


class EmailConfig:
    """Email configuration and template management"""
    
    # Email Provider Configuration
    PROVIDER = EmailProvider(os.getenv('EMAIL_PROVIDER', 'console'))
    
    # SendGrid Configuration
    SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
    SENDGRID_FROM_EMAIL = os.getenv('SENDGRID_FROM_EMAIL', 'noreply@immonow.com')
    SENDGRID_FROM_NAME = os.getenv('SENDGRID_FROM_NAME', 'ImmoNow')
    
    # Mailgun Configuration
    MAILGUN_API_KEY = os.getenv('MAILGUN_API_KEY')
    MAILGUN_DOMAIN = os.getenv('MAILGUN_DOMAIN')
    MAILGUN_FROM_EMAIL = os.getenv('MAILGUN_FROM_EMAIL', 'noreply@immonow.com')
    MAILGUN_FROM_NAME = os.getenv('MAILGUN_FROM_NAME', 'ImmoNow')
    
    # SMTP Configuration (fallback)
    SMTP_HOST = os.getenv('SMTP_HOST', 'localhost')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
    SMTP_USERNAME = os.getenv('SMTP_USERNAME')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
    SMTP_USE_TLS = os.getenv('SMTP_USE_TLS', 'True').lower() == 'true'
    
    # General Configuration
    DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@immonow.com')
    DEFAULT_FROM_NAME = os.getenv('DEFAULT_FROM_NAME', 'ImmoNow')
    EMAIL_ENABLED = os.getenv('EMAIL_ENABLED', 'True').lower() == 'true'
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    
    # Template Configuration
    TEMPLATE_BASE_URL = f"{FRONTEND_URL}/api/v1/emails/templates"
    
    @classmethod
    def get_from_email(cls) -> str:
        """Get the appropriate from email based on provider"""
        if cls.PROVIDER == EmailProvider.SENDGRID:
            return cls.SENDGRID_FROM_EMAIL
        elif cls.PROVIDER == EmailProvider.MAILGUN:
            return cls.MAILGUN_FROM_EMAIL
        else:
            return cls.DEFAULT_FROM_EMAIL
    
    @classmethod
    def get_from_name(cls) -> str:
        """Get the appropriate from name based on provider"""
        if cls.PROVIDER == EmailProvider.SENDGRID:
            return cls.SENDGRID_FROM_NAME
        elif cls.PROVIDER == EmailProvider.MAILGUN:
            return cls.MAILGUN_FROM_NAME
        else:
            return cls.DEFAULT_FROM_NAME
    
    @classmethod
    def is_provider_configured(cls) -> bool:
        """Check if the selected provider is properly configured"""
        if cls.PROVIDER == EmailProvider.SENDGRID:
            return bool(cls.SENDGRID_API_KEY)
        elif cls.PROVIDER == EmailProvider.MAILGUN:
            return bool(cls.MAILGUN_API_KEY and cls.MAILGUN_DOMAIN)
        elif cls.PROVIDER == EmailProvider.SMTP:
            return bool(cls.SMTP_HOST and cls.SMTP_USERNAME and cls.SMTP_PASSWORD)
        else:
            return True  # Console provider always works
    
    @staticmethod
    def get_priority_colors(priority: str) -> tuple[str, str]:
        """Get priority colors for email templates."""
        color_map = {
            'urgent': ('#FF9500', '#E6850E'),  # Orange
            'high': ('#FF3B30', '#E5342B'),   # Red
            'normal': ('#34C759', '#30B04A'),  # Green
            'low': ('#8E8E93', '#7A7A7E'),    # Gray
        }
        return color_map.get(priority.lower(), ('#007AFF', '#0056CC'))  # Default Blue


# Email Template Definitions
EMAIL_TEMPLATES = {
    # Notification Templates
    'notification_property': EmailTemplate(
        name='notification_property',
        subject_template='🏠 Immobilien-Benachrichtigung: {{ title }}',
        html_template='notification_property.html',
        text_template='notification_property.txt',
        category='property',
        priority='normal'
    ),
    
    'notification_task': EmailTemplate(
        name='notification_task',
        subject_template='📋 Aufgaben-Benachrichtigung: {{ title }}',
        html_template='notification_task.html',
        text_template='notification_task.txt',
        category='task',
        priority='normal'
    ),
    
    'notification_appointment': EmailTemplate(
        name='notification_appointment',
        subject_template='📅 Termin-Benachrichtigung: {{ title }}',
        html_template='notification_appointment.html',
        text_template='notification_appointment.txt',
        category='appointment',
        priority='high'
    ),
    
    'notification_document': EmailTemplate(
        name='notification_document',
        subject_template='📄 Dokument-Benachrichtigung: {{ title }}',
        html_template='notification_document.html',
        text_template='notification_document.txt',
        category='document',
        priority='normal'
    ),
    
    'notification_contact': EmailTemplate(
        name='notification_contact',
        subject_template='👤 Kontakt-Benachrichtigung: {{ title }}',
        html_template='notification_contact.html',
        text_template='notification_contact.txt',
        category='contact',
        priority='normal'
    ),
    
    'notification_financial': EmailTemplate(
        name='notification_financial',
        subject_template='💰 Finanz-Benachrichtigung: {{ title }}',
        html_template='notification_financial.html',
        text_template='notification_financial.txt',
        category='financial',
        priority='high'
    ),
    
    'notification_system': EmailTemplate(
        name='notification_system',
        subject_template='⚙️ System-Benachrichtigung: {{ title }}',
        html_template='notification_system.html',
        text_template='notification_system.txt',
        category='system',
        priority='normal'
    ),
    
    'notification_generic': EmailTemplate(
        name='notification_generic',
        subject_template='🔔 Benachrichtigung: {{ title }}',
        html_template='notification_generic.html',
        text_template='notification_generic.txt',
        category='generic',
        priority='normal'
    ),
    
    # Billing Templates
    'payment_success': EmailTemplate(
        name='payment_success',
        subject_template='✅ Zahlung erfolgreich - ImmoNow',
        html_template='payment_success.html',
        text_template='payment_success.txt',
        category='billing',
        priority='high'
    ),
    
    'payment_failed': EmailTemplate(
        name='payment_failed',
        subject_template='❌ Zahlung fehlgeschlagen - ImmoNow',
        html_template='payment_failed.html',
        text_template='payment_failed.txt',
        category='billing',
        priority='urgent'
    ),
    
    'subscription_upgraded': EmailTemplate(
        name='subscription_upgraded',
        subject_template='🚀 Abo-Upgrade erfolgreich - ImmoNow',
        html_template='subscription_upgraded.html',
        text_template='subscription_upgraded.txt',
        category='billing',
        priority='high'
    ),
    
    'subscription_downgraded': EmailTemplate(
        name='subscription_downgraded',
        subject_template='📉 Abo-Downgrade - ImmoNow',
        html_template='subscription_downgraded.html',
        text_template='subscription_downgraded.txt',
        category='billing',
        priority='normal'
    ),
    
    # System Templates
    'welcome': EmailTemplate(
        name='welcome',
        subject_template='🎉 Willkommen bei ImmoNow!',
        html_template='welcome.html',
        text_template='welcome.txt',
        category='system',
        priority='normal'
    ),
    
    'trial_expired': EmailTemplate(
        name='trial_expired',
        subject_template='⏰ Ihre Testphase ist abgelaufen - ImmoNow',
        html_template='trial_expired.html',
        text_template='trial_expired.txt',
        category='system',
        priority='high'
    ),
    
    'test_email': EmailTemplate(
        name='test_email',
        subject_template='🧪 Test-E-Mail - ImmoNow',
        html_template='test_email.html',
        text_template='test_email.txt',
        category='system',
        priority='low'
    ),
}


def get_template(template_name: str) -> Optional[EmailTemplate]:
    """Get email template by name"""
    return EMAIL_TEMPLATES.get(template_name)


def get_templates_by_category(category: str) -> Dict[str, EmailTemplate]:
    """Get all templates for a specific category"""
    return {
        name: template for name, template in EMAIL_TEMPLATES.items()
        if template.category == category
    }


def get_template_for_notification_category(category: str) -> EmailTemplate:
    """Get the appropriate template for a notification category"""
    template_name = f'notification_{category}'
    template = get_template(template_name)
    
    if template:
        return template
    
    # Fallback to generic template
    return get_template('notification_generic')
