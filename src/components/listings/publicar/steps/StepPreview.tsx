'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getVehicleCategories,
  getVehicleConditions,
  type VehicleCategoryOption,
  type VehicleConditionOption,
} from '@/lib/listings/reference-data'
import { createListing } from '@/lib/listings/create'
import type { ListingDraft } from '@/lib/listings/types'
import { formStyles, severityBadgeBaseClass, severityBadgeClasses } from '@/components/listings/publicar/formStyles'
import { supabase } from '@/lib/supabase/client'
import { recordLegalConsent } from '@/lib/legal-consent'

/**
 * Paso 8 del wizard (sección 6: "Preview + publicar. Estado inicial:
 * 'pending_review' si es la primera publicación de esa cuenta..., 'published'
 * directo si la cuenta ya tiene historial limpio.").
 *
 * La pregunta de documentación (`hasTitle`/`titleStatus`) vive acá, no en
 * un paso propio — así lo deja explícito el comentario de `ListingDraft`
 * en `types.ts`: "Paso 8 — documentación (se pregunta junto al preview,
 * no tiene paso propio)".
 *
 * Este es el único paso que llama a `createListing` (sección 6, paso 8 es
 * "la última barrera antes de tocar la base", según el propio comentario
 * de `create.ts`) — ningún paso anterior valida contra la base, solo
 * localmente lo que le compete a su propio campo.
 */

const PRICE_TYPE_LABEL: Record<ListingDraft['priceType'], string> = {
  fixed: 'Precio fijo',
  negotiable: 'Negociable',
  on_request: 'A convenir',
}

interface StepPreviewProps {
  draft: ListingDraft
  onChange: (patch: Partial<ListingDraft>) => void
  onBack: () => void
  userId: string
  onPublished: (listingId: string, status: 'pending_review' | 'published') => void
}

