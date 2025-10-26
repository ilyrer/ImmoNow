# FileField Tenant-Isolation Migration Guide

## Overview

This guide explains the migration from non-tenant-isolated file uploads to tenant-isolated file storage for proper data isolation.

## Problem

The current FileField definitions use generic upload paths that don't isolate files by tenant:

```python
# BEFORE (RISK):
file = models.FileField(upload_to='properties/images/%Y/%m/')
# => MEDIA_ROOT/properties/images/2025/01/xyz.jpg

file = models.FileField(upload_to='properties/documents/%Y/%m/')
# => MEDIA_ROOT/properties/documents/2025/01/xyz.pdf
```

**Security Risk**: Cross-tenant file access is theoretically possible if URLs are known.

## Solution

Implement tenant-isolated upload paths:

```python
# AFTER (SECURE):
file = models.FileField(upload_to=property_image_upload_path)
# => MEDIA_ROOT/tenants/{tenant_id}/properties/{property_id}/images/xyz.jpg

file = models.FileField(upload_to=property_document_upload_path)
# => MEDIA_ROOT/tenants/{tenant_id}/properties/{property_id}/documents/xyz.pdf
```

## Implementation

### 1. Upload Path Functions

Created `backend/app/utils/upload_paths.py` with tenant-isolated functions:

```python
def property_image_upload_path(instance, filename):
    tenant_id = str(instance.property.tenant_id)
    property_id = str(instance.property.id)
    safe_filename = os.path.basename(filename)
    return f"tenants/{tenant_id}/properties/{property_id}/images/{safe_filename}"

def property_document_upload_path(instance, filename):
    tenant_id = str(instance.property.tenant_id)
    property_id = str(instance.property.id)
    safe_filename = os.path.basename(filename)
    return f"tenants/{tenant_id}/properties/{property_id}/documents/{safe_filename}"
```

### 2. Model Updates

Updated model definitions to use new upload paths:

```python
# PropertyImage
file = models.FileField(upload_to=property_image_upload_path, blank=True, null=True)

# PropertyDocument  
file = models.FileField(upload_to=property_document_upload_path)
```

### 3. Migration

Created migration `0032_add_tenant_isolated_upload_paths.py`:

```python
operations = [
    migrations.AlterField(
        model_name='propertyimage',
        name='file',
        field=models.FileField(
            upload_to=property_image_upload_path,
            blank=True,
            null=True
        ),
    ),
    migrations.AlterField(
        model_name='propertydocument',
        name='file',
        field=models.FileField(
            upload_to=property_document_upload_path
        ),
    ),
]
```

## File Structure

### Before Migration
```
MEDIA_ROOT/
├── properties/
│   ├── images/
│   │   ├── 2025/
│   │   │   └── 01/
│   │   │       ├── image1.jpg
│   │   │       └── image2.jpg
│   └── documents/
│       ├── 2025/
│       │   └── 01/
│       │       ├── doc1.pdf
│       │       └── doc2.pdf
```

### After Migration
```
MEDIA_ROOT/
├── tenants/
│   ├── tenant-123/
│   │   └── properties/
│   │       ├── property-456/
│   │       │   ├── images/
│   │       │   │   ├── image1.jpg
│   │       │   │   └── image2.jpg
│   │       │   └── documents/
│   │       │       ├── doc1.pdf
│   │       │       └── doc2.pdf
│   │       └── property-789/
│   │           ├── images/
│   │           └── documents/
│   └── tenant-456/
│       └── properties/
│           └── property-101/
│               ├── images/
│               └── documents/
```

## Migration Process

### 1. Backup Existing Files

```bash
# Create backup of media directory
cp -r media/ media_backup_$(date +%Y%m%d_%H%M%S)/
```

### 2. Run Migration

```bash
# Apply the migration
python manage.py migrate app 0032
```

### 3. File Migration (Manual)

The migration only updates the model definitions. Existing files need to be moved manually:

