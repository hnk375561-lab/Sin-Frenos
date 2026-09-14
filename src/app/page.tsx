import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { EntityType, type Vehicle } from '@/types'
import { getEntitiesByType, getFeaturedEntities } from '@/lib/entities'
import { resolveEntityDisplayImage } from '@/lib/media'
import { generateHomepageMetadata, generateWebsiteJsonLd, serializeJsonLd } from '@/lib/seo'
import { computeCategoryOptions, categoryToSlug } from '@/lib/vehicle-category'
import { parsePowerHp } from '@/lib/vehicle-power'
import { QuickSearchForm } from '@/components/home/QuickSearchForm'
import { CommercialVehicleCard } from '@/components/home/CommercialVehicleCard'
import { FinancingCalculator } from '@/components/ui/FinancingCalculator'
import { FinancingCalculatorSkeleton } from '@/components/ui/loading'

export async function generateMetadata(): Promise<Metadata> {
  return generateHomepageMetadata()
}

const HERO_VEHICLE_LIMIT = 4
const FEATURED_VEHICLE_LIMIT = 8

function formatCount(value: number) {
  return new Intl.NumberFormat('es-AR').format(value)
}

function splitName(vehicle: Vehicle) {
  const manufacturer = vehicle.manufacturer?.trim() ?? ''
  const title = vehicle.title.trim()
  if (manufacturer && title.toLowerCase().startsWith(manufacturer.toLowerCase())) {
    const model = title.slice(manufacturer.length).trim()
    if (model) return { manufacturer, model }
  }
  return { manufacturer, model: title }
}

function vehiclePrice(vehicle: Vehicle) {
  return vehicle.price?.split('(')[0].trim() || 'Consultar ficha'
}

