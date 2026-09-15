'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Vehicle } from '@/types'
import type { ResolvedDisplayImage } from '@/lib/images'
import { parsePowerHp } from '@/lib/vehicle-power'
import { WishlistButton } from '@/components/ui/WishlistButton'

interface CommercialVehicleCardProps {
  vehicle: Vehicle
  image?: ResolvedDisplayImage | null
  priority?: boolean
}

function splitName(vehicle: Vehicle) {
  const manufacturer = vehicle.manufacturer?.trim() ?? ''
  const title = vehicle.title.trim()
  const manufacturerLower = manufacturer.toLowerCase()
  if (manufacturer && title.toLowerCase().startsWith(manufacturerLower)) {
    const model = title.slice(manufacturer.length).trim()
    if (model) return { manufacturer, model }
  }
  return { manufacturer, model: title }
}

function yearLabel(vehicle: Vehicle): string | null {
  if (typeof vehicle.anoLanzamiento === 'number') return String(vehicle.anoLanzamiento)
  if (typeof vehicle.anoLanzamiento === 'string' && /^\d{4}$/.test(vehicle.anoLanzamiento)) {
    return vehicle.anoLanzamiento
  }
  const match = vehicle.anoProduccion?.match(/\d{4}/)
  return match?.[0] ?? null
}

function priceLabel(vehicle: Vehicle): string | null {
  if (!vehicle.price) return null
  return vehicle.price.split('(')[0].trim()
}

export function CommercialVehicleCard({ vehicle, image, priority = false }: CommercialVehicleCardProps) {
  const { manufacturer, model } = splitName(vehicle)
  const year = yearLabel(vehicle)
  const power = parsePowerHp(vehicle)
  const price = priceLabel(vehicle)

  return (
    <article className="commercial-vehicle-card group relative overflow-hidden rounded-2xl bg-[#09090B]">
      <Link
        href={`/vehiculos/${vehicle.slug}`}
        prefetch={false}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F4F5]"
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          {image ? (
            <Image
              src={image.src}
              alt={image.alt || vehicle.title}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 280px, (min-width: 768px) 28vw, 78vw"
              quality={90}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_50%_35%,#3F3F46_0,#09090B_62%)]">
              <svg viewBox="0 0 120 80" className="w-2/3 text-white/20" fill="none" aria-hidden="true">
                <path d="M13 51h94M23 51l7-18c1-3 4-5 7-5h45c4 0 7 2 9 6l6 17" stroke="currentColor" strokeWidth="3" />
                <path d="M20 51v9h9m62-9v9h9" stroke="currentColor" strokeWidth="3" />
                <circle cx="32" cy="55" r="6" stroke="currentColor" strokeWidth="3" />
                <circle cx="88" cy="55" r="6" stroke="currentColor" strokeWidth="3" />
              </svg>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/10 to-transparent" />
          <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-[#09090B]/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75 backdrop-blur-sm">
            {vehicle.evidence?.level ? 'Ficha verificada' : 'Ficha técnica'}
          </div>
          <div className="absolute inset-x-4 bottom-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
              {manufacturer || 'Sin marca'}
            </p>
            <h3 className="mt-1 line-clamp-2 text-xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-2xl">
              {model}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/60">
              {year && <span>{year}</span>}
              {power !== null && <span>{power} HP</span>}
              {vehicle.class && <span className="line-clamp-1">{vehicle.class}</span>}
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
              <span className="max-w-[80%] truncate text-sm font-semibold text-[#FDBA74]">
                {price || 'Ver ficha y especificaciones'}
              </span>
              <span aria-hidden="true" className="text-lg text-white/65 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-white motion-reduce:transition-none">
                →
              </span>
            </div>
          </div>
        </div>
      </Link>
      <WishlistButton
        type={vehicle.type}
        slug={vehicle.slug}
        title={vehicle.title}
        className="absolute right-3 top-3 z-10 border-white/20 bg-[#09090B]/55 text-white/80 backdrop-blur-sm hover:border-white/50 hover:bg-[#09090B]/80 hover:text-white"
      />
    </article>
  )
}
