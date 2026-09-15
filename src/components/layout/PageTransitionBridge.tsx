'use client'

import { usePathname } from 'next/navigation'

/**
 * Transición visual no bloqueante: el cambio de key reinicia el fundido cuando
 * cambia la ruta. Nunca intercepta enlaces ni agrega latencia.
 */
export function PageTransitionBridge() {
  const pathname = usePathname()

  return (
    <div
      key={pathname}
      aria-hidden="true"
      data-nav-transition-phase="entering"
      className="page-transition-overlay"
    />
  )
}
