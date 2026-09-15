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
      <div className="marketplace-wizard-success">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/15 text-3xl font-black text-white" aria-hidden="true">✓</div>
        <h2>
          {published.status === 'published' ? '¡Publicado!' : '¡Listo! Tu publicación quedó en revisión'}
        </h2>
        <p>
          {published.status === 'published'
            ? 'Tu vehículo ya está visible. Las personas que buscan una opción como la tuya ya pueden encontrarte y contactarte.'
            : 'La recibimos y la estamos revisando antes de mostrarla públicamente. Te avisaremos cuando esté lista.'}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/listings/${published.listingId}`)}
            className="rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[#C2410C] transition hover:bg-[#27272A]"
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
            className="rounded-full border border-white/35 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Publicar otro vehículo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="marketplace-wizard-progress">
        <div className="marketplace-wizard-progress-top"><span>Paso {currentStep} de {TOTAL_STEPS}</span><span>{Math.round((currentStep / TOTAL_STEPS) * 100)}% completo</span></div>
        <div className="marketplace-wizard-progress-bar" aria-hidden="true"><span style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }} /></div>
      </div>

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
