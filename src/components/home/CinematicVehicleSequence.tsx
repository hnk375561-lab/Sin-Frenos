'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type SequenceVehicle = {
  slug: string
  title: string
  manufacturer: string
  category: string
  imageSrc: string
  imageAlt: string
}

type Grid = { rows: number; cols: number }
type TileMotion = { id: string; row: number; col: number; driftX: number; driftY: number; rotation: number; depth: number; release: number; settle: number }

type PointerApi = { x: (value: number) => void; y: (value: number) => void }

const DESKTOP_GRID: Grid = { rows: 5, cols: 6 }
const MOBILE_GRID: Grid = { rows: 4, cols: 5 }
const COMPACT_BREAKPOINT = 420
const SECTION_LABEL = '02 · Recorrido editorial'

function stableHash(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  return (hash >>> 0) / 4294967295
}

function createTileMotion(vehicle: SequenceVehicle, grid: Grid): TileMotion[] {
  return Array.from({ length: grid.rows * grid.cols }, (_, index) => {
    const row = Math.floor(index / grid.cols)
    const col = index % grid.cols
    const x = col / Math.max(1, grid.cols - 1) - 0.5
    const y = row / Math.max(1, grid.rows - 1) - 0.5
    const hash = stableHash(`${vehicle.slug}:${row}:${col}`)
    const edgeDistance = Math.min(col, grid.cols - 1 - col, row, grid.rows - 1 - row)
    const edgeRelease = edgeDistance / Math.max(1, Math.min(grid.rows, grid.cols) / 2)
    const horizontalBias = x * 0.82 + (hash - 0.5) * 0.18
    const verticalBias = y * 0.42 + (hash - 0.5) * 0.2
    return {
      id: `${vehicle.slug}-${row}-${col}`,
      row,
      col,
      driftX: horizontalBias * (1.05 + hash * 0.35),
      driftY: verticalBias * (0.72 + hash * 0.28),
      rotation: (hash - 0.5) * 8,
      depth: (hash - 0.5) * 90,
      release: Math.min(0.3, edgeRelease * 0.22 + hash * 0.08),
      settle: 0.8 + hash * 0.16,
    }
  })
}

function setTileState(element: HTMLDivElement, motion: TileMotion, progress: number, width: number, height: number, entering: boolean) {
  const eased = entering ? gsap.parseEase('power3.out')(progress) : gsap.parseEase('power2.inOut')(progress)
  const amount = entering ? 1 - eased : eased
  gsap.set(element, {
    x: motion.driftX * width * amount,
    y: motion.driftY * height * amount,
    rotation: motion.rotation * amount,
    scale: 1 - amount * 0.055,
    z: motion.depth * amount,
    opacity: entering ? 0.88 + eased * 0.12 : 1 - eased * 0.78,
  })
}

