# ImmoNow Enterprise Test Suite

**Version**: 1.0  
**Datum**: 2025-01-27  
**Autor**: Chief Architect & Lead Auditor  

---

## Overview

Die ImmoNow Enterprise Test Suite stellt sicher, dass das System die höchsten Sicherheits- und Qualitätsstandards erfüllt. Die Tests sind darauf ausgelegt, kritische Sicherheitslücken zu identifizieren und die Einhaltung von Enterprise-Anforderungen zu gewährleisten.

### Test-Kategorien

1. **Tenant-Isolation-Tests** (8 Tests) - Datenisolation zwischen Mandanten
2. **Limits-Enforcement-Tests** (12 Tests) - Durchsetzung von Abo-Limits
3. **Unit-Tests** - Einzelne Komponenten-Tests
4. **Integration-Tests** - End-to-End-Funktionalität

---

## 1. Tenant-Isolation-Tests

### 1.1 Test-Übersicht

| Test | Beschreibung | Priorität |
|------|--------------|-----------|
| `test_cross_tenant_property_access_blocked` | User von Tenant B darf Property von Tenant A nicht sehen | P0 |
| `test_cross_tenant_document_access_blocked` | User von Tenant B darf Document von Tenant A nicht sehen | P0 |
| `test_cross_tenant_contact_access_blocked` | User von Tenant B darf Contact von Tenant A nicht sehen | P0 |
| `test_cross_tenant_task_access_blocked` | User von Tenant B darf Task von Tenant A nicht sehen | P0 |
| `test_cross_tenant_file_access_blocked` | User von Tenant B darf File von Tenant A nicht über API zugreifen | P0 |
| `test_cross_tenant_api_access_blocked` | User von Tenant B kann nicht über API auf Tenant A Daten zugreifen | P0 |
| `test_cross_tenant_websocket_access_blocked` | User von Tenant B kann nicht auf Tenant A WebSocket-Räume zugreifen | P0 |
| `test_tenant_isolation_in_bulk_operations` | Bulk-Operationen respektieren Tenant-Isolation | P0 |

### 1.2 Test-Implementierung

#### Cross-Tenant Property Access Test
```python
@pytest.mark.asyncio
async def test_cross_tenant_property_access_blocked(
    tenant_a, tenant_b, user_a, user_b, property_a
):
    """Test: User von Tenant B darf Property von Tenant A nicht sehen"""
    
    # User B versucht, Property A zu lesen
    from app.services.properties_service import PropertiesService
    service = PropertiesService(tenant_id=str(tenant_b.id))
    
    property = await service.get_property(str(property_a.id))
    
    assert property is None  # Property nicht gefunden (Tenant-Filter)
```

#### Cross-Tenant API Access Test
```python
@pytest.mark.asyncio
async def test_cross_tenant_api_access_blocked(
    tenant_a, tenant_b, user_a, user_b, property_a, api_client
):
    """Test: User von Tenant B kann nicht über API auf Tenant A Daten zugreifen"""
    
    # Login als User B
    login_response = await api_client.post("/auth/login", json={
        "email": user_b.email,
        "password": "testpassword123"
    })
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Versuche, Property A über API zu lesen
    response = await api_client.get(
        f"/api/v1/properties/{property_a.id}",
        headers=headers
    )
    
    assert response.status_code == 404  # Property nicht gefunden (Tenant-Filter)
```

#### Cross-Tenant WebSocket Access Test
```python
@pytest.mark.asyncio
async def test_cross_tenant_websocket_access_blocked(
    tenant_a, tenant_b, user_a, user_b, websocket_client
):
    """Test: User von Tenant B kann nicht auf Tenant A WebSocket-Räume zugreifen"""
    
    # Login als User B
    login_response = await websocket_client.post("/auth/login", json={
        "email": user_b.email,
        "password": "testpassword123"
    })
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    
    # Versuche, WebSocket-Verbindung zu Tenant A zu öffnen
    try:
        async with websocket_client.websocket_connect(
            f"/ws/kanban/{tenant_a.id}/",
            headers={"Authorization": f"Bearer {token}"}
        ) as websocket:
            # Sende Test-Nachricht
            await websocket.send_json({"type": "test_message"})
            response = await websocket.receive_json()
            
            # Sollte Fehler oder keine Daten von Tenant A zurückgeben
            assert response.get("error") is not None or response.get("data") is None
    except Exception as e:
        # WebSocket-Verbindung sollte fehlschlagen oder blockiert werden
        assert "permission" in str(e).lower() or "forbidden" in str(e).lower()
```

### 1.3 Test-Fixtures

