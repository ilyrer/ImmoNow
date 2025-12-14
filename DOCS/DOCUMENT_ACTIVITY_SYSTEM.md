# Document Activity Tracking System

## Overview
Complete activity tracking system for document operations in ImmoNow. All document actions are automatically logged and displayed in the document detail modal.

## Features Implemented

### Backend (Python/Django/FastAPI)

#### Database Models
**File:** `backend/app/db/models/document_activity.py`

1. **DocumentActivity Model**
   - Tracks all document operations
   - Fields: `id`, `document_id`, `tenant_id`, `action`, `user`, `timestamp`, `details`
   - Action Types: uploaded, edited, deleted, downloaded, viewed, shared, commented, moved, renamed
   - Indexed for performance: `tenant_id`, `document_id`, `timestamp`

2. **DocumentComment Model**
   - Stores comments on documents
   - Fields: `id`, `document_id`, `tenant_id`, `text`, `author`, `created_at`, `updated_at`
   - Indexed for performance: `tenant_id`, `document_id`

#### Service Layer
**File:** `backend/app/services/documents_service.py`

**New Methods:**
- `_log_activity()` - Helper method to log activities
- `log_document_view()` - Logs view and increments view count
- `log_document_download()` - Logs download and increments download count
- `get_document_activities()` - Retrieves activity history
- `get_document_comments()` - Retrieves comments
- `add_document_comment()` - Adds a comment and logs activity
- `update_document()` - Updates document and logs changes

**Automatic Activity Logging:**
- ✅ Upload: Logged in `create_document()`
- ✅ Edit: Logged in `update_document()` with change details
- ✅ Delete: Logged in `delete_document()`
- ✅ View: Logged when document is opened
- ✅ Download: Logged when document is downloaded
- ✅ Share: Logged when document link is copied
- ✅ Comment: Logged when comment is added

#### API Endpoints
**File:** `backend/app/api/v1/documents.py`

**New Endpoints:**
- `PUT /api/v1/documents/{document_id}` - Update document metadata
- `GET /api/v1/documents/{document_id}/activity` - Get activity history
- `GET /api/v1/documents/{document_id}/comments` - Get comments
- `POST /api/v1/documents/{document_id}/comments` - Add comment
- `POST /api/v1/documents/{document_id}/view` - Log view
- `POST /api/v1/documents/{document_id}/download` - Log download
- `POST /api/v1/documents/{document_id}/share` - Log share

### Frontend (React/TypeScript)

#### Document Dashboard
**File:** `frontend/src/components/documents/ModernDocumentDashboard.tsx`

**Enhanced Actions:**
- Download button now logs activity to backend
- Share button now logs activity to backend
- Both actions work with real API calls

#### Document Detail Modal
**File:** `frontend/src/components/documents/DocumentDetailModal.tsx`

**Enhanced Features:**
1. **Automatic View Logging**
   - Logs view activity when modal opens
   - Increments view count

2. **Activity Tab**
   - Displays complete activity history
   - Shows icon, action label, user, and timestamp
   - Supports all activity types with German labels:
     - uploaded → "Dokument hochgeladen"
     - edited → "Dokument bearbeitet"
     - deleted → "Dokument gelöscht"
     - downloaded → "Dokument heruntergeladen"
     - viewed → "Dokument angesehen"
     - shared → "Dokument geteilt"
     - commented → "Kommentar hinzugefügt"
     - moved → "Dokument verschoben"
     - renamed → "Dokument umbenannt"

3. **Comments Tab**
   - Add comments with real API calls
   - Auto-refreshes activities when comment is added
   - Displays author and timestamp

## Activity Flow Examples

### Example 1: User Uploads Document
1. User uploads file via DocumentUploadModal
2. Backend creates document in `create_document()`
3. Activity logged: `{"action": "uploaded", "details": {"filename": "...", "size": ...}}`
4. Activity appears in modal activity tab

### Example 2: User Views Document
1. User opens DocumentDetailModal
2. Frontend calls `POST /api/v1/documents/{id}/view`
3. Backend logs activity and increments `view_count`
4. Activity appears: "Dokument angesehen"

