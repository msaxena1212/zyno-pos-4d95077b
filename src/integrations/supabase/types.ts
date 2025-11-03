export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_audit: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          module_name: string
          new_value: Json | null
          old_value: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          module_name: string
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          module_name?: string
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_audit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          status: Database["public"]["Enums"]["brand_status"] | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          status?: Database["public"]["Enums"]["brand_status"] | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          status?: Database["public"]["Enums"]["brand_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cashback_transactions: {
        Row: {
          amount: number
          balance_after: number
          cashback_account_id: string
          created_at: string | null
          created_by: string | null
          customer_id: string
          description: string | null
          earning_rate: number | null
          earning_source: string | null
          expires_at: string | null
          id: string
          status: string | null
          transaction_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          cashback_account_id: string
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          description?: string | null
          earning_rate?: number | null
          earning_source?: string | null
          expires_at?: string | null
          id?: string
          status?: string | null
          transaction_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          cashback_account_id?: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          description?: string | null
          earning_rate?: number | null
          earning_source?: string | null
          expires_at?: string | null
          id?: string
          status?: string | null
          transaction_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashback_transactions_cashback_account_id_fkey"
            columns: ["cashback_account_id"]
            isOneToOne: false
            referencedRelation: "customer_cashback_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashback_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashback_transactions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "pos_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_note_items: {
        Row: {
          created_at: string | null
          credit_note_id: string
          id: string
          line_total: number
          product_id: string | null
          quantity: number
          tax_amount: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          credit_note_id: string
          id?: string
          line_total: number
          product_id?: string | null
          quantity: number
          tax_amount?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          credit_note_id?: string
          id?: string
          line_total?: number
          product_id?: string | null
          quantity?: number
          tax_amount?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "credit_note_items_credit_note_id_fkey"
            columns: ["credit_note_id"]
            isOneToOne: false
            referencedRelation: "credit_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_note_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_notes: {
        Row: {
          approved_by: string | null
          brand_id: string | null
          created_at: string | null
          created_by: string | null
          credit_note_date: string
          credit_note_number: string
          customer_id: string | null
          expiry_date: string | null
          id: string
          notes: string | null
          original_transaction_id: string | null
          processing_fee: number | null
          return_condition: string | null
          return_reason: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          brand_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_note_date?: string
          credit_note_number: string
          customer_id?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          original_transaction_id?: string | null
          processing_fee?: number | null
          return_condition?: string | null
          return_reason?: string | null
          status?: string | null
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          brand_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_note_date?: string
          credit_note_number?: string
          customer_id?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          original_transaction_id?: string | null
          processing_fee?: number | null
          return_condition?: string | null
          return_reason?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_original_transaction_id_fkey"
            columns: ["original_transaction_id"]
            isOneToOne: false
            referencedRelation: "pos_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_cashback_accounts: {
        Row: {
          brand_id: string | null
          created_at: string | null
          current_balance: number
          customer_id: string
          id: string
          total_earned: number
          total_expired: number
          total_redeemed: number
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string | null
          current_balance?: number
          customer_id: string
          id?: string
          total_earned?: number
          total_expired?: number
          total_redeemed?: number
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string | null
          current_balance?: number
          customer_id?: string
          id?: string
          total_earned?: number
          total_expired?: number
          total_redeemed?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_cashback_accounts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_cashback_accounts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          brand_id: string | null
          city: string | null
          country: string | null
          created_at: string | null
          customer_number: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          last_purchase_date: string | null
          loyalty_points: number | null
          notes: string | null
          phone: string
          postal_code: string | null
          state: string | null
          status: string | null
          total_purchases: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          brand_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          customer_number: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          last_purchase_date?: string | null
          loyalty_points?: number | null
          notes?: string | null
          phone: string
          postal_code?: string | null
          state?: string | null
          status?: string | null
          total_purchases?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          brand_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          customer_number?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          last_purchase_date?: string | null
          loyalty_points?: number | null
          notes?: string | null
          phone?: string
          postal_code?: string | null
          state?: string | null
          status?: string | null
          total_purchases?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          card_number: string
          created_at: string | null
          current_balance: number
          customer_id: string | null
          expiry_date: string | null
          id: string
          initial_balance: number
          issued_date: string | null
          pin: string | null
          status: string | null
        }
        Insert: {
          card_number: string
          created_at?: string | null
          current_balance: number
          customer_id?: string | null
          expiry_date?: string | null
          id?: string
          initial_balance: number
          issued_date?: string | null
          pin?: string | null
          status?: string | null
        }
        Update: {
          card_number?: string
          created_at?: string | null
          current_balance?: number
          customer_id?: string | null
          expiry_date?: string | null
          id?: string
          initial_balance?: number
          issued_date?: string | null
          pin?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          brand_id: string | null
          created_at: string | null
          id: string
          last_stock_count: string | null
          location: string | null
          product_id: string
          quantity_available: number | null
          quantity_on_hand: number | null
          quantity_reserved: number | null
          reorder_point: number | null
          reorder_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string | null
          id?: string
          last_stock_count?: string | null
          location?: string | null
          product_id: string
          quantity_available?: number | null
          quantity_on_hand?: number | null
          quantity_reserved?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string | null
          id?: string
          last_stock_count?: string | null
          location?: string | null
          product_id?: string
          quantity_available?: number | null
          quantity_on_hand?: number | null
          quantity_reserved?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          approved_by: string | null
          brand_id: string | null
          code: string
          created_at: string | null
          created_by: string | null
          current_usage_count: number | null
          description: string | null
          discount_percentage: number | null
          discount_value: number | null
          eligibility_rules: Json | null
          end_date: string | null
          id: string
          max_discount_cap: number | null
          min_purchase_amount: number | null
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["offer_status"] | null
          total_usage_limit: number | null
          type: Database["public"]["Enums"]["offer_type"]
          updated_at: string | null
          usage_limit_per_customer: number | null
        }
        Insert: {
          approved_by?: string | null
          brand_id?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          current_usage_count?: number | null
          description?: string | null
          discount_percentage?: number | null
          discount_value?: number | null
          eligibility_rules?: Json | null
          end_date?: string | null
          id?: string
          max_discount_cap?: number | null
          min_purchase_amount?: number | null
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"] | null
          total_usage_limit?: number | null
          type: Database["public"]["Enums"]["offer_type"]
          updated_at?: string | null
          usage_limit_per_customer?: number | null
        }
        Update: {
          approved_by?: string | null
          brand_id?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_usage_count?: number | null
          description?: string | null
          discount_percentage?: number | null
          discount_value?: number | null
          eligibility_rules?: Json | null
          end_date?: string | null
          id?: string
          max_discount_cap?: number | null
          min_purchase_amount?: number | null
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"] | null
          total_usage_limit?: number | null
          type?: Database["public"]["Enums"]["offer_type"]
          updated_at?: string | null
          usage_limit_per_customer?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          authorization_code: string | null
          card_last_four: string | null
          created_at: string | null
          id: string
          payment_date: string | null
          payment_method: string
          payment_status: string | null
          transaction_id: string
        }
        Insert: {
          amount: number
          authorization_code?: string | null
          card_last_four?: string | null
          created_at?: string | null
          id?: string
          payment_date?: string | null
          payment_method: string
          payment_status?: string | null
          transaction_id: string
        }
        Update: {
          amount?: number
          authorization_code?: string | null
          card_last_four?: string | null
          created_at?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: string
          payment_status?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "pos_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action_type: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          module_name: string
          name: string
        }
        Insert: {
          action_type: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          module_name: string
          name: string
        }
        Update: {
          action_type?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          module_name?: string
          name?: string
        }
        Relationships: []
      }
      pos_transaction_items: {
        Row: {
          created_at: string | null
          discount_amount: number | null
          id: string
          line_total: number
          notes: string | null
          product_id: string
          quantity: number
          tax_amount: number | null
          transaction_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          line_total: number
          notes?: string | null
          product_id: string
          quantity: number
          tax_amount?: number | null
          transaction_id: string
          unit_price: number
        }
        Update: {
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          line_total?: number
          notes?: string | null
          product_id?: string
          quantity?: number
          tax_amount?: number | null
          transaction_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "pos_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_transactions: {
        Row: {
          amount_paid: number | null
          brand_id: string | null
          cashier_id: string
          change_amount: number | null
          created_at: string | null
          customer_id: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          payment_status: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          transaction_date: string | null
          transaction_number: string
          transaction_type: string | null
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          brand_id?: string | null
          cashier_id: string
          change_amount?: number | null
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          status?: string | null
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          transaction_date?: string | null
          transaction_number: string
          transaction_type?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          brand_id?: string | null
          cashier_id?: string
          change_amount?: number | null
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          transaction_date?: string | null
          transaction_number?: string
          transaction_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_transactions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transactions_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          parent_category_id: string | null
          status: string | null
          tax_rate: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_category_id?: string | null
          status?: string | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_category_id?: string | null
          status?: string | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand_id: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          expiry_date: string | null
          id: string
          image_url: string | null
          is_perishable: boolean | null
          is_taxable: boolean | null
          name: string
          sku: string
          status: string | null
          tax_rate: number | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_perishable?: boolean | null
          is_taxable?: boolean | null
          name: string
          sku: string
          status?: string | null
          tax_rate?: number | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_perishable?: boolean | null
          is_taxable?: boolean | null
          name?: string
          sku?: string
          status?: string | null
          tax_rate?: number | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_login: string | null
          last_name: string | null
          phone: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      return_disposition_codes: {
        Row: {
          active: boolean | null
          affects_inventory: boolean | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          inventory_status: string | null
          name: string
        }
        Insert: {
          active?: boolean | null
          affects_inventory?: boolean | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          inventory_status?: string | null
          name: string
        }
        Update: {
          active?: boolean | null
          affects_inventory?: boolean | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          inventory_status?: string | null
          name?: string
        }
        Relationships: []
      }
      return_items: {
        Row: {
          created_at: string | null
          discount_amount: number | null
          disposition_code: string | null
          id: string
          inspected_by: string | null
          inspection_date: string | null
          line_total: number
          lot_number: string | null
          original_transaction_item_id: string | null
          product_id: string
          quality_notes: string | null
          quantity_already_returned: number | null
          quantity_purchased: number
          quantity_returned: number
          return_condition: string | null
          return_reason_code: string | null
          return_request_id: string
          serial_number: string | null
          tax_amount: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount_amount?: number | null
          disposition_code?: string | null
          id?: string
          inspected_by?: string | null
          inspection_date?: string | null
          line_total: number
          lot_number?: string | null
          original_transaction_item_id?: string | null
          product_id: string
          quality_notes?: string | null
          quantity_already_returned?: number | null
          quantity_purchased: number
          quantity_returned: number
          return_condition?: string | null
          return_reason_code?: string | null
          return_request_id: string
          serial_number?: string | null
          tax_amount?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          discount_amount?: number | null
          disposition_code?: string | null
          id?: string
          inspected_by?: string | null
          inspection_date?: string | null
          line_total?: number
          lot_number?: string | null
          original_transaction_item_id?: string | null
          product_id?: string
          quality_notes?: string | null
          quantity_already_returned?: number | null
          quantity_purchased?: number
          quantity_returned?: number
          return_condition?: string | null
          return_reason_code?: string | null
          return_request_id?: string
          serial_number?: string | null
          tax_amount?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "return_items_original_transaction_item_id_fkey"
            columns: ["original_transaction_item_id"]
            isOneToOne: false
            referencedRelation: "pos_transaction_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_return_request_id_fkey"
            columns: ["return_request_id"]
            isOneToOne: false
            referencedRelation: "return_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      return_reason_codes: {
        Row: {
          active: boolean | null
          category: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          requires_manager_approval: boolean | null
        }
        Insert: {
          active?: boolean | null
          category: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          requires_manager_approval?: boolean | null
        }
        Update: {
          active?: boolean | null
          category?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          requires_manager_approval?: boolean | null
        }
        Relationships: []
      }
      return_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          brand_id: string | null
          completed_at: string | null
          created_at: string | null
          customer_id: string | null
          customer_signature: string | null
          id: string
          notes: string | null
          original_transaction_id: string | null
          photos: Json | null
          processing_fee: number | null
          refund_method: string | null
          refund_reference: string | null
          refund_status: string | null
          requested_by: string | null
          requires_approval: boolean | null
          restocking_fee: number | null
          return_method: string | null
          return_type: string | null
          rma_date: string
          rma_number: string
          status: string | null
          subtotal: number
          tax_amount: number | null
          total_refund_amount: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          brand_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_signature?: string | null
          id?: string
          notes?: string | null
          original_transaction_id?: string | null
          photos?: Json | null
          processing_fee?: number | null
          refund_method?: string | null
          refund_reference?: string | null
          refund_status?: string | null
          requested_by?: string | null
          requires_approval?: boolean | null
          restocking_fee?: number | null
          return_method?: string | null
          return_type?: string | null
          rma_date?: string
          rma_number: string
          status?: string | null
          subtotal: number
          tax_amount?: number | null
          total_refund_amount: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          brand_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_signature?: string | null
          id?: string
          notes?: string | null
          original_transaction_id?: string | null
          photos?: Json | null
          processing_fee?: number | null
          refund_method?: string | null
          refund_reference?: string | null
          refund_status?: string | null
          requested_by?: string | null
          requires_approval?: boolean | null
          restocking_fee?: number | null
          return_method?: string | null
          return_type?: string | null
          rma_date?: string
          rma_number?: string
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_refund_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "return_requests_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_requests_original_transaction_id_fkey"
            columns: ["original_transaction_id"]
            isOneToOne: false
            referencedRelation: "pos_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          conditions: Json | null
          created_at: string | null
          id: string
          permission_id: string | null
          role_id: string | null
        }
        Insert: {
          conditions?: Json | null
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role_id?: string | null
        }
        Update: {
          conditions?: Json | null
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role_id?: string | null
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
          brand_id: string | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          role_level: number | null
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          role_level?: number | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          role_level?: number | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_assignments: {
        Row: {
          assigned_by: string | null
          assigned_date: string | null
          brand_id: string | null
          end_date: string | null
          id: string
          role_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          user_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_date?: string | null
          brand_id?: string | null
          end_date?: string | null
          id?: string
          role_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          user_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_date?: string | null
          brand_id?: string | null
          end_date?: string | null
          id?: string
          role_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_tasks: {
        Row: {
          approval_rule: Json | null
          assigned_to_role_id: string | null
          assigned_to_user_id: string | null
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          escalation_rule: Json | null
          id: string
          status: Database["public"]["Enums"]["workflow_task_status"] | null
          task_name: string
          task_type: Database["public"]["Enums"]["workflow_task_type"]
          updated_at: string | null
          workflow_id: string | null
        }
        Insert: {
          approval_rule?: Json | null
          assigned_to_role_id?: string | null
          assigned_to_user_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          escalation_rule?: Json | null
          id?: string
          status?: Database["public"]["Enums"]["workflow_task_status"] | null
          task_name: string
          task_type: Database["public"]["Enums"]["workflow_task_type"]
          updated_at?: string | null
          workflow_id?: string | null
        }
        Update: {
          approval_rule?: Json | null
          assigned_to_role_id?: string | null
          assigned_to_user_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          escalation_rule?: Json | null
          id?: string
          status?: Database["public"]["Enums"]["workflow_task_status"] | null
          task_name?: string
          task_type?: Database["public"]["Enums"]["workflow_task_type"]
          updated_at?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_tasks_assigned_to_role_id_fkey"
            columns: ["assigned_to_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_tasks_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_cashback: {
        Args: { p_customer_id: string; p_transaction_amount: number }
        Returns: number
      }
      generate_credit_note_number: { Args: never; Returns: string }
      generate_customer_number: { Args: never; Returns: string }
      generate_rma_number: { Args: never; Returns: string }
      generate_transaction_number: { Args: never; Returns: string }
      get_user_role: { Args: { user_uuid: string }; Returns: string }
      process_return_inventory: {
        Args: { p_return_request_id: string }
        Returns: boolean
      }
      update_inventory_quantity: {
        Args: { p_product_id: string; p_quantity_change: number }
        Returns: undefined
      }
      user_has_permission: {
        Args: { perm_code: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "assistant_manager"
        | "supervisor"
        | "cashier"
        | "stock_manager"
        | "finance_officer"
        | "marketing_manager"
        | "support"
      brand_status: "active" | "inactive" | "archived"
      offer_status:
        | "draft"
        | "submitted"
        | "approved"
        | "active"
        | "expired"
        | "archived"
      offer_type:
        | "percentage"
        | "fixed_amount"
        | "bogo"
        | "bundle"
        | "free_item"
        | "tiered"
        | "loyalty"
        | "cashback"
        | "flash"
      user_status: "active" | "inactive" | "suspended"
      workflow_task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "escalated"
      workflow_task_type:
        | "user_task"
        | "system_task"
        | "approval"
        | "notification"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "manager",
        "assistant_manager",
        "supervisor",
        "cashier",
        "stock_manager",
        "finance_officer",
        "marketing_manager",
        "support",
      ],
      brand_status: ["active", "inactive", "archived"],
      offer_status: [
        "draft",
        "submitted",
        "approved",
        "active",
        "expired",
        "archived",
      ],
      offer_type: [
        "percentage",
        "fixed_amount",
        "bogo",
        "bundle",
        "free_item",
        "tiered",
        "loyalty",
        "cashback",
        "flash",
      ],
      user_status: ["active", "inactive", "suspended"],
      workflow_task_status: [
        "pending",
        "in_progress",
        "completed",
        "escalated",
      ],
      workflow_task_type: [
        "user_task",
        "system_task",
        "approval",
        "notification",
      ],
    },
  },
} as const
