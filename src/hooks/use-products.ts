
import { useEffect } from 'react';
import { useProductStore } from '@/store/use-product-store';

export const useProducts = () => {
  const {
    products,
    productTypes,
    isLoading,
    error,
    fetchProducts,
    fetchProductTypes,
    addProduct,
    updateProduct,
    deleteProduct,
    createInput,
    setCreateInput
  } = useProductStore();
  
  useEffect(() => {
    const doFetch = async () => {
      await fetchProducts();
    };
    doFetch();
  }, [fetchProducts]);
  
  return {
    products,
    productTypes,
    isLoading,
    error,
    fetchProducts,
    fetchProductTypes,
    addProduct,
    updateProduct,
    deleteProduct,
    createInput,
    setCreateInput
  };
}
