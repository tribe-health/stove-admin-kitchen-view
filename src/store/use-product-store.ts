
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface ProductType {
  id: string;
  name: string;
  key: string;
  icon_url: string | null;
  cover_url: string | null;
  schema: Record<string, unknown> | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string | null;
  short_description: string | null;
  long_description: string | null;
  nutrition_details: string | null;
  instructions: string | null;
  unit_price: number;
  photo_url: string | null;
  product_type_id: string | null;
  product_type?: ProductType;
  created_at: string;
  updated_at: string | null;
  data: Record<string, unknown> | null;
}

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  fetchProducts: () => Promise<void>;
  fetchProductById: (id: string) => Promise<Product | null>;
  createProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'product_type'>) => Promise<Product | null>;
  updateProduct: (id: string, product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'product_type'>>) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<boolean>;
  fetchProductTypes: () => Promise<ProductType[]>;
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
        .select(`
          *,
          product_type (*)
        `)
        .order('name');

      if (error) {
        throw error;
      }

      // Map database fields to our interface
      const products: Product[] = data.map(item => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        short_description: item.short_description,
        long_description: item.long_description,
        nutrition_details: item.nutrition_details,
        instructions: item.instructions,
        unit_price: item.unit_price,
        photo_url: item.photo_url,
        product_type_id: item.product_type_id,
        product_type: item.product_type,
        created_at: item.created_at,
        updated_at: item.updated_at,
        data: item.data
      }));

      set({ products, isLoading: false });
    } catch (error) {
      console.error('Error fetching products:', error);
      set({ error: error as Error, isLoading: false });
    }
  },

  fetchProductById: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_type (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      // Map database fields to our interface
      const product: Product = {
        id: data.id,
        name: data.name,
        unit: data.unit,
        short_description: data.short_description,
        long_description: data.long_description,
        nutrition_details: data.nutrition_details,
        instructions: data.instructions,
        unit_price: data.unit_price,
        photo_url: data.photo_url,
        product_type_id: data.product_type_id,
        product_type: data.product_type,
        created_at: data.created_at,
        updated_at: data.updated_at,
        data: data.data
      };

      set({ isLoading: false });
      return product;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      set({ error: error as Error, isLoading: false });
      return null;
    }
  },

  createProduct: async (productData) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select(`
          *,
          product_type (*)
        `)
        .single();

      if (error) {
        throw error;
      }

      // Map database fields to our interface
      const product: Product = {
        id: data.id,
        name: data.name,
        unit: data.unit,
        short_description: data.short_description,
        long_description: data.long_description,
        nutrition_details: data.nutrition_details,
        instructions: data.instructions,
        unit_price: data.unit_price,
        photo_url: data.photo_url,
        product_type_id: data.product_type_id,
        product_type: data.product_type,
        created_at: data.created_at,
        updated_at: data.updated_at,
        data: data.data
      };

      // Update local state
      const updatedProducts = [...get().products, product];
      set({ products: updatedProducts, isLoading: false });
      
      toast({
        title: "Product created",
        description: `${product.name} has been created successfully.`,
      });
      
      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      set({ error: error as Error, isLoading: false });
      
      toast({
        variant: "destructive",
        title: "Failed to create product",
        description: (error as Error).message,
      });
      
      return null;
    }
  },

  updateProduct: async (id, productData) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select(`
          *,
          product_type (*)
        `)
        .single();

      if (error) {
        throw error;
      }

      // Map database fields to our interface
      const updatedProduct: Product = {
        id: data.id,
        name: data.name,
        unit: data.unit,
        short_description: data.short_description,
        long_description: data.long_description,
        nutrition_details: data.nutrition_details,
        instructions: data.instructions,
        unit_price: data.unit_price,
        photo_url: data.photo_url,
        product_type_id: data.product_type_id,
        product_type: data.product_type,
        created_at: data.created_at,
        updated_at: data.updated_at,
        data: data.data
      };

      // Update local state
      const updatedProducts = get().products.map(product => 
        product.id === id ? updatedProduct : product
      );
      set({ products: updatedProducts, isLoading: false });
      
      toast({
        title: "Product updated",
        description: `${updatedProduct.name} has been updated successfully.`,
      });
      
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      set({ error: error as Error, isLoading: false });
      
      toast({
        variant: "destructive",
        title: "Failed to update product",
        description: (error as Error).message,
      });
      
      return null;
    }
  },

  deleteProduct: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      // Find the product to get its name for the toast message
      const productToDelete = get().products.find(product => product.id === id);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update local state
      const updatedProducts = get().products.filter(product => product.id !== id);
      set({ products: updatedProducts, isLoading: false });
      
      toast({
        title: "Product deleted",
        description: productToDelete 
          ? `${productToDelete.name} has been deleted.` 
          : "Product has been deleted.",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      set({ error: error as Error, isLoading: false });
      
      toast({
        variant: "destructive",
        title: "Failed to delete product",
        description: (error as Error).message,
      });
      
      return false;
    }
  },

  fetchProductTypes: async () => {
    try {
      const { data, error } = await supabase
        .from('product_types')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      return data as ProductType[];
    } catch (error) {
      console.error('Error fetching product types:', error);
      set({ error: error as Error });
      return [];
    }
  }
}));
