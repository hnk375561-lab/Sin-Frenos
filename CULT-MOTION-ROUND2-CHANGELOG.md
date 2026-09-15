# Cult Motion Audit — Sin Frenos — Round 2

## Alcance

Esta ronda continúa la auditoría Cult UX/UI de motion iniciada en Round 1. El objetivo específico fue revisar la sección completa de marketplace de `src/app/globals.css`, corregir sus transiciones literales y resolver el tratamiento de reduced motion para spinner y skeleton, sin tocar layout, copy, datos, routing ni enlaces. No se agregaron dependencias.

## Principios Cult verificados

Las búsquedas se realizaron en `ux-guidelines.csv` con la skill `ui-ux-pro-max`.

| Caso | Principio Cult | Aplicación |
|---|---|---|
| Progress bar determinate | *Progress Indicators* y *Loading Indicators* | El avance debe estar representado y la carga debe preservar foco y estado; la transición de anchura usa `var(--dur-base) linear` porque representa progreso real, no una entrada decorativa con aceleración. |
| Spinner funcional | *Continuous Animation*, *Reduced Motion* y *Loading States* | Los loops continuos se reservan para loading; el spinner no se elimina con reduced motion porque comunica que el sistema está trabajando. Se ralentiza de 800ms a 1400ms. |
| Skeleton funcional | *Reduced Motion*, *Content Jumping*, *Loading Indicators* y *Loading States* | El skeleton conserva su espacio estable y su función de placeholder; bajo reduced motion se elimina el shimmer y se deja un estado estático, evitando movimiento no esencial sin perder feedback de carga. |
| CTA primaria | *Active States*, *Hover States* y *Hover vs Tap* | Se conserva un hover elevado sutil, se tokeniza su duración y se agrega feedback de press `translateY(0) scale(.98)`. La acción no depende solo del hover. |
| Footer/category/dropzone | *Duration Timing*, *Hover States* y *Active States* | Las transiciones discretas usan tokens compartidos y mantienen feedback inmediato. |

La skill también advierte que no existe una duración universal de 150–300ms: por eso no se aplicó un reemplazo mecánico a loops funcionales, Framer Motion o animaciones de media ya deliberadamente diferenciadas.

## Change log por superficie

