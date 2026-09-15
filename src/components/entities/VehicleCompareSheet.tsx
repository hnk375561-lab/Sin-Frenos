'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Vehicle } from '@/types'
import type { ResolvedDisplayImage } from '@/lib/images'
import { getAllEquipmentNames, getEquipmentStatus, type EquipmentStatus } from '@/lib/vehicle-compare-equipment'
import { parsePowerHp } from '@/lib/vehicle-power'
import { hasMixedPriceCurrencies, parsePriceUsd } from '@/lib/vehicle-price'
import { cn } from '@/lib/utils'
import { useModalFocus } from '@/lib/hooks/useModalFocus'
import { FAB_LAYER_COMPARE_BAR, FAB_LAYER_COMPARE_SHEET, setFabLayer } from '@/lib/scroll/fab-layer'

export const MAX_COMPARE = 5

interface VehicleCompareBarProps {
  selected: Vehicle[]
  imageBySlug?: Record<string, ResolvedDisplayImage | null>
  onRemove: (slug: string) => void
  onClear: () => void
  onOpen: () => void
}

export function VehicleCompareBar({ selected, imageBySlug, onRemove, onClear, onOpen }: VehicleCompareBarProps) {
  const barRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (selected.length === 0) {
      setFabLayer(FAB_LAYER_COMPARE_BAR, null)
      return
    }
    const el = barRef.current
    if (!el) return
    const measure = () => setFabLayer(FAB_LAYER_COMPARE_BAR, { height: el.getBoundingClientRect().height })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener('orientationchange', measure, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('orientationchange', measure)
      setFabLayer(FAB_LAYER_COMPARE_BAR, null)
    }
  }, [selected.length])

  if (selected.length === 0) return null

  return (
    <div ref={barRef} className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]" role="region" aria-label="Comparador de vehículos">
      <div className="flex w-full max-w-2xl flex-wrap items-center gap-3 rounded-2xl border border-edge bg-surface-card/95 p-3 shadow-md backdrop-blur-md sm:gap-4 sm:p-4">
        <div className="flex flex-1 items-center gap-2">
          {selected.map((vehicle) => {
            const image = imageBySlug?.[`vehiculos/${vehicle.slug}`]
            return (
              <div key={vehicle.slug} className="group relative">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-edge bg-surface-card sm:h-12 sm:w-12">
                  {image?.src ? <Image src={image.src} alt={vehicle.title} width={48} height={48} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold uppercase text-neutral-400">{vehicle.title.slice(0, 2)}</div>}
                </div>
                <button type="button" onClick={() => onRemove(vehicle.slug)} aria-label={`Quitar ${vehicle.title} de la comparación`} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-edge bg-surface-elevated text-neutral-500 transition duration-200 hover:text-auto-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auto-accent">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            )
          })}
          <span className="ml-1 text-xs text-neutral-500">{selected.length}/{MAX_COMPARE} seleccionados</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={onClear} className="rounded-lg px-3 py-2 text-xs font-semibold text-neutral-500 transition-colors hover:text-neutral-900">Limpiar</button>
          <button type="button" onClick={onOpen} disabled={selected.length < 2} className="rounded-lg bg-auto-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#09090B] transition-colors hover:bg-auto-accent-orange disabled:cursor-not-allowed disabled:opacity-40">Comparar</button>
        </div>
      </div>
    </div>
  )
}

interface VehicleCompareTableProps {
  vehicles: Vehicle[]
  imageBySlug?: Record<string, ResolvedDisplayImage | null>
  onRemove?: (slug: string) => void
}

type MetricKey = 'power' | 'price' | 'speed' | 'acceleration' | 'dimensions' | 'consumo' | 'transmision' | 'traccion'
type Direction = 'higher' | 'lower' | null

type Metric = {
  key: MetricKey
  label: string
  group: string
  direction: Direction
  getValue: (vehicle: Vehicle) => string | null
  getComparable: (vehicle: Vehicle) => number | null
  comparableUnit?: string
}

const EVIDENCE_LABELS: Record<string, string> = {
  'oficial-nombrado': 'Oficial · nombrado',
  'oficial-visual': 'Oficial · visual',
  'oficial-visual-multifuente': 'Oficial · multifuente',
  respaldado: 'Respaldado',
  especulativo: 'Especulativo',
}

const extractNumeric = (value?: string | null): number | null => {
  if (!value) return null
  const match = value.replace(',', '.').match(/-?\d+(?:\.\d+)?/)
  if (!match) return null
  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : null
}

