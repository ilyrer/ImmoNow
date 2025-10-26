"""
Main API Router
"""
from fastapi import APIRouter

from app.api.v1 import (
    auth,
    documents,
    tasks,
    employees,
    investor,
    cim,
    avm,
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
    portal_oauth,
    hr,
    dsgvo,
    publishing,
    billing,
    registration,
    profile,
    test_email,
    team_performance,
    market,
    social,
    users,
    storage,
    property_metrics,
    hooks,
)

# Create main API router
api_router = APIRouter()

# Include auth router (no prefix, it has its own)
api_router.include_router(auth.router, tags=["Authentication"])

# Include all domain routers
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(employees.router, prefix="/admin", tags=["admin-employees"])
api_router.include_router(investor.router, prefix="/investor", tags=["investor"])
api_router.include_router(cim.router, prefix="/cim", tags=["cim"])
api_router.include_router(avm.router, prefix="/avm", tags=["avm"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
api_router.include_router(properties.router, prefix="/properties", tags=["properties"])
api_router.include_router(energy_certificate.router, prefix="/properties", tags=["energy-certificate"])
api_router.include_router(expose.router, prefix="/properties", tags=["expose"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(communications.router, prefix="/communications", tags=["communications"])
api_router.include_router(finance.router, prefix="/finance", tags=["finance"])
api_router.include_router(tenant.router, prefix="/tenant", tags=["tenant"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(storage.router, prefix="/storage", tags=["storage"])
api_router.include_router(dsgvo.router, prefix="/dsgvo", tags=["dsgvo"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(llm.router, prefix="/llm", tags=["llm"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(admin_settings.router, prefix="/api/v1", tags=["admin-settings"])
api_router.include_router(publishing.router, prefix="/api/v1/publishing", tags=["publishing"])
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
api_router.include_router(google_auth.router, prefix="/auth", tags=["google-auth"])
api_router.include_router(payroll.router, prefix="/admin", tags=["admin-payroll"])
api_router.include_router(employee_documents.router, prefix="/admin", tags=["admin-employee-documents"])
api_router.include_router(billing.router)
api_router.include_router(registration.router)
api_router.include_router(profile.router, tags=["profile"])
api_router.include_router(test_email.router, prefix="/test", tags=["test-email"])
api_router.include_router(team_performance.router, prefix="/team", tags=["team"])
api_router.include_router(market.router, prefix="/market", tags=["market"])
api_router.include_router(social.router, prefix="/social", tags=["social"])
api_router.include_router(property_metrics.router, prefix="/analytics", tags=["property-metrics"])
api_router.include_router(portal_oauth.router, prefix="/portals", tags=["portal-oauth"])
api_router.include_router(hr.router, prefix="/hr" , tags=["hr-management"])
