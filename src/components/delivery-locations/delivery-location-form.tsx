import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DeliveryLocation } from '@/store/use-delivery-locations-store';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { TimePickerDemo } from '@/components/datetime/time-picker-demo';
import { cn } from '@/lib/utils';
import { format, isValid, parse } from 'date-fns';
import { useProviders } from '@/hooks/use-providers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

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
  active: z.boolean().default(true),
});

export type DeliveryLocationFormValues = z.infer<typeof deliveryLocationSchema>;

interface DeliveryLocationFormProps {
  onSubmit: (data: DeliveryLocationFormValues) => void;
  initialData?: Partial<DeliveryLocation>;
  isLoading?: boolean;
  onSelectDeliveryPeriod?: (periodId: string) => void;
}

export function DeliveryLocationForm({
  onSubmit,
  initialData,
  isLoading = false,
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
      active: initialData?.active !== undefined ? initialData.active : true,
    },
  });

  // Set first provider as default when providers are loaded and no provider is selected
  useEffect(() => {
    if (!isLoadingProviders && providers.length > 0 && !form.getValues('providerId')) {
      // Simply set the default provider ID without triggering validation
      form.setValue('providerId', providers[0].id, { shouldValidate: false });
    }
  }, [providers, isLoadingProviders, form]);

  // Update form values when time changes
  useEffect(() => {
    if (startTime) {
      form.setValue('startOpenTime', format(startTime, 'yyyy-MM-dd HH:mm:ss'));
    }
  }, [startTime, form]);

  useEffect(() => {
    if (endTime) {
      form.setValue('endOpenTime', format(endTime, 'yyyy-MM-dd HH:mm:ss'));
    }
  }, [endTime, form]);

  // Handle form submission
  const handleSubmit = async (data: DeliveryLocationFormValues) => {
    if (!startTime || !endTime) {
      return;
    }

    // CRITICAL: Always use the provider ID from the form, or the first provider as fallback
    // This ensures we always have a provider ID even if the user didn't change the default
    // This is the key part of the fix for the provider ID issue
    let providerId = data.providerId || form.getValues('providerId') || (providers.length > 0 ? providers[0].id : '');
    
    // Log to verify the provider ID is being used
    console.log('Provider ID for submission:', providerId);

    if (!providerId) {
      providerId = '8fe720cc-6641-42c8-8fde-612dcce14520';
      return;
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
        start_open_time: format(startTime, 'yyyy-MM-dd HH:mm:ss'),
        end_open_time: format(endTime, 'yyyy-MM-dd HH:mm:ss'),
        provider_id: providerId, // Always use the provider ID
        active: data.active,
      };

      // Log the form data to verify provider_id is included
      console.log('Submitting form data:', formData);
      
      onSubmit(formData);
    } catch (error) {
      console.error("Error during form submission:", error);
      // Submit without coordinates if there was an error
      const formData = {
        name: data.name,
        address: data.address,
        start_open_time: format(startTime, 'yyyy-MM-dd HH:mm:ss'),
        end_open_time: format(endTime, 'yyyy-MM-dd HH:mm:ss'),
        provider_id: providerId, // Always use the provider ID
        active: data.active,
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
                      <FormLabel>Start Date/Time</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !startTime && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startTime ? format(startTime, "PPP HH:mm:ss") : <span>Select start date/time</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={startTime}
                              onSelect={(date) => {
                                if (!date) return;
                                if (!startTime) {
                                  setStartTime(date);
                                  return;
                                }
                                const diff = date.getTime() - startTime.getTime();
                                const diffInDays = diff / (1000 * 60 * 60 * 24);
                                const newDateFull = new Date(startTime);
                                newDateFull.setDate(newDateFull.getDate() + Math.ceil(diffInDays));
                                setStartTime(newDateFull);
                              }}
                              initialFocus
                            />
                            <div className="p-3 border-t border-border">
                              <TimePickerDemo
                                setDate={setStartTime}
                                date={startTime}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
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
                      <FormLabel>End Date/Time</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !endTime && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endTime ? format(endTime, "PPP HH:mm:ss") : <span>Select end date/time</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={endTime}
                              onSelect={(date) => {
                                if (!date) return;
                                if (!endTime) {
                                  setEndTime(date);
                                  return;
                                }
                                const diff = date.getTime() - endTime.getTime();
                                const diffInDays = diff / (1000 * 60 * 60 * 24);
                                const newDateFull = new Date(endTime);
                                newDateFull.setDate(newDateFull.getDate() + Math.ceil(diffInDays));
                                setEndTime(newDateFull);
                              }}
                              initialFocus
                            />
                            <div className="p-3 border-t border-border">
                              <TimePickerDemo
                                setDate={setEndTime}
                                date={endTime}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        This location will be available for delivery
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
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
