const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:8000/api/v1';
const TEST_EMAIL = `testuser${Date.now()}@example.com`;
const TEST_TENANT = `Test Tenant ${Date.now()}`;

// Simple storage for Node.js environment
const storage = {
  authToken: null,
  tenantId: null
};

// Create axios instance with proper configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  if (storage.authToken) {
    config.headers.Authorization = `Bearer ${storage.authToken}`;
  }
  if (storage.tenantId) {
    config.headers['X-Tenant-ID'] = storage.tenantId;
  }
  
  return config;
});

// Test data
const testData = {
  register: {
    email: TEST_EMAIL,
    password: 'TestPassword123!',
    first_name: 'Test',
    last_name: 'User',
    tenant_name: TEST_TENANT,
    phone: '+49123456789',
    company_email: 'company@example.com',
    company_phone: '+49987654321',
    plan: 'free',
    billing_cycle: 'monthly'
  },
  
  property: {
    title: 'Test Immobilie für Frontend-Test',
    description: 'Eine Test-Immobilie zur Überprüfung der Frontend-Backend-Kompatibilität',
    location: 'München',
    property_type: 'house',
    status: 'vorbereitung',
    price: 500000,
    price_currency: 'EUR',
    price_type: 'sale',
    address: {
      street: 'Teststraße',
      house_number: '123',
      postal_code: '80331',
      city: 'München',
      state: 'Bayern',
      country: 'Deutschland'
    },
    living_area: 120,
    total_area: 150,
    rooms: 5,
    bedrooms: 3,
    bathrooms: 2,
    year_built: 2020,
    energy_class: 'A',
    amenities: ['garage', 'garden'],
    tags: ['test', 'frontend'],
    contact_person: {
      first_name: 'Max',
      last_name: 'Mustermann',
      email: 'max@example.com',
      phone: '+49123456789'
    }
  },
  
  contact: {
    first_name: 'Test',
    last_name: 'Kontakt',
    email: `contact${Date.now()}@example.com`,
    phone: '+49123456789',
    company: 'Test Company',
    position: 'Manager',
    status: 'Lead',
    priority: 'medium',
    budget_min: 200000,
    budget_max: 500000,
    budget_currency: 'EUR',
    preferences: {
      property_type: 'house',
      location: 'München'
    }
  },
  
  task: {
    title: 'Test Task für Frontend-Backend-Kompatibilität',
    description: 'Ein Test-Task zur Überprüfung der API-Kompatibilität',
    priority: 'MEDIUM',
    status: 'TODO',
    estimated_hours: 4,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    issue_type: 'task',
    tags: ['test', 'frontend']
  },
  
  appointment: {
    title: 'Test Termin',
    description: 'Ein Test-Termin zur Überprüfung der API-Kompatibilität',
    start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    end_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    type: 'meeting',
    location: 'Test Location',
    attendees: [
      {
        name: 'Test User',
        email: TEST_EMAIL,
        role: 'organizer'
      }
    ]
  }
};

// Test functions
async function testRegistration() {
  console.log('🧪 Testing Registration...');
  try {
    const response = await apiClient.post('/auth/register', testData.register);
    console.log('✅ Registration successful:', response.status);
    
    // Store auth data
    if (response.data.access_token) {
      localStorage.setItem('authToken', response.data.access_token);
    }
    if (response.data.tenant_id) {
      localStorage.setItem('tenantId', response.data.tenant_id);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data || error.message);
    return false;
  }
}