1. **Marketplace button** — Antes: `180ms var(--ease-premium)` en color, borde y transform. Después: `var(--dur-fast) var(--ease-premium)`. Principios: *Duration Timing*, *Hover States* y *Active States*. Es feedback discreto de interacción, por lo que usa el token rápido.
2. **Marketplace text link** — Antes: `180ms var(--ease-premium)` para color y gap. Después: `var(--dur-fast) var(--ease-premium)`. Principios: *Hover States* y *Duration Timing*. El cambio sigue siendo inmediato sin tocar el desplazamiento del gap.
3. **Commercial vehicle card** — Antes: `220ms var(--ease-premium)` para transform y shadow. Después: `var(--dur-base) var(--ease-premium)`. Principios: *Hover States* y *Duration Timing*. Es una elevación de card con dos propiedades y se conserva una duración base, no el token rápido de un link.
4. **Marketplace home CTA** — Antes: `180ms var(--ease-premium)` para color, borde y transform. Después: `var(--dur-fast) var(--ease-premium)`. Principios: *Primary CTA Feedback*, *Hover States* y *Active States*. Mantiene el feedback visual y la escala de press existente.
5. **Marketplace category card** — Antes: `180ms var(--ease-premium)` para transform, borde, fondo y shadow. Después: `var(--dur-fast) var(--ease-premium)`. Principios: *Hover States* y *Duration Timing*. Es una tarjeta navegable; el movimiento de elevación sigue siendo sutil y rápido.
6. **Marketplace footer action link** — Antes: `color 180ms ease, transform 180ms ease`. Después: `color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)`. Principios: *Hover States* y *Duration Timing*. Se eliminó el easing genérico y se conservó el desplazamiento de 4px.
7. **Marketplace footer explore links** — Antes: `color 180ms ease`. Después: `color var(--dur-fast) var(--ease-standard)`. Principios: *Hover States* y *Duration Timing*. Solo hay cambio de color, así que no se añadió movimiento adicional.
8. **Marketplace footer fine-print links** — Antes: `color 180ms ease`. Después: `color var(--dur-fast) var(--ease-standard)`. Principios: *Hover States* y *Duration Timing*. Se mantiene un feedback mínimo para enlaces secundarios.
9. **Marketplace footer-top** — Antes: `border-color 180ms ease, color 180ms ease`. Después: ambas propiedades usan `var(--dur-fast) var(--ease-standard)`. Principios: *Hover States* y *Duration Timing*. Es un control de retorno; no se añadió elevación ni escala.
10. **Marketplace auth primary** — Antes: `transform 180ms ease, background 180ms ease`, con hover `translateY(-2px)` y sin press explícito. Después: `var(--dur-fast) var(--ease-premium)` y `:active { transform: translateY(0) scale(.98); }`. Principios: *Primary CTA Feedback*, *Active States*, *Hover States* y *Hover vs Tap*. El hover elevado es una señal deliberada de acción primaria; el press devuelve el eje y agrega compresión breve para que touch no dependa de hover.
11. **Marketplace auth spinner** — Antes: `800ms linear infinite` sin reduced-motion específico. Después: se conserva `800ms linear infinite` en modo normal, porque la rotación lineal comunica trabajo continuo; bajo reduced motion usa `animation-duration: 1400ms`. Principios: *Continuous Animation*, *Reduced Motion* y *Loading States*. No se detuvo por completo porque un círculo estático puede perder la señal de que el sistema sigue procesando.
12. **Wizard progress bar** — Antes: `width 250ms ease`. Después: `width var(--dur-base) linear`. Principios: *Progress Indicators*, *Loading Indicators* y *Duration Timing*. `linear` representa mejor una anchura que sigue progreso determinate; no se usa el easing de una CTA porque no es una entrada decorativa.
13. **Photo dropzone** — Antes: `background 180ms ease, border-color 180ms ease`. Después: `background-color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)`. Principios: *Hover States*, *Active States* y *Duration Timing*. Se conserva el feedback de hover y se corrige la propiedad a `background-color` explícita.
14. **Marketplace skeleton** — Antes: shimmer `1.3s ease-in-out infinite` sin override para `.marketplace-skeleton`. Después: se conserva el shimmer en modo normal para comunicar carga; bajo reduced motion se aplica `animation: none` y `background-position: 50% 0`. Principios: *Skeleton Loading*, *Reduced Motion*, *Content Jumping* y *Loading Indicators*. El placeholder sigue ocupando exactamente el mismo espacio y deja de moverse cuando el usuario pide menos movimiento.

## Discrepancies found in Round 1's inventory

Round 1 afirmó que “Image reveal/loading” y “Marketplace loading” habían sido revisados y que los skeletons cumplían estabilidad. Esa afirmación fue incompleta: el inventario no abrió ni clasificó los bloques marketplace situados después de `/* === MARKETPLACE PHASE 3: PRODUCT JOURNEY === */` y los bloques footer/category anteriores.

En concreto, Round 1 no detectó:

- `.marketplace-auth-spinner` con loop infinito `800ms linear` sin tratamiento reduced-motion.
- `.marketplace-skeleton` con shimmer infinito `1.3s ease-in-out` sin tratamiento reduced-motion.
- Ocho familias de transiciones marketplace con `180ms ease` o `180ms var(--ease-premium)` sin tokens.
- La progress bar con `250ms ease`, que requería una decisión específica de indicador determinate en lugar de un reemplazo genérico.
- La CTA auth con hover `translateY(-2px)` sin estado press explícito.

