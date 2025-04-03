export interface Address {
  id: string;
  name: string;
  address: string;
  address1?: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
}

export interface DbAddress {
  id: string;
  name: string;
  address: string;
  address1?: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
}

export interface SiteType {
  id: string;
  name: string;
  key: string;
  schema: Record<string, unknown>;
  managing_table: string;
}

export interface Site {
  id: string;
  name: string;
  data: Record<string, unknown>;
  organization_id: string;
  address_id?: string;
  site_type_id: string;
  site_type?: SiteType;
  address?: Address;
}

export interface DeliveryLocationSite {
  id: string;
  site_id: string;
  delivery_location_id: string;
  created_at: string;
  site?: Site;
}