import Link from 'next/link'
import { QuickSearchForm } from '@/components/home/QuickSearchForm'
import { HeroSidePanel } from '@/components/home/HeroSidePanel'
import { type Vehicle } from '@/types'

interface ArchiveHeroCategoryChip {
  label: string
  count: number
  href: string
}

interface ArchiveHeroProps {
  vehicleCount: number
  evidenceCoveragePct: number | null
  featuredVehicles: Vehicle[]
  searchExamples?: string[]
  categoryChips?: ArchiveHeroCategoryChip[]
}

/**
 * HERO — MARKETPLACE-FIRST (actualizado sept. 2026, ver traspaso)
 * Concepto anterior: "CADA DATO TIENE UN ORIGEN" (archivo técnico).
 * Concepto actual: "Comprá y vendé tu vehículo en Argentina" — el
 * mensaje principal pasa a ser el marketplace; el catálogo técnico
 * (evidencia, fichas, comparador) se mantiene como segundo mensaje y
 * como accesos secundarios, no como identidad principal de la portada.
 *
 * Composición editorial asimétrica (sin cambios de estructura):
 * - Lado izquierdo: identificador, título, buscador — sigue server-side
 *   por LCP.
 * - Lado derecho: listings reales del marketplace cuando existan,
 *   fichas técnicas del catálogo como fallback (`HeroSidePanel.tsx`).
 *
 * Metáfora visual de "documento físico" conservada para las fichas del
 * catálogo (siguen existiendo, solo bajaron de jerarquía); no se aplicó
 * un rebrand visual completo — decisión explícita, ver doc maestro.
 */
