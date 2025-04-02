
import { DeliveryLocation } from '@/store/use-delivery-locations-store';
import { MapPin } from 'lucide-react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell
} from '@/components/ui/table';

interface DeliveryLocationsTableProps {
  locations: DeliveryLocation[];
  isLoading: boolean;
}

export function DeliveryLocationsTable({ locations, isLoading }: DeliveryLocationsTableProps) {
  if (isLoading) {
    return (
      <div className="w-full p-8 flex items-center justify-center">
        <div className="animate-pulse">Loading delivery locations...</div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="w-full p-8 flex flex-col items-center justify-center text-muted-foreground">
        <MapPin className="h-10 w-10 mb-2 opacity-50" />
        <p>No delivery locations found for this week</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>City</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Zip</TableHead>
            <TableHead>Opening Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location) => (
            <TableRow key={location.id}>
              <TableCell className="font-medium">{location.name}</TableCell>
              <TableCell>{location.address.address}</TableCell>
              <TableCell>{location.address.city}</TableCell>
              <TableCell>{location.address.state}</TableCell>
              <TableCell>{location.address.zip}</TableCell>
              <TableCell>
                {location.start_open_time && location.end_open_time
                  ? `${location.start_open_time} - ${location.end_open_time}`
                  : 'Not specified'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
