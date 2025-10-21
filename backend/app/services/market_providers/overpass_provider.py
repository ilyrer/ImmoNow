"""
Overpass (OpenStreetMap) Provider
Fragt POIs in einem Radius ab und berechnet eine einfache Komposit-Kennzahl.
"""
from __future__ import annotations

import math
import asyncio
from typing import Dict, Any

import httpx


class OverpassProvider:
    def __init__(self):
        self.base_url = "https://overpass-api.de/api/interpreter"
        self.timeout = 20.0

    async def _fetch(self, query: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(self.base_url, data={"data": query})
            resp.raise_for_status()
            return resp.json()

    async def get_poi_summary(self, lat: float, lng: float, radius: int = 1200) -> Dict[str, Any]:
        # Relevante POI-Typen: Schulen, ÖPNV, Grünflächen
        queries = {
            "schools": f"[out:json];(node[amenity=school](around:{radius},{lat},{lng});way[amenity=school](around:{radius},{lat},{lng}););out count;",
            "stops": f"[out:json];(node[public_transport=platform](around:{radius},{lat},{lng});node[highway=bus_stop](around:{radius},{lat},{lng}););out count;",
            "parks": f"[out:json];(way[leisure=park](around:{radius},{lat},{lng});relation[leisure=park](around:{radius},{lat},{lng}););out count;",
        }

        async def fetch_count(query: str) -> int:
            try:
                data = await self._fetch(query)
                # overpass returns counts in elements[0].tags.total sometimes; fallback 0
                elements = data.get("elements", [])
                if elements and isinstance(elements[0].get("tags"), dict):
                    total = elements[0]["tags"].get("total")
                    if total is not None:
                        return int(total)
                # Fallback: approximate from returned elements length (less accurate when using out:count)
                return len(elements)
            except Exception:
                return 0

        schools, stops, parks = await asyncio.gather(
            fetch_count(queries["schools"]),
            fetch_count(queries["stops"]),
            fetch_count(queries["parks"]),
        )

        # Normiere auf Radius, einfache Gewichtung
        area_km2 = math.pi * (radius / 1000.0) ** 2
        schools_density = schools / max(0.1, area_km2)
        stops_density = stops / max(0.1, area_km2)
        parks_density = parks / max(0.1, area_km2)

        # Gewichtete Summe; skaliere auf ~1.0
        composite_score = 1.0 + (
            0.1 * min(5.0, schools_density / 5.0) +
            0.1 * min(5.0, stops_density / 20.0) +
            0.05 * min(5.0, parks_density / 2.0)
        )

        return {
            "radius": radius,
            "schools": schools,
            "stops": stops,
            "parks": parks,
            "schools_density": round(schools_density, 3),
            "stops_density": round(stops_density, 3),
            "parks_density": round(parks_density, 3),
            "composite_score": round(composite_score, 3),
        }


