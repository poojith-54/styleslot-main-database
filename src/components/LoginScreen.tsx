import React, { useState } from 'react';
import { supabase, isDemoMode } from '../supabase';
import { Sparkles, Mail, Lock, User, Phone, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

interface LoginScreenProps {
  onAuthSuccess: () => void;
}

export default function LoginScreen({ onAuthSuccess }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'owner' | 'barber'>('customer');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both username/email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      let loginEmail = email;

      if (!email.includes('@')) {
        if (isDemoMode) {
          loginEmail = `${email.replace(/\s+/g, '').toLowerCase()}@styleslot.com`;
        } else {
          const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('name', email)
            .maybeSingle();

          if (error) {
            throw new Error(`Profile lookup error: ${error.message}`);
          }
          if (data && data.email) {
            loginEmail = data.email;
          } else {
            throw new Error('No user profile found with that username.');
          }
        }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        onAuthSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setErrorMsg('Name, email, and password are required.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            phone
          }
        }
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setInfoMsg('Registration successful! Please check your email for a verification link.');
        setIsSignUp(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setInfoMsg('Password reset instructions sent to your email.');
        setIsForgotPassword(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic background styling */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#D4AF37]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-zinc-900/40 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-md bg-zinc-950/80 border border-yellow-500/20 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative z-10 space-y-6">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/10 border border-yellow-500/30">
            <Sparkles className="w-7 h-7 text-zinc-950 fill-zinc-950" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-200 bg-clip-text text-transparent">
              StyleSlot
            </h1>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Premium Grooming Portal</p>
          </div>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/35 text-red-400 text-xs px-4 py-3 rounded-xl">
            {errorMsg}
          </div>
        )}
        {infoMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-3 rounded-xl">
            {infoMsg}
          </div>
        )}

        {/* FORGOT PASSWORD FORM */}
        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <h2 className="text-lg font-bold text-white text-center">Reset VIP Access</h2>
            <p className="text-xs text-zinc-400 text-center leading-relaxed">
              Provide your registered email address and we will forward recovery credentials to regain entry.
            </p>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-98 transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
            </button>

            <p className="text-center text-xs text-zinc-400 pt-2">
              Remember password?{' '}
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="text-yellow-500 font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          </form>
        ) : (
          /* SIGN IN / SIGN UP FORM */
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
            <h2 className="text-xl font-bold text-white text-center">
              {isSignUp ? 'Join the Grooming Hub' : 'Enter the Sanctuary'}
            </h2>

            {/* Profile Info fields for Sign Up only */}
            {isSignUp && (
              <>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="tel"
                    placeholder="Phone (e.g. +1 (555) 000-0000)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
                  />
                </div>

                {/* Role selection row */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">Account Access Tier</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'customer', name: 'Customer' },
                      { id: 'owner', name: 'Shop Owner' },
                      { id: 'barber', name: 'Stylist/Staff' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setRole(t.id as any)}
                        className={`py-2 px-3 border rounded-xl text-xs font-semibold tracking-wide transition ${
                          role === t.id
                            ? 'bg-[#D4AF37]/15 border-yellow-500/50 text-yellow-400'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Email field (Sign Up only) */}
            {isSignUp && (
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>
            )}

            {/* Username or Email field (Sign In only) */}
            {!isSignUp && (
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="Username or Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>
            )}

            {/* Password field */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
              />
            </div>

            {/* Forgot password trigger (only in sign in) */}
            {!isSignUp && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-xs text-yellow-500/80 hover:text-yellow-400 hover:underline font-medium"
                >
                  Forgot Access Credentials?
                </button>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-98 transition disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Register Account' : 'Authenticate'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Navigation toggle */}
            <p className="text-center text-xs text-zinc-400 pt-2">
              {isSignUp ? 'Already have an account?' : 'New to StyleSlot?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className="text-yellow-500 font-semibold hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>

            {/* Visual disclaimer */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-1.5 text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" /> Secure SSL Authentication Enforced
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
