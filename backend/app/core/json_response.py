"""
Custom JSON Response for datetime serialization
"""
from fastapi.responses import JSONResponse as FastAPIJSONResponse
from typing import Any
import json
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal


class CustomJSONResponse(FastAPIJSONResponse):
    """Custom JSON Response that handles datetime, UUID, and Decimal serialization"""
    
    def render(self, content: Any) -> bytes:
        """Render content with custom JSON encoder"""
        return json.dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
            default=self.custom_json_encoder
        ).encode("utf-8")
    
    @staticmethod
    def custom_json_encoder(obj: Any) -> Any:
        """Custom JSON encoder for special types"""
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        elif isinstance(obj, UUID):
            return str(obj)
        elif isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, bytes):
            return obj.decode('utf-8')
        raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")
