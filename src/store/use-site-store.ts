import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Site, SiteType } from '@/types';
import { Json } from '@/integrations/supabase/types';

interface SiteState {
  sites: Site[];
  siteTypes: SiteType[];
  isLoading: boolean;
  error: Error | null;
  fetchSites: () => Promise<void>;
  fetchSiteTypes: () => Promise<void>;
  addSite: (site: Omit<Site, 'id' | 'site_type'>) => Promise<Site | null>;
  updateSite: (id: string, site: Partial<Site>) => Promise<Site | null>;
  deleteSite: (id: string) => Promise<void>;
}

// Type for site insert
interface SiteInsert {
  name: string;
  organization_id: string;
  site_type_id: string;
  address_id?: string;
  data?: Json;
}

// Type for site update
interface SiteUpdate {
  name?: string;
  organization_id?: string;
  site_type_id?: string;
  address_id?: string;
  data?: Json;
}

export const useSiteStore = create<SiteState>((set, get) => ({
  sites: [],
  siteTypes: [],
  isLoading: false,
  error: null,
  
  fetchSites: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('site')
        .select(`*,
               site_type(*),
               address(*)`);
      if (error) {
        throw error;
      }
      set({ sites: data as Site[], isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },
  
  fetchSiteTypes: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('site_type')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      set({ siteTypes: data as SiteType[], isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },
  
  addSite: async (site) => {
    try {
      set({ isLoading: true, error: null });
      
      // Convert to the correct type for Supabase
      const siteToInsert: SiteInsert = {
        name: site.name,
        organization_id: site.organization_id,
        site_type_id: site.site_type_id,
        address_id: site.address_id,
        data: site.data as Json
      };
      
      const { data, error } = await supabase
        .from('site')
        .insert(siteToInsert)
        .select(`*,
               site_type(*),
               address(*)`)
        .single();
        
      if (error) {
        throw error;
      }
      
      const newSite = data as Site;
      set(state => ({ 
        sites: [...state.sites, newSite],
        isLoading: false 
      }));
      
      return newSite;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      return null;
    }
  },
  
  updateSite: async (id, site) => {
    try {
      set({ isLoading: true, error: null });
      
      // Convert to the correct type for Supabase
      const siteToUpdate: SiteUpdate = {};
      
      if (site.name) siteToUpdate.name = site.name;
      if (site.organization_id) siteToUpdate.organization_id = site.organization_id;
      if (site.site_type_id) siteToUpdate.site_type_id = site.site_type_id;
      if (site.address_id) siteToUpdate.address_id = site.address_id;
      if (site.data) siteToUpdate.data = site.data as Json;
      
      const { data, error } = await supabase
        .from('site')
        .update(siteToUpdate)
        .eq('id', id)
        .select(`*,
               site_type(*),
               address(*)`)
        .single();
        
      if (error) {
        throw error;
      }
      
      const updatedSite = data as Site;
      set(state => ({
        sites: state.sites.map(s => s.id === id ? updatedSite : s),
        isLoading: false
      }));
      
      return updatedSite;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      return null;
    }
  },
  
  deleteSite: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('site')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      set(state => ({
        sites: state.sites.filter(site => site.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  }
}));