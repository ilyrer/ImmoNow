"""
In-Memory Event-Bus für MVP
Basis für Automation-Engine (Phase 1)
"""
from typing import Dict, List, Callable, Any, Optional
from collections import defaultdict
import logging
import asyncio

logger = logging.getLogger(__name__)


class EventBus:
    """In-Memory Event-Bus für MVP"""
    
    _instance: Optional['EventBus'] = None
    _subscribers: Dict[str, List[Callable]] = defaultdict(list)
    _lock = asyncio.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    async def publish(self, event_type: str, payload: Dict[str, Any]) -> None:
        """Publiziert ein Event an alle Subscribers"""
        if event_type not in self._subscribers:
            logger.debug(f"No subscribers for event type: {event_type}")
            return
        
        subscribers = self._subscribers[event_type].copy()
        
        # Führe alle Subscribers asynchron aus
        tasks = []
        for handler in subscribers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    tasks.append(handler(payload))
                else:
                    # Synchroner Handler in async Context
                    tasks.append(asyncio.to_thread(handler, payload))
            except Exception as e:
                logger.error(f"Error calling subscriber for {event_type}: {str(e)}", exc_info=True)
        
        # Warte auf alle Subscribers (fire-and-forget wäre auch möglich)
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    def subscribe(self, event_type: str, handler: Callable) -> None:
        """Registriert einen Subscriber für ein Event"""
        if handler not in self._subscribers[event_type]:
            self._subscribers[event_type].append(handler)
            logger.info(f"Subscribed handler to event type: {event_type}")
        else:
            logger.warning(f"Handler already subscribed to event type: {event_type}")
    
    def unsubscribe(self, event_type: str, handler: Callable) -> None:
        """Entfernt einen Subscriber"""
        if handler in self._subscribers[event_type]:
            self._subscribers[event_type].remove(handler)
            logger.info(f"Unsubscribed handler from event type: {event_type}")
    
    def get_subscriber_count(self, event_type: str) -> int:
        """Gibt Anzahl der Subscribers für einen Event-Type zurück"""
        return len(self._subscribers[event_type])


# Singleton-Instanz
event_bus = EventBus()