```bash
# Create migration script
python manage.py shell -c "
from app.db.models import PropertyImage, PropertyDocument
from django.conf import settings
import os
import shutil

# Move existing files to tenant-isolated structure
for image in PropertyImage.objects.all():
    if image.file and image.file.name:
        old_path = os.path.join(settings.MEDIA_ROOT, image.file.name)
        if os.path.exists(old_path):
            # Generate new path
            tenant_id = str(image.property.tenant_id)
            property_id = str(image.property.id)
            filename = os.path.basename(image.file.name)
            new_dir = os.path.join(settings.MEDIA_ROOT, 'tenants', tenant_id, 'properties', property_id, 'images')
            os.makedirs(new_dir, exist_ok=True)
            new_path = os.path.join(new_dir, filename)
            
            # Move file
            shutil.move(old_path, new_path)
            
            # Update model
            image.file.name = f'tenants/{tenant_id}/properties/{property_id}/images/{filename}'
            image.save()
            print(f'Moved: {old_path} -> {new_path}')
"
```

### 4. Verification

```bash
# Verify file structure
find media/tenants -type f | head -10

# Check model consistency
python manage.py shell -c "
from app.db.models import PropertyImage
for img in PropertyImage.objects.all()[:5]:
    print(f'Image: {img.file.name}')
"
```

## Rollback Strategy

### 1. Revert Migration

```bash
# Rollback to previous migration
python manage.py migrate app 0031
```

### 2. Restore Files

```bash
# Restore from backup
rm -rf media/
mv media_backup_YYYYMMDD_HHMMSS/ media/
```

### 3. Update Models

Revert model definitions to original upload paths.

## Security Benefits

### 1. Tenant Isolation

- Files are physically separated by tenant
- No cross-tenant access possible
- Clear audit trail per tenant

### 2. Access Control

- Tenant-specific file permissions
- Easier backup/restore per tenant
- Compliance with data isolation requirements

### 3. Storage Tracking

- Accurate storage usage per tenant
- Easy cleanup when tenant is deleted
- Better quota enforcement

## Monitoring

### 1. File System Monitoring

```bash
# Monitor tenant storage usage
du -sh media/tenants/*/

# Check for orphaned files
find media/tenants -type f -exec ls -la {} \; | grep -v "$(python manage.py shell -c 'from app.db.models import PropertyImage; print("|".join([img.file.name for img in PropertyImage.objects.all()]))')"
```

### 2. Database Consistency

```bash
# Check for missing files
python manage.py shell -c "
from app.db.models import PropertyImage
from django.conf import settings
import os

missing_files = []
for img in PropertyImage.objects.all():
    if img.file and img.file.name:
        file_path = os.path.join(settings.MEDIA_ROOT, img.file.name)
        if not os.path.exists(file_path):
            missing_files.append(img.file.name)

print(f'Missing files: {len(missing_files)}')
for f in missing_files[:10]:
    print(f'  {f}')
"
```

## Best Practices

### 1. File Naming

- Use safe filenames (no special characters)
- Include timestamps for uniqueness
- Preserve original extensions

### 2. Directory Structure

- Consistent naming convention
- Logical hierarchy
- Easy to navigate and maintain

### 3. Cleanup

- Regular cleanup of orphaned files
- Tenant deletion cleanup
- Storage reconciliation

## Testing

### 1. Unit Tests

```python
def test_tenant_isolated_upload_path():
    """Test that upload paths are tenant-isolated"""
    tenant = Tenant.objects.create(name="Test Tenant")
    property = Property.objects.create(tenant=tenant, title="Test Property")
    
    image = PropertyImage(property=property)
    path = property_image_upload_path(image, "test.jpg")
    
    assert path.startswith(f"tenants/{tenant.id}/")
    assert f"properties/{property.id}/images/" in path
    assert path.endswith("test.jpg")
```

### 2. Integration Tests

```python
def test_file_upload_isolation():
    """Test that files are properly isolated between tenants"""
    # Create two tenants with properties
    # Upload files to each
    # Verify files are in separate directories
    # Verify no cross-access possible
```

## Related Documentation

- [Security Audit Report](SECURITY_AUDIT.md)
- [Storage Tracking Service](STORAGE_TRACKING.md)
- [Tenant Isolation Guide](TENANT_ISOLATION.md)
