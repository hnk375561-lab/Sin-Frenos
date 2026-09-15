'use client'

import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import { Fragment, forwardRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Vehicle } from '@/types'
import type { ResolvedDisplayImage } from '@/lib/images'
import { getAllEquipmentNames, getEquipmentStatus, type EquipmentStatus } from '@/lib/vehicle-compare-equipment'
import { parsePowerHp } from '@/lib/vehicle-power'
import { hasMixedPriceCurrencies, parsePriceUsd } from '@/lib/vehicle-price'
import { cn } from '@/lib/utils'

export const MAX_COMPARE = 5

interface AnimatedVehicleCompareTableProps {
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
  { key: 'power', label: 'Potencia', group: 'Potencia y precio', direction: 'higher', getValue: (v) => v.power || null, getComparable: (v) => parsePowerHp(v) },
  { key: 'price', label: 'Precio', group: 'Potencia y precio', direction: 'lower', getValue: (v) => v.price || null, getComparable: (v) => parsePriceUsd(v) },
  { key: 'speed', label: 'Velocidad máxima', group: 'Rendimiento', direction: 'higher', getValue: (v) => v.performance?.speed || null, getComparable: (v) => extractNumeric(v.performance?.speed) },
  { key: 'acceleration', label: 'Aceleración', group: 'Rendimiento', direction: 'lower', getValue: (v) => v.performance?.acceleration || null, getComparable: (v) => extractNumeric(v.performance?.acceleration) },
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
  const matches = numeric.reduce<number[]>((acc, value, index) => (value === target ? [...acc, index] : acc), [])
  return matches.length === 1 ? new Set(matches) : new Set()
}

