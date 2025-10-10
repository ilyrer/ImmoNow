"""
Pagination Module
"""
from typing import List, TypeVar, Generic, Optional
from pydantic import BaseModel, Field
import math

T = TypeVar('T')


class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(1, ge=1, description="Page number (1-based)")
    size: int = Field(20, ge=1, le=100, description="Page size (max 100)")


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper"""
    items: List[T]
    total: int
    page: int
    size: int
    pages: int
    
    @classmethod
    def create(cls, items: List[T], total: int, page: int, size: int) -> "PaginatedResponse[T]":
        """Create paginated response"""
        pages = math.ceil(total / size) if total > 0 else 1
        return cls(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages
        )


class PageResponse(BaseModel, Generic[T]):
    """Alternative page response wrapper (alias for PaginatedResponse)"""
    items: List[T]
    total: int
    page: int
    size: int
    pages: int
    
    @classmethod
    def create(cls, items: List[T], total: int, page: int, size: int) -> "PageResponse[T]":
        """Create page response"""
        pages = math.ceil(total / size) if total > 0 else 1
        return cls(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages
        )


class SortParams(BaseModel):
    """Sorting parameters"""
    sort_by: Optional[str] = Field(None, description="Field to sort by")
    sort_order: str = Field("asc", pattern="^(asc|desc)$", description="Sort order")


def get_pagination_offset(page: int, size: int) -> int:
    """Calculate pagination offset"""
    return (page - 1) * size


def validate_sort_field(allowed_fields: List[str], sort_by: Optional[str]) -> Optional[str]:
    """Validate sort field against allowed fields"""
    if sort_by is None:
        return None
    
    if sort_by not in allowed_fields:
        raise ValueError(f"Invalid sort field: {sort_by}. Allowed fields: {allowed_fields}")
    
    return sort_by
