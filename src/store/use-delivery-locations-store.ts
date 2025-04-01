
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export interface DeliveryLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
  start_open_time?: string;
  end_open_time?: string;
}

interface DeliveryLocationsState {
  locations: DeliveryLocation[];
  isLoading: boolean;
  error: Error | null;
  currentWeekStart: Date;
  currentWeekEnd: Date;
  fetchLocations: () => Promise<void>;
  addLocation: (location: Omit<DeliveryLocation, 'id'>) => Promise<DeliveryLocation | null>;
}

export const useDeliveryLocationsStore = create<DeliveryLocationsState>((set, get) => {
  // Calculate current week (Sunday to Saturday)
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // 0 = Sunday
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 }); // 0 = Sunday

  return {
    locations: [],
    isLoading: false,
    error: null,
    currentWeekStart: weekStart,
    currentWeekEnd: weekEnd,
    
    fetchLocations: async () => {
      try {
        set({ isLoading: true, error: null });
        
        const { data: locations, error } = await supabase
          .from('delivery_location')
          .select('*')
          // In a real implementation, we would add filtering by week
          // This would require adding date fields to the delivery_location table
          // For now, we'll fetch all locations
          .order('name');
        
        if (error) throw new Error(error.message);
        
        set({ 
          locations: locations as DeliveryLocation[], 
          isLoading: false 
        });
      } catch (error) {
        console.error('Error fetching delivery locations:', error);
        set({ 
          error: error as Error, 
          isLoading: false 
        });
      }
    },
    
    addLocation: async (location) => {
      try {
        set({ isLoading: true, error: null });
        
        const { data, error } = await supabase
          .from('delivery_location')
          .insert([location])
          .select()
          .single();
        
        if (error) throw new Error(error.message);
        
        set(state => ({ 
          locations: [...state.locations, data as DeliveryLocation],
          isLoading: false 
        }));
        
        return data as DeliveryLocation;
      } catch (error) {
        console.error('Error adding delivery location:', error);
        set({ 
          error: error as Error, 
          isLoading: false 
        });
        return null;
      }
    }
  };
});
