"""
LLM Service for DeepSeek V3.1/OpenRouter Integration
"""
import os
import asyncio
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from openai import AsyncOpenAI

from app.core.settings import settings
from app.core.errors import ValidationError, ServiceError
from app.schemas.llm import LLMRequest, LLMResponse, DashboardQARequest, DashboardQAResponse, LLMAuditLog
from app.services.audit import AuditService

logger = logging.getLogger(__name__)


class LLMService:
    """Service for handling LLM requests via OpenRouter with DeepSeek V3.1"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.openrouter_api_key = os.getenv('OPENROUTER_API_KEY')
        self.openrouter_base_url = os.getenv('OPENROUTER_BASE', 'https://openrouter.ai/api/v1')
        self.openrouter_model = os.getenv('OPENROUTER_MODEL', 'deepseek/deepseek-chat-v3.1:free')
        self.timeout = int(os.getenv('OPENROUTER_TIMEOUT', '60'))
        self.max_tokens = int(os.getenv('OPENROUTER_MAX_TOKENS', '2048'))
        self.site_url = os.getenv('SITE_URL', 'https://immonow.com')
        self.site_name = os.getenv('SITE_NAME', 'ImmoNow Dashboard')
        
        if not self.openrouter_api_key:
            raise ServiceError("OpenRouter API key not configured")
        
        # Initialize AsyncOpenAI client
        self.client = AsyncOpenAI(
            base_url=self.openrouter_base_url,
            api_key=self.openrouter_api_key,
            timeout=self.timeout
        )
        
        self.audit_service = AuditService(tenant_id)
        
        # Rate limiting storage (in production, use Redis)
        self.rate_limit_storage: Dict[str, Dict[str, Any]] = {}
    
    def _check_rate_limit(self, user_id: str) -> bool:
        """Check if user has exceeded rate limit (10 requests per minute)"""
        now = datetime.utcnow()
        key = f"{self.tenant_id}:{user_id}"
        
        if key not in self.rate_limit_storage:
            self.rate_limit_storage[key] = {
                'requests': [],
                'last_reset': now
            }
        
        user_data = self.rate_limit_storage[key]
        
        # Remove requests older than 1 minute
        user_data['requests'] = [
            req_time for req_time in user_data['requests']
            if now - req_time < timedelta(minutes=1)
        ]
        
        # Check if under limit
        if len(user_data['requests']) >= 10:
            return False
        
        # Add current request
        user_data['requests'].append(now)
        return True
    
    async def _make_openrouter_request(
        self, 
        messages: list, 
        max_tokens: int = 2048,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """Make request to OpenRouter API using OpenAI client with retry logic"""
        
        for attempt in range(3):  # 3 retry attempts
            try:
                # Make request using OpenAI client
                completion = await self.client.chat.completions.create(
                    model=self.openrouter_model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    extra_headers={
                        "HTTP-Referer": self.site_url,
                        "X-Title": self.site_name
                    },
                    extra_body={}
                )
                
                # Convert response to dict format
                return {
                    "choices": [
                        {
                            "message": {
                                "role": completion.choices[0].message.role,
                                "content": completion.choices[0].message.content
                            },
                            "finish_reason": completion.choices[0].finish_reason
                        }
                    ],
                    "usage": {
                        "prompt_tokens": completion.usage.prompt_tokens,
                        "completion_tokens": completion.usage.completion_tokens,
                        "total_tokens": completion.usage.total_tokens
                    },
                    "model": completion.model,
                    "id": completion.id
                }
                
            except Exception as e:
                error_msg = str(e)
                
                # Check if rate limited
                if "429" in error_msg or "rate_limit" in error_msg.lower():
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.warning(f"Rate limited, waiting {wait_time}s before retry {attempt + 1}")
                    await asyncio.sleep(wait_time)
                    if attempt == 2:  # Last attempt
                        raise ServiceError("Rate limit exceeded after retries")
                    continue
                
                # Check if timeout
                if "timeout" in error_msg.lower():
                    logger.warning(f"OpenRouter request timeout, attempt {attempt + 1}")
                    if attempt == 2:  # Last attempt
                        raise ServiceError("OpenRouter request timeout after retries")
                    await asyncio.sleep(2 ** attempt)
                    continue
                
                # Other errors
                logger.error(f"OpenRouter request error: {error_msg}")
                if attempt == 2:  # Last attempt
                    raise ServiceError(f"OpenRouter request failed: {error_msg}")
                await asyncio.sleep(2 ** attempt)
                continue
        
        raise ServiceError("OpenRouter request failed after all retries")
    
    async def ask_question(
        self, 
        request: LLMRequest, 
        user_id: str,
        request_id: Optional[str] = None
    ) -> LLMResponse:
        """Ask a general question to the LLM"""
        
        # Check rate limit
        if not self._check_rate_limit(user_id):
            raise ValidationError("Rate limit exceeded. Maximum 10 requests per minute.")
        
        # Prepare messages
        messages = [
            {
                "role": "system",
                "content": "Du bist ein hilfreicher Assistent für Immobilienverwaltung. Antworte auf Deutsch und sei präzise und professionell."
            }
        ]
        
        if request.context:
            messages.append({
                "role": "user",
                "content": f"Kontext: {request.context}\n\nFrage: {request.prompt}"
            })
        else:
            messages.append({
                "role": "user",
                "content": request.prompt
            })
        
        try:
            # Make request to OpenRouter
            response_data = await self._make_openrouter_request(
                messages=messages,
                max_tokens=request.max_tokens or self.max_tokens,
                temperature=request.temperature or 0.7
            )
            
            # Extract response
            response_text = response_data['choices'][0]['message']['content']
            tokens_used = response_data['usage']['total_tokens']
            
            # Create audit log
            audit_log = LLMAuditLog(
                user_id=user_id,
                tenant_id=self.tenant_id,
                request_type='general',
                prompt=request.prompt,
                response=response_text,
                tokens_used=tokens_used,
                model=self.openrouter_model,
                request_id=request_id
            )
            
            await self.audit_service.log_llm_request(audit_log)
            
            return LLMResponse(
                response=response_text,
                tokens_used=tokens_used,
                model=self.openrouter_model
            )
            
        except Exception as e:
            logger.error(f"LLM service error: {str(e)}")
            raise ServiceError(f"Failed to process LLM request: {str(e)}")
    
    async def ask_dashboard_question(
        self, 
        request: DashboardQARequest, 
        user_id: str,
        request_id: Optional[str] = None
    ) -> DashboardQAResponse:
        """Ask a question about dashboard KPIs with predefined context"""
        
        # Check rate limit
        if not self._check_rate_limit(user_id):
            raise ValidationError("Rate limit exceeded. Maximum 10 requests per minute.")
        
        # Get dashboard context
        context = await self._get_dashboard_context(request.context_type, request.include_data)
        
        # Prepare messages with dashboard context
        messages = [
            {
                "role": "system",
                "content": """Du bist ein spezialisierter Assistent für das ImmoNow-Dashboard. 
                Du hilfst Benutzern dabei, KPIs, Metriken und Funktionen zu verstehen.
                Antworte auf Deutsch, sei präzise und erkläre komplexe Konzepte verständlich.
                Wenn du Daten erwähnst, verwende die aktuellen Werte aus dem Kontext."""
            },
            {
                "role": "user",
                "content": f"""Dashboard-Kontext:
{context}

