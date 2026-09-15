'use client'

import { useEffect, useState } from 'react'
import type { ListingDraft, PendingPhoto } from '@/lib/listings/types'
import { formStyles } from '@/components/listings/publicar/formStyles'

/**
 * Paso 6 del wizard (sección 6: "Fotos (mínimo 1, recomendado 4+, drag to
 * reorder = position, marcar portada). Video opcional: solo link externo
 * (YouTube/Drive) en el MVP, no procesamos upload de video propio.").
 *
 * Los archivos NO se suben acá — este paso solo arma `draft.photos` en
 * memoria (`PendingPhoto[]`, con `previewUrl` vía `URL.createObjectURL`,
 * sección `types.ts`). La subida real a Storage es responsabilidad
 * exclusiva de `create.ts` (paso 8), que además es quien valida
 * definitivamente tipo/tamaño contra la policy real del bucket
 * (006_storage_and_moderation_fase4.sql). Acá se repite la misma
 * validación a propósito — mismo criterio que deja documentado
 * `create.ts`: "rechazar en el cliente ANTES de gastar una subida, no
 * porque el cliente sea la barrera real".
 *
 * Reordenar es drag-and-drop nativo (sin sumar ninguna librería nueva —
 * sección 0 del documento maestro: el presupuesto $0 también aplica a no
 * sumar dependencias por una feature chica). Al soltar se recalcula
 * `position` de TODAS las fotos según su índice final en el array, no
 * solo de las dos que se intercambiaron.
 */

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024
const MAX_PHOTOS = 10
const MIN_PHOTOS = 1
const RECOMMENDED_PHOTOS = 4

interface StepPhotosProps {
  draft: ListingDraft
  onChange: (patch: Partial<ListingDraft>) => void
  onNext: () => void
  onBack: () => void
}

