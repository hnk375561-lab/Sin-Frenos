/**
 * Tipos de la base de datos Supabase — Database
 *
 * ARMADO A MANO (14/09/2026), no generado con `supabase gen types
 * typescript`, porque este entorno no tiene acceso a un proyecto Supabase
 * real conectado. Reconstruido leyendo las 9 migraciones SQL de
 * `supabase/migrations/` como fuente de verdad (001 a 009, incluyendo el
 * fix de avatar_url/CASE de 009).
 *
 * Si en algún momento corrés `supabase gen types typescript --project-id
 * <tu-id> > src/types/supabase.ts` contra tu proyecto real, ese comando
 * SOBRESCRIBE este archivo — es la fuente más confiable una vez que
 * tengas el proyecto Supabase levantado y las migraciones aplicadas.
 * Hasta entonces, este archivo es lo que permite que `tsc` tipe contra
 * `Database` sin errores.
 *
 * `src/types/supabase-extension-fase7.ts` documentaba a mano las tablas/
 * funciones/vistas de Fase 7 para pegar acá — ya están incorporadas abajo,
 * ese archivo puede quedar como referencia histórica.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          display_name: string | null
          avatar_url: string | null
          email_verified: boolean
          /** @deprecated superpuesto con seller_type, ver 002 */
          user_type: 'individual' | 'dealer'
          province: string | null
          city: string | null
          phone: string | null
          total_listings: number
          total_sales: number
          avg_rating: number | null
          last_active: string | null
          is_verified: boolean
          is_banned: boolean
          banned_reason: string | null
          metadata: Json
          location_id: string | null
          seller_type: 'particular' | 'concesionaria' | 'profesional' | 'empresa'
          is_admin: boolean
          email_verified_at: string | null
          trust_score: number
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          display_name?: string | null
          avatar_url?: string | null
          email_verified?: boolean
          user_type?: 'individual' | 'dealer'
          province?: string | null
          city?: string | null
          phone?: string | null
          total_listings?: number
          total_sales?: number
          avg_rating?: number | null
          last_active?: string | null
          is_verified?: boolean
          is_banned?: boolean
          banned_reason?: string | null
          metadata?: Json
          location_id?: string | null
          seller_type?: 'particular' | 'concesionaria' | 'profesional' | 'empresa'
          is_admin?: boolean
          email_verified_at?: string | null
          trust_score?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          display_name?: string | null
          avatar_url?: string | null
          email_verified?: boolean
          user_type?: 'individual' | 'dealer'
          province?: string | null
          city?: string | null
          phone?: string | null
          total_listings?: number
          total_sales?: number
          avg_rating?: number | null
          last_active?: string | null
          is_verified?: boolean
          is_banned?: boolean
          banned_reason?: string | null
          metadata?: Json
          location_id?: string | null
          seller_type?: 'particular' | 'concesionaria' | 'profesional' | 'empresa'
          is_admin?: boolean
          email_verified_at?: string | null
          trust_score?: number
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profiles_location_id_fkey'
            columns: ['location_id']
            isOneToOne: false
            referencedRelation: 'locations'
            referencedColumns: ['id']
          }
        ]
      }

      seller_profiles: {
        Row: {
          user_id: string
          business_name: string | null
          cuit: string | null
          verified: boolean
          plan: 'free' | 'pro'
        }
        Insert: {
          user_id: string
          business_name?: string | null
          cuit?: string | null
          verified?: boolean
          plan?: 'free' | 'pro'
        }
        Update: {
          user_id?: string
          business_name?: string | null
          cuit?: string | null
          verified?: boolean
          plan?: 'free' | 'pro'
        }
        Relationships: [
          {
            foreignKeyName: 'seller_profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      locations: {
        Row: {
          id: string
          provincia: string
          ciudad: string
          lat: number | null
          lng: number | null
        }
        Insert: {
          id?: string
          provincia: string
          ciudad: string
          lat?: number | null
          lng?: number | null
        }
        Update: {
          id?: string
          provincia?: string
          ciudad?: string
          lat?: number | null
          lng?: number | null
        }
        Relationships: []
      }

      vehicle_categories: {
        Row: {
          id: string
          name: string
          enabled: boolean
        }
        Insert: {
          id: string
          name: string
          enabled?: boolean
        }
        Update: {
          id?: string
          name?: string
          enabled?: boolean
        }
        Relationships: []
      }

      condition_question_sets: {
        Row: {
          id: string
          questions: Json
        }
        Insert: {
          id: string
          questions?: Json
        }
        Update: {
          id?: string
          questions?: Json
        }
        Relationships: []
      }

      vehicle_conditions: {
        Row: {
          id: string
          label: string
          severity: 'normal' | 'atencion' | 'grave'
          question_set_id: string | null
          enabled: boolean
        }
        Insert: {
          id: string
          label: string
          severity: 'normal' | 'atencion' | 'grave'
          question_set_id?: string | null
          enabled?: boolean
        }
        Update: {
          id?: string
          label?: string
          severity?: 'normal' | 'atencion' | 'grave'
          question_set_id?: string | null
          enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'vehicle_conditions_question_set_id_fkey'
            columns: ['question_set_id']
            isOneToOne: false
            referencedRelation: 'condition_question_sets'
            referencedColumns: ['id']
          }
        ]
      }

      vehicle_models: {
        Row: {
          slug: string
          manufacturer: string
          title: string
          class: string | null
          updated_at: string
        }
        Insert: {
          slug: string
          manufacturer: string
          title: string
          class?: string | null
          updated_at?: string
        }
        Update: {
          slug?: string
          manufacturer?: string
          title?: string
          class?: string | null
          updated_at?: string
        }
        Relationships: []
      }

      listings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          seller_id: string
          vehicle_model_slug: string | null
          title: string
          description: string | null
          price_amount: number | null
          price_currency: string
          /** @deprecated reemplazado por price_amount + price_currency + price_type */
          price_display: string | null
          /** @deprecated reemplazado por condition_id -> vehicle_conditions */
          condition_state:
            | 'new'
            | 'excellent'
            | 'good'
            | 'fair'
            | 'poor'
            | 'restoration'
            | 'project'
            | 'as_is'
            | 'wrecked'
            | null
          /** @deprecated reemplazado por `year` */
          year_manufacture: number | null
          mileage_km: number | null
          transmission: string | null
          fuel_type: string | null
          /** @deprecated reemplazado por location_id -> locations */
          location_province: string | null
          /** @deprecated reemplazado por location_id -> locations */
          location_city: string | null
          location_address: string | null
          has_full_documentation: boolean | null
          documentation_notes: string | null
          status:
            | 'draft'
            | 'pending_review'
            | 'published'
            | 'paused'
            | 'sold'
            | 'removed'
            | 'flagged'
          is_flagged: boolean
          flag_reason: string | null
          moderation_notes: string | null
          view_count: number
          favorite_count: number
          metadata: Json
          category_id: string | null
          condition_id: string | null
          location_id: string | null
          condition_details: Json
          price_type: 'fixed' | 'negotiable' | 'on_request'
          accepts_trade: boolean
          accepts_financing: boolean
          has_title: boolean | null
          title_status: string | null
          featured_until: string | null
          search_vector: unknown
          brand: string | null
          model: string | null
          version: string | null
          year: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          seller_id: string
          vehicle_model_slug?: string | null
          title: string
          description?: string | null
          price_amount?: number | null
          price_currency?: string
          price_display?: string | null
          condition_state?:
            | 'new'
            | 'excellent'
            | 'good'
            | 'fair'
            | 'poor'
            | 'restoration'
            | 'project'
            | 'as_is'
            | 'wrecked'
            | null
          year_manufacture?: number | null
          mileage_km?: number | null
          transmission?: string | null
          fuel_type?: string | null
          location_province?: string | null
          location_city?: string | null
          location_address?: string | null
          has_full_documentation?: boolean | null
          documentation_notes?: string | null
          status?:
            | 'draft'
            | 'pending_review'
            | 'published'
            | 'paused'
            | 'sold'
            | 'removed'
            | 'flagged'
          is_flagged?: boolean
          flag_reason?: string | null
          moderation_notes?: string | null
          view_count?: number
          favorite_count?: number
          metadata?: Json
          category_id?: string | null
          condition_id?: string | null
          location_id?: string | null
          condition_details?: Json
          price_type?: 'fixed' | 'negotiable' | 'on_request'
          accepts_trade?: boolean
          accepts_financing?: boolean
          has_title?: boolean | null
          title_status?: string | null
          featured_until?: string | null
          brand?: string | null
          model?: string | null
          version?: string | null
          year?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          seller_id?: string
          vehicle_model_slug?: string | null
          title?: string
          description?: string | null
          price_amount?: number | null
          price_currency?: string
          price_display?: string | null
          condition_state?:
            | 'new'
            | 'excellent'
            | 'good'
            | 'fair'
            | 'poor'
            | 'restoration'
            | 'project'
            | 'as_is'
            | 'wrecked'
            | null
          year_manufacture?: number | null
          mileage_km?: number | null
          transmission?: string | null
          fuel_type?: string | null
          location_province?: string | null
          location_city?: string | null
          location_address?: string | null
          has_full_documentation?: boolean | null
          documentation_notes?: string | null
          status?:
            | 'draft'
            | 'pending_review'
            | 'published'
            | 'paused'
            | 'sold'
            | 'removed'
            | 'flagged'
          is_flagged?: boolean
          flag_reason?: string | null
          moderation_notes?: string | null
          view_count?: number
          favorite_count?: number
          metadata?: Json
          category_id?: string | null
          condition_id?: string | null
          location_id?: string | null
          condition_details?: Json
          price_type?: 'fixed' | 'negotiable' | 'on_request'
          accepts_trade?: boolean
          accepts_financing?: boolean
          has_title?: boolean | null
          title_status?: string | null
          featured_until?: string | null
          brand?: string | null
          model?: string | null
          version?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'listings_seller_id_fkey'
            columns: ['seller_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'listings_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'vehicle_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'listings_condition_id_fkey'
            columns: ['condition_id']
            isOneToOne: false
            referencedRelation: 'vehicle_conditions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'listings_location_id_fkey'
            columns: ['location_id']
            isOneToOne: false
            referencedRelation: 'locations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fk_listings_vehicle_model_slug'
            columns: ['vehicle_model_slug']
            isOneToOne: false
            referencedRelation: 'vehicle_models'
            referencedColumns: ['slug']
          }
        ]
      }

      listing_media: {
        Row: {
          id: string
          created_at: string
          listing_id: string
          url: string
          width: number | null
          height: number | null
          file_size_bytes: number | null
          mime_type: string
          position: number
          moderation_status: 'pending' | 'approved' | 'rejected'
          is_cover: boolean
          media_type: 'image' | 'video'
        }
        Insert: {
          id?: string
          created_at?: string
          listing_id: string
          url: string
          width?: number | null
          height?: number | null
          file_size_bytes?: number | null
          mime_type?: string
          position?: number
          moderation_status?: 'pending' | 'approved' | 'rejected'
          is_cover?: boolean
          media_type?: 'image' | 'video'
        }
        Update: {
          id?: string
          created_at?: string
          listing_id?: string
          url?: string
          width?: number | null
          height?: number | null
          file_size_bytes?: number | null
          mime_type?: string
          position?: number
          moderation_status?: 'pending' | 'approved' | 'rejected'
          is_cover?: boolean
          media_type?: 'image' | 'video'
        }
        Relationships: [
          {
            foreignKeyName: 'listing_images_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          }
        ]
      }

      conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          listing_id: string
          seller_id: string
          buyer_id: string
          last_message_at: string | null
          last_message_preview: string | null
          is_archived: boolean
          is_blocked: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          listing_id: string
          seller_id: string
          buyer_id: string
          last_message_at?: string | null
          last_message_preview?: string | null
          is_archived?: boolean
          is_blocked?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          listing_id?: string
          seller_id?: string
          buyer_id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          is_archived?: boolean
          is_blocked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'conversations_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conversations_seller_id_fkey'
            columns: ['seller_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conversations_buyer_id_fkey'
            columns: ['buyer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      conversation_messages: {
        Row: {
          id: string
          created_at: string
          conversation_id: string
          sender_id: string | null
          content: string
          is_read: boolean
          read_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          conversation_id: string
          sender_id?: string | null
          content: string
          is_read?: boolean
          read_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          conversation_id?: string
          sender_id?: string | null
          content?: string
          is_read?: boolean
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'conversation_messages_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conversation_messages_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      favorites: {
        Row: {
          id: string
          created_at: string
          user_id: string
          listing_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          listing_id: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'favorites_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'favorites_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          }
        ]
      }

      listing_reports: {
        Row: {
          id: string
          listing_id: string
          reporter_id: string | null
          reason:
            | 'precio_absurdo'
            | 'fotos_robadas'
            | 'spam'
            | 'duplicado'
            | 'datos_enganosos'
            | 'contacto_incorrecto'
            | 'otro'
          details: string | null
          status: 'open' | 'reviewed' | 'dismissed'
          created_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          listing_id: string
          reporter_id?: string | null
          reason:
            | 'precio_absurdo'
            | 'fotos_robadas'
            | 'spam'
            | 'duplicado'
            | 'datos_enganosos'
            | 'contacto_incorrecto'
            | 'otro'
          details?: string | null
          status?: 'open' | 'reviewed' | 'dismissed'
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          id?: string
          listing_id?: string
          reporter_id?: string | null
          reason?:
            | 'precio_absurdo'
            | 'fotos_robadas'
            | 'spam'
            | 'duplicado'
            | 'datos_enganosos'
            | 'contacto_incorrecto'
            | 'otro'
          details?: string | null
          status?: 'open' | 'reviewed' | 'dismissed'
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'listing_reports_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'listing_reports_reporter_id_fkey'
            columns: ['reporter_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'listing_reports_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }

      moderation_actions: {
        Row: {
          id: string
          listing_id: string
          moderator_id: string | null
          action:
            | 'approved'
            | 'rejected'
            | 'paused'
            | 'removed'
            | 'flagged_duplicate'
            | 'flagged_suspicious'
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          moderator_id?: string | null
          action:
            | 'approved'
            | 'rejected'
            | 'paused'
            | 'removed'
            | 'flagged_duplicate'
            | 'flagged_suspicious'
          reason?: string | null
          created_at?: string
        }
        // append-only: no se editan filas de auditoría de moderación
        Update: never
        Relationships: [
          {
            foreignKeyName: 'moderation_actions_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'moderation_actions_moderator_id_fkey'
            columns: ['moderator_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }

      vendor_auto_approval_rules: {
        Row: {
          id: string
          min_trust_score: number
          min_successful_sales: number
          days_since_account_creation: number
          max_rejections_lifetime: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          min_trust_score?: number
          min_successful_sales?: number
          days_since_account_creation?: number
          max_rejections_lifetime?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          min_trust_score?: number
          min_successful_sales?: number
          days_since_account_creation?: number
          max_rejections_lifetime?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }

    Views: {
      public_profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          seller_type: 'particular' | 'concesionaria' | 'profesional' | 'empresa'
          is_verified: boolean
          total_listings: number
          total_sales: number
          avg_rating: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'public_profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      public_seller_profiles: {
        Row: {
          user_id: string
          business_name: string | null
          verified: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'public_seller_profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'seller_profiles'
            referencedColumns: ['user_id']
          }
        ]
      }

      listing_reports_summary: {
        Row: {
          listing_id: string
          total_reports: number
          open_count: number
          last_reported_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'listing_reports_summary_listing_id'
            columns: ['listing_id']
            isOneToOne: true
            referencedRelation: 'listings'
            referencedColumns: ['id']
          }
        ]
      }
    }

    Functions: {
      check_auto_approval: {
        Args: {
          p_seller_id: string
          p_rule_id?: string
        }
        Returns: {
          should_auto_approve: boolean
          reason: string
        }[]
      }

      detect_duplicate_listing: {
        Args: {
          p_seller_id: string
          p_brand: string
          p_model: string
          p_year: number
          p_price: number
          p_days_window?: number
        }
        Returns: {
          is_potential_duplicate: boolean
          duplicate_listing_id: string | null
          reason: string
        }[]
      }

      check_rate_limit_new_seller: {
        Args: {
          p_seller_id: string
          p_max_listings?: number
          p_hours_window?: number
        }
        Returns: {
          is_within_limit: boolean
          current_count: number
          limit: number
        }[]
      }
    }

    Enums: {
      [_ in never]: never
    }

    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers de conveniencia (mismo patrón que agrega `supabase gen types` en
// versiones recientes del CLI) — opcionales, no rompen nada si no se usan.
// ---------------------------------------------------------------------------

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
