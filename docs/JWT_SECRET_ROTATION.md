# JWT Secret Key Rotation Guide

## Overview

This guide explains how to securely rotate JWT secret keys in the ImmoNow system to maintain security best practices.

## Security Requirements

- **Minimum Length**: 64 characters
- **Character Set**: URL-safe base64 (A-Z, a-z, 0-9, -, _)
- **Generation Method**: Cryptographically secure random generation
- **Storage**: Environment variables only (never in code)

## Current Implementation

The system validates JWT secret keys on startup and will refuse to start with weak keys.

### Validation Rules

1. **Length Check**: Must be at least 64 characters
2. **Pattern Check**: Rejects common weak patterns:
   - `jwt-secret-change-me`
   - `your-jwt-secret-key`
   - `secret`, `password`, `123456`, `changeme`

## Rotation Process

### Step 1: Generate New Secret

```bash
# Option 1: Using Django management command
python manage.py generate_jwt_secret

# Option 2: Using Python directly
python -c 'import secrets; print(secrets.token_urlsafe(64))'

# Option 3: Using OpenSSL
openssl rand -base64 48
```

### Step 2: Update Environment Variables

```bash
# Update your .env file
JWT_SECRET_KEY=your-new-64-character-secret-key-here

# Or update production environment
export JWT_SECRET_KEY=your-new-64-character-secret-key-here
```

### Step 3: Restart Application

```bash
# For development
python main.py

# For production (Docker)
docker-compose restart backend

# For production (systemd)
sudo systemctl restart immonow-backend
```

## Impact of Rotation

### Immediate Effects

- **All existing JWT tokens become invalid**
- **Users will be logged out automatically**
- **Frontend will redirect to login page**

### User Experience

- Users will see "Token expired" message
- Automatic redirect to login page
- No data loss (tokens are stateless)

## Rollback Procedure

If rotation causes issues:

1. **Revert to old secret**:
   ```bash
   JWT_SECRET_KEY=old-secret-key-here
   ```

2. **Restart application**:
   ```bash
   docker-compose restart backend
   ```

3. **Users can log in again** with old tokens

## Best Practices

### Regular Rotation Schedule

- **Development**: Rotate monthly
- **Staging**: Rotate quarterly  
- **Production**: Rotate every 6 months or after security incidents

### Emergency Rotation

Rotate immediately if:
- Secret key is compromised
- Security breach detected
- Employee with access leaves company

### Monitoring

Monitor for:
- Increased login failures after rotation
- Token validation errors
- User complaints about unexpected logouts

## Security Considerations

### Key Storage

- ✅ Store in environment variables
- ✅ Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- ❌ Never store in code or configuration files
- ❌ Never commit to version control

### Key Distribution

- Use secure channels for key distribution
- Rotate keys on all environments simultaneously
- Maintain separate keys per environment

### Backup Strategy

- Keep previous key for 24-48 hours after rotation
- Document rotation dates and reasons
- Maintain audit trail of all rotations

## Troubleshooting

### Common Issues

1. **Application won't start**:
   - Check JWT_SECRET_KEY length (must be ≥64 chars)
   - Verify no weak patterns in key
   - Check environment variable loading

2. **Users can't log in**:
   - Verify new secret is loaded correctly
   - Check for typos in environment variable
   - Confirm application restart completed

3. **Token validation errors**:
   - Ensure secret is consistent across all instances
   - Check for encoding issues
   - Verify algorithm matches (HS256)

### Debug Commands

```bash
# Check current secret length
python -c "import os; print(f'Secret length: {len(os.getenv(\"JWT_SECRET_KEY\", \"\"))}')"

# Validate secret strength
python -c "
import os
secret = os.getenv('JWT_SECRET_KEY', '')
print(f'Length: {len(secret)}')
print(f'Valid: {len(secret) >= 64}')
"

# Test token generation
python manage.py shell -c "
from app.services.auth_service import AuthService
print('JWT service initialized successfully')
"
```

## Implementation Details

### Settings Validation

The system uses Pydantic field validation to ensure JWT secret strength:

```python
@field_validator('JWT_SECRET_KEY')
@classmethod
def validate_jwt_secret(cls, v):
    if len(v) < 64:
        raise ValueError("JWT_SECRET_KEY must be at least 64 characters")
    # Additional validation...
    return v
```

### Management Command

The `generate_jwt_secret` command provides:

- Cryptographically secure key generation
- Configurable length (default: 64 chars)
- Output formatting for easy copying
- Security warnings and best practices

### Error Handling

The application will:
- Fail fast on startup with weak secrets
- Provide clear error messages
- Suggest remediation steps
- Log security violations

## Compliance

### Security Standards

- **OWASP**: Follows secure key management practices
- **NIST**: Meets minimum entropy requirements
- **ISO 27001**: Implements proper key lifecycle management

### Audit Requirements

- Document all key rotations
- Maintain rotation schedule
- Track security incidents
- Regular security reviews

## Related Documentation

- [Security Audit Report](SECURITY_AUDIT.md)
- [Environment Configuration](OPERATIONS.md)
- [Deployment Guide](OPERATIONS.md)
- [Incident Response](SECOPS_RUNBOOK.md)
