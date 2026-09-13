# Fase 5 — Discovery / buscador de listings (13/09/2026)

Implementación de la Fase 5 del plan de ejecución (sección 19 del
documento maestro): `/listings` con filtros + búsqueda de texto (sección
7), todo vía `supabase-js` desde el cliente contra Postgres — sin tocar
el buscador Fuse.js del catálogo técnico (`/vehiculos`), que sigue siendo
un motor completamente separado a propósito.

## Qué se agregó

- `supabase/migrations/007_search_vector_brand_model.sql`: **corrección
  de un gap real**, no parte "nueva" del roadmap. `search_vector` (creado
  en `002_align_schema_to_master_doc.sql`) solo indexaba `title` +
  `description`; la sección 4.7 pide explícitamente indexar también
  `brand`/`model`. Sin esto, buscar "Hilux" no encontraba listings donde
  "Hilux" solo aparecía en el campo `model` (texto libre del vendedor,
  sección 4.7) y no en el título. Se dropea y recrea la columna generada
  con los 4 campos (pesos A/B/B/C) y se recrea el índice GIN.
- `src/lib/listings/search.ts`: `searchListings()` (full-text `websearch`
  sobre `search_vector` + filtros SQL de categoría/condición/ubicación/
  precio/moneda, paginado con `.range()`), `getCoversForListings()`
  (mismo patrón "un solo query para todas las portadas" que ya usa
  `mis-publicaciones`), y `parsePriceFromQuery()` (el parser regex de
  "hasta X mil dólares" que pide la sección 7 — sin IA/NLP).
- `src/components/listings/ListingCard.tsx` + `ListingCard.test.tsx`:
  card nueva para la grilla (no reutiliza `EntityCard`, sección 16). El
  test de regresión de `prefetch={false}` es el mismo criterio de
  `EntityCard.test.tsx` — ver el aviso de README sobre el Error 1027, que
  aplica literalmente a cualquier `<Link>` nuevo dentro de un `.map()`.
- `src/components/listings/Filters.tsx`: formulario controlado por la
  URL (`useSearchParams` + `router.push`), no por estado local — mismo
  criterio que ya usa `/listings/ver?id=`, y deja la búsqueda
  compartible/bookmarkeable.
- `src/app/listings/page.tsx`: orquesta todo — carga de referencia
  (categorías habilitadas, condiciones, ubicaciones) una sola vez,
  re-búsqueda en cada cambio de filtros, "Cargar más" con paginación.

## Deliberadamente fuera de este cierre

- **Motor de búsqueda dedicado (Algolia/Meilisearch).** La sección 7 lo
  deja explícitamente para una fase de escalabilidad "solo si el volumen
  real lo justifica" — no ahora.
- **CTA de listings en las fichas técnicas** ("¿Tenés una Hilux para
  vender?" + mostrar listings reales de ese modelo debajo de la ficha).
  Es la sección 8 (estrategia de adquisición), que el propio plan de
  ejecución marca como algo que arranca "en paralelo desde el final de la
  Fase 5" — no como parte de la Fase 5 en sí. Con `/listings` ya
  funcionando, esto queda como el siguiente paso lógico de negocio/
  producto, no bloqueado por nada técnico nuevo.
- **Rangos de precio "entre X y Y" en el texto libre.** `parsePriceFromQuery`
  solo cubre techo de precio ("hasta X"), el caso de uso real más común.
  Ampliarlo es un cambio incremental sobre el mismo archivo si aparece la
  necesidad, no un rediseño.

## Qué sigue sin tocar (correcto, es de otra fase)

- Mensajería y favoritos ligados a cuenta: Fase 6.
- Moderación real (aprobar/rechazar `pending_review`, banear vendedor):
  Fase 7.
- SEO de listings a escala (páginas de categoría, sitemap dinámico,
  rebuild programado): Fase 9.

## Pendiente operativo antes de que esto sirva de algo en producción

`supabase/migrations/007_search_vector_brand_model.sql` es SQL nuevo que
**no se aplica solo** (mismo criterio que 001-006): correrlo a mano en el
dashboard de Supabase (SQL editor) o con `supabase db push` contra el
proyecto real antes de que el buscador funcione como se espera en
producción.
