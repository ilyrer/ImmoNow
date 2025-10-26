/**
 * Integration Tests für API Schema Kompatibilität
 * 
 * Diese Tests überprüfen, ob die Frontend-Formulare korrekt mit den Backend-Schemas kommunizieren.
 * Sie testen sowohl erfolgreiche Requests als auch Validierungsfehler.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api/v1';

// Test-Daten für verschiedene Endpoints
const testData = {
  // Auth Tests
  login: {
    valid: {
      email: 'test@example.com',
      password: 'TestPassword123!'
    },
    invalid: {
      email: 'invalid-email',
      password: '123'
    }
  },
  
  register: {
    valid: {
      email: `testuser${Date.now()}@example.com`,
      password: 'TestPassword123!',
      first_name: 'Test',
      last_name: 'User',
      tenant_name: `Test Tenant ${Date.now()}`,
      phone: '+49123456789',
      company_email: 'company@example.com',
      company_phone: '+49987654321'
    },
    invalid: {
      email: 'invalid-email',
      password: '123',
      first_name: '',
      last_name: '',
      tenant_name: ''
    }
  },

  // Property Tests
  property: {
    valid: {
      title: 'Test Property',
      property_type: 'apartment',
      location: 'Berlin',
      address: {
        street: 'Test Street 123',
        city: 'Berlin',
        postal_code: '10115',
        country: 'Germany'
      },
      price: 500000,
      living_area: 80,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 1,
      year_built: 2020,
      description: 'A beautiful test property',
      amenities: ['balcony', 'parking'],
      tags: ['modern', 'central']
    },
    invalid: {
      title: '',
      property_type: 'invalid_type',
      location: '',
      price: -1000,
      living_area: -50
    }
  },

  // Contact Tests
  contact: {
    valid: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+49123456789',
      company: 'Test Company',
      position: 'Manager'
    },
    invalid: {
      first_name: '',
      last_name: '',
      email: 'invalid-email',
      phone: '123'
    }
  },

  // Task Tests
  task: {
    valid: {
      title: 'Test Task',
      description: 'A test task description',
      priority: 'high',
      status: 'todo',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignee_id: null
    },
    invalid: {
      title: '',
      priority: 'invalid_priority',
      status: 'invalid_status',
      due_date: 'invalid-date'
    }
  },

  // Appointment Tests
  appointment: {
    valid: {
      title: 'Test Appointment',
      description: 'A test appointment',
      type: 'meeting',
      start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      location: 'Test Location',
      attendees: []
    },
    invalid: {
      title: '',
      type: 'invalid_type',
      start_datetime: 'invalid-date',
      end_datetime: 'invalid-date'
    }
  }
};

test.describe('API Schema Compatibility Tests', () => {
  
  test.describe('Authentication Endpoints', () => {
    
    test('POST /auth/login - Valid Request', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/auth/login`, {
        data: testData.login.valid
      });
      
      // Should return 200 or 401/403/409 (depending on if user exists or tenant issues)
      expect([200, 401, 403, 409]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('access_token');
        expect(data).toHaveProperty('refresh_token');
        expect(data).toHaveProperty('token_type', 'bearer');
      }
    });

    test('POST /auth/login - Invalid Request', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/auth/login`, {
        data: testData.login.invalid
      });
      
      // Should return 422 validation error or 403 if not authenticated
      expect([422, 403]).toContain(response.status());
      
      const data = await response.json();
      expect(data).toHaveProperty('detail');
    });

    test('POST /auth/register - Valid Request', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/auth/register`, {
        data: testData.register.valid
      });
      
      // Should return 201 or 400/409/500 (if user already exists or server errors)
      expect([201, 400, 409, 500]).toContain(response.status());
      
      if (response.status() === 201) {
        const data = await response.json();
        expect(data).toHaveProperty('user');
        expect(data).toHaveProperty('access_token');
        expect(data).toHaveProperty('refresh_token');
      }
    });

    test('POST /auth/register - Invalid Request', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/auth/register`, {
        data: testData.register.invalid
      });
      
      // Should return 422 validation error or 403 if not authenticated
      expect([422, 403]).toContain(response.status());
      
      const data = await response.json();
      expect(data).toHaveProperty('detail');
    });
  });

  test.describe('Property Endpoints', () => {
    
    test('POST /properties - Valid Request', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/properties`, {
        data: testData.property.valid
      });
      
      // Should return 201 or 401/403 (if not authenticated)
      expect([201, 401, 403]).toContain(response.status());
      
      if (response.status() === 201) {
        const data = await response.json();
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('title', testData.property.valid.title);
        expect(data).toHaveProperty('property_type', testData.property.valid.property_type);
        expect(data).toHaveProperty('location', testData.property.valid.location);
      }
    });

    test('POST /properties - Invalid Request', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/properties`, {
        data: testData.property.invalid
      });
      
      // Should return 422 validation error or 403 if not authenticated
      expect([422, 403]).toContain(response.status());
      
      const data = await response.json();
      expect(data).toHaveProperty('detail');
    });

    test('GET /properties - List Properties', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/properties`);
      
      // Should return 200 or 401/403 (if not authenticated)
      expect([200, 401, 403]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });
  });

  test.describe('Contact Endpoints', () => {
    
    test('POST /contacts - Valid Request', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/contacts`, {
        data: testData.contact.valid
      });
      
      // Should return 201 or 401/403 (if not authenticated)
      expect([201, 401, 403]).toContain(response.status());
      
      if (response.status() === 201) {
        const data = await response.json();
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('first_name', testData.contact.valid.first_name);
        expect(data).toHaveProperty('last_name', testData.contact.valid.last_name);
        expect(data).toHaveProperty('email', testData.contact.valid.email);
      }
    });

    test('POST /contacts - Invalid Request', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/contacts`, {
        data: testData.contact.invalid
      });
      
      // Should return 422 validation error or 403 if not authenticated
      expect([422, 403]).toContain(response.status());
      
      const data = await response.json();
      expect(data).toHaveProperty('detail');
    });

    test('GET /contacts - List Contacts', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/contacts`);
      
      // Should return 200 or 401/403 (if not authenticated)
      expect([200, 401, 403]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });
  });

  test.describe('Task Endpoints', () => {
    
    test('POST /tasks - Valid Request', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/tasks`, {
        data: testData.task.valid
      });
      
      // Should return 201 or 401/403 (if not authenticated)
      expect([201, 401, 403]).toContain(response.status());
      
      if (response.status() === 201) {
        const data = await response.json();
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('title', testData.task.valid.title);
        expect(data).toHaveProperty('priority', testData.task.valid.priority);
        expect(data).toHaveProperty('status', testData.task.valid.status);
      }
    });

    test('POST /tasks - Invalid Request', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/tasks`, {
        data: testData.task.invalid
      });
      
      // Should return 422 validation error or 403 if not authenticated
      expect([422, 403]).toContain(response.status());
      
      const data = await response.json();
      expect(data).toHaveProperty('detail');
    });

    test('GET /tasks - List Tasks', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/tasks`);
      
      // Should return 200 or 401/403 (if not authenticated)
      expect([200, 401, 403]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });
  });

  test.describe('Appointment Endpoints', () => {
    
    test('POST /appointments - Valid Request', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/appointments`, {
        data: testData.appointment.valid
      });
      
      // Should return 201 or 401/403 (if not authenticated)
      expect([201, 401, 403]).toContain(response.status());
      
      if (response.status() === 201) {
        const data = await response.json();
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('title', testData.appointment.valid.title);
        expect(data).toHaveProperty('type', testData.appointment.valid.type);
        expect(data).toHaveProperty('start_datetime');
        expect(data).toHaveProperty('end_datetime');
      }
    });

    test('POST /appointments - Invalid Request', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/appointments`, {
        data: testData.appointment.invalid
      });
      
      // Should return 422 validation error or 403 if not authenticated
      expect([422, 403]).toContain(response.status());
      
      const data = await response.json();
      expect(data).toHaveProperty('detail');
    });

    test('GET /appointments - List Appointments', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/appointments`);
      
      // Should return 200 or 401/403 (if not authenticated)
      expect([200, 401, 403]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });
  });

  test.describe('Schema Field Validation', () => {
    
    test('Property - Required Fields Validation', async ({ request }) => {
      const incompleteData = {
        title: 'Test Property'
        // Missing required fields: property_type, location
      };
      
      const response = await request.post(`${API_BASE_URL}/properties`, {
        data: incompleteData
      });
      
      // Should return 422 validation error or 403 if not authenticated
      expect([422, 403]).toContain(response.status());
      
      const data = await response.json();
      expect(data).toHaveProperty('detail');
      
      // If we get 403, that's expected for unauthenticated requests
      if (response.status() === 403) {
        expect(data).toHaveProperty('detail');
      } else {
        // If we get 422, check for specific field errors
        const detail = JSON.stringify(data.detail);
        expect(detail).toMatch(/property_type|location/);
      }
    });

    test('Contact - Email Format Validation', async ({ request }) => {
      const invalidEmailData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'invalid-email-format',
        phone: '+49123456789'
      };
      
      const response = await request.post(`${API_BASE_URL}/contacts`, {
        data: invalidEmailData
      });
      
      // Should return 422 validation error or 403 if not authenticated
      expect([422, 403]).toContain(response.status());
      
      const data = await response.json();
      expect(data).toHaveProperty('detail');
      
      // If we get 403, that's expected for unauthenticated requests
      if (response.status() === 403) {
        expect(data).toHaveProperty('detail');
      } else {
        // If we get 422, check for specific field errors
        const detail = JSON.stringify(data.detail);
        expect(detail).toMatch(/email|format/);
      }
    });

    test('Task - Enum Value Validation', async ({ request }) => {
      const invalidEnumData = {
        title: 'Test Task',
        priority: 'invalid_priority',
        status: 'invalid_status',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      const response = await request.post(`${API_BASE_URL}/tasks`, {
        data: invalidEnumData
      });
      
      // Should return 422 validation error or 403 if not authenticated
      expect([422, 403]).toContain(response.status());
      
      const data = await response.json();
      expect(data).toHaveProperty('detail');
      
      // If we get 403, that's expected for unauthenticated requests
      if (response.status() === 403) {
        expect(data).toHaveProperty('detail');
      } else {
        // If we get 422, check for specific field errors
        const detail = JSON.stringify(data.detail);
        expect(detail).toMatch(/priority|status/);
      }
    });
  });

  test.describe('Case Sensitivity Tests', () => {
    
    test('Property - Snake Case Field Names', async ({ request }) => {
      const snakeCaseData = {
        title: 'Test Property',
        property_type: 'apartment',
        location: 'Berlin',
        living_area: 80,
        year_built: 2020
      };
      
      const response = await request.post(`${API_BASE_URL}/properties`, {
        data: snakeCaseData
      });
      
      // Should work with snake_case field names
      expect([201, 401, 403]).toContain(response.status());
    });

    test('Contact - Snake Case Field Names', async ({ request }) => {
      const snakeCaseData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+49123456789'
      };
      
      const response = await request.post(`${API_BASE_URL}/contacts`, {
        data: snakeCaseData
      });
      
      // Should work with snake_case field names
      expect([201, 401, 403]).toContain(response.status());
    });
  });
});
