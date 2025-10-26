"""
Echte Portal OAuth-Konfigurationen für Immobilienportale
"""
import os
from typing import Dict, Any
from enum import Enum


class PortalType(str, Enum):
    IMMOSCOUT24 = "immoscout24"
    IMMOWELT = "immowelt"
    KLEINANZEIGEN = "kleinanzeigen"


class PortalOAuthConfig:
    """OAuth-Konfigurationen für echte Immobilienportale"""
    
    # Immoscout24 OAuth-Konfiguration
    IMMOSCOUT24_CONFIG = {
        'auth_url': 'https://restapi.immobilienscout24.de/oauth/authorize',
        'token_url': 'https://restapi.immobilienscout24.de/oauth/token',
        'api_base_url': 'https://restapi.immobilienscout24.de/v1.0',
        'client_id': os.getenv('IMMOSCOUT24_CLIENT_ID'),
        'client_secret': os.getenv('IMMOSCOUT24_CLIENT_SECRET'),
        'scope': 'read write',
        'redirect_uri': os.getenv('IMMOSCOUT24_REDIRECT_URI', 'https://your-app.com/oauth/callback/immoscout24'),
        'user_info_url': 'https://restapi.immobilienscout24.de/v1.0/user',
        'real_estate_url': 'https://restapi.immobilienscout24.de/v1.0/realestate',
    }
    
    # Immowelt OAuth-Konfiguration
    IMMOWELT_CONFIG = {
        'auth_url': 'https://api.immowelt.de/oauth/authorize',
        'token_url': 'https://api.immowelt.de/oauth/token',
        'api_base_url': 'https://api.immowelt.de/v1',
        'client_id': os.getenv('IMMOWELT_CLIENT_ID'),
        'client_secret': os.getenv('IMMOWELT_CLIENT_SECRET'),
        'scope': 'read write',
        'redirect_uri': os.getenv('IMMOWELT_REDIRECT_URI', 'https://your-app.com/oauth/callback/immowelt'),
        'user_info_url': 'https://api.immowelt.de/v1/user',
        'real_estate_url': 'https://api.immowelt.de/v1/realestate',
    }
    
    # eBay Kleinanzeigen OAuth-Konfiguration
    KLEINANZEIGEN_CONFIG = {
        'auth_url': 'https://api.ebay-kleinanzeigen.de/oauth/authorize',
        'token_url': 'https://api.ebay-kleinanzeigen.de/oauth/token',
        'api_base_url': 'https://api.ebay-kleinanzeigen.de/v1',
        'client_id': os.getenv('KLEINANZEIGEN_CLIENT_ID'),
        'client_secret': os.getenv('KLEINANZEIGEN_CLIENT_SECRET'),
        'scope': 'read write',
        'redirect_uri': os.getenv('KLEINANZEIGEN_REDIRECT_URI', 'https://your-app.com/oauth/callback/kleinanzeigen'),
        'user_info_url': 'https://api.ebay-kleinanzeigen.de/v1/user',
        'real_estate_url': 'https://api.ebay-kleinanzeigen.de/v1/realestate',
    }
    
    @classmethod
    def get_config(cls, portal: PortalType) -> Dict[str, Any]:
        """Portal-Konfiguration abrufen"""
        configs = {
            PortalType.IMMOSCOUT24: cls.IMMOSCOUT24_CONFIG,
            PortalType.IMMOWELT: cls.IMMOWELT_CONFIG,
            PortalType.KLEINANZEIGEN: cls.KLEINANZEIGEN_CONFIG,
        }
        
        config = configs.get(portal)
        if not config:
            raise ValueError(f"Unsupported portal: {portal}")
        
        # Prüfen ob alle erforderlichen Umgebungsvariablen gesetzt sind
        required_vars = ['client_id', 'client_secret']
        missing_vars = [var for var in required_vars if not config.get(var)]
        
        if missing_vars:
            raise ValueError(f"Missing environment variables for {portal}: {missing_vars}")
        
        return config
    
    @classmethod
    def is_configured(cls, portal: PortalType) -> bool:
        """Prüfen ob Portal konfiguriert ist"""
        try:
            config = cls.get_config(portal)
            return all(config.get(var) for var in ['client_id', 'client_secret'])
        except ValueError:
            return False


