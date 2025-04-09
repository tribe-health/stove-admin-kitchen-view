import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DeliveryLocation, DeliveryPeriod } from '@/store/use-delivery-locations-store';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { TimePickerInput } from '@/components/ui/time-picker-input';
import { format, isValid } from 'date-fns';
import { useProviders } from '@/hooks/use-providers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Address schema
const addressSchema = z.object({
  name: z.string().min(1, { message: "Address name is required." }),
  address: z.string().min(1, { message: "Street address is required." }),
  address1: z.string().optional(),
  city: z.string().min(1, { message: "City is required." }),
  state: z.string().min(1, { message: "State is required." }),
  zip: z.string().min(1, { message: "ZIP code is required." }),
});

// Delivery location schema
const deliveryLocationSchema = z.object({
  name: z.string().min(1, { message: "Location name is required." }),
  address: addressSchema,
  startOpenTime: z.string().min(1, { message: "Start time is required." }),
  endOpenTime: z.string().min(1, { message: "End time is required." }),
  providerId: z.string().min(1, { message: "Provider is required." }),
  deliveryPeriodId: z.string().optional(),
});

export type DeliveryLocationFormValues = z.infer<typeof deliveryLocationSchema>;

interface DeliveryLocationFormProps {
  onSubmit: (data: DeliveryLocationFormValues) => void;
  initialData?: Partial<DeliveryLocation>;
  isLoading?: boolean;
  deliveryPeriodId?: string;
  deliveryPeriods?: DeliveryPeriod[];
  onSelectDeliveryPeriod?: (periodId: string) => void;
}