Frage: {request.question}"""
            }
        ]
        
        try:
            # Make request to OpenRouter
            response_data = await self._make_openrouter_request(
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=0.3  # Lower temperature for more consistent answers
            )
            
            # Extract response
            response_text = response_data['choices'][0]['message']['content']
            tokens_used = response_data['usage']['total_tokens']
            
            # Extract related KPIs (simple keyword matching)
            related_kpis = self._extract_related_kpis(response_text)
            
            # Create audit log
            audit_log = LLMAuditLog(
                user_id=user_id,
                tenant_id=self.tenant_id,
                request_type='dashboard_qa',
                prompt=request.question,
                response=response_text,
                tokens_used=tokens_used,
                model=self.openrouter_model,
                request_id=request_id
            )
            
            await self.audit_service.log_llm_request(audit_log)
            
            return DashboardQAResponse(
                answer=response_text,
                context_used=context,
                related_kpis=related_kpis,
                tokens_used=tokens_used
            )
            
        except Exception as e:
            logger.error(f"Dashboard LLM service error: {str(e)}")
            raise ServiceError(f"Failed to process dashboard question: {str(e)}")
    
    async def _get_dashboard_context(self, context_type: str, include_data: bool) -> str:
        """Get dashboard context for LLM"""
        
        base_context = """
Das ImmoNow-Dashboard ist ein umfassendes System für Immobilienverwaltung mit folgenden Hauptbereichen:

1. CIM (Central Information Model) - Zentrale Übersicht:
   - Alerts: Termine, Fristen, wichtige Ereignisse
   - Geografische Verteilung: Immobilien nach Standorten
   - Verkaufsmodul: Umsätze, Provisionen, Pipeline
   - Finanzmodul: Portfolio-Metriken, Rendite, Cashflow
   - Segmentierung: Kunden nach Typen und Verhalten

