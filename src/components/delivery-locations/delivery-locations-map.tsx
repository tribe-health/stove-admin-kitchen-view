import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import { MapPin, Clock, Layers } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { DeliveryLocation } from '@/store/use-delivery-locations-store';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

// CSS for the map container
const mapContainerStyle = {
  height: '430px',
  width: '100%',
  borderRadius: '0.5rem',
  overflow: 'hidden'
};

interface DeliveryLocationsMapProps {
  locations: DeliveryLocation[];
  isLoading: boolean;
  onSelectLocation?: (location: DeliveryLocation) => void;
  selectedLocationId?: string;
}

// Component to handle map bounds and centering
function MapController({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [bounds, map]);
  
  return null;
}

// Component to handle map reference
function MapReference({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  
  return null;
}

export function DeliveryLocationsMap({ 
  locations, 
  isLoading, 
  onSelectLocation,
  selectedLocationId 
}: DeliveryLocationsMapProps) {
  // Helper function to safely format time values
  const safeFormatTime = (timeString?: string) => {
    if (!timeString) return null;
    
    const date = new Date(timeString);
    return isValid(date) ? format(date, 'h:mm a') : timeString;
  };
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation | null>(null);
  const [useClustering, setUseClustering] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Default center position if no locations
  const defaultCenter: [number, number] = [38.9072, -77.0369];
  const defaultZoom = 14;

  // Calculate map bounds based on locations
  const bounds = useMemo(() => {
    const validLocations = locations.filter(
      loc => loc.address.latitude && loc.address.longitude
    );
    
    if (validLocations.length === 0) return null;
    
    const latLngs = validLocations.map(loc => [
      loc.address.latitude,
      loc.address.longitude
    ] as [number, number]);
    
    return L.latLngBounds(latLngs).pad(0.1);
  }, [locations]);

  // Force map to render regardless of loading state
  useEffect(() => {
    // Set a timeout to ensure map is shown even if loading state gets stuck
    const timer = setTimeout(() => {
      setMapReady(true);
    }, 2000); // Force map to show after 2 seconds regardless of loading state
    
    return () => clearTimeout(timer);
  }, []);

  // Handle location selection
  const handleLocationSelect = (location: DeliveryLocation) => {
    setSelectedLocation(location);
    if (onSelectLocation) {
      onSelectLocation(location);
    }
  };

  // Update selected location when selectedLocationId changes
  useEffect(() => {
    if (selectedLocationId) {
      const location = locations.find(loc => loc.id === selectedLocationId);
      if (location) {
        setSelectedLocation(location);
      }
    } else {
      setSelectedLocation(null);
    }
  }, [selectedLocationId, locations]);

  // Only show loading state if we're loading data and the map isn't ready yet
  if (isLoading && !mapReady) {
    return (
      <div className="w-full h-[300px] bg-muted/30 flex items-center justify-center rounded-lg">
        <div className="animate-pulse">Loading map...</div>
      </div>
    );
  }

  // Check if any locations have valid coordinates
  const hasValidLocations = locations.some(
    location => location.address.latitude && location.address.longitude
  );

  // Create custom marker icon
  const createCustomIcon = (location: DeliveryLocation) => {
    const isSelected = selectedLocationId === location.id;
    
    return L.divIcon({
      className: 'custom-marker-icon',
      html: `
        <div class="relative cursor-pointer">
          <div style="color: ${isSelected ? 'var(--primary)' : 'var(--muted-foreground)'};">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 ${isSelected ? 'text-primary' : ''} hover:scale-110 transition-transform">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
          </div>
          <div class="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24]
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={() => {
              if (bounds && mapRef.current) {
                mapRef.current.fitBounds(bounds);
              }
            }}
            disabled={!bounds}
          >
            Center Map
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="clustering-mode"
            checked={useClustering}
            onCheckedChange={setUseClustering}
          />
          <Label htmlFor="clustering-mode" className="flex items-center gap-1">
            <Layers className="h-4 w-4" />
            <span>Cluster Mode</span>
          </Label>
        </div>
      </div>
      
      <div className="relative w-full h-[430px] bg-muted/20 rounded-lg border overflow-hidden">
        {!hasValidLocations && locations.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10">
            <div className="bg-white p-4 rounded-md shadow-md">
              <p className="text-sm font-medium text-red-500">
                No valid coordinates found for any locations
              </p>
            </div>
          </div>
        )}
        
        <MapContainer 
          center={defaultCenter} 
          zoom={defaultZoom} 
          style={mapContainerStyle}
          zoomControl={false}
          whenReady={() => setMapReady(true)}
        >
          <MapReference mapRef={mapRef} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomControl position="bottomright" />
          <MapController bounds={bounds} />
          
          {useClustering ? (
            <MarkerClusterGroup>
              {locations.map(location => {
                if (!location.address.latitude || !location.address.longitude) return null;
                
                return (
                  <Marker 
                    key={location.id}
                    position={[location.address.latitude, location.address.longitude]}
                    icon={createCustomIcon(location)}
                    eventHandlers={{
                      click: () => handleLocationSelect(location)
                    }}
                  >
                    <Popup>
                      <div className="p-2 max-w-[250px]">
                        <h3 className="font-bold text-base">{location.name}</h3>
                        <p className="text-sm">{location.address.address}</p>
                        <p className="text-sm">{location.address.city}, {location.address.state} {location.address.zip}</p>
                        
                        {location.start_open_time && location.end_open_time && (
                          <div className="flex items-center mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>
                              {(() => {
                                const startTime = safeFormatTime(location.start_open_time);
                                const endTime = safeFormatTime(location.end_open_time);
                                return `${startTime || location.start_open_time} - ${endTime || location.end_open_time}`;
                              })()}
                            </span>
                          </div>
                        )}
                        
                        <div className="mt-3 flex justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleLocationSelect(location)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MarkerClusterGroup>
          ) : (
            <>
              {locations.map(location => {
                if (!location.address.latitude || !location.address.longitude) return null;
                
                return (
                  <Marker 
                    key={location.id}
                    position={[location.address.latitude, location.address.longitude]}
                    icon={createCustomIcon(location)}
                    eventHandlers={{
                      click: () => handleLocationSelect(location)
                    }}
                  >
                    <Popup>
                      <div className="p-2 max-w-[250px]">
                        <h3 className="font-bold text-base">{location.name}</h3>
                        <p className="text-sm">{location.address.address}</p>
                        <p className="text-sm">{location.address.city}, {location.address.state} {location.address.zip}</p>
                        
                        {location.start_open_time && location.end_open_time && (
                          <div className="flex items-center mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>
                              {(() => {
                                const startTime = safeFormatTime(location.start_open_time);
                                const endTime = safeFormatTime(location.end_open_time);
                                return `${startTime || location.start_open_time} - ${endTime || location.end_open_time}`;
                              })()}
                            </span>
                          </div>
                        )}
                        
                        <div className="mt-3 flex justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleLocationSelect(location)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </>
          )}
        </MapContainer>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center">
          <div className="h-3 w-3 bg-green-500 rounded-full mr-2" />
          <span>Food Delivery Location</span>
        </div>
        {useClustering && (
          <>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: '#51bbd6' }} />
              <span>Small Cluster</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: '#f1f075' }} />
              <span>Medium Cluster</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: '#f28cb1' }} />
              <span>Large Cluster</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
