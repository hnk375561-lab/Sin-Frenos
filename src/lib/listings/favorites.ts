'use client'

/**
 * Favoritos de LISTINGS del marketplace (Fase 6, documento maestro
 * sección 4.9 y 14). Deliberadamente SEPARADO de `useWishlist`
 * (`src/lib/hooks/useWishlist.ts`): ese hook sirve a TODO el catálogo
 * técnico (vehículos, guías, etc.) con ids `type/slug` y sigue siendo
 * 100% `localStorage` a propósito — esas entidades no son filas de
 * `listings` y no tienen dónde vivir en la tabla `favorites`
 * (`001_initial_schema.sql`: `listing_id UUID NOT NULL REFERENCES
 * listings(id)`, no admite cualquier tipo de entidad). Forzar ambos
 * casos al mismo hook habría exigido romper esa FK o inventar una tabla
 * de favoritos genérica que el documento maestro no pide — ver sección
 * 16, "CONSERVAR": el catálogo técnico y el marketplace se mantienen
 * como conceptos separados en todo el proyecto, esto no es la excepción.
 *
 * Anónimo (sin sesión): mismo patrón que `useWishlist`, un Set en
 * `localStorage` bajo su PROPIA clave (no se mezcla con la wishlist del
 * catálogo, que usa `sinfrenos:wishlist`).
 * Con sesión: lee/escribe contra la tabla `favorites`, protegida por RLS
 * (`003_rls_policies.sql`: cada usuario solo ve/edita sus propias filas).
 * Al loguearse por primera vez con favoritos guardados de forma anónima,
 * se migran una sola vez a la cuenta (insert con `ignoreDuplicates`) y se
 * limpia el localStorage — así no se pierden por haber favoriteado antes
 * de tener cuenta.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

const STORAGE_KEY = 'sinfrenos:listing-favorites'
const LOCAL_EVENT = 'sinfrenos:listing-favorites-change'

function readLocal(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((v): v is string => typeof v === 'string'))
  } catch {
    // localStorage corrupto/deshabilitado: el sitio sigue funcionando,
    // arranca vacío — mismo criterio que useWishlist.
    return new Set()
  }
}

function writeLocal(ids: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)))
    window.dispatchEvent(new Event(LOCAL_EVENT))
  } catch {
    // Cuota excedida o storage deshabilitado: falla en silencio, no rompe
    // la interacción del usuario.
  }
}

async function fetchRemoteIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from('favorites').select('listing_id').eq('user_id', userId)
  if (error) {
    // No tirar: un fallo de red/RLS acá no debe romper la página de
    // listing que está mostrando este botón — se degrada a "sin
    // favoritos cargados todavía", igual criterio que useAuth con
    // Supabase inalcanzable.
    console.error('No se pudieron leer los favoritos de la cuenta:', error.message)
    return new Set()
  }
  return new Set((data ?? []).map((row) => row.listing_id as string))
}

export function useListingFavorites() {
  const { user, loading: authLoading } = useAuth()
  const [ids, setIds] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)
  /** userId ya migrado en esta sesión de navegador — evita repetir el
   *  upsert de migración en cada remount del hook (ej. distintos
   *  ListingCard en la misma página). */
  const migratedFor = useRef<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    let active = true

    async function load() {
      if (user) {
        if (migratedFor.current !== user.id) {
          const localIds = readLocal()
          if (localIds.size > 0) {
            const rows = Array.from(localIds).map((listingId) => ({
              user_id: user.id,
              listing_id: listingId,
            }))
            const { error: upsertError } = await supabase
              .from('favorites')
              .upsert(rows, { onConflict: 'user_id,listing_id', ignoreDuplicates: true })
            if (!upsertError) {
              writeLocal(new Set())
            }
          }
          migratedFor.current = user.id
        }

        const remoteIds = await fetchRemoteIds(user.id)
        if (!active) return
        setIds(remoteIds)
        setHydrated(true)
        return
      }

      // Sin sesión: localStorage puro, igual que useWishlist.
      setIds(readLocal())
      setHydrated(true)
    }

    load()

    return () => {
      active = false
    }
  }, [user, authLoading])

  useEffect(() => {
    // Solo aplica en modo anónimo: sincroniza entre pestañas/instancias
    // del hook en la misma pestaña. Con sesión no hace falta — Supabase
    // es la única fuente de verdad y cada toggle ya actualiza el estado
    // local de esta instancia.
    if (user) return
    const sync = () => setIds(readLocal())
    window.addEventListener('storage', sync)
    window.addEventListener(LOCAL_EVENT, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(LOCAL_EVENT, sync)
    }
  }, [user])

  const isFavorited = useCallback((listingId: string) => ids.has(listingId), [ids])

  const toggleFavorite = useCallback(
    async (listingId: string) => {
      const currentlyFavorited = ids.has(listingId)

      if (!user) {
        const next = readLocal()
        if (currentlyFavorited) next.delete(listingId)
        else next.add(listingId)
        writeLocal(next)
        setIds(next)
        return
      }

      // Optimista: refleja el toggle antes de que vuelva la respuesta de
      // red, y revierte si Supabase lo rechaza.
      setIds((prev) => {
        const next = new Set(prev)
        if (currentlyFavorited) next.delete(listingId)
        else next.add(listingId)
        return next
      })

      const { error } = currentlyFavorited
        ? await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listingId)
        : await supabase.from('favorites').insert({ user_id: user.id, listing_id: listingId })

      if (error) {
        setIds((prev) => {
          const next = new Set(prev)
          if (currentlyFavorited) next.add(listingId)
          else next.delete(listingId)
          return next
        })
        console.error('No se pudo guardar el favorito:', error.message)
      }
    },
    [ids, user]
  )

  return {
    /** true recién después de resolver el estado inicial (local o remoto) — mismo criterio que useWishlist. */
    hydrated,
    ids,
    count: ids.size,
    isFavorited,
    toggleFavorite,
  }
}
