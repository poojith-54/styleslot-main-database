import { Shop, Coupon, Membership, Booking, UserProfile } from './types';

export const INITIAL_SHOPS: Shop[] = [
  {
    id: 'shop-1',
    name: 'The Taj Salon & Lounge',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400',
    banner: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1200',
    rating: 4.9,
    reviewsCount: 142,
    distance: 1.2,
    address: 'Taj Mahal Palace, Colaba, Mumbai',
    coordinates: { lat: 18.9220, lng: 72.8347 },
    isVerified: true,
    isFeatured: true,
    workingHours: '09:00 AM - 09:00 PM',
    features: ['Premium South Indian Filter Coffee', 'A/C', 'High-Speed Wifi', 'Valet Parking', 'Luxury Leather Chairs'],
    categories: ['Haircut', 'Beard Styling', 'Hair Spa', 'Facial'],
    services: [
      { id: 'srv-101', name: 'Royal Golden Haircut', category: 'Haircut', price: 1200, duration: 45, description: 'Signature precision cut with organic shampoo, luxury conditioning, and gold-flaked styling product.' },
      { id: 'srv-102', name: 'Straight Razor Hot Towel Shave', category: 'Beard Styling', price: 800, duration: 30, description: 'Traditional multi-step hot towel preparation, pre-shave oil, close razor shave, and cooling aloe balm.' },
      { id: 'srv-103', name: 'Beard Sculpt & Line-up', category: 'Beard Styling', price: 600, duration: 25, description: 'Detailed sculpting with standard clippers followed by sharp straight razor definition.' },
      { id: 'srv-104', name: 'Hydro-Spa Scalp Therapy', category: 'Hair Spa', price: 1500, duration: 40, description: 'Soothing steam massage, tea tree nourishing scalp mask, and deep massage.' },
      { id: 'srv-105', name: 'Charcoal Rejuvenating Facial', category: 'Facial', price: 1000, duration: 30, description: 'Pore extraction, active charcoal mask, cold mist, and gold serum finish.' }
    ],
    barbers: [
      { id: 'barber-1', name: 'Alexander Wright', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', rating: 4.9, isAvailable: true, specialty: 'Master Scissors & Traditional Shaves', bio: 'With 12 years of luxury grooming experience, Alexander specializes in classic cuts.', earnings: 52000 },
      { id: 'barber-2', name: 'Marcus Sterling', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', rating: 4.8, isAvailable: true, specialty: 'Modern Street Fades & Beard Styling', bio: 'Marcus crafts high-contrast skins, tapers, and premium sharp line-ups.', earnings: 38000 }
    ],
    homeService: true,
    reviews: [
      { id: 'rev-1', customerName: 'David K.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=80', rating: 5, date: '2026-06-04', comment: 'Absolute best service. The Royal Haircut process made me feel like king. True craft!', serviceName: 'Royal Golden Haircut' },
      { id: 'rev-2', customerName: 'Julian M.', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=80', rating: 5, date: '2026-06-01', comment: 'The hot towel straight razor shave is unbelievably clean. Incredible attention to detail.', serviceName: 'Straight Razor Hot Towel Shave' }
    ]
  },
  {
    id: 'shop-2',
    name: 'Prism & Pixels Salon',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=400',
    banner: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1200',
    rating: 4.8,
    reviewsCount: 96,
    distance: 2.5,
    address: '89 Link Road, Bandra West, Mumbai',
    coordinates: { lat: 19.0600, lng: 72.8300 },
    isVerified: true,
    isFeatured: false,
    workingHours: '10:00 AM - 08:00 PM',
    features: ['Organic Tea & Masala Chai Bar', 'A/C', 'Scenic Window Seats', 'Selfie Accent Lighting'],
    categories: ['Haircut', 'Hair Coloring', 'Facial'],
    services: [
      { id: 'srv-201', name: 'Creative Director Cut', category: 'Haircut', price: 1800, duration: 55, description: 'Bespoke shape design by our head stylist matching your facial structure.' },
      { id: 'srv-202', name: 'Cyberpunk Pastel Highlight', category: 'Hair Coloring', price: 3500, duration: 120, description: 'Double-lift bleach followed by custom color shades (pink, blue, platinum neon).' },
      { id: 'srv-203', name: 'Organic Honey Facial Glow', category: 'Facial', price: 1500, duration: 40, description: 'All-natural scrub, heated honey wrap, iced roller massage, and organic toner.' }
    ],
    barbers: [
      { id: 'barber-3', name: 'Seraphina Vance', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', rating: 4.8, isAvailable: true, specialty: 'Chroma Blending & Layering', bio: 'Seraphina is an award-winning color specialist and structural hair artist.', earnings: 64000 },
      { id: 'barber-4', name: 'Nate Brooks', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150', rating: 4.7, isAvailable: true, specialty: 'Textured Shags & Precision Cuts', bio: 'Nate creates breezy, modern, easily manageable textured styles.', earnings: 28000 }
    ],
    homeService: false,
    reviews: [
      { id: 'rev-3', customerName: 'Chloe L.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=80', rating: 5, date: '2026-06-03', comment: 'Seraphina is a color wizard! My pastel purple highlights are completely gorgeous.', serviceName: 'Cyberpunk Pastel Highlight' }
    ]
  },
  {
    id: 'shop-3',
    name: 'Gentleman’s Creed',
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=400',
    banner: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&q=80&w=1200',
    rating: 4.7,
    reviewsCount: 118,
    distance: 0.8,
    address: '15 Heritage Marg, Fort Sector, Mumbai',
    coordinates: { lat: 18.9350, lng: 72.8360 },
    isVerified: true,
    isFeatured: true,
    workingHours: '08:00 AM - 08:30 PM',
    features: ['Complimentary Single-Malt Beverage', 'A/C', 'Offline Quiet Room', 'Warm Shaving Gel'],
    categories: ['Haircut', 'Beard Styling', 'Hair Spa'],
    services: [
      { id: 'srv-301', name: 'Heritage Scissors Cut', category: 'Haircut', price: 1000, duration: 40, description: 'Classic grooming with scissors only, complete with tea-tree wash.' },
      { id: 'srv-302', name: 'Creed Beard Sculpting', category: 'Beard Styling', price: 600, duration: 20, description: 'Balancing and structure optimization tailored to face shapes.' },
      { id: 'srv-303', name: 'Royal Oil Scalp Spa', category: 'Hair Spa', price: 1200, duration: 30, description: 'Infused essential argan oils, massage, and hot aromatic wraps.' }
    ],
    barbers: [
      { id: 'barber-5', name: 'Charles Vance', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', rating: 4.7, isAvailable: true, specialty: 'Traditional Scissor Sculpture', bio: 'Charles believes in the heritage style. No rushing. Only perfection.', earnings: 18000 }
    ],
    homeService: true,
    reviews: [
      { id: 'rev-4', customerName: 'Robert T.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=80', rating: 4, date: '2026-05-28', comment: 'Great single malt, classic atmosphere. A bit of a wait, but Charles is worth it!', serviceName: 'Heritage Scissors Cut' }
    ]
  },
  {
    id: 'shop-4',
    name: 'RetroCuts Neon Grid',
    image: 'https://images.unsplash.com/photo-1512864084360-7c0c4d0a0845?auto=format&fit=crop&q=80&w=400',
    banner: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=1200',
    rating: 4.6,
    reviewsCount: 75,
    distance: 4.1,
    address: '108 Galleria Mall, Hiranandani Powai, Mumbai',
    coordinates: { lat: 19.1176, lng: 72.9060 },
    isVerified: false,
    isFeatured: false,
    workingHours: '11:00 AM - 11:59 PM',
    features: ['Retro Arcade Cabinets', 'Synthwave Soundtrack', 'LED Neon Mirror Rails', 'Energy Drinks'],
    categories: ['Haircut', 'Beard Styling'],
    services: [
      { id: 'srv-401', name: 'Retro Grid Skin-Fade', category: 'Haircut', price: 700, duration: 30, description: 'Super fast skin fade, razor shave back-line, styled with wet-look gel.' },
      { id: 'srv-402', name: 'Cyber-Pointy Beard Trim', category: 'Beard Styling', price: 400, duration: 15, description: 'Sharpen your beard line with mechanical clippers and high precision.' }
    ],
    barbers: [
      { id: 'barber-6', name: 'Zane Razor', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150', rating: 4.6, isAvailable: true, specialty: 'Speed Skin Fades & Geometric Hair Tattoos', bio: 'Zane blends retro synth vibes with lightning-fast clippers work.', earnings: 38000 }
    ],
    homeService: false,
    reviews: []
  },
  {
    id: 'shop-5',
    name: 'Urban Fade Studio',
    image: 'https://images.unsplash.com/photo-1605497746444-ac9dbd324ce8?auto=format&fit=crop&q=80&w=400',
    banner: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=1200',
    rating: 4.9,
    reviewsCount: 210,
    distance: 1.8,
    address: '67 Carter Road, Bandra West, Mumbai',
    coordinates: { lat: 19.0660, lng: 72.8240 },
    isVerified: true,
    isFeatured: true,
    workingHours: '09:00 AM - 09:30 PM',
    features: ['Hip Hop Beats', 'Streetwear Merch Rail', 'Sneaker Cleaning Station', 'Cold Brew Coffee'],
    categories: ['Haircut', 'Beard Styling', 'Grooming Packages'],
    services: [
      { id: 'srv-501', name: 'Master Taper & Drop-Fade', category: 'Haircut', price: 900, duration: 40, description: 'Flawless blurry drop taper, textured comb-over styling, high-contrast neck fade.' },
      { id: 'srv-502', name: 'The City Executive Grooming Pack', category: 'Grooming Packages', price: 2200, duration: 75, description: 'Precision Haircut, luxury beard styling, organic charcoal face mask, blow-out, and neck massage.' }
    ],
    barbers: [
      { id: 'barber-7', name: 'Kenji Takahashi', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', rating: 4.9, isAvailable: true, specialty: 'Fades, Lines, Textured Hair Art', bio: 'Born in Tokyo, Kenji crafts ultra-clean geometric fades and hair art carvings.', earnings: 45000 }
    ],
    homeService: true,
    reviews: [
      { id: 'rev-5', customerName: 'Marcus J.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=80', rating: 5, date: '2026-06-05', comment: 'Kenji has an absolute god-tier wrist with clippers. Drop fade is completely seamless!', serviceName: 'Master Taper & Drop-Fade' }
    ]
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  { code: 'GOLDSTYL', discountPercent: 20, description: 'Save 20% on any Gold Premium service', expiryDate: '2026-12-31', minBookingValue: 1000 },
  { code: 'FADENEW', discountPercent: 15, description: '15% Off for your first sleek fade booking', expiryDate: '2026-09-30', minBookingValue: 500 },
  { code: 'SPATREAT', discountPercent: 25, description: 'Get a relaxing 25% discount on Grooming Packages & Hair Spa', expiryDate: '2026-08-31', minBookingValue: 1500 }
];

export const INITIAL_MEMBERSHIPS: Membership[] = [
  { id: 'mem-1', title: 'Bronze Premium', price: 2000, period: 'monthly', benefits: ['2 Haircuts or Beard Grooming included', '10% off any secondary booking', 'Priority rescheduling'] },
  { id: 'mem-2', title: 'Gold Royalty VIP', price: 4500, period: 'monthly', benefits: ['Unlimited cuts & styling', '1 complimentary Charcoal Facial/month', 'Free home-service fee up to 5km', 'VIP quick seat booking (zero wait time)'] },
  { id: 'mem-3', title: 'Ultimate Elite Annual', price: 40000, period: 'yearly', benefits: ['All Gold tier benefits', 'Dedicated personal stylist priority line', '12 complimentary beverages and products', 'Emergency booking access (guaranteed within 2 hours)'] }
];

export const INITIAL_USER: UserProfile = {
  id: 'usr-customer',
  name: 'Poojith Sai Chand',
  email: 'poojithsaichand@gmail.com',
  phone: '+91 98765 43210',
  role: 'customer',
  walletBalance: 8500.00,
  loyaltyPoints: 340,
  favorites: ['shop-1', 'shop-5']
};

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'bk-1',
    shopId: 'shop-1',
    shopName: 'The Taj Salon & Lounge',
    shopImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400',
    serviceIds: ['srv-101'],
    serviceNames: ['Royal Golden Haircut'],
    totalPrice: 1200,
    date: '2026-06-03',
    time: '02:30 PM',
    barberId: 'barber-1',
    barberName: 'Alexander Wright',
    customerName: 'Poojith Sai Chand',
    customerEmail: 'poojithsaichand@gmail.com',
    customerPhone: '+91 98765 43210',
    status: 'completed',
    type: 'in-shop',
    createdAt: '2026-06-02T10:15:00Z',
    rating: 5,
    reviewText: 'Amazing hair transformation.'
  },
  {
    id: 'bk-2',
    shopId: 'shop-5',
    shopName: 'Urban Fade Studio',
    shopImage: 'https://images.unsplash.com/photo-1605497746444-ac9dbd324ce8?auto=format&fit=crop&q=80&w=400',
    serviceIds: ['srv-501'],
    serviceNames: ['Master Taper & Drop-Fade'],
    totalPrice: 900,
    date: '2026-06-07',
    time: '11:00 AM',
    barberId: 'barber-7',
    barberName: 'Kenji Takahashi',
    customerName: 'Poojith Sai Chand',
    customerEmail: 'poojithsaichand@gmail.com',
    customerPhone: '+91 98765 43210',
    status: 'accepted',
    type: 'in-shop',
    createdAt: '2026-06-05T16:00:00Z'
  },
  {
    id: 'bk-3',
    shopId: 'shop-2',
    shopName: 'Prism & Pixels Salon',
    shopImage: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=400',
    serviceIds: ['srv-201', 'srv-203'],
    serviceNames: ['Creative Director Cut', 'Organic Honey Facial Glow'],
    totalPrice: 3300,
    date: '2026-06-08',
    time: '04:00 PM',
    barberId: 'barber-3',
    barberName: 'Seraphina Vance',
    customerName: 'Michael Corleone',
    customerEmail: 'michael@mafia.com',
    customerPhone: '+91 98230 45678',
    status: 'pending',
    type: 'in-shop',
    createdAt: '2026-06-06T12:00:00Z'
  },
  {
    id: 'bk-4',
    shopId: 'shop-1',
    shopName: 'The Taj Salon & Lounge',
    shopImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400',
    serviceIds: ['srv-101', 'srv-102'],
    serviceNames: ['Royal Golden Haircut', 'Straight Razor Hot Towel Shave'],
    totalPrice: 2000,
    date: '2026-06-06',
    time: '06:30 PM',
    barberId: 'barber-1',
    barberName: 'Alexander Wright',
    customerName: 'Marcus Aurelius',
    customerEmail: 'philosopher@rome.gov',
    customerPhone: '+91 99999 88888',
    status: 'accepted',
    type: 'home-service',
    address: '1 Sea Face Apartments, Carter Road, Bandra West, Mumbai',
    notes: 'Please bring lavender scented hot towel oil.',
    createdAt: '2026-06-05T09:30:00Z'
  }
];
