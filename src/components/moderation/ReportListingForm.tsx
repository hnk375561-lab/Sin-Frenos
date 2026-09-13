'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { createListingReport } from '@/lib/moderation/reports'
import { CreateListingReportInput, ListingReportReason, ReportReasonLabels } from '@/types/listing-report'
import { Database } from '@/types/supabase'

interface ReportListingFormProps {
  listingId: string
  onSuccess?: () => void
  onError?: (error: Error) => void
  className?: string
}

export function ReportListingForm({
  listingId,
  onSuccess,
  onError,
  className = '',
}: ReportListingFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reason, setReason] = useState<string>('')
  const [details, setDetails] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const input: CreateListingReportInput = {
        listing_id: listingId,
        reason: reason as typeof ListingReportReason[keyof typeof ListingReportReason],
        details: details || undefined,
      }

      await createListingReport(supabase, input)
      setSuccess(true)
      setReason('')
      setDetails('')

      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
      }, 2000)

      onSuccess?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al enviar reporte'
      setError(message)
      onError?.(err instanceof Error ? err : new Error(message))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={className}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg
            border border-red-300 text-red-700 bg-red-50 hover:bg-red-100
            transition-colors duration-200"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4v2m0 0a9 9 0 110-18 9 9 0 010 18zm0 0a9 9 0 100-18 9 9 0 000 18z"
            />
          </svg>
          Reportar
        </button>
      ) : (
        <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reportar este listing
          </h3>

          {success ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">
                ✓ Reporte enviado. Gracias por ayudarnos a mantener la comunidad segura.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón del reporte *
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg
                    bg-white text-gray-900 text-sm
                    focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Seleccionar...</option>
                  {Object.entries(ReportReasonLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detalles (opcional)
                </label>
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  maxLength={1000}
                  placeholder="Proporciona más información sobre el problema..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg
                    bg-white text-gray-900 text-sm
                    focus:outline-none focus:ring-2 focus:ring-red-500
                    resize-none"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {details.length}/1000 caracteres
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !reason}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg
                    hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                    transition-colors duration-200 text-sm"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar reporte'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    setReason('')
                    setDetails('')
                    setError(null)
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg
                    hover:bg-gray-50 transition-colors duration-200 text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
