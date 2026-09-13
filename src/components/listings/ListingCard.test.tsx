// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { ListingCard, type ListingCardData } from './ListingCard'

/**
 * REGRESIÓN — mismo criterio que `EntityCard.test.tsx` (incidente del
 * 09/09/2026, Error 1027 de Cloudflare por `<Link>` sin `prefetch={false}`
 * dentro de una card repetida en grilla). `ListingCard` se renderiza
 * dentro de un `.map()` en `/listings` (Fase 5) — mismo patrón de riesgo,
 * así que se le suma este mismo test de regresión desde el primer commit,
 * tal como sugiere el README ("Si agregás una card nueva en cualquier
 * otro componente... considerá agregar un test igual al de
 * EntityCard.test.tsx para esa card").
 */
vi.mock('next/link', () => ({
  default: ({
    href,
    prefetch,
    children,
    ...rest
  }: {
    href: string
    prefetch?: boolean
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} data-prefetch={String(prefetch)} {...rest}>
      {children}
    </a>
  ),
}))

function makeListing(overrides: Partial<ListingCardData> = {}): ListingCardData {
  return {
    id: 'listing-1',
    title: 'Toyota Hilux SRX 2024',
    brand: 'Toyota',
    model: 'Hilux',
    year: 2024,
    mileageKm: 35000,
    priceAmount: 42000,
    priceCurrency: 'USD',
    priceType: 'fixed',
    coverUrl: null,
    conditionLabel: 'Usado',
    conditionSeverity: 'normal',
    locationLabel: 'Concepción del Uruguay, Entre Ríos',
    ...overrides,
  }
}

afterEach(() => {
  cleanup()
})

describe('ListingCard — regresión prefetch (Error 1027 / amplificación de invocations)', () => {
  it('el Link principal lleva prefetch={false}', () => {
    const { container } = render(<ListingCard listing={makeListing()} />)
    const links = container.querySelectorAll('a[href]')
    expect(links.length).toBeGreaterThan(0)
    links.forEach((link) => {
      expect(link.getAttribute('data-prefetch')).toBe('false')
    })
  })

  it('sin foto de portada, sigue llevando prefetch={false} (no cambia la estructura del Link)', () => {
    const { container } = render(
      <ListingCard listing={makeListing({ coverUrl: null, priceType: 'on_request' })} />
    )
    const links = container.querySelectorAll('a[href]')
    expect(links.length).toBeGreaterThan(0)
    links.forEach((link) => {
      expect(link.getAttribute('data-prefetch')).toBe('false')
    })
  })
})
