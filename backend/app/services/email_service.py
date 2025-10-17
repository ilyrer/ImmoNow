"""
Email Service für Trial-Expired Benachrichtigungen
"""

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from typing import Optional

from app.db.models import Tenant


class EmailService:
    """Service für Email-Versand"""
    
    @staticmethod
    async def send_trial_expired_email(tenant: Tenant) -> bool:
        """
        Sendet Email wenn Trial abgelaufen ist
        
        Args:
            tenant: Tenant-Objekt
            
        Returns:
            True wenn erfolgreich gesendet
        """
        try:
            subject = "Ihre 14-Tage-Testphase ist abgelaufen - ImmoNow"
            
            body = f"""
Hallo {tenant.name},

Ihre 14-tägige Testphase bei ImmoNow ist abgelaufen.

Um weiterhin Zugriff auf alle Funktionen zu haben, wählen Sie bitte ein passendes Abo:

🚀 Starter Plan - €29/Monat
   • 5 Benutzer
   • 25 Immobilien
   • 10 GB Speicher
   • Erweiterte Analytics

💼 Pro Plan - €99/Monat
   • 20 Benutzer
   • 100 Immobilien
   • 50 GB Speicher
   • Premium Analytics
   • Integrationen & Reporting

🏢 Enterprise Plan - €299/Monat
   • Unbegrenzte Benutzer
   • Unbegrenzte Immobilien
   • 500 GB Speicher
   • White Label Optionen

Jetzt upgraden: {settings.FRONTEND_URL}/subscription

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen,
Ihr ImmoNow Team
            """
            
            # Sende an Company Email (falls vorhanden) oder Tenant-Email
            recipient_email = getattr(tenant, 'company_email', None) or tenant.email
            
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient_email],
                fail_silently=False
            )
            
            print(f"✅ EmailService: Trial expired email sent to {recipient_email}")
            return True
            
        except Exception as e:
            print(f"❌ EmailService: Failed to send trial expired email: {str(e)}")
            return False
    
    @staticmethod
    async def send_welcome_email(tenant: Tenant, user_email: str) -> bool:
        """
        Sendet Willkommens-Email nach Registrierung
        
        Args:
            tenant: Tenant-Objekt
            user_email: User Email
            
        Returns:
            True wenn erfolgreich gesendet
        """
        try:
            subject = "Willkommen bei ImmoNow - Ihre 14-Tage-Testphase beginnt"
            
            body = f"""
Hallo {tenant.name},

herzlich willkommen bei ImmoNow!

Ihre 14-tägige Testphase beginnt jetzt. Sie haben vollen Zugriff auf alle Funktionen:

✅ Immobilien-Verwaltung
✅ Kontakt-Management  
✅ Dokumenten-Upload
✅ Analytics & Reporting
✅ Und vieles mehr...

Nach 14 Tagen können Sie zwischen unseren Plänen wählen:
• Starter (€29/Monat)
• Pro (€99/Monat)  
• Enterprise (€299/Monat)

Falls Sie Fragen haben, kontaktieren Sie uns gerne.

Viel Erfolg mit ImmoNow!

Mit freundlichen Grüßen,
Ihr ImmoNow Team
            """
            
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user_email],
                fail_silently=False
            )
            
            print(f"✅ EmailService: Welcome email sent to {user_email}")
            return True
            
        except Exception as e:
            print(f"❌ EmailService: Failed to send welcome email: {str(e)}")
            return False
