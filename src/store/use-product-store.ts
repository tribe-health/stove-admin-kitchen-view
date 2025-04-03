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
  instructions: string;
  nutrition_details: string;
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
  instructions: string | null;
  nutrition_details: string | null;
  unit_price: number;
  photo_url: string | null;
  unit: string | null;
  data: Record<string, unknown>;
  stripe_product_id: string | null;
}

export interface EditingProduct {
  input: ProductInput;
  product: Product;
  is_dirty: boolean;
}

interface ProductState {
  products: Product[];
  productTypes: ProductType[];
  editingProductMap: Map<string, EditingProduct>;
  isLoading: boolean;
  error: Error | null;
  fetchProducts: () => Promise<void>;
  fetchProductTypes: () => Promise<void>;
  addProduct: (product: ProductInput) => Promise<Product | null>;
  updateProduct: (id: string, product: ProductInput) => Promise<Product | null>;
  editingProduct: EditingProduct | null;
  setEditingProduct: (editingProduct: EditingProduct) => void;
  saveEditingProduct: (editingProduct: EditingProduct) => void;
  getEditingProduct: (id: string) => EditingProduct | null;
  createEditingProduct: (product: Product) => EditingProduct;
  createInput: ProductInput | null;
  setCreateInput: (input: ProductInput) => void;
  deleteProduct: (id: string) => Promise<void>;
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
  productTypes: [],
  editingProductMap: new Map(),
  isLoading: false,
  error: null,
  editingProduct: null,
  createInput: null,
  setCreateInput: (input: ProductInput) => set({ createInput: input }),
  setEditingProduct: (editingProduct: EditingProduct) => {
    // Save to the map first
    set((state) => {
      const newEditingProductMap = new Map(state.editingProductMap);
      newEditingProductMap.set(editingProduct.product.id, { ...editingProduct });
      return {
        editingProduct,
        editingProductMap: newEditingProductMap
      };
    });
  },
  saveEditingProduct: (editingProduct: EditingProduct) => {
    set((state) => {
      const newEditingProductMap = new Map(state.editingProductMap);
      newEditingProductMap.set(editingProduct.product.id, editingProduct);
      return { editingProductMap: newEditingProductMap };
    });
  },
  getEditingProduct: (id: string) => {
    return get().editingProductMap.get(id) || null;
  },
  createEditingProduct: (product: Product) => {
    return {
      input: {
        product_type_id: product.product_type_id,
        name: product.name,
        short_description: product.short_description,
        long_description: product.long_description,
        instructions: product.instructions,
        nutrition_details: product.nutrition_details,
        unit_price: product.unit_price,
        photo_url: product.photo_url,
        unit: product.unit,
        data: product.data,
        stripe_product_id: product.stripe_product_id,
      },
      product: product,
      is_dirty: false,
    };
  },
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
  fetchProductTypes: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('product_types')
        .select('*');
      
      if (error) {
        throw error;
      }

      if (!data) {
        set({ productTypes: [], isLoading: false });
        return;
      }

      set({ productTypes: data as ProductType[], isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
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

      // delete from editing product map
      get().editingProductMap.delete(id);

      set({ products: updatedProducts, isLoading: false });
      return mappedProduct;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      return null;
    }
  },
  deleteProduct: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase
        .from('products')
          .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // remove this product from the current list and update the store
      const updatedProducts = get().products.filter(p => p.id !== id);
      set({ products: updatedProducts });

      // delete from editing map if it is there 
      get().editingProductMap.delete(id);

      set({ isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  }
}))
