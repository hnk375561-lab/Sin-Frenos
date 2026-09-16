/**
 * Cliente Supabase BROWSER-ONLY (client-side)
 *
 * SEGURIDAD:
 * - Usa la anon key pública (segura de exponer — diseñado así por Supabase)
 * - La seguridad real vive en Row Level Security (RLS) — ver supabase/migrations/
 * - TODO acceso a datos pasa por RLS antes de devolverse al cliente
 * - NO almacenar secrets o credenciales server-side acá
 *
 * USO:
 * - Importar en componentes client-side: `import { supabase } from '@/lib/supabase/client'`
 * - NO importar en Route Handlers o funciones server-side
 * - Si necesita datos en un Server Component, pasar vía props/context desde un Client Component
 *
 * CONFIGURACIÓN:
 * - NEXT_PUBLIC_SUPABASE_URL: URL del proyecto (https://[PROJECT_ID].supabase.co)
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Anon key de Settings → API en el dashboard
 */

'use client'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// NO se tira acá a propósito (cambio respecto a la versión original de
// Fase 1). Desde que `useAuth` engancha este cliente al Header — que se
// monta en TODAS las páginas, no solo en `/ingresar` — un `throw` acá
// tumbaría el sitio entero (catálogo técnico incluido) apenas faltara una
// env var de Supabase. Eso contradice el principio central de la sección 3
// del documento maestro: "si Supabase se cae, el sitio sigue sirviendo".
// Con env vars faltantes, el cliente se crea igual contra una URL
// placeholder — las llamadas de red van a fallar (rechazo de promesa), no
// el render. Cada callsite (useAuth, /ingresar, /publicar, etc.) es
// responsable de manejar ese fallo sin romper la página.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Las features del marketplace (login, listings, favoritos con cuenta) van a fallar silenciosamente. ' +
    'El catálogo técnico, el comparador y el resto del sitio no se ven afectados.'
  )
}

// Este sitio es un export estático sin servidor que pueda intercambiar un
// verifier PKCE. El magic link puede abrirse en cualquier navegador o
// webview, por eso usamos implicit flow y dejamos que Supabase procese los
// tokens del hash con detectSessionInUrl.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.invalid',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      flowType: 'implicit',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)
