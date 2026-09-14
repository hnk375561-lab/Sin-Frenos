import { z } from 'zod'

/**
 * Razones válidas para reportar un listing
 */
export const ListingReportReason = {
  PRECIO_ABSURDO: 'precio_absurdo',
  FOTOS_ROBADAS: 'fotos_robadas',
  SPAM: 'spam',
  DUPLICADO: 'duplicado',
  DATOS_ENGANOSOS: 'datos_enganosos',
  CONTACTO_INCORRECTO: 'contacto_incorrecto',
  OTRO: 'otro',
} as const

export type ListingReportReasonType = typeof ListingReportReason[keyof typeof ListingReportReason]

export const ReportReasonLabels: Record<ListingReportReasonType, string> = {
  precio_absurdo: 'Precio absurdo o sospechoso',
  fotos_robadas: 'Fotos robadas o falsas',
  spam: 'Spam o publicación duplicada',
  duplicado: 'Duplicado de otro listing',
  datos_enganosos: 'Datos engañosos o falsos',
  contacto_incorrecto: 'Contacto incorrecto o no responde',
  otro: 'Otro problema',
}

/**
 * Estados del reporte
 */
export const ListingReportStatus = {
  OPEN: 'open',
  REVIEWED: 'reviewed',
  DISMISSED: 'dismissed',
} as const

export type ListingReportStatusType = typeof ListingReportStatus[keyof typeof ListingReportStatus]

/**
 * Esquema Zod para validación de reporte
 *
 * FIX (corroboración de Fase 7, 13/09/2026): mismo problema que en
 * `src/types/moderation.ts` — los `z.enum(Object.values(...) as [string,
 * ...string[]])` de este archivo ensanchaban `reason`/`status` a `string`
 * genérico en vez de sus uniones literales reales, lo que rompía `tsc`
 * al conectar `@/types/supabase.ts` (que sí tipa esas columnas como
 * unión estricta). Se castea a `ListingReportReasonType`/
 * `ListingReportStatusType` en las 4 apariciones de este archivo — mismo
 * array de valores en runtime, tipo correcto en compile time.
 */
export const ListingReportSchema = z.object({
  id: z.string().uuid(),
  listing_id: z.string().uuid(),
  reporter_id: z.string().uuid().nullable(),
  reason: z.enum(Object.values(ListingReportReason) as [ListingReportReasonType, ...ListingReportReasonType[]]),
  details: z.string().max(1000).nullable(),
  status: z.enum(Object.values(ListingReportStatus) as [ListingReportStatusType, ...ListingReportStatusType[]]),
  created_at: z.string().datetime(),
  reviewed_at: z.string().datetime().nullable(),
  reviewed_by: z.string().uuid().nullable(),
})

export type ListingReport = z.infer<typeof ListingReportSchema>

/**
 * Esquema para crear un reporte (entrada)
 */
export const CreateListingReportSchema = z.object({
  listing_id: z.string().uuid('ID de listing inválido'),
  reason: z.enum(Object.values(ListingReportReason) as [ListingReportReasonType, ...ListingReportReasonType[]],
    { message: 'Razón de reporte inválida' }),
  details: z.string().max(1000, 'Máximo 1000 caracteres en detalles').optional(),
})

export type CreateListingReportInput = z.infer<typeof CreateListingReportSchema>

/**
 * Esquema para actualizar estado de reporte (admin)
 */
export const UpdateListingReportSchema = z.object({
  status: z.enum(Object.values(ListingReportStatus) as [ListingReportStatusType, ...ListingReportStatusType[]]),
  reviewed_by: z.string().uuid().optional(),
})

export type UpdateListingReportInput = z.infer<typeof UpdateListingReportSchema>

/**
 * Summary de reportes por listing (vista agregada pública para sellers)
 */
export const ListingReportsSummarySchema = z.object({
  listing_id: z.string().uuid(),
  total_reports: z.number().int().min(0),
  open_count: z.number().int().min(0),
  last_reported_at: z.string().datetime().nullable(),
})

export type ListingReportsSummary = z.infer<typeof ListingReportsSummarySchema>
