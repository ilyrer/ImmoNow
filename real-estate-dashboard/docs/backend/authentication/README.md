# Authentifizierung & Benutzerverwaltung

## Zweck
JWT-basierte Authentifizierung für die Immobilien-Dashboard-Anwendung mit rollenbasierter Zugriffskontrolle.

## Erwartetes Datenmodell (JSON)

### User Login Request
```json
{
  "email": "serhat.weltberg@immobilien.de",
  "password": "securePassword123"
}
```

### User Registration Request
```json
{
  "email": "new.user@immobilien.de",
  "password": "securePassword123",
  "first_name": "Max",
  "last_name": "Mustermann",
  "role": "agent",
  "company": "Immobilien GmbH",
  "phone": "+49 123 456789"
}
```

### User Response
```json
{
  "id": "uuid-string",
  "email": "serhat.weltberg@immobilien.de",
  "first_name": "Serhat",
  "last_name": "Weltberg",
  "role": "admin",
  "company": "Immobilien GmbH",
  "phone": "+49 123 456789",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "last_login": "2024-12-01T14:20:00Z",
  "plan": "premium",
  "billing_cycle": "monthly"
}
```

### JWT Token Response
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid-string",
    "email": "serhat.weltberg@immobilien.de",
    "first_name": "Serhat",
    "last_name": "Weltberg",
    "role": "admin"
  }
}
```

## Django Models

```python
from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('manager', 'Manager'),
        ('agent', 'Immobilienmakler'),
        ('assistant', 'Assistent'),
    ]
    
    PLAN_CHOICES = [
        ('basic', 'Basic'),
        ('premium', 'Premium'),
        ('enterprise', 'Enterprise'),
    ]
    
    BILLING_CHOICES = [
        ('monthly', 'Monatlich'),
        ('yearly', 'Jährlich'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='agent')
    company = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='basic')
    billing_cycle = models.CharField(max_length=20, choices=BILLING_CHOICES, default='monthly')
    plan_change_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

class UserSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    refresh_token = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'user_sessions'
```

## Pydantic Models

```python
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    manager = "manager"
    agent = "agent"
    assistant = "assistant"

class UserPlan(str, Enum):
    basic = "basic"
    premium = "premium"
    enterprise = "enterprise"

class BillingCycle(str, Enum):
    monthly = "monthly"
    yearly = "yearly"

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserRegistrationRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: UserRole = UserRole.agent
    company: Optional[str] = None
    phone: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: UserRole
    company: Optional[str]
    phone: Optional[str]
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    plan: UserPlan
    billing_cycle: BillingCycle
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class PlanChangeRequest(BaseModel):
    plan: UserPlan
    billing_cycle: BillingCycle
