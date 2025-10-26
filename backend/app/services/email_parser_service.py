"""
Email Parser Service für Lead-Ingestion
"""
import re
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import hashlib

logger = logging.getLogger(__name__)


@dataclass
class ParsedLead:
    """Parsed lead data from email"""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    budget: Optional[float] = None
    property_type: Optional[str] = None
    location: Optional[str] = None
    message: Optional[str] = None
    source: str = "email"
    confidence: float = 0.0
    raw_text: str = ""


class EmailParserService:
    """Service für Email-Parsing und Lead-Extraktion"""
    
    def __init__(self):
        self.patterns = self._load_patterns()
    
    def _load_patterns(self) -> Dict[str, List[re.Pattern]]:
        """Lade Regex-Patterns für verschiedene Datenfelder"""
        return {
            'name': [
                # Deutsche Namen
                re.compile(r'(?:Name|Ihr Name|Mein Name)[\s:]*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)*)', re.IGNORECASE),
                re.compile(r'(?:Ich bin|Mein Name ist|Ich heiße)[\s:]*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)*)', re.IGNORECASE),
                # Englische Namen
                re.compile(r'(?:Name|My name|I am)[\s:]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', re.IGNORECASE),
                re.compile(r'(?:I am|My name is)[\s:]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', re.IGNORECASE),
            ],
            'email': [
                re.compile(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'),
                re.compile(r'(?:E-Mail|Email|Mail)[\s:]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', re.IGNORECASE),
            ],
            'phone': [
                # Deutsche Telefonnummern
                re.compile(r'(?:\+49|0049|0)[\s\-]?(\d{2,4}[\s\-]?\d{2,4}[\s\-]?\d{2,4})'),
                re.compile(r'(?:Tel|Telefon|Phone)[\s:]*(\+?49[\s\-]?\d{2,4}[\s\-]?\d{2,4}[\s\-]?\d{2,4})', re.IGNORECASE),
                # Internationale Formate
                re.compile(r'(\+\d{1,3}[\s\-]?\d{2,4}[\s\-]?\d{2,4}[\s\-]?\d{2,4})'),
            ],
            'budget': [
                # Deutsche Budget-Formate
                re.compile(r'(?:Budget|Preis|Kosten)[\s:]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*€?', re.IGNORECASE),
                re.compile(r'(?:bis zu|maximal|höchstens)[\s:]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*€?', re.IGNORECASE),
                # Englische Budget-Formate
                re.compile(r'(?:Budget|Price|Cost)[\s:]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*\$?', re.IGNORECASE),
                re.compile(r'(?:up to|maximum|max)[\s:]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*\$?', re.IGNORECASE),
            ],
            'property_type': [
                re.compile(r'(?:Immobilientyp|Objekttyp|Typ)[\s:]*([A-ZÄÖÜa-zäöüß\s]+)', re.IGNORECASE),
                re.compile(r'(?:Wohnung|Haus|Eigentumswohnung|Reihenhaus|Einfamilienhaus)', re.IGNORECASE),
                re.compile(r'(?:apartment|house|condo|townhouse|single family)', re.IGNORECASE),
            ],
            'location': [
                re.compile(r'(?:Standort|Ort|Stadt|Location)[\s:]*([A-ZÄÖÜa-zäöüß\s]+)', re.IGNORECASE),
                re.compile(r'(?:in|bei|nahe)[\s:]*([A-ZÄÖÜa-zäöüß\s]+)', re.IGNORECASE),
                # Deutsche Städte
                re.compile(r'(Hamburg|Berlin|München|Köln|Frankfurt|Stuttgart|Düsseldorf|Dortmund|Essen|Leipzig)', re.IGNORECASE),
            ]
        }
    
    def parse_email(self, subject: str, body: str, sender_email: str = None) -> ParsedLead:
        """
        Parse Email für Lead-Daten
        
        Args:
            subject: Email-Betreff
            body: Email-Body (Text)
            sender_email: Absender-Email
            
        Returns:
            ParsedLead mit extrahierten Daten
        """
        # Kombiniere Subject und Body für Parsing
        full_text = f"{subject}\n\n{body}"
        
        parsed_lead = ParsedLead(
            raw_text=full_text,
            source="email"
        )
        
        # Extrahiere Email aus Absender falls nicht im Text gefunden
        if sender_email:
            parsed_lead.email = sender_email
        
        # Parse verschiedene Felder
        parsed_lead.name = self._extract_name(full_text)
        parsed_lead.email = parsed_lead.email or self._extract_email(full_text)
        parsed_lead.phone = self._extract_phone(full_text)
        parsed_lead.budget = self._extract_budget(full_text)
        parsed_lead.property_type = self._extract_property_type(full_text)
        parsed_lead.location = self._extract_location(full_text)
        parsed_lead.message = self._extract_message(full_text)
        
        # Berechne Confidence-Score
        parsed_lead.confidence = self._calculate_confidence(parsed_lead)
        
        logger.info(f"Parsed lead with confidence {parsed_lead.confidence}: {parsed_lead.name}, {parsed_lead.email}")
        
        return parsed_lead
    
    def _extract_name(self, text: str) -> Optional[str]:
        """Extrahiere Name aus Text"""
        for pattern in self.patterns['name']:
            match = pattern.search(text)
            if match:
                name = match.group(1).strip()
                # Validiere Name (mindestens 2 Zeichen, keine Zahlen)
                if len(name) >= 2 and not re.search(r'\d', name):
                    return name
        return None
    
    def _extract_email(self, text: str) -> Optional[str]:
        """Extrahiere Email aus Text"""
        for pattern in self.patterns['email']:
            match = pattern.search(text)
            if match:
                email = match.group(1).strip().lower()
                # Validiere Email-Format
                if re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                    return email
        return None
    
    def _extract_phone(self, text: str) -> Optional[str]:
        """Extrahiere Telefonnummer aus Text"""
        for pattern in self.patterns['phone']:
            match = pattern.search(text)
            if match:
                phone = match.group(1).strip()
                # Bereinige Telefonnummer
                phone = re.sub(r'[\s\-]', '', phone)
                # Validiere Länge (mindestens 10 Ziffern)
                if len(re.sub(r'\D', '', phone)) >= 10:
                    return phone
        return None
    
    def _extract_budget(self, text: str) -> Optional[float]:
        """Extrahiere Budget aus Text"""
        for pattern in self.patterns['budget']:
            match = pattern.search(text)
            if match:
                budget_str = match.group(1).strip()
                try:
                    # Konvertiere deutsche Zahlenformate
                    budget_str = budget_str.replace('.', '').replace(',', '.')
                    budget = float(budget_str)
                    # Validiere Budget (zwischen 10k und 10M)
                    if 10000 <= budget <= 10000000:
                        return budget
                except ValueError:
                    continue
        return None
    
    def _extract_property_type(self, text: str) -> Optional[str]:
        """Extrahiere Immobilientyp aus Text"""
        for pattern in self.patterns['property_type']:
            match = pattern.search(text)
            if match:
                prop_type = match.group(1).strip().lower()
                # Normalisiere Property-Typ
                type_mapping = {
                    'wohnung': 'apartment',
                    'eigentumswohnung': 'apartment',
                    'haus': 'house',
                    'einfamilienhaus': 'house',
                    'reihenhaus': 'townhouse',
                    'condo': 'apartment',
                    'single family': 'house',
                    'townhouse': 'townhouse'
                }
                return type_mapping.get(prop_type, prop_type)
        return None
    
    def _extract_location(self, text: str) -> Optional[str]:
        """Extrahiere Standort aus Text"""
        for pattern in self.patterns['location']:
            match = pattern.search(text)
            if match:
                location = match.group(1).strip()
                # Validiere Location (mindestens 2 Zeichen)
                if len(location) >= 2:
                    return location
        return None
    
    def _extract_message(self, text: str) -> Optional[str]:
        """Extrahiere Nachricht aus Text"""
        # Entferne bereits extrahierte Felder
        cleaned_text = text
        
        # Entferne häufige Phrasen
        phrases_to_remove = [
            r'Mit freundlichen Grüßen.*',
            r'Best regards.*',
            r'Viele Grüße.*',
            r'Kind regards.*',
            r'Anhang.*',
            r'Attachment.*'
        ]
        
        for phrase in phrases_to_remove:
            cleaned_text = re.sub(phrase, '', cleaned_text, flags=re.IGNORECASE | re.DOTALL)
        
        # Bereinige Text
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
        
        # Validiere Message-Länge
        if len(cleaned_text) >= 10:
            return cleaned_text[:500]  # Max 500 Zeichen
        
        return None
    
    def _calculate_confidence(self, parsed_lead: ParsedLead) -> float:
        """Berechne Confidence-Score für geparste Daten"""
        score = 0.0
        
        # Basis-Score für vorhandene Felder
        if parsed_lead.name:
            score += 0.3
        if parsed_lead.email:
            score += 0.3
        if parsed_lead.phone:
            score += 0.2
        if parsed_lead.budget:
            score += 0.1
        if parsed_lead.property_type:
            score += 0.05
        if parsed_lead.location:
            score += 0.05
        
        # Bonus für vollständige Kontaktdaten
        if parsed_lead.name and parsed_lead.email and parsed_lead.phone:
            score += 0.1
        
        # Bonus für Budget-Angabe
        if parsed_lead.budget and parsed_lead.budget > 100000:
            score += 0.1
        
        return min(score, 1.0)
    
    def generate_lead_hash(self, parsed_lead: ParsedLead) -> str:
        """Generiere Hash für Lead-Deduplication"""
        # Verwende Email als primären Identifier
        if parsed_lead.email:
            return hashlib.md5(parsed_lead.email.lower().encode()).hexdigest()
        
        # Fallback: Kombiniere Name + Telefon
        if parsed_lead.name and parsed_lead.phone:
            identifier = f"{parsed_lead.name.lower()}{parsed_lead.phone}"
            return hashlib.md5(identifier.encode()).hexdigest()
        
        # Letzter Fallback: Raw-Text Hash
        return hashlib.md5(parsed_lead.raw_text.encode()).hexdigest()
    
    def validate_lead(self, parsed_lead: ParsedLead) -> Tuple[bool, List[str]]:
        """Validiere geparste Lead-Daten"""
        errors = []
        
        # Mindestanforderungen
        if not parsed_lead.email:
            errors.append("Email ist erforderlich")
        
        if not parsed_lead.name:
            errors.append("Name ist erforderlich")
        
        # Email-Validierung
        if parsed_lead.email and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', parsed_lead.email):
            errors.append("Ungültige Email-Adresse")
        
        # Telefon-Validierung
        if parsed_lead.phone and len(re.sub(r'\D', '', parsed_lead.phone)) < 10:
            errors.append("Ungültige Telefonnummer")
        
        # Budget-Validierung
        if parsed_lead.budget and (parsed_lead.budget < 10000 or parsed_lead.budget > 10000000):
            errors.append("Budget außerhalb des gültigen Bereichs")
        
        # Confidence-Check
        if parsed_lead.confidence < 0.3:
            errors.append("Niedrige Confidence-Score")
        
        return len(errors) == 0, errors
