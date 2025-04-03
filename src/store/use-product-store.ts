import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Database } from '@/integrations/supabase/types';

type DbProduct = Database['public']['Tables']['products']['Row'];
type DbProductType = Database['public']['Tables']['product_types']['Row'];

export interface ProductType extends Omit<DbProductType, 'schema'> {
  schema: Record<string, unknown> | null;
}

export interface Product extends Omit<DbProduct, 'data'> {
  product_type?: ProductType;
  data: Record<string, unknown> | null;
}

export interface EditingProduct extends Product {
  is_dirty?: boolean;
}

interface ProductState {
  products: Product[];
  productTypes: ProductType[];
  isLoading: boolean;
  error: Error | null;
  editingProduct: EditingProduct | null;
  editingProductMap: Map<string, EditingProduct>;
  createInput: Partial<Product>;
  
  // Fetch operations
  fetchProducts: () => Promise<void>;
  fetchProductById: (id: string) => Promise<Product | null>;
  fetchProductTypes: () => Promise<ProductType[]>;
  
  // CRUD operations
  createProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'product_type'>) => Promise<Product | null>;
  updateProduct: (id: string, product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'product_type'>>) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<boolean>;
  
  // Alias for createProduct to match hook naming
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'product_type'>) => Promise<Product | null>;
  
  // Editing operations
  setEditingProduct: (product: EditingProduct) => void;
  createEditingProduct: (product: Product) => EditingProduct;
  saveEditingProduct: (product: EditingProduct) => Promise<Product | null>;
  getEditingProduct: (id: string) => EditingProduct | null;
  
  // Create form operations
  setCreateInput: (input: Partial<Product>) => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  productTypes: [],
  isLoading: false,
  error: null,
  editingProduct: null,
  editingProductMap: new Map<string, EditingProduct>(),
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

      if (error) {
        throw error;
      }

      // Map database fields to our interface using any to bypass type checking
      const rawData = data as any[];
      const products: Product[] = rawData.map(item => ({
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
        stripe_product_id: item.stripe_product_id,
        product_type: item.product_type || undefined,
        created_at: item.created_at,
        updated_at: item.updated_at,
        data: item.data as Record<string, unknown> | null
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

      // Map database fields to our interface using any to bypass type checking
      const rawData = data as any;
      const product: Product = {
        id: rawData.id,
        name: rawData.name,
        unit: rawData.unit,
        short_description: rawData.short_description,
        long_description: rawData.long_description,
        nutrition_details: rawData.nutrition_details,
        instructions: rawData.instructions,
        unit_price: rawData.unit_price,
        photo_url: rawData.photo_url,
        product_type_id: rawData.product_type_id,
        stripe_product_id: rawData.stripe_product_id,
        product_type: rawData.product_type || undefined,
        created_at: rawData.created_at,
        updated_at: rawData.updated_at,
        data: rawData.data as Record<string, unknown> | null
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
      
      // Convert Record<string, unknown> to Json for Supabase
      const supabaseData = {
        ...productData,
        data: productData.data as any
      };
      
      const { data, error } = await supabase
        .from('products')
        .insert([supabaseData])
        .select(`
          *,
          product_type (*)
        `)
        .single();

      if (error) {
        throw error;
      }

      // Map database fields to our interface using any to bypass type checking
      const rawData = data as any;
      const product: Product = {
        id: rawData.id,
        name: rawData.name,
        unit: rawData.unit,
        short_description: rawData.short_description,
        long_description: rawData.long_description,
        nutrition_details: rawData.nutrition_details,
        instructions: rawData.instructions,
        unit_price: rawData.unit_price,
        photo_url: rawData.photo_url,
        product_type_id: rawData.product_type_id,
        stripe_product_id: rawData.stripe_product_id,
        product_type: rawData.product_type || undefined,
        created_at: rawData.created_at,
        updated_at: rawData.updated_at,
        data: rawData.data as Record<string, unknown> | null
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
      
      // Convert Record<string, unknown> to Json for Supabase
      const supabaseData = {
        ...productData,
        data: productData.data as any
      };
      
      const { data, error } = await supabase
        .from('products')
        .update(supabaseData)
        .eq('id', id)
        .select(`
          *,
          product_type (*)
        `)
        .single();

      if (error) {
        throw error;
      }

      // Map database fields to our interface using any to bypass type checking
      const rawData = data as any;
      const updatedProduct: Product = {
        id: rawData.id,
        name: rawData.name,
        unit: rawData.unit,
        short_description: rawData.short_description,
        long_description: rawData.long_description,
        nutrition_details: rawData.nutrition_details,
        instructions: rawData.instructions,
        unit_price: rawData.unit_price,
        photo_url: rawData.photo_url,
        product_type_id: rawData.product_type_id,
        stripe_product_id: rawData.stripe_product_id,
        product_type: rawData.product_type || undefined,
        created_at: rawData.created_at,
        updated_at: rawData.updated_at,
        data: rawData.data as Record<string, unknown> | null
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
  },

  // Alias for createProduct to match hook naming
  addProduct: async (productData) => {
    return get().createProduct(productData);
  },

  // Editing operations
  setEditingProduct: (product: EditingProduct) => {
    const map = get().editingProductMap;
    map.set(product.id, product);
    set({ editingProduct: product, editingProductMap: map });
  },

  createEditingProduct: (product: Product): EditingProduct => {
    return {
      ...product,
      is_dirty: false
    };
  },

  saveEditingProduct: async (product: EditingProduct) => {
    const { id, ...updateData } = product;
    return get().updateProduct(id, updateData);
  },

  getEditingProduct: (id: string) => {
    return get().editingProductMap.get(id) || null;
  },

  // Create form operations
  setCreateInput: (input: Partial<Product>) => {
    set({ createInput: input });
  }
}));
