-- ============================================================================
-- FASE 7 (COMPLETA) — MODERACIÓN Y CONFIANZA (13/09/2026)
-- VERSIÓN CORREGIDA (14/09/2026) — fixes aplicados directo en el archivo
-- original del repo, en vez de como parche posterior:
--   Bug 2: WHEN 'flagged_duplicate' OR 'flagged_suspicious' THEN
--          -> sintaxis inválida en CASE simple de PL/pgSQL, corregido a
--             WHEN 'flagged_duplicate', 'flagged_suspicious' THEN (con coma)
--   Bug 3: COMMENT '...' inline en definición de columna dentro de
--          CREATE TABLE (sintaxis MySQL, inválida en Postgres)
--          -> movido a COMMENT ON COLUMN separado, después del CREATE TABLE
--   Bug 4: columna "limit" en RETURNS TABLE de check_rate_limit_new_seller
--          -> "limit" es palabra reservada en Postgres, renombrada a
--             "max_allowed"
-- ============================================================================
--
-- Implementa la cola de moderación completa: reportes de listings,
-- acciones de moderación, auto-aprobación basada en historial, detección
-- de duplicados, rate limiting.
--
-- Cambios en tablas existentes:
--   1. profiles.trust_score — puntuación numérica del vendedor
--   2. profiles.email_verified_at — timestamp, obligatorio para publicar
--   3. listings — agregar status='flagged' a CHECK constraint
--
-- Nuevas tablas:
--   1. listing_reports — reporte de un listing
--   2. moderation_actions — log de acciones de moderador
--   3. vendor_auto_approval_rules — reglas de auto-aprobación
--
-- RLS Policies:
--   1. reports: INSERT abierto (cualquiera, anónimo permitido)
--              SELECT solo admin
--   2. moderation_actions: INSERT solo admin
--                         SELECT solo admin
--   3. listings: antes de insertar, validar email_verified_at NOT NULL
--

-- ============================================================================
-- 1. PROFILES — agregar columnas de trust y email verification
-- ============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS trust_score int NOT NULL DEFAULT 50;

COMMENT ON COLUMN profiles.email_verified_at IS
  'Timestamp del último email verificado. NOT NULL es requisito para publicar.';

COMMENT ON COLUMN profiles.trust_score IS
  'Puntuación 0-100 del vendedor. Comienza en 50. Se reduce por: reportes, '
  'rechazos de moderación. Se incrementa por: primera venta reportada, '
  'historial sin problemas. Usa en cálculo de auto-aprobación.';

-- ============================================================================
-- 2. LISTINGS — actualizar CHECK constraint para status
-- ============================================================================

ALTER TABLE listings
  DROP CONSTRAINT IF EXISTS listings_status_check;

ALTER TABLE listings
  ADD CONSTRAINT listings_status_check
  CHECK (status IN ('draft','pending_review','published','paused','sold','removed','flagged'));

-- ============================================================================
-- 3. LISTING_REPORTS — tabla de reportes
-- ============================================================================

CREATE TABLE IF NOT EXISTS listing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL CHECK (reason IN (
    'precio_absurdo',
    'fotos_robadas',
    'spam',
    'duplicado',
    'datos_enganosos',
    'contacto_incorrecto',
    'otro'
  )),
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  UNIQUE(listing_id, reporter_id)  -- un reporte por vendedor/listing
);

COMMENT ON COLUMN listing_reports.reporter_id IS 'NULL = reporte anónimo';

CREATE INDEX IF NOT EXISTS idx_listing_reports_listing_id ON listing_reports(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_reports_status ON listing_reports(status);
CREATE INDEX IF NOT EXISTS idx_listing_reports_created_at ON listing_reports(created_at DESC);

COMMENT ON TABLE listing_reports IS
  'Reportes de usuarios sobre listings (spam, fotos falsas, etc). '
  'Reporter_id nullable para permitir reportes anónimos. '
  'Única por (listing_id, reporter_id) — evita spam de reportes duplicados.';

-- ============================================================================
-- 4. MODERATION_ACTIONS — log de acciones de moderador
-- ============================================================================

CREATE TABLE IF NOT EXISTS moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  moderator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN (
    'approved',
    'rejected',
    'paused',
    'removed',
    'flagged_duplicate',
    'flagged_suspicious'
  )),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(listing_id, action)  -- una acción del tipo por listing
                               -- (re-aprobar es otra acción, no reemplaza)
);

