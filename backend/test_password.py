"""
Test password hashing to ensure bcrypt works correctly
"""
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Test password
test_password = "TestPass123"

# Hash it
hashed = pwd_context.hash(test_password)
print(f"Original password: {test_password}")
print(f"Hashed password: {hashed}")
print(f"Hash length: {len(hashed)}")

# Verify it
is_valid = pwd_context.verify(test_password, hashed)
print(f"Verification result: {is_valid}")

# Test with wrong password
is_invalid = pwd_context.verify("WrongPassword", hashed)
print(f"Wrong password verification: {is_invalid}")
