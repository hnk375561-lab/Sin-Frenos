import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ContactButton } from '@/components/listings/ContactButton'
import { FavoriteButton } from '@/components/listings/FavoriteButton'
import { getBuildListing, getBuildListings, type BuildListing } from '@/lib/listings/build-time'
import { SITE_NAME, SITE_URL } from '@/config/site'

export const dynamicParams = false
const EMPTY_BUILD_ID = '__no-listings-at-build__'

type PageProps = { params: Promise<{ id: string }> }

function priceLabel(listing: BuildListing): string {
  if (listing.price_type === 'on_request' || !listing.price_amount) return 'Precio a convenir'
  return `${listing.price_currency ?? 'ARS'} ${listing.price_amount.toLocaleString('es-AR')}`
}

function descriptionFor(listing: BuildListing): string {
  const details = [listing.year ? `Año ${listing.year}` : null, listing.mileage_km != null ? `${listing.mileage_km.toLocaleString('es-AR')} km` : null, listing.categoryName, listing.conditionLabel].filter(Boolean).join(' · ')
  return `${listing.title}${details ? ` — ${details}` : ''}. Contacto directo con el vendedor en ${SITE_NAME}.`
}

function jsonLdFor(listing: BuildListing, url: string, image: string | undefined) {
  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    url,
    availability: 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/UsedCondition',
  }
  if (listing.price_amount) {
    offer.price = listing.price_amount
    offer.priceCurrency = listing.price_currency ?? 'ARS'
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: listing.title,
    brand: listing.brand ? { '@type': 'Brand', name: listing.brand } : undefined,
    model: listing.model ?? undefined,
    vehicleModelDate: listing.year ? String(listing.year) : undefined,
    mileageFromOdometer: listing.mileage_km != null ? { '@type': 'QuantitativeValue', value: listing.mileage_km, unitCode: 'KMT' } : undefined,
    image: image ? [image] : undefined,
    description: listing.description ?? descriptionFor(listing),
    offers: offer,
  }
}

export async function generateStaticParams() {
  const listings = await getBuildListings()
  return listings.length > 0 ? listings.map((listing) => ({ id: listing.id })) : [{ id: EMPTY_BUILD_ID }]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  if (id === EMPTY_BUILD_ID) return { title: `Publicaciones | ${SITE_NAME}`, robots: { index: false, follow: false } }
  const listing = await getBuildListing(id)
  if (!listing) return { title: `Publicación no encontrada | ${SITE_NAME}` }
  const image = listing.media.find((item) => item.is_cover)?.url ?? listing.media[0]?.url
  const url = `${SITE_URL}/listings/${listing.id}`
  const description = descriptionFor(listing)
  return {
    title: `${listing.title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, title: `${listing.title} | ${SITE_NAME}`, description, images: image ? [{ url: image, alt: listing.title }] : undefined },
    twitter: { card: image ? 'summary_large_image' : 'summary', title: `${listing.title} | ${SITE_NAME}`, description, images: image ? [image] : undefined },
  }
}

export default async function StaticListingPage({ params }: PageProps) {
  const { id } = await params
  if (id === EMPTY_BUILD_ID) return <main className="marketplace-listing-page"><div className="marketplace-listing-shell rounded-3xl border border-[#c7dcda] bg-white p-8 text-center"><h1 className="text-2xl font-extrabold text-[#12212a]">No hay publicaciones disponibles en este build</h1><p className="mt-3 text-sm text-[#62717a]">Esta ruta técnica no se incluye en el sitemap y solo existe para que el export estático pueda compilar sin conexión a Supabase.</p><Link href="/listings" className="marketplace-auth-primary mt-6">Explorar publicaciones</Link></div></main>
  const listing = await getBuildListing(id)
  if (!listing) notFound()
  const image = listing.media.find((item) => item.is_cover)?.url ?? listing.media[0]?.url
  const url = `${SITE_URL}/listings/${listing.id}`
  const jsonLd = jsonLdFor(listing, url, image)
  const meta = [listing.year ? String(listing.year) : null, listing.mileage_km != null ? `${listing.mileage_km.toLocaleString('es-AR')} km` : null, listing.categoryName, listing.conditionLabel].filter(Boolean)
  return <main className="marketplace-listing-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><div className="marketplace-listing-shell"><Link href="/listings" className="marketplace-listing-back">← Volver a publicaciones</Link><div className="marketplace-listing-hero"><div><div className="marketplace-listing-gallery"><div className="marketplace-listing-gallery-main">{image ? <img src={image} alt={listing.title} /> : <div className="marketplace-listing-no-photo">Este vehículo todavía no tiene fotos</div>}<div className="absolute right-4 top-4"><FavoriteButton listingId={listing.id} size={21} /></div></div>{listing.media.length > 1 && <div className="grid grid-cols-4 gap-2 p-2">{listing.media.filter((item) => item.url !== image).slice(0, 4).map((item) => <img key={item.id} src={item.url} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />)}</div>}</div></div><div className="marketplace-listing-info"><p className="marketplace-eyebrow text-[#0b7a75]">Publicación real · contacto directo</p><h1>{listing.title}</h1><p className="marketplace-listing-price">{priceLabel(listing)}</p><div className="mt-5 flex flex-wrap gap-2">{meta.map((item) => <span key={item} className="rounded-full bg-[#dff2f0] px-3 py-1.5 text-xs font-bold text-[#0b7a75]">{item}</span>)}</div><div className="marketplace-listing-contact"><ContactButton listingId={listing.id} sellerId={listing.seller_id} listingTitle={listing.title} /></div><p className="mt-3 text-xs leading-relaxed text-[#71858c]">Escribile al vendedor desde Sin Frenos. Tu email y teléfono no se comparten automáticamente.</p></div></div>{listing.description && <section className="marketplace-listing-panel"><h2 className="text-xl font-extrabold text-[#12212a]">Sobre este vehículo</h2><p className="mt-3 max-w-3xl whitespace-pre-line">{listing.description}</p></section>}<section className="marketplace-listing-panel flex flex-wrap gap-3 text-sm font-semibold">{listing.accepts_trade && <span>✓ Acepta permuta</span>}{listing.accepts_financing && <span>✓ Acepta financiación</span>}{listing.has_title != null && <span>✓ Documentación: {listing.has_title ? 'al día' : listing.title_status ?? 'a confirmar'}</span>}</section></div></main>
}
