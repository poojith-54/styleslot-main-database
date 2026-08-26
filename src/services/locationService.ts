/**
 * Location Service
 * Handles browser Geolocation API permissions, high-accuracy GPS coordinates, and error states.
 */

export interface UserCoordinates {
  lat: number;
  lng: number;
}

export interface GeolocationResult {
  coords?: UserCoordinates;
  error?: string;
  code?: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED';
}

export const locationService = {
  /**
   * Check if Geolocation is supported by the client browser
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'geolocation' in navigator;
  },

  /**
   * Request current GPS coordinates with high accuracy and standard fallback
   */
  async getCurrentLocation(): Promise<GeolocationResult> {
    if (!this.isSupported()) {
      return {
        error: 'Geolocation is not supported by your current browser.',
        code: 'NOT_SUPPORTED'
      };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            coords: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          });
        },
        (err) => {
          let code: GeolocationResult['code'] = 'POSITION_UNAVAILABLE';
          let message = 'Location access is unavailable.';

          if (err.code === err.PERMISSION_DENIED) {
            code = 'PERMISSION_DENIED';
            message = 'Location permission was denied. Please search for your area manually.';
          } else if (err.code === err.TIMEOUT) {
            code = 'TIMEOUT';
            message = 'Location request timed out. Please retry or search manually.';
          }

          resolve({
            error: message,
            code
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  },

  /**
   * Default fallback coordinates (Visakhapatnam, Andhra Pradesh center)
   */
  getDefaultCoordinates(): UserCoordinates {
    return { lat: 17.6868, lng: 83.2185 };
  }
};
