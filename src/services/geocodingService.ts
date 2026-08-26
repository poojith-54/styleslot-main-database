/**
 * Geocoding Service
 * Provides forward geocoding (search query to lat/lng) and reverse geocoding (lat/lng to human locality)
 * via backend proxy endpoints with automatic rate-limit caching.
 */

export interface GeocodedPlace {
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
  type: string;
  importance: number;
  locality?: string;
  district?: string;
  state?: string;
  postcode?: string;
  boundingBox?: number[] | null;
}

export interface ReverseGeocodeResult {
  displayName: string;
  locality: string;
  city?: string;
  district?: string;
  state?: string;
  postcode?: string;
  lat: number;
  lng: number;
}

export const geocodingService = {
  /**
   * Search an arbitrary locality string (village, town, city, mandal, district, pincode)
   */
  async searchLocation(query: string): Promise<GeocodedPlace[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      const res = await fetch(`/api/places/geocode?q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        throw new Error(`Geocoding server error: HTTP ${res.status}`);
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('Geocoding service error:', err);
      return [];
    }
  },

  /**
   * Reverse geocode geographic coordinates to a clean human-readable locality string
   */
  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
    try {
      const res = await fetch(`/api/places/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (!res.ok) {
        throw new Error(`Reverse geocode server error: HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn('Reverse geocoding service error:', err);
      return {
        displayName: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        locality: `${lat.toFixed(3)}, ${lng.toFixed(3)}`,
        lat,
        lng
      };
    }
  }
};
