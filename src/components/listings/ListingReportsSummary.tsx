'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getListingReportsSummary } from '@/lib/moderation/reports'
import { ListingReportsSummary } from '@/types/listing-report'
import { Database } from '@/types/supabase'

interface ListingReportsSummaryProps {
  listingId: string
  className?: string
}

export function ListingReportsSummaryDisplay({
  listingId,
  className = '',
}: ListingReportsSummaryProps) {
  const [summary, setSummary] = useState<ListingReportsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Memoizado: si se recreara en cada render, agregarlo a las deps del
  // useEffect de abajo dispararía un loop de recargas infinito.
  const supabase = useMemo(
    () =>
      createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await getListingReportsSummary(supabase, listingId)
        setSummary(data)
      } catch (err) {
        console.error('Error loading reports summary:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSummary()
  }, [listingId, supabase])

  if (isLoading || !summary || summary.total_reports === 0) {
    return null // No mostrar nada si no hay reportes
  }

  const severity =
    summary.open_count > 2 ? 'critical' : summary.open_count > 0 ? 'warning' : 'info'

  const severityStyles = {
    critical: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  }

  return (
    <div className={`${severityStyles[severity]} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {severity === 'critical' && (
            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {severity === 'warning' && (
            <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {severity === 'info' && (
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-sm">
            {summary.open_count > 0
              ? `${summary.open_count} reporte${summary.open_count > 1 ? 's' : ''} abierto${summary.open_count > 1 ? 's' : ''}`
              : 'Reportes revisados'}
          </h3>
          <p className="text-sm mt-1">
            Este listing ha sido reportado{' '}
            {summary.total_reports === 1 ? 'una vez' : `${summary.total_reports} veces`}.
            {summary.open_count > 0
              ? ` Los reportes están siendo revisados por nuestro equipo de moderación.`
              : ` Todos los reportes han sido revisados.`}
          </p>
          {summary.last_reported_at && (
            <p className="text-xs mt-2 opacity-75">
              Último reporte:{' '}
              {new Date(summary.last_reported_at).toLocaleDateString('es-AR', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
