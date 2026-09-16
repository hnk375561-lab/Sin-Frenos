'use client'

import Link from 'next/link'
import { EntityType } from '@/types'
import { SITE_NAME } from '@/config/site'
import { NewsletterSignupForm } from '@/components/monetization/NewsletterSignupForm'
import { SupportButton } from '@/components/monetization/SupportButton'
import { smoothScrollTo } from '@/lib/scroll/smooth-scroll'
import { ProviderIdentityBlock } from '@/components/legal/ProviderIdentityBlock'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="marketplace-footer">
      <div className="marketplace-footer-container">
        <div className="marketplace-footer-brand">
            <div className="flex items-center gap-3">
              <div className="marketplace-footer-mark" aria-hidden="true">S</div>
              <h2 className="text-2xl font-bold tracking-[-0.05em] text-white">{SITE_NAME}</h2>
            </div>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-white/60">El lugar directo para comprar, vender y encontrar tu próximo vehículo en Argentina.</p>
            <NewsletterSignupForm className="mt-8 max-w-md" trackingSource="footer" heading="Recibí nuevas publicaciones y oportunidades cerca tuyo" />
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/vehiculos" className="rounded-full bg-auto-accent px-4 py-2 text-sm font-semibold text-white transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-auto-accent-strong active:scale-[.98]">Explorar todas las marcas</Link>
              <Link href="/guias" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition-[border-color,color] duration-200 hover:border-white/50 hover:text-white">Ver guías de compra</Link>
            </div>
            <SupportButton className="mt-5" />
        </div>

        <nav className="marketplace-footer-nav" aria-label="Navegación del pie de página">
          <div className="marketplace-footer-column">
            <p className="marketplace-footer-kicker">Explorar</p>
            <Link href={`/${EntityType.VEHICLE}`}>Catálogo completo</Link>
            <Link href={`/${EntityType.MANUFACTURER}`}>Marcas populares</Link>
            <Link href="/comparar">Comparador de vehículos</Link>
            <Link href={`/${EntityType.GUIDE}`}>Guías de compra</Link>
          </div>
          <div className="marketplace-footer-column">
            <p className="marketplace-footer-kicker">Vender</p>
            <Link href="/publicar" prefetch={false}>Publicar mi vehículo</Link>
            <Link href="/vender-tu-auto">Valuación de autos</Link>
            <Link href="/vehiculos">Historial de precios</Link>
            <Link href="/guias/vender-auto-usado-argentina">Consejos de venta</Link>
          </div>
          <div className="marketplace-footer-column">
            <p className="marketplace-footer-kicker">Comunidad</p>
            <Link href={`/${EntityType.NEWS}`}>Blog / Noticias</Link>
            <Link href="/quienes-somos">Testimonios</Link>
            <a href="mailto:uruspotcdu@gmail.com">Contacto directo</a>
            <a href="mailto:uruspotcdu@gmail.com?subject=Soporte%20técnico">Soporte técnico</a>
          </div>
          <div className="marketplace-footer-column">
            <p className="marketplace-footer-kicker">Legal</p>
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/terminos">Términos y condiciones</Link>
            <Link href="/licencia-datos">Licencia de datos</Link>
            <Link href="/tramites-vehiculo">Trámites</Link>
          </div>
        </nav>

        <div className="marketplace-footer-lower">
          <div>
            <p className="marketplace-footer-kicker">Seguinos</p>
            <div className="marketplace-footer-socials">
              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
              <a href="https://www.youtube.com/" target="_blank" rel="noreferrer">YouTube</a>
              <a href="mailto:uruspotcdu@gmail.com">Email</a>
            </div>
          </div>
          <button type="button" onClick={() => smoothScrollTo(0)} className="marketplace-footer-top" aria-label="Volver arriba">
            Volver arriba <span aria-hidden="true">↑</span>
          </button>
        </div>

        <div className="marketplace-footer-legal">
          <ProviderIdentityBlock compact />
          <p>{SITE_NAME} es un marketplace automotor independiente. Las marcas mencionadas pertenecen a sus respectivos dueños.</p>
          <p>© {currentYear} {SITE_NAME}.</p>
        </div>
      </div>
    </footer>
  )
}
