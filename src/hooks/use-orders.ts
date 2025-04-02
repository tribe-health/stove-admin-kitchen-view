import { useEffect } from 'react';
import { useOrderStore } from '@/store/use-order-store';
import { format } from 'date-fns';

export const useOrders = () => {
  const {
    orders,
    isLoading,
    error,
    fetchOrders
  } = useOrderStore();
  useEffect(() => {
    const doFetchOrders = async () => {
      await fetchOrders();
    };
    doFetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    isLoading,
    error,
  }
}