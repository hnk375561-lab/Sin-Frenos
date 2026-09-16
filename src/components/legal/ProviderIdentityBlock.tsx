import Link from 'next/link'
import { LEGAL_ENTITY } from '@/config/legal-entity'

export function ProviderIdentityBlock({ compact = false }: { compact?: boolean }) {
  const missing = !LEGAL_ENTITY.legalName || !LEGAL_ENTITY.taxId || !LEGAL_ENTITY.address
  return (
    <section className={compact ? 'space-y-2 text-xs text-white/65' : 'rounded-2xl border border-edge bg-surface p-5 text-sm text-neutral-600'} aria-labelledby="provider-identity-title">
      <h2 id="provider-identity-title" className={compact ? 'font-semibold text-white' : 'font-semibold text-neutral-900'}>Identificación del proveedor</h2>
      {missing ? (
        <p className={compact ? 'mt-2 text-amber-200' : 'mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900'}>
          Datos legales del operador pendientes de completar antes del lanzamiento comercial. No se muestran datos ficticios.
        </p>
      ) : (
        <dl className="mt-2 space-y-1">
          <div><dt className="inline font-medium">Razón social/nombre comercial: </dt><dd className="inline">{LEGAL_ENTITY.legalName}</dd></div>
          <div><dt className="inline font-medium">CUIT/CUIL: </dt><dd className="inline">{LEGAL_ENTITY.taxId}</dd></div>
          <div><dt className="inline font-medium">Domicilio: </dt><dd className="inline">{LEGAL_ENTITY.address}</dd></div>
          <div><dt className="inline font-medium">Contacto: </dt><dd className="inline"><a className="underline" href={`mailto:${LEGAL_ENTITY.contactEmail}`}>{LEGAL_ENTITY.contactEmail}</a></dd></div>
        </dl>
      )}
      {!compact && <p className="mt-3"><Link className="link-underline text-auto-accent-strong" href="/quienes-somos">Ver información del operador</Link></p>}
    </section>
  )
}
