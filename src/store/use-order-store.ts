import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { DeliveryLocation } from './use-delivery-locations-store';
import { User } from './use-user-store';
import { Database } from '@/integrations/supabase/types';

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
  order_status: string;
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

interface OrderStoreState {
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
  fetchOrders: () => Promise<void>;
  addOrder: (order: Omit<Order, 'id'>) => Promise<Order | null>;
}

type DbUser = Database['public']['Tables']['users']['Row'];

type DbDeliveryLocation = Database['public']['Tables']['delivery_location']['Row'];

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
          delivery_location (*),
          users (*),
          order_items (*)
        `);
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
          latitude: order.delivery_location.latitude,
          longitude: order.delivery_location.longitude,
          name: order.delivery_location.name,
          address: order.delivery_location.address,
          city: order.delivery_location.city,
          state: order.delivery_location.state,
          zip: order.delivery_location.zip,
          start_open_time: order.delivery_location.start_open_time,
          end_open_time: order.delivery_location.end_open_time,
          provider_id: order.delivery_location.provider_id,
          delivery_period_id: order.delivery_location.delivery_period_id,
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
        delivery_location: transformedLocations.find((location) => location.id === order.delivery_location_id),
        user: transformedUsers.find((user) => user.id === order.user_id)!,
        order_items: orderItemsMap[order.id],
      }))

      set({ orders: transformedOrders, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },
  addOrder: async (order: Omit<Order, 'id'>) => {
    try {
      set({ isLoading: true, error: null });

      const orderStatus = 'placed';

      const orderToInsert: OrderInsertInput = {
        order_status: orderStatus,
        notes: order.notes,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        delivery_location_id: order.delivery_location.id,
        user_id: order.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderToInsert])
        .select();
      if (error) {
        throw error;
      }

      const transformedOrder: Order = {
        id: data[0].id,
        order_status: data[0].order_status,
        notes: data[0].notes,
        subtotal: data[0].subtotal,
        tax: data[0].tax,
        total: data[0].total,
        created_at: data[0].created_at,
        delivery_location: order.delivery_location,
        user: order.user,
        order_items: order.order_items,
      }

      set({ 
        isLoading: false,
        orders: [...get().orders, transformedOrder] });
      return transformedOrder;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      return null;
    }
  }
}))