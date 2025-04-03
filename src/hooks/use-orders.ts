import { useEffect, useState } from 'react';
import { useOrderStore, Order, OrderStatus } from '@/store/use-order-store';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

export const useOrders = () => {
  const {
    orders,
    isLoading,
    error,
    fetchOrders,
    fetchOrderById,
    updateOrder,
    deleteOrder,
    updateOrderStatus
  } = useOrderStore();

  useEffect(() => {
    const doFetchOrders = async () => {
      await fetchOrders();
    };
    doFetchOrders();
  }, [fetchOrders]);

  const getOrderById = async (id: string): Promise<Order | null> => {
    return await fetchOrderById(id);
  };

  const updateOrderDetails = async (id: string, orderData: Partial<Order>): Promise<Order | null> => {
    try {
      const result = await updateOrder(id, orderData);
      if (result) {
        toast({
          title: "Order updated",
          description: `Order #${id.substring(0, 8)} has been updated successfully.`,
        });
      }
      return result;
    } catch (error) {
      toast({
        title: "Error updating order",
        description: `There was an error updating the order: ${(error as Error).message}`,
        variant: "destructive",
      });
      return null;
    }
  };

  const changeOrderStatus = async (id: string, status: OrderStatus): Promise<Order | null> => {
    try {
      const result = await updateOrderStatus(id, status);
      if (result) {
        toast({
          title: "Status updated",
          description: `Order status has been updated to ${status}.`,
        });
      }
      return result;
    } catch (error) {
      toast({
        title: "Error updating status",
        description: `There was an error updating the order status: ${(error as Error).message}`,
        variant: "destructive",
      });
      return null;
    }
  };

  const removeOrder = async (id: string): Promise<boolean> => {
    try {
      const result = await deleteOrder(id);
      if (result) {
        toast({
          title: "Order deleted",
          description: `Order #${id.substring(0, 8)} has been deleted successfully.`,
        });
      }
      return result;
    } catch (error) {
      toast({
        title: "Error deleting order",
        description: `There was an error deleting the order: ${(error as Error).message}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const formatOrderDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return {
    orders,
    isLoading,
    error,
    getOrderById,
    updateOrderDetails,
    changeOrderStatus,
    removeOrder,
    formatOrderDate,
    formatCurrency
  };
};