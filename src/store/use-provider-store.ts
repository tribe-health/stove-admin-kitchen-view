import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type DbProvider = Database['public']['Tables']['provider']['Row'];

export type Provider = DbProvider;

interface ProviderState {
  providers: Provider[];
  isLoading: boolean;
  error: Error | null;
  fetchProviders: () => Promise<void>;
}

export const useProviderStore = create<ProviderState>((set) => ({
  providers: [],
  isLoading: false,
  error: null,

  fetchProviders: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('provider')
        .select('*')
        .order('name');

      if (error) throw new Error(error.message);

      set({ providers: data as Provider[], isLoading: false });
    } catch (error) {
      console.error('Error fetching providers:', error);
      set({ error: error as Error, isLoading: false });
    }
  },
})); 