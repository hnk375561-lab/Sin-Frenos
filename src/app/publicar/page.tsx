'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { PublishWizard } from '@/components/listings/publicar/PublishWizard'

/**
 * Ruta `/publicar` — Fase 4 del documento maestro ("wizard completo con
 * subida real de fotos"). Esta página SOLO resuelve el auth-gate; toda la
 * lógica del wizard en sí vive en `PublishWizard.tsx` (mismo criterio que
 * documenta `create.ts`: "el caller es quien ya hizo el auth-gate y tiene
 * la sesión resuelta").
 *
 * `output: 'export'` sigue intacto (sección 1/16 del documento maestro):
 * esta página es 100% client component, no hay nada server-side acá —
 * el build estático la sirve igual que cualquier otra ruta del sitio.
 */
export default function PublicarPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm text-neutral-500">Cargando…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="mb-2 text-xl font-semibold text-neutral-900">Necesitás una cuenta para publicar</h1>
        <p className="mb-6 text-sm text-neutral-600">
          Iniciá sesión con tu email — es gratis y solo te va a pedir el link que te mandamos por
          correo, sin contraseña.
        </p>
        <Link
          href="/ingresar"
          className="inline-block rounded-md bg-auto-accent px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-auto-accent-strong"
        >
          Ingresar
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 py-8 sm:py-12">
      <h1 className="mb-6 text-center text-2xl font-bold text-neutral-900">Publicá tu vehículo</h1>
      <PublishWizard userId={user.id} />
    </div>
  )
}
