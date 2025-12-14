"""
AI Manager Service
Zentrale Verwaltung aller KI-Provider und AI-Operationen
"""
import os
import asyncio
import logging
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from openai import AsyncOpenAI
import json

from app.core.errors import ValidationError, ServiceError

logger = logging.getLogger(__name__)


class AIManager:
    """
    Zentraler Manager für alle KI-Operationen
    Unterstützt verschiedene Provider: OpenRouter, OpenAI, Azure
    """
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.provider = os.getenv("AI_PROVIDER", "openrouter")
        
        # Provider-Konfiguration
        if self.provider == "openrouter":
            self.api_key = os.getenv("OPENROUTER_API_KEY")
            self.base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
            self.model = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-chat-v3.1:free")
            self.site_url = os.getenv("SITE_URL", "https://immonow.com")
            self.site_name = os.getenv("SITE_NAME", "ImmoNow Dashboard")
        elif self.provider == "openai":
            self.api_key = os.getenv("OPENAI_API_KEY")
            self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
            self.model = os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview")
            self.site_url = None
            self.site_name = None
        elif self.provider == "azure":
            self.api_key = os.getenv("AZURE_OPENAI_API_KEY")
            self.base_url = os.getenv("AZURE_OPENAI_ENDPOINT")
            self.model = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4")
            self.api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
            self.site_url = None
            self.site_name = None
        else:
            raise ServiceError(f"Unsupported AI provider: {self.provider}")
        
        if not self.api_key:
            raise ServiceError(f"{self.provider.upper()} API key not configured")
        
        # Konfiguration
        self.timeout = int(os.getenv("OPENROUTER_TIMEOUT", "60"))
        self.max_tokens = int(os.getenv("OPENROUTER_MAX_TOKENS", "4096"))
        self.temperature = float(os.getenv("OPENROUTER_TEMPERATURE", "0.7"))
        self.max_retries = int(os.getenv("AI_MAX_RETRIES", "3"))
        
        # Initialize client
        self.client = self._initialize_client()
        
        logger.info(f"✅ AI Manager initialized with provider: {self.provider}, model: {self.model}")
    
    def _initialize_client(self) -> AsyncOpenAI:
        """Initialize OpenAI-compatible client"""
        if self.provider == "azure":
            from openai import AsyncAzureOpenAI
            return AsyncAzureOpenAI(
                api_key=self.api_key,
                api_version=self.api_version,
                azure_endpoint=self.base_url,
                timeout=self.timeout
            )
        else:
            return AsyncOpenAI(
                base_url=self.base_url,
                api_key=self.api_key,
                timeout=self.timeout
            )
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        response_format: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Einheitliche Chat-Completion-Schnittstelle für alle Provider
        
        Args:
            messages: Liste von Chat-Messages
            temperature: Temperature-Parameter (optional)
            max_tokens: Max Tokens (optional)
            response_format: Response Format (z.B. {"type": "json_object"})
        
        Returns:
            Dict mit response, tokens_used, model
        """
        temp = temperature if temperature is not None else self.temperature
        tokens = max_tokens if max_tokens is not None else self.max_tokens
        
        for attempt in range(self.max_retries):
            try:
                extra_headers = {}
                if self.provider == "openrouter" and self.site_url:
                    extra_headers["HTTP-Referer"] = self.site_url
                    extra_headers["X-Title"] = self.site_name
                
                kwargs = {
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": tokens,
                    "temperature": temp,
                }
                
                if extra_headers:
                    kwargs["extra_headers"] = extra_headers
                
                if response_format:
                    kwargs["response_format"] = response_format
                
                completion = await self.client.chat.completions.create(**kwargs)
                
                return {
                    "response": completion.choices[0].message.content,
                    "tokens_used": completion.usage.total_tokens,
                    "prompt_tokens": completion.usage.prompt_tokens,
                    "completion_tokens": completion.usage.completion_tokens,
                    "model": completion.model,
                    "finish_reason": completion.choices[0].finish_reason
                }
                
            except Exception as e:
                error_msg = str(e)
                logger.warning(f"AI request failed (attempt {attempt + 1}/{self.max_retries}): {error_msg}")
                
                # Retry logic
                if "429" in error_msg or "rate_limit" in error_msg.lower():
                    wait_time = 2 ** attempt
                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(wait_time)
                        continue
                
                if "timeout" in error_msg.lower() and attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                
                if attempt == self.max_retries - 1:
                    raise ServiceError(f"AI request failed after {self.max_retries} retries: {error_msg}")
        
        raise ServiceError("AI request failed unexpectedly")
    
    async def generate_task_from_text(self, text: str, context: Optional[str] = None) -> Dict[str, Any]:
        """
        Generiere strukturierte Task-Daten aus Freitext
        
        Args:
            text: Freitext-Beschreibung
            context: Zusätzlicher Kontext (optional)
        
        Returns:
            Dict mit title, description, priority, due_date, labels, tags, story_points
        """
        system_prompt = """Du bist ein Projektmanagement-Assistent für Immobilienverwaltung.
