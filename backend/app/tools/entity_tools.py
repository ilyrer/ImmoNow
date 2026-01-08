"""
ImmoNow - Entity Tools
AI tools for entity management (contacts, properties, etc.)
"""

import logging
from typing import Optional
from asgiref.sync import sync_to_async

from contacts.models import Contact
from properties.models import Property
from app.tools.registry import ToolRegistry, ToolParameter, ToolResult


logger = logging.getLogger(__name__)


# Contact Tools
async def create_contact_handler(
    tenant_id: str,
    user_id: str,
    name: str,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    contact_type: str = "lead",
    notes: Optional[str] = None,
) -> ToolResult:
    """Create a new contact"""
    try:
        contact = await sync_to_async(Contact.objects.create)(
            tenant_id=tenant_id,
            name=name,
            email=email or "",
            phone=phone or "",
            contact_type=contact_type,
            notes=notes or "",
            created_by_id=user_id,
        )

        return ToolResult(
            success=True,
            data={
                "contact_id": str(contact.id),
                "name": contact.name,
                "email": contact.email,
                "message": f"Kontakt '{contact.name}' erfolgreich erstellt",
            },
        )
    except Exception as e:
        logger.error(f"Failed to create contact: {e}", exc_info=True)
        return ToolResult(
            success=False, error=f"Fehler beim Erstellen des Kontakts: {str(e)}"
        )


async def list_contacts_handler(
    tenant_id: str,
    user_id: str,
    contact_type: Optional[str] = None,
    limit: int = 10,
) -> ToolResult:
    """List contacts with filters"""
    try:
        query = Contact.objects.filter(tenant_id=tenant_id, is_deleted=False)

        if contact_type:
            query = query.filter(contact_type=contact_type)

        contacts = await sync_to_async(list)(query.order_by("-created_at")[:limit])

        contact_list = [
            {
                "contact_id": str(c.id),
                "name": c.name,
                "email": c.email,
                "phone": c.phone,
                "type": c.contact_type,
            }
            for c in contacts
        ]

        return ToolResult(
            success=True,
            data={
                "contacts": contact_list,
                "count": len(contact_list),
                "message": f"{len(contact_list)} Kontakte gefunden",
            },
        )
    except Exception as e:
        logger.error(f"Failed to list contacts: {e}", exc_info=True)
        return ToolResult(
            success=False, error=f"Fehler beim Abrufen der Kontakte: {str(e)}"
        )


# Property Tools
async def list_properties_handler(
    tenant_id: str,
    user_id: str,
    property_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 10,
) -> ToolResult:
    """List properties with filters"""
    try:
        query = Property.objects.filter(tenant_id=tenant_id, is_deleted=False)

        if property_type:
            query = query.filter(property_type=property_type)
        if status:
            query = query.filter(status=status)

        properties = await sync_to_async(list)(query.order_by("-created_at")[:limit])

        property_list = [
            {
                "property_id": str(p.id),
                "title": p.title,
                "property_type": p.property_type,
                "status": p.status,
                "price": float(p.price) if p.price else None,
            }
            for p in properties
        ]

        return ToolResult(
            success=True,
            data={
                "properties": property_list,
                "count": len(property_list),
                "message": f"{len(property_list)} Immobilien gefunden",
            },
        )
    except Exception as e:
        logger.error(f"Failed to list properties: {e}", exc_info=True)
        return ToolResult(
            success=False, error=f"Fehler beim Abrufen der Immobilien: {str(e)}"
        )


# Register Tools
def register_entity_tools():
    """Register all entity tools"""

    # create_contact
    ToolRegistry.register(
        name="create_contact",
        description="Erstellt einen neuen Kontakt (Lead, Kunde, Partner)",
        parameters=[
            ToolParameter(
                name="name",
                type="string",
                description="Kontakt-Name",
                required=True,
            ),
            ToolParameter(
                name="email",
                type="string",
                description="E-Mail-Adresse (optional)",
                required=False,
            ),
            ToolParameter(
                name="phone",
                type="string",
                description="Telefonnummer (optional)",
                required=False,
            ),
            ToolParameter(
                name="contact_type",
                type="string",
                description="Kontakt-Typ",
                required=False,
                default="lead",
                enum=["lead", "customer", "partner", "other"],
            ),
            ToolParameter(
                name="notes",
                type="string",
                description="Notizen (optional)",
                required=False,
            ),
        ],
        handler=create_contact_handler,
        requires_confirmation=False,
        required_scopes=["write"],
        category="entity",
    )

    # list_contacts
    ToolRegistry.register(
        name="list_contacts",
        description="Listet Kontakte auf mit optionalen Filtern",
        parameters=[
            ToolParameter(
                name="contact_type",
                type="string",
                description="Filter nach Kontakt-Typ (optional)",
                required=False,
                enum=["lead", "customer", "partner", "other"],
            ),
            ToolParameter(
                name="limit",
                type="integer",
                description="Maximale Anzahl (default: 10)",
                required=False,
                default=10,
            ),
        ],
        handler=list_contacts_handler,
        requires_confirmation=False,
        required_scopes=["read"],
        category="entity",
    )

    # list_properties
    ToolRegistry.register(
        name="list_properties",
        description="Listet Immobilien auf mit optionalen Filtern",
        parameters=[
            ToolParameter(
                name="property_type",
                type="string",
                description="Filter nach Immobilien-Typ (optional)",
                required=False,
            ),
            ToolParameter(
                name="status",
                type="string",
                description="Filter nach Status (optional)",
                required=False,
            ),
            ToolParameter(
                name="limit",
                type="integer",
                description="Maximale Anzahl (default: 10)",
                required=False,
                default=10,
            ),
        ],
        handler=list_properties_handler,
        requires_confirmation=False,
        required_scopes=["read"],
        category="entity",
    )

    logger.info("Entity tools registered")
