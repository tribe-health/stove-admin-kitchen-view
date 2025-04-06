import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SiteDetails } from "@/components/sites/site-details";
import { SiteForm } from "@/components/sites/site-form";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { 
  Loader2, 
  Plus, 
  Search, 
  Building, 
  Filter, 
  MapPin, 
  X,
  RefreshCw
} from "lucide-react";

interface Site {
  id: string;
  name: string;
  data: Json;
  organization_id: string;
  site_type_id: string;
  organization?: {
    name: string;
  };
  site_type?: {
    name: string;
    key: string;
    managing_table?: string;
  };
  created_at: string;
}

export default function Sites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [filteredSites, setFilteredSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    // Filter sites based on search term and active tab
    let filtered = sites;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(site => {
        // Extract code from data if it exists and is an object
        let code = "";
        if (site.data && typeof site.data === 'object') {
          const dataObj = site.data as Record<string, unknown>;
          code = (dataObj.code as string) || "";
        }
        
        return site.name.toLowerCase().includes(term) || 
          code.toLowerCase().includes(term) ||
          site.organization?.name?.toLowerCase().includes(term) ||
          site.site_type?.name?.toLowerCase().includes(term);
      });
    }
    
    // Apply tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter(site => site.site_type?.key === activeTab);
    }
    
    setFilteredSites(filtered);
  }, [sites, searchTerm, activeTab]);

  async function fetchSites() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site')
        .select(`
          *,
          organization:organization_id (name),
          site_type:site_type_id (name, key, managing_table)
        `);

      if (error) {
        throw error;
      }

      setSites(data || []);
      setFilteredSites(data || []);
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

  // Helper function to safely get code from data
  function getSiteCode(data: Json): string {
    if (data && typeof data === 'object') {
      const dataObj = data as Record<string, unknown>;
      return (dataObj.code as string) || "N/A";
    }
    return "N/A";
  }

  function handleCreateSite() {
    setEditingSiteId(null);
    setIsFormOpen(true);
  }

  function handleEditSite(siteId: string) {
    setEditingSiteId(siteId);
    setIsFormOpen(true);
  }

  function handleFormSuccess(site: Site) {
    setIsFormOpen(false);
    fetchSites();
    toast({
      title: "Success",
      description: `Site ${editingSiteId ? "updated" : "created"} successfully`,
    });
  }

  function handleFormCancel() {
    setIsFormOpen(false);
  }

  function handleViewSite(siteId: string) {
    setSelectedSite(siteId);
  }

  function handleCloseSiteDetails() {
    setSelectedSite(null);
  }

  function handleRefresh() {
    fetchSites();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sites</h1>
          <p className="text-muted-foreground mt-2">
            Manage all sites and their associated details
          </p>
        </div>
        <Button onClick={handleCreateSite}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Site
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sites..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Sites</TabsTrigger>
          <TabsTrigger value="station">Fire Stations</TabsTrigger>
          <TabsTrigger value="hospital">Hospitals</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {activeTab === "all" ? "All Sites" : 
                     activeTab === "station" ? "Fire Stations" :
                     activeTab === "hospital" ? "Hospitals" : "Other Sites"}
                  </CardTitle>
                  <CardDescription>
                    {filteredSites.length} {filteredSites.length === 1 ? "site" : "sites"} found
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredSites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Building className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium">No sites found</h3>
                  <p className="text-muted-foreground mt-1 mb-4 max-w-md">
                    {searchTerm 
                      ? "Try adjusting your search or filters to find what you're looking for." 
                      : "Get started by adding your first site."}
                  </p>
                  {searchTerm && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchTerm("")}
                      className="mt-2"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
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
                      {filteredSites.map((site) => (
                        <TableRow key={site.id}>
                          <TableCell className="font-medium">{site.name}</TableCell>
                          <TableCell>{getSiteCode(site.data)}</TableCell>
                          <TableCell>
                            <Badge className={getSiteTypeBadgeColor(site.site_type?.name || "")}>
                              {site.site_type?.name}
                            </Badge>
                          </TableCell>
                          <TableCell>{site.organization?.name || "Unknown"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewSite(site.id)}
                              >
                                View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditSite(site.id)}
                              >
                                Edit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Site Details Dialog */}
      {selectedSite && (
        <SiteDetails 
          siteId={selectedSite} 
          onClose={handleCloseSiteDetails}
        />
      )}

      {/* Site Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <SiteForm
            siteId={editingSiteId || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
