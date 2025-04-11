import { useState, useEffect, useCallback } from 'react';
import { DeliveryLocation, DeliveryPeriod } from '@/store/use-delivery-locations-store';
import { DeliveryLocationForm, DeliveryLocationFormValues } from './delivery-location-form';
import { DeliveryLocationSites } from './delivery-location-sites';
import { useDeliveryLocations } from '@/hooks/use-delivery-locations';
import { useSites } from '@/hooks/use-sites';
import { Site } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Clock, Building, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, isValid } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface DeliveryLocationDetailProps {
  location?: DeliveryLocation;
  onSave: (location: DeliveryLocation) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isNew?: boolean;
  deliveryPeriodId?: string;
  deliveryPeriods?: DeliveryPeriod[];
  onSelectDeliveryPeriod?: (periodId: string) => void;
}

export function DeliveryLocationDetail({
  location,
  onSave,
  onDelete,
  isNew = false,
  deliveryPeriodId,
  deliveryPeriods,
  onSelectDeliveryPeriod,
}: DeliveryLocationDetailProps) {
  const { 
    updateLocation, 
    addLocation, 
    isLoading,
    addSiteToLocation,
    removeSiteFromLocation,
    getLocationSites
  } = useDeliveryLocations();
  
  const [isEditing, setIsEditing] = useState(isNew);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [locationSites, setLocationSites] = useState<Site[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const loadSites = useCallback(async () => {
    if (!location) return;
    
    setSitesLoading(true);
    try {
      const sites = await getLocationSites(location.id);
      setLocationSites(sites);
    } catch (error) {
      console.error('Error loading sites:', error);
      toast.error('Failed to load associated sites');
    } finally {
      setSitesLoading(false);
    }
  }, [location, getLocationSites]);

  useEffect(() => {
    const fetchSites = async () => {
      if (location && !isNew) {
        await loadSites();
      }
    };
    fetchSites();
  }, [location, isNew, loadSites]);

  // Helper function to safely format time values
  const safeFormatTime = (timeString?: string) => {
    if (!timeString) return null;
    
    const date = new Date(timeString);
    return isValid(date) ? format(date, 'h:mm a') : null;
  };

  const handleFormSubmit = async (formData: DeliveryLocationFormValues) => {
    try {
      setIsFormSubmitting(true);

      if (isNew) {
        // Create new location
        const newLocation = await addLocation({
          name: formData.name,
          address: {
            id: uuidv4(), // Using UUID instead of temporary ID
            name: formData.address.name,
            address: formData.address.address,
            address1: formData.address.address1,
            city: formData.address.city,
            state: formData.address.state,
            zip: formData.address.zip,
          },
          start_open_time: formData.startOpenTime,
          end_open_time: formData.endOpenTime,
          provider_id: formData.providerId || '8fe720cc-6641-42c8-8fde-612dcce14520',
          delivery_period_id: deliveryPeriodId,
          active: formData.active,
        });
        
        if (newLocation) {
          toast.success('Delivery location created successfully');
          onSave(newLocation);
          setIsEditing(false);
        }
      } else if (location) {
        // Update existing location
        const updatedLocation = await updateLocation(location.id, {
          name: formData.name,
          address: {
            id: location.address.id, // Use existing address ID
            name: formData.address.name,
            address: formData.address.address,
            address1: formData.address.address1,
            city: formData.address.city,
            state: formData.address.state,
            zip: formData.address.zip,
          },
          start_open_time: formData.startOpenTime,
          end_open_time: formData.endOpenTime,
          provider_id: formData.providerId || '8fe720cc-6641-42c8-8fde-612dcce14520',
          active: formData.active,
        });
        
        if (updatedLocation) {
          toast.success('Delivery location updated successfully');
          onSave(updatedLocation);
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Failed to save delivery location');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!location || !onDelete) {
      console.error('Cannot delete: location or onDelete function is missing', { location, onDelete });
      toast.error('Cannot delete location due to missing data');
      return;
    }
    
    try {
      console.log('Attempting to delete location:', location.id);
      await onDelete(location.id);
      console.log('Delete operation completed');
      toast.success('Delivery location deleted successfully');
      setIsDeleting(false);
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete delivery location');
    }
  };

  const handleAddSite = async (siteId: string, locationId: string) => {
    try {
      await addSiteToLocation(siteId, locationId);
      await loadSites();
      toast.success('Site added to delivery location');
    } catch (error) {
      console.error('Error adding site:', error);
      toast.error('Failed to add site to delivery location');
    }
  };

  const handleRemoveSite = async (siteId: string, locationId: string) => {
    try {
      await removeSiteFromLocation(siteId, locationId);
      await loadSites();
      toast.success('Site removed from delivery location');
    } catch (error) {
      console.error('Error removing site:', error);
      toast.error('Failed to remove site from delivery location');
    }
  };

  // If we're creating a new location or editing an existing one, show the form
  if (isNew || isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isNew ? 'Create Delivery Location' : 'Edit Delivery Location'}</CardTitle>
          <CardDescription>
            {isNew 
              ? 'Add a new delivery location for the current week' 
              : 'Update delivery location details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeliveryLocationForm
            onSubmit={handleFormSubmit}
            initialData={location}
            isLoading={isFormSubmitting}
            deliveryPeriodId={deliveryPeriodId}
            deliveryPeriods={deliveryPeriods}
            onSelectDeliveryPeriod={onSelectDeliveryPeriod}
          />
        </CardContent>
        {!isNew && (
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  // If we don't have a location, show a placeholder
  if (!location) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Select a delivery location to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show location details
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{location.name}</CardTitle>
            <CardDescription>
              {location.address.city}, {location.address.state}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Delivery Location</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this delivery location? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setIsDeleting(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                      Delete
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <div>
                      <p>{location.address.address}</p>
                      {location.address.address1 && <p>{location.address.address1}</p>}
                      <p>
                        {location.address.city}, {location.address.state} {location.address.zip}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Delivery Hours</h3>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p>
                      {(() => {
                        const startTime = safeFormatTime(location.start_open_time);
                        const endTime = safeFormatTime(location.end_open_time);
                        
                        return startTime && endTime
                          ? `${startTime} - ${endTime}`
                          : 'No hours specified';
                      })()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Coordinates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Latitude</span>
                    <p>{location.address.latitude || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Longitude</span>
                    <p>{location.address.longitude || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="sites">
            {sitesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2">Loading sites...</span>
              </div>
            ) : (
              <DeliveryLocationSites
                deliveryLocation={location}
                onAddSite={handleAddSite}
                onRemoveSite={handleRemoveSite}
                associatedSites={locationSites}
                isLoading={isLoading}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
