import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Detect if we are in demo mode (missing keys or placeholders)
export const isDemoMode = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.includes('YOUR_PROJECT_ID') || 
  supabaseUrl.includes('your-project-id') || 
  supabaseAnonKey.includes('eyJhbGciOi...');

export let supabase: any;

if (isDemoMode) {
  console.warn('StyleSlot is starting in local DEMO mode. Mocking Supabase authentication.');
  
  // Set up in-memory auth mock
  let mockUser: any = {
    id: 'mock-user-123',
    email: 'demo@styleslot.com',
    user_metadata: {
      name: 'Demo Client',
      role: 'customer'
    }
  };

  // Base64 helper to pass user details to backend
  const encodeMockToken = (user: any) => {
    try {
      return btoa(JSON.stringify(user));
    } catch (e) {
      return 'mock-jwt-token-xyz';
    }
  };

  let mockSession: any = {
    access_token: encodeMockToken(mockUser),
    user: mockUser
  };

  const mockListeners = new Set<any>();

  supabase = {
    auth: {
      getSession: async () => ({ data: { session: mockSession } }),
      onAuthStateChange: (callback: any) => {
        mockListeners.add(callback);
        // Dispatch signed in event if session is preset
        if (mockSession) {
          setTimeout(() => callback('SIGNED_IN', mockSession), 0);
        } else {
          setTimeout(() => callback('SIGNED_OUT', null), 0);
        }
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                mockListeners.delete(callback);
              }
            }
          }
        };
      },
      signInWithPassword: async ({ email, password }: any) => {
        // Automatically succeed in demo mode
        let resolvedName = 'Demo Client';
        if (email && email.endsWith('@styleslot.com')) {
          const rawName = email.split('@')[0];
          resolvedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        }
        mockUser = {
          id: 'mock-user-123',
          email: email || 'demo@styleslot.com',
          user_metadata: {
            name: resolvedName,
            role: 'customer'
          }
        };
        mockSession = {
          access_token: encodeMockToken(mockUser),
          user: mockUser
        };
        mockListeners.forEach(cb => cb('SIGNED_IN', mockSession));
        return { data: { session: mockSession, user: mockUser }, error: null };
      },
      signUp: async ({ email, password, options }: any) => {
        // Register user and log them in immediately
        mockUser = {
          id: 'mock-user-' + Math.random().toString(36).substr(2, 9),
          email,
          user_metadata: {
            name: options?.data?.name || 'Demo Client',
            role: options?.data?.role || 'customer',
            phone: options?.data?.phone || ''
          }
        };
        mockSession = {
          access_token: encodeMockToken(mockUser),
          user: mockUser
        };
        setTimeout(() => {
          mockListeners.forEach(cb => cb('SIGNED_IN', mockSession));
        }, 100);
        return { data: { session: mockSession, user: mockUser }, error: null };
      },
      signOut: async () => {
        mockSession = null;
        mockUser = null;
        mockListeners.forEach(cb => cb('SIGNED_OUT', null));
        return { error: null };
      }
    }
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}
