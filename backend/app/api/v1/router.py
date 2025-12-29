"""
Main API Router
"""

from fastapi import APIRouter

from app.api.v1 import (
    auth,
    profile,
    documents,
    tasks,
    boards,
    ai,
    ai_chat,
    employees,
    investor,
    cim,
    avm,
    locations,
    appointments,
    properties,
    contacts,
    analytics,
    communications,
    finance,
    tenant,
    notifications,
    llm,
    admin,
    plans,
    google_auth,
    payroll,
    employee_documents,
    energy_certificate,
    expose,
    admin_settings,
    publishing,
    billing,
    registration,
)

# Create main API router
api_router = APIRouter()

# Include auth router (no prefix, it has its own)
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(profile.router, tags=["Profile"])

# Include all domain routers
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(boards.router, prefix="/boards", tags=["boards"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(ai_chat.router, prefix="/ai", tags=["ai-chat"])
api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
api_router.include_router(investor.router, prefix="/investor", tags=["investor"])
api_router.include_router(cim.router, prefix="/cim", tags=["cim"])
api_router.include_router(avm.router, prefix="/avm", tags=["avm"])
api_router.include_router(locations.router, prefix="/locations", tags=["locations"])
api_router.include_router(
    appointments.router, prefix="/appointments", tags=["appointments"]
)
api_router.include_router(properties.router, prefix="/properties", tags=["properties"])
api_router.include_router(
    energy_certificate.router, prefix="/properties", tags=["energy-certificate"]
)
api_router.include_router(expose.router, prefix="/properties", tags=["expose"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(
    communications.router, prefix="/communications", tags=["communications"]
)
api_router.include_router(finance.router, prefix="/finance", tags=["finance"])
api_router.include_router(tenant.router, prefix="/tenant", tags=["tenant"])
api_router.include_router(
    notifications.router, prefix="/notifications", tags=["notifications"]
)
api_router.include_router(llm.router, prefix="/llm", tags=["llm"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(
    admin_settings.router, prefix="/api/v1", tags=["admin-settings"]
)
api_router.include_router(
    publishing.router, prefix="/api/v1/publishing", tags=["publishing"]
)
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
api_router.include_router(google_auth.router, prefix="/auth", tags=["google-auth"])
api_router.include_router(payroll.router, prefix="/payroll", tags=["payroll"])
api_router.include_router(
    employee_documents.router, prefix="/admin", tags=["admin-employee-documents"]
)
api_router.include_router(billing.router, tags=["billing"])
api_router.include_router(
    registration.router, prefix="/registration", tags=["registration"]
)
