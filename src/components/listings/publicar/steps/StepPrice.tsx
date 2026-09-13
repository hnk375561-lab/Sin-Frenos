'use client'

import type { ListingDraft, PriceCurrency, PriceType } from '@/lib/listings/types'
import { formStyles } from '@/components/listings/publicar/formStyles'

/**
 * Paso 4 del wizard (sección 6: "Precio y forma de pago: monto, moneda,
 * fixed/negotiable/on_request, permuta, financiación").
 *
 * `priceType='on_request'` cubre "precio a convenir" (sección 4.7) —
 * cuando está seleccionado, el input de monto se deshabilita en vez de
 * ocultarse: si el vendedor cambia de opinión y vuelve a 'fixed'/
 * 'negotiable', el monto que ya había tipeado sigue ahí, no se pierde.
 */

const PRICE_TYPE_OPTIONS: { value: PriceType; label: string; helper: string }[] = [
  { value: 'fixed', label: 'Precio fijo', helper: 'No se negocia.' },
  { value: 'negotiable', label: 'Negociable', helper: 'Abierto a ofertas razonables.' },
  { value: 'on_request', label: 'A convenir', helper: 'Sin monto publicado, se charla por contacto directo.' },
]

const CURRENCY_OPTIONS: PriceCurrency[] = ['ARS', 'USD']

interface StepPriceProps {
  draft: ListingDraft
  onChange: (patch: Partial<ListingDraft>) => void
  onNext: () => void
  onBack: () => void
}

export function StepPrice({ draft, onChange, onNext, onBack }: StepPriceProps) {
  const amountRequired = draft.priceType !== 'on_request'
  const canContinue = !amountRequired || (draft.priceAmount != null && draft.priceAmount > 0)

  return (
    <div className={formStyles.stepCard}>
      <h2 className={formStyles.stepTitle}>Precio y forma de pago</h2>
      <p className={formStyles.stepDescription}>
        Elegí cómo querés mostrar el precio. Siempre podés aceptar permuta o financiación además del monto.
      </p>

      <fieldset className={formStyles.fieldGroup}>
        <legend className={formStyles.label}>Tipo de precio</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PRICE_TYPE_OPTIONS.map((option) => {
            const selected = draft.priceType === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ priceType: option.value })}
                aria-pressed={selected}
                className={`${formStyles.selectableCard} ${
                  selected ? formStyles.selectableCardSelected : formStyles.selectableCardIdle
                }`}
              >
                <span className="text-sm font-semibold text-neutral-900">{option.label}</span>
                <span className={formStyles.helperText}>{option.helper}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <div className={formStyles.fieldGroup}>
          <label className={formStyles.label} htmlFor="listing-price-amount">
            Monto {amountRequired ? '' : '(deshabilitado — precio a convenir)'}
          </label>
          <input
            id="listing-price-amount"
            type="number"
            inputMode="numeric"
            min={0}
            disabled={!amountRequired}
            placeholder="Ej. 15000000"
            value={draft.priceAmount ?? ''}
            onChange={(e) =>
              onChange({ priceAmount: e.target.value === '' ? null : Number(e.target.value) })
            }
            className={formStyles.input}
          />
        </div>

        <div className={formStyles.fieldGroup}>
          <label className={formStyles.label} htmlFor="listing-price-currency">
            Moneda
          </label>
          <select
            id="listing-price-currency"
            disabled={!amountRequired}
            value={draft.priceCurrency}
            onChange={(e) => onChange({ priceCurrency: e.target.value as PriceCurrency })}
            className={formStyles.select}
          >
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-neutral-900">
          <input
            type="checkbox"
            checked={draft.acceptsTrade}
            onChange={(e) => onChange({ acceptsTrade: e.target.checked })}
            className="h-4 w-4 rounded border-edge text-auto-accent focus-visible:ring-2 focus-visible:ring-auto-accent"
          />
          Acepto permuta
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-900">
          <input
            type="checkbox"
            checked={draft.acceptsFinancing}
            onChange={(e) => onChange({ acceptsFinancing: e.target.checked })}
            className="h-4 w-4 rounded border-edge text-auto-accent focus-visible:ring-2 focus-visible:ring-auto-accent"
          />
          Acepto financiación
        </label>
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