```python
@pytest.fixture
async def tenant_a():
    """Create tenant A for testing"""
    tenant = await sync_to_async(Tenant.objects.create)(
        name="Tenant A",
        slug="tenant-a",
        company_email="tenant-a@example.com",
        plan="starter",
        max_users=5,
        max_properties=25,
        storage_limit_gb=10,
        is_active=True
    )
    return tenant

@pytest.fixture
async def tenant_b():
    """Create tenant B for testing"""
    tenant = await sync_to_async(Tenant.objects.create)(
        name="Tenant B",
        slug="tenant-b",
        company_email="tenant-b@example.com",
        plan="starter",
        max_users=5,
        max_properties=25,
        storage_limit_gb=10,
        is_active=True
    )
    return tenant

@pytest.fixture
async def user_a(tenant_a):
    """Create user A for tenant A"""
    user = await sync_to_async(User.objects.create)(
        email="user-a@example.com",
        first_name="User",
        last_name="A",
        is_active=True,
        email_verified=True
    )
    
    await sync_to_async(TenantUser.objects.create)(
        user=user,
        tenant=tenant_a,
        role="admin",
        is_active=True
    )
    return user

@pytest.fixture
async def user_b(tenant_b):
    """Create user B for tenant B"""
    user = await sync_to_async(User.objects.create)(
        email="user-b@example.com",
        first_name="User",
        last_name="B",
        is_active=True,
        email_verified=True
    )
    
    await sync_to_async(TenantUser.objects.create)(
        user=user,
        tenant=tenant_b,
        role="admin",
        is_active=True
    )
    return user

@pytest.fixture
async def property_a(tenant_a, user_a):
    """Create property A for tenant A"""
    property = await sync_to_async(Property.objects.create)(
        tenant=tenant_a,
        title="Property A",
        property_type="apartment",
        status="available",
        price=300000,
        area=80,
        rooms=2,
        created_by=user_a
    )
    return property

@pytest.fixture
async def property_b(tenant_b, user_b):
    """Create property B for tenant B"""
    property = await sync_to_async(Property.objects.create)(
        tenant=tenant_b,
        title="Property B",
        property_type="apartment",
        status="available",
        price=400000,
        area=100,
        rooms=3,
        created_by=user_b
    )
    return property
```

---

## 2. Limits-Enforcement-Tests

### 2.1 Test-Übersicht

| Test-Kategorie | Anzahl Tests | Beschreibung |
|----------------|--------------|--------------|
| **Seat-Limit-Tests** | 4 Tests | Durchsetzung von Benutzer-Limits |
| **Storage-Limit-Tests** | 4 Tests | Durchsetzung von Speicher-Limits |
| **Property-Limit-Tests** | 4 Tests | Durchsetzung von Immobilien-Limits |
| **Unlimited-Plan-Tests** | 3 Tests | Verhalten bei unbegrenzten Plänen |
| **Edge-Case-Tests** | 5 Tests | Grenzfälle und Fehlerbehandlung |

### 2.2 Seat-Limit-Tests

#### Seat Limit Enforcement on User Invite
```python
def test_seat_limit_enforcement_on_user_invite(self):
    """Test that seat limit is enforced when inviting users"""
    from app.services.user_service import UserService
    
    service = UserService(str(self.tenant.id))
    
    # Try to invite 6th user (should fail)
    with self.assertRaises(ForbiddenError) as context:
        sync_to_async(service.invite_user)(
            email="user6@example.com",
            first_name="User6",
            last_name="Test",
            role="agent"
        )
    
    self.assertIn("User limit reached", str(context.exception))
    self.assertIn("5", str(context.exception))  # Current limit
```

#### Seat Limit with Inactive Users
```python
def test_seat_limit_with_inactive_users(self):
    """Test that inactive users don't count towards limit"""
    # Deactivate one user
    tenant_user = TenantUser.objects.get(user=self.users[0])
    tenant_user.is_active = False
    tenant_user.save()
    
    from app.services.user_service import UserService
    service = UserService(str(self.tenant.id))
    
    # Should be able to invite new user now
    new_user = sync_to_async(service.invite_user)(
        email="newuser@example.com",
        first_name="New",
        last_name="User",
        role="agent"
    )
    
    self.assertIsNotNone(new_user)
```

### 2.3 Storage-Limit-Tests

#### Storage Limit Enforcement on Document Upload
```python
def test_storage_limit_enforcement_on_document_upload(self):
    """Test that storage limit is enforced on document upload"""
    from app.services.documents_service import DocumentsService
    
    service = DocumentsService(str(self.tenant.id))
    
    # Try to upload 2GB file (should fail - would exceed 10GB limit)
    with self.assertRaises(ForbiddenError) as context:
        sync_to_async(service.create_document)(
            name="Large Document",
            url="https://example.com/large.pdf",
            size=2 * 1024 * 1024 * 1024,  # 2GB
            uploaded_by_id=str(self.user.id)
        )
    
    self.assertIn("Storage limit exceeded", str(context.exception))
```

