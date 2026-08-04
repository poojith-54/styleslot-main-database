import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Shield, Sparkles, User, Scissors, Briefcase, PlusCircle, LogIn, Coins } from 'lucide-react';

interface RoleSwitcherProps {
  profile: UserProfile;
  currentRole: string;
  onRoleChange: (role: 'customer' | 'owner' | 'barber' | 'admin') => void;
  onTopUp: (amount: number) => void;
}

export default function RoleSwitcher({ profile, currentRole, onRoleChange, onTopUp }: RoleSwitcherProps) {
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [amount, setAmount] = useState('50');

  const roles = [
    { id: 'customer', name: 'Customer App', icon: User, color: 'from-amber-500 to-amber-600', desc: 'Book & discover stylists' },
    { id: 'owner', name: 'Shop Owner Portal', icon: Scissors, color: 'from-yellow-600 to-yellow-700', desc: 'Manage staff, catalog & analytics' },
    { id: 'barber', name: 'Stylist Workspace', icon: Briefcase, color: 'from-zinc-700 to-zinc-900', desc: 'Personal schedule & earnings' },
    { id: 'admin', name: 'Admin Console', icon: Shield, color: 'from-amber-700 to-amber-950', desc: 'Verify shops & view platform revenue' }
  ];

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
      onTopUp(val);
      setTopUpOpen(false);
    }
  };

  return (
    <div className="bg-zinc-950 border-b border-yellow-500/20 text-white py-3 px-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/10 border border-yellow-500/30">
            <Sparkles className="w-5 h-5 text-zinc-950 fill-zinc-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-200 bg-clip-text text-transparent font-sans">
              StyleSlot
            </h1>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Premium Grooming Hub</p>
          </div>
        </div>

        {/* Demo Simulator Controller */}
        <div className="flex flex-wrap items-center justify-center gap-2 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          {roles.map((r) => {
            const Icon = r.icon;
            const isActive = currentRole === r.id;
            return (
              <button
                key={r.id}
                id={`btn-role-${r.id}`}
                onClick={() => onRoleChange(r.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 font-bold shadow-md shadow-yellow-500/10'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title={r.desc}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{r.name}</span>
              </button>
            );
          })}
        </div>

        {/* User Balance & Simulation Tools */}
        <div className="flex items-center gap-3">
          {/* Wallet Mini-pill */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
            <Coins className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-[10px] text-zinc-400">Wallet Balance</p>
              <p className="font-mono font-bold text-yellow-400">₹{profile.walletBalance.toFixed(2)}</p>
            </div>
            <button
              id="btn-wallet-topup-trigger"
              onClick={() => setTopUpOpen(!topUpOpen)}
              className="ml-1 p-1 bg-amber-500/10 hover:bg-amber-500/30 text-amber-400 rounded-md transition-colors"
              title="Add simulated funds"
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Loyalty reward points */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 hidden sm:flex flex-col text-right text-xs">
            <p className="text-[10px] text-zinc-400">Loyalty Points</p>
            <p className="font-mono font-semibold text-yellow-500">{profile.loyaltyPoints} pts</p>
          </div>

          <div className="hidden lg:flex flex-col text-xs max-w-[130px]">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">SIM ACTIVE USER</p>
            <p className="font-medium truncate text-zinc-300">{profile.name}</p>
          </div>
        </div>
      </div>

      {/* TopUp Popover Modal */}
      {topUpOpen && (
        <div className="absolute top-16 right-4 bg-zinc-900 border border-yellow-500/30 p-4 rounded-xl shadow-2xl z-50 w-72 backdrop-blur-md">
          <form onSubmit={handleDeposit} className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-yellow-500 flex items-center gap-1.5">
              <Coins className="w-4 h-4" /> Top up Sandbox Funds
            </h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Deduct/deposit virtual money safely to test booking workflows, coupons, and premium models.
            </p>
            <div className="flex gap-2">
              <span className="bg-zinc-800 text-zinc-400 px-3 py-2 rounded-lg text-sm border border-zinc-700 font-mono flex items-center">₹</span>
              <input
                type="number"
                id="input-top-up-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                placeholder="500"
                className="bg-zinc-950 border border-zinc-800 rounded-lg py-1 px-3 text-sm focus:outline-none focus:border-yellow-500/50 flex-1 font-mono text-yellow-400"
              />
            </div>
            <div className="flex justify-end gap-2 text-xs pt-1">
              <button
                type="button"
                onClick={() => setTopUpOpen(false)}
                className="px-2.5 py-1.5 text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-confirm-topup"
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 rounded-lg font-semibold hover:opacity-95"
              >
                Add ₹
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
