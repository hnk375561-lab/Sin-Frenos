# Auditoría de enlaces y rutas estáticas — Sin Frenos

**Fecha:** 16 de septiembre de 2026  
**Rama auditada:** `main`  
**Sitio:** <https://hnk375561-lab.github.io/Sin-Frenos/>  
**Base path:** `/Sin-Frenos`

## Conclusión

El enlace **Comparar vehículo** era un 404 sistemático en las fichas porque apuntaba a `/comparar/{slug}`. Se corrigió para usar la página estática real `/comparar?v={slug}`, conservando `prefetch={false}`. Se agregó una prueba de regresión que renderiza `VehicleDetailLayout` y verifica ambos requisitos.

La auditoría del export estático generó **1.334 archivos HTML**. La extracción de navegación sobre `out/` terminó con **0 enlaces internos rotos** y **0 URLs del sitemap sin archivo correspondiente**. El sitemap contiene **844 URLs**.

El crawl posterior sobre GitHub Pages comprobó **844 de 844 páginas con HTTP 200** después de seguir redirecciones. El crawler encontró 3.324 destinos internos incluyendo recursos estáticos: 3.323 respondieron `200` y un recurso CSS antiguo respondió `404`. Ese recurso no es un link de navegación y no fue referenciado por las páginas servidas en la comprobación posterior; se deja registrado como observación de caché o asset stale, no como 404 de contenido.

## Hallazgos corregidos

| Página origen | Texto del link/botón | href actual antes del fix | Status HTTP real | Diagnóstico | Fix aplicado |
| --- | --- | --- | --- | --- | --- |
| `src/components/entities/VehicleDetailLayout.tsx` | Comparar vehículo | `/comparar/${vehicle.slug}` | 404 en export estático | `/comparar/[pair]` solo genera pares con formato `slugA-vs-slugB`; un slug individual no existe. | `/comparar?v=${encodeURIComponent(vehicle.slug)}`. Se conservó `prefetch={false}` y se agregó test de regresión. |
| `src/app/[entityType]/[slug]/page.tsx` | Categoría del vehículo | `/categorias/{categoría}` para cualquier clase distinta de `Otros` | 404 para Familiar, Monovolumen y Utilitario | `categoryPageHref` no conocía el umbral mínimo de `computeSeoCategoryOptions`; generaba rutas que no tenían `generateStaticParams()`. | La ficha ahora muestra el enlace solo cuando la categoría cruza el umbral SEO y tiene HTML en `out/`. |
| `src/app/vehiculos/[slug]/historial/page.tsx` | Ver fabricante | `vehicle.manufacturer.toLowerCase().replace(...)` | 404 para nombres con acentos o paréntesis, como Citroën y GWM (Haval) | La normalización local no coincidía con el slug canónico de fabricantes. | Se usa `slugifyManufacturer`, la misma utilidad canónica del hub y del sitemap. |
| `src/app/vehiculos/[slug]/historial/page.tsx` | Financiar este modelo | `/financiar/${vehicle.slug}` | 404 para vehículos sin precio USD válido | `/financiar/[slug]` solo genera modelos cuyo `parsePriceUsd()` es mayor que cero. | El CTA solo se renderiza cuando el vehículo tiene una ruta de financiación generada. |
| `src/app/vehiculos/[slug]/versiones/page.tsx` | Financiar este modelo | `/financiar/${vehicle.slug}` | 404 para Tesla Model 3 y otros vehículos sin precio USD válido | Mismo desajuste entre CTA y filtro de `generateStaticParams()`. | Se aplicó el mismo guard `parsePriceUsd() > 0`. |
| Export publicado | CSS de chunk `_next/static/chunks/27w57r73t0uyl.css` | Recurso estático referenciado durante el primer crawl | 404 durante el crawl; no es navegación | La URL corresponde a un hash de CSS que no está presente en el deploy actual. El índice y las páginas comprobadas después no lo referenciaron. | No se modificó código de navegación por este resultado; queda como observación de caché/asset stale para seguimiento independiente. |

## Build y correspondencia de rutas

El build se ejecutó con las mismas variables relevantes del workflow de GitHub Pages: `GITHUB_PAGES_BASE_PATH=/Sin-Frenos` y `NEXT_PUBLIC_SITE_URL=https://hnk375561-lab.github.io/Sin-Frenos`. Se generaron 1.334 archivos `.html` en `out/`, incluyendo las fichas de vehículos, fabricantes, guías, categorías, comparaciones fijas, rankings, historiales y versiones.

La comparación entre `src/app/sitemap.ts` y los archivos de `out/` produjo 844 URLs en el sitemap y **cero discrepancias**. No se encontraron URLs de `/test-supabase`, `/admin` ni rutas de grupos internos añadidas al sitemap. `/mapa` permanece fuera del sitemap como stub documentado.

La auditoría de base path comprobó las referencias generadas en HTML con prefijo `/Sin-Frenos`. El enlace corregido de comparación usa `next/link`, por lo que no introduce una ruta absoluta sin base path. No se detectaron usos de `window.location.href` que rompan el prefijo en la navegación auditada.

## Crawl de producción

El crawl final siguió redirecciones de GitHub Pages antes de comprobar cada destino. Los resultados fueron los siguientes:

| Grupo | Cantidad | Resultado |
| --- | ---: | --- |
| Páginas del sitemap | 844 | 844 con HTTP 200 |
| Destinos internos extraídos | 3.324 | 3.323 con HTTP 200; el único 404 fue un recurso CSS, no navegación |
| Destinos externos extraídos | 1.393 | 1.379 con HTTP 200; 14 respuestas bloqueadas, rate-limited o con timeout |

Las 14 respuestas externas no constituyen 404 internos del sitio. Diez dominios devolvieron `403`, uno `406`, uno `429` y dos no respondieron dentro del timeout o fallaron la conexión. Los destinos afectados fueron CarGurus, El Cero KM, Citroën Argentina, cuatro URLs de Fiat, FitFreak, dos páginas de Cars.com, Renault Argentina, Aire de Santa Fe, Ámbito y Perodua. Sus respuestas son compatibles con bloqueo anti-bot, limitación de frecuencia o indisponibilidad temporal; no se alteraron fuentes externas sin una fuente de reemplazo validada.

## Validaciones ejecutadas

Se ejecutaron `npm run type-check`, `npm run lint`, `npm test`, `npm run verify:content`, `npm run verify:relations`, `npm run verify:seo` y el `next build` estático completo. La suite terminó con **30 archivos de test y 463 tests aprobados**. ESLint terminó sin errores y mantuvo únicamente warnings preexistentes, principalmente recomendaciones de `next/image` y variables no utilizadas en archivos no modificados por este ticket.

El workflow de CI, el deploy de GitHub Pages y el smoke test posterior terminaron correctamente para `main`.

## Referencias

[1]: https://github.com/hnk375561-lab/Sin-Frenos "Repositorio Sin Frenos"
[2]: https://github.com/hnk375561-lab/Sin-Frenos/blob/main/.github/workflows/deploy-pages.yml "Workflow de deploy de GitHub Pages"
[3]: https://hnk375561-lab.github.io/Sin-Frenos/ "Sitio publicado de Sin Frenos"