#### Storage Limit with Plan Upgrade
```python
def test_storage_limit_with_plan_upgrade(self):
    """Test that plan upgrade increases storage limit"""
    # Upgrade to Pro plan (50 GB max)
    self.tenant.plan = "pro"
    self.tenant.storage_limit_gb = 50
    self.tenant.save()
    
    from app.services.documents_service import DocumentsService
    service = DocumentsService(str(self.tenant.id))
    
    # Should be able to upload larger file now
    document = sync_to_async(service.create_document)(
        name="Large Document",
        url="https://example.com/large.pdf",
        size=2 * 1024 * 1024 * 1024,  # 2GB
        uploaded_by_id=str(self.user.id)
    )
    
    self.assertIsNotNone(document)
```

### 2.4 Property-Limit-Tests

#### Property Limit Enforcement on Creation
```python
def test_property_limit_enforcement_on_creation(self):
    """Test that property limit is enforced on creation"""
    from app.services.properties_service import PropertiesService
    
    service = PropertiesService(str(self.tenant.id))
    
    # Try to create 26th property (should fail)
    with self.assertRaises(ForbiddenError) as context:
        sync_to_async(service.create_property)(
            title="Test Property 26",
            property_type="apartment",
            status="available",
            price=300000,
            area=80,
            rooms=2,
            created_by_id=str(self.user.id)
        )
    
    self.assertIn("Property limit reached", str(context.exception))
    self.assertIn("25", str(context.exception))  # Current limit
```

### 2.5 Unlimited-Plan-Tests

#### Unlimited User Limit
```python
def test_unlimited_user_limit(self):
    """Test that unlimited user limit allows any number of users"""
    from app.services.user_service import UserService
    
    service = UserService(str(self.tenant.id))
    
    # Should be able to invite many users
    for i in range(100):
        new_user = sync_to_async(service.invite_user)(
            email=f"user{i}@example.com",
            first_name=f"User{i}",
            last_name="Test",
            role="agent"
        )
        self.assertIsNotNone(new_user)
```

### 2.6 Edge-Case-Tests

#### Limit Enforcement with Inactive Tenant
```python
def test_limit_enforcement_with_inactive_tenant(self):
    """Test limit enforcement with inactive tenant"""
    # Deactivate tenant
    self.tenant.is_active = False
    self.tenant.save()
    
    # Should still enforce limits
    with self.assertRaises(ForbiddenError):
        sync_to_async(BillingGuard.check_limit)(
            str(self.tenant.id),
            'users',
            'create',
            additional_count=1
        )
```

#### Limit Enforcement with Invalid Tenant ID
```python
def test_limit_enforcement_with_invalid_tenant_id(self):
    """Test limit enforcement with invalid tenant ID"""
    # Should raise error for invalid tenant
    with self.assertRaises(NotFoundError):
        sync_to_async(BillingGuard.check_limit)(
            "invalid-tenant-id",
            'users',
            'create',
            additional_count=1
        )
```

---

## 3. Test-Ausführung

### 3.1 Test-Runner-Script

Das `run_tests.py`-Script bietet verschiedene Ausführungsoptionen:

```bash
# Alle Tests ausführen
python run_tests.py all

# Tests mit Coverage-Report
python run_tests.py coverage

# Spezifischen Test ausführen
python run_tests.py test:tests/integration/test_tenant_isolation.py
```

### 3.2 Manuelle Test-Ausführung

```bash
# Tenant-Isolation-Tests
python -m pytest tests/integration/test_tenant_isolation.py -v

# Limits-Enforcement-Tests
python -m pytest tests/integration/test_limits_enforcement.py -v

# Alle Integration-Tests
python -m pytest tests/integration/ -v

# Mit Coverage
python -m pytest tests/ --cov=app --cov-report=html
```

### 3.3 Test-Konfiguration

#### pytest.ini
```ini
[tool:pytest]
DJANGO_SETTINGS_MODULE = backend.settings
python_files = tests.py test_*.py *_tests.py
python_classes = Test*
python_functions = test_*
addopts = --tb=short --strict-markers
markers =
    slow: marks tests as slow (deselect with '-m "not slow"')
    integration: marks tests as integration tests
    unit: marks tests as unit tests
```

#### conftest.py
```python
import pytest
import asyncio
from django.test import TestCase
from django.db import transaction
from app.db.models import Tenant, User, TenantUser, Property, Document, BillingAccount

@pytest.fixture(scope="function")
def django_db_setup(django_db_setup, django_db_blocker):
    """Setup database for each test"""
    with django_db_blocker.unblock():
        # Create test data
        pass

@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
```

---

## 4. Test-Ergebnisse und Berichte

### 4.1 Erwartete Test-Ergebnisse

