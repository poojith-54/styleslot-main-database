import React, { useState } from 'react';
import { Shop, Service, Barber, Booking } from '../types';
import { Scissors, DollarSign, Users, Award, Plus, Check, X, ClipboardList, TrendingUp } from 'lucide-react';

interface OwnerDashboardProps {
  ownerShop: Shop;
  bookings: Booking[];
  onAcceptBooking: (bookingId: string) => void;
  onRejectBooking: (bookingId: string) => void;
  onAddBarber: (shopId: string, barberData: any) => void;
  onAddService: (shopId: string, serviceData: any) => void;
}

export default function OwnerDashboard({
  ownerShop,
  bookings,
  onAcceptBooking,
  onRejectBooking,
  onAddBarber,
  onAddService
}: OwnerDashboardProps) {
  // Navigation
  const [activeSegment, setActiveSegment] = useState<'bookings' | 'staff' | 'services'>('bookings');

  // Form states - Add Barber
  const [bName, setBName] = useState('');
  const [bSpecialty, setBSpecialty] = useState('');
  const [bBio, setBBio] = useState('');
  const [bAvatar, setBAvatar] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150');

  // Form states - Add Service
  const [sName, setSName] = useState('');
  const [sCategory, setSCategory] = useState('Haircut');
  const [sPrice, setSPrice] = useState('');
  const [sDuration, setSDuration] = useState('30');
  const [sDesc, setSDesc] = useState('');

  // Local notifications/feedback
  const [successMsg, setSuccessMsg] = useState('');

  // Analytics helper metrics
  const ownBookings = bookings.filter(b => b.shopId === ownerShop.id);
  const completedBookings = ownBookings.filter(b => b.status === 'completed');
  const activeEarnings = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalBarberSalariesOffset = ownerShop.barbers.reduce((sum, b) => sum + (b.earnings || 0), 0);
  const netShopProfit = activeEarnings * 0.3 + (activeEarnings - totalBarberSalariesOffset); // 30% platform commission logic

  const handleSubmitBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName) return;
    onAddBarber(ownerShop.id, { name: bName, specialty: bSpecialty, bio: bBio, avatar: bAvatar });
    setBName('');
    setBSpecialty('');
    setBBio('');
    setSuccessMsg('Stylist successfully registered to workforce roster!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSubmitService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName || !sPrice) return;
    onAddService(ownerShop.id, {
      name: sName,
      category: sCategory,
      price: parseFloat(sPrice),
      duration: parseInt(sDuration),
      description: sDesc
    });
    setSName('');
    setSPrice('');
    setSDesc('');
    setSuccessMsg('Grooming service added to pricing catalog!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Gold Header banner */}
      <div className="relative p-6 rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-zinc-900 to-black">
        <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-yellow-500/10 blur-[80px] pointer-events-none rounded-full" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-[9px] uppercase tracking-widest rounded-full font-mono font-bold">
                Level-1 Partner Verified
              </span>
              {ownerShop.isVerified && (
                <span className="text-[10px] text-emerald-400 font-bold">✓ Active Verification badge</span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mt-1.5">{ownerShop.name} Shop Portal</h2>
            <p className="text-zinc-400 text-xs mt-1">Manage catalog schedules, barber payroll commissions and review operations.</p>
          </div>
          
          <div className="flex gap-2">
            <span className="text-xs bg-zinc-950 border border-white/5 px-3 py-2 rounded-xl text-zinc-300">
              📍 {ownerShop.address}
            </span>
          </div>
        </div>
      </div>

      {/* Analytics dashboard widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex justify-between items-center text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
            <DollarSign className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-mono font-bold text-white">₹{activeEarnings.toFixed(2)}</p>
          <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" /> +15.5% versus last week
          </div>
        </div>

        {/* Metric Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex justify-between items-center text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Profit</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-emerald-400">₹{netShopProfit.toFixed(2)}</p>
          <p className="text-[10px] text-zinc-500 mt-1">After 70% commission stylist payouts</p>
        </div>

        {/* Metric Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex justify-between items-center text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Staff</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-semibold text-white">{ownerShop.barbers.length} Active</p>
          <p className="text-[10px] text-zinc-500 mt-1">Available for home reservation</p>
        </div>

        {/* Metric Card */}
        <div className="bg-white/5 border border-[#D4AF37]/35 rounded-2xl p-4 backdrop-blur-md bg-yellow-500/5">
          <div className="flex justify-between items-center text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Satisfaction</span>
            <Scissors className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-semibold text-white">★ {ownerShop.rating}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Calculated from {ownerShop.reviewsCount} reviews</p>
        </div>

      </div>

      {/* Roster Controls & Navigation */}
      <div className="bg-zinc-950/80 border border-white/10 rounded-3xl overflow-hidden">
        
        {/* Menu selections */}
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setActiveSegment('bookings')}
            className={`flex-1 py-3.5 text-center font-bold tracking-widest text-xs uppercase transition ${
              activeSegment === 'bookings' ? 'bg-[#D4AF37]/15 text-yellow-400 border-b-2 border-[#D4AF37]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Manage Bookings ({ownBookings.length})
          </button>
          
          <button
            onClick={() => setActiveSegment('staff')}
            className={`flex-1 py-3.5 text-center font-bold tracking-widest text-xs uppercase transition ${
              activeSegment === 'staff' ? 'bg-[#D4AF37]/15 text-yellow-400 border-b-2 border-[#D4AF37]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Stylists Workforce
          </button>

          <button
            onClick={() => setActiveSegment('services')}
            className={`flex-1 py-3.5 text-center font-bold tracking-widest text-xs uppercase transition ${
              activeSegment === 'services' ? 'bg-[#D4AF37]/15 text-yellow-400 border-b-2 border-[#D4AF37]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Services Catalog
          </button>
        </div>

        {/* Notification feedback banners */}
        {successMsg && (
          <div className="m-4 p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs rounded-xl font-bold text-center">
            {successMsg}
          </div>
        )}

        {/* Tab displays */}
        <div className="p-6">
          
          {/* BOOKINGS TABLE */}
          {activeSegment === 'bookings' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-2">
                <ClipboardList className="w-4 h-4 text-yellow-500" /> Incoming Appointment Queues
              </h3>

              {ownBookings.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  Zero active appointments received. Try switching roles to "Customer App" on top and book a service!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ownBookings.map((bk) => (
                    <div 
                      key={bk.id} 
                      className={`p-4 rounded-2xl border transition ${
                        bk.status === 'pending' 
                          ? 'border-yellow-500/35 bg-yellow-500/5' 
                          : 'border-white/5 bg-zinc-900/60'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-full ${
                            bk.type === 'home-service' 
                              ? 'bg-[#D4AF37]/35 text-yellow-400' 
                              : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            {bk.type === 'home-service' ? '🏠 Home Dispatch' : '💈 In-Shop Visit'}
                          </span>
                          <h4 className="font-bold text-white text-xs mt-2 truncate w-48">
                            {bk.serviceNames.join(' + ')}
                          </h4>
                        </div>
                        <span className="text-xs font-mono font-bold text-yellow-400">₹{bk.totalPrice}</span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-zinc-400 border-y border-white/5 py-2">
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase font-mono">Customer</p>
                          <p className="font-semibold text-white">{bk.customerName}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase font-mono">Assigned Barber</p>
                          <p className="font-semibold text-white">{bk.barberName}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase font-mono">Time</p>
                          <p className="font-semibold text-white">{bk.date} @ {bk.time}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase font-mono">Status</p>
                          <p className={`font-mono uppercase font-bold text-[10px] ${
                            bk.status === 'pending' ? 'text-yellow-400' :
                            bk.status === 'accepted' ? 'text-emerald-400' :
                            bk.status === 'completed' ? 'text-blue-400 animate-pulse' : 'text-rose-400'
                          }`}>{bk.status}</p>
                        </div>
                      </div>

                      {bk.notes && (
                        <p className="text-[10px] bg-black/40 text-yellow-500/80 p-2 rounded-lg border border-yellow-500/10 mt-2 italic">
                          "{bk.notes}"
                        </p>
                      )}

                      {/* Action controllers */}
                      {bk.status === 'pending' && (
                        <div className="flex gap-2 mt-4 text-xs pt-1">
                          <button
                            onClick={() => onRejectBooking(bk.id)}
                            className="flex-1 py-1 px-3 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 flex items-center justify-center gap-1 cursor-pointer font-bold"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                          
                          <button
                            onClick={() => onAcceptBooking(bk.id)}
                            className="flex-1 py-1 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept Appointment
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STAFF MANAGEMENT */}
          {activeSegment === 'staff' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Add Barber Form */}
              <div className="lg:col-span-4 bg-zinc-900/60 border border-white/5 p-4 rounded-2xl">
                <h4 className="text-xs font-bold uppercase text-yellow-500 tracking-wider mb-3">Register New Stylist</h4>
                <form onSubmit={handleSubmitBarber} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Stylist Name</label>
                    <input
                      required
                      type="text"
                      value={bName}
                      onChange={(e) => setBName(e.target.value)}
                      placeholder="e.g. David Beckham"
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Expertise / Specialty</label>
                    <input
                      required
                      type="text"
                      value={bSpecialty}
                      onChange={(e) => setBSpecialty(e.target.value)}
                      placeholder="e.g. Razor Fades & Beards"
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Brief Bio</label>
                    <textarea
                      value={bBio}
                      onChange={(e) => setBBio(e.target.value)}
                      placeholder="e.g. Over 8 years trimming luxury profiles globally."
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none h-16 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Enlist Member
                  </button>
                </form>
              </div>

              {/* Roster List */}
              <div className="lg:col-span-8 space-y-3">
                <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Active Staff Portfolio</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ownerShop.barbers.map((b) => (
                    <div key={b.id} className="p-4 bg-zinc-900 border border-white/5 rounded-2xl flex gap-3">
                      <img src={b.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'} alt={b.name} className="w-12 h-12 rounded-full object-cover shrink-0 grayscale" />
                      <div>
                        <h5 className="text-xs font-bold text-white">{b.name}</h5>
                        <p className="text-[10px] text-yellow-500 mt-0.5">★ {b.rating} Verified rating</p>
                        <p className="text-[10px] text-zinc-400 mt-1">{b.specialty}</p>
                        {b.earnings !== undefined && (
                          <div className="mt-2 text-[10px] font-mono text-emerald-400 font-bold">
                            Stylist Commission: ₹{b.earnings.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* SERVICE CATALOG DESIGN */}
          {activeSegment === 'services' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Add Service form */}
              <div className="lg:col-span-4 bg-zinc-900/60 border border-white/5 p-4 rounded-2xl">
                <h4 className="text-xs font-bold uppercase text-yellow-500 tracking-wider mb-3">Add Custom Grooming Procedure</h4>
                <form onSubmit={handleSubmitService} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Service Label Name</label>
                    <input
                      required
                      type="text"
                      value={sName}
                      onChange={(e) => setSName(e.target.value)}
                      placeholder="e.g. Golden Clay Razor Shave"
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Rate Price (₹)</label>
                      <input
                        required
                        type="number"
                        value={sPrice}
                        onChange={(e) => setSPrice(e.target.value)}
                        placeholder="25"
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Minutes</label>
                      <select
                        value={sDuration}
                        onChange={(e) => setSDuration(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="15">15 min</option>
                        <option value="30">30 min</option>
                        <option value="45">45 min</option>
                        <option value="60">60 min</option>
                        <option value="90">90 min</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-mono">Category</label>
                    <select
                      value={sCategory}
                      onChange={(e) => setSCategory(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="Haircut">Haircut</option>
                      <option value="Beard Styling">Beard Styling</option>
                      <option value="Hair Spa">Hair Spa</option>
                      <option value="Hair Coloring">Hair Coloring</option>
                      <option value="Facial">Facial</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-mono">Description</label>
                    <textarea
                      value={sDesc}
                      onChange={(e) => setSDesc(e.target.value)}
                      placeholder="Give unique details or features (e.g. aloe balm treatment included)."
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none h-16 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Push to Catalog
                  </button>
                </form>
              </div>

              {/* Roster list */}
              <div className="lg:col-span-8 space-y-3">
                <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Registered Catalog list</h4>
                <div className="space-y-2">
                  {ownerShop.services.map((srv) => (
                    <div key={srv.id} className="p-3.5 bg-zinc-900 border border-white/5 rounded-2xl flex justify-between items-center">
                      <div>
                        <h5 className="text-xs font-bold text-white">{srv.name}</h5>
                        <p className="text-[10px] text-zinc-500 mt-1">{srv.description}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[8px] bg-zinc-800 text-yellow-500 font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                            {srv.category}
                          </span>
                          <span className="text-[8px] text-zinc-400 font-mono">⏱️ {srv.duration} mins duration</span>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold text-yellow-400">₹{srv.price}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