async function testLogin() {
  console.log('🧪 Testing Login...');
  try {
    const response = await apiClient.post('/auth/login', {
      email: testData.register.email,
      password: testData.register.password
    });
    console.log('✅ Login successful:', response.status);
    
    // Update auth data
    if (response.data.access_token) {
      localStorage.setItem('authToken', response.data.access_token);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testPropertyCreation() {
  console.log('🧪 Testing Property Creation...');
  try {
    const response = await apiClient.post('/properties', testData.property);
    console.log('✅ Property creation successful:', response.status);
    console.log('Property ID:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('❌ Property creation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testContactCreation() {
  console.log('🧪 Testing Contact Creation...');
  try {
    const response = await apiClient.post('/contacts', testData.contact);
    console.log('✅ Contact creation successful:', response.status);
    console.log('Contact ID:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('❌ Contact creation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testTaskCreation() {
  console.log('🧪 Testing Task Creation...');
  try {
    const response = await apiClient.post('/tasks', testData.task);
    console.log('✅ Task creation successful:', response.status);
    console.log('Task ID:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('❌ Task creation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testAppointmentCreation() {
  console.log('🧪 Testing Appointment Creation...');
  try {
    const response = await apiClient.post('/appointments', testData.appointment);
    console.log('✅ Appointment creation successful:', response.status);
    console.log('Appointment ID:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('❌ Appointment creation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testPropertyUpdate(propertyId) {
  console.log('🧪 Testing Property Update...');
  try {
    const updateData = {
      ...testData.property,
      title: 'Updated Test Property',
      price: 600000
    };
    const response = await apiClient.put(`/properties/${propertyId}`, updateData);
    console.log('✅ Property update successful:', response.status);
    return true;
  } catch (error) {
    console.error('❌ Property update failed:', error.response?.data || error.message);
    return false;
  }
}

async function testContactUpdate(contactId) {
  console.log('🧪 Testing Contact Update...');
  try {
    const updateData = {
      ...testData.contact,
      first_name: 'Updated',
      status: 'Qualified'
    };
    const response = await apiClient.put(`/contacts/${contactId}`, updateData);
    console.log('✅ Contact update successful:', response.status);
    return true;
  } catch (error) {
    console.error('❌ Contact update failed:', error.response?.data || error.message);
    return false;
  }
}

async function testTaskUpdate(taskId) {
  console.log('🧪 Testing Task Update...');
  try {
    const updateData = {
      ...testData.task,
      title: 'Updated Test Task',
      status: 'IN_PROGRESS'
    };
    const response = await apiClient.put(`/tasks/${taskId}`, updateData);
    console.log('✅ Task update successful:', response.status);
    return true;
  } catch (error) {
    console.error('❌ Task update failed:', error.response?.data || error.message);
    return false;
  }
}

async function testAppointmentUpdate(appointmentId) {
  console.log('🧪 Testing Appointment Update...');
  try {
    const updateData = {
      ...testData.appointment,
      title: 'Updated Test Appointment',
      location: 'Updated Location'
    };
    const response = await apiClient.put(`/appointments/${appointmentId}`, updateData);
    console.log('✅ Appointment update successful:', response.status);
    return true;
  } catch (error) {
    console.error('❌ Appointment update failed:', error.response?.data || error.message);
    return false;
  }
}

async function testFileUpload(propertyId) {
  console.log('🧪 Testing File Upload...');
  try {
    // Create a simple text file for testing
    const testFile = new Blob(['Test file content'], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', testFile, 'test.txt');
    formData.append('metadata', JSON.stringify({
      name: 'Test Document',
      description: 'A test document for API compatibility',
      category: 'OTHER',
      visibility: 'PRIVATE'
    }));
    
    const response = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('✅ File upload successful:', response.status);
    return response.data.id;
  } catch (error) {
    console.error('❌ File upload failed:', error.response?.data || error.message);
    return null;
  }
}

async function testPropertyImageUpload(propertyId) {
  console.log('🧪 Testing Property Image Upload...');
  try {
    // Create a simple image file for testing (1x1 pixel PNG)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 1, 1);
    
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('file', blob, 'test-image.png');
      
      const response = await apiClient.post(`/properties/${propertyId}/media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('✅ Property image upload successful:', response.status);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Property image upload failed:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Frontend-Backend Compatibility Tests...\n');
  
  const results = {
    registration: false,
    login: false,
    propertyCreation: false,
    contactCreation: false,
    taskCreation: false,
    appointmentCreation: false,
    propertyUpdate: false,
    contactUpdate: false,
    taskUpdate: false,
    appointmentUpdate: false,
    fileUpload: false,
    propertyImageUpload: false
  };
  
  let propertyId = null;
  let contactId = null;
  let taskId = null;
  let appointmentId = null;
  
  // Test registration
  results.registration = await testRegistration();
  console.log('');
  
  // Test login
  results.login = await testLogin();
  console.log('');
  
  // Test property creation
  propertyId = await testPropertyCreation();
  results.propertyCreation = propertyId !== null;
  console.log('');
  
  // Test contact creation
  contactId = await testContactCreation();
  results.contactCreation = contactId !== null;
  console.log('');
  
  // Test task creation
  taskId = await testTaskCreation();
  results.taskCreation = taskId !== null;
  console.log('');
  
  // Test appointment creation
  appointmentId = await testAppointmentCreation();
  results.appointmentCreation = appointmentId !== null;
  console.log('');
  
  // Test updates
  if (propertyId) {
    results.propertyUpdate = await testPropertyUpdate(propertyId);
    console.log('');
  }
  
  if (contactId) {
    results.contactUpdate = await testContactUpdate(contactId);
    console.log('');
  }
  
  if (taskId) {
    results.taskUpdate = await testTaskUpdate(taskId);
    console.log('');
  }
  
  if (appointmentId) {
    results.appointmentUpdate = await testAppointmentUpdate(appointmentId);
    console.log('');
  }
  
  // Test file uploads
  results.fileUpload = await testFileUpload() !== null;
  console.log('');
  
  if (propertyId) {
    results.propertyImageUpload = await testPropertyImageUpload(propertyId);
    console.log('');
  }
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All frontend forms and wizards are working correctly with the backend!');
  } else {
    console.log('⚠️  Some tests failed. Please check the error messages above.');
  }
  
  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testData,
  apiClient
};