export function CinematicVehicleSequence({ vehicles }: { vehicles: SequenceVehicle[] }) {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const imagePlaneRef = useRef<HTMLDivElement>(null)
  const tileRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const pointerApi = useRef<PointerApi | null>(null)
  const geometryRef = useRef({ width: 0, height: 0 })
  const triggerRef = useRef<ScrollTrigger | null>(null)
  const activeIndexRef = useRef(0)
  const [grid, setGrid] = useState<Grid>(DESKTOP_GRID)
  const [activeIndex, setActiveIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [compact, setCompact] = useState(false)

  const motionByVehicle = useMemo(() => Object.fromEntries(vehicles.map((vehicle) => [vehicle.slug, createTileMotion(vehicle, grid)])), [vehicles, grid])
  const mountedVehicles = vehicles.filter((_, index) => Math.abs(index - activeIndex) <= 1)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setReducedMotion(media.matches)
    const updateViewport = () => {
      setCompact(window.innerWidth < COMPACT_BREAKPOINT)
      setGrid(window.innerWidth < 768 ? MOBILE_GRID : DESKTOP_GRID)
    }
    updateMotionPreference()
    updateViewport()
    media.addEventListener('change', updateMotionPreference)
    window.addEventListener('resize', updateViewport)
    return () => {
      media.removeEventListener('change', updateMotionPreference)
      window.removeEventListener('resize', updateViewport)
    }
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    const imagePlane = imagePlaneRef.current
    if (!stage || !imagePlane || reducedMotion || compact) return
    const xTo = gsap.quickTo(imagePlane, 'rotateY', { duration: 0.7, ease: 'power3.out' })
    const yTo = gsap.quickTo(imagePlane, 'rotateX', { duration: 0.7, ease: 'power3.out' })
    pointerApi.current = { x: (value) => xTo(value), y: (value) => yTo(value) }
    return () => {
      pointerApi.current = null
      gsap.set(imagePlane, { rotateX: 0, rotateY: 0 })
    }
  }, [compact, reducedMotion])

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const imagePlane = imagePlaneRef.current
    if (!root || !stage || reducedMotion || compact || vehicles.length === 0) return

    const context = gsap.context(() => {
      const measure = () => {
        geometryRef.current = { width: stage.clientWidth, height: stage.clientHeight }
        ScrollTrigger.refresh()
      }
      const resizeObserver = new ResizeObserver(measure)
      resizeObserver.observe(stage)
      const sequence = gsap.timeline({ paused: true })
      const renderProgress = (progress: number) => {
        const scaled = progress * Math.max(1, vehicles.length - 1)
        const index = Math.min(vehicles.length - 1, Math.floor(scaled))
        const local = scaled - index
        if (index !== activeIndexRef.current) {
          activeIndexRef.current = index
          setActiveIndex(index)
        }

        const current = vehicles[index]
        const next = vehicles[index + 1]
        const width = geometryRef.current.width || stage.clientWidth
        const height = geometryRef.current.height || stage.clientHeight
        const currentMotion = current ? motionByVehicle[current.slug] ?? [] : []
        const nextMotion = next ? motionByVehicle[next.slug] ?? [] : []
        const assemble = Math.min(1, local / 0.2)
        const dissolve = Math.max(0, Math.min(1, (local - 0.54) / 0.46))
        const handoff = Math.max(0, Math.min(1, (local - 0.62) / 0.38))

        currentMotion.forEach((motion) => {
          const element = tileRefs.current[motion.id]
          if (!element) return
          if (dissolve > 0) setTileState(element, motion, dissolve, width, height, false)
          else setTileState(element, motion, assemble, width, height, true)
        })
        nextMotion.forEach((motion) => {
          const element = tileRefs.current[motion.id]
          if (!element) return
          setTileState(element, motion, handoff, width, height, true)
        })

        if (imagePlane) {
          gsap.set(imagePlane, { translateZ: Math.sin(local * Math.PI) * 7, rotateZ: dissolve * -0.4 })
        }
      }

      sequence.to({}, { duration: 1, ease: 'none' })
      const trigger = ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.75,
        onUpdate: (self) => {
          sequence.progress(self.progress)
          renderProgress(self.progress)
        },
        onRefresh: (self) => renderProgress(self.progress),
      })
      triggerRef.current = trigger
      measure()
      renderProgress(0)
      return () => {
        resizeObserver.disconnect()
        triggerRef.current = null
        trigger.kill()
        sequence.kill()
      }
    }, root)

    return () => context.revert()
  }, [compact, grid, imagePlaneRef, motionByVehicle, reducedMotion, vehicles])

  useEffect(() => {
    if (reducedMotion || compact) return
    const frame = window.requestAnimationFrame(() => {
      triggerRef.current?.refresh()
      triggerRef.current?.update()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [activeIndex, compact, reducedMotion])

  useEffect(() => {
    if (!reducedMotion) return
    const root = rootRef.current
    if (!root) return
    const update = () => {
      const range = Math.max(1, root.offsetHeight - window.innerHeight)
      const progress = Math.min(1, Math.max(0, -root.getBoundingClientRect().top / range))
      const index = Math.min(vehicles.length - 1, Math.floor(progress * Math.max(1, vehicles.length - 1) + 0.5))
      activeIndexRef.current = index
      setActiveIndex(index)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [reducedMotion, vehicles.length])

  if (vehicles.length === 0) return null

  const activeVehicle = vehicles[activeIndex] ?? vehicles[0]
  const firstImage = vehicles[0].imageSrc

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse' || !pointerApi.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2
    pointerApi.current.x(x * 4.5)
    pointerApi.current.y(y * -3.5)
  }

  if (reducedMotion || compact) {
    return <section ref={rootRef} className="relative border-b border-edge bg-auto-dark text-auto-text" style={{ height: `${Math.max(1, vehicles.length) * 82}svh` }} aria-labelledby="sequence-heading-static">
      <div className="sticky top-0 flex min-h-[620px] h-[100svh] items-center overflow-hidden">
        <div className="container-max grid w-full gap-8 py-20 lg:grid-cols-[0.55fr_1.45fr] lg:items-end">
          <div className="max-w-sm"><p className="eyebrow text-orange-300">{SECTION_LABEL}</p><h2 id="sequence-heading-static" className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">El archivo también se mira.</h2><p className="mt-5 text-base leading-relaxed text-zinc-300">Una selección de vehículos reales, elegidos por categoría y fotografía.</p></div>
          <Link href={`/vehiculos/${activeVehicle.slug}`} prefetch={false} className="group relative block overflow-hidden border border-white/15 bg-zinc-900 focus-visible:outline-white"><img src={activeVehicle.imageSrc} alt={activeVehicle.imageAlt} fetchPriority="high" decoding="async" className="aspect-[16/9] w-full object-cover transition-opacity duration-500" /><div className="flex items-baseline justify-between gap-4 border-t border-white/15 px-1 py-4 text-white"><div><p className="font-mono text-xs text-orange-300">{activeVehicle.category}</p><h3 className="mt-1 text-2xl font-bold sm:text-4xl">{activeVehicle.title}</h3></div><span className="font-mono text-xs text-zinc-400">Abrir ficha ↗</span></div></Link>
        </div>
      </div>
    </section>
  }

  return <section ref={rootRef} className="relative border-b border-edge bg-auto-dark text-auto-text" style={{ height: `${Math.max(1, vehicles.length) * 100}svh` }} aria-labelledby="sequence-heading" onPointerMove={handlePointerMove} onPointerLeave={() => { pointerApi.current?.x(0); pointerApi.current?.y(0) }}>
    <div ref={stageRef} className="sticky top-0 flex h-[100svh] min-h-[680px] items-center overflow-hidden" style={{ perspective: '1200px' }}>
      <div className="container-max relative z-10 grid w-full gap-10 py-20 lg:grid-cols-[0.52fr_1.48fr] lg:items-end">
        <div className="order-2 max-w-sm pb-3 lg:order-1">
          <p className="eyebrow text-orange-300">{SECTION_LABEL}</p>
          <h2 id="sequence-heading" className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">El archivo también se mira.</h2>
          <p className="mt-5 text-base leading-relaxed text-zinc-300">Una selección de vehículos reales, elegidos por categoría y fotografía. La imagen llega antes que la interfaz.</p>
          <div className="mt-10 border-t border-white/20 pt-4 text-zinc-400" aria-live="polite"><p className="font-mono text-xs text-orange-300">{String(activeIndex + 1).padStart(2, '0')} / {String(vehicles.length).padStart(2, '0')} · {activeVehicle.category}</p><p className="mt-2 text-sm">{activeVehicle.manufacturer}</p></div>
        </div>
        <div ref={imagePlaneRef} className="order-1 relative mx-auto w-full max-w-[980px] lg:order-2" style={{ transformStyle: 'preserve-3d' }}>
          <div className="relative aspect-[16/10] overflow-visible" aria-label="Secuencia de vehículos por categoría">
            <img src={firstImage} alt="" aria-hidden="true" fetchPriority="high" decoding="async" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0" />
            {mountedVehicles.map((vehicle, vehicleIndex) => {
              const tiles = motionByVehicle[vehicle.slug] ?? []
              const isCurrent = vehicle.slug === activeVehicle.slug
              return <figure key={vehicle.slug} className={`absolute inset-0 ${isCurrent ? 'z-10' : 'z-0'}`} aria-hidden={!isCurrent}>
                <Link href={`/vehiculos/${vehicle.slug}`} prefetch={false} className="absolute inset-0 z-20" aria-label={`Abrir ficha de ${vehicle.title}`} />
                {tiles.map((motion) => {
                  const left = `${(motion.col / grid.cols) * 100}%`
                  const top = `${(motion.row / grid.rows) * 100}%`
                  const width = `${100 / grid.cols}%`
                  const height = `${100 / grid.rows}%`
                  return <div key={motion.id} ref={(node) => { tileRefs.current[motion.id] = node }} className="absolute overflow-hidden bg-no-repeat" style={{ left, top, width, height, backgroundImage: `url(${vehicle.imageSrc})`, backgroundSize: `${grid.cols * 100}% ${grid.rows * 100}%`, backgroundPosition: `${grid.cols === 1 ? 0 : (motion.col / (grid.cols - 1)) * 100}% ${grid.rows === 1 ? 0 : (motion.row / (grid.rows - 1)) * 100}%`, transform: 'translate3d(0,0,0)', opacity: vehicleIndex === 0 ? 1 : 0 }} />
                })}
                <figcaption className="pointer-events-none absolute bottom-4 left-4 right-4 z-30 flex items-baseline justify-between gap-4 text-white sm:bottom-5 sm:left-6 sm:right-6"><span className="max-w-[70%] text-2xl font-bold tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,.45)] sm:text-4xl">{vehicle.title}</span><span className="font-mono text-xs text-zinc-300 drop-shadow-[0_2px_10px_rgba(0,0,0,.45)]">{vehicle.category}</span></figcaption>
              </figure>
            })}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-7 right-4 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 sm:right-8">Desplazá para continuar</div>
    </div>
  </section>
}

export type { SequenceVehicle }
