import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { withAssetPrefix } from './asset-path'

describe('withAssetPrefix', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('keeps root-relative paths unchanged without a deployment prefix', () => {
    process.env.NEXT_PUBLIC_ASSET_PREFIX = ''
    expect(withAssetPrefix('/search-index.json')).toBe('/search-index.json')
  })

  it('prefixes static paths for GitHub Pages subpath deployments', () => {
    process.env.NEXT_PUBLIC_ASSET_PREFIX = '/Sin-Frenos'
    expect(withAssetPrefix('/search-index.json')).toBe('/Sin-Frenos/search-index.json')
  })

  it('does not duplicate an existing prefix', () => {
    process.env.NEXT_PUBLIC_ASSET_PREFIX = '/Sin-Frenos/'
    expect(withAssetPrefix('/Sin-Frenos/search-index.json')).toBe('/Sin-Frenos/search-index.json')
  })

  it('keeps absolute URLs unchanged', () => {
    process.env.NEXT_PUBLIC_ASSET_PREFIX = '/Sin-Frenos'
    expect(withAssetPrefix('https://example.com/search-index.json')).toBe('https://example.com/search-index.json')
  })
})
