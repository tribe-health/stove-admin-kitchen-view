
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { startOfISOWeek, endOfISOWeek, format, add } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import { Address, DbAddress } from '@/types';
import { PostgrestError } from '@supabase/supabase-js';

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
  address: Address;
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
  addDeliveryPeriod: (period: Omit<DeliveryPeriod, 'id'>) => Promise<DeliveryPeriod | null>;
}

export type DeliveryLocationInsertInput = Database['public']['Tables']['delivery_location']['Insert'];
export type DeliveryPeriodInsertInput = Database['public']['Tables']['delivery_period']['Insert'];

export type DbDeliveryLocation = Database['public']['Tables']['delivery_location']['Row'];

export type DbDeliveryLocationWithAddress = DbDeliveryLocation & {
  address: DbAddress;
}

export const useDeliveryLocationsStore = create<DeliveryLocationsState>((set, get) => {
  // Calculate current week (Sunday to Saturday)
  const now = new Date();
  const weekStart = add(startOfISOWeek(now), { minutes: -1 }); // 0 = Sunday
  const weekEnd = add(endOfISOWeek(now), {minutes: 1 }); // 0 = Sunday

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
        const formattedStartDate = format(currentWeekStart, "yyyy-MM-dd'T'HH:mm:ssxxx");
        const formattedEndDate = format(currentWeekEnd, "yyyy-MM-dd'T'HH:mm:ssxxx");

        const period = get().currentDeliveryPeriod;

        if (!period) {
          console.error('No current delivery period found.');

        // Find delivery period that includes the current week
        const { data: periods, error: periodError } = await supabase
          .from('delivery_period')
          .select(`
            *
          `)
          .eq('is_current', true)
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
                *,
                address(*)
              `)
             .eq('delivery_period_id', periods.id)
             .order('created_at', { ascending: false }) as { data: DbDeliveryLocationWithAddress[] | null, 
              error: PostgrestError | null};
            
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
    
    addLocation: async (location: DeliveryLocation) => {
      try {
        set({ isLoading: true, error: null });

        const locationToInsert: DeliveryLocationInsertInput = {
          address_id: location.address.id,
          name: location.name,
          start_open_time: location.start_open_time?.toString(),
          end_open_time: location.end_open_time?.toString(),
          provider_id: location.provider_id,
          delivery_period_id: location.delivery_period_id,
        }
        
        // Insert a single location, not an array
        const { data, error } = await supabase
          .from('delivery_location')
          .insert(locationToInsert)
          .select()
          .single();
        
        if (error) throw new Error(error.message);

        const locationWithId: DeliveryLocation = {
          ...data,
          address: location.address,
        }
        
        set(state => ({ 
          locations: [...state.locations, locationWithId],
          isLoading: false 
        }));
        
        return locationWithId;
      } catch (error) {
        console.error('Error adding delivery location:', error);
        set({ 
          error: error as Error, 
          isLoading: false 
        });
        return null;
      }
    },
    
    addDeliveryPeriod: async (period: DeliveryPeriod) => {
      try {
        set({ isLoading: true, error: null });
        const periodToInsert: DeliveryPeriodInsertInput = {
          start_date: period.start_date,
          end_date: period.end_date,
          title: period.title,
          created_at: period.created_at,
        }
        const { data, error } = await supabase
         .from('delivery_period')
         .insert(periodToInsert)
         .select()
         .single();

        if (error) throw new Error(error.message);
        const periodWithId: DeliveryPeriod = {
          ...data,
        };
        set(state => ({
          deliveryPeriods: [...state.deliveryPeriods, periodWithId],
          isLoading: false,
        }));
        return periodWithId;
      } catch (error) {
        console.error('Error adding delivery period:', error);
        set({
          error: error as Error,
          isLoading: false,
        });
        return null;
      }
    }
  };
});
