'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { ModerationDashboard } from '@/components/admin/ModerationDashboard'

/**
 * Página de moderación — solo accesible para admins.
 *
 * Verificar is_admin = true en profiles antes de renderizar.
 *
 * HALLAZGO (14/09/2026, ver también HOTFIX-lint-ci.md): esta página era
 * originalmente un Server Component async que creaba su propio cliente
 * Supabase con `createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
 * process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)`. Dos problemas reales:
 *
 * 1. Build roto: el sitio es `output: 'export'` (estático puro, sin
 *    servidor — ver next.config.js). Sin NEXT_PUBLIC_SUPABASE_URL /
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY configuradas como Repository Variable
 *    en GitHub Actions, el `!` (aserción no-nula) sobre un `undefined`
 *    tira "supabaseUrl is required" AL PRERENDERIZAR esta página en build
 *    time, y `next build` aborta el export entero — ninguna otra página
 *    del sitio llega a publicarse por este error en una sola ruta admin.
 * 2. Lógica sin sentido para un export estático: aun si el build no
 *    rompiera, un chequeo de auth en un Server Component de un sitio
 *    100% estático corre UNA SOLA VEZ, en build time — no por cada
 *    visitante. El resultado (redirect o no) queda horneado en el HTML
 *    publicado para siempre, sin importar quién entre después.
 *
 * Solución: mismo patrón ya usado en `/ingresar` (ver
 * src/app/ingresar/page.tsx) y en `ModerationDashboard` — client
 * component que usa el cliente Supabase compartido
 * (`@/lib/supabase/client`, que nunca tira aunque falten las env vars,
 * ver comentario ahí) y corre la verificación en el navegador de cada
 * visitante. La seguridad REAL sigue viviendo en RLS (ver
 * supabase/migrations/); este chequeo es de "suavidad UX", igual que
 * antes.
 */
export default function ModerationPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.replace('/ingresar')
      return
    }

    let active = true

    async function checkAdmin() {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user!.id)
          .single()

        if (!active) return
        if (!profile?.is_admin) {
          router.replace('/')
          return
        }
        setIsAdmin(true)
        setCheckingAdmin(false)
      } catch {
        // Supabase inalcanzable u otro error de red: no dejamos a un
        // no-admin pasar por defecto, mandamos al inicio igual que si
        // is_admin diera false.
        if (!active) return
        router.replace('/')
      }
    }

    checkAdmin()

    return () => {
      active = false
    }
  }, [authLoading, user, router])

  if (authLoading || checkingAdmin || !isAdmin) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div style={{ padding: 32 }}>
          <p>Verificando acceso...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <ModerationDashboard />
    </main>
  )
}