const display = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null
  if (Array.isArray(value)) return value.join(' · ')
  return typeof value === 'object' ? null : String(value)
}

const METRICS: Metric[] = [
  { key: 'power', label: 'Potencia', group: 'Potencia y precio', direction: 'higher', getValue: (v) => v.power || null, getComparable: (v) => parsePowerHp(v), comparableUnit: 'hp' },
  { key: 'price', label: 'Precio', group: 'Potencia y precio', direction: 'lower', getValue: (v) => v.price || null, getComparable: (v) => parsePriceUsd(v), comparableUnit: 'USD' },
  { key: 'speed', label: 'Velocidad máxima', group: 'Rendimiento', direction: 'higher', getValue: (v) => v.performance?.speed || null, getComparable: (v) => extractNumeric(v.performance?.speed), comparableUnit: 'km/h' },
  { key: 'acceleration', label: 'Aceleración', group: 'Rendimiento', direction: 'lower', getValue: (v) => v.performance?.acceleration || null, getComparable: (v) => extractNumeric(v.performance?.acceleration), comparableUnit: 's' },
  { key: 'dimensions', label: 'Dimensiones', group: 'Dimensiones y uso', direction: null, getValue: (v) => v.dimensiones || null, getComparable: () => null },
  { key: 'consumo', label: 'Consumo', group: 'Dimensiones y uso', direction: null, getValue: (v) => v.consumo || null, getComparable: () => null },
  { key: 'transmision', label: 'Transmisión', group: 'Equipamiento', direction: null, getValue: (v) => v.transmision || null, getComparable: () => null },
  { key: 'traccion', label: 'Tracción', group: 'Equipamiento', direction: null, getValue: (v) => v.traccion || null, getComparable: () => null },
]

function evidenceLevel(vehicle: Vehicle): string | null {
  return vehicle.evidence?.level || null
}

function confidenceIsComparable(vehicles: Vehicle[]): boolean {
  const levels = new Set(vehicles.map(evidenceLevel))
  return levels.size === 1 && !levels.has(null)
}

function winningIndices(values: Array<number | null>, direction: Direction, allowed: boolean): Set<number> {
  if (!allowed || !direction || values.some((value) => value === null)) return new Set()
  const numeric = values as number[]
  const target = direction === 'higher' ? Math.max(...numeric) : Math.min(...numeric)
  const matches = numeric.reduce<number[]>((acc, value, index) => value === target ? [...acc, index] : acc, [])
  return matches.length === 1 ? new Set(matches) : new Set()
}

function MetricCell({ vehicle, metric, isWinner, neutral }: { vehicle: Vehicle; metric: Metric; isWinner: boolean; neutral: boolean }) {
  const value = display(metric.getValue(vehicle))
  const level = evidenceLevel(vehicle)
  return (
    <div className={cn('min-h-[76px] border-l border-edge px-3 py-3', isWinner && 'bg-auto-accent/10 ring-1 ring-inset ring-auto-accent/40')}>
      <div className="flex items-start justify-between gap-2">
        <span className="break-words font-mono text-[13px] leading-snug text-ink">{value || <span className="text-neutral-400">No disponible</span>}</span>
        {isWinner && <span className="shrink-0 rounded-full bg-auto-accent px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase text-[#09090B]">Mejor</span>}
      </div>
      {neutral && <p className="mt-2 font-sans text-[10px] font-medium uppercase tracking-wide text-neutral-500">No concluyente</p>}
      {level && <p className="mt-2 font-sans text-[10px] leading-tight text-neutral-500" title={level}>{EVIDENCE_LABELS[level] || level}</p>}
    </div>
  )
}

function EquipmentCell({ vehicle, equipmentName, allKnown }: { vehicle: Vehicle; equipmentName: string; allKnown: boolean }) {
  const status: EquipmentStatus = getEquipmentStatus(vehicle, equipmentName)
  const statusLabel = status === 'present' ? 'Sí' : status === 'absent' ? 'No' : 'No disponible'
  const level = evidenceLevel(vehicle)
  return (
    <div className="min-h-[58px] border-l border-edge px-3 py-3">
      <span className={cn('inline-flex rounded-md px-2 py-1 font-mono text-xs font-semibold', status === 'present' && 'bg-emerald-500/10 text-emerald-700', status === 'absent' && allKnown && 'bg-red-500/10 text-red-700', status === 'unknown' && 'bg-surface-alt text-neutral-500')}>
        {statusLabel}
      </span>
      {status === 'unknown' && <p className="mt-1 font-sans text-[10px] uppercase tracking-wide text-neutral-500">No concluyente</p>}
      {level && <p className="mt-2 font-sans text-[10px] leading-tight text-neutral-500">{EVIDENCE_LABELS[level] || level}</p>}
    </div>
  )
}

