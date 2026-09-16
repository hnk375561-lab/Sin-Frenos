import type { Metadata } from 'next'
import { ProviderIdentityBlock } from '@/components/legal/ProviderIdentityBlock'
import { SITE_NAME, SITE_URL } from '@/config/site'

export const metadata: Metadata = { title: `Quiénes somos | ${SITE_NAME}`, description: `Identificación del operador y alcance de ${SITE_NAME}.`, alternates: { canonical: `${SITE_URL}/quienes-somos` } }

export default function WhoWeArePage() {
  return <main className="container-narrow py-16 sm:py-20"><p className="eyebrow mb-4 text-xs font-semibold uppercase text-auto-accent-strong">Información legal</p><h1 className="mb-6 text-3xl font-bold text-neutral-900 sm:text-4xl">Quiénes somos</h1><div className="space-y-6 text-neutral-600"><p>{SITE_NAME} combina un archivo editorial técnico independiente con un marketplace que facilita el contacto directo entre compradores y vendedores. No somos parte de las compraventas entre usuarios.</p><ProviderIdentityBlock /><p>La identificación anterior se configura desde variables de entorno del operador. Mientras falte algún dato, esta página lo informa expresamente y no muestra valores inventados.</p></div></main>
}