2. AVM (Automatische Wertermittlung):
   - Potenzialwert: Geschätzter Marktwert
   - Marktanalyse: Vergleichsobjekte, Preisentwicklung
   - ROI-Berechnung: Rendite auf Investition

3. Investor-Portal:
   - Portfolio-Übersicht: Alle Immobilien-Assets
   - Performance-Analyse: Rendite, Leerstand, Kosten
   - Berichte: Automatische Renditeberichte
   - Simulationen: ROI-Kalkulationen

4. Dokumentenmanagement:
   - Ordnerstruktur: Organisierte Dokumentenablage
   - Versionierung: Änderungshistorie
   - Volltext-Suche: Durchsuchung aller Dokumente
   - Sichtbarkeit: Private, Team, Öffentlich

5. Kommunikation:
   - Chat: Interne Kommunikation
   - Termine: Kalender und Besichtigungen
   - Kampagnen: Marketing-Aktivitäten

6. Teamstatus:
   - Mitarbeiter-Übersicht: Aktivitäten und Performance
   - Kanban-Board: Task-Management
   - Projektstatus: Fortschritte und Deadlines

Wichtige KPIs:
- Potenzialwert: Geschätzter Immobilienwert
- ROI (Return on Investment): Rendite in Prozent
- Cashflow: Monatliche Einnahmen minus Ausgaben
- Leerstandsquote: Anteil leerstehender Immobilien
- Pipeline-Wert: Wert der laufenden Verhandlungen
- Conversion-Rate: Anteil erfolgreicher Abschlüsse
"""
        
        if include_data and context_type == "dashboard":
            # In a real implementation, you would fetch actual data here
            # For now, we'll use placeholder data
            data_context = """
Aktuelle Daten (Beispiel):
- Gesamtportfolio-Wert: €12.5M
- Durchschnittlicher ROI: 8.2%
- Monatlicher Cashflow: €45,000
- Leerstandsquote: 3.1%
- Aktive Verhandlungen: 23
- Conversion-Rate: 68%
"""
            return base_context + data_context
        
        return base_context
    
    def _extract_related_kpis(self, response_text: str) -> list:
        """Extract mentioned KPIs from response text"""
        kpi_keywords = {
            'potenzialwert': 'Potenzialwert',
            'roi': 'ROI',
            'cashflow': 'Cashflow',
            'leerstand': 'Leerstandsquote',
            'pipeline': 'Pipeline-Wert',
            'conversion': 'Conversion-Rate',
            'rendite': 'Rendite',
            'wert': 'Portfolio-Wert',
            'umsatz': 'Umsatz',
            'provision': 'Provision'
        }
        
        mentioned_kpis = []
        response_lower = response_text.lower()
        
        for keyword, kpi_name in kpi_keywords.items():
            if keyword in response_lower:
                mentioned_kpis.append(kpi_name)
        
        return mentioned_kpis
    
    async def analyze_property_contact_match(
        self,
        property_data: Dict[str, Any],
        contact_data: Dict[str, Any],
        match_score: float
    ) -> Dict[str, Any]:
        """Use LLM to analyze and explain property-contact match"""
        
        messages = [
            {
                "role": "system",
                "content": """Du bist ein KI-Experte für Immobilien-Matching. 
                Analysiere die Passung zwischen Immobilie und Kunde und gib detaillierte Einschätzungen.
                Antworte auf Deutsch in einem professionellen, aber verständlichen Ton.
                Fokussiere auf konkrete Match-Faktoren und gib praktische Empfehlungen."""
            },
            {
                "role": "user",
                "content": f"""Analysiere das Matching zwischen dieser Immobilie und diesem Kunden:

**Immobilie:**
- Titel: {property_data.get('title', 'N/A')}
- Typ: {property_data.get('property_type', 'N/A')}
- Preis: {property_data.get('price', 0):,.0f} €
- Größe: {property_data.get('living_area', 0)} m²
- Zimmer: {property_data.get('rooms', 'N/A')}
- Standort: {property_data.get('location', 'N/A')}
- Status: {property_data.get('status', 'N/A')}

**Kunde:**
- Name: {contact_data.get('name', 'N/A')}
- Budget: {contact_data.get('budget_min', 0):,.0f} € - {contact_data.get('budget', 0):,.0f} €
- Präferenzen: {contact_data.get('preferences', {})}
- Lead-Score: {contact_data.get('lead_score', 0)}/100
- Priorität: {contact_data.get('priority', 'medium')}
- Status: {contact_data.get('status', 'N/A')}

