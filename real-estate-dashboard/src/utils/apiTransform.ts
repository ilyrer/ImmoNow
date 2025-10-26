/**
 * API Payload Transformation Utilities
 * Handles conversion between frontend camelCase and backend snake_case
 * Manages type conversions and field filtering
 */

// Field mappings for camelCase to snake_case conversion
const FIELD_MAPPINGS: Record<string, string> = {
  // Property fields
  propertyType: 'property_type',
  priceCurrency: 'price_currency',
  priceType: 'price_type',
  livingArea: 'living_area',
  totalArea: 'total_area',
  plotArea: 'plot_area',
  yearBuilt: 'year_built',
  energyClass: 'energy_class',
  energyConsumption: 'energy_consumption',
  heatingType: 'heating_type',
  coordinatesLat: 'coordinates_lat',
  coordinatesLng: 'coordinates_lng',
  contactPerson: 'contact_person',
  
  // Contact fields
  budgetMin: 'budget_min',
  budgetMax: 'budget_max',
  budgetCurrency: 'budget_currency',
  leadScore: 'lead_score',
  lastContact: 'last_contact',
  
  // User fields
  firstName: 'first_name',
  lastName: 'last_name',
  tenantName: 'tenant_name',
  companyEmail: 'company_email',
  companyPhone: 'company_phone',
  billingCycle: 'billing_cycle',
  
  // Task fields
  assigneeId: 'assignee_id',
  dueDate: 'due_date',
  startDate: 'start_date',
  estimatedHours: 'estimated_hours',
  actualHours: 'actual_hours',
  propertyId: 'property_id',
  financingStatus: 'financing_status',
  labelIds: 'label_ids',
  watcherIds: 'watcher_ids',
  storyPoints: 'story_points',
  sprintId: 'sprint_id',
  issueType: 'issue_type',
  epicLink: 'epic_link',
  blockedReason: 'blocked_reason',
  blockedByTaskId: 'blocked_by_task_id',
  
  // Document fields
  documentType: 'document_type',
  folderId: 'folder_id',
  uploadedBy: 'uploaded_by',
  uploadedAt: 'uploaded_at',
  isFavorite: 'is_favorite',
  viewCount: 'view_count',
  downloadCount: 'download_count',
  expiryDate: 'expiry_date',
  
  // Communication fields
  conversationId: 'conversation_id',
  senderId: 'sender_id',
  senderName: 'sender_name',
  messageType: 'message_type',
  participantIds: 'participant_ids',
  initialMessage: 'initial_message',
  unreadCount: 'unread_count',
  readAt: 'read_at',
  
  // Appointment fields
  appointmentType: 'appointment_type',
  startDatetime: 'start_datetime',
  endDatetime: 'end_datetime',
  contactId: 'contact_id',
  
  // Common fields
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  createdBy: 'created_by'
};

// Fields that should be converted to integers
const INT_FIELDS = [
  'living_area', 'total_area', 'plot_area', 'rooms', 'bedrooms', 'bathrooms', 
  'floors', 'year_built', 'energy_consumption', 'estimated_hours', 'actual_hours',
  'story_points', 'folder_id', 'view_count', 'download_count', 'lead_score',
  'unread_count', 'position'
];

// Fields that should be converted to ISO date strings
const DATE_FIELDS = [
  'due_date', 'start_date', 'expiry_date', 'last_contact', 'created_at', 
  'updated_at', 'uploaded_at', 'read_at', 'start_datetime', 'end_datetime',
  'scheduled_at', 'published_at'
];

// Default values for missing fields - separated by schema
const DEFAULT_VALUES: Record<string, Record<string, any>> = {
  property: {
    status: 'vorbereitung',
    price_currency: 'EUR',
    price_type: 'sale',
    amenities: [],
    tags: []
  },
  contact: {
    status: 'Lead',
    priority: 'medium',
    budget_currency: 'EUR',
    preferences: {}
  },
  user: {
    plan: 'free',
    billing_cycle: 'monthly'
  },
  task: {
    priority: 'MEDIUM',
    estimated_hours: 1,
    tags: [],
    label_ids: [],
    watcher_ids: [],
    issue_type: 'task'
  },
  document: {
    visibility: 'PRIVATE',
    tags: []
  },
  communication: {
    message_type: 'TEXT',
    metadata: {}
  }
};

/**
 * Converts camelCase object to snake_case
 */
