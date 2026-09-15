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

## Addendum — Round 2 Expanded / Hard Mode

La auditoría se repitió sobre el `main` actual después de `8ae0dd72`. Se reabrió la skill y se consultaron explícitamente *Progress Indicators*, *Loading Indicators*, *Loading States*, *Reduced Motion*, *Continuous Animation*, *Duration Timing*, *Easing Functions*, *Active States*, *Hover States*, *Hover vs Tap*, *Content Jumping* y *Motion Sensitivity*.

La skill no tiene un principio separado que formalice spinner funcional frente a shimmer: esto es un **gap de cobertura de la skill**, no una regla inventada. La decisión aplicada deriva de sus principios de loading y reduced motion: el spinner conserva una señal ralentizada, mientras el shimmer se vuelve estático para priorizar estabilidad.

Se corrigieron las tres transiciones restantes del bloque category: `.marketplace-category-card` usa `var(--dur-base)` para transform/shadow/filter, su pseudo-elemento usa `var(--dur-base)`, y `.marketplace-category-button` usa `var(--dur-fast) var(--ease-standard)` para fondo/borde. Son transiciones discretas de hover, no loops.

### Discrepancias de Round 1 reconciliadas

- **Marketplace skeleton reduced motion:** Round 1 afirmó estabilidad revisada sin abrir el bloque completo de Phase 3. Clasificación: **(b) inventario incompleto**, porque la skill sí cubre Reduced Motion, Content Jumping y Loading Indicators.
- **Marketplace spinner reduced motion:** Round 1 afirmó cobertura marketplace sin inventariar el spinner funcional. Clasificación: **(b) inventario incompleto**; la skill cubre Reduced Motion y Loading States, aunque no separa formalmente spinner de shimmer.
- **Category/footer/auth/dropzone/progress:** Round 1 no abrió todos los bloques contiguos. Clasificación: **(b) inventario incompleto**, no falta de principios.
- **Diferencia spinner/shimmer:** Clasificación: **(a) gap explícito de la skill**, porque no hay una entrada que defina formalmente ambos como categorías distintas.

### Re-grep exhaustivo y salida completa

Comando ejecutado sobre todos los `css`, `scss`, `module.css`, `tsx`, `jsx` y `ts` de `src`, excluyendo únicamente dependencias, `.next` y código generado:

```bash
rg -n --glob '*.{css,scss,module.css,tsx,jsx,ts}' \
  --glob '!node_modules/**' --glob '!.next/**' \
  --glob '!src/lib/generated/**' \
  '(transition[^;]*(\b[0-9]+ms\b|\b[0-9.]+s\b|\bease(-in-out|-in|-out)?\b|\blinear\b)|animation[^;]*(\b[0-9]+ms\b|\b[0-9.]+s\b|\bease(-in-out|-in|-out)?\b|\blinear\b)|duration-\[[^]]+\]|delay-\[[^]]+\]|transition-delay[^;]*\b[0-9]+ms\b|animation-delay[^;]*\b[0-9]+ms\b|framer-motion|motion\.[A-Za-z]+)' src
```

La salida completa guardada durante esta ejecución contiene 68 coincidencias:

