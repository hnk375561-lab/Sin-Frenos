'use client'

import { useEffect, useState } from 'react'
import { getConditionQuestionsForCondition } from '@/lib/listings/reference-data'
import type { ConditionDetails, ConditionQuestion, VehicleConditionId } from '@/lib/listings/types'
import { formStyles } from '@/components/listings/publicar/formStyles'

/**
 * Formulario dinámico de "cómo está" (sección 4.6 del documento maestro).
 * Lee `condition_question_sets` a partir del `conditionId` elegido en el
 * paso 1 y renderiza un campo por pregunta. Deliberadamente separado del
 * paso del wizard que lo envuelve (`StepConditionDetails.tsx`): este
 * componente es reusable en cualquier otro lugar que necesite mostrar/
 * editar `condition_details` (ej. un futuro "editar publicación", fuera
 * del alcance de Fase 4 pero que no debería tener que reimplementar esto).
 *
 * Agregar una pregunta nueva a una condición es un UPDATE del jsonb en
 * Supabase, no un deploy de código (sección 4.6) — por eso este
 * componente no tiene ningún `switch` hardcodeado por condición, solo por
 * `question.type`.
 */

interface ConditionFormProps {
  conditionId: VehicleConditionId | null
  values: ConditionDetails
  onChange: (values: ConditionDetails) => void
  /**
   * Se dispara cada vez que termina de resolverse la lista de preguntas
   * para el `conditionId` actual (incluido el caso `[]`). El caller
   * (`StepConditionDetails`) lo usa para decidir si hay que saltear el
   * paso — `ConditionForm` en sí no sabe nada de navegación del wizard.
   */
  onQuestionsResolved?: (questions: ConditionQuestion[]) => void
}

export function ConditionForm({
  conditionId,
  values,
  onChange,
  onQuestionsResolved,
}: ConditionFormProps) {
  const [questions, setQuestions] = useState<ConditionQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [trackedConditionId, setTrackedConditionId] = useState(conditionId)

  // Reseteo de `loading`/`questions` cuando cambia `conditionId`, hecho
  // DURANTE el render (patrón "Adjusting state when a prop changes" de la
  // guía oficial de React: https://react.dev/learn/you-might-not-need-an-effect),
  // no dentro de un useEffect — evita el "cascading render" que marca
  // `react-hooks/set-state-in-effect` y que antes disparaba `setLoading(true)`
  // sincrónicamente en el cuerpo del efecto.
  if (conditionId !== trackedConditionId) {
    setTrackedConditionId(conditionId)
    setLoading(true)
    setQuestions([])
  }

  useEffect(() => {
    let active = true

    // El caso "sin condición" se unifica como una promesa ya resuelta en
    // vez de un branch sincrónico con su propio setState — así TODOS los
    // setState de este efecto quedan dentro del callback de un `.then()`
    // (asincrónico de verdad, no solo en apariencia), que es exactamente
    // lo que pide `react-hooks/set-state-in-effect`.
    const request = conditionId
      ? getConditionQuestionsForCondition(conditionId)
      : Promise.resolve<ConditionQuestion[]>([])

    request.then((result) => {
      if (!active) return
      setQuestions(result)
      setLoading(false)
      onQuestionsResolved?.(result)
    })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onQuestionsResolved es un callback del padre, no un dato que deba re-disparar el fetch.
  }, [conditionId])

  function setAnswer(key: string, value: string | boolean | number) {
    onChange({ ...values, [key]: value })
  }

  if (loading) {
    return <p className={formStyles.helperText}>Cargando preguntas…</p>
  }

  if (questions.length === 0) {
    // Caso normal (sección 4.6: condiciones 'qs_ninguna' como 'nuevo'/
    // 'usado' no tienen preguntas) — no es un estado de error, se
    // renderiza vacío. El wrapper del wizard es quien decide saltear el
    // paso completo en este caso, no este componente.
    return null
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <div key={question.key} className={formStyles.fieldGroup}>
          <label className={formStyles.label} htmlFor={`condition-${question.key}`}>
            {question.label}
          </label>

          {question.type === 'boolean' && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAnswer(question.key, true)}
                aria-pressed={values[question.key] === true}
                className={
                  values[question.key] === true
                    ? formStyles.primaryButton
                    : formStyles.secondaryButton
                }
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setAnswer(question.key, false)}
                aria-pressed={values[question.key] === false}
                className={
                  values[question.key] === false
                    ? formStyles.primaryButton
                    : formStyles.secondaryButton
                }
              >
                No
              </button>
            </div>
          )}

          {question.type === 'number' && (
            <input
              id={`condition-${question.key}`}
              type="number"
              inputMode="numeric"
              value={typeof values[question.key] === 'number' ? (values[question.key] as number) : ''}
              onChange={(e) =>
                setAnswer(question.key, e.target.value === '' ? '' : Number(e.target.value))
              }
              className={formStyles.input}
            />
          )}

          {question.type === 'text' && (
            <textarea
              id={`condition-${question.key}`}
              rows={2}
              value={typeof values[question.key] === 'string' ? (values[question.key] as string) : ''}
              onChange={(e) => setAnswer(question.key, e.target.value)}
              className={formStyles.textarea}
            />
          )}
        </div>
      ))}
    </div>
  )
}
