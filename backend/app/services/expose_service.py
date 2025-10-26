"""
Exposé Service
Service for AI-powered exposé generation using LLM
"""
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from asgiref.sync import sync_to_async

from app.db.models import Property, ExposeVersion, User
from app.services.llm_service import LLMService
from app.schemas.llm import LLMRequest
from app.core.errors import NotFoundError

logger = logging.getLogger(__name__)


class ExposeService:
    """Service for exposé generation and management"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.llm_service = LLMService(tenant_id)
    
    async def generate_expose(
        self,
        property_id: str,
        audience: str,
        tone: str,
        language: str,
        length: str,
        keywords: List[str],
        user_id: str
    ) -> ExposeVersion:
        """Generate exposé using LLM"""
        
        # Get property data
        property_obj = await self._get_property(property_id)
        
        # Create prompt template
        prompt = await self._create_expose_prompt(
            property_obj, audience, tone, language, length, keywords
        )
        
        # Generate exposé using LLM
        llm_request = LLMRequest(
            prompt=prompt,
            max_tokens=2048,
            temperature=0.7
        )
        
        try:
            response = await self.llm_service.ask_question(
                request=llm_request,
                user_id=user_id
            )
            
            # Get next version number
            version_number = await self._get_next_version_number(property_id)
            
            # Create exposé version
            expose_version = await self._create_expose_version(
                property_obj=property_obj,
                title=f"Exposé für {property_obj.title}",
                content=response.response,
                audience=audience,
                tone=tone,
                language=language,
                length=length,
                keywords=keywords,
                version_number=version_number,
                user_id=user_id
            )
            
            return expose_version
            
        except Exception as e:
            logger.error(f"Error generating exposé: {str(e)}")
            raise Exception(f"Failed to generate exposé: {str(e)}")
    
    async def get_expose_versions(self, property_id: str) -> List[ExposeVersion]:
        """Get all exposé versions for a property"""
        
        @sync_to_async
        def get_versions():
            return list(ExposeVersion.objects.filter(
                property_id=property_id
            ).order_by('-created_at'))
        
        return await get_versions()
    
    async def save_expose_version(
        self,
        property_id: str,
        title: str,
        content: str,
        audience: str,
        tone: str,
        language: str,
        length: str,
        keywords: List[str],
        user_id: str
    ) -> ExposeVersion:
        """Save a new exposé version"""
        
        property_obj = await self._get_property(property_id)
        version_number = await self._get_next_version_number(property_id)
        
        return await self._create_expose_version(
            property_obj=property_obj,
            title=title,
            content=content,
            audience=audience,
            tone=tone,
            language=language,
            length=length,
            keywords=keywords,
            version_number=version_number,
            user_id=user_id
        )
    
    async def delete_expose_version(self, version_id: str, user_id: str) -> None:
        """Delete an exposé version"""
        
        @sync_to_async
        def delete_version():
            try:
                version = ExposeVersion.objects.get(id=version_id)
                version.delete()
            except ExposeVersion.DoesNotExist:
                raise NotFoundError("Exposé version not found")
        
        await delete_version()
    
    async def publish_expose_version(self, version_id: str, user_id: str) -> ExposeVersion:
        """Publish an exposé version"""
        
        @sync_to_async
        def publish_version():
            try:
                version = ExposeVersion.objects.get(id=version_id)
                version.status = 'published'
                version.save()
                return version
            except ExposeVersion.DoesNotExist:
                raise NotFoundError("Exposé version not found")
        
        return await publish_version()
    
    async def _create_expose_prompt(
        self,
        property: Property,
        audience: str,
        tone: str,
        language: str,
        length: str,
        keywords: List[str]
    ) -> str:
        """Create prompt for exposé generation"""
        
        # Map audience to German
        audience_map = {
            'kauf': 'Käufer',
            'miete': 'Mieter',
            'investor': 'Investor'
        }
        
        # Map tone to German
        tone_map = {
            'neutral': 'neutral und sachlich',
            'elegant': 'elegant und exklusiv',
            'kurz': 'kurz und prägnant'
        }
        
        # Map length to German
        length_map = {
            'short': 'kurz (ca. 100 Wörter)',
            'standard': 'standard (ca. 200 Wörter)',
            'long': 'lang (ca. 300+ Wörter)'
        }
        
        audience_text = audience_map.get(audience, audience)
        tone_text = tone_map.get(tone, tone)
        length_text = length_map.get(length, length)
        
        # Get address
        address_text = ""
        if hasattr(property, 'address') and property.address:
            addr = property.address
            address_parts = []
            if addr.street:
                address_parts.append(addr.street)
            if addr.zip_code and addr.city:
                address_parts.append(f"{addr.zip_code} {addr.city}")
            address_text = ", ".join(address_parts)
        
        # Get property features
        features_text = ""
        if hasattr(property, 'features') and property.features:
            feat = property.features
            features = []
            if feat.bedrooms:
                features.append(f"{feat.bedrooms} Zimmer")
            if feat.bathrooms:
                features.append(f"{feat.bathrooms} Badezimmer")
            if feat.parking_spaces:
                features.append(f"{feat.parking_spaces} Parkplätze")
            if feat.balcony:
                features.append("Balkon")
            if feat.garden:
                features.append("Garten")
            if feat.elevator:
                features.append("Aufzug")
            features_text = ", ".join(features)
        
        prompt = f"""
