"""
Exposé Service
Service for AI-powered exposé generation using LLM
"""
import logging
import os
from typing import List, Optional, Dict, Any
from datetime import datetime
from asgiref.sync import sync_to_async

from properties.models import Property, ExposeVersion
from accounts.models import User
from app.services.llm_service import LLMService
from app.services.ai_manager import AIManager
from app.schemas.llm import LLMRequest
from app.core.errors import NotFoundError

logger = logging.getLogger(__name__)


class ExposeService:
    """Service for exposé generation and management with enhanced AI"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.use_ai_manager = os.getenv("AI_PROVIDER") and os.getenv("OPENROUTER_API_KEY")
        
        if self.use_ai_manager:
            try:
                self.ai_manager = AIManager(tenant_id)
                logger.info("✅ Expose Service initialized with AI Manager")
            except Exception as e:
                logger.warning(f"⚠️ AI Manager initialization failed, using LLM Service: {e}")
                self.use_ai_manager = False
        
        # Fallback to LLM Service
        if not self.use_ai_manager:
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
        """Generate exposé using enhanced AI"""
        
        # Get property data
        property_obj = await self._get_property(property_id)
        
        try:
            # Use AI Manager if available (better prompts and structure)
            if self.use_ai_manager:
                property_data = await self._property_to_dict(property_obj)
                
                result = await self.ai_manager.generate_expose_content(
                    property_data=property_data,
                    audience=audience,
                    tone=tone,
                    language=language,
                    length=length,
                    keywords=keywords
                )
                
                # Format as structured expose
                content = self._format_expose_content(result)
                title = result.get("title", f"Exposé für {property_obj.title}")
                
            else:
                # Fallback to LLM Service
                prompt = self._create_expose_prompt(
                    property_obj, audience, tone, language, length, keywords
                )
                
                llm_request = LLMRequest(
                    prompt=prompt,
                    max_tokens=2048,
                    temperature=0.7
                )
                
                response = await self.llm_service.ask_question(
                    request=llm_request,
                    user_id=user_id
                )
                
                content = response.response
                title = f"Exposé für {property_obj.title}"
            
            # Get next version number
            version_number = await self._get_next_version_number(property_id)
            
            # Create exposé version
            expose_version = await self._create_expose_version(
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
            
            return expose_version
            
        except Exception as e:
            logger.error(f"Error generating exposé: {str(e)}")
            raise Exception(f"Failed to generate exposé: {str(e)}")
    
    async def _property_to_dict(self, property_obj: Property) -> Dict[str, Any]:
        """Convert Property model to dict for AI processing"""
        
        @sync_to_async
        def get_property_dict():
            return {
                "property_type": property_obj.property_type,
                "title": property_obj.title,
                "description": property_obj.description or "",
                "size": property_obj.size,
                "rooms": property_obj.rooms,
                "price": property_obj.price,
                "location": property_obj.location or "",
                "features": property_obj.features or [],
                "build_year": getattr(property_obj, 'build_year', None),
                "condition": getattr(property_obj, 'condition', 'good')
            }
        
        return await get_property_dict()
    
    def _format_expose_content(self, ai_result: Dict[str, Any]) -> str:
        """Format AI result into structured expose content"""
        
        content_parts = []
        
        # Title
        if ai_result.get("title"):
            content_parts.append(f"# {ai_result['title']}\n")
        
        # Main description
        if ai_result.get("description"):
            content_parts.append(f"{ai_result['description']}\n")
        
        # Highlights
        if ai_result.get("highlights"):
            content_parts.append("\n## Highlights\n")
            for highlight in ai_result["highlights"]:
                content_parts.append(f"- {highlight}\n")
        
        # Call to action
        if ai_result.get("call_to_action"):
            content_parts.append(f"\n---\n\n{ai_result['call_to_action']}\n")
        
        return "\n".join(content_parts)
    
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
    
    def _create_expose_prompt(
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
        """Get property by ID"""
        
        @sync_to_async
        def get_property():
            try:
                return Property.objects.get(id=property_id, tenant_id=self.tenant_id)
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
                title=title or f"Exposé für {property_obj.title}",
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
