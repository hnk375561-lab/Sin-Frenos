'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { Vehicle } from '@/types'
import type { ResolvedDisplayImage } from '@/lib/images'
import { parsePowerHp } from '@/lib/vehicle-power'
import { parsePriceUsd } from '@/lib/vehicle-price'
import { EntityCard } from '@/components/entities/EntityCard'
import { Reveal } from '@/components/ui/Reveal'

interface HomeDiscoveryProps {
  vehicles: Vehicle[]
  imageBySlug: Record<string, ResolvedDisplayImage | null>
}

type Axis = 'power' | 'price' | 'year'

const AXIS_LABELS: Record<Axis, string> = { power: 'Potencia', price: 'Precio', year: 'Año' }

function axisValue(vehicle: Vehicle, axis: Axis): number | null {
  if (axis === 'power') return parsePowerHp(vehicle)
  if (axis === 'price') return parsePriceUsd(vehicle)
  const year = vehicle.anoLanzamiento
  if (typeof year === 'number') return year
  if (typeof year === 'string' && /^\d{4}$/.test(year)) return Number(year)
  return null
}

function axisFormat(value: number, axis: Axis): string {
  if (axis === 'power') return `${Math.round(value)} hp`
  if (axis === 'price') return `USD ${Math.round(value).toLocaleString('es-AR')}`
  return String(Math.round(value))
}

export function HomeDiscovery({ vehicles, imageBySlug }: HomeDiscoveryProps) {
  const [axis, setAxis] = useState<Axis>('power')
  const ranked = useMemo(() => vehicles
    .map((vehicle) => ({ vehicle, value: axisValue(vehicle, axis) }))
    .filter((item): item is { vehicle: Vehicle; value: number } => item.value !== null)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8), [vehicles, axis])
  const max = ranked[0]?.value || 1

  return (
    <section className="border-y border-edge bg-surface-card py-16 sm:py-24" aria-labelledby="axis-heading">
      <div className="container-max">
        <Reveal direction="chapter">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-auto-accent">03 · El archivo como instrumento</p>
              <h2 id="axis-heading" className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-strong sm:text-5xl">Explorá por el dato que te importa.</h2>
              <p className="mt-4 max-w-xl text-body">Ocho vehículos reales del catálogo, ordenados en vivo. Sin valores estimados: cuando un dato no está documentado, queda fuera.</p>
            </div>
            <Link href="/explorar" className="link-underline shrink-0 font-semibold text-auto-accent">Abrir explorador completo →</Link>
          </div>
        </Reveal>

        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Eje de exploración">
          {(Object.keys(AXIS_LABELS) as Axis[]).map((item) => (
            <button key={item} type="button" role="tab" aria-selected={axis === item} onClick={() => setAxis(item)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${axis === item ? 'border-auto-accent bg-auto-accent text-white' : 'border-edge text-muted hover:border-auto-accent hover:text-auto-accent'}`}>
              {AXIS_LABELS[item]}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ranked.map(({ vehicle, value }, index) => (
            <Reveal key={`${axis}-${vehicle.slug}`} index={index} direction={index % 2 ? 'glide-r' : 'glide-l'}>
              <article className="group rounded-xl border border-edge bg-surface-page p-3 transition-transform duration-200 hover:-translate-y-1">
                <EntityCard entity={vehicle} image={imageBySlug[`vehiculos/${vehicle.slug}`]} size="compact" priority={index < 2} />
                <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                  <span className="font-mono font-semibold text-strong">{axisFormat(value, axis)}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-edge/50"><span className="block h-full origin-left rounded-full bg-auto-accent transition-transform duration-500" style={{ transform: `scaleX(${Math.max(0.08, value / max)})` }} /></span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
