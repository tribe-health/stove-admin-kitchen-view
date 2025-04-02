import { Database } from "@/integrations/supabase/types";

export interface Address {
  id: string;
  name: string | null;
  address: string;
  address1: string | null;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
}

export type DbAddress = Database["public"]["Tables"]["address"]["Row"];