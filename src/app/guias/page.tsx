import Link from 'next/link'
import type { Metadata } from 'next'
import { EntityType } from '@/types'
import { getEntitiesByType } from '@/lib/entities'
import { getEntityImageMap } from '@/lib/media'
import { EntityCard } from '@/components/entities/EntityCard'
import { Reveal } from '@/components/ui/Reveal'

export const metadata: Metadata = { title: 'Guías | Sin Frenos', description: 'Guías editoriales para comprar, vender y entender vehículos.' }

export default async function GuidesPage() {
  const guides = await getEntitiesByType(EntityType.GUIDE)
  const imageBySlug = getEntityImageMap(guides)
  return <main className="min-h-screen border-b border-edge py-12 sm:py-16"><div className="container-max"><Reveal direction="chapter"><nav className="mb-8 text-sm text-muted" aria-label="Breadcrumb"><Link href="/" className="link-underline hover:text-auto-accent">Inicio</Link><span className="mx-2">/</span><span className="text-strong">Guías</span></nav><p className="eyebrow text-auto-accent">Archivo editorial · {guides.length} guías</p><h1 className="mt-3 max-w-4xl text-5xl font-bold tracking-tight text-strong sm:text-7xl">Contexto para decidir mejor.</h1><p className="mt-5 max-w-2xl text-lg leading-relaxed text-body">Lecturas conectadas con el catálogo: criterios de compra, contexto técnico y pasos concretos para avanzar.</p></Reveal><div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{guides.map((guide, index) => <Reveal key={guide.slug} index={index}><EntityCard entity={guide} image={imageBySlug[`guias/${guide.slug}`]} /></Reveal>)}</div></div></main>
}
