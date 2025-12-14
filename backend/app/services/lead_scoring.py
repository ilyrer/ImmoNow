"""
Lead Scoring Service for Contact Prioritization
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal

logger = logging.getLogger(__name__)


class LeadScoringService:
    """Service for calculating and explaining lead scores (0-100)"""

    # Score thresholds for categories
    CATEGORY_THRESHOLDS = {"kalt": (0, 39), "warm": (40, 69), "heiß": (70, 100)}

    # Weights for scoring factors
    WEIGHTS = {
        "firmographic": 20,  # Company size, industry, role
        "value": 20,  # Budget/potential value
        "recency": 30,  # Time since last contact, activity frequency
        "engagement": 30,  # Response time, meeting attendance, email interaction
    }

    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id

    def calculate_lead_score(
        self, contact_data: Dict[str, Any], activities: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive lead score (0-100) with breakdown

        Args:
            contact_data: Contact information including budget, category, role, etc.
            activities: List of recent activities (optional, for engagement scoring)

        Returns:
            Dict with score, category, breakdown, and top signals
        """
        activities = activities or []

        # Calculate individual components
        firmographic_score = self._calculate_firmographic_score(contact_data)
        value_score = self._calculate_value_score(contact_data)
        recency_score = self._calculate_recency_score(contact_data, activities)
        engagement_score = self._calculate_engagement_score(activities)

        # Calculate weighted total
        total_score = (
            firmographic_score["score"]
            + value_score["score"]
            + recency_score["score"]
            + engagement_score["score"]
        )

        # Ensure score is within bounds
        total_score = max(0, min(100, int(total_score)))

        # Determine category
        category = self._get_category(total_score)

        # Collect all signals
        all_signals = (
            firmographic_score["signals"]
            + value_score["signals"]
            + recency_score["signals"]
            + engagement_score["signals"]
        )

        # Sort by impact and take top 5
        top_signals = sorted(all_signals, key=lambda x: x["impact"], reverse=True)[:5]

        # Build breakdown
        breakdown = [
            {
                "factor": "Firmografische Daten",
                "value": firmographic_score["score"],
                "weight": self.WEIGHTS["firmographic"],
                "description": "Unternehmensgröße, Branche, Rolle",
            },
            {
                "factor": "Potenzialwert",
                "value": value_score["score"],
                "weight": self.WEIGHTS["value"],
                "description": "Budget und Umsatzchance",
            },
            {
                "factor": "Aktualität",
                "value": recency_score["score"],
                "weight": self.WEIGHTS["recency"],
                "description": "Zeit seit letztem Kontakt, Aktivitätshäufigkeit",
            },
            {
                "factor": "Engagement",
                "value": engagement_score["score"],
                "weight": self.WEIGHTS["engagement"],
                "description": "Reaktionszeit, Termintreue, Interaktion",
            },
        ]

        return {
            "score": total_score,
            "category": category,
            "category_label": self._get_category_label(category),
            "breakdown": breakdown,
            "signals": top_signals,
            "last_updated": datetime.utcnow().isoformat(),
        }

    def _calculate_firmographic_score(
        self, contact_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate firmographic score (max 20 points)"""
        score = 0
        signals = []

        # Industry match (5 points)
        category = contact_data.get("category", "").lower()
        high_value_categories = ["eigentümer", "investor", "unternehmen", "developer"]
        if any(cat in category for cat in high_value_categories):
            points = 5
            score += points
            signals.append(
                {
                    "name": "Wertvolle Kategorie",
                    "value": category,
                    "impact": points,
                    "icon": "building",
                }
            )
        elif category:
            points = 2
            score += points
            signals.append(
                {
                    "name": "Kategorie definiert",
                    "value": category,
                    "impact": points,
                    "icon": "tag",
                }
            )

        # Company presence (5 points)
        company = contact_data.get("company")
        if company and len(company) > 3:
            points = 5
            score += points
            signals.append(
                {
                    "name": "Firmenkunde",
                    "value": company,
                    "impact": points,
                    "icon": "building-2",
                }
            )

        # Decision maker role (10 points)
        # Infer from category or other fields
        priority = contact_data.get("priority", "medium")
        if priority in ["high", "urgent"]:
            points = 10
            score += points
            signals.append(
                {
                    "name": "Hohe Priorität",
                    "value": priority.capitalize(),
                    "impact": points,
                    "icon": "vip-crown",
                }
            )
        elif priority == "medium":
            points = 5
            score += points
            signals.append(
                {
                    "name": "Mittlere Priorität",
                    "value": "Medium",
                    "impact": points,
                    "icon": "flag",
                }
            )

        return {"score": min(score, self.WEIGHTS["firmographic"]), "signals": signals}

    def _calculate_value_score(self, contact_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate value/budget score (max 20 points)"""
        score = 0
        signals = []

        # Get budget (main field, fallback to budget_max)
        budget = contact_data.get("budget")
        if budget is None:
            budget = contact_data.get("budget_max")

        if budget:
            # Convert to float if Decimal
            if isinstance(budget, Decimal):
                budget = float(budget)

            # Score based on budget brackets
            if budget >= 500000:
                points = 20
                score = points
                signals.append(
                    {
                        "name": "Premium-Budget",
                        "value": f"€{budget:,.0f}",
                        "impact": points,
                        "icon": "money-euro-circle",
                    }
                )
            elif budget >= 150000:
                points = 15
                score = points
                signals.append(
                    {
                        "name": "Hoher Potenzialwert",
                        "value": f"€{budget:,.0f}",
                        "impact": points,
                        "icon": "money-euro-circle",
                    }
                )
            elif budget >= 50000:
                points = 10
                score = points
                signals.append(
                    {
                        "name": "Mittlerer Potenzialwert",
                        "value": f"€{budget:,.0f}",
                        "impact": points,
                        "icon": "money-euro-circle",
                    }
                )
            else:
                points = 5
                score = points
                signals.append(
                    {
                        "name": "Budget vorhanden",
                        "value": f"€{budget:,.0f}",
                        "impact": points,
                        "icon": "wallet",
                    }
                )

        return {"score": min(score, self.WEIGHTS["value"]), "signals": signals}

    def _calculate_recency_score(
        self, contact_data: Dict[str, Any], activities: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculate recency/activity score (max 30 points)"""
        score = 0
        signals = []

        # Last contact recency (20 points)
        last_contact = contact_data.get("last_contact")
        if last_contact:
            if isinstance(last_contact, str):
                try:
                    last_contact = datetime.fromisoformat(
                        last_contact.replace("Z", "+00:00")
                    )
                except:
                    last_contact = None

            if last_contact:
                days_since = (
                    datetime.utcnow().replace(tzinfo=None)
                    - last_contact.replace(tzinfo=None)
                ).days

                if days_since < 7:
                    points = 20
                    score += points
                    signals.append(
                        {
                            "name": "Sehr aktuell",
                            "value": f"vor {days_since} Tagen",
                            "impact": points,
                            "icon": "calendar-check",
                        }
                    )
                elif days_since < 30:
                    points = 15
                    score += points
                    signals.append(
                        {
                            "name": "Aktueller Kontakt",
                            "value": f"vor {days_since} Tagen",
                            "impact": points,
                            "icon": "calendar",
                        }
                    )
                elif days_since < 90:
                    points = 10
                    score += points
                    signals.append(
                        {
                            "name": "Regelmäßiger Kontakt",
                            "value": f"vor {days_since} Tagen",
                            "impact": points,
                            "icon": "calendar",
                        }
                    )
                else:
                    points = 0
                    signals.append(
                        {
                            "name": "Kontakt veraltet",
                            "value": f"vor {days_since} Tagen",
                            "impact": points,
                            "icon": "calendar-close",
                        }
                    )

        # Activity frequency (10 points)
        activity_count = len(activities)
        if activity_count > 0:
            # Award points based on activity count (max 10)
            points = min(activity_count, 10)
            score += points
            signals.append(
                {
                    "name": "Interaktionshäufigkeit",
                    "value": f"{activity_count} Aktivitäten",
                    "impact": points,
                    "icon": "history",
                }
            )

        return {"score": min(score, self.WEIGHTS["recency"]), "signals": signals}

    def _calculate_engagement_score(
        self, activities: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculate engagement score (max 30 points)"""
        score = 0
        signals = []

        if not activities:
            return {"score": 0, "signals": signals}

        # Response time analysis (15 points)
        # Look for quick responses in activities
        response_activities = [
            a for a in activities if a.get("type") in ["email", "call"]
        ]
        if response_activities:
            # Assume recent activities indicate good response time
            recent_responses = [a for a in response_activities[:5]]
            if len(recent_responses) >= 3:
                points = 15
                score += points
                signals.append(
                    {
                        "name": "Schnelle Reaktion",
                        "value": f"{len(recent_responses)} zeitnahe Antworten",
                        "impact": points,
                        "icon": "speed",
                    }
                )
            elif len(recent_responses) >= 1:
                points = 8
                score += points
                signals.append(
                    {
                        "name": "Gute Reaktionszeit",
                        "value": f"{len(recent_responses)} Antworten",
                        "impact": points,
                        "icon": "message-2",
                    }
                )

        # Meeting attendance (15 points)
        # Count completed meetings vs cancelled
        meetings = [
            a for a in activities if a.get("type") in ["meeting", "property_viewing"]
        ]
        if meetings:
            completed_meetings = [m for m in meetings if m.get("status") != "cancelled"]
            attendance_rate = len(completed_meetings) / len(meetings) if meetings else 0

            if attendance_rate >= 0.8:
                points = 15
                score += points
                signals.append(
                    {
                        "name": "Hohe Termintreue",
                        "value": f"{int(attendance_rate*100)}% Teilnahmequote",
                        "impact": points,
                        "icon": "calendar-check",
                    }
                )
            elif attendance_rate >= 0.5:
                points = 10
                score += points
                signals.append(
                    {
                        "name": "Gute Termintreue",
                        "value": f"{int(attendance_rate*100)}% Teilnahmequote",
                        "impact": points,
                        "icon": "calendar-event",
                    }
                )
            elif len(completed_meetings) > 0:
                points = 5
                score += points
                signals.append(
                    {
                        "name": "Termine wahrgenommen",
                        "value": f"{len(completed_meetings)} Termine",
                        "impact": points,
                        "icon": "calendar",
                    }
                )

        # Email/interaction engagement (bonus points if many interaction types)
        unique_types = set(a.get("type") for a in activities if a.get("type"))
        if len(unique_types) >= 4:
            points = 5
            score += points
            signals.append(
                {
                    "name": "Vielfältige Interaktion",
                    "value": f"{len(unique_types)} Kontaktarten",
                    "impact": points,
                    "icon": "apps",
                }
            )

        return {"score": min(score, self.WEIGHTS["engagement"]), "signals": signals}

    def _get_category(self, score: int) -> str:
        """Get category based on score"""
        for category, (min_score, max_score) in self.CATEGORY_THRESHOLDS.items():
            if min_score <= score <= max_score:
                return category
        return "warm"  # Default fallback

    def _get_category_label(self, category: str) -> str:
        """Get display label for category"""
        labels = {"kalt": "Kalt", "warm": "Warm", "heiß": "Heiß"}
        return labels.get(category, "Warm")

    def get_category_color(self, category: str) -> Dict[str, str]:
        """Get color scheme for category"""
        colors = {
            "kalt": {
                "bg": "bg-blue-500/10",
                "text": "text-blue-400",
                "border": "border-blue-500/20",
                "gradient": "from-blue-500 to-cyan-500",
            },
            "warm": {
                "bg": "bg-amber-500/10",
                "text": "text-amber-400",
                "border": "border-amber-500/20",
                "gradient": "from-amber-500 to-orange-500",
            },
            "heiß": {
                "bg": "bg-emerald-500/10",
                "text": "text-emerald-400",
                "border": "border-emerald-500/20",
                "gradient": "from-emerald-500 to-green-500",
            },
        }
        return colors.get(category, colors["warm"])
