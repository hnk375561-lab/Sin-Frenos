import Link from 'next/link'
import type { Metadata } from 'next'
import { EntityType, type Vehicle } from '@/types'
import { generateHomepageMetadata, generateWebsiteJsonLd, serializeJsonLd } from '@/lib/seo'
import { getEntitiesByType, getEntityCountsByType, getFeaturedEntities } from '@/lib/entities'
import { getEntityImageMap } from '@/lib/media'
import { getVehicleCategory, computeCategoryOptions } from '@/lib/vehicle-category'
import imageLoader from '@/lib/image-loader'
import { HomeDiscovery } from '@/components/home/HomeDiscovery'
import { EntityImage } from '@/components/entities/EntityImage'
import { Reveal } from '@/components/ui/Reveal'
import { ArchiveHero } from '@/components/home/ArchiveHero'
import type { EditorialVehicle } from '@/components/home/EditorialVehicleHero'

export async function generateMetadata(): Promise<Metadata> {
  return generateHomepageMetadata()
}

/**
 * % de fichas del catálogo con al menos una fuente citada (primaria o
 * secundaria) — reconexión del hero marketplace-first (`ArchiveHero.tsx`,
 * ver comentario ahí) a `page.tsx`. No existía antes ninguna función que
 * calculara esto (auditoría del 15/09/2026, prop `evidenceCoveragePct`
 * estaba declarada pero nunca se le pasaba un valor real); se calcula acá
 * en vez de en `src/lib/evidence.ts` porque es una agregación puntual de
 * este componente, no una utilidad de evidencia reutilizable.
 */
function computeEvidenceCoveragePct(vehicles: Vehicle[]): number | null {
  if (vehicles.length === 0) return null
  const withSource = vehicles.filter(
    (vehicle) => !!(vehicle.evidence?.primarySource || vehicle.evidence?.secondarySource)
  ).length
  return Math.round((withSource / vehicles.length) * 100)
}

const HERO_COMPLETENESS_FIELDS = [
  'especificacionesMotor',
  'especificacionesTransmision',
  'especificacionesSuspension',
  'especificacionesRuedas',
  'especificacionesDireccion',
  'performanceData',
  'safety',
  'equipamiento',
  'colores',
  'variants',
] as const

/** Rechazos editoriales revisados sobre las fotografías actuales. */
const HERO_PHOTO_REJECTIONS: Record<string, string> = {
  'nissan-gt-r': 'personas y evento alrededor del vehículo',
  'tesla-model-3': 'concentración con fondo visualmente saturado',
  'alfa-romeo-giulia': 'vehículo policial de flota',
  'toyota-hilux': 'vehículo de bomberos con librea de servicio',
  'aprilia-rsv4': 'número de carrera y encuadre de competición',
}

function heroCompletenessScore(vehicle: Vehicle): number {
  return HERO_COMPLETENESS_FIELDS.reduce((score, field) => {
    const value = (vehicle as Vehicle & Record<string, unknown>)[field]
    if (Array.isArray(value)) return score + (value.length > 0 ? 1 : 0)
    if (value && typeof value === 'object') return score + (Object.keys(value).length > 0 ? 1 : 0)
    return score
  }, 0)
}

function heroUsdPrice(vehicle: Vehicle): number {
  if (vehicle.priceStructured?.currency !== 'USD') return 0
  return vehicle.priceStructured.amount ?? vehicle.priceStructured.max ?? 0
}

function rankHeroCandidates(
  vehicles: Vehicle[],
  group: string,
  imageBySlug: Record<string, { src: string; alt: string } | null>
): Vehicle[] {
  return vehicles
    .filter((vehicle) => getVehicleCategory(vehicle.class) === group && imageBySlug[`vehiculos/${vehicle.slug}`] && !HERO_PHOTO_REJECTIONS[vehicle.slug])
    .sort((a, b) =>
      Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
      heroUsdPrice(b) - heroUsdPrice(a) ||
      heroCompletenessScore(b) - heroCompletenessScore(a) ||
      a.title.localeCompare(b.title, 'es')
    )
}

const PREMIUM_HOME_SLUGS = [
  'ferrari-296-gtb',
  'lamborghini-urus',
  'porsche-911-carrera',
  'aston-martin-db12',
  'mclaren-artura',
  'bmw-m4',
]

