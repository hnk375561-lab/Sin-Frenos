import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Vehicle } from '@/types'
import { EntityType } from '@/types'
import { resolveEntityDisplayImages } from '@/lib/media'
import { getMediaForEntity } from '@/lib/media'
import { ENTITY_IMAGE_CATEGORIES } from '@/lib/images'
import type { VehicleCategory } from '@/lib/vehicle-category'
import type { SimilarVehicle } from '@/lib/vehicle-similar'
import type { Entity } from '@/types'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Reveal } from '@/components/ui/Reveal'
import { SectionBridge } from '@/components/ui/SectionBridge'
import { EvidenceBlock } from '@/components/entities/EvidenceBlock'
import { EntityMetadata } from '@/components/entities/EntityMetadata'
import { RelationsPanel } from '@/components/entities/RelationsPanel'
import { EntityHeaderBackground } from '@/components/entities/EntityHeaderBackground'
import { EntitySectionHeading } from '@/components/entities/EntitySectionHeading'
import { EntityImage } from '@/components/entities/EntityImage'
import { EntityGallery } from '@/components/entities/EntityGallery'
import { EntityContent } from '@/components/entities/EntityContent'
import { EntityNav } from '@/components/entities/EntityNav'
import { MediaCarousel } from '@/components/media/MediaCarousel'
import { SimilarVehiclesPanel } from '@/components/entities/SimilarVehiclesPanel'
import { ModelListingsPanel } from '@/components/listings/ModelListingsPanel'
import { AdUnit } from '@/components/monetization/AdUnit'
import { NativeAdUnit } from '@/components/monetization/NativeAdUnit'
import { MercadoLibreAffiliateButton } from '@/components/monetization/MercadoLibreAffiliateButton'
import { MonetizationCtaGroup } from '@/components/monetization/MonetizationCtaGroup'
import { LeadQuoteForm } from '@/components/monetization/LeadQuoteForm'
import { AccessoriesAffiliateWidget } from '@/components/monetization/AccessoriesAffiliateWidget'
import { SponsoredListingBanner } from '@/components/monetization/SponsoredListingBanner'
import { getSponsorshipForVehicle } from '@/lib/sponsorships'

interface VehicleDetailLayoutProps {
  vehicle: Vehicle
  related: Array<{ entity: Entity; relation: string }>
  similarVehicles: SimilarVehicle[]
  relatedMedia: ReturnType<typeof getMediaForEntity>
  category: VehicleCategory | null
  categoryHref: string | null
}

const STATUS_LABELS = { confirmado: 'Confirmado', rumor: 'Rumor', nuestro: 'Nuestro' } as const

const labelize = (key: string) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (char) => char.toUpperCase())

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null
  if (Array.isArray(value)) return value.join(' · ')
  if (typeof value === 'object') return null
  return String(value)
}

function DataRows({ data }: { data: Record<string, string | number | null | undefined> }) {
  const entries = Object.entries(data).filter(([, value]) => displayValue(value))
  if (!entries.length) return null
  return (
    <dl className="divide-y divide-edge/70">
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-4 py-2.5 text-sm">
          <dt className="text-neutral-500">{labelize(key)}</dt>
          <dd className="font-mono text-right text-[13px] text-ink">{displayValue(value)}</dd>
        </div>
      ))}
    </dl>
  )
}

function TechnicalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardBody>
        <h2 className="mb-3 border-b border-edge pb-2 font-sans text-base font-semibold uppercase tracking-[0.12em] text-ink">
          {title}
        </h2>
        {children}
      </CardBody>
    </Card>
  )
}

