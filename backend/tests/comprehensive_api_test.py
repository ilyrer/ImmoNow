#!/usr/bin/env python3
"""
Comprehensive API Testing Suite
Tests all backend API endpoints with CRUD operations
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import uuid

# Configuration
API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMzVmZmRlZi05ZTA1LTQxZmMtOGNmOS04NmE5ZDY0NjYyOTkiLCJlbWFpbCI6Im5leHVyaS5zZXJ2dXNzc3NAZ21haWwuY29tIiwidGVuYW50X2lkIjoiNzE5MDQ0MDgtZjQ2Ny00ZjdlLWIxZjktMDZiM2Q4ZmM1MjRkIiwidGVuYW50X3NsdWciOiJzZXJ2dXMtZ21iaGhoIiwicm9sZSI6Im93bmVyIiwiZXhwIjoxNzYxMTUwODExLCJpYXQiOjE3NjExNDkwMTEsInR5cGUiOiJhY2Nlc3MiLCJzY29wZXMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIiwiYWRtaW4iXX0.p9A_4WidzjqmY3xJHwW-6e-xKa2oajW_stB7-6E8ANY'
BASE_URL = 'http://localhost:8000/api/v1'
TENANT_ID = '71904408-f467-4f7e-b1f9-06b3d8fc524d'

HEADERS = {
    'Authorization': f'Bearer {API_KEY}',
    'X-Tenant-ID': TENANT_ID,
    'Content-Type': 'application/json'
}

# Test UUIDs for consistent testing
TEST_UUID_1 = str(uuid.uuid4())
TEST_UUID_2 = str(uuid.uuid4())
TEST_UUID_3 = str(uuid.uuid4())

class APITester:
    def __init__(self):
        self.results = []
        self.errors = []
        self.fixes_applied = []
        
    def log_result(self, method: str, endpoint: str, status: int, success: bool, error: str = None):
        """Log test result"""
        result = {
            'method': method,
            'endpoint': endpoint,
            'status': status,
            'success': success,
            'error': error,
            'timestamp': datetime.now().isoformat()
        }
        self.results.append(result)
        
        if success:
            print(f"SUCCESS: {method} {endpoint} -> {status}")
        else:
            print(f"FAILED: {method} {endpoint} -> {status}")
            if error:
                print(f"   Error: {error}")
    
    def test_endpoint(self, method: str, endpoint: str, payload: Dict = None) -> Tuple[bool, str]:
        """Test a single endpoint"""
        url = f"{BASE_URL}{endpoint}"
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=HEADERS, timeout=10)
            elif method == 'POST':
                response = requests.post(url, headers=HEADERS, json=payload, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, headers=HEADERS, json=payload, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, headers=HEADERS, json=payload, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=HEADERS, timeout=10)
            else:
                return False, f"Unsupported method: {method}"
            
            status = response.status_code
            success = 200 <= status < 300
            
            error_text = None
            if not success:
                try:
                    error_text = response.text[:200]
                except:
                    error_text = "Could not read response text"
            
            self.log_result(method, endpoint, status, success, error_text)
            return success, error_text
            
        except Exception as e:
            error_msg = str(e)
            self.log_result(method, endpoint, 0, False, error_msg)
            return False, error_msg
    
    def generate_test_payload(self, endpoint: str, method: str) -> Dict:
        """Generate minimal valid payload for POST/PUT/PATCH requests"""
        future_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        future_end_date = (datetime.now() + timedelta(days=35)).strftime('%Y-%m-%d')
        
        # Common payloads based on endpoint patterns
        if 'leave-requests' in endpoint:
            return {
                'start_date': future_date,
                'end_date': future_end_date,
                'leave_type': 'vacation',
                'days_count': 5,
                'reason': 'Test vacation request'
            }
        elif 'attendance' in endpoint:
            return {
                'date': future_date,
                'check_in': '09:00',
                'check_out': '17:00'
            }
        elif 'overtime' in endpoint:
            return {
                'date': future_date,
                'hours': 2.5,
                'reason': 'Test overtime reason with sufficient length'
            }
        elif 'expenses' in endpoint:
            return {
                'date': future_date,
                'amount': 25.50,
                'category': 'travel',
                'description': 'Test expense description'
            }
        elif 'properties' in endpoint and method in ['POST', 'PUT', 'PATCH']:
            return {
                'title': 'Test Property',
                'address': 'Test Address 123',
                'city': 'Test City',
                'property_type': 'apartment',
                'rooms': 3,
                'area': 80.5,
                'price': 250000.0
            }
        elif 'contacts' in endpoint and method in ['POST', 'PUT', 'PATCH']:
            return {
                'first_name': 'Test',
                'last_name': 'Contact',
                'email': 'test@example.com',
                'phone': '+49123456789'
            }
        elif 'tasks' in endpoint and method in ['POST', 'PUT', 'PATCH']:
            return {
                'title': 'Test Task',
                'description': 'Test task description',
                'priority': 'medium',
                'due_date': future_date
            }
        elif 'appointments' in endpoint and method in ['POST', 'PUT', 'PATCH']:
            return {
                'title': 'Test Appointment',
                'start_time': f'{future_date}T10:00:00',
                'end_time': f'{future_date}T11:00:00',
                'description': 'Test appointment'
            }
        elif 'communications' in endpoint and method in ['POST', 'PUT', 'PATCH']:
            return {
                'type': 'email',
                'subject': 'Test Communication',
                'content': 'Test communication content',
                'recipient': 'test@example.com'
            }
        elif 'finance' in endpoint and method in ['POST', 'PUT', 'PATCH']:
            return {
                'amount': 1000.0,
                'description': 'Test financial record',
                'category': 'income',
                'date': future_date
            }
        elif 'users' in endpoint and method in ['POST', 'PUT', 'PATCH']:
            return {
                'email': f'test{TEST_UUID_1[:8]}@example.com',
                'first_name': 'Test',
                'last_name': 'User',
                'role': 'employee'
            }
        elif 'profile' in endpoint and method in ['PUT', 'PATCH']:
            return {
                'first_name': 'Updated',
                'last_name': 'Name',
                'timezone': 'Europe/Berlin'
            }
        else:
            return {}
    
    def test_all_auth_apis(self):
        """Test Authentication & User Management APIs"""
        print("\n=== TESTING AUTHENTICATION & USER MANAGEMENT APIs ===")
        
        auth_tests = [
            # Auth endpoints
            ('GET', '/auth/me'),
            ('POST', '/auth/refresh', {'refresh_token': 'test_refresh_token'}),
            
            # User management
            ('GET', '/users'),
            ('POST', '/users', self.generate_test_payload('/users', 'POST')),
            ('GET', f'/users/{TEST_UUID_1}'),
            ('PUT', f'/users/{TEST_UUID_1}', self.generate_test_payload('/users', 'PUT')),
            ('DELETE', f'/users/{TEST_UUID_1}'),
            
            # Profile management
            ('GET', '/profile'),
            ('PUT', '/profile', self.generate_test_payload('/profile', 'PUT')),
        ]
        
        for method, endpoint, *payload in auth_tests:
            payload = payload[0] if payload else None
            self.test_endpoint(method, endpoint, payload)
    
    def test_all_admin_hr_apis(self):
        """Test Admin & HR APIs"""
        print("\n=== TESTING ADMIN & HR APIs ===")
        
        admin_hr_tests = [
            # Admin endpoints
            ('GET', '/admin/permissions'),
            ('GET', '/admin/roles'),
            ('GET', '/admin/users'),
            ('GET', '/admin/stats'),
            
            # Employee management
            ('GET', '/admin/employees'),
            ('GET', '/admin/employees/stats'),
            ('POST', '/admin/employees', self.generate_test_payload('/admin/employees', 'POST')),
            ('GET', f'/admin/employees/{TEST_UUID_1}'),
            ('GET', f'/admin/employees/{TEST_UUID_1}/detail'),
            ('PUT', f'/admin/employees/{TEST_UUID_1}/detail', self.generate_test_payload('/admin/employees', 'PUT')),
            ('GET', f'/admin/employees/{TEST_UUID_1}/payslips'),
            
            # Payroll
            ('GET', '/admin/payroll/runs'),
            ('POST', '/admin/payroll/runs', {'period': '2024-01', 'status': 'draft'}),
            
            # HR endpoints
            ('GET', '/hr/leave-requests'),
            ('POST', '/hr/leave-requests', self.generate_test_payload('/hr/leave-requests', 'POST')),
            ('GET', '/hr/attendance'),
            ('POST', '/hr/attendance', self.generate_test_payload('/hr/attendance', 'POST')),
            ('GET', '/hr/overtime'),
            ('POST', '/hr/overtime', self.generate_test_payload('/hr/overtime', 'POST')),
            ('GET', '/hr/expenses'),
            ('POST', '/hr/expenses', self.generate_test_payload('/hr/expenses', 'POST')),
            ('GET', '/hr/documents'),
        ]
        
        for method, endpoint, *payload in admin_hr_tests:
            payload = payload[0] if payload else None
            self.test_endpoint(method, endpoint, payload)
    
    def test_all_properties_documents_apis(self):
        """Test Properties & Documents APIs"""
        print("\n=== TESTING PROPERTIES & DOCUMENTS APIs ===")
        
        properties_tests = [
            # Properties
            ('GET', '/properties'),
            ('POST', '/properties', self.generate_test_payload('/properties', 'POST')),
            ('GET', f'/properties/{TEST_UUID_1}'),
            ('PUT', f'/properties/{TEST_UUID_1}', self.generate_test_payload('/properties', 'PUT')),
            ('DELETE', f'/properties/{TEST_UUID_1}'),
            
            # Energy certificates
            ('POST', f'/properties/{TEST_UUID_1}/energy-certificate', {'type': 'energy_pass'}),
            
            # Expose
            ('POST', f'/properties/{TEST_UUID_1}/expose', {'template': 'standard'}),
            
            # Documents
            ('GET', '/documents'),
            ('POST', '/documents', {'title': 'Test Document', 'type': 'contract'}),
            ('GET', f'/documents/{TEST_UUID_1}'),
            ('PUT', f'/documents/{TEST_UUID_1}', {'title': 'Updated Document'}),
            ('DELETE', f'/documents/{TEST_UUID_1}'),
        ]
        
        for method, endpoint, *payload in properties_tests:
            payload = payload[0] if payload else None
            self.test_endpoint(method, endpoint, payload)
    
    def test_all_business_operations_apis(self):
        """Test Business Operations APIs"""
        print("\n=== TESTING BUSINESS OPERATIONS APIs ===")
        
        business_tests = [
            # Contacts
            ('GET', '/contacts'),
            ('POST', '/contacts', self.generate_test_payload('/contacts', 'POST')),
            ('GET', f'/contacts/{TEST_UUID_1}'),
            ('PUT', f'/contacts/{TEST_UUID_1}', self.generate_test_payload('/contacts', 'PUT')),
            ('DELETE', f'/contacts/{TEST_UUID_1}'),
            
            # Tasks
            ('GET', '/tasks'),
            ('POST', '/tasks', self.generate_test_payload('/tasks', 'POST')),
            ('GET', f'/tasks/{TEST_UUID_1}'),
            ('PUT', f'/tasks/{TEST_UUID_1}', self.generate_test_payload('/tasks', 'PUT')),
            ('DELETE', f'/tasks/{TEST_UUID_1}'),
            
            # Appointments
            ('GET', '/appointments'),
            ('POST', '/appointments', self.generate_test_payload('/appointments', 'POST')),
            ('GET', f'/appointments/{TEST_UUID_1}'),
            ('PUT', f'/appointments/{TEST_UUID_1}', self.generate_test_payload('/appointments', 'PUT')),
            ('DELETE', f'/appointments/{TEST_UUID_1}'),
            
            # Communications
            ('GET', '/communications'),
            ('POST', '/communications', self.generate_test_payload('/communications', 'POST')),
            ('GET', f'/communications/{TEST_UUID_1}'),
            
            # Finance
            ('GET', '/finance'),
            ('POST', '/finance', self.generate_test_payload('/finance', 'POST')),
            ('GET', f'/finance/{TEST_UUID_1}'),
            
            # Analytics
            ('GET', '/analytics'),
            ('GET', '/analytics/property-metrics'),
            
            # Team Performance
            ('GET', '/team/performance'),
            ('GET', '/team/stats'),
        ]
        
        for method, endpoint, *payload in business_tests:
            payload = payload[0] if payload else None
            self.test_endpoint(method, endpoint, payload)
    
    def test_all_advanced_features_apis(self):
        """Test Advanced Features APIs"""
        print("\n=== TESTING ADVANCED FEATURES APIs ===")
        
        advanced_tests = [
            # Investor Management
            ('GET', '/investor'),
            ('POST', '/investor', {'name': 'Test Investor', 'email': 'investor@test.com'}),
            
            # CIM Generation
            ('POST', '/cim/generate', {'property_id': TEST_UUID_1, 'template': 'standard'}),
            
            # AVM (Property Valuation)
            ('POST', '/avm/valuate', {'property_id': TEST_UUID_1, 'method': 'comparable'}),
            
            # LLM Integration
            ('POST', '/llm/analyze', {'text': 'Test text for analysis', 'type': 'sentiment'}),
            
            # Social Media
            ('GET', '/social/accounts'),
            ('POST', '/social/accounts', {'platform': 'facebook', 'account_name': 'test_account'}),
            
            # Market Data
            ('GET', '/market/data'),
            ('GET', '/market/trends'),
            
            # Storage
            ('GET', '/storage/files'),
            ('POST', '/storage/upload', {'filename': 'test.txt', 'content': 'test content'}),
            
            # GDPR Compliance
            ('GET', '/dsgvo/data-requests'),
            ('POST', '/dsgvo/data-export', {'user_id': TEST_UUID_1}),
            
            # Notifications
            ('GET', '/notifications'),
            ('POST', '/notifications', {'title': 'Test Notification', 'message': 'Test message'}),
            
            # Publishing
            ('GET', '/api/v1/publishing/platforms'),
            ('POST', '/api/v1/publishing/publish', {'content_id': TEST_UUID_1, 'platform': 'website'}),
            
            # Billing
            ('GET', '/billing/subscription'),
            ('GET', '/billing/invoices'),
        ]
        
        for method, endpoint, *payload in advanced_tests:
            payload = payload[0] if payload else None
            self.test_endpoint(method, endpoint, payload)
    
    def test_all_system_utility_apis(self):
        """Test System & Utility APIs"""
        print("\n=== TESTING SYSTEM & UTILITY APIs ===")
        
        system_tests = [
            # Tenant Settings
            ('GET', '/tenant/settings'),
            ('PUT', '/tenant/settings', {'name': 'Updated Tenant', 'timezone': 'Europe/Berlin'}),
            
            # Plans
            ('GET', '/plans'),
            ('GET', '/plans/current'),
            
            # Test Endpoints
            ('GET', '/test/email'),
            ('POST', '/test/email', {'to': 'test@example.com', 'subject': 'Test', 'body': 'Test email'}),
            
            # Webhooks
            ('GET', '/hooks'),
            ('POST', '/hooks', {'url': 'https://example.com/webhook', 'events': ['user.created']}),
        ]
        
        for method, endpoint, *payload in system_tests:
            payload = payload[0] if payload else None
            self.test_endpoint(method, endpoint, payload)
    
    def run_all_tests(self):
        """Run all API tests"""
        print("STARTING COMPREHENSIVE API TESTING")
        print(f"Test started at: {datetime.now().isoformat()}")
        print(f"Using JWT Token (24h validity)")
        print(f"Tenant ID: {TENANT_ID}")
        
        start_time = time.time()
        
        # Run all test suites
        self.test_all_auth_apis()
        self.test_all_admin_hr_apis()
        self.test_all_properties_documents_apis()
        self.test_all_business_operations_apis()
        self.test_all_advanced_features_apis()
        self.test_all_system_utility_apis()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Generate summary
        self.generate_summary(duration)
    
    def generate_summary(self, duration: float):
        """Generate test summary"""
        total_tests = len(self.results)
        successful_tests = sum(1 for r in self.results if r['success'])
        failed_tests = total_tests - successful_tests
        
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\nTEST SUMMARY")
        print(f"Duration: {duration:.2f} seconds")
        print(f"Total Tests: {total_tests}")
        print(f"Successful: {successful_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print(f"\nFAILED TESTS:")
            for result in self.results:
                if not result['success']:
                    print(f"   {result['method']} {result['endpoint']} -> {result['status']}")
                    if result['error']:
                        print(f"      Error: {result['error']}")
        
        # Save detailed results
        self.save_results()
    
    def save_results(self):
        """Save test results to file"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"tests/api_test_results_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump({
                'summary': {
                    'total_tests': len(self.results),
                    'successful_tests': sum(1 for r in self.results if r['success']),
                    'failed_tests': sum(1 for r in self.results if not r['success']),
                    'success_rate': (sum(1 for r in self.results if r['success']) / len(self.results) * 100) if self.results else 0,
                    'timestamp': datetime.now().isoformat()
                },
                'results': self.results,
                'errors': self.errors,
                'fixes_applied': self.fixes_applied
            }, f, indent=2)
        
        print(f"\nResults saved to: {filename}")

if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()
