"""
Upload path functions for tenant-isolated file storage
"""
import os
import uuid


def property_image_upload_path(instance, filename):
    """
    Generate tenant-isolated upload path for property images
    
    Args:
        instance: PropertyImage instance
        filename: Original filename
        
    Returns:
        Tenant-isolated file path: tenants/{tenant_id}/properties/{property_id}/images/{filename}
    """
    tenant_id = str(instance.property.tenant_id)
    property_id = str(instance.property.id)
    
    # Ensure filename is safe
    safe_filename = os.path.basename(filename)
    
    return f"tenants/{tenant_id}/properties/{property_id}/images/{safe_filename}"


def property_document_upload_path(instance, filename):
    """
    Generate tenant-isolated upload path for property documents
    
    Args:
        instance: PropertyDocument instance
        filename: Original filename
        
    Returns:
        Tenant-isolated file path: tenants/{tenant_id}/properties/{property_id}/documents/{filename}
    """
    tenant_id = str(instance.property.tenant_id)
    property_id = str(instance.property.id)
    
    # Ensure filename is safe
    safe_filename = os.path.basename(filename)
    
    return f"tenants/{tenant_id}/properties/{property_id}/documents/{safe_filename}"


def document_upload_path(instance, filename):
    """
    Generate tenant-isolated upload path for documents
    
    Args:
        instance: Document instance
        filename: Original filename
        
    Returns:
        Tenant-isolated file path: tenants/{tenant_id}/documents/{filename}
    """
    tenant_id = str(instance.tenant_id)
    
    # Ensure filename is safe
    safe_filename = os.path.basename(filename)
    
    return f"tenants/{tenant_id}/documents/{safe_filename}"


def message_file_upload_path(instance, filename):
    """
    Generate tenant-isolated upload path for message files
    
    Args:
        instance: MessageFile instance
        filename: Original filename
        
    Returns:
        Tenant-isolated file path: tenants/{tenant_id}/messages/{message_id}/{filename}
    """
    tenant_id = str(instance.message.tenant_id)
    message_id = str(instance.message.id)
    
    # Ensure filename is safe
    safe_filename = os.path.basename(filename)
    
    return f"tenants/{tenant_id}/messages/{message_id}/{safe_filename}"


def generic_tenant_upload_path(instance, filename, subfolder="files"):
    """
    Generic tenant-isolated upload path
    
    Args:
        instance: Model instance with tenant_id or tenant attribute
        filename: Original filename
        subfolder: Subfolder within tenant directory
        
    Returns:
        Tenant-isolated file path: tenants/{tenant_id}/{subfolder}/{filename}
    """
    # Extract tenant_id from instance
    tenant_id = None
    
    if hasattr(instance, 'tenant_id'):
        tenant_id = str(instance.tenant_id)
    elif hasattr(instance, 'tenant'):
        tenant_id = str(instance.tenant.id)
    elif hasattr(instance, 'property') and hasattr(instance.property, 'tenant_id'):
        tenant_id = str(instance.property.tenant_id)
    else:
        # Fallback - use a default tenant directory
        tenant_id = 'default'
    
    # Ensure filename is safe
    safe_filename = os.path.basename(filename)
    
    return f"tenants/{tenant_id}/{subfolder}/{safe_filename}"