export function DeliveryLocationForm({
  onSubmit,
  initialData,
  isLoading = false,
  deliveryPeriodId,
  deliveryPeriods,
  onSelectDeliveryPeriod,
}: DeliveryLocationFormProps) {
  // Helper function to safely format time values
  const safeFormatTime = (timeString?: string, formatStr: string = 'HH:mm') => {
    if (!timeString) return '';
    
    const date = new Date(timeString);
    return isValid(date) ? format(date, formatStr) : '';
  };
  
  // Helper function to safely create a Date object
  const safeCreateDate = (timeString?: string) => {
    if (!timeString) return undefined;
    
    const date = new Date(timeString);
    return isValid(date) ? date : undefined;
  };
  const [startTime, setStartTime] = useState<Date | undefined>(
    safeCreateDate(initialData?.start_open_time)
  );
  const [endTime, setEndTime] = useState<Date | undefined>(
    safeCreateDate(initialData?.end_open_time)
  );
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  const { providers, isLoading: isLoadingProviders } = useProviders();

  // Function to get latitude and longitude from address using Mapbox API
  const getCoordinatesFromAddress = useCallback(async (address: {
    name?: string;
    address: string;
    address1?: string;
    city: string;
    state: string;
    zip: string;
    latitude?: number;
    longitude?: number;
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
  }, []);

  // Initialize form with default values or initial data
  const form = useForm<DeliveryLocationFormValues>({
    resolver: zodResolver(deliveryLocationSchema),
    defaultValues: {
      name: initialData?.name || '',
      address: {
        name: initialData?.address?.name || '',
        address: initialData?.address?.address || '',
        address1: initialData?.address?.address1 || '',
        city: initialData?.address?.city || '',
        state: initialData?.address?.state || '',
        zip: initialData?.address?.zip || '',
      },
      startOpenTime: safeFormatTime(initialData?.start_open_time),
      endOpenTime: safeFormatTime(initialData?.end_open_time),
      providerId: initialData?.provider_id || '',
      deliveryPeriodId: initialData?.delivery_period_id || deliveryPeriodId || '',
    },
  });

  // Set first provider as default when providers are loaded and no provider is selected
  useEffect(() => {
    if (!isLoadingProviders && providers.length > 0 && !form.getValues('providerId')) {
      const defaultProviderId = providers[0].id;
      form.setValue('providerId', defaultProviderId);
      
      // Manually trigger onChange to ensure the value is registered in the form state
      const event = {
        target: { value: defaultProviderId }
      };
      form.handleSubmit(() => {})();
    }
  }, [providers, isLoadingProviders, form]);

  // Update form values when time changes
  useEffect(() => {
    if (startTime) {
      form.setValue('startOpenTime', format(startTime, 'HH:mm'));
    }
  }, [startTime, form]);

  useEffect(() => {
    if (endTime) {
      form.setValue('endOpenTime', format(endTime, 'HH:mm'));
    }
  }, [endTime, form]);

  // Handle form submission
  const handleSubmit = async (data: DeliveryLocationFormValues) => {
    if (!startTime || !endTime) {
      return;
    }

    // Ensure provider ID is set, using the first provider as fallback if needed
    let providerId = data.providerId;
    if (!providerId && providers.length > 0) {
      providerId = providers[0].id;
    }

    try {
      // Set geocoding loading state
      setIsGeocodingLoading(true);
      
      // Get coordinates from address if all required fields are present
      let coordinates = null;
      if (data.address.address && data.address.city && data.address.state && data.address.zip) {
        coordinates = await getCoordinatesFromAddress({
          name: data.address.name,
          address: data.address.address,
          address1: data.address.address1,
          city: data.address.city,
          state: data.address.state,
          zip: data.address.zip
        });
      }
      
      // Format the data with proper field names and format times as HH:mm
      const formData = {
        name: data.name,
        address: {
          ...data.address,
          // Add coordinates if available
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude,
        },
        start_open_time: format(startTime, 'HH:mm'),
        end_open_time: format(endTime, 'HH:mm'),
        provider_id: providerId,
        delivery_period_id: data.deliveryPeriodId || deliveryPeriodId,
      };

      onSubmit(formData);
    } catch (error) {
      console.error("Error during form submission:", error);
      // Submit without coordinates if there was an error
      const formData = {
        name: data.name,
        address: data.address,
        start_open_time: format(startTime, 'HH:mm'),
        end_open_time: format(endTime, 'HH:mm'),
        provider_id: providerId,
        delivery_period_id: data.deliveryPeriodId || deliveryPeriodId,
      };
      
      onSubmit(formData);
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startOpenTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <TimePickerInput
                          value={startTime}
                          onChange={setStartTime}
                          placeholder="Select start time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endOpenTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <TimePickerInput
                          value={endTime}
                          onChange={setEndTime}
                          placeholder="Select end time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Ensure the value is properly set in the form
                        form.setValue('providerId', value, { shouldValidate: true });
                      }}
                      value={field.value || (providers.length > 0 ? providers[0].id : '')}
                      defaultValue={field.value || (providers.length > 0 ? providers[0].id : '')}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingProviders ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          providers.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Delivery Period Selection (only shown when multiple periods exist) */}
              {deliveryPeriods && deliveryPeriods.length > 1 && onSelectDeliveryPeriod && (
                <FormField
                  control={form.control}
                  name="deliveryPeriodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Period</FormLabel>
                      <Select
                        value={deliveryPeriodId || ''}
                        onValueChange={(value) => {
                          if (onSelectDeliveryPeriod) {
                            onSelectDeliveryPeriod(value);
                          }
                          form.setValue('deliveryPeriodId', value);
                          field.onChange(value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select delivery period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {deliveryPeriods.map((period) => (
                            <SelectItem key={period.id} value={period.id}>
                              {period.title || `Week of ${safeFormatTime(period.start_date, 'MMM d, yyyy')}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Address Information</h3>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="address.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter address name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.address1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2 (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter address line 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter state" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter ZIP code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading || isGeocodingLoading}>
            {isLoading || isGeocodingLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isGeocodingLoading ? 'Getting coordinates...' : 'Saving...'}
              </>
            ) : (
              'Save Location'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
