import type { Document as UIDocument, DocumentFolder as UIDocumentFolder } from '../../types/document';

// Map API document (snake_case) to UI document (camelCase)
export function mapApiDocumentToUiDocument(apiDoc: any): UIDocument {
  return {
    id: String(apiDoc.id),
    name: apiDoc.name,
    originalName: apiDoc.original_name,
    type: apiDoc.type as any,
    category: apiDoc.category as any,
    status: apiDoc.status as any,
    size: Number(apiDoc.size || 0),
    mimeType: apiDoc.mime_type,
    url: apiDoc.url,
    thumbnailUrl: apiDoc.thumbnail_url,
    propertyId: apiDoc.property_id ? String(apiDoc.property_id) : undefined,
    propertyTitle: apiDoc.property_title,
    contactId: apiDoc.contact_id ? String(apiDoc.contact_id) : undefined,
    contactName: apiDoc.contact_name,
    uploadedBy: String(apiDoc.uploaded_by || ''),
    uploadedAt: apiDoc.uploaded_at,
    lastModified: apiDoc.last_modified,
    version: Number(apiDoc.version || 1),
    versions: Array.isArray(apiDoc.versions) ? apiDoc.versions : [],
    tags: Array.isArray(apiDoc.tags) ? apiDoc.tags : [],
    description: apiDoc.description ?? undefined,
    expiryDate: apiDoc.expiry_date ?? undefined,
    isPublic: !!apiDoc.is_public,
    permissions: Array.isArray(apiDoc.permissions) ? apiDoc.permissions : [],
    metadata: apiDoc.metadata || { customFields: {} },
    ocrText: apiDoc.ocr_text,
    digitalSignature: apiDoc.digital_signature,
  } as UIDocument;
}

// Map API folder (snake_case) to UI folder (camelCase)
export function mapApiFolderToUiFolder(folder: any): UIDocumentFolder {
  return {
    id: String(folder.id),
    name: folder.name,
    description: folder.description ?? undefined,
    parentId: folder.parent ?? (folder.parent_folder_id ? String(folder.parent_folder_id) : undefined),
    path: folder.path || '',
    color: folder.color || 'gray',
    icon: folder.icon || 'ri-folder-line',
    isSystem: !!folder.is_system || !!folder.is_system_folder,
    createdBy: String(folder.created_by || folder.owner_id || ''),
    createdAt: folder.created_at,
    subfolders: Array.isArray(folder.subfolders) ? folder.subfolders.map(mapApiFolderToUiFolder) : [],
    permissions: Array.isArray(folder.permissions) ? folder.permissions : [],
    documentCount: Number(folder.document_count || 0),
  } as UIDocumentFolder;
}