function displaySpec(value: unknown, fallback = 'No documentado'): string {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number') return String(value)
  return fallback
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
  const availableCategories = computeCategoryOptions(vehicles, 2)
  const narrativeOrder = ['SUV', 'Deportivo', 'Sedán', 'Pickup', 'Hatchback', 'Moto']
  const categories = [
    ...narrativeOrder
      .map((group) => availableCategories.find((option) => option.group === group))
      .filter((option): option is (typeof availableCategories)[number] => Boolean(option)),
    ...availableCategories.filter((option) => !narrativeOrder.includes(option.group)),
  ].slice(0, 6)
  const featuredVehicle = featured[0] ?? vehicles.find((vehicle) => vehicle.featured) ?? vehicles[0]
  const featuredImage = featuredVehicle ? imageBySlug[`vehiculos/${featuredVehicle.slug}`] : null
  const premiumVehicles = PREMIUM_HOME_SLUGS
    .map((slug) => vehicles.find((vehicle) => vehicle.slug === slug))
    .filter((vehicle): vehicle is Vehicle => Boolean(vehicle))
    .filter((vehicle) => Boolean(imageBySlug[`vehiculos/${vehicle.slug}`]?.src))
    .slice(0, 4)
  const evidenceCoveragePct = computeEvidenceCoveragePct(vehicles)
  const cinematicVehicles: EditorialVehicle[] = categories
    .filter(({ group }) => group !== 'Otros')
    .flatMap(({ group }) => {
      const candidates = rankHeroCandidates(vehicles, group, imageBySlug)
      const vehicle = candidates[0]
      const image = vehicle ? imageBySlug[`vehiculos/${vehicle.slug}`] : null
      if (!vehicle || !image?.src) return []
      return [{
        slug: vehicle.slug,
        title: vehicle.title,
        manufacturer: vehicle.manufacturer ?? '',
        category: String(group),
        imageSrc: imageLoader({ src: image.src, width: 1024 }),
        imageAlt: image.alt,
      }]
    })
    .slice(0, 6)
  const heroCategoryChips = categories.slice(0, 4).map(({ group, count }) => ({
    label: group,
    count,
    href: `/categorias/${group.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`,
  }))

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(generateWebsiteJsonLd()) }} />
      <main className="min-h-screen bg-surface-page">
        {/* Reconexión (15/09/2026, auditoría de monetización): `ArchiveHero`
            + `HeroSidePanel` estaban completos en el repo desde el commit
            `50f6383` pero `page.tsx` nunca los importó — dos heroes
            compitiendo sin usar, ver hallazgo de la auditoría. Este
            reemplaza al hero catalog-first anterior (removido íntegro,
            no comentado, para no dejar un tercer bloque muerto en el
            archivo) por la versión marketplace-first que el propio código
            ya documentaba como decisión tomada. `evidenceCoveragePct` no
            tenía ninguna función que lo calculara; se agrega
            `computeEvidenceCoveragePct` arriba para eso. */}
        <ArchiveHero
          vehicleCount={counts[EntityType.VEHICLE]}
          evidenceCoveragePct={evidenceCoveragePct}
          searchExamples={vehicles.slice(0, 4).map((vehicle) => vehicle.title)}
          categoryChips={heroCategoryChips}
          vehicles={cinematicVehicles}
        />

        <section className="border-b border-edge bg-surface-card py-12 sm:py-16" aria-labelledby="categories-heading">
          <div className="container-max">
            <Reveal direction="chapter"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow text-auto-accent">01 · Elegí un punto de entrada</p><h2 id="categories-heading" className="mt-3 text-3xl font-bold text-strong sm:text-5xl">No todos buscan lo mismo.</h2></div><Link href="/categorias" className="link-underline font-semibold text-auto-accent">Ver todas las categorías →</Link></div></Reveal>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map(({ group, count }, index) => <Reveal key={group} index={index}><Link href={`/categorias/${group.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`} className="group flex items-center justify-between rounded-xl border border-edge bg-surface-page p-5 transition hover:-translate-y-1 hover:border-auto-accent"><span><span className="block text-lg font-semibold text-strong">{group}</span><span className="mt-1 block text-sm text-muted">{count} modelos con esta categoría</span></span><span className="font-mono text-xl text-auto-accent transition-transform group-hover:translate-x-1">↗</span></Link></Reveal>)}
            </div>
          </div>
        </section>

        <HomeDiscovery vehicles={vehicles} imageBySlug={imageBySlug} />

        {featuredVehicle && <section className="border-b border-edge py-16 sm:py-24" aria-labelledby="featured-heading"><div className="container-max"><Reveal direction="chapter"><p className="eyebrow text-auto-accent">04 · Una ficha para mirar en profundidad</p><p className="mt-3 max-w-2xl text-body">Datos de desempeño, autonomía, propulsión y dimensiones en una sola lectura. La imagen y los datos se resuelven desde la misma ficha editorial.</p><div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-start"><div className="overflow-hidden rounded-2xl border border-edge bg-surface-card"><EntityImage entity={featuredVehicle} image={featuredImage} variant="portrait" priority /></div><div><h2 id="featured-heading" className="text-4xl font-bold tracking-tight text-strong sm:text-6xl">{featuredVehicle.title}</h2><p className="mt-4 text-lg leading-relaxed text-body">{featuredVehicle.description}</p><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{[["Fabricante", featuredVehicle.manufacturer], ["Categoría", getVehicleCategory(featuredVehicle.class)], ["Potencia", featuredVehicle.power], ["0–100 km/h", featuredVehicle.performance?.acceleration], ["Velocidad máx.", featuredVehicle.performance?.speed], ["Autonomía / consumo", featuredVehicle.consumo], ["Transmisión", featuredVehicle.transmision], ["Dimensiones", featuredVehicle.dimensiones], ["Año", String(featuredVehicle.anoLanzamiento ?? 'No documentado')]].map(([label, value]) => <div key={label} className="rounded-lg border border-edge bg-surface-card p-3"><span className="block font-mono text-[10px] uppercase tracking-wider text-muted">{label}</span><span className="mt-1 block text-sm font-semibold text-strong">{displaySpec(value)}</span></div>)}</div><Link href={`/vehiculos/${featuredVehicle.slug}`} className="mt-7 inline-flex rounded-full bg-auto-accent px-5 py-3 font-semibold text-white transition-[transform,background-color] duration-200 hover:bg-auto-accent-strong hover:-translate-y-0.5 active:scale-[.98]">Abrir ficha completa →</Link></div></div></Reveal></div></section>}

        <section className="border-b border-edge bg-surface-card py-16 sm:py-20" aria-labelledby="featured-grid-heading"><div className="container-max"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow text-auto-accent">05 · Curaduría premium</p><h2 id="featured-grid-heading" className="mt-3 text-3xl font-bold text-strong sm:text-5xl">Potencia, diseño y carácter.</h2><p className="mt-3 max-w-2xl text-body">Una selección de modelos premium con fotografía local verificada y datos técnicos para comparar sin ruido.</p></div><Link href="/vehiculos" className="link-underline font-semibold text-auto-accent">Todo el catálogo →</Link></div><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{premiumVehicles.map((vehicle, index) => <Reveal key={vehicle.slug} index={index}><article className="group overflow-hidden rounded-2xl border border-edge bg-surface-page"><Link href={`/vehiculos/${vehicle.slug}`} className="block"><EntityImage entity={vehicle} image={imageBySlug[`vehiculos/${vehicle.slug}`]} variant="thumbnail" priority={index < 2} /><div className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-auto-accent">{vehicle.manufacturer}</p><h3 className="mt-1 text-xl font-bold text-strong">{vehicle.title}</h3></div><span className="text-lg text-auto-accent transition-transform duration-200 group-hover:translate-x-1">↗</span></div><p className="mt-2 text-sm font-semibold text-body">{displaySpec(vehicle.price)}</p><dl className="mt-4 grid grid-cols-2 gap-2 border-t border-edge pt-3">{[["Potencia", vehicle.power], ["0–100", vehicle.performance?.acceleration], ["Máxima", vehicle.performance?.speed], ["Caja", vehicle.transmision]].map(([label, value]) => <div key={label}><dt className="font-mono text-[9px] uppercase tracking-wider text-muted">{label}</dt><dd className="mt-1 line-clamp-2 text-xs font-medium text-strong">{displaySpec(value)}</dd></div>)}</dl></div></Link></article></Reveal>)}</div></div></section>
      </main>
    </>
  )
}
