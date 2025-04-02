import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export interface SiteType {
  id: string;
  name: string;
  key: string;
  schema: Record<string, unknown>;
  managing_table: string;
}

export interface Site {
  id: string;
  name: string;
 data: Record<string, unknown>;
 organization_id: string;
  site_type: SiteType;
}

interface SiteState {
  sites: Site[];
  isLoading: boolean;
  error: Error | null;
  fetchSites: () => Promise<void>;
}

export const useSiteStore = create<SiteState>((set, get) => ({
  sites: [],
  isLoading: false,
  error: null,
  fetchSites: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('site')
        .select(`*
               ,site_type(*)`);
      if (error) {
        throw error;
      }
      set({ sites: data as Site[], isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  }
}))