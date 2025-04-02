import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

interface UserStoreState {
  users: User[];
  isLoading: boolean;
  error: Error | null;
  fetchUsers: () => Promise<void>;
}

export const useUserStore = create<UserStoreState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,
  fetchUsers: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        throw error;
      }
    } catch (error) {
      set({ error });
    } finally {
      set({ isLoading: false });
    }
  }
}))