La discrepancia fue un fallo real de cobertura del inventario, no una conclusión distinta de la skill. La corrección queda registrada aquí para no presentar como “revisada” una superficie que no se abrió y comprobó.

## Re-grep completo después de Round 2

Comando ejecutado sobre `globals.css` y todos los `.tsx/.ts/.css`:

```bash
rg -n --glob '*.css' --glob '*.tsx' --glob '*.ts' \\
  --glob '!node_modules/**' --glob '!.next/**' \\
  --glob '!src/lib/generated/**' \\
  '(transition[^;]*(\\b[0-9]+ms\\b|\\b[0-9.]+s\\b|\\bease(-in-out|-in|-out)?\\b|\\blinear\\b)|animation[^;]*(\\b[0-9]+ms\\b|\\b[0-9.]+s\\b|\\bease(-in-out|-in|-out)?\\b|\\blinear\\b)|duration-\\[[^]]+\\]|delay-\\[[^]]+\\])'
```

Timings literales remanentes, clasificados y deliberadamente no tokenizados:

```text
src/lib/hooks/useImageZoom.ts:204 — transform 220ms con cubic-bezier ease-out-back; zoom/pan físico específico.
src/app/globals.css:233 — transition-delay var(--reveal-delay, 0ms); delay configurable por stagger, no duración de interacción.
src/app/globals.css:340,342 — 0.01ms global en prefers-reduced-motion; override de accesibilidad que debe ser mínimo.
src/app/globals.css:385 — scrollCueMove 1.8s; cue decorativo ya detenido bajo reduced motion en Round 1.
src/app/globals.css:420 — lift-on-hover 250ms; superficie global existente con su propio tratamiento reduced-motion.
src/app/globals.css:492 — transición 700ms de barra/indicador existente; no pertenece al marketplace auditado.
src/app/globals.css:529 — cardMediaFallbackSweep 5s ease-in-out; estado sin foto, no skeleton, ya detenido bajo reduced motion.
src/app/globals.css:849 — marketplaceSkeleton 1.5s ease-in-out; shimmer de otro bloque marketplace, ya tiene override reduced-motion existente y conserva su ciclo funcional.
src/app/globals.css:930 — marketplace category card secundaria 220ms; superficie previamente existente fuera del bloque primario auditado.
src/app/globals.css:941 — transición 320ms de proceso/step existente; no se cambió sin una guía específica adicional.
src/app/globals.css:1010 — marketplace-auth-spinner 800ms linear infinite; ciclo funcional, no se mezcla con tokens de hover.
src/app/globals.css:1047 — marketplace-skeleton-shift 1.3s ease-in-out infinite; ciclo de shimmer funcional, se detiene bajo reduced motion.
src/app/globals.css:1052 — reduced-motion spinner 1400ms; reducción deliberada del ciclo funcional.
src/components/media/MediaCarousel.tsx:51 — Tailwind duration-500 ease-out; entrada/hover de imagen con motion-reduce.
src/components/home/QuickSearchForm.tsx:131 — Tailwind duration-200 ease-out; feedback del buscador con active scale.
src/components/home/CommercialVehicleCard.tsx:63 — Tailwind duration-500 ease-out; hover de imagen con motion-reduce.
src/components/comparar/AnimatedVehicleCompareTable.tsx:106 — Framer Motion duration 0.42 easeOut; ganador de comparación.
src/components/comparar/AnimatedVehicleCompareTable.tsx:295 — Framer Motion duration 0.24 easeOut; entrada de columna.
src/components/comparar/AnimatedVehicleCompareTable.tsx:296 — Framer Motion duration 0.16 easeIn; salida de columna.
src/components/comparar/AnimatedVehicleCompareTable.tsx:300 — Framer Motion duration 0.16 easeOut; fila de especificación.
src/components/home/ArchiveConsultations.tsx:92 — Tailwind duration-200 ease-in-out; disclosure de archivo.
src/components/home/ArchiveClassifications.tsx:114 — inline opacity 220ms ease-in-out; disclosure de clasificación.
src/components/home/CatalogDocumentCard.tsx:46 — Tailwind duration-300 ease-out; hover de documento con motion-reduce.
src/components/entities/EntityCard.tsx:350/352/418/429/589/593 — Tailwind 300/500ms ease-out; cards ya protegidas con `motion-safe` y estados focus, sin cambio de alcance.
src/components/entities/StatBar.tsx:22 — Tailwind duration-700 con ease-premium; barra de datos no marketplace.
src/components/entities/VehicleCardV2.tsx:145/224 — Tailwind duration-300 ease-out; cards ya tienen motion-reduce.
src/components/entities/ManufacturerCardV2.tsx:77/127 — Tailwind duration-300 ease-out; cards ya tienen motion-reduce.
```

