import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useCallback } from 'react';
import { Json } from '@/integrations/supabase/types';

// Define the User interface to match Supabase schema
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  handle: string;
  did: string;
  pds_url: string;
  phone_number?: string | null;
  primary_station_id?: string | null;
  stripe_customer_id?: string | null;
  metadata?: Json | null;
  created_at: string;
  updated_at?: string | null;
}

// For compatibility with existing code that might not have all required fields
export interface BasicUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string | null;
}

export interface EditingUser {
  input: UserInput;
  user: User;
  is_dirty: boolean;
}

export interface UserInput {
  email: string;
  first_name: string;
  last_name: string;
  handle: string;
  did: string;
  pds_url: string;
  phone_number?: string | null;
  primary_station_id?: string | null;
  metadata?: Json | null;
}

interface UserStoreState {
  users: User[];
  isLoading: boolean;
  error: Error | null;
  
  // Fetch operations
  fetchUsers: () => Promise<void>;
  fetchUserById: (id: string) => Promise<User | null>;
  
  // Role management
  assignRole: (userId: string, roleId: string) => Promise<boolean>;
  removeRole: (userId: string, roleId: string) => Promise<boolean>;
}

export const useUserStore = create<UserStoreState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,
  
  fetchUsers: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('last_name');
        
      if (error) {
        throw error;
      }
      
      set({ users: data as User[], isLoading: false });
    } catch (error) {
      console.error('Error fetching users:', error);
      set({ error: error as Error, isLoading: false });
      
      toast({
        variant: "destructive",
        title: "Error fetching users",
        description: (error as Error).message,
      });
    }
  },
  
  fetchUserById: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        throw error;
      }
      
      set({ isLoading: false });
      return data as User;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      set({ error: error as Error, isLoading: false });
      
      toast({
        variant: "destructive",
        title: "Error fetching user",
        description: (error as Error).message,
      });
      
      return null;
    }
  },
  
  assignRole: async (userId: string, roleId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Role assigned",
        description: "Role has been assigned to the user successfully.",
      });
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error('Error assigning role:', error);
      set({ error: error as Error, isLoading: false });
      
      toast({
        variant: "destructive",
        title: "Failed to assign role",
        description: (error as Error).message,
      });
      
      return false;
    }
  },
  
  removeRole: async (userId: string, roleId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Role removed",
        description: "Role has been removed from the user successfully.",
      });
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error('Error removing role:', error);
      set({ error: error as Error, isLoading: false });
      
      toast({
        variant: "destructive",
        title: "Failed to remove role",
        description: (error as Error).message,
      });
      
      return false;
    }
  }
}));