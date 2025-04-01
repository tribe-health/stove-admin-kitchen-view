
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SiteStationDetailsProps {
  siteId: string;
}

export function SiteStationDetails({ siteId }: SiteStationDetailsProps) {
  const [station, setStation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (siteId) {
      fetchStationDetails();
    }
  }, [siteId]);

  async function fetchStationDetails() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .eq('site_id', siteId)
        .single();

      if (error) throw error;
      setStation(data);
    } catch (error) {
      console.error('Error fetching station details:', error);
      toast({
        variant: "destructive",
        title: "Error fetching station details",
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!station) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p>No station information available for this site.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Station Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Station Name</p>
            <p>{station.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Registration Code</p>
            <p className="font-mono">{station.registration_code}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Station Number</p>
            <p>{station.number || "N/A"}</p>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Location</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p>{station.address}</p>
              {station.address1 && <p>{station.address1}</p>}
              <p>{station.city}, {station.state} {station.zip}</p>
            </div>
            {(station.latitude && station.longitude) && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coordinates</p>
                <p>
                  Lat: {station.latitude.toFixed(6)}, 
                  Lng: {station.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>

        {station.description && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
              <p>{station.description}</p>
            </div>
          </>
        )}
        
        {station.long_description && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Extended Description</h4>
              <p className="whitespace-pre-wrap">{station.long_description}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
