# Document Management System (DMS) - User Guide

## Overview

The DMS provides secure document storage, organization, and collaboration for the CIM Immobilien platform. Features include:

- Folder-based organization
- Fine-grained access control (Private, Team, Public)
- Favorites and quick access
- Full-text search
- Metadata tagging (property, contact associations)
- Upload validation and security

## Access Control & Permissions

### Visibility Levels

| Level | Description | Who Can View | Who Can Edit | Use Cases |
|-------|-------------|--------------|--------------|-----------|
| **Private** | Owner only | Document owner | Document owner | Personal notes, drafts |
| **Team** | Team members | All users in same tenant | Document owner | Shared contracts, team resources |
| **Public** | Organization-wide | All authenticated users | Document owner | Company policies, templates |

### Permission Rules

1. **Owner**: Full control (view, edit, delete, change visibility)
2. **Team Members**: View-only for team documents
3. **Admin Role**: Can view all documents, delete any (audit logged)
4. **Guest Role**: Can only view public documents

### Audit Logging

All permission-related actions are logged:
- Document upload (who, when, initial visibility)
- Visibility changes (from → to, by whom)
- Access attempts (successful & failed)
- Deletion (by whom, document metadata preserved)

## Folder Structure

### Creating Folders

```typescript
// Frontend
const createFolder = useMutation({
  mutationFn: (data) => apiClient.post('/api/v1/documents/folders', {
    name: data.name,
    parent_id: data.parentId || null,
    visibility: 'team'  // Default to team
  })
});
```

### Nested Folders

Supports unlimited nesting:
```
📁 My Documents
  📁 Properties
    📁 Contracts
    📁 Photos
  📁 Contacts
    📁 KYC Documents
```

### Root Folders

System-created root folders for each tenant:
- **My Documents** (private, per-user)
- **Team Shared** (team visibility)
- **Templates** (public, read-only)
- **Archive** (team, for old documents)

## Document Upload

### Allowed File Types