**Aktueller Match-Score: {match_score:.1f}/100**

Bitte analysiere:
1. Stärken des Matches (2-3 Hauptpunkte)
2. Potenzielle Herausforderungen (1-2 Punkte)
3. Konkrete Handlungsempfehlung für den Makler
4. Einschätzung der Abschlusswahrscheinlichkeit (gering/mittel/hoch)

Format die Antwort als JSON mit folgender Struktur:
{{
  "strengths": ["Punkt 1", "Punkt 2", "Punkt 3"],
  "challenges": ["Punkt 1", "Punkt 2"],
  "recommendation": "Konkrete Empfehlung",
  "closing_probability": "gering|mittel|hoch",
  "summary": "Zusammenfassung in 1-2 Sätzen"
}}"""
            }
        ]
        
        try:
            response_data = await self._make_openrouter_request(
                messages=messages,
                max_tokens=1024,
                temperature=0.5
            )
            
            response_text = response_data['choices'][0]['message']['content']
            
            # Parse JSON response
            import json
            # Extract JSON from response (might be wrapped in markdown code blocks)
            if '```json' in response_text:
                json_str = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                json_str = response_text.split('```')[1].split('```')[0].strip()
            else:
                json_str = response_text
            
            result = json.loads(json_str)
            result['tokens_used'] = response_data['usage']['total_tokens']
            
            return result
            
        except Exception as e:
            logger.error(f"LLM match analysis error: {str(e)}")
            # Fallback to simple analysis
            return {
                "strengths": ["Budget-Übereinstimmung", "Verfügbarkeit"],
                "challenges": ["Weitere Details prüfen"],
                "recommendation": "Präsentation vereinbaren und Kundenwünsche detailliert besprechen",
                "closing_probability": "mittel",
                "summary": f"Match-Score von {match_score:.0f}% zeigt grundsätzliche Passung.",
                "tokens_used": 0
            }
    
    async def generate_match_insights(
        self,
        matches: list,
        context: str = "property"
    ) -> Dict[str, Any]:
        """Generate insights about a list of matches using LLM"""
        
        # Prepare match summary
        match_summary = []
        for i, match in enumerate(matches[:5], 1):  # Top 5 matches
            score = match.get('match_score', 0)
            if context == "property":
                match_summary.append(
                    f"{i}. {match.get('title', 'N/A')} - {score:.0f}% Match "
                    f"({match.get('price', 0):,.0f} €, {match.get('living_area', 0)} m²)"
                )
            else:
                match_summary.append(
                    f"{i}. {match.get('name', 'N/A')} - {score:.0f}% Match "
                    f"(Budget: {match.get('budget', 0):,.0f} €, Lead-Score: {match.get('lead_score', 0)})"
                )
        
        messages = [
            {
                "role": "system",
                "content": """Du bist ein KI-Analyst für Immobilien-Matching.
                Analysiere Match-Listen und gib strategische Empfehlungen.
                Antworte prägnant und praxisorientiert auf Deutsch."""
            },
            {
                "role": "user",
                "content": f"""Analysiere diese Top-Matches:

{chr(10).join(match_summary)}

Kontext: {'Immobilien für einen Kunden' if context == 'property' else 'Kunden für eine Immobilie'}

Gib mir:
1. Eine Gesamtbewertung der Match-Qualität
2. Den vielversprechendsten Match mit Begründung
3. Eine priorisierte Handlungsempfehlung (max. 3 Schritte)

Format als JSON:
{{
  "overall_quality": "excellent|good|moderate|poor",
  "best_match_index": 1,
  "best_match_reason": "Begründung",
  "action_steps": ["Schritt 1", "Schritt 2", "Schritt 3"]
}}"""
            }
        ]
        
        try:
            response_data = await self._make_openrouter_request(
                messages=messages,
                max_tokens=512,
                temperature=0.4
            )
            
            response_text = response_data['choices'][0]['message']['content']
            
            # Parse JSON
            import json
            if '```json' in response_text:
                json_str = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                json_str = response_text.split('```')[1].split('```')[0].strip()
            else:
                json_str = response_text
            
            result = json.loads(json_str)
            result['tokens_used'] = response_data['usage']['total_tokens']
            
            return result
            
        except Exception as e:
            logger.error(f"LLM insights error: {str(e)}")
            return {
                "overall_quality": "good",
                "best_match_index": 1,
                "best_match_reason": "Höchster Match-Score",
                "action_steps": ["Kontakt aufnehmen", "Präsentation vorbereiten", "Termin vereinbaren"],
                "tokens_used": 0
            }
