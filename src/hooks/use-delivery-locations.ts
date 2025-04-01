
import { useEffect } from 'react';
import { useDeliveryLocationsStore } from '@/store/use-delivery-locations-store';
import { format } from 'date-fns';

export function useDeliveryLocations() {
  const { 
    locations, 
    isLoading, 
    error, 
    currentWeekStart, 
    currentWeekEnd,
    fetchLocations,
    addLocation
  } = useDeliveryLocationsStore();

  // Format dates for display
  const formattedWeekRange = `${format(currentWeekStart, 'MMM d')} - ${format(currentWeekEnd, 'MMM d, yyyy')}`;

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Modified addLocation wrapper with default provider_id
  const addDeliveryLocation = async (locationData: Omit<Omit<typeof locations[0], 'id'>, 'provider_id'>) => {
    // For now, we're using a placeholder provider_id
    // In a real application, this would come from the user's context or be selected by the user
    const locationWithProvider = {
      ...locationData,
      provider_id: '00000000-0000-0000-0000-000000000000' // Default provider ID placeholder
    };
    
    return addLocation(locationWithProvider);
  };

  return {
    locations,
    isLoading,
    error,
    currentWeekStart,
    currentWeekEnd,
    formattedWeekRange,
    fetchLocations,
    addLocation: addDeliveryLocation // Return the wrapped function
  };
}
