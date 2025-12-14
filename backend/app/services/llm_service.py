"""
LLM Service for DeepSeek V3.1/OpenRouter Integration
"""

import os
import asyncio
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from openai import AsyncOpenAI

from app.core.settings import settings
from app.core.errors import ValidationError, ServiceError
from app.schemas.llm import (
    LLMRequest,
    LLMResponse,
    DashboardQARequest,
    DashboardQAResponse,
    LLMAuditLog,
)
from app.services.audit import AuditService

logger = logging.getLogger(__name__)


class LLMService:
    """Service for handling LLM requests via OpenRouter with DeepSeek V3.1"""

    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        self.openrouter_base_url = os.getenv(
            "OPENROUTER_BASE", "https://openrouter.ai/api/v1"
        )
        self.openrouter_model = os.getenv(
            "OPENROUTER_MODEL", "deepseek/deepseek-chat-v3.1:free"
        )
        self.timeout = int(os.getenv("OPENROUTER_TIMEOUT", "60"))
        self.max_tokens = int(os.getenv("OPENROUTER_MAX_TOKENS", "2048"))
        self.site_url = os.getenv("SITE_URL", "https://immonow.com")
        self.site_name = os.getenv("SITE_NAME", "ImmoNow Dashboard")

        if not self.openrouter_api_key:
            raise ServiceError("OpenRouter API key not configured")

        # Initialize AsyncOpenAI client
        self.client = AsyncOpenAI(
            base_url=self.openrouter_base_url,
            api_key=self.openrouter_api_key,
            timeout=self.timeout,
        )

        self.audit_service = AuditService(tenant_id)

        # Rate limiting storage (in production, use Redis)
        self.rate_limit_storage: Dict[str, Dict[str, Any]] = {}

    def _check_rate_limit(self, user_id: str) -> bool:
        """Check if user has exceeded rate limit (10 requests per minute)"""
        now = datetime.utcnow()
        key = f"{self.tenant_id}:{user_id}"

        if key not in self.rate_limit_storage:
            self.rate_limit_storage[key] = {"requests": [], "last_reset": now}

        user_data = self.rate_limit_storage[key]

        # Remove requests older than 1 minute
        user_data["requests"] = [
            req_time
            for req_time in user_data["requests"]
            if now - req_time < timedelta(minutes=1)
        ]

        # Check if under limit
        if len(user_data["requests"]) >= 10:
            return False

        # Add current request
        user_data["requests"].append(now)
        return True

    async def _make_openrouter_request(
        self, messages: list, max_tokens: int = 2048, temperature: float = 0.7
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
                        "X-Title": self.site_name,
                    },
                    extra_body={},
                )

                # Convert response to dict format
                return {
                    "choices": [
                        {
                            "message": {
                                "role": completion.choices[0].message.role,
                                "content": completion.choices[0].message.content,
                            },
                            "finish_reason": completion.choices[0].finish_reason,
                        }
                    ],
                    "usage": {
                        "prompt_tokens": completion.usage.prompt_tokens,
                        "completion_tokens": completion.usage.completion_tokens,
                        "total_tokens": completion.usage.total_tokens,
                    },
                    "model": completion.model,
                    "id": completion.id,
                }

            except Exception as e:
                error_msg = str(e)

                # Check if rate limited
                if "429" in error_msg or "rate_limit" in error_msg.lower():
                    wait_time = 2**attempt  # Exponential backoff
                    logger.warning(
                        f"Rate limited, waiting {wait_time}s before retry {attempt + 1}"
                    )
                    await asyncio.sleep(wait_time)
                    if attempt == 2:  # Last attempt
                        raise ServiceError("Rate limit exceeded after retries")
                    continue

                # Check if timeout
                if "timeout" in error_msg.lower():
                    logger.warning(f"OpenRouter request timeout, attempt {attempt + 1}")
                    if attempt == 2:  # Last attempt
                        raise ServiceError("OpenRouter request timeout after retries")
                    await asyncio.sleep(2**attempt)
                    continue

                # Other errors
                logger.error(f"OpenRouter request error: {error_msg}")
                if attempt == 2:  # Last attempt
                    raise ServiceError(f"OpenRouter request failed: {error_msg}")
                await asyncio.sleep(2**attempt)
                continue

        raise ServiceError("OpenRouter request failed after all retries")

    async def ask_question(
        self, request: LLMRequest, user_id: str, request_id: Optional[str] = None
    ) -> LLMResponse:
        """Ask a general question to the LLM"""

        # Check rate limit
        if not self._check_rate_limit(user_id):
            raise ValidationError(
                "Rate limit exceeded. Maximum 10 requests per minute."
            )

        # Prepare messages
        messages = [
            {
                "role": "system",
                "content": "Du bist ein hilfreicher Assistent für Immobilienverwaltung. Antworte auf Deutsch und sei präzise und professionell.",
            }
        ]

        if request.context:
            messages.append(
                {
                    "role": "user",
                    "content": f"Kontext: {request.context}\n\nFrage: {request.prompt}",
                }
            )
        else:
            messages.append({"role": "user", "content": request.prompt})

        try:
            # Make request to OpenRouter
            response_data = await self._make_openrouter_request(
                messages=messages,
                max_tokens=request.max_tokens or self.max_tokens,
                temperature=request.temperature or 0.7,
            )

            # Extract response
            response_text = response_data["choices"][0]["message"]["content"]
            tokens_used = response_data["usage"]["total_tokens"]

            # Create audit log
            audit_log = LLMAuditLog(
                user_id=user_id,
                tenant_id=self.tenant_id,
                request_type="general",
                prompt=request.prompt,
                response=response_text,
                tokens_used=tokens_used,
                model=self.openrouter_model,
                request_id=request_id,
            )

            await self.audit_service.log_llm_request(audit_log)

            return LLMResponse(
                response=response_text,
                tokens_used=tokens_used,
                model=self.openrouter_model,
            )

        except Exception as e:
            logger.error(f"LLM service error: {str(e)}")
            raise ServiceError(f"Failed to process LLM request: {str(e)}")

    async def ask_dashboard_question(
        self,
        request: DashboardQARequest,
        user_id: str,
        request_id: Optional[str] = None,
    ) -> DashboardQAResponse:
        """Ask a question about dashboard KPIs with predefined context"""

        # Check rate limit
        if not self._check_rate_limit(user_id):
            raise ValidationError(
                "Rate limit exceeded. Maximum 10 requests per minute."
            )

        # Get dashboard context
        context = await self._get_dashboard_context(
            request.context_type, request.include_data
        )

        # Prepare messages with dashboard context
        messages = [
            {
                "role": "system",
                "content": """Du bist ein spezialisierter Assistent für das ImmoNow-Dashboard. 
                Du hilfst Benutzern dabei, KPIs, Metriken und Funktionen zu verstehen.
                Antworte auf Deutsch, sei präzise und erkläre komplexe Konzepte verständlich.
                Wenn du Daten erwähnst, verwende die aktuellen Werte aus dem Kontext.""",
            },
            {
                "role": "user",
                "content": f"""Dashboard-Kontext:
{context}

Frage: {request.question}""",
            },
        ]

        try:
            # Make request to OpenRouter
            response_data = await self._make_openrouter_request(
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=0.3,  # Lower temperature for more consistent answers
            )

            # Extract response
            response_text = response_data["choices"][0]["message"]["content"]
            tokens_used = response_data["usage"]["total_tokens"]

            # Extract related KPIs (simple keyword matching)
            related_kpis = self._extract_related_kpis(response_text)

            # Create audit log
            audit_log = LLMAuditLog(
                user_id=user_id,
                tenant_id=self.tenant_id,
                request_type="dashboard_qa",
                prompt=request.question,
                response=response_text,
                tokens_used=tokens_used,
                model=self.openrouter_model,
                request_id=request_id,
            )

            await self.audit_service.log_llm_request(audit_log)

            return DashboardQAResponse(
                answer=response_text,
                context_used=context,
                related_kpis=related_kpis,
                tokens_used=tokens_used,
            )

        except Exception as e:
            logger.error(f"Dashboard LLM service error: {str(e)}")
            raise ServiceError(f"Failed to process dashboard question: {str(e)}")

    async def _get_dashboard_context(
        self, context_type: str, include_data: bool
    ) -> str:
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
            "potenzialwert": "Potenzialwert",
            "roi": "ROI",
            "cashflow": "Cashflow",
            "leerstand": "Leerstandsquote",
            "pipeline": "Pipeline-Wert",
            "conversion": "Conversion-Rate",
            "rendite": "Rendite",
            "wert": "Portfolio-Wert",
            "umsatz": "Umsatz",
            "provision": "Provision",
        }

        mentioned_kpis = []
        response_lower = response_text.lower()

        for keyword, kpi_name in kpi_keywords.items():
            if keyword in response_lower:
                mentioned_kpis.append(kpi_name)

        return mentioned_kpis

    async def generate_contact_summary(
        self,
        contact_data: Dict[str, Any],
        activities: Optional[List[Dict[str, Any]]] = None,
        user_id: str = None,
    ) -> str:
        """
        Generate AI summary of contact (3-5 sentences)

        Args:
            contact_data: Contact information
            activities: Recent activities (optional)
            user_id: User requesting summary

        Returns:
            Summary text
        """
        activities = activities or []

        # Build context
        name = contact_data.get("name", "Unbekannt")
        company = contact_data.get("company", "keine Firma angegeben")
        status = contact_data.get("status", "Lead")
        budget = contact_data.get("budget") or contact_data.get("budget_max")
        category = contact_data.get("category", "nicht kategorisiert")

        # Format budget
        budget_str = f"€{float(budget):,.0f}" if budget else "nicht angegeben"

        # Get latest activity
        latest_activity = ""
        if activities:
            latest = activities[0]
            activity_type = latest.get("type", "Aktivität")
            activity_date = latest.get("date", "")
            latest_activity = f"Letzte Interaktion: {activity_type} am {activity_date}."

        # Build prompt
        prompt = f"""Erstelle eine prägnante Zusammenfassung für folgenden Kontakt:

Name: {name}
Firma: {company}
Status: {status}
Kategorie: {category}
Budget: {budget_str}
Anzahl Aktivitäten: {len(activities)}
{latest_activity}

Erstelle eine professionelle Zusammenfassung in 3-5 Sätzen, die:
1. Die Beziehungsstufe beschreibt
2. Wichtige Interessen oder Bedürfnisse erwähnt
3. Den geschäftlichen Kontext einbezieht
4. Handlungsrelevant ist

Antworte nur mit der Zusammenfassung, ohne Überschriften oder Einleitungen."""

        messages = [
            {
                "role": "system",
                "content": "Du bist ein CRM-Assistent, der prägnante Kundenzusammenfassungen für Vertriebsmitarbeiter erstellt.",
            },
            {"role": "user", "content": prompt},
        ]

        try:
            response_data = await self._make_openrouter_request(
                messages=messages, max_tokens=300, temperature=0.7
            )

            summary = response_data["choices"][0]["message"]["content"].strip()

            # Log if user_id provided
            if user_id:
                audit_log = LLMAuditLog(
                    user_id=user_id,
                    tenant_id=self.tenant_id,
                    request_type="contact_summary",
                    prompt=prompt[:200],
                    response=summary[:200],
                    tokens_used=response_data["usage"]["total_tokens"],
                    model=self.openrouter_model,
                )
                await self.audit_service.log_llm_request(audit_log)

            return summary

        except Exception as e:
            logger.error(f"Contact summary generation error: {str(e)}")
            return "Zusammenfassung konnte nicht generiert werden."

    async def explain_lead_score(
        self,
        contact_data: Dict[str, Any],
        score_data: Dict[str, Any],
        user_id: str = None,
    ) -> str:
        """
        Generate explanation for lead score

        Args:
            contact_data: Contact information
            score_data: Lead score calculation data
            user_id: User requesting explanation

        Returns:
            Explanation text (2-3 sentences)
        """
        name = contact_data.get("name", "Dieser Kontakt")
        score = score_data.get("score", 0)
        category = score_data.get("category_label", "Warm")

        # Get top 3 signals
        signals = score_data.get("signals", [])[:3]
        signals_text = ", ".join([f"{s['name']} ({s['value']})" for s in signals])

        prompt = f"""Erkläre kurz und verständlich, warum {name} einen Lead Score von {score} Punkten ({category}) hat.

Wichtigste Faktoren:
{signals_text}

Erstelle eine Erklärung in 2-3 Sätzen, die:
1. Die Bewertung zusammenfasst
2. Die wichtigsten Gründe nennt
3. Handlungsrelevant ist

Antworte nur mit der Erklärung, ohne Überschriften."""

        messages = [
            {
                "role": "system",
                "content": "Du bist ein CRM-Assistent, der Lead-Bewertungen verständlich erklärt.",
            },
            {"role": "user", "content": prompt},
        ]

        try:
            response_data = await self._make_openrouter_request(
                messages=messages, max_tokens=200, temperature=0.7
            )

            explanation = response_data["choices"][0]["message"]["content"].strip()

            if user_id:
                audit_log = LLMAuditLog(
                    user_id=user_id,
                    tenant_id=self.tenant_id,
                    request_type="score_explanation",
                    prompt=prompt[:200],
                    response=explanation[:200],
                    tokens_used=response_data["usage"]["total_tokens"],
                    model=self.openrouter_model,
                )
                await self.audit_service.log_llm_request(audit_log)

            return explanation

        except Exception as e:
            logger.error(f"Score explanation error: {str(e)}")
            return f"Lead Score {score}/100 ({category})"

    async def suggest_next_action(
        self,
        contact_data: Dict[str, Any],
        score_data: Dict[str, Any],
        activities: Optional[List[Dict[str, Any]]] = None,
        goal: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate next best action recommendation

        Args:
            contact_data: Contact information
            score_data: Lead score data
            activities: Recent activities
            goal: Optional goal (follow_up/appointment/proposal/check_in)
            user_id: User requesting suggestion

        Returns:
            Dict with action_type, urgency, reason, script
        """
        activities = activities or []

        name = contact_data.get("name", "der Kontakt")
        status = contact_data.get("status", "Lead")
        score = score_data.get("score", 0)
        category = score_data.get("category", "warm")

        # Calculate days since last contact
        last_contact = contact_data.get("last_contact")
        days_since = "unbekannt"
        if last_contact:
            if isinstance(last_contact, str):
                try:
                    from datetime import datetime

                    last_dt = datetime.fromisoformat(
                        last_contact.replace("Z", "+00:00")
                    )
                    days_since = (
                        datetime.utcnow().replace(tzinfo=None)
                        - last_dt.replace(tzinfo=None)
                    ).days
                except:
                    pass

        activity_count = len(activities)

        goal_context = ""
        if goal:
            goal_map = {
                "follow_up": "Nachfassen nach vorherigem Kontakt",
                "appointment": "Termin vereinbaren",
                "proposal": "Angebot unterbreiten",
                "check_in": "Status-Check durchführen",
            }
            goal_context = f"\nGewünschtes Ziel: {goal_map.get(goal, goal)}"

        prompt = f"""Empfehle die beste nächste Aktion für folgenden Kontakt:

Name: {name}
Status: {status}
Lead Score: {score}/100 ({category})
Tage seit letztem Kontakt: {days_since}
Anzahl Aktivitäten: {activity_count}
{goal_context}

Empfehle EINE konkrete nächste Aktion. Antworte im folgenden JSON-Format:
{{
  "action_type": "call|email|meeting|note",
  "urgency": "24h|48h|this_week",
  "reason": "Ein Satz Begründung",
  "script": "2-3 Sätze konkrete Handlungsanweisung oder Gesprächseinstieg"
}}

Antworte NUR mit dem JSON, ohne zusätzlichen Text."""

        messages = [
            {
                "role": "system",
                "content": "Du bist ein CRM-Assistent, der konkrete Handlungsempfehlungen für Vertriebsmitarbeiter gibt. Antworte immer im JSON-Format.",
            },
            {"role": "user", "content": prompt},
        ]

        try:
            response_data = await self._make_openrouter_request(
                messages=messages, max_tokens=300, temperature=0.8
            )

            response_text = response_data["choices"][0]["message"]["content"].strip()

            # Try to parse JSON
            import json

            # Remove markdown code blocks if present
            if "```json" in response_text:
                response_text = (
                    response_text.split("```json")[1].split("```")[0].strip()
                )
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            recommendation = json.loads(response_text)

            if user_id:
                audit_log = LLMAuditLog(
                    user_id=user_id,
                    tenant_id=self.tenant_id,
                    request_type="next_action",
                    prompt=prompt[:200],
                    response=str(recommendation)[:200],
                    tokens_used=response_data["usage"]["total_tokens"],
                    model=self.openrouter_model,
                )
                await self.audit_service.log_llm_request(audit_log)

            return recommendation

        except Exception as e:
            logger.error(f"Next action suggestion error: {str(e)}")
            # Fallback recommendation
            return {
                "action_type": "call",
                "urgency": "48h",
                "reason": "Kontakt aufrechterhalten und Interesse bestätigen",
                "script": "Guten Tag! Ich wollte mich kurz melden und hören, wie es Ihnen geht. Gibt es aktuell etwas, womit ich Sie unterstützen kann?",
            }

    async def compose_email(
        self,
        contact_data: Dict[str, Any],
        goal: str = "follow_up",
        last_activity: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, str]:
        """
        Generate personalized email draft

        Args:
            contact_data: Contact information
            goal: Email goal (follow_up/appointment/proposal/check_in)
            last_activity: Last interaction data
            user_id: User requesting email

        Returns:
            Dict with subject and body
        """
        name = contact_data.get("name", "Sehr geehrte Damen und Herren")
        first_name = name.split()[0] if name else "Sehr geehrte Damen und Herren"
        company = contact_data.get("company", "")
        status = contact_data.get("status", "Lead")

        goal_descriptions = {
            "follow_up": "Nachfassen und Interesse aufrechterhalten",
            "appointment": "Termin für ein persönliches Gespräch vereinbaren",
            "proposal": "Ein konkretes Angebot unterbreiten",
            "check_in": "Status abfragen und Unterstützung anbieten",
        }

        goal_desc = goal_descriptions.get(goal, goal)

        activity_context = ""
        if last_activity:
            activity_type = last_activity.get("type", "Kontakt")
            activity_date = last_activity.get("date", "")
            activity_context = f"\nLetzter Kontakt: {activity_type} am {activity_date}"

        prompt = f"""Schreibe eine professionelle, personalisierte E-Mail für:

Empfänger: {name}
{f'Firma: {company}' if company else ''}
Status: {status}
Ziel: {goal_desc}
{activity_context}

Die E-Mail soll:
1. Eine persönliche, warme Anrede enthalten
2. Bezug auf den bisherigen Kontakt nehmen (falls vorhanden)
3. Mehrwert bieten
4. Eine klare Handlungsaufforderung (CTA) enthalten
5. Professionell aber freundlich sein
6. Max. 150 Wörter

Antworte im folgenden JSON-Format:
{{
  "subject": "E-Mail Betreff",
  "body": "E-Mail Text mit Anrede, Haupttext und Grußformel"
}}

Antworte NUR mit dem JSON, ohne zusätzlichen Text."""

        messages = [
            {
                "role": "system",
                "content": "Du bist ein professioneller E-Mail-Assistent für Immobilienvertrieb. Schreibe personalisierte, wirkungsvolle E-Mails. Antworte immer im JSON-Format.",
            },
            {"role": "user", "content": prompt},
        ]

        try:
            response_data = await self._make_openrouter_request(
                messages=messages, max_tokens=500, temperature=0.9
            )

            response_text = response_data["choices"][0]["message"]["content"].strip()

            # Try to parse JSON
            import json

            # Remove markdown code blocks if present
            if "```json" in response_text:
                response_text = (
                    response_text.split("```json")[1].split("```")[0].strip()
                )
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            email_data = json.loads(response_text)

            if user_id:
                audit_log = LLMAuditLog(
                    user_id=user_id,
                    tenant_id=self.tenant_id,
                    request_type="email_compose",
                    prompt=prompt[:200],
                    response=str(email_data)[:200],
                    tokens_used=response_data["usage"]["total_tokens"],
                    model=self.openrouter_model,
                )
                await self.audit_service.log_llm_request(audit_log)

            return email_data

        except Exception as e:
            logger.error(f"Email composition error: {str(e)}")
            # Fallback email
            return {
                "subject": f"Ihre Immobilienanfrage - {company if company else 'Nachfrage'}",
                "body": f"""Hallo {first_name},

ich hoffe, es geht Ihnen gut! Ich wollte mich kurz bei Ihnen melden und nachfragen, wie ich Sie am besten unterstützen kann.

Gibt es aktuell etwas, das Sie interessiert oder Fragen, die Sie haben?

Ich freue mich auf Ihre Rückmeldung!

Mit freundlichen Grüßen""",
            }
    
    async def generate_email_response(
        self,
        original_email: str,
        context: Optional[str] = None,
        tone: str = "professional",
        user_id: Optional[str] = None
    ) -> str:
        """
        Generiere automatische E-Mail-Antwort
        
        Args:
            original_email: Original E-Mail-Text
            context: Zusätzlicher Kontext
            tone: Ton (professional, friendly, formal)
            user_id: User ID für Audit
        
        Returns:
            E-Mail-Antwort-Text
        """
        system_prompt = f"""Du bist ein professioneller E-Mail-Assistent für Immobilienmakler.
Erstelle eine passende Antwort auf die gegebene E-Mail.

Ton: {tone}
Sprache: Deutsch
Struktur: Anrede, Haupttext, Abschluss, Grußformel

Sei höflich, präzise und hilfreich."""
        
        user_prompt = f"Ursprüngliche E-Mail:\n{original_email}"
        if context:
            user_prompt += f"\n\nZusätzlicher Kontext:\n{context}"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        try:
            response_data = await self._make_openrouter_request(
                messages=messages,
                max_tokens=800,
                temperature=0.7
            )
            
            email_response = response_data["choices"][0]["message"]["content"].strip()
            
            if user_id:
                audit_log = LLMAuditLog(
                    user_id=user_id,
                    tenant_id=self.tenant_id,
                    request_type="email_generation",
                    prompt=original_email[:200],
                    response=email_response[:200],
                    tokens_used=response_data["usage"]["total_tokens"],
                    model=self.openrouter_model,
                )
                await self.audit_service.log_llm_request(audit_log)
            
            return email_response
            
        except Exception as e:
            logger.error(f"Email generation error: {str(e)}")
            raise ServiceError(f"Email generation failed: {str(e)}")
    
    async def summarize_meeting_notes(
        self,
        meeting_notes: str,
        participants: Optional[List[str]] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fasse Meeting-Notizen zusammen
        
        Args:
            meeting_notes: Rohe Meeting-Notizen
            participants: Teilnehmer-Liste
            user_id: User ID für Audit
        
        Returns:
            Dict mit summary, key_points, action_items, decisions
        """
        system_prompt = """Du bist ein Meeting-Protokollant.
Analysiere die Meeting-Notizen und erstelle eine strukturierte Zusammenfassung.

Antworte als JSON:
{
  "summary": "Kurze Zusammenfassung (2-3 Sätze)",
  "key_points": ["Punkt 1", "Punkt 2", "Punkt 3"],
  "action_items": [{"task": "...", "assignee": "...", "deadline": "..."}],
  "decisions": ["Entscheidung 1", "Entscheidung 2"],
  "next_meeting": "Datum/Info zum nächsten Meeting oder null"
}"""
        
        user_prompt = f"Meeting-Notizen:\n{meeting_notes}"
        if participants:
            user_prompt += f"\n\nTeilnehmer: {', '.join(participants)}"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        try:
            response_data = await self._make_openrouter_request(
                messages=messages,
                max_tokens=1000,
                temperature=0.3
            )
            
            import json
            result = json.loads(response_data["choices"][0]["message"]["content"])
            
            if user_id:
                audit_log = LLMAuditLog(
                    user_id=user_id,
                    tenant_id=self.tenant_id,
                    request_type="meeting_summary",
                    prompt=meeting_notes[:200],
                    response=str(result)[:200],
                    tokens_used=response_data["usage"]["total_tokens"],
                    model=self.openrouter_model,
                )
                await self.audit_service.log_llm_request(audit_log)
            
            return result
            
        except Exception as e:
            logger.error(f"Meeting summary error: {str(e)}")
            return {
                "summary": "Zusammenfassung konnte nicht erstellt werden",
                "key_points": [],
                "action_items": [],
                "decisions": [],
                "next_meeting": None
            }
    
    async def extract_requirements(
        self,
        text: str,
        context_type: str = "general",
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Extrahiere Requirements aus Text
        
        Args:
            text: Text mit Requirements
            context_type: Kontext (property, customer, project, general)
            user_id: User ID für Audit
        
        Returns:
            Dict mit requirements, priorities, constraints, timeline
        """
        system_prompt = f"""Du bist ein Requirements-Analyst für Immobilienprojekte.
Extrahiere strukturierte Anforderungen aus dem gegebenen Text.

Kontext: {context_type}

Antworte als JSON:
{{
  "requirements": [
    {{"id": "REQ-1", "description": "...", "category": "functional|non-functional|constraint", "priority": "must|should|could"}},
  ],
  "priorities": {{"must": 3, "should": 2, "could": 1}},
  "constraints": ["Constraint 1", "Constraint 2"],
  "timeline": "Zeitrahmen falls erwähnt oder null"
}}"""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ]
        
        try:
            response_data = await self._make_openrouter_request(
                messages=messages,
                max_tokens=1500,
                temperature=0.3
            )
            
            import json
            result = json.loads(response_data["choices"][0]["message"]["content"])
            
            if user_id:
                audit_log = LLMAuditLog(
                    user_id=user_id,
                    tenant_id=self.tenant_id,
                    request_type="requirements_extraction",
                    prompt=text[:200],
                    response=str(result)[:200],
                    tokens_used=response_data["usage"]["total_tokens"],
                    model=self.openrouter_model,
                )
                await self.audit_service.log_llm_request(audit_log)
            
            return result
            
        except Exception as e:
            logger.error(f"Requirements extraction error: {str(e)}")
            return {
                "requirements": [],
                "priorities": {"must": 0, "should": 0, "could": 0},
                "constraints": [],
                "timeline": None
            }
    
    async def translate_content(
        self,
        content: str,
        source_lang: str,
        target_lang: str,
        preserve_formatting: bool = True,
        user_id: Optional[str] = None
    ) -> str:
        """
        Übersetze Inhalt
        
        Args:
            content: Zu übersetzender Text
            source_lang: Quellsprache (de, en, fr, es, etc.)
            target_lang: Zielsprache
            preserve_formatting: Formatierung beibehalten
            user_id: User ID für Audit
        
        Returns:
            Übersetzter Text
        """
        formatting_note = " Behalte die Formatierung (Absätze, Listen, etc.) bei." if preserve_formatting else ""
        
        system_prompt = f"""Du bist ein professioneller Übersetzer für Immobilien-Inhalte.
Übersetze den Text von {source_lang} nach {target_lang}.{formatting_note}
Behalte den Ton und Stil bei. Übersetze nur den Inhalt, keine Erklärungen."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": content}
        ]
        
        try:
            response_data = await self._make_openrouter_request(
                messages=messages,
                max_tokens=len(content) * 2,  # Approximation
                temperature=0.3
            )
            
            translation = response_data["choices"][0]["message"]["content"].strip()
            
            if user_id:
                audit_log = LLMAuditLog(
                    user_id=user_id,
                    tenant_id=self.tenant_id,
                    request_type="translation",
                    prompt=f"{source_lang}->{target_lang}: {content[:100]}",
                    response=translation[:200],
                    tokens_used=response_data["usage"]["total_tokens"],
                    model=self.openrouter_model,
                )
                await self.audit_service.log_llm_request(audit_log)
            
            return translation
            
        except Exception as e:
            logger.error(f"Translation error: {str(e)}")
            raise ServiceError(f"Translation failed: {str(e)}")
    
    async def analyze_sentiment(
        self,
        text: str,
        context: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analysiere Sentiment eines Texts
        
        Args:
            text: Zu analysierender Text
            context: Zusätzlicher Kontext
            user_id: User ID für Audit
        
        Returns:
            Dict mit sentiment, score, emotions, insights
        """
        system_prompt = """Du bist ein Sentiment-Analyse-Experte.
Analysiere die Stimmung und Emotionen im gegebenen Text.

Antworte als JSON:
{
  "sentiment": "very_positive|positive|neutral|negative|very_negative",
  "score": -1.0 bis +1.0,
  "emotions": ["Emotion1", "Emotion2"],
  "confidence": 0.0-1.0,
  "key_phrases": ["Phrase 1", "Phrase 2"],
  "insights": "Kurze Erklärung der Analyse"
}"""
        
        user_prompt = f"Text: {text}"
        if context:
            user_prompt += f"\n\nKontext: {context}"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        try:
            response_data = await self._make_openrouter_request(
                messages=messages,
                max_tokens=500,
                temperature=0.2
            )
            
            import json
            result = json.loads(response_data["choices"][0]["message"]["content"])
            
            if user_id:
                audit_log = LLMAuditLog(
                    user_id=user_id,
                    tenant_id=self.tenant_id,
                    request_type="sentiment_analysis",
                    prompt=text[:200],
                    response=str(result)[:200],
                    tokens_used=response_data["usage"]["total_tokens"],
                    model=self.openrouter_model,
                )
                await self.audit_service.log_llm_request(audit_log)
            
            return result
            
        except Exception as e:
            logger.error(f"Sentiment analysis error: {str(e)}")
            return {
                "sentiment": "neutral",
                "score": 0.0,
                "emotions": [],
                "confidence": 0.0,
                "key_phrases": [],
                "insights": "Analyse fehlgeschlagen"
            }