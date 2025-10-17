/**
 * Google Maps Type Declarations
 */

declare global {
  interface Window {
    google: typeof google;
  }
  
  namespace google {
    namespace maps {
      class Geocoder {
        geocode(request: GeocoderRequest, callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void): void;
      }
      
      interface GeocoderRequest {
        address?: string;
        location?: LatLng | LatLngLiteral;
      }
      
      interface GeocoderResult {
        address_components: GeocoderAddressComponent[];
        formatted_address: string;
        geometry: GeocoderGeometry;
        place_id: string;
        types: string[];
      }
      
      interface GeocoderAddressComponent {
        long_name: string;
        short_name: string;
        types: string[];
      }
      
      interface GeocoderGeometry {
        location: LatLng;
        location_type: GeocoderLocationType;
        viewport: LatLngBounds;
        bounds?: LatLngBounds;
      }
      
      type GeocoderLocationType = 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE';
      type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
      
      interface LatLng {
        lat(): number;
        lng(): number;
      }
      
      interface LatLngLiteral {
        lat: number;
        lng: number;
      }
      
      interface LatLngBounds {
        getNorthEast(): LatLng;
        getSouthWest(): LatLng;
      }
      
      class Size {
        constructor(width: number, height: number);
      }
      
      class DirectionsService {
        route(request: DirectionsRequest, callback: (result: DirectionsResult | null, status: DirectionsStatus) => void): void;
      }
      
      interface DirectionsRequest {
        origin: string | LatLng | LatLngLiteral | Place;
        destination: string | LatLng | LatLngLiteral | Place;
        travelMode: TravelMode;
      }
      
      interface DirectionsResult {
        routes: DirectionsRoute[];
      }
      
      interface DirectionsRoute {
        legs: DirectionsLeg[];
      }
      
      interface DirectionsLeg {
        distance: Distance;
        duration: Duration;
        steps: DirectionsStep[];
      }
      
      interface DirectionsStep {
        distance: Distance;
        duration: Duration;
        instructions: string;
      }
      
      interface Distance {
        text: string;
        value: number;
      }
      
      interface Duration {
        text: string;
        value: number;
      }
      
      interface Place {
        placeId: string;
      }
      
      enum TravelMode {
        DRIVING = 'DRIVING',
        WALKING = 'WALKING',
        BICYCLING = 'BICYCLING',
        TRANSIT = 'TRANSIT'
      }
      
      type DirectionsStatus = 'OK' | 'NOT_FOUND' | 'ZERO_RESULTS' | 'MAX_WAYPOINTS_EXCEEDED' | 'INVALID_REQUEST' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'UNKNOWN_ERROR';
    }
  }
}

export {};