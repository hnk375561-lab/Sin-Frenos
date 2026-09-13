'use client'

/**
 * Filtros de `/listings` (Fase 5, sección 7 del documento maestro).
 *
 * El estado de los filtros vive en la URL (`useSearchParams` +
 * `router.push`), no en un `useState` local que se pierde al recargar —
 * mismo criterio que ya usa `/listings/ver?id=...` (Fase 3) para el id
 * del listing: una URL de `/listings?categoria=autos&condicion=chocado`
 * es compartible/bookmarkeable, que es justo lo que un buscador necesita
 * (sección 9, "SEO" habla de esto para listings a escala en Fase 9; acá
 * ya sienta la base).
 *
 * Este componente NO hace fetch de resultados — solo lee/escribe la URL.
 * `src/app/listings/page.tsx` es quien observa esos parámetros y llama a
 * `searchListings` (separación de responsabilidades: filtros = estado de
 * URL, page = orquestación + fetch).
 */

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { VehicleCategoryOption, VehicleConditionOption } from '@/lib/listings/reference-data'
import type { LocationOption, PriceCurrency } from '@/lib/listings/types'
import { formStyles } from '@/components/listings/publicar/formStyles'

export interface FiltersProps {
  /** Solo las `enabled = true` (sección 5: "autos/motos activas, resto
   * atenuado/próximamente") — no tiene sentido ofrecer un filtro por una
   * categoría que hoy no puede tener ningún listing. */
  categories: VehicleCategoryOption[]
  conditions: VehicleConditionOption[]
  locationsByProvincia: Map<string, LocationOption[]>
}

const CURRENCY_OPTIONS: { value: PriceCurrency; label: string }[] = [
  { value: 'ARS', label: 'ARS' },
  { value: 'USD', label: 'USD' },
]

export function Filters({ categories, conditions, locationsByProvincia }: FiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Estado local del formulario, inicializado desde la URL — se aplica
  // recién al enviar (botón "Buscar"), no en cada tecla: cada cambio de
  // URL dispara un fetch nuevo en la página, así que no conviene
  // navegar en cada keystroke de un input de texto libre.
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [categoryId, setCategoryId] = useState(searchParams.get('categoria') ?? '')
  const [conditionId, setConditionId] = useState(searchParams.get('condicion') ?? '')
  const [provincia, setProvincia] = useState(searchParams.get('provincia') ?? '')
  const [locationId, setLocationId] = useState(searchParams.get('ubicacion') ?? '')
  const [currency, setCurrency] = useState(searchParams.get('moneda') ?? '')
  const [priceMin, setPriceMin] = useState(searchParams.get('precio_min') ?? '')
  const [priceMax, setPriceMax] = useState(searchParams.get('precio_max') ?? '')

  const provincias = Array.from(locationsByProvincia.keys()).sort()
  const ciudadesDeProvincia = provincia ? locationsByProvincia.get(provincia) ?? [] : []

  const hasActiveFilters =
    Boolean(searchParams.get('q')) ||
    Boolean(searchParams.get('categoria')) ||
    Boolean(searchParams.get('condicion')) ||
    Boolean(searchParams.get('ubicacion')) ||
    Boolean(searchParams.get('moneda')) ||
    Boolean(searchParams.get('precio_min')) ||
    Boolean(searchParams.get('precio_max'))

  function handleProvinciaChange(nextProvincia: string) {
    setProvincia(nextProvincia)
    // Cambiar de provincia invalida la ciudad elegida — no puede quedar
    // una ciudad de Entre Ríos seleccionada con Córdoba como provincia.
    setLocationId('')
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (categoryId) params.set('categoria', categoryId)
    if (conditionId) params.set('condicion', conditionId)
    if (locationId) params.set('ubicacion', locationId)
    if (currency) params.set('moneda', currency)
    if (priceMin) params.set('precio_min', priceMin)
    if (priceMax) params.set('precio_max', priceMax)

    const queryString = params.toString()
    router.push(queryString ? `/listings?${queryString}` : '/listings')
  }

  function handleClear() {
    setQuery('')
    setCategoryId('')
    setConditionId('')
    setProvincia('')
    setLocationId('')
    setCurrency('')
    setPriceMin('')
    setPriceMax('')
    router.push('/listings')
  }

  return (
    <form onSubmit={handleSubmit} className={`${formStyles.stepCard} space-y-4`}>
      <div className={formStyles.fieldGroup}>
        <label htmlFor="listings-query" className={formStyles.label}>
          Buscar
        </label>
        <input
          id="listings-query"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='Ej: "camioneta 4x4 hasta 20 mil dólares"'
          className={formStyles.input}
        />
        <p className={formStyles.helperText}>
          Podés escribir marca, modelo, o un precio máximo en la misma frase.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={formStyles.fieldGroup}>
          <label htmlFor="listings-categoria" className={formStyles.label}>
            Categoría
          </label>
          <select
            id="listings-categoria"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={formStyles.select}
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className={formStyles.fieldGroup}>
          <label htmlFor="listings-condicion" className={formStyles.label}>
            Condición
          </label>
          <select
            id="listings-condicion"
            value={conditionId}
            onChange={(event) => setConditionId(event.target.value)}
            className={formStyles.select}
          >
            <option value="">Cualquiera</option>
            {conditions.map((condition) => (
              <option key={condition.id} value={condition.id}>
                {condition.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={formStyles.fieldGroup}>
          <label htmlFor="listings-provincia" className={formStyles.label}>
            Provincia
          </label>
          <select
            id="listings-provincia"
            value={provincia}
            onChange={(event) => handleProvinciaChange(event.target.value)}
            className={formStyles.select}
          >
            <option value="">Todas</option>
            {provincias.map((provinciaOption) => (
              <option key={provinciaOption} value={provinciaOption}>
                {provinciaOption}
              </option>
            ))}
          </select>
        </div>

        <div className={formStyles.fieldGroup}>
          <label htmlFor="listings-ciudad" className={formStyles.label}>
            Ciudad
          </label>
          <select
            id="listings-ciudad"
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            disabled={!provincia}
            className={formStyles.select}
          >
            <option value="">{provincia ? 'Todas' : 'Elegí una provincia primero'}</option>
            {ciudadesDeProvincia.map((location) => (
              <option key={location.id} value={location.id}>
                {location.ciudad}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={formStyles.fieldGroup}>
          <label htmlFor="listings-moneda" className={formStyles.label}>
            Moneda
          </label>
          <select
            id="listings-moneda"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className={formStyles.select}
          >
            <option value="">Cualquiera</option>
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={formStyles.fieldGroup}>
          <label htmlFor="listings-precio-min" className={formStyles.label}>
            Precio mínimo
          </label>
          <input
            id="listings-precio-min"
            type="number"
            min={0}
            value={priceMin}
            onChange={(event) => setPriceMin(event.target.value)}
            className={formStyles.input}
          />
        </div>

        <div className={formStyles.fieldGroup}>
          <label htmlFor="listings-precio-max" className={formStyles.label}>
            Precio máximo
          </label>
          <input
            id="listings-precio-max"
            type="number"
            min={0}
            value={priceMax}
            onChange={(event) => setPriceMax(event.target.value)}
            className={formStyles.input}
          />
        </div>
      </div>

      <div className={formStyles.navRow}>
        <button type="submit" className={formStyles.primaryButton}>
          Buscar
        </button>
        {hasActiveFilters && (
          <button type="button" onClick={handleClear} className={formStyles.secondaryButton}>
            Limpiar filtros
          </button>
        )}
      </div>
    </form>
  )
}
