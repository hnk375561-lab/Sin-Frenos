/**
 * Reporte comparativo — pensado originalmente como primer canal que
 * cobra directo a la persona usuaria (no a un negocio/afiliado), vía
 * Mercado Pago Checkout Pro. Contexto completo en
 * `docs/monetizacion-plan.md` (sección "Reporte comparativo premium").
 *
 * ACTUALIZADO (migración a GitHub Pages, sitio 100% estático): el cobro
 * vía Mercado Pago Checkout Pro requería dos Route Handlers server-side
 * (`create-preference` y `pdf`) que no pueden existir en `output: 'export'`.
 * El PDF se genera hoy gratis, 100% client-side, con `buildPremiumReportPdf`
 * (`src/lib/pdf/build-premium-report.ts`, pdf-lib) — ver
 * `PremiumReportButton.tsx`. `PREMIUM_REPORT_PRICE_ARS` y
 * `buildExternalReference` de más abajo quedan sin uso real hasta que se
 * elija una pasarela de pago compatible con hosting estático (ej. un link
 * de pago hosteado por Mercado Pago sin backend propio, o volver a un
 * runtime con servidor).
 *
 * Qué vende hoy: el PDF con la comparación completa (specs + evidencia
 * citada) de 2 a 5 vehículos ya elegidos en `/comparar`, para
 * guardar/compartir/imprimir — gratis.
 *
 * Este archivo es intencionalmente el único lugar con el precio y el
 * mínimo/máximo de vehículos, para no tener el número de precio
 * duplicado entre el botón y el generador de PDF.
 */

export const PREMIUM_REPORT_PRICE_ARS = 990

/**
 * Link de pago hosteado de Mercado Pago (creado a mano en el panel de MP,
 * sin backend propio — ver docs/monetizacion-plan.md sección 2.13, "Opción
 * A"). Sin verificación automática: el flujo es "pagar → confirmar acá
 * mismo que se pagó → descargar", sistema de honestidad. Si Mercado Pago
 * requirió fecha de vencimiento al crearlo, hay que renovarlo antes de esa
 * fecha y actualizar este valor.
 */
export const PREMIUM_REPORT_PAYMENT_LINK = 'https://mpago.la/2KHmfn2'
export const PREMIUM_REPORT_MIN_VEHICLES = 2
export const PREMIUM_REPORT_MAX_VEHICLES = 5

/**
 * Referencia externa que Mercado Pago devuelve intacta en el objeto de
 * pago (`external_reference`). Se arma a partir de los slugs *ordenados*
 * (no como los eligió la persona) para que da lo mismo comparar
 * `[a, b]` que `[b, a]` — es el mismo reporte.
 */
export function buildExternalReference(slugs: string[]): string {
  return `premium-report:${normalizeSlugs(slugs).join('+')}`
}

export function normalizeSlugs(slugs: string[]): string[] {
  return Array.from(new Set(slugs.map((s) => s.trim()).filter(Boolean))).sort()
}

export function isValidSlugSelection(slugs: string[]): boolean {
  const normalized = normalizeSlugs(slugs)
  return normalized.length >= PREMIUM_REPORT_MIN_VEHICLES && normalized.length <= PREMIUM_REPORT_MAX_VEHICLES
}

/**
 * Confirma que un pago aprobado corresponde EXACTAMENTE a los slugs que
 * se están por descargar — sin esto, alguien podría pagar el reporte más
 * barato (2 autos) y reusar el `payment_id` aprobado para pedir el PDF de
 * una selección distinta vía `?slugs=`.
 */
export function externalReferenceMatchesSlugs(externalReference: string | null, slugs: string[]): boolean {
  if (!externalReference) return false
  return externalReference === buildExternalReference(slugs)
}
