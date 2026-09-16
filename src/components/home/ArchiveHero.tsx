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
 * HERO — MARKETPLACE-FIRST (sept. 2026, ver traspaso + ajuste posterior
 * "todo rodea compra/venta, catálogo poco vistoso pero no invisible").
 * Concepto anterior: "CADA DATO TIENE UN ORIGEN" (archivo técnico).
 * Concepto actual: "Comprá y vendé tu vehículo en Argentina" — mensaje
 * principal, subtítulo y las dos CTAs grandes (Publicar / Ver
 * publicaciones) son 100% marketplace, sin mencionar el catálogo. El
 * catálogo técnico (buscador, categorías, fichas, comparador, % de
 * evidencia) sigue accesible, pero deliberadamente chico, apagado
 * (font-mono text-[10px], text-ink/40) y al final de la columna
 * izquierda — nunca se eliminó, solo bajó de jerarquía visual al mínimo
 * que sigue siendo clickeable y legible.
 *
 * Composición editorial asimétrica (sin cambios de estructura):
 * - Lado izquierdo: identificador, título, 2 CTAs, catálogo chico abajo
 *   — sigue server-side por LCP.
 * - Lado derecho: listings reales del marketplace cuando existan,
 *   fichas técnicas del catálogo como fallback (`HeroSidePanel.tsx`).
 *
 * Metáfora visual de "documento físico" conservada para las fichas del
 * catálogo (siguen existiendo, solo bajaron de jerarquía); no se aplicó
 * un rebrand visual completo — decisión explícita, ver doc maestro.
 */
export function ArchiveHero({ vehicleCount, evidenceCoveragePct, searchExamples, categoryChips }: Omit<ArchiveHeroProps, 'featuredVehicles'>) {
  // `featuredVehicles` se recibe pero no se usa acá: el lado derecho
  // (`HeroSidePanel`) es 100% marketplace y hace su propio fetch de
  // listings reales del catálogo directamente contra Supabase (ver
  // comentario en `HeroSidePanel.tsx`) — nunca cae a vehículos del
  // catálogo como fallback. Se deja la prop en `ArchiveHeroProps` por si
  // se reintroduce un fallback de catálogo más adelante, pero se omite
  // explícitamente acá (`Omit`) en vez de aceptarla y no usarla en
  // silencio, para que quede claro que es un no-op a propósito.
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
            {/* Identificador de marketplace. El ancla real de
                "Evidencia citada" (Header) se movió más abajo, al bloque
                chico de catálogo — ahí es donde ahora vive el dato de
                cobertura de evidencia, no en este identificador
                principal (que es 100% marketplace, ver ajuste "todo
                rodea compra/venta"). */}
            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-oxide-red/30 pb-4"
            >
              <div className="h-2 w-2 flex-shrink-0 bg-oxide-red" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink/70">
                MARKETPLACE DE VEHÍCULOS EN ARGENTINA
              </span>
            </div>

            {/* Título principal.
                NOTA (traspaso "marketplace-first", sept. 2026, y ajuste
                posterior "todo rodea compra/venta, catálogo poco
                vistoso"): este H1 y el copy de acá abajo estaban
                indexados y rankeando en Google como archivo/catálogo
                técnico ("Cada dato tiene un origen"). Se decidió con el
                usuario asumir el riesgo de SEO a corto plazo a cambio de
                claridad de producto (opción (a) del trade-off, no (b) —
                ver prompt de traspaso, sección 3, punto 3): el home
                tiene que decir "comprar y vender" de entrada, sin
                mencionar siquiera el catálogo en el copy principal. El
                catálogo (fichas, evidencia, comparador) sigue intacto en
                sus propias URLs (`/vehiculos/[slug]`) y tiene su propio
                bloque más abajo en esta misma columna — chico y apagado
                a propósito, no eliminado. */}
            <div className="space-y-4">
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] text-ink">
                Comprá y vendé
                <br />
                <span className="text-oxide-red">tu vehículo en Argentina.</span>
              </h1>
              <p className="font-sans text-lg sm:text-xl text-ink/70 max-w-xl leading-relaxed">
                Publicá gratis tu auto o moto y llegá a compradores
                reales. Sin comisiones, sin intermediarios: vendé lo que
                tenés o encontrá lo que buscás, directo con el vendedor.
              </p>
            </div>

            {/* Dos CTAs de marketplace, mismo tamaño y jerarquía —
                ninguna es "la secundaria": una es publicar (vender), la
                otra es explorar publicaciones (comprar). El buscador y
                los accesos al catálogo técnico van más abajo, chicos. */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/publicar"
                prefetch={false}
                className="cta-shine font-mono text-xs uppercase tracking-[0.15em] bg-oxide-red text-white px-6 py-3.5 hover:bg-ink transition-colors duration-200"
              >
                Publicar mi vehículo →
              </Link>
              <Link
                href="/listings"
                prefetch={false}
                className="font-mono text-xs uppercase tracking-[0.15em] border border-ink/30 text-ink px-6 py-3.5 hover:border-ink hover:bg-surface-alt transition-colors duration-200"
              >
                Ver publicaciones →
              </Link>
            </div>

            {/* Catálogo técnico: sigue ahí (no invisible — sección 3 del
                traspaso original ya advertía sobre no perder SEO/tráfico
                del catálogo), pero deliberadamente chico, apagado y al
                final de la columna. Buscador incluido acá (no arriba del
                todo): busca sobre el catálogo técnico (`/buscar`, Fuse.js
                — ver `QuickSearchForm.tsx`), no sobre publicaciones del
                marketplace, así que no tiene sentido que compita
                visualmente con los CTAs de compra/venta de arriba. */}
            <div id="evidencia" className="max-w-xs space-y-3 border-t border-ink/10 pt-6 scroll-mt-24">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/40">
                También: catálogo técnico ({vehicleCount} fichas
                {evidenceCoveragePct !== null && evidenceCoveragePct > 0
                  ? `, ${evidenceCoveragePct}% con fuente citada`
                  : ''}
                )
              </p>
              <QuickSearchForm examples={searchExamples} />

              {(categoryChips && categoryChips.length > 0) && (
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {categoryChips.slice(0, 4).map((chip) => (
                    <Link
                      key={chip.href}
                      href={chip.href}
                      prefetch={false}
                      className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/40 hover:text-ink/70 transition-colors"
                    >
                      {chip.label}
                    </Link>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <Link
                  href="/vehiculos"
                  className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/40 hover:text-ink/70 transition-colors"
                >
                  Fichas técnicas
                </Link>
                <Link
                  href="/comparar"
                  className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/40 hover:text-ink/70 transition-colors"
                >
                  Comparar
                </Link>
              </div>
            </div>
          </div>

          {/* LADO DERECHO: listings reales del marketplace, o un panel
              de marketplace vacío con CTA a /publicar si todavía no hay
              — NUNCA cae al catálogo (ver `HeroSidePanel.tsx`, ajuste
              "todo rodea compra/venta"). Client component — hace su
              propio fetch a Supabase, mismo patrón que
              `MarketplaceHeroStrip`. */}
          <HeroSidePanel />
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
