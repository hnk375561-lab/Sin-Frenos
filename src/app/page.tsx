import Link from 'next/link'
import type { Metadata } from 'next'
import { EntityType, type Vehicle } from '@/types'
import { generateHomepageMetadata, generateWebsiteJsonLd, serializeJsonLd } from '@/lib/seo'
import { getEntitiesByType, getEntityCountsByType, getFeaturedEntities } from '@/lib/entities'
import { getEntityImageMap } from '@/lib/media'
import { getBidirectionalRelationCount } from '@/lib/relations'
import { getVehicleCategory, computeCategoryOptions } from '@/lib/vehicle-category'
import { QuickSearchForm } from '@/components/home/QuickSearchForm'
import { HomeDiscovery } from '@/components/home/HomeDiscovery'
import { EntityCard } from '@/components/entities/EntityCard'
import { Reveal } from '@/components/ui/Reveal'

export async function generateMetadata(): Promise<Metadata> {
  return generateHomepageMetadata()
}

function formatNumber(value: number): string {
  return value.toLocaleString('es-AR')
}

export default async function Home() {
  const [vehiclesRaw, counts, featuredRaw] = await Promise.all([
    getEntitiesByType(EntityType.VEHICLE),
    getEntityCountsByType(),
    getFeaturedEntities(8, EntityType.VEHICLE),
  ])
  const vehicles = vehiclesRaw as Vehicle[]
  const featured = featuredRaw as Vehicle[]
  const imageBySlug = getEntityImageMap(vehicles)
  const categories = computeCategoryOptions(vehicles, 2).slice(0, 6)
  const relationCount = await Promise.all(vehicles.map((vehicle) => getBidirectionalRelationCount(vehicle)))
  const totalRelations = relationCount.reduce((sum, value) => sum + value, 0) / 2
  const featuredVehicle = featured[0] ?? vehicles.find((vehicle) => vehicle.featured) ?? vehicles[0]
  const featuredImage = featuredVehicle ? imageBySlug[`vehiculos/${featuredVehicle.slug}`] : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(generateWebsiteJsonLd()) }} />
      <main className="min-h-screen bg-surface-page">
        <section className="relative overflow-hidden border-b border-edge bg-inverse py-20 text-white sm:py-28">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:56px_56px]" aria-hidden="true" />
          <div className="container-max relative">
            <div className="grid gap-14 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
              <div>
                <p className="eyebrow text-orange-300">Archivo automotor · datos que se pueden consultar</p>
                <h1 className="mt-6 max-w-4xl font-display text-5xl font-bold leading-[.94] tracking-[-.06em] sm:text-7xl lg:text-[6.8rem]">El mundo de los vehículos, <span className="text-orange-300">para explorar.</span></h1>
                <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/70">Fichas técnicas, relaciones reales y comparaciones para entender qué hay detrás de cada modelo.</p>
                <div className="mt-8 max-w-2xl"><QuickSearchForm examples={['Toyota Corolla', 'SUV compacto', 'motos trail', 'vehículos de más de 300 hp']} /></div>
                <div className="mt-6 flex flex-wrap gap-3 text-sm"><Link href="/explorar" className="rounded-full bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-700">Empezar a explorar →</Link><Link href="/comparar" className="rounded-full border border-white/30 px-5 py-3 font-semibold text-white transition hover:border-white">Comparar vehículos</Link></div>
              </div>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/10">
                {[
                  [formatNumber(counts[EntityType.VEHICLE]), 'vehículos documentados', '/vehiculos'],
                  [formatNumber(counts[EntityType.MANUFACTURER]), 'fabricantes', '/fabricantes'],
                  [formatNumber(Math.round(totalRelations)), 'relaciones reales', '/explorar'],
                  [formatNumber(counts[EntityType.GUIDE]), 'guías para seguir', '/guias'],
                ].map(([value, label, href]) => <Link key={label} href={href} className="bg-white/[.06] p-5 transition hover:bg-white/[.12]"><span className="block font-mono text-3xl font-bold text-orange-300 sm:text-4xl">{value}</span><span className="mt-2 block text-xs uppercase tracking-[.12em] text-white/60">{label}</span></Link>)}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-edge bg-surface-card py-12 sm:py-16" aria-labelledby="categories-heading">
          <div className="container-max">
            <Reveal direction="chapter"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow text-auto-accent">01 · Elegí un punto de entrada</p><h2 id="categories-heading" className="mt-3 text-3xl font-bold text-strong sm:text-5xl">No todos buscan lo mismo.</h2></div><Link href="/categorias" className="link-underline font-semibold text-auto-accent">Ver todas las categorías →</Link></div></Reveal>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map(({ group, count }, index) => <Reveal key={group} index={index}><Link href={`/categorias/${group.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`} className="group flex items-center justify-between rounded-xl border border-edge bg-surface-page p-5 transition hover:-translate-y-1 hover:border-auto-accent"><span><span className="block text-lg font-semibold text-strong">{group}</span><span className="mt-1 block text-sm text-muted">{count} modelos con esta categoría</span></span><span className="font-mono text-xl text-auto-accent transition-transform group-hover:translate-x-1">↗</span></Link></Reveal>)}
            </div>
          </div>
        </section>

        <HomeDiscovery vehicles={vehicles} imageBySlug={imageBySlug} />

        {featuredVehicle && <section className="border-b border-edge py-16 sm:py-24" aria-labelledby="featured-heading"><div className="container-max"><Reveal direction="chapter"><p className="eyebrow text-auto-accent">04 · Una ficha para mirar en profundidad</p><div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center"><div className="overflow-hidden rounded-2xl border border-edge bg-surface-card">{featuredImage?.src ? <img src={featuredImage.src} alt={featuredVehicle.title} className="aspect-[16/10] w-full object-cover transition-transform duration-700 hover:scale-[1.03]" /> : <div className="flex aspect-[16/10] items-center justify-center text-muted">Imagen no documentada</div>}</div><div><h2 id="featured-heading" className="text-4xl font-bold tracking-tight text-strong sm:text-6xl">{featuredVehicle.title}</h2><p className="mt-4 text-lg leading-relaxed text-body">{featuredVehicle.description}</p><div className="mt-6 grid grid-cols-2 gap-3">{[["Fabricante", featuredVehicle.manufacturer], ["Categoría", getVehicleCategory(featuredVehicle.class)], ["Potencia", featuredVehicle.power], ["Año", String(featuredVehicle.anoLanzamiento ?? 'No documentado')]].map(([label, value]) => <div key={label} className="rounded-lg border border-edge bg-surface-card p-3"><span className="block font-mono text-[10px] uppercase tracking-wider text-muted">{label}</span><span className="mt-1 block text-sm font-semibold text-strong">{value || 'No documentado'}</span></div>)}</div><Link href={`/vehiculos/${featuredVehicle.slug}`} className="mt-7 inline-flex rounded-full bg-auto-accent px-5 py-3 font-semibold text-white hover:bg-auto-accent-strong">Abrir ficha completa →</Link></div></div></Reveal></div></section>}

        <section className="border-b border-edge bg-surface-card py-16" aria-labelledby="featured-grid-heading"><div className="container-max"><div className="flex items-end justify-between gap-5"><div><p className="eyebrow text-auto-accent">05 · El archivo sigue creciendo</p><h2 id="featured-grid-heading" className="mt-3 text-3xl font-bold text-strong">Más vehículos para descubrir.</h2></div><Link href="/vehiculos" className="link-underline font-semibold text-auto-accent">Todo el catálogo →</Link></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{featured.slice(0, 4).map((vehicle, index) => <Reveal key={vehicle.slug} index={index}><EntityCard entity={vehicle} image={imageBySlug[`vehiculos/${vehicle.slug}`]} priority={index < 2} /></Reveal>)}</div></div></section>
      </main>
    </>
  )
}
