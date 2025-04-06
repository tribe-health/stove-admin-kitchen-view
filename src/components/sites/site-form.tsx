import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Json } from "@/integrations/supabase/types";

// Define the schema for the form
const formSchema = z.object({
  // Basic site information
  name: z.string().min(1, "Site name is required"),
  organization_id: z.string().min(1, "Organization is required"),
  site_type_id: z.string().min(1, "Site type is required"),
  code: z.string().optional(),
  
  // Station specific fields
  station_name: z.string().optional(),
  station_number: z.number().optional(),
  registration_code: z.string().optional(),
  address: z.string().optional(),
  address1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  description: z.string().optional(),
  long_description: z.string().optional(),
});

// Define the type for the form values
type FormValues = z.infer<typeof formSchema>;

interface Organization {
  id: string;
  name: string;
}

interface SiteType {
  id: string;
  name: string;
  key: string;
  managing_table: string;
  schema?: Json;
}

interface SiteFormProps {
  siteId?: string;
  onSuccess: (site: { id: string; name: string; organization_id: string; site_type_id: string; data: Json }) => void;
  onCancel: () => void;
}

export function SiteForm({ siteId, onSuccess, onCancel }: SiteFormProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [siteTypes, setSiteTypes] = useState<SiteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSiteType, setSelectedSiteType] = useState<SiteType | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const { toast } = useToast();

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      organization_id: "",
      site_type_id: "",
      code: "",
      station_name: "",
      registration_code: "",
      address: "",
      address1: "",
      city: "",
      state: "",
      zip: "",
      description: "",
      long_description: "",
    },
  });

  // Watch for site type changes to update the form schema
  const watchSiteTypeId = form.watch("site_type_id");

  useEffect(() => {
    fetchOrganizationsAndSiteTypes();
    if (siteId) {
      fetchSiteDetails();
    } else {
      setLoading(false);
    }
  }, [siteId]);

  // Update the selected site type when the site type ID changes
  useEffect(() => {
    if (watchSiteTypeId && siteTypes.length > 0) {
      const siteType = siteTypes.find(type => type.id === watchSiteTypeId);
      setSelectedSiteType(siteType || null);
      
      // If site type is changed, switch to the appropriate tab
      if (siteType?.managing_table === "stations") {
        setActiveTab("station");
      } else {
        setActiveTab("basic");
      }
    }
  }, [watchSiteTypeId, siteTypes]);

  async function fetchOrganizationsAndSiteTypes() {
    try {
      // Fetch organizations
      const { data: orgData, error: orgError } = await supabase
        .from('organization')
        .select('id, name')
        .order('name');

      if (orgError) throw orgError;
      setOrganizations(orgData || []);

      // Fetch site types
      const { data: typeData, error: typeError } = await supabase
        .from('site_type')
        .select('*')
        .order('name');

      if (typeError) throw typeError;
      setSiteTypes(typeData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: (error as Error).message,
      });
    }
  }

  async function fetchSiteDetails() {
    try {
      // Fetch site data
      const { data: siteData, error: siteError } = await supabase
        .from('site')
        .select('*')
        .eq('id', siteId)
        .single();

      if (siteError) throw siteError;

      if (siteData) {
        // Set basic site data
        form.setValue("name", siteData.name);
        form.setValue("organization_id", siteData.organization_id);
        form.setValue("site_type_id", siteData.site_type_id);
        
        // Handle the data field which is of type Json
        if (siteData.data && typeof siteData.data === 'object') {
          const siteDataObj = siteData.data as Json;
          form.setValue("code", (siteDataObj as Record<string, unknown>).code as string || "");
        }

        // Fetch site type details
        const { data: typeData, error: typeError } = await supabase
          .from('site_type')
          .select('*')
          .eq('id', siteData.site_type_id)
          .single();

        if (typeError) throw typeError;
        
        if (typeData && typeData.managing_table === "stations") {
          // Fetch station details
          const { data: stationData, error: stationError } = await supabase
            .from('stations')
            .select('*')
            .eq('site_id', siteId)
            .single();

          if (stationError && stationError.code !== 'PGRST116') { // Not found is ok
            throw stationError;
          }

          if (stationData) {
            // Set station specific fields
            form.setValue("station_name", stationData.name);
            form.setValue("station_number", stationData.number || undefined);
            form.setValue("registration_code", stationData.registration_code || "");
            
            // Get address details if available
            if (stationData.address_id) {
              const { data: addressData, error: addressError } = await supabase
                .from('address')
                .select('*')
                .eq('id', stationData.address_id)
                .single();
                
              if (!addressError && addressData) {
                form.setValue("address", addressData.address || "");
                form.setValue("address1", addressData.address1 || "");
                form.setValue("city", addressData.city || "");
                form.setValue("state", addressData.state || "");
                form.setValue("zip", addressData.zip || "");
                form.setValue("latitude", addressData.latitude || undefined);
                form.setValue("longitude", addressData.longitude || undefined);
              }
            }
            
            form.setValue("description", stationData.description || "");
            form.setValue("long_description", stationData.long_description || "");
          }
        }
      }
    } catch (error) {
      console.error('Error fetching site details:', error);
      toast({
        variant: "destructive",
        title: "Error fetching site details",
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      let site_id: string;
      
      // Prepare site data
      const siteData = {
        name: values.name,
        organization_id: values.organization_id,
        site_type_id: values.site_type_id,
        data: {
          code: values.code,
        },
      };

      // Create or update site
      if (siteId) {
        // Update existing site
        const { data, error } = await supabase
          .from('site')
          .update(siteData)
          .eq('id', siteId)
          .select()
          .single();

        if (error) throw error;
        site_id = data.id;
      } else {
        // Create new site
        const { data, error } = await supabase
          .from('site')
          .insert(siteData)
          .select()
          .single();

        if (error) throw error;
        site_id = data.id;
      }

      // Handle station specific data if applicable
      if (selectedSiteType?.managing_table === "stations") {
        // First, create or update the address
        let address_id: string;
        
        const addressData = {
          address: values.address || "",
          address1: values.address1 || "",
          city: values.city || "",
          state: values.state || "",
          zip: values.zip || "",
          latitude: values.latitude,
          longitude: values.longitude,
          name: values.station_name || values.name, // Use station name or site name
        };
        
        // Check if we already have an address for this station
        let existingAddressId: string | null = null;
        
        const { data: existingStation, error: stationCheckError } = await supabase
          .from('stations')
          .select('address_id')
          .eq('site_id', site_id)
          .maybeSingle();
          
        if (!stationCheckError && existingStation && existingStation.address_id) {
          existingAddressId = existingStation.address_id;
          
          // Update existing address
          const { data: updatedAddress, error: addressUpdateError } = await supabase
            .from('address')
            .update(addressData)
            .eq('id', existingAddressId)
            .select()
            .single();
            
          if (addressUpdateError) throw addressUpdateError;
          address_id = updatedAddress.id;
        } else {
          // Create new address
          const { data: newAddress, error: addressCreateError } = await supabase
            .from('address')
            .insert(addressData)
            .select()
            .single();
            
          if (addressCreateError) throw addressCreateError;
          address_id = newAddress.id;
        }
        
        // Now create or update the station
        const stationData = {
          site_id: site_id,
          name: values.station_name || values.name,
          number: values.station_number,
          registration_code: values.registration_code || "",
          address_id: address_id,
          description: values.description || "",
          long_description: values.long_description || "",
        };

        // Check if station record already exists
        if (existingStation) {
          // Update existing station
          const { error: stationUpdateError } = await supabase
            .from('stations')
            .update(stationData)
            .eq('site_id', site_id);

          if (stationUpdateError) throw stationUpdateError;
        } else {
          // Create new station
          const { error: stationCreateError } = await supabase
            .from('stations')
            .insert(stationData);

          if (stationCreateError) throw stationCreateError;
        }
      }

      toast({
        title: "Success",
        description: `Site ${siteId ? "updated" : "created"} successfully`,
      });

      onSuccess({ id: site_id, ...siteData });
    } catch (error) {
      console.error('Error saving site:', error);
      toast({
        variant: "destructive",
        title: "Error saving site",
        description: (error as Error).message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{siteId ? "Edit Site" : "Create New Site"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                {selectedSiteType?.managing_table === "stations" && (
                  <TabsTrigger value="station">Station Details</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter site name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter site code (optional)" {...field} />
                        </FormControl>
                        <FormDescription>
                          A unique code for this site (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="organization_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an organization" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="site_type_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a site type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {siteTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The type of site determines what additional information is required
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              {selectedSiteType?.managing_table === "stations" && (
                <TabsContent value="station" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Station Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="station_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Station Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter station name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="station_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Station Number</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Enter station number" 
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value ? parseInt(value) : undefined);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="registration_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter registration code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Location</h3>
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter street address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter address line 2 (optional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
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
                        name="state"
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
                        name="zip"
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.000001"
                                placeholder="Enter latitude (optional)" 
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value ? parseFloat(value) : undefined);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.000001"
                                placeholder="Enter longitude (optional)" 
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value ? parseFloat(value) : undefined);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Description</h3>
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter a brief description of the station" 
                              className="resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="long_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Extended Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter a detailed description of the station" 
                              className="resize-none min-h-[150px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Site
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}