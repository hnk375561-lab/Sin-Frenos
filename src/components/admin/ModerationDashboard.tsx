'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getOpenReportsForModeration, getListingReports } from '@/lib/moderation/reports'
import { getListingModerationActions, createModerationAction } from '@/lib/moderation/actions'
import { ListingReport } from '@/types/listing-report'
import { ModerationAction, ModerationActionLabels, ModerationActionType } from '@/types/moderation'
import { Database } from '@/types/supabase'

interface PendingListing {
  id: string
  title: string
  seller_id: string
  reports: ListingReport[]
  actions: ModerationAction[]
}

export function ModerationDashboard() {
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([])
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Load pending listings
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const { reports } = await getOpenReportsForModeration(supabase, { limit: 100 })

        // Agrupar reportes por listing
        const listingMap = new Map<string, PendingListing>()

        for (const report of reports) {
          const listingId = report.listing_id
          if (!listingMap.has(listingId)) {
            listingMap.set(listingId, {
              id: listingId,
              title: report.listing?.title || 'Sin título',
              seller_id: report.listing?.seller_id || '',
              reports: [],
              actions: [],
            })
          }
          listingMap.get(listingId)!.reports.push(report)

          // Cargar acciones del listing
          const actions = await getListingModerationActions(supabase, listingId)
          listingMap.get(listingId)!.actions = actions
        }

        setPendingListings(Array.from(listingMap.values()))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando datos')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  async function handleAction(listingId: string) {
    if (!selectedAction) return

    setIsSubmittingAction(true)
    try {
      await createModerationAction(supabase, {
        listing_id: listingId,
        action: selectedAction as typeof ModerationActionType[keyof typeof ModerationActionType],
        reason: actionReason || undefined,
      })

      // Recargar datos
      const { reports } = await getOpenReportsForModeration(supabase, { limit: 100 })
      const listingMap = new Map<string, PendingListing>()

      for (const report of reports) {
        const lid = report.listing_id
        if (!listingMap.has(lid)) {
          listingMap.set(lid, {
            id: lid,
            title: report.listing?.title || 'Sin título',
            seller_id: report.listing?.seller_id || '',
            reports: [],
            actions: [],
          })
        }
        listingMap.get(lid)!.reports.push(report)
        const actions = await getListingModerationActions(supabase, lid)
        listingMap.get(lid)!.actions = actions
      }

      setPendingListings(Array.from(listingMap.values()))
      setSelectedListingId(null)
      setSelectedAction('')
      setActionReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aplicar acción')
    } finally {
      setIsSubmittingAction(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  const selectedListing = pendingListings.find(l => l.id === selectedListingId)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Panel de Moderación
          </h1>
          <p className="text-gray-600 mt-2">
            {pendingListings.length} listing{pendingListings.length !== 1 ? 's' : ''} con reportes abiertos
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de reportes */}
          <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Reportes abiertos</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {pendingListings.map(listing => (
                <button
                  key={listing.id}
                  onClick={() => setSelectedListingId(listing.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors
                    ${selectedListingId === listing.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''}`}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {listing.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {listing.reports.length} reporte{listing.reports.length !== 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Detalles del listing seleccionado */}
          {selectedListing ? (
            <div className="lg:col-span-2 space-y-6">
              {/* Listing Info */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedListing.title}
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium">ID:</span> {selectedListing.id}</p>
                  <p><span className="font-medium">Vendedor:</span> {selectedListing.seller_id}</p>
                  <p><span className="font-medium">Reportes:</span> {selectedListing.reports.length}</p>
                </div>
              </div>

              {/* Reportes */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Reportes</h4>
                <div className="space-y-4 max-h-48 overflow-y-auto">
                  {selectedListing.reports.map(report => (
                    <div key={report.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {report.reason}
                      </p>
                      {report.details && (
                        <p className="text-xs text-gray-600 mt-1">{report.details}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(report.created_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones tomadas */}
              {selectedListing.actions.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Acciones tomadas</h4>
                  <div className="space-y-2 text-sm">
                    {selectedListing.actions.map(action => (
                      <div key={action.id} className="flex items-start gap-2">
                        <span className="inline-block mt-1 w-2 h-2 bg-green-600 rounded-full flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {ModerationActionLabels[action.action]}
                          </p>
                          {action.reason && (
                            <p className="text-xs text-gray-600">{action.reason}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {new Date(action.created_at).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulario de acción */}
              {selectedListing.actions.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Tomar acción</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Acción
                      </label>
                      <select
                        value={selectedAction}
                        onChange={e => setSelectedAction(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="approved">Aprobar</option>
                        <option value="rejected">Rechazar</option>
                        <option value="paused">Pausar</option>
                        <option value="removed">Remover</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Razón (opcional)
                      </label>
                      <textarea
                        value={actionReason}
                        onChange={e => setActionReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-blue-500
                          resize-none"
                        rows={2}
                        placeholder="Explicar por qué..."
                      />
                    </div>

                    <button
                      onClick={() => handleAction(selectedListing.id)}
                      disabled={!selectedAction || isSubmittingAction}
                      className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg
                        hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                        transition-colors duration-200"
                    >
                      {isSubmittingAction ? 'Aplicando...' : 'Aplicar acción'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6 text-center">
              <p className="text-gray-500">
                Selecciona un reporte de la lista para ver detalles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
