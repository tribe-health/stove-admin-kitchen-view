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
  currentDeliveryPeriods: DeliveryPeriod[] | null;
  selectedDeliveryPeriod: DeliveryPeriod | null;
  selectedLocationId: string | null; // Added to track the selected location
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
  selectDeliveryPeriod: (periodId: string) => void;
  selectLocation: (locationId: string | null) => void;
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
    currentDeliveryPeriods: [],
    selectedDeliveryPeriod: null,
    selectedLocationId: null, // Initialize selectedLocationId
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

        // Fetch all current delivery periods
        const { data: periodsData, error: periodError } = await supabase
          .from('delivery_period')
          .select('*')
          .eq('is_current', true)
          .order('created_at', { ascending: false });

        if (periodError) {
          console.error('Error fetching delivery periods:', periodError.message);
          throw periodError;
        }

        // If no periods exist, create one
        if (!periodsData || periodsData.length === 0) {
          const { data: newPeriod, error: createError } = await supabase
            .from('delivery_period')
            .insert({
              start_date: formattedStartDate,
              end_date: formattedEndDate,
              title: `Week of ${format(currentWeekStart, 'MMM d, yyyy')}`,
              is_current: true
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating delivery period:', createError.message);
            throw createError;
          }

          // After creating a new period, set it as the only current period
          set(state => ({
            ...state,
            currentDeliveryPeriods: [newPeriod],
            selectedDeliveryPeriod: newPeriod,
            deliveryPeriods: [...state.deliveryPeriods, newPeriod],
            locations: [], // No locations yet for the new period
            isLoading: false,
          }));
        } else {
          // We have existing periods, fetch all locations for all current periods
          const periodIds = periodsData.map(period => period.id);
          
          const { data: locations, error: locationError } = await supabase
            .from('delivery_location')
            .select(`
              *,
              address(*)
            `)
            .in('delivery_period_id', periodIds)
            .order('created_at', { ascending: false });

          if (locationError) {
            console.error('Error fetching delivery locations:', locationError.message);
            throw locationError;
          }

          const transformedLocations = (locations || []).map(location => ({
            ...location,
            start_open_time: location.start_open_time || null,
            end_open_time: location.end_open_time || null,
          }));

          // Determine which period to select (keep existing selection if valid)
          const currentSelectedPeriod = get().selectedDeliveryPeriod;
          const isCurrentSelectionValid = currentSelectedPeriod &&
            periodsData.some(p => p.id === currentSelectedPeriod.id);
          
          const selectedPeriod = isCurrentSelectionValid
            ? currentSelectedPeriod
            : periodsData[0];

          // Determine which location to select (keep existing selection if valid)
          const currentSelectedLocationId = get().selectedLocationId;
          const isCurrentLocationValid = currentSelectedLocationId &&
            transformedLocations.some(loc => loc.id === currentSelectedLocationId);
          
          const selectedLocationId = isCurrentLocationValid
            ? currentSelectedLocationId
            : (transformedLocations.length > 0 ? transformedLocations[0].id : null);

          set(state => ({
            ...state,
            currentDeliveryPeriods: periodsData,
            selectedDeliveryPeriod: selectedPeriod,
            deliveryPeriods: [...state.deliveryPeriods.filter(p =>
              !periodsData.some(newP => newP.id === p.id)), ...periodsData],
            locations: transformedLocations,
            selectedLocationId: selectedLocationId,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Error fetching delivery locations:', error);
        set(state => ({ 
          ...state,
          error: error as Error, 
          isLoading: false 
        }));
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
          delivery_period_id: location.delivery_period_id || get().selectedDeliveryPeriod?.id,
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
    },

    selectDeliveryPeriod: (periodId: string) => {
      // First try to find the period in currentDeliveryPeriods, then fall back to all deliveryPeriods
      const period =
        (get().currentDeliveryPeriods || []).find(period => period.id === periodId) ||
        get().deliveryPeriods.find(period => period.id === periodId) ||
        null;
      
      set({ selectedDeliveryPeriod: period });
      
      // Reset selected location when changing periods
      if (period) {
        // Find a location for this period
        const locationsForPeriod = get().locations.filter(loc =>
          loc.delivery_period_id === period.id
        );
        
        // If there are locations for this period, select the first one
        if (locationsForPeriod.length > 0) {
          set({ selectedLocationId: locationsForPeriod[0].id });
        } else {
          set({ selectedLocationId: null });
        }
      }
    },
    
    // Add a function to select a location
    selectLocation: (locationId: string | null) => {
      set({ selectedLocationId: locationId });
    }
  };
});
