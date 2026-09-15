# Cult Motion Audit — Sin Frenos

## Alcance

La auditoría se realizó aplicando exclusivamente las guías verificadas de la skill `ui-ux-pro-max` sobre motion y micro-interacciones. No se añadieron dependencias ni se modificaron datos, routing, fetching, layout estructural o contenido editorial.

## Inventario de superficies

| Superficie | Ubicación principal | Resultado |
|---|---|---|
| Scroll/mount reveal | `src/components/ui/Reveal.tsx`, `src/app/globals.css` | Ajustada |
| Stagger y delays de Reveal | usos `<Reveal>` en `src/app/**` y `src/components/**` | Revisada; se preservan valores de producto existentes |
| Chevron de `<details>` | `src/components/entities/EvidenceBlock.tsx` y otros detalles | Intacta |
| Hover/focus de links y botones | `src/app/globals.css`, componentes de cards y CTAs | Revisada; tokens globales preservados |
| Tap feedback | `.tap-scale` en `src/app/globals.css` | Ajustada para usar token de duración |
| Underline links | `.link-underline` en `src/app/globals.css` | Ajustada para usar token de duración |
| CTA shine | `.cta-shine` en `src/app/globals.css` | Ajustada de `left` a `transform` |
| Fade-in y breadcrumb motion | `.animate-fade-in` en `src/app/globals.css` | Ajustada a tokens/easing de entrada |
| Cue animado del hero | `.scroll-cue-arrow` en `src/app/globals.css` | Se detiene con reduced motion |
| Canvas/ambient hero background | componentes de hero y fondos ambientales | Intacta; no se encontró guía específica aplicable sin alterar comportamiento bespoke |
| `EntityHeaderBackground` | `src/components/entities/EntityHeaderBackground.tsx` | Intacta; no se encontró guía específica aplicable |
| Entity cards | `src/components/entities/EntityCard.tsx` | Intacta; ya tenía `motion-safe`, active/focus y `prefetch={false}` donde corresponde |
| Comparador animado | `src/components/comparar/CompareExplorer.tsx`, `AnimatedVehicleCompareTable.tsx` | Intacto; ya respeta reduced motion y feedback tap/hover |
| Entity gallery/lightbox | `src/components/entities/EntityGallery.tsx` | Intacta; navegación es manual, no auto-rotativa |
| Gallery explorer/lightbox | `src/components/gallery/GalleryExplorer.tsx`, `SimpleLightbox.tsx` | Intacta; no se encontró una mejora Cult específica sin cambiar alcance |
| Image reveal/loading | `src/components/ui/ImageReveal.tsx`, loading components | Revisada; estados y reserva de layout ya cumplen estabilidad de skeleton |
| Page transition/navigation | `PageTransitionBridge.tsx`, `smooth-scroll.ts` | Intacta; ya desactiva motion con reduced motion |
| Marketplace loading | `src/app/globals.css`, páginas marketplace | Intacta; loading continuo se reserva para feedback de espera |

## Change log

1. **Reveal** — Antes el hook siempre registraba `IntersectionObserver` y esperaba el observer o un fallback de 1.5 s; ahora consulta `prefers-reduced-motion` y entrega el estado final inmediatamente. Principios: *Reduced Motion* y *Motion Sensitivity*.
2. **Reveal entrance** — Antes usaba `0.6s var(--ease-standard)`; ahora usa `var(--dur-slow) var(--ease-premium)`, una entrada desacelerada y tokenizada. Principios: *Easing Functions* y *Duration Timing*.
3. **Tap scale** — Antes usaba `150ms` literal; ahora usa `var(--dur-fast)` manteniendo `ease-standard` para feedback inmediato. Principios: *Active States* y *Duration Timing*.
4. **Link underline** — Antes usaba `200ms` literal; ahora usa `var(--dur-base)` para mantener una escala compartida. Principios: *Hover States* y *Duration Timing*.
5. **CTA shine** — Antes animaba `left`, una propiedad costosa para repaints; ahora anima `transform: translateX(...)`. Principio: *Transform Performance*.
6. **Fade-in** — Antes usaba `0.6s var(--ease-standard)`; ahora usa `var(--dur-slow) var(--ease-premium)` para una llegada con deceleración. Principios: *Easing Functions* y *Duration Timing*.
7. **Scroll cue** — Antes era un loop decorativo infinito sin override específico; ahora se detiene completamente bajo reduced motion. Principios: *Continuous Animation* y *Reduced Motion*.

## Superficies deliberadamente intactas

Se dejaron intactos canvas/ambient background, `EntityHeaderBackground`, galerías manuales, lightboxes, comparador, page transitions, skeletons y chevrons de details porque ya tenían controles adecuados o porque la búsqueda Cult no devolvió una guía específica que justificara modificar su comportamiento sin convertir la tarea en una preferencia estética general. Las animaciones continuas de carga se conservaron porque la skill las reserva para feedback de espera.

También se preservaron todos los `prefetch={false}` existentes en links dentro de loops; no se modificó `EntityCard.tsx`.

## Verificación

- `npm install`: correcto; 0 vulnerabilidades. Se observaron warnings de engine por Node `v22.13.0`.
- `npm run type-check`: correcto.
- `npm run test`: correcto — 28 archivos, 458 tests.
- `npm run build`: correcto — `BUILD_EXIT=0`, 1.336 páginas estáticas generadas.
- Revisión manual homepage: correcta, sin errores de consola.
- Revisión manual `/vehiculos/audi-a4/`: DOM con título, Datos clave, Evidencia de la ficha, Rendimiento y Ficha técnica; sin errores de consola.

La ausencia de variables Supabase solo afecta features de marketplace autenticadas y no afecta catálogo técnico, comparador ni estas superficies de motion.
