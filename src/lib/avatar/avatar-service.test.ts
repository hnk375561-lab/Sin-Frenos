// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { getAvatarSeed, getAvatarSvg, getSafeAvatarSvg, getVisitorIdentity } from './avatar-service'

describe('avatar-service', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('persists one anonymous visitor identity across reads', () => {
    const first = getVisitorIdentity()
    const second = getVisitorIdentity()

    expect(first).toMatch(/^uru_visitor_/)
    expect(second).toBe(first)
    expect(window.localStorage.getItem('sinfrenos:visitor-id')).toBe(first)
  })

  it('generates deterministic local SVG and caches it', () => {
    const first = getAvatarSvg('stable-seed')
    const second = getAvatarSvg('stable-seed')

    expect(first).toContain('<svg')
    expect(second).toBe(first)
    expect(getAvatarSvg('another-seed')).not.toBe(first)
  })

  it('keeps anonymous visual continuity when an account is linked', () => {
    const visitorSeed = getAvatarSeed(null)
    const accountSeed = getAvatarSeed({ id: 'internal-user-id' })

    expect(accountSeed).toBe(visitorSeed)
    expect(getAvatarSeed({ id: 'internal-user-id' })).toBe(visitorSeed)
  })

  it('returns a non-empty SVG fallback when generation fails', () => {
    expect(getSafeAvatarSvg('fallback-check')).toContain('<svg')
  })
})
