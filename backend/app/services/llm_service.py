"""
LLM Service for Qwen/OpenRouter Integration
"""
import os
import asyncio
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import httpx
from cryptography.fernet import Fernet

from app.core.settings import settings
from app.core.errors import ValidationError, ServiceError
from app.schemas.llm import LLMRequest, LLMResponse, DashboardQARequest, DashboardQAResponse, LLMAuditLog
from app.services.audit import AuditService

logger = logging.getLogger(__name__)


class LLMService:
    """Service for handling LLM requests via OpenRouter"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.openrouter_api_key = os.getenv('OPENROUTER_API_KEY')
        self.openrouter_base_url = os.getenv('OPENROUTER_BASE', 'https://openrouter.ai/api/v1')
        self.openrouter_model = os.getenv('OPENROUTER_MODEL', 'qwen/qwen-2.5-72b-instruct')
        self.timeout = int(os.getenv('OPENROUTER_TIMEOUT', '30'))
        self.max_tokens = int(os.getenv('OPENROUTER_MAX_TOKENS', '2048'))
        
        if not self.openrouter_api_key:
            raise ServiceError("OpenRouter API key not configured")
        
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
        """Make request to OpenRouter API with retry logic"""
        
        headers = {
            "Authorization": f"Bearer {self.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://immonow.com",
            "X-Title": "ImmoNow Dashboard"
        }
        
        payload = {
            "model": self.openrouter_model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for attempt in range(3):  # 3 retry attempts
                try:
                    response = await client.post(
                        f"{self.openrouter_base_url}/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    
                    if response.status_code == 200:
                        return response.json()
                    elif response.status_code == 429:  # Rate limited
                        wait_time = 2 ** attempt  # Exponential backoff
                        logger.warning(f"Rate limited, waiting {wait_time}s before retry {attempt + 1}")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
                        raise ServiceError(f"OpenRouter API error: {response.status_code}")
                        
                except httpx.TimeoutException:
                    logger.warning(f"OpenRouter request timeout, attempt {attempt + 1}")
                    if attempt == 2:  # Last attempt
                        raise ServiceError("OpenRouter request timeout after retries")
                    await asyncio.sleep(2 ** attempt)
                    continue
                except Exception as e:
                    logger.error(f"OpenRouter request error: {str(e)}")
                    if attempt == 2:  # Last attempt
                        raise ServiceError(f"OpenRouter request failed: {str(e)}")
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
