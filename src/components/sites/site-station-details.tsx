
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Station {
  id: string;
  name: string;
  address: string;
  address1?: string;
  city: string;
  state: string;
  zip: string;
  site_id: string;
  created_at: string;
  number?: number;
  latitude?: number;
  longitude?: number;
  registration_code?: string;
  description?: string;
  long_description?: string;
}

interface SiteStationDetailsProps {
  station: Station;
}

export function SiteStationDetails({ station }: SiteStationDetailsProps) {
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
