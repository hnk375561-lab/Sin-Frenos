'use client'

import { useEffect, useState } from 'react'
import { searchVehicleModels } from '@/lib/listings/reference-data'
import type { ListingDraft, VehicleModelOption } from '@/lib/listings/types'
import { formStyles } from '@/components/listings/publicar/formStyles'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'

/**
 * Paso 2 del wizard (sección 6: "Identificación: marca/modelo/versión
 * (autocomplete contra vehicle_models si hay match; si no, texto libre y
 * vehicle_model_slug queda null), año, km (opcional según condición)").
 *
 * Decisión de UX: `brand`/`model` son SIEMPRE inputs de texto libre
 * editables (sección 4.7: "INDEPENDIENTE de vehicle_model_slug"), nunca
 * quedan bloqueados esperando un match. El buscador de arriba es
 * puramente asistivo — 1 click sobre una sugerencia autocompleta esos
 * mismos inputs Y fija `vehicleModelSlug`; si el vendedor después edita
 * `brand` o `model` a mano, el slug se limpia (el match ya no es
 * confiable) pero el texto tipeado se conserva sin perder nada.
 */

interface StepIdentificationProps {
  draft: ListingDraft
  onChange: (patch: Partial<ListingDraft>) => void
  onNext: () => void
  onBack: () => void
}

export function StepIdentification({ draft, onChange, onNext, onBack }: StepIdentificationProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebouncedValue(searchQuery, 300)
  const [suggestions, setSuggestions] = useState<VehicleModelOption[]>([])
  const [searching, setSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [trackedQuery, setTrackedQuery] = useState(debouncedQuery)

  // Reacciona a un `debouncedQuery` nuevo DURANTE el render (patrón
  // "Adjusting state when a prop changes" de la guía oficial de React),
  // no dentro de un useEffect: evita el "cascading render" de
  // `react-hooks/set-state-in-effect`. Acá se decide sincrónicamente si
  // hace falta buscar o no — el efecto de abajo solo dispara el fetch en
  // sí, nunca decide el estado de "buscando".
  if (debouncedQuery !== trackedQuery) {
    setTrackedQuery(debouncedQuery)
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([])
      setSearching(false)
    } else {
      setSearching(true)
    }
  }

  useEffect(() => {
    let active = true

    // Nada que buscar (ya resuelto arriba, durante el render) — el efecto
    // no tiene ningún setState que ejecutar en este caso.
    if (debouncedQuery.trim().length < 2) return

    searchVehicleModels(debouncedQuery).then((results) => {
      if (!active) return
      setSuggestions(results)
      setSearching(false)
    })

    return () => {
      active = false
    }
  }, [debouncedQuery])

  function selectSuggestion(option: VehicleModelOption) {
    onChange({
      brand: option.manufacturer,
      model: option.title,
      vehicleModelSlug: option.slug,
    })
    setSearchQuery('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  function handleBrandChange(value: string) {
    // Editar a mano invalida el match previo (sección 4.7: el texto libre
    // manda, el slug es solo un puente opcional hacia la ficha técnica).
    onChange({ brand: value, vehicleModelSlug: null })
  }

  function handleModelChange(value: string) {
    onChange({ model: value, vehicleModelSlug: null })
  }

  const canContinue = draft.brand.trim() !== '' && draft.model.trim() !== ''

  return (
    <div className={formStyles.stepCard}>
      <h2 className={formStyles.stepTitle}>Identificación del vehículo</h2>
      <p className={formStyles.stepDescription}>
        Buscá tu modelo en nuestro catálogo para autocompletar, o cargalo a mano si no aparece —
        publicar no depende de que exista un match exacto.
      </p>

      <div className={`${formStyles.fieldGroup} relative`}>
        <label className={formStyles.label} htmlFor="listing-model-search">
          Buscar en el catálogo (opcional)
        </label>
        <input
          id="listing-model-search"
          type="text"
          placeholder="Ej. Toyota Hilux"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay para que el click en una sugerencia registre antes de que el blur la oculte.
            setTimeout(() => setShowSuggestions(false), 150)
          }}
          className={formStyles.input}
        />
        {showSuggestions && (searching || suggestions.length > 0) && (
          <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border border-edge bg-surface-card shadow-lg">
            {searching && (
              <li className={`px-3 py-2 ${formStyles.helperText}`}>Buscando…</li>
            )}
            {!searching &&
              suggestions.map((option) => (
                <li key={option.slug}>
                  <button
                    type="button"
                    onClick={() => selectSuggestion(option)}
                    className="w-full px-3 py-2 text-left text-sm text-neutral-900 transition duration-150 hover:bg-surface-card-hover"
                  >
                    <span className="font-medium">{option.manufacturer}</span> {option.title}
                    {option.class && (
                      <span className={`ml-2 ${formStyles.helperText}`}>{option.class}</span>
                    )}
                  </button>
                </li>
              ))}
          </ul>
        )}
        {draft.vehicleModelSlug && (
          <p className={formStyles.helperText}>
            ✓ Vinculado con la ficha técnica del catálogo. Podés editar marca/modelo igual si hace falta.
          </p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={formStyles.fieldGroup}>
          <label className={formStyles.label} htmlFor="listing-brand">
            Marca
          </label>
          <input
            id="listing-brand"
            type="text"
            placeholder="Ej. Toyota"
            value={draft.brand}
            onChange={(e) => handleBrandChange(e.target.value)}
            className={formStyles.input}
          />
        </div>

        <div className={formStyles.fieldGroup}>
          <label className={formStyles.label} htmlFor="listing-model">
            Modelo
          </label>
          <input
            id="listing-model"
            type="text"
            placeholder="Ej. Hilux"
            value={draft.model}
            onChange={(e) => handleModelChange(e.target.value)}
            className={formStyles.input}
          />
        </div>

        <div className={formStyles.fieldGroup}>
          <label className={formStyles.label} htmlFor="listing-version">
            Versión (opcional)
          </label>
          <input
            id="listing-version"
            type="text"
            placeholder="Ej. SRX 4x4"
            value={draft.version}
            onChange={(e) => onChange({ version: e.target.value })}
            className={formStyles.input}
          />
        </div>

        <div className={formStyles.fieldGroup}>
          <label className={formStyles.label} htmlFor="listing-year">
            Año (opcional)
          </label>
          <input
            id="listing-year"
            type="number"
            inputMode="numeric"
            placeholder="Ej. 2019"
            value={draft.year ?? ''}
            onChange={(e) =>
              onChange({ year: e.target.value === '' ? null : Number(e.target.value) })
            }
            className={formStyles.input}
          />
        </div>

        <div className={formStyles.fieldGroup}>
          <label className={formStyles.label} htmlFor="listing-mileage">
            Kilometraje (opcional)
          </label>
          <input
            id="listing-mileage"
            type="number"
            inputMode="numeric"
            placeholder="Ej. 85000"
            value={draft.mileageKm ?? ''}
            onChange={(e) =>
              onChange({ mileageKm: e.target.value === '' ? null : Number(e.target.value) })
            }
            className={formStyles.input}
          />
          <p className={formStyles.helperText}>
            Dejalo vacío si no aplica (ej. no arranca, para repuestos).
          </p>
        </div>
      </div>

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
