import React, { useState } from 'react';
import { Shop, Booking, UserProfile, Coupon, Membership } from '../types';
import { 
  Shield, Sparkles, Building, Coins, BadgeCheck, FileText, 
  Users, Settings2, Tag, Calendar, Layers, Save, Plus, Trash2, 
  HelpCircle, Star, Phone, MapPin, Eye, Palette
} from 'lucide-react';

interface AdminConsoleProps {
  shops: Shop[];
  bookings: Booking[];
  profile: UserProfile;
  cmsData: any;
  users: UserProfile[];
  coupons: Coupon[];
  memberships: Membership[];
  onToggleShopVerify: (shopId: string, currentStatus: boolean) => void;
  onUpdateCms: (key: string, value: any) => Promise<void>;
  onUpdateUserRole: (userId: string, newRole: 'customer' | 'owner' | 'barber' | 'admin') => Promise<void>;
  onRefreshData: () => void;
}

type TabType = 'overview' | 'users' | 'shops' | 'cms' | 'promotions';

export default function AdminConsole({ 
  shops, bookings, profile, cmsData, users, coupons, memberships,
  onToggleShopVerify, onUpdateCms, onUpdateUserRole, onRefreshData 
}: AdminConsoleProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [savingCms, setSavingCms] = useState(false);

  // local states for CMS forms
  const [heroTitle, setHeroTitle] = useState(cmsData.hero_section?.title || '');
  const [heroSubtitle, setHeroSubtitle] = useState(cmsData.hero_section?.subtitle || '');
  const [heroBanner, setHeroBanner] = useState(cmsData.hero_section?.banner || '');

  const [businessName, setBusinessName] = useState(cmsData.theme_settings?.business_name || 'StyleSlot');
  const [logoUrl, setLogoUrl] = useState(cmsData.theme_settings?.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(cmsData.theme_settings?.primary_color || '#D4AF37');
  const [secondaryColor, setSecondaryColor] = useState(cmsData.theme_settings?.secondary_color || '#18181B');

  const [aboutTitle, setAboutTitle] = useState(cmsData.about_section?.title || '');
  const [aboutContent, setAboutContent] = useState(cmsData.about_section?.content || '');
  const [aboutImage, setAboutImage] = useState(cmsData.about_section?.image || '');

  const [phone, setPhone] = useState(cmsData.contact_details?.phone || '');
  const [email, setEmail] = useState(cmsData.contact_details?.email || '');
  const [address, setAddress] = useState(cmsData.contact_details?.address || '');
  const [workingHours, setWorkingHours] = useState(cmsData.contact_details?.working_hours || '');

  // FAQs local list
  const [faqList, setFaqList] = useState<Array<{question: string, answer: string}>>(cmsData.faqs || []);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  // Save specific CMS section
  const handleSaveCmsSection = async (sectionKey: string, payload: any) => {
    setSavingCms(true);
    try {
      await onUpdateCms(sectionKey, payload);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingCms(false);
    }
  };

  // FAQs management helpers
  const handleAddFaq = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    const updated = [...faqList, { question: newQuestion, answer: newAnswer }];
    setFaqList(updated);
    setNewQuestion('');
    setNewAnswer('');
    await handleSaveCmsSection('faqs', updated);
  };

  const handleRemoveFaq = async (idx: number) => {
    const updated = faqList.filter((_, i) => i !== idx);
    setFaqList(updated);
    await handleSaveCmsSection('faqs', updated);
  };

  // Analytics Metrics
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const totalVolume = bookings.reduce((sum, b) => sum + Number(b.totalPrice), 0);
  const platformEarnings = completedBookings.reduce((sum, b) => sum + (Number(b.totalPrice) * 0.3), 0);
  const activeBookingsCount = bookings.filter(b => b.status === 'pending' || b.status === 'accepted').length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl border border-yellow-500/20 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black relative overflow-hidden">
        <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-[#D4AF37]/5 blur-[80px] pointer-events-none rounded-full" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] uppercase tracking-widest rounded-full font-mono font-bold flex items-center gap-1">
                <Shield className="w-3 h-3" /> Master Control Desk
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1.5 tracking-tight">StyleSlot Network Operations Console</h2>
            <p className="text-zinc-400 text-xs mt-1">Supervise memberships, verify salons, adjust roles, and customize website content live.</p>
          </div>
          <button 
            onClick={onRefreshData}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            Refresh Network Data
          </button>
        </div>
      </div>

      {/* Tabs navigation pill row */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-950 rounded-2xl border border-white/5 max-w-max">
        {[
          { id: 'overview', name: 'Overview Dashboard', icon: Layers },
          { id: 'users', name: 'User Directory', icon: Users },
          { id: 'shops', name: 'Salon Registry', icon: Building },
          { id: 'cms', name: 'CMS Website Content', icon: Settings2 },
          { id: 'promotions', name: 'Marketing Coupons', icon: Tag }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as TabType)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-2 ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 font-bold shadow-md shadow-yellow-500/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-white">
            <div className="bg-zinc-950 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-2 right-2 p-1.5 bg-yellow-500/10 rounded-lg"><Coins className="w-4 h-4 text-yellow-400" /></div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Platform Commission (30%)</p>
              <p className="text-3xl font-mono font-bold text-yellow-500 mt-2">₹{platformEarnings.toFixed(2)}</p>
              <p className="text-[10px] text-zinc-500 mt-1">Generated from completed visits</p>
            </div>

            <div className="bg-zinc-950 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-2 right-2 p-1.5 bg-white/5 rounded-lg"><FileText className="w-4 h-4 text-zinc-400" /></div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Gross Transaction Volume</p>
              <p className="text-3xl font-mono font-bold text-white mt-2">₹{totalVolume.toFixed(2)}</p>
              <p className="text-[10px] text-zinc-500 mt-1">From total appointments booked</p>
            </div>

            <div className="bg-zinc-950 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-2 right-2 p-1.5 bg-white/5 rounded-lg"><Calendar className="w-4 h-4 text-zinc-400" /></div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Active Bookings Queue</p>
              <p className="text-3xl font-bold text-white mt-2">{activeBookingsCount} Slots</p>
              <p className="text-[10px] text-zinc-500 mt-1">Pending and accepted status</p>
            </div>

            <div className="bg-zinc-950 border border-white/10 rounded-2xl p-5 relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-500/5">
              <div className="absolute top-2 right-2 p-1.5 bg-yellow-500/10 rounded-lg"><Users className="w-4 h-4 text-yellow-400" /></div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Registered Accounts</p>
              <p className="text-3xl font-bold text-yellow-400 mt-2">{users.length} Users</p>
              <p className="text-[10px] text-zinc-500 mt-1">{shops.length} partner salons active</p>
            </div>
          </div>

          {/* Simple Custom Analytical Chart (SVG) */}
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 text-white space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" /> Platform Transaction Trend (Simulated)
            </h3>
            <div className="h-48 w-full flex items-end justify-between gap-4 pt-4 font-mono text-[10px] text-zinc-500 border-b border-white/10 pb-2">
              {[
                { label: 'Jan', val: 32 }, { label: 'Feb', val: 45 }, { label: 'Mar', val: 68 }, 
                { label: 'Apr', val: 55 }, { label: 'May', val: 80 }, { label: 'Jun', val: 120 },
                { label: 'Jul (Now)', val: 142 }
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[9px] text-yellow-500/80 hidden group-hover:block transition-all">${bar.val * 10}</span>
                  <div 
                    className="w-full bg-gradient-to-t from-yellow-700 to-yellow-400 rounded-t-lg transition-all duration-1000 group-hover:from-yellow-600 group-hover:to-yellow-300"
                    style={{ height: `${(bar.val / 150) * 100}%` }}
                  />
                  <span>{bar.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Operations Log list */}
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 text-white space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Recent System Events
            </h3>
            <div className="space-y-3 font-mono text-xs text-zinc-400">
              {bookings.slice(0, 5).map((b, i) => (
                <div key={i} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      b.status === 'completed' ? 'bg-emerald-500' :
                      b.status === 'accepted' ? 'bg-blue-500' : 'bg-yellow-500'
                    }`} />
                    <span>Booking {b.id} ({b.customerName}) on {b.date}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">{b.status.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. USERS TAB */}
      {activeTab === 'users' && (
        <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 text-white space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center pb-4 border-b border-white/5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-yellow-500" /> Platform Accounts ({users.length})
            </h3>
          </div>

          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="p-4 bg-zinc-900 border border-white/5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white text-xs">{u.name}</span>
                    <span className={`px-2 py-0.5 text-[8px] font-bold font-mono border rounded uppercase ${
                      u.role === 'admin' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                      u.role === 'owner' ? 'bg-amber-500/15 border-yellow-500/30 text-yellow-400' :
                      u.role === 'barber' ? 'bg-zinc-800 border-zinc-700 text-zinc-300' :
                      'bg-zinc-950 border-zinc-800 text-zinc-500'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono">{u.email} &bull; {u.phone || 'No phone'}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">Loyalty Points: <span className="text-yellow-500 font-bold">{u.loyaltyPoints} pts</span></p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Change Account Role:</span>
                  <select
                    value={u.role}
                    onChange={(e) => onUpdateUserRole(u.id, e.target.value as any)}
                    className="bg-zinc-950 border border-zinc-800 text-[10px] text-yellow-500 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-yellow-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="owner">Shop Owner</option>
                    <option value="barber">Barber / Stylist</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SALON REGISTRY TAB */}
      {activeTab === 'shops' && (
        <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 text-white space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Building className="w-4 h-4 text-yellow-500" /> Active Salon Registrations ({shops.length})
          </h3>

          <div className="space-y-3">
            {shops.map((shop) => (
              <div key={shop.id} className="p-4 bg-zinc-900 border border-white/5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-4">
                  <img src={shop.image} alt={shop.name} className="w-14 h-14 object-cover rounded-xl shrink-0 border border-white/10 grayscale" />
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-xs font-bold text-white">{shop.name}</h4>
                      {shop.isVerified ? (
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 border border-emerald-500/30 rounded font-mono font-bold">VERIFIED</span>
                      ) : (
                        <span className="text-[8px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.2 border border-yellow-500/25 rounded font-mono font-bold">PENDING BADGE</span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">{shop.address}</p>
                    <p className="text-[9px] text-zinc-500 font-mono mt-1">
                      {shop.barbers.length} stylists rostered &bull; Categories: {shop.categories.join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-mono text-zinc-400">Verification Badge:</span>
                  <button
                    onClick={() => onToggleShopVerify(shop.id, shop.isVerified)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 flex items-center shrink-0 ${
                      shop.isVerified ? 'bg-emerald-500 justify-end' : 'bg-zinc-800 justify-start'
                    }`}
                    title="Toggle verification badge"
                  >
                    <span className="w-4 h-4 rounded-full bg-zinc-950 block shadow-md"></span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CMS CONTENT EDITOR TAB */}
      {activeTab === 'cms' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Identity & Aesthetics Section */}
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 text-white space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Palette className="w-5 h-5 text-yellow-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Brand Identity & Color Themes</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Logo Image URL</label>
                <input
                  type="text"
                  value={logoUrl}
                  placeholder="https://example.com/logo.png"
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Primary Accent Color (Hex)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-9 bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Secondary Theme Color (Hex)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-9 bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={savingCms}
                onClick={() => handleSaveCmsSection('theme_settings', { business_name: businessName, logo_url: logoUrl, primary_color: primaryColor, secondary_color: secondaryColor })}
                className="px-4 py-2 bg-[#D4AF37] hover:bg-yellow-600 text-zinc-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
              >
                <Save className="w-3.5 h-3.5" /> Save Theme Settings
              </button>
            </div>
          </div>

          {/* Hero Banner Section Editor */}
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 text-white space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <FileText className="w-5 h-5 text-yellow-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Homepage Hero Banner Section</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Main Title Text</label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Subtitle Description</label>
                <textarea
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Background Image URL</label>
                <input
                  type="text"
                  value={heroBanner}
                  onChange={(e) => setHeroBanner(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={savingCms}
                onClick={() => handleSaveCmsSection('hero_section', { title: heroTitle, subtitle: heroSubtitle, banner: heroBanner })}
                className="px-4 py-2 bg-[#D4AF37] hover:bg-yellow-600 text-zinc-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
              >
                <Save className="w-3.5 h-3.5" /> Save Hero Section
              </button>
            </div>
          </div>

          {/* About Us Section */}
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 text-white space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Layers className="w-5 h-5 text-yellow-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">About Us / Legacy Section</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">About Title</label>
                <input
                  type="text"
                  value={aboutTitle}
                  onChange={(e) => setAboutTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">About Body Content</label>
                <textarea
                  value={aboutContent}
                  onChange={(e) => setAboutContent(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Legacy Section Image URL</label>
                <input
                  type="text"
                  value={aboutImage}
                  onChange={(e) => setAboutImage(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={savingCms}
                onClick={() => handleSaveCmsSection('about_section', { title: aboutTitle, content: aboutContent, image: aboutImage })}
                className="px-4 py-2 bg-[#D4AF37] hover:bg-yellow-600 text-zinc-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
              >
                <Save className="w-3.5 h-3.5" /> Save About Section
              </button>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 text-white space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Phone className="w-5 h-5 text-yellow-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Contact Information & Operations</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Contact Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">HQ Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Global Working Hours</label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={savingCms}
                onClick={() => handleSaveCmsSection('contact_details', { phone, email, address, working_hours: workingHours })}
                className="px-4 py-2 bg-[#D4AF37] hover:bg-yellow-600 text-zinc-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
              >
                <Save className="w-3.5 h-3.5" /> Save Contact Details
              </button>
            </div>
          </div>

          {/* FAQs Manager */}
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 text-white space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <HelpCircle className="w-5 h-5 text-yellow-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Frequently Asked Questions (FAQs)</h3>
            </div>

            {/* List current FAQs */}
            <div className="space-y-3">
              {faqList.map((faq, i) => (
                <div key={i} className="p-3 bg-zinc-900 border border-white/5 rounded-xl flex justify-between items-start gap-4">
                  <div>
                    <h5 className="text-xs font-bold text-yellow-400">Q: {faq.question}</h5>
                    <p className="text-[11px] text-zinc-400 mt-1">A: {faq.answer}</p>
                  </div>
                  <button 
                    onClick={() => handleRemoveFaq(i)}
                    className="p-1 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded-md transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new FAQ */}
            <div className="p-4 bg-black/40 border border-zinc-800 rounded-2xl space-y-3 pt-3">
              <h4 className="text-xs font-bold text-white">Add New FAQ Accordion</h4>
              <div className="grid grid-cols-1 gap-2.5">
                <input
                  type="text"
                  placeholder="Question text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
                <textarea
                  placeholder="Answer explanation"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add FAQ
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 5. PROMOTIONS & MARKETING COUPONS */}
      {activeTab === 'promotions' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Coupon codes list */}
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 text-white space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Tag className="w-4 h-4 text-yellow-500" /> Active Marketing Coupons ({coupons.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {coupons.map((c) => (
                <div key={c.code} className="p-4 bg-zinc-900 border border-white/5 rounded-2xl flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-yellow-400 text-xs tracking-wider bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded-lg">{c.code}</span>
                      <span className="text-[10px] text-emerald-400 font-bold">{c.discountPercent}% OFF</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">{c.description}</p>
                    <p className="text-[8px] text-zinc-500 mt-0.5">Min booking: ₹{c.minBookingValue} &bull; Expiry: {c.expiryDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
