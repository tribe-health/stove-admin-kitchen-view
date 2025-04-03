import { useState, useEffect } from 'react';
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
import { TimePickerInput } from '@/components/ui/time-picker-input';
import { format } from 'date-fns';

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
});

type DeliveryLocationFormValues = z.infer<typeof deliveryLocationSchema>;

interface DeliveryLocationFormProps {
  onSubmit: (data: DeliveryLocationFormValues) => void;
  initialData?: Partial<DeliveryLocation>;
  isLoading?: boolean;
  deliveryPeriodId?: string;
}

export function DeliveryLocationForm({
  onSubmit,
  initialData,
  isLoading = false,
  deliveryPeriodId,
}: DeliveryLocationFormProps) {
  const [startTime, setStartTime] = useState<Date | undefined>(
    initialData?.start_open_time ? new Date(initialData.start_open_time) : undefined
  );
  const [endTime, setEndTime] = useState<Date | undefined>(
    initialData?.end_open_time ? new Date(initialData.end_open_time) : undefined
  );

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
      startOpenTime: initialData?.start_open_time ? format(new Date(initialData.start_open_time), 'HH:mm') : '',
      endOpenTime: initialData?.end_open_time ? format(new Date(initialData.end_open_time), 'HH:mm') : '',
      providerId: initialData?.provider_id || '',
    },
  });

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
  const handleSubmit = (data: DeliveryLocationFormValues) => {
    // Add delivery period ID if provided
    const formData = {
      ...data,
      deliveryPeriodId,
    };
    onSubmit(formData);
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
                    <FormControl>
                      <Input placeholder="Select provider" {...field} />
                    </FormControl>
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
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