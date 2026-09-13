import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ModerationDashboard } from '@/components/admin/ModerationDashboard'
import { Database } from '@/types/supabase'

/**
 * Página de moderación — solo accesible para admins
 * Verificar is_admin = true en profiles antes de renderizar
 */
export default async function ModerationPage() {
  // Nota: Esta verificación es de "suavidad UX" — la seguridad REAL vive en RLS.
  // Si alguien intenta acceder sin ser admin, la llamada a supabase desde el
  // cliente fallará con "permission denied" (RLS lo bloquea). Aquí chequeamos
  // principalmente para evitar mostrar la UI completa a no-admins.

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/ingresar')
  }

  // Verificar is_admin (soft check)
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <ModerationDashboard />
    </main>
  )
}
