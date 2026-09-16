import type { Metadata } from 'next'
import { AccountSelfService } from '@/components/legal/AccountSelfService'
import { SITE_NAME, SITE_URL } from '@/config/site'

export const metadata: Metadata = { title: `Mi cuenta | ${SITE_NAME}`, description: 'Gestión de perfil y derechos sobre tus datos.', alternates: { canonical: `${SITE_URL}/cuenta` }, robots: { index: false, follow: false } }

export default function AccountPage() {
  return <main className="container-narrow py-16 sm:py-20"><p className="eyebrow mb-4 text-xs font-semibold uppercase text-auto-accent-strong">Cuenta</p><h1 className="mb-8 text-3xl font-bold text-neutral-900 sm:text-4xl">Mi cuenta y mis datos</h1><AccountSelfService /></main>
}
