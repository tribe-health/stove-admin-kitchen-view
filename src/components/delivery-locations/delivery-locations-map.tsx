
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapPin, Clock, Layers } from 'lucide-react';
import Map, {
  Marker, 
  Popup, 
  NavigationControl, 
  FullscreenControl, 
  Source, 
  Layer
} from 'react-map-gl';
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl';
import type { Feature, Point } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DeliveryLocation } from '@/store/use-delivery-locations-store';

const mapBoxToken = 'pk.eyJ1IjoiZ3FhZG9uaXMiLCJhIjoiY2o4bzdnZXc2MDA1ZTJ3cnp5cTM3N2p2bCJ9.Mp12t4wj_L2KAzQocwCuWQ';

interface DeliveryLocationsMapProps {
  locations: DeliveryLocation[];
  isLoading: boolean;
}

export function DeliveryLocationsMap({ locations, isLoading }: DeliveryLocationsMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation | null>(null);
  const [viewState, setViewState] = useState({
    longitude: -77.0369,
    latitude: 38.9072,
    zoom: 14
  });
  const [useClustering, setUseClustering] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  // Use a more specific type for the map reference
  const mapRef = useRef<MapRef | null>(null);

  // Convert locations to GeoJSON for clustering
  const geojson = useMemo(() => {
    const validLocations = locations.filter(
      loc => loc.address.latitude && loc.address.longitude
    );

    return {
      type: "FeatureCollection" as const,
      features: validLocations.map(location => ({
        type: "Feature" as const,
        properties: {
          id: location.id,
          name: location.name,
          address: location.address.address,
          city: location.address.city,
          state: location.address.state,
          zip: location.address.zip,
          start_open_time: location.start_open_time,
          end_open_time: location.end_open_time,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [location.address.longitude, location.address.latitude]
        }
      }))
    };
  }, [locations]);

  // Calculate map bounds based on locations
  const bounds = useMemo(() => {
    const validLocations = locations.filter(
      loc => loc.address.latitude && loc.address.longitude
    );
    
    if (validLocations.length === 0) return null;
    
    const minLng = Math.min(...validLocations.map(loc => loc.address.longitude));
    const maxLng = Math.max(...validLocations.map(loc => loc.address.longitude));
    const minLat = Math.min(...validLocations.map(loc => loc.address.latitude));
    const maxLat = Math.max(...validLocations.map(loc => loc.address.latitude));
    
    // Add some padding
    const lngPadding = (maxLng - minLng) * 0.1;
    const latPadding = (maxLat - minLat) * 0.1;
    
    return {
      longitude: (minLng + maxLng) / 2,
      latitude: (minLat + maxLat) / 2,
      zoom: 13,
      bounds: [
        [minLng - lngPadding, minLat - latPadding], 
        [maxLng + lngPadding, maxLat + latPadding]
      ]
    };
  }, [locations]);

  // Force map to render regardless of loading state
  useEffect(() => {
    // Set a timeout to ensure map is shown even if loading state gets stuck
    const timer = setTimeout(() => {
      setMapReady(true);
    }, 2000); // Force map to show after 2 seconds regardless of loading state
    
    return () => clearTimeout(timer);
  }, []);
  
  // Update view state when bounds change
  useEffect(() => {
    if (bounds) {
      setViewState({
        longitude: bounds.longitude,
        latitude: bounds.latitude,
        zoom: bounds.zoom
      });
      
      // If map is already rendered, fly to the new bounds
      if (mapRef.current && mapReady) {
        try {
          const map = mapRef.current.getMap();
          if (map) {
            map.flyTo({
              center: [bounds.longitude, bounds.latitude],
              zoom: bounds.zoom,
              essential: true
            });
          }
        } catch (error) {
          console.error('Error flying to bounds:', error);
        }
      }
    }
  }, [bounds, mapReady]);

  // Debug location coordinates
  useEffect(() => {
    if (locations.length > 0 && !isLoading) {
      console.log('Map would show these locations:', locations);
      
      locations.forEach(location => {
        console.log(`Location ${location.name} coordinates:`, {
          latitude: location.address.latitude,
          longitude: location.address.longitude,
          hasValidCoords: !!(location.address.latitude && location.address.longitude)
        });
      });
    }
  }, [locations, isLoading]);

  const handleMarkerClick = (location: DeliveryLocation) => {
    setSelectedLocation(location);
    setViewState({
      ...viewState,
      longitude: location.address.longitude,
      latitude: location.address.latitude
    });
  };

  // Handle cluster click to zoom in
  const handleClusterClick = (event: MapLayerMouseEvent) => {
    // Check if we have features and if the first one has a cluster_id
    if (!event.features || !event.features.length || !event.features[0].properties.cluster_id) {
      return;
    }
    
    const feature = event.features[0] as Feature<Point>;
    const clusterId = feature.properties.cluster_id;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapboxSource: any = mapRef.current?.getMap().getSource('delivery-locations');
      
      mapboxSource.getClusterExpansionZoom(clusterId, (err: Error | null, zoom: number) => {
        if (err) return;
        
        setViewState({
          ...viewState,
          longitude: feature.geometry.coordinates[0],
          latitude: feature.geometry.coordinates[1],
          zoom: zoom
        });
      });
    } catch (error) {
      console.error('Error handling cluster click:', error);
    }
  };

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={() => bounds && setViewState({
              longitude: bounds.longitude,
              latitude: bounds.latitude,
              zoom: bounds.zoom
            })}
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
        
        <div className="absolute inset-0">
          <Map
            ref={mapRef}
            mapboxAccessToken={mapBoxToken}
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            onClick={useClustering ? (evt => handleClusterClick(evt as MapLayerMouseEvent)) : undefined}
            style={{width: '100%', height: '100%'}}
            mapStyle="mapbox://styles/mapbox/streets-v9"
            interactiveLayerIds={useClustering ? ['clusters'] : undefined}
            onLoad={() => {
              console.log('Map loaded successfully');
              setMapReady(true);
            }}
          >
            {/* Add map controls */}
            <NavigationControl />
            <FullscreenControl />
            
            {/* Render either individual markers or clustered view based on toggle */}
            {useClustering ? (
              <Source
                id="delivery-locations"
                type="geojson"
                data={geojson}
                cluster={true}
                clusterMaxZoom={14}
                clusterRadius={50}
              >
                {/* Clustered points */}
                <Layer
                  id="clusters"
                  type="circle"
                  filter={['has', 'point_count']}
                  paint={{
                    'circle-color': [
                      'step',
                      ['get', 'point_count'],
                      '#51bbd6', // Small clusters
                      5,
                      '#f1f075', // Medium clusters
                      10,
                      '#f28cb1'  // Large clusters
                    ],
                    'circle-radius': [
                      'step',
                      ['get', 'point_count'],
                      20, // Small clusters
                      5,
                      30, // Medium clusters
                      10,
                      40  // Large clusters
                    ]
                  }}
                />
                
                {/* Cluster count labels */}
                <Layer
                  id="cluster-count"
                  type="symbol"
                  filter={['has', 'point_count']}
                  layout={{
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 12
                  }}
                  paint={{}} // Add empty paint object to satisfy TypeScript
                />
                
                {/* Unclustered points */}
                <Layer
                  id="unclustered-point"
                  type="circle"
                  filter={['!', ['has', 'point_count']]}
                  paint={{
                    'circle-color': '#11b4da',
                    'circle-radius': 8,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#fff'
                  }}
                />
              </Source>
            ) : (
              // Individual markers
              locations.map(location => 
                location.address.latitude && location.address.longitude ? (
                  <Marker 
                    key={location.id} 
                    longitude={location.address.longitude} 
                    latitude={location.address.latitude}
                  >
                    <div 
                      className="relative cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkerClick(location);
                      }}
                    >
                      <MapPin 
                        className="h-5 w-5 text-primary hover:scale-110 transition-transform" 
                        fill="currentColor"
                      />
                      {/* Food delivery status indicator */}
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                  </Marker>
                ) : null
              )
            )}
            
            {/* Show popup for selected location */}
            {selectedLocation && selectedLocation.address.latitude && selectedLocation.address.longitude && (
              <Popup
                longitude={selectedLocation.address.longitude}
                latitude={selectedLocation.address.latitude}
                onClose={() => setSelectedLocation(null)}
                closeButton={true}
                closeOnClick={false}
                className="z-10"
              >
                <div className="p-2 max-w-[250px]">
                  <h3 className="font-bold text-base">{selectedLocation.name}</h3>
                  <p className="text-sm">{selectedLocation.address.address}</p>
                  <p className="text-sm">{selectedLocation.address.city}, {selectedLocation.address.state} {selectedLocation.address.zip}</p>
                  
                  {selectedLocation.start_open_time && selectedLocation.end_open_time && (
                    <div className="flex items-center mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        {selectedLocation.start_open_time} - {selectedLocation.end_open_time}
                      </span>
                    </div>
                  )}
                  
                  {/* Action button */}
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      View Details
                    </Button>
                  </div>
                </div>
              </Popup>
            )}
          </Map>
        </div>
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
