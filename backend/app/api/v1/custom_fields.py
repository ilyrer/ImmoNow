"""
Custom Fields API Endpoints
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status

from app.api.deps import require_read_scope, require_write_scope, get_tenant_id
from app.core.security import TokenData
from app.core.errors import NotFoundError
from app.schemas.custom_fields import (
    CustomFieldResponse,
    CreateCustomFieldRequest,
    UpdateCustomFieldRequest,
    CustomFieldValueResponse,
    SetCustomFieldValueRequest,
    ResourceCustomFieldsResponse,
)
from app.services.custom_fields import CustomFieldService

router = APIRouter()


@router.get("", response_model=List[CustomFieldResponse])
async def list_custom_fields(
    resource_type: str = "task",
    is_active: bool = True,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Liste aller Custom Fields für Tenant"""
    
    service = CustomFieldService(tenant_id)
    fields = await service.get_custom_fields(resource_type=resource_type, is_active=is_active)
    
    result = []
    for field in fields:
        result.append(CustomFieldResponse(
            id=str(field.id),
            name=field.name,
            key=field.key,
            field_type=field.field_type,
            resource_type=field.resource_type,
            description=field.description,
            required=field.required,
            default_value=field.default_value,
            options=field.options,
            created_by=str(field.created_by.id) if field.created_by else None,
            created_at=field.created_at,
            updated_at=field.updated_at,
            is_active=field.is_active,
            order=field.order,
        ))
    
    return result


@router.post("", response_model=CustomFieldResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_field(
    field_data: CreateCustomFieldRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Erstellt neues Custom Field"""
    
    service = CustomFieldService(tenant_id)
    field = await service.create_custom_field(
        name=field_data.name,
        key=field_data.key,
        field_type=field_data.field_type,
        resource_type=field_data.resource_type,
        description=field_data.description,
        required=field_data.required,
        default_value=field_data.default_value,
        options=field_data.options,
        created_by_id=current_user.user_id,
    )
    
    return CustomFieldResponse(
        id=str(field.id),
        name=field.name,
        key=field.key,
        field_type=field.field_type,
        resource_type=field.resource_type,
        description=field.description,
        required=field.required,
        default_value=field.default_value,
        options=field.options,
        created_by=str(field.created_by.id) if field.created_by else None,
        created_at=field.created_at,
        updated_at=field.updated_at,
        is_active=field.is_active,
        order=field.order,
    )


@router.get("/{field_id}", response_model=CustomFieldResponse)
async def get_custom_field(
    field_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Holt einzelnes Custom Field"""
    
    service = CustomFieldService(tenant_id)
    field = await service.get_custom_field(field_id)
    
    if not field:
        raise NotFoundError("Custom field not found")
    
    return CustomFieldResponse(
        id=str(field.id),
        name=field.name,
        key=field.key,
        field_type=field.field_type,
        resource_type=field.resource_type,
        description=field.description,
        required=field.required,
        default_value=field.default_value,
        options=field.options,
        created_by=str(field.created_by.id) if field.created_by else None,
        created_at=field.created_at,
        updated_at=field.updated_at,
        is_active=field.is_active,
        order=field.order,
    )


@router.put("/{field_id}", response_model=CustomFieldResponse)
async def update_custom_field(
    field_id: str,
    field_data: UpdateCustomFieldRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Aktualisiert Custom Field"""
    
    service = CustomFieldService(tenant_id)
    field = await service.update_custom_field(
        field_id=field_id,
        name=field_data.name,
        description=field_data.description,
        required=field_data.required,
        default_value=field_data.default_value,
        options=field_data.options,
        is_active=field_data.is_active,
        order=field_data.order,
    )
    
    if not field:
        raise NotFoundError("Custom field not found")
    
    return CustomFieldResponse(
        id=str(field.id),
        name=field.name,
        key=field.key,
        field_type=field.field_type,
        resource_type=field.resource_type,
        description=field.description,
        required=field.required,
        default_value=field.default_value,
        options=field.options,
        created_by=str(field.created_by.id) if field.created_by else None,
        created_at=field.created_at,
        updated_at=field.updated_at,
        is_active=field.is_active,
        order=field.order,
    )


@router.delete("/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_custom_field(
    field_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Löscht Custom Field"""
    
    service = CustomFieldService(tenant_id)
    deleted = await service.delete_custom_field(field_id)
    
    if not deleted:
        raise NotFoundError("Custom field not found")


@router.get("/resources/{resource_type}/{resource_id}", response_model=ResourceCustomFieldsResponse)
async def get_resource_custom_fields(
    resource_type: str,
    resource_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Holt alle Custom Field Values für Resource"""
    
    service = CustomFieldService(tenant_id)
    values = await service.get_custom_field_values(resource_type, resource_id)
    
    # Konvertiere zu Response
    field_responses = {}
    for key, value_data in values.items():
        field_responses[key] = CustomFieldValueResponse(
            field_id=value_data["field_id"],
            field_name=value_data["field_name"],
            field_type=value_data["field_type"],
            value=value_data["value"],
        )
    
    return ResourceCustomFieldsResponse(
        resource_type=resource_type,
        resource_id=resource_id,
        fields=field_responses,
    )


@router.post("/resources/{resource_type}/{resource_id}/values", response_model=CustomFieldValueResponse)
async def set_custom_field_value(
    resource_type: str,
    resource_id: str,
    value_data: SetCustomFieldValueRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Setzt Custom Field Value für Resource"""
    
    service = CustomFieldService(tenant_id)
    value_obj = await service.set_custom_field_value(
        field_id=value_data.field_id,
        resource_type=resource_type,
        resource_id=resource_id,
        value=value_data.value,
    )
    
    return CustomFieldValueResponse(
        field_id=str(value_obj.custom_field.id),
        field_name=value_obj.custom_field.name,
        field_type=value_obj.custom_field.field_type,
        value=service._convert_field_value(value_obj.custom_field, value_obj.value),
    )


@router.delete("/resources/{resource_type}/{resource_id}/values/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_custom_field_value(
    resource_type: str,
    resource_id: str,
    field_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Löscht Custom Field Value"""
    
    service = CustomFieldService(tenant_id)
    deleted = await service.delete_custom_field_value(field_id, resource_type, resource_id)
    
    if not deleted:
        raise NotFoundError("Custom field value not found")