No quedan los literales originalmente identificados en footer, auth primary, photo dropzone ni progress bar.

## Superficies deliberadamente intactas

Se dejaron intactos `EntityCard`, `VehicleCardV2`, `ManufacturerCardV2`, `MediaCarousel`, `CommercialVehicleCard`, `CatalogDocumentCard`, `StatBar`, `ArchiveConsultations`, `ArchiveClassifications`, `useImageZoom`, las transiciones Framer Motion del comparador y el `marketplaceSkeleton` de Phase 2 porque cuentan con reduced-motion propio, pertenecen a otra categoría de interacción o requieren una decisión de producto fuera del objetivo de esta ronda. No se modificó ningún `<Link>` ni ningún `prefetch={false}` dentro de `.map()`.

## Verificación

### Instalación

```text
npm install
up to date, audited 639 packages in 1s
found 0 vulnerabilities
```

Se observaron únicamente warnings `EBADENGINE` por Node `v22.13.0` frente a requisitos de paquetes; no hubo cambios de dependencias.

### Type-check, tests y build

```text
===== npm run type-check =====
> sinfrenos@0.1.2 type-check
> tsc --noEmit

===== npm run test =====
Test Files  28 passed (28)
Tests       458 passed (458)

===== npm run build =====
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages using 5 workers (1336/1336)
○ (Static) prerendered as static content
● (SSG) prerendered as static HTML
===== VERIFICATION_EXIT=0 =====
```

El build mostró las advertencias preexistentes de Supabase ausente; solo afectan marketplace autenticado y no provocaron fallo de compilación.

### Revisión manual

- Homepage: cargó correctamente en el export final.
- `/vehiculos/audi-a4/`: el DOM presentó `Audi A4`, `Datos clave`, `Evidencia de la ficha`, `Rendimiento` y `Ficha técnica`; sin errores de consola.
- `/ingresar/`: formulario de email y CTA `Enviar link de acceso ↗` visibles; la CTA primaria se renderizó correctamente.
- `/listings/`: estado `Preparando el marketplace…` visible con espacio estable y footer correcto.
- `/publicar/`: estado `Preparando tu publicación` visible con spinner funcional; la ruta no presentó errores de consola.
- Console: no se registraron errores JavaScript en las rutas revisadas.

El navegador disponible no expuso una herramienta de emulación OS-level de `prefers-reduced-motion`. Por ello se documenta la comprobación manual reproducible disponible: `window.matchMedia('(prefers-reduced-motion: reduce)').matches` devolvió `false` en el entorno normal; al aplicar temporalmente el mismo override CSS reduced-motion, el spinner pasó de `0.8s` a `1.4s` manteniendo `animationName: marketplace-spin`, y la regla de skeleton aplicada fue `animation: none` con `background-position: 50% 0`. La inyección fue eliminada inmediatamente y no modificó el repositorio. El CSS fuente contiene los overrides reales dentro de `@media (prefers-reduced-motion: reduce)`.
