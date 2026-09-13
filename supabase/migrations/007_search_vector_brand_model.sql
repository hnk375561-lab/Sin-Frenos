-- ============================================================================
-- FASE 5 — search_vector debe incluir brand/model (13/09/2026)
-- ============================================================================
--
-- Contexto: 002_align_schema_to_master_doc.sql creó `listings.search_vector`
-- (GENERATED ALWAYS ... STORED) solo con `title` (peso A) y `description`
-- (peso C). La sección 4.7 del documento maestro pide explícitamente
-- full-text sobre "title || description || brand || model", y la sección 7
-- ("Búsqueda / descubrimiento") depende de esto: una búsqueda de "Hilux" no
-- debe fallar solo porque la palabra "Hilux" quedó en `brand`/`model`
-- (texto libre del vendedor, sección 4.7) y no en el título.
--
-- Postgres no permite ALTER de la expresión de una columna GENERATED
-- existente — hay que dropearla y recrearla. Es seguro hacerlo acá porque
-- es una columna 100% derivada (STORED, sin datos que no se puedan
-- recalcular de las columnas fuente) — no hay pérdida de información real.
--
-- Pesos elegidos: A para título (igual que antes), B para brand/model
-- (nuevo — por debajo del título pero por encima de la descripción libre,
-- porque "Toyota"/"Hilux" son señales más fuertes de intención de búsqueda
-- que texto narrativo), C para descripción (igual que antes).

DROP INDEX IF EXISTS idx_listings_search_vector;

ALTER TABLE listings DROP COLUMN IF EXISTS search_vector;

ALTER TABLE listings ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(model, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(description, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_listings_search_vector ON listings USING GIN (search_vector);

-- ============================================================================
-- FIN DE LA MIGRACIÓN 007
-- ============================================================================
-- No toca RLS (003_rls_policies.sql sigue vigente sin cambios: los
-- listings públicos siguen siendo solo los `status = 'published'`) ni
-- ninguna otra columna. `src/lib/listings/search.ts` (Fase 5) es el primer
-- código que realmente consume esta columna vía `.textSearch(...)`; hasta
-- ahora existía en el schema pero nada la usaba.
