import { useEffect, useState } from 'react';
import { DeliveryLocation } from '@/store/use-delivery-locations-store';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format, isValid } from 'date-fns';

interface DeliveryLocationsTableProps {
  locations: DeliveryLocation[];
  isLoading: boolean;
  onSelectLocation?: (location: DeliveryLocation) => void;
  selectedLocationId?: string;
}

export function DeliveryLocationsTable({ 
  locations, 
  isLoading, 
  onSelectLocation,
  selectedLocationId 
}: DeliveryLocationsTableProps) {
  // Helper function to safely format time values
  const safeFormatTime = (timeString?: string) => {
    if (!timeString) return null;
    
    const date = new Date(timeString);
    return isValid(date) ? format(date, 'h:mm a') : null;
  };
  const [tableReady, setTableReady] = useState(false);
  
  // Force table to render regardless of loading state after a timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setTableReady(true);
    }, 2000); // Force table to show after 2 seconds regardless of loading state
    
    return () => clearTimeout(timer);
  }, []);
  
  // Only show loading state if we're loading data and the table isn't ready yet
  if (isLoading && !tableReady) {
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

  const handleSelectLocation = (location: DeliveryLocation) => {
    if (onSelectLocation) {
      onSelectLocation(location);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>City</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Opening Hours</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location) => (
            <TableRow 
              key={location.id}
              className={selectedLocationId === location.id ? 'bg-muted/50' : ''}
              onClick={() => handleSelectLocation(location)}
              style={{ cursor: 'pointer' }}
            >
              <TableCell className="font-medium">{location.name}</TableCell>
              <TableCell>{location.address.address}</TableCell>
              <TableCell>{location.address.city}</TableCell>
              <TableCell>{location.address.state}</TableCell>
              <TableCell>
                {(() => {
                  const startTime = safeFormatTime(location.start_open_time);
                  const endTime = safeFormatTime(location.end_open_time);
                  
                  return startTime && endTime
                    ? `${startTime} - ${endTime}`
                    : 'Not specified';
                })()}
              </TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectLocation(location);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
