/**
 * Directions Service
 * Generates universal external map navigation and directions URLs using real destination coordinates.
 */

export interface DirectionsParams {
  destinationLat: number;
  destinationLng: number;
  destinationName?: string;
  placeId?: string;
  originLat?: number;
  originLng?: number;
}

export const directionsService = {
  /**
   * Universal Google Maps directions URL (works on Android, iOS, and Web)
   */
  getGoogleMapsDirectionsUrl(params: DirectionsParams): string {
    const { destinationLat, destinationLng, destinationName, placeId, originLat, originLng } = params;
    
    let url = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}`;
    if (originLat !== undefined && originLng !== undefined) {
      url += `&origin=${originLat},${originLng}`;
    }
    if (placeId) {
      url += `&destination_place_id=${encodeURIComponent(placeId)}`;
    }
    return url;
  },

  /**
   * Apple Maps directions URL for iOS / macOS clients
   */
  getAppleMapsDirectionsUrl(params: DirectionsParams): string {
    const { destinationLat, destinationLng, destinationName } = params;
    let url = `https://maps.apple.com/?daddr=${destinationLat},${destinationLng}`;
    if (destinationName) {
      url += `&q=${encodeURIComponent(destinationName)}`;
    }
    return url;
  },

  /**
   * OpenStreetMap directions URL
   */
  getOsmDirectionsUrl(params: DirectionsParams): string {
    const { destinationLat, destinationLng, originLat, originLng } = params;
    if (originLat !== undefined && originLng !== undefined) {
      return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${originLat}%2C${originLng}%3B${destinationLat}%2C${destinationLng}`;
    }
    return `https://www.openstreetmap.org/?mlat=${destinationLat}&mlon=${destinationLng}#map=16/${destinationLat}/${destinationLng}`;
  },

  /**
   * Open external navigation directly in the user's default maps application
   */
  openDirections(params: DirectionsParams): void {
    const url = this.getGoogleMapsDirectionsUrl(params);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
