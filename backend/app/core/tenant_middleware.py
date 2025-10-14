"""
Tenant-aware Middleware für automatische Datenfilterung
"""

from django.utils.deprecation import MiddlewareMixin
from django.http import Http404
from app.models import TenantUser


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware, die automatisch alle Daten nach dem Tenant des Users filtert
    """
    
    def process_request(self, request):
        """Setzt den aktuellen Tenant für den Request"""
        if request.user.is_authenticated and not request.user.is_superuser:
            # Finde den Primary Tenant des Users
            tenant_membership = TenantUser.objects.filter(
                user=request.user,
                is_active=True
            ).first()
            
            if tenant_membership:
                request.current_tenant = tenant_membership.tenant
                request.current_tenant_user = tenant_membership
            else:
                # User hat keinen aktiven Tenant - Zugriff verweigern
                request.current_tenant = None
                request.current_tenant_user = None
        else:
            # Superuser oder nicht authentifiziert
            request.current_tenant = None
            request.current_tenant_user = None
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        """Prüft Tenant-Berechtigung für bestimmte Views"""
        # Skip für Admin-Views und Superuser
        if request.path.startswith('/admin/') or request.user.is_superuser:
            return None
        
        # Skip für Auth-Views
        if request.path.startswith('/auth/'):
            return None
        
        # Prüfe Tenant-Zugriff für normale User
        if request.user.is_authenticated and not request.user.is_superuser:
            if not hasattr(request, 'current_tenant') or request.current_tenant is None:
                raise Http404("Kein Tenant-Zugriff verfügbar")
        
        return None

