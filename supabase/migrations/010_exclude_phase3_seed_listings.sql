-- Fase 3 seed listings are development fixtures, not public inventory.
-- Keep them available to the service role for schema/manual verification, but
-- make their origin explicit and exclude them from every public surface.

UPDATE public.listings AS listings
SET metadata = COALESCE(listings.metadata, '{}'::jsonb)
  || jsonb_build_object('source', 'seed-fase3', 'purpose', 'schema-validation')
WHERE EXISTS (
  SELECT 1
  FROM auth.users AS users
  WHERE users.id = listings.seller_id
    AND users.email LIKE '%@seed-fase3.sinfrenos.local'
)
AND COALESCE(listings.metadata ->> 'source', '') <> 'seed-fase3';

CREATE INDEX IF NOT EXISTS idx_listings_public_inventory
  ON public.listings(status)
  WHERE status = 'published'
    AND COALESCE(metadata ->> 'source', '') <> 'seed-fase3';

DROP POLICY IF EXISTS "Published listings are public" ON public.listings;
CREATE POLICY "Published listings are public"
  ON public.listings FOR SELECT
  USING (
    status = 'published'
    AND COALESCE(metadata ->> 'source', '') <> 'seed-fase3'
  );

DROP POLICY IF EXISTS "Media of published listings is public" ON public.listing_media;
CREATE POLICY "Media of published listings is public"
  ON public.listing_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.listings
      WHERE public.listings.id = public.listing_media.listing_id
        AND public.listings.status = 'published'
        AND COALESCE(public.listings.metadata ->> 'source', '') <> 'seed-fase3'
    )
  );
