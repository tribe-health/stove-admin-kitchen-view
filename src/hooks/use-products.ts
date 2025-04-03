import { useEffect } from 'react';
import { useProductStore } from '@/store/use-product-store';
import { useAuthStore } from '@/store/use-auth-store';

export const useProducts = () => {
  const {
    products,
    isLoading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
  } = useProductStore();
  useEffect(() => {
    const doFetch = async () => {
      await fetchProducts();
    };
    doFetch();
  }, [fetchProducts]);
  return {
    products,
    isLoading,
    error,
    fetchProducts,
    addProduct,
    updateProduct
  };
}
