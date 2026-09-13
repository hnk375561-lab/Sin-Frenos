'use client'

/**
 * `/mensajes` — bandeja de conversaciones (Fase 6, documento maestro
 * sección 14: "Contacto y favoritos reales"). Es la contracara de
 * `ContactButton` (src/components/listings/ContactButton.tsx): sin esta
 * pantalla, un mensaje enviado a un vendedor quedaría persistido pero
 * invisible para él — acá es donde tanto comprador como vendedor
 * encuentran sus conversaciones y pueden seguir escribiendo.
 *
 * Todo corre client-side contra Supabase, mismo criterio que
 * `/mis-publicaciones` y el resto del módulo de listings (sección 3 del
 * documento maestro: sin servidor propio). RLS
 * (`003_rls_policies.sql`, "Participants can view/send messages") es lo
 * que garantiza que cada usuario solo ve sus propias conversaciones —
 * no hay chequeo adicional de permisos en este archivo porque no hace
 * falta, un tercero simplemente recibe 0 filas.
 *
 * Patrón de navegación (?id=...) calcado de `/listings/ver`: una sola
 * página, sin ruta dinámica de Next, porque el sitio es 100% estático
 * (`output: 'export'`, sección 3) y una ruta `/mensajes/[id]` exigiría
 * generar esos paths en build time, cosa imposible para conversaciones
 * que se crean después del build.
 *
 * Sin Realtime: hay que refrescar (o volver a esta página) para ver una
 * respuesta nueva del otro lado — la sección 4.11 del documento maestro
 * marca explícitamente el upgrade a Supabase Realtime como algo para
 * "cuando haya evidencia de uso real", no para el MVP.
 */

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  listMyConversations,
  getConversationMessages,
  sendMessage,
  type ConversationSummary,
  type ConversationMessageRow,
} from '@/lib/conversations'
import { formStyles } from '@/components/listings/publicar/formStyles'

const cardClass = 'rounded-lg border border-edge bg-surface-card p-4 sm:p-5'

function formatWhen(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return ''
  }
}

function ConversationList({
  conversations,
  activeId,
}: {
  conversations: ConversationSummary[]
  activeId: string | null
}) {
  if (conversations.length === 0) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-neutral-600">
          Todavía no tenés conversaciones. Cuando contactes a un vendedor (o alguien te contacte a vos
          por una publicación), van a aparecer acá.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link
            href={`/mensajes?id=${c.id}`}
            prefetch={false}
            className={`flex gap-3 rounded-lg border p-3 text-left transition duration-200 ${
              c.id === activeId
                ? 'border-auto-accent bg-auto-accent/5'
                : 'border-edge bg-surface-card hover:bg-surface-card-hover'
            }`}
          >
            <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md border border-edge bg-surface-alt">
              {c.listingCoverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL dinámica de Supabase Storage, mismo criterio que ListingCard
                <img src={c.listingCoverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-900">{c.listingTitle}</p>
              <p className="truncate text-xs text-neutral-500">
                {c.isSeller ? 'Comprador: ' : 'Vendedor: '}
                {c.otherUserDisplayName}
              </p>
              {c.lastMessagePreview && (
                <p className="mt-1 truncate text-xs text-neutral-400">{c.lastMessagePreview}</p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function ConversationThread({
  conversation,
  currentUserId,
}: {
  conversation: ConversationSummary
  currentUserId: string
}) {
  const [messages, setMessages] = useState<ConversationMessageRow[]>([])
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadMessages() {
      setLoadingMessages(true)
      try {
        const rows = await getConversationMessages(conversation.id)
        if (active) setMessages(rows)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar los mensajes.')
      } finally {
        if (active) setLoadingMessages(false)
      }
    }

    loadMessages()

    return () => {
      active = false
    }
  }, [conversation.id])

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (sending || !reply.trim()) return
    setSending(true)
    setError(null)
    try {
      await sendMessage({ conversationId: conversation.id, senderId: currentUserId, content: reply })
      const rows = await getConversationMessages(conversation.id)
      setMessages(rows)
      setReply('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la respuesta.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={cardClass}>
      <div className="mb-3 border-b border-edge pb-3">
        <p className="text-sm font-semibold text-neutral-900">{conversation.listingTitle}</p>
        <p className="text-xs text-neutral-500">
          Conversación con {conversation.otherUserDisplayName}
        </p>
        <Link href={`/listings/ver?id=${conversation.listingId}`} className="text-xs font-medium text-auto-accent underline">
          Ver publicación
        </Link>
      </div>

      {loadingMessages ? (
        <p className="text-sm text-neutral-500">Cargando mensajes…</p>
      ) : (
        <ul className="space-y-2">
          {messages.map((m) => {
            const isMine = m.senderId === currentUserId
            return (
              <li key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    isMine ? 'bg-auto-accent text-white' : 'border border-edge bg-surface-alt text-neutral-800'
                  }`}
                >
                  <p>{m.content}</p>
                  <p className={`mt-1 text-[10px] ${isMine ? 'text-white/70' : 'text-neutral-400'}`}>
                    {formatWhen(m.createdAt)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={handleReply} className="mt-4 flex gap-2">
        <input
          type="text"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Escribí una respuesta…"
          className={formStyles.input}
        />
        <button type="submit" disabled={sending || !reply.trim()} className={formStyles.primaryButton}>
          {sending ? 'Enviando…' : 'Enviar'}
        </button>
      </form>
      {error && <p className={`${formStyles.errorText} mt-2`}>{error}</p>}
    </div>
  )
}

function MensajesContent() {
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const activeId = searchParams.get('id')

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !user) return
    let active = true

    async function loadConversations() {
      setConversationsLoading(true)
      try {
        const rows = await listMyConversations(user!.id)
        if (active) setConversations(rows)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar tus conversaciones.')
      } finally {
        if (active) setConversationsLoading(false)
      }
    }

    loadConversations()

    return () => {
      active = false
    }
  }, [user, authLoading])

  if (authLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-neutral-500">Cargando…</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-xl font-semibold text-neutral-900">Mensajes</h1>
        <p className="mt-2 text-sm text-neutral-600">Necesitás iniciar sesión para ver tus mensajes.</p>
        <Link href="/ingresar" className={`mt-4 inline-block ${formStyles.primaryButton}`}>
          Ingresar
        </Link>
      </main>
    )
  }

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-semibold text-neutral-900">Mensajes</h1>
      {error && <p className={`${formStyles.errorText} mt-2`}>{error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div>
          {conversationsLoading ? (
            <p className="text-sm text-neutral-500">Cargando conversaciones…</p>
          ) : (
            <ConversationList conversations={conversations} activeId={activeId} />
          )}
        </div>

        <div>
          {activeConversation ? (
            <ConversationThread conversation={activeConversation} currentUserId={user.id} />
          ) : (
            <div className={cardClass}>
              <p className="text-sm text-neutral-600">
                {conversations.length > 0
                  ? 'Elegí una conversación de la lista para ver los mensajes.'
                  : 'Acá vas a ver el detalle de cada conversación cuando tengas alguna.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function MensajesPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm text-neutral-500">Cargando…</p>
        </main>
      }
    >
      <MensajesContent />
    </Suspense>
  )
}
