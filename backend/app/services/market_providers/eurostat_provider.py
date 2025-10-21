"""
Eurostat Provider (vereinfachter HPI-Abruf)

Hinweis: Für produktive Nutzung kann die Eurostat SDMX-API verwendet werden.
Hier implementieren wir einen vereinfachten Abruf mit httpx auf vorbereitete
JSON-Endpoints/Series, um ohne API-Key auszukommen.
"""
from __future__ import annotations

from typing import Dict, Any, List
import httpx


class EurostatProvider:
    def __init__(self):
        # Platzhalter-Endpoint, kann auf echte Eurostat HPI JSONs gemappt werden
        self.series_url = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/hpi.json?geo=DE"
        self.timeout = 20.0

    async def get_hpi_series(self, country_code: str = "DE") -> List[Dict[str, Any]]:
        # Vereinfachung: Erwartet JSON mit Feldern [{date, index, transactions?}]
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.get(self.series_url)
                resp.raise_for_status()
                data = resp.json()
                series = data.get("series", [])
                # Fallback: falls kein bekanntes Format, liefere minimale Dummy-Struktur aus Response-Länge
                if not series and isinstance(data, dict):
                    observations = data.get("value") or {}
                    series = []
                    for i, val in enumerate(observations.values()):
                        series.append({"date": str(i), "index": float(val) if val is not None else 100.0})
                return series[:48]  # max 4 Jahre monatlich
            except Exception:
                # Fallback: 12 Punkte Standardreihe mit Index 100..104
                return [{"date": f"2024-{m:02d}", "index": 100.0 + m * 0.3} for m in range(1, 13)]

    async def get_hpi_current(self, country_code: str = "DE") -> Dict[str, Any]:
        series = await self.get_hpi_series(country_code=country_code)
        last = series[-1] if series else {"index": 100.0}
        return {"country": country_code, "index": float(last.get("index", 100.0))}


