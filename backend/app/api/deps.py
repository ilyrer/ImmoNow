"""
API Dependencies
"""
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer

from app.core.security import get_current_user, get_tenant_id, TokenData
from app.core.rate_limit import check_rate_limit
from app.core.errors import ValidationError, NotFoundError, ForbiddenError


security = HTTPBearer()


def get_rate_limit_key(request: Request, current_user: TokenData = Depends(get_current_user)) -> str:
    """Get rate limit key for current user"""
    return f"{current_user.tenant_id}:{current_user.user_id}"


def require_read_scope(current_user: TokenData = Depends(get_current_user)) -> TokenData:
    """Require read scope"""
    if "read" not in current_user.scopes:
        raise ForbiddenError("Insufficient permissions. Required scope: read")
    return current_user


def require_write_scope(current_user: TokenData = Depends(get_current_user)) -> TokenData:
    """Require write scope"""
    if "write" not in current_user.scopes:
        raise ForbiddenError("Insufficient permissions. Required scope: write")
    return current_user


def require_delete_scope(current_user: TokenData = Depends(get_current_user)) -> TokenData:
    """Require delete scope"""
    if "delete" not in current_user.scopes:
        raise ForbiddenError("Insufficient permissions. Required scope: delete")
    return current_user


def require_admin_scope(current_user: TokenData = Depends(get_current_user)) -> TokenData:
    """Require admin scope"""
    if "admin" not in current_user.scopes:
        raise ForbiddenError("Insufficient permissions. Required scope: admin")
    return current_user


def require_employee_role(current_user: TokenData = Depends(get_current_user)) -> TokenData:
    """Require employee or admin role"""
    if current_user.role not in ["employee", "admin"]:
        raise ForbiddenError("Insufficient permissions. Required role: employee or admin")
    return current_user


def require_employee_access(current_user: TokenData = Depends(get_current_user)) -> TokenData:
    """Require employee access (employee, manager, or admin)"""
    if current_user.role not in ["employee", "manager", "admin"]:
        raise ForbiddenError("Insufficient permissions. Required role: employee, manager, or admin")
    return current_user


def require_manager_access(current_user: TokenData = Depends(get_current_user)) -> TokenData:
    """Require manager or admin access"""
    if current_user.role not in ["manager", "admin"]:
        raise ForbiddenError("Insufficient permissions. Required role: manager or admin")
    return current_user


def require_hr_access(current_user: TokenData = Depends(get_current_user)) -> TokenData:
    """Require HR access (employee, manager, admin, or owner)"""
    if current_user.role not in ["employee", "manager", "admin", "owner"]:
        raise ForbiddenError("Insufficient permissions. Required role: employee, manager, admin, or owner")
    return current_user


def apply_rate_limit(
    request: Request,
    current_user: TokenData = Depends(get_current_user)
) -> TokenData:
    """Apply rate limiting"""
    rate_limit_key = f"{current_user.tenant_id}:{current_user.user_id}"
    check_rate_limit(rate_limit_key)
    return current_user
