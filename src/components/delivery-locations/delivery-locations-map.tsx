
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapPin, Clock, Layers } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DeliveryLocation } from '@/store/use-delivery-locations-store';

// Define the MapBox token
const mapBoxToken = 'pk.eyJ1IjoiZ3FhZG9uaXMiLCJhIjoiY2o4bzdnZXc2MDA1ZTJ3cnp5cTM3N2p2bCJ9.Mp12t4wj_L2KAzQocwCuWQ';

// Define the GeoJSON Feature type for TypeScript
interface PointFeature {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    start_open_time?: string;
    end_open_time?: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

interface GeoJSONData {
  type: 'FeatureCollection';
  features: PointFeature[];
}

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Convert locations to GeoJSON for clustering
  const geojson: GeoJSONData = useMemo(() => {
    const validLocations = locations.filter(
      loc => loc.address.latitude && loc.address.longitude
    );

    return {
      type: 'FeatureCollection',
      features: validLocations.map(location => ({
        type: 'Feature',
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
          type: 'Point',
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
      ] as [[number, number], [number, number]]
    };
  }, [locations]);

  // Clean up markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
  };

  // Force map to render regardless of loading state
  useEffect(() => {
    // Set a timeout to ensure map is shown even if loading state gets stuck
    const timer = setTimeout(() => {
      setMapReady(true);
    }, 2000); // Force map to show after 2 seconds regardless of loading state
    
    return () => clearTimeout(timer);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = mapBoxToken;
    
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v9',
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom
    });

    map.on('load', () => {
      console.log('Map loaded successfully');
      setMapReady(true);
    });

    mapRef.current = map;

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(new mapboxgl.FullscreenControl());

    // Clean up
    return () => {
      clearMarkers();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update view state when bounds change
  useEffect(() => {
    if (bounds && mapRef.current) {
      mapRef.current.flyTo({
        center: [bounds.longitude, bounds.latitude],
        zoom: bounds.zoom,
        essential: true
      });
    }
  }, [bounds]);

  // Update markers and clusters when locations or clustering option changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    const map = mapRef.current;
    
    // Clear previous markers
    clearMarkers();
    
    // Remove previous source and layers if they exist
    if (map.getSource('delivery-locations')) {
      if (map.getLayer('clusters')) map.removeLayer('clusters');
      if (map.getLayer('cluster-count')) map.removeLayer('cluster-count');
      if (map.getLayer('unclustered-point')) map.removeLayer('unclustered-point');
      map.removeSource('delivery-locations');
    }

    if (useClustering) {
      // Add clustering
      map.addSource('delivery-locations', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'delivery-locations',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',   // Small clusters
            5,
            '#f1f075',   // Medium clusters
            10,
            '#f28cb1'    // Large clusters
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,  // Small clusters
            5,
            30,  // Medium clusters
            10,
            40   // Large clusters
          ]
        }
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'delivery-locations',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'delivery-locations',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });

      // Add cluster click handler
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        if (!features.length) return;
        
        const clusterId = features[0].properties?.cluster_id;
        if (!clusterId) return;

        const source = map.getSource('delivery-locations') as mapboxgl.GeoJSONSource;
        source.getClusterExpansion(clusterId, (err, zoom) => {
          if (err) return;
          
          map.flyTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom
          });
        });
      });
    } else {
      // Add individual markers
      locations.forEach(location => {
        if (!location.address.latitude || !location.address.longitude) return;
        
        // Create marker element
        const markerElement = document.createElement('div');
        markerElement.className = 'relative cursor-pointer';
        
        // Create marker icon
        const iconElement = document.createElement('div');
        iconElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-primary hover:scale-110 transition-transform"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
        iconElement.style.color = 'var(--primary)';
        markerElement.appendChild(iconElement);
        
        // Create status indicator
        const statusElement = document.createElement('div');
        statusElement.className = 'absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white';
        markerElement.appendChild(statusElement);

        // Create marker
        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat([location.address.longitude, location.address.latitude])
          .addTo(map);

        // Add marker to ref for cleanup
        markersRef.current.push(marker);
        
        // Add click event for the marker
        markerElement.addEventListener('click', () => {
          setSelectedLocation(location);
          
          if (popupRef.current) {
            popupRef.current.remove();
          }
          
          // Create popup
          const popup = new mapboxgl.Popup({ closeButton: true, closeOnClick: false })
            .setLngLat([location.address.longitude, location.address.latitude])
            .setHTML(`
              <div class="p-2 max-w-[250px]">
                <h3 class="font-bold text-base">${location.name}</h3>
                <p class="text-sm">${location.address.address}</p>
                <p class="text-sm">${location.address.city}, ${location.address.state} ${location.address.zip}</p>
                
                ${location.start_open_time && location.end_open_time ? `
                  <div class="flex items-center mt-2 text-xs text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 mr-1"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>${location.start_open_time} - ${location.end_open_time}</span>
                  </div>
                ` : ''}
                
                <div class="mt-3 flex justify-end">
                  <button class="bg-transparent hover:bg-accent text-xs border border-input rounded px-3 py-1">View Details</button>
                </div>
              </div>
            `)
            .addTo(map);
            
          popupRef.current = popup;
        });
      });
    }
    
  }, [locations, useClustering, mapReady, geojson]);

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
            onClick={() => bounds && mapRef.current?.flyTo({
              center: [bounds.longitude, bounds.latitude],
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
        
        <div ref={mapContainerRef} className="absolute inset-0" />
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