export function ArchiveHero({ vehicleCount, evidenceCoveragePct, featuredVehicles, searchExamples, categoryChips }: ArchiveHeroProps) {
  return (
    <section className="relative min-h-screen bg-paper overflow-hidden">
      {/* Fondo con textura sutil de papel + luz cenital suave, para que
          el "documento" tenga algo de profundidad sin caer en gradients
          evidentes (fuera del vocabulario visual del archivo). */}
      <div className="paper-texture absolute inset-0 opacity-[0.035]" aria-hidden="true" />
      <div className="paper-vignette pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="container-max relative z-10 py-16 sm:py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          
          {/* LADO IZQUIERDO: Identificador + Título + Buscador.
              NOTA (auditoría 11/09/2026): este bloque es el contenido
              crítico above-the-fold — el <h1> es el candidato natural a
              LCP. Antes estaba envuelto en <Reveal>, un client component
              que arranca en opacity:0 y solo se hace visible cuando un
              IntersectionObserver dispara (o, como red de seguridad,
              recién a los 1.5s). Eso significaba que el título/buscador
              del hero podía tardar hasta 1.5s en pintarse en conexiones
              lentas, y que Reveal forzaba a todo ArchiveHero a ser
              'use client'. Se saca el gate acá: este bloque ahora se
              pinta directo desde el servidor, sin esperar hidratación.
              El fade-in decorativo se mantiene solo para las fichas de
              vehículo del lado derecho (contenido secundario, no LCP). */}
          <div className="space-y-8 lg:sticky lg:top-8">
            {/* Identificador de archivo.
                id="evidencia" + scroll-mt-24: destino real del enlace
                "Evidencia citada" del Header (auditoría UX 2026-09-13,
                hallazgo D-2). scroll-mt compensa el header sticky para
                que el ancla no quede tapada al hacer scroll hasta acá. */}
            <div
              id="evidencia"
              className="flex flex-wrap items-center gap-x-3 gap-y-2 scroll-mt-24 border-b border-oxide-red/30 pb-4"
            >
              <div className="h-2 w-2 flex-shrink-0 bg-oxide-red" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink/70">
                MARKETPLACE DE VEHÍCULOS EN ARGENTINA
              </span>
              {evidenceCoveragePct !== null && evidenceCoveragePct > 0 && (
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-archive-green sm:ml-auto">
                  {evidenceCoveragePct}% DE FICHAS CON FUENTE CITADA
                </span>
              )}
            </div>

            {/* Título principal.
                NOTA (traspaso "marketplace-first", sept. 2026): este H1
                y el copy de acá abajo estaban indexados y rankeando en
                Google como archivo/catálogo técnico ("Cada dato tiene un
                origen"). Se decidió con el usuario asumir el riesgo de
                SEO a corto plazo a cambio de claridad de producto
                (opción (a) del trade-off, no (b) — ver prompt de
                traspaso, sección 3, punto 3): el home tiene que decir
                "comprar y vender" de entrada, no solo "archivo técnico
                verificado". El catálogo (fichas, evidencia, comparador)
                sigue intacto más abajo en la página y en sus propias
                URLs (`/vehiculos/[slug]`) — lo que cambia es el mensaje
                de LA PORTADA, no el contenido ni las rutas que indexan
                por separado. */}
            <div className="space-y-4">
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] text-ink">
                Comprá y vendé
                <br />
                <span className="text-oxide-red">tu vehículo en Argentina.</span>
              </h1>
              <p className="font-sans text-lg sm:text-xl text-ink/70 max-w-xl leading-relaxed">
                Publicá tu auto o moto gratis, o encontrá el próximo entre
                miles de fichas técnicas con fuentes verificadas.
                {vehicleCount} modelos documentados te ayudan a decidir
                antes de comprar.
              </p>
            </div>

            {/* Buscador */}
            <div className="space-y-5">
              <QuickSearchForm examples={searchExamples} />

              {/* Pestañas de carpeta: acceso directo por categoría,
                  con volumen real del catálogo. Metáfora: separadores
                  de un archivador físico, cada uno con su etiqueta. */}
              {categoryChips && categoryChips.length > 0 && (
                <div
                  className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  role="list"
                  aria-label="Categorías principales del archivo"
                >
                  {categoryChips.map((chip) => (
                    <Link
                      key={chip.href}
                      href={chip.href}
                      role="listitem"
                      className="group/tab flex flex-shrink-0 items-baseline gap-1.5 rounded-t-md border border-b-0 border-border bg-surface-alt px-3 py-2 transition-colors hover:bg-oxide-red hover:border-oxide-red"
                    >
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink group-hover/tab:text-white">
                        {chip.label}
                      </span>
                      <span className="font-mono text-[10px] text-ink/50 group-hover/tab:text-white/80">
                        {chip.count}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                {/* CTA de marketplace, primero en el orden visual — la
                    fila entera antes solo tenía links al catálogo; ver
                    nota de la sección anterior sobre el pivote de
                    mensaje del hero. */}
                <Link
                  href="/publicar"
                  prefetch={false}
                  className="cta-shine font-mono text-xs uppercase tracking-[0.15em] bg-oxide-red text-white px-5 py-2.5 hover:bg-ink transition-colors duration-200"
                >
                  Publicar mi vehículo →
                </Link>
                <Link
                  href="/vehiculos"
                  className="font-mono text-xs uppercase tracking-[0.15em] text-ink/60 hover:text-ink transition-colors border-b border-transparent hover:border-ink/30"
                >
                  Ver fichas técnicas →
                </Link>
                <Link
                  href="/comparar"
                  className="font-mono text-xs uppercase tracking-[0.15em] text-ink/60 hover:text-ink transition-colors border-b border-transparent hover:border-ink/30"
                >
                  Comparar fichas →
                </Link>
              </div>
            </div>
          </div>

          {/* LADO DERECHO: listings reales del marketplace cuando ya
              existan; fichas técnicas del catálogo como fallback
              mientras no haya (ver `HeroSidePanel.tsx`). Client
              component — hace su propio fetch a Supabase, mismo patrón
              que `MarketplaceHeroStrip`. */}
          <HeroSidePanel featuredVehicles={featuredVehicles} />
        </div>
      </div>

      {/* Cue de scroll: invita a seguir bajando al índice del archivo.
          Puramente decorativo — no cambia foco ni orden de tabulación. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 lg:flex lg:flex-col lg:items-center lg:gap-2"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/30">
          Seguir explorando
        </span>
        <svg
          className="scroll-cue-arrow h-4 w-4 text-ink/30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>

      {/* Línea decorativa inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ink/10 to-transparent" />
    </section>
  )
}
