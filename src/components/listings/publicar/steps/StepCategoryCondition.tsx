'use client'

import { useEffect, useState } from 'react'
import {
  getVehicleCategories,
  getVehicleConditions,
  type VehicleCategoryOption,
  type VehicleConditionOption,
} from '@/lib/listings/reference-data'
import type { ListingDraft, VehicleCategoryId, VehicleConditionId } from '@/lib/listings/types'
import {
  formStyles,
  severityBadgeBaseClass,
  severityBadgeClasses,
} from '@/components/listings/publicar/formStyles'

/**
 * Paso 1 del wizard (sección 6: "Categoría + condición (selects grandes
 * con imágenes) — define todo lo demás"). No hay imágenes reales todavía
 * (eso depende de assets de diseño que no están en el repo) — se
 * resuelve con las mismas tarjetas grandes seleccionables, sin foto, para
 * no bloquear el flujo funcional por un asset pendiente. Reemplazar el
 * ícono de texto por una imagen real es un cambio puramente visual
 * cuando haya assets, no de estructura.
 *
 * Solo categorías `enabled = true` son elegibles — el resto se muestra
 * atenuada con "Próximamente" (mismo criterio que la sección 5, home:
 * "autos/motos activas, resto atenuado"), NO se ocultan del todo: el
 * documento maestro las modela a propósito para que se sepa que existen
 * y van a habilitarse más adelante.
 */

interface StepCategoryConditionProps {
  draft: ListingDraft
  onChange: (patch: Partial<ListingDraft>) => void
  onNext: () => void
}

export function StepCategoryCondition({ draft, onChange, onNext }: StepCategoryConditionProps) {
  const [categories, setCategories] = useState<VehicleCategoryOption[]>([])
  const [conditions, setConditions] = useState<VehicleConditionOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    Promise.all([getVehicleCategories(), getVehicleConditions()]).then(([cats, conds]) => {
      if (!active) return
      setCategories(cats)
      setConditions(conds)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const canContinue = Boolean(draft.categoryId && draft.conditionId)

  function selectCategory(category: VehicleCategoryOption) {
    if (!category.enabled) return
    onChange({ categoryId: category.id as VehicleCategoryId })
  }

  function selectCondition(condition: VehicleConditionOption) {
    onChange({ conditionId: condition.id as VehicleConditionId })
  }

  return (
    <div className={formStyles.stepCard}>
      <h2 className={formStyles.stepTitle}>¿Qué estás publicando?</h2>
      <p className={formStyles.stepDescription}>
        Elegí la categoría y la condición real del vehículo — acá podés publicar tal como está,
        incluso si tiene fallas o no arranca.
      </p>

      {loading ? (
        <p className={formStyles.helperText}>Cargando categorías y condiciones…</p>
      ) : (
        <>
          <fieldset className={formStyles.fieldGroup}>
            <legend className={formStyles.label}>Categoría</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {categories.map((category) => {
                const selected = draft.categoryId === category.id
                const cardState = !category.enabled
                  ? formStyles.selectableCardDisabled
                  : selected
                    ? formStyles.selectableCardSelected
                    : formStyles.selectableCardIdle

                return (
                  <button
                    key={category.id}
                    type="button"
                    disabled={!category.enabled}
                    onClick={() => selectCategory(category)}
                    aria-pressed={selected}
                    className={`${formStyles.selectableCard} ${cardState}`}
                  >
                    <span className="text-sm font-semibold text-neutral-900">{category.name}</span>
                    {!category.enabled && (
                      <span className={formStyles.helperText}>Próximamente</span>
                    )}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset className={`${formStyles.fieldGroup} mt-5`}>
            <legend className={formStyles.label}>Condición</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {conditions.map((condition) => {
                const selected = draft.conditionId === condition.id
                const cardState = selected
                  ? formStyles.selectableCardSelected
                  : formStyles.selectableCardIdle

                return (
                  <button
                    key={condition.id}
                    type="button"
                    onClick={() => selectCondition(condition)}
                    aria-pressed={selected}
                    className={`${formStyles.selectableCard} ${cardState}`}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-neutral-900">
                        {condition.label}
                      </span>
                      <span
                        className={`${severityBadgeBaseClass} ${severityBadgeClasses[condition.severity]}`}
                      >
                        {condition.severity}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        </>
      )}

      <div className={formStyles.navRow}>
        <span />
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