function MetricCell({
  vehicle,
  metric,
  isWinner,
  neutral,
  bar,
  rowVariants,
  reducedMotion,
}: {
  vehicle: Vehicle
  metric: Metric
  isWinner: boolean
  neutral: boolean
  bar: number | null
  rowVariants: Variants
  reducedMotion: boolean
}) {
  const value = display(metric.getValue(vehicle))
  const level = evidenceLevel(vehicle)

  return (
    <motion.div variants={rowVariants} className="min-h-[76px] border-t border-edge px-3 py-3">
      <motion.div
        animate={isWinner && !reducedMotion ? { scale: [1, 1.035, 1] } : undefined}
        transition={isWinner && !reducedMotion ? { duration: 0.42, ease: 'easeOut' } : undefined}
        className="h-full"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="break-words font-mono text-[13px] leading-snug text-ink">
            {value || <span className="text-neutral-400">No disponible</span>}
          </span>
          {isWinner && <span className="shrink-0 rounded-full bg-auto-accent px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase text-[#09090B]">Mejor</span>}
        </div>
        {bar !== null && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-edge/50" aria-hidden="true"><motion.span initial={{ scaleX: reducedMotion ? bar : 0 }} animate={{ scaleX: bar }} transition={{ duration: 0.32, ease: 'easeOut' }} className="block h-full origin-left rounded-full bg-auto-accent" /></div>}
        {neutral && <p className="mt-2 font-sans text-[10px] font-medium uppercase tracking-wide text-neutral-500">No concluyente</p>}
        {level && <p className="mt-2 font-sans text-[10px] leading-tight text-neutral-500" title={level}>{EVIDENCE_LABELS[level] || level}</p>}
      </motion.div>
    </motion.div>
  )
}

function EquipmentCell({
  vehicle,
  equipmentName,
  allKnown,
  rowVariants,
}: {
  vehicle: Vehicle
  equipmentName: string
  allKnown: boolean
  rowVariants: Variants
}) {
  const status: EquipmentStatus = getEquipmentStatus(vehicle, equipmentName)
  const statusLabel = status === 'present' ? 'Sí' : status === 'absent' ? 'No' : 'No disponible'
  const level = evidenceLevel(vehicle)

  return (
    <motion.div variants={rowVariants} className="min-h-[58px] border-t border-edge px-3 py-3">
      <span className={cn('inline-flex rounded-md px-2 py-1 font-mono text-xs font-semibold', status === 'present' && 'bg-emerald-500/10 text-emerald-700', status === 'absent' && allKnown && 'bg-red-500/10 text-red-700', status === 'unknown' && 'bg-surface-alt text-neutral-500')}>
        {statusLabel}
      </span>
      {status === 'unknown' && <p className="mt-1 font-sans text-[10px] uppercase tracking-wide text-neutral-500">No concluyente</p>}
      {level && <p className="mt-2 font-sans text-[10px] leading-tight text-neutral-500">{EVIDENCE_LABELS[level] || level}</p>}
    </motion.div>
  )
}

type VehicleColumnProps = {
  vehicle: Vehicle
  index: number
  vehicles: Vehicle[]
  imageBySlug?: Record<string, ResolvedDisplayImage | null>
  onRemove?: (slug: string) => void
  sameEvidence: boolean
  mixedCurrencies: boolean
  allEquipment: string[]
  uniqueGroups: string[]
  columnVariants: Variants
  rowVariants: Variants
  rowContainerVariants: Variants
  reducedMotion: boolean
}

const VehicleColumn = forwardRef<HTMLDivElement, VehicleColumnProps>(function VehicleColumn({
  vehicle,
  index,
  vehicles,
  imageBySlug,
  onRemove,
  sameEvidence,
  mixedCurrencies,
  allEquipment,
  uniqueGroups,
  columnVariants,
  rowVariants,
  rowContainerVariants,
  reducedMotion,
}, ref) {
  const image = imageBySlug?.[`vehiculos/${vehicle.slug}`]

  return (
    <motion.div
      ref={ref}
      layout
      key={vehicle.slug}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={columnVariants}
      transition={{ layout: reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 } }}
      className="min-w-0 border-l border-edge bg-surface-card"
    >
      <div className="sticky top-0 z-20 min-h-[116px] border-b border-edge bg-surface-card/95 px-3 py-3 backdrop-blur-md">
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

      <motion.div variants={rowContainerVariants} initial="hidden" animate="visible" className="contents">
        {uniqueGroups.map((group) => {
          const groupMetrics = METRICS.filter((metric) => metric.group === group)
          return (
            <Fragment key={group}>
              <div className="h-[31px] border-t border-edge bg-surface-alt px-3 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-auto-accent" aria-hidden="true" />
              {groupMetrics.map((metric) => {
                const comparableValues = vehicles.map(metric.getComparable)
                const priceComparable = metric.key === 'price' && !mixedCurrencies
                const numericComparable = metric.direction !== null && comparableValues.every((value) => value !== null) && (metric.key !== 'price' || priceComparable) && sameEvidence
                const winners = winningIndices(comparableValues, metric.direction, numericComparable)
                const numericValues = comparableValues.filter((value): value is number => value !== null)
                const maxValue = numericValues.length > 1 ? Math.max(...numericValues) : 0
                const comparableValue = metric.getComparable(vehicle)
                const bar = numericComparable && comparableValue !== null && maxValue > 0 ? comparableValue / maxValue : null
                return (
                  <MetricCell
                    key={metric.key}
                    vehicle={vehicle}
                    metric={metric}
                    isWinner={winners.has(index)}
                    neutral={metric.direction !== null && !numericComparable}
                    bar={bar}
                    rowVariants={rowVariants}
                    reducedMotion={reducedMotion}
                  />
                )
              })}
            </Fragment>
          )
        })}

        <Fragment>
          <div className="h-[31px] border-t border-edge bg-surface-alt px-3 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-auto-accent" aria-hidden="true" />
          <MetricCell
            vehicle={vehicle}
            metric={{ key: 'dimensions', label: 'Seguridad', group: 'Seguridad', direction: null, getValue: (v) => v.safety?.euroNCAP ? `${v.safety.euroNCAP}${v.safety.puntaje ? ` · ${v.safety.puntaje} puntos` : ''}` : null, getComparable: () => null }}
            isWinner={false}
            neutral={false}
            bar={null}
            rowVariants={rowVariants}
            reducedMotion={reducedMotion}
          />
          {allEquipment.map((equipmentName) => (
            <EquipmentCell key={equipmentName} vehicle={vehicle} equipmentName={equipmentName} allKnown={vehicles.every((item) => Boolean(item.equipamiento?.length))} rowVariants={rowVariants} />
          ))}
        </Fragment>
      </motion.div>
    </motion.div>
  )
})

