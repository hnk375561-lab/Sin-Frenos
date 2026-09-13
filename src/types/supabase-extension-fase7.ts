/**
 * EXTENSIÓN de tipos Supabase para Fase 7
 *
 * Si tu archivo `src/types/supabase.ts` fue auto-generado por Supabase CLI
 * (ej: `supabase gen types typescript`), este archivo documenta qué NUEVAS
 * tablas y funciones RPC se agregan en Fase 7.
 *
 * Para usar:
 *   1. Regenerar tipos: `supabase gen types typescript --local > src/types/supabase.ts`
 *   2. O, si generas a mano, copiar las definiciones de abajo a supabase.ts
 */

/**
 * Agregar a Database['public']['Tables'] en supabase.ts:
 */
export const Fase7TablesExtension = `
  listing_reports: {
    Row: {
      id: string
      listing_id: string
      reporter_id: string | null
      reason: 'precio_absurdo' | 'fotos_robadas' | 'spam' | 'duplicado' | 'datos_enganosos' | 'contacto_incorrecto' | 'otro'
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
      reason: 'precio_absurdo' | 'fotos_robadas' | 'spam' | 'duplicado' | 'datos_enganosos' | 'contacto_incorrecto' | 'otro'
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
      reason?: 'precio_absurdo' | 'fotos_robadas' | 'spam' | 'duplicado' | 'datos_enganosos' | 'contacto_incorrecto' | 'otro'
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
      action: 'approved' | 'rejected' | 'paused' | 'removed' | 'flagged_duplicate' | 'flagged_suspicious'
      reason: string | null
      created_at: string
    }
    Insert: {
      id?: string
      listing_id: string
      moderator_id?: string | null
      action: 'approved' | 'rejected' | 'paused' | 'removed' | 'flagged_duplicate' | 'flagged_suspicious'
      reason?: string | null
      created_at?: string
    }
    Update: never  // append-only table, no updates
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
`

/**
 * Agregar a Database['public']['Functions'] en supabase.ts:
 */
export const Fase7FunctionsExtension = `
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
`

/**
 * Agregar a Database['public']['Views'] en supabase.ts:
 */
export const Fase7ViewsExtension = `
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
`

/**
 * Actualizar columnas de profiles:
 * (agregar a la Row/Insert/Update de profiles)
 */
export const Fase7ProfilesColumnsExtension = `
  email_verified_at: string | null  // timestamp
  trust_score: number  // default 50, 0-100
`
