'use client'

/**
 * Fase 6 (documento maestro, sección 14 y 19): "Contactar vendedor" +
 * favoritos reales. Este archivo cubre la parte de contacto: arrancar una
 * conversación con el primer mensaje, listar las conversaciones propias
 * (`/mensajes`) y leer/enviar mensajes dentro de una ya existente.
 *
 * Contra las tablas de `supabase/migrations/001_initial_schema.sql`
 * (`conversations`, `conversation_messages`), ya con RLS real
 * (`003_rls_policies.sql`) — no hace falta ninguna migración nueva para
 * esto, la base ya estaba lista desde Fase 1/2.
 *
 * Notificación por email al vendedor (sección 4.11 del documento maestro:
 * "puede ser tan simple como... mismo patrón que LeadQuoteForm/
 * SellVehicleLeadForm hoy"): DELIBERADAMENTE NO implementada todavía acá.
 * Esos formularios notifican vía mailto/Google Forms porque el destino es
 * fijo (el email del dueño del sitio, `CONTACT_EMAIL` en
 * `LeadQuoteForm.tsx`); acá el destino real sería el email PRIVADO de
 * cada vendedor, que la sección 4.1 prohíbe exponer al navegador del
 * comprador — un mailto no puede armarse del lado del cliente sin
 * filtrar ese dato. Un email automático real por cada mensaje nuevo
 * necesitaría un trigger de Postgres + una Supabase Edge Function que
 * llame a un proveedor de mail, y la sección 3 excluye explícitamente
 * "Edge Functions propias" del MVP. Mientras tanto, la "notificación" es
 * que el mensaje queda persistido y visible en `/mensajes` la próxima vez
 * que el vendedor entra con su cuenta — no es tiempo real, pero es
 * honesto con lo que hay hoy sin inventar infraestructura nueva. Subir
 * esto a un canal de email/push real es una decisión a tomar
 * explícitamente más adelante (con la misma lógica que la sección 3 pide
 * para cualquier upgrade: cuando haya evidencia de que hace falta).
 */

import { supabase } from '@/lib/supabase/client'

export interface ConversationSummary {
  id: string
  listingId: string
  listingTitle: string
  listingCoverUrl: string | null
  otherUserId: string
  otherUserDisplayName: string
  lastMessageAt: string | null
  lastMessagePreview: string | null
  /** true si el usuario actual es el vendedor de este listing (no el comprador). */
  isSeller: boolean
}

export interface ConversationMessageRow {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
}

/**
 * Arranca (o continúa, si ya existía) una conversación entre un
 * comprador y el vendedor de un listing, con un primer mensaje.
 */
export async function startConversationWithMessage(params: {
  listingId: string
  sellerId: string
  buyerId: string
  message: string
}): Promise<{ conversationId: string }> {
  const { listingId, sellerId, buyerId, message } = params
  const trimmed = message.trim()

  if (buyerId === sellerId) {
    throw new Error('No podés iniciar una conversación con tu propia publicación.')
  }
  if (!trimmed) {
    throw new Error('Escribí un mensaje antes de enviarlo.')
  }

  // 001_initial_schema.sql no define un UNIQUE(listing_id, buyer_id) para
  // `conversations` (a diferencia de lo que documenta la sección 4.10 del
  // documento maestro: "Único (listing_id, buyer_id)") — se evita
  // duplicar la conversación acá, en la capa de aplicación
  // (select-then-insert). Ventana de carrera aceptable al volumen actual
  // de MVP; agregar el UNIQUE real es trabajo de una migración futura
  // sobre una tabla de una fase ya cerrada, no de este archivo.
  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .maybeSingle()

  if (findError) {
    throw new Error(`No se pudo verificar conversaciones previas: ${findError.message}`)
  }

  let conversationId = (existing?.id as string | undefined) ?? undefined

  if (!conversationId) {
    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({ listing_id: listingId, seller_id: sellerId, buyer_id: buyerId })
      .select('id')
      .single()

    if (createError || !created) {
      throw new Error(createError?.message ?? 'No se pudo iniciar la conversación.')
    }
    conversationId = created.id as string
  }

  const { error: messageError } = await supabase
    .from('conversation_messages')
    .insert({ conversation_id: conversationId, sender_id: buyerId, content: trimmed })

  if (messageError) {
    throw new Error(`El mensaje no se pudo enviar: ${messageError.message}`)
  }

  return { conversationId }
}