function LabelColumn({ allEquipment, uniqueGroups }: { allEquipment: string[]; uniqueGroups: string[] }) {
  return (
    <div className="sticky left-0 z-30 min-w-0 bg-surface-card">
      <div className="sticky top-0 z-40 min-h-[116px] border-b border-r border-edge bg-surface-card/95 px-3 py-3 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500 backdrop-blur-md">Métrica</div>
      {uniqueGroups.map((group) => (
        <div key={group}>
          <div className="h-[31px] border-t border-r border-edge bg-surface-alt px-3 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-auto-accent">{group}</div>
          {METRICS.filter((metric) => metric.group === group).map((metric) => (
            <div key={metric.key} className="flex min-h-[76px] items-start border-t border-r border-edge bg-surface-card px-3 py-3 font-sans text-xs font-semibold text-ink">{metric.label}<span className="ml-1 text-neutral-400" title="Las celdas muestran el nivel de evidencia individual">ⓘ</span></div>
          ))}
        </div>
      ))}
      <div>
        <div className="h-[31px] border-t border-r border-edge bg-surface-alt px-3 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-auto-accent">Seguridad y equipamiento</div>
        <div className="flex min-h-[76px] items-start border-t border-r border-edge bg-surface-card px-3 py-3 font-sans text-xs font-semibold text-ink">Seguridad</div>
        {allEquipment.map((equipmentName) => <div key={equipmentName} className="flex min-h-[58px] items-start border-t border-r border-edge bg-surface-card px-3 py-3 font-sans text-xs text-ink">{equipmentName}</div>)}
      </div>
    </div>
  )
}

export function AnimatedVehicleCompareTable({ vehicles, imageBySlug, onRemove }: AnimatedVehicleCompareTableProps) {
  const prefersReducedMotion = useReducedMotion()
  const reducedMotion = prefersReducedMotion === true

  if (vehicles.length < 2) {
    return <div className="rounded-lg border border-dashed border-edge bg-surface-alt px-6 py-10 text-center"><p className="font-sans text-sm font-semibold text-ink">Agregá otro vehículo para comparar</p><p className="mt-1 text-xs text-neutral-500">La matriz aparece cuando hay al menos 2 vehículos seleccionados.</p></div>
  }

  const columns = `minmax(150px, 180px) repeat(${vehicles.length}, minmax(180px, 1fr))`
  const sameEvidence = confidenceIsComparable(vehicles)
  const mixedCurrencies = hasMixedPriceCurrencies(vehicles)
  const allEquipment = getAllEquipmentNames(vehicles)
  const uniqueGroups = Array.from(new Set(METRICS.map((metric) => metric.group)))

  const columnVariants: Variants = reducedMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1, transition: { duration: 0 } },
        exit: { opacity: 0, transition: { duration: 0 } },
      }
    : {
        hidden: { opacity: 0, scale: 0.96, x: 10 },
        visible: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.24, ease: 'easeOut' } },
        exit: { opacity: 0, scale: 0.96, x: -14, transition: { duration: 0.16, ease: 'easeIn' } },
      }
  const rowVariants: Variants = reducedMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1, transition: { duration: 0 } } }
    : { hidden: { opacity: 0, y: 5 }, visible: { opacity: 1, y: 0, transition: { duration: 0.16, ease: 'easeOut' } } }
  const rowContainerVariants: Variants = reducedMotion
    ? { hidden: {}, visible: { transition: { duration: 0 } } }
    : { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }

  return (
    <section aria-label="Matriz de decisión comparativa" className="space-y-4">
      <div className="rounded-lg border border-edge bg-surface-card shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain">
          <div className="min-w-[720px]">
            <div className="relative grid" style={{ gridTemplateColumns: columns }}>
              <LabelColumn allEquipment={allEquipment} uniqueGroups={uniqueGroups} />
              <AnimatePresence mode="popLayout" initial={false}>
                {vehicles.map((vehicle, index) => (
                  <VehicleColumn
                    key={vehicle.slug}
                    vehicle={vehicle}
                    index={index}
                    vehicles={vehicles}
                    imageBySlug={imageBySlug}
                    onRemove={onRemove}
                    sameEvidence={sameEvidence}
                    mixedCurrencies={mixedCurrencies}
                    allEquipment={allEquipment}
                    uniqueGroups={uniqueGroups}
                    columnVariants={columnVariants}
                    rowVariants={rowVariants}
                    rowContainerVariants={rowContainerVariants}
                    reducedMotion={reducedMotion}
                  />
                ))}
              </AnimatePresence>
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

export { AnimatedVehicleCompareTable as VehicleCompareTable }
