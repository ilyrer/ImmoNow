"""
Contacts API Endpoints
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query

from app.api.deps import (
    require_read_scope,
    require_write_scope,
    require_delete_scope,
    get_tenant_id,
)
from app.core.security import TokenData
from app.core.errors import NotFoundError
from app.schemas.contacts import (
    ContactResponse,
    ContactListResponse,
    CreateContactRequest,
    UpdateContactRequest,
    LeadScoreResponse,
    AiInsightsResponse,
    NextActionRequest,
    NextActionResponse,
)
from app.schemas.common import PaginatedResponse
from app.schemas.properties import PropertyResponse
from app.core.pagination import (
    PaginationParams,
    get_pagination_offset,
    validate_sort_field,
)
from app.services.contacts_service import ContactsService
from app.services.lead_scoring import LeadScoringService
from app.services.llm_service import LLMService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ContactResponse])
async def get_contacts(
    pagination: PaginationParams = Depends(),
    search: Optional[str] = Query(None, description="Search term"),
    status: Optional[str] = Query(None, description="Status filter"),
    company: Optional[str] = Query(None, description="Company filter"),
    min_budget: Optional[float] = Query(None, description="Minimum budget filter"),
    max_budget: Optional[float] = Query(None, description="Maximum budget filter"),
    sort_by: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """Get paginated list of contacts with filters"""

    # Validate sort field
    allowed_sort_fields = ["created_at", "name", "email", "lead_score", "budget_min"]
    sort_by = validate_sort_field(allowed_sort_fields, sort_by)

    # Calculate pagination offset
    offset = get_pagination_offset(pagination.page, pagination.size)

    # Get contacts from service
    contacts_service = ContactsService(tenant_id)
    contacts, total = await contacts_service.get_contacts(
        offset=offset,
        limit=pagination.size,
        search=search,
        status=status,
        company=company,
        min_budget=min_budget,
        max_budget=max_budget,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    return PaginatedResponse.create(
        items=contacts, total=total, page=pagination.page, size=pagination.size
    )


@router.post("", response_model=ContactResponse, status_code=201)
async def create_contact(
    contact_data: CreateContactRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """Create a new contact"""

    contacts_service = ContactsService(tenant_id)
    contact = await contacts_service.create_contact(contact_data)

    return contact


@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """Get a specific contact"""

    contacts_service = ContactsService(tenant_id)
    contact = await contacts_service.get_contact(contact_id)

    if not contact:
        raise NotFoundError("Contact not found")

    return contact


@router.put("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: str,
    contact_data: UpdateContactRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """Update a contact"""

    contacts_service = ContactsService(tenant_id)
    contact = await contacts_service.update_contact(contact_id, contact_data)

    if not contact:
        raise NotFoundError("Contact not found")

    return contact


@router.delete("/{contact_id}", status_code=204)
async def delete_contact(
    contact_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """Delete a contact"""

    contacts_service = ContactsService(tenant_id)
    await contacts_service.delete_contact(contact_id)


@router.get("/{contact_id}/matching-properties", response_model=List[PropertyResponse])
async def get_contact_matching_properties(
    contact_id: str,
    limit: int = Query(
        10, ge=1, le=50, description="Maximum number of matching properties"
    ),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """Get matching properties for a contact based on their budget and preferences"""

    contacts_service = ContactsService(tenant_id)

    # Get the contact first
    contact = await contacts_service.get_contact(contact_id)
    if not contact:
        raise NotFoundError("Contact not found")

    # Get matching properties
    matching_properties = await contacts_service.get_matching_properties(
        contact_id, limit
    )

    return matching_properties


@router.get("/{contact_id}/lead-score", response_model=LeadScoreResponse)
async def get_contact_lead_score(
    contact_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Calculate and return lead score for a contact

    Returns score (0-100), category (kalt/warm/heiß), breakdown, and top signals
    """
    contacts_service = ContactsService(tenant_id)
    lead_scoring_service = LeadScoringService(tenant_id)

    # Get contact
    contact = await contacts_service.get_contact(contact_id)
    if not contact:
        raise NotFoundError("Contact not found")

    # Get activities for engagement scoring
    try:
        activities = await contacts_service.get_contact_activities(contact_id)
    except:
        activities = []

    # Calculate score
    score_data = lead_scoring_service.calculate_lead_score(
        contact_data=contact.dict() if hasattr(contact, "dict") else contact,
        activities=activities,
    )

    return LeadScoreResponse(**score_data)


