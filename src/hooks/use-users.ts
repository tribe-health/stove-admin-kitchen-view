import { useEffect, useState } from 'react';
import { useOrderStore, Order, OrderStatus } from '@/store/use-order-store';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { useUserStore, User, UserInput } from '@/store/use-user-store';

export const useUsers = () => {
  const {
    users,
    isLoading,
    error,
    fetchUsers,
    fetchUserById,
    assignRole,
    removeRole
  } = useUserStore();

  useEffect(() => {
    const doFetchUsers = async () => {
      await fetchUsers();
    };
    doFetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    fetchUserById,
    assignRole,
    removeRole
  };
}