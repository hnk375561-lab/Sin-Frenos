import Link from 'next/link'
import { HeroSidePanel } from '@/components/home/HeroSidePanel'
import { EditorialVehicleHero, type EditorialVehicle } from '@/components/home/EditorialVehicleHero'

type ArchiveHeroCategoryChip = {
  label: string
  count: number
  href: string
}

type ArchiveHeroProps = {
  vehicleCount: number
  evidenceCoveragePct: number | null
  searchExamples?: string[]
  categoryChips?: ArchiveHeroCategoryChip[]
  vehicles: EditorialVehicle[]
}

/**
 * The homepage opens on an image-led archive rather than a generic marketplace
 * panel. The marketplace remains a first-class action immediately after the
 * cinematic stage, while the technical catalog stays inside the hero search.
 */
export function ArchiveHero({
  vehicleCount,
  evidenceCoveragePct,
  searchExamples,
  categoryChips,
  vehicles,
}: ArchiveHeroProps) {
  return (
    <>
      <EditorialVehicleHero
        vehicleCount={vehicleCount}
        evidenceCoveragePct={evidenceCoveragePct}
        searchExamples={searchExamples}
        categoryChips={categoryChips}
        vehicles={vehicles}
      />

      <section className="border-b border-edge bg-[#f4f4f5] py-12 sm:py-16" aria-labelledby="marketplace-strip-heading">
        <div className="container-max grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center lg:gap-16">
          <div className="max-w-md">
            <p className="eyebrow text-auto-accent">Marketplace</p>
            <h2 id="marketplace-strip-heading" className="mt-3 max-w-[12ch] text-3xl font-semibold leading-[0.98] tracking-[-0.05em] text-strong sm:text-5xl">
              Tu próximo vehículo puede empezar acá.
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-body">
              Publicaciones reales, contacto directo y una forma más simple de decidir qué comprar o vender.
            </p>
            <Link href="/publicar" prefetch={false} className="link-underline mt-6 inline-flex text-sm font-semibold text-auto-accent">
              Publicar un vehículo <span className="ml-2" aria-hidden="true">↗</span>
            </Link>
          </div>
          <HeroSidePanel />
        </div>
      </section>
    </>
  )
}
