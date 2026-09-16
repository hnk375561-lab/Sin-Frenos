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
        <div className="marketplace-footer-main">
          <div className="marketplace-footer-brand">
            <div className="flex items-center gap-3">
              <div className="marketplace-footer-mark" aria-hidden="true">S</div>
              <h2 className="text-2xl font-bold tracking-[-0.05em] text-white">{SITE_NAME}</h2>
            </div>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-white/60">El lugar directo para comprar, vender y encontrar tu próximo vehículo en Argentina.</p>
            <NewsletterSignupForm className="mt-8 max-w-md" trackingSource="footer" heading="Recibí nuevas publicaciones y oportunidades cerca tuyo" />
            <SupportButton className="mt-5" />
          </div>

          <div className="marketplace-footer-actions">
            <p className="marketplace-footer-kicker">Acciones principales</p>
            <Link href="/listings" className="marketplace-footer-action-link">Comprar un vehículo <span aria-hidden="true">→</span></Link>
            <Link href="/publicar" prefetch={false} className="marketplace-footer-action-link">Vender mi vehículo <span aria-hidden="true">↗</span></Link>
            <Link href="/financiamiento" className="marketplace-footer-action-link">Calcular financiamiento <span aria-hidden="true">→</span></Link>
          </div>

          <div className="marketplace-footer-explore">
            <p className="marketplace-footer-kicker">Explorar</p>
            <Link href={`/${EntityType.VEHICLE}`}>Vehículos</Link>
            <Link href={`/${EntityType.MANUFACTURER}`}>Fabricantes</Link>
            <Link href={`/${EntityType.GUIDE}`}>Guías de compra</Link>
            <Link href={`/${EntityType.NEWS}`}>Noticias</Link>
            <Link href="/comparar">Comparar modelos</Link>
            <Link href="/favoritos">Favoritos</Link>
          </div>
        </div>

        <div className="marketplace-footer-lower">
          <div>
            <p className="marketplace-footer-kicker">Información y ayuda</p>
            <div className="marketplace-footer-fine-print">
              <Link href="/tramites-vehiculo">Trámites</Link>
              <Link href="/anunciate">Anunciate acá</Link>
              <Link href="/licencia-datos">Licencia de datos</Link>
              <Link href="/concesionarias-concepcion-del-uruguay">Directorio</Link>
              <Link href="/privacidad">Privacidad</Link>
              <Link href="/terminos">Términos de uso</Link>
              <Link href="/reglas-de-publicacion">Reglas de publicación</Link>
              <Link href="/quienes-somos">Quiénes somos</Link>
              <Link href="/cuenta">Mi cuenta y derechos ARCO</Link>
              <a href="mailto:uruspotcdu@gmail.com">Contacto</a>
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
