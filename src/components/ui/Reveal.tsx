'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'zoom' | 'curtain' | 'chapter' | 'glide' | 'swell' | 'rise' | 'glide-l' | 'glide-r'
  once?: boolean
  index?: number
}

const observer = typeof window !== 'undefined'
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('reveal-visible')
        if (entry.target.getAttribute('data-reveal-once') !== 'false') observer?.unobserve(entry.target)
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
  : null

function normalizeDirection(direction: RevealProps['direction']): string {
  if (direction === 'up') return 'rise'
  if (direction === 'left' || direction === 'glide') return 'glide-l'
  if (direction === 'right') return 'glide-r'
  if (direction === 'zoom') return 'swell'
  return direction || 'rise'
}

export function Reveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  once = true,
  index = 0,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const normalizedDirection = normalizeDirection(direction)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(media.matches)
    if (media.matches || !observer) return
    node.setAttribute('data-reveal-once', String(once))
    observer.observe(node)
    const fallback = window.setTimeout(() => node.classList.add('reveal-visible'), 1800)
    return () => {
      observer.unobserve(node)
      window.clearTimeout(fallback)
    }
  }, [once])

  return (
    <div
      ref={ref}
      data-dir={normalizedDirection}
      className={`reveal ${reducedMotion ? 'reveal-visible' : ''} ${className}`.trim()}
      style={{ ['--reveal-delay' as string]: `${Math.min(delay + Math.min(index, 5) * 40, 240)}ms` }}
    >
      {children}
    </div>
  )
}
