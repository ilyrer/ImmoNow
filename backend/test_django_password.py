"""
Test Django password hashing
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.hashers import make_password, check_password

# Test password
test_password = "TestPass123"

# Hash it
hashed = make_password(test_password)
print(f"Original password: {test_password}")
print(f"Hashed password: {hashed}")
print(f"Hash length: {len(hashed)}")

# Verify it
is_valid = check_password(test_password, hashed)
print(f"Verification result: {is_valid}")

# Test with wrong password
is_invalid = check_password("WrongPassword", hashed)
print(f"Wrong password verification: {is_invalid}")
