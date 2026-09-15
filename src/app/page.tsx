import Link from 'next/link'
import type { Metadata } from 'next'
import { generateHomepageMetadata, generateWebsiteJsonLd, serializeJsonLd } from '@/lib/seo'
import { QuickSearchForm } from '@/components/home/QuickSearchForm'
import { MarketplaceHeroStrip } from '@/components/home/MarketplaceHeroStrip'
import { Suspense } from 'react'
import { FinancingCalculator } from '@/components/ui/FinancingCalculator'
import { FinancingCalculatorSkeleton } from '@/components/ui/loading'

export async function generateMetadata(): Promise<Metadata> {
  return generateHomepageMetadata()
}

const MARKETPLACE_CATEGORIES = [
  { label: 'Autos', value: 'autos', description: 'Sedanes, hatchbacks y deportivos' },
  { label: 'Motos', value: 'motos', description: 'Urbanas, clásicas y de aventura' },
  { label: 'Camionetas', value: 'camionetas', description: 'Pick-ups y SUVs para todos los días' },
  { label: 'Utilitarios', value: 'utilitarios', description: 'Trabajo, carga y movilidad profesional' },
]

function CategoryCards() {
  return (
    <section className="marketplace-home-section bg-white" aria-labelledby="marketplace-categories-heading">
      <div className="marketplace-home-container">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="marketplace-eyebrow text-[#0b7a75]">Buscá por categoría</p>
            <h2 id="marketplace-categories-heading" className="marketplace-section-title">Encontrá el vehículo para tu próximo paso.</h2>
          </div>
          <Link href="/listings" className="marketplace-text-link">Ver todas las publicaciones <span aria-hidden="true">→</span></Link>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MARKETPLACE_CATEGORIES.map((category) => (
            <Link
              key={category.value}
              href={`/listings?categoria=${category.value}`}
              className="marketplace-category-card group"
            >
              <span className="marketplace-category-icon" aria-hidden="true">
                {category.value === 'motos' ? 'M' : category.value === 'camionetas' ? '4×4' : category.value === 'utilitarios' ? '▣' : 'A'}
              </span>
              <span className="mt-8 block text-xl font-semibold tracking-[-0.03em] text-[#12212a]">{category.label}</span>
              <span className="mt-2 block text-sm leading-relaxed text-[#667780]">{category.description}</span>
              <span className="mt-6 block text-sm font-semibold text-[#0b7a75] transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true">Explorar →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    ['01', 'Buscá', 'Filtrá por tipo, ubicación, condición o presupuesto.'],
    ['02', 'Compará', 'Mirá opciones y hablá directo con quien publica.'],
    ['03', 'Publicá', 'Subí tu vehículo y llegá a quienes ya están buscando.'],
  ]

  return (
    <section className="marketplace-home-section bg-[#f5f8f8]" aria-labelledby="how-heading">
      <div className="marketplace-home-container">
        <div className="max-w-xl">
          <p className="marketplace-eyebrow text-[#0b7a75]">Así funciona</p>
          <h2 id="how-heading" className="marketplace-section-title">Del primer vistazo al contacto, sin vueltas.</h2>
        </div>
        <div className="mt-10 grid gap-8 border-t border-[#dce8e7] pt-8 sm:grid-cols-3">
          {steps.map(([number, title, description]) => (
            <div key={number}>
              <span className="text-sm font-bold tracking-[0.16em] text-[#f05a3c]">{number}</span>
              <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[#12212a]">{title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#667780]">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinancingBlock() {
  return (
    <section className="marketplace-home-section bg-white" aria-labelledby="financing-heading">
      <div className="marketplace-home-container">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="marketplace-eyebrow text-[#0b7a75]">Antes de cerrar</p>
            <h2 id="financing-heading" className="marketplace-section-title">¿Cuánto te queda por mes?</h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[#667780]">Simulá una cuota para ordenar tu búsqueda. Es una referencia inicial: después confirmá las condiciones con tu entidad financiera.</p>
            <Link href="/financiamiento" className="marketplace-text-link mt-6 inline-flex">Ver guía de financiamiento <span aria-hidden="true">→</span></Link>
          </div>
          <div className="rounded-3xl border border-[#dce8e7] bg-[#f5f8f8] p-5 sm:p-8">
            <Suspense fallback={<FinancingCalculatorSkeleton />}>
              <FinancingCalculator />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  )
}

function CatalogExit() {
  return (
    <section className="border-t border-[#dce8e7] bg-[#f5f8f8] py-8" aria-label="Catálogo técnico">
      <div className="marketplace-home-container flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#667780]">¿Buscás especificaciones de un modelo puntual?</p>
        <Link href="/vehiculos" className="marketplace-text-link">Explorar catálogo técnico <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(generateWebsiteJsonLd()) }} />
      <div className="marketplace-home min-h-screen bg-[#f5f8f8]">
        <section className="marketplace-home-hero relative overflow-hidden">
          <div className="marketplace-home-container relative z-10 pb-16 pt-14 sm:pb-24 sm:pt-20 lg:pb-28 lg:pt-24">
            <div className="grid items-end gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
              <div>
                <p className="marketplace-eyebrow text-[#82d4ce]">Marketplace automotor argentino</p>
                <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.96] tracking-[-0.07em] text-white sm:text-7xl lg:text-[6.5rem]">Comprá mejor.<br /><span className="text-[#f47b5d]">Vendé más fácil.</span></h1>
                <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/65">Encontrá autos, motos y camionetas publicados en Argentina. O publicá el tuyo y conectá con personas que ya están buscando.</p>
                <div className="marketplace-home-search mt-8 max-w-2xl">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/55">¿Qué querés encontrar?</p>
                  <QuickSearchForm examples={['Toyota Corolla', 'una camioneta 4x4', 'una moto para ciudad', 'un auto hasta 20 mil dólares']} />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/publicar" prefetch={false} className="marketplace-home-primary-cta">Publicar mi vehículo <span aria-hidden="true">↗</span></Link>
                  <Link href="/listings" className="marketplace-home-secondary-cta">Ver publicaciones</Link>
                </div>
              </div>
              <div className="hidden lg:block" aria-hidden="true">
                <div className="marketplace-hero-stat-card">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#82d4ce]">Una nueva forma de moverte</span>
                  <p className="mt-8 text-4xl font-semibold leading-tight tracking-[-0.05em] text-white">Tu próximo vehículo empieza con una buena búsqueda.</p>
                  <div className="mt-10 flex items-center gap-3 text-sm text-white/55"><span className="h-2 w-2 rounded-full bg-[#f47b5d]" /> Compra, venta y decisión en un solo lugar</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <MarketplaceHeroStrip />
        <CategoryCards />
        <HowItWorks />
        <FinancingBlock />

        <section className="marketplace-home-sell-banner" aria-labelledby="sell-heading">
          <div className="marketplace-home-container text-center">
            <p className="marketplace-eyebrow text-white/70">Tu vehículo puede ser el próximo</p>
            <h2 id="sell-heading" className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-white sm:text-6xl">Publicá hoy. Empezá a recibir consultas.</h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75">Fotos, datos y contacto directo. Sin inventar ofertas: cuando publiques, tu vehículo aparece de verdad.</p>
            <Link href="/publicar" prefetch={false} className="mt-8 inline-flex rounded-full bg-[#12212a] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#1d3540] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#f05a3c]">Ser el primero en publicar <span aria-hidden="true">↗</span></Link>
          </div>
        </section>

        <CatalogExit />
      </div>
    </>
  )
}
