import React, { useState } from 'react';
import { Shop, Service, Barber, Coupon, Booking } from '../types';
import { Calendar, Clock, Sparkles, Tag, Gift, User, MapPin, Truck, ChevronRight, X, AlertCircle } from 'lucide-react';

interface CheckoutWizardProps {
  shop: Shop;
  coupons: Coupon[];
  walletBalance: number;
  onBookingSuccess: (bookingData: any) => void;
  onClose: () => void;
  authToken?: string;
}

export default function CheckoutWizard({ shop, coupons, walletBalance, onBookingSuccess, onClose, authToken }: CheckoutWizardProps) {
  // Booking Form State
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>('2026-06-07');
  const [bookingTime, setBookingTime] = useState<string>('11:00 AM');
  const [bookingType, setBookingType] = useState<'in-shop' | 'home-service'>('in-shop');
  const [homeAddress, setHomeAddress] = useState('412 Golden Hills Block, Apt 3B');
  const [instructions, setInstructions] = useState('');
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  
  // API error State
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Time Slot Options
  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:30 PM', '02:30 PM', 
    '03:30 PM', '04:30 PM', '05:30 PM', '06:30 PM', '07:30 PM', '08:30 PM'
  ];

  // Helper calculation
  const selectedServices = shop.services.filter(s => selectedServiceIds.includes(s.id));
  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  // Coupon application logic
  const handleApplyCoupon = () => {
    setCouponError('');
    if (!couponCode.trim()) return;
    
    const matched = coupons.find(c => c.code.toLowerCase() === couponCode.trim().toLowerCase());
    if (!matched) {
      setCouponError('Invalid coupon code. Try GOLDSTYL or SPATREAT');
      setAppliedCoupon(null);
      return;
    }

    if (subtotal < matched.minBookingValue) {
      setCouponError(`Min booking value of ₹${matched.minBookingValue} required for this coupon.`);
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(matched);
  };

  const clearCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercent) / 100 : 0;
  const finalPrice = Math.max(0, subtotal - discountAmount);
  const matchedBarber = shop.barbers.find(b => b.id === selectedBarberId);

  // Handle Checkout Submit
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (selectedServiceIds.length === 0) {
      setApiError('Please select at least one grooming service before checking out.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          shopId: shop.id,
          serviceIds: selectedServiceIds,
          barberId: selectedBarberId || shop.barbers[0]?.id || 'best-available',
          date: bookingDate,
          time: bookingTime,
          type: bookingType,
          address: bookingType === 'home-service' ? homeAddress : '',
          notes: instructions,
          couponCode: appliedCoupon ? appliedCoupon.code : ''
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Server rejected the reservation checkout');
      }

      onBookingSuccess(resData);
    } catch (err: any) {
      setApiError(err.message || 'Network exception. Please retry checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl">
        {/* Glow corner elements */}
        <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-amber-500/10 blur-[80px] pointer-events-none rounded-full" />
        
        {/* Header bar */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40 relative z-10">
          <div>
            <span className="text-yellow-600 font-mono tracking-widest text-[9px] uppercase">Grooming Reservation Wizard</span>
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Slot Booking with <span className="text-yellow-500">{shop.name}</span>
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Outer scrolling content form */}
        <form onSubmit={handleCheckout} className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10">
          
          {/* Booking Type Selector */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Service Delivery Option</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBookingType('in-shop')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  bookingType === 'in-shop'
                    ? 'bg-[#D4AF37]/15 border-yellow-500/80 text-yellow-400'
                    : 'bg-zinc-900 border-white/5 hover:border-white/10 text-zinc-400'
                }`}
              >
                <Clock className="w-4 h-4" /> Traditional In-Shop Visit
              </button>
              
              <button
                type="button"
                disabled={!shop.homeService}
                onClick={() => setBookingType('home-service')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  !shop.homeService ? 'opacity-30 cursor-not-allowed' : ''
                } ${
                  bookingType === 'home-service'
                    ? 'bg-[#D4AF37]/15 border-yellow-500/80 text-yellow-400'
                    : 'bg-zinc-900 border-white/5 hover:border-white/10 text-zinc-400'
                }`}
              >
                <Truck className="w-4 h-4" /> Premium Home Service {!shop.homeService && '(Unavailable)'}
              </button>
            </div>
          </div>

          {/* Home Address Section */}
          {bookingType === 'home-service' && (
            <div className="space-y-3 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl animate-fadeIn">
              <div className="flex gap-2 text-yellow-500 text-xs font-bold">
                <MapPin className="w-4 h-4" /> Home Delivery Dispatch Address
              </div>
              <input
                type="text"
                required
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder="Enter complete Street, Apt number and landmarks"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500/50"
              />
              <p className="text-[10px] text-zinc-500">Notice: Exclusive dispatch home charging (₹250 flat rate) is bundled in final layout checkout.</p>
            </div>
          )}

          {/* Services Checklist */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Select Grooming Procedures</span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {shop.services.map((srv) => {
                const isSelected = selectedServiceIds.includes(srv.id);
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedServiceIds(selectedServiceIds.filter(id => id !== srv.id));
                      } else {
                        setSelectedServiceIds([...selectedServiceIds, srv.id]);
                      }
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex justify-between items-center transition ${
                      isSelected 
                        ? 'bg-zinc-900 border-yellow-500/40 text-white' 
                        : 'bg-zinc-900/40 border-white/5 hover:border-white/10 text-zinc-400'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{srv.name}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{srv.description}</p>
                      <span className="text-[9px] uppercase bg-zinc-800 text-yellow-500/80 px-1.5 py-0.5 rounded mr-2 mt-1 inline-block">
                        {srv.category}
                      </span>
                      <span className="text-[9px] text-zinc-400 mt-1 inline-block">
                        ⏱️ {srv.duration} mins
                      </span>
                    </div>
                    <div className="text-right font-mono text-sm font-bold text-yellow-400">
                      ₹{srv.price}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Staff selection */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Choose Professional Stylist</span>
            <div className="grid grid-cols-2 gap-2">
              {shop.barbers.map((barb) => {
                const isSelected = selectedBarberId === barb.id;
                return (
                  <button
                    key={barb.id}
                    type="button"
                    onClick={() => setSelectedBarberId(barb.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                      isSelected 
                        ? 'bg-zinc-900/90 border-[#D4AF37]/50 text-white' 
                        : 'bg-zinc-900/30 border-white/5 hover:border-white/15 text-zinc-400'
                    }`}
                  >
                    <img src={barb.avatar} alt={barb.name} className="w-8 h-8 rounded-full object-cover grayscale" />
                    <div>
                      <h5 className="text-xs font-bold text-white">{barb.name}</h5>
                      <p className="text-[10px] text-zinc-500 truncate">{barb.specialty}</p>
                      <span className="text-[9px] text-yellow-500">★ {barb.rating}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date and Time selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Service Date</span>
              <div className="relative">
                <input
                  type="date"
                  value={bookingDate}
                  min="2026-06-06"
                  max="2026-06-25"
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Available Slot Time</span>
              <select
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400/30"
              >
                {timeSlots.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Coupons section */}
          <div className="space-y-2 p-4 bg-zinc-950 border border-white/5 rounded-2xl">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block flex items-center gap-1">
              <Tag className="w-3 h-3" /> Festive Discount coupons
            </span>
            {appliedCoupon ? (
              <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-2 rounded-xl text-xs">
                <span className="font-bold">✓ Coupon Applied: {appliedCoupon.code} (-{appliedCoupon.discountPercent}%)</span>
                <button type="button" onClick={clearCoupon} className="text-zinc-400 hover:text-white">✕</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Insert Promo Code (e.g. GOLDSTYL)"
                  className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 rounded-xl px-4 py-1.5 text-xs font-semibold"
                >
                  Verify
                </button>
              </div>
            )}
            {couponError && <p className="text-[10px] text-red-400">{couponError}</p>}
          </div>

          {/* Special notes */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Special Styling instructions</span>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Please use low fragrance oils, standard clipper guards."
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>
        </form>

        {/* Bottom checkout action layout bar */}
        <div className="p-6 border-t border-white/5 bg-black/80 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Total Duration:</span>
              <span className="text-xs font-semibold text-white">{totalDuration} mins</span>
            </div>
            
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-mono font-bold text-yellow-500">₹{finalPrice.toFixed(2)}</span>
              {discountAmount > 0 && (
                <span className="text-xs text-zinc-500 line-through">₹{subtotal.toFixed(2)}</span>
              )}
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold flex-1 sm:flex-none text-center"
            >
              Cancel
            </button>
            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-200 text-zinc-950 font-bold rounded-xl text-xs hover:opacity-95 transition flex items-center justify-center gap-1.5 flex-1 sm:flex-none cursor-pointer"
            >
              {isSubmitting ? 'Confirming Appointment...' : `Confirm & Pay ₹${finalPrice.toFixed(2)}`}
            </button>
          </div>
        </div>

        {/* Api Error notice at the bottom banner */}
        {apiError && (
          <div className="absolute bottom-24 left-6 right-6 p-3 rounded-xl bg-red-950/90 border border-red-500/25 flex items-start gap-2 text-[11px] text-red-200 z-50">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