COMMENT ON COLUMN moderation_actions.moderator_id IS
  'NULL = acción automática (auto-aprobación, detección de duplicado)';

CREATE INDEX IF NOT EXISTS idx_moderation_actions_listing_id
  ON moderation_actions(listing_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_action
  ON moderation_actions(action);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created_at
  ON moderation_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator
  ON moderation_actions(moderator_id);

COMMENT ON TABLE moderation_actions IS
  'Log append-only de acciones de moderación. Nunca se edita ni se borra. '
  'Moderator_id NULL indica acción automática (auto-aprobación, sistema). '
  'Cada acción se registra con timestamp y razón para auditoría completa.';

-- ============================================================================
-- 5. VENDOR_AUTO_APPROVAL_RULES — reglas de auto-aprobación
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendor_auto_approval_rules (
  id text PRIMARY KEY,
  min_trust_score int NOT NULL DEFAULT 70,
  min_successful_sales int NOT NULL DEFAULT 1,
  days_since_account_creation int NOT NULL DEFAULT 7,
  max_rejections_lifetime int NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE vendor_auto_approval_rules IS
  'Reglas configurables de auto-aprobación de listings. '
  'Un vendedor cumple si TODAS sus métricas pasan los thresholds. '
  'ID sugerido: "standard", "strict", "permissive", etc.';

-- Insertar regla estándar por defecto
INSERT INTO vendor_auto_approval_rules (id, min_trust_score, min_successful_sales,
  days_since_account_creation, max_rejections_lifetime, description)
VALUES (
  'standard',
  70,
  1,
  7,
  0,
  'Regla estándar: trust >= 70, al menos 1 venta exitosa, 7+ días desde registro, sin rechazos'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. RLS POLICIES — reports
-- ============================================================================

ALTER TABLE listing_reports ENABLE ROW LEVEL SECURITY;

-- INSERT abierto (anónimo o logueado, cualquiera puede reportar)
DROP POLICY IF EXISTS "Anyone can create a report" ON listing_reports;
CREATE POLICY "Anyone can create a report"
  ON listing_reports FOR INSERT
  WITH CHECK (true);

-- SELECT restringido a admin
DROP POLICY IF EXISTS "Only admins can view reports" ON listing_reports;
CREATE POLICY "Only admins can view reports"
  ON listing_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- UPDATE restringido a admin (cambiar status)
DROP POLICY IF EXISTS "Only admins can update report status" ON listing_reports;
CREATE POLICY "Only admins can update report status"
  ON listing_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- ============================================================================
-- 7. RLS POLICIES — moderation_actions
-- ============================================================================

ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- INSERT solo admin
DROP POLICY IF EXISTS "Only admins can create moderation actions" ON moderation_actions;
CREATE POLICY "Only admins can create moderation actions"
  ON moderation_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- SELECT solo admin
DROP POLICY IF EXISTS "Only admins can view moderation actions" ON moderation_actions;
CREATE POLICY "Only admins can view moderation actions"
  ON moderation_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Sellers pueden ver las acciones sobre sus propios listings
DROP POLICY IF EXISTS "Sellers can view moderation actions on own listings" ON moderation_actions;
CREATE POLICY "Sellers can view moderation actions on own listings"
  ON moderation_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = moderation_actions.listing_id
        AND listings.seller_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. RLS POLICIES — listings (agregar validación de email_verified_at)
-- ============================================================================
-- Esta política NO se crea aquí, pero sí se documenta que antes de
-- publicar (status != 'draft'), el sistema debe validar que
-- email_verified_at IS NOT NULL a nivel de aplicación (Supabase Auth
-- proporciona email_verified, se refleja en esta columna).

-- ============================================================================
-- 9. VISTA PÚBLICA: listing_reports_summary (para sellers)
-- ============================================================================

DROP VIEW IF EXISTS listing_reports_summary;
CREATE VIEW listing_reports_summary AS
  SELECT
    listing_id,
    COUNT(*) as total_reports,
    COALESCE(SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END), 0) as open_count,
    MAX(created_at) as last_reported_at
  FROM listing_reports
  WHERE status IN ('open', 'reviewed')
  GROUP BY listing_id;

-- No es sensitive porque no expone reporter_id ni detalles, solo cuenta
-- agregada. Sellers verán "tienes X reportes abiertos" en su dashboard.

-- ============================================================================
-- 10. FUNCIÓN RPC: check_auto_approval (usa trust_score + historial)
-- ============================================================================

DROP FUNCTION IF EXISTS check_auto_approval(uuid, text);
CREATE OR REPLACE FUNCTION check_auto_approval(
  p_seller_id uuid,
  p_rule_id text DEFAULT 'standard'
)
RETURNS TABLE (
  should_auto_approve boolean,
  reason text
) AS $$
DECLARE
  v_trust_score int;
  v_account_age_days int;
  v_successful_sales int;
  v_rejections int;
  v_min_trust int;
  v_min_sales int;
  v_min_days int;
  v_max_rejections int;
BEGIN
  -- Obtener métricas del vendedor
  SELECT
    COALESCE(profiles.trust_score, 50),
    EXTRACT(DAY FROM (now() - auth.users.created_at))::int
  INTO v_trust_score, v_account_age_days
  FROM profiles
  JOIN auth.users ON profiles.id = auth.users.id
  WHERE profiles.id = p_seller_id;

  IF v_trust_score IS NULL THEN
    RETURN QUERY SELECT false, 'Usuario no encontrado'::text;
    RETURN;
  END IF;

  -- Obtener thresholds de la regla
  SELECT
    min_trust_score, min_successful_sales,
    days_since_account_creation, max_rejections_lifetime
  INTO v_min_trust, v_min_sales, v_min_days, v_max_rejections
  FROM vendor_auto_approval_rules
  WHERE id = p_rule_id;

  IF v_min_trust IS NULL THEN
    RETURN QUERY SELECT false, 'Regla de auto-aprobación no encontrada'::text;
    RETURN;
  END IF;

  -- Contar ventas exitosas (listings en status published con al menos 1 mensaje)
  SELECT COUNT(DISTINCT listings.id)::int
  INTO v_successful_sales
  FROM listings
  JOIN conversations ON listings.id = conversations.listing_id
  WHERE listings.seller_id = p_seller_id
    AND listings.status IN ('published', 'sold');

  -- Contar rechazos
  SELECT COUNT(*)::int
  INTO v_rejections
  FROM moderation_actions
  WHERE listing_id IN (
    SELECT id FROM listings WHERE seller_id = p_seller_id
  )
  AND action IN ('rejected', 'removed');

  -- Evaluar cada criterio
  IF v_trust_score < v_min_trust THEN
    RETURN QUERY SELECT false,
      format('Trust score %s < %s requerido', v_trust_score, v_min_trust)::text;
    RETURN;
  END IF;

  IF v_account_age_days < v_min_days THEN
    RETURN QUERY SELECT false,
      format('Cuenta %s días < %s requeridos', v_account_age_days, v_min_days)::text;
    RETURN;
  END IF;

  IF v_successful_sales < v_min_sales THEN
    RETURN QUERY SELECT false,
      format('Ventas exitosas %s < %s requeridas', v_successful_sales, v_min_sales)::text;
    RETURN;
  END IF;

  IF v_rejections > v_max_rejections THEN
    RETURN QUERY SELECT false,
      format('Rechazos %s > %s permitidos', v_rejections, v_max_rejections)::text;
    RETURN;
  END IF;

  -- Todos los criterios pasaron
  RETURN QUERY SELECT true, 'Cumple todos los criterios de auto-aprobación'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_auto_approval IS
  'Determina si un vendedor puede auto-aprobar sus listings según su historial. '
  'Retorna (should_auto_approve, reason) — útil para logging de decisiones.';

-- ============================================================================
-- 11. FUNCIÓN RPC: detect_duplicate_listing
-- ============================================================================

DROP FUNCTION IF EXISTS detect_duplicate_listing(uuid, text, text, int, numeric, int);
CREATE OR REPLACE FUNCTION detect_duplicate_listing(
  p_seller_id uuid,
  p_brand text,
  p_model text,
  p_year int,
  p_price numeric,
  p_days_window int DEFAULT 7
)
RETURNS TABLE (
  is_potential_duplicate boolean,
  duplicate_listing_id uuid,
  reason text
) AS $$
BEGIN
  -- Buscar el mismo seller con mismo brand/model/year en rango de precio ±20%
  -- en los últimos N días
  RETURN QUERY
  SELECT
    COUNT(*) > 0 as is_dup,
    (ARRAY_AGG(listings.id))[1] as dup_id,
    CASE
      WHEN COUNT(*) = 0 THEN 'No es duplicado'
      ELSE format('Posible duplicado: %s publicaciones recientes', COUNT(*))
    END as reason
  FROM listings
  WHERE listings.seller_id = p_seller_id
    AND LOWER(listings.brand) = LOWER(p_brand)
    AND LOWER(listings.model) = LOWER(p_model)
    AND listings.year = p_year
    AND listings.price_amount BETWEEN (p_price * 0.8) AND (p_price * 1.2)
    AND listings.status IN ('published', 'pending_review', 'draft')
    AND listings.created_at > now() - make_interval(days => p_days_window);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION detect_duplicate_listing IS
  'Detecta posibles duplicados por heurística simple: mismo seller + '
  'brand/model/year/precio similar en rango de días. Retorna el primer '
  'match como referencia (si hay múltiples, el sistema decide qué hacer).';

-- ============================================================================
-- 12. FUNCIÓN RPC: check_rate_limit_new_seller
-- ============================================================================

DROP FUNCTION IF EXISTS check_rate_limit_new_seller(uuid, int, int);
CREATE OR REPLACE FUNCTION check_rate_limit_new_seller(
  p_seller_id uuid,
  p_max_listings int DEFAULT 3,
  p_hours_window int DEFAULT 48
)
RETURNS TABLE (
  is_within_limit boolean,
  current_count int,
  max_allowed int
) AS $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*)::int
  INTO v_count
  FROM listings
  WHERE seller_id = p_seller_id
    AND created_at > now() - make_interval(hours => p_hours_window)
    AND status IN ('draft', 'pending_review', 'published');

  RETURN QUERY SELECT
    (v_count < p_max_listings) as within_limit,
    v_count as cnt,
    p_max_listings as max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_rate_limit_new_seller IS
  'Valida que una cuenta nueva no sobrepase el máximo de publicaciones en '
  'un período de tiempo. Devuelve conteos para logging/feedback en UI.';

-- ============================================================================
-- 13. FUNCIÓN: trigger para actualizar listing status tras moderation_action
-- ============================================================================

DROP FUNCTION IF EXISTS update_listing_status_after_action();
CREATE OR REPLACE FUNCTION update_listing_status_after_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Mapear acción a nuevo status del listing
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

DROP TRIGGER IF EXISTS moderation_action_update_listing_status ON moderation_actions;
CREATE TRIGGER moderation_action_update_listing_status
  AFTER INSERT ON moderation_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_status_after_action();

COMMENT ON FUNCTION update_listing_status_after_action IS
  'Trigger: cuando se crea una moderation_action, actualiza el status del '
  'listing según la acción (approved -> published, paused -> paused, etc).';

-- ============================================================================
-- FIN DE LA MIGRACIÓN 008 (CORREGIDA)
-- ============================================================================
-- Verificación manual post-migración (SQL Editor de Supabase):
--
--   SELECT * FROM listing_reports LIMIT 1;
--     -> tabla existe, columnas creadas
--
--   SELECT * FROM moderation_actions LIMIT 1;
--     -> tabla existe
--
--   SELECT * FROM vendor_auto_approval_rules;
--     -> regla 'standard' existe
--
--   SELECT check_auto_approval('<un-uuid-de-seller>'::uuid);
--     -> verifica lógica de auto-aprobación
--
--   SELECT detect_duplicate_listing('<seller-uuid>'::uuid, 'Toyota', 'Hilux', 2024, 25000);
--     -> verifica lógica de duplicados
--
--   SELECT check_rate_limit_new_seller('<seller-uuid>'::uuid);
--     -> verifica límite de rate
--
-- ============================================================================
