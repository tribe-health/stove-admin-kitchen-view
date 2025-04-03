import { useEffect, useState } from 'react';
import { useDeliveryLocationsStore, DeliveryLocation } from '@/store/use-delivery-locations-store';
import { format } from 'date-fns';
import { Site } from '@/types';

export function useDeliveryLocations() {
  const {
    locations,
    isLoading,
    error,
    currentWeekStart,
    currentWeekEnd,
    currentDeliveryPeriods,
    selectedDeliveryPeriod,
    selectedLocationId,
    fetchLocations,
    addLocation,
    updateLocation,
    deleteLocation,
    addSiteToLocation,
    removeSiteFromLocation,
    getLocationSites,
    selectLocation,
    selectDeliveryPeriod
  } = useDeliveryLocationsStore();

  const [selectedLocationSites, setSelectedLocationSites] = useState<{
    [locationId: string]: Site[]
  }>({});

  // Format dates for display
  const formattedWeekRange = `${format(currentWeekStart, 'MMM d')} - ${format(currentWeekEnd, 'MMM d, yyyy')}`;

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Function to load sites for a specific location
  const loadLocationSites = async (locationId: string) => {
    const sites = await getLocationSites(locationId);
    setSelectedLocationSites(prev => ({
      ...prev,
      [locationId]: sites
    }));
    return sites;
  };

  // Function to add a site to a location
  const addSiteToLocationWithRefresh = async (siteId: string, locationId: string) => {
    await addSiteToLocation(siteId, locationId);
    await loadLocationSites(locationId);
  };

  // Function to remove a site from a location
  const removeSiteFromLocationWithRefresh = async (siteId: string, locationId: string) => {
    await removeSiteFromLocation(siteId, locationId);
    await loadLocationSites(locationId);
  };

  // Get the current selected location
  const selectedLocation = selectedLocationId
    ? locations.find(loc => loc.id === selectedLocationId) || null
    : null;

  // Get the current delivery period
  const currentDeliveryPeriod = selectedDeliveryPeriod ||
    (currentDeliveryPeriods && currentDeliveryPeriods.length > 0
      ? currentDeliveryPeriods[0]
      : null);

  // Filter locations by the selected delivery period
  const getLocationsByPeriod = (periodId: string) => {
    return locations.filter(loc => loc.delivery_period_id === periodId);
  };

  return {
    locations,
    currentDeliveryPeriods,
    currentDeliveryPeriod,
    selectedDeliveryPeriod,
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
    addSiteToLocation: addSiteToLocationWithRefresh,
    removeSiteFromLocation: removeSiteFromLocationWithRefresh,
    getLocationSites: loadLocationSites,
    selectedLocationSites,
    selectLocation,
    selectDeliveryPeriod,
    getLocationsByPeriod
  };
}
