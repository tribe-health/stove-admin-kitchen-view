
import { supabase } from "@/integrations/supabase/client";
import { LoginFormValues } from "@/lib/validations/auth-schema";
import { useAuthStore } from "@/store/use-auth-store";

export const authService = {
  async login({ email, password }: LoginFormValues) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error("User not found");
    }
    
    // Fetch additional user data from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('first_name, last_name, id')
      .eq('email', email)
      .single();
    
    if (userError) {
      throw userError;
    }

    // Set user in store
    useAuthStore.getState().login({
      id: data.user.id,
      email: data.user.email || '',
      firstName: userData?.first_name || 'Admin',
      lastName: userData?.last_name || 'User',
      role: 'admin', // You may want to fetch actual roles from your user_roles table
    });

    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    
    useAuthStore.getState().logout();
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    return data.session;
  },

  async updateUserProfile(userId: string, updates: { first_name?: string; last_name?: string }) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
      
    if (error) {
      throw error;
    }
    
    // Update the local store
    if (updates.first_name || updates.last_name) {
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().login({
          ...currentUser,
          firstName: updates.first_name || currentUser.firstName,
          lastName: updates.last_name || currentUser.lastName,
        });
      }
    }
    
    return data;
  },
};
