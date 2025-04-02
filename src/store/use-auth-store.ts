
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  authListener: null | (() => void);
  login: (user: User) => void;
  logout: () => void;
  hydrateFromSession: () => Promise<void>;
  setupAuthListener: () => void;
  teardownAuthListener: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      authListener: null,
      login: (user) => set({ user, isLoggedIn: true }),
      logout: () => set({ user: null, isLoggedIn: false }),
      
      hydrateFromSession: async () => {
        try {
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error hydrating session:', error.message);
            return;
          }
          
          if (data.session) {
            // Session exists, fetch user data from the users table
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('first_name, last_name, id')
              .eq('id', data.session.user.id)
              .single();
            
            if (userError) {
              console.error('Error fetching user data:', userError.message);
              return;
            }
            
            // Set user in store
            set({
              user: {
                id: data.session.user.id,
                email: data.session.user.email || '',
                firstName: userData?.first_name || 'Admin',
                lastName: userData?.last_name || 'User',
                role: 'admin', // You may want to fetch actual roles
              },
              isLoggedIn: true
            });
            
            // Setup auth listener if not already set up
            if (!get().authListener) {
              get().setupAuthListener();
            }
          }
        } catch (error) {
          console.error('Session hydration failed:', error);
        }
      },
      
      setupAuthListener: () => {
        // Remove any existing listener first
        get().teardownAuthListener();
        
        // Set up Supabase auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Supabase auth event:', event);
            
            if (event === 'SIGNED_IN' && session) {
              // User signed in, fetch user data and update store
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('first_name, last_name, id')
                .eq('id', session.user.id)
                .single();
              
              if (userError) {
                console.error('Error fetching user data:', userError.message);
                return;
              }
              
              set({
                user: {
                  id: session.user.id,
                  email: session.user.email || '',
                  firstName: userData?.first_name || 'Admin',
                  lastName: userData?.last_name || 'User',
                  role: 'admin',
                },
                isLoggedIn: true
              });
            } else if (event === 'SIGNED_OUT') {
              // User signed out, clear store
              set({ user: null, isLoggedIn: false });
            } else if (event === 'TOKEN_REFRESHED' && session) {
              // Token refreshed, update session but keep user data
              // This ensures the session stays valid without disrupting the user experience
              console.log('Token refreshed for user:', session.user.email);
            }
          }
        );
        
        // Store the unsubscribe function
        set({ authListener: () => subscription.unsubscribe() });
      },
      
      teardownAuthListener: () => {
        const { authListener } = get();
        if (authListener) {
          authListener();
          set({ authListener: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      // Only persist these fields to localStorage
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);
