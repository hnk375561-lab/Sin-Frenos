'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { ContactButton } from '@/components/listings/ContactButton'
import { FavoriteButton } from '@/components/listings/FavoriteButton'

type Listing = { id: string; title: string; brand: string | null; model: string | null; version: string | null; year: number | null; mileage_km: number | null; price_amount: number | null; price_currency: string | null; price_type: string | null; description: string | null; condition_details: Record<string, unknown>; category_id: string; condition_id: string; accepts_trade: boolean; accepts_financing: boolean; has_title: boolean | null; title_status: string | null; vehicle_model_slug: string | null; seller_id: string }
type VehicleModel = { slug: string; manufacturer: string; title: string; class: string | null }
type Media = { id: string; url: string; position: number; is_cover: boolean }

function ListingContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [listing, setListing] = useState<Listing | null>(null)
  const [media, setMedia] = useState<Media[]>([])
  const [categoryName, setCategoryName] = useState<string | null>(null)
  const [conditionLabel, setConditionLabel] = useState<string | null>(null)
  const [vehicleModel, setVehicleModel] = useState<VehicleModel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      if (!id) { setError('Falta el identificador de la publicación.'); setLoading(false); return }
      const { data: listingData, error: listingError } = await supabase.from('listings').select('*').eq('id', id).single()
      if (listingError || !listingData) { setError(listingError?.message ?? 'Publicación no encontrada'); setLoading(false); return }
      setListing(listingData)
      const [{ data: mediaData }, { data: categoryData }, { data: conditionData }] = await Promise.all([
        supabase.from('listing_media').select('id, url, position, is_cover').eq('listing_id', id).order('position'),
        supabase.from('vehicle_categories').select('name').eq('id', listingData.category_id).single(),
        supabase.from('vehicle_conditions').select('label').eq('id', listingData.condition_id).single(),
      ])
      setMedia(mediaData ?? [])
      setCategoryName(categoryData?.name ?? listingData.category_id)
      setConditionLabel(conditionData?.label ?? listingData.condition_id)
      if (listingData.vehicle_model_slug) {
        const { data: modelData } = await supabase.from('vehicle_models').select('slug, manufacturer, title, class').eq('slug', listingData.vehicle_model_slug).maybeSingle()
        setVehicleModel(modelData ?? null)
      }
      setLoading(false)
    })()
  }, [id])

  if (loading) return <main className="marketplace-listing-page"><div className="marketplace-listing-shell"><div className="marketplace-skeleton h-80 rounded-3xl" /></div></main>
  if (error) return <main className="marketplace-listing-page"><div className="marketplace-listing-shell rounded-3xl border border-[#f1b7aa] bg-[#fff0ed] p-8 text-center"><h1 className="text-2xl font-extrabold text-[#12212a]">No pudimos abrir esta publicación</h1><p className="mt-2 text-sm text-[#b83d2a]">{error}</p><Link href="/listings" className="marketplace-auth-primary mt-6">Volver a publicaciones</Link></div></main>
  if (!listing) return null

  const cover = media.find((m) => m.is_cover) ?? media[0]
  const price = listing.price_type === 'on_request' || !listing.price_amount ? 'Precio a convenir' : `${listing.price_currency ?? 'ARS'} ${listing.price_amount.toLocaleString('es-AR')}`
  const meta = [listing.year ? String(listing.year) : null, listing.mileage_km != null ? `${listing.mileage_km.toLocaleString('es-AR')} km` : null, categoryName, conditionLabel].filter(Boolean)

  return <main className="marketplace-listing-page"><div className="marketplace-listing-shell"><Link href="/listings" className="marketplace-listing-back">← Volver a publicaciones</Link><div className="marketplace-listing-hero"><div><div className="marketplace-listing-gallery"><div className="marketplace-listing-gallery-main">{cover ? <img src={cover.url} alt={listing.title} /> : <div className="marketplace-listing-no-photo">Este vehículo todavía no tiene fotos</div>}<div className="absolute right-4 top-4"><FavoriteButton listingId={listing.id} size={21} /></div></div>{media.length > 1 && <div className="grid grid-cols-4 gap-2 p-2">{media.filter((m) => m.id !== cover?.id).slice(0, 4).map((m) => <img key={m.id} src={m.url} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />)}</div>}</div></div><div className="marketplace-listing-info"><p className="marketplace-eyebrow text-[#0b7a75]">Publicación real · contacto directo</p><h1>{listing.title}</h1><p className="marketplace-listing-price">{price}</p><div className="mt-5 flex flex-wrap gap-2">{meta.map((item) => <span key={item} className="rounded-full bg-[#dff2f0] px-3 py-1.5 text-xs font-bold text-[#0b7a75]">{item}</span>)}</div><div className="marketplace-listing-contact"><ContactButton listingId={listing.id} sellerId={listing.seller_id} listingTitle={listing.title} /></div><p className="mt-3 text-xs leading-relaxed text-[#71858c]">Escribile al vendedor desde Sin Frenos. Tu email y teléfono no se comparten automáticamente.</p></div></div>{vehicleModel && <div className="marketplace-listing-panel">Relacionado con el catálogo técnico: <Link href={`/vehiculos/${vehicleModel.slug}`} className="font-bold text-[#0b7a75]">{vehicleModel.manufacturer} {vehicleModel.title} →</Link></div>}{listing.description && <section className="marketplace-listing-panel"><h2 className="text-xl font-extrabold text-[#12212a]">Sobre este vehículo</h2><p className="mt-3 max-w-3xl whitespace-pre-line">{listing.description}</p></section>} {listing.condition_details && Object.keys(listing.condition_details).length > 0 && <section className="marketplace-listing-panel"><h2 className="text-xl font-extrabold text-[#12212a]">Lo que declara el vendedor</h2><dl className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(listing.condition_details).map(([key, value]) => <div key={key} className="rounded-xl bg-white p-3"><dt className="text-xs font-bold uppercase text-[#71858c]">{key}</dt><dd className="mt-1 text-sm text-[#12212a]">{String(value)}</dd></div>)}</dl></section>}<section className="marketplace-listing-panel flex flex-wrap gap-3 text-sm font-semibold">{listing.accepts_trade && <span>✓ Acepta permuta</span>}{listing.accepts_financing && <span>✓ Acepta financiación</span>}{listing.has_title != null && <span>✓ Documentación: {listing.has_title ? 'al día' : listing.title_status ?? 'a confirmar'}</span>}</section></div></main>
}

export default function ListingPage() {
  return <Suspense fallback={<main className="marketplace-listing-page"><div className="marketplace-listing-shell"><div className="marketplace-skeleton h-80 rounded-3xl" /></div></main>}><ListingContent /></Suspense>
}