class PortalFieldMapping:
    """Feld-Mappings für Portal-spezifische APIs"""
    
    # Immoscout24 Feld-Mappings
    IMMOSCOUT24_MAPPING = {
        'title': 'title',
        'description': 'description',
        'price': 'price',
        'living_area': 'livingSpace',
        'rooms': 'numberOfRooms',
        'bedrooms': 'numberOfBedrooms',
        'bathrooms': 'numberOfBathrooms',
        'year_built': 'yearBuilt',
        'energy_class': 'energyEfficiencyClass',
        'heating_type': 'heatingType',
        'floor_number': 'floor',
        'condition_status': 'condition',
        'availability_date': 'availableFrom',
        'commission': 'commission',
        'parking_type': 'parkingSpaceType',
        'street': 'address.street',
        'house_number': 'address.houseNumber',
        'zip_code': 'address.postcode',
        'city': 'address.city',
        'coordinates_lat': 'address.wgs84Coordinate.latitude',
        'coordinates_lng': 'address.wgs84Coordinate.longitude',
    }
    
    # Immowelt Feld-Mappings
    IMMOWELT_MAPPING = {
        'title': 'title',
        'description': 'description',
        'price': 'price',
        'living_area': 'livingSpace',
        'rooms': 'rooms',
        'bedrooms': 'bedrooms',
        'bathrooms': 'bathrooms',
        'year_built': 'yearBuilt',
        'energy_class': 'energyClass',
        'heating_type': 'heatingType',
        'floor_number': 'floor',
        'condition_status': 'condition',
        'availability_date': 'availableFrom',
        'commission': 'commission',
        'parking_type': 'parkingType',
        'street': 'address.street',
        'house_number': 'address.houseNumber',
        'zip_code': 'address.postcode',
        'city': 'address.city',
        'coordinates_lat': 'address.latitude',
        'coordinates_lng': 'address.longitude',
    }
    
    # eBay Kleinanzeigen Feld-Mappings
    KLEINANZEIGEN_MAPPING = {
        'title': 'title',
        'description': 'description',
        'price': 'price',
        'living_area': 'livingSpace',
        'rooms': 'rooms',
        'bedrooms': 'bedrooms',
        'bathrooms': 'bathrooms',
        'year_built': 'yearBuilt',
        'energy_class': 'energyClass',
        'heating_type': 'heatingType',
        'floor_number': 'floor',
        'condition_status': 'condition',
        'availability_date': 'availableFrom',
        'commission': 'commission',
        'parking_type': 'parkingType',
        'street': 'address.street',
        'house_number': 'address.houseNumber',
        'zip_code': 'address.postcode',
        'city': 'address.city',
        'coordinates_lat': 'address.latitude',
        'coordinates_lng': 'address.longitude',
    }
    
    @classmethod
    def get_mapping(cls, portal: PortalType) -> Dict[str, str]:
        """Portal-spezifisches Feld-Mapping abrufen"""
        mappings = {
            PortalType.IMMOSCOUT24: cls.IMMOSCOUT24_MAPPING,
            PortalType.IMMOWELT: cls.IMMOWELT_MAPPING,
            PortalType.KLEINANZEIGEN: cls.KLEINANZEIGEN_MAPPING,
        }
        
        return mappings.get(portal, {})
    
    @classmethod
    def map_property_to_portal(cls, property_data: Dict[str, Any], portal: PortalType) -> Dict[str, Any]:
        """Property-Daten zu Portal-spezifischem Format mappen"""
        mapping = cls.get_mapping(portal)
        portal_data = {}
        
        for our_field, portal_field in mapping.items():
            if our_field in property_data and property_data[our_field] is not None:
                # Verschachtelte Felder behandeln (z.B. address.street)
                if '.' in portal_field:
                    keys = portal_field.split('.')
                    current = portal_data
                    for key in keys[:-1]:
                        if key not in current:
                            current[key] = {}
                        current = current[key]
                    current[keys[-1]] = property_data[our_field]
                else:
                    portal_data[portal_field] = property_data[our_field]
        
        return portal_data


class PortalAPIEndpoints:
    """API-Endpoints für verschiedene Portale"""
    
    @staticmethod
    def get_endpoints(portal: PortalType) -> Dict[str, str]:
        """Portal-spezifische API-Endpoints abrufen"""
        config = PortalOAuthConfig.get_config(portal)
        
        return {
            'user_info': config['user_info_url'],
            'real_estate': config['real_estate_url'],
            'publish': f"{config['real_estate_url']}/publish",
            'unpublish': f"{config['real_estate_url']}/unpublish",
            'sync': f"{config['real_estate_url']}/sync",
            'analytics': f"{config['real_estate_url']}/analytics",
        }
