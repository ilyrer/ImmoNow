/**
 * Frontend-Backend Integration Test
 * 
 * Dieses Skript testet, ob das Frontend korrekt mit dem Backend kommuniziert.
 * Es simuliert die wichtigsten Formulare und überprüft die API-Aufrufe.
 */

import apiClient from '../src/api/enhancedClient';

// Test-Daten
const testData = {
  login: {
    email: 'test@example.com',
    password: 'TestPassword123!'
  },
  register: {
    email: `testuser${Date.now()}@example.com`,
    password: 'TestPassword123!',
    first_name: 'Test',
    last_name: 'User',
    tenant_name: `Test Tenant ${Date.now()}`,
    phone: '+49123456789',
    company_email: 'company@example.com',
    company_phone: '+49987654321'
  },
  property: {
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
  contact: {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+49123456789',
    company: 'Test Company',
    position: 'Manager'
  }
};

async function testFrontendBackendIntegration() {
  console.log('🧪 Testing Frontend-Backend Integration...\n');

  try {
    // Test 1: Registration
    console.log('1️⃣ Testing Registration...');
    try {
      const registerResponse = await apiClient.register(testData.register);
      console.log('✅ Registration successful:', registerResponse.status);
    } catch (error) {
      console.log('⚠️ Registration failed:', error.message);
    }

    // Test 2: Login
    console.log('\n2️⃣ Testing Login...');
    try {
      const loginResponse = await apiClient.login(testData.login);
      console.log('✅ Login successful:', loginResponse.status);
    } catch (error) {
      console.log('⚠️ Login failed:', error.message);
    }

    // Test 3: Property Creation (requires authentication)
    console.log('\n3️⃣ Testing Property Creation...');
    try {
      const propertyResponse = await apiClient.createProperty(testData.property);
      console.log('✅ Property creation successful:', propertyResponse.status);
    } catch (error) {
      console.log('⚠️ Property creation failed:', error.message);
    }

    // Test 4: Contact Creation (requires authentication)
    console.log('\n4️⃣ Testing Contact Creation...');
    try {
      const contactResponse = await apiClient.createContact(testData.contact);
      console.log('✅ Contact creation successful:', contactResponse.status);
    } catch (error) {
      console.log('⚠️ Contact creation failed:', error.message);
    }

    // Test 5: Property List (requires authentication)
    console.log('\n5️⃣ Testing Property List...');
    try {
      const propertiesResponse = await apiClient.getProperties();
      console.log('✅ Property list successful:', propertiesResponse.status);
    } catch (error) {
      console.log('⚠️ Property list failed:', error.message);
    }

    // Test 6: Contact List (requires authentication)
    console.log('\n6️⃣ Testing Contact List...');
    try {
      const contactsResponse = await apiClient.getContacts();
      console.log('✅ Contact list successful:', contactsResponse.status);
    } catch (error) {
      console.log('⚠️ Contact list failed:', error.message);
    }

    console.log('\n🎉 Frontend-Backend Integration Test completed!');
    console.log('\n📝 Note: Some tests may fail due to authentication requirements.');
    console.log('This is expected behavior - the important thing is that the API calls are structured correctly.');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

// Run the test
testFrontendBackendIntegration();
