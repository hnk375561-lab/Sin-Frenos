# Hotfix — CI roto por `react-hooks/set-state-in-effect`

## Qué pasó

Después de aplicar el zip de cierre de Fase 4, el CI falló en `npm run
lint` con 4 errores (no warnings) de la regla `react-hooks/set-state-in-effect`.
Esta regla marca cualquier `setState` llamado de forma SINCRÓNICA dentro
del cuerpo de un `useEffect` (fuera de un callback async tipo `.then()`),
porque obliga a React a un render extra antes de pintar.

**Importante:** los 4 archivos afectados NO son parte de la entrega de
Fase 4 — son código de fases anteriores (`ConditionForm.tsx` es de Fase 4
también pero ya existía antes de mi entrega; `StepCategoryCondition.tsx`,
`StepIdentification.tsx` y `StepLocation.tsx` son los steps 1, 2 y 5 que
ya estaban armados). Se me pasó no correr `eslint .` sobre el repo
completo antes de entregar el zip anterior — solo lo corrí sobre mis
archivos nuevos, que sí estaban limpios. Mi error, quedó corregido acá.

## Qué se corrigió en cada archivo

Ninguno de los 4 fixes usa `eslint-disable` — todos son el arreglo real
recomendado por la guía oficial de React ("You Might Not Need an Effect",
sección "Adjusting state when a prop changes"): mover el `setState` que
reacciona a un cambio de prop/dependencia para que corra DURANTE el
render (comparando contra un valor trackeado en estado), en vez de
dentro del `useEffect`.

- **`ConditionForm.tsx`** — el reset de `loading`/`questions` al cambiar
  `conditionId` pasó a hacerse durante el render. Dentro del efecto, el
  caso "sin condición" se unificó como una `Promise.resolve([])`, así
  TODOS los `setState` del efecto quedan dentro de un `.then()` real.
- **`StepCategoryCondition.tsx`** — se sacó un `setLoading(true)`
  redundante: el efecto corre una sola vez al montar (deps `[]`), y el
  `useState(true)` inicial ya cubre ese estado.
- **`StepIdentification.tsx`** — decidir si hay que buscar (`searching`)
  y limpiar sugerencias cuando el texto tiene menos de 2 caracteres pasó
  a resolverse durante el render, comparando `debouncedQuery` contra un
  valor trackeado. El efecto ahora solo dispara el fetch cuando
  corresponde, sin ningún `setState` sincrónico propio.
- **`StepLocation.tsx`** — la reconstrucción de `selectedProvincia` a
  partir de `draft.locationId` (para cuando el vendedor vuelve al paso 5
  con un valor ya elegido) pasó del `useEffect` al mismo patrón de
  render, trackeando tanto `locationId` como si `locations` ya cargó.

## Validación

- `npx eslint .` sobre el repo completo → **0 errores** (quedan los 2
  warnings preexistentes de `<img>` en `listings/ver/page.tsx`, que no
  bloquean el CI — no se tocaron, están fuera del alcance de esto).
- `npx tsc --noEmit` → 0 errores.
- `npx next build` → compiló limpio, mismas rutas que antes (incluida
  `/publicar`).

## Cómo aplicarlo

Descomprimir en la raíz del repo, sobreescribiendo los 4 archivos. Sin
cambios de dependencias, sin migraciones nuevas.
