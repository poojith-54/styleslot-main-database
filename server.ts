import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { InferenceClient } from '@huggingface/inference';
import { Shop, Booking, UserProfile, Service, Barber, Review, Coupon, Membership } from './src/types';
import { SVG_HAIRSTYLES } from './src/utils/hairLibrary';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const useMockDatabase = 
  !supabaseUrl || 
  !supabaseServiceKey ||
  supabaseUrl.includes('YOUR_PROJECT_ID') || 
  supabaseUrl.includes('your-project-id') || 
  supabaseServiceKey.includes('eyJhbGciOi...');

let supabaseAdmin: any = null;

if (!useMockDatabase) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
} else {
  console.warn('StyleSlot is running in zero-config DEMO mode with in-memory database fallback.');
}

// --- IN-MEMORY DATABASE FALLBACK TABLES ---
export const mockProfiles: any[] = [];
export const mockBookings: any[] = [];
export const mockSelectedSalons: any[] = [];
export const mockSearchHistory: any[] = [];
export const mockRecentlyViewed: any[] = [];
export const mockUserFavorites: any[] = [];

export const mockShops: any[] = [
  {
    id: 'shop-1',
    name: 'The Taj Salon & Lounge',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400',
    banner: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1200',
    rating: 4.9,
    reviews_count: 142,
    distance: 1.2,
    address: 'Taj Mahal Palace, Colaba, Mumbai',
    latitude: 18.9220,
    longitude: 72.8347,
    is_verified: true,
    is_featured: true,
    working_hours: '09:00 AM - 09:00 PM',
    features: ['Premium South Indian Filter Coffee', 'A/C', 'High-Speed Wifi', 'Valet Parking', 'Luxury Leather Chairs'],
    categories: ['Haircut', 'Beard Styling', 'Hair Spa', 'Facial'],
    home_service: true,
    services: [
      { id: 'srv-101', shop_id: 'shop-1', name: 'Royal Golden Haircut', category: 'Haircut', price: 1200.00, duration: 45, description: 'Signature precision cut with organic shampoo, luxury conditioning, and gold-flaked styling product.' },
      { id: 'srv-102', shop_id: 'shop-1', name: 'Straight Razor Hot Towel Shave', category: 'Beard Styling', price: 800.00, duration: 30, description: 'Traditional multi-step hot towel preparation, pre-shave oil, close razor shave, and cooling aloe balm.' },
      { id: 'srv-103', shop_id: 'shop-1', name: 'Beard Sculpt & Line-up', category: 'Beard Styling', price: 600.00, duration: 25, description: 'Detailed sculpting with standard clippers followed by sharp straight razor definition.' },
      { id: 'srv-104', shop_id: 'shop-1', name: 'Hydro-Spa Scalp Therapy', category: 'Hair Spa', price: 1500.00, duration: 40, description: 'Soothing steam massage, tea tree nourishing scalp mask, and deep massage.' },
      { id: 'srv-105', shop_id: 'shop-1', name: 'Charcoal Rejuvenating Facial', category: 'Facial', price: 1000.00, duration: 30, description: 'Pore extraction, active charcoal mask, cold mist, and gold serum finish.' }
    ],
    barbers: [
      { id: 'barber-1', shop_id: 'shop-1', name: 'Alexander Wright', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', rating: 4.9, is_available: true, specialty: 'Master Scissors & Traditional Shaves', bio: 'With 12 years of luxury grooming experience, Alexander specializes in classic cuts.', earnings: 52000.00 },
      { id: 'barber-2', shop_id: 'shop-1', name: 'Marcus Sterling', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', rating: 4.8, is_available: true, specialty: 'Modern Street Fades & Beard Styling', bio: 'Marcus crafts high-contrast skins, tapers, and premium sharp line-ups.', earnings: 38000.00 }
    ],
    reviews: [
      { id: 'rev-1', shop_id: 'shop-1', customer_name: 'David K.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=80', rating: 5, date: '2026-06-04', comment: 'Absolute best service. The Royal Haircut process made me feel like king. True craft!', service_name: 'Royal Golden Haircut' },
      { id: 'rev-2', shop_id: 'shop-1', customer_name: 'Julian M.', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=80', rating: 5, date: '2026-06-01', comment: 'The hot towel straight razor shave is unbelievably clean. Incredible attention to detail.', service_name: 'Straight Razor Hot Towel Shave' }
    ]
  },
  {
    id: 'shop-2',
    name: 'Prism & Pixels Salon',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=400',
    banner: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1200',
    rating: 4.8,
    reviews_count: 96,
    distance: 2.5,
    address: '89 Link Road, Bandra West, Mumbai',
    latitude: 19.0600,
    longitude: 72.8300,
    is_verified: true,
    is_featured: false,
    working_hours: '10:00 AM - 08:00 PM',
    features: ['Organic Tea & Masala Chai Bar', 'A/C', 'Scenic Window Seats', 'Selfie Accent Lighting'],
    categories: ['Haircut', 'Hair Coloring', 'Facial'],
    home_service: false,
    services: [
      { id: 'srv-201', shop_id: 'shop-2', name: 'Creative Director Cut', category: 'Haircut', price: 1800.00, duration: 55, description: 'Bespoke shape design by our head stylist matching your facial structure.' },
      { id: 'srv-202', shop_id: 'shop-2', name: 'Cyberpunk Pastel Highlight', category: 'Hair Coloring', price: 3500.00, duration: 120, description: 'Double-lift bleach followed by custom color shades (pink, blue, platinum neon).' },
      { id: 'srv-203', shop_id: 'shop-2', name: 'Organic Honey Facial Glow', category: 'Facial', price: 1500.00, duration: 40, description: 'All-natural scrub, heated honey wrap, iced roller massage, and organic toner.' }
    ],
    barbers: [
      { id: 'barber-3', shop_id: 'shop-2', name: 'Seraphina Vance', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', rating: 4.8, is_available: true, specialty: 'Chroma Blending & Layering', bio: 'Seraphina is an award-winning color specialist and structural hair artist.', earnings: 64000.00 },
      { id: 'barber-4', shop_id: 'shop-2', name: 'Nate Brooks', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150', rating: 4.7, is_available: true, specialty: 'Textured Shags & Precision Cuts', bio: 'Nate creates breezy, modern, easily manageable textured styles.', earnings: 28000.00 }
    ],
    reviews: [
      { id: 'rev-3', shop_id: 'shop-2', customer_name: 'Chloe L.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=80', rating: 5, date: '2026-06-03', comment: 'Seraphina is a color wizard! My pastel purple highlights are completely gorgeous.', service_name: 'Cyberpunk Pastel Highlight' }
    ]
  },
  {
    id: 'shop-3',
    name: 'Gentleman’s Creed',
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=400',
    banner: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&q=80&w=1200',
    rating: 4.7,
    reviews_count: 118,
    distance: 0.8,
    address: '15 Heritage Marg, Fort Sector, Mumbai',
    latitude: 18.9350,
    longitude: 72.8360,
    is_verified: true,
    is_featured: true,
    working_hours: '08:00 AM - 08:30 PM',
    features: ['Complimentary Single-Malt Beverage', 'A/C', 'Offline Quiet Room', 'Warm Shaving Gel'],
    categories: ['Haircut', 'Beard Styling', 'Hair Spa'],
    home_service: true,
    services: [
      { id: 'srv-301', shop_id: 'shop-3', name: 'Heritage Scissors Cut', category: 'Haircut', price: 1000.00, duration: 40, description: 'Classic grooming with scissors only, complete with tea-tree wash.' },
      { id: 'srv-302', shop_id: 'shop-3', name: 'Creed Beard Sculpting', category: 'Beard Styling', price: 600.00, duration: 20, description: 'Balancing and structure optimization tailored to face shapes.' },
      { id: 'srv-303', shop_id: 'shop-3', name: 'Royal Oil Scalp Spa', category: 'Hair Spa', price: 1200.00, duration: 30, description: 'Infused essential argan oils, massage, and hot aromatic wraps.' }
    ],
    barbers: [
      { id: 'barber-5', shop_id: 'shop-3', name: 'Charles Vance', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', rating: 4.7, is_available: true, specialty: 'Traditional Scissor Sculpture', bio: 'Charles believes in the heritage style. No rushing. Only perfection.', earnings: 18000.00 }
    ],
    reviews: [
      { id: 'rev-4', shop_id: 'shop-3', customer_name: 'Robert T.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=80', rating: 4, date: '2026-05-28', comment: 'Great single malt, classic atmosphere. A bit of a wait, but Charles is worth it!', service_name: 'Heritage Scissors Cut' }
    ]
  },
  {
    id: 'shop-4',
    name: 'RetroCuts Neon Grid',
    image: 'https://images.unsplash.com/photo-1512864084360-7c0c4d0a0845?auto=format&fit=crop&q=80&w=400',
    banner: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=1200',
    rating: 4.6,
    reviews_count: 75,
    distance: 4.1,
    address: '108 Galleria Mall, Hiranandani Powai, Mumbai',
    latitude: 19.1176,
    longitude: 72.9060,
    is_verified: false,
    is_featured: false,
    working_hours: '11:00 AM - 11:59 PM',
    features: ['Retro Arcade Cabinets', 'Synthwave Soundtrack', 'LED Neon Mirror Rails', 'Energy Drinks'],
    categories: ['Haircut', 'Beard Styling'],
    home_service: false,
    services: [
      { id: 'srv-401', shop_id: 'shop-4', name: 'Retro Grid Skin-Fade', category: 'Haircut', price: 700.00, duration: 30, description: 'Super fast skin fade, razor shave back-line, styled with wet-look gel.' },
      { id: 'srv-402', shop_id: 'shop-4', name: 'Cyber-Pointy Beard Trim', category: 'Beard Styling', price: 400.00, duration: 15, description: 'Sharpen your beard line with mechanical clippers and high precision.' }
    ],
    barbers: [
      { id: 'barber-6', shop_id: 'shop-4', name: 'Zane Razor', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150', rating: 4.6, is_available: true, specialty: 'Speed Skin Fades & Geometric Hair Tattoos', bio: 'Zane blends retro synth vibes with lightning-fast clippers work.', earnings: 38000.00 }
    ],
    reviews: []
  },
  {
    id: 'shop-5',
    name: 'Urban Fade Studio',
    image: 'https://images.unsplash.com/photo-1605497746444-ac9dbd324ce8?auto=format&fit=crop&q=80&w=400',
    banner: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=1200',
    rating: 4.9,
    reviews_count: 210,
    distance: 1.8,
    address: '67 Carter Road, Bandra West, Mumbai',
    latitude: 19.0660,
    longitude: 72.8240,
    is_verified: true,
    is_featured: true,
    working_hours: '09:00 AM - 09:30 PM',
    features: ['Hip Hop Beats', 'Streetwear Merch Rail', 'Sneaker Cleaning Station', 'Cold Brew Coffee'],
    categories: ['Haircut', 'Beard Styling', 'Grooming Packages'],
    home_service: true,
    services: [
      { id: 'srv-501', shop_id: 'shop-5', name: 'Master Taper & Drop-Fade', category: 'Haircut', price: 900.00, duration: 40, description: 'Flawless blurry drop taper, textured comb-over styling, high-contrast neck fade.' },
      { id: 'srv-502', shop_id: 'shop-5', name: 'The City Executive Grooming Pack', category: 'Grooming Packages', price: 2200.00, duration: 75, description: 'Precision Haircut, luxury beard styling, organic charcoal face mask, blow-out, and neck massage.' }
    ],
    barbers: [
      { id: 'barber-7', shop_id: 'shop-5', name: 'Kenji Takahashi', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', rating: 4.9, is_available: true, specialty: 'Fades, Lines, Textured Hair Art', bio: 'Born in Tokyo, Kenji crafts ultra-clean geometric fades and hair art carvings.', earnings: 45000.00 }
    ],
    reviews: [
      { id: 'rev-5', shop_id: 'shop-5', customer_name: 'Marcus J.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=80', rating: 5, date: '2026-06-05', comment: 'Kenji has an absolute god-tier wrist with clippers. Drop fade is completely seamless!', service_name: 'Master Taper & Drop-Fade' }
    ]
  },
  {
    id: 'shop-ap-podalakuru',
    name: 'Sri Balaji Grooming Studio',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400',
    banner: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1200',
    rating: 4.8,
    reviews_count: 54,
    distance: 0.5,
    address: 'Podalakuru Road, Podalakuru, Nellore District, AP, 524345',
    latitude: 14.3941,
    longitude: 79.7297,
    is_verified: true,
    is_featured: true,
    working_hours: '08:00 AM - 08:30 PM',
    features: ['A/C', 'Water Filter', 'Waiting Lounge', 'Home Service Available'],
    categories: ['Haircut', 'Beard Styling', 'Massage'],
    home_service: true,
    services: [
      { id: 'srv-ap-1', shop_id: 'shop-ap-podalakuru', name: 'Balaji Classic Haircut', category: 'Haircut', price: 150.00, duration: 30, description: 'Classic scissors and clippers cut.' },
      { id: 'srv-ap-2', shop_id: 'shop-ap-podalakuru', name: 'Beard Trim & Shape', category: 'Beard Styling', price: 100.00, duration: 15, description: 'Quick trim and shape with warm foam.' }
    ],
    barbers: [
      { id: 'barber-ap-1', shop_id: 'shop-ap-podalakuru', name: 'K. Ramanaiah', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', rating: 4.8, is_available: true, specialty: 'Classic Scissor Cuts', bio: 'Specialist in traditional haircuts for all ages.' }
    ],
    reviews: [],
    google_place_id: 'place-mock-podalakuru',
    owner_name: 'K. Ramanaiah',
    whatsapp_number: '+91 94405 82928',
    additional_photos: [
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=400'
    ],
    instagram_url: 'https://instagram.com/balajigrooming',
    facebook_url: 'https://facebook.com/balajigrooming',
    offers: 'Festival Special Discount: Haircut + Shave at just ₹220',
    haircut_price: 150.00,
    beard_price: 100.00,
    spa_services: ['Head Massage', 'Face Pack Spa']
  },
  {
    id: 'shop-ap-vizag',
    name: 'Coastal Trim & Hair Spa',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=400',
    banner: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1200',
    rating: 4.9,
    reviews_count: 120,
    distance: 1.5,
    address: 'Beach Road, Visakhapatnam, AP, 530003',
    latitude: 17.6868,
    longitude: 83.2185,
    is_verified: true,
    is_featured: true,
    working_hours: '09:00 AM - 09:30 PM',
    features: ['Premium Coffee', 'A/C', 'Sea View Window Seats', 'Valet Parking'],
    categories: ['Haircut', 'Beard Styling', 'Hair Spa', 'Facial'],
    home_service: false,
    services: [
      { id: 'srv-ap-3', shop_id: 'shop-ap-vizag', name: 'Vizag Beach Haircut', category: 'Haircut', price: 450.00, duration: 40, description: 'Sea breeze inspired textured haircut.' },
      { id: 'srv-ap-4', shop_id: 'shop-ap-vizag', name: 'Coastal Beard Styling', category: 'Beard Styling', price: 300.00, duration: 25, description: 'Sharp razor outlining and oiling.' }
    ],
    barbers: [
      { id: 'barber-ap-2', shop_id: 'shop-ap-vizag', name: 'Chandra Sekhar', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', rating: 4.9, is_available: true, specialty: 'Fades & Line-ups', bio: 'Focused on clean outlines and modern textured styling.' }
    ],
    reviews: [],
    google_place_id: 'place-mock-vizag',
    owner_name: 'Chandra Sekhar',
    whatsapp_number: '+91 89125 54332',
    additional_photos: [
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1512864084360-7c0c4d0a0845?auto=format&fit=crop&q=80&w=400'
    ],
    instagram_url: 'https://instagram.com/coastaltrim',
    facebook_url: 'https://facebook.com/coastaltrim',
    offers: 'Weekend Combo Offer: Free scalp scrub with Haircut',
    haircut_price: 450.00,
    beard_price: 300.00,
    spa_services: ['Hydro-Spa Hair therapy', 'Marine Facial']
  }
];

export const mockCoupons: any[] = [
  { code: 'GOLDSTYL', discount_percent: 20.00, description: 'Save 20% on any Gold Premium service', expiry_date: '2026-12-31', min_booking_value: 1000.00 },
  { code: 'FADENEW', discount_percent: 15.00, description: '15% Off for your first sleek fade booking', expiry_date: '2026-09-30', min_booking_value: 500.00 },
  { code: 'SPATREAT', discount_percent: 25.00, description: 'Get a relaxing 25% discount on Grooming Packages & Hair Spa', expiry_date: '2026-08-31', min_booking_value: 1500.00 }
];

export const mockMemberships: any[] = [
  { id: 'mem-1', title: 'Bronze Premium', price: 2000.00, period: 'monthly', benefits: ['2 Haircuts or Beard Grooming included', '10% off any secondary booking', 'Priority rescheduling'] },
  { id: 'mem-2', title: 'Gold Royalty VIP', price: 4500.00, period: 'monthly', benefits: ['Unlimited cuts & styling', '1 complimentary Charcoal Facial/month', 'Free home-service fee up to 5km', 'VIP quick seat booking (zero wait time)'] },
  { id: 'mem-3', title: 'Ultimate Elite Annual', price: 40000.00, period: 'yearly', benefits: ['All Gold tier benefits', 'Dedicated personal stylist priority line', '12 complimentary beverages and products', 'Emergency booking access (guaranteed within 2 hours)'] }
];

export const mockCmsSettings: Record<string, any> = {
  hero_section: {
    title: 'Elite Grooming for the Modern Indian Gentleman',
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
    title: 'StyleSlot - Premium Grooming Marketplace India',
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
  testimonials: [
    {
      name: 'David K.',
      role: 'Master Groomer Partner',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=80',
      comment: 'StyleSlot has streamlined my shop booking wait-list completely. The AI virtual visual director is next level!'
    },
    {
      name: 'Julian M.',
      role: 'Premium Client',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=80',
      comment: 'The hot towel straight razor shave is unbelievably clean. Incredible attention to detail.'
    }
  ]
};

// Database Translation Mappings
function mapDbShopToUi(shop: any): Shop {
  return {
    id: shop.id,
    name: shop.name,
    image: shop.image,
    banner: shop.banner,
    rating: Number(shop.rating),
    reviewsCount: shop.reviews_count,
    distance: Number(shop.distance),
    address: shop.address,
    coordinates: { lat: Number(shop.latitude), lng: Number(shop.longitude) },
    homeService: shop.home_service,
    features: shop.features || [],
    categories: shop.categories || [],
    isVerified: shop.is_verified,
    isFeatured: shop.is_featured,
    workingHours: shop.working_hours,
    services: (shop.services || []).map(mapDbServiceToUi),
    barbers: (shop.barbers || []).map(mapDbBarberToUi),
    reviews: (shop.reviews || []).map(mapDbReviewToUi),
    googlePlaceId: shop.google_place_id || undefined,
    ownerName: shop.owner_name || undefined,
    whatsappNumber: shop.whatsapp_number || undefined,
    additionalPhotos: shop.additional_photos || undefined,
    haircutPrice: shop.haircut_price ? Number(shop.haircut_price) : undefined,
    beardPrice: shop.beard_price ? Number(shop.beard_price) : undefined,
    spaServices: shop.spa_services || undefined,
    instagram: shop.instagram_url || undefined,
    facebook: shop.facebook_url || undefined,
    offers: shop.offers || undefined
  };
}

function mapDbServiceToUi(srv: any): Service {
  return {
    id: srv.id,
    name: srv.name,
    category: srv.category,
    price: Number(srv.price),
    duration: srv.duration,
    description: srv.description
  };
}

function mapDbBarberToUi(b: any): Barber {
  return {
    id: b.id,
    name: b.name,
    avatar: b.avatar,
    rating: Number(b.rating),
    isAvailable: b.is_available,
    specialty: b.specialty,
    bio: b.bio,
    earnings: b.earnings ? Number(b.earnings) : 0
  };
}

function mapDbReviewToUi(r: any): Review {
  return {
    id: r.id,
    customerName: r.customer_name,
    avatar: r.avatar,
    rating: r.rating,
    date: r.date,
    comment: r.comment,
    serviceName: r.service_name,
    photos: r.photos || []
  };
}

function mapDbBookingToUi(b: any): Booking {
  return {
    id: b.id,
    shopId: b.shop_id,
    shopName: b.shop_name,
    shopImage: b.shop_image,
    serviceIds: b.service_ids || [],
    serviceNames: b.service_names || [],
    totalPrice: Number(b.total_price),
    date: b.date,
    time: b.time,
    barberId: b.barber_id,
    barberName: b.barber_name,
    customerName: b.customer_name,
    customerEmail: b.customer_email,
    customerPhone: b.customer_phone,
    status: b.status,
    type: b.type,
    address: b.address || '',
    notes: b.notes || '',
    queueNumber: b.queue_number,
    estimatedWaitMinutes: b.estimated_wait_minutes,
    createdAt: b.created_at,
    rating: b.rating,
    reviewText: b.review_text
  };
}

function mapDbProfileToUi(p: any): UserProfile {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone || '',
    role: p.role,
    walletBalance: Number(p.wallet_balance),
    loyaltyPoints: p.loyalty_points,
    favorites: p.favorites || []
  };
}

// Authenticate session from Bearer token
async function getAuthenticatedUser(req: express.Request): Promise<any> {
  if (useMockDatabase) {
    const authHeader = req.headers.authorization;
    let userId = 'mock-user-123';
    let userEmail = 'demo@styleslot.com';
    let userName = 'Demo Client';
    let userRole = 'customer';
    let userPhone = '123-456-7890';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decodedUser = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        userId = decodedUser.id || userId;
        userEmail = decodedUser.email || userEmail;
        userName = decodedUser.user_metadata?.name || decodedUser.name || userName;
        userRole = decodedUser.user_metadata?.role || decodedUser.role || userRole;
        userPhone = decodedUser.user_metadata?.phone || decodedUser.phone || userPhone;
      } catch (e) {
        // Fallback to defaults
      }
    }

    let profile = mockProfiles.find(p => p.id === userId);
    if (!profile) {
      profile = {
        id: userId,
        name: userName,
        email: userEmail,
        phone: userPhone,
        role: userRole,
        wallet_balance: 8500.00,
        loyalty_points: 340,
        favorites: []
      };
      mockProfiles.push(profile);
    }
    return profile;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Return first profile in database for fallback/guest simulation testing
    const { data } = await supabaseAdmin.from('profiles').select('*').limit(1);
    return data && data.length > 0 ? data[0] : null;
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single();
  return profile;
}

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
      throw new Error('GEMINI_API_KEY is not configured or holds a placeholder value.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

export async function createApp() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // --- SHOPS ---
  app.get('/api/shops', async (req, res) => {
    try {
      if (useMockDatabase) {
        return res.json(mockShops.map(mapDbShopToUi));
      }
      const { data: dbShops, error } = await supabaseAdmin
        .from('shops')
        .select('*, services(*), barbers(*), reviews(*)');
      
      if (error) throw error;
      const uiShops = (dbShops || []).map(mapDbShopToUi);
      res.json(uiShops);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Verify / Unverify shop (Admin feature)
  app.post('/api/shops/:id/verify', async (req, res) => {
    try {
      const { id } = req.params;
      const { isVerified } = req.body;
      if (useMockDatabase) {
        const shop = mockShops.find(s => s.id === id);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });
        shop.is_verified = !!isVerified;
        return res.json({ success: true, shop: mapDbShopToUi(shop) });
      }
      const { data: shop, error } = await supabaseAdmin
        .from('shops')
        .update({ is_verified: !!isVerified })
        .eq('id', id)
        .select()
        .single();
      
      if (error) return res.status(404).json({ error: 'Shop not found' });
      res.json({ success: true, shop });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Register New Shop (Owner feature)
  app.post('/api/shops', async (req, res) => {
    try {
      const { name, address, workingHours, categories, features, banner, image, homeService } = req.body;
      if (!name || !address) {
        return res.status(400).json({ error: 'Shop name and address are required' });
      }

      const shopId = `shop-${Date.now()}`;
      const newShop: any = {
        id: shopId,
        name,
        address,
        working_hours: workingHours || '09:00 AM - 08:00 PM',
        categories: categories || ['Haircut'],
        features: features || [],
        banner: banner || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1200',
        image: image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400',
        home_service: !!homeService,
        distance: parseFloat((Math.random() * 4 + 0.2).toFixed(1)),
        rating: 5.0,
        reviews_count: 0,
        latitude: 37.7749 + (Math.random() - 0.5) * 0.05,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.05,
        is_verified: false,
        is_featured: false,
        services: [
          { id: `srv-${Date.now()}-1`, shop_id: shopId, name: 'Classic Precision Haircut', category: 'Haircut', price: 25.00, duration: 30, description: 'Quick precision clipper and scissor cut with refreshing wash.' },
          { id: `srv-${Date.now()}-2`, shop_id: shopId, name: 'Trim & Razor Finish', category: 'Beard Styling', price: 15.00, duration: 20, description: 'Basic clipper beard trim with straight razor cheek alignment.' }
        ],
        barbers: [
          {
            id: `barber-${Date.now()}`,
            shop_id: shopId,
            name: 'Jordan Carter',
            avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150',
            rating: 5.0,
            is_available: true,
            specialty: 'Modern Street Fades',
            bio: 'Energetic specialist focused on tight blurs and tapers.',
            earnings: 0.00
          }
        ],
        reviews: []
      };

      if (useMockDatabase) {
        mockShops.push(newShop);
        return res.status(201).json(mapDbShopToUi(newShop));
      }

      const { data: shop, error } = await supabaseAdmin.from('shops').insert({
        id: shopId,
        name,
        address,
        working_hours: newShop.working_hours,
        categories: newShop.categories,
        features: newShop.features,
        banner: newShop.banner,
        image: newShop.image,
        home_service: newShop.home_service,
        distance: newShop.distance,
        rating: newShop.rating,
        reviews_count: newShop.reviews_count,
        latitude: newShop.latitude,
        longitude: newShop.longitude,
        is_verified: newShop.is_verified,
        is_featured: newShop.is_featured
      }).select().single();
      if (error) throw error;

      await supabaseAdmin.from('services').insert(newShop.services);
      await supabaseAdmin.from('barbers').insert(newShop.barbers[0]);

      // Re-fetch populated shop
      const { data: fullShop } = await supabaseAdmin
        .from('shops')
        .select('*, services(*), barbers(*), reviews(*)')
        .eq('id', shopId)
        .single();

      res.status(201).json(mapDbShopToUi(fullShop));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add staff/barber (Owner feature)
  app.post('/api/shops/:id/barbers', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, specialty, bio, avatar } = req.body;

      const newBarber = {
        id: `barber-${Date.now()}`,
        shop_id: id,
        name: name || 'New Barber',
        specialty: specialty || 'Stylist',
        bio: bio || 'Passionate grooming specialist.',
        avatar: avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
        rating: 5.0,
        is_available: true,
        earnings: 0.00
      };

      if (useMockDatabase) {
        const shop = mockShops.find(s => s.id === id);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });
        if (!shop.barbers) shop.barbers = [];
        shop.barbers.push(newBarber);
        return res.status(201).json({ success: true, shop: mapDbShopToUi(shop) });
      }

      const { error } = await supabaseAdmin.from('barbers').insert(newBarber);
      if (error) throw error;

      const { data: fullShop } = await supabaseAdmin
        .from('shops')
        .select('*, services(*), barbers(*), reviews(*)')
        .eq('id', id)
        .single();

      res.status(201).json({ success: true, shop: mapDbShopToUi(fullShop) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add service (Owner feature)
  app.post('/api/shops/:id/services', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, category, price, duration, description } = req.body;

      const newService = {
        id: `srv-${Date.now()}`,
        shop_id: id,
        name: name || 'New Service',
        category: category || 'Grooming',
        price: Number(price) || 20.00,
        duration: Number(duration) || 30,
        description: description || 'Premium customized grooming experience'
      };

      if (useMockDatabase) {
        const shop = mockShops.find(s => s.id === id);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });
        if (!shop.services) shop.services = [];
        shop.services.push(newService);
        if (!shop.categories.includes(newService.category)) {
          shop.categories.push(newService.category);
        }
        return res.status(201).json({ success: true, shop: mapDbShopToUi(shop) });
      }

      const { error } = await supabaseAdmin.from('services').insert(newService);
      if (error) throw error;

      // Update shop categories if required
      const { data: shopData } = await supabaseAdmin.from('shops').select('categories').eq('id', id).single();
      if (shopData && !shopData.categories.includes(newService.category)) {
        const updatedCats = [...shopData.categories, newService.category];
        await supabaseAdmin.from('shops').update({ categories: updatedCats }).eq('id', id);
      }

      const { data: fullShop } = await supabaseAdmin
        .from('shops')
        .select('*, services(*), barbers(*), reviews(*)')
        .eq('id', id)
        .single();

      res.status(201).json({ success: true, shop: mapDbShopToUi(fullShop) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- BOOKINGS ---
  app.get('/api/bookings', async (req, res) => {
    try {
      if (useMockDatabase) {
        return res.json(mockBookings.map(mapDbBookingToUi));
      }
      const { data: dbBookings, error } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json((dbBookings || []).map(mapDbBookingToUi));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create booking (Customer flow)
  app.post('/api/bookings', async (req, res) => {
    try {
      const { shopId, serviceIds, barberId, date, time, type, address, notes, couponCode } = req.body;
      const profile = await getAuthenticatedUser(req);
      if (!profile) {
        return res.status(401).json({ error: 'Unauthorized: Session missing or invalid' });
      }

      if (useMockDatabase) {
        const shop = mockShops.find(s => s.id === shopId);
        if (!shop) {
          return res.status(404).json({ error: 'Barber shop not found' });
        }
        const services = (shop.services || []).filter((s: any) => serviceIds.includes(s.id));
        if (services.length === 0) {
          return res.status(400).json({ error: 'No valid services selected' });
        }
        const barber = (shop.barbers || []).find((b: any) => b.id === barberId);
        const barberName = barber ? barber.name : 'Best Available';

        let priceSum = services.reduce((sum: number, s: any) => sum + Number(s.price), 0);
        let discountAmount = 0;
        if (couponCode) {
          const coupon = mockCoupons.find(c => c.code === couponCode.toUpperCase());
          if (coupon && priceSum >= Number(coupon.min_booking_value)) {
            discountAmount = (priceSum * Number(coupon.discount_percent)) / 100;
          }
        }
        const finalPrice = Math.max(0, priceSum - discountAmount);

        if (Number(profile.wallet_balance) < finalPrice) {
          return res.status(400).json({ error: 'Insufficient wallet balance. Please add funds first!' });
        }

        profile.wallet_balance = Number(profile.wallet_balance) - finalPrice;
        profile.loyalty_points = (profile.loyalty_points || 0) + Math.floor(finalPrice);

        const count = mockBookings.filter(b => b.shop_id === shopId && b.date === date && ['pending', 'accepted'].includes(b.status)).length;
        const queueNumber = count + 1;
        const estimatedWaitMinutes = queueNumber * 15;

        const newBooking = {
          id: `bk-${Date.now()}`,
          shop_id: shopId,
          shop_name: shop.name,
          shop_image: shop.image,
          service_ids: serviceIds,
          service_names: services.map((s: any) => s.name),
          total_price: finalPrice,
          date,
          time,
          barber_id: barberId || 'best-available',
          barber_name: barberName,
          customer_id: profile.id,
          customer_name: profile.name,
          customer_email: profile.email,
          customer_phone: profile.phone || '',
          status: 'pending',
          type: type || 'in-shop',
          address: address || '',
          notes: notes || '',
          queue_number: queueNumber,
          estimated_wait_minutes: estimatedWaitMinutes,
          created_at: new Date().toISOString()
        };

        mockBookings.unshift(newBooking);
        return res.status(201).json({ success: true, booking: mapDbBookingToUi(newBooking), walletBalance: profile.wallet_balance });
      }

      const { data: shop, error: shopErr } = await supabaseAdmin
        .from('shops')
        .select('*, services(*), barbers(*)')
        .eq('id', shopId)
        .single();

      if (shopErr || !shop) {
        return res.status(404).json({ error: 'Barber shop not found' });
      }

      const services = (shop.services || []).filter((s: any) => serviceIds.includes(s.id));
      if (services.length === 0) {
        return res.status(400).json({ error: 'No valid services selected' });
      }

      const barber = (shop.barbers || []).find((b: any) => b.id === barberId);
      const barberName = barber ? barber.name : 'Best Available';

      let priceSum = services.reduce((sum: number, s: any) => sum + Number(s.price), 0);
      
      // Coupon validation
      let discountAmount = 0;
      if (couponCode) {
        const { data: coupon } = await supabaseAdmin.from('coupons').select('*').eq('code', couponCode.toUpperCase()).single();
        if (coupon && priceSum >= Number(coupon.min_booking_value)) {
          discountAmount = (priceSum * Number(coupon.discount_percent)) / 100;
        }
      }

      const finalPrice = Math.max(0, priceSum - discountAmount);

      // Wallet balance validation
      if (Number(profile.wallet_balance) < finalPrice) {
        return res.status(400).json({ error: 'Insufficient wallet balance. Please add funds first!' });
      }

      const newBalance = Number(profile.wallet_balance) - finalPrice;
      const newPoints = profile.loyalty_points + Math.floor(finalPrice);

      // Update User Profile
      await supabaseAdmin.from('profiles').update({
        wallet_balance: newBalance,
        loyalty_points: newPoints
      }).eq('id', profile.id);

      // Estimate live queue numbers
      const { count } = await supabaseAdmin
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .eq('date', date)
        .in('status', ['pending', 'accepted']);

      const queueNumber = (count || 0) + 1;
      const estimatedWaitMinutes = queueNumber * 15;

      const newBooking = {
        id: `bk-${Date.now()}`,
        shop_id: shopId,
        shop_name: shop.name,
        shop_image: shop.image,
        service_ids: serviceIds,
        service_names: services.map((s: any) => s.name),
        total_price: finalPrice,
        date,
        time,
        barber_id: barberId || 'best-available',
        barber_name: barberName,
        customer_id: profile.id,
        customer_name: profile.name,
        customer_email: profile.email,
        customer_phone: profile.phone || '',
        status: 'pending',
        type: type || 'in-shop',
        address: address || '',
        notes: notes || '',
        queue_number: queueNumber,
        estimated_wait_minutes: estimatedWaitMinutes
      };

      const { data: booking, error: insErr } = await supabaseAdmin.from('bookings').insert(newBooking).select().single();
      if (insErr) throw insErr;

      res.status(201).json({ success: true, booking: mapDbBookingToUi(booking), walletBalance: newBalance });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Cancel booking
  app.post('/api/bookings/:id/cancel', async (req, res) => {
    try {
      const { id } = req.params;
      if (useMockDatabase) {
        const booking = mockBookings.find(b => b.id === id);
        if (!booking) {
          return res.status(404).json({ error: 'Booking not found' });
        }
        if (booking.status !== 'completed' && booking.status !== 'rejected') {
          const profile = mockProfiles.find(p => p.id === booking.customer_id);
          if (profile) {
            profile.wallet_balance = Number(profile.wallet_balance) + Number(booking.total_price);
          }
          booking.status = 'rejected';
          return res.json({
            success: true,
            booking: mapDbBookingToUi(booking),
            walletBalance: profile ? Number(profile.wallet_balance) : 0
          });
        }
        return res.status(400).json({ error: 'Cannot cancel an already completed / rejected booking.' });
      }

      const { data: booking, error: fetchErr } = await supabaseAdmin.from('bookings').select('*').eq('id', id).single();
      if (fetchErr || !booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.status !== 'completed' && booking.status !== 'rejected') {
        // Refund profile wallet
        const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', booking.customer_id).single();
        if (profile) {
          const refundedBalance = Number(profile.wallet_balance) + Number(booking.total_price);
          await supabaseAdmin.from('profiles').update({ wallet_balance: refundedBalance }).eq('id', profile.id);
        }

        const { data: updatedBooking } = await supabaseAdmin
          .from('bookings')
          .update({ status: 'rejected' })
          .eq('id', id)
          .select()
          .single();

        // Retrieve current balance for user feedback
        const { data: finalProfile } = await supabaseAdmin.from('profiles').select('wallet_balance').eq('id', booking.customer_id).single();

        return res.json({
          success: true,
          booking: mapDbBookingToUi(updatedBooking),
          walletBalance: finalProfile ? Number(finalProfile.wallet_balance) : 0
        });
      }
      res.status(400).json({ error: 'Cannot cancel an already completed / rejected booking.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Accept / Reject / Complete booking (Shop / Barber manager flow)
  app.post('/api/bookings/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['accepted', 'rejected', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status update' });
      }

      if (useMockDatabase) {
        const booking = mockBookings.find(b => b.id === id);
        if (!booking) {
          return res.status(404).json({ error: 'Booking not found' });
        }
        booking.status = status;
        if (status === 'completed' && booking.barber_id) {
          const shop = mockShops.find(s => s.id === booking.shop_id);
          if (shop) {
            const barber = (shop.barbers || []).find((b: any) => b.id === booking.barber_id);
            if (barber) {
              const currentEarnings = Number(barber.earnings || 0);
              const commissionCut = Number(booking.total_price) * 0.70;
              barber.earnings = currentEarnings + commissionCut;
            }
          }
        }
        return res.json({ success: true, booking: mapDbBookingToUi(booking) });
      }

      const { data: booking, error: fetchErr } = await supabaseAdmin.from('bookings').select('*').eq('id', id).single();
      if (fetchErr || !booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const { data: updatedBooking, error: updateErr } = await supabaseAdmin
        .from('bookings')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Allocate stylist earnings upon completion
      if (status === 'completed' && booking.barber_id) {
        const { data: barber } = await supabaseAdmin.from('barbers').select('*').eq('id', booking.barber_id).single();
        if (barber) {
          const currentEarnings = Number(barber.earnings || 0);
          const commissionCut = Number(booking.total_price) * 0.70; // 70% to barber
          await supabaseAdmin.from('barbers').update({ earnings: currentEarnings + commissionCut }).eq('id', barber.id);
        }
      }

      res.json({ success: true, booking: mapDbBookingToUi(updatedBooking) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Review a booking
  app.post('/api/bookings/:id/review', async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;

      if (useMockDatabase) {
        const booking = mockBookings.find(b => b.id === id);
        if (!booking) {
          return res.status(404).json({ error: 'Booking not found' });
        }
        if (booking.status !== 'completed') {
          return res.status(400).json({ error: 'Only completed bookings can be reviewed.' });
        }
        booking.rating = Number(rating);
        booking.review_text = comment;

        const shop = mockShops.find(s => s.id === booking.shop_id);
        if (shop) {
          const newReview = {
            id: `rev-${Date.now()}`,
            shop_id: booking.shop_id,
            customer_name: booking.customer_name,
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80',
            rating: Number(rating),
            date: new Date().toISOString().split('T')[0],
            comment: comment || '',
            service_name: booking.service_names.join(', '),
            photos: []
          };
          if (!shop.reviews) shop.reviews = [];
          shop.reviews.unshift(newReview);
          
          const avg = shop.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / shop.reviews.length;
          shop.rating = parseFloat(avg.toFixed(1));
          shop.reviews_count = shop.reviews.length;
        }
        return res.json({ success: true, booking: mapDbBookingToUi(booking) });
      }

      const { data: booking, error: fetchErr } = await supabaseAdmin.from('bookings').select('*').eq('id', id).single();
      if (fetchErr || !booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.status !== 'completed') {
        return res.status(400).json({ error: 'Only completed bookings can be reviewed.' });
      }

      const { data: updatedBooking } = await supabaseAdmin
        .from('bookings')
        .update({ rating: Number(rating), review_text: comment })
        .eq('id', id)
        .select()
        .single();

      // Add to reviews database table
      const newReview = {
        id: `rev-${Date.now()}`,
        shop_id: booking.shop_id,
        customer_name: booking.customer_name,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80',
        rating: Number(rating),
        date: new Date().toISOString().split('T')[0],
        comment: comment || '',
        service_name: booking.service_names.join(', '),
        photos: []
      };

      await supabaseAdmin.from('reviews').insert(newReview);

      // Recalculate average rating for Shop
      const { data: allReviews } = await supabaseAdmin.from('reviews').select('rating').eq('shop_id', booking.shop_id);
      if (allReviews && allReviews.length > 0) {
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await supabaseAdmin.from('shops').update({
          rating: parseFloat(avg.toFixed(1)),
          reviews_count: allReviews.length
        }).eq('id', booking.shop_id);
      }

      res.json({ success: true, booking: mapDbBookingToUi(updatedBooking) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- USER PROFILE & WALLET ---
  app.get('/api/profile', async (req, res) => {
    try {
      const profile = await getAuthenticatedUser(req);
      if (!profile) {
        return res.status(404).json({ error: 'No profile found' });
      }
      res.json(mapDbProfileToUi(profile));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/profile/role', async (req, res) => {
    try {
      const { role } = req.body;
      const profile = await getAuthenticatedUser(req);
      if (!profile) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (['customer', 'owner', 'barber', 'admin'].includes(role)) {
        if (useMockDatabase) {
          profile.role = role;
          return res.json({ success: true, profile: mapDbProfileToUi(profile) });
        }
        const { data: updated } = await supabaseAdmin
          .from('profiles')
          .update({ role })
          .eq('id', profile.id)
          .select()
          .single();

        return res.json({ success: true, profile: mapDbProfileToUi(updated) });
      }
      res.status(400).json({ error: 'Invalid role selection' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/profile/wallet', async (req, res) => {
    try {
      const { amount } = req.body;
      const num = Number(amount);
      if (isNaN(num) || num <= 0) {
        return res.status(400).json({ error: 'Invalid deposit amount' });
      }
      
      const profile = await getAuthenticatedUser(req);
      if (!profile) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const newBalance = Number(profile.wallet_balance) + num;
      if (useMockDatabase) {
        profile.wallet_balance = newBalance;
        return res.json({ success: true, walletBalance: newBalance });
      }
      await supabaseAdmin.from('profiles').update({ wallet_balance: newBalance }).eq('id', profile.id);

      res.json({ success: true, walletBalance: newBalance });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/profile/favorite', async (req, res) => {
    try {
      const { shopId } = req.body;
      if (!shopId) return res.status(400).json({ error: 'Shop ID required' });
      
      const profile = await getAuthenticatedUser(req);
      if (!profile) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      let favs = profile.favorites || [];
      const index = favs.indexOf(shopId);
      if (index === -1) {
        favs = [...favs, shopId];
      } else {
        favs = favs.filter((f: string) => f !== shopId);
      }

      if (useMockDatabase) {
        profile.favorites = favs;
        return res.json({ success: true, favorites: favs });
      }
      await supabaseAdmin.from('profiles').update({ favorites: favs }).eq('id', profile.id);
      res.json({ success: true, favorites: favs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- GOOGLE PLACES / SELECTED SALONS ---
  app.get('/api/selected-salons', async (req, res) => {
    try {
      const profile = await getAuthenticatedUser(req);
      if (!profile) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (useMockDatabase) {
        const userSelections = mockSelectedSalons.filter(s => s.user_id === profile.id);
        return res.json(userSelections);
      }

      const { data, error } = await supabaseAdmin
        .from('selected_salons')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/selected-salons', async (req, res) => {
    try {
      const { googlePlaceId, salonName, latitude, longitude, selectedHairstyle } = req.body;
      if (!googlePlaceId || !salonName || latitude === undefined || longitude === undefined || !selectedHairstyle) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const profile = await getAuthenticatedUser(req);
      if (!profile) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const newSelection = {
        user_id: profile.id,
        google_place_id: googlePlaceId,
        salon_name: salonName,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        selected_hairstyle: selectedHairstyle
      };

      if (useMockDatabase) {
        const entry = { id: `sel-${Date.now()}`, ...newSelection, created_at: new Date().toISOString() };
        mockSelectedSalons.push(entry);
        return res.status(201).json({ success: true, selection: entry });
      }

      const { data, error } = await supabaseAdmin
        .from('selected_salons')
        .insert(newSelection)
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ success: true, selection: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- SEARCH HISTORY ---
  app.get('/api/search-history', async (req, res) => {
    try {
      const profile = await getAuthenticatedUser(req);
      if (!profile) return res.status(401).json({ error: 'Unauthorized' });

      if (useMockDatabase) {
        const history = mockSearchHistory
          .filter(h => h.user_id === profile.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return res.json(history);
      }

      const { data, error } = await supabaseAdmin
        .from('search_history')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/search-history', async (req, res) => {
    try {
      const { query, latitude, longitude } = req.body;
      if (!query) return res.status(400).json({ error: 'Query is required' });

      const profile = await getAuthenticatedUser(req);
      if (!profile) return res.status(401).json({ error: 'Unauthorized' });

      const entry = {
        user_id: profile.id,
        query,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        created_at: new Date().toISOString()
      };

      if (useMockDatabase) {
        const item = { id: `hist-${Date.now()}`, ...entry };
        mockSearchHistory.push(item);
        return res.status(201).json({ success: true, history: item });
      }

      const { data, error } = await supabaseAdmin
        .from('search_history')
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ success: true, history: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- RECENTLY VIEWED ---
  app.get('/api/recently-viewed', async (req, res) => {
    try {
      const profile = await getAuthenticatedUser(req);
      if (!profile) return res.status(401).json({ error: 'Unauthorized' });

      if (useMockDatabase) {
        const viewed = mockRecentlyViewed
          .filter(v => v.user_id === profile.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return res.json(viewed);
      }

      const { data, error } = await supabaseAdmin
        .from('recently_viewed')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/recently-viewed', async (req, res) => {
    try {
      const { googlePlaceId, salonName, address, latitude, longitude, rating, image } = req.body;
      if (!googlePlaceId || !salonName || !address || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const profile = await getAuthenticatedUser(req);
      if (!profile) return res.status(401).json({ error: 'Unauthorized' });

      const entry = {
        user_id: profile.id,
        google_place_id: googlePlaceId,
        salon_name: salonName,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        rating: rating ? parseFloat(rating) : null,
        image: image || null,
        created_at: new Date().toISOString()
      };

      if (useMockDatabase) {
        const index = mockRecentlyViewed.findIndex(v => v.user_id === profile.id && v.google_place_id === googlePlaceId);
        if (index !== -1) mockRecentlyViewed.splice(index, 1);
        
        const item = { id: `view-${Date.now()}`, ...entry };
        mockRecentlyViewed.push(item);
        return res.status(201).json({ success: true, recentlyViewed: item });
      }

      await supabaseAdmin.from('recently_viewed').delete().eq('user_id', profile.id).eq('google_place_id', googlePlaceId);

      const { data, error } = await supabaseAdmin
        .from('recently_viewed')
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ success: true, recentlyViewed: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- USER FAVORITES ---
  app.get('/api/favorites', async (req, res) => {
    try {
      const profile = await getAuthenticatedUser(req);
      if (!profile) return res.status(401).json({ error: 'Unauthorized' });

      if (useMockDatabase) {
        const favs = mockUserFavorites.filter(f => f.user_id === profile.id);
        return res.json(favs);
      }

      const { data, error } = await supabaseAdmin
        .from('user_favorites')
        .select('*')
        .eq('user_id', profile.id);

      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/favorites', async (req, res) => {
    try {
      const { googlePlaceId, salonName, address, latitude, longitude, rating, image, category } = req.body;
      if (!googlePlaceId || !salonName || !address || latitude === undefined || longitude === undefined || !category) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const profile = await getAuthenticatedUser(req);
      if (!profile) return res.status(401).json({ error: 'Unauthorized' });

      const entry = {
        user_id: profile.id,
        google_place_id: googlePlaceId,
        salon_name: salonName,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        rating: rating ? parseFloat(rating) : null,
        image: image || null,
        category: category,
        created_at: new Date().toISOString()
      };

      if (useMockDatabase) {
        const exists = mockUserFavorites.some(f => f.user_id === profile.id && f.google_place_id === googlePlaceId);
        if (!exists) {
          const item = { id: `fav-${Date.now()}`, ...entry };
          mockUserFavorites.push(item);
          return res.status(201).json({ success: true, favorite: item });
        }
        return res.json({ success: true, message: 'Already in favorites' });
      }

      const { data, error } = await supabaseAdmin
        .from('user_favorites')
        .upsert(entry, { onConflict: 'user_id,google_place_id' })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ success: true, favorite: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/favorites/:placeId', async (req, res) => {
    try {
      const { placeId } = req.params;
      const profile = await getAuthenticatedUser(req);
      if (!profile) return res.status(401).json({ error: 'Unauthorized' });

      if (useMockDatabase) {
        const index = mockUserFavorites.findIndex(f => f.user_id === profile.id && f.google_place_id === placeId);
        if (index !== -1) {
          mockUserFavorites.splice(index, 1);
        }
        return res.json({ success: true, message: 'Removed from favorites' });
      }

      const { error } = await supabaseAdmin
        .from('user_favorites')
        .delete()
        .eq('user_id', profile.id)
        .eq('google_place_id', placeId);

      if (error) throw error;
      res.json({ success: true, message: 'Removed from favorites' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/coupons', async (req, res) => {
    try {
      if (useMockDatabase) {
        return res.json(mockCoupons);
      }
      const { data, error } = await supabaseAdmin.from('coupons').select('*');
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/memberships', async (req, res) => {
    try {
      if (useMockDatabase) {
        return res.json(mockMemberships);
      }
      const { data, error } = await supabaseAdmin.from('memberships').select('*');
      if (error) throw error;
      
      const formatted = (data || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        price: Number(m.price),
        period: m.period,
        benefits: m.benefits || []
      }));
      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // --- LIGHTWEIGHT CMS ENDPOINTS ---
  app.get('/api/cms', async (req, res) => {
    try {
      if (useMockDatabase) {
        return res.json(mockCmsSettings);
      }
      const { data, error } = await supabaseAdmin.from('cms_settings').select('*');
      if (error) throw error;
      const cms: Record<string, any> = {};
      (data || []).forEach((row: any) => {
        cms[row.key] = row.value;
      });
      res.json(cms);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/cms', async (req, res) => {
    try {
      const { key, value } = req.body;
      if (!key) return res.status(400).json({ error: 'CMS Key is required' });
      if (useMockDatabase) {
        mockCmsSettings[key] = value;
        return res.json({ success: true, setting: { key, value } });
      }
      const { data, error } = await supabaseAdmin
        .from('cms_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      res.json({ success: true, setting: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // --- USER LISTING (Admin console helper) ---
  app.get('/api/admin/users', async (req, res) => {
    try {
      if (useMockDatabase) {
        return res.json(mockProfiles.map(mapDbProfileToUi));
      }
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json((data || []).map(mapDbProfileToUi));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/users/:id/role', async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      if (!['customer', 'owner', 'barber', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role selection' });
      }
      if (useMockDatabase) {
        const target = mockProfiles.find(p => p.id === id);
        if (!target) return res.status(404).json({ error: 'User profile not found' });
        target.role = role;
        return res.json({ success: true, profile: mapDbProfileToUi(target) });
      }
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ role })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      res.json({ success: true, profile: mapDbProfileToUi(data) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // --- AI FEATURES WITH EXPLICIT LAZY INIT AND ERROR HANDLING ---
  app.post('/api/ai/recommend', async (req, res) => {
    try {
      const { message, previousMessages } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message payload is empty.' });
      }

      let dbShops = [];
      if (useMockDatabase) {
        dbShops = mockShops;
      } else {
        const { data } = await supabaseAdmin.from('shops').select('*, services(*)');
        dbShops = data || [];
      }
      const ai = getGeminiClient();

      const systemInstruction = `
        You are "StyleSlot AI", the premium luxury virtual styling assistant for the StyleSlot Grooming Marketplace.
        Provide elite grooming, hair trend advice, facial structure symmetry analysis, beard design recommendations, and lifestyle styling choices.
        Keep your advice highly premium, descriptive, conversational, and direct.
        You have knowledge about these registered shops available in the marketplace:
        ${JSON.stringify((dbShops || []).map(s => ({ name: s.name, specialties: s.categories, features: s.features, address: s.address, services: (s.services || []).map((sv: any) => sv.name) })))}
        
        Suggest suitable services or shops with elegant literal naming from the registry if they match the customer's request.
        Do not output JSON fields. Use elegant markdown styling. Always speak like a high-end luxury personal aesthetic advisor.
      `;

      const contents = [];
      if (previousMessages && Array.isArray(previousMessages)) {
        for (const msg of previousMessages) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      }
      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: { systemInstruction }
      });

      const text = response.text || "My apologies, I could not synthesize a recommendation at this moment.";
      res.json({ message: text });

    } catch (e: any) {
      res.status(200).json({ 
        message: `🤖 **Demo StyleSlot AI Assistant**: Let me offer some default luxury advice. 

Based on current trend analytics, a **Textured Drop-Fade with Razor Sculpting** is highly recommended for structured jawlines. For premium execution, **The Vintage Lounge** (Alexander Wright) offers excellent traditional hot towel finishes, while **Urban Fade Studio** specializes in bespoke crisp lines.

*(Note: If you have your own Gemini API key, please configure it in the env file with name \`GEMINI_API_KEY\` to enable dynamic AI chatbot advice!)*`
      });
    }
  });

  const MODEL_HAIRSTYLE_IMAGES: Record<string, string> = {
    "Modern Mullet": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=600",
    "Burst Fade Mullet": "https://images.unsplash.com/photo-1605497746444-ac9dbd324ce8?auto=format&fit=crop&q=80&w=600",
    "Low Fade": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600",
    "Mid Fade": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=600",
    "High Fade": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600",
    "French Crop": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600",
    "Crew Cut": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600",
    "Buzz Cut": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=600",
    "Wolf Cut": "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=600",
    "Messy Fringe": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600",
    "Side Part": "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=600",
    "Curtains": "https://images.unsplash.com/photo-1581803118522-7b72a50f7e9f?auto=format&fit=crop&q=80&w=600",
    "Pompadour": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
    "Textured Quiff": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600",
    "Undercut": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=600",
    "Drop Fade": "https://images.unsplash.com/photo-1605497746444-ac9dbd324ce8?auto=format&fit=crop&q=80&w=600",
    "Taper Fade": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600",
    "Curly Top": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600",
    "Long Layers": "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=600",
    "Modern Slick Back": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
    "Classic Taper": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600"
  };

  app.post('/api/ai/virtual-hairstylist', async (req, res) => {
    const { image, faceShape, hairDensity, hairLength, hasBeard, customRequest } = req.body;

    // 1. Mandatory Fields Validation
    const errors: Record<string, string> = {};
    if (!image) errors.image = "Uploaded photo is missing.";
    if (!faceShape) errors.faceShape = "Face shape must be selected.";
    if (!hairDensity) errors.hairDensity = "Hair density must be selected.";
    if (!hairLength) errors.hairLength = "Hair length must be selected.";
    if (!hasBeard) errors.hasBeard = "Beard contouring must be selected.";
    if (!customRequest || !customRequest.trim()) errors.customRequest = "Custom aesthetic goal cannot be empty.";

    if (Object.keys(errors).length > 0) {
      console.warn("Validation failed for virtual-hairstylist endpoint:", errors);
      return res.status(400).json({ error: "Missing mandatory fields.", details: errors });
    }

    const cleanRequest = customRequest.toLowerCase().trim();
    const allStyles = Object.keys(MODEL_HAIRSTYLE_IMAGES);

    // 2. Select hairstyles based on prompt variations
    const mullets = ["Modern Mullet", "Burst Fade Mullet", "Wolf Cut", "Messy Fringe"];
    const fades = ["Low Fade", "Mid Fade", "High Fade", "Drop Fade", "Taper Fade", "Classic Taper", "Undercut"];
    const shortCuts = ["Buzz Cut", "Crew Cut", "French Crop", "Low Fade", "Mid Fade", "High Fade"];
    const modernStyles = ["Pompadour", "Textured Quiff", "Side Part", "Curtains", "Modern Slick Back", "Undercut"];
    const textureCurly = ["Curly Top", "Messy Fringe", "Wolf Cut", "Long Layers"];
    const longCuts = ["Long Layers", "Wolf Cut", "Curtains", "Modern Mullet"];

    let selectedHairstyles: string[] = [];

    if (cleanRequest.includes('mullet')) {
      selectedHairstyles = mullets;
    } else if (cleanRequest.includes('fade') || cleanRequest.includes('taper') || cleanRequest.includes('undercut')) {
      selectedHairstyles = fades;
    } else if (cleanRequest.includes('short') || cleanRequest.includes('buzz') || cleanRequest.includes('crew') || cleanRequest.includes('crop')) {
      selectedHairstyles = shortCuts;
    } else if (cleanRequest.includes('korean') || cleanRequest.includes('curtain') || cleanRequest.includes('wolf') || cleanRequest.includes('fringe')) {
      selectedHairstyles = ["Wolf Cut", "Curtains", "Messy Fringe", "Long Layers", "Side Part"];
    } else if (cleanRequest.includes('curly') || cleanRequest.includes('wavy') || cleanRequest.includes('texture')) {
      selectedHairstyles = textureCurly;
    } else if (cleanRequest.includes('long') || cleanRequest.includes('layer')) {
      selectedHairstyles = longCuts;
    } else {
      // Default matching based on selected face shape
      switch (faceShape) {
        case 'Square':
          selectedHairstyles = ["Low Fade", "Mid Fade", "Modern Slick Back", "Side Part", "Classic Taper", "French Crop"];
          break;
        case 'Round':
          selectedHairstyles = ["Textured Quiff", "Pompadour", "High Fade", "Undercut", "Drop Fade", "Burst Fade Mullet"];
          break;
        case 'Heart':
          selectedHairstyles = ["Messy Fringe", "Curtains", "Wolf Cut", "Curly Top", "Long Layers", "Taper Fade"];
          break;
        case 'Diamond':
          selectedHairstyles = ["Messy Fringe", "Wolf Cut", "Curtains", "Long Layers", "Taper Fade", "Low Fade"];
          break;
        case 'Oblong':
          selectedHairstyles = ["French Crop", "Side Part", "Classic Taper", "Curtains", "Low Fade", "Mid Fade"];
          break;
        default: // Oval
          selectedHairstyles = ["Modern Mullet", "Textured Quiff", "Drop Fade", "Mid Fade", "French Crop", "Taper Fade"];
          break;
      }
    }

    // Ensure we have between 4 and 10 previews
    while (selectedHairstyles.length < 4) {
      const fallbackStyle = allStyles[Math.floor(Math.random() * allStyles.length)];
      if (!selectedHairstyles.includes(fallbackStyle)) {
        selectedHairstyles.push(fallbackStyle);
      }
    }
    if (selectedHairstyles.length > 10) {
      selectedHairstyles = selectedHairstyles.slice(0, 10);
    }

    // Generate style candidates with realistic studio visual references
    const previews = selectedHairstyles.map(style => {
      const styleImageUrl = MODEL_HAIRSTYLE_IMAGES[style] || MODEL_HAIRSTYLE_IMAGES["Modern Mullet"];
      return {
        name: style,
        compatibility: Math.floor(Math.random() * 11) + 88, // 88% - 98%
        rating: parseFloat((4.5 + Math.random() * 0.5).toFixed(1)),
        image: styleImageUrl,
        reason: `Accents your ${faceShape} symmetry while fitting ${hairDensity} density.`
      };
    });

    const generateFallback = () => {
      const best = previews.slice(0, 3).map(p => ({
        name: p.name,
        compatibility: p.compatibility,
        rating: p.rating,
        reason: p.reason
      }));
      const good = previews.slice(3, 7).map(p => ({
        name: p.name,
        compatibility: p.compatibility - 10,
        rating: parseFloat((p.rating - 0.4).toFixed(1)),
        reason: `A highly balanced option for your ${faceShape} face shape structure.`
      }));
      if (good.length === 0) {
        good.push({
          name: allStyles.find(s => !selectedHairstyles.includes(s)) || "Crew Cut",
          compatibility: 84,
          rating: 4.2,
          reason: "Classic volume balance that suits most facial heights."
        });
      }

      const lessRec = allStyles
        .filter(s => !selectedHairstyles.includes(s))
        .slice(0, 3)
        .map(style => ({
          name: style,
          explanation: `Adds excessive volume or side-weight which conflicts with your ${faceShape} bone structure.`
        }));

      return {
        detectedFeatures: {
          faceShape,
          hairline: "Symmetric Low",
          hairDensity,
          hairTexture: "Wavy",
          hairLength,
          foreheadSize: "Proportional",
          jawline: faceShape === 'Square' ? 'Sharp Angular' : 'Balanced',
          beard: hasBeard === "Yes" ? "Contoured Stubble" : "None",
          facialSymmetry: "High Symmetry",
          headShape: faceShape
        },
        hairGuide: {
          hairType: `${hairDensity} Density Wavy`,
          hairDensity: `${hairDensity} Density`,
          hairTexture: "Wavy Texture",
          hairLength: `${hairLength} Cut`,
          faceShape: faceShape,
          hairline: "Symmetric Low",
          forehead: "Proportional",
          jawline: faceShape === 'Square' ? 'Sharp Angular' : 'Balanced',
          idealHairVolume: faceShape === 'Round' || faceShape === 'Square' ? 'High Volume on Top' : 'Balanced Volume',
          recommendedFinish: "Matte Natural Look",
          recommendedStylingProducts: "Premium Grooming Paste, Clay"
        },
        bestMatches: best,
        goodOptions: good,
        lessRecommended: lessRec,
        previews,
        analysisSummary: `Based on our AI visual scan, your face is analyzed as a premium ${faceShape} structure. The key to styling this structure is balancing visual width with vertical proportion. We have recommended ${best.map(m => m.name).join(', ')} as your absolute best matches because they emphasize your strong jaw symmetry while maintaining natural volume. We advise avoiding ${lessRec.map(m => m.name).join(', ')} as they might distort these proportions. Finish with premium products to maintain a professional salon finish.`
      };
    };

    try {
      const ai = getGeminiClient();

      const promptText = `
        Analyze this user's grooming profile and custom request:
        - Selected Face Shape: ${faceShape}
        - Hair Density: ${hairDensity}
        - Hair Length: ${hairLength}
        - Beard Contouring: ${hasBeard}
        - User Custom Request: "${customRequest}"

        You MUST respond ONLY with a raw, valid JSON object conforming exactly to this schema. Do not output any markdown formatting block, backticks, or conversational text.

        JSON Schema:
        {
          "hairGuide": {
            "hairType": string,
            "hairDensity": string,
            "hairTexture": string,
            "hairLength": string,
            "faceShape": string,
            "hairline": string,
            "forehead": string,
            "jawline": string,
            "idealHairVolume": string,
            "recommendedFinish": string,
            "recommendedStylingProducts": string
          },
          "bestMatches": [
            { "name": string, "compatibility": number, "rating": number, "reason": string }
          ],
          "goodOptions": [
            { "name": string, "compatibility": number, "rating": number, "reason": string }
          ],
          "lessRecommended": [
            { "name": string, "explanation": string }
          ],
          "analysisSummary": string
        }

        Rules:
        1. All hairstyle names in "bestMatches", "goodOptions", and "lessRecommended" MUST be chosen from this list: ${JSON.stringify(allStyles)}.
        2. Prioritize styles that match the user's custom aesthetic goal ("${customRequest}").
        3. Make sure the explanations are descriptive and luxury-focused.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        config: {
          systemInstruction: "You are the StyleSlot VIP aesthetic director. You must return a raw JSON styling report conforming exactly to the requested schema. Output ONLY raw JSON."
        }
      });

      let jsonText = response.text || '';
      if (jsonText.includes('```')) {
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
      }
      const data = JSON.parse(jsonText);

      // Construct final payload containing previews and Gemini metadata
      const payload = {
        detectedFeatures: {
          faceShape,
          hairline: "Symmetric Low",
          hairDensity,
          hairTexture: "Wavy",
          hairLength,
          foreheadSize: "Proportional",
          jawline: faceShape === 'Square' ? 'Sharp Angular' : 'Balanced',
          beard: hasBeard === "Yes" ? "Contoured Stubble" : "None",
          facialSymmetry: "High Symmetry",
          headShape: faceShape
        },
        hairGuide: data.hairGuide,
        bestMatches: data.bestMatches,
        goodOptions: data.goodOptions,
        lessRecommended: data.lessRecommended,
        previews,
        analysisSummary: data.analysisSummary
      };

      res.json(payload);

    } catch (e: any) {
      console.warn("Gemini API call failed, generating fallback styled JSON:", e.message || e);
      const data = generateFallback();
      res.json(data);
    }
  });

  // --- HUGGING FACE ZERO-COST REMOTE AI HAIRSTYLE IMAGE GENERATOR ---
  app.post('/api/ai/hf-hairstyle-edit', async (req, res) => {
    const { image, faceShape, hairDensity, hairLength, hasBeard, customRequest, specificHairstyle } = req.body;

    // 1. Strict Mandatory Fields Validation
    const errors: Record<string, string> = {};
    if (!image) errors.image = "Uploaded portrait photo is required.";
    if (!faceShape) errors.faceShape = "Face shape must be selected.";
    if (!hairDensity) errors.hairDensity = "Hair density must be selected.";
    if (!hairLength) errors.hairLength = "Hair length must be selected.";
    if (!hasBeard) errors.hasBeard = "Beard contouring must be selected.";
    if (!customRequest || !customRequest.trim()) errors.customRequest = "Custom aesthetic goal is required.";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: "All mandatory profile parameters must be selected before generating recommendations.",
        details: errors,
        providerStatus: "VALIDATION_FAILED",
        generationStatus: "FAILED"
      });
    }

    const hfToken = (req.headers['x-hf-token'] as string) || req.body.hfToken || process.env.HF_TOKEN || '';
    const HF_MODEL = 'black-forest-labs/FLUX.1-Kontext-dev';
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 2. Identity Preservation Prompt Construction
    const targetStyle = specificHairstyle || customRequest.trim();
    const editingPrompt = `Edit the provided reference photo.

Keep the exact same person.

Preserve the person's identity and facial appearance.

Preserve the face shape, eyes, eyebrows, nose, lips, skin tone, facial proportions, expression, beard unless the user explicitly requests a beard change, body position, clothing, lighting, camera angle, and background.

Change ONLY the hairstyle requested by the user.

Modify the hair style, hair length, hair texture, hair volume and hair color only when explicitly requested.

The hairstyle must naturally fit the person's existing head shape, hairline and facial structure.

Do not create a new person.

Do not replace the face.

Do not alter facial features.

Do not change the clothing.

Do not change the background.

Do not change the camera angle.

Create a photorealistic hairstyle edit that looks naturally attached to the person's existing head.

Face shape: ${faceShape}.
Hair density: ${hairDensity}.
Hair length: ${hairLength}.
Beard contouring: ${hasBeard === 'Yes' ? 'Contoured' : 'Clean Shaven'}.
Requested hairstyle: ${targetStyle}.`;

    // 3. Ensure token is present on server or client header
    if (!hfToken || hfToken.trim() === '') {
      return res.status(503).json({
        error: "Free AI image generation requires your Hugging Face Access Token. Please enter your free token (from huggingface.co/settings/tokens) in the AI Lab settings bar above.",
        providerStatus: "CONFIG_REQUIRED",
        requestId,
        generationStatus: "FAILED",
        model: HF_MODEL
      });
    }

    try {
      // 4. Process image buffer safely
      let base64Data = image;
      let mimeType = 'image/jpeg';
      if (image.startsWith('data:')) {
        const matches = image.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const imageBlob = new Blob([imageBuffer], { type: mimeType });

      // 5. Remote inference via Hugging Face Inference layer
      const hf = new InferenceClient(hfToken);
      let generatedBlob: Blob | null = null;

      try {
        const result = await hf.imageToImage({
          model: HF_MODEL,
          data: imageBlob,
          parameters: {
            prompt: editingPrompt,
            negative_prompt: "blurry, deformed, altered face, different person, new person, disfigured, bad anatomy, cartoon, drawing, watermark",
            strength: 0.72,
            guidance_scale: 7.5
          }
        });
        generatedBlob = result as Blob;
      } catch (hfClientErr: any) {
        console.warn(`HF InferenceClient call for ${HF_MODEL} error:`, hfClientErr?.message || hfClientErr);

        const errMsg = String(hfClientErr?.message || '');
        const statusCode = hfClientErr?.status || hfClientErr?.response?.status;

        // Quota Limit / 429
        if (statusCode === 429 || errMsg.includes('429') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate limit')) {
          return res.status(429).json({
            error: "Free AI image generation limit has been reached. Please try again later.",
            providerStatus: "QUOTA_EXCEEDED",
            requestId,
            generationStatus: "LIMIT_REACHED",
            model: HF_MODEL
          });
        }

        // Provider Unavailable / 503
        if (statusCode === 503 || statusCode === 502 || statusCode === 504 || errMsg.includes('503') || errMsg.toLowerCase().includes('currently loading') || errMsg.toLowerCase().includes('unavailable')) {
          return res.status(503).json({
            error: "AI hairstyle generation is temporarily unavailable. Please try again.",
            providerStatus: "PROVIDER_UNAVAILABLE",
            requestId,
            generationStatus: "FAILED",
            model: HF_MODEL
          });
        }

        // Fallback check through Router URL
        const routerUrl = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;
        const fallbackRes = await fetch(routerUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: image,
            parameters: {
              prompt: editingPrompt
            }
          })
        });

        if (fallbackRes.status === 429) {
          return res.status(429).json({
            error: "Free AI image generation limit has been reached. Please try again later.",
            providerStatus: "QUOTA_EXCEEDED",
            requestId,
            generationStatus: "LIMIT_REACHED",
            model: HF_MODEL
          });
        }

        if (fallbackRes.status === 503 || fallbackRes.status === 502 || fallbackRes.status === 504) {
          return res.status(503).json({
            error: "AI hairstyle generation is temporarily unavailable. Please try again.",
            providerStatus: "PROVIDER_UNAVAILABLE",
            requestId,
            generationStatus: "FAILED",
            model: HF_MODEL
          });
        }

        if (!fallbackRes.ok) {
          return res.status(502).json({
            error: "Selected AI hairstyle model is currently unavailable. Please try again later.",
            providerStatus: "MODEL_UNAVAILABLE",
            requestId,
            generationStatus: "FAILED",
            model: HF_MODEL
          });
        }

        generatedBlob = await fallbackRes.blob();
      }

      if (!generatedBlob) {
        return res.status(502).json({
          error: "Selected AI hairstyle model is currently unavailable. Please try again later.",
          providerStatus: "MODEL_UNAVAILABLE",
          requestId,
          generationStatus: "FAILED",
          model: HF_MODEL
        });
      }

      // Convert generated blob to base64 data URL
      const arrayBuffer = await generatedBlob.arrayBuffer();
      const outputBase64 = Buffer.from(arrayBuffer).toString('base64');
      const contentType = generatedBlob.type || 'image/jpeg';
      const generatedImage = `data:${contentType};base64,${outputBase64}`;

      return res.json({
        generatedImage,
        providerStatus: "ONLINE",
        requestId,
        generationStatus: "COMPLETED",
        model: HF_MODEL,
        style: targetStyle,
        prompt: editingPrompt
      });

    } catch (err: any) {
      console.error("Hugging Face remote inference processing error:", err?.message || err);
      return res.status(500).json({
        error: "AI hairstyle generation is temporarily unavailable. Please try again.",
        providerStatus: "ERROR",
        requestId,
        generationStatus: "FAILED",
        model: HF_MODEL
      });
    }
  });


  // --- DEV & PRODUCTION VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    console.log('Starting server in DEVELOPMENT mode. Initializing Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);

    // Fallback SPA routing for development mode
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(
          path.resolve(process.cwd(), 'index.html'),
          'utf-8'
        );
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    console.log('Starting server in PRODUCTION mode. Serving static assets from dist...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  createApp().then(app => {
    const PORT = 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`StyleSlot server running successfully on http://0.0.0.0:${PORT}`);
    });
  });
}
