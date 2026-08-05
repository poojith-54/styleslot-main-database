import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Shop, Booking, UserProfile, Service, Barber, Review, Coupon, Membership } from './src/types';

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
    phone: 'Podalkur Arokya Milk',
    email: 'contact@arokyamilk.com',
    address: 'Andhra Pradesh, India',
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
    reviews: (shop.reviews || []).map(mapDbReviewToUi)
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

  app.post('/api/ai/virtual-hairstylist', async (req, res) => {
    const { image, customRequest } = req.body;

    // Define all styles
    const allStyles = [
      "Modern Mullet", "Burst Fade Mullet", "Low Fade", "Mid Fade", "High Fade",
      "French Crop", "Crew Cut", "Buzz Cut", "Wolf Cut", "Messy Fringe",
      "Side Part", "Curtains", "Pompadour", "Textured Quiff", "Undercut",
      "Drop Fade", "Taper Fade", "Curly Top", "Long Layers", "Modern Slick Back",
      "Classic Taper"
    ];

    const generateFallback = () => {
      const cleanCustom = (customRequest || '').toLowerCase().trim();
      
      // Determine face shape
      let faceShape = 'Oval';
      if (cleanCustom.includes('square') || cleanCustom.includes('jawline')) faceShape = 'Square';
      else if (cleanCustom.includes('round') || cleanCustom.includes('chubby')) faceShape = 'Round';
      else if (cleanCustom.includes('heart') || cleanCustom.includes('pointed')) faceShape = 'Heart';
      else if (cleanCustom.includes('diamond') || cleanCustom.includes('cheekbone')) faceShape = 'Diamond';
      else if (cleanCustom.includes('oblong') || cleanCustom.includes('long')) faceShape = 'Oblong';
      else {
        const shapes = ['Oval', 'Square', 'Round', 'Heart', 'Diamond', 'Oblong'];
        const seed = (customRequest || '').length + (image || '').length;
        faceShape = shapes[seed % shapes.length];
      }

      // If user requested a custom style, try to find a match
      let requestedStyle = '';
      for (const style of allStyles) {
        if (cleanCustom.includes(style.toLowerCase()) || 
            (cleanCustom.includes('mullet') && style === "Modern Mullet") || 
            (cleanCustom.includes('fade') && style === "Mid Fade") || 
            (cleanCustom.includes('buzz') && style === "Buzz Cut") || 
            (cleanCustom.includes('wolf') && style === "Wolf Cut")) {
          requestedStyle = style;
          break;
        }
      }

      // Select 3 best matches
      let bestMatches: any[] = [];
      if (requestedStyle) {
        bestMatches.push({ 
          name: requestedStyle, 
          compatibility: 98, 
          rating: 5.0, 
          reason: `Matches your requested style perfectly and works beautifully with your ${faceShape} face shape.` 
        });
      }

      // Get styles prioritized by shape
      const getStylesForShape = (shape: string) => {
        switch (shape) {
          case 'Square':
            return ["Low Fade", "Mid Fade", "Modern Slick Back", "Side Part", "Crew Cut", "Classic Taper", "French Crop", "Buzz Cut", "Wolf Cut"];
          case 'Round':
            return ["Textured Quiff", "Pompadour", "High Fade", "Undercut", "Drop Fade", "Burst Fade Mullet", "Modern Mullet", "Crew Cut", "Buzz Cut"];
          case 'Heart':
            return ["Messy Fringe", "Curtains", "Wolf Cut", "Curly Top", "Long Layers", "Taper Fade", "Mid Fade", "Buzz Cut", "Classic Taper"];
          case 'Diamond':
            return ["Messy Fringe", "Wolf Cut", "Curtains", "Long Layers", "Taper Fade", "Low Fade", "Side Part", "Crew Cut", "Buzz Cut"];
          case 'Oblong':
            return ["French Crop", "Side Part", "Classic Taper", "Curtains", "Low Fade", "Mid Fade", "Buzz Cut", "Textured Quiff", "Pompadour"];
          default: // Oval
            return ["Modern Mullet", "Textured Quiff", "Drop Fade", "Mid Fade", "French Crop", "Taper Fade", "Curly Top", "Buzz Cut", "Wolf Cut"];
        }
      };

      const shapeStyles = getStylesForShape(faceShape);
      const chosenBest = shapeStyles.slice(0, 3).filter(s => s !== requestedStyle);
      while (bestMatches.length < 3) {
        const next = chosenBest.shift();
        if (next) {
          bestMatches.push({ 
            name: next, 
            compatibility: Math.floor(Math.random() * 6) + 90, 
            rating: parseFloat((4.6 + Math.random() * 0.4).toFixed(1)), 
            reason: `Accents your vertical ${faceShape} proportions and jaw symmetry.` 
          });
        } else {
          break;
        }
      }

      // Select 4 good options
      let goodOptions: any[] = [];
      const chosenGood = shapeStyles.slice(3, 7);
      for (const next of chosenGood) {
        if (goodOptions.length < 4 && next !== requestedStyle) {
          goodOptions.push({ 
            name: next, 
            compatibility: Math.floor(Math.random() * 11) + 75, 
            rating: parseFloat((4.0 + Math.random() * 0.5).toFixed(1)), 
            reason: `A solid, balanced alternative for a ${faceShape} profile.` 
          });
        }
      }

      // Select 3 less recommended
      let lessRecommended: any[] = [];
      const chosenLess = shapeStyles.slice(7).concat(allStyles.filter(s => !shapeStyles.includes(s))).slice(0, 3);
      const explanations = [
        "Adds unnecessary volume on the sides which conflicts with your structure.",
        "Draws focus away from your symmetric features, making the forehead look disproportionate.",
        "Lacks the styling height required to balance your lower jaw symmetry."
      ];
      for (let i = 0; i < chosenLess.length; i++) {
        if (lessRecommended.length < 3) {
          lessRecommended.push({ 
            name: chosenLess[i], 
            explanation: explanations[i] || "May not optimally balance your face structure." 
          });
        }
      }

      const hairDensity = cleanCustom.includes('thick') || cleanCustom.includes('high') ? 'High' : (cleanCustom.includes('thin') || cleanCustom.includes('low') ? 'Low' : 'Medium');
      const hairLength = cleanCustom.includes('long') ? 'Long' : (cleanCustom.includes('short') ? 'Short' : 'Medium');
      const hairTexture = cleanCustom.includes('curly') ? 'Curly' : (cleanCustom.includes('wavy') ? 'Wavy' : 'Straight');

      return {
        detectedFeatures: {
          faceShape,
          hairline: "Symmetric Low",
          hairDensity,
          hairTexture,
          hairLength,
          foreheadSize: "Proportional",
          jawline: faceShape === 'Square' ? 'Sharp Angular' : 'Balanced',
          beard: cleanCustom.includes('beard') ? 'Stubble Trim' : 'None',
          facialSymmetry: "High Symmetry",
          headShape: faceShape
        },
        hairGuide: {
          hairType: `${hairTexture} Type`,
          hairDensity: `${hairDensity} Density`,
          hairTexture: `${hairTexture} Texture`,
          hairLength: `${hairLength} Cut`,
          faceShape: faceShape,
          hairline: "Symmetric Low",
          forehead: "Proportional",
          jawline: faceShape === 'Square' ? 'Sharp Angular' : 'Balanced',
          idealHairVolume: faceShape === 'Round' || faceShape === 'Square' ? 'High Volume on Top' : 'Balanced Volume',
          recommendedFinish: "Matte Natural",
          recommendedStylingProducts: "Premium Styling Clay, Sea Salt Spray"
        },
        bestMatches,
        goodOptions,
        lessRecommended,
        analysisSummary: `Based on our AI visual scan, your face is analyzed as a premium ${faceShape} structure. The key to styling this structure is balancing visual width with vertical proportion. We have recommended ${bestMatches.map(m => m.name).join(', ')} as your absolute best matches because they emphasize your strong jaw symmetry while maintaining natural volume. We advise avoiding ${lessRecommended.map(m => m.name).join(', ')} as they might distort these proportions. Finish with premium products to maintain a professional salon finish.`
      };
    };

    try {
      const ai = getGeminiClient();

      const prompt = `
        Analyze the uploaded user portrait image to detect and extract their facial features and structure.
        You must detect:
        1. Face Shape (Oval, Square, Round, Heart, Diamond, Oblong)
        2. Hairline (Low, Mid, High, M-shaped, Receding, Straight)
        3. Hair Density (Low, Medium, High)
        4. Hair Texture (Straight, Wavy, Curly, Coily)
        5. Hair Length (Buzz, Very Short, Short, Medium, Long)
        6. Forehead Size (Narrow, Average, Wide)
        7. Jawline (Sharp, Round, Balanced, Soft)
        8. Beard (None, Stubble, Full Beard, Goatee, etc.)
        9. Facial Symmetry (High, Medium, Low)
        10. Head Shape (Oval, Round, Square, Heart, etc.)

        Also construct a premium hairstyle recommendation strategy:
        - 3 Best Matches (compatibility %, star rating (out of 5.0), and why it suits them). Choose from these allowed styles: "Modern Mullet", "Burst Fade Mullet", "Low Fade", "Mid Fade", "High Fade", "French Crop", "Crew Cut", "Buzz Cut", "Wolf Cut", "Messy Fringe", "Side Part", "Curtains", "Pompadour", "Textured Quiff", "Undercut", "Drop Fade", "Taper Fade", "Curly Top", "Long Layers", "Modern Slick Back", "Classic Taper".
        - 4 Good Options (compatibility %, star rating, and why it is a good option). Choose from the same allowed styles.
        - 3 Less Recommended styles (with short explanations explaining why they are not recommended). Choose from the same allowed styles.
        - Analysis Summary: A personalized paragraph explaining why the recommended hairstyles suit the person's facial structure.
        - Hair Guide fields.

        User's custom style requests/input (if any): "${customRequest || 'None'}". If the user requested a specific style, evaluate how that style matches their face shape and make sure it is prioritized or detailed in your recommendations.

        You MUST respond ONLY with a raw, valid JSON object containing exactly the following schema. Do not output any markdown code blocks or additional conversational text.

        JSON Schema:
        {
          "detectedFeatures": {
            "faceShape": string,
            "hairline": string,
            "hairDensity": string,
            "hairTexture": string,
            "hairLength": string,
            "foreheadSize": string,
            "jawline": string,
            "beard": string,
            "facialSymmetry": string,
            "headShape": string
          },
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
      `;

      const parts: any[] = [];
      if (image && typeof image === 'string' && image.startsWith('data:')) {
        const commaIndex = image.indexOf(',');
        const semiIndex = image.indexOf(';base64');
        if (commaIndex !== -1 && semiIndex !== -1) {
          const mimeType = image.substring(5, semiIndex);
          const base64Data = image.substring(commaIndex + 1);
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
        }
      }
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: parts
          }
        ],
        config: {
          systemInstruction: "You are the StyleSlot VIP aesthetic director. You must analyze the image and return a raw JSON styling report conforming exactly to the requested schema. Output ONLY raw JSON."
        }
      });

      let jsonText = response.text || '';
      if (jsonText.includes('```')) {
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
      }
      const data = JSON.parse(jsonText);
      res.json(data);

    } catch (e: any) {
      console.warn("Gemini API call failed, generating fallback styled JSON:", e.message || e);
      const data = generateFallback();
      res.json(data);
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
