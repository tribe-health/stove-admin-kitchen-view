import { useState, useEffect } from 'react';
import { DeliveryLocation } from '@/store/use-delivery-locations-store';
import { Site } from '@/types';
import { useSites } from '@/hooks/use-sites';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeliveryLocationSitesProps {
  deliveryLocation: DeliveryLocation;
  onAddSite: (siteId: string, deliveryLocationId: string) => Promise<void>;
  onRemoveSite: (siteId: string, deliveryLocationId: string) => Promise<void>;
  associatedSites: Site[];
  isLoading?: boolean;
}

export function DeliveryLocationSites({
  deliveryLocation,
  onAddSite,
  onRemoveSite,
  associatedSites,
  isLoading = false,
}: DeliveryLocationSitesProps) {
  const { sites, isLoading: sitesLoading } = useSites();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [siteToRemove, setSiteToRemove] = useState<Site | null>(null);

  // Filter out sites that are already associated with this delivery location
  const availableSites = sites.filter(
    (site) => !associatedSites.some((associatedSite) => associatedSite.id === site.id)
  );

  // Filter sites based on search term
  const filteredSites = availableSites.filter(
    (site) =>
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (site.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (site.address?.state?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle adding a site to the delivery location
  const handleAddSite = async () => {
    if (!selectedSiteId) {
      toast.error('Please select a site to add');
      return;
    }

    try {
      await onAddSite(selectedSiteId, deliveryLocation.id);
      toast.success('Site added to delivery location');
      setDialogOpen(false);
      setSelectedSiteId('');
    } catch (error) {
      toast.error('Failed to add site to delivery location');
      console.error('Error adding site:', error);
    }
  };

  // Handle removing a site from the delivery location
  const handleRemoveSite = async () => {
    if (!siteToRemove) return;

    try {
      await onRemoveSite(siteToRemove.id, deliveryLocation.id);
      toast.success('Site removed from delivery location');
      setConfirmDialogOpen(false);
      setSiteToRemove(null);
    } catch (error) {
      toast.error('Failed to remove site from delivery location');
      console.error('Error removing site:', error);
    }
  };

  // Confirm site removal
  const confirmRemoveSite = (site: Site) => {
    setSiteToRemove(site);
    setConfirmDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Associated Sites</CardTitle>
          <CardDescription>
            Sites that can order from this delivery location
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Site
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Site to Delivery Location</DialogTitle>
              <DialogDescription>
                Select a site to associate with this delivery location. Users at this site will be able to place orders.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sites..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="border rounded-md">
                <div className="max-h-[300px] overflow-y-auto">
                  {sitesLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Loading sites...
                    </div>
                  ) : filteredSites.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No sites available to add
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Location</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSites.map((site) => (
                          <TableRow key={site.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedSiteId === site.id}
                                onCheckedChange={() => setSelectedSiteId(site.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{site.name}</TableCell>
                            <TableCell>
                              {site.address
                                ? `${site.address.city}, ${site.address.state}`
                                : 'No address'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSite} disabled={!selectedSiteId || isLoading}>
                Add Site
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {associatedSites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No sites associated with this delivery location yet.</p>
            <p className="text-sm mt-1">
              Add sites to allow users to place orders from this location.
            </p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {associatedSites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium">{site.name}</TableCell>
                    <TableCell>
                      {site.address
                        ? `${site.address.city}, ${site.address.state}`
                        : 'No address'}
                    </TableCell>
                    <TableCell>{site.site_type?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmRemoveSite(site)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Confirmation Dialog for Removing Site */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Site</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {siteToRemove?.name} from this delivery location?
              Users at this site will no longer be able to place orders.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveSite}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}