@router.get("/{contact_id}/activities", response_model=List[Dict[str, Any]])
async def get_contact_activities(
    contact_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Return recent activities (appointments + tasks) for engagement/360 view.
    """
    contacts_service = ContactsService(tenant_id)
    activities = await contacts_service.get_contact_activities(contact_id)
    return activities


@router.get("/{contact_id}/ai-insights", response_model=AiInsightsResponse)
async def get_contact_ai_insights(
    contact_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Generate AI-powered insights for a contact

    Returns summary, score explanation, segment, and top signals
    """
    contacts_service = ContactsService(tenant_id)
    lead_scoring_service = LeadScoringService(tenant_id)
    llm_service = LLMService(tenant_id)

    # Get contact
    contact = await contacts_service.get_contact(contact_id)
    if not contact:
        raise NotFoundError("Contact not found")

    # Get activities
    try:
        activities = await contacts_service.get_contact_activities(contact_id)
    except:
        activities = []

    contact_dict = contact.dict() if hasattr(contact, "dict") else contact

    # Calculate lead score
    score_data = lead_scoring_service.calculate_lead_score(contact_dict, activities)

    # Generate AI summary
    summary = await llm_service.generate_contact_summary(
        contact_data=contact_dict, activities=activities, user_id=current_user.user_id
    )

    # Generate score explanation
    score_explanation = await llm_service.explain_lead_score(
        contact_data=contact_dict, score_data=score_data, user_id=current_user.user_id
    )
    
    # Analyze sentiment from recent communications (if available)
    sentiment_score = 0.0
    if activities:
        try:
            # Get recent communication texts
            recent_texts = [
                act.get("description", "") or act.get("notes", "")
                for act in activities[:5]
                if act.get("type") in ["email", "call", "meeting", "note"]
            ]
            combined_text = " ".join([t for t in recent_texts if t])
            
            if combined_text:
                sentiment_result = await llm_service.analyze_sentiment(
                    text=combined_text,
                    context=f"Kommunikation mit {contact_dict.get('name', 'Kontakt')}",
                    user_id=current_user.user_id
                )
                sentiment_score = sentiment_result.get("score", 0.0)
        except Exception as e:
            logger.warning(f"Sentiment analysis failed: {e}")

    # Determine segment
    score = score_data["score"]
    category = score_data["category"]
    priority = contact_dict.get("priority", "medium")
    budget = contact_dict.get("budget") or contact_dict.get("budget_max")

    # Build segment label
    segment_parts = []
    if priority in ["high", "urgent"]:
        segment_parts.append("A-Kunde")
    elif priority == "medium":
        segment_parts.append("B-Kunde")
    else:
        segment_parts.append("C-Kunde")

    if category == "heiß":
        segment_parts.append("Heißes Lead")
    elif category == "warm":
        segment_parts.append("Warmes Lead")
    else:
        segment_parts.append("Kaltes Lead")

    if budget and float(budget) >= 200000:
        segment_parts.append("Hohe Kaufkraft")
    elif budget and float(budget) >= 100000:
        segment_parts.append("Mittlere Kaufkraft")

    segment = " • ".join(segment_parts)

    return AiInsightsResponse(
        summary=summary,
        score_explanation=score_explanation,
        segment=segment,
        top_signals=score_data["signals"][:3],
        generated_at=score_data["last_updated"],
    )


@router.post("/{contact_id}/next-action", response_model=NextActionResponse)
async def get_contact_next_action(
    contact_id: str,
    request: NextActionRequest,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Generate next best action recommendation for a contact

    Returns recommended action type, urgency, reason, and script
    """
    contacts_service = ContactsService(tenant_id)
    lead_scoring_service = LeadScoringService(tenant_id)
    llm_service = LLMService(tenant_id)

    # Get contact
    contact = await contacts_service.get_contact(contact_id)
    if not contact:
        raise NotFoundError("Contact not found")

    # Get activities
    try:
        activities = await contacts_service.get_contact_activities(contact_id)
    except:
        activities = []

    contact_dict = contact.dict() if hasattr(contact, "dict") else contact

    # Calculate lead score
    score_data = lead_scoring_service.calculate_lead_score(contact_dict, activities)

    # Generate recommendation
    recommendation = await llm_service.suggest_next_action(
        contact_data=contact_dict,
        score_data=score_data,
        activities=activities,
        goal=request.goal,
        user_id=current_user.user_id,
    )

    # Build context
    contact_context = {
        "name": contact_dict.get("name"),
        "status": contact_dict.get("status"),
        "score": score_data["score"],
        "category": score_data["category"],
        "activity_count": len(activities),
    }

    from datetime import datetime
    from app.schemas.contacts import NextActionRecommendation

    return NextActionResponse(
        recommendation=NextActionRecommendation(**recommendation),
        contact_context=contact_context,
        generated_at=datetime.utcnow().isoformat(),
    )


@router.post("/{contact_id}/compose-email")
async def compose_contact_email(
    contact_id: str,
    goal: str = "follow_up",
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Generate AI-composed email draft for a contact

    Args:
        goal: Email goal (follow_up/appointment/proposal/check_in)

    Returns:
        Dict with subject and body
    """
    contacts_service = ContactsService(tenant_id)
    llm_service = LLMService(tenant_id)

    # Get contact
    contact = await contacts_service.get_contact(contact_id)
    if not contact:
        raise NotFoundError("Contact not found")

    # Get last activity
    try:
        activities = await contacts_service.get_contact_activities(contact_id)
        last_activity = activities[0] if activities else None
    except:
        last_activity = None

    contact_dict = contact.dict() if hasattr(contact, "dict") else contact

    # Generate email
    email_data = await llm_service.compose_email(
        contact_data=contact_dict,
        goal=goal,
        last_activity=last_activity,
        user_id=current_user.user_id,
    )

    return email_data
