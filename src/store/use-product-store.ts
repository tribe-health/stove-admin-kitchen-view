import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export interface ProductType {
  id: string;
  name: string;
  key: string;
  schema: Record<string, unknown>;
  icon_url: string;
  cover_url: string;
}

export interface Product {
  id: string;
  product_type_id: string;
  product_type: ProductType;
  name: string;
  stripe_product_id: string;
  short_description: string;
  long_description: string;
  unit_price: number;
  photo_url: string;
  unit: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProductInput {
  product_type_id: string;
  name: string;
  short_description: string | null;
  long_description: string | null;
  unit_price: number;
  photo_url: string | null;
  unit: string | null;
  data: Record<string, unknown>;
  stripe_product_id: string | null;
}

export interface EditingProduct {
  input: ProductInput;
  productId: string | null;
  is_dirty: true;
}

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  fetchProducts: () => Promise<void>;
  addProduct: (product: ProductInput) => Promise<Product | null>;
  updateProduct: (id: string, product: ProductInput) => Promise<Product | null>;
  editingProduct: EditingProduct | null;
  setEditingProduct: (editingProduct: EditingProduct) => void;
}

type ProductWithType = Database['public']['Tables']['products']['Row'] & {
  product_type: Database['public']['Tables']['product_types']['Row'];
}

type DbProductInsert = Database['public']['Tables']['products']['Insert'];

// Define a more flexible Json type that matches Supabase's Json type
type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];
type Json = JsonValue | { [key: string]: JsonValue } | JsonValue[];

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  editingProduct: null,
  setEditingProduct: (editingProduct: EditingProduct) => set({ editingProduct });
  fetchProducts: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('products')
        .select('*, product_types(*)');
      if (error) {
        throw error;
      }

      if (!data) {
        set({ products: [], isLoading: false });
        return;
      }

      const products = data as unknown as ProductWithType[];
      const mappedProducts = products.map((product) => {
        return {
          ...product,
          product_type: product.product_type
        } as Product;
      });
      set({ products: mappedProducts, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },
  addProduct: async (product: ProductInput) => {
    try {
      set({ isLoading: true, error: null });

      // Create a properly typed product insert object
      const productInsert: DbProductInsert = {
        ...product,
        // Handle data property correctly - convert to JSON compatible format
        data: JSON.parse(JSON.stringify(product.data || {}))
      }

      const { data, error } = await supabase
        .from('products')
        .insert(productInsert)
        .select('*, product_type(*)');
              
      if (error) {
        throw error;
      }
      if (!data) {
        set({ products: [], isLoading: false });
        return null;
      }
      const productWithType = data[0] as unknown as ProductWithType;
      const mappedProduct = {
        ...productWithType,
        product_type: productWithType.product_type
      } as Product;
      set({ products: [...get().products, mappedProduct], isLoading: false });
      return mappedProduct;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      return null;
    }
  },
  updateProduct: async (id: string, product: ProductInput) => {
    try {
      set({ isLoading: true, error: null });

      // Create a properly typed product update object
      const productUpdate: DbProductInsert = {
        ...product,
        // Handle data property correctly - convert to JSON compatible format
        data: JSON.parse(JSON.stringify(product.data || {}))
      }

      const { data, error } = await supabase
        .from('products')
        .update(productUpdate)
        .eq('id', id)
        .select('*, product_type(*)');
              
      if (error) {
        throw error;
      }
      if (!data || data.length === 0) {
        set({ isLoading: false });
        return null;
      }
      
      const productWithType = data[0] as unknown as ProductWithType;
      const mappedProduct = {
        ...productWithType,
        product_type: productWithType.product_type
      } as Product;
      
      // Update the product in the store
      const updatedProducts = get().products.map(p => 
        p.id === id ? mappedProduct : p
      );
      
      set({ products: updatedProducts, isLoading: false });
      return mappedProduct;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      return null;
    }
  }
}))
