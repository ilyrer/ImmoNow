/**
 * Google Maps Embed Component
 * Displays property location on Google Maps with marker
 */

import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, AlertCircle, ExternalLink } from 'lucide-react';

interface GoogleMapEmbedProps {
  address: string | {
    street?: string;
    zipCode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  apiKey?: string;
  height?: string;
  className?: string;
  showDirections?: boolean;
  showStreetView?: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 52.5200, // Berlin coordinates as fallback
  lng: 13.4050
};

const GoogleMapEmbed: React.FC<GoogleMapEmbedProps> = ({
  address,
  coordinates,
  apiKey,
  height = '400px',
  className = ''
}) => {
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format address string
  const formatAddress = () => {
    if (typeof address === 'string') {
      return address;
    }
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.zipCode && address.city) {
      parts.push(`${address.zipCode} ${address.city}`);
    } else if (address.city) {
      parts.push(address.city);
    }
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);
    return parts.join(', ');
  };

  // Geocode address to get coordinates
  const geocodeAddress = async (addressString: string) => {
    if (!apiKey) {
      setError('Google Maps API Key nicht konfiguriert');
      setIsLoading(false);
      return;
    }

    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address: addressString }, (results, status) => {
          if (status === 'OK' && results) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });

      if (result.length > 0) {
        const location = result[0].geometry.location;
        const coords = {
          lat: location.lat(),
          lng: location.lng()
        };
        setMapCenter(coords);
        setMarkerPosition(coords);
        setError(null);
      } else {
        setError('Adresse konnte nicht gefunden werden');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Fehler beim Laden der Karte');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize map with coordinates or geocode address
  useEffect(() => {
    if (coordinates) {
      setMapCenter(coordinates);
      setMarkerPosition(coordinates);
      setError(null);
      setIsLoading(false);
    } else {
      const addressString = formatAddress();
      if (addressString) {
        geocodeAddress(addressString);
      } else {
        setError('Keine Adresse verfügbar');
        setIsLoading(false);
      }
    }
  }, [coordinates, address, apiKey]);

  // Handle marker click
  const handleMarkerClick = () => {
    setShowInfoWindow(true);
  };

  // Handle map click
  const handleMapClick = () => {
    setShowInfoWindow(false);
  };

  // Open in Google Maps
  const openInGoogleMaps = () => {
    const addressString = formatAddress();
    const query = markerPosition 
      ? `${markerPosition.lat},${markerPosition.lng}`
      : encodeURIComponent(addressString);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // If no API key, show fallback
  if (!apiKey) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center ${className}`}>
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Google Maps nicht verfügbar
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Bitte konfigurieren Sie den Google Maps API Key in den Admin-Einstellungen.
        </p>
        <button
          onClick={openInGoogleMaps}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          In Google Maps öffnen
        </button>
      </div>
    );
  }

  // If loading
  if (isLoading) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center ${className}`}>
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Karte wird geladen...</p>
      </div>
    );
  }

  // If error
  if (error) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center ${className}`}>
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Fehler beim Laden der Karte
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={openInGoogleMaps}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          In Google Maps öffnen
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={{ ...mapContainerStyle, height }}
          center={mapCenter}
          zoom={15}
          onClick={handleMapClick}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: true,
            mapTypeControl: true,
            fullscreenControl: true
          }}
        >
          {markerPosition && (
            <Marker
              position={markerPosition}
              onClick={handleMarkerClick}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new window.google.maps.Size(32, 32)
              }}
            />
          )}
          
          {showInfoWindow && markerPosition && (
            <InfoWindow
              position={markerPosition}
              onCloseClick={() => setShowInfoWindow(false)}
            >
              <div className="p-2">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-gray-900">Immobilienstandort</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{formatAddress()}</p>
                <button
                  onClick={openInGoogleMaps}
                  className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  In Google Maps öffnen
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default GoogleMapEmbed;
