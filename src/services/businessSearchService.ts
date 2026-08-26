/**
 * Business Search Service
 * Fetches real nearby grooming businesses from the backend proxy layer,
 * handles progressive radius expansion, Haversine distance formatting, and dynamic category filtering.
 */

export interface NearbyBusiness {
  id: string;
  name: string;
  hasRealName: boolean;
  category: 'Salon' | 'Barber' | 'Spa' | 'Beauty' | 'Hair' | string;
  address: string | null;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  openNow?: boolean | null;
  rating: number | null;
  reviewsCount: number | null;
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceMeters: number;
  distanceKm: number;
  source: string;
  isPlatformRegistered: boolean;
  googleMapsUrl?: string;
  photoUrl?: string | null;
  placeId?: string;
  verifiedImage?: string | null;
  haircutPrice?: number;
  services?: any[];
}

export interface NearbySearchResponse {
  total: number;
  radiusMeters: number;
  center: {
    lat: number;
    lng: number;
  };
  places: NearbyBusiness[];
}

export interface SearchNearbyParams {
  lat: number;
  lng: number;
  radiusMeters?: number;
  category?: string;
  query?: string;
}

export const businessSearchService = {
  /**
   * Format distance cleanly: meters for < 1000m, kilometers for >= 1km
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    const km = meters / 1000;
    return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
  },

  /**
   * Fetch nearby businesses from the backend endpoint
   */
  async searchNearby(params: SearchNearbyParams): Promise<NearbySearchResponse> {
    const { lat, lng, radiusMeters = 5000, category = 'all', query = '' } = params;

    const queryParams = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radiusMeters.toString(),
      category: category.toLowerCase(),
      query: query.trim()
    });

    try {
      const res = await fetch(`/api/places/nearby?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch nearby places: HTTP ${res.status}`);
      }
      const data: any = await res.json();
      const items = Array.isArray(data.results) ? data.results : (Array.isArray(data.places) ? data.places : []);
      return {
        total: data.total || items.length,
        radiusMeters: data.radiusMeters || radiusMeters,
        center: data.center || { lat, lng },
        places: items
      };
    } catch (err) {
      console.error('Nearby search service error:', err);
      return {
        total: 0,
        radiusMeters,
        center: { lat, lng },
        places: []
      };
    }
  },

  /**
   * Progressive radius expansion helper
   */
  getNextExpansionRadius(currentRadiusMeters: number): number | null {
    if (currentRadiusMeters < 10000) return 10000; // 10 km
    if (currentRadiusMeters < 20000) return 20000; // 20 km
    if (currentRadiusMeters < 30000) return 30000; // 30 km
    return null; // Max expansion reached
  },

  /**
   * Sort businesses client-side
   */
  sortBusinesses(
    businesses: NearbyBusiness[],
    sortType: 'distance' | 'rating' | 'reviews'
  ): NearbyBusiness[] {
    const list = [...businesses];
    if (sortType === 'rating') {
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    if (sortType === 'reviews') {
      return list.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
    }
    // Default distance
    return list.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }
};
