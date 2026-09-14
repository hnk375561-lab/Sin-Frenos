/**
 * Clases Tailwind compartidas entre todos los pasos del wizard de
 * publicación (`/publicar`).
 *
 * Convención tomada de `src/components/monetization/SellVehicleLeadForm.tsx`
 * (el formulario de referencia que ya existe en el repo), no inventada:
 * mismos tokens de color (`border-edge`, `bg-surface-card`,
 * `bg-surface-input`, `auto-accent`/`auto-accent-strong`), mismo radio
 * (`rounded-md`), mismos estados de foco/disabled. Esos tokens son
 * variables CSS que ya cambian solas con `.dark` (ver `src/app/globals.css`)
 * — por eso ningún string de acá lleva prefijo `dark:`, igual que en el
 * formulario de referencia: agregar `dark:` encima sería duplicar un
 * mecanismo que el propio token ya resuelve.
 *
 * Objetivo de centralizar esto en un solo archivo: el wizard tiene 8
 * pasos (sección 6 del documento maestro) que van a repetir el mismo
 * input/label/botón una y otra vez — sin este archivo, cualquier ajuste
 * de estilo futuro exigiría tocar 8 componentes distintos.
 */

export const formStyles = {
  /** Contenedor de cada paso del wizard — mismo card que SellVehicleLeadForm. */
  stepCard: 'rounded-2xl border border-[#dce5e9] bg-white p-4 sm:p-6',

  stepTitle: 'mb-1 text-lg font-semibold tracking-[-0.02em] text-[#13202a]',
  stepDescription: 'mb-4 text-sm text-[#62717a]',

  fieldGroup: 'space-y-2',
  label: 'block text-sm font-semibold text-[#13202a]',
  helperText: 'text-xs text-[#71808a]',
  errorText: 'text-xs font-medium text-red-500',

  /** Base de <input>/<select>/<textarea> — calcada de SellVehicleLeadForm. */
  input:
    'w-full rounded-xl border border-[#dce5e9] bg-white px-3.5 py-2.5 text-sm text-[#13202a] transition duration-200 focus:border-[#ff6b47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b47]/20',

  /** Mismo input, con el borde en rojo cuando el campo tiene un error de validación. */
  inputError:
    'w-full rounded-md border border-red-400 bg-surface-input px-3 py-2 text-sm transition duration-200 focus:border-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400',

  select:
    'w-full rounded-xl border border-[#dce5e9] bg-white px-3.5 py-2.5 text-sm text-[#13202a] transition duration-200 focus:border-[#ff6b47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b47]/20 disabled:cursor-not-allowed disabled:opacity-50',

  textarea:
    'w-full rounded-xl border border-[#dce5e9] bg-white px-3.5 py-2.5 text-sm text-[#13202a] transition duration-200 focus:border-[#ff6b47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b47]/20',

  /** Botón principal ("Siguiente", "Publicar") — calcado del submit de SellVehicleLeadForm. */
  primaryButton:
    'rounded-full bg-[#ff6b47] px-5 py-2.5 text-sm font-semibold text-[#10171c] transition duration-200 hover:bg-[#ff8b6d] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b47] focus-visible:ring-offset-2',

  /** Botón secundario ("Volver", "Omitir") — mismo tamaño/radio que el primario, sin relleno. */
  secondaryButton:
    'rounded-full border border-[#cbd7dc] bg-white px-5 py-2.5 text-sm font-semibold text-[#40505a] transition duration-200 hover:border-[#9aaab2] hover:bg-[#f4f6f7] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b47] focus-visible:ring-offset-2',

  /** Barra de navegación inferior común a los 8 pasos (Volver / Siguiente). */
  navRow: 'mt-6 flex items-center justify-between gap-3',

  /** Tarjeta seleccionable grande (paso 1: categoría/condición con imagen — sección 5 y 6). */
  selectableCard:
    'flex w-full flex-col items-start gap-1 rounded-lg border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auto-accent focus-visible:ring-offset-2',
  selectableCardIdle: 'border-edge bg-surface-card hover:bg-surface-card-hover',
  selectableCardSelected: 'border-auto-accent bg-auto-accent/5',
  selectableCardDisabled: 'cursor-not-allowed border-edge bg-surface-alt/50 opacity-60',
} as const

/**
 * Badge de severidad para condiciones (sección 4.6: 'normal'/'atencion'/
 * 'grave', pensado para "evitar mezclar visualmente 'excelente estado'
 * con 'no arranca'"). Deliberadamente NO reusa `Badge.tsx` (pensado para
 * cards sobre fondo oscuro, `text-emerald-300` etc. — acá los pasos del
 * wizard son formularios sobre `surface-card` claro, necesitan contraste
 * inverso) — mismo criterio de "no forzar un componente a un contexto
 * visual para el que no fue pensado".
 */
export const severityBadgeClasses: Record<'normal' | 'atencion' | 'grave', string> = {
  normal: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  atencion: 'border border-amber-200 bg-amber-50 text-amber-700',
  grave: 'border border-red-200 bg-red-50 text-red-700',
}

export const severityBadgeBaseClass =
  'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide'
