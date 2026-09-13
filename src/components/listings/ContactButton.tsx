'use client'

/**
 * "Contactar al vendedor" en `/listings/ver` (Fase 6). Usa
 * `startConversationWithMessage` (src/lib/conversations/index.ts), que
 * persiste el mensaje real contra `conversations`/`conversation_messages`
 * — ver el comment de cabecera de ese archivo para el estado real (y las
 * limitaciones) de la notificación al vendedor.
 *
 * Reusa las clases de `formStyles` (src/components/listings/publicar/
 * formStyles.ts) en vez de inventar estilos nuevos, mismo criterio que el
 * resto del módulo de listings.
 */

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { startConversationWithMessage } from '@/lib/conversations'
import { formStyles } from '@/components/listings/publicar/formStyles'

export function ContactButton({
  listingId,
  sellerId,
  listingTitle,
}: {
  listingId: string
  sellerId: string
  listingTitle: string
}) {
  const { user, loading } = useAuth()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState(`Hola, me interesa "${listingTitle}". ¿Sigue disponible?`)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mientras useAuth resuelve la sesión inicial, no se sabe todavía si
  // mostrar "iniciá sesión" o el botón real — mismo criterio que el
  // resto del sitio (ej. Header) con `authLoading`.
  if (loading) return null

  // El propio vendedor no se contacta a sí mismo. `startConversationWithMessage`
  // ya rechaza esto del lado de la función, este chequeo solo evita
  // mostrarle un botón que sabemos de antemano que va a fallar.
  if (user && user.id === sellerId) return null

  if (!user) {
    return (
      <Link href="/ingresar" className={formStyles.primaryButton}>
        Iniciá sesión para contactar al vendedor
      </Link>
    )
  }

  if (sent) {
    return (
      <div role="status" className="rounded-lg border border-auto-accent/30 bg-auto-accent/5 p-4 text-sm text-neutral-700">
        ✅ Mensaje enviado. Podés seguir la conversación en{' '}
        <Link href="/mensajes" className="font-semibold underline">
          tus mensajes
        </Link>
        .
      </div>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (sending || !user) return
    setSending(true)
    setError(null)
    try {
      await startConversationWithMessage({ listingId, sellerId, buyerId: user.id, message })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje.')
    } finally {
      setSending(false)
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={formStyles.primaryButton}>
        Contactar al vendedor
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={formStyles.stepCard}>
      <label className={formStyles.label} htmlFor="contact-message">
        Mensaje para el vendedor
      </label>
      <textarea
        id="contact-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        required
        className={`${formStyles.textarea} mt-2`}
      />
      {error && <p className={`${formStyles.errorText} mt-2`}>{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={sending} className={formStyles.primaryButton}>
          {sending ? 'Enviando…' : 'Enviar mensaje'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={sending}
          className={formStyles.secondaryButton}
        >
          Cancelar
        </button>
      </div>
      <p className="mt-2 text-[11px] text-neutral-400">
        El vendedor va a ver tu nombre de cuenta y este mensaje al entrar a Sin Frenos. No compartimos tu
        email ni tu teléfono.
      </p>
    </form>
  )
}
