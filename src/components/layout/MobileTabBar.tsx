'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/', label: 'Inicio', icon: '⌂' },
  { href: '/explorar', label: 'Explorar', icon: '⌕' },
  { href: '/comparar', label: 'Comparar', icon: '⇄' },
  { href: '/buscar', label: 'Buscar', icon: '⌘' },
  { href: '/favoritos', label: 'Guardados', icon: '♡' },
]

export function MobileTabBar() {
  const pathname = usePathname()
  return (
    <nav aria-label="Navegación rápida" className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-white/15 bg-[#09090B]/90 px-2 py-2 text-white shadow-2xl backdrop-blur-xl lg:hidden" style={{ paddingBottom: 'calc(.5rem + env(safe-area-inset-bottom))' }}>
      {ITEMS.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`)
        return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={cn('flex min-w-14 flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] transition-colors', active ? 'bg-white/15 text-white' : 'text-white/55 hover:text-white')}><span className="font-mono text-lg leading-none" aria-hidden="true">{item.icon}</span><span>{item.label}</span></Link>
      })}
    </nav>
  )
}
