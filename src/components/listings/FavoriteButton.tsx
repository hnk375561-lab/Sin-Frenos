'use client'

/**
 * Corazón de favorito para un LISTING puntual (Fase 6). Usa
 * `useListingFavorites` (src/lib/listings/favorites.ts), no
 * `useWishlist` — ver el comment de cabecera de ese archivo para por qué
 * son dos mecanismos separados a propósito.
 *
 * Pensado para usarse en dos lugares: dentro de `ListingCard` (que ya es
 * un `<Link>` completo) y en `/listings/ver` (fuera de cualquier link).
 * El `preventDefault`/`stopPropagation` es imprescindible en el primer
 * caso — sin eso, tocar el corazón en la grilla navegaría a la ficha en
 * vez de solo togglear el favorito.
 */

import { useListingFavorites } from '@/lib/listings/favorites'

export function FavoriteButton({
  listingId,
  className = '',
  size = 18,
}: {
  listingId: string
  className?: string
  size?: number
}) {
  const { hydrated, isFavorited, toggleFavorite } = useListingFavorites()
  const favorited = hydrated && isFavorited(listingId)

  return (
    <button
      type="button"
      aria-label={favorited ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      aria-pressed={favorited}
      disabled={!hydrated}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void toggleFavorite(listingId)
      }}
      className={`inline-flex items-center justify-center rounded-full border border-white/70 bg-white/90 p-2 text-[#A1A1AA] shadow-[0_5px_16px_rgba(9,9,11,.16)] backdrop-blur transition duration-200 hover:scale-110 hover:text-[#C2410C] disabled:cursor-not-allowed disabled:opacity-50 ${
        favorited ? 'border-[#C2410C] bg-[#FEE2E2] text-[#C2410C]' : ''
      } ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 20.5s-7.5-4.6-10-9.2C.5 8 1.8 4.5 5 3.4c2.2-.8 4.4.1 5.6 2 .3.5.4.7.4.7s.1-.2.4-.7c1.2-1.9 3.4-2.8 5.6-2 3.2 1.1 4.5 4.6 3 7.9-2.5 4.6-10 9.2-10 9.2Z" />
      </svg>
    </button>
  )
}
