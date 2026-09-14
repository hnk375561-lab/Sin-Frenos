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

import { createBrowserClient } from '@supabase/ssr'

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

export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.invalid',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      // PKCE (el default de @supabase/ssr) requiere que el code_verifier
      // generado al pedir el magic link siga en el localStorage del MISMO
      // navegador/perfil que abre el link del mail. En la práctica, el
      // usuario pide el link desde un navegador y lo abre desde la app de
      // mail (que dispara el navegador por defecto del sistema, no
      // necesariamente el mismo perfil) — ahí no hay verifier guardado,
      // `exchangeCodeForSession` rechaza la promesa sin pasar por el
      // `.then()` de abajo (no hay `.catch()`), y el usuario queda
      // pegado en `/ingresar/?code=...` para siempre sin ver ningún
      // error. Con flujo implícito el magic link ya trae el token en el
      // fragment de la URL (`#access_token=...`) y `detectSessionInUrl`
      // (true por defecto) lo procesa solo al iniciar el cliente, sin
      // depender de nada guardado localmente — funciona sin importar en
      // qué navegador se abra.
      flowType: 'implicit',
    },
  }
)