function HeroShowcase({ vehicles }: { vehicles: Vehicle[] }) {
  const hero = vehicles[0]
  if (!hero) {
    return (
      <div className="marketplace-hero-empty flex min-h-[28rem] items-center justify-center rounded-[1.75rem] border border-white/10 p-8 text-center">
        <div>
          <p className="text-sm font-semibold text-white">El catálogo está creciendo</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/55">Explorá las publicaciones o sé el primero en sumar un vehículo.</p>
        </div>
      </div>
    )
  }

  const { manufacturer, model } = splitName(hero)
  const image = resolveEntityDisplayImage(hero)
  const power = parsePowerHp(hero)

  return (
    <div className="space-y-3">
      <Link
        href={`/vehiculos/${hero.slug}`}
        prefetch={false}
        className="marketplace-hero-showcase group relative block min-h-[28rem] overflow-hidden rounded-[1.75rem] outline-none focus-visible:ring-2 focus-visible:ring-[#ff6542] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10171c] sm:min-h-[34rem]"
      >
        {image ? (
          <Image
            src={image.src}
            alt={image.alt || hero.title}
            fill
            priority
            sizes="(min-width: 1024px) 56vw, 100vw"
            quality={92}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_50%_35%,#40515a_0,#10171c_65%)]">
            <span className="text-sm text-white/40">Imagen en preparación</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071014] via-[#071014]/20 to-transparent" />
        <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/15 bg-[#10171c]/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff8b6d]" /> Selección editorial
        </div>
        <div className="absolute inset-x-5 bottom-5 sm:inset-x-7 sm:bottom-7">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">{manufacturer || 'Sin marca'}</p>
          <h2 className="mt-2 max-w-xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl">{model}</h2>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/70">
            {hero.class && <span>{hero.class}</span>}
            {power !== null && <span>{power} HP</span>}
            <span className="text-[#ff9b82]">{vehiclePrice(hero)}</span>
          </div>
        </div>
      </Link>
      {vehicles.length > 1 && (
        <div className="grid grid-cols-3 gap-3">
          {vehicles.slice(1, HERO_VEHICLE_LIMIT).map((vehicle) => {
            const thumb = resolveEntityDisplayImage(vehicle)
            const { model: thumbModel } = splitName(vehicle)
            return (
              <Link
                key={vehicle.slug}
                href={`/vehiculos/${vehicle.slug}`}
                prefetch={false}
                className="group relative aspect-[1.35] overflow-hidden rounded-xl border border-white/10 bg-white/5 outline-none focus-visible:ring-2 focus-visible:ring-[#ff6542]"
              >
                {thumb ? (
                  <Image
                    src={thumb.src}
                    alt={thumb.alt || vehicle.title}
                    fill
                    sizes="(min-width: 1024px) 18vw, 30vw"
                    quality={75}
                    className="object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100 motion-reduce:transition-none"
                  />
                ) : (
                  <div className="h-full bg-white/5" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#071014]/90 to-transparent" />
                <span className="absolute inset-x-3 bottom-2 line-clamp-1 text-xs font-medium text-white/85">{thumbModel}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CategoryRail({ vehicles }: { vehicles: Vehicle[] }) {
  const categories = computeCategoryOptions(vehicles, 2).slice(0, 8)
  return (
    <section className="border-b border-[#dde4e8] bg-white py-10 sm:py-14" aria-labelledby="category-heading">
      <div className="container-max">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="marketplace-eyebrow text-[#e35e3d]">Explorá por tipo</p>
            <h2 id="category-heading" className="mt-2 max-w-xl text-3xl font-semibold tracking-[-0.04em] text-[#13202a] sm:text-4xl">Encontrá el vehículo que encaja con tu vida.</h2>
          </div>
          <Link href="/categorias" className="marketplace-text-link">Ver todas las categorías <span aria-hidden="true">→</span></Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map(({ group, count }) => (
            <Link key={group} href={`/categorias/${categoryToSlug(group)}`} className="group rounded-2xl border border-[#e4eaed] bg-[#f6f8f9] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#ff8b6d] hover:bg-[#fff7f4] motion-reduce:transition-none motion-reduce:hover:transform-none">
              <span className="block text-lg font-semibold tracking-[-0.03em] text-[#13202a]">{group}</span>
              <span className="mt-5 block text-xs font-medium text-[#687781]">{count} {count === 1 ? 'ficha' : 'fichas'}</span>
              <span className="mt-3 block text-sm text-[#e35e3d] transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function DecisionTools({ rankingTitle }: { rankingTitle?: string }) {
  return (
    <section className="border-y border-[#29373f] bg-[#162128] py-14 text-white sm:py-20" aria-labelledby="tools-heading">
      <div className="container-max">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="marketplace-eyebrow text-[#ff9b82]">Decidí con contexto</p>
            <h2 id="tools-heading" className="mt-3 max-w-lg text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Menos vueltas. Más claridad antes de elegir.</h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/60">Compará modelos, entendé los datos y simulá una cuota. La parte técnica está para ayudarte a avanzar, no para frenarte.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/comparar" className="group rounded-2xl border border-white/10 bg-white/[0.045] p-5 transition duration-200 hover:-translate-y-1 hover:border-[#ff8b6d]/70 hover:bg-white/[0.08] motion-reduce:transition-none motion-reduce:hover:transform-none">
              <span className="text-2xl text-[#ff8b6d]">01</span>
              <h3 className="mt-8 text-lg font-semibold text-white">Compará modelos</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">Poné dos o tres fichas lado a lado.</p>
              <span className="mt-6 block text-sm text-white/70 transition-transform group-hover:translate-x-1 motion-reduce:transition-none">Abrir comparador →</span>
            </Link>
            <Link href="/rankings" className="group rounded-2xl border border-white/10 bg-white/[0.045] p-5 transition duration-200 hover:-translate-y-1 hover:border-[#ff8b6d]/70 hover:bg-white/[0.08] motion-reduce:transition-none motion-reduce:hover:transform-none">
              <span className="text-2xl text-[#ff8b6d]">02</span>
              <h3 className="mt-8 text-lg font-semibold text-white">Mirá rankings</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/50">{rankingTitle || 'Ordená por potencia, precio o actualidad.'}</p>
              <span className="mt-6 block text-sm text-white/70 transition-transform group-hover:translate-x-1 motion-reduce:transition-none">Ver rankings →</span>
            </Link>
            <Link href="/financiamiento" className="group rounded-2xl border border-white/10 bg-white/[0.045] p-5 transition duration-200 hover:-translate-y-1 hover:border-[#ff8b6d]/70 hover:bg-white/[0.08] motion-reduce:transition-none motion-reduce:hover:transform-none">
              <span className="text-2xl text-[#ff8b6d]">03</span>
              <h3 className="mt-8 text-lg font-semibold text-white">Simulá tu cuota</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">Probá escenarios sin comprometerte.</p>
              <span className="mt-6 block text-sm text-white/70 transition-transform group-hover:translate-x-1 motion-reduce:transition-none">Calcular ahora →</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function FinancingBlock() {
  return (
    <section className="border-b border-[#dde4e8] bg-[#f4f6f7] py-14 sm:py-20" aria-labelledby="financing-heading">
      <div className="container-max">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="marketplace-eyebrow text-[#e35e3d]">Herramienta útil</p>
            <h2 id="financing-heading" className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#13202a] sm:text-4xl">¿Cuánto te quedaría por mes?</h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[#62717a]">Una primera simulación para ordenar la búsqueda. Después, confirmá condiciones con tu entidad financiera.</p>
            <Link href="/financiamiento" className="marketplace-text-link mt-6 inline-flex">Ver guía de financiamiento <span aria-hidden="true">→</span></Link>
          </div>
          <div className="rounded-3xl border border-[#dce5e9] bg-white p-5 shadow-[0_16px_40px_rgba(24,42,52,0.07)] sm:p-8">
            <Suspense fallback={<FinancingCalculatorSkeleton />}>
              <FinancingCalculator />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  )
}

function HomeFaq() {
  const items = [
    ['¿Qué puedo hacer en Sin Frenos?', 'Podés buscar y comparar vehículos, consultar fichas técnicas con fuentes y, cuando el marketplace tenga publicaciones, contactar a vendedores directamente.'],
    ['¿Puedo publicar cualquier tipo de vehículo?', 'La arquitectura está preparada para autos y motos hoy, y puede crecer hacia camionetas, utilitarios, camiones, maquinaria y clásicos.'],
    ['¿Los datos técnicos están verificados?', 'Cada ficha informa su nivel de evidencia y, cuando existe, la fuente de los datos. Si algo no está confirmado, se muestra como tal.'],
  ]
  return (
    <section className="bg-white py-14 sm:py-20" aria-labelledby="faq-heading">
      <div className="container-narrow">
        <p className="marketplace-eyebrow text-[#e35e3d]">Preguntas frecuentes</p>
        <h2 id="faq-heading" className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#13202a] sm:text-4xl">Todo lo importante, sin letra chica.</h2>
        <div className="mt-8 divide-y divide-[#e3e9ec] border-y border-[#e3e9ec]">
          {items.map(([question, answer]) => (
            <details key={question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold text-[#13202a] outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-[#ff6542] [&::-webkit-details-marker]:hidden">
                {question}
                <span className="text-xl font-normal text-[#e35e3d] transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 max-w-2xl pr-8 text-sm leading-relaxed text-[#62717a]">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export default async function Home() {
  const [allVehiclesRaw, featuredRaw, rankings] = await Promise.all([
    getEntitiesByType(EntityType.VEHICLE),
    getFeaturedEntities(100, EntityType.VEHICLE),
    import('@/lib/rankings').then(({ getAvailableRankings }) => getAvailableRankings()),
  ])

  const allVehicles = allVehiclesRaw as Vehicle[]
  const featured = (featuredRaw as Vehicle[]).length > 0 ? (featuredRaw as Vehicle[]) : allVehicles
  const showcaseVehicles = featured.slice(0, HERO_VEHICLE_LIMIT)
  const featuredVehicles = featured.slice(0, FEATURED_VEHICLE_LIMIT)
  const categoryCount = computeCategoryOptions(allVehicles, 1).length
  const evidenceCoverage = allVehicles.length
    ? Math.round((allVehicles.filter((vehicle) => vehicle.evidence?.level).length / allVehicles.length) * 100)
    : 0
  const rankingTitle = rankings[0]?.def.title

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(generateWebsiteJsonLd()) }} />
      <div className="marketplace-page min-h-screen bg-[#f4f6f7]">
        <section className="marketplace-hero relative overflow-hidden text-white">
          <div className="container-max relative z-10 pb-12 pt-8 sm:pb-20 sm:pt-12 lg:pb-24 lg:pt-16">
            <div className="mb-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 sm:mb-14">
              <span>Marketplace automotor</span>
              <span>Argentina · Comprar, vender, comparar</span>
            </div>
            <div className="grid items-end gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
              <div className="max-w-2xl">
                <p className="marketplace-eyebrow text-[#ff9b82]">Tu próxima decisión empieza acá</p>
                <h1 className="mt-5 max-w-2xl text-5xl font-semibold leading-[0.95] tracking-[-0.065em] text-white sm:text-6xl lg:text-[5.75rem]">Encontrá tu próximo vehículo.<br /><span className="text-[#ff9b82]">O vendé el que ya tenés.</span></h1>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">Explorá publicaciones, compará modelos y entendé los datos antes de moverte. Sin Frenos junta el mercado y la información que necesitás en un solo lugar.</p>
                <div className="marketplace-search-panel mt-8 max-w-xl rounded-2xl p-3 sm:p-4">
                  <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">¿Qué estás buscando?</p>
                  <QuickSearchForm examples={featured.slice(0, 5).map((vehicle) => vehicle.title)} />
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-xs text-white/45">
                    <span>Probá con “SUV”, una marca o un modelo</span>
                    <Link href="/listings" className="text-[#ffb29d] hover:text-white">Ver publicaciones →</Link>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link href="/publicar" prefetch={false} className="marketplace-button marketplace-button-primary">Publicar un vehículo <span aria-hidden="true">↗</span></Link>
                  <Link href="/vehiculos" className="marketplace-button marketplace-button-ghost">Explorar fichas técnicas</Link>
                </div>
              </div>
              <HeroShowcase vehicles={showcaseVehicles} />
            </div>
          </div>
        </section>

        <section className="border-b border-[#dde4e8] bg-white" aria-label="Resumen de Sin Frenos">
          <div className="container-max grid grid-cols-2 divide-x divide-[#e4eaed] sm:grid-cols-4">
            <div className="px-3 py-5 first:pl-0 sm:py-7"><p className="text-2xl font-semibold tracking-[-0.04em] text-[#13202a]">{formatCount(allVehicles.length)}+</p><p className="mt-1 text-xs text-[#71808a]">fichas técnicas</p></div>
            <div className="px-4 py-5 sm:py-7"><p className="text-2xl font-semibold tracking-[-0.04em] text-[#13202a]">{categoryCount}</p><p className="mt-1 text-xs text-[#71808a]">formas de buscar</p></div>
            <div className="px-4 py-5 sm:py-7"><p className="text-2xl font-semibold tracking-[-0.04em] text-[#13202a]">{evidenceCoverage}%</p><p className="mt-1 text-xs text-[#71808a]">con evidencia</p></div>
            <div className="px-4 py-5 last:pr-0 sm:py-7"><p className="text-2xl font-semibold tracking-[-0.04em] text-[#e35e3d]">0%</p><p className="mt-1 text-xs text-[#71808a]">comisión para publicar</p></div>
          </div>
        </section>

        <CategoryRail vehicles={allVehicles} />

        {featuredVehicles.length > 0 && (
          <section className="bg-[#f4f6f7] py-14 sm:py-20" aria-labelledby="featured-heading">
            <div className="container-max">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="marketplace-eyebrow text-[#e35e3d]">Para empezar a mirar</p>
                  <h2 id="featured-heading" className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#13202a] sm:text-4xl">Modelos que vale la pena conocer.</h2>
                </div>
                <Link href="/vehiculos" className="marketplace-text-link">Ver catálogo completo <span aria-hidden="true">→</span></Link>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                {featuredVehicles.map((vehicle, index) => (
                  <CommercialVehicleCard key={vehicle.slug} vehicle={vehicle} image={resolveEntityDisplayImage(vehicle)} priority={index < 2} />
                ))}
              </div>
            </div>
          </section>
        )}

        <DecisionTools rankingTitle={rankingTitle} />
        <FinancingBlock />
        <HomeFaq />

        <section className="bg-[#ff6b47] px-4 py-14 text-white sm:py-20" aria-labelledby="sell-heading">
          <div className="mx-auto max-w-5xl text-center">
            <p className="marketplace-eyebrow text-white/70">Tu vehículo también tiene lugar acá</p>
            <h2 id="sell-heading" className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Publicalo. Que empiece a circular.</h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/80">Armá tu publicación, subí fotos y llegá a personas que ya están buscando. La experiencia está pensada para crecer con vendedores particulares y profesionales.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/publicar" prefetch={false} className="rounded-full bg-[#10171c] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#25343c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10171c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ff6b47]">Publicar mi vehículo <span aria-hidden="true">↗</span></Link>
              <Link href="/vender-tu-auto" className="rounded-full border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#ff6b47]">Quiero vender mi auto</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
