-- Supabase Database Schema Migration for StyleSlot
-- This file defines normalized tables, Row Level Security (RLS) policies, triggers, and default seeds.

-- Drop existing tables if they exist (for clean deployment)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.cms_settings CASCADE;
DROP TABLE IF EXISTS public.memberships CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.barbers CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.shops CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. PROFILES Table (links to Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'owner', 'barber', 'admin')),
  wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  favorites TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are readable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 2. SHOPS Table
CREATE TABLE public.shops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  banner TEXT NOT NULL,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  distance NUMERIC(3, 1) NOT NULL DEFAULT 1.0,
  address TEXT NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  working_hours TEXT NOT NULL DEFAULT '09:00 AM - 09:00 PM',
  features TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  categories TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  home_service BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shops are readable by everyone" ON public.shops
  FOR SELECT USING (true);

CREATE POLICY "Shop owners can update their shops" ON public.shops
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins/Owners can insert shops" ON public.shops
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete shops" ON public.shops
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 3. SERVICES Table
CREATE TABLE public.services (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services are readable by everyone" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "Owners and Admins can manage services" ON public.services
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'admin')
    )
  );

-- 4. BARBERS Table (Staff)
CREATE TABLE public.barbers (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
  is_available BOOLEAN NOT NULL DEFAULT true,
  specialty TEXT NOT NULL,
  bio TEXT NOT NULL,
  earnings NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Barbers are readable by everyone" ON public.barbers
  FOR SELECT USING (true);

CREATE POLICY "Owners and Admins can manage barbers" ON public.barbers
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'admin')
    )
  );

-- 5. BOOKINGS Table
CREATE TABLE public.bookings (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  shop_image TEXT,
  service_ids TEXT[] NOT NULL,
  service_names TEXT[] NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  barber_id TEXT NOT NULL,
  barber_name TEXT NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  type TEXT NOT NULL DEFAULT 'in-shop' CHECK (type IN ('in-shop', 'home-service')),
  address TEXT,
  notes TEXT,
  queue_number INTEGER,
  estimated_wait_minutes INTEGER,
  rating INTEGER,
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() = customer_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'barber', 'admin')
    )
  );

CREATE POLICY "Users can insert their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = customer_id OR customer_id IS NULL);

CREATE POLICY "Users, Barbers, Owners can update bookings" ON public.bookings
  FOR UPDATE USING (
    auth.uid() = customer_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'barber', 'admin')
    )
  );

-- 6. REVIEWS Table
CREATE TABLE public.reviews (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  date TEXT NOT NULL,
  comment TEXT NOT NULL,
  service_name TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are readable by everyone" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can write reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 7. COUPONS Table
CREATE TABLE public.coupons (
  code TEXT PRIMARY KEY,
  discount_percent NUMERIC(5, 2) NOT NULL,
  description TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  min_booking_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coupons are readable by authenticated users" ON public.coupons
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage coupons" ON public.coupons
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 8. MEMBERSHIPS Table
CREATE TABLE public.memberships (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'yearly')),
  benefits TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Memberships are readable by everyone" ON public.memberships
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage memberships" ON public.memberships
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 9. CMS_SETTINGS Table (Key-Value CMS Config)
CREATE TABLE public.cms_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cms_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CMS Settings are readable by everyone" ON public.cms_settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify CMS Settings" ON public.cms_settings
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );


-- TRIGGERS
-- Create Profile after auth.users signup automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, wallet_balance, loyalty_points, favorites)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    120.50, -- Default balance matching simulation
    340,    -- Default points matching simulation
    '{}'::TEXT[]
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- SEED DATA

