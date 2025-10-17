"""
Billing Configuration für Stripe Subscription Integration
"""

import os
from django.conf import settings


# Plan Limits - Quelle der Wahrheit für alle Limits
PLAN_LIMITS = {
    'free': {
        'users': 2,
        'properties': 5,
        'storage_gb': 1,
        'analytics': 'basic',
    },
    'starter': {
        'users': 5,
        'properties': 25,
        'storage_gb': 10,
        'analytics': 'advanced',
    },
    'pro': {
        'users': 20,
        'properties': 100,
        'storage_gb': 50,
        'analytics': 'premium',
        'integrations': True,
        'reporting': True,
    },
    'enterprise': {
        'users': -1,  # Unbegrenzt
        'properties': -1,
        'storage_gb': 500,
        'analytics': 'premium',
        'integrations': True,
        'reporting': True,
        'white_label': True,
    },
}


# Stripe Price ID Mapping (aus ENV)
STRIPE_PRICE_MAP = {
    'free': None,  # Free hat keine Price ID
    'starter': os.getenv('STRIPE_PRICE_STARTER', None),
    'pro': os.getenv('STRIPE_PRICE_PRO', None),
    'enterprise': os.getenv('STRIPE_PRICE_ENTERPRISE', None),
}


def get_plan_from_price_id(price_id: str) -> str:
    """
    Mappe Stripe Price ID zu Plan Key
    
    Args:
        price_id: Stripe Price ID
        
    Returns:
        Plan key (free, starter, pro, enterprise)
        
    Raises:
        ValueError: Wenn Price ID unbekannt ist
    """
    for plan, pid in STRIPE_PRICE_MAP.items():
        if pid == price_id:
            return plan
    
    raise ValueError(f"Unknown price_id: {price_id}")


def get_plan_limits(plan_key: str) -> dict:
    """
    Hole Limits für einen Plan
    
    Args:
        plan_key: Plan identifier
        
    Returns:
        Dict mit Plan-Limits
        
    Raises:
        KeyError: Wenn Plan unbekannt ist
    """
    if plan_key not in PLAN_LIMITS:
        raise KeyError(f"Unknown plan: {plan_key}")
    
    return PLAN_LIMITS[plan_key].copy()


def is_unlimited(plan_key: str, resource: str) -> bool:
    """
    Prüfe ob Resource unbegrenzt ist für Plan
    
    Args:
        plan_key: Plan identifier
        resource: Resource name (users, properties, storage_gb)
        
    Returns:
        True wenn unbegrenzt (-1), False sonst
    """
    limits = get_plan_limits(plan_key)
    return limits.get(resource, 0) == -1


def get_next_plan(plan_key: str) -> str:
    """
    Hole nächsten höheren Plan
    
    Args:
        plan_key: Aktueller Plan
        
    Returns:
        Nächster Plan oder None wenn bereits höchster
    """
    plan_hierarchy = ['free', 'starter', 'pro', 'enterprise']
    
    try:
        current_index = plan_hierarchy.index(plan_key)
        if current_index < len(plan_hierarchy) - 1:
            return plan_hierarchy[current_index + 1]
    except ValueError:
        pass
    
    return None


def get_required_plan_for_limit(plan_key: str, resource: str) -> str:
    """
    Hole minimalen Plan für Resource-Limit
    
    Args:
        plan_key: Aktueller Plan
        resource: Resource name
        
    Returns:
        Minimaler Plan der das Limit erhöht
    """
    current_limits = get_plan_limits(plan_key)
    current_limit = current_limits.get(resource, 0)
    
    # Wenn bereits unbegrenzt, gibt es keinen höheren Plan
    if current_limit == -1:
        return None
    
    # Suche nächsten Plan mit höherem Limit
    for plan in ['starter', 'pro', 'enterprise']:
        plan_limits = get_plan_limits(plan)
        plan_limit = plan_limits.get(resource, 0)
        
        if plan_limit == -1 or plan_limit > current_limit:
            return plan
    
    return None

