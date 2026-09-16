'use client'

import multiavatar from './multiavatar'
import type { User } from '@supabase/supabase-js'

const VISITOR_KEY = 'sinfrenos:visitor-id'
const ACCOUNT_LINK_PREFIX = 'sinfrenos:avatar-account:'
const SVG_CACHE_PREFIX = 'sinfrenos:avatar-svg:'
const memoryStore = new Map<string, string>()

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return memoryStore.get(key) ?? null
  try {
    return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key)
  } catch {
    return memoryStore.get(key) ?? null
  }
}

function writeStorage(key: string, value: string): void {
  memoryStore.set(key, value)
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
    return
  } catch {
    // Private browsing or storage policy: sessionStorage is a safe fallback.
  }
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // In-memory continuity still prevents repeated generation in this session.
  }
}

function createVisitorId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `uru_visitor_${crypto.randomUUID()}`
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    const id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    return `uru_visitor_${id}`
  }
  // Old browsers without Web Crypto get a stable, non-personal fallback.
  return 'uru_visitor_legacy-browser'
}

export function getVisitorIdentity(): string {
  const existing = readStorage(VISITOR_KEY)
  if (existing) return existing
  const created = createVisitorId()
  writeStorage(VISITOR_KEY, created)
  return created
}

function accountKey(userId: string): string {
  return `${ACCOUNT_LINK_PREFIX}${userId}`
}

/**
 * Links an authenticated account to its pre-login visitor seed when possible.
 * This keeps the visual identity continuous while avoiding email as seed.
 */
export function getAvatarSeed(user?: Pick<User, 'id'> | null): string {
  if (!user) return getVisitorIdentity()
  const linkedVisitor = readStorage(accountKey(user.id))
  if (linkedVisitor) return linkedVisitor

  const visitor = readStorage(VISITOR_KEY)
  const seed = visitor || user.id
  writeStorage(accountKey(user.id), seed)
  return seed
}

export function getAvatarSvg(seed: string): string {
  const cacheKey = `${SVG_CACHE_PREFIX}${seed}`
  const cached = readStorage(cacheKey)
  if (cached) return cached

  const svg = multiavatar(seed, false)
  if (!svg || !svg.includes('<svg')) throw new Error('Multiavatar returned invalid SVG')
  writeStorage(cacheKey, svg)
  return svg
}

function fallbackSvg(seed: string): string {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) | 0
  const hue = Math.abs(hash) % 360
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Avatar de visitante"><circle cx="32" cy="32" r="32" fill="hsl(${hue} 55% 35%)"/><circle cx="32" cy="25" r="11" fill="#fff"/><path d="M13 57c2-12 10-18 19-18s17 6 19 18" fill="#fff"/></svg>`
}

export function getSafeAvatarSvg(seed: string): string {
  try {
    return getAvatarSvg(seed)
  } catch (error) {
    console.error('[avatar] Multiavatar generation failed', error)
    return fallbackSvg(seed)
  }
}
