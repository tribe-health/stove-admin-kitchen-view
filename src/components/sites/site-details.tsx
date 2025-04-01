
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X, MapPin, Building, Phone, Mail, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteStationDetails } from "./site-station-details";

// Define proper interfaces for your data
interface Site {
  id: string;
  name: string;
  data?: {
    code?: string;
    [key: string]: any;
  };
  site_type_id: string;
  organization_id: string;
  created_at: string;
}

interface SiteType {
  id: string;
  name: string;
  key: string;
  managing_table: string;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  created_at: string;
}

interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  site_id: string;
  created_at: string;
  number?: number;
  address1?: string;
  latitude?: number;
  longitude?: number;
  registration_code?: string;
  description?: string;
  long_description?: string;
}

export interface SiteDetailsProps {
  siteId: string;
  onClose: () => void;
}

export function SiteDetails({ siteId, onClose }: SiteDetailsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [site, setSite] = useState<Site | null>(null);
  const [siteType, setSiteType] = useState<SiteType | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stationDetails, setStationDetails] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (siteId) {
      fetchSiteDetails();
    }
  }, [siteId]);

  async function fetchSiteDetails() {
    setLoading(true);
    try {
      // Fetch site details
      const { data: siteData, error: siteError } = await supabase
        .from('site')
        .select('*')
        .eq('id', siteId)
        .single();

      if (siteError) throw siteError;
      if (siteData) {
        setSite(siteData as Site);

        // Fetch site type
        const { data: typeData, error: typeError } = await supabase
          .from('site_type')
          .select('*')
          .eq('id', siteData.site_type_id)
          .single();

        if (typeError) throw typeError;
        if (typeData) {
          setSiteType(typeData as SiteType);

          // If site type has a managing_table, fetch related data
          if (typeData.managing_table === 'stations') {
            const { data: stationData, error: stationError } = await supabase
              .from('stations')
              .select('*')
              .eq('site_id', siteId)
              .single();

            if (stationError) {
              console.error('Error fetching station details:', stationError);
            } else if (stationData) {
              setStationDetails(stationData as Station);
            }
          }
        }

        // Fetch organization
        const { data: orgData, error: orgError } = await supabase
          .from('organization')
          .select('*')
          .eq('id', siteData.organization_id)
          .single();

        if (orgError) throw orgError;
        if (orgData) {
          setOrganization(orgData as Organization);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error fetching site details",
        description: (error as Error).message || "Something went wrong"
      });
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl">Site Details</DialogTitle>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : site ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {stationDetails && <TabsTrigger value="station">Station Details</TabsTrigger>}
              <TabsTrigger value="organization">Organization</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">{site.name}</CardTitle>
                  <CardDescription>
                    {siteType?.name} • Code: {site.data?.code || "N/A"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Site Details</div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>Type: {siteType?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>Organization: {organization?.name}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Additional Information</div>
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span>Created: {new Date(site.created_at).toLocaleDateString()}</span>
                      </div>
                      {site.data?.code && (
                        <div className="flex items-center gap-2">
                          <Badge>Registration Code: {site.data.code}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">System Information</div>
                    <div className="text-sm text-muted-foreground">
                      <p>ID: {site.id}</p>
                      <p>Type ID: {site.site_type_id}</p>
                      <p>Organization ID: {site.organization_id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {stationDetails && (
              <TabsContent value="station" className="space-y-4 mt-4">
                <SiteStationDetails station={stationDetails} />
              </TabsContent>
            )}

            <TabsContent value="organization" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{organization?.name}</CardTitle>
                  <CardDescription>
                    Organization Details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {organization?.logo_url && (
                    <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden mb-4">
                      <img 
                        src={organization.logo_url} 
                        alt={`${organization.name} logo`} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  
                  {organization?.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{organization.description}</p>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">System Information</h4>
                    <p className="text-sm text-muted-foreground">Organization ID: {organization?.id}</p>
                    <p className="text-sm text-muted-foreground">
                      Created: {organization && new Date(organization.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-lg text-muted-foreground">No site found</p>
            <Button variant="outline" onClick={handleClose} className="mt-4">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
