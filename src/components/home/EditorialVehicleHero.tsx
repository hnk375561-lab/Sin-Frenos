'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { QuickSearchForm } from '@/components/home/QuickSearchForm'

gsap.registerPlugin(ScrollTrigger)

export type EditorialVehicle = {
  slug: string
  title: string
  manufacturer: string
  category: string
  imageSrc: string
  imageAlt: string
}

type CategoryLink = {
  label: string
  count: number
  href: string
}

type EditorialVehicleHeroProps = {
  vehicleCount: number
  evidenceCoveragePct: number | null
  searchExamples?: string[]
  categoryChips?: CategoryLink[]
  vehicles: EditorialVehicle[]
}

const FALLBACK_VEHICLE: EditorialVehicle = {
  slug: 'catalogo',
  title: 'El archivo automotor',
  manufacturer: 'Sin Frenos',
  category: 'Catálogo',
  imageSrc: '/images/ui/icon-512.png',
  imageAlt: 'Sin Frenos',
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduced
}

export function EditorialVehicleHero({
  vehicleCount,
  evidenceCoveragePct,
  searchExamples,
  categoryChips,
  vehicles,
}: EditorialVehicleHeroProps) {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRefs = useRef<Array<HTMLDivElement | null>>([])
  const activeRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const reducedMotion = useReducedMotion()
  const sequence = useMemo(() => (vehicles.length > 0 ? vehicles : [FALLBACK_VEHICLE]), [vehicles])

  useEffect(() => {
    if (sequence.length < 2) return
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage) return

    const context = gsap.context(() => {
      const render = (progress: number) => {
        const scaled = gsap.utils.clamp(0, sequence.length - 0.0001, progress * sequence.length)
        const index = Math.min(sequence.length - 1, Math.floor(scaled))
        const local = scaled - index
        const next = Math.min(sequence.length - 1, index + 1)
        const reveal = Math.min(1, Math.max(0, (local - 0.48) / 0.52))

        frameRefs.current.forEach((frame, frameIndex) => {
          if (!frame) return
          if (reducedMotion) {
            gsap.set(frame, { autoAlpha: frameIndex === index ? 1 : 0, clipPath: 'inset(0% 0% 0% 0%)', scale: 1, yPercent: 0 })
            return
          }
          if (frameIndex === index) {
            gsap.set(frame, { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', scale: 1 + reveal * 0.025, yPercent: 0, filter: `saturate(${1 - reveal * 0.28})` })
          } else if (frameIndex === next && next !== index) {
            gsap.set(frame, { autoAlpha: 1, clipPath: `inset(${100 - reveal * 100}% 0% 0%)`, scale: 1.04 - reveal * 0.04, yPercent: 3 - reveal * 3, filter: 'saturate(1)' })
          } else {
            gsap.set(frame, { autoAlpha: 0, clipPath: 'inset(100% 0% 0% 0%)', scale: 1.04, yPercent: 3 })
          }
        })

        if (index !== activeRef.current) {
          activeRef.current = index
          setActiveIndex(index)
        }
      }

      const trigger = ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.72,
        invalidateOnRefresh: true,
        onUpdate: (self) => render(self.progress),
      })

      const renderFromScroll = () => {
        const range = Math.max(1, root.offsetHeight - window.innerHeight)
        render(gsap.utils.clamp(0, 1, -root.getBoundingClientRect().top / range))
      }

      renderFromScroll()
      window.addEventListener('scroll', renderFromScroll, { passive: true })
      ScrollTrigger.refresh()
      return () => {
        trigger.kill()
        window.removeEventListener('scroll', renderFromScroll)
      }
    }, root)

    return () => context.revert()
  }, [reducedMotion, sequence])

  useEffect(() => {
    const root = rootRef.current
    if (!root || sequence.length < 2) return
    const updateActiveFrame = () => {
      const range = Math.max(1, root.offsetHeight - window.innerHeight)
      const progress = Math.min(1, Math.max(0, -root.getBoundingClientRect().top / range))
      const nextIndex = Math.min(sequence.length - 1, Math.floor(progress * sequence.length))
      if (nextIndex !== activeRef.current) {
        activeRef.current = nextIndex
        setActiveIndex(nextIndex)
      }
    }
    updateActiveFrame()
    window.addEventListener('scroll', updateActiveFrame, { passive: true })
    return () => window.removeEventListener('scroll', updateActiveFrame)
  }, [sequence.length])

  useEffect(() => {
    if (reducedMotion) return
    const frame = frameRefs.current[activeIndex]
    if (!frame) return
    gsap.to(frame, { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', scale: 1, yPercent: 0, duration: 0.55, ease: 'power3.out', overwrite: true })
  }, [activeIndex, reducedMotion])

  useEffect(() => {
    const frame = frameRefs.current[activeIndex]
    if (!frame) return
    gsap.fromTo(frame.querySelector('[data-vehicle-caption]'), { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: reducedMotion ? 0 : 0.42, ease: 'power3.out' })
  }, [activeIndex, reducedMotion])

  const jumpToVehicle = (index: number) => {
    const root = rootRef.current
    if (!root || sequence.length < 2) {
      setActiveIndex(index)
      return
    }
    const range = Math.max(0, root.offsetHeight - window.innerHeight)
    const offset = root.getBoundingClientRect().top + window.scrollY + range * (index / sequence.length)
    window.scrollTo({ top: offset, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  const categoryLinks = categoryChips?.slice(0, 4) ?? []

  return (
    <section
      ref={rootRef}
      className="relative overflow-clip bg-[#11100f] font-sans text-white"
      style={{ minHeight: `${Math.max(1, sequence.length) * 82}vh` }}
      aria-labelledby="archive-hero-title"
    >
      <div ref={stageRef} className="sticky top-0 min-h-[calc(100svh-4.5rem)] overflow-hidden">
        <div className="absolute inset-0 bg-[#11100f]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,rgba(17,16,15,0.98)_0%,rgba(17,16,15,0.78)_34%,rgba(17,16,15,0.12)_66%,rgba(17,16,15,0.46)_100%)]" aria-hidden="true" />

        <div className="container-max relative z-10 flex min-h-[calc(100svh-4.5rem)] flex-col justify-between py-8 sm:py-10 lg:py-12">
          <div className="grid flex-1 items-center gap-10 lg:grid-cols-[0.76fr_1.24fr] lg:gap-8">
            <div className="relative z-20 max-w-xl self-center pb-4 lg:pb-16">
              <div className="mb-8 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.24em] text-white/50 sm:text-xs">
                <span className="h-px w-8 bg-[#d65a22]" aria-hidden="true" />
                <span>Marketplace de vehículos en Argentina</span>
              </div>

              <h1 id="archive-hero-title" className="max-w-[12ch] font-sans text-[clamp(2.75rem,6vw,6.7rem)] font-semibold leading-[0.94] tracking-[-0.065em] text-white">
                Comprá y vendé
                <span className="block text-[#e86b2b]">tu vehículo</span>
                <span className="block text-white/90">en Argentina.</span>
              </h1>

              <p className="mt-7 max-w-md text-base leading-relaxed text-white/65 sm:text-lg">
                Publicá gratis tu auto o moto y llegá a compradores reales. Sin comisiones, sin intermediarios: vendé lo que tenés o encontrá lo que buscás, directo con el vendedor.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/publicar" prefetch={false} className="inline-flex items-center justify-center bg-[#d65a22] px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#f07a35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6a06c]">
                  Publicar mi vehículo <span className="ml-3 text-base leading-none" aria-hidden="true">↗</span>
                </Link>
                <Link href="/listings" prefetch={false} className="inline-flex items-center justify-center border border-white/25 px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white/85 transition hover:border-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                  Ver publicaciones <span className="ml-3 text-base leading-none" aria-hidden="true">↗</span>
                </Link>
              </div>

              <div className="mt-10 max-w-lg border-t border-white/15 pt-5">
                <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/45">
                  <span>Buscar en el archivo técnico</span>
                  <span>{vehicleCount} fichas{evidenceCoveragePct !== null && evidenceCoveragePct > 0 ? ` · ${evidenceCoveragePct}% citadas` : ''}</span>
                </div>
                <QuickSearchForm examples={searchExamples} />
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                  {categoryLinks.map((chip) => (
                    <Link key={chip.href} href={chip.href} prefetch={false} className="text-[10px] uppercase tracking-[0.14em] text-white/45 transition hover:text-white/90">
                      {chip.label} <span className="text-white/25">{String(chip.count).padStart(2, '0')}</span>
                    </Link>
                  ))}
                  <Link href="/comparar" className="text-[10px] uppercase tracking-[0.14em] text-white/45 transition hover:text-white/90">Comparar ↗</Link>
                </div>
              </div>
            </div>

            <div className="relative flex min-h-[52svh] items-center justify-center self-center lg:min-h-0 lg:justify-end">
              <div className="relative aspect-[1.08/1] w-full max-w-[48rem] overflow-hidden bg-[#25221f] sm:aspect-[1.15/1] lg:aspect-[1.12/1]">
                {sequence.map((vehicle, index) => (
                  <div
                    key={vehicle.slug}
                    ref={(element) => { frameRefs.current[index] = element }}
                    className="absolute inset-0 origin-center overflow-hidden"
                    style={{
                      zIndex: index + 1,
                      opacity: reducedMotion ? (index === activeIndex ? 1 : 0) : 1,
                      clipPath: index === 0 ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)',
                    }}
                    aria-hidden={index !== activeIndex}
                  >
                    <img
                      src={vehicle.imageSrc}
                      alt={index === activeIndex ? vehicle.imageAlt : ''}
                      fetchPriority={index === 0 ? 'high' : undefined}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_38%,rgba(0,0,0,0.58)_100%)]" aria-hidden="true" />
                    <div data-vehicle-caption className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 sm:inset-x-7 sm:bottom-7">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">{vehicle.category}</p>
                        <p className="mt-1 text-xl font-medium tracking-[-0.04em] text-white sm:text-2xl">{vehicle.title}</p>
                      </div>
                      <Link href={`/vehiculos/${vehicle.slug}`} prefetch={false} className="shrink-0 border-b border-white/70 pb-1 text-[10px] uppercase tracking-[0.16em] text-white/80 transition hover:border-white hover:text-white">
                        Abrir ficha <span className="ml-2 text-sm" aria-hidden="true">↗</span>
                      </Link>
                    </div>
                  </div>
                ))}
                <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-[22%] bg-[linear-gradient(90deg,rgba(17,16,15,0.25),transparent)]" aria-hidden="true" />
              </div>

              <div className="absolute -bottom-7 left-0 right-0 z-40 flex items-center justify-between gap-6 text-[10px] uppercase tracking-[0.18em] text-white/45 lg:bottom-[-2.3rem]">
                <span>Archivo en movimiento</span>
                <div className="flex items-center gap-3" aria-label="Vehículos destacados">
                  <span className="tabular-nums text-white/75">{String(activeIndex + 1).padStart(2, '0')}</span>
                  <span className="h-px w-12 bg-white/30 sm:w-20" aria-hidden="true" />
                  <span className="tabular-nums">{String(sequence.length).padStart(2, '0')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-30 mt-14 flex items-end justify-between gap-6 border-t border-white/15 pt-4 text-[10px] uppercase tracking-[0.16em] text-white/40 sm:mt-16">
            <span className="hidden sm:block">Deslizá para recorrer categorías reales</span>
            <div className="ml-auto flex items-center gap-4" role="list" aria-label="Categorías del archivo">
              {sequence.map((vehicle, index) => (
                <button
                  key={vehicle.slug}
                  type="button"
                  onClick={() => jumpToVehicle(index)}
                  className="group flex items-center gap-2 text-left transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-[#11100f]"
                  aria-label={`Ir a ${vehicle.category}: ${vehicle.title}`}
                  aria-current={index === activeIndex ? 'true' : undefined}
                >
                  <span className={`h-px transition-all duration-300 ${index === activeIndex ? 'w-7 bg-[#e86b2b]' : 'w-3 bg-white/30 group-hover:w-5 group-hover:bg-white/70'}`} aria-hidden="true" />
                  <span className="hidden sm:inline">{vehicle.category}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export type { CategoryLink }
