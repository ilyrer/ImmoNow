"""
Appointments Service
"""
from typing import Optional, List, Tuple
from datetime import datetime
from django.db import models
from django.contrib.auth.models import User

from app.db.models import Appointment, Attendee
from app.schemas.appointments import (
    AppointmentResponse, CreateAppointmentRequest, UpdateAppointmentRequest,
    Attendee as AttendeeSchema
)
from app.core.errors import NotFoundError
from app.services.audit import AuditService


class AppointmentsService:
    """Appointments service for business logic"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_appointments(
        self,
        offset: int = 0,
        limit: int = 20,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        type: Optional[str] = None,
        status: Optional[str] = None,
        property_id: Optional[str] = None,
        contact_id: Optional[str] = None
    ) -> Tuple[List[AppointmentResponse], int]:
        """Get appointments with filters and pagination"""
        
        queryset = Appointment.objects.filter(tenant_id=self.tenant_id)
        
        # Apply filters
        if start_date:
            queryset = queryset.filter(start_datetime__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(end_datetime__lte=end_date)
        
        if type:
            queryset = queryset.filter(type=type)
        
        if status:
            queryset = queryset.filter(status=status)
        
        if property_id:
            queryset = queryset.filter(property_id=property_id)
        
        if contact_id:
            queryset = queryset.filter(contact_id=contact_id)
        
        # Order by start time
        queryset = queryset.order_by('start_datetime')
        
        total = queryset.count()
        appointments = list(queryset[offset:offset + limit])
        
        return [await self._build_appointment_response(appointment) for appointment in appointments], total
    
    async def get_appointment(self, appointment_id: str) -> Optional[AppointmentResponse]:
        """Get a specific appointment"""
        
        try:
            appointment = Appointment.objects.get(id=appointment_id, tenant_id=self.tenant_id)
            return await self._build_appointment_response(appointment)
        except Appointment.DoesNotExist:
            return None
    
    async def create_appointment(
        self, 
        appointment_data: CreateAppointmentRequest, 
        created_by_id: str
    ) -> AppointmentResponse:
        """Create a new appointment"""
        
        user = User.objects.get(id=created_by_id)
        
        appointment = Appointment.objects.create(
            tenant_id=self.tenant_id,
            title=appointment_data.title,
            description=appointment_data.description,
            type=appointment_data.type,
            start_datetime=appointment_data.start_datetime,
            end_datetime=appointment_data.end_datetime,
            location=appointment_data.location,
            property_id=appointment_data.property_id,
            contact_id=appointment_data.contact_id,
            created_by=user
        )
        
        # Create attendees
        for attendee_data in appointment_data.attendees:
            Attendee.objects.create(
                appointment=appointment,
                name=attendee_data['name'],
                email=attendee_data['email'],
                role=attendee_data.get('role'),
                status=attendee_data.get('status', 'pending')
            )
        
        # Audit log
        AuditService.audit_action(
            user=user,
            action="create",
            resource_type="appointment",
            resource_id=str(appointment.id),
            new_values={"title": appointment.title, "type": appointment.type}
        )
        
        return await self._build_appointment_response(appointment)
    
    async def update_appointment(
        self, 
        appointment_id: str, 
        appointment_data: UpdateAppointmentRequest, 
        updated_by_id: str
    ) -> Optional[AppointmentResponse]:
        """Update an appointment"""
        
        try:
            appointment = Appointment.objects.get(id=appointment_id, tenant_id=self.tenant_id)
        except Appointment.DoesNotExist:
            return None
        
        user = User.objects.get(id=updated_by_id)
        
        # Store old values for audit
        old_values = {
            "title": appointment.title,
            "status": appointment.status,
            "type": appointment.type
        }
        
        # Update fields
        update_data = appointment_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field != 'attendees':
                setattr(appointment, field, value)
        
        appointment.save()
        
        # Update attendees if provided
        if 'attendees' in update_data:
            # Clear existing attendees
            appointment.attendees.all().delete()
            
            # Create new attendees
            for attendee_data in update_data['attendees']:
                Attendee.objects.create(
                    appointment=appointment,
                    name=attendee_data['name'],
                    email=attendee_data['email'],
                    role=attendee_data.get('role'),
                    status=attendee_data.get('status', 'pending')
                )
        
        # Audit log
        AuditService.audit_action(
            user=user,
            action="update",
            resource_type="appointment",
            resource_id=appointment_id,
            old_values=old_values,
            new_values=update_data
        )
        
        return await self._build_appointment_response(appointment)
    
    async def delete_appointment(self, appointment_id: str, deleted_by_id: str) -> None:
        """Delete an appointment"""
        
        try:
            appointment = Appointment.objects.get(id=appointment_id, tenant_id=self.tenant_id)
        except Appointment.DoesNotExist:
            raise NotFoundError("Appointment not found")
        
        user = User.objects.get(id=deleted_by_id)
        
        # Audit log
        AuditService.audit_action(
            user=user,
            action="delete",
            resource_type="appointment",
            resource_id=appointment_id,
            old_values={"title": appointment.title, "type": appointment.type}
        )
        
        appointment.delete()
    
    async def _build_appointment_response(self, appointment: Appointment) -> AppointmentResponse:
        """Build AppointmentResponse from Appointment model"""
        
        # Get attendees
        attendees = []
        for attendee in appointment.attendees.all():
            attendees.append(AttendeeSchema(
                id=str(attendee.id),
                name=attendee.name,
                email=attendee.email,
                role=attendee.role,
                status=attendee.status
            ))
        
        return AppointmentResponse(
            id=str(appointment.id),
            title=appointment.title,
            description=appointment.description,
            type=appointment.type,
            status=appointment.status,
            start_datetime=appointment.start_datetime,
            end_datetime=appointment.end_datetime,
            location=appointment.location,
            attendees=attendees,
            property_id=str(appointment.property_id) if appointment.property_id else None,
            property_title=appointment.property_title,
            contact_id=str(appointment.contact_id) if appointment.contact_id else None,
            contact_name=appointment.contact_name,
            created_at=appointment.created_at,
            updated_at=appointment.updated_at,
            created_by=str(appointment.created_by.id)
        )
