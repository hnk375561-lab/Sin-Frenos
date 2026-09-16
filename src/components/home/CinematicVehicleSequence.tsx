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

type Tile = { id: string; row: number; col: number; x: number; y: number; rotation: number; scale: number; z: number }

const MOBILE_BREAKPOINT = 520
const DESKTOP_GRID = { rows: 5, cols: 7 }
const MOBILE_GRID = { rows: 4, cols: 5 }

function makeTiles(vehicleKey: string, rows: number, cols: number): Tile[] {
  return Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    return { id: `${vehicleKey}-${row}-${col}`, row, col, x: 0, y: 0, rotation: 0, scale: 1, z: 0 }
  })
}

function randomScatter(tile: Tile, index: number, width: number, height: number) {
  const edge = index % 4
  return {
    x: (edge === 1 ? 1 : edge === 3 ? -1 : gsap.utils.random(-0.4, 0.4)) * width * gsap.utils.random(0.55, 1.25),
    y: (edge === 0 ? -1 : edge === 2 ? 1 : gsap.utils.random(-0.4, 0.4)) * height * gsap.utils.random(0.55, 1.2),
    rotation: gsap.utils.random(-28, 28),
    scale: gsap.utils.random(0.72, 1.18),
    z: gsap.utils.random(-180, 180),
    duration: gsap.utils.random(0.55, 1.15),
    delay: gsap.utils.random(0, 0.2) + (Math.abs(tile.row - 2) + Math.abs(tile.col - 3)) * 0.012,
  }
}