| Category | MIME Types | Extensions | Max Size |
|----------|-----------|------------|----------|
| **Documents** | `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `.pdf`, `.docx` | 50 MB |
| **Spreadsheets** | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `.xlsx` | 20 MB |
| **Images** | `image/jpeg`, `image/png`, `image/webp` | `.jpg`, `.png`, `.webp` | 10 MB |
| **Archives** | `application/zip` | `.zip` | 100 MB |

### Upload Process

```typescript
// Frontend
const uploadDocument = useMutation({
  mutationFn: async ({ file, folderId, visibility }) => {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = {
      folder_id: folderId,
      visibility: visibility,
      property_id: currentProperty?.id,  // Optional association
      contact_id: currentContact?.id     // Optional association
    };

    return apiClient.post('/api/v1/documents/upload', formData, {
      params: { metadata: JSON.stringify(metadata) },
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
});
```

### Server-Side Validation

**File**: `backend/app/services/documents_service.py`

```python
async def validate_upload(file: UploadFile):
    """
    Validate file before storage
    """
    # 1. Check MIME type
    allowed_mimes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/png',
        # ...
    ]

    if file.content_type not in allowed_mimes:
        raise ValidationError(f"File type {file.content_type} not allowed")

    # 2. Check file size
    MAX_SIZE = int(os.getenv('MAX_UPLOAD_MB', 50)) * 1024 * 1024
    if file.size > MAX_SIZE:
        raise ValidationError(f"File too large. Maximum: {MAX_SIZE / 1024 / 1024}MB")

    # 3. Virus scan (optional - integrate with ClamAV)
    # await scan_file(file)

    # 4. Compute checksum for deduplication
    content = await file.read()
    await file.seek(0)  # Reset for storage
    checksum = hashlib.sha256(content).hexdigest()

    # Check for duplicate
    existing = await Document.objects.filter(
        tenant_id=self.tenant_id,
        checksum=checksum
    ).first()

    if existing:
        logger.info(f"Duplicate file detected: {existing.id}")
        # Could return existing document or continue

    return checksum
```

## Features

### 1. Favorites

Mark frequently accessed documents:

```typescript
// Frontend
const toggleFavorite = useMutation({
  mutationFn: (documentId) =>
    apiClient.put(`/api/v1/documents/${documentId}/favorite`)
});

// Usage
<button onClick={() => toggleFavorite.mutate(doc.id)}>
  {doc.is_favorite ? <Star fill="gold" /> : <Star />}
</button>
```

**Backend**:
```python
async def toggle_favorite(self, document_id: str, user_id: str) -> bool:
    """Toggle favorite status for user"""
    favorite = await DocumentFavorite.objects.filter(
        document_id=document_id,
        user_id=user_id
    ).first()

    if favorite:
        await favorite.delete()
        return False
    else:
        await DocumentFavorite.objects.create(
            document_id=document_id,
            user_id=user_id
        )
        return True
```

### 2. Visibility Toggle

Change document access level:

```typescript
// Frontend
const updateVisibility = useMutation({
  mutationFn: ({ documentId, visibility }) =>
    apiClient.put(`/api/v1/documents/${documentId}/visibility`, { visibility })
});

// Usage - Dropdown
<select
  value={doc.visibility}
  onChange={(e) => updateVisibility.mutate({
    documentId: doc.id,
    visibility: e.target.value
  })}
>
  <option value="private">Private (Only Me)</option>
  <option value="team">Team (All Members)</option>
  <option value="public">Public (Organization)</option>
</select>
```

**Backend**:
```python
async def update_visibility(
    self,
    document_id: str,
    visibility: str,
    user_id: str
) -> DocumentResponse:
    """
    Update document visibility

    Rules:
    - Only owner can change visibility
    - Log change to audit table
    """
    document = await Document.objects.get(id=document_id, tenant_id=self.tenant_id)

    # Check ownership
    if document.uploaded_by_id != user_id:
        raise PermissionError("Only document owner can change visibility")

    old_visibility = document.visibility
    document.visibility = visibility
    await document.save()

    # Audit log
    await AuditLog.objects.create(
        tenant_id=self.tenant_id,
        user_id=user_id,
        action="document.visibility_changed",
        resource_type="document",
        resource_id=document_id,
        details={
            "from": old_visibility,
            "to": visibility
        }
    )

    return DocumentResponse.from_orm(document)
```

### 3. Search & Filters

```typescript
// Frontend
const { data: documents } = useQuery({
  queryKey: ['documents', filters],
  queryFn: () => apiClient.get('/api/v1/documents', {
    params: {
      search: filters.search,           // Full-text search
      folder_id: filters.folderId,      // Filter by folder
      document_type: filters.type,      // e.g., 'contract', 'photo'
      property_id: filters.propertyId,  // Associated property
      favorites_only: filters.favoritesOnly,
      sort_by: 'created_at',
      sort_order: 'desc'
    }
  })
});
```

### 4. Metadata & Associations

Link documents to properties/contacts:

```typescript
// When uploading
const metadata = {
  folder_id: currentFolder.id,
  visibility: 'team',
  property_id: property.id,        // Link to property
  contact_id: contact.id,          // Link to contact
  tags: ['contract', 'signed'],    // Custom tags
  expiry_date: '2025-12-31'        // Optional expiry
};
```

Query documents by association:
```typescript
// Get all documents for a property
const { data: propertyDocs } = useQuery({
  queryKey: ['documents', 'property', propertyId],
  queryFn: () => apiClient.get('/api/v1/documents', {
    params: { property_id: propertyId }
  })
});
```

## Security Best Practices

### 1. Upload Validation

```python
# Mandatory checks
- MIME type whitelist (no executables)
- File size limits (prevent DoS)
- Filename sanitization (prevent path traversal)
- Checksum computation (deduplication, integrity)

# Recommended
- Virus scanning (ClamAV integration)
- Magic byte validation (verify MIME matches content)
- Metadata stripping (remove EXIF from images)
```

### 2. Access Control

```python
# Always check ownership/visibility before serving
async def get_document(self, document_id: str, user_id: str):
    document = await Document.objects.get(id=document_id)

    # Check access
    if document.visibility == 'private':
        if document.uploaded_by_id != user_id:
            raise PermissionError("Access denied")

    elif document.visibility == 'team':
        # Check user is in same tenant
        if document.tenant_id != self.tenant_id:
            raise PermissionError("Access denied")

    # Public - all authenticated users can access

    return document
```

### 3. Storage Security

```python
# Use signed URLs for S3 (expire after 1 hour)
def generate_download_url(self, document: Document) -> str:
    if settings.STORAGE_BACKEND == 's3':
        s3_client = boto3.client('s3')
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.S3_BUCKET,
                'Key': document.s3_key
            },
            ExpiresIn=3600  # 1 hour
        )
        return url
    else:
        # Local storage - serve via protected route
        return f"/api/v1/documents/{document.id}/download"
