-- ============================================================================
-- FASE 4 (1/N) — STORAGE DE FOTOS/VIDEO + BASE DE MODERACIÓN (13/09/2026)
-- ============================================================================
--
-- Primer pedazo de Fase 4 (flujo de publicación, sección 6 del documento
-- maestro). Antes de tocar ningún componente de UI hace falta que exista:
--
--   1. El bucket de Supabase Storage donde el paso 6 del wizard
--      ("Fotos", sección 6) sube archivos directo desde el navegador.
--   2. Políticas de Storage que validen QUIÉN puede escribir DÓNDE — nunca
--      confiar solo en la validación de tipo/tamaño del cliente (sección
--      3.c y 17 "Riesgos" del documento maestro: "el cliente se puede
--      saltear").
--   3. Una forma mínima de distinguir un admin/moderador, porque el
--      criterio de aceptación de Fase 4 pide explícitamente que "un
--      listing quede en pending_review y aparezca en una vista de
--      moderación mínima" — eso exige que ALGUIEN pueda leer listings
--      ajenos en estado pending_review, cosa que hoy el RLS de
--      003_rls_policies.sql no permite (solo público si status='published'
--      o el propio dueño). La cola de reportes/moderation_actions
--      completa (sección 4.12/4.13) es Fase 7, no se adelanta acá.
--
-- No se toca nada de 001-005: esto es 100% aditivo.

-- ============================================================================
-- 1. profiles.is_admin — flag mínimo para poder escribir UNA policy de
--    "los admins pueden ver listings en cualquier estado", sin modelar
--    todavía un sistema de roles completo (eso sería sobreingeniería para
--    lo que pide el criterio de aceptación de esta fase).
-- ============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN profiles.is_admin IS
  'Flag mínimo de moderador para la vista de moderación de Fase 4 '
  '(src/app/moderacion/page.tsx). Se activa a mano desde el SQL editor de '
  'Supabase (UPDATE profiles SET is_admin = true WHERE id = ''<uuid>'') — '
  'no hay UI para auto-otorgarse este flag, a propósito. Si en Fase 7 hace '
  'falta un sistema de roles más rico, se migra desde acá, no se duplica.';

-- Nadie puede leer el is_admin de otra fila más que la propia vía
-- `profiles` directo (RLS de 003/004 ya limita SELECT a auth.uid() = id) —
-- no hace falta una policy nueva para esto. `public_profiles` (la vista
-- que sí es de lectura pública) NO incluye esta columna: se mantiene así
-- a propósito, para no filtrar quién es admin.

-- ============================================================================
-- 2. RLS de listings — admins pueden ver (no editar) cualquier estado
-- ============================================================================
-- Aditivo respecto a 003_rls_policies.sql: se agrega una policy más de
-- SELECT (Postgres combina políticas permisivas de SELECT con OR, así que
-- esto no reemplaza "Published listings are public" ni "Sellers can view
-- own listings", solo suma un tercer camino de lectura).
--
-- A propósito NO se agrega policy de UPDATE para admins en esta migración:
-- el criterio de aceptación de Fase 4 es "aparece en una vista de
-- moderación mínima", no "un admin puede aprobar/rechazar desde ahí" —
-- eso es explícitamente Fase 7 (moderation_actions, acciones de
-- aprobar/pausar/remover). Mantenerlo de solo lectura ahora evita tener
-- que revisar de nuevo esta policy cuando se diseñe el flujo real de
-- moderación.

DROP POLICY IF EXISTS "Admins can view any listing" ON listings;
CREATE POLICY "Admins can view any listing"
  ON listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = TRUE
    )
  );

-- listing_media hereda esto sin cambios: "Sellers can view own listing
-- media" y "Media of published listings is public" (003) ya cubren los
-- casos públicos; un admin que necesite ver fotos de un listing
-- pending_review ajeno lo hace hoy solo a través del propio `listings`
-- (ve la fila) — si en Fase 7 hace falta que la vista de moderación
-- también liste fotos de terceros en pending_review, se agrega ahí una
-- policy análoga a esta. No se adelanta sin necesidad concreta todavía.

-- ============================================================================
-- 3. Bucket de Storage: listing-media
-- ============================================================================
-- Público de LECTURA (las fotos de un listing publicado son públicas por
-- naturaleza, igual que cualquier foto de un aviso de venta), pero la
-- ESCRITURA queda restringida por policy a la propia carpeta del vendedor
-- (sección 3.c del documento maestro).
--
-- Convención de path obligatoria para que las policies de abajo funcionen:
--   listing-media/{auth.uid()}/{listing_id}/{archivo}
-- El primer segmento del path SIEMPRE tiene que ser el uid del vendedor
-- logueado — es lo que `storage.foldername(name)` chequea. `create.ts`
-- (próxima entrega) arma el path así, no queda a criterio del componente
-- de UI.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-media',
  'listing-media',
  TRUE,
  15728640, -- 15 MB por archivo — cubre fotos de celular sin comprimir de más;
            -- el límite "real" de UX (tamaño recomendado, cantidad de fotos)
            -- se valida en el cliente (create.ts), esto es el piso de
            -- seguridad que Storage no permite saltear.
  ARRAY['image/jpeg', 'image/png', 'image/webp']
    -- Video: sección 6, paso 6 del documento maestro es explícita — "Video
    -- opcional: solo link externo (YouTube/Drive) en el MVP, no procesamos
    -- upload de video propio". Por eso el bucket NO acepta mime types de
    -- video: no es un descuido, es la decisión ya tomada. Si esto cambia
    -- en una fase futura, se migra este `allowed_mime_types` ahí.
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ----------------------------------------------------------------------
-- Políticas de storage.objects para el bucket listing-media
-- ----------------------------------------------------------------------
-- (Postgres RLS también aplica sobre storage.objects; Supabase lo habilita
-- por defecto en ese esquema, no hace falta ALTER TABLE acá.)

DROP POLICY IF EXISTS "listing-media: lectura pública" ON storage.objects;
CREATE POLICY "listing-media: lectura pública"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-media');

DROP POLICY IF EXISTS "listing-media: el vendedor sube a su propia carpeta" ON storage.objects;
CREATE POLICY "listing-media: el vendedor sube a su propia carpeta"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-media'
    AND auth.uid() IS NOT NULL
    -- storage.foldername(name) devuelve el path como array de carpetas;
    -- el primer segmento tiene que ser exactamente el uid de quien sube.
    -- Esto es lo que hace imposible que un usuario logueado escriba en la
    -- carpeta de otro, aunque conozca o adivine su listing_id.
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "listing-media: el vendedor borra su propia carpeta" ON storage.objects;
CREATE POLICY "listing-media: el vendedor borra su propia carpeta"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listing-media'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Sin policy de UPDATE a propósito: reemplazar una foto es "borrar +
-- subir de nuevo" desde el cliente (más simple de razonar y de testear
-- que un upsert), no un caso que el wizard necesite en el MVP.

-- ============================================================================
-- FIN DE LA MIGRACIÓN 006
-- ============================================================================
-- Verificación manual post-migración (SQL Editor de Supabase):
--   select * from storage.buckets where id = 'listing-media';
--     -> public = true, file_size_limit = 15728640
--   select is_admin from profiles limit 1;
--     -> columna existe, default false
-- Para habilitar tu propio usuario como moderador de prueba:
--   update profiles set is_admin = true where id = '<tu-uuid-de-auth.users>';
--
-- Como las migraciones anteriores, esta NO corre sola en el plan free de
-- Supabase — aplicar a mano (SQL Editor o `supabase db push`).
-- ============================================================================
