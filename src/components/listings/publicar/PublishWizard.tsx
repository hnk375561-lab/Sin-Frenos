'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEmptyListingDraft, type ListingDraft } from '@/lib/listings/types'
import { StepCategoryCondition } from '@/components/listings/publicar/steps/StepCategoryCondition'
import { StepIdentification } from '@/components/listings/publicar/steps/StepIdentification'
import { StepConditionDetails } from '@/components/listings/publicar/steps/StepConditionDetails'
import { StepPrice } from '@/components/listings/publicar/steps/StepPrice'
import { StepLocation } from '@/components/listings/publicar/steps/StepLocation'
import { StepPhotos } from '@/components/listings/publicar/steps/StepPhotos'
import { StepDescription } from '@/components/listings/publicar/steps/StepDescription'
import { StepPreview } from '@/components/listings/publicar/steps/StepPreview'

/**
 * Orquestador de los 8 pasos del wizard de publicación (sección 6 del
 * documento maestro). Es el único componente que sabe de navegación entre
 * pasos — cada `Step*.tsx` recibe `onNext`/`onBack` y no sabe nada del
 * resto del flujo, mismo criterio documentado en `StepConditionDetails.tsx`.
 *
 * CONTRATO con `StepConditionDetails.tsx` (paso 3, salteo condicional):
 * el paso 3 necesita saber si se entró "avanzando" (Siguiente del paso 2)
 * o "retrocediendo" (Volver del paso 4) para saltearse en la dirección
 * correcta cuando la condición elegida no tiene preguntas dinámicas. Por
 * eso `goNext`/`goBack` acá SIEMPRE fijan `navigationDirection` antes de
 * mover `currentStep` — si el paso 3 dispara su propio `onNext`/`onBack`
 * para saltearse a sí mismo, hereda la dirección que ya estaba fijada por
 * el movimiento anterior (ver el propio `StepConditionDetails.tsx` para
 * el detalle de por qué esto evita quedar trabado rebotando).
 *
 * `userId` se recibe como prop en vez de leerse con `useAuth()` acá
 * adentro: el auth-gate y la resolución de sesión son responsabilidad de
 * `src/app/publicar/page.tsx` (mismo criterio que documenta `create.ts`
 * en su propio encabezado) — este componente asume que ya hay una sesión
 * válida cuando se monta.
 */

const TOTAL_STEPS = 8

interface PublishWizardProps {
  userId: string
}

export function PublishWizard({ userId }: PublishWizardProps) {
  const router = useRouter()
  const [draft, setDraft] = useState<ListingDraft>(createEmptyListingDraft)
  const [currentStep, setCurrentStep] = useState(1)
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'backward'>('forward')
  const [published, setPublished] = useState<{ listingId: string; status: 'pending_review' | 'published' } | null>(
    null
  )

  function updateDraft(patch: Partial<ListingDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }))
  }

  function goNext() {
    setNavigationDirection('forward')
    setCurrentStep((step) => Math.min(step + 1, TOTAL_STEPS))
  }

  function goBack() {
    setNavigationDirection('backward')
    setCurrentStep((step) => Math.max(step - 1, 1))
  }

  function handlePublished(listingId: string, status: 'pending_review' | 'published') {
    setPublished({ listingId, status })
  }

  if (published) {
    return (
      <div className="rounded-lg border border-edge bg-surface-card p-6 text-center sm:p-8">
        <h2 className="mb-2 text-lg font-semibold text-neutral-900">
          {published.status === 'published' ? '¡Publicado!' : '¡Listo! Tu publicación quedó en revisión'}
        </h2>
        <p className="mb-6 text-sm text-neutral-600">
          {published.status === 'published'
            ? 'Ya está visible para todo el mundo en Sin Frenos.'
            : 'Es la primera publicación de tu cuenta, así que la revisamos antes de que se vea públicamente. No suele demorar mucho.'}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/listings/ver?id=${published.listingId}`)}
            className="rounded-md bg-auto-accent px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-auto-accent-strong"
          >
            Ver mi publicación
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(createEmptyListingDraft())
              setCurrentStep(1)
              setPublished(null)
            }}
            className="rounded-md border border-edge bg-transparent px-4 py-2 text-sm font-semibold text-neutral-700 transition duration-200 hover:bg-surface-card-hover"
          >
            Publicar otro vehículo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="mb-4 text-center text-xs font-medium uppercase tracking-wide text-neutral-500">
        Paso {currentStep} de {TOTAL_STEPS}
      </p>

      {currentStep === 1 && (
        <StepCategoryCondition draft={draft} onChange={updateDraft} onNext={goNext} />
      )}

      {currentStep === 2 && (
        <StepIdentification draft={draft} onChange={updateDraft} onNext={goNext} onBack={goBack} />
      )}

      {currentStep === 3 && (
        <StepConditionDetails
          draft={draft}
          onChange={updateDraft}
          onNext={goNext}
          onBack={goBack}
          navigationDirection={navigationDirection}
        />
      )}

      {currentStep === 4 && (
        <StepPrice draft={draft} onChange={updateDraft} onNext={goNext} onBack={goBack} />
      )}

      {currentStep === 5 && (
        <StepLocation draft={draft} onChange={updateDraft} onNext={goNext} onBack={goBack} />
      )}

      {currentStep === 6 && (
        <StepPhotos draft={draft} onChange={updateDraft} onNext={goNext} onBack={goBack} />
      )}

      {currentStep === 7 && (
        <StepDescription draft={draft} onChange={updateDraft} onNext={goNext} onBack={goBack} />
      )}

      {currentStep === 8 && (
        <StepPreview
          draft={draft}
          onChange={updateDraft}
          onBack={goBack}
          userId={userId}
          onPublished={handlePublished}
        />
      )}
    </div>
  )
}