```

## Frontend Components

### Document Dashboard

**File**: `src/components/documents/ModernDocumentDashboard.tsx`

```typescript
export const DocumentDashboard = () => {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: folders } = useQuery({
    queryKey: ['document-folders'],
    queryFn: () => apiClient.get('/api/v1/documents/folders')
  });

  const { data: documents } = useQuery({
    queryKey: ['documents', selectedFolder],
    queryFn: () => apiClient.get('/api/v1/documents', {
      params: { folder_id: selectedFolder }
    })
  });

  return (
    <div className="flex h-full">
      {/* Folder Tree */}
      <FolderTree
        folders={folders}
        onSelect={setSelectedFolder}
      />

      {/* Document List */}
      <div className="flex-1">
        <Toolbar viewMode={viewMode} onViewModeChange={setViewMode} />

        {viewMode === 'grid' ? (
          <DocumentGrid documents={documents} />
        ) : (
          <DocumentList documents={documents} />
        )}
      </div>
    </div>
  );
};
```

### Upload Zone

```typescript
export const DocumentUploadZone = ({ folderId }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (files) => {
      for (const file of files) {
        await uploadDocument.mutateAsync({
          file,
          folderId,
          visibility: 'team'
        });
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.png']
    },
    maxSize: 50 * 1024 * 1024  // 50MB
  });

  return (
    <div
      {...getRootProps()}
      className={`upload-zone ${isDragActive ? 'active' : ''}`}
    >
      <input {...getInputProps()} />
      <Upload className="w-12 h-12 text-gray-400" />
      <p>Drag & drop files or click to browse</p>
    </div>
  );
};
```

## API Reference

### Endpoints

```
GET    /api/v1/documents                 List documents (paginated)
POST   /api/v1/documents/upload          Upload document
GET    /api/v1/documents/{id}            Get document metadata
PUT    /api/v1/documents/{id}            Update document metadata
DELETE /api/v1/documents/{id}            Delete document
PUT    /api/v1/documents/{id}/favorite   Toggle favorite
PUT    /api/v1/documents/{id}/visibility Update visibility
GET    /api/v1/documents/{id}/download   Download file

GET    /api/v1/documents/folders         List folders
POST   /api/v1/documents/folders         Create folder
PUT    /api/v1/documents/folders/{id}    Rename folder
DELETE /api/v1/documents/folders/{id}    Delete folder (must be empty)

