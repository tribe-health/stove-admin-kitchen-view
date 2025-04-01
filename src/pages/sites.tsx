
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { SiteDetails } from "@/components/sites/site-details";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function SitesPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSites();
  }, []);

  async function fetchSites() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site')
        .select(`
          *,
          organization:organization_id (name),
          site_type:site_type_id (name, key)
        `);

      if (error) {
        throw error;
      }

      setSites(data || []);
    } catch (error) {
      console.error('Error fetching sites:', error);
      toast({
        variant: "destructive",
        title: "Error fetching sites",
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  }

  function getSiteTypeBadgeColor(siteType: string) {
    switch (siteType.toLowerCase()) {
      case 'fire station':
        return "bg-red-500";
      case 'hospital':
        return "bg-blue-500";
      case 'clinic':
        return "bg-green-500";
      case 'station':
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Sites</h1>
          <Button>Add New Site</Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Sites</TabsTrigger>
            <TabsTrigger value="stations">Stations</TabsTrigger>
            <TabsTrigger value="hospitals">Hospitals</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Sites</CardTitle>
                <CardDescription>
                  Manage all sites across organizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sites.map((site) => (
                        <TableRow key={site.id}>
                          <TableCell className="font-medium">{site.name}</TableCell>
                          <TableCell>{site.data?.code || "N/A"}</TableCell>
                          <TableCell>
                            <Badge className={getSiteTypeBadgeColor(site.site_type?.name || "")}>
                              {site.site_type?.name}
                            </Badge>
                          </TableCell>
                          <TableCell>{site.organization?.name || "Unknown"}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedSite(site.id)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stations" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Stations</CardTitle>
                <CardDescription>View and manage station sites</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sites
                        .filter(site => site.site_type?.key === 'station')
                        .map((site) => (
                          <TableRow key={site.id}>
                            <TableCell className="font-medium">{site.name}</TableCell>
                            <TableCell>{site.data?.code || "N/A"}</TableCell>
                            <TableCell>{site.organization?.name || "Unknown"}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedSite(site.id)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="hospitals" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Hospitals</CardTitle>
                <CardDescription>View and manage hospital sites</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sites
                        .filter(site => site.site_type?.key === 'hospital')
                        .map((site) => (
                          <TableRow key={site.id}>
                            <TableCell className="font-medium">{site.name}</TableCell>
                            <TableCell>{site.data?.code || "N/A"}</TableCell>
                            <TableCell>{site.organization?.name || "Unknown"}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedSite(site.id)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="other" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Other Sites</CardTitle>
                <CardDescription>View and manage other site types</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sites
                        .filter(site => 
                          site.site_type?.key !== 'hospital' && 
                          site.site_type?.key !== 'station'
                        )
                        .map((site) => (
                          <TableRow key={site.id}>
                            <TableCell className="font-medium">{site.name}</TableCell>
                            <TableCell>{site.data?.code || "N/A"}</TableCell>
                            <TableCell>
                              <Badge className={getSiteTypeBadgeColor(site.site_type?.name || "")}>
                                {site.site_type?.name}
                              </Badge>
                            </TableCell>
                            <TableCell>{site.organization?.name || "Unknown"}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedSite(site.id)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedSite && (
          <SiteDetails 
            siteId={selectedSite} 
            onClose={() => setSelectedSite(null)} 
            onSiteUpdated={fetchSites}
          />
        )}
      </div>
    </AdminLayout>
  );
}
