# ImmoNow API Reference

**Version**: 1.0  
**Datum**: 2025-01-27  
**Base URL**: `https://api.immonow.com`  
**Authentication**: JWT Bearer Token  

---

## Table of Contents

1. [Authentication](#authentication)
2. [Properties](#properties)
3. [Documents](#documents)
4. [Users](#users)
5. [Tenant](#tenant)
6. [Storage](#storage)
7. [Billing](#billing)
8. [Analytics](#analytics)
9. [Communications](#communications)
10. [Tasks](#tasks)
11. [Contacts](#contacts)
12. [Investor](#investor)
13. [CIM](#cim)
14. [AVM](#avm)
15. [Appointments](#appointments)
16. [Finance](#finance)
17. [Notifications](#notifications)
18. [LLM](#llm)
19. [Admin](#admin)
20. [Plans](#plans)
21. [Google Auth](#google-auth)
22. [Payroll](#payroll)
23. [Employee Documents](#employee-documents)
24. [Energy Certificate](#energy-certificate)
25. [Expose](#expose)
26. [Admin Settings](#admin-settings)
27. [Publishing](#publishing)
28. [Registration](#registration)
29. [Profile](#profile)
30. [Test Email](#test-email)
31. [Team Performance](#team-performance)
32. [Market](#market)
33. [Social](#social)

---

## Authentication

### POST /auth/register

Register a new user and create a tenant.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+49123456789",
  "tenant_name": "My Company",
  "company_email": "info@mycompany.com",
  "company_phone": "+49987654321",
  "billing_cycle": "monthly"
}
```

**Response:**
```json
{
  "message": "Registration successful! Welcome to your new organization: My Company",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+49123456789",
    "is_active": true,
    "email_verified": false,
    "created_at": "2025-01-27T10:00:00Z"
  },
  "tenant": {
    "id": "uuid",
    "name": "My Company",
    "slug": "my-company",
    "company_email": "info@mycompany.com",
    "plan": "free",
    "max_users": 2,
    "max_properties": 5,
    "storage_limit_gb": 1,
    "is_active": true
  },
  "access_token": "jwt_token",
  "refresh_token": "jwt_token",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Rate Limit:** 5 requests per minute  
**Authentication:** None (Public endpoint)

---

### POST /auth/login

Authenticate user and return tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "access_token": "jwt_token",
  "refresh_token": "jwt_token",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "tenant_id": "uuid",
    "tenant_slug": "my-company",
    "role": "owner",
    "scopes": ["read", "write", "delete", "admin"]
  }
}
```

**Rate Limit:** 5 requests per minute  
**Authentication:** None (Public endpoint)

---

### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "jwt_token"
}
```

**Response:**
```json
{
  "access_token": "new_jwt_token",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Rate Limit:** 10 requests per minute  
**Authentication:** None (Public endpoint)

---

### POST /auth/logout

Logout user and invalidate tokens.

**Request Body:**
```json
{
  "refresh_token": "jwt_token"
}
```

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

**Rate Limit:** 10 requests per minute  
**Authentication:** Bearer Token

---

## Properties

### GET /api/v1/properties

Get paginated list of properties for the tenant.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `size` (int): Page size (default: 20, max: 100)
- `search` (string): Search term
- `property_type` (string): Filter by property type
- `status` (string): Filter by status
- `min_price` (decimal): Minimum price filter
- `max_price` (decimal): Maximum price filter
- `sort` (string): Sort field (default: created_at)
- `order` (string): Sort order (asc/desc, default: desc)

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Beautiful Apartment",
      "property_type": "apartment",
      "status": "available",
      "price": 500000.00,
      "area": 120,
      "rooms": 3,
      "address": {
        "street": "Main Street 123",
        "city": "Berlin",
        "postal_code": "10115",
        "country": "Germany"
      },
      "images": [
        {
          "id": "uuid",
          "url": "https://example.com/image1.jpg",
          "thumbnail_url": "https://example.com/thumb1.jpg",
          "is_primary": true,
          "order": 0
        }
      ],
      "created_at": "2025-01-27T10:00:00Z",
      "created_by": {
        "id": "uuid",
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  ],
  "total": 25,
  "page": 1,
  "size": 20,
  "pages": 2
}
```

**Rate Limit:** 200 requests per minute per tenant  
**Authentication:** Bearer Token (read scope)

---

### POST /api/v1/properties

Create a new property.

**Request Body:**
```json
{
  "title": "Beautiful Apartment",
  "property_type": "apartment",
  "status": "available",
  "price": 500000.00,
  "area": 120,
  "rooms": 3,
  "description": "Modern apartment in city center",
  "address": {
    "street": "Main Street 123",
    "city": "Berlin",
    "postal_code": "10115",
    "country": "Germany"
  },
  "features": {
    "balcony": true,
    "elevator": true,
    "parking": false,
    "garden": false
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Beautiful Apartment",
  "property_type": "apartment",
  "status": "available",
  "price": 500000.00,
  "area": 120,
  "rooms": 3,
  "description": "Modern apartment in city center",
  "address": {
    "id": "uuid",
    "street": "Main Street 123",
    "city": "Berlin",
    "postal_code": "10115",
    "country": "Germany"
  },
  "features": {
    "id": "uuid",
    "balcony": true,
    "elevator": true,
    "parking": false,
    "garden": false
  },
  "created_at": "2025-01-27T10:00:00Z",
  "created_by": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Rate Limit:** 50 requests per minute per tenant  
**Authentication:** Bearer Token (write scope)

---

### GET /api/v1/properties/{id}

Get a specific property by ID.

**Path Parameters:**
- `id` (uuid): Property ID

**Response:**
```json
{
  "id": "uuid",
  "title": "Beautiful Apartment",
  "property_type": "apartment",
  "status": "available",
  "price": 500000.00,
  "area": 120,
  "rooms": 3,
  "description": "Modern apartment in city center",
  "address": {
    "id": "uuid",
    "street": "Main Street 123",
    "city": "Berlin",
    "postal_code": "10115",
    "country": "Germany"
  },
  "features": {
    "id": "uuid",
    "balcony": true,
    "elevator": true,
    "parking": false,
    "garden": false
  },
  "images": [
    {
      "id": "uuid",
      "url": "https://example.com/image1.jpg",
      "thumbnail_url": "https://example.com/thumb1.jpg",
      "alt_text": "Living room",
      "is_primary": true,
      "order": 0,
      "size": 1024000,
      "mime_type": "image/jpeg",
      "uploaded_at": "2025-01-27T10:00:00Z"
    }
  ],
  "documents": [
    {
      "id": "uuid",
      "name": "Exposé",
      "url": "https://example.com/expose.pdf",
      "document_type": "expose",
      "size": 2048000,
      "mime_type": "application/pdf",
      "uploaded_at": "2025-01-27T10:00:00Z"
    }
  ],
  "created_at": "2025-01-27T10:00:00Z",
  "updated_at": "2025-01-27T10:00:00Z",
  "created_by": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Rate Limit:** 200 requests per minute per tenant  
**Authentication:** Bearer Token (read scope)

---

### PUT /api/v1/properties/{id}

Update a specific property.

**Path Parameters:**
- `id` (uuid): Property ID

**Request Body:**
```json
{
  "title": "Updated Apartment Title",
  "status": "sold",
  "price": 550000.00,
  "description": "Updated description"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Updated Apartment Title",
  "property_type": "apartment",
  "status": "sold",
  "price": 550000.00,
  "area": 120,
  "rooms": 3,
  "description": "Updated description",
  "updated_at": "2025-01-27T11:00:00Z"
}
```

**Rate Limit:** 50 requests per minute per tenant  
**Authentication:** Bearer Token (write scope)

---

### DELETE /api/v1/properties/{id}

Delete a specific property.

**Path Parameters:**
- `id` (uuid): Property ID

**Response:**
```json
{
  "message": "Property deleted successfully"
}
```

**Rate Limit:** 20 requests per minute per tenant  
**Authentication:** Bearer Token (delete scope)

---

### POST /api/v1/properties/{id}/media

Upload images for a property.

**Path Parameters:**
- `id` (uuid): Property ID

**Request Body:** Multipart form data
- `files`: Array of image files (JPG, PNG, WEBP)
- `metadata`: JSON string with additional metadata

**Response:**
```json
[
  {
    "id": "uuid",
    "url": "https://example.com/image1.jpg",
    "thumbnail_url": "https://example.com/thumb1.jpg",
    "alt_text": "Living room",
    "is_primary": false,
    "order": 0,
    "size": 1024000,
    "mime_type": "image/jpeg",
    "uploaded_at": "2025-01-27T10:00:00Z"
  }
]
```

**Rate Limit:** 10 requests per minute per tenant  
**Authentication:** Bearer Token (write scope)

---

### POST /api/v1/properties/{id}/documents

Upload documents for a property.

**Path Parameters:**
- `id` (uuid): Property ID

**Request Body:** Multipart form data
- `files`: Array of document files (PDF, DOC, DOCX)
- `metadata`: JSON string with additional metadata

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Exposé",
    "url": "https://example.com/expose.pdf",
    "document_type": "expose",
    "size": 2048000,
    "mime_type": "application/pdf",
    "uploaded_at": "2025-01-27T10:00:00Z"
  }
]
```

**Rate Limit:** 10 requests per minute per tenant  
**Authentication:** Bearer Token (write scope)

---

## Documents

### GET /api/v1/documents

Get paginated list of documents for the tenant.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `size` (int): Page size (default: 20, max: 100)
- `search` (string): Search term
- `document_type` (string): Filter by document type
- `folder_id` (uuid): Filter by folder
- `sort` (string): Sort field (default: uploaded_at)
- `order` (string): Sort order (asc/desc, default: desc)

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Contract Template",
      "url": "https://example.com/contract.pdf",
      "document_type": "contract",
      "size": 1024000,
      "mime_type": "application/pdf",
      "folder": {
        "id": "uuid",
        "name": "Templates"
      },
      "uploaded_at": "2025-01-27T10:00:00Z",
      "uploaded_by": {
        "id": "uuid",
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  ],
  "total": 15,
  "page": 1,
  "size": 20,
  "pages": 1
}
```

**Rate Limit:** 200 requests per minute per tenant  
**Authentication:** Bearer Token (read scope)

---

### POST /api/v1/documents/upload

Upload a new document.

**Request Body:** Multipart form data
- `file`: Document file (PDF, DOC, DOCX, XLS, XLSX)
- `metadata`: JSON string with metadata

**Metadata Schema:**
```json
{
  "name": "Document Name",
  "document_type": "contract",
  "folder_id": "uuid",
  "description": "Optional description",
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Document Name",
  "url": "https://example.com/document.pdf",
  "document_type": "contract",
  "size": 1024000,
  "mime_type": "application/pdf",
  "folder": {
    "id": "uuid",
    "name": "Templates"
  },
  "uploaded_at": "2025-01-27T10:00:00Z",
  "uploaded_by": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Rate Limit:** 10 requests per minute per tenant  
**Authentication:** Bearer Token (write scope)

---

### GET /api/v1/documents/{id}

Get a specific document by ID.

**Path Parameters:**
- `id` (uuid): Document ID

**Response:**
```json
{
  "id": "uuid",
  "name": "Contract Template",
  "url": "https://example.com/contract.pdf",
  "document_type": "contract",
  "size": 1024000,
  "mime_type": "application/pdf",
  "description": "Standard contract template",
  "tags": ["template", "contract"],
  "folder": {
    "id": "uuid",
    "name": "Templates"
  },
  "versions": [
    {
      "id": "uuid",
      "version": 1,
      "url": "https://example.com/contract_v1.pdf",
      "size": 1024000,
      "created_at": "2025-01-27T10:00:00Z"
    }
  ],
  "uploaded_at": "2025-01-27T10:00:00Z",
  "updated_at": "2025-01-27T10:00:00Z",
  "uploaded_by": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Rate Limit:** 200 requests per minute per tenant  
**Authentication:** Bearer Token (read scope)

---

### PUT /api/v1/documents/{id}

Update a specific document.

**Path Parameters:**
- `id` (uuid): Document ID

**Request Body:**
```json
{
  "name": "Updated Document Name",
  "description": "Updated description",
  "tags": ["updated", "tag"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Updated Document Name",
  "url": "https://example.com/contract.pdf",
  "document_type": "contract",
  "size": 1024000,
  "mime_type": "application/pdf",
  "description": "Updated description",
  "tags": ["updated", "tag"],
  "updated_at": "2025-01-27T11:00:00Z"
}
```

**Rate Limit:** 50 requests per minute per tenant  
**Authentication:** Bearer Token (write scope)

---

### DELETE /api/v1/documents/{id}

Delete a specific document.

**Path Parameters:**
- `id` (uuid): Document ID

**Response:**
```json
{
  "message": "Document deleted successfully"
}
```

**Rate Limit:** 20 requests per minute per tenant  
**Authentication:** Bearer Token (delete scope)

---

## Users

### GET /api/v1/users

Get list of users in the tenant.

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+49123456789",
    "is_active": true,
    "email_verified": true,
    "role": "admin",
    "department": "Sales",
    "joined_at": "2025-01-27T10:00:00Z",
    "last_login": "2025-01-27T09:00:00Z"
  }
]
```

**Rate Limit:** 200 requests per minute per tenant  
**Authentication:** Bearer Token (write scope)

---

### POST /api/v1/users/invite

Invite a new user to the tenant.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "agent",
  "phone": "+49987654321",
  "department": "Sales"
}
```

**Response:**
```json
{
  "message": "User newuser@example.com has been invited to the tenant",
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+49987654321",
    "is_active": true,
    "email_verified": false,
    "role": "agent",
    "department": "Sales",
    "joined_at": "2025-01-27T10:00:00Z"
  },
  "invitation_sent": true
}
```

**Rate Limit:** 10 requests per minute per tenant  
**Authentication:** Bearer Token (write scope)

---

### PUT /api/v1/users/{id}/role

Update user role in tenant.

**Path Parameters:**
- `id` (uuid): User ID

**Request Body:**
```json
{
  "role": "manager"
}
```

**Response:**
```json
{
  "message": "User role updated to manager"
}
```

**Rate Limit:** 20 requests per minute per tenant  
**Authentication:** Bearer Token (write scope)

---

### DELETE /api/v1/users/{id}

Remove user from tenant.

**Path Parameters:**
- `id` (uuid): User ID

**Response:**
```json
{
  "message": "User removed from tenant"
}
```

**Rate Limit:** 10 requests per minute per tenant  
**Authentication:** Bearer Token (write scope)

---

## Tenant

### GET /api/v1/tenant

Get current tenant information.

**Response:**
```json
{
  "id": "uuid",
  "name": "My Company",
  "slug": "my-company",
  "company_email": "info@mycompany.com",
  "company_phone": "+49987654321",
  "address": {
    "street": "Company Street 123",
    "city": "Berlin",
    "postal_code": "10115",
    "country": "Germany"
  },
  "branding": {
    "primary_color": "#007bff",
    "secondary_color": "#6c757d",
    "logo_url": "https://example.com/logo.png"
  },
  "plan": {
    "key": "starter",
    "name": "Starter Plan",
    "max_users": 5,
    "max_properties": 25,
    "storage_limit_gb": 10,
    "features": {
      "integrations": true,
      "reporting": true,
      "white_label": false
    }
  },
  "usage": {
    "active_users": 3,
    "properties_count": 12,
    "storage_used_gb": 2.5,
    "storage_percentage": 25.0
  },
  "subscription": {
    "status": "active",
    "current_period_end": "2025-02-27T10:00:00Z",
    "cancel_at_period_end": false
  },
  "created_at": "2025-01-27T10:00:00Z"
}
```

**Rate Limit:** 200 requests per minute per tenant  
**Authentication:** Bearer Token (read scope)

---

### PUT /api/v1/tenant

Update tenant information.

**Request Body:**
```json
{
  "name": "Updated Company Name",
  "company_email": "newemail@mycompany.com",
  "company_phone": "+49111222333",
  "address": {
    "street": "New Street 456",
    "city": "Munich",
    "postal_code": "80331",
    "country": "Germany"
  },
  "branding": {
    "primary_color": "#28a745",
    "secondary_color": "#dc3545"
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Updated Company Name",
  "slug": "my-company",
  "company_email": "newemail@mycompany.com",
  "company_phone": "+49111222333",
  "address": {
    "street": "New Street 456",
    "city": "Munich",
    "postal_code": "80331",
    "country": "Germany"
  },
  "branding": {
    "primary_color": "#28a745",
    "secondary_color": "#dc3545",
    "logo_url": "https://example.com/logo.png"
  },
  "updated_at": "2025-01-27T11:00:00Z"
}
```

**Rate Limit:** 20 requests per minute per tenant  
**Authentication:** Bearer Token (write scope)

---

### POST /api/v1/tenant/logo

Upload tenant logo.

**Request Body:** Multipart form data
- `file`: Image file (JPG, PNG, WEBP)

**Response:**
```json
{
  "message": "Logo uploaded successfully",
  "logo_url": "https://example.com/logo.png"
}
```

**Rate Limit:** 5 requests per minute per tenant  
**Authentication:** Bearer Token (write scope)

---

## Storage

### GET /api/v1/storage/usage

Get current storage usage for the tenant.

**Response:**
```json
{
  "tenant_id": "uuid",
  "total_bytes": 2684354560,
  "total_mb": 2560.0,
  "total_gb": 2.5,
  "limit_gb": 10,
  "usage_percentage": 25.0,
  "breakdown": {
    "property_images_mb": 1200.0,
    "property_documents_mb": 800.0,
    "documents_mb": 560.0
  }
}
```

**Rate Limit:** 200 requests per minute per tenant  
**Authentication:** Bearer Token (read scope)

---

### POST /api/v1/storage/reconcile

Reconcile storage usage by comparing database vs filesystem.

**Response:**
```json
{
  "tenant_id": "uuid",
  "database_bytes": 2684354560,
  "filesystem_bytes": 2684354560,
  "discrepancy_bytes": 0,
  "discrepancy_mb": 0.0,
  "is_consistent": true,
  "filesystem_breakdown": {
    "properties": 2000.0,
    "documents": 560.0,
    "messages": 0.0,
    "other": 0.0
  }
}
```

**Rate Limit:** 10 requests per minute per tenant  
**Authentication:** Bearer Token (read scope)

---

## Billing

### GET /api/v1/billing/account

Get billing account information.

**Response:**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "stripe_customer_id": "cus_1234567890",
  "stripe_subscription_id": "sub_1234567890",
  "plan_key": "starter",
  "plan_name": "Starter Plan",
  "status": "active",
  "current_period_start": "2025-01-27T10:00:00Z",
  "current_period_end": "2025-02-27T10:00:00Z",
  "cancel_at_period_end": false,
  "trial_end": null,
  "created_at": "2025-01-27T10:00:00Z"
}
```

**Rate Limit:** 200 requests per minute per tenant  
**Authentication:** Bearer Token (read scope)

---

### GET /api/v1/billing/usage

Get current usage statistics.

**Response:**
```json
{
  "tenant_id": "uuid",
  "period_start": "2025-01-27T10:00:00Z",
  "period_end": "2025-02-27T10:00:00Z",
  "usage": {
    "users": {
      "current": 3,
      "limit": 5,
      "percentage": 60.0
    },
    "properties": {
      "current": 12,
      "limit": 25,
      "percentage": 48.0
    },
    "storage": {
      "current_gb": 2.5,
      "limit_gb": 10,
      "percentage": 25.0
    }
  },
  "alerts": [
    {
      "type": "warning",
      "resource": "users",
      "message": "User limit at 60%",
      "threshold": 80
    }
  ]
}
```

**Rate Limit:** 200 requests per minute per tenant  
**Authentication:** Bearer Token (read scope)

---

### POST /api/v1/billing/upgrade

Upgrade subscription plan.

**Request Body:**
```json
{
  "plan_key": "pro",
  "billing_cycle": "monthly"
}
```

**Response:**
```json
{
  "message": "Subscription upgrade initiated",
  "checkout_url": "https://checkout.stripe.com/pay/cs_1234567890",
  "session_id": "cs_1234567890"
}
```

**Rate Limit:** 5 requests per minute per tenant  
**Authentication:** Bearer Token (write scope)

---

## Analytics

### GET /api/v1/analytics/dashboard

Get dashboard analytics data.

**Query Parameters:**
- `period` (string): Time period (7d, 30d, 90d, 1y)
- `start_date` (date): Start date (ISO format)
- `end_date` (date): End date (ISO format)

**Response:**
```json
{
  "period": "30d",
  "summary": {
    "total_properties": 25,
    "active_properties": 20,
    "sold_properties": 3,
    "rented_properties": 2,
    "total_value": 12500000.00,
    "average_price": 500000.00
  },
  "trends": {
    "properties_created": [
      {"date": "2025-01-01", "count": 2},
      {"date": "2025-01-02", "count": 1},
      {"date": "2025-01-03", "count": 3}
    ],
    "properties_sold": [
      {"date": "2025-01-01", "count": 0},
      {"date": "2025-01-02", "count": 1},
      {"date": "2025-01-03", "count": 0}
    ]
  },
  "performance": {
    "conversion_rate": 12.0,
    "average_days_on_market": 45,
    "top_performing_agent": {
      "id": "uuid",
      "name": "John Doe",
      "sales_count": 5,
      "total_value": 2500000.00
    }
  }
}
```

**Rate Limit:** 200 requests per minute per tenant  
**Authentication:** Bearer Token (read scope)

---

### GET /api/v1/analytics/properties

Get property analytics.

**Query Parameters:**
- `property_id` (uuid): Specific property ID
- `group_by` (string): Group by field (type, status, agent)
- `period` (string): Time period

**Response:**
```json
{
  "summary": {
    "total_properties": 25,
    "by_type": {
      "apartment": 15,
      "house": 8,
      "commercial": 2
    },
    "by_status": {
      "available": 20,
      "sold": 3,
      "rented": 2
    }
  },
  "price_analysis": {
    "average_price": 500000.00,
    "median_price": 450000.00,
    "price_range": {
      "min": 200000.00,
      "max": 1200000.00
    }
  },
  "market_performance": {
    "average_days_on_market": 45,
    "conversion_rate": 12.0,
    "price_per_sqm": 4166.67
  }
}
```

**Rate Limit:** 200 requests per minute per tenant  
**Authentication:** Bearer Token (read scope)

---

## Communications

### GET /api/v1/communications/messages

Get paginated list of messages.

**Query Parameters:**
- `page` (int): Page number
- `size` (int): Page size
- `thread_id` (uuid): Filter by thread
- `participant_id` (uuid): Filter by participant
- `unread_only` (boolean): Show only unread messages

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "thread_id": "uuid",
      "sender": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "recipients": [
        {
          "id": "uuid",
          "name": "Jane Smith",
          "email": "jane@example.com"
        }
      ],
      "subject": "Property Inquiry",
      "content": "I'm interested in the apartment on Main Street.",
      "attachments": [
        {
          "id": "uuid",
          "name": "document.pdf",
          "url": "https://example.com/document.pdf",
          "size": 1024000
        }
      ],
      "is_read": false,
      "created_at": "2025-01-27T10:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "size": 20,
  "pages": 1
}
```

**Rate Limit:** 200 requests per minute per tenant  
**Authentication:** Bearer Token (read scope)

---

### POST /api/v1/communications/messages

Send a new message.

**Request Body:**
```json
{
  "thread_id": "uuid",
  "recipient_ids": ["uuid1", "uuid2"],
  "subject": "Property Inquiry",
  "content": "I'm interested in the apartment on Main Street.",
  "attachments": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "thread_id": "uuid",
  "sender": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "recipients": [
    {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  ],
  "subject": "Property Inquiry",
  "content": "I'm interested in the apartment on Main Street.",
  "attachments": [
    {
      "id": "uuid",
      "name": "document.pdf",
      "url": "https://example.com/document.pdf",
      "size": 1024000
    }
  ],
  "is_read": false,
  "created_at": "2025-01-27T10:00:00Z"
}
```

**Rate Limit:** 60 requests per minute per tenant  
**Authentication:** Bearer Token (write scope)

---

## Tasks

### GET /api/v1/tasks

Get paginated list of tasks.

**Query Parameters:**
- `page` (int): Page number
- `size` (int): Page size
- `status` (string): Filter by status
- `assigned_to` (uuid): Filter by assignee
- `priority` (string): Filter by priority
- `due_date` (date): Filter by due date

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Follow up with client",
      "description": "Call client about property viewing",
      "status": "pending",
      "priority": "high",
      "due_date": "2025-01-30T10:00:00Z",
      "assigned_to": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "created_by": {
        "id": "uuid",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "property": {
        "id": "uuid",
        "title": "Beautiful Apartment"
      },
      "created_at": "2025-01-27T10:00:00Z",
      "updated_at": "2025-01-27T10:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "size": 20,
  "pages": 2
}
```

**Rate Limit:** 200 requests per minute per tenant  
**Authentication:** Bearer Token (read scope)

---

### POST /api/v1/tasks

Create a new task.

**Request Body:**
```json
{
  "title": "Follow up with client",
  "description": "Call client about property viewing",
  "status": "pending",
  "priority": "high",
  "due_date": "2025-01-30T10:00:00Z",
  "assigned_to_id": "uuid",
  "property_id": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Follow up with client",
  "description": "Call client about property viewing",
  "status": "pending",
  "priority": "high",
  "due_date": "2025-01-30T10:00:00Z",
  "assigned_to": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "created_by": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "property": {
    "id": "uuid",
    "title": "Beautiful Apartment"
  },
  "created_at": "2025-01-27T10:00:00Z"
}
```

**Rate Limit:** 50 requests per minute per tenant  
**Authentication:** Bearer Token (write scope)

---

## Error Codes

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Request successful, no content returned |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions or limit exceeded |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

### Error Response Format

```json
{
  "detail": "Error message",
  "code": "ERROR_CODE",
  "field": "field_name",
  "timestamp": "2025-01-27T10:00:00Z"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Invalid email or password |
| `TOKEN_EXPIRED` | JWT token has expired |
| `INVALID_TOKEN` | JWT token is invalid |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `TENANT_NOT_FOUND` | Tenant not found |
| `PLAN_LIMIT_REACHED` | Subscription limit exceeded |
| `STORAGE_LIMIT_EXCEEDED` | Storage limit exceeded |
| `SEAT_LIMIT_EXCEEDED` | User limit exceeded |
| `VALIDATION_ERROR` | Request data validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

---

## Rate Limiting

### Global Rate Limits

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Authentication | 5 req/min | 60 seconds |
| General API | 100 req/min | 60 seconds |
| File Upload | 10 req/min | 60 seconds |
| WebSocket | 200 req/min | 60 seconds |

### Tenant-Specific Rate Limits

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Properties | 200 req/min | 60 seconds |
| Documents | 200 req/min | 60 seconds |
| Users | 200 req/min | 60 seconds |
| Communications | 60 req/min | 60 seconds |
| Analytics | 200 req/min | 60 seconds |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 60
```

---

## WebSocket Endpoints

### Connection URLs

- **Kanban**: `ws://api.immonow.com/ws/kanban/{tenant_id}/`
- **Team**: `ws://api.immonow.com/ws/team/{tenant_id}/`
- **Properties**: `ws://api.immonow.com/ws/properties/{tenant_id}/`
- **Chat**: `ws://api.immonow.com/ws/chat/{tenant_id}/`

### Message Format

```json
{
  "type": "message_type",
  "data": {
    "field": "value"
  },
  "timestamp": "2025-01-27T10:00:00Z"
}
```

### Message Types

| Type | Description |
|------|-------------|
| `kanban_update` | Kanban board update |
| `task_created` | New task created |
| `task_updated` | Task updated |
| `property_updated` | Property updated |
| `message_received` | New message received |
| `notification` | System notification |

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { ImmoNowClient } from '@immonow/sdk';

const client = new ImmoNowClient({
  baseUrl: 'https://api.immonow.com',
  apiKey: 'your-api-key'
});

// Get properties
const properties = await client.properties.list({
  page: 1,
  size: 20,
  search: 'apartment'
});

// Create property
const property = await client.properties.create({
  title: 'Beautiful Apartment',
  property_type: 'apartment',
  status: 'available',
  price: 500000,
  area: 120,
  rooms: 3
});

// Upload image
const image = await client.properties.uploadImage(property.id, file);
```

### Python

```python
from immonow import ImmoNowClient

client = ImmoNowClient(
    base_url='https://api.immonow.com',
    api_key='your-api-key'
)

# Get properties
properties = client.properties.list(
    page=1,
    size=20,
    search='apartment'
)

# Create property
property = client.properties.create({
    'title': 'Beautiful Apartment',
    'property_type': 'apartment',
    'status': 'available',
    'price': 500000,
    'area': 120,
    'rooms': 3
})

# Upload image
image = client.properties.upload_image(property.id, file)
```

---

## Changelog

### Version 1.0.0 (2025-01-27)

- Initial API release
- Multi-tenant architecture
- JWT-based authentication
- Property management
- Document management
- User management
- Storage tracking
- Billing integration
- WebSocket support
- Rate limiting
- Comprehensive error handling
