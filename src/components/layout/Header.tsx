'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SITE_NAME } from '@/config/site'
import { cn } from '@/lib/utils'
import { useWishlist } from '@/lib/hooks/useWishlist'
import { useAuth } from '@/lib/hooks/useAuth'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { CommandPalette } from '@/components/search/CommandPalette'

const NAV_LINKS = [
  { href: '/listings', label: 'Comprar' },
  { href: '/vehiculos', label: 'Explorar' },
  { href: '/comparar', label: 'Comparar' },
  { href: '/fabricantes', label: 'Marcas' },
  { href: '/guias', label: 'Guías' },
] as const

const SECONDARY_LINKS = [
  { href: '/galeria', label: 'Galería' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/financiamiento', label: 'Financiamiento' },
  { href: '/favoritos', label: 'Favoritos' },
] as const

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  )
}

export function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { count: wishlistCount, hydrated: wishlistHydrated } = useWishlist()
  const { user, loading: authLoading, signOut } = useAuth()

  useEffect(() => {
    if (!menuOpen) return
    const closeId = window.setTimeout(() => setMenuOpen(false), 0)
    return () => window.clearTimeout(closeId)
  }, [pathname, menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return
      event.preventDefault()
      setPaletteOpen(true)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const iconButtonClass = 'relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8b6d]'

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#10171c]/95 text-white shadow-[0_8px_30px_rgba(7,16,20,0.12)] backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="container-max flex min-h-[4.5rem] items-center justify-between gap-4">
        <Link href="/" className="group flex shrink-0 items-center gap-3 text-white no-style" aria-label={`${SITE_NAME}, inicio`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff6b47] text-sm font-bold tracking-[-0.08em] text-[#10171c] transition-transform duration-200 group-hover:rotate-[-6deg] motion-reduce:transition-none">SF</span>
          <span className="hidden text-[1.05rem] font-semibold tracking-[-0.04em] sm:block">{SITE_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegación principal">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8b6d]',
                  active ? 'text-white' : 'text-white/60 hover:text-white'
                )}
              >
                {link.label}
                {active && <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-[#ff8b6d]" aria-hidden="true" />}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPaletteOpen(true)} aria-label="Buscar en Sin Frenos (atajo: /)" className={iconButtonClass}>
            <SearchIcon />
            <span className="sr-only">Buscar</span>
          </button>
          <Link href="/favoritos" aria-label={`Favoritos${wishlistHydrated && wishlistCount > 0 ? ` (${wishlistCount})` : ''}`} className={cn(iconButtonClass, 'hidden sm:flex')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.8 8.9c0 5.4-8.8 10.1-8.8 10.1S3.2 14.3 3.2 8.9A4.2 4.2 0 0 1 11 6.5a4.2 4.2 0 0 1 7.8 2.4Z" />
            </svg>
            {wishlistHydrated && wishlistCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff6b47] px-1 text-[9px] font-bold text-[#10171c]">{wishlistCount > 99 ? '99+' : wishlistCount}</span>}
          </Link>
          <ThemeToggle className={iconButtonClass} />
          {authLoading ? (
            <span className={cn(iconButtonClass, 'hidden cursor-default opacity-40 sm:flex')} aria-hidden="true"><UserIcon /></span>
          ) : user ? (
            <button type="button" onClick={() => signOut()} aria-label={`Cerrar sesión (${user.email})`} title={`Sesión iniciada como ${user.email}`} className={cn(iconButtonClass, 'hidden sm:flex')}>
              <UserIcon />
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[#7be0a7]" aria-hidden="true" />
            </button>
          ) : (
            <Link href={`/ingresar?next=${encodeURIComponent(pathname || '/')}`} aria-label="Ingresar" className={cn(iconButtonClass, 'hidden sm:flex')}><UserIcon /></Link>
          )}
          <Link href="/publicar" prefetch={false} className="hidden rounded-full bg-[#ff6b47] px-4 py-2.5 text-sm font-semibold text-[#10171c] transition hover:bg-[#ff8b6d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8b6d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10171c] sm:inline-flex">Publicar</Link>
          <button type="button" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen} aria-controls="mobile-nav" className={cn(iconButtonClass, 'lg:hidden')}>
            {menuOpen ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>}
          </button>
        </div>
      </div>

      <nav id="mobile-nav" aria-label="Navegación móvil" aria-hidden={!menuOpen} className={cn('overflow-hidden border-t border-white/10 bg-[#10171c] transition-[max-height,opacity] duration-200 lg:hidden', menuOpen ? 'max-h-[38rem] opacity-100' : 'pointer-events-none max-h-0 opacity-0')}>
        <div className="container-max pb-5 pt-3">
          <Link href="/publicar" prefetch={false} className="mb-3 flex items-center justify-between rounded-2xl bg-[#ff6b47] px-4 py-3.5 text-sm font-semibold text-[#10171c]">Publicar un vehículo <span aria-hidden="true">↗</span></Link>
          <div className="grid grid-cols-2 gap-1">
            {[...NAV_LINKS, ...SECONDARY_LINKS].map((link) => (
              <Link key={link.href} href={link.href} prefetch={false} aria-current={isActive(link.href) ? 'page' : undefined} className={cn('rounded-xl px-3 py-3 text-sm font-medium transition-colors', isActive(link.href) ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white')}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3 text-sm text-white/55">
            <Link href="/favoritos" className="sm:hidden">Favoritos</Link>
            {user ? <button type="button" onClick={() => signOut()} className="sm:hidden">Cerrar sesión</button> : <Link href={`/ingresar?next=${encodeURIComponent(pathname || '/')}`} className="sm:hidden">Ingresar</Link>}
          </div>
        </div>
      </nav>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </header>
  )
}
