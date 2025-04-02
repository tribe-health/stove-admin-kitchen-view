import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export interface Product {
  id: string;
  name: string;
  unit_price: number;
}

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  fetchProducts: () => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  fetchProducts: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('products')
        .select('*');
      if (error) {
        throw error;
      }
      set({ products: data, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  }
}))