import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapPin, Search, Compass, Navigation, Phone, ExternalLink, 
  Sparkles, Star, Clock, Globe, ShieldCheck, Filter, 
  ChevronRight, RefreshCw, AlertCircle, CheckCircle2, 
  SlidersHorizontal, Map as MapIcon, List, Zap, LocateFixed, Eye
} from 'lucide-react';
import { locationService, UserCoordinates } from '../services/locationService';
import { geocodingService, GeocodedPlace } from '../services/geocodingService';
import { businessSearchService, NearbyBusiness } from '../services/businessSearchService';
import { directionsService } from '../services/directionsService';

interface NearbySalonsDiscoveryProps {
  theme?: 'dark' | 'light';
  selectedHairstyle?: string;
  onSelectBusiness?: (business: NearbyBusiness) => void;
}

const QUICK_LOCATION_PRESETS = [
  { name: 'Podalakuru', lat: 14.3828, lng: 79.7317 },
  { name: 'Nellore', lat: 14.4426, lng: 79.9865 },
  { name: 'Tirupati', lat: 13.6288, lng: 79.4192 },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Vijayawada', lat: 16.5062, lng: 80.6480 }
];

export default function NearbySalonsDiscovery({
  theme = 'dark',
  selectedHairstyle = '',
  onSelectBusiness
}: NearbySalonsDiscoveryProps) {
  // Location States
  const [coordinates, setCoordinates] = useState<UserCoordinates>(() => locationService.getDefaultCoordinates());
  const [localityName, setLocalityName] = useState<string>('Visakhapatnam, Andhra Pradesh');
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationSearchInput, setLocationSearchInput] = useState<string>('');
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const [locationSuggestions, setLocationSuggestions] = useState<GeocodedPlace[]>([]);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentRadiusMeters, setCurrentRadiusMeters] = useState<number>(5000); // 5km initial
  const [sortType, setSortType] = useState<'distance' | 'rating' | 'reviews'>('distance');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Business Data States
  const [businesses, setBusinesses] = useState<NearbyBusiness[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedBusiness, setSelectedBusiness] = useState<NearbyBusiness | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Map & Leaflet References
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [leafletReady, setLeafletReady] = useState<boolean>(false);

  // 1. Dynamic Leaflet Loader (OpenStreetMap Tiles)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLeafletReady(true);
      document.head.appendChild(script);
    } else {
      setLeafletReady(true);
    }
  }, []);

  // 2. Request Geolocation Function
  const handleRequestLocation = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const result = await locationService.getCurrentLocation();
    if (result.coords) {
      setCoordinates(result.coords);
      setPermissionState('granted');
      
      // Reverse geocode to human locality
      const rev = await geocodingService.reverseGeocode(result.coords.lat, result.coords.lng);
      if (rev) {
        setLocalityName(rev.locality || rev.displayName);
      }
      
      // Fetch nearby businesses around real coordinates
      fetchBusinesses(result.coords, currentRadiusMeters);
    } else {
      setPermissionState('denied');
      setErrorMessage(result.error || 'Location access unavailable. Please search for a city or locality.');
      setIsLoading(false);
    }
  };

  // 3. Fetch Nearby Businesses Handler
  const fetchBusinesses = async (coords: UserCoordinates, radius: number) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await businessSearchService.searchNearby({
        lat: coords.lat,
        lng: coords.lng,
        radiusMeters: radius,
        category: selectedCategory,
        query: searchQuery
      });

      setBusinesses(response.places);
      if (response.places.length > 0) {
        setSelectedBusiness(response.places[0]);
      } else {
        setSelectedBusiness(null);
      }
    } catch (err: any) {
      setErrorMessage('Unable to load nearby businesses. Please verify your connection.');
      setBusinesses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on mount with default coordinates
  useEffect(() => {
    fetchBusinesses(coordinates, currentRadiusMeters);
  }, [selectedCategory]);

  // 4. Handle Location Search Geocoding Input
  useEffect(() => {
    const query = locationSearchInput.trim();
    if (query.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      const suggestions = await geocodingService.searchLocation(query);
      setLocationSuggestions(suggestions);
      setIsSearchingLocation(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [locationSearchInput]);

  // 5. Select a Searched Locality
  const handleSelectLocality = (place: GeocodedPlace | { name: string; lat: number; lng: number }) => {
    const newCoords = { lat: place.lat, lng: place.lng };
    const name = 'shortName' in place ? place.shortName : ('displayName' in place ? place.displayName : place.name);
    
    setCoordinates(newCoords);
    setLocalityName(name);
    setShowLocationModal(false);
    setLocationSearchInput('');
    setLocationSuggestions([]);
    
    // Pan map
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([newCoords.lat, newCoords.lng], 14);
    }

    fetchBusinesses(newCoords, currentRadiusMeters);
  };

  // 6. Progressive Radius Expansion
  const handleExpandRadius = () => {
    const nextRadius = businessSearchService.getNextExpansionRadius(currentRadiusMeters);
    if (nextRadius) {
      setCurrentRadiusMeters(nextRadius);
      fetchBusinesses(coordinates, nextRadius);
    }
  };

  // 7. Filtered & Sorted Businesses
  const displayedBusinesses = useMemo(() => {
    return businessSearchService.sortBusinesses(businesses, sortType);
  }, [businesses, sortType]);

  // Dynamic Category Counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: businesses.length };
    businesses.forEach(b => {
      const cat = b.category || 'Salon';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [businesses]);

  // 8. Initialize / Update Leaflet Map
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || viewMode !== 'map') return;

    const L = (window as any).L;
    if (!L) return;

    if (!leafletMapRef.current) {
      // Create map
      leafletMapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([coordinates.lat, coordinates.lng], 14);

      // Add Tile Layer
      const isDark = theme === 'dark';
      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> & CartoDB',
        maxZoom: 19
      }).addTo(leafletMapRef.current);
    } else {
      leafletMapRef.current.setView([coordinates.lat, coordinates.lng], 14);
    }

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Custom User Marker
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div class="relative flex items-center justify-center">
              <span class="absolute w-8 h-8 rounded-full bg-amber-400/30 animate-ping"></span>
              <span class="relative w-4 h-4 rounded-full bg-amber-400 border-2 border-zinc-950 shadow-lg"></span>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    userMarkerRef.current = L.marker([coordinates.lat, coordinates.lng], { icon: userIcon })
      .addTo(leafletMapRef.current)
      .bindPopup(`<b>Your Search Center</b><br/>${localityName}`);

    // Business Markers
    displayedBusinesses.forEach((b) => {
      const isSelected = selectedBusiness?.id === b.id;
      const catColor = b.category === 'Barber' ? '#3B82F6' : b.category === 'Spa' ? '#10B981' : '#F59E0B';

      const businessIcon = L.divIcon({
        className: 'custom-business-marker',
        html: `<div style="background-color: ${catColor};" class="w-7 h-7 rounded-full flex items-center justify-center text-zinc-950 font-bold text-[11px] shadow-lg border-2 ${isSelected ? 'border-white scale-125' : 'border-zinc-900'} transition-all cursor-pointer">
                ✂️
               </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([b.coordinates.lat, b.coordinates.lng], { icon: businessIcon })
        .addTo(leafletMapRef.current)
        .bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #18181B; padding: 2px;">
            <b style="font-size: 13px;">${b.name}</b><br/>
            <span style="color: #6B7280;">${b.category} &bull; ${businessSearchService.formatDistance(b.distanceMeters)} away</span><br/>
            ${b.address ? `<span style="font-size: 11px; color: #4B5563;">📍 ${b.address}</span><br/>` : ''}
            ${b.phone ? `<a href="tel:${b.phone}" style="color: #D97706; font-weight: bold; font-size: 11px; text-decoration: none;">📞 ${b.phone}</a><br/>` : ''}
            <a href="${directionsService.getGoogleMapsDirectionsUrl({ destinationLat: b.coordinates.lat, destinationLng: b.coordinates.lng, destinationName: b.name })}" target="_blank" style="display: inline-block; margin-top: 4px; color: #2563EB; font-weight: bold; text-decoration: underline;">Get Directions &rarr;</a>
          </div>
        `);

      marker.on('click', () => {
        setSelectedBusiness(b);
        if (onSelectBusiness) onSelectBusiness(b);
      });

      markersRef.current.push(marker);
    });

  }, [leafletReady, displayedBusinesses, coordinates, viewMode, selectedBusiness, theme]);

  return (
    <div className={`w-full flex flex-col space-y-4 p-2 sm:p-4 rounded-3xl transition-colors duration-300 ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-zinc-950 text-zinc-100'
    }`}>
      
      {/* 1. TOP HEADER & LOCALITY SELECTOR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              <span>Nearby Salons</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30">
              Google Maps & Places API
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Find salons near your current location.
          </p>
        </div>

        {/* Current Location Badge & Change Trigger */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowLocationModal(true)}
            className={`flex-1 sm:flex-initial flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-sm'
                : 'bg-zinc-900 border-white/10 text-zinc-200 hover:border-amber-400/50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate max-w-[200px]">{localityName}</span>
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase underline">Change</span>
          </button>

          <button
            onClick={handleRequestLocation}
            title="📍 Find Salons Near Me"
            className="px-3.5 py-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <LocateFixed className="w-4 h-4" />
            <span className="hidden sm:inline">📍 Find Salons Near Me</span>
          </button>
        </div>
      </div>

      {/* 2. PERMISSION BANNER (Shown when location is in prompt or denied state) */}
      {permissionState === 'prompt' && (
        <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
          theme === 'light'
            ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30 text-slate-800'
            : 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border-amber-400/30 text-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-zinc-950 flex items-center justify-center shrink-0 font-bold shadow-lg">
              <LocateFixed className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Nearby Salons</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Find salons near your current location by enabling browser location permission.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={handleRequestLocation}
              className="flex-1 md:flex-initial px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 font-bold text-xs rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>📍 Find Salons Near Me</span>
            </button>
            <button
              onClick={() => setShowLocationModal(true)}
              className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-semibold border border-white/10 hover:bg-white/5 transition-all cursor-pointer"
            >
              Search City
            </button>
          </div>
        </div>
      )}

      {permissionState === 'denied' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">Location permission is required to find salons near you.</span>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <a
              href="https://www.google.com/maps/search/salons+near+me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-initial px-3.5 py-1.5 bg-amber-400 text-zinc-950 font-bold rounded-xl hover:bg-amber-300 transition text-center text-xs"
            >
              Search salons on Google Maps
            </a>
            <button
              onClick={() => setShowLocationModal(true)}
              className="flex-1 md:flex-initial px-3.5 py-1.5 bg-zinc-800 border border-white/10 text-white font-semibold rounded-xl hover:bg-zinc-700 transition"
            >
              Enter Location Manually
            </button>
          </div>
        </div>
      )}

      {/* 3. DYNAMIC SEARCH BAR & PRESET CHIPS */}
      <div className="space-y-2">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBusinesses(coordinates, currentRadiusMeters)}
            placeholder="Search salon names, barbers, spas, or specific services..."
            className={`w-full py-2.5 pl-10 pr-24 rounded-2xl border text-xs focus:outline-none transition-all ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500'
                : 'bg-zinc-900/90 border-white/10 text-white placeholder:text-zinc-500 focus:border-amber-400/50'
            }`}
          />
          <button
            onClick={() => fetchBusinesses(coordinates, currentRadiusMeters)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow cursor-pointer hover:bg-amber-300 transition-all"
          >
            Search
          </button>
        </div>

        {/* Quick Locality Preset Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          <span className="text-zinc-500 font-mono font-bold uppercase shrink-0">Popular:</span>
          {QUICK_LOCATION_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleSelectLocality(p)}
              className={`px-2.5 py-1 rounded-full border shrink-0 transition-all cursor-pointer ${
                localityName.includes(p.name)
                  ? 'bg-amber-400/20 border-amber-400 text-amber-400 font-bold'
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              📍 {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4. CATEGORY FILTERS & VIEW MODE CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['All', 'Salons', 'Barbers', 'Spa', 'Beauty', 'Hair'].map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            const count = categoryCounts[cat] ?? (cat === 'All' ? businesses.length : 0);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-md shadow-amber-400/10 font-extrabold'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-zinc-950/20 text-zinc-950' : 'bg-white/10 text-zinc-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Toggle & Sorting Options */}
        <div className="flex items-center gap-2">
          {/* Sorting Dropdown */}
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value as any)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none cursor-pointer ${
              theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-zinc-900 border-white/10 text-zinc-300'
            }`}
          >
            <option value="distance">Sort: Nearest First</option>
            <option value="rating">Sort: Highest Rated</option>
            <option value="reviews">Sort: Most Reviewed</option>
          </select>

          {/* Map vs List View Switcher */}
          <div className="flex items-center rounded-xl p-0.5 border border-white/10 bg-zinc-900">
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'map' ? 'bg-amber-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'
              }`}
              title="Map View"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Map</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-amber-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. SEARCH METRICS BAR & REFRESH ACTIONS */}
      <div className="flex flex-wrap justify-between items-center text-xs text-zinc-400 px-1 pt-1 gap-2">
        <span>
          Showing <strong className="text-white font-mono">{displayedBusinesses.length}</strong> salons within <strong className="text-amber-400 font-mono">5 KM</strong>
        </span>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchBusinesses(coordinates, 5000)}
            className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer transition"
            title="Refresh current search"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={handleRequestLocation}
            className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-400 text-zinc-950 hover:bg-amber-300 flex items-center gap-1 cursor-pointer transition shadow"
            title="Search again using GPS location"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>Search Again</span>
          </button>
        </div>
      </div>

      {/* 6. MAIN CONTENT AREA: MAP & BUSINESS CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* MAP CONTAINER (Visible in Map Mode) */}
        {viewMode === 'map' && (
          <div className="lg:col-span-7 h-[420px] lg:h-[580px] rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl bg-zinc-900">
            <div ref={mapContainerRef} className="w-full h-full" />
            
            {/* Map Floating Control Overlay */}
            <div className="absolute top-3 left-3 z-[1000] bg-zinc-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-mono text-zinc-300 flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Google Maps Platform — Places API (New)</span>
            </div>
          </div>
        )}

        {/* BUSINESS LISTINGS / CARDS PANEL */}
        <div className={`${viewMode === 'map' ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-3`}>
          
          {/* SKELETON LOADERS WHILE FETCHING */}
          {isLoading && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Finding salons near you...</span>
              </div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 animate-pulse space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-white/10 rounded w-2/3"></div>
                      <div className="h-3 bg-white/5 rounded w-1/2"></div>
                    </div>
                    <div className="w-12 h-5 bg-white/10 rounded"></div>
                  </div>
                  <div className="h-3 bg-white/5 rounded w-3/4"></div>
                  <div className="flex gap-2 pt-2">
                    <div className="h-7 bg-white/10 rounded-lg w-24"></div>
                    <div className="h-7 bg-white/10 rounded-lg w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EMPTY STATE */}
          {!isLoading && displayedBusinesses.length === 0 && (
            <div className="p-8 rounded-3xl border border-white/10 bg-zinc-900/40 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto text-xl">
                📍
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white">No salons or barber shops were found within 5 km of your location.</h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Try searching a different city or location, or view available salons directly on Google Maps.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <a
                  href={`https://www.google.com/maps/search/salons+near+${coordinates.lat},${coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow hover:bg-amber-300 transition cursor-pointer"
                >
                  Search Salons on Google Maps
                </a>
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="px-4 py-2 bg-zinc-800 border border-white/10 text-white font-semibold text-xs rounded-xl hover:bg-zinc-700 transition cursor-pointer"
                >
                  Search City
                </button>
                <button
                  onClick={() => fetchBusinesses(coordinates, 5000)}
                  className="px-3 py-2 text-zinc-400 hover:text-white text-xs underline cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* REAL BUSINESS CARDS LIST */}
          {!isLoading && displayedBusinesses.length > 0 && (
            <div className={`space-y-3 ${viewMode === 'map' ? 'max-h-[580px] overflow-y-auto pr-1' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0'}`}>
              {displayedBusinesses.map((b) => {
                const isSelected = selectedBusiness?.id === b.id;

                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBusiness(b);
                      if (onSelectBusiness) onSelectBusiness(b);
                      if (leafletMapRef.current) {
                        leafletMapRef.current.panTo([b.coordinates.lat, b.coordinates.lng]);
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? (theme === 'light' 
                            ? 'bg-amber-50/80 border-amber-500 shadow-md ring-2 ring-amber-400/20' 
                            : 'bg-zinc-900 border-amber-400 shadow-xl shadow-amber-400/5 ring-1 ring-amber-400/30')
                        : (theme === 'light'
                            ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                            : 'bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900')
                    }`}
                  >
                    <div>
                      {/* Top Badges & Salon Name */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                              b.category === 'Barber' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              b.category === 'Spa' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {b.category}
                            </span>

                            {b.isPlatformRegistered && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-amber-400 text-zinc-950 flex items-center gap-1">
                                <ShieldCheck className="w-2.5 h-2.5" /> Verified
                              </span>
                            )}

                            {b.source && (
                              <span className="px-2 py-0.5 rounded-full text-[8px] font-mono font-medium text-zinc-400 bg-white/5 border border-white/10">
                                {b.source}
                              </span>
                            )}
                          </div>

                          <h3 className={`font-extrabold text-sm leading-tight transition-colors ${
                            theme === 'light' ? 'text-slate-900 group-hover:text-amber-700' : 'text-white group-hover:text-amber-400'
                          }`}>
                            {b.name}
                          </h3>
                        </div>

                        {/* Distance Badge */}
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-amber-400">
                            📍 {businessSearchService.formatDistance(b.distanceMeters)} away
                          </span>
                        </div>
                      </div>

                      {/* Rating & Reviews */}
                      {b.rating !== null && b.rating !== undefined ? (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-lg text-xs font-bold font-mono">
                            <Star className="w-3.5 h-3.5 fill-yellow-400" />
                            <span>{b.rating.toFixed(1)}</span>
                          </div>
                          {b.reviewsCount !== null && b.reviewsCount !== undefined && (
                            <span className="text-[11px] text-zinc-400 font-medium">({b.reviewsCount} reviews)</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mt-2 text-[11px] text-zinc-500">
                          <Star className="w-3 h-3 text-zinc-600" />
                          <span>Rating unavailable</span>
                        </div>
                      )}

                      {/* Address */}
                      {b.address && (
                        <p className="text-[11px] text-zinc-400 flex items-start gap-1 mt-2 line-clamp-2">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                          <span>{b.address}</span>
                        </p>
                      )}

                      {/* Opening Status */}
                      {b.openNow !== undefined && b.openNow !== null ? (
                        <p className="text-[11px] font-medium flex items-center gap-1 mt-2">
                          {b.openNow ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Open Now
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Closed
                            </span>
                          )}
                        </p>
                      ) : b.openingHours ? (
                        <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mt-1.5">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{b.openingHours}</span>
                        </p>
                      ) : null}
                    </div>

                    {/* Action Buttons Bar */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBusiness(b);
                          if (onSelectBusiness) onSelectBusiness(b);
                          if (viewMode !== 'map') setViewMode('map');
                          if (leafletMapRef.current) {
                            leafletMapRef.current.panTo([b.coordinates.lat, b.coordinates.lng]);
                          }
                        }}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View on Map</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const directionsUrl = directionsService.getGoogleMapsDirectionsUrl({
                            destinationLat: b.coordinates.lat,
                            destinationLng: b.coordinates.lng,
                            destinationName: b.name,
                            placeId: b.placeId,
                            originLat: coordinates.lat,
                            originLng: coordinates.lng
                          });
                          window.open(directionsUrl, '_blank', 'noopener,noreferrer');
                        }}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Get Directions</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* 7. LOCATION SEARCH MODAL / DIALOG */}
      {showLocationModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl border p-6 space-y-4 shadow-2xl transition-all ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-zinc-900 border-white/10 text-white'
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Search Any City, Town, or Village</h3>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                autoFocus
                value={locationSearchInput}
                onChange={(e) => setLocationSearchInput(e.target.value)}
                placeholder="Type village (e.g. Podalakuru), city, or pincode..."
                className={`w-full py-2.5 pl-10 pr-4 rounded-xl border text-xs focus:outline-none ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-zinc-950 border-white/10 text-white'
                }`}
              />
            </div>

            {/* Suggestions Dropdown */}
            {isSearchingLocation && (
              <div className="text-xs text-zinc-400 py-3 text-center animate-pulse">
                Searching geocoding registries...
              </div>
            )}

            {locationSuggestions.length > 0 && (
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {locationSuggestions.map((place, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectLocality(place)}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-amber-400/15 border border-transparent hover:border-amber-400/30 text-xs transition flex items-start gap-2 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white">{place.shortName}</div>
                      <div className="text-[10px] text-zinc-400 line-clamp-1">{place.displayName}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Presets Section in Modal */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">Popular Andhra Pradesh / Regional Hubs:</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_LOCATION_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleSelectLocality(preset)}
                    className="px-3 py-1.5 rounded-xl border border-white/5 bg-white/5 hover:bg-amber-400 hover:text-zinc-950 text-xs font-semibold transition cursor-pointer"
                  >
                    📍 {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowLocationModal(false)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