/**
 * Todas las conversaciones donde el usuario participa (como comprador o
 * como vendedor), para la bandeja `/mensajes`. Trae en 4 queries (nunca
 * fila por fila) los datos de listing/portada/nombre del otro
 * participante que la UI necesita — mismo criterio anti-N+1 que
 * `mis-publicaciones/page.tsx` usa para las portadas.
 */
export async function listMyConversations(userId: string): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, listing_id, seller_id, buyer_id, last_message_at, last_message_preview')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) return []

  const listingIds = Array.from(new Set(data.map((c) => c.listing_id as string)))
  const otherIds = Array.from(
    new Set(data.map((c) => (c.buyer_id === userId ? (c.seller_id as string) : (c.buyer_id as string))))
  )

  const [{ data: listingsData }, { data: mediaData }, { data: profilesData }] = await Promise.all([
    supabase.from('listings').select('id, title').in('id', listingIds),
    supabase
      .from('listing_media')
      .select('listing_id, url, is_cover, position')
      .in('listing_id', listingIds)
      .order('position', { ascending: true }),
    // `public_profiles` (003_rls_policies.sql): vista pública segura, nunca
    // expone phone/email crudos del otro participante (sección 4.1).
    supabase.from('public_profiles').select('id, display_name').in('id', otherIds),
  ])

  const titleByListing = new Map((listingsData ?? []).map((l) => [l.id as string, l.title as string]))
  const coverByListing = new Map<string, string>()
  for (const media of mediaData ?? []) {
    const existingCover = coverByListing.get(media.listing_id as string)
    if (!existingCover || media.is_cover) {
      coverByListing.set(media.listing_id as string, media.url as string)
    }
  }
  const nameById = new Map(
    (profilesData ?? []).map((p) => [p.id as string, (p.display_name as string | null) ?? null])
  )

  return data.map((c) => {
    const isSeller = c.seller_id === userId
    const otherUserId = (isSeller ? c.buyer_id : c.seller_id) as string
    return {
      id: c.id as string,
      listingId: c.listing_id as string,
      listingTitle: titleByListing.get(c.listing_id as string) ?? 'Publicación',
      listingCoverUrl: coverByListing.get(c.listing_id as string) ?? null,
      otherUserId,
      otherUserDisplayName: nameById.get(otherUserId) ?? 'Usuario de Sin Frenos',
      lastMessageAt: c.last_message_at as string | null,
      lastMessagePreview: c.last_message_preview as string | null,
      isSeller,
    }
  })
}

/**
 * Mensajes de una conversación puntual, del más viejo al más nuevo. RLS
 * (003_rls_policies.sql, "Participants can view messages") ya garantiza
 * que solo `buyer_id`/`seller_id` de esa fila pueden leerlos — no hace
 * falta re-validar nada acá, un tercero simplemente recibe 0 filas.
 */
export async function getConversationMessages(conversationId: string): Promise<ConversationMessageRow[]> {
  const { data, error } = await supabase
    .from('conversation_messages')
    .select('id, conversation_id, sender_id, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((m) => ({
    id: m.id as string,
    conversationId: m.conversation_id as string,
    senderId: m.sender_id as string,
    content: m.content as string,
    createdAt: m.created_at as string,
  }))
}

/**
 * Responder dentro de una conversación ya existente. RLS exige ser
 * `buyer_id` o `seller_id` de esa conversación Y que `sender_id` sea el
 * propio `auth.uid()` — si algo de eso no se cumple, Supabase devuelve el
 * error acá, no hace falta duplicar el chequeo en el cliente.
 */
export async function sendMessage(params: {
  conversationId: string
  senderId: string
  content: string
}): Promise<void> {
  const trimmed = params.content.trim()
  if (!trimmed) {
    throw new Error('Escribí un mensaje antes de enviarlo.')
  }

  const { error } = await supabase
    .from('conversation_messages')
    .insert({ conversation_id: params.conversationId, sender_id: params.senderId, content: trimmed })

  if (error) {
    throw new Error(error.message)
  }
}
