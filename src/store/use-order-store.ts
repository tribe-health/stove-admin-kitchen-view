import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { DeliveryLocation } from './use-delivery-locations-store';
import { User } from './use-user-store';
import { Database } from '@/integrations/supabase/types';
import { PostgrestError } from '@supabase/supabase-js';
import { DbAddress } from '@/types';

export type OrderStatus = 'placed' | 'in_progress' | 'made' | 'out_for_delivery' | 'delivered' | 'canceled' | 'error';

export interface OrderItem {
  id: string;
  product_id: string;
  order_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_status: OrderStatus;
  notes: string;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  delivery_location: DeliveryLocation | null;
  user: User;
  order_items: OrderItem[];
}

type OrderInsertInput = Database['public']['Tables']['orders']['Insert'];

type OrderWithDeliveryLocations = Database['public']['Tables']['orders']['Row'] & {
    delivery_location?: (Database['public']['Tables']['delivery_location']['Row'] & {
      address?: Database['public']['Tables']['address']['Row'] | null
    }) | null,
    users?: Database['public']['Tables']['users']['Row'] | null,
    order_items?: Database['public']['Tables']['order_items']['Row'][]
  }

interface OrderStoreState {
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
  fetchOrders: () => Promise<void>;
  fetchOrderById: (id: string) => Promise<Order | null>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<Order | null>;
  deleteOrder: (id: string) => Promise<boolean>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<Order | null>;
}

type DbUser = Database['public']['Tables']['users']['Row'];

type DbDeliveryLocation = Database['public']['Tables']['delivery_location']['Row'] & {
    address?: DbAddress | null;
}

type DbOrderItem = Database['public']['Tables']['order_items']['Row'];

type DbOrder = Database['public']['Tables']['orders']['Row'] & {
  delivery_location: DbDeliveryLocation;
  users: DbUser;
  order_items: DbOrderItem[];
};

