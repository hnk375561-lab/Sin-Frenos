/**
 * Prefix a root-relative static asset URL for GitHub Pages deployments.
 *
 * `next.config.js` exposes the configured `basePath` as
 * `NEXT_PUBLIC_ASSET_PREFIX` because client-side fetch() calls do not receive
 * Next.js router URL handling automatically.
 */
export function withAssetPrefix(path: string): string {
  if (!path.startsWith('/')) return path

  const prefix = (process.env.NEXT_PUBLIC_ASSET_PREFIX || '').replace(/\/$/, '')
  if (!prefix || path === prefix || path.startsWith(`${prefix}/`)) return path

  return `${prefix}${path}`
}
