
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteStationDetails } from "./site-station-details";

interface Site {
  id: string;
  name: string;
  description: string;
  code: string;
  site_type_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

interface SiteType {
  id: string;
  name: string;
  description: string;
  managing_table: string | null;
}

interface Organization {
  id: string;
  name: string;
  description: string;
}

interface SiteDetailsProps {
  siteId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SiteDetails({ siteId, isOpen, onClose }: SiteDetailsProps) {
  const [site, setSite] = useState<Site | null>(null);
  const [siteType, setSiteType] = useState<SiteType | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (siteId && isOpen) {
      fetchSiteDetails(siteId);
    } else {
      setSite(null);
      setSiteType(null);
      setOrganization(null);
    }
  }, [siteId, isOpen]);

  async function fetchSiteDetails(id: string) {
    try {
      setLoading(true);
      
      const { data: siteData, error: siteError } = await supabase
        .from('sites')
        .select('*')
        .eq('id', id)
        .single();

      if (siteError) throw siteError;
      setSite(siteData);

      if (siteData.site_type_id) {
        const { data: typeData, error: typeError } = await supabase
          .from('site_types')
          .select('*')
          .eq('id', siteData.site_type_id)
          .single();
          
        if (typeError) throw typeError;
        setSiteType(typeData);
      }

      if (siteData.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', siteData.organization_id)
          .single();
          
        if (orgError) throw orgError;
        setOrganization(orgData);
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{loading ? "Loading Site..." : site?.name}</DialogTitle>
          <DialogDescription>
            View complete details for this site.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Site Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p>{site?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Code</p>
                    <p className="font-mono">{site?.code}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <p>{siteType?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Organization</p>
                    <p>{organization?.name || "N/A"}</p>
                  </div>
                </div>
                
                {site?.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p>{site.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* For stations, show station details */}
            {siteType?.managing_table === 'stations' && site && (
              <SiteStationDetails siteId={site.id} />
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
