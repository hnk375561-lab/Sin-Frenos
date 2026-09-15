import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { EntityType } from '@/types'
import { getEntitiesByType } from '@/lib/entities'
import { getEntityImageMap } from '@/lib/media'
import { getBidirectionalRelationCount } from '@/lib/relations'
import { generateListMetadata } from '@/lib/seo'
import { EntityListExplorer } from '@/components/entities/EntityListExplorer'
import { Reveal } from '@/components/ui/Reveal'

export async function generateMetadata(): Promise<Metadata> {
  const vehicles = await getEntitiesByType(EntityType.VEHICLE)
  return { ...generateListMetadata(EntityType.VEHICLE, vehicles.length), title: 'Explorar vehículos | Sin Frenos', description: 'Explorá vehículos por potencia, precio, año, categoría y relaciones reales.' }
}

export default async function ExplorePage() {
  const vehicles = await getEntitiesByType(EntityType.VEHICLE)
  const imageBySlug = getEntityImageMap(vehicles)
  const relationEntries = await Promise.all(vehicles.map(async (vehicle) => [vehicle.slug, await getBidirectionalRelationCount(vehicle)] as const))
  const relationCountBySlug = Object.fromEntries(relationEntries)

  return (
    <main className="min-h-screen border-b border-edge py-12 sm:py-16">
      <div className="container-max">
        <Reveal direction="chapter">
          <nav className="mb-8 text-sm text-muted" aria-label="Breadcrumb"><Link href="/" className="link-underline hover:text-auto-accent">Inicio</Link><span className="mx-2">/</span><span className="text-strong">Explorar</span></nav>
          <div className="max-w-3xl"><p className="eyebrow text-auto-accent">Explorador técnico · {vehicles.length} vehículos</p><h1 className="mt-3 text-5xl font-bold tracking-tight text-strong sm:text-7xl">Encontrá algo que todavía no estabas buscando.</h1><p className="mt-5 max-w-2xl text-lg leading-relaxed text-body">Filtrá por categorías confiables, potencia, precio, año o conexiones declaradas. Los vehículos sin dato para el eje elegido no se presentan como si lo tuvieran.</p></div>
        </Reveal>
        <div className="mt-10"><Suspense fallback={<div className="min-h-64 rounded-xl border border-edge bg-surface-card" aria-label="Cargando explorador" />}><EntityListExplorer type={EntityType.VEHICLE} entities={vehicles} typeLabel="Vehículos" imageBySlug={imageBySlug} relationCountBySlug={relationCountBySlug} /></Suspense></div>
      </div>
    </main>
  )
}
