'use client'

import { useRef } from 'react'
import { ConditionForm } from '@/components/listings/ConditionForm'
import type { ConditionDetails, ConditionQuestion, ListingDraft } from '@/lib/listings/types'
import { formStyles } from '@/components/listings/publicar/formStyles'

/**
 * Paso 3 del wizard (sección 6: "Preguntas dinámicas de la condición...
 * Si la condición es 'excelente_estado'/'usado' normal, este paso se
 * SALTEA por completo, no se muestra vacío").
 *
 * Quién decide el salteo: `ConditionForm` resuelve las preguntas y avisa
 * vía `onQuestionsResolved`; este wrapper es el único que sabe de
 * navegación del wizard, así que es quien actúa sobre ese aviso.
 *
 * CONTRATO CON EL ORQUESTADOR (`PublishWizard.tsx`, próxima entrega):
 * como el salteo tiene que funcionar en los dos sentidos (avanzar desde
 * el paso 2 Y volver desde el paso 4), este componente necesita saber en
 * qué dirección se entró al paso — por eso recibe `navigationDirection`
 * en vez de asumir siempre "hacia adelante". Sin esto, alguien que
 * eligió una condición sin preguntas y aprieta "Volver" desde el paso 4
 * quedaría trabado rebotando hacia adelante de nuevo. El orquestador debe
 * setear `navigationDirection` a 'forward' cuando el usuario venía de
 * apretar "Siguiente" en el paso 2, y a 'backward' cuando venía de
 * apretar "Volver" en el paso 4.
 *
 * El `useRef` evita saltear dos veces para la misma condición si el
 * componente se re-renderiza por otro motivo mientras tanto (`onNext`/
 * `onBack` no tienen por qué ser referencialmente estables entre renders).
 */

interface StepConditionDetailsProps {
  draft: ListingDraft
  onChange: (patch: Partial<ListingDraft>) => void
  onNext: () => void
  onBack: () => void
  navigationDirection: 'forward' | 'backward'
}

export function StepConditionDetails({
  draft,
  onChange,
  onNext,
  onBack,
  navigationDirection,
}: StepConditionDetailsProps) {
  const skippedForConditionRef = useRef<string | null>(null)

  function handleQuestionsResolved(questions: ConditionQuestion[]) {
    if (questions.length > 0) return
    if (!draft.conditionId) return
    if (skippedForConditionRef.current === draft.conditionId) return

    skippedForConditionRef.current = draft.conditionId
    if (navigationDirection === 'backward') {
      onBack()
    } else {
      onNext()
    }
  }

  function handleAnswersChange(values: ConditionDetails) {
    onChange({ conditionDetails: values })
  }

  return (
    <div className={formStyles.stepCard}>
      <h2 className={formStyles.stepTitle}>Contanos un poco más</h2>
      <p className={formStyles.stepDescription}>
        Estas preguntas ayudan a que quien te contacte sepa exactamente en qué estado está el
        vehículo, sin sorpresas.
      </p>

      <ConditionForm
        conditionId={draft.conditionId}
        values={draft.conditionDetails}
        onChange={handleAnswersChange}
        onQuestionsResolved={handleQuestionsResolved}
      />

      <div className={formStyles.navRow}>
        <button type="button" onClick={onBack} className={formStyles.secondaryButton}>
          Volver
        </button>
        <button type="button" onClick={onNext} className={formStyles.primaryButton}>
          Siguiente
        </button>
      </div>
    </div>
  )
}
