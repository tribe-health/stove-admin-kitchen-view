import { Map as LeafletMap, MapOptions, LatLngExpression, Icon, DivIcon, LatLngBoundsExpression, FitBoundsOptions } from 'leaflet';
import { ReactNode, RefObject, ForwardRefExoticComponent, RefAttributes } from 'react';

declare module 'react-leaflet' {
  export interface MapContainerProps extends MapOptions {
    center: LatLngExpression;
    zoom: number;
    children?: ReactNode;
    style?: React.CSSProperties;
    className?: string;
    id?: string;
    whenCreated?: (map: LeafletMap) => void;
    whenReady?: () => void;
    zoomControl?: boolean;
  }

  export interface TileLayerProps {
    attribution?: string;
    url: string;
    children?: ReactNode;
  }

  export interface MarkerProps {
    position: LatLngExpression;
    icon?: Icon | DivIcon;
    children?: ReactNode;
    eventHandlers?: {
      click?: () => void;
      mouseover?: () => void;
      mouseout?: () => void;
      [key: string]: (() => void) | undefined;
    };
  }

  export interface PopupProps {
    children?: ReactNode;
    closeButton?: boolean;
    closeOnClick?: boolean;
  }

  export interface ZoomControlProps {
    position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  }

  export interface UseMapResult extends LeafletMap {
    fitBounds(bounds: LatLngBoundsExpression, options?: FitBoundsOptions): this;
  }

  export const MapContainer: ForwardRefExoticComponent<MapContainerProps & RefAttributes<LeafletMap>>;
  export function TileLayer(props: TileLayerProps): JSX.Element;
  export function Marker(props: MarkerProps): JSX.Element;
  export function Popup(props: PopupProps): JSX.Element;
  export function ZoomControl(props: ZoomControlProps): JSX.Element;
  export function useMap(): UseMapResult;
}

declare module 'react-leaflet-cluster' {
  export interface MarkerClusterGroupProps {
    children?: ReactNode;
    chunkedLoading?: boolean;
    spiderfyOnMaxZoom?: boolean;
    removeOutsideVisibleBounds?: boolean;
    animate?: boolean;
  }

  export default function MarkerClusterGroup(props: MarkerClusterGroupProps): JSX.Element;
}
