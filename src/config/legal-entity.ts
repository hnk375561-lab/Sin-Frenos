/**
 * Identidad legal del operador. Nunca completar estos valores con datos inventados.
 * Deben configurarse en el entorno de producción antes de habilitar operaciones
 * comerciales del marketplace.
 */
export const LEGAL_ENTITY = {
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME || null,
  taxId: process.env.NEXT_PUBLIC_LEGAL_TAX_ID || null,
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || null,
  contactEmail: 'uruspotcdu@gmail.com',
} as const

if (!LEGAL_ENTITY.legalName || !LEGAL_ENTITY.taxId || !LEGAL_ENTITY.address) {
  console.warn('[legal] Faltan NEXT_PUBLIC_LEGAL_NAME, NEXT_PUBLIC_LEGAL_TAX_ID o NEXT_PUBLIC_LEGAL_ADDRESS. Configurarlos antes de habilitar el marketplace en producción.')
}
