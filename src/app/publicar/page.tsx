'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { PublishWizard } from '@/components/listings/publicar/PublishWizard'

export default function PublicarPage() {
  const { user, loading } = useAuth()
  if (loading) {
    return <main className="marketplace-auth-page"><div className="marketplace-auth-card"><div className="marketplace-auth-status"><div className="marketplace-auth-spinner" aria-hidden="true" /><h1>Preparando tu publicación</h1><p>Estamos dejando todo listo para que puedas empezar.</p></div></div></main>
  }
  if (!user) {
    return <main className="marketplace-auth-page"><div className="marketplace-auth-card"><p className="marketplace-auth-kicker">Convertite en vendedor</p><h1 className="marketplace-auth-heading">Tu próximo comprador puede estar buscando ahora.</h1><p className="mt-4 text-sm leading-relaxed text-[#A1A1AA]">Publicar es gratis. Vas a cargar fotos, datos y contacto directo en ocho pasos simples. Sin contraseñas: entrá con un link seguro por email.</p><Link href="/ingresar" className="marketplace-auth-primary mt-7">Ingresar para publicar <span aria-hidden="true">↗</span></Link></div></main>
  }
  return <main className="min-h-[75vh] bg-[#F4F4F5] px-4 py-8 sm:py-12"><div className="mx-auto w-full max-w-2xl"><div className="mb-6"><p className="marketplace-eyebrow text-[#C2410C]">Publicá en Sin Frenos</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-.06em] text-[#09090B]">Mostrá tu vehículo. Recibí consultas.</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-[#A1A1AA]">Te vamos a acompañar paso a paso. Podés volver atrás y editar todo antes de publicar.</p></div><PublishWizard userId={user.id} /></div></main>
}