export function CinematicVehicleSequence({ vehicles }: { vehicles: SequenceVehicle[] }) {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const tileRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [grid, setGrid] = useState(DESKTOP_GRID)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const activeIndexRef = useRef(0)

  const tilesByVehicle = useMemo(() => Object.fromEntries(vehicles.map((vehicle) => [vehicle.slug, makeTiles(vehicle.slug, grid.rows, grid.cols)])), [vehicles, grid])
  const mountedVehicles = vehicles.filter((_, index) => Math.abs(index - activeIndex) <= 1)

  useEffect(() => {
    if (!reducedMotion) return
    const root = rootRef.current
    if (!root) return
    const update = () => {
      const range = Math.max(1, root.offsetHeight - window.innerHeight)
      const progress = Math.min(1, Math.max(0, -root.getBoundingClientRect().top / range))
      const nextIndex = Math.min(vehicles.length - 1, Math.floor(progress * vehicles.length))
      activeIndexRef.current = nextIndex
      setActiveIndex(nextIndex)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [reducedMotion, vehicles.length])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches || window.innerWidth < MOBILE_BREAKPOINT)
    update()
    media.addEventListener('change', update)
    window.addEventListener('resize', update)
    return () => { media.removeEventListener('change', update); window.removeEventListener('resize', update) }
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const updateGrid = () => setGrid(window.innerWidth < MOBILE_BREAKPOINT ? MOBILE_GRID : DESKTOP_GRID)
    updateGrid()
    const observer = new ResizeObserver(updateGrid)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage || reducedMotion || vehicles.length < 1) return
    const ctx = gsap.context(() => {
      const scatterAll = (slug: string, assembled: boolean) => {
        const tiles = tilesByVehicle[slug] ?? []
        const width = stage.clientWidth
        const height = stage.clientHeight
        tiles.forEach((tile, index) => {
          const element = tileRefs.current[tile.id]
          if (!element) return
          const scatter = randomScatter(tile, index, width, height)
          gsap.set(element, assembled ? { x: 0, y: 0, rotation: 0, scale: 1, zIndex: 1, opacity: 1 } : { ...scatter, zIndex: Math.round(scatter.z), opacity: 0.86 })
        })
      }
      vehicles.forEach((vehicle, index) => scatterAll(vehicle.slug, index === 0))
      const setProgress = (progress: number) => {
        const scaled = progress * vehicles.length
        const index = Math.min(vehicles.length - 1, Math.floor(scaled))
        const local = scaled - index
        if (index !== activeIndexRef.current) {
          activeIndexRef.current = index
          setActiveIndex(index)
        }
        const current = vehicles[index]
        const next = vehicles[index + 1]
        if (current) {
          const currentTiles = tilesByVehicle[current.slug] ?? []
          const enter = Math.min(1, local / 0.22)
          const exit = Math.max(0, (local - 0.64) / 0.36)
          currentTiles.forEach((tile, tileIndex) => {
            const element = tileRefs.current[tile.id]
            if (!element) return
            const scatter = randomScatter(tile, tileIndex, stage.clientWidth, stage.clientHeight)
            const x = exit > 0 ? gsap.utils.interpolate(0, scatter.x, exit) : gsap.utils.interpolate(scatter.x, 0, enter)
            const y = exit > 0 ? gsap.utils.interpolate(0, scatter.y, exit) : gsap.utils.interpolate(scatter.y, 0, enter)
            const rotation = exit > 0 ? gsap.utils.interpolate(0, scatter.rotation, exit) : gsap.utils.interpolate(scatter.rotation, 0, enter)
            const scale = exit > 0 ? gsap.utils.interpolate(1, scatter.scale, exit) : gsap.utils.interpolate(scatter.scale, 1, enter)
            gsap.set(element, { x, y, rotation, scale, z: exit > 0 ? scatter.z * exit : scatter.z * (1 - enter), opacity: 1 - exit * 0.18 })
          })
        }
        if (next) {
          const nextTiles = tilesByVehicle[next.slug] ?? []
          const nextEnter = Math.max(0, Math.min(1, (local - 0.62) / 0.38))
          nextTiles.forEach((tile, tileIndex) => {
            const element = tileRefs.current[tile.id]
            if (!element) return
            const scatter = randomScatter(tile, tileIndex, stage.clientWidth, stage.clientHeight)
            gsap.set(element, { x: gsap.utils.interpolate(scatter.x, 0, nextEnter), y: gsap.utils.interpolate(scatter.y, 0, nextEnter), rotation: gsap.utils.interpolate(scatter.rotation, 0, nextEnter), scale: gsap.utils.interpolate(scatter.scale, 1, nextEnter), z: gsap.utils.interpolate(scatter.z, 0, nextEnter), opacity: nextEnter })
          })
        }
      }
      const trigger = ScrollTrigger.create({ trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.6, onUpdate: self => setProgress(self.progress) })
      setProgress(0)
      return () => trigger.kill()
    }, root)
    return () => ctx.revert()
  }, [grid, reducedMotion, tilesByVehicle, vehicles])

  const handlePointer = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse' || reducedMotion) return
    const rect = event.currentTarget.getBoundingClientRect()
    setPointer({ x: ((event.clientX - rect.left) / rect.width - 0.5) * 2, y: ((event.clientY - rect.top) / rect.height - 0.5) * 2 })
  }

  if (vehicles.length === 0) return null

  if (reducedMotion) {
    const vehicle = vehicles[activeIndex] ?? vehicles[0]
    return <section ref={rootRef} className="relative border-b border-edge bg-auto-dark text-auto-text" style={{ height: `${vehicles.length * 100}vh` }} aria-labelledby="sequence-heading-reduced">
      <div className="sticky top-0 flex h-screen min-h-[620px] items-center overflow-hidden">
        <div className="container-max grid w-full gap-8 py-16 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div className="max-w-md"><p className="eyebrow text-orange-300">02 · El archivo en movimiento</p><h2 id="sequence-heading-reduced" className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-6xl">Una máquina, una historia, pieza por pieza.</h2><p className="mt-5 text-base leading-relaxed text-zinc-300">Modo de movimiento reducido: recorremos las fichas con una transición suave y accesible.</p></div>
          <Link href={`/vehiculos/${vehicle.slug}`} prefetch={false} className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-white/15 bg-zinc-900"><img src={vehicle.imageSrc} alt={vehicle.imageAlt} className="h-full w-full object-cover transition-opacity duration-500" /><span className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 font-mono text-xs uppercase tracking-wider text-white">{vehicle.manufacturer} · {vehicle.category}</span></Link>
        </div>
      </div>
    </section>
  }

  return (
    <section ref={rootRef} className="relative border-b border-edge bg-auto-dark text-auto-text" style={{ height: `${Math.max(1, vehicles.length) * 100}vh` }} aria-labelledby="sequence-heading" onPointerMove={handlePointer} onPointerLeave={() => setPointer({ x: 0, y: 0 })}>
      <div ref={stageRef} className="sticky top-0 flex h-screen min-h-[620px] items-center overflow-hidden" style={{ perspective: '1200px' }}>
        <div className="container-max relative z-10 grid w-full gap-8 py-16 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div className="max-w-md">
            <p className="eyebrow text-orange-300">02 · El archivo en movimiento</p>
            <h2 id="sequence-heading" className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-6xl">Una máquina, una historia, pieza por pieza.</h2>
            <p className="mt-5 text-base leading-relaxed text-zinc-300 sm:text-lg">Recorré categorías reales del catálogo. Cada ficha se arma frente a vos y vuelve a dispersarse cuando llega la siguiente.</p>
            <div className="mt-8 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.16em] text-zinc-400"><span>{String(activeIndex + 1).padStart(2, '0')} / {String(vehicles.length).padStart(2, '0')}</span><span className="h-px w-12 bg-orange-500" /><span>{vehicles[activeIndex]?.category}</span></div>
          </div>
          <div className="relative mx-auto aspect-[4/3] w-full max-w-3xl" style={{ transform: `rotateX(${pointer.y * -3}deg) rotateY(${pointer.x * 4}deg)`, transition: 'transform 180ms ease-out' }}>
            {mountedVehicles.map((vehicle, vehicleIndex) => {
              const visible = vehicle.slug === vehicles[activeIndex]?.slug || vehicle.slug === vehicles[activeIndex + 1]?.slug
              const tiles = tilesByVehicle[vehicle.slug] ?? []
              return <div key={vehicle.slug} className="absolute inset-0" aria-hidden={!visible}>
                <Link href={`/vehiculos/${vehicle.slug}`} prefetch={false} className="absolute inset-0 z-20" aria-label={`Abrir ficha de ${vehicle.title}`} />
                <span className="absolute bottom-3 left-3 z-10 rounded-full border border-white/20 bg-black/50 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white/80">{vehicle.manufacturer} · {vehicle.category}</span>
                {vehicleIndex === 0 && <img src={vehicle.imageSrc} alt={vehicle.imageAlt} fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full rounded-2xl object-cover opacity-0" />}
                {tiles.map((tile) => {
                  const left = (tile.col / grid.cols) * 100
                  const top = (tile.row / grid.rows) * 100
                  const width = 100 / grid.cols
                  const height = 100 / grid.rows
                  return <div key={tile.id} ref={(node) => { tileRefs.current[tile.id] = node }} className="absolute overflow-hidden border-[0.5px] border-black/10 bg-cover bg-no-repeat shadow-black/10 [backface-visibility:hidden]" style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, backgroundImage: `url(${vehicle.imageSrc})`, backgroundSize: `${grid.cols * 100}% ${grid.rows * 100}%`, backgroundPosition: `${grid.cols === 1 ? 0 : (tile.col / (grid.cols - 1)) * 100}% ${grid.rows === 1 ? 0 : (tile.row / (grid.rows - 1)) * 100}%` }} />
                })}
              </div>
            })}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-5 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Scroll para cambiar de categoría</div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(194,65,12,0.18),transparent_42%)]" />
      </div>
      {reducedMotion && <div className="pointer-events-none absolute inset-0 bg-auto-dark/95" />}
    </section>
  )
}

export type { SequenceVehicle }
