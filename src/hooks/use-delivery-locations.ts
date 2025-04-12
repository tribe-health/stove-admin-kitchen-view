import { useEffect, useState } from 'react';
import { useDeliveryLocationsStore, DeliveryLocation } from '@/store/use-delivery-locations-store';
import { format } from 'date-fns';
import { Site } from '@/types';

export function useDeliveryLocations() {
  const {
    locations,
    activeLocations,
    isLoading,
    error,
    currentWeekStart,
    currentWeekEnd,
    selectedLocationId,
    fetchLocations,
    addLocation,
    updateLocation,
    deleteLocation,
    selectLocation,
  } = useDeliveryLocationsStore();

  const [selectedLocationSites, setSelectedLocationSites] = useState<{
    [locationId: string]: Site[]
  }>({});

  // Format dates for display
  const formattedWeekRange = `${format(currentWeekStart, 'MMM d')} - ${format(currentWeekEnd, 'MMM d, yyyy')}`;

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);


  // Get the current selected location
  const selectedLocation = selectedLocationId
    ? locations.find(loc => loc.id === selectedLocationId) || null
    : null;

  return {
    locations,
    activeLocations,
    selectedLocation,
    selectedLocationId,
    isLoading,
    error,
    currentWeekStart,
    currentWeekEnd,
    formattedWeekRange,
    fetchLocations,
    addLocation,
    updateLocation,
    deleteLocation,
    selectLocation,
  };
}
