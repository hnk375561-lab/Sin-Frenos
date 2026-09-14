/**
 * Ficha técnica del catálogo con apariencia de documento físico —
 * extraída de `ArchiveHero.tsx` (traspaso "marketplace-first", sept.
 * 2026) para poder reusarla como FALLBACK dentro de `HeroSidePanel`
 * (client component: cuando el marketplace todavía no tiene listings
 * reales para mostrar en el costado del hero, se sigue mostrando esto,
 * en vez de dejar el espacio vacío o inventar un listing falso).
 *
 * Sin cambios de comportamiento respecto al bloque original — solo se
 * movió de archivo para poder importarla desde un componente cliente
 * sin arrastrar el resto de `ArchiveHero` (que se mantiene server-side
 * por LCP, ver nota en ese archivo).
 */

import Link from 'next/link'
import Image from 'next/image'
import { Reveal } from '@/components/ui/Reveal'
import { type Vehicle } from '@/types'
import { resolveEntityDisplayImage } from '@/lib/media'
import { parsePowerHp } from '@/lib/vehicle-power'
import { parsePriceUsd } from '@/lib/vehicle-price'
import { EVIDENCE_STAMP_META } from '@/lib/evidence'
import { cn } from '@/lib/utils'

export function CatalogDocumentCard({ vehicle, index }: { vehicle: Vehicle; index: number }) {
  const image = resolveEntityDisplayImage(vehicle)
  const powerLabel = parsePowerHp(vehicle)
  const priceLabel = parsePriceUsd(vehicle)
  const evidenceLevel = vehicle.evidence?.level

  return (
    <Reveal key={vehicle.slug} delay={300 + index * 150}>
      <div className="relative">
        {/* Hojas fantasma: sugieren que hay más fichas apiladas
            debajo de la que se ve, sin cargar contenido real de
            más (serían datos inventados) — es puro decorado. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-sm border border-border/50 bg-surface-alt/70 [transform:rotate(4deg)_translate(6px,8px)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-sm border border-border/70 bg-surface-alt/90 [transform:rotate(-3deg)_translate(-4px,5px)]"
        />
        <div
          className="group relative z-10 bg-surface-card border border-border p-6 shadow-md transition-[transform,box-shadow] duration-300 ease-out [transform:rotate(var(--card-rotate))] hover:shadow-xl hover:[transform:rotate(0deg)_translateY(-4px)] motion-reduce:transition-none motion-reduce:hover:[transform:none]"
          style={{ '--card-rotate': index === 0 ? '-1deg' : '1deg' } as React.CSSProperties}
        >
        {/* Cabecera del documento */}
        <div className="flex items-start justify-between mb-4 pb-3 border-b border-border/50">
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">
              FICHA TÉCNICA
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/40">
              REF: {vehicle.slug.toUpperCase()}
            </p>
          </div>
          {evidenceLevel && (
            <div className={cn(
              'flex items-center gap-1.5 px-2 py-1 border',
              EVIDENCE_STAMP_META[evidenceLevel].className
            )}>
              <span className="font-mono text-[9px] uppercase tracking-wider">
                {EVIDENCE_STAMP_META[evidenceLevel].shortLabel}
              </span>
            </div>
          )}
        </div>

        {/* Contenido de la ficha */}
        <div className="space-y-3">
          <div className="flex items-start gap-4">
            {/* Imagen pequeña */}
            {image && (
              <div className="relative w-20 h-16 flex-shrink-0 overflow-hidden bg-paper border border-border/50">
                <Image
                  src={image.src}
                  alt={vehicle.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                  priority={index === 0}
                />
              </div>
            )}

            {/* Título y datos */}
            <div className="flex-1 min-w-0 space-y-2">
              <h3 className="font-serif text-lg font-semibold text-ink leading-tight">
                {vehicle.title}
              </h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink/60">
                {vehicle.manufacturer && (
                  <span>{vehicle.manufacturer}</span>
                )}
                {vehicle.class && (
                  <span>· {vehicle.class}</span>
                )}
              </div>
            </div>
          </div>

          {/* Especificaciones técnicas */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
            {powerLabel && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink/40 mb-1">
                  Potencia
                </p>
                <p className="font-mono text-sm font-semibold text-ink">
                  {powerLabel}
                </p>
              </div>
            )}
            {priceLabel && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink/40 mb-1">
                  Precio
                </p>
                <p className="font-mono text-sm font-semibold text-ink">
                  {priceLabel}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pie del documento */}
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
          <p className="font-mono text-[9px] text-ink/40">
            {(vehicle.updatedAt || vehicle.createdAt) ? new Date(vehicle.updatedAt || vehicle.createdAt).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }).toUpperCase() : 'FECHA NO DISPONIBLE'}
          </p>
          <Link
            href={`/vehiculos/${vehicle.slug}`}
            prefetch={false}
            className="font-mono text-[10px] uppercase tracking-[0.15em] text-oxide-red hover:text-ink transition-colors"
          >
            Ver ficha completa →
          </Link>
        </div>

        {/* Sello de verificación (animación al cargar) */}
        <div className="absolute -bottom-2 -right-2 w-12 h-12 border-2 border-archive-green/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <span className="font-serif text-archive-green text-lg">✓</span>
        </div>
        </div>
      </div>
    </Reveal>
  )
}