export const useOrderStore = create<OrderStoreState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,
  fetchOrders: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_location (
            *,
            address:address (*)
          ),
          users (*),
          order_items (*)
        `) as { data: OrderWithDeliveryLocations[] | null, error: PostgrestError | null};
      if (error) {
        throw error;
      }

      const dbOrders = data as unknown as DbOrder[];

      const transformedUsers: User[] = dbOrders.map((order) => ({
        id: order.user_id,
        email: order.users.email,
        first_name: order.users.first_name,
        last_name: order.users.last_name,
        phone_number: order.users.phone_number,
        handle: order.users.handle || '',
        did: order.users.did || '',
        pds_url: order.users.pds_url || '',
        created_at: order.users.created_at || order.created_at
      }));

      const orderItemsMap: Record<string, OrderItem[]> = {};
      dbOrders.forEach((order) => {
        orderItemsMap[order.id] = order.order_items.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          order_id: item.order_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.quantity * item.unit_price
        }))
      })

      const transformedLocations: DeliveryLocation[] = [];
      dbOrders.forEach((order) => {
        if (order.delivery_location) {
          transformedLocations.push({
            id: order.delivery_location.id,
            name: order.delivery_location.name,
            start_open_time: order.delivery_location.start_open_time,
            end_open_time: order.delivery_location.end_open_time,
            provider_id: order.delivery_location.provider_id,
            active: order.delivery_location.active,
            address: {
              id: order.delivery_location.address.id,
              name: order.delivery_location.address.name,
              address: order.delivery_location.address!.address,
              address1: order.delivery_location.address.address1,
              city: order.delivery_location.address.city,
              state: order.delivery_location.address.state,
              zip: order.delivery_location.address.zip,
              latitude: order.delivery_location.address.latitude,
              longitude: order.delivery_location.address.longitude,
            }
          })
        }
      });

      const transformedOrders: Order[] = dbOrders.map((order) => ({
        id: order.id,
        order_status: order.order_status,
        notes: order.notes,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        created_at: order.created_at,
        delivery_location: transformedLocations.find((location) => location.id === order.delivery_location_id) || null,
        user: transformedUsers.find((user) => user.id === order.user_id)!,
        order_items: orderItemsMap[order.id],
      }))

      set({ orders: transformedOrders, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },
  fetchOrderById: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_location (
            *,
            address:address (*)
          ),
          users (*),
          order_items (*)
        `)
        .eq('id', id)
        .single() as { data: OrderWithDeliveryLocations | null, error: PostgrestError | null};
      
      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      const dbOrder = data as unknown as DbOrder;

      const transformedUser: User = {
        id: dbOrder.user_id,
        email: dbOrder.users.email,
        first_name: dbOrder.users.first_name,
        last_name: dbOrder.users.last_name,
        phone_number: dbOrder.users.phone_number,
        handle: dbOrder.users.handle || '',
        did: dbOrder.users.did || '',
        pds_url: dbOrder.users.pds_url || '',
        created_at: dbOrder.users.created_at || dbOrder.created_at
      };

      const orderItems: OrderItem[] = dbOrder.order_items.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        order_id: item.order_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price
      }));

      let transformedLocation: DeliveryLocation | null = null;
      if (dbOrder.delivery_location) {
        transformedLocation = {
          id: dbOrder.delivery_location.id,
          name: dbOrder.delivery_location.name,
          start_open_time: dbOrder.delivery_location.start_open_time,
          end_open_time: dbOrder.delivery_location.end_open_time,
          provider_id: dbOrder.delivery_location.provider_id,
          active: dbOrder.delivery_location.active,
          address: {
            id: dbOrder.delivery_location.address.id,
            name: dbOrder.delivery_location.address.name,
            address: dbOrder.delivery_location.address!.address,
            address1: dbOrder.delivery_location.address.address1,
            city: dbOrder.delivery_location.address.city,
            state: dbOrder.delivery_location.address.state,
            zip: dbOrder.delivery_location.address.zip,
            latitude: dbOrder.delivery_location.address.latitude,
            longitude: dbOrder.delivery_location.address.longitude,
          }
        };
      }

      const transformedOrder: Order = {
        id: dbOrder.id,
        order_status: dbOrder.order_status,
        notes: dbOrder.notes,
        subtotal: dbOrder.subtotal,
        tax: dbOrder.tax,
        total: dbOrder.total,
        created_at: dbOrder.created_at,
        delivery_location: transformedLocation,
        user: transformedUser,
        order_items: orderItems,
      };

      set({ isLoading: false });
      return transformedOrder;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      return null;
    }
  },
  updateOrder: async (id: string, orderUpdate: Partial<Order>) => {
    try {
      set({ isLoading: true, error: null });

      const orderToUpdate: Partial<OrderInsertInput> = {
        order_status: orderUpdate.order_status as OrderStatus,
        notes: orderUpdate.notes,
        subtotal: orderUpdate.subtotal,
        tax: orderUpdate.tax,
        total: orderUpdate.total,
        updated_at: new Date().toISOString(),
      };

      if (orderUpdate.delivery_location) {
        orderToUpdate.delivery_location_id = orderUpdate.delivery_location.id;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(orderToUpdate)
        .eq('id', id)
        .select(`
          *,
          delivery_location (
            *,
            address:address (*)
          ),
          users (*),
          order_items (*)
        `)
        .single() as { data: OrderWithDeliveryLocations | null, error: PostgrestError | null};

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      const dbOrder = data as unknown as DbOrder;

      const transformedUser: User = {
        id: dbOrder.user_id,
        email: dbOrder.users.email,
        first_name: dbOrder.users.first_name,
        last_name: dbOrder.users.last_name,
        phone_number: dbOrder.users.phone_number,
        handle: dbOrder.users.handle || '',
        did: dbOrder.users.did || '',
        pds_url: dbOrder.users.pds_url || '',
        created_at: dbOrder.users.created_at || dbOrder.created_at
      };

      const orderItems: OrderItem[] = dbOrder.order_items.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        order_id: item.order_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price
      }));

      let transformedLocation: DeliveryLocation | null = null;
      if (dbOrder.delivery_location) {
        transformedLocation = {
          id: dbOrder.delivery_location.id,
          name: dbOrder.delivery_location.name,
          start_open_time: dbOrder.delivery_location.start_open_time,
          end_open_time: dbOrder.delivery_location.end_open_time,
          provider_id: dbOrder.delivery_location.provider_id,
          active: dbOrder.delivery_location.active,
          address: {
            id: dbOrder.delivery_location.address.id,
            name: dbOrder.delivery_location.address.name,
            address: dbOrder.delivery_location.address!.address,
            address1: dbOrder.delivery_location.address.address1,
            city: dbOrder.delivery_location.address.city,
            state: dbOrder.delivery_location.address.state,
            zip: dbOrder.delivery_location.address.zip,
            latitude: dbOrder.delivery_location.address.latitude,
            longitude: dbOrder.delivery_location.address.longitude,
          }
        };
      }

      const updatedOrder: Order = {
        id: dbOrder.id,
        order_status: dbOrder.order_status,
        notes: dbOrder.notes,
        subtotal: dbOrder.subtotal,
        tax: dbOrder.tax,
        total: dbOrder.total,
        created_at: dbOrder.created_at,
        delivery_location: transformedLocation,
        user: transformedUser,
        order_items: orderItems,
      };

      // Update the order in the store
      const updatedOrders = get().orders.map(order => 
        order.id === id ? updatedOrder : order
      );

      set({ orders: updatedOrders, isLoading: false });
      return updatedOrder;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      return null;
    }
  },
  updateOrderStatus: async (id: string, status: string) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('orders')
        .update({ order_status: status as OrderStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          delivery_location (
            *,
            address:address (*)
          ),
          users (*),
          order_items (*)
        `)
        .single() as { data: OrderWithDeliveryLocations | null, error: PostgrestError | null};

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      const dbOrder = data as unknown as DbOrder;

      const transformedUser: User = {
        id: dbOrder.user_id,
        email: dbOrder.users.email,
        first_name: dbOrder.users.first_name,
        last_name: dbOrder.users.last_name,
        phone_number: dbOrder.users.phone_number,
        handle: dbOrder.users.handle || '',
        did: dbOrder.users.did || '',
        pds_url: dbOrder.users.pds_url || '',
        created_at: dbOrder.users.created_at || dbOrder.created_at
      };

      const orderItems: OrderItem[] = dbOrder.order_items.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        order_id: item.order_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price
      }));

      let transformedLocation: DeliveryLocation | null = null;
      if (dbOrder.delivery_location) {
        transformedLocation = {
          id: dbOrder.delivery_location.id,
          name: dbOrder.delivery_location.name,
          start_open_time: dbOrder.delivery_location.start_open_time,
          end_open_time: dbOrder.delivery_location.end_open_time,
          provider_id: dbOrder.delivery_location.provider_id,
          active: dbOrder.delivery_location.active,
          address: {
            id: dbOrder.delivery_location.address.id,
            name: dbOrder.delivery_location.address.name,
            address: dbOrder.delivery_location.address!.address,
            address1: dbOrder.delivery_location.address.address1,
            city: dbOrder.delivery_location.address.city,
            state: dbOrder.delivery_location.address.state,
            zip: dbOrder.delivery_location.address.zip,
            latitude: dbOrder.delivery_location.address.latitude,
            longitude: dbOrder.delivery_location.address.longitude,
          }
        };
      }

      const updatedOrder: Order = {
        id: dbOrder.id,
        order_status: dbOrder.order_status,
        notes: dbOrder.notes,
        subtotal: dbOrder.subtotal,
        tax: dbOrder.tax,
        total: dbOrder.total,
        created_at: dbOrder.created_at,
        delivery_location: transformedLocation,
        user: transformedUser,
        order_items: orderItems,
      };

      // Update the order in the store
      const updatedOrders = get().orders.map(order => 
        order.id === id ? updatedOrder : order
      );

      set({ orders: updatedOrders, isLoading: false });
      return updatedOrder;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      return null;
    }
  },
  deleteOrder: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      // First delete all order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', id);

      if (itemsError) {
        throw itemsError;
      }

      // Then delete the order
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update the store
      const updatedOrders = get().orders.filter(order => order.id !== id);
      set({ orders: updatedOrders, isLoading: false });
      return true;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      return false;
    }
  }
}))