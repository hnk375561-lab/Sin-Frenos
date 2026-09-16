'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SITE_NAME } from '@/config/site'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'

type SearchIntent = 'catalogo' | 'marketplace'

const DEFAULT_EXAMPLES = ['Toyota Corolla', 'BMW X5', 'Honda CBR600RR', 'Audi A4', 'Hyundai Tucson']
const MARKETPLACE_EXAMPLES = ['Corolla 2019', 'camioneta en Entre Ríos', 'moto hasta 3M']
const EXAMPLE_ROTATE_MS = 3200

interface QuickSearchFormProps {
  examples?: string[]
}

const MODES: Record<SearchIntent, { label: string; action: string; hint: string; examples: string[] }> = {
  catalogo: {
    label: 'Fichas técnicas',
    action: '/buscar',
    hint: 'Modelos con especificaciones, fuentes y nivel de evidencia',
    examples: DEFAULT_EXAMPLES,
  },
  marketplace: {
    label: 'En venta',
    action: '/listings',
    hint: 'Publicaciones reales de la comunidad',
    examples: MARKETPLACE_EXAMPLES,
  },
}

/**
 * Búsqueda de la Home con destino explícito. El catálogo técnico y el
 * marketplace son productos distintos: el selector evita enviar una
 * consulta de fichas a una lista de publicaciones vacía.
 */
export function QuickSearchForm({ examples = DEFAULT_EXAMPLES }: QuickSearchFormProps) {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [intent, setIntent] = useState<SearchIntent>('catalogo')
  const inputRef = useRef<HTMLInputElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const [exampleIndex, setExampleIndex] = useState(0)
  const mode = MODES[intent]
  const activeExamples = intent === 'catalogo' ? examples : mode.examples

  useEffect(() => {
    if (reducedMotion || value.length > 0 || activeExamples.length <= 1) return
    const id = setInterval(() => {
      setExampleIndex((i) => (i + 1) % activeExamples.length)
    }, EXAMPLE_ROTATE_MS)
    return () => clearInterval(id)
  }, [reducedMotion, value.length, activeExamples])

  const activeExample = activeExamples[exampleIndex % activeExamples.length] ?? activeExamples[0]

  function selectIntent(nextIntent: SearchIntent) {
    setIntent(nextIntent)
    setExampleIndex(0)
    inputRef.current?.focus()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    router.push(trimmed ? `${mode.action}?q=${encodeURIComponent(trimmed)}` : mode.action)
  }

  return (
    <form
      onSubmit={handleSubmit}
      action={mode.action}
      method="get"
      className="relative mx-auto w-full max-w-none"
      role="search"
    >
      <div className="mb-3 inline-flex rounded-full border border-white/15 bg-white/[0.06] p-1" role="radiogroup" aria-label="Qué querés buscar">
        {(Object.keys(MODES) as SearchIntent[]).map((key) => {
          const active = key === intent
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => selectIntent(key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:text-sm ${active ? 'bg-orange-600 text-white' : 'text-white/60 hover:text-white'}`}
            >
              {MODES[key].label}
            </button>
          )
        })}
      </div>

      <p className="mb-2 text-xs text-white/55">{mode.hint}</p>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A1AA]"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={activeExample ? `Ej. ${activeExample}…` : undefined}
          aria-label={`${mode.label} en ${SITE_NAME}`}
          className="peer w-full rounded-xl border border-white/10 bg-white py-3.5 pl-11 pr-24 text-sm text-[#09090B] shadow-sm placeholder:text-[#A1A1AA] transition focus:border-[#C2410C] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/25 sm:text-base"
        />
        <kbd aria-hidden="true" className="pointer-events-none absolute right-20 top-1/2 hidden -translate-y-1/2 items-center rounded-md border border-[#E4E4E7] bg-[#F4F4F5] px-1.5 py-1 font-mono text-xs text-[#71717A] opacity-100 transition-opacity peer-focus:opacity-0 peer-[:not(:placeholder-shown)]:opacity-0 sm:flex">
          /
        </kbd>
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-[#C2410C] px-3.5 py-2 text-xs font-semibold text-white transition-[background-color,transform] duration-200 ease-out hover:bg-[#9A3412] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 sm:text-sm"
        >
          Buscar
        </button>
      </div>
    </form>
  )
}
