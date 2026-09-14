-- ============================================================================
-- FIX — dos bugs reales encontrados al auditar 001-008 contra el repo
-- (verificación previa a Fase 8, 14/09/2026)
-- ============================================================================
--
-- Se detectaron al reconstruir `src/types/supabase.ts` a mano contra las
-- migraciones existentes (no había types/supabase.ts commiteado, y no hay
-- proyecto Supabase real conectado desde este entorno para generar los
-- tipos vía `supabase gen types typescript`).
--
-- Sigue el mismo criterio que 004 (fix sobre 003) y 007 (fix sobre 002):
-- migración nueva y aditiva, nunca se edita una migración ya numerada.
--
-- BUG 1 — `avatar_url` no existe en `profiles`:
--   003_rls_policies.sql y 004_fix_profile_rls_leak.sql definen la vista
--   `public_profiles` con una columna `avatar_url` que ninguna migración
--   agregó nunca a la tabla base `profiles` (001 no la crea, 002/006/008
--   tampoco). `CREATE VIEW public_profiles AS SELECT ..., avatar_url, ...`
--   falla con `column "avatar_url" does not exist` apenas Postgres intenta
--   correr 003 — lo cual bloquea 004 a 008 también si se aplican en orden.
--   Si esto nunca se corrió contra un proyecto Supabase real, es la causa
--   más probable de que el marketplace no esté desplegado todavía.
--
-- BUG 2 — sintaxis inválida en el trigger de 008:
--   `update_listing_status_after_action()` usa
--     WHEN 'flagged_duplicate' OR 'flagged_suspicious' THEN
--   dentro de un CASE simple de PL/pgSQL (`CASE NEW.action WHEN ... END
--   CASE`). Ahí cada rama de WHEN espera una lista de expresiones
--   separadas por coma, no un OR — `'flagged_duplicate' OR
--   'flagged_suspicious'` es un OR booleano entre dos literales de texto,
--   lo cual Postgres rechaza al crear la función
--   (`CREATE OR REPLACE FUNCTION` falla en tiempo de definición, no de
--   uso). Esto bloqueaba la creación de la función y su trigger, es decir
--   la mitad final de la migración 008.

-- ----------------------------------------------------------------------
-- FIX 1: agregar avatar_url a profiles y recrear las vistas públicas
-- ----------------------------------------------------------------------

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN profiles.avatar_url IS
  'URL pública del avatar del usuario (foto de perfil). Faltaba desde 001 '
  '— 003/004 ya asumían que existía al armar public_profiles. Agregada '
  'recién acá (009) porque nunca se detectó contra un proyecto Supabase '
  'real.';

-- Recrear la vista pública (idéntica definición a 004, ahora que la
-- columna que referencia existe de verdad). Idempotente: correr esto de
-- nuevo no cambia nada si ya estaba bien.
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
SELECT
  id,
  display_name,
  avatar_url,
  seller_type,
  is_verified,
  total_listings,
  total_sales,
  avg_rating
FROM profiles;

GRANT SELECT ON public_profiles TO anon, authenticated;

-- ----------------------------------------------------------------------
-- FIX 2: corregir el trigger function de 008 (CASE con lista, no OR)
-- ----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_listing_status_after_action()
RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.action
    WHEN 'approved' THEN
      UPDATE listings SET status = 'published' WHERE id = NEW.listing_id;
    WHEN 'rejected' THEN
      UPDATE listings SET status = 'pending_review' WHERE id = NEW.listing_id;
    WHEN 'paused' THEN
      UPDATE listings SET status = 'paused' WHERE id = NEW.listing_id;
    WHEN 'removed' THEN
      UPDATE listings SET status = 'removed' WHERE id = NEW.listing_id;
    WHEN 'flagged_duplicate', 'flagged_suspicious' THEN
      UPDATE listings SET status = 'flagged' WHERE id = NEW.listing_id;
  END CASE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- El trigger en sí (moderation_action_update_listing_status) ya apunta a
-- esta función por nombre — CREATE OR REPLACE alcanza, no hace falta
-- recrear el trigger.

-- ============================================================================
-- FIN DE LA MIGRACIÓN 009
-- ============================================================================
-- Verificación manual post-migración (SQL Editor de Supabase):
--
--   SELECT avatar_url FROM profiles LIMIT 1;
--     -> columna existe (puede ser NULL, no rompe)
--
--   SELECT * FROM public_profiles LIMIT 1;
--     -> vista funciona, incluye avatar_url
--
--   INSERT INTO moderation_actions (listing_id, action)
--   VALUES ('<listing-uuid-de-prueba>', 'flagged_duplicate');
--   SELECT status FROM listings WHERE id = '<listing-uuid-de-prueba>';
--     -> status = 'flagged'
--
-- Si tu proyecto Supabase real ya tiene 001-008 aplicadas manualmente con
-- alguna variante corregida a mano (por ejemplo, si ya le agregaste
-- avatar_url por tu cuenta desde el dashboard), esta migración es
-- idempotente (IF NOT EXISTS / CREATE OR REPLACE / DROP+CREATE) y no
-- debería romper nada al reaplicarla.
-- ============================================================================
