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
 */
export const ListingReportSchema = z.object({
  id: z.string().uuid(),
  listing_id: z.string().uuid(),
  reporter_id: z.string().uuid().nullable(),
  reason: z.enum(Object.values(ListingReportReason) as [string, ...string[]]),
  details: z.string().max(1000).nullable(),
  status: z.enum(Object.values(ListingReportStatus) as [string, ...string[]]),
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
  reason: z.enum(Object.values(ListingReportReason) as [string, ...string[]],
    { message: 'Razón de reporte inválida' }),
  details: z.string().max(1000, 'Máximo 1000 caracteres en detalles').optional(),
})

export type CreateListingReportInput = z.infer<typeof CreateListingReportSchema>

/**
 * Esquema para actualizar estado de reporte (admin)
 */
export const UpdateListingReportSchema = z.object({
  status: z.enum(Object.values(ListingReportStatus) as [string, ...string[]]),
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
