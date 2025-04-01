
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteStationDetails } from "./site-station-details";

interface SiteDetailsProps {
  siteId: string;
  onClose: () => void;
  onSiteUpdated: () => void;
}

export function SiteDetails({ siteId, onClose, onSiteUpdated }: SiteDetailsProps) {
  const [site, setSite] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedEntities, setRelatedEntities] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (siteId) {
      fetchSiteDetails();
    }
  }, [siteId]);

  async function fetchSiteDetails() {
    try {
      setLoading(true);
      
      // Fetch the site with related data
      const { data: siteData, error: siteError } = await supabase
        .from('site')
        .select(`
          *,
          organization:organization_id (*),
          site_type:site_type_id (*)
        `)
        .eq('id', siteId)
        .single();

      if (siteError) throw siteError;
      setSite(siteData);

      // Fetch specialized data based on site type
      if (siteData.site_type.managing_table) {
        const { data: specializedData, error: specializedError } = await supabase
          .from(siteData.site_type.managing_table)
          .select('*')
          .eq('site_id', siteId);

        if (specializedError) throw specializedError;
        setRelatedEntities(specializedData);
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

  if (!siteId) return null;

  return (
    <Dialog open={!!siteId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : site ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3">
                {site.name}
                {site.site_type?.name && (
                  <Badge variant="outline">{site.site_type.name}</Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Site Code: <span className="font-mono">{site.data?.code || "N/A"}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  {site.site_type?.key === 'station' && (
                    <TabsTrigger value="station">Station Info</TabsTrigger>
                  )}
                  <TabsTrigger value="organization">Organization</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Site Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Name</p>
                          <p>{site.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Type</p>
                          <p>{site.site_type?.name || "Unknown"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Code</p>
                          <p className="font-mono">{site.data?.code || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Created</p>
                          <p>{new Date(site.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      {site.data && Object.keys(site.data).length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Additional Data</h4>
                            <pre className="bg-muted p-2 rounded-md overflow-auto text-xs">
                              {JSON.stringify(site.data, null, 2)}
                            </pre>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {site.site_type?.key === 'station' && (
                  <TabsContent value="station" className="mt-4">
                    <SiteStationDetails siteId={siteId} />
                  </TabsContent>
                )}
                
                <TabsContent value="organization" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Organization Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      {site.organization ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Name</p>
                            <p>{site.organization.name}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Description</p>
                            <p>{site.organization.description || "No description available"}</p>
                          </div>
                          {site.organization.web_url && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Website</p>
                              <a href={site.organization.web_url} target="_blank" rel="noopener noreferrer" 
                                className="text-blue-500 hover:underline">
                                {site.organization.web_url}
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p>No organization information available.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button>Edit Site</Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p>Site not found</p>
            <Button className="mt-4" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
