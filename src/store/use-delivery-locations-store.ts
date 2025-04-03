import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { startOfISOWeek, endOfISOWeek, format, add } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import { Address, DbAddress, Site, DeliveryLocationSite } from '@/types';
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
  sites?: Site[];
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
  updateLocation: (id: string, location: Partial<DeliveryLocation>) => Promise<DeliveryLocation | null>;
  deleteLocation: (id: string) => Promise<void>;
  addDeliveryPeriod: (period: Omit<DeliveryPeriod, 'id'>) => Promise<DeliveryPeriod | null>;
  addSiteToLocation: (siteId: string, locationId: string) => Promise<void>;
  removeSiteFromLocation: (siteId: string, locationId: string) => Promise<void>;
  getLocationSites: (locationId: string) => Promise<Site[]>;
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
              is_current: true
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
    
    addLocation: async (location: Omit<DeliveryLocation, 'id'>) => {
      try {
        set({ isLoading: true, error: null });

        // First, create the address
        const { data: addressData, error: addressError } = await supabase
          .from('address')
          .insert({
            name: location.address.name,
            address: location.address.address,
            address1: location.address.address1,
            city: location.address.city,
            state: location.address.state,
            zip: location.address.zip,
            latitude: location.address.latitude,
            longitude: location.address.longitude,
          })
          .select()
          .single();

        if (addressError) throw new Error(addressError.message);

        const locationToInsert: DeliveryLocationInsertInput = {
          address_id: addressData.id,
          name: location.name,
          start_open_time: location.start_open_time?.toString(),
          end_open_time: location.end_open_time?.toString(),
          provider_id: location.provider_id,
          delivery_period_id: location.delivery_period_id || get().currentDeliveryPeriod?.id,
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
          address: addressData as Address,
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
    
    updateLocation: async (id: string, location: Partial<DeliveryLocation>) => {
      try {
        set({ isLoading: true, error: null });

        // If address is being updated
        if (location.address) {
          // Get the current location to find the address ID
          const { data: currentLocation, error: fetchError } = await supabase
            .from('delivery_location')
            .select('address_id')
            .eq('id', id)
            .single();

          if (fetchError) throw new Error(fetchError.message);

          // Update the address
          const { error: addressError } = await supabase
            .from('address')
            .update({
              name: location.address.name,
              address: location.address.address,
              address1: location.address.address1,
              city: location.address.city,
              state: location.address.state,
              zip: location.address.zip,
              latitude: location.address.latitude,
              longitude: location.address.longitude,
            })
            .eq('id', currentLocation.address_id);

          if (addressError) throw new Error(addressError.message);
        }

        // Update the delivery location
        const locationToUpdate: Partial<DeliveryLocationInsertInput> = {};
        if (location.name) locationToUpdate.name = location.name;
        if (location.start_open_time) locationToUpdate.start_open_time = location.start_open_time.toString();
        if (location.end_open_time) locationToUpdate.end_open_time = location.end_open_time.toString();
        if (location.provider_id) locationToUpdate.provider_id = location.provider_id;
        if (location.delivery_period_id) locationToUpdate.delivery_period_id = location.delivery_period_id;

        const { data, error } = await supabase
          .from('delivery_location')
          .update(locationToUpdate)
          .eq('id', id)
          .select(`
            *,
            address(*)
          `)
          .single();

        if (error) throw new Error(error.message);

        const updatedLocation = data as unknown as DeliveryLocation;
        
        set(state => ({
          locations: state.locations.map(loc => 
            loc.id === id ? updatedLocation : loc
          ),
          isLoading: false
        }));

        return updatedLocation;
      } catch (error) {
        console.error('Error updating delivery location:', error);
        set({
          error: error as Error,
          isLoading: false
        });
        return null;
      }
    },
    
    deleteLocation: async (id: string) => {
      try {
        set({ isLoading: true, error: null });

        // Get the address ID before deleting the location
        const { data: location, error: fetchError } = await supabase
          .from('delivery_location')
          .select('address_id')
          .eq('id', id)
          .single();

        if (fetchError) throw new Error(fetchError.message);

        // Delete the delivery location
        const { error: deleteError } = await supabase
          .from('delivery_location')
          .delete()
          .eq('id', id);

        if (deleteError) throw new Error(deleteError.message);

        // Delete the associated address
        const { error: addressError } = await supabase
          .from('address')
          .delete()
          .eq('id', location.address_id);

        if (addressError) throw new Error(addressError.message);

        set(state => ({
          locations: state.locations.filter(loc => loc.id !== id),
          isLoading: false
        }));
      } catch (error) {
        console.error('Error deleting delivery location:', error);
        set({
          error: error as Error,
          isLoading: false
        });
      }
    },
    
    addDeliveryPeriod: async (period: Omit<DeliveryPeriod, 'id'>) => {
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
    },

    addSiteToLocation: async (siteId: string, locationId: string) => {
      try {
        set({ isLoading: true, error: null });

        const { error } = await supabase
          .from('site_delivery_location')
          .insert({
            site_id: siteId,
            delivery_location_id: locationId
          });

        if (error) throw new Error(error.message);

        // Fetch the updated location with sites
        const sites = await get().getLocationSites(locationId);
        
        // Update the location in state with the new sites
        set(state => ({
          locations: state.locations.map(loc => 
            loc.id === locationId ? { ...loc, sites } : loc
          ),
          isLoading: false
        }));
      } catch (error) {
        console.error('Error adding site to delivery location:', error);
        set({
          error: error as Error,
          isLoading: false
        });
      }
    },

    removeSiteFromLocation: async (siteId: string, locationId: string) => {
      try {
        set({ isLoading: true, error: null });

        const { error } = await supabase
          .from('site_delivery_location')
          .delete()
          .match({
            site_id: siteId,
            delivery_location_id: locationId
          });

        if (error) throw new Error(error.message);

        // Fetch the updated location with sites
        const sites = await get().getLocationSites(locationId);
        
        // Update the location in state with the new sites
        set(state => ({
          locations: state.locations.map(loc => 
            loc.id === locationId ? { ...loc, sites } : loc
          ),
          isLoading: false
        }));
      } catch (error) {
        console.error('Error removing site from delivery location:', error);
        set({
          error: error as Error,
          isLoading: false
        });
      }
    },

    getLocationSites: async (locationId: string) => {
      try {
        const { data, error } = await supabase
          .from('site_delivery_location')
          .select(`
            site_id,
            site:site_id(
              *,
              site_type(*),
              address(*)
            )
          `)
          .eq('delivery_location_id', locationId);

        if (error) throw new Error(error.message);

        // Extract the sites from the response
        const sites = data.map(item => item.site) as Site[];
        return sites;
      } catch (error) {
        console.error('Error fetching location sites:', error);
        return [];
      }
    }
  };
});
