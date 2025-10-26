"""
Enhanced Email Service für alle E-Mail-Benachrichtigungen
Unterstützt SendGrid, Mailgun, SMTP und Console-Backend
"""

import os
import logging
from datetime import datetime, time
from typing import Optional, Dict, Any, List
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from django.template.loader import render_to_string
from django.template import Context, Template
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content
import requests
from jinja2 import Template as JinjaTemplate

from app.db.models import Tenant, User, Notification, NotificationPreference, EmailLog, EmailTemplateUsage
from app.core.email_config import EmailConfig, get_template_for_notification_category, EMAIL_TEMPLATES

logger = logging.getLogger(__name__)


class EmailService:
    """Enhanced Service für Email-Versand mit Template-Support"""
    
    @staticmethod
    def _is_quiet_hours(user: User, tenant: Tenant) -> bool:
        """Check if current time is in user's quiet hours"""
        try:
            # Get user's notification preferences for system category
            pref = NotificationPreference.objects.get(
                user=user,
                tenant=tenant,
                category='system'
            )
            
            if not pref.quiet_hours_enabled:
                return False
            
            if not pref.quiet_hours_start or not pref.quiet_hours_end:
                return False
            
            now = timezone.now().time()
            start_time = pref.quiet_hours_start
            end_time = pref.quiet_hours_end
            
            # Handle overnight quiet hours (e.g., 22:00 to 08:00)
            if start_time > end_time:
                return now >= start_time or now <= end_time
            else:
                return start_time <= now <= end_time
                
        except NotificationPreference.DoesNotExist:
            return False
    
    @staticmethod
    def _get_priority_color(priority: str) -> str:
        """Get color for priority level"""
        from app.core.email_config import EmailConfig
        return EmailConfig.get_priority_colors(priority)[0]
    
    @staticmethod
    def _get_priority_color_dark(priority: str) -> str:
        """Get dark color for priority level"""
        from app.core.email_config import EmailConfig
        return EmailConfig.get_priority_colors(priority)[1]
    
    @staticmethod
    def _render_template(template_name: str, context: Dict[str, Any]) -> str:
        """Render email template with context"""
        try:
            # Add common context variables
            priority = context.get('priority', 'normal')
            context.update({
                'frontend_url': EmailConfig.FRONTEND_URL,
                'priority_color': EmailService._get_priority_color(priority),
                'priority_color_dark': EmailService._get_priority_color_dark(priority),
                'unsubscribe_url': f"{EmailConfig.FRONTEND_URL}/profile#notifications",
                'dashboard_url': f"{EmailConfig.FRONTEND_URL}/dashboard",
                'support_url': f"{EmailConfig.FRONTEND_URL}/support",
                'timestamp': timezone.now().strftime('%d.%m.%Y %H:%M'),
                'user_name': context.get('user_name', 'Lieber Kunde'),
            })
            
            return render_to_string(f'emails/{template_name}', context)
        except Exception as e:
            logger.error(f"Template rendering failed for {template_name}: {str(e)}")
            # Fallback to simple template
            return f"""
            <html>
            <body>
                <h2>{context.get('title', 'Benachrichtigung')}</h2>
                <p>{context.get('message', '')}</p>
                {f'<a href="{context.get("action_url", "")}">{context.get("action_label", "Anzeigen")}</a>' if context.get('action_url') else ''}
            </body>
            </html>
            """
    
    @staticmethod
    async def _send_via_sendgrid(to_email: str, subject: str, html_content: str) -> tuple[bool, str, str]:
        """Send email via SendGrid API"""
        try:
            sg = sendgrid.SendGridAPIClient(api_key=EmailConfig.SENDGRID_API_KEY)
            
            from_email = Email(EmailConfig.SENDGRID_FROM_EMAIL, EmailConfig.SENDGRID_FROM_NAME)
            to_email_obj = To(to_email)
            content = Content("text/html", html_content)
            
            mail = Mail(from_email, to_email_obj, subject, content)
            
            response = sg.send(mail)
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"SendGrid email sent successfully to {to_email}")
                message_id = response.headers.get('X-Message-Id', f"sendgrid_{timezone.now().timestamp()}")
                return True, message_id, None
            else:
                logger.error(f"SendGrid email failed: {response.status_code} - {response.body}")
                return False, None, f"SendGrid API error: {response.status_code}"
                
        except Exception as e:
            logger.error(f"SendGrid error: {str(e)}")
            return False, None, str(e)
    
    @staticmethod
    async def _send_via_mailgun(to_email: str, subject: str, html_content: str) -> tuple[bool, str, str]:
        """Send email via Mailgun API"""
        try:
            url = f"https://api.mailgun.net/v3/{EmailConfig.MAILGUN_DOMAIN}/messages"
            
            data = {
                'from': f"{EmailConfig.MAILGUN_FROM_NAME} <{EmailConfig.MAILGUN_FROM_EMAIL}>",
                'to': to_email,
                'subject': subject,
                'html': html_content
            }
            
            response = requests.post(
                url,
                auth=('api', EmailConfig.MAILGUN_API_KEY),
                data=data
            )
            
            if response.status_code == 200:
                logger.info(f"Mailgun email sent successfully to {to_email}")
                message_id = response.json().get('id', f"mailgun_{timezone.now().timestamp()}")
                return True, message_id, None
            else:
                logger.error(f"Mailgun email failed: {response.status_code} - {response.text}")
                return False, None, f"Mailgun API error: {response.status_code}"
                
        except Exception as e:
            logger.error(f"Mailgun error: {str(e)}")
            return False, None, str(e)
    
    @staticmethod
    async def _send_via_smtp(to_email: str, subject: str, html_content: str) -> tuple[bool, str, str]:
        """Send email via SMTP"""
        try:
            send_mail(
                subject=subject,
                message="",  # Empty message since we're sending HTML
                html_message=html_content,
                from_email=EmailConfig.DEFAULT_FROM_EMAIL,
                recipient_list=[to_email],
                fail_silently=False
            )
            logger.info(f"SMTP email sent successfully to {to_email}")
            message_id = f"smtp_{timezone.now().timestamp()}"
            return True, message_id, None
            
        except Exception as e:
            logger.error(f"SMTP error: {str(e)}")
            return False, None, str(e)
    
    @staticmethod
    def _create_email_log(
        tenant: Tenant,
        user: Optional[User],
        notification: Optional[Notification],
        email_type: str,
        recipient_email: str,
        subject: str,
        template_name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> EmailLog:
        """Create email log entry"""
        return EmailLog.objects.create(
            tenant=tenant,
            user=user,
            notification=notification,
            email_type=email_type,
            recipient_email=recipient_email,
            subject=subject,
            template_name=template_name,
            provider_name=EmailConfig.PROVIDER.value,
            metadata=metadata or {}
        )
    
    @staticmethod
    def _update_email_log_status(email_log: EmailLog, status: str, provider_message_id: str = None, error_message: str = None):
        """Update email log status"""
        email_log.status = status
        if provider_message_id:
            email_log.provider_message_id = provider_message_id
        if error_message:
            email_log.error_message = error_message
        
        if status == 'delivered':
            email_log.delivered_at = timezone.now()
        elif status == 'opened':
            email_log.opened_at = timezone.now()
        elif status == 'clicked':
            email_log.clicked_at = timezone.now()
        elif status == 'failed':
            email_log.retry_count += 1
        
        email_log.save()
    
    @staticmethod
    def _update_template_usage_stats(email_log: EmailLog):
        """Update template usage statistics"""
        if not email_log.template_name:
            return
        
        template_usage, created = EmailTemplateUsage.objects.get_or_create(
            tenant=email_log.tenant,
            template_name=email_log.template_name,
            defaults={
                'email_type': email_log.email_type,
                'total_sent': 0,
                'total_delivered': 0,
                'total_opened': 0,
                'total_clicked': 0,
                'total_failed': 0,
                'total_bounced': 0,
            }
        )
        
        template_usage.update_stats(email_log)
    
    @staticmethod
    async def _send_email(
        to_email: str, 
        subject: str, 
        html_content: str,
        email_log: Optional[EmailLog] = None
    ) -> bool:
        """Send email using configured provider with logging"""
        if not EmailConfig.EMAIL_ENABLED:
            logger.info("Email sending disabled")
            if email_log:
                EmailService._update_email_log_status(email_log, 'failed', error_message='Email sending disabled')
            return False
        
        success = False
        provider_message_id = None
        error_message = None
        
        try:
            if EmailConfig.PROVIDER.value == 'sendgrid' and EmailConfig.is_provider_configured():
                success, provider_message_id, error_message = await EmailService._send_via_sendgrid(to_email, subject, html_content)
            elif EmailConfig.PROVIDER.value == 'mailgun' and EmailConfig.is_provider_configured():
                success, provider_message_id, error_message = await EmailService._send_via_mailgun(to_email, subject, html_content)
            elif EmailConfig.PROVIDER.value == 'smtp' and EmailConfig.is_provider_configured():
                success, provider_message_id, error_message = await EmailService._send_via_smtp(to_email, subject, html_content)
            else:
                # Fallback to console for development
                logger.info(f"Console email: To: {to_email}, Subject: {subject}")
                print(f"\n{'='*50}")
                print(f"EMAIL TO: {to_email}")
                print(f"SUBJECT: {subject}")
                print(f"{'='*50}")
                print(html_content)
                print(f"{'='*50}\n")
                success = True
                provider_message_id = f"console_{timezone.now().timestamp()}"
        except Exception as e:
            error_message = str(e)
            logger.error(f"Email sending error: {error_message}")
        
        # Update email log
        if email_log:
            if success:
                EmailService._update_email_log_status(email_log, 'sent', provider_message_id)
                EmailService._update_template_usage_stats(email_log)
            else:
                EmailService._update_email_log_status(email_log, 'failed', error_message=error_message)
        
        return success
    
    @staticmethod
    async def send_notification_email(
        notification: Notification,
        user: User,
        tenant: Tenant
    ) -> bool:
        """Send notification via email based on user preferences"""
        try:
            # Check if user has email enabled for this category
            try:
                pref = NotificationPreference.objects.get(
                    user=user,
                    tenant=tenant,
                    category=notification.category
                )
                
                if not pref.email_enabled:
                    logger.info(f"Email disabled for user {user.email} category {notification.category}")
                    return False
                
                # Check quiet hours
                if EmailService._is_quiet_hours(user, tenant):
                    logger.info(f"Email suppressed due to quiet hours for user {user.email}")
                    return False
                    
            except NotificationPreference.DoesNotExist:
                # Default: send email for high/urgent priority
                if notification.priority not in ['high', 'urgent']:
                    logger.info(f"No preferences found, skipping email for priority {notification.priority}")
                    return False
            
            # Get appropriate template
            template = get_template_for_notification_category(notification.category)
            
            # Prepare context
            context = {
                'title': notification.title,
                'notification_title': notification.title,
                'message': notification.message,
                'priority': notification.priority,
                'category': notification.category,
                'action_url': notification.action_url,
                'action_label': notification.action_label,
                'related_entity_title': notification.related_entity_title,
                'user_name': user.get_full_name(),
                'tenant_name': tenant.name,
            }
            
            # Add category-specific context
            if notification.metadata:
                context.update(notification.metadata)
            
            # Render template
            html_content = EmailService._render_template(template.html_template, context)
            
            # Create email log
            email_log = EmailService._create_email_log(
                tenant=tenant,
                user=user,
                notification=notification,
                email_type='notification',
                recipient_email=user.email,
                subject=template.subject_template.format(**context),
                template_name=template.html_template,
                metadata={
                    'category': notification.category,
                    'priority': notification.priority,
                    'action_url': notification.action_url,
                }
            )
            
            # Send email
            success = await EmailService._send_email(
                user.email,
                template.subject_template.format(**context),
                html_content,
                email_log
            )
            
            if success:
                logger.info(f"Notification email sent to {user.email} for {notification.category}")
                
            return success
            
        except Exception as e:
            logger.error(f"Failed to send notification email: {str(e)}")
            return False
    
    @staticmethod
    async def send_property_notification_email(notification: Notification, user: User, tenant: Tenant) -> bool:
        """Property-specific email template"""
        return await EmailService.send_notification_email(notification, user, tenant)
    
    @staticmethod
    async def send_task_notification_email(notification: Notification, user: User, tenant: Tenant) -> bool:
        """Task-specific email template"""
        return await EmailService.send_notification_email(notification, user, tenant)
    
    @staticmethod
    async def send_appointment_notification_email(notification: Notification, user: User, tenant: Tenant) -> bool:
        """Appointment-specific email template"""
        return await EmailService.send_notification_email(notification, user, tenant)
    
    @staticmethod
    async def send_document_notification_email(notification: Notification, user: User, tenant: Tenant) -> bool:
        """Document-specific email template"""
        return await EmailService.send_notification_email(notification, user, tenant)
    
    @staticmethod
    async def send_contact_notification_email(notification: Notification, user: User, tenant: Tenant) -> bool:
        """Contact-specific email template"""
        return await EmailService.send_notification_email(notification, user, tenant)
    
    @staticmethod
    async def send_financial_notification_email(notification: Notification, user: User, tenant: Tenant) -> bool:
        """Financial-specific email template"""
        return await EmailService.send_notification_email(notification, user, tenant)
    
    @staticmethod
    async def send_system_notification_email(notification: Notification, user: User, tenant: Tenant) -> bool:
        """System-specific email template"""
        return await EmailService.send_notification_email(notification, user, tenant)
    
    @staticmethod
    async def send_payment_success_email(billing, invoice) -> bool:
        """Confirmation email after successful payment"""
        try:
            template = EMAIL_TEMPLATES['payment_success']
            
            context = {
                'title': 'Zahlung erfolgreich',
                'amount': f"€{invoice.get('amount_paid', 0) / 100:.2f}",
                'invoice_number': invoice.get('number', ''),
                'payment_date': timezone.now().strftime('%d.%m.%Y'),
                'payment_method': invoice.get('payment_method', 'Kreditkarte'),
                'subscription_details': f"Plan: {billing.plan_key}",
                'next_billing_date': billing.current_period_end.strftime('%d.%m.%Y') if billing.current_period_end else '',
                'dashboard_url': f"{EmailConfig.FRONTEND_URL}/dashboard",
                'invoice_url': f"{EmailConfig.FRONTEND_URL}/billing/invoices/{invoice.get('id', '')}",
                'user_name': billing.tenant.name,
            }
            
            html_content = EmailService._render_template(template.html_template, context)
            
            return await EmailService._send_email(
                billing.tenant.email,
                template.subject_template,
                html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send payment success email: {str(e)}")
            return False
    
    @staticmethod
    async def send_payment_failed_email(billing, invoice) -> bool:
        """Alert email when payment fails"""
        try:
            template = EMAIL_TEMPLATES['payment_failed']
            
            context = {
                'title': 'Zahlung fehlgeschlagen',
                'amount': f"€{invoice.get('amount_due', 0) / 100:.2f}",
                'invoice_number': invoice.get('number', ''),
                'failure_date': timezone.now().strftime('%d.%m.%Y'),
                'payment_method': invoice.get('payment_method', 'Kreditkarte'),
                'failure_reason': invoice.get('failure_reason', 'Unbekannter Fehler'),
                'retry_date': invoice.get('next_payment_attempt', ''),
                'update_payment_url': f"{EmailConfig.FRONTEND_URL}/billing/payment-methods",
                'support_url': f"{EmailConfig.FRONTEND_URL}/support",
                'user_name': billing.tenant.name,
            }
            
            html_content = EmailService._render_template(template.html_template, context)
            
            return await EmailService._send_email(
                billing.tenant.email,
                template.subject_template,
                html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send payment failed email: {str(e)}")
            return False
    
    @staticmethod
    async def send_subscription_upgraded_email(billing, old_plan: str, new_plan: str) -> bool:
        """Confirmation email for plan upgrade"""
        try:
            template = EMAIL_TEMPLATES['subscription_upgraded']
            
            context = {
                'title': 'Abo-Upgrade erfolgreich',
                'new_plan': new_plan,
                'old_plan': old_plan,
                'upgrade_date': timezone.now().strftime('%d.%m.%Y'),
                'new_price': f"€{billing.meta.get('price', 0) / 100:.2f}",
                'new_features': billing.meta.get('features', ''),
                'new_limits': billing.meta.get('limits', ''),
                'dashboard_url': f"{EmailConfig.FRONTEND_URL}/dashboard",
                'billing_url': f"{EmailConfig.FRONTEND_URL}/billing",
                'support_url': f"{EmailConfig.FRONTEND_URL}/support",
                'user_name': billing.tenant.name,
                'feature_list': [
                    'Erweiterte Analytics',
                    'Mehr Speicherplatz',
                    'Prioritäts-Support',
                    'Erweiterte Integrationen'
                ]
            }
            
            html_content = EmailService._render_template(template.html_template, context)
            
            return await EmailService._send_email(
                billing.tenant.email,
                template.subject_template,
                html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send subscription upgraded email: {str(e)}")
            return False
    
    @staticmethod
    async def send_subscription_downgraded_email(billing, old_plan: str, new_plan: str) -> bool:
        """Confirmation email for plan downgrade"""
        try:
            template = EMAIL_TEMPLATES['subscription_downgraded']
            
            context = {
                'title': 'Abo-Downgrade',
                'new_plan': new_plan,
                'old_plan': old_plan,
                'downgrade_date': timezone.now().strftime('%d.%m.%Y'),
                'new_price': f"€{billing.meta.get('price', 0) / 100:.2f}",
                'downgrade_reason': billing.meta.get('reason', ''),
                'affected_features': billing.meta.get('affected_features', ''),
                'dashboard_url': f"{EmailConfig.FRONTEND_URL}/dashboard",
                'upgrade_url': f"{EmailConfig.FRONTEND_URL}/billing/upgrade",
                'support_url': f"{EmailConfig.FRONTEND_URL}/support",
                'user_name': billing.tenant.name,
                'changes_list': [
                    'Reduzierte Speicherkapazität',
                    'Eingeschränkte Analytics',
                    'Standard-Support',
                    'Weniger Integrationen'
                ]
            }
            
            html_content = EmailService._render_template(template.html_template, context)
            
            return await EmailService._send_email(
                billing.tenant.email,
                template.subject_template,
                html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send subscription downgraded email: {str(e)}")
            return False
    
    @staticmethod
    async def send_test_email(user: User, tenant: Tenant) -> bool:
        """Send test email to verify configuration"""
        try:
            template = EMAIL_TEMPLATES['test_email']
            
            context = {
                'title': 'Test-E-Mail',
                'user_name': user.get_full_name(),
                'email_provider': EmailConfig.PROVIDER.value,
                'from_email': EmailConfig.get_from_email(),
                'template_name': template.name,
                'dashboard_url': f"{EmailConfig.FRONTEND_URL}/dashboard",
                'preferences_url': f"{EmailConfig.FRONTEND_URL}/profile#notifications",
            }
            
            html_content = EmailService._render_template(template.html_template, context)
            
            return await EmailService._send_email(
                user.email,
                template.subject_template,
                html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send test email: {str(e)}")
            return False
    
    @staticmethod
    async def send_user_invitation(
        user_email: str,
        tenant_name: str,
        inviter_name: str,
        invitation_link: str
    ) -> bool:
        """
        Send user invitation email
        
        Args:
            user_email: Email of user being invited
            tenant_name: Name of the tenant
            inviter_name: Name of person sending invitation
            invitation_link: Link to accept invitation
            
        Returns:
            True if email sent successfully
        """
        try:
            subject = f"You've been invited to join {tenant_name}"
            
            # Create invitation email template
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Invitation to {tenant_name}</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
                    .button {{ background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }}
                    .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>You're invited to join {tenant_name}</h1>
                    </div>
                    
                    <p>Hello!</p>
                    
                    <p><strong>{inviter_name}</strong> has invited you to join <strong>{tenant_name}</strong> on ImmoNow.</p>
                    
                    <p>ImmoNow is a comprehensive real estate management platform that will help you:</p>
                    <ul>
                        <li>Manage properties and listings</li>
                        <li>Track leads and contacts</li>
                        <li>Collaborate with your team</li>
                        <li>Generate reports and analytics</li>
                    </ul>
                    
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="{invitation_link}" class="button">Accept Invitation</a>
                    </p>
                    
                    <p>If you have any questions, please contact {inviter_name} or reply to this email.</p>
                    
                    <div class="footer">
                        <p>This invitation was sent by {inviter_name} from {tenant_name}.</p>
                        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_content = f"""
            You've been invited to join {tenant_name}
            
            {inviter_name} has invited you to join {tenant_name} on ImmoNow.
            
            ImmoNow is a comprehensive real estate management platform.
            
            Accept your invitation: {invitation_link}
            
            If you have any questions, please contact {inviter_name}.
            
            This invitation was sent by {inviter_name} from {tenant_name}.
            If you didn't expect this invitation, you can safely ignore this email.
            """
            
            # Send email using existing infrastructure
            success = await EmailService._send_email(
                to_email=user_email,
                subject=subject,
                html_content=html_content,
                text_content=text_content,
                category='invitation'
            )
            
            if success:
                logger.info(f"User invitation sent to {user_email} for tenant {tenant_name}")
            else:
                logger.error(f"Failed to send user invitation to {user_email}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error sending user invitation to {user_email}: {str(e)}")
            return False

    @staticmethod
    async def send_trial_expired_email(tenant: Tenant) -> bool:
        """Send trial expired email using new template system"""
        try:
            template = EMAIL_TEMPLATES['trial_expired']
            
            context = {
                'title': 'Testphase abgelaufen',
                'tenant_name': tenant.name,
                'trial_days': '14',  # Default trial period
                'subscription_url': f"{EmailConfig.FRONTEND_URL}/billing/subscription",
                'dashboard_url': f"{EmailConfig.FRONTEND_URL}/dashboard",
                'support_url': f"{EmailConfig.FRONTEND_URL}/support",
                'starter_plan_url': f"{EmailConfig.FRONTEND_URL}/billing/plans/starter",
                'pro_plan_url': f"{EmailConfig.FRONTEND_URL}/billing/plans/pro",
                'enterprise_plan_url': f"{EmailConfig.FRONTEND_URL}/billing/plans/enterprise",
                'subscription_plans': [
                    {
                        'name': 'Starter Plan',
                        'description': 'Perfekt für kleine Immobilienverwaltungen',
                        'price': '€29/Monat'
                    },
                    {
                        'name': 'Pro Plan', 
                        'description': 'Für wachsende Unternehmen',
                        'price': '€99/Monat'
                    },
                    {
                        'name': 'Enterprise Plan',
                        'description': 'Für große Immobilienunternehmen',
                        'price': '€299/Monat'
                    }
                ]
            }
            
            html_content = EmailService._render_template(template.html_template, context)
            
            return await EmailService._send_email(
                tenant.email,
                template.subject_template,
                html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send trial expired email: {str(e)}")
            return False
    
    @staticmethod
    async def send_welcome_email(user: User, tenant: Tenant) -> bool:
        """Send welcome email using new template system"""
        try:
            template = EMAIL_TEMPLATES['welcome']
            
            context = {
                'title': 'Willkommen bei ImmoNow',
                'user_name': user.get_full_name(),
                'tenant_name': tenant.name,
                'trial_period': '14',
                'dashboard_url': f"{EmailConfig.FRONTEND_URL}/dashboard",
                'tutorial_url': f"{EmailConfig.FRONTEND_URL}/tutorial",
                'support_url': f"{EmailConfig.FRONTEND_URL}/support",
                'subscription_plans': [
                    {
                        'name': 'Starter Plan',
                        'description': 'Perfekt für kleine Immobilienverwaltungen',
                        'price': '€29/Monat'
                    },
                    {
                        'name': 'Pro Plan',
                        'description': 'Für wachsende Unternehmen', 
                        'price': '€99/Monat'
                    },
                    {
                        'name': 'Enterprise Plan',
                        'description': 'Für große Immobilienunternehmen',
                        'price': '€299/Monat'
                    }
                ]
            }
            
            html_content = EmailService._render_template(template.html_template, context)
            
            return await EmailService._send_email(
                user.email,
                template.subject_template,
                html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send welcome email: {str(e)}")
            return False