```

## FastAPI Endpoints

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password, make_password
from datetime import datetime, timedelta
import jwt
from typing import Optional

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer()

# JWT Settings
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 30

@router.post("/login", response_model=TokenResponse)
def login(request: UserLoginRequest):
    """
    Benutzer-Login mit Email und Passwort
    """
    try:
        user = User.objects.get(email=request.email, is_active=True)
        if not check_password(request.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Ungültige Anmeldedaten"
            )
        
        # Update last login
        user.last_login = datetime.now()
        user.save()
        
        # Generate tokens
        access_token = create_access_token({"user_id": str(user.id)})
        refresh_token = create_refresh_token({"user_id": str(user.id)})
        
        # Save refresh token
        UserSession.objects.create(
            user=user,
            refresh_token=refresh_token,
            expires_at=datetime.now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.from_orm(user)
        )
        
    except User.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültige Anmeldedaten"
        )

@router.post("/register", response_model=UserResponse)
def register(request: UserRegistrationRequest):
    """
    Neuen Benutzer registrieren
    """
    if User.objects.filter(email=request.email).exists():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email bereits registriert"
        )
    
    user = User.objects.create(
        email=request.email,
        password=make_password(request.password),
        first_name=request.first_name,
        last_name=request.last_name,
        role=request.role,
        company=request.company,
        phone=request.phone
    )
    
    return UserResponse.from_orm(user)

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshTokenRequest):
    """
    Access Token mit Refresh Token erneuern
    """
    try:
        payload = jwt.decode(request.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        
        session = UserSession.objects.get(
            refresh_token=request.refresh_token,
            is_active=True,
            expires_at__gt=datetime.now()
        )
        
        user = User.objects.get(id=user_id, is_active=True)
        
        # Generate new access token
        access_token = create_access_token({"user_id": str(user.id)})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=request.refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.from_orm(user)
        )
        
    except (jwt.InvalidTokenError, UserSession.DoesNotExist, User.DoesNotExist):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültiger Refresh Token"
        )

@router.post("/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Benutzer abmelden und Session invalidieren
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        
        # Deactivate all user sessions
        UserSession.objects.filter(user_id=user_id).update(is_active=False)
        
        return {"message": "Erfolgreich abgemeldet"}
        
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültiger Token"
        )

@router.get("/me", response_model=UserResponse)
def get_current_user(current_user: User = Depends(get_current_user)):
    """
    Aktuelle Benutzerinformationen abrufen
    """
    return UserResponse.from_orm(current_user)

@router.put("/change-password")
def change_password(
    request: PasswordChangeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Passwort ändern
    """
    if not check_password(request.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aktuelles Passwort ist falsch"
        )
    
    current_user.password = make_password(request.new_password)
    current_user.save()
    
    return {"message": "Passwort erfolgreich geändert"}

@router.put("/change-plan")
def change_plan(
    request: PlanChangeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Abonnement-Plan ändern
    """
    current_user.plan = request.plan
    current_user.billing_cycle = request.billing_cycle
    current_user.plan_change_date = datetime.now()
    current_user.save()
    
    return {"message": "Plan erfolgreich geändert"}

# Helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Ungültiger Token"
            )
        
        user = User.objects.get(id=user_id, is_active=True)
        return user
        
    except (jwt.InvalidTokenError, User.DoesNotExist):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültiger Token"
        )
```

## Beispiel-Requests und Antworten

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "serhat.weltberg@immobilien.de",
  "password": "securePassword123"
}

# Response (200)
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid-string",
    "email": "serhat.weltberg@immobilien.de",
    "first_name": "Serhat",
    "last_name": "Weltberg",
    "role": "admin"
  }
}
```

### Geschützte Anfrage
```bash
GET /api/auth/me
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Response (200)
{
  "id": "uuid-string",
  "email": "serhat.weltberg@immobilien.de",
  "first_name": "Serhat",
  "last_name": "Weltberg",
  "role": "admin",
  "company": "Immobilien GmbH",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

## Validierung & Fehlerbehandlung

### Status Codes
- **200**: Erfolgreiche Anfrage
- **201**: Benutzer erfolgreich erstellt
- **400**: Ungültige Eingabedaten
- **401**: Nicht authentifiziert / Ungültige Anmeldedaten
- **403**: Keine Berechtigung
- **404**: Benutzer nicht gefunden
- **422**: Validierungsfehler

### Fehler-Responses
```json
{
  "detail": "Ungültige Anmeldedaten"
}
```

### Validierungsregeln
- Email muss gültiges Format haben
- Passwort mindestens 8 Zeichen
- Alle Endpunkte außer Login/Register erfordern gültigen JWT-Token
- Refresh Token hat längere Gültigkeitsdauer (30 Tage)
- Access Token hat kurze Gültigkeitsdauer (1 Stunde)

### Permissions
- **admin**: Vollzugriff auf alle Funktionen
- **manager**: Zugriff auf Team-Management und Reports
- **agent**: Zugriff auf eigene Immobilien und Kontakte
- **assistant**: Nur Lesezugriff auf zugewiesene Bereiche

## Sicherheitshinweise
- Alle Passwörter werden mit Django's PBKDF2 gehasht
- JWT-Tokens enthalten keine sensiblen Daten
- Refresh Tokens werden in der Datenbank gespeichert und können invalidiert werden
- Session-Management für gleichzeitige Logins
- Rate Limiting für Login-Versuche empfohlen 