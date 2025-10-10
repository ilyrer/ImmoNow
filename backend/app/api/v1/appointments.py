"""
Appointments API Endpoints
"""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query

from app.api.deps import (
    require_read_scope, require_write_scope, require_delete_scope,
    get_tenant_id
)
from app.core.security import TokenData
from app.core.errors import NotFoundError
from app.schemas.appointments import (
    AppointmentResponse, AppointmentListResponse,
    CreateAppointmentRequest, UpdateAppointmentRequest
)
from app.schemas.common import PaginatedResponse
from app.core.pagination import PaginationParams, get_pagination_offset
from app.services.appointments_service import AppointmentsService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[AppointmentResponse])
async def get_appointments(
    pagination: PaginationParams = Depends(),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    type: Optional[str] = Query(None, description="Appointment type filter"),
    status: Optional[str] = Query(None, description="Status filter"),
    property_id: Optional[str] = Query(None, description="Property ID filter"),
    contact_id: Optional[str] = Query(None, description="Contact ID filter"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get paginated list of appointments with filters"""
    
    # Calculate pagination offset
    offset = get_pagination_offset(pagination.page, pagination.size)
    
    # Get appointments from service
    appointments_service = AppointmentsService(tenant_id)
    appointments, total = await appointments_service.get_appointments(
        offset=offset,
        limit=pagination.size,
        start_date=start_date,
        end_date=end_date,
        type=type,
        status=status,
        property_id=property_id,
        contact_id=contact_id
    )
    
    return PaginatedResponse.create(
        items=appointments,
        total=total,
        page=pagination.page,
        size=pagination.size
    )


@router.post("", response_model=AppointmentResponse, status_code=201)
async def create_appointment(
    appointment_data: CreateAppointmentRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new appointment"""
    
    appointments_service = AppointmentsService(tenant_id)
    appointment = await appointments_service.create_appointment(
        appointment_data, current_user.user_id
    )
    
    return appointment


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get a specific appointment"""
    
    appointments_service = AppointmentsService(tenant_id)
    appointment = await appointments_service.get_appointment(appointment_id)
    
    if not appointment:
        raise NotFoundError("Appointment not found")
    
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: str,
    appointment_data: UpdateAppointmentRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update an appointment"""
    
    appointments_service = AppointmentsService(tenant_id)
    appointment = await appointments_service.update_appointment(
        appointment_id, appointment_data, current_user.user_id
    )
    
    if not appointment:
        raise NotFoundError("Appointment not found")
    
    return appointment


@router.delete("/{appointment_id}", status_code=204)
async def delete_appointment(
    appointment_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete an appointment"""
    
    appointments_service = AppointmentsService(tenant_id)
    await appointments_service.delete_appointment(appointment_id, current_user.user_id)