Analysiere den gegebenen Text und extrahiere eine strukturierte Aufgabe.

Antworte IMMER als valides JSON mit folgender Struktur:
{
  "title": "Kurzer, prägnanter Titel (max 100 Zeichen)",
  "description": "Detaillierte Beschreibung der Aufgabe",
  "priority": "low|medium|high|urgent",
  "suggested_due_days": 3-30 (Tage bis Fälligkeit),
  "labels": ["label1", "label2"],
  "tags": ["tag1", "tag2"],
  "story_points": 1-8 (Schätzung Aufwand)
}"""
        
        user_prompt = f"Text: {text}"
        if context:
            user_prompt = f"Kontext: {context}\n\n{user_prompt}"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        result = await self.chat_completion(
            messages=messages,
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        try:
            task_data = json.loads(result["response"])
            return task_data
        except json.JSONDecodeError:
            # Fallback wenn JSON nicht geparst werden kann
            return {
                "title": text[:100],
                "description": text,
                "priority": "medium",
                "suggested_due_days": 7,
                "labels": ["auto-generated"],
                "tags": ["ai"],
                "story_points": 3
            }
    
    async def calculate_task_priority(
        self, 
        task_title: str, 
        task_description: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Berechne Priorität einer Aufgabe
        
        Returns:
            Dict mit priority, score, rationale
        """
        system_prompt = """Du bist ein Projektmanagement-Experte.
Bewerte die Priorität der gegebenen Aufgabe basierend auf:
- Dringlichkeit
- Wichtigkeit
- Impact auf Geschäftsprozesse
- Abhängigkeiten

Antworte als JSON:
{
  "priority": "low|medium|high|urgent",
  "score": 0.0-1.0,
  "rationale": "Begründung in 1-2 Sätzen"
}"""
        
        user_prompt = f"Titel: {task_title}\nBeschreibung: {task_description}"
        if context:
            user_prompt += f"\n\nZusätzlicher Kontext: {json.dumps(context, ensure_ascii=False)}"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        result = await self.chat_completion(
            messages=messages,
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        
        try:
            return json.loads(result["response"])
        except json.JSONDecodeError:
            return {
                "priority": "medium",
                "score": 0.5,
                "rationale": "Automatische Priorität basierend auf Standardheuristik"
            }
    
    async def summarize_board(
        self, 
        board_name: str,
        tasks: List[Dict[str, Any]],
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Erstelle Board-Zusammenfassung
        
        Returns:
            Dict mit summary, highlights, risks, blockers, suggested_actions
        """
        system_prompt = """Du bist ein Projektmanagement-Analyst.
Analysiere das gegebene Kanban-Board und erstelle eine prägnante Zusammenfassung.

Antworte als JSON:
{
  "summary": "Kurze Gesamtzusammenfassung (2-3 Sätze)",
  "highlights": ["Erfolg 1", "Erfolg 2"],
  "risks": ["Risiko 1", "Risiko 2"],
  "blockers": ["Blocker 1", "Blocker 2"],
  "suggested_actions": ["Aktion 1", "Aktion 2"]
}"""
        
        tasks_summary = "\n".join([
            f"- [{t.get('status', 'todo')}] {t.get('title', 'Untitled')} (Prio: {t.get('priority', 'medium')})"
            for t in tasks[:20]  # Limit auf 20 Tasks
        ])
        
        user_prompt = f"Board: {board_name}\n\nAufgaben:\n{tasks_summary}"
        if context:
            user_prompt += f"\n\nKontext: {context}"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        result = await self.chat_completion(
            messages=messages,
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        try:
            return json.loads(result["response"])
        except json.JSONDecodeError:
            return {
                "summary": f"Board '{board_name}' mit {len(tasks)} Aufgaben",
                "highlights": [],
                "risks": [],
                "blockers": [],
                "suggested_actions": []
            }
    
    async def analyze_property(
        self,
        property_data: Dict[str, Any],
        geodata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analysiere Immobilie und erstelle qualitative Bewertung
        
        Returns:
            Dict mit qualitative_factors, market_position, value_adjustment_percent, insights
        """
        system_prompt = """Du bist ein Immobiliengutachter-Experte.
Analysiere die gegebene Immobilie und bewerte qualitative Faktoren, die den Wert beeinflussen.

Antworte als JSON:
{
  "qualitative_factors": {
    "location_quality": "poor|fair|good|excellent",
    "condition_impact": -20 bis +20 (Prozent),
    "features_impact": -10 bis +15 (Prozent),
    "market_trend": "declining|stable|growing|hot"
  },
  "market_position": "below|average|above|premium",
  "value_adjustment_percent": -30 bis +30 (Gesamtanpassung in Prozent),
  "insights": ["Insight 1", "Insight 2", "Insight 3"],
  "recommendation": "Empfehlung in 2-3 Sätzen"
}"""
        
        property_summary = f"""
Immobilie:
- Typ: {property_data.get('property_type', 'unknown')}
- Größe: {property_data.get('size', 0)} m²
- Zimmer: {property_data.get('rooms', 'N/A')}
- Baujahr: {property_data.get('build_year', 'N/A')}
- Zustand: {property_data.get('condition', 'N/A')}
- Lage: {property_data.get('city', 'N/A')}, PLZ {property_data.get('postal_code', 'N/A')}
- Adresse: {property_data.get('address', 'N/A')}
- Ausstattung: {', '.join(property_data.get('features', []))}
"""
        
        if geodata:
            property_summary += f"\n\nStandortdaten:\n{json.dumps(geodata, ensure_ascii=False, indent=2)}"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": property_summary}
        ]
        
        result = await self.chat_completion(
            messages=messages,
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        try:
            return json.loads(result["response"])
        except json.JSONDecodeError:
            return {
                "qualitative_factors": {
                    "location_quality": "fair",
                    "condition_impact": 0,
                    "features_impact": 0,
                    "market_trend": "stable"
                },
                "market_position": "average",
                "value_adjustment_percent": 0,
                "insights": [],
                "recommendation": "Weitere Daten erforderlich für detaillierte Bewertung"
            }
    
    async def generate_expose_content(
        self,
        property_data: Dict[str, Any],
        audience: str = "buyers",
        tone: str = "professional",
        language: str = "de",
        length: str = "medium",
        keywords: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generiere Exposé-Inhalte
        
        Returns:
            Dict mit title, description, highlights, call_to_action
        """
        system_prompt = f"""Du bist ein professioneller Immobilien-Texter.
Erstelle ein ansprechendes Exposé für die gegebene Immobilie.

Zielgruppe: {audience}
Ton: {tone}
Sprache: {language}
Länge: {length}

Antworte als JSON:
{{
  "title": "Ansprechender Titel (max 80 Zeichen)",
  "description": "Hauptbeschreibung ({length} Länge)",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
  "call_to_action": "Call-to-Action Text",
  "seo_keywords": ["keyword1", "keyword2"]
}}"""
        
        property_summary = f"""
Immobilie:
- Typ: {property_data.get('property_type', 'unknown')}
- Größe: {property_data.get('size', 0)} m²
- Zimmer: {property_data.get('rooms', 'N/A')}
- Baujahr: {property_data.get('build_year', 'N/A')}
- Preis: {property_data.get('price', 'N/A')}€
- Lage: {property_data.get('location', 'N/A')}
- Ausstattung: {', '.join(property_data.get('features', []))}
"""
        
        if keywords:
            property_summary += f"\nFokus-Keywords: {', '.join(keywords)}"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": property_summary}
        ]
        
        result = await self.chat_completion(
            messages=messages,
            temperature=0.7
        )
        
        try:
            return json.loads(result["response"])
        except json.JSONDecodeError:
            # Fallback: Parse aus Text
            response_text = result["response"]
            return {
                "title": f"Attraktive {property_data.get('property_type', 'Immobilie')}",
                "description": response_text,
                "highlights": [],
                "call_to_action": "Jetzt Besichtigung vereinbaren!",
                "seo_keywords": keywords or []
            }
    
    async def analyze_contact_insights(
        self,
        contact_data: Dict[str, Any],
        activities: List[Dict[str, Any]],
        score_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generiere AI Insights für Kontakt
        
        Returns:
            Dict mit summary, score_explanation, segment, top_signals, next_actions
        """
        system_prompt = """Du bist ein CRM-Analyst für Immobilienmakler.
Analysiere den Kontakt und generiere verwertbare Insights.

Antworte als JSON:
{
  "summary": "Kurze Zusammenfassung des Kontakts (2-3 Sätze)",
  "score_explanation": "Erklärung des Lead-Scores",
  "segment": "A-Kunde|B-Kunde|C-Kunde",
  "top_signals": ["Signal 1", "Signal 2", "Signal 3"],
  "next_actions": ["Aktion 1", "Aktion 2"],
  "sentiment": "positive|neutral|negative",
  "conversion_probability": 0.0-1.0
}"""
        
        contact_summary = f"""
Kontakt:
- Name: {contact_data.get('name', 'N/A')}
- Status: {contact_data.get('status', 'N/A')}
- Kategorie: {contact_data.get('category', 'N/A')}
- Budget: {contact_data.get('budget', 'N/A')}€
- Priorität: {contact_data.get('priority', 'N/A')}
- Quelle: {contact_data.get('source', 'N/A')}

Aktivitäten: {len(activities)} Interaktionen
"""
        
        if score_data:
            contact_summary += f"\n\nLead Score: {score_data.get('score', 'N/A')}/100"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": contact_summary}
        ]
        
        result = await self.chat_completion(
            messages=messages,
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        try:
            return json.loads(result["response"])
        except json.JSONDecodeError:
            return {
                "summary": f"Kontakt {contact_data.get('name', 'N/A')} im Status {contact_data.get('status', 'N/A')}",
                "score_explanation": "Automatische Bewertung",
                "segment": "B-Kunde",
                "top_signals": [],
                "next_actions": [],
                "sentiment": "neutral",
                "conversion_probability": 0.5
            }