export function StepPreview({ draft, onChange, onBack, userId, onPublished }: StepPreviewProps) {
  const [category, setCategory] = useState<VehicleCategoryOption | null>(null)
  const [condition, setCondition] = useState<VehicleConditionOption | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [contentPolicyAccepted, setContentPolicyAccepted] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([getVehicleCategories(), getVehicleConditions()]).then(([cats, conds]) => {
      if (!active) return
      setCategory(cats.find((c) => c.id === draft.categoryId) ?? null)
      setCondition(conds.find((c) => c.id === draft.conditionId) ?? null)
    })
    return () => {
      active = false
    }
  }, [draft.categoryId, draft.conditionId])

  const coverPhoto = draft.photos.find((p) => p.isCover) ?? draft.photos[0] ?? null

  async function handlePublish() {
    setErrors([])
    if (!contentPolicyAccepted) {
      setErrors(['Aceptá las Reglas de publicación para continuar.'])
      return
    }
    setSubmitting(true)

    const { error: consentError } = await recordLegalConsent(supabase, userId, 'content', {
      listing_stage: 'preview',
      age_represented: true,
    })
    if (consentError) {
      setSubmitting(false)
      setErrors([`No se pudo registrar tu aceptación de las reglas: ${consentError.message}`])
      return
    }

    const result = await createListing(draft, userId)

    setSubmitting(false)

    if (!result.success) {
      setErrors(result.errors ?? ['No se pudo crear la publicación. Probá de nuevo.'])
      return
    }

    // `status` viene calculado por `createListing` contra el historial
    // real de la cuenta (sección 6, paso 8) — este componente no decide
    // nada, solo lo propaga para que `onPublished` muestre el mensaje
    // correcto ("en revisión" vs. "ya está publicado").
    onPublished(result.listingId as string, result.status ?? 'pending_review')
  }

  return (
    <div className={formStyles.stepCard}>
      <h2 className={formStyles.stepTitle}>Documentación y confirmación</h2>
      <p className={formStyles.stepDescription}>
        Última pregunta antes de publicar. Después vas a poder revisar todo abajo.
      </p>

      <fieldset className={formStyles.fieldGroup}>
        <legend className={formStyles.label}>¿Tenés el título del vehículo?</legend>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ hasTitle: true })}
            aria-pressed={draft.hasTitle === true}
            className={draft.hasTitle === true ? formStyles.primaryButton : formStyles.secondaryButton}
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => onChange({ hasTitle: false })}
            aria-pressed={draft.hasTitle === false}
            className={draft.hasTitle === false ? formStyles.primaryButton : formStyles.secondaryButton}
          >
            No
          </button>
        </div>
      </fieldset>

      <div className={`${formStyles.fieldGroup} mt-4`}>
        <label className={formStyles.label} htmlFor="listing-title-status">
          Detalle sobre la documentación (opcional)
        </label>
        <input
          id="listing-title-status"
          type="text"
          placeholder="Ej. título en trámite, deuda de patentes al día, sin transferir todavía..."
          value={draft.titleStatus}
          onChange={(e) => onChange({ titleStatus: e.target.value })}
          className={formStyles.input}
        />
        <p className={formStyles.helperText}>
          Esta información es la que declara el vendedor — no la verificamos nosotros. Sé
          honesto/a: es lo que espera quien te contacte.
        </p>
      </div>

      <hr className="my-6 border-[#27272A]" />

      <h3 className="mb-3 text-lg font-extrabold tracking-[-.03em] text-[#09090B]">Así se va a ver tu publicación</h3>

      <div className="flex flex-col gap-4 rounded-2xl border border-[#3F3F46] bg-[#18181B] p-4 sm:flex-row">
        <div className="h-40 w-full shrink-0 overflow-hidden rounded-xl bg-[#27272A] sm:h-28 sm:w-40">
          {coverPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview local de un File vía object URL, no un asset de next/image
            <img src={coverPhoto.previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs font-bold text-[#C2410C]">
              Tu portada aparecerá acá
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold text-[#09090B]">
            {draft.title.trim() || 'Sin título todavía'}
          </p>
          <p className="text-sm text-[#A1A1AA]">
            {draft.brand} {draft.model} {draft.version}
            {draft.year ? ` · ${draft.year}` : ''}
            {draft.mileageKm != null ? ` · ${draft.mileageKm.toLocaleString('es-AR')} km` : ''}
          </p>
          <p className="mt-2 text-lg font-black text-[#C2410C]">
            {draft.priceType === 'on_request'
              ? 'Precio a convenir'
              : `${draft.priceCurrency} ${draft.priceAmount?.toLocaleString('es-AR') ?? '—'}`}{' '}
            <span className="font-normal text-neutral-500">({PRICE_TYPE_LABEL[draft.priceType]})</span>
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {category && (
                <span className={`${severityBadgeBaseClass} border border-[#3F3F46] bg-white text-[#C2410C]`}>
                {category.name}
              </span>
            )}
            {condition && (
              <span className={`${severityBadgeBaseClass} ${severityBadgeClasses[condition.severity]}`}>
                {condition.label}
              </span>
            )}
          </div>

          <p className="mt-2 text-xs text-neutral-500">
            {draft.photos.length} foto{draft.photos.length === 1 ? '' : 's'}
            {draft.videoUrl.trim() ? ' · con video' : ''}
          </p>
        </div>
      </div>

      {draft.description.trim() && (
        <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">{draft.description}</p>
      )}

      <p className={`mt-4 ${formStyles.helperText}`}>
        Si es tu primera publicación en Sin Frenos, queda en revisión antes de verse
        públicamente — es fricción mínima de confianza, no una sanción. Las siguientes se
        publican directo.
      </p>

      <label className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <input
          type="checkbox"
          checked={contentPolicyAccepted}
          onChange={(event) => setContentPolicyAccepted(event.target.checked)}
          required
          className="mt-0.5 h-4 w-4 shrink-0"
        />
        <span>
          Confirmo que leí y acepto las <Link className="font-semibold underline" href="/reglas-de-publicacion">Reglas de publicación</Link>, que el vehículo es real y que tengo autorización para ofrecerlo y usar sus fotos.
        </span>
      </label>

      {errors.length > 0 && (
        <ul className="mt-3 space-y-1">
          {errors.map((err) => (
            <li key={err} className={formStyles.errorText}>
              {err}
            </li>
          ))}
        </ul>
      )}

      <div className={`${formStyles.navRow} rounded-2xl bg-[#09090B] p-4`}>
        <button type="button" onClick={onBack} disabled={submitting} className={formStyles.secondaryButton}>
          Volver
        </button>
        <button type="button" disabled={submitting} onClick={handlePublish} className={`${formStyles.primaryButton} px-7 py-3.5 text-base`}>
          {submitting ? 'Publicando…' : 'Publicar'}
        </button>
      </div>
    </div>
  )
}
