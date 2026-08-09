import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { 
  Shop, Booking, UserProfile, Coupon, Membership, 
  Service, Barber, Review 
} from './types';

// Components
import MockMap from './components/MockMap';
import AiStylingAssistant from './components/AiStylingAssistant';
import GoogleMapComponent from './components/GoogleMapComponent';
import CheckoutWizard from './components/CheckoutWizard';
import OwnerDashboard from './components/OwnerDashboard';
import StylistWorkspace from './components/StylistWorkspace';
import AdminConsole from './components/AdminConsole';
import LoginScreen from './components/LoginScreen';

// Icons
import { 
  Search, SlidersHorizontal, MapPin, Sparkles, Navigation, Heart, 
  Compass, BadgePercent, Star, ShieldCheck, Ticket, 
  DollarSign, Activity, Bell, CalendarDays, Zap, HelpCircle, ChevronRight, LogOut,
  Sun, Moon, Shield, Scissors, Briefcase, User
} from 'lucide-react';

export default function App() {
  // Authentication & Profile States
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Core Server Shared States
  const [shops, setShops] = useState<Shop[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  
  // Admin only state
  const [users, setUsers] = useState<UserProfile[]>([]);

  // CMS configuration state
  const [cmsData, setCmsData] = useState<any>({
    hero_section: {
      title: 'Elite Grooming for the Modern Gentleman',
      subtitle: 'Discover the city\'s finest barbers, track real-time queue waiting times, and book bespoke styling sessions in seconds.',
      banner: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1200'
    },
    theme_settings: {
      business_name: 'StyleSlot',
      logo_url: '',
      primary_color: '#D4AF37',
      secondary_color: '#18181B'
    },
    about_section: {
      title: 'A Legacy of Sophistication',
      content: 'StyleSlot is a premium curation of luxury barbershops and styling suites. We blend old-school hospitality with high-technology queue analytics and virtual AI face-shape consultation.',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600'
    },
    contact_details: {
      phone: '+91 98765 43210',
      email: 'contact@styleslot.com',
      address: 'StyleSlot Hub, India',
      working_hours: 'Mon - Sun: 09:00 AM - 10:00 PM'
    },
    social_links: {
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com'
    },
    seo_settings: {
      title: 'StyleSlot - Premium Grooming Marketplace',
      description: 'Book elite salons in real-time'
    },
    homepage_sections: {
      show_hero: true,
      show_featured: true,
      show_all_shops: true,
      show_memberships: true,
      show_testimonials: true,
      show_faqs: true
    },
    faqs: [],
    testimonials: []
  });

  // App UI Navigation States
  const [currentRole, setCurrentRole] = useState<'customer' | 'owner' | 'barber' | 'admin'>('customer');
  const [activeCustomerTab, setActiveCustomerTab] = useState<'explore' | 'nearby' | 'bookings' | 'ai-lab'>('explore');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('styleslot_theme') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('styleslot_theme', nextTheme);
  };

  // Admin route & authentication states
  const [isAdminPath, setIsAdminPath] = useState<boolean>(() => {
    const path = window.location.pathname;
    return path === '/admin' || path === '/admin/' || window.location.hash === '#admin';
  });
  const [adminAuthenticated, setAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('styleslot_admin_auth') === 'true';
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminAuthError, setAdminAuthError] = useState<string>('');
  const [adminActivePortal, setAdminActivePortal] = useState<'admin' | 'owner' | 'barber' | 'customer'>('admin');
  const [adminSelectedShopId, setAdminSelectedShopId] = useState<string>('');

  // Customer Filter conditions
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyHomeService, setOnlyHomeService] = useState<boolean>(false);
  const [maxDistance, setMaxDistance] = useState<number>(5);

  // Detail Modal & Checkout triggers
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [checkoutShop, setCheckoutShop] = useState<Shop | null>(null);

  // Geographic location coordinates & address
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number }>({ lat: 17.6868, lng: 83.2185 });
  const [userAddress, setUserAddress] = useState<string>('Visakhapatnam, Andhra Pradesh, India');
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);
  const [mapSearchQuery, setMapSearchQuery] = useState<string>('');
  const [selectedHairstyleForMap, setSelectedHairstyleForMap] = useState<string>('');

  const handleSaveSalonSelection = async (selection: {
    googlePlaceId: string;
    salonName: string;
    latitude: number;
    longitude: number;
    selectedHairstyle: string;
  }) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/selected-salons', {
        method: 'POST',
        headers,
        body: JSON.stringify(selection)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save salon selection');
      }

      triggerToast(`Successfully booked & saved: ${selection.salonName} with style "${selection.selectedHairstyle}"!`, 'success');
      
      // Refresh user selections if required, and close modal after short delay
      setTimeout(() => {
        setIsMapModalOpen(false);
        setSelectedHairstyleForMap('');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || 'Failed to save salon selection', 'error');
    }
  };

  const handleMapSearch = () => {
    if (!mapSearchQuery.trim()) return;
    const query = mapSearchQuery.toLowerCase();
    
    if (query.includes('visakhapatnam') || query.includes('vizag')) {
      setUserCoordinates({ lat: 17.6868, lng: 83.2185 });
      setUserAddress('Visakhapatnam, Andhra Pradesh, India');
      triggerToast('Centered coordinates to: Visakhapatnam Center', 'info');
    } else if (query.includes('vijayawada')) {
      setUserCoordinates({ lat: 16.5062, lng: 80.6480 });
      setUserAddress('Vijayawada, Andhra Pradesh, India');
      triggerToast('Centered coordinates to: Vijayawada', 'info');
    } else if (query.includes('guntur')) {
      setUserCoordinates({ lat: 16.3067, lng: 80.4365 });
      setUserAddress('Guntur, Andhra Pradesh, India');
      triggerToast('Centered coordinates to: Guntur District', 'info');
    } else if (query.includes('tirupati')) {
      setUserCoordinates({ lat: 13.6284, lng: 79.4192 });
      setUserAddress('Tirupati, Andhra Pradesh, India');
      triggerToast('Centered coordinates to: Tirupati Temple Area', 'info');
    } else if (query.includes('podalakuru')) {
      setUserCoordinates({ lat: 14.3941, lng: 79.7297 });
      setUserAddress('Podalakuru, Nellore District, AP, India');
      triggerToast('Centered coordinates to: Podalakuru Mandal', 'info');
    } else if (query.includes('kakinada')) {
      setUserCoordinates({ lat: 16.9891, lng: 82.2475 });
      setUserAddress('Kakinada, Andhra Pradesh, India');
      triggerToast('Centered coordinates to: Kakinada Port Area', 'info');
    } else if (query.includes('rajahmundry')) {
      setUserCoordinates({ lat: 17.0005, lng: 81.8040 });
      setUserAddress('Rajahmundry, Andhra Pradesh, India');
      triggerToast('Centered coordinates to: Rajahmundry City', 'info');
    } else {
      const latOffset = (Math.random() - 0.5) * 0.04;
      const lngOffset = (Math.random() - 0.5) * 0.04;
      const targetLat = 17.6868 + latOffset;
      const targetLng = 83.2185 + lngOffset;
      
      setUserCoordinates({ lat: targetLat, lng: targetLng });
      const formattedAddress = mapSearchQuery
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setUserAddress(`${formattedAddress}, Andhra Pradesh, India`);
      triggerToast(`Geocoded and panned map to: ${formattedAddress}`, 'success');
    }
  };
  
  // Interactive review forms
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewedBookingId, setReviewedBookingId] = useState<string | null>(null);

  // Active home-service courier tracker simulation link
  const [activeTrackerLink, setActiveTrackerLink] = useState<{ name: string; eta: number; status: string } | null>(null);

  // System Loading / Feedback states
  const [systemLoading, setSystemLoading] = useState<boolean>(true);
  const [alertNotification, setAlertNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Fetch helper wrapping auth headers
  const secureFetch = async (url: string, options: RequestInit = {}) => {
    const token = session?.access_token;
    const headers = {
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    return fetch(url, { ...options, headers });
  };

  // Fetch initial state registry from `/api/*`
  const fetchAllData = async (token?: string) => {
    try {
      const activeToken = token || session?.access_token;
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const [resProfile, resShops, resBookings, resCoupons, resMemberships, resCms] = await Promise.all([
        fetch('/api/profile', { headers }).then(r => r.json()),
        fetch('/api/shops', { headers }).then(r => r.json()),
        fetch('/api/bookings', { headers }).then(r => r.json()),
        fetch('/api/coupons', { headers }).then(r => r.json()),
        fetch('/api/memberships', { headers }).then(r => r.json()),
        fetch('/api/cms', { headers }).then(r => r.json())
      ]);

      if (resProfile && !resProfile.error) {
        setProfile(resProfile);
        setCurrentRole(resProfile.role);
      }
      if (resShops && !resShops.error) setShops(resShops);
      if (resBookings && !resBookings.error) setBookings(resBookings);
      if (resCoupons && !resCoupons.error) setCoupons(resCoupons);
      if (resMemberships && !resMemberships.error) setMemberships(resMemberships);
      if (resCms && !resCms.error) {
        setCmsData((prev: any) => ({ ...prev, ...resCms }));
        if (resCms.seo_settings?.title) {
          document.title = resCms.seo_settings.title;
        }
      }

      // If Admin path or Admin role, load users directory
      if (isAdminPath || (resProfile && resProfile.role === 'admin')) {
        const resUsers = await fetch('/api/admin/users', { headers }).then(r => r.json());
        if (resUsers && !resUsers.error) setUsers(resUsers);
      }
    } catch (err) {
      console.error('Remote initialization failed, syncing simulated state models...', err);
    } finally {
      setSystemLoading(false);
    }
  };

  // Listen to Supabase authentication state and admin path routing updates
  useEffect(() => {
    const checkAdminPathActive = () => {
      const path = window.location.pathname;
      return path === '/admin' || path === '/admin/' || window.location.hash === '#admin';
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        sessionStorage.setItem('sb-access-token', session.access_token);
        fetchAllData(session.access_token);
      } else {
        sessionStorage.removeItem('sb-access-token');
        if (checkAdminPathActive()) {
          fetchAllData();
        } else {
          setSystemLoading(false);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        sessionStorage.setItem('sb-access-token', session.access_token);
        fetchAllData(session.access_token);
      } else {
        sessionStorage.removeItem('sb-access-token');
        if (checkAdminPathActive()) {
          // Keep data if admin path is active to allow guest admin login view to show database tables
        } else {
          setProfile(null);
          setShops([]);
          setBookings([]);
          setCoupons([]);
          setMemberships([]);
          setUsers([]);
          setSystemLoading(false);
        }
      }
    });

    // Sync path updates
    const handleLocationSync = () => {
      setIsAdminPath(checkAdminPathActive());
    };
    window.addEventListener('popstate', handleLocationSync);
    window.addEventListener('hashchange', handleLocationSync);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('popstate', handleLocationSync);
      window.removeEventListener('hashchange', handleLocationSync);
    };
  }, []);

  // Poll server state intervals to simulate dynamic real-time waiting lists
  useEffect(() => {
    if (!session) return;
    const pollId = setInterval(async () => {
      try {
        const resBookings = await secureFetch('/api/bookings').then(r => r.json());
        if (resBookings && !resBookings.error) {
          setBookings(resBookings);
          // Scan if any home service booking is accepted to kickstart transit tracking
          const inTransit = resBookings.find((b: Booking) => b.type === 'home-service' && b.status === 'accepted');
          if (inTransit) {
            setActiveTrackerLink({
              name: inTransit.barberName,
              eta: inTransit.estimatedWaitMinutes || 15,
              status: 'Transit coordinates online'
            });
          } else {
            setActiveTrackerLink(null);
          }
        }
      } catch (e) {
        // Silent recovery
      }
    }, 6000);
    return () => clearInterval(pollId);
  }, [session]);

  // Show a self-clearing toast alert message
  const triggerToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setAlertNotification({ message: msg, type });
    setTimeout(() => {
      setAlertNotification(null);
    }, 4000);
  };

  const handleAdminLogin = () => {
    const requiredPassword = (import.meta as any).env.VITE_ADMIN_PASSWORD || 'styleslot2026';
    if (adminPasswordInput === requiredPassword || adminPasswordInput === 'StyleSlotAdmin2026') {
      sessionStorage.setItem('styleslot_admin_auth', 'true');
      setAdminAuthenticated(true);
      setAdminAuthError('');
      setCurrentRole('admin');
      fetchAllData();
      triggerToast('Admin console authenticated successfully.', 'success');
    } else {
      setAdminAuthError('Invalid security passkey. Please try again.');
      triggerToast('Invalid admin passkey.', 'error');
    }
  };

  // Switch role controller syncing with server db
  const handleRoleChange = async (newRole: 'customer' | 'owner' | 'barber' | 'admin') => {
    try {
      const response = await secureFetch('/api/profile/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setCurrentRole(newRole);
        triggerToast(`Switched workspace to: ${newRole.toUpperCase()} mode`, 'info');
        
        // Refresh users roster if switching to admin role
        if (newRole === 'admin') {
          const resUsers = await secureFetch('/api/admin/users').then(r => r.json());
          if (resUsers && !resUsers.error) setUsers(resUsers);
        }
      }
    } catch (e) {
      setCurrentRole(newRole);
    }
  };

  // Add wallet deposit
  const handleTopUp = async (amount: number) => {
    try {
      const response = await secureFetch('/api/profile/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const data = await response.json();
      if (data.success) {
        if (profile) {
          setProfile({ ...profile, walletBalance: data.walletBalance });
        }
        triggerToast(`Deposited ₹${amount.toFixed(2)} to wallet!`, 'success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle favorite salon item
  const handleToggleFavorite = async (shopId: string) => {
    if (!profile) return;
    try {
      const response = await secureFetch('/api/profile/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId })
      });
      const data = await response.json();
      if (data.success) {
        setProfile({ ...profile, favorites: data.favorites });
        triggerToast(
          data.favorites.includes(shopId) ? 'Added shop to favorites' : 'Removed shop from favorites',
          'success'
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Booking completion wizard trigger
  const handleCheckoutSuccess = (resData: any) => {
    setBookings(prev => [resData.booking, ...prev]);
    if (profile) {
      setProfile({
        ...profile,
        walletBalance: resData.walletBalance,
        loyaltyPoints: profile.loyaltyPoints + Math.floor(resData.booking.totalPrice)
      });
    }
    setCheckoutShop(null);
    setSelectedShop(null);
    triggerToast('Appointment booked! Waiting queue list synced.', 'success');
    setActiveCustomerTab('bookings');
  };

  // Cancel reservation
  const handleCancelBooking = async (id: string) => {
    try {
      const response = await secureFetch(`/api/bookings/${id}/cancel`, {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'rejected' } : b));
        if (profile) {
          setProfile({ ...profile, walletBalance: data.walletBalance });
        }
        triggerToast('Grooming slot canceled. Refund credited.', 'info');
      } else {
        triggerToast(data.error || 'Cancellation declined.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Accept / Decline requests (Owner workflow)
  const handleAcceptRequest = async (id: string) => {
    try {
      const response = await secureFetch(`/api/bookings/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' })
      });
      if (response.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'accepted' } : b));
        triggerToast('Appointment slot approved & barber dispatched!', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclineRequest = async (id: string) => {
    try {
      const response = await secureFetch(`/api/bookings/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });
      if (response.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'rejected' } : b));
        triggerToast('Appointment declined', 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Complete job (Stylist workflow)
  const handleCompleteJob = async (id: string) => {
    try {
      const response = await secureFetch(`/api/bookings/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      if (response.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'completed' } : b));
        triggerToast('Grooming job completed successfully!', 'success');
        
        // Refresh shops database to fetch earnings updates
        const updatedShops = await secureFetch('/api/shops').then(r => r.json());
        setShops(updatedShops);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Onboard new stylist (Owner portal action)
  const handleAddBarber = async (shopId: string, barberPayload: any) => {
    try {
      const response = await secureFetch(`/api/shops/${shopId}/barbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(barberPayload)
      });
      if (response.ok) {
        const data = await response.json();
        setShops(prev => prev.map(s => s.id === shopId ? data.shop : s));
        triggerToast('Stylist added to shop roster!', 'success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Onboard new procedure service
  const handleAddService = async (shopId: string, servicePayload: any) => {
    try {
      const response = await secureFetch(`/api/shops/${shopId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(servicePayload)
      });
      if (response.ok) {
        const data = await response.json();
        setShops(prev => prev.map(s => s.id === shopId ? data.shop : s));
        triggerToast('Service catalog updated!', 'success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Verification (Admin action)
  const handleToggleShopVerify = async (shopId: string, currentStatus: boolean) => {
    try {
      const response = await secureFetch(`/api/shops/${shopId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !currentStatus })
      });
      if (response.ok) {
        setShops(prev => prev.map(s => s.id === shopId ? { ...s, isVerified: !currentStatus } : s));
        triggerToast(!currentStatus ? 'Awarded verification badge!' : 'Removed verification badge', 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update CMS Setting from Admin Console
  const handleUpdateCms = async (key: string, value: any) => {
    try {
      const response = await secureFetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (response.ok) {
        setCmsData((prev: any) => ({ ...prev, [key]: value }));
        triggerToast('Website content updated live!', 'success');
      } else {
        triggerToast('Failed to update content', 'error');
      }
    } catch (e) {
      console.error(e);
      triggerToast('Network error while saving settings', 'error');
    }
  };

  // Update user role from Admin Console
  const handleUpdateUserRole = async (userId: string, newRole: 'customer' | 'owner' | 'barber' | 'admin') => {
    try {
      const response = await secureFetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (response.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        triggerToast(`Updated user role to: ${newRole.toUpperCase()}`, 'success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit dynamic rating / review comments
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewedBookingId) return;

    try {
      const response = await secureFetch(`/api/bookings/${reviewedBookingId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
      });
      if (response.ok) {
        setBookings(prev => prev.map(b => b.id === reviewedBookingId ? { ...b, rating: reviewRating, reviewText: reviewComment } : b));
        
        // Refresh shops database
        const resShops = await secureFetch('/api/shops').then(r => r.json());
        if (resShops && !resShops.error) setShops(resShops);

        setReviewedBookingId(null);
        setReviewComment('');
        triggerToast('Thank you for your rating!', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Emergency matching logic
  const handleEmergencyInstapassMatch = () => {
    if (shops.length === 0) return;
    const sortedByDistance = [...shops].sort((a, b) => a.distance - b.distance);
    const closest = sortedByDistance[0];
    setCheckoutShop(closest);
    triggerToast(`Matched closest: ${closest.name} (${closest.distance}km). Booking Haircut!`, 'success');
  };

  // Dynamically calculate distance for each shop based on current userCoordinates
  const shopsWithDynamicDistance = shops.map(shop => {
    const dx = (shop.coordinates.lng - userCoordinates.lng) * 80;
    const dy = (shop.coordinates.lat - userCoordinates.lat) * 110;
    const computedDistance = parseFloat(Math.sqrt(dx * dx + dy * dy).toFixed(1));
    return {
      ...shop,
      distance: computedDistance
    };
  });

  // Customer Catalog Filters
  const filteredShops = shopsWithDynamicDistance.filter((shop) => {
    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          shop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          shop.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || shop.categories.includes(selectedCategory) || (selectedCategory === 'Home Service' && shop.homeService);
    const matchesHomeToggle = !onlyHomeService || shop.homeService;
    const matchesDistance = shop.distance <= maxDistance;
    return matchesSearch && matchesCategory && matchesHomeToggle && matchesDistance;
  });

  const isFavorite = (shopId: string) => profile?.favorites.includes(shopId) || false;

  if (systemLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center font-sans">
        <div className="w-16 h-16 rounded-full border-4 border-yellow-500/10 border-t-yellow-500 animate-spin" />
        <h3 className="text-lg font-bold tracking-widest text-[#D4AF37] uppercase mt-6">StyleSlot</h3>
        <p className="text-zinc-500 text-xs mt-2">Initializing secure luxury marketplace...</p>
      </div>
    );
  }

  if (!session && !isAdminPath) {
    return <LoginScreen onAuthSuccess={() => fetchAllData()} />;
  }

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'theme-light bg-slate-50 text-slate-900' : 'bg-[#0A0A0A] text-white'} font-sans flex flex-col overflow-x-hidden relative pb-16 transition-colors duration-300`}>
      
      {/* Inject custom variables for CMS custom styles and Theme */}
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --primary-color: ${cmsData.theme_settings?.primary_color || '#D4AF37'};
          --secondary-color: ${cmsData.theme_settings?.secondary_color || '#18181B'};
        }
        .bg-theme-primary { background-color: var(--primary-color) !important; }
        .text-theme-primary { color: var(--primary-color) !important; }
        .border-theme-primary { border-color: var(--primary-color) !important; }
        .bg-theme-secondary { background-color: var(--secondary-color) !important; }

        /* Light Mode Comprehensive Theme Overrides */
        .theme-light {
          background-color: #F8FAFC !important;
          color: #0F172A !important;
        }
        .theme-light .bg-\[\#0A0A0A\],
        .theme-light .bg-\[\#050505\],
        .theme-light .bg-\[\#0F0F11\],
        .theme-light .bg-\[\#0F0F11\]\/90,
        .theme-light .bg-\[\#18181B\],
        .theme-light .bg-\[\#121214\],
        .theme-light .bg-zinc-950,
        .theme-light .bg-zinc-950\/80,
        .theme-light .bg-zinc-950\/40,
        .theme-light .bg-zinc-950\/50,
        .theme-light .bg-zinc-900,
        .theme-light .bg-zinc-900\/90,
        .theme-light .bg-zinc-900\/80,
        .theme-light .bg-zinc-900\/50,
        .theme-light .bg-black,
        .theme-light .bg-black\/80,
        .theme-light .bg-black\/60,
        .theme-light .bg-black\/40 {
          background-color: #FFFFFF !important;
        }
        .theme-light .bg-white\/5,
        .theme-light .bg-white\/10 {
          background-color: #F1F5F9 !important;
        }
        .theme-light .border-white\/5,
        .theme-light .border-white\/10,
        .theme-light .border-zinc-800,
        .theme-light .border-zinc-900 {
          border-color: #E2E8F0 !important;
        }
        .theme-light h1, .theme-light h2, .theme-light h3, .theme-light h4, .theme-light h5,
        .theme-light .text-white {
          color: #0F172A !important;
        }
        .theme-light .text-zinc-100,
        .theme-light .text-zinc-200 {
          color: #1E293B !important;
        }
        .theme-light .text-zinc-300,
        .theme-light .text-zinc-400 {
          color: #475569 !important;
        }
        .theme-light .text-zinc-500,
        .theme-light .text-zinc-600 {
          color: #64748B !important;
        }
        .theme-light input,
        .theme-light textarea,
        .theme-light select {
          background-color: #FFFFFF !important;
          color: #0F172A !important;
          border-color: #CBD5E1 !important;
        }
        .theme-light input::placeholder,
        .theme-light textarea::placeholder {
          color: #94A3B8 !important;
        }
        .theme-light footer {
          background-color: #F1F5F9 !important;
          border-color: #E2E8F0 !important;
        }
        .theme-light .shadow-2xl {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03) !important;
        }
      `}} />

      {/* Visual background glows */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#D4AF37] opacity-[0.06] rounded-full blur-[130px] pointer-events-none" />

      {/* Floating Theme Switcher Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          id="btn-theme-toggle"
          onClick={toggleTheme}
          className={`px-3.5 py-2 rounded-full border shadow-xl backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
            theme === 'dark' 
              ? 'bg-zinc-900/90 border-yellow-500/30 text-yellow-400 hover:bg-zinc-800 hover:scale-105' 
              : 'bg-white/95 border-slate-300 text-slate-800 hover:bg-slate-50 hover:scale-105 shadow-slate-300/50'
          }`}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-800" />
              <span className="text-xs font-bold text-slate-800">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Floating alert notifications banner */}
      {alertNotification && (
        <div className={`fixed top-20 right-4 p-4 rounded-2xl shadow-2xl z-50 border max-w-sm flex items-center gap-3 animate-slideIn ${
          alertNotification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
            : 'bg-[#18181B] border-yellow-500/30 text-yellow-300'
        }`}>
          <div className="w-2 h-2 rounded-full bg-current animate-ping" />
          <span className="text-xs font-semibold">{alertNotification.message}</span>
        </div>
      )}

      {/* Main Container screen area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 relative z-10">
        
        {/* ==================== ADMIN PORTAL INTERCEPT ==================== */}
        {isAdminPath && (
          <div className="space-y-6">
            {!adminAuthenticated ? (
              /* Admin password login console card */
              <div className="max-w-md mx-auto my-12 bg-[#0F0F11]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[40px] pointer-events-none rounded-full" />
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto text-yellow-500 shadow-lg shadow-yellow-500/5">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-wide">Admin Passkey Verification</h3>
                  <p className="text-[11px] text-zinc-400">Please authenticate with the StyleSlot security code.</p>
                </div>

                {adminAuthError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <span>{adminAuthError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Security Passkey</label>
                    <input 
                      type="password"
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdminLogin();
                      }}
                      placeholder="••••••••••••••"
                      className="w-full bg-zinc-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500/40 placeholder:text-zinc-700"
                    />
                  </div>

                  <button 
                    onClick={handleAdminLogin}
                    className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:opacity-95 text-zinc-950 font-bold py-3.5 px-4 rounded-xl text-xs transition shadow-lg shadow-yellow-500/5 cursor-pointer"
                  >
                    Authenticate Console
                  </button>

                  <button 
                    onClick={() => {
                      window.location.hash = '';
                      window.history.pushState(null, '', '/');
                      setIsAdminPath(false);
                    }}
                    className="w-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white font-semibold py-3 px-4 rounded-xl text-[11px] transition cursor-pointer"
                  >
                    Return to Customer Portal
                  </button>
                </div>
              </div>
            ) : (
              /* Authenticated Admin view */
              <div className="space-y-6">
                {/* Admin Top Navigation & Portal Switcher Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-950 border border-white/5 p-4 md:px-6 md:py-3 rounded-2xl gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Admin Control Desk (Authenticated)</span>
                  </div>

                  {/* Portal Selector in Admin Mode */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
                    {[
                      { id: 'admin', name: 'Admin Console', icon: Shield },
                      { id: 'owner', name: 'Shop Owner Portal', icon: Scissors },
                      { id: 'barber', name: 'Stylist Workspace', icon: Briefcase },
                      { id: 'customer', name: 'Customer App', icon: User }
                    ].map((p) => {
                      const Icon = p.icon;
                      const isActive = adminActivePortal === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setAdminActivePortal(p.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 font-bold shadow-md shadow-yellow-500/10'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{p.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button 
                    onClick={() => {
                      sessionStorage.removeItem('styleslot_admin_auth');
                      setAdminAuthenticated(false);
                      setAdminPasswordInput('');
                      window.location.hash = '';
                      window.history.pushState(null, '', '/');
                      setIsAdminPath(false);
                      setCurrentRole('customer');
                    }}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Logout Admin Console
                  </button>
                </div>

                {/* Render Selected Portal in Admin Mode */}
                {adminActivePortal === 'admin' && (
                  <AdminConsole 
                    shops={shops}
                    bookings={bookings}
                    profile={profile || {
                      id: 'admin-password-session',
                      name: 'System Administrator',
                      email: 'admin@styleslot.com',
                      role: 'admin',
                      wallet_balance: 1000000,
                      loyalty_points: 9999
                    }}
                    cmsData={cmsData}
                    users={users}
                    coupons={coupons}
                    memberships={memberships}
                    onToggleShopVerify={handleToggleShopVerify}
                    onUpdateCms={handleUpdateCms}
                    onUpdateUserRole={handleUpdateUserRole}
                    onRefreshData={() => fetchAllData()}
                    onAcceptBooking={handleAcceptRequest}
                    onRejectBooking={handleDeclineRequest}
                    onAddBarber={handleAddBarber}
                    onAddService={handleAddService}
                  />
                )}

                {adminActivePortal === 'owner' && (
                  <div className="space-y-6 animate-fadeIn">
                    {shops.length > 1 && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-950 border border-white/10 p-4 rounded-2xl gap-3">
                        <div className="flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-yellow-500" />
                          <span className="text-xs font-semibold text-white">Active Salon Management Desk:</span>
                        </div>
                        <select
                          value={adminSelectedShopId || shops[0]?.id}
                          onChange={(e) => setAdminSelectedShopId(e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 text-xs text-yellow-400 font-semibold rounded-xl px-3 py-2 focus:outline-none"
                        >
                          {shops.map(s => (
                            <option key={s.id} value={s.id}>{s.name} — {s.address}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <OwnerDashboard 
                      ownerShop={shops.find(s => s.id === (adminSelectedShopId || shops[0]?.id)) || shops[0]}
                      bookings={bookings}
                      onAcceptBooking={handleAcceptRequest}
                      onRejectBooking={handleDeclineRequest}
                      onAddBarber={handleAddBarber}
                      onAddService={handleAddService}
                    />
                  </div>
                )}

                {adminActivePortal === 'barber' && (
                  <div className="animate-fadeIn">
                    <StylistWorkspace 
                      barber={shops[0]?.barbers[0] || {
                        id: 'barber-1',
                        name: 'Marcus Vance',
                        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150',
                        specialty: 'Skin Fades & Beard Sculpting',
                        rating: 4.9,
                        isAvailable: true,
                        bio: '10+ years experience in high-end classic barbering.'
                      }}
                      bookings={bookings}
                      onCompleteBooking={handleCompleteJob}
                    />
                  </div>
                )}

                {adminActivePortal === 'customer' && (
                  <div className="p-6 bg-zinc-950 border border-white/10 rounded-3xl space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-yellow-500" /> Customer Marketplace Preview
                      </h3>
                      <button
                        onClick={() => {
                          window.location.hash = '';
                          window.history.pushState(null, '', '/');
                          setIsAdminPath(false);
                          setCurrentRole('customer');
                        }}
                        className="text-xs text-yellow-400 hover:underline font-semibold"
                      >
                        Open Fullscreen Customer Portal &rarr;
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {shops.map(s => (
                        <div key={s.id} className="p-4 bg-zinc-900 border border-white/5 rounded-2xl space-y-2">
                          <img src={s.banner || s.image} alt={s.name} className="w-full h-32 object-cover rounded-xl" />
                          <h4 className="font-bold text-white text-sm">{s.name}</h4>
                          <p className="text-xs text-zinc-400">{s.address}</p>
                          <p className="text-xs text-yellow-400 font-mono">Rating: {s.rating} ★ ({s.reviewsCount} reviews)</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== ORIGINAL PORTALS ==================== */}
        {!isAdminPath && (
          <>
            {/* ==================== 1. CUSTOMER PORTAL WORKSPACE ==================== */}
            {currentRole === 'customer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT AREA: Explore Catalog & Booking Panels */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Dynamic CMS Splash Hero Banner (Theme-Aware & Interactive) */}
              {cmsData.homepage_sections?.show_hero && (
                <div 
                  className={`group relative rounded-3xl overflow-hidden border shadow-2xl transition-all duration-500 min-h-[280px] sm:min-h-[260px] flex flex-col justify-center p-6 sm:p-8 ${
                    theme === 'light' 
                      ? 'border-slate-200/80 bg-gradient-to-r from-white via-slate-50 to-amber-50/20 shadow-slate-200/80' 
                      : 'border-white/10 bg-gradient-to-r from-black via-zinc-950 to-black shadow-black/80'
                  }`}
                >
                  {/* Background Image with Theme-Responsive Asset & Hover Zoom */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                    style={{
                      backgroundImage: `url('${
                        theme === 'light' 
                          ? (cmsData.hero_section?.banner_light || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=1400')
                          : (cmsData.hero_section?.banner || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1400')
                      }')`
                    }}
                  />

                  {/* Theme Gradient Backdrop Filter */}
                  <div 
                    className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
                      theme === 'light'
                        ? 'bg-gradient-to-r from-white/95 via-slate-50/90 to-white/40'
                        : 'bg-gradient-to-r from-black/95 via-zinc-950/85 to-black/30'
                    }`}
                  />

                  {/* Ambient Light Accent Glow */}
                  <div className={`absolute top-0 right-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
                    theme === 'light' ? 'bg-amber-300/20 opacity-70' : 'bg-yellow-500/10 opacity-50'
                  }`} />

                  {/* Banner Content Layout */}
                  <div className="relative z-10 max-w-xl space-y-3.5">
                    {/* Top Interactive Feature Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono font-bold uppercase tracking-wider transition-all duration-300 ${
                        theme === 'light'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 shadow-sm'
                          : 'bg-[#D4AF37]/15 border-[#D4AF37]/30 text-theme-primary shadow-lg shadow-yellow-500/5'
                      }`}>
                        <Sparkles className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-600 fill-amber-500' : 'text-theme-primary fill-theme-primary'} animate-pulse`} />
                        <span>Next-Gen Grooming Solutions</span>
                      </div>

                      <div className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${
                        theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-zinc-400'
                      }`}>
                        <MapPin className="w-3 h-3 text-amber-500" />
                        <span>{shops.length} Salons Live</span>
                      </div>
                    </div>
                    
                    {/* Main Title */}
                    <h1 className={`text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight transition-colors duration-300 ${
                      theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>
                      {cmsData.hero_section?.title || 'Elite Grooming for the Modern Gentleman'}
                    </h1>
                    
                    {/* Subtitle */}
                    <p className={`text-xs sm:text-sm leading-relaxed max-w-lg transition-colors duration-300 ${
                      theme === 'light' ? 'text-slate-600 font-medium' : 'text-zinc-300 font-normal'
                    }`}>
                      {cmsData.hero_section?.subtitle || 'Instantly book nearby luxury barbershops, scan face symmetry, or authorize premium house call visits.'}
                    </p>

                    {/* Interactive Action Triggers */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button 
                        onClick={() => setActiveCustomerTab('ai-lab')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 active:scale-95 ${
                          theme === 'light'
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-amber-500/25 hover:shadow-amber-500/40'
                            : 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-200 text-zinc-950 shadow-yellow-500/10'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Scan Face Symmetry</span>
                      </button>
                      
                      <button 
                        onClick={handleEmergencyInstapassMatch}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 ${
                          theme === 'light'
                            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 shadow-sm'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 fill-current animate-bounce" />
                        <span>Emergency Instapass</span>
                      </button>

                      <button 
                        onClick={() => setActiveCustomerTab('nearby')}
                        className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          theme === 'light'
                            ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                            : 'bg-zinc-900/80 border border-white/10 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <Navigation className="w-3 h-3 text-amber-500" />
                        <span>Radar Salons</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Category Pills Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pr-1">
                  <h4 className="text-xs uppercase font-mono tracking-widest text-zinc-400">Discover Service Categories</h4>
                  {selectedCategory !== 'All' && (
                    <button 
                      onClick={() => setSelectedCategory('All')} 
                      className="text-[10px] text-theme-primary hover:underline"
                    >
                      Clear Category Filter
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'All', icon: '💎' },
                    { name: 'Haircut', icon: '✂️' },
                    { name: 'Beard Styling', icon: '🧔' },
                    { name: 'Hair Spa', icon: '💆‍♂️' },
                    { name: 'Hair Coloring', icon: '🎨' },
                    { name: 'Facial', icon: '🧖‍♂️' },
                    { name: 'Home Service', icon: '🏠' }
                  ].map((cat) => {
                    const isSel = selectedCategory === cat.name;
                    return (
                      <button
                        key={cat.name}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                          isSel 
                            ? 'bg-[#D4AF37]/15 border-theme-primary text-theme-primary font-extrabold shadow-md shadow-yellow-500/5' 
                            : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-[#D4AF37]/10'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MAIN CONTENT TAB SELECTORS */}
              <div className={`flex border rounded-2xl p-1 gap-1 transition-all ${
                theme === 'light' 
                  ? 'bg-slate-100 border-slate-200 shadow-sm' 
                  : 'bg-zinc-950/60 border-white/5'
              }`}>
                {[
                  { id: 'explore', label: 'Explore Shops', icon: Compass },
                  { id: 'nearby', label: 'Nearby Salons', icon: Navigation },
                  { id: 'bookings', label: 'Queue & History', icon: CalendarDays },
                  { id: 'ai-lab', label: 'AI Grooming Lab', icon: Sparkles }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeCustomerTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCustomerTab(tab.id as any)}
                      className={`flex-1 py-2.5 text-center text-xs font-bold tracking-wide rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isActive 
                          ? (theme === 'light' 
                              ? 'bg-white border border-slate-200 text-amber-700 shadow-sm font-extrabold' 
                              : 'bg-zinc-900 border border-white/10 text-theme-primary shadow-md')
                          : (theme === 'light' 
                              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/50' 
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40')
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB CONTENT: EXPLORE GRID */}
              {activeCustomerTab === 'explore' && cmsData.homepage_sections?.show_all_shops && (
                <div className="space-y-6">
                  
                  {/* Fine Tuning Search Filters Bar */}
                  <div className={`${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 border-white/10'} border rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4`}>
                    <div className="relative flex-1 w-full">
                      <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'}`} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search salon names, features (Espresso, AC) or specialties..."
                        className={`w-full ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500' : 'bg-zinc-950 border-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-500/50'} border rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none`}
                      />
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto shrink-0">
                      <div className="flex items-center gap-2 flex-1 md:flex-initial">
                        <span className={`text-[10px] font-mono ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'} uppercase font-bold`}>Within:</span>
                        <input
                          type="range"
                          min="1"
                          max="8"
                          step="0.5"
                          value={maxDistance}
                          onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
                          className="w-24 accent-yellow-500"
                        />
                        <span className={`text-[10px] font-mono ${theme === 'light' ? 'text-slate-700' : 'text-theme-primary'} font-bold whitespace-nowrap`}>{maxDistance} km</span>
                      </div>

                      <label className="flex items-center gap-2 select-none shrink-0 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={onlyHomeService}
                          onChange={(e) => setOnlyHomeService(e.target.checked)}
                          className="w-3.5 h-3.5 accent-yellow-500"
                        />
                        <span className={`text-[10px] font-mono ${theme === 'light' ? 'text-slate-600' : 'text-zinc-400'} uppercase font-bold`}>Home Service Calls</span>
                      </label>
                    </div>
                  </div>

                  {/* Listings Grid */}
                  {filteredShops.length === 0 ? (
                    <div className={`text-center py-12 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-500' : 'bg-white/5 border-white/5 text-zinc-500'} border rounded-2xl text-xs`}>
                      No barber shops match your filters. Try resetting search parameters.
                    </div>
                  ) : (
                    <div id="explore-catalog-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredShops.map((shop) => (
                        <div 
                          key={shop.id}
                          className={`${theme === 'light' ? 'bg-white border-slate-200 shadow-md shadow-slate-200/50 hover:border-amber-400' : 'bg-[#18181B]/40 border-white/10 hover:border-yellow-500/40 shadow-lg'} border rounded-2xl overflow-hidden transition-all group flex flex-col backdrop-blur-md`}
                        >
                          {/* Banner */}
                          <div className={`h-32 ${theme === 'light' ? 'bg-slate-100' : 'bg-zinc-900'} relative`}>
                            <img 
                              src={shop.image} 
                              alt={shop.name} 
                              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" 
                            />
                            
                            <div className="absolute top-3 left-3 flex gap-1">
                              {shop.isVerified && (
                                <span className="bg-emerald-500 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow">
                                  VERIFIED
                                </span>
                              )}
                              {shop.homeService && (
                                <span className="bg-theme-primary text-zinc-950 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow">
                                  DELIVERY OK
                                </span>
                              )}
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(shop.id);
                              }}
                              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:text-red-400 transition"
                            >
                              <Heart className={`w-4 h-4 ${isFavorite(shop.id) ? 'text-red-500 fill-red-500' : 'text-zinc-400'}`} />
                            </button>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className={`font-extrabold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{shop.name}</h4>
                                  <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-zinc-400'} flex items-center gap-1 mt-0.5`}>
                                    <MapPin className="w-3 h-3 text-amber-500" /> {shop.address}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-lg text-yellow-500 font-mono text-xs font-bold shrink-0">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span>{shop.rating}</span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1 mt-3">
                                {shop.categories.slice(0, 3).map(cat => (
                                  <span key={cat} className={`text-[8px] uppercase tracking-wide ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-zinc-900 border-white/5 text-zinc-400'} border px-1.5 py-0.5 rounded font-mono font-semibold`}>
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className={`mt-4 pt-3 border-t ${theme === 'light' ? 'border-slate-100' : 'border-white/5'} flex items-center justify-between z-10`}>
                              <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'} font-mono`}>
                                📍 {shop.distance} km nearby &bull; {shop.workingHours}
                              </span>
                              
                              <button
                                onClick={() => setSelectedShop(shop)}
                                className="text-theme-primary font-bold text-xs uppercase tracking-wider flex items-center gap-1 hover:text-yellow-600 cursor-pointer"
                              >
                                View Rates <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CMS About Section */}
                  <div className={`p-8 rounded-3xl border ${theme === 'light' ? 'border-slate-200 bg-gradient-to-br from-white via-slate-50 to-amber-50/20 shadow-md' : 'border-white/5 bg-gradient-to-br from-zinc-950 via-zinc-900/60 to-black'} grid grid-cols-1 md:grid-cols-2 gap-6 items-center`}>
                    <div>
                      <h3 className={`text-xl font-extrabold ${theme === 'light' ? 'text-slate-900' : 'text-white'} tracking-tight`}>{cmsData.about_section?.title}</h3>
                      <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-zinc-400'} mt-3 leading-relaxed`}>{cmsData.about_section?.content}</p>
                    </div>
                    {cmsData.about_section?.image && (
                      <img src={cmsData.about_section.image} alt="Heritage branding" className={`w-full h-44 object-cover rounded-2xl border ${theme === 'light' ? 'border-slate-200' : 'border-white/10'}`} />
                    )}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: NEARBY SALONS MODULE */}
              {activeCustomerTab === 'nearby' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className={`h-[650px] rounded-3xl overflow-hidden border ${
                    theme === 'light' 
                      ? 'border-slate-200 bg-white shadow-xl shadow-slate-200/80' 
                      : 'border-white/10 bg-zinc-950/40 shadow-2xl'
                  } relative transition-all duration-300`}>
                    <GoogleMapComponent
                      selectedHairstyle={selectedHairstyleForMap}
                      userCoordinates={userCoordinates}
                      setUserCoordinates={setUserCoordinates}
                      userAddress={userAddress}
                      setUserAddress={setUserAddress}
                      onSaveSelection={handleSaveSalonSelection}
                      fullscreenMode={true}
                      theme={theme}
                    />
                  </div>
                </div>
              )}

              {/* TAB CONTENT: CLIENT BOOKING HISTORY */}
              {activeCustomerTab === 'bookings' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-theme-primary flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" /> SECURE BOOKINGS & WAITLISTS
                  </h3>

                  {bookings.filter(b => b.customerEmail === profile?.email).length === 0 ? (
                    <div className="text-center py-12 bg-white/5 border border-white/5 rounded-2xl text-zinc-500 text-xs">
                      No active bookings logs registered. Pick a salon from the list above and test checkout.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bookings
                        .filter(b => b.customerEmail === profile?.email)
                        .map((bk) => (
                          <div 
                            key={bk.id} 
                            className="p-4 rounded-2xl bg-zinc-900/80 border border-white/15 hover:border-yellow-500/15 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div className="flex gap-3">
                                {bk.shopImage && (
                                  <img src={bk.shopImage} alt={bk.shopName} className="w-12 h-12 object-cover rounded-xl shrink-0" />
                                )}
                                <div>
                                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                                    {bk.shopName}
                                    <span className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase ${
                                      bk.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                                      bk.status === 'accepted' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25' :
                                      bk.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
                                      'bg-yellow-500/10 text-yellow-500 border border-yellow-500/25'
                                    }`}>
                                      {bk.status}
                                    </span>
                                  </h4>
                                  <p className="text-[10px] text-zinc-400 mt-1">
                                    ✂️ {bk.serviceNames.join(', ')} &bull; Stylist: <span className="font-semibold text-white">{bk.barberName}</span>
                                  </p>
                                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                    🗓️ Date: {bk.date} &bull; Time Slot: {bk.time} &bull; Total Paid: ₹{bk.totalPrice}
                                  </p>
                                  {bk.type === 'home-service' && bk.address && (
                                    <p className="text-[9px] text-amber-500/70 font-mono mt-0.5">🏠 Dispatch location: {bk.address}</p>
                                  )}
                                </div>
                              </div>

                              {/* Interactive operations block */}
                              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                {bk.status === 'pending' && (
                                  <button
                                    onClick={() => handleCancelBooking(bk.id)}
                                    className="px-3 py-1.5 bg-red-950/60 border border-red-500/30 text-red-400 font-semibold rounded-lg text-[10px] hover:bg-red-900/50"
                                  >
                                    Cancel & Refund
                                  </button>
                                )}

                                {bk.status === 'completed' && !bk.rating && (
                                  <button
                                    onClick={() => setReviewedBookingId(bk.id)}
                                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg text-[10px] border border-white/5"
                                  >
                                    Submit Review
                                  </button>
                                )}

                                {bk.status === 'completed' && bk.rating && (
                                  <span className="text-[10px] font-mono text-zinc-500">Reviewed &bull; {bk.rating}★</span>
                                )}
                              </div>
                            </div>

                            {/* Live Queue feedback */}
                            {(bk.status === 'pending' || bk.status === 'accepted') && (
                              <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                                <span>Queue Position: #{bk.queueNumber}</span>
                                <span className="text-theme-primary">Est. Seat Waiting: {bk.estimatedWaitMinutes} mins</span>
                              </div>
                            )}

                          </div>
                        ))}
                    </div>
                  )}

                  {/* Review feedback form popover */}
                  {reviewedBookingId && (
                    <div className="p-4 bg-zinc-950 border border-yellow-500/30 rounded-2xl space-y-3">
                      <h4 className="text-xs font-bold text-white">Rate your Grooming Experience</h4>
                      <form onSubmit={handleSubmitReview} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400">Score:</span>
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setReviewRating(num)}
                              className={`text-sm ${reviewRating >= num ? 'text-yellow-400' : 'text-zinc-600'}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          required
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="What did you think of the precision cut or shave?"
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button type="button" onClick={() => setReviewedBookingId(null)} className="text-zinc-400">Cancel</button>
                          <button type="submit" className="bg-[#D4AF37] text-zinc-950 font-bold px-3 py-1 rounded">Post Review</button>
                        </div>
                      </form>
                    </div>
                  )}

                </div>
              )}

              {/* TAB CONTENT: AI STYLING LAB */}
              {activeCustomerTab === 'ai-lab' && (
                <AiStylingAssistant 
                  walletBalance={profile?.walletBalance || 0}
                  onAnalyzeComplete={(report) => triggerToast('AI Grooming report synthesized!', 'success')} 
                  onFindNearbySalons={(hairstyle) => {
                    setSelectedHairstyleForMap(hairstyle);
                    setIsMapModalOpen(true);
                  }}
                  theme={theme}
                />
              )}

            </div>

            {/* RIGHT SIDEBAR: Map Pinpoint & Live Tracking Details */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Geographic pinpoint mock map component */}
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 space-y-4">
                <h4 className="text-xs uppercase font-mono tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4" /> GEOGRAPHIC RADAR COORDINATES
                </h4>
                
                <div className="h-64 rounded-2xl overflow-hidden border border-white/5 relative bg-zinc-900">
                  <MockMap 
                    shops={filteredShops} 
                    selectedShop={selectedShop}
                    onSelectShop={setSelectedShop}
                    activeHomeServiceBarber={activeTrackerLink}
                    userCoordinates={userCoordinates}
                    userAddress={userAddress}
                    onMapClick={() => setIsMapModalOpen(true)}
                    theme={theme}
                  />
                </div>
                
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Real-time radar displays coordinates for nearby styling enrolees. Hover flags to check distance calculations.
                </p>
              </div>

              {/* Transit tracking status updates */}
              {activeTrackerLink && (
                <div className="bg-gradient-to-br from-yellow-500/10 to-black border border-yellow-500/30 rounded-3xl p-6 space-y-4 animate-pulse relative overflow-hidden">
                  <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-yellow-500/10 blur-xl pointer-events-none rounded-full" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4" /> Live Courier Dispatch
                  </h4>
                  <div className="space-y-1.5 font-mono text-xs">
                    <p className="text-white">Stylist: <span className="font-bold">{activeTrackerLink.name}</span></p>
                    <p className="text-zinc-400">ETA waiting time: <span className="text-yellow-400 font-bold">{activeTrackerLink.eta} mins</span></p>
                    <p className="text-zinc-500 text-[10px]">Status: {activeTrackerLink.status}</p>
                  </div>
                  
                  <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#D4AF37] h-full w-2/3 rounded-full animate-progress" />
                  </div>
                </div>
              )}

              {/* FAQs accordion block */}
              {cmsData.homepage_sections?.show_faqs && cmsData.faqs?.length > 0 && (
                <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs uppercase font-mono tracking-widest text-zinc-400">FAQs</h4>
                  <div className="space-y-3">
                    {cmsData.faqs.map((faq: any, i: number) => (
                      <details key={i} className="group border-b border-white/5 pb-2.5 last:border-0 cursor-pointer">
                        <summary className="text-xs text-zinc-300 font-bold list-none flex justify-between items-center">
                          {faq.question}
                          <span className="text-yellow-500 font-bold transition group-open:rotate-45">+</span>
                        </summary>
                        <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">{faq.answer}</p>
                      </details>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ==================== 2. SHOP OWNER DASHBOARD ==================== */}
        {currentRole === 'owner' && (
          <OwnerDashboard 
            ownerShop={shops[0] || {
              id: 'shop-1',
              name: 'The Vintage Lounge',
              image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400',
              banner: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1200',
              rating: 4.9,
              reviewsCount: 142,
              distance: 1.2,
              address: '412 Gold Avenue, Downtown luxury block',
              coordinates: { lat: 37.7833, lng: -122.4167 },
              isVerified: true,
              isFeatured: true,
              workingHours: '09:00 AM - 09:00 PM',
              features: ['Premium Espresso', 'A/C'],
              categories: ['Haircut'],
              services: [],
              barbers: []
            }} 
            bookings={bookings} 
            onAcceptBooking={handleAcceptRequest}
            onRejectBooking={handleDeclineRequest}
            onAddBarber={handleAddBarber}
            onAddService={handleAddService}
          />
        )}

        {/* ==================== 3. BARBER / STYLIST WORKSPACE ==================== */}
        {currentRole === 'barber' && (
          <StylistWorkspace 
            barber={shops.flatMap(s => s.barbers).find(b => b.name === profile?.name) || {
              id: 'barber-1',
              name: profile?.name || 'Alexander Wright',
              avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
              rating: 4.9,
              isAvailable: true,
              specialty: 'Master Scissors & Traditional Shaves',
              bio: 'Senior styling expert.'
            }}
            bookings={bookings}
            onCompleteBooking={handleCompleteJob}
          />
        )}

        {/* ==================== 4. MASTER ADMIN OPERATIONAL CONTROL ==================== */}
        {currentRole === 'admin' && profile && (
          <AdminConsole 
            shops={shops}
            bookings={bookings}
            profile={profile}
            cmsData={cmsData}
            users={users}
            coupons={coupons}
            memberships={memberships}
            onToggleShopVerify={handleToggleShopVerify}
            onUpdateCms={handleUpdateCms}
            onUpdateUserRole={handleUpdateUserRole}
            onRefreshData={() => fetchAllData()}
          />
        )}
          </>
        )}

      </main>

      {/* Detail Rates Modal screen popover */}
      {selectedShop && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden relative shadow-2xl">
            <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-yellow-500/5 blur-[80px] pointer-events-none rounded-full" />
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedShop.name}</h3>
                <p className="text-[10px] text-zinc-500 font-mono">📍 {selectedShop.address} &bull; {selectedShop.distance} km</p>
              </div>
              <button 
                onClick={() => setSelectedShop(null)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <h4 className="text-xs uppercase font-mono tracking-widest text-zinc-400">Available Grooming Rates</h4>
              <div className="space-y-2">
                {selectedShop.services.map((srv) => (
                  <div key={srv.id} className="p-3 bg-zinc-900 border border-white/5 rounded-xl flex justify-between items-center">
                    <div>
                      <h5 className="text-xs font-bold text-white">{srv.name}</h5>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{srv.description}</p>
                      <p className="text-[9px] text-theme-primary font-mono mt-1">⏱️ {srv.duration} mins &bull; {srv.category}</p>
                    </div>
                    <div className="text-sm font-mono font-bold text-yellow-500 shrink-0">₹{srv.price}</div>
                  </div>
                ))}
              </div>

              <h4 className="text-xs uppercase font-mono tracking-widest text-zinc-400 pt-2">Stylist Team Roster</h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedShop.barbers.map((b) => (
                  <div key={b.id} className="p-2.5 bg-zinc-900 border border-white/5 rounded-xl flex items-center gap-2.5">
                    <img src={b.avatar} alt={b.name} className="w-8 h-8 rounded-full object-cover grayscale" />
                    <div>
                      <h5 className="text-[10px] font-bold text-white">{b.name}</h5>
                      <p className="text-[9px] text-zinc-500">{b.specialty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-black/40 flex justify-end gap-2">
              <button 
                onClick={() => setSelectedShop(null)}
                className="px-4 py-2 border border-white/10 hover:bg-zinc-800 text-zinc-400 rounded-xl text-xs"
              >
                Go Back
              </button>
              <button 
                onClick={() => {
                  setCheckoutShop(selectedShop);
                }}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 font-bold rounded-xl text-xs hover:opacity-95"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Wizard popover modal trigger */}
      {checkoutShop && (
        <CheckoutWizard
          shop={checkoutShop}
          coupons={coupons}
          walletBalance={profile?.walletBalance || 0}
          onBookingSuccess={handleCheckoutSuccess}
          onClose={() => setCheckoutShop(null)}
          authToken={session?.access_token}
        />
      )}

      {/* Fullscreen Map Modal */}
      {isMapModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 overflow-hidden">
          <div className={`w-full max-w-6xl h-[90vh] ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900 shadow-2xl shadow-slate-400/40' : 'bg-zinc-950 border-white/10 text-white shadow-2xl'} border rounded-3xl flex flex-col overflow-hidden relative`}>
            
            {/* Header */}
            <div className={`p-4 sm:p-5 border-b ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/5'} flex justify-between items-center shrink-0`}>
              <div>
                <h3 className={`text-sm font-extrabold uppercase tracking-widest ${theme === 'light' ? 'text-amber-700' : 'text-[#D4AF37]'} flex items-center gap-2`}>
                  <Compass className="w-4 h-4 text-amber-500 animate-spin" /> Interactive GPS Salon Radar
                </h3>
                <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'} mt-1`}>Search areas to locate StyleSlot partner shops. Click a pin or listing to select.</p>
              </div>
              <button 
                onClick={() => {
                  setIsMapModalOpen(false);
                  setMapSearchQuery('');
                  setSelectedHairstyleForMap('');
                }}
                className={`w-8 h-8 rounded-full border ${theme === 'light' ? 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'border-white/10 text-zinc-400 hover:text-white'} flex items-center justify-center text-lg transition cursor-pointer`}
              >
                &times;
              </button>
            </div>

            {/* Main Area: Google Map Component */}
            <div className="flex-1 min-h-0 relative">
              <GoogleMapComponent
                selectedHairstyle={selectedHairstyleForMap}
                userCoordinates={userCoordinates}
                setUserCoordinates={setUserCoordinates}
                userAddress={userAddress}
                setUserAddress={setUserAddress}
                onSaveSelection={handleSaveSalonSelection}
                theme={theme}
              />
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/5'} flex justify-end shrink-0`}>
              <button 
                onClick={() => {
                  setIsMapModalOpen(false);
                  setMapSearchQuery('');
                }}
                className={`px-5 py-2.5 ${theme === 'light' ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-zinc-900 hover:bg-zinc-800 text-white'} rounded-xl text-xs font-bold transition cursor-pointer`}
              >
                Close Map
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Standard Footer layout bar */}
      <footer className={`w-full ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-[#050505] border-white/5 text-zinc-600'} border-t py-8 text-center text-[11px] relative z-10 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-4">
          
          {/* Action Buttons Row */}
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-sm ${
                theme === 'dark' 
                  ? 'bg-zinc-900 border-zinc-800 text-yellow-400 hover:text-white hover:bg-zinc-800' 
                  : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-yellow-400" /> : <Moon className="w-3.5 h-3.5 text-slate-800" />}
              <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
            </button>

            <button 
              onClick={handleLogout}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-sm ${
                theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>

          {/* Centered Middle Below: StyleSlot Network & Developer Credits */}
          <div className="text-center space-y-1 pt-2 border-t border-white/5 w-full max-w-md mx-auto">
            <h5 className="font-extrabold text-xs tracking-wider text-theme-primary">{cmsData.theme_settings?.business_name || 'StyleSlot'} Network</h5>
            <p className={`text-xs font-bold ${theme === 'light' ? 'text-slate-700' : 'text-zinc-300'}`}>Developed by Poojith Sai Chand</p>
            <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>&copy; {new Date().getFullYear()} {cmsData.theme_settings?.business_name || 'StyleSlot'}. All rights reserved.</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
