
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useDeliveryLocations } from '@/hooks/use-delivery-locations';
import { DeliveryLocationsMap } from '@/components/delivery-locations/delivery-locations-map';
import { DeliveryLocationsTable } from '@/components/delivery-locations/delivery-locations-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function DeliveryLocations() {
  const { 
    locations, 
    isLoading, 
    error, 
    formattedWeekRange,
    fetchLocations,
    addLocation 
  } = useDeliveryLocations();

  // Handle adding a new location (placeholder for now)
  const handleAddLocation = () => {
    toast.info('Add location feature coming soon');
    // In a real implementation, this would open a modal or form to add a new location
  };

  // Handle errors with toast
  if (error) {
    toast.error('Failed to load delivery locations', {
      description: error.message,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Locations</h1>
          <p className="text-muted-foreground mt-2">
            Manage delivery locations for week of {formattedWeekRange}
          </p>
        </div>
        <Button onClick={handleAddLocation}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>
      
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
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Location Details</CardTitle>
          <CardDescription>
            List of all delivery locations for this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeliveryLocationsTable 
            locations={locations}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
