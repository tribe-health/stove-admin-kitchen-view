import { useState, useEffect } from 'react';
import { Plus, MapPin, Calendar } from 'lucide-react';
import { useDeliveryLocations } from '@/hooks/use-delivery-locations';
import { DeliveryLocation } from '@/store/use-delivery-locations-store';
import { DeliveryLocationsMap } from '@/components/delivery-locations/delivery-locations-map';
import { DeliveryLocationsTable } from '@/components/delivery-locations/delivery-locations-table';
import { DeliveryLocationDetail } from '@/components/delivery-locations/delivery-location-detail';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function DeliveryLocations() {
  const {
    locations,
    activeLocations,
    isLoading,
    error,
    selectedLocation,
    selectedLocationId,
    fetchLocations,
    deleteLocation,
    selectLocation,
  } = useDeliveryLocations();

  const [isCreating, setIsCreating] = useState(false);
  const [activeView, setActiveView] = useState<'map' | 'list'>('map');


  // Handle errors with toast
  useEffect(() => {
    if (error) {
      toast.error('Failed to load delivery locations', {
        description: error.message,
      });
    }
  }, [error]);

  // Handle adding a new location
  const handleAddLocation = () => {
    selectLocation(null);
    setIsCreating(true);
  };

  // Handle selecting a location
  const handleSelectLocation = (location: DeliveryLocation) => {
    selectLocation(location.id);
    setIsCreating(false);
  };

  // Handle saving a location
  const handleSaveLocation = async (location: DeliveryLocation) => {
    await fetchLocations();
    selectLocation(location.id);
    setIsCreating(false);
  };

  // Handle deleting a location
  const handleDeleteLocation = async (id: string) => {
    await deleteLocation(id);
    await fetchLocations();
    selectLocation(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Locations</h1>
          <div className="flex items-center mt-2 text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
          </div>
        </div>
        <Button onClick={handleAddLocation}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'map' | 'list')}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="map">Map View</TabsTrigger>
                <TabsTrigger value="list">List View</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="map" className="m-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Location Map</CardTitle>
                  <CardDescription>
                    Visual overview of delivery locations for this week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DeliveryLocationsMap
                    locations={locations}
                    isLoading={isLoading}
                    onSelectLocation={handleSelectLocation}
                    selectedLocationId={selectedLocationId}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="list" className="m-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Location Details</CardTitle>
                  <CardDescription>
                    List of all active delivery locations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DeliveryLocationsTable
                    locations={activeLocations}
                    isLoading={isLoading}
                    onSelectLocation={handleSelectLocation}
                    selectedLocationId={selectedLocationId}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          {isCreating ? (
            <DeliveryLocationDetail
              isNew={true}
              onSave={handleSaveLocation}
            />
          ) : selectedLocation ? (
            <DeliveryLocationDetail
              location={selectedLocation}
              onSave={handleSaveLocation}
              onDelete={handleDeleteLocation}
            />
          ) : (
            <Card>
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <MapPin className="h-10 w-10 mb-2 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-1">No Location Selected</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a location from the map or list to view details
                </p>
                <Button variant="outline" onClick={handleAddLocation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Location
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