function GroupLabel({ children, columns }: { children: string; columns: number }) {
  return <div className="grid border-t border-edge bg-surface-alt" style={{ gridColumn: '1 / -1', gridTemplateColumns: `minmax(150px, 180px) repeat(${columns}, minmax(180px, 1fr))` }}><div className="sticky left-0 z-10 border-r border-edge px-3 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-auto-accent">{children}</div><div className="col-span-full" /></div>
}

export function VehicleCompareTable({ vehicles, imageBySlug, onRemove }: VehicleCompareTableProps) {
  if (vehicles.length < 2) {
    return <div className="rounded-lg border border-dashed border-edge bg-surface-alt px-6 py-10 text-center"><p className="font-sans text-sm font-semibold text-ink">Agregá otro vehículo para comparar</p><p className="mt-1 text-xs text-neutral-500">La matriz aparece cuando hay al menos 2 vehículos seleccionados.</p></div>
  }

  const columns = `minmax(150px, 180px) repeat(${vehicles.length}, minmax(180px, 1fr))`
  const sameEvidence = confidenceIsComparable(vehicles)
  const mixedCurrencies = hasMixedPriceCurrencies(vehicles)
  const allEquipment = getAllEquipmentNames(vehicles)
  const uniqueGroups = Array.from(new Set(METRICS.map((metric) => metric.group)))

  return (
    <section aria-label="Matriz de decisión comparativa" className="space-y-4">
      <div className="rounded-lg border border-edge bg-surface-card shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain">
          <div className="min-w-[720px]">
            <div className="sticky top-0 z-30 grid border-b border-edge bg-surface-card/95 backdrop-blur-md" style={{ gridTemplateColumns: columns }}>
              <div className="sticky left-0 z-40 flex items-end border-r border-edge bg-surface-card/95 px-3 py-3 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">Métrica</div>
              {vehicles.map((vehicle) => {
                const image = imageBySlug?.[`vehiculos/${vehicle.slug}`]
                return (
                  <div key={vehicle.slug} className="relative border-l border-edge px-3 py-3">
                    <div className="flex gap-3">
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md border border-edge bg-surface-alt">
                        {image?.src ? <Image src={image.src} alt={vehicle.title} fill sizes="64px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-[10px] text-neutral-400">Sin imagen</span>}
                      </div>
                      <div className="min-w-0">
                        <Link prefetch={false} href={`/vehiculos/${vehicle.slug}`} className="line-clamp-2 font-sans text-sm font-semibold text-ink transition-colors hover:text-auto-accent">{vehicle.title}</Link>
                        <p className="mt-1 truncate font-sans text-[11px] text-neutral-500">{vehicle.manufacturer || 'Fabricante no documentado'}</p>
                      </div>
                    </div>
                    {onRemove && <button type="button" onClick={() => onRemove(vehicle.slug)} className="mt-3 rounded-md border border-edge px-2 py-1 font-sans text-[10px] font-semibold text-neutral-500 transition-colors hover:border-auto-accent hover:text-auto-accent" aria-label={`Quitar ${vehicle.title}`}>Quitar</button>}
                  </div>
                )
              })}
            </div>

            <div className="grid" style={{ gridTemplateColumns: columns }}>
              {uniqueGroups.map((group) => (
                <div key={group} className="contents">
                  <GroupLabel columns={vehicles.length}>{group}</GroupLabel>
                  {METRICS.filter((metric) => metric.group === group).map((metric) => {
                    const comparableValues = vehicles.map(metric.getComparable)
                    const priceComparable = metric.key === 'price' && !mixedCurrencies
                    const numericComparable = metric.direction !== null && comparableValues.every((value) => value !== null) && (metric.key !== 'price' || priceComparable) && sameEvidence
                    const winners = winningIndices(comparableValues, metric.direction, numericComparable)
                    return (
                      <div key={metric.key} className="contents">
                        <div className="sticky left-0 z-10 flex min-h-[76px] items-start border-t border-r border-edge bg-surface-card px-3 py-3 font-sans text-xs font-semibold text-ink">{metric.label}<span className="ml-1 text-neutral-400" title="Las celdas muestran el nivel de evidencia individual">ⓘ</span></div>
                        {vehicles.map((vehicle, index) => <MetricCell key={vehicle.slug} vehicle={vehicle} metric={metric} isWinner={winners.has(index)} neutral={metric.direction !== null && !numericComparable} />)}
                      </div>
                    )
                  })}
                </div>
              ))}

              <div className="contents">
                <GroupLabel columns={vehicles.length}>Seguridad y equipamiento</GroupLabel>
                <div className="sticky left-0 z-10 flex min-h-[76px] items-start border-t border-r border-edge bg-surface-card px-3 py-3 font-sans text-xs font-semibold text-ink">Seguridad</div>
                {vehicles.map((vehicle) => <MetricCell key={vehicle.slug} vehicle={vehicle} metric={{ key: 'dimensions', label: 'Seguridad', group: 'Seguridad', direction: null, getValue: (v) => v.safety?.euroNCAP ? `${v.safety.euroNCAP}${v.safety.puntaje ? ` · ${v.safety.puntaje} puntos` : ''}` : null, getComparable: () => null }} isWinner={false} neutral={false} />)}
                {allEquipment.map((equipmentName) => (
                  <div key={equipmentName} className="contents">
                    <div className="sticky left-0 z-10 flex min-h-[58px] items-start border-t border-r border-edge bg-surface-card px-3 py-3 font-sans text-xs text-ink">{equipmentName}</div>
                    {vehicles.map((vehicle) => <EquipmentCell key={vehicle.slug} vehicle={vehicle} equipmentName={equipmentName} allKnown={vehicles.every((item) => Boolean(item.equipamiento?.length))} />)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-edge bg-surface-alt p-4">
          <h3 className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink">Cómo leer esta matriz</h3>
          <p className="mt-2 text-xs leading-relaxed text-neutral-600">“Mejor” solo aparece cuando la unidad, la moneda, el dato y el nivel de evidencia permiten una comparación defendible. En cualquier otro caso se muestra “No concluyente”.</p>
        </div>
        <div className="rounded-lg border border-edge bg-surface-alt p-4">
          <h3 className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink">Fuentes y limitaciones</h3>
          <ul className="mt-2 space-y-2 text-xs leading-relaxed text-neutral-600">
            {vehicles.map((vehicle) => <li key={vehicle.slug}><strong className="text-ink">{vehicle.title}:</strong> {vehicle.evidence?.primarySource || 'Fuente primaria no documentada.'}{vehicle.evidence?.limitations?.length ? ` Limitaciones: ${vehicle.evidence.limitations.join(' ')}` : ''}</li>)}
            {mixedCurrencies && <li>Los precios usan monedas diferentes; no se declara un ganador de precio ni se inventa conversión.</li>}
            {!sameEvidence && <li>Los niveles de evidencia difieren; los valores numéricos no reciben un ganador automático.</li>}
          </ul>
        </div>
      </div>
    </section>
  )
}

interface VehicleCompareSheetProps {
  open: boolean
  vehicles: Vehicle[]
  imageBySlug?: Record<string, ResolvedDisplayImage | null>
  onClose: () => void
  onRemove: (slug: string) => void
}

export function VehicleCompareSheet({ open, vehicles, imageBySlug, onClose, onRemove }: VehicleCompareSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])

  useModalFocus(open, dialogRef)

  useEffect(() => {
    setFabLayer(FAB_LAYER_COMPARE_SHEET, open ? { hide: true } : null)
    return () => setFabLayer(FAB_LAYER_COMPARE_SHEET, null)
  }, [open])

  if (!open || vehicles.length === 0) return null

  return (
    <div ref={dialogRef} tabIndex={-1} className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Comparador de vehículos" onClick={onClose}>
      <div className="max-h-[92dvh] w-full max-w-6xl overflow-y-auto rounded-t-2xl border border-edge bg-surface-card shadow-md sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-edge bg-surface-card/95 px-5 py-4 backdrop-blur-md">
          <h2 className="font-sans text-lg font-bold text-ink">Comparar vehículos</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar comparador" className="relative flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-surface-alt hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auto-accent"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
        </div>
        <div className="p-5"><VehicleCompareTable vehicles={vehicles} imageBySlug={imageBySlug} onRemove={onRemove} /></div>
      </div>
    </div>
  )
}
