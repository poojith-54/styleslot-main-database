import React from 'react';
import { Booking, Barber } from '../types';
import { Briefcase, ClipboardCheck, DollarSign, Star, User, MapPin, CheckSquare, Clock } from 'lucide-react';

interface StylistWorkspaceProps {
  barber: Barber;
  bookings: Booking[];
  onCompleteBooking: (bookingId: string) => void;
}

export default function StylistWorkspace({ barber, bookings, onCompleteBooking }: StylistWorkspaceProps) {
  // Filter bookings belonging strictly to this barber
  const myAppointments = bookings.filter(b => b.barberId === barber.id || b.barberName === barber.name);
  const myCompleted = myAppointments.filter(b => b.status === 'completed');
  const myActive = myAppointments.filter(b => b.status === 'accepted');

  // Compute stats
  const earningsSum = myCompleted.reduce((sum, b) => sum + (b.totalPrice * 0.70), 0); // 70% employee share

  return (
    <div className="space-y-6">
      
      {/* Barber Profile Title */}
      <div className="relative p-6 rounded-3xl overflow-hidden border border-white/10 bg-zinc-950">
        <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-amber-500/5 blur-[80px] pointer-events-none rounded-full" />
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <img 
            src={barber.avatar} 
            alt={barber.name} 
            className="w-16 h-16 rounded-full object-cover border-2 border-yellow-500/40 grayscale"
          />
          <div className="text-center sm:text-left flex-1">
            <span className="px-2.5 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] uppercase tracking-widest rounded-full font-mono font-bold">
              Elite Senior Artisan Stylist
            </span>
            <h2 className="text-2xl font-bold text-white mt-1.5">{barber.name}</h2>
            <p className="text-zinc-400 text-xs mt-1">{barber.bio}</p>
          </div>
          
          <div className="flex gap-2 font-mono">
            <span className="bg-zinc-900 border border-white/5 py-1 px-3 rounded-lg text-yellow-400 text-xs flex items-center gap-1">
              ★ {barber.rating} rating
            </span>
          </div>
        </div>
      </div>

      {/* Stylist Stats Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Your Net Earnings</p>
            <p className="text-3xl font-mono font-bold text-emerald-400 mt-1">₹{earningsSum.toFixed(2)}</p>
            <p className="text-[10px] text-zinc-500 mt-1">Calculated as 70% commission share</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">My Queue Backlog</p>
            <p className="text-3xl font-mono font-bold text-yellow-400 mt-1">{myActive.length} Active</p>
            <p className="text-[10px] text-zinc-500 mt-1">Appointments scheduled for today</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Completed Jobs</p>
            <p className="text-3xl font-mono font-bold text-white mt-1">{myCompleted.length} cuts</p>
            <p className="text-[10px] text-zinc-500 mt-1">Groomed services finished</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-sky-400" />
          </div>
        </div>

      </div>

      {/* Roster agenda */}
      <div className="bg-zinc-950/80 border border-white/10 p-6 rounded-3xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4 text-yellow-500" /> Your Assigned Bookings Agenda
        </h3>

        {myAppointments.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            No booking records assigned to your slot portfolio. If you mapped yourself as a stylist inside a custom reserve task, it will display here.
          </div>
        ) : (
          <div className="space-y-4">
            {myAppointments.map((bk) => (
              <div 
                key={bk.id} 
                className={`p-4 rounded-2xl border transition-all ${
                  bk.status === 'accepted' 
                    ? 'border-yellow-500/30 bg-yellow-500/5' 
                    : 'border-white/5 bg-zinc-900/40 opacity-70'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-full ${
                        bk.type === 'home-service' 
                          ? 'bg-amber-500/20 text-yellow-400 border border-yellow-500/30' 
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {bk.type === 'home-service' ? '🏠 Home dispatch dispatch' : '💈 In-Shop appointment'}
                      </span>
                      <span className="text-zinc-500 text-[10px]">&bull; {bk.date} @ {bk.time}</span>
                    </div>

                    <h4 className="font-bold text-white text-xs mt-2">
                       {bk.serviceNames.join(' + ')}
                    </h4>
                    
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs mt-1">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Customer: {bk.customerName} &bull; {bk.customerPhone}</span>
                    </div>

                    {bk.type === 'home-service' && bk.address && (
                      <div className="flex items-center gap-1.5 text-yellow-500/85 text-xs mt-1.5 font-sans font-medium">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Dispatch Address: {bk.address}</span>
                      </div>
                    )}

                    {bk.notes && (
                      <p className="text-[10px] text-zinc-500 bg-zinc-950 p-2 rounded-lg border border-white/5 mt-2 italic">
                        Style specifications: "{bk.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-row sm:flex-col items-end gap-2 shrink-0">
                    <span className="text-xs text-zinc-500 font-mono">Commission base: ₹{(bk.totalPrice * 0.7).toFixed(2)}</span>
                    <span className={`px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider rounded-lg uppercase ${
                      bk.status === 'completed' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-zinc-400 bg-zinc-800'
                    }`}>{bk.status}</span>
                    
                    {bk.status === 'accepted' && (
                      <button
                        onClick={() => onCompleteBooking(bk.id)}
                        className="mt-2 py-1.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/5 cursor-pointer hover:scale-[1.02] active:scale-95 transition"
                      >
                        <ClipboardCheck className="w-4 h-4" /> Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
