export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // in minutes
  description: string;
}

export interface Barber {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  isAvailable: boolean;
  specialty: string;
  bio: string;
  earnings?: number;
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface Review {
  id: string;
  customerName: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
  serviceName: string;
  photos?: string[];
}

export interface Shop {
  id: string;
  name: string;
  image: string;
  banner: string;
  rating: number;
  reviewsCount: number;
  distance: number; // in km
  address: string;
  coordinates: LocationCoordinates;
  services: Service[];
  barbers: Barber[];
  homeService: boolean;
  features: string[]; // e.g. "AC", "Wifi", "Premium Coffee", "Parking"
  categories: string[]; // e.g. "Haircut", "Beard Styling", "Hair Spa", "Facial"
  isVerified: boolean;
  isFeatured: boolean;
  workingHours: string;
  reviews?: Review[];
}

export interface Booking {
  id: string;
  shopId: string;
  shopName: string;
  shopImage?: string;
  serviceIds: string[];
  serviceNames: string[];
  totalPrice: number;
  date: string;
  time: string;
  barberId: string;
  barberName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  type: 'in-shop' | 'home-service';
  address?: string;
  notes?: string;
  queueNumber?: number;
  estimatedWaitMinutes?: number;
  createdAt: string;
  rating?: number;
  reviewText?: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  description: string;
  expiryDate: string;
  minBookingValue: number;
}

export interface Membership {
  id: string;
  title: string;
  price: number;
  period: 'monthly' | 'yearly';
  benefits: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'owner' | 'barber' | 'admin';
  walletBalance: number;
  loyaltyPoints: number;
  favorites: string[]; // shop ids
}
