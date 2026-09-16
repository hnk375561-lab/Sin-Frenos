'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

export function AccountSelfService() {
  const { user, loading, signOut } = useAuth()
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  // The generated Supabase types predate migration 011; this narrow escape
  // hatch is isolated here until the project regenerates database types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  useEffect(() => {
    if (!user) return
    db.from('profiles').select('id,display_name,avatar_url,phone,seller_type,created_at,updated_at').eq('id', user.id).maybeSingle().then(({ data }: { data: Record<string, unknown> | null }) => {
      setProfile(data)
      setDisplayName(String(data?.display_name ?? ''))
      setPhone(String(data?.phone ?? ''))
    })
  }, [user, db])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setBusy(true); setMessage('')
    const { error } = await db.from('profiles').update({ display_name: displayName.trim() || null, phone: phone.trim() || null }).eq('id', user.id)
    setBusy(false); setMessage(error ? `No se pudo guardar: ${error.message}` : 'Perfil actualizado.')
  }

  async function exportData() {
    if (!user) return
    setBusy(true)
    const [profileResult, sellerResult, listingsResult, consentResult, messagesResult] = await Promise.all([
      db.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      db.from('seller_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      db.from('listings').select('*').eq('seller_id', user.id),
      db.from('consent_records').select('*').eq('user_id', user.id),
      db.from('conversation_messages').select('id,conversation_id,created_at').eq('sender_id', user.id),
    ])
    const payload = { exported_at: new Date().toISOString(), user_id: user.id, email: user.email ?? null, profile: profileResult.data, seller_profile: sellerResult.data, listings: listingsResult.data ?? [], consent_records: consentResult.data ?? [], messages_sent: messagesResult.data?.length ?? 0, messages: messagesResult.data ?? [] }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'sinfrenos-mis-datos.json'; anchor.click(); URL.revokeObjectURL(url)
    setBusy(false); setMessage('Descarga preparada.')
  }

  async function deleteAccount() {
    if (!user || confirm !== 'ELIMINAR') return
    setBusy(true); setMessage('')
    const { error: listingsError } = await db.from('listings').update({ status: 'deleted', deleted_at: new Date().toISOString() }).eq('seller_id', user.id)
    const { error } = await db.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', user.id)
    if (listingsError || error) { setMessage(`No se pudo completar la baja: ${listingsError?.message ?? error?.message}`); setBusy(false); return }
    await signOut(); setBusy(false); setMessage('Cuenta dada de baja. Tus perfiles y publicaciones dejaron de mostrarse públicamente.')
  }

  if (loading) return <p className="text-neutral-600">Cargando tu cuenta…</p>
  if (!user) return <div className="rounded-2xl border border-edge bg-surface p-6"><h2 className="text-xl font-semibold text-neutral-900">Necesitás iniciar sesión</h2><p className="mt-2 text-neutral-600">Usá tu magic link para consultar, exportar o eliminar tus datos.</p><Link className="mt-4 inline-block rounded-lg bg-auto-accent px-4 py-2 font-semibold text-[#09090B]" href="/ingresar">Ir a ingresar</Link></div>

  return <div className="space-y-8"><section className="rounded-2xl border border-edge bg-surface p-6"><h2 className="text-xl font-semibold text-neutral-900">Tus datos</h2><p className="mt-1 text-sm text-neutral-500">Email de acceso: {user.email}</p><form onSubmit={saveProfile} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm font-medium">Nombre visible<input className="rounded-lg border border-edge px-3 py-2" value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></label><label className="grid gap-1 text-sm font-medium">Teléfono<input className="rounded-lg border border-edge px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} /></label><button disabled={busy} className="w-fit rounded-lg bg-auto-accent px-4 py-2 font-semibold text-[#09090B]" type="submit">Guardar cambios</button></form></section><section className="rounded-2xl border border-edge bg-surface p-6"><h2 className="text-xl font-semibold text-neutral-900">Derechos ARCO</h2><p className="mt-2 text-neutral-600">Podés descargar los datos disponibles o solicitar la baja. La baja es suave para preservar reportes y obligaciones operativas; la PII se programa para eliminación según la política de retención.</p><div className="mt-4 flex flex-wrap gap-3"><button disabled={busy} onClick={exportData} className="rounded-lg border border-edge px-4 py-2 font-semibold" type="button">Descargar mis datos</button><button onClick={signOut} className="rounded-lg border border-edge px-4 py-2" type="button">Cerrar sesión</button></div></section><section className="rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="text-xl font-semibold text-red-950">Eliminar mi cuenta</h2><p className="mt-2 text-red-900">Escribí <strong>ELIMINAR</strong> para confirmar. Tus publicaciones activas se despublican y tu perfil deja de aparecer en vistas públicas.</p><input aria-label="Confirmación de eliminación" className="mt-4 rounded-lg border border-red-300 px-3 py-2" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="ELIMINAR" /><button disabled={busy || confirm !== 'ELIMINAR'} onClick={deleteAccount} className="ml-3 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50" type="button">Eliminar cuenta</button></section>{message && <p role="status" className="text-sm text-neutral-700">{message}</p>}{profile && <p className="text-xs text-neutral-400">Perfil activo desde {String(profile.created_at ?? 'fecha no disponible')}.</p>}</div>
}