### Example 3: User Edits Document
1. User changes title/description in modal
2. Frontend calls `PUT /api/v1/documents/{id}`
3. Backend tracks changes: `{"changes": {"title": {"old": "...", "new": "..."}}}`
4. Activity logged: `{"action": "edited", "details": {"changes": ...}}`
5. Activity appears: "Dokument bearbeitet"

### Example 4: User Comments
1. User types comment and clicks "Kommentieren"
2. Frontend calls `POST /api/v1/documents/{id}/comments`
3. Backend creates comment and logs activity
4. Both comments and activities are refreshed
5. Activity appears: "Kommentar hinzugefügt"

## Database Schema

### DocumentActivity Table
```sql
CREATE TABLE app_documentactivity (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    user_id UUID NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    details JSONB,
    FOREIGN KEY (document_id) REFERENCES app_document(id),
    FOREIGN KEY (tenant_id) REFERENCES app_tenant(id),
    FOREIGN KEY (user_id) REFERENCES app_user(id),
    INDEX idx_tenant_document (tenant_id, document_id),
    INDEX idx_timestamp (timestamp)
);
```

### DocumentComment Table
```sql
CREATE TABLE app_documentcomment (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    text TEXT NOT NULL,
    author_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (document_id) REFERENCES app_document(id),
    FOREIGN KEY (tenant_id) REFERENCES app_tenant(id),
    FOREIGN KEY (author_id) REFERENCES app_user(id),
    INDEX idx_tenant_document (tenant_id, document_id)
);
```

## Migration
**File:** `backend/app/migrations/0029_documentcomment_documentactivity.py`

Run migrations:
```bash
cd backend
python manage.py migrate
```

## Testing

### Test Activity Logging
1. Upload a document → Check activity shows "Dokument hochgeladen"
2. Open document → Check view count increments and activity shows "Dokument angesehen"
3. Download document → Check download count increments and activity shows "Dokument heruntergeladen"
4. Share document → Check activity shows "Dokument geteilt"
5. Add comment → Check activity shows "Kommentar hinzugefügt"
6. Edit document → Check activity shows "Dokument bearbeitet" with changes

### Verify API Endpoints
```bash
# Get activities
GET /api/v1/documents/{id}/activity

# Get comments
GET /api/v1/documents/{id}/comments

# Add comment
POST /api/v1/documents/{id}/comments
{"text": "This is a test comment"}

# Log view
POST /api/v1/documents/{id}/view

# Log download
POST /api/v1/documents/{id}/download

# Update document
PUT /api/v1/documents/{id}
{
  "title": "New Title",
  "description": "New Description",
  "tags": ["tag1", "tag2"]
}
```

## Future Enhancements

### Planned Features
- [ ] Activity filtering (by action type, date range)
- [ ] Activity export (PDF, CSV)
- [ ] Email notifications for important activities
- [ ] Activity analytics (most active users, peak times)
- [ ] Comment replies and threading
- [ ] Comment editing and deletion
- [ ] @mentions in comments
- [ ] Rich text formatting for comments

### Technical Improvements
- [ ] Batch activity logging for performance
- [ ] Activity archiving for old records
- [ ] Real-time activity updates via WebSocket
- [ ] Activity search and full-text indexing
- [ ] Activity aggregation for dashboard metrics

## Troubleshooting

### Activities not appearing
1. Check if backend server is running
2. Verify migration was applied: `python manage.py showmigrations app`
3. Check browser console for API errors
4. Verify JWT token is valid

### View/Download counts not incrementing
1. Check if user is authenticated
2. Verify document ID is correct
3. Check backend logs for errors

### Comments not saving
1. Verify comment text is not empty
2. Check if document exists
3. Verify user has write permissions
4. Check backend logs for validation errors

## Summary
✅ Complete activity tracking system implemented
✅ All CRUD operations log activities automatically
✅ Real-time activity display in document modal
✅ Comment system with activity logging
✅ View and download tracking
✅ Share action logging
✅ German language labels for all actions
✅ Proper error handling and loading states