export function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Use explicit mapping if available, otherwise convert camelCase to snake_case
      const snakeKey = FIELD_MAPPINGS[key] || key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(value);
    }
    
    return result;
  }
  
  return obj;
}

/**
 * Converts snake_case object to camelCase
 */
export function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(value);
    }
    
    return result;
  }
  
  return obj;
}

/**
 * Converts numbers to integers for specific fields
 */
export function convertNumbersToInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertNumbersToInt);
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (INT_FIELDS.includes(key) && typeof value === 'number') {
        result[key] = Math.floor(value);
      } else {
        result[key] = convertNumbersToInt(value);
      }
    }
    
    return result;
  }
  
  return obj;
}

/**
 * Converts date strings to ISO format for specific fields
 */
export function convertDatesToISO(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertDatesToISO);
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (DATE_FIELDS.includes(key) && value) {
        try {
          result[key] = new Date(value as string | number | Date).toISOString();
        } catch (error) {
          console.warn(`Failed to convert date field ${key}:`, value);
          result[key] = value;
        }
      } else {
        result[key] = convertDatesToISO(value);
      }
    }
    
    return result;
  }
  
  return obj;
}

/**
 * Adds default values for missing fields
 */
export function addDefaults(obj: any, schema: string = 'default'): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => addDefaults(item, schema));
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const result = { ...obj };
    
    // Add defaults for missing fields based on schema
    const schemaDefaults = DEFAULT_VALUES[schema] || {};
    
    // Add defaults for missing fields
    for (const [key, defaultValue] of Object.entries(schemaDefaults)) {
      if (!(key in result) || result[key] === undefined || result[key] === null) {
        result[key] = defaultValue;
      }
    }
    
    return result;
  }
  
  return obj;
}

/**
 * Filters out undefined, null, and empty string values
 */
export function filterEmptyValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(filterEmptyValues).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip empty strings, null, undefined
      if (value === '' || value === null || value === undefined) {
        continue;
      }
      
      // Recursively filter nested objects
      if (typeof value === 'object' && value.constructor === Object) {
        const filtered = filterEmptyValues(value);
        // Only add if the filtered object has properties
        if (filtered && Object.keys(filtered).length > 0) {
          result[key] = filtered;
        }
      } else if (Array.isArray(value)) {
        // Keep arrays even if empty (for amenities, tags)
        result[key] = filterEmptyValues(value);
      } else {
        result[key] = value;
      }
    }
    
    return Object.keys(result).length > 0 ? result : undefined;
  }
  
  return obj;
}

/**
 * Main transformation function that applies all conversions
 */
export function transformPayloadForBackend(obj: any, schema: string = 'default'): any {
  let transformed = obj;
  
  // Apply transformations in order
  transformed = addDefaults(transformed, schema);
  transformed = convertNumbersToInt(transformed);
  transformed = convertDatesToISO(transformed);
  transformed = toSnakeCase(transformed);
  transformed = filterEmptyValues(transformed);
  
  return transformed;
}

/**
 * Transforms backend response to frontend format
 */
export function transformResponseFromBackend(obj: any): any {
  let transformed = obj;
  
  // Apply transformations in reverse order
  transformed = toCamelCase(transformed);
  
  return transformed;
}

/**
 * Creates FormData for file uploads
 */
export function createFormData(file: File, metadata: any): FormData {
  const formData = new FormData();
  formData.append('files', file); // Changed from 'file' to 'files' to match backend expectation
  formData.append('metadata', JSON.stringify(transformPayloadForBackend(metadata)));
  return formData;
}

/**
 * Creates FormData for multiple file uploads
 */
export function createMultiFileFormData(files: File[], metadata?: any): FormData {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  if (metadata) {
    formData.append('metadata', JSON.stringify(transformPayloadForBackend(metadata)));
  }
  
  return formData;
}

/**
 * Validates payload against expected schema
 */
export function validatePayload(obj: any, requiredFields: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const field of requiredFields) {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null || obj[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Type-safe payload transformation with validation
 */
export function createValidatedPayload<T>(
  obj: any, 
  requiredFields: string[], 
  schema: string = 'default'
): { payload: T; valid: boolean; errors: string[] } {
  const validation = validatePayload(obj, requiredFields);
  
  if (!validation.valid) {
    return {
      payload: obj as T,
      valid: false,
      errors: validation.errors
    };
  }
  
  const payload = transformPayloadForBackend(obj, schema) as T;
  
  return {
    payload,
    valid: true,
    errors: []
  };
}
