'use client'

import { useEffect, useMemo, useState } from 'react'
import { getLocations, groupLocationsByProvincia } from '@/lib/listings/reference-data'
import type { ListingDraft, LocationOption } from '@/lib/listings/types'
import { formStyles } from '@/components/listings/publicar/formStyles'

/**
 * Paso 5 del wizard (sección 6: "Ubicación: provincia + ciudad (selects
 * encadenados contra locations, no texto libre)").
 *
 * `listings.location_id` es lo único que se guarda — nunca provincia/
 * ciudad como texto suelto (sección 4.3: "catálogo cerrado y curado, NO
 * texto libre por vendedor"). Por eso acá adentro se maneja una
 * `selectedProvincia` puramente local (solo sirve para filtrar el
 * segundo <select>), mientras que lo único que termina en el draft es el
 * `locationId` final una vez elegida la ciudad.
 */

interface StepLocationProps {
  draft: ListingDraft
  onChange: (patch: Partial<ListingDraft>) => void
  onNext: () => void
  onBack: () => void
}

export function StepLocation({ draft, onChange, onNext, onBack }: StepLocationProps) {
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProvincia, setSelectedProvincia] = useState('')

  useEffect(() => {
    let active = true
    getLocations().then((result) => {
      if (!active) return
      setLocations(result)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  // Si el wizard entra a este paso con un `locationId` ya elegido
  // (ej. el vendedor volvió del paso 6 y vuelve a pasar por acá), hay que
  // reconstruir de qué provincia era, para que el segundo <select> se
  // pueble correctamente sin que el vendedor tenga que elegir todo de
  // nuevo. Se recalcula tanto si cambia `draft.locationId` como si
  // `locations` recién termina de cargar (por eso se trackean los dos).
  //
  // Hecho DURANTE el render (patrón "Adjusting state when a prop
  // changes" de la guía oficial de React), no en un useEffect — evita el
  // "cascading render" que marca `react-hooks/set-state-in-effect`.
  const [trackedLocationId, setTrackedLocationId] = useState(draft.locationId)
  const hasLocations = locations.length > 0
  const [trackedHasLocations, setTrackedHasLocations] = useState(hasLocations)

  if (draft.locationId !== trackedLocationId || hasLocations !== trackedHasLocations) {
    setTrackedLocationId(draft.locationId)
    setTrackedHasLocations(hasLocations)

    if (draft.locationId && hasLocations) {
      const current = locations.find((location) => location.id === draft.locationId)
      if (current) setSelectedProvincia(current.provincia)
    }
  }

  const grouped = useMemo(() => groupLocationsByProvincia(locations), [locations])
  const provincias = useMemo(() => Array.from(grouped.keys()).sort(), [grouped])
  const ciudades = useMemo(
    () => (selectedProvincia ? (grouped.get(selectedProvincia) ?? []) : []),
    [grouped, selectedProvincia]
  )

  function handleProvinciaChange(provincia: string) {
    setSelectedProvincia(provincia)
    // Cambiar de provincia invalida la ciudad elegida antes — nunca debe
    // quedar un location_id de una provincia distinta a la mostrada.
    onChange({ locationId: null })
  }

  function handleCiudadChange(locationId: string) {
    onChange({ locationId: locationId || null })
  }

  const canContinue = Boolean(draft.locationId)

  return (
    <div className={formStyles.stepCard}>
      <h2 className={formStyles.stepTitle}>¿Dónde está el vehículo?</h2>
      <p className={formStyles.stepDescription}>
        Elegí provincia y ciudad de una lista curada — así los filtros de búsqueda funcionan bien
        para todos.
      </p>

      {loading ? (
        <p className={formStyles.helperText}>Cargando ubicaciones…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={formStyles.fieldGroup}>
            <label className={formStyles.label} htmlFor="listing-provincia">
              Provincia
            </label>
            <select
              id="listing-provincia"
              value={selectedProvincia}
              onChange={(e) => handleProvinciaChange(e.target.value)}
              className={formStyles.select}
            >
              <option value="">Elegí una provincia</option>
              {provincias.map((provincia) => (
                <option key={provincia} value={provincia}>
                  {provincia}
                </option>
              ))}
            </select>
          </div>

          <div className={formStyles.fieldGroup}>
            <label className={formStyles.label} htmlFor="listing-ciudad">
              Ciudad
            </label>
            <select
              id="listing-ciudad"
              disabled={!selectedProvincia}
              value={draft.locationId ?? ''}
              onChange={(e) => handleCiudadChange(e.target.value)}
              className={formStyles.select}
            >
              <option value="">
                {selectedProvincia ? 'Elegí una ciudad' : 'Elegí primero una provincia'}
              </option>
              {ciudades.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.ciudad}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!loading && provincias.length === 0 && (
        <p className={formStyles.errorText}>
          No se pudieron cargar las ubicaciones. Revisá tu conexión e intentá de nuevo.
        </p>
      )}

      <div className={formStyles.navRow}>
        <button type="button" onClick={onBack} className={formStyles.secondaryButton}>
          Volver
        </button>
        <button
          type="button"
          disabled={!canContinue}
          onClick={onNext}
          className={formStyles.primaryButton}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
