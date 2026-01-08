"""
Custom Field Service
Verwaltet Custom Fields und deren Values
"""
from typing import List, Optional, Dict, Any
from asgiref.sync import sync_to_async
import logging

from app.db.models import CustomField, CustomFieldValue
from app.core.errors import ValidationError, NotFoundError

logger = logging.getLogger(__name__)


class CustomFieldService:
    """Service für Custom Field-Management"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def create_custom_field(
        self,
        name: str,
        key: str,
        field_type: str,
        resource_type: str = "task",
        description: Optional[str] = None,
        required: bool = False,
        default_value: Optional[str] = None,
        options: Optional[List[str]] = None,
        created_by_id: Optional[str] = None,
    ) -> CustomField:
        """Erstellt neues Custom Field"""
        
        # Validiere field_type
        valid_types = ["text", "number", "date", "dropdown", "checkbox", "user"]
        if field_type not in valid_types:
            raise ValidationError(f"Invalid field_type: {field_type}")
        
        # Validiere resource_type
        valid_resource_types = ["task", "property"]
        if resource_type not in valid_resource_types:
            raise ValidationError(f"Invalid resource_type: {resource_type}")
        
        # Prüfe ob Key bereits existiert
        existing = await self._get_custom_field_by_key(key, resource_type)
        if existing:
            raise ValidationError(f"Custom field with key '{key}' already exists for {resource_type}")
        
        @sync_to_async
        def create():
            from app.db.models import User
            
            created_by = None
            if created_by_id:
                try:
                    created_by = User.objects.get(id=created_by_id)
                except User.DoesNotExist:
                    pass
            
            return CustomField.objects.create(
                tenant_id=self.tenant_id,
                name=name,
                key=key,
                field_type=field_type,
                resource_type=resource_type,
                description=description,
                required=required,
                default_value=default_value,
                options=options or [],
                created_by=created_by,
                is_active=True,
            )
        
        return await create()
    
    async def get_custom_fields(
        self,
        resource_type: Optional[str] = None,
        is_active: Optional[bool] = True
    ) -> List[CustomField]:
        """Holt alle Custom Fields für Tenant"""
        
        @sync_to_async
        def fetch():
            queryset = CustomField.objects.filter(tenant_id=self.tenant_id)
            
            if resource_type:
                queryset = queryset.filter(resource_type=resource_type)
            
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active)
            
            return list(queryset.order_by("order", "name"))
        
        return await fetch()
    
    async def get_custom_field(self, field_id: str) -> Optional[CustomField]:
        """Holt einzelnes Custom Field"""
        
        @sync_to_async
        def fetch():
            try:
                return CustomField.objects.get(id=field_id, tenant_id=self.tenant_id)
            except CustomField.DoesNotExist:
                return None
        
        return await fetch()
    
    async def update_custom_field(
        self,
        field_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        required: Optional[bool] = None,
        default_value: Optional[str] = None,
        options: Optional[List[str]] = None,
        is_active: Optional[bool] = None,
        order: Optional[int] = None,
    ) -> Optional[CustomField]:
        """Aktualisiert Custom Field"""
        
        @sync_to_async
        def update():
            try:
                field = CustomField.objects.get(id=field_id, tenant_id=self.tenant_id)
            except CustomField.DoesNotExist:
                return None
            
            if name is not None:
                field.name = name
            if description is not None:
                field.description = description
            if required is not None:
                field.required = required
            if default_value is not None:
                field.default_value = default_value
            if options is not None:
                field.options = options
            if is_active is not None:
                field.is_active = is_active
            if order is not None:
                field.order = order
            
            field.save()
            return field
        
        return await update()
    
    async def delete_custom_field(self, field_id: str) -> bool:
        """Löscht Custom Field (und alle Values)"""
        
        @sync_to_async
        def delete():
            try:
                field = CustomField.objects.get(id=field_id, tenant_id=self.tenant_id)
                field.delete()  # Cascade löscht auch CustomFieldValues
                return True
            except CustomField.DoesNotExist:
                return False
        
        return await delete()
    
    async def set_custom_field_value(
        self,
        field_id: str,
        resource_type: str,
        resource_id: str,
        value: Optional[str] = None,
    ) -> CustomFieldValue:
        """Setzt Custom Field Value für Resource"""
        
        field = await self.get_custom_field(field_id)
        if not field:
            raise NotFoundError(f"Custom field {field_id} not found")
        
        if field.resource_type != resource_type:
            raise ValidationError(f"Custom field is for {field.resource_type}, not {resource_type}")
        
        # Validiere Value basierend auf field_type
        if value is not None:
            self._validate_field_value(field, value)
        
        @sync_to_async
        def create_or_update():
            value_obj, created = CustomFieldValue.objects.update_or_create(
                custom_field=field,
                resource_type=resource_type,
                resource_id=resource_id,
                tenant_id=self.tenant_id,
                defaults={"value": value or field.default_value or ""}
            )
            return value_obj
        
        return await create_or_update()
    
    async def get_custom_field_values(
        self,
        resource_type: str,
        resource_id: str
    ) -> Dict[str, Any]:
        """Holt alle Custom Field Values für Resource"""
        
        @sync_to_async
        def fetch():
            values = CustomFieldValue.objects.filter(
                tenant_id=self.tenant_id,
                resource_type=resource_type,
                resource_id=resource_id
            ).select_related("custom_field")
            
            result = {}
            for value_obj in values:
                field = value_obj.custom_field
                if field.is_active:
                    # Konvertiere Value basierend auf field_type
                    converted_value = self._convert_field_value(field, value_obj.value)
                    result[field.key] = {
                        "field_id": str(field.id),
                        "field_name": field.name,
                        "field_type": field.field_type,
                        "value": converted_value,
                    }
            
            return result
        
        return await fetch()
    
    async def delete_custom_field_value(
        self,
        field_id: str,
        resource_type: str,
        resource_id: str
    ) -> bool:
        """Löscht Custom Field Value"""
        
        @sync_to_async
        def delete():
            try:
                value = CustomFieldValue.objects.get(
                    custom_field_id=field_id,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    tenant_id=self.tenant_id
                )
                value.delete()
                return True
            except CustomFieldValue.DoesNotExist:
                return False
        
        return await delete()
    
    def _validate_field_value(self, field: CustomField, value: str) -> None:
        """Validiert Field Value basierend auf field_type"""
        if field.field_type == "number":
            try:
                float(value)
            except ValueError:
                raise ValidationError(f"Value must be a number for field {field.name}")
        
        elif field.field_type == "date":
            # Basic date validation (kann erweitert werden)
            if not value:
                return
            # Prüfe ISO-Format
            try:
                from datetime import datetime
                datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                raise ValidationError(f"Value must be a valid date (ISO format) for field {field.name}")
        
        elif field.field_type == "dropdown":
            if value not in field.options:
                raise ValidationError(f"Value must be one of {field.options} for field {field.name}")
        
        elif field.field_type == "checkbox":
            if value not in ["true", "false", "1", "0", ""]:
                raise ValidationError(f"Value must be true/false for checkbox field {field.name}")
    
    def _convert_field_value(self, field: CustomField, value: str) -> Any:
        """Konvertiert Field Value basierend auf field_type"""
        if not value:
            return None
        
        if field.field_type == "number":
            try:
                return float(value) if "." in value else int(value)
            except ValueError:
                return value
        
        elif field.field_type == "checkbox":
            return value.lower() in ["true", "1", "yes"]
        
        elif field.field_type == "date":
            return value  # Als String zurückgeben
        
        return value  # Text, dropdown, user als String
    
    async def _get_custom_field_by_key(
        self,
        key: str,
        resource_type: str
    ) -> Optional[CustomField]:
        """Holt Custom Field nach Key"""
        
        @sync_to_async
        def fetch():
            try:
                return CustomField.objects.get(
                    tenant_id=self.tenant_id,
                    key=key,
                    resource_type=resource_type
                )
            except CustomField.DoesNotExist:
                return None
        
        return await fetch()

