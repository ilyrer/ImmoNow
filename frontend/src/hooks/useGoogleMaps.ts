/**
 * Google Maps Hook
 * React hook for Google Maps integration
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/config';

export interface GoogleMapsSettings {
  api_key?: string;
  is_configured: boolean;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
}

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false);

  // Query for Google Maps settings
  const {
    data: settings,
    isLoading: isLoadingSettings,
    error: settingsError,
    refetch: refetchSettings
  } = useQuery({
    queryKey: ['google-maps-settings'],
    queryFn: async (): Promise<GoogleMapsSettings> => {
      try {
        const response = await apiClient.get('/api/v1/admin/settings/integrations');
        return {
          api_key: (response as any).google_maps_api_key,
          is_configured: !!(response as any).google_maps_api_key
        };
      } catch (error) {
        console.error('Error fetching Google Maps settings:', error);
        return {
          is_configured: false
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if Google Maps API is loaded
  useEffect(() => {
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
      } else {
        setIsLoaded(false);
      }
    };

    checkGoogleMapsLoaded();
    
    // Check periodically
    const interval = setInterval(checkGoogleMapsLoaded, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Geocode address
  const geocodeAddress = async (address: string): Promise<GeocodeResult | null> => {
    if (!settings?.api_key || !isLoaded) {
      throw new Error('Google Maps API nicht verfügbar');
    }

    try {
      const geocoder = new window.google.maps.Geocoder();
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              formatted_address: results[0].formatted_address
            });
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  };

  // Reverse geocode coordinates
  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    if (!settings?.api_key || !isLoaded) {
      throw new Error('Google Maps API nicht verfügbar');
    }

    try {
      const geocoder = new window.google.maps.Geocoder();
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            resolve(results[0].formatted_address);
          } else {
            reject(new Error(`Reverse geocoding failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  };

  // Get directions between two points
  const getDirections = async (
    origin: string | { lat: number; lng: number },
    destination: string | { lat: number; lng: number }
  ) => {
    if (!settings?.api_key || !isLoaded) {
      throw new Error('Google Maps API nicht verfügbar');
    }

    try {
      const directionsService = new window.google.maps.DirectionsService();
      
      return new Promise((resolve, reject) => {
        directionsService.route(
          {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING
          },
          (result, status) => {
            if (status === 'OK') {
              resolve(result);
            } else {
              reject(new Error(`Directions failed: ${status}`));
            }
          }
        );
      });
    } catch (error) {
      console.error('Directions error:', error);
      throw error;
    }
  };

  return {
    settings,
    isLoading: isLoadingSettings,
    isLoadingSettings,
    settingsError,
    refetchSettings,
    isLoaded,
    geocodeAddress,
    reverseGeocode,
    getDirections,
    isConfigured: settings?.is_configured || false,
    apiKey: settings?.api_key
  };
}