export function VehicleDetailLayout({
  vehicle,
  related,
  similarVehicles,
  relatedMedia,
  category,
  categoryHref,
}: VehicleDetailLayoutProps) {
  const statusLabel = STATUS_LABELS[vehicle.status as keyof typeof STATUS_LABELS] || vehicle.status
  const evidence = vehicle.evidence
  const images = ENTITY_IMAGE_CATEGORIES.includes(EntityType.VEHICLE) ? resolveEntityDisplayImages(vehicle) : []
  const sponsorship = getSponsorshipForVehicle(vehicle)
  const hasPerformance = Boolean(vehicle.performance?.speed || vehicle.performance?.acceleration || vehicle.performance?.handling || vehicle.performance?.braking)
  const technicalSections = [
    ['Motor', vehicle.especificacionesMotor],
    ['Transmisión', vehicle.especificacionesTransmision],
    ['Suspensión', vehicle.especificacionesSuspension],
    ['Ruedas', vehicle.especificacionesRuedas],
    ['Dirección', vehicle.especificacionesDireccion],
  ] as const
  const summaryItems = [
    ['Fabricante', vehicle.manufacturer],
    ['Clase', category || vehicle.class],
    ['Generación', vehicle.generacion],
    ['Año de lanzamiento', vehicle.anoLanzamiento],
    ['Producción', vehicle.anoProduccion],
  ].filter(([, value]) => displayValue(value))

  return (
    <>
      <section className="relative overflow-hidden border-b border-edge bg-gradient-to-b from-surface-alt to-surface-page py-8 sm:py-10">
        <EntityHeaderBackground type={EntityType.VEHICLE} evidenceLevel={evidence?.level} />
        <div className="container-max relative">
          <nav className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-neutral-500" aria-label="Breadcrumb">
            <Link href="/" className="link-underline hover:text-auto-accent">Inicio</Link>
            <span aria-hidden="true">/</span>
            <Link href="/vehiculos" className="link-underline hover:text-auto-accent">Vehículos</Link>
            <span aria-hidden="true">/</span>
            <span className="max-w-[60vw] truncate text-ink sm:max-w-none">{vehicle.title}</span>
          </nav>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-auto-accent">{vehicle.manufacturer || 'Fabricante no documentado'} · {category || 'Vehículo'}</p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-sans text-3xl font-bold tracking-tight text-ink sm:text-5xl">{vehicle.title}</h1>
                <Badge variant="status" status={vehicle.status}>{statusLabel}</Badge>
                {vehicle.featured && <Badge variant="tag">Destacado</Badge>}
                {categoryHref && <Link prefetch={false} href={categoryHref} className="rounded-md border border-auto-accent/35 bg-auto-accent/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-auto-accent-strong hover:border-auto-accent">{category}</Link>}
              </div>
              <p className="mt-3 max-w-3xl text-base text-neutral-600 sm:text-lg">{vehicle.description}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link prefetch={false} href={`/comparar/${vehicle.slug}`} className="rounded-md bg-auto-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-auto-darker">Comparar vehículo</Link>
              <Link href="/vehiculos" className="rounded-md border border-edge-strong bg-surface-card px-4 py-2 text-sm font-semibold text-ink hover:border-auto-accent">Volver al catálogo</Link>
            </div>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,.6fr)] lg:items-end">
            <Reveal direction="swell" className="overflow-hidden rounded-2xl border border-edge/70 bg-surface-card shadow-lg">
              <EntityImage entity={vehicle} image={images[0] ?? null} variant="thumbnail" priority className="min-h-[15rem]" />
            </Reveal>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              {[
                ['Potencia', vehicle.power],
                ['Velocidad', vehicle.performance?.speed],
                ['0–100', vehicle.performance?.acceleration],
                ['Peso', vehicle.peso],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-edge/70 bg-surface-card/80 p-3 backdrop-blur-sm">
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-neutral-500">{label}</span>
                  <span className="mt-1 block break-words font-mono text-sm font-semibold text-ink">{displayValue(value) || 'No documentado'}</span>
                </div>
              ))}
            </div>
          </div>
          {vehicle.tags && vehicle.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">{vehicle.tags.map((tag) => <span key={tag}>{tag.replace(/-/g, ' ')}</span>)}</div>}
        </div>
      </section>
      <SectionBridge compact />

      <main className="py-8 sm:py-12">
        <div className="container-max">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-6">
              <section aria-labelledby="key-specs-heading">
                <div className="mb-3 flex items-end justify-between gap-4">
                  <div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-auto-accent">01 · Resumen técnico</p><h2 id="key-specs-heading" className="mt-1 font-sans text-xl font-bold text-ink">Datos clave</h2></div>
                  {evidence && <span className="font-mono text-[11px] text-neutral-500">Confianza: {evidence.level}</span>}
                </div>
                <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-edge bg-surface-card shadow-sm sm:grid-cols-4">
                  {[
                    ['Potencia', vehicle.power],
                    ['Precio', vehicle.price],
                    ['Velocidad máxima', vehicle.performance?.speed],
                    ['Aceleración', vehicle.performance?.acceleration],
                  ].map(([label, value]) => (
                    <div key={label} className="border-b border-edge p-4 last:border-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
                      <p className="mt-2 break-words font-mono text-base font-semibold leading-tight text-ink sm:text-lg">{displayValue(value) || 'No documentado'}</p>
                    </div>
                  ))}
                </div>
              </section>

              {evidence && <section aria-labelledby="evidence-heading" className="rounded-lg border border-auto-accent/30 bg-surface-card p-5 shadow-sm"><div className="mb-3 flex items-center justify-between gap-4"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-auto-accent">02 · Trazabilidad</p><h2 id="evidence-heading" className="mt-1 font-sans text-xl font-bold text-ink">Evidencia de la ficha</h2></div><span className="hidden text-xs text-neutral-500 sm:block">Las limitaciones quedan visibles junto al dato</span></div><EvidenceBlock evidence={evidence} /></section>}

              {(hasPerformance || vehicle.consumo || vehicle.tiempoRecorrido) && <TechnicalSection title="Rendimiento"><DataRows data={{ velocidadMaxima: vehicle.performance?.speed, aceleracion: vehicle.performance?.acceleration, comportamiento: vehicle.performance?.handling, frenado: vehicle.performance?.braking, consumo: vehicle.consumo, tiempoRecorrido: vehicle.tiempoRecorrido }} /></TechnicalSection>}

              <TechnicalSection title="Ficha técnica"><DataRows data={{ tipoMotor: vehicle.tipoMotor, cilindrada: vehicle.cilindrada, potenciaKW: vehicle.potenciaKW, transmision: vehicle.transmision, traccion: vehicle.traccion, dimensiones: vehicle.dimensiones, peso: vehicle.peso, asientos: vehicle.asientos, baul: vehicle.baul || vehicle.maleteroMin, capacidadTanque: vehicle.capacidadTanque, neumaticos: vehicle.neumaticos, generacion: vehicle.generacion }} /></TechnicalSection>
              {technicalSections.map(([title, data]) => data && <TechnicalSection key={title} title={title}><DataRows data={data} /></TechnicalSection>)}

              {(vehicle.safety || vehicle.availability || vehicle.variants?.length || vehicle.equipamiento?.length || vehicle.colores?.length) && <TechnicalSection title="Equipamiento y disponibilidad"><DataRows data={{ seguridadEuroNCAP: vehicle.safety?.euroNCAP, puntajeSeguridad: vehicle.safety?.puntaje, mercados: vehicle.mercados?.join(', '), colores: vehicle.colores?.join(', '), equipamiento: vehicle.equipamiento?.join(', ') }} />{vehicle.availability && <div className="mt-4 grid gap-3 sm:grid-cols-3">{Object.entries(vehicle.availability).map(([region, info]) => info && <div key={region} className="rounded-md border border-edge bg-surface-alt p-3"><p className="font-mono text-[10px] font-semibold uppercase text-neutral-500">{region}</p><p className="mt-1 text-sm text-ink">{info.disponible ? 'Disponible' : 'No documentado'}</p>{info.precioBase && <p className="mt-1 font-mono text-xs text-neutral-600">{info.precioBase}</p>}</div>)}</div>}</TechnicalSection>}

              {vehicle.content && <TechnicalSection title="Contexto editorial"><EntityContent content={vehicle.content} /></TechnicalSection>}
              {related.length > 0 && <Card className="shadow-sm"><CardBody><EntitySectionHeading label="Relacionado" /><RelationsPanel related={related} currentSlug={vehicle.slug} currentType={EntityType.VEHICLE} /></CardBody></Card>}
              {similarVehicles.length > 0 && <Card className="shadow-sm"><CardBody><EntitySectionHeading label="Vehículos similares" /><SimilarVehiclesPanel items={similarVehicles} /></CardBody></Card>}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-6">
              <Card className="shadow-sm"><CardBody><p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-auto-accent">Resumen</p>{images.length > 1 && <EntityGallery images={images} entityTitle={vehicle.title} />}<dl className="divide-y divide-edge">{summaryItems.map(([label, value]) => <div key={label} className="flex justify-between gap-3 py-2 text-xs"><dt className="text-neutral-500">{label}</dt><dd className="text-right font-medium text-ink">{displayValue(value)}</dd></div>)}</dl></CardBody></Card>
              {relatedMedia.length > 0 && <MediaCarousel title="Contenido audiovisual" assets={relatedMedia} />}
              <Card className="shadow-sm"><CardBody><EntityMetadata entity={vehicle} /></CardBody></Card>
              <ModelListingsPanel vehicleModelSlug={vehicle.slug} vehicleName={vehicle.title} />
              {sponsorship && <SponsoredListingBanner sponsorship={sponsorship} vehicleName={vehicle.title} trackingLabel={`vehicle-${vehicle.slug}`} />}
              <AdUnit slotId="8314744878" format="responsive" dataTrackingLabel={`ad-${vehicle.slug}`} />
              <NativeAdUnit dataTrackingLabel={`native-ad-${vehicle.slug}`} />
              <div className="rounded-lg border border-edge bg-surface-card p-4 shadow-sm"><MercadoLibreAffiliateButton vehicleName={vehicle.title} trackingLabel={`vehicle-${vehicle.slug}`} /></div>
              <div className="rounded-lg border border-edge bg-surface-card p-4 shadow-sm"><MonetizationCtaGroup vehicleName={vehicle.title} showFintech showTramites trackingLabelPrefix={`vehicle-${vehicle.slug}`} /></div>
              <AccessoriesAffiliateWidget category={category} vehicleName={vehicle.title} />
              <LeadQuoteForm vehicleName={vehicle.title} trackingLabelPrefix={`vehicle-${vehicle.slug}`} />
              <p className="text-center text-xs text-neutral-500">¿Tenés un vehículo para vender o entregar como parte de pago? <Link href="/vender-tu-auto" className="link-underline text-auto-accent-strong">Contanos acá</Link>.</p>
            </aside>
          </div>
          <Reveal className="mt-10"><EntityNav type={EntityType.VEHICLE} currentSlug={vehicle.slug} /></Reveal>
        </div>
      </main>
    </>
  )
}
