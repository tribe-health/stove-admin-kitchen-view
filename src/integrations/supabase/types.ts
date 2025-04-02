export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      delivery_location: {
        Row: {
          address: string
          address1: string | null
          city: string
          created_at: string
          delivery_period_id: string | null
          end_open_time: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          provider_id: string
          start_open_time: string | null
          state: string
          zip: string
        }
        Insert: {
          address: string
          address1?: string | null
          city: string
          created_at?: string
          delivery_period_id?: string | null
          end_open_time?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          provider_id: string
          start_open_time?: string | null
          state: string
          zip: string
        }
        Update: {
          address?: string
          address1?: string | null
          city?: string
          created_at?: string
          delivery_period_id?: string | null
          end_open_time?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          provider_id?: string
          start_open_time?: string | null
          state?: string
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_location_delivery_period_id_fkey"
            columns: ["delivery_period_id"]
            isOneToOne: false
            referencedRelation: "delivery_period"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_location_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_period: {
        Row: {
          created_at: string
          end_date: string
          id: string
          start_date: string
          title: string | null
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          start_date: string
          title?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          start_date?: string
          title?: string | null
        }
        Relationships: []
      }
      navigation: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          key: string
          name: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          key: string
          name: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      navigation_items: {
        Row: {
          created_at: string
          data: Json | null
          icon_name: string | null
          id: string
          index: number
          name: string
          navigation_id: string
          parent_id: string | null
          path: string
          roles: string[] | null
          slug: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          icon_name?: string | null
          id?: string
          index?: number
          name: string
          navigation_id: string
          parent_id?: string | null
          path: string
          roles?: string[] | null
          slug: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          icon_name?: string | null
          id?: string
          index?: number
          name?: string
          navigation_id?: string
          parent_id?: string | null
          path?: string
          roles?: string[] | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_items_navigation_id_fkey"
            columns: ["navigation_id"]
            isOneToOne: false
            referencedRelation: "navigation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigation_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "navigation_items"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_types: {
        Row: {
          created_at: string
          icon_url: string | null
          id: string
          key: string
          name: string
          schema: Json | null
        }
        Insert: {
          created_at?: string
          icon_url?: string | null
          id?: string
          key: string
          name: string
          schema?: Json | null
        }
        Update: {
          created_at?: string
          icon_url?: string | null
          id?: string
          key?: string
          name?: string
          schema?: Json | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          icon_url: string | null
          id: string
          is_read: boolean
          message_markdown: string | null
          notification_type_id: string
          subtitle: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          icon_url?: string | null
          id?: string
          is_read?: boolean
          message_markdown?: string | null
          notification_type_id: string
          subtitle: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          icon_url?: string | null
          id?: string
          is_read?: boolean
          message_markdown?: string | null
          notification_type_id?: string
          subtitle?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_notification_type_id_fkey"
            columns: ["notification_type_id"]
            isOneToOne: false
            referencedRelation: "notification_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          product_id?: string | null
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_transactions: {
        Row: {
          amount: number
          cc_card: string
          cc_last4: string
          created_at: string
          data: Json | null
          error: string | null
          id: string
          order_id: string
          payer_transaction_id: string | null
          succeeded: boolean
        }
        Insert: {
          amount: number
          cc_card: string
          cc_last4: string
          created_at?: string
          data?: Json | null
          error?: string | null
          id?: string
          order_id: string
          payer_transaction_id?: string | null
          succeeded?: boolean
        }
        Update: {
          amount?: number
          cc_card?: string
          cc_last4?: string
          created_at?: string
          data?: Json | null
          error?: string | null
          id?: string
          order_id?: string
          payer_transaction_id?: string | null
          succeeded?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "order_transaction_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivery_location_id: string | null
          id: string
          notes: string | null
          order_status: Database["public"]["Enums"]["order_status"]
          subtotal: number | null
          tax: number | null
          total: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_location_id?: string | null
          id?: string
          notes?: string | null
          order_status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_location_id?: string | null
          id?: string
          notes?: string | null
          order_status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_location_id_fkey"
            columns: ["delivery_location_id"]
            isOneToOne: false
            referencedRelation: "delivery_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organization: {
        Row: {
          cover_url: string | null
          created_at: string
          data: Json | null
          description: string | null
          id: string
          logo_url: string | null
          long_description_markdown: string | null
          name: string | null
          organization_type_id: string
          web_url: string | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          logo_url?: string | null
          long_description_markdown?: string | null
          name?: string | null
          organization_type_id: string
          web_url?: string | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          logo_url?: string | null
          long_description_markdown?: string | null
          name?: string | null
          organization_type_id?: string
          web_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_organization_type_id_fkey"
            columns: ["organization_type_id"]
            isOneToOne: false
            referencedRelation: "organization_type"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_type: {
        Row: {
          created_at: string
          id: string
          key: string
          managing_table: string
          name: string
          schema: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          managing_table?: string
          name: string
          schema?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          managing_table?: string
          name?: string
          schema?: Json | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          id: string
          key: string
          metadata: Json | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          metadata?: Json | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          metadata?: Json | null
          name?: string
        }
        Relationships: []
      }
      product_inventory: {
        Row: {
          count: number
          created_at: string
          data: Json | null
          id: string
          is_always_available: boolean
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          count?: number
          created_at?: string
          data?: Json | null
          id: string
          is_always_available?: boolean
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          count?: number
          created_at?: string
          data?: Json | null
          id?: string
          is_always_available?: boolean
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_inventory_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_provider: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          product_id: string
          provider_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          product_id: string
          provider_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          product_id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_provider_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_provider_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider"
            referencedColumns: ["id"]
          },
        ]
      }
      product_types: {
        Row: {
          cover_url: string | null
          created_at: string
          icon_url: string | null
          id: string
          key: string
          name: string
          schema: Json | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          icon_url?: string | null
          id?: string
          key: string
          name: string
          schema?: Json | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          icon_url?: string | null
          id?: string
          key?: string
          name?: string
          schema?: Json | null
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          instructions: string | null
          long_description: string | null
          name: string
          photo_url: string | null
          product_type_id: string | null
          short_description: string | null
          stripe_product_id: string | null
          unit: string | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          instructions?: string | null
          long_description?: string | null
          name: string
          photo_url?: string | null
          product_type_id?: string | null
          short_description?: string | null
          stripe_product_id?: string | null
          unit?: string | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          instructions?: string | null
          long_description?: string | null
          name?: string
          photo_url?: string | null
          product_type_id?: string | null
          short_description?: string | null
          stripe_product_id?: string | null
          unit?: string | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      provider: {
        Row: {
          cover_url: string | null
          created_at: string
          data: Json | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          organization_id: string | null
          provider_type_id: string | null
          updated_at: string | null
          web_url: string | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          organization_id?: string | null
          provider_type_id?: string | null
          updated_at?: string | null
          web_url?: string | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          organization_id?: string | null
          provider_type_id?: string | null
          updated_at?: string | null
          web_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_provider_type_id_fkey"
            columns: ["provider_type_id"]
            isOneToOne: false
            referencedRelation: "provider_type"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_type: {
        Row: {
          created_at: string
          id: string
          key: string
          managing_table: string
          name: string
          schema: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          managing_table?: string
          name: string
          schema?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          managing_table?: string
          name?: string
          schema?: Json | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          metadata: Json | null
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          metadata?: Json | null
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          metadata?: Json | null
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          id: string
          key: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          did: string
          session_data: Json
          updated_at: string
        }
        Insert: {
          did: string
          session_data: Json
          updated_at?: string
        }
        Update: {
          did?: string
          session_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      shopping_cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          shopping_cart_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          shopping_cart_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          shopping_cart_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "shopping_cart_item_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_cart_items_shopping_cart_id_fkey"
            columns: ["shopping_cart_id"]
            isOneToOne: false
            referencedRelation: "shopping_carts"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_carts: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_carts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      site: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          name: string
          organization_id: string
          site_type_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          name: string
          organization_id: string
          site_type_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          name?: string
          organization_id?: string
          site_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_site_type_id_fkey"
            columns: ["site_type_id"]
            isOneToOne: false
            referencedRelation: "site_type"
            referencedColumns: ["id"]
          },
        ]
      }
      site_delivery_location: {
        Row: {
          created_at: string
          delivery_location_id: string
          id: string
          site_id: string
        }
        Insert: {
          created_at?: string
          delivery_location_id: string
          id?: string
          site_id: string
        }
        Update: {
          created_at?: string
          delivery_location_id?: string
          id?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_delivery_location_delivery_location_id_fkey"
            columns: ["delivery_location_id"]
            isOneToOne: false
            referencedRelation: "delivery_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_delivery_location_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site"
            referencedColumns: ["id"]
          },
        ]
      }
      site_type: {
        Row: {
          created_at: string
          id: string
          key: string
          managing_table: string
          name: string
          schema: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          managing_table?: string
          name: string
          schema?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          managing_table?: string
          name?: string
          schema?: Json | null
        }
        Relationships: []
      }
      stations: {
        Row: {
          address: string
          address1: string | null
          city: string
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          latitude: number | null
          long_description: string | null
          longitude: number | null
          name: string
          number: number | null
          registration_code: string
          site_id: string
          state: string
          zip: string
        }
        Insert: {
          address: string
          address1?: string | null
          city: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          long_description?: string | null
          longitude?: number | null
          name: string
          number?: number | null
          registration_code: string
          site_id: string
          state: string
          zip: string
        }
        Update: {
          address?: string
          address1?: string | null
          city?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          long_description?: string | null
          longitude?: number | null
          name?: string
          number?: number | null
          registration_code?: string
          site_id?: string
          state?: string
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "stations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_balances: {
        Row: {
          amount: number | null
          attrs: Json | null
          created: string | null
          currency: string | null
          description: string | null
          fee: number | null
          id: string | null
          net: number | null
          status: string | null
          type: string | null
        }
        Insert: {
          amount?: number | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          description?: string | null
          fee?: number | null
          id?: string | null
          net?: number | null
          status?: string | null
          type?: string | null
        }
        Update: {
          amount?: number | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          description?: string | null
          fee?: number | null
          id?: string | null
          net?: number | null
          status?: string | null
          type?: string | null
        }
        Relationships: []
      }
      user_organization: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          organization_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organization_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organization_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organization_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organization_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organization_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organization_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          metadata: Json | null
          permission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          metadata?: Json | null
          permission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          metadata?: Json | null
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stations: {
        Row: {
          created_at: string
          id: string
          station_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          station_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          station_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stations_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_stations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          did: string
          email: string
          first_name: string
          handle: string
          id: string
          last_name: string
          metadata: Json | null
          pds_url: string
          phone_number: string | null
          primary_station_id: string | null
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          did: string
          email: string
          first_name: string
          handle: string
          id?: string
          last_name: string
          metadata?: Json | null
          pds_url: string
          phone_number?: string | null
          primary_station_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          did?: string
          email?: string
          first_name?: string
          handle?: string
          id?: string
          last_name?: string
          metadata?: Json | null
          pds_url?: string
          phone_number?: string | null
          primary_station_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_primary_station_id_fkey"
            columns: ["primary_station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status:
        | "placed"
        | "in_progress"
        | "made"
        | "out_for_delivery"
        | "delivered"
        | "canceled"
        | "error"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