export function StepPhotos({ draft, onChange, onNext, onBack }: StepPhotosProps) {
  const [error, setError] = useState<string | null>(null)

  // Revocar los object URLs al desmontar el paso (comentario de
  // `PendingPhoto.previewUrl` en types.ts) — evita fugas de memoria si el
  // vendedor entra y sale del paso 6 varias veces durante la sesión.
  useEffect(() => {
    return () => {
      draft.photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe correr al desmontar el paso, no en cada cambio de draft.photos.
  }, [])

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setError(null)

    const accepted: PendingPhoto[] = []
    const rejected: string[] = []

    Array.from(fileList).forEach((file) => {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        rejected.push(`"${file.name}" no es jpg, png o webp.`)
        return
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        rejected.push(`"${file.name}" pesa más de 15 MB.`)
        return
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        position: 0, // se recalcula abajo, junto con las fotos existentes
        isCover: false,
      })
    })

    const remainingSlots = MAX_PHOTOS - draft.photos.length
    if (accepted.length > remainingSlots) {
      accepted.slice(remainingSlots).forEach((photo) => URL.revokeObjectURL(photo.previewUrl))
      accepted.splice(remainingSlots)
      rejected.push(`Podés subir hasta ${MAX_PHOTOS} fotos por publicación.`)
    }
    if (rejected.length > 0) setError(rejected.join(' '))
    if (accepted.length === 0) return

    const hadCoverAlready = draft.photos.some((p) => p.isCover)
    const merged = [...draft.photos, ...accepted].map((photo, index) => ({
      ...photo,
      position: index,
      // La primera foto cargada en todo el wizard se marca portada
      // automáticamente si todavía no había ninguna — el vendedor puede
      // cambiarla después con "Marcar portada" en cualquier otra.
      isCover: hadCoverAlready ? photo.isCover : index === 0,
    }))

    onChange({ photos: merged })
  }

  function removePhoto(id: string) {
    const target = draft.photos.find((p) => p.id === id)
    if (target) URL.revokeObjectURL(target.previewUrl)

    const wasCover = target?.isCover ?? false
    const remaining = draft.photos
      .filter((p) => p.id !== id)
      .map((photo, index) => ({
        ...photo,
        position: index,
        // Si se borró la portada, la nueva primera foto pasa a serlo —
        // nunca puede quedar un draft con fotos pero sin ninguna marcada.
        isCover: wasCover ? index === 0 : photo.isCover,
      }))

    onChange({ photos: remaining })
  }

  function setCover(id: string) {
    onChange({
      photos: draft.photos.map((photo) => ({ ...photo, isCover: photo.id === id })),
    })
  }

  function reorder(fromId: string, toId: string) {
    if (fromId === toId) return
    const items = [...draft.photos].sort((a, b) => a.position - b.position)
    const fromIndex = items.findIndex((p) => p.id === fromId)
    const toIndex = items.findIndex((p) => p.id === toId)
    if (fromIndex === -1 || toIndex === -1) return

    const [moved] = items.splice(fromIndex, 1)
    items.splice(toIndex, 0, moved)

    onChange({ photos: items.map((photo, index) => ({ ...photo, position: index })) })
  }

  const sortedPhotos = [...draft.photos].sort((a, b) => a.position - b.position)
  const canContinue = draft.photos.length >= MIN_PHOTOS

  return (
    <div className={formStyles.stepCard}>
      <h2 className={formStyles.stepTitle}>Fotos del vehículo</h2>
      <p className={formStyles.stepDescription}>
        Subí al menos {MIN_PHOTOS} foto — con {RECOMMENDED_PHOTOS} o más se contacta mucho mejor.
        Arrastrá una foto sobre otra para reordenar, y elegí cuál va de portada.
      </p>

      <label
        htmlFor="listing-photos-input"
        className="marketplace-photo-dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          addFiles(event.dataTransfer.files)
        }}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#FF2E88] text-2xl font-black text-[#171130]" aria-hidden="true">+</span>
        <span className="text-base font-extrabold text-[#171130]">Arrastrá tus fotos acá o elegilas desde tu dispositivo</span>
        <span className={formStyles.helperText}>JPG, PNG o WEBP — hasta 15 MB cada una · máximo {MAX_PHOTOS} fotos</span>
      </label>
      <input
        id="listing-photos-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {error && <p className={`mt-2 ${formStyles.errorText}`}>{error}</p>}

      {sortedPhotos.length === 0 && !error && (
        <div className="mt-4 rounded-2xl border border-[#ECE7FA] bg-[#F6F3FF] p-4 text-center text-sm text-[#4E446C]">
          Todavía no hay fotos. La primera que subas se va a marcar automáticamente como portada.
        </div>
      )}

      {sortedPhotos.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {sortedPhotos.map((photo) => (
            <div
              key={photo.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', photo.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                reorder(e.dataTransfer.getData('text/plain'), photo.id)
              }}
              className={`marketplace-photo-tile group ${photo.isCover ? 'is-cover' : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- preview local de un File vía object URL, no un asset de next/image */}
              <img
                src={photo.previewUrl}
                alt=""
                className="aspect-square w-full cursor-grab object-cover active:cursor-grabbing"
              />
              {photo.isCover && (
                <span className="absolute left-2 top-2 rounded-full bg-[#FF2E88] px-2.5 py-1 text-[11px] font-bold text-[#171130]">
                  Portada
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-[#171130]/85 p-2 opacity-0 transition duration-150 group-hover:opacity-100 focus-within:opacity-100">
                {!photo.isCover && (
                  <button
                    type="button"
                    onClick={() => setCover(photo.id)}
                    className="rounded-full px-2 py-1 text-[11px] font-bold text-white hover:bg-white/20"
                  >
                    Marcar portada
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="ml-auto rounded-full px-2 py-1 text-[11px] font-bold text-white hover:bg-white/20"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={`${formStyles.fieldGroup} mt-4`}>
        <label className={formStyles.label} htmlFor="listing-video-url">
          Link de video (opcional)
        </label>
        <input
          id="listing-video-url"
          type="url"
          placeholder="https://youtube.com/..."
          value={draft.videoUrl}
          onChange={(e) => onChange({ videoUrl: e.target.value })}
          className={formStyles.input}
        />
        <p className={formStyles.helperText}>
          Solo link externo (YouTube, Drive) — no subimos video propio en el MVP.
        </p>
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
