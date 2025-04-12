import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { startOfISOWeek, endOfISOWeek, format, add } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import { Address, DbAddress, Site } from '@/types';

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
  sites?: Site[];
  active: boolean; // Added active property
}

interface DeliveryLocationsState {
  locations: DeliveryLocation[];
  activeLocations: DeliveryLocation[];
  selectedLocationId: string | null; // Added to track the selected location
  isLoading: boolean;
  error: Error | null;
  currentWeekStart: Date;
  currentWeekEnd: Date;
  fetchLocations: () => Promise<void>;
  addLocation: (location: Omit<DeliveryLocation, 'id'>) => Promise<DeliveryLocation | null>;
  updateLocation: (id: string, location: Partial<DeliveryLocation>) => Promise<DeliveryLocation | null>;
  deleteLocation: (id: string) => Promise<void>;
  selectLocation: (locationId: string | null) => void;
}

export type DeliveryLocationInsertInput = Database['public']['Tables']['delivery_location']['Insert'];

export type DbDeliveryLocation = Database['public']['Tables']['delivery_location']['Row'];

export type DbDeliveryLocationWithAddress = DbDeliveryLocation & {
  address: DbAddress;
}

// Function to get coordinates from address using Mapbox API
const getCoordinatesFromAddress = async (address: {
  address: string;
  address1?: string;
  city: string;
  state: string;
  zip: string;
}) => {
  const MAPBOX_API_KEY = "pk.eyJ1IjoiZ3FhZG9uaXMiLCJhIjoiY2o4bzdnZXc2MDA1ZTJ3cnp5cTM3N2p2bCJ9.Mp12t4wj_L2KAzQocwCuWQ";
  
  try {
    // Format the address for the API query
    const searchText = encodeURIComponent(
      `${address.address} ${address.address1 || ''} ${address.city}, ${address.state} ${address.zip}`
    );
    
    const response = await fetch(
      `https://api.mapbox.com/search/geocode/v6/forward?q=${searchText}&access_token=${MAPBOX_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we have results
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].geometry.coordinates;
      return { latitude, longitude };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
};

export const useDeliveryLocationsStore = create<DeliveryLocationsState>((set, get) => {
  // Calculate current week (Sunday to Saturday)
  const now = new Date();
  const weekStart = add(startOfISOWeek(now), { minutes: -1 }); // 0 = Sunday
  const weekEnd = add(endOfISOWeek(now), {minutes: 1 }); // 0 = Sunday

  return {
    locations: [],
    activeLocations: [],
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


        const { data: locations, error: locationError } = await supabase
            .from('delivery_location')
            .select(`
              *,
              address(*)
            `)
            .order('created_at', { ascending: false });

          if (locationError) {
            console.error('Error fetching delivery locations:', locationError.message);
            throw locationError;
          }

          const activeLocations = (locations || []).filter(location => location.active);

          const transformedLocations = (locations || []).map(location => ({
            ...location,
            start_open_time: location.start_open_time || null,
            end_open_time: location.end_open_time || null,
          }));

          const transformedActiveLocations = (activeLocations || []).map(location => ({
            ...location,
            start_open_time: location.start_open_time || null,
            end_open_time: location.end_open_time || null,
          }));

          set(state => ({
            ...state,
            locations: transformedLocations,
            activeLocations: transformedActiveLocations,
            isLoading: false,
          }));

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

        // Check if latitude and longitude are provided, if not, get them from Mapbox
        let latitude = location.address.latitude;
        let longitude = location.address.longitude;

        if ((!latitude || !longitude) && 
            location.address.address && 
            location.address.city && 
            location.address.state && 
            location.address.zip) {
          console.log('Geocoding address for delivery location...');
          
          try {
            const coordinates = await getCoordinatesFromAddress({
              address: location.address.address,
              address1: location.address.address1,
              city: location.address.city,
              state: location.address.state,
              zip: location.address.zip
            });
            
            if (coordinates) {
              latitude = coordinates.latitude;
              longitude = coordinates.longitude;
              console.log('Geocoding successful:', coordinates);
            } else {
              console.log('Geocoding returned no results');
            }
          } catch (geocodingError) {
            console.error('Error geocoding address:', geocodingError);
            // Continue with the process even if geocoding fails
          }
        }

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
            latitude: latitude,
            longitude: longitude,
          })
          .select()
          .single();

        if (addressError) throw new Error(addressError.message);

        const locationToInsert: DeliveryLocationInsertInput = {
          address_id: addressData.id,
          name: location.name,
          start_open_time: location.start_open_time?.toString(),
          end_open_time: location.end_open_time?.toString(),
          provider_id: location.provider_id || '8fe720cc-6641-42c8-8fde-612dcce14520',
          active: location.active !== undefined ? location.active : true, // Default to true if not provided
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

          // Always look up the latitude and longitude when updating an address
          // because the address has likely changed, making existing coordinates incorrect
          let latitude = null;
          let longitude = null;

          if (location.address.address && 
              location.address.city && 
              location.address.state && 
              location.address.zip) {
            console.log('Geocoding address for delivery location update...');
            
            try {
              const coordinates = await getCoordinatesFromAddress({
                address: location.address.address,
                address1: location.address.address1,
                city: location.address.city,
                state: location.address.state,
                zip: location.address.zip
              });
              
              if (coordinates) {
                latitude = coordinates.latitude;
                longitude = coordinates.longitude;
                console.log('Geocoding successful:', coordinates);
              } else {
                console.log('Geocoding returned no results');
              }
            } catch (geocodingError) {
              console.error('Error geocoding address:', geocodingError);
              // Continue with the process even if geocoding fails
            }
          }

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
              latitude: latitude,
              longitude: longitude,
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
        if (location.active !== undefined) locationToUpdate.active = location.active;

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
        console.log('Starting deleteLocation in store for ID:', id);
        set({ isLoading: true, error: null });

        // Get the address ID before deleting the location
        console.log('Fetching location to get address_id');
        const { data: location, error: fetchError } = await supabase
          .from('delivery_location')
          .select('address_id')
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error('Error fetching location for deletion:', fetchError);
          throw new Error(fetchError.message);
        }

        console.log('Found location with address_id:', location?.address_id);

        // Delete the delivery location
        console.log('Deleting delivery location');
        const { error: deleteError } = await supabase
          .from('delivery_location')
          .delete()
          .eq('id', id);

        if (deleteError) {
          console.error('Error deleting delivery location:', deleteError);
          throw new Error(deleteError.message);
        }

        // Delete the associated address
        console.log('Deleting associated address');
        const { error: addressError } = await supabase
          .from('address')
          .delete()
          .eq('id', location.address_id);

        if (addressError) {
          console.error('Error deleting address:', addressError);
          throw new Error(addressError.message);
        }

        console.log('Deletion successful, updating state');
        set(state => ({
          locations: state.locations.filter(loc => loc.id !== id),
          selectedLocationId: state.selectedLocationId === id ? null : state.selectedLocationId,
          isLoading: false
        }));
        
        console.log('Delete operation completed successfully');
        // Don't return anything to match the Promise<void> return type
      } catch (error) {
        console.error('Error in deleteLocation function:', error);
        set({
          error: error as Error,
          isLoading: false
        });
        throw error; // Re-throw the error so it can be caught by the component
      }
    },
    
    // Add a function to select a location
    selectLocation: (locationId: string | null) => {
      set({ selectedLocationId: locationId });
    }
  };
});
