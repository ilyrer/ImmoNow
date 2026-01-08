"""
Condition Evaluator für Automation Rules
Wertet Conditions gegen Event-Payload aus
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ConditionEvaluator:
    """Wertet Conditions gegen Event-Context aus"""
    
    @staticmethod
    def evaluate(conditions: List[Dict[str, Any]], context: Dict[str, Any]) -> bool:
        """
        Wertet Liste von Conditions aus (AND-Logik)
        
        Args:
            conditions: Liste von Conditions
                Format: [{"field": "status", "operator": "equals", "value": "done"}, ...]
            context: Event-Payload mit Task-Daten
        
        Returns:
            True wenn alle Conditions erfüllt sind
        """
        if not conditions:
            return True  # Keine Conditions = immer erfüllt
        
        for condition in conditions:
            if not ConditionEvaluator._evaluate_single(condition, context):
                return False
        
        return True
    
    @staticmethod
    def _evaluate_single(condition: Dict[str, Any], context: Dict[str, Any]) -> bool:
        """Wertet eine einzelne Condition aus"""
        field = condition.get("field")
        operator = condition.get("operator")
        value = condition.get("value")
        
        if not field or not operator:
            logger.warning(f"Invalid condition: {condition}")
            return False
        
        # Hole Feldwert aus Context
        field_value = ConditionEvaluator._get_field_value(field, context)
        
        # Wende Operator an
        try:
            if operator == "equals":
                return str(field_value) == str(value)
            elif operator == "not_equals":
                return str(field_value) != str(value)
            elif operator == "contains":
                if isinstance(field_value, list):
                    return value in field_value
                return str(value) in str(field_value)
            elif operator == "not_contains":
                if isinstance(field_value, list):
                    return value not in field_value
                return str(value) not in str(field_value)
            elif operator == "is_empty":
                return not field_value or (isinstance(field_value, str) and field_value.strip() == "")
            elif operator == "is_not_empty":
                return bool(field_value) and (not isinstance(field_value, str) or field_value.strip() != "")
            elif operator == "greater_than":
                return float(field_value) > float(value)
            elif operator == "less_than":
                return float(field_value) < float(value)
            elif operator == "greater_than_or_equal":
                return float(field_value) >= float(value)
            elif operator == "less_than_or_equal":
                return float(field_value) <= float(value)
            elif operator == "in":
                if isinstance(value, list):
                    return str(field_value) in [str(v) for v in value]
                return False
            elif operator == "not_in":
                if isinstance(value, list):
                    return str(field_value) not in [str(v) for v in value]
                return True
            else:
                logger.warning(f"Unknown operator: {operator}")
                return False
        except (ValueError, TypeError) as e:
            logger.warning(f"Error evaluating condition {condition}: {e}")
            return False
    
    @staticmethod
    def _get_field_value(field: str, context: Dict[str, Any]) -> Any:
        """
        Holt Feldwert aus Context
        Unterstützt nested fields (z.B. "task_data.status")
        """
        # Direkte Felder im Event-Payload
        if field in context:
            return context[field]
        
        # Nested in task_data
        if "task_data" in context and isinstance(context["task_data"], dict):
            if field in context["task_data"]:
                return context["task_data"][field]
        
        # Spezielle Felder für Status-Change Events
        if field == "old_status" and "old_status" in context:
            return context["old_status"]
        if field == "new_status" and "new_status" in context:
            return context["new_status"]
        if field == "status" and "new_status" in context:
            return context["new_status"]  # Fallback für Status-Change Events
        
        # Assignee-Felder
        if field == "assignee_id" and "assignee_id" in context:
            return context["assignee_id"]
        if field == "assignee" and "assignee_id" in context:
            return context["assignee_id"]
        
        return None