-- Seeds for CMS settings
INSERT INTO public.cms_settings (key, value) VALUES
('hero_section', '{
  "title": "Elite Grooming for the Modern Gentleman",
  "subtitle": "Discover the city''s finest barbers, track real-time queue waiting times, and book bespoke styling sessions in seconds.",
  "banner": "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1200"
}'),
('theme_settings', '{
  "business_name": "StyleSlot",
  "logo_url": "",
  "primary_color": "#D4AF37",
  "secondary_color": "#18181B",
  "font_family": "Outfit"
}'),
('about_section', '{
  "title": "A Legacy of Sophistication",
  "content": "StyleSlot is a premium curation of luxury barbershops and styling suites. We blend old-school hospitality with high-technology queue analytics and virtual AI face-shape consultation. Every cut is treated as bespoke architecture.",
  "image": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600"
}'),
('contact_details', '{
  "phone": "+1 (800) 555-SLOT",
  "email": "concierge@styleslot.com",
  "address": "777 Luxury Block, Penthouse Suite, New York, NY",
  "working_hours": "Mon - Sun: 09:00 AM - 10:00 PM"
}'),
('social_links', '{
  "facebook": "https://facebook.com",
  "instagram": "https://instagram.com",
  "twitter": "https://twitter.com",
  "linkedin": "https://linkedin.com"
}'),
('seo_settings', '{
  "title": "StyleSlot - Premium Grooming Marketplace & AI Styling",
  "description": "Book elite barbershops, run AI face scans, and manage premium grooming appointments in real-time."
}'),
('homepage_sections', '{
  "show_hero": true,
  "show_featured": true,
  "show_all_shops": true,
  "show_memberships": true,
  "show_testimonials": true,
  "show_faqs": true
}'),
('faqs', '[
  {
    "question": "How does the live waitlist estimation work?",
    "answer": "Our system scans active bookings and estimates a standard 15-minute slot per customer ahead of you in the queue. You can track your position in real-time."
  },
  {
    "question": "Can I request home service for all salons?",
    "answer": "Salons offering home-service are marked with a ''Home Service'' badge. You can toggle this filter during your search."
  },
  {
    "question": "How do I earn loyalty reward points?",
    "answer": "You earn 1 loyalty point for every dollar spent on bookings. Points can be redeemed for discounts or VIP slots."
  }
]'),
('testimonials', '[
  {
    "name": "David K.",
    "role": "VVIP Member",
    "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=80",
    "comment": "Absolute best service. The Royal Haircut process made me feel like king. True craft!"
  },
  {
    "name": "Julian M.",
    "role": "Premium Client",
    "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=80",
    "comment": "The hot towel straight razor shave is unbelievably clean. Incredible attention to detail."
  }
]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Seeds for Shops
INSERT INTO public.shops (id, name, image, banner, rating, reviews_count, distance, address, latitude, longitude, is_verified, is_featured, working_hours, features, categories, home_service) VALUES
('shop-1', 'The Vintage Lounge', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1200', 4.9, 142, 1.2, '412 Gold Avenue, Downtown luxury block', 37.7833, -122.4167, true, true, '09:00 AM - 09:00 PM', ARRAY['Premium Espresso', 'A/C', 'High-Speed Wifi', 'Valet Parking', 'Luxury Leather Chairs'], ARRAY['Haircut', 'Beard Styling', 'Hair Spa', 'Facial'], true),
('shop-2', 'Prism & Pixels Salon', 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1200', 4.8, 96, 2.5, '89 Chromatic Way, Creative District', 37.7749, -122.4294, true, false, '10:00 AM - 08:00 PM', ARRAY['Matcha & Tea Bar', 'A/C', 'Scenic Window Seats', 'Selfie Accent Lighting'], ARRAY['Haircut', 'Hair Coloring', 'Facial'], false),
('shop-3', 'Gentleman’s Creed', 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&q=80&w=1200', 4.7, 118, 0.8, '15 Heritage Blvd, Old Town Sector', 37.7699, -122.4468, true, true, '08:00 AM - 08:30 PM', ARRAY['Complimentary Single-Malt Scotch', 'A/C', 'Offline Quiet Room', 'Warm Shaving Gel'], ARRAY['Haircut', 'Beard Styling', 'Hair Spa'], true),
('shop-4', 'RetroCuts Neon Grid', 'https://images.unsplash.com/photo-1512864084360-7c0c4d0a0845?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=1200', 4.6, 75, 4.1, '108 Grid Street, Cyber Alley', 37.7950, -122.4080, false, false, '11:00 AM - 11:59 PM', ARRAY['Retro Arcade Cabinets', 'Synthwave Soundtrack', 'LED Neon Mirror Rails', 'Energy Drinks'], ARRAY['Haircut', 'Beard Styling'], false),
('shop-5', 'Urban Fade Studio', 'https://images.unsplash.com/photo-1605497746444-ac9dbd324ce8?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=1200', 4.9, 210, 1.8, '67 Streetwear Plaza, Metro Center', 37.7550, -122.4180, true, true, '09:00 AM - 09:30 PM', ARRAY['Hip Hop Beats', 'Streetwear Merch Rail', 'Sneaker Cleaning Station', 'Cold Brew Coffee'], ARRAY['Haircut', 'Beard Styling', 'Grooming Packages'], true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, image = EXCLUDED.image, banner = EXCLUDED.banner, rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count, distance = EXCLUDED.distance, address = EXCLUDED.address,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, is_verified = EXCLUDED.is_verified,
  is_featured = EXCLUDED.is_featured, working_hours = EXCLUDED.working_hours, features = EXCLUDED.features,
  categories = EXCLUDED.categories, home_service = EXCLUDED.home_service;

-- Seeds for Services
INSERT INTO public.services (id, shop_id, name, category, price, duration, description) VALUES
('srv-101', 'shop-1', 'Royal Golden Haircut', 'Haircut', 35.00, 45, 'Signature precision cut with shampoo, luxury conditioning, and gold-flaked styling product.'),
('srv-102', 'shop-1', 'Straight Razor Hot Towel Shave', 'Beard Styling', 25.00, 30, 'Traditional multi-step hot towel preparation, pre-shave oil, close razor shave, and cooling aloe balm.'),
('srv-103', 'shop-1', 'Beard Sculpt & Line-up', 'Beard Styling', 20.00, 25, 'Detailed sculpting with standard clippers followed by sharp straight razor definition.'),
('srv-104', 'shop-1', 'Hydro-Spa Scalp Therapy', 'Hair Spa', 40.00, 40, 'Soothing steam massage, tea tree nourishing scalp mask, and deep massage.'),
('srv-105', 'shop-1', 'Charcoal Rejuvenating Facial', 'Facial', 30.00, 30, 'Pore extraction, active charcoal mask, cold mist, and gold serum finish.'),
('srv-201', 'shop-2', 'Creative Director Cut', 'Haircut', 50.00, 55, 'Bespoke shape design by our head stylist matching your facial structure.'),
('srv-202', 'shop-2', 'Cyberpunk Pastel Highlight', 'Hair Coloring', 90.00, 120, 'Double-lift bleach followed by custom color shades (pink, blue, platinum neon).'),
('srv-203', 'shop-2', 'Organic Honey Facial Glow', 'Facial', 45.00, 40, 'All-natural scrub, heated honey wrap, iced roller massage, and organic toner.'),
('srv-301', 'shop-3', 'Heritage Scissors Cut', 'Haircut', 30.00, 40, 'Classic grooming with scissors only, complete with tea-tree wash.'),
('srv-302', 'shop-3', 'Creed Beard Sculpting', 'Beard Styling', 18.00, 20, 'Balancing and structure optimization tailored to face shapes.'),
('srv-303', 'shop-3', 'Royal Oil Scalp Spa', 'Hair Spa', 35.00, 30, 'Infused essential argan oils, massage, and hot aromatic wraps.'),
('srv-401', 'shop-4', 'Retro Grid Skin-Fade', 'Haircut', 20.00, 30, 'Super fast skin fade, razor shave back-line, styled with wet-look gel.'),
('srv-402', 'shop-4', 'Cyber-Pointy Beard Trim', 'Beard Styling', 12.00, 15, 'Sharpen your beard line with mechanical clippers and high precision.'),
('srv-501', 'shop-5', 'Master Taper & Drop-Fade', 'Haircut', 28.00, 40, 'Flawless blurry drop taper, textured comb-over styling, high-contrast neck fade.'),
('srv-502', 'shop-5', 'The City Executive Grooming Pack', 'Grooming Packages', 65.00, 75, 'Precision Haircut, luxury beard styling, organic charcoal face mask, blow-out, and neck massage.')
ON CONFLICT (id) DO UPDATE SET
  shop_id = EXCLUDED.shop_id, name = EXCLUDED.name, category = EXCLUDED.category,
  price = EXCLUDED.price, duration = EXCLUDED.duration, description = EXCLUDED.description;

-- Seeds for Barbers
INSERT INTO public.barbers (id, shop_id, name, avatar, rating, is_available, specialty, bio, earnings) VALUES
('barber-1', 'shop-1', 'Alexander Wright', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', 4.9, true, 'Master Scissors & Traditional Shaves', 'With 12 years of luxury grooming experience, Alexander specializes in classic cuts.', 1420.00),
('barber-2', 'shop-1', 'Marcus Sterling', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', 4.8, true, 'Modern Street Fades & Beard Styling', 'Marcus crafts high-contrast skins, tapers, and premium sharp line-ups.', 980.00),
('barber-3', 'shop-2', 'Seraphina Vance', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', 4.8, true, 'Chroma Blending & Layering', 'Seraphina is an award-winning color specialist and structural hair artist.', 1850.00),
('barber-4', 'shop-2', 'Nate Brooks', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150', 4.7, true, 'Textured Shags & Precision Cuts', 'Nate creates breezy, modern, easily manageable textured styles.', 740.00),
('barber-5', 'shop-3', 'Charles Vance', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', 4.7, true, 'Traditional Scissor Sculpture', 'Charles believes in the heritage style. No rushing. Only perfection.', 510.00),
('barber-6', 'shop-4', 'Zane Razor', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150', 4.6, true, 'Speed Skin Fades & Geometric Hair Tattoos', 'Zane blends retro synth vibes with lightning-fast clippers work.', 1100.00),
('barber-7', 'shop-5', 'Kenji Takahashi', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', 4.9, true, 'Fades, Lines, Textured Hair Art', 'Born in Tokyo, Kenji crafts ultra-clean geometric fades and hair art carvings.', 1320.00)
ON CONFLICT (id) DO UPDATE SET
  shop_id = EXCLUDED.shop_id, name = EXCLUDED.name, avatar = EXCLUDED.avatar, rating = EXCLUDED.rating,
  is_available = EXCLUDED.is_available, specialty = EXCLUDED.specialty, bio = EXCLUDED.bio, earnings = EXCLUDED.earnings;

-- Seeds for Coupons
INSERT INTO public.coupons (code, discount_percent, description, expiry_date, min_booking_value) VALUES
('GOLDSTYL', 20.00, 'Save 20% on any Gold Premium service', '2026-12-31', 30.00),
('FADENEW', 15.00, '15% Off for your first sleek fade booking', '2026-09-30', 15.00),
('SPATREAT', 25.00, 'Get a relaxing 25% discount on Grooming Packages & Hair Spa', '2026-08-31', 40.00)
ON CONFLICT (code) DO UPDATE SET
  discount_percent = EXCLUDED.discount_percent, description = EXCLUDED.description,
  expiry_date = EXCLUDED.expiry_date, min_booking_value = EXCLUDED.min_booking_value;

-- Seeds for Memberships
INSERT INTO public.memberships (id, title, price, period, benefits) VALUES
('mem-1', 'Bronze Premium', 49.00, 'monthly', ARRAY['2 Haircuts or Beard Grooming included', '10% off any secondary booking', 'Priority rescheduling']),
('mem-2', 'Gold Royalty VIP', 99.00, 'monthly', ARRAY['Unlimited cuts & styling', '1 complimentary Charcoal Facial/month', 'Free home-service fee up to 5km', 'VIP quick seat booking (zero wait time)']),
('mem-3', 'Ultimate Elite Annual', 899.00, 'yearly', ARRAY['All Gold tier benefits', 'Dedicated personal stylist priority line', '12 complimentary beverages and products', 'Emergency booking access (guaranteed within 2 hours)'])
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, price = EXCLUDED.price, period = EXCLUDED.period, benefits = EXCLUDED.benefits;

-- Seeds for Reviews
INSERT INTO public.reviews (id, shop_id, customer_name, avatar, rating, date, comment, service_name, photos) VALUES
('rev-1', 'shop-1', 'David K.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=80', 5, '2026-06-04', 'Absolute best service. The Royal Haircut process made me feel like king. True craft!', 'Royal Golden Haircut', ARRAY[]::TEXT[]),
('rev-2', 'shop-1', 'Julian M.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=80', 5, '2026-06-01', 'The hot towel straight razor shave is unbelievably clean. Incredible attention to detail.', 'Straight Razor Hot Towel Shave', ARRAY[]::TEXT[]),
('rev-3', 'shop-2', 'Chloe L.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=80', 5, '2026-06-03', 'Seraphina is a color wizard! My pastel purple highlights are completely gorgeous.', 'Cyberpunk Pastel Highlight', ARRAY[]::TEXT[]),
('rev-4', 'shop-3', 'Robert T.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=80', 4, '2026-05-28', 'Great single malt, classic atmosphere. A bit of a wait, but Charles is worth it!', 'Heritage Scissors Cut', ARRAY[]::TEXT[]),
('rev-5', 'shop-5', 'Marcus J.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=80', 5, '2026-06-05', 'Kenji has an absolute god-tier wrist with clippers. Drop fade is completely seamless!', 'Master Taper & Drop-Fade', ARRAY[]::TEXT[])
ON CONFLICT (id) DO UPDATE SET
  shop_id = EXCLUDED.shop_id, customer_name = EXCLUDED.customer_name, avatar = EXCLUDED.avatar,
  rating = EXCLUDED.rating, date = EXCLUDED.date, comment = EXCLUDED.comment,
  service_name = EXCLUDED.service_name, photos = EXCLUDED.photos;


-- 10. SELECTED_SALONS Table (Saves user salon selections from Google Places API)
CREATE TABLE IF NOT EXISTS public.selected_salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  google_place_id TEXT NOT NULL,
  salon_name TEXT NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  selected_hairstyle TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.selected_salons ENABLE ROW LEVEL SECURITY;

-- Selections Policies
CREATE POLICY "Users can manage their own selected salons" ON public.selected_salons
  USING (auth.uid() = user_id);


-- 11. SEARCH_HISTORY Table (Saves user's target search locations)
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own search history" ON public.search_history
  USING (auth.uid() = user_id);


-- 12. RECENTLY_VIEWED Table (Saves user's recently viewed salons)
CREATE TABLE IF NOT EXISTS public.recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  google_place_id TEXT NOT NULL,
  salon_name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  rating NUMERIC(3, 2),
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own recently viewed list" ON public.recently_viewed
  USING (auth.uid() = user_id);


-- 13. USER_FAVORITES Table (Saves user's favorited salons and spas)
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  google_place_id TEXT NOT NULL,
  salon_name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  rating NUMERIC(3, 2),
  image TEXT,
  category TEXT NOT NULL, -- 'salon' or 'spa' or 'barber'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, google_place_id)
);

-- Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own favorites" ON public.user_favorites
  USING (auth.uid() = user_id);


-- 14. Add enrichment columns to public.shops table
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS google_place_id TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS additional_photos TEXT[];
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS haircut_price NUMERIC(6, 2);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS beard_price NUMERIC(6, 2);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS spa_services TEXT[];
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS offers TEXT;



