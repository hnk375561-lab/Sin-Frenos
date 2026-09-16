import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME, SITE_URL } from '@/config/site'

export const metadata: Metadata = { title: `Reglas de publicación | ${SITE_NAME}`, description: `Contenido permitido y prohibido en las publicaciones de ${SITE_NAME}.`, alternates: { canonical: `${SITE_URL}/reglas-de-publicacion` } }

const prohibited = ['Vehículos sin documentación legítima o de origen no verificable.', 'Vehículos denunciados como robados.', 'Armas de fuego, réplicas o munición bajo cualquier categoría.', 'Contenido sexual o violento en fotos.', 'Publicaciones fraudulentas o señuelo, incluyendo precios irreales para captar contactos.', 'Fotografías que no correspondan al vehículo real ofrecido.', 'Datos de contacto falsos o de terceros sin consentimiento.', 'Publicación duplicada del mismo vehículo por el mismo usuario.', 'Cualquier ítem que no sea un vehículo automotor o moto.']

export default function PublicationRulesPage() {
  return <main className="container-narrow py-16 sm:py-20"><p className="eyebrow mb-4 text-xs font-semibold uppercase text-auto-accent-strong">Marketplace</p><h1 className="mb-6 text-3xl font-bold text-neutral-900 sm:text-4xl">Reglas de publicación</h1><div className="space-y-8 text-neutral-600"><p>Al publicar, confirmás que el anuncio y las imágenes representan el vehículo real, que tenés derecho a ofrecerlo y que la información de contacto es tuya o se usa con autorización.</p><section><h2 className="mb-3 text-xl font-semibold text-neutral-900">No se permite</h2><ul className="list-disc space-y-2 pl-6">{prohibited.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h2 className="mb-3 text-xl font-semibold text-neutral-900">Moderación</h2><p>Podemos ocultar o retirar publicaciones y suspender cuentas ante incumplimientos. Las publicaciones pueden ser reportadas por cualquier visitante mediante el motivo que mejor describa el problema: precio sospechoso, fotos robadas o falsas, spam/duplicado, datos engañosos, contacto incorrecto u otro.</p></section><p><Link className="link-underline text-auto-accent-strong" href="/terminos">Leer los Términos de Uso</Link></p></div></main>
}
