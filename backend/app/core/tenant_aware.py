"""
Tenant-aware Model Manager
"""

from django.db import models


class TenantAwareManager(models.Manager):
    """
    Manager, der automatisch alle Daten nach Tenant filtert
    """
    
    def get_queryset(self):
        """Filtert automatisch nach Tenant"""
        # Import hier, um Circular Import zu vermeiden
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Prüfe, ob wir in einem Request-Kontext sind
        try:
            from django.utils import thread_local
            request = getattr(thread_local, 'request', None)
            
            if request and hasattr(request, 'current_tenant') and request.current_tenant:
                # Filtere nach Tenant
                return super().get_queryset().filter(tenant=request.current_tenant)
            elif request and request.user.is_superuser:
                # Superuser sieht alle Daten
                return super().get_queryset()
            else:
                # Kein Tenant-Kontext - leere QuerySet
                return super().get_queryset().none()
        except:
            # Fallback: leere QuerySet
            return super().get_queryset().none()
    
    def for_tenant(self, tenant):
        """Explizite Tenant-Filterung"""
        return super().get_queryset().filter(tenant=tenant)
    
    def all_tenants(self):
        """Zeigt alle Daten (nur für Superuser)"""
        return super().get_queryset()


class TenantAwareModel(models.Model):
    """
    Abstract Base Model für tenant-aware Models
    """
    
    tenant = models.ForeignKey(
        'accounts.Tenant',
        on_delete=models.CASCADE,
        help_text="Tenant, dem dieses Objekt gehört"
    )
    
    objects = TenantAwareManager()
    
    class Meta:
        abstract = True