GET    /api/v1/documents/analytics       Document analytics (storage, types, etc.)
```

### Query Parameters (GET /documents)

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Full-text search in filename, tags |
| `folder_id` | integer | Filter by folder |
| `document_type` | string | Filter by type (contract, photo, etc.) |
| `property_id` | string | Filter by associated property |
| `contact_id` | string | Filter by associated contact |
| `favorites_only` | boolean | Show only favorites |
| `has_expiry` | boolean | Filter by expiry date presence |
| `is_expired` | boolean | Filter expired documents |
| `sort_by` | string | Sort field (created_at, title, file_size) |
| `sort_order` | string | asc / desc |
| `page` | integer | Page number (default: 1) |
| `size` | integer | Page size (default: 20) |

## Database Schema

```sql
-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    uploaded_by_id UUID NOT NULL REFERENCES users(id),
    folder_id INTEGER REFERENCES document_folders(id),
    property_id UUID REFERENCES properties(id),
    contact_id UUID REFERENCES contacts(id),

    filename VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    checksum VARCHAR(64) NOT NULL,  -- SHA256

    s3_key VARCHAR(500),  -- S3 object key
    local_path VARCHAR(500),  -- Local filesystem path

    visibility VARCHAR(20) NOT NULL DEFAULT 'team',  -- private, team, public
    document_type VARCHAR(50),  -- contract, photo, report, etc.
    tags TEXT[],  -- Array of tags

    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'active',  -- active, archived, deleted

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Folder structure
CREATE TABLE document_folders (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES document_folders(id),
    visibility VARCHAR(20) NOT NULL DEFAULT 'team',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Favorites (per-user)
CREATE TABLE document_favorites (
    id SERIAL PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id),
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (document_id, user_id)
);

-- Indexes
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_folder ON documents(folder_id);
CREATE INDEX idx_documents_property ON documents(property_id);
CREATE INDEX idx_documents_checksum ON documents(checksum);
CREATE INDEX idx_folders_tenant ON document_folders(tenant_id);
```

## Usage Examples

### Example 1: Upload Contract for Property

```typescript
const uploadPropertyContract = async (propertyId: string, file: File) => {
  // 1. Create folder if not exists
  const contractsFolder = await createFolder.mutateAsync({
    name: `Property ${propertyId} - Contracts`,
    parent_id: propertyRootFolder.id
  });

  // 2. Upload document
  const document = await uploadDocument.mutateAsync({
    file,
    folderId: contractsFolder.id,
    visibility: 'team',
    metadata: {
      property_id: propertyId,
      document_type: 'contract',
      tags: ['sales', 'legal']
    }
  });

  return document;
};
```

### Example 2: View Team Documents

```typescript
const TeamDocuments = () => {
  const { data } = useQuery({
    queryKey: ['documents', 'team'],
    queryFn: () => apiClient.get('/api/v1/documents', {
      params: {
        // Visibility filter handled server-side (RLS)
        sort_by: 'updated_at',
        sort_order: 'desc'
      }
    })
  });

  return (
    <div className="grid grid-cols-4 gap-4">
      {data?.items.map(doc => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onToggleFavorite={() => toggleFavorite.mutate(doc.id)}
        />
      ))}
    </div>
  );
};
```

### Example 3: Admin View All Documents

```typescript
// Admin users can see all documents (enforced server-side)
const { data: allDocuments } = useQuery({
  queryKey: ['admin-documents'],
  queryFn: () => apiClient.get('/api/v1/documents', {
    params: {
      // Admin role bypasses visibility restrictions
      page: 1,
      size: 100
    }
  }),
  enabled: user?.role === 'admin'
});
```

## Troubleshooting

### Issue: Upload Fails with 413 Entity Too Large

**Solution**: Check `MAX_UPLOAD_MB` environment variable and nginx/reverse proxy limits.

### Issue: Can't See Team Documents

**Solution**: Verify user is in correct tenant and document visibility is set to 'team'.

### Issue: Slow Folder Tree Loading

**Solution**: Implement lazy loading for nested folders (only load children on expand).

---

**Version**: 1.0
**Last Updated**: 2025-10-14
**Feedback**: Contact development team for feature requests
