/**
 * Lectura de datos de referencia para el wizard de publicación
 * (`/publicar`). Todo lo de acá son tablas CURADAS (sección 4.3/4.5/4.6
 * del documento maestro: "catálogo cerrado, NO texto libre por
 * vendedor") — ningún paso del wizard inserta filas nuevas en
 * `vehicle_categories`, `vehicle_conditions`, `condition_question_sets` ni
 * `locations`, solo lee.
 *
 * Convención: cada función devuelve `[]` (nunca `throw`) si Supabase no
 * responde — mismo criterio que `src/lib/supabase/client.ts` ("si
 * Supabase se cae, el sitio sigue sirviendo"). El componente que llama
 * decide cómo mostrar ese estado vacío (spinner que no resuelve nunca no
 * es aceptable, pero un wizard sin categorías tampoco debería romper la
 * página entera).
 */

import { supabase } from '@/lib/supabase/client'
import type {
  ConditionQuestion,
  ConditionSeverity,
  LocationOption,
  VehicleCategoryId,
  VehicleConditionId,
  VehicleModelOption,
} from '@/lib/listings/types'

export interface VehicleCategoryOption {
  id: VehicleCategoryId
  name: string
  enabled: boolean
}

export interface VehicleConditionOption {
  id: VehicleConditionId
  label: string
  severity: ConditionSeverity
  questionSetId: string | null
}

/**
 * `vehicle_categories` (sección 4.5). Devuelve TODAS las filas, incluidas
 * `enabled = false` — el paso 1 del wizard es quien decide si las muestra
 * atenuadas/"próximamente" o las oculta; esta función no censura datos,
 * solo los lee.
 */
export async function getVehicleCategories(): Promise<VehicleCategoryOption[]> {
  const { data, error } = await supabase
    .from('vehicle_categories')
    .select('id, name, enabled')
    .order('name')

  if (error || !data) {
    console.error('[reference-data] getVehicleCategories:', error?.message)
    return []
  }

  return data as VehicleCategoryOption[]
}

/**
 * `vehicle_conditions` (sección 4.6), solo las habilitadas — a diferencia
 * de categorías, acá no tiene sentido mostrar una condición deshabilitada
 * en el selector del paso 1: no es "próximamente", es una taxonomía que
 * se puede haber retirado (ej. duplicada, mal etiquetada).
 */
export async function getVehicleConditions(): Promise<VehicleConditionOption[]> {
  const { data, error } = await supabase
    .from('vehicle_conditions')
    .select('id, label, severity, question_set_id')
    .eq('enabled', true)
    .order('label')

  if (error || !data) {
    console.error('[reference-data] getVehicleConditions:', error?.message)
    return []
  }

  return data.map((row) => ({
    id: row.id as VehicleConditionId,
    label: row.label as string,
    severity: row.severity as ConditionSeverity,
    questionSetId: row.question_set_id as string | null,
  }))
}

/**
 * Preguntas dinámicas de una condición puntual (sección 4.6 y paso 3 del
 * wizard). `condition_question_sets.questions` es un jsonb array — puede
 * venir `[]` (condición 'qs_ninguna', ej. 'nuevo'/'usado') y ESO es el
 * caso normal que le indica al paso 3 que debe saltearse, no un error.
 */
export async function getConditionQuestions(
  questionSetId: string | null
): Promise<ConditionQuestion[]> {
  if (!questionSetId) return []

  const { data, error } = await supabase
    .from('condition_question_sets')
    .select('questions')
    .eq('id', questionSetId)
    .maybeSingle()

  if (error || !data) {
    console.error('[reference-data] getConditionQuestions:', error?.message)
    return []
  }

  return (data.questions as ConditionQuestion[]) ?? []
}

/**
 * `locations` (sección 4.3), agrupadas por provincia para alimentar los
 * selects encadenados del paso 5 (provincia -> ciudad) sin que el
 * componente tenga que hacer el agrupamiento cada vez que cambia la
 * provincia elegida.
 */
export async function getLocations(): Promise<LocationOption[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, provincia, ciudad')
    .order('provincia')
    .order('ciudad')

  if (error || !data) {
    console.error('[reference-data] getLocations:', error?.message)
    return []
  }

  return data as LocationOption[]
}

/**
 * Agrupa el resultado de `getLocations()` en un mapa `provincia ->
 * ciudades`, para poblar el segundo <select> del paso 5 apenas cambia el
 * primero, sin otro round-trip a Supabase.
 */
export function groupLocationsByProvincia(
  locations: LocationOption[]
): Map<string, LocationOption[]> {
  const grouped = new Map<string, LocationOption[]>()
  for (const location of locations) {
    const existing = grouped.get(location.provincia)
    if (existing) {
      existing.push(location)
    } else {
      grouped.set(location.provincia, [location])
    }
  }
  return grouped
}

/**
 * Autocomplete de marca/modelo contra el espejo `vehicle_models` (sección
 * 4.4, poblado por `npm run sync:vehicle-models` desde
 * `src/content/vehiculos/*.json` — nunca se edita a mano). Sin match no es
 * un error: el paso 2 deja `vehicleModelSlug = null` y el vendedor sigue
 * completando marca/modelo/versión como texto libre (sección 4.7:
 * "un vehículo tuneado/armado/sin match en catálogo no puede quedar
 * bloqueado por esto").
 *
 * `query` vacío o de un solo carácter no dispara búsqueda (evita traer
 * de más en cada tecla apenas se abre el campo); el debounce de tipeo en
 * sí es responsabilidad del componente, no de esta función.
 */
export async function searchVehicleModels(query: string): Promise<VehicleModelOption[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const { data, error } = await supabase
    .from('vehicle_models')
    .select('slug, manufacturer, title, class')
    .or(`manufacturer.ilike.%${trimmed}%,title.ilike.%${trimmed}%`)
    .order('manufacturer')
    .limit(20)

  if (error || !data) {
    console.error('[reference-data] searchVehicleModels:', error?.message)
    return []
  }

  return data as VehicleModelOption[]
}
