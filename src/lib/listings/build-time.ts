import { createClient } from '@supabase/supabase-js'
import type { ListingRow } from '@/lib/listings/types'

export type BuildListingMedia = { id: string; url: string; position: number; is_cover: boolean }
export type BuildListing = ListingRow & { media: BuildListingMedia[]; categoryName: string | null; conditionLabel: string | null }

function getBuildClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function publicListingsQuery<T extends { or: (filters: string) => T }>(builder: T): T {
  return builder.or('metadata->>source.is.null,metadata->>source.neq.seed-fase3')
}

export async function getBuildListings(): Promise<BuildListing[]> {
  const client = getBuildClient()
  if (!client) return []
  const { data, error } = await publicListingsQuery(
    client.from('listings').select('*').eq('status', 'published').order('published_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
  )
  if (error || !data) return []
  const rows = data as ListingRow[]
  const ids = rows.map((row) => row.id)
  const [{ data: media }, { data: categories }, { data: conditions }] = await Promise.all([
    ids.length ? client.from('listing_media').select('id, listing_id, url, position, is_cover').in('listing_id', ids).order('position') : Promise.resolve({ data: [], error: null }),
    client.from('vehicle_categories').select('id, name'),
    client.from('vehicle_conditions').select('id, label'),
  ])
  const mediaByListing = new Map<string, BuildListingMedia[]>()
  for (const item of media ?? []) {
    const current = mediaByListing.get(item.listing_id) ?? []
    current.push({ id: item.id, url: item.url, position: item.position, is_cover: item.is_cover })
    mediaByListing.set(item.listing_id, current)
  }
  const categoryNames = new Map((categories ?? []).map((item) => [item.id, item.name]))
  const conditionLabels = new Map((conditions ?? []).map((item) => [item.id, item.label]))
  return rows.map((row) => ({
    ...row,
    media: mediaByListing.get(row.id) ?? [],
    categoryName: categoryNames.get(row.category_id) ?? null,
    conditionLabel: conditionLabels.get(row.condition_id) ?? null,
  }))
}

export async function getBuildListing(id: string): Promise<BuildListing | null> {
  const listings = await getBuildListings()
  return listings.find((listing) => listing.id === id) ?? null
}
