import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Database } from '@/integrations/supabase/types';

// Define base database types
type Tables = Database['public']['Tables'];
type ProductRow = Tables['products']['Row'];
type ProductTypeRow = Tables['product_types']['Row'];

// Define the shape of products with joined data
type ProductWithJoins = ProductRow & {
  product_type?: ProductTypeRow;
  product_types?: ProductTypeRow;
};

// Define our domain models
export interface ProductType {
  id: string;
  name: string;
  key: string;
  cover_url: string | null;
  icon_url: string | null;
  created_at: string;
  schema: Record<string, unknown> | null;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  short_description: string;
  long_description: string;
  nutrition_details: string;
  instructions: string;
  unit_price: number;
  photo_url: string;
  product_type_id: string;
  stripe_product_id: string;
  created_at: string;
  updated_at: string;
  product_type?: ProductType;
  data: Record<string, unknown> | null;
}

interface ProductState {
  products: Product[];
  productTypes: ProductType[];
  isLoading: boolean;
  error: Error | null;
  createInput: Partial<Product>;
  
  // Actions
  fetchProducts: () => Promise<void>;
  fetchProductById: (id: string) => Promise<Product | null>;
  fetchProductTypes: () => Promise<ProductType[]>;
  createProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'product_type'>) => Promise<Product | null>;
  updateProduct: (id: string, product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'product_type'>>) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<boolean>;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'product_type'>) => Promise<Product | null>;
  setCreateInput: (input: Partial<Product>) => void;
}

// Helper function to convert database row to domain model
const mapToProduct = (row: unknown): Product => {
  const typedRow = row as {
    id: string;
    name: string;
    unit: string;
    short_description: string;
    long_description: string;
    nutrition_details: string;
    instructions: string;
    unit_price: number;
    photo_url: string;
    product_type_id: string;
    stripe_product_id: string;
    created_at: string;
    updated_at: string;
    data: unknown;
    product_type?: {
      id: string;
      name: string;
      key: string;
      cover_url: string | null;
      icon_url: string | null;
      created_at: string;
      schema: unknown;
    };
  };

  return {
    id: typedRow.id,
    name: typedRow.name,
    unit: typedRow.unit,
    short_description: typedRow.short_description,
    long_description: typedRow.long_description,
    nutrition_details: typedRow.nutrition_details,
    instructions: typedRow.instructions,
    unit_price: typedRow.unit_price,
    photo_url: typedRow.photo_url,
    product_type_id: typedRow.product_type_id,
    stripe_product_id: typedRow.stripe_product_id,
    created_at: typedRow.created_at,
    updated_at: typedRow.updated_at,
    data: typedRow.data as Record<string, unknown> | null,
    product_type: typedRow.product_type ? {
      id: typedRow.product_type.id,
      name: typedRow.product_type.name,
      key: typedRow.product_type.key,
      cover_url: typedRow.product_type.cover_url,
      icon_url: typedRow.product_type.icon_url,
      created_at: typedRow.product_type.created_at,
      schema: typedRow.product_type.schema as Record<string, unknown> | null,
    } : undefined,
  };
};

// Helper function to prepare data for Supabase
const prepareForSupabase = (data: Record<string, unknown> | null) => {
  return data ? JSON.parse(JSON.stringify(data)) : null;
};

export const useProductStore = create<ProductState>()((set, get) => ({
  products: [],
  productTypes: [],
  isLoading: false,
  error: null,
  createInput: {},

  fetchProducts: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_types (*)
        `)
        .order('name');

      if (error) throw error;

      const products = (data || []).map(row => mapToProduct(row));
      set({ products, isLoading: false });
    } catch (error) {
      console.error('Error fetching products:', error);
      set({ error: error as Error, isLoading: false });
    }
  },

  fetchProductById: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_types (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const product = mapToProduct(data);
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
        .insert([{
          ...productData,
          data: prepareForSupabase(productData.data)
        }])
        .select(`
          *,
          product_types (*)
        `)
        .single();

      if (error) throw error;

      const product = mapToProduct(data);
      
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
        .update({
          ...productData,
          data: prepareForSupabase(productData.data || null)
        })
        .eq('id', id)
        .select(`
          *,
          product_types (*)
        `)
        .single();

      if (error) throw error;

      const updatedProduct = mapToProduct(data);
      
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
      
      const productToDelete = get().products.find(product => product.id === id);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

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

      if (error) throw error;

      const productTypes = data.map(type => ({
        id: type.id,
        name: type.name,
        key: type.key,
        cover_url: type.cover_url,
        icon_url: type.icon_url,
        created_at: type.created_at,
        schema: type.schema as Record<string, unknown> | null,
      }));

      return productTypes;
    } catch (error) {
      console.error('Error fetching product types:', error);
      set({ error: error as Error });
      return [];
    }
  },

  addProduct: async (productData) => {
    return get().createProduct(productData);
  },


  setCreateInput: (input) => {
    set({ createInput: input });
  }
}));
