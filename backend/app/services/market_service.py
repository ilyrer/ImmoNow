"""
Market Service
Beschafft und normalisiert Live-Marktdaten (Eurostat/Destatis/Overpass) mit einfachem Caching
"""
from __future__ import annotations

import os
import time
from typing import Dict, Any, List, Optional, Tuple
import json
import logging

try:
    import redis  # type: ignore
except Exception:  # pragma: no cover
    redis = None  # fallback

logger = logging.getLogger(__name__)

from app.schemas.avm import MarketIntelligence, MarketTrendPoint
from app.services.market_providers.overpass_provider import OverpassProvider
from app.services.market_providers.eurostat_provider import EurostatProvider


class MarketService:
    """Service zur Aggregation von Live-Marktdaten.

    Hinweis: Dieses Service nutzt öffentliche Endpunkte (ohne API-Key) und
    cached Antworten kurzzeitig, um Rate-Limits zu respektieren.
    """

    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self._cache: Dict[str, Tuple[float, Any]] = {}
        self._cache_ttl_seconds = int(os.getenv("MARKET_CACHE_TTL", "600"))  # 10 Minuten
        self._baseline_price_per_sqm = float(os.getenv("MARKET_BASE_PRICE_PER_SQM", "4000"))

        # Provider
        self.overpass = OverpassProvider()
        self.eurostat = EurostatProvider()

        # Redis Cache optional
        self._redis_client = None
        redis_url = os.getenv("REDIS_URL")
        if redis_url and redis is not None:
            try:
                self._redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
                # Test
                self._redis_client.ping()
                logger.info("MarketService: Redis cache enabled")
            except Exception as e:  # pragma: no cover
                logger.warning("MarketService: Redis not available, falling back to memory cache: %s", e)

    def _cache_get(self, key: str):
        if self._redis_client is not None:
            try:
                data = self._redis_client.get(f"market:{self.tenant_id}:{key}")
                return json.loads(data) if data else None
            except Exception:  # pragma: no cover
                pass
        item = self._cache.get(key)
        if not item:
            return None
        ts, value = item
        if (time.time() - ts) > self._cache_ttl_seconds:
            self._cache.pop(key, None)
            return None
        return value

    def _cache_set(self, key: str, value: Any):
        if self._redis_client is not None:
            try:
                self._redis_client.setex(
                    f"market:{self.tenant_id}:{key}", self._cache_ttl_seconds, json.dumps(value)
                )
                return
            except Exception:  # pragma: no cover
                pass
        self._cache[key] = (time.time(), value)

    async def get_trends(self, city: str, postal_code: str) -> Dict[str, Any]:
        """Liefert Trenddaten (HPI-basiert)."""
        cache_key = f"trends:{city}:{postal_code}"
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached

        # Hole HPI (House Price Index) Zeitreihe (national/region, falls verfügbar)
        hpi_series = await self.eurostat.get_hpi_series(country_code="DE")

        trends: List[MarketTrendPoint] = []
        for point in hpi_series:
            # Wir verwenden den Index zur Normierung auf baseline €/qm
            index_value = point.get("index", 100.0)
            avg_price_per_sqm = self._baseline_price_per_sqm * (index_value / 100.0)
            trends.append(MarketTrendPoint(
                date=point.get("date", ""),
                average_price=avg_price_per_sqm * 80.0,  # grobe Ableitung Kaufpreis (qm * Faktor)
                average_price_per_sqm=avg_price_per_sqm,
                transaction_count=point.get("transactions", 0) or 0,
                median_price=avg_price_per_sqm * 75.0,
                region=city,
            ))

        data = {
            "city": city,
            "postal_code": postal_code,
            "trends": [t.model_dump() for t in trends],
        }
        self._cache_set(cache_key, data)
        return data

    async def get_poi_summary(self, lat: float, lng: float, radius: int = 1200) -> Dict[str, Any]:
        """Liefert POI-Dichte (Schulen, ÖPNV, Grünflächen) über Overpass."""
        cache_key = f"poi:{lat}:{lng}:{radius}"
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached

        summary = await self.overpass.get_poi_summary(lat=lat, lng=lng, radius=radius)
        self._cache_set(cache_key, summary)
        return summary

    async def get_hpi(self, region: Optional[str] = None) -> Dict[str, Any]:
        """HPI-aktuelle Kennzahlen."""
        cache_key = f"hpi:{region or 'DE'}"
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached

        current = await self.eurostat.get_hpi_current(country_code="DE")
        self._cache_set(cache_key, current)
        return current

    async def estimate_base_price_per_sqm(self, city: str, postal_code: str, lat: Optional[float] = None, lng: Optional[float] = None) -> float:
        """Schätzt einen Basispreis €/qm aus HPI und POI-Dichte.

        - Startet mit Baseline (env)
        - Skaliert mit HPI (national)
        - Feinanpassung über POI-Dichte, falls Koordinaten vorhanden
        """
        hpi = await self.eurostat.get_hpi_current(country_code="DE")
        index_value = float(hpi.get("index", 100.0))
        price = self._baseline_price_per_sqm * (index_value / 100.0)

        if lat is not None and lng is not None:
            poi = await self.get_poi_summary(lat=lat, lng=lng, radius=1200)
            score = poi.get("composite_score", 1.0)
            # clamp score around 1.0 ±20%
            score = max(0.8, min(1.2, score))
            price *= score

        return price

    async def build_market_intelligence(self, city: str, postal_code: str, lat: Optional[float] = None, lng: Optional[float] = None) -> MarketIntelligence:
        """Erzeugt MarketIntelligence aus Live-Daten."""
        trends_data = await self.get_trends(city=city, postal_code=postal_code)
        trends = [MarketTrendPoint(**t) for t in trends_data.get("trends", [])]

        # Nachfrage/Angebot grob über POI-Score ableiten
        demand_level = "medium"
        supply_level = "medium"
        avg_days_on_market = 60
        competition_index = 5

        if lat is not None and lng is not None:
            poi = await self.get_poi_summary(lat=lat, lng=lng, radius=1200)
            composite = poi.get("composite_score", 1.0)
            if composite >= 1.15:
                demand_level = "high"
                competition_index = 7
            elif composite <= 0.9:
                demand_level = "low"
                competition_index = 4

        # Wachstumsraten aus Trendzeitreihe grob ableiten
        price_growth_12m = 0.0
        price_growth_36m = 0.0
        if len(trends) >= 12:
            first = trends[-12].average_price_per_sqm
            last = trends[-1].average_price_per_sqm
            if first:
                price_growth_12m = ((last - first) / first) * 100.0
        if len(trends) >= 36:
            first = trends[-36].average_price_per_sqm
            last = trends[-1].average_price_per_sqm
            if first:
                price_growth_36m = ((last - first) / first) * 100.0

        return MarketIntelligence(
            region=city,
            postal_code=postal_code,
            demand_level=demand_level,
            supply_level=supply_level,
            price_growth_12m=price_growth_12m,
            price_growth_36m=price_growth_36m,
            average_days_on_market=avg_days_on_market,
            competition_index=competition_index,
            trends=trends,
        )


