
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
    addLocation,
    currentDeliveryPeriod
  } = useDeliveryLocationsStore();

  // Format dates for display
  const formattedWeekRange = `${format(currentWeekStart, 'MMM d')} - ${format(currentWeekEnd, 'MMM d, yyyy')}`;

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return {
    locations,
    currentDeliveryPeriod,
    isLoading,
    error,
    currentWeekStart,
    currentWeekEnd,
    formattedWeekRange,
    fetchLocations,
    addLocation // Return the wrapped function
  };
}