```text
src/lib/hooks/useImageZoom.ts:204:      transition: isPanning ? 'none' : 'transform 220ms var(--ease-out-back, cubic-bezier(0.34,1.56,0.64,1))',
src/components/home/QuickSearchForm.tsx:131:        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-[#FF2E88] px-3.5 py-2 text-xs font-semibold text-[#171130] transition-[background-color,transform] duration-200 ease-out hover:bg-[#FF5BA3] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5BA3] focus-visible:ring-offset-2 sm:text-sm"
src/components/home/CommercialVehicleCard.tsx:63:              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
src/components/home/CatalogDocumentCard.tsx:46:          className="group relative z-10 bg-surface-card border border-border p-6 shadow-md transition-[transform,box-shadow] duration-300 ease-out [transform:rotate(var(--card-rotate))] hover:shadow-xl hover:[transform:rotate(0deg)_translateY(-4px)] motion-reduce:transition-none motion-reduce:hover:[transform:none]"
src/components/media/MediaCarousel.tsx:51:                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
src/components/home/ArchiveConsultations.tsx:92:                      'px-6 overflow-hidden transition-all duration-200 ease-in-out',
src/components/home/ArchiveClassifications.tsx:114:            transition: 'opacity 220ms ease-in-out',
src/components/comparar/CompareExplorer.tsx:4:import { motion, useReducedMotion } from 'framer-motion'
src/components/comparar/CompareExplorer.tsx:167:    <motion.button
src/components/comparar/CompareExplorer.tsx:184:    </motion.button>
src/components/comparar/AnimatedVehicleCompareTable.tsx:3:import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
src/components/comparar/AnimatedVehicleCompareTable.tsx:103:    <motion.div variants={rowVariants} className="min-h-[76px] border-t border-edge px-3 py-3">
src/components/comparar/AnimatedVehicleCompareTable.tsx:104:      <motion.div
src/components/comparar/AnimatedVehicleCompareTable.tsx:106:        transition={isWinner && !reducedMotion ? { duration: 0.42, ease: 'easeOut' } : undefined}
src/components/comparar/AnimatedVehicleCompareTable.tsx:117:      </motion.div>
src/components/comparar/AnimatedVehicleCompareTable.tsx:118:    </motion.div>
src/components/comparar/AnimatedVehicleCompareTable.tsx:138:    <motion.div variants={rowVariants} className="min-h-[58px] border-t border-edge px-3 py-3">
src/components/comparar/AnimatedVehicleCompareTable.tsx:144:    </motion.div>
src/components/comparar/AnimatedVehicleCompareTable.tsx:182:    <motion.div
src/components/comparar/AnimatedVehicleCompareTable.tsx:206:      <motion.div variants={rowContainerVariants} initial="hidden" animate="visible" className="contents">
src/components/comparar/AnimatedVehicleCompareTable.tsx:247:      </motion.div>
src/components/comparar/AnimatedVehicleCompareTable.tsx:248:    </motion.div>
src/components/comparar/AnimatedVehicleCompareTable.tsx:295:        visible: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.24, ease: 'easeOut' } },
src/components/comparar/AnimatedVehicleCompareTable.tsx:296:        exit: { opacity: 0, scale: 0.96, x: -14, transition: { duration: 0.16, ease: 'easeIn' } },
src/components/comparar/AnimatedVehicleCompareTable.tsx:300:    : { hidden: { opacity: 0, y: 5 }, visible: { opacity: 1, y: 0, transition: { duration: 0.16, ease: 'easeOut' } } }
src/app/globals.css:232:  transition: opacity var(--dur-slow) var(--ease-premium), transform var(--dur-slow) var(--ease-premium);
src/app/globals.css:233:  transition-delay: var(--reveal-delay, 0ms);
src/app/globals.css:243:  transition: transform var(--dur-fast) var(--ease-standard);
src/app/globals.css:264:  transition: width var(--dur-base) var(--ease-standard);
src/app/globals.css:295:  transition: transform var(--dur-slow) var(--ease-premium);
src/app/globals.css:316:  animation: fadeIn var(--dur-slow) var(--ease-premium) both;
src/app/globals.css:340:    animation-duration: 0.01ms !important;
src/app/globals.css:342:    transition-duration: 0.01ms !important;
src/app/globals.css:385:  animation: scrollCueMove 1.8s var(--ease-standard) infinite;
src/app/globals.css:420:  transition: transform 250ms var(--ease-standard), box-shadow 250ms var(--ease-standard);
src/app/globals.css:492:  transition: transform 700ms var(--ease-standard);
src/app/globals.css:529:  animation: cardMediaFallbackSweep 5s ease-in-out infinite;
src/app/globals.css:717:  transition: background-color var(--dur-fast) var(--ease-premium), border-color var(--dur-fast) var(--ease-premium), color var(--dur-fast) var(--ease-premium), transform var(--dur-fast) var(--ease-premium);
src/app/globals.css:745:  transition: color var(--dur-fast) var(--ease-premium), gap var(--dur-fast) var(--ease-premium);
src/app/globals.css:753:  transition: transform var(--dur-base) var(--ease-premium), box-shadow var(--dur-base) var(--ease-premium);
src/app/globals.css:816:  transition: background-color var(--dur-fast) var(--ease-premium), border-color var(--dur-fast) var(--ease-premium), color var(--dur-fast) var(--ease-premium), transform var(--dur-fast) var(--ease-premium);
src/app/globals.css:849:  animation: marketplaceSkeleton 1.5s ease-in-out infinite;
src/app/globals.css:889:  transition: transform var(--dur-fast) var(--ease-premium), border-color var(--dur-fast) var(--ease-premium), background-color var(--dur-fast) var(--ease-premium), box-shadow var(--dur-fast) var(--ease-premium);
src/app/globals.css:930:  transition: transform var(--dur-base) var(--ease-premium), box-shadow var(--dur-base) var(--ease-premium), filter var(--dur-base) var(--ease-premium);
src/app/globals.css:941:  transition: transform var(--dur-base) var(--ease-premium);
src/app/globals.css:951:.marketplace-category-button { display: inline-flex; width: fit-content; align-items: center; gap: .55rem; border: 1px solid rgba(255,255,255,.42); border-radius: 9999px; padding: .75rem 1rem; font-size: .8rem; font-weight: 800; background: rgba(0,0,0,.12); transition: background-color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard); }
src/app/globals.css:969:.marketplace-footer-action-link { color: #fff; font-size: 1.15rem; font-weight: 750; letter-spacing: -.02em; transition: color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard); }
src/app/globals.css:971:.marketplace-footer-explore a { color: rgba(255,255,255,.6); font-size: .9rem; transition: color var(--dur-fast) var(--ease-standard); }
src/app/globals.css:975:.marketplace-footer-fine-print a { color: rgba(255,255,255,.4); font-size: .75rem; transition: color var(--dur-fast) var(--ease-standard); }
src/app/globals.css:976:.marketplace-footer-top { display: inline-flex; align-items: center; gap: .5rem; border: 1px solid rgba(255,255,255,.2); border-radius: 9999px; padding: .7rem 1rem; color: rgba(255,255,255,.7); font-size: .8rem; font-weight: 700; transition: border-color var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard); }
src/app/globals.css:995:.marketplace-auth-primary { display: inline-flex; align-items: center; justify-content: center; gap: .55rem; border-radius: 9999px; background: #FF2E88; padding: .9rem 1.2rem; color: #171130; font-size: .9rem; font-weight: 800; transition: transform var(--dur-fast) var(--ease-premium), background-color var(--dur-fast) var(--ease-premium); }
src/app/globals.css:1010:.marketplace-auth-spinner { width: 3rem; height: 3rem; margin: 0 auto 1rem; border: 4px solid #E8D7FF; border-top-color: #FF2E88; border-radius: 50%; animation: marketplace-spin 800ms linear infinite; }
src/app/globals.css:1029:.marketplace-wizard-progress-bar span { display: block; height: 100%; border-radius: inherit; background: #FF2E88; transition: width var(--dur-base) linear; }
src/app/globals.css:1033:.marketplace-photo-dropzone { display: flex; min-height: 11rem; cursor: pointer; flex-direction: column; align-items: center; justify-content: center; gap: .6rem; border: 2px dashed #23D9FF; border-radius: 1.5rem; background: #F0EBFF; padding: 1.5rem; text-align: center; transition: background-color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard); }
src/app/globals.css:1047:.marketplace-skeleton { background: linear-gradient(90deg, #ECE7FA 25%, #F0EBFF 50%, #ECE7FA 75%); background-size: 200% 100%; animation: marketplace-skeleton-shift 1.3s ease-in-out infinite; }
src/app/globals.css:1052:    animation-duration: 1400ms;
src/components/entities/VehicleCardV2.tsx:145:          <div className="absolute inset-0 scale-100 transition-transform duration-300 ease-out motion-reduce:transition-none group-hover/v2card:scale-[1.03] motion-reduce:group-hover/v2card:scale-100">
src/components/entities/VehicleCardV2.tsx:224:                <p className="mb-0.5 max-h-0 overflow-hidden whitespace-nowrap text-[9.5px] font-medium uppercase tracking-wide text-white/0 opacity-0 transition-all duration-300 ease-out group-hover/v2card:max-h-4 group-hover/v2card:text-white/45 group-hover/v2card:opacity-100">
src/components/entities/StatBar.tsx:22:            className="h-full rounded-full bg-gradient-to-r from-auto-accent to-auto-accent-orange transition-[width] duration-700 ease-[var(--ease-premium)]"
src/components/entities/ManufacturerCardV2.tsx:77:          <div className="relative flex flex-1 items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_70%)] px-8 py-6 transition-transform duration-300 ease-out motion-reduce:transition-none group-hover/mv2card:scale-[1.02] motion-reduce:group-hover/mv2card:scale-100">
src/components/entities/ManufacturerCardV2.tsx:127:              <p className="max-h-0 overflow-hidden text-[10px] font-medium text-white/0 opacity-0 transition-all duration-300 ease-out group-hover/mv2card:max-h-4 group-hover/mv2card:text-white/45 group-hover/mv2card:opacity-100">
src/components/entities/EntityCard.tsx:350:          <article className="group/card relative flex min-h-[148px] h-full w-full overflow-hidden border border-border bg-surface-card ring-1 ring-transparent motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:scale-[1.03] motion-safe:has-[:focus-visible]:scale-[1.03] motion-safe:hover:shadow-2xl motion-safe:has-[:focus-visible]:shadow-2xl hover:border-oxide-red/50 hover:ring-2 hover:ring-oxide-red/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-oxide-red/40">
src/components/entities/EntityCard.tsx:352:              <div className="absolute inset-0 motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover/card:scale-[1.08] motion-safe:group-has-[:focus-visible]/card:scale-[1.08]">
src/components/entities/EntityCard.tsx:418:              'motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:scale-[1.03] motion-safe:has-[:focus-visible]:scale-[1.03] motion-safe:hover:shadow-2xl motion-safe:has-[:focus-visible]:shadow-2xl hover:border-oxide-red/50 hover:ring-2 hover:ring-oxide-red/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-oxide-red/40'
src/components/entities/EntityCard.tsx:429:                <div className="absolute inset-0 motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover/card:scale-[1.08] motion-safe:group-has-[:focus-visible]/card:scale-[1.08]">
src/components/entities/EntityCard.tsx:589:        <Card className="group/card h-full border border-border ring-1 ring-transparent motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:scale-[1.03] motion-safe:has-[:focus-visible]:scale-[1.03] motion-safe:hover:shadow-2xl motion-safe:has-[:focus-visible]:shadow-2xl hover:border-oxide-red/50 hover:ring-2 hover:ring-oxide-red/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-oxide-red/40">
src/components/entities/EntityCard.tsx:593:                <div className="absolute inset-0 motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover/card:scale-[1.08] motion-safe:group-has-[:focus-visible]/card:scale-[1.08]">
```

Las coincidencias restantes fueron clasificadas individualmente como zoom/pan, disclosure, cards con `motion-reduce`, barras de datos, loops funcionales, overrides de accesibilidad o Framer Motion. No se aplicó sustitución mecánica de tokens CSS a duraciones JS de Framer Motion.

### Link/prefetch guard

Se re-grepearon `<Link>` y `.map()` en `src`. No se añadió `prefetch={false}` a ningún Link dentro de loops y no se modificó ningún enlace por efecto lateral.

### Verificación y límites manuales

Se repetirán antes del commit `npm install`, `npm run type-check`, `npm run test` y `npm run build` completos. Las revisiones manuales cubren homepage, `/vehiculos/audi-a4/`, auth, listings y wizard `/publicar/`. El browser sandbox no expone emulación OS-level de `prefers-reduced-motion`; por tanto se reporta honestamente la comprobación temporal de override CSS, no como toggle del sistema: spinner `0.8s` → `1.4s` conservando `marketplace-spin`, skeleton `animation: none` y posición estática. La inyección fue eliminada inmediatamente.
