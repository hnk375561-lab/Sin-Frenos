// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EntityType, type Vehicle } from '@/types'
import { VehicleDetailLayout } from './VehicleDetailLayout'

vi.mock('next/link', () => ({
  default: ({ href, prefetch, children, ...rest }: { href: string; prefetch?: boolean; children: ReactNode; [key: string]: unknown }) => (
    <a href={href} data-prefetch={String(prefetch)} {...rest}>{children}</a>
  ),
}))

const { passthrough } = vi.hoisted(() => ({
  passthrough: ({ children }: { children?: unknown }) => children as ReactNode,
}))

vi.mock('@/components/ui/Card', () => ({ Card: passthrough, CardBody: passthrough }))
vi.mock('@/components/ui/Badge', () => ({ Badge: ({ children }: { children?: ReactNode }) => <span>{children}</span> }))
vi.mock('@/components/ui/Reveal', () => ({ Reveal: passthrough }))
vi.mock('@/components/ui/SectionBridge', () => ({ SectionBridge: () => null }))
vi.mock('@/components/entities/EntityHeaderBackground', () => ({ EntityHeaderBackground: () => null }))
vi.mock('@/components/entities/EntityImage', () => ({ EntityImage: () => <div data-testid="entity-image" /> }))
vi.mock('@/components/entities/EntityGallery', () => ({ EntityGallery: () => null }))
vi.mock('@/components/entities/EntityContent', () => ({ EntityContent: () => null }))
vi.mock('@/components/entities/EntityNav', () => ({ EntityNav: () => null }))
vi.mock('@/components/entities/EvidenceBlock', () => ({ EvidenceBlock: () => null }))
vi.mock('@/components/entities/EntityMetadata', () => ({ EntityMetadata: () => null }))
vi.mock('@/components/entities/RelationsPanel', () => ({ RelationsPanel: () => null }))
vi.mock('@/components/entities/EntitySectionHeading', () => ({ EntitySectionHeading: passthrough }))
vi.mock('@/components/entities/SimilarVehiclesPanel', () => ({ SimilarVehiclesPanel: () => null }))
vi.mock('@/components/media/MediaCarousel', () => ({ MediaCarousel: () => null }))
vi.mock('@/components/listings/ModelListingsPanel', () => ({ ModelListingsPanel: () => null }))
vi.mock('@/components/monetization/AdUnit', () => ({ AdUnit: () => null }))
vi.mock('@/components/monetization/NativeAdUnit', () => ({ NativeAdUnit: () => null }))
vi.mock('@/components/monetization/MercadoLibreAffiliateButton', () => ({ MercadoLibreAffiliateButton: () => null }))
vi.mock('@/components/monetization/MonetizationCtaGroup', () => ({ MonetizationCtaGroup: () => null }))
vi.mock('@/components/monetization/LeadQuoteForm', () => ({ LeadQuoteForm: () => null }))
vi.mock('@/components/monetization/AccessoriesAffiliateWidget', () => ({ AccessoriesAffiliateWidget: () => null }))
vi.mock('@/components/monetization/SponsoredListingBanner', () => ({ SponsoredListingBanner: () => null }))

function makeVehicle(): Vehicle {
  return {
    type: EntityType.VEHICLE,
    slug: 'toyota-hilux',
    title: 'Toyota Hilux',
    description: 'Pickup mediana',
    status: 'confirmado',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    manufacturer: 'Toyota',
    class: 'Pickup',
    performance: { speed: '180 km/h', acceleration: '10s' },
    price: 'USD 53.245',
  }
}

describe('VehicleDetailLayout — rutas estáticas de comparación', () => {
  it('genera el href query-param de /comparar y conserva prefetch=false', () => {
    render(
      <VehicleDetailLayout
        vehicle={makeVehicle()}
        related={[]}
        similarVehicles={[]}
        relatedMedia={[]}
        category="Pickup"
        categoryHref="/categorias/pickup"
      />,
    )

    const compareLink = screen.getByRole('link', { name: 'Comparar vehículo' })
    expect(compareLink).toHaveAttribute('href', '/comparar?v=toyota-hilux')
    expect(compareLink).toHaveAttribute('data-prefetch', 'false')
  })
})
