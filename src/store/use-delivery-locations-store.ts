
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export interface DeliveryPeriod {
  id: string;
  start_date: string;
  end_date: string;
  title?: string;
  created_at: string;
  delivery_locations?: DeliveryLocation[];
}

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
  provider_id: string; // Added provider_id as required field
  delivery_period_id?: string;
}

interface DeliveryLocationsState {
  locations: DeliveryLocation[];
  deliveryPeriods: DeliveryPeriod[]; // Added deliveryPeriods to match the interface
  currentDeliveryPeriod: DeliveryPeriod | null;
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
    deliveryPeriods: [], // Initialize deliveryPeriods
    currentDeliveryPeriod: null,
    isLoading: false,
    error: null,
    currentWeekStart: weekStart,
    currentWeekEnd: weekEnd,
    
    fetchLocations: async () => {
      try {
        set({ isLoading: true, error: null });
        
        // Format dates for Supabase query
        const { currentWeekStart, currentWeekEnd } = get();
        const formattedStartDate = format(currentWeekStart, 'yyyy-MM-dd');
        const formattedEndDate = format(currentWeekEnd, 'yyyy-MM-dd');

        const period = get().currentDeliveryPeriod;

        if (!period) {
          console.error('No current delivery period found.');

        // Find delivery period that includes the current week
        const { data: periods, error: periodError } = await supabase
          .from('delivery_period')
          .select(`
            *
          `)
          .gte('start_date', formattedStartDate)
          .lte('end_date', formattedEndDate)
          .limit(1)
          .single();

          if (periodError) {
            console.error('Error fetching delivery periods:', periodError.message);
            throw periodError;
          }

          if (!periods) {
            const { error } = await supabase. 
            from('delivery_period'). 
            insert({
              start_date: formattedStartDate,
              end_date: formattedEndDate,
              title: 'Week of ' + formattedStartDate + ' to ' + formattedEndDate,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();
            if (error) throw new Error(error.message);
        
            set({ currentDeliveryPeriod: period, locations: [], isLoading: false   });
          } else {
            const { data: locations, error: locationError } = await supabase
             .from('delivery_location')
             .select(`
                *
              `)
             .eq('delivery_period_id', periods.id)
             .order('created_at', { ascending: false });
            
            if (locationError) {
              console.error('Error fetching delivery locations:', locationError.message);
              throw locationError;
            }

            let transformedLocations = [];
            if (locations) {
              transformedLocations = locations.map(location => ({
                ...location,
                start_open_time: location.start_open_time ? new Date(location.start_open_time) : null,
                end_open_time: location.end_open_time ? new Date(location.end_open_time) : null,
              }));
            }

            const transformedPeriod = {
              ...periods,
              locations: transformedLocations as DeliveryLocation[],
            } as DeliveryPeriod;

            set({
              currentDeliveryPeriod: transformedPeriod,
              locations: transformedLocations as DeliveryLocation[],
              isLoading: false,
            })
          }
          
        }
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
        
        // Insert a single location, not an array
        const { data, error } = await supabase
          .from('delivery_location')
          .insert(location)
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