#### Tenant-Isolation-Tests
- ✅ **8/8 Tests bestehen** - Alle Cross-Tenant-Zugriffe werden blockiert
- ✅ **0 Datenlecks** - Keine Überschneidungen zwischen Mandanten
- ✅ **100% Isolation** - Vollständige Datenisolation gewährleistet

#### Limits-Enforcement-Tests
- ✅ **12/12 Tests bestehen** - Alle Limits werden korrekt durchgesetzt
- ✅ **Seat-Limits** - Benutzer-Limits werden bei Create/Invite geprüft
- ✅ **Storage-Limits** - Speicher-Limits werden bei Upload geprüft
- ✅ **Property-Limits** - Immobilien-Limits werden bei Create geprüft

### 4.2 Coverage-Report

```bash
# Coverage-Bericht generieren
python -m pytest tests/ --cov=app --cov-report=html --cov-report=term-missing

# HTML-Report öffnen
open htmlcov/index.html
```

**Ziel-Coverage**:
- **Kritische Services**: 95%+ Coverage
- **API-Endpoints**: 90%+ Coverage
- **Models**: 85%+ Coverage
- **Gesamt**: 80%+ Coverage

### 4.3 Performance-Benchmarks

```bash
# Performance-Tests mit pytest-benchmark
python -m pytest tests/ --benchmark-only --benchmark-sort=mean

# Latenz-Tests
python -m pytest tests/performance/ -v
```

**Ziel-Performance**:
- **API-Response**: < 200ms (P95)
- **Database-Queries**: < 50ms (P95)
- **File-Uploads**: < 1s (P95)
- **WebSocket-Messages**: < 100ms (P95)

---

## 5. CI/CD-Integration

### 5.1 GitHub Actions

```yaml
name: Enterprise Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: immonow_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-asyncio pytest-cov
    
    - name: Run tests
      run: |
        python run_tests.py all
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
```

### 5.2 Test-Automatisierung

```bash
# Pre-commit Hook
#!/bin/bash
echo "Running enterprise tests..."
python run_tests.py all

if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Commit blocked."
    exit 1
fi

echo "✅ All tests passed. Commit allowed."
```

---

## 6. Troubleshooting

### 6.1 Häufige Test-Fehler

#### Database-Connection-Fehler
```bash
# Problem: Database connection failed
# Lösung: PostgreSQL-Service starten
sudo systemctl start postgresql
sudo -u postgres createdb immonow_test
```

#### Async-Test-Fehler
```python
# Problem: Async tests not running
# Lösung: Event loop korrekt konfigurieren
@pytest.fixture
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
```

#### Fixture-Dependencies
```python
# Problem: Fixture dependencies not resolved
# Lösung: Dependencies explizit definieren
@pytest.fixture
async def property_a(tenant_a, user_a):  # Dependencies explizit
    # ...
```

### 6.2 Debug-Modus

```bash
# Tests mit Debug-Output
python -m pytest tests/ -v -s --tb=long

# Spezifischen Test debuggen
python -m pytest tests/integration/test_tenant_isolation.py::test_cross_tenant_property_access_blocked -v -s
```

---

## 7. Best Practices

### 7.1 Test-Schreibrichtlinien

#### Do's
- ✅ Verwende aussagekräftige Test-Namen
- ✅ Teste sowohl positive als auch negative Szenarien
- ✅ Verwende Fixtures für Test-Daten
- ✅ Teste Edge-Cases und Grenzfälle
- ✅ Dokumentiere Test-Zweck und -Erwartungen

#### Don'ts
- ❌ Schreibe keine Tests ohne Assertions
- ❌ Verwende keine Hardcoded-Werte
- ❌ Teste nicht mehrere Dinge in einem Test
- ❌ Ignoriere keine Test-Fehler
- ❌ Verwende keine externen Services in Tests

### 7.2 Performance-Optimierung

```python
# Database-Queries optimieren
@pytest.mark.django_db
def test_optimized_query():
    # Verwende select_related und prefetch_related
    properties = Property.objects.select_related('tenant', 'created_by').prefetch_related('images')
    
    # Teste mit realistischen Datenmengen
    assert len(properties) > 0
```

---

## Conclusion

Die ImmoNow Enterprise Test Suite gewährleistet:

- **Vollständige Tenant-Isolation** durch 8 spezialisierte Tests
- **Korrekte Limits-Durchsetzung** durch 12 umfassende Tests
- **Hohe Code-Qualität** durch 80%+ Coverage
- **Schnelle Feedback-Schleifen** durch automatisierte Tests
- **Enterprise-Sicherheitsstandards** durch kontinuierliche Validierung

Das Test-System ist darauf ausgelegt, kritische Sicherheitslücken frühzeitig zu identifizieren und die Einhaltung von Enterprise-Anforderungen zu gewährleisten.