Erstelle ein professionelles Immobilien-Exposé für folgende Immobilie:

**Immobilien-Daten:**
- Titel: {property.title}
- Typ: {property.property_type}
- Preis: {property.price:,.0f} €
- Wohnfläche: {property.living_area or 'Nicht angegeben'} m²
- Adresse: {address_text}
- Ausstattung: {features_text}
- Baujahr: {property.year_built or 'Nicht angegeben'}
- Energieklasse: {property.energy_class or 'Nicht angegeben'}
- Heizungsart: {property.heating_type or 'Nicht angegeben'}

**Beschreibung:**
{property.description or 'Keine Beschreibung verfügbar'}

**Anforderungen:**
- Zielgruppe: {audience_text}
- Tonalität: {tone_text}
- Länge: {length_text}
- Sprache: {'Deutsch' if language == 'de' else 'English'}
- Keywords: {', '.join(keywords) if keywords else 'Keine spezifischen Keywords'}

**Struktur:**
1. Einleitung mit Highlights der Immobilie
2. Beschreibung der Lage und Umgebung
3. Detaillierte Beschreibung der Immobilie
4. Ausstattung und Besonderheiten
5. Energieeffizienz und Kosten
6. Fazit mit Call-to-Action

Erstelle einen ansprechenden, professionellen Text, der potenzielle {audience_text} überzeugt.
"""
        
        return prompt
    
    async def _get_property(self, property_id: str) -> Property:
        """Get property by ID with related objects"""
        
        @sync_to_async
        def get_property():
            try:
                return Property.objects.select_related('address', 'features', 'contact_person').get(
                    id=property_id, 
                    tenant_id=self.tenant_id
                )
            except Property.DoesNotExist:
                raise NotFoundError("Property not found")
        
        return await get_property()
    
    async def _get_next_version_number(self, property_id: str) -> int:
        """Get next version number for property"""
        
        @sync_to_async
        def get_max_version():
            from django.db.models import Max
            result = ExposeVersion.objects.filter(
                property_id=property_id
            ).aggregate(max_version=Max('version_number'))
            return result['max_version'] or 0
        
        max_version = await get_max_version()
        return max_version + 1
    
    async def _create_expose_version(
        self,
        property_obj: Property,
        title: str,
        content: str,
        audience: str,
        tone: str,
        language: str,
        length: str,
        keywords: List[str],
        version_number: int,
        user_id: str
    ) -> ExposeVersion:
        """Create exposé version"""
        
        @sync_to_async
        def create_version():
            user = User.objects.get(id=user_id)
            
            return ExposeVersion.objects.create(
                property=property_obj,
                title=title,
                content=content,
                audience=audience,
                tone=tone,
                language=language,
                length=length,
                keywords=keywords,
                version_number=version_number,
                created_by=user
            )
        
        return await create_version()
