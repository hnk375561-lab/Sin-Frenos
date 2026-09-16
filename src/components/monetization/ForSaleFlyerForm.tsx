'use client'

import { useState } from 'react'
import { isValidFlyerData, FLYER_PRICE_ARS, FLYER_PAYMENT_LINK, type FlyerData } from '@/lib/for-sale-flyer'
import { trackPremiumReportCheckoutStarted } from '@/lib/analytics-events'

const WHATSAPP_NUMBER = '5493445511081'

/**
 * Formulario del "cartel de venta" — ver `src/lib/for-sale-flyer.ts` para
 * el modelo de negocio histórico.
 *
 * Cobro real (16/09/2026): mismo mecanismo que `PremiumReportButton.tsx`
 * — sin backend, el cobro se resuelve con un link de pago hosteado de
 * Mercado Pago (`FLYER_PAYMENT_LINK`), sin verificación automática. La
 * persona completa el formulario, paga, y recién ahí confirma para
 * generar el PDF (sistema de honestidad).
 */
export function ForSaleFlyerForm({ className = '' }: { className?: string }) {
  const [data, setData] = useState<FlyerData>({
    marca: '',
    modelo: '',
    anio: '',
    precio: '',
    km: '',
    contacto: '',
    ubicacion: '',
  })
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const disabled = !isValidFlyerData(data)

  function update<K extends keyof FlyerData>(key: K, value: string) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  function handlePaySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (disabled) return
    trackPremiumReportCheckoutStarted({ slugs: [`flyer:${data.marca}-${data.modelo}`], label: 'cartel-venta' })
    window.open(FLYER_PAYMENT_LINK, '_blank', 'noopener,noreferrer')
    setStep('confirm')
  }

  async function handleDownloadClick() {
    if (status === 'loading') return
    setStatus('loading')
    setErrorMessage(null)

    try {
      const [{ buildFlyerPdf, findUnencodableFlyerField }, { downloadPdfBytes }] = await Promise.all([
        import('@/lib/pdf/build-flyer'),
        import('@/lib/pdf/download'),
      ])

      const unencodableField = await findUnencodableFlyerField(data)
      if (unencodableField) {
        setStatus('error')
        setErrorMessage(`El campo "${unencodableField}" tiene un caracter que el cartel no puede imprimir (ej. emoji). Sacalo, volvé al formulario e intentá de nuevo.`)
        return
      }

      const bytes = await buildFlyerPdf(data)
      downloadPdfBytes(bytes, `cartel-venta-${data.marca}-${data.modelo}.pdf`.replace(/\s+/g, '-'))
      setStatus('idle')
    } catch {
      setStatus('error')
      setErrorMessage('No se pudo generar el PDF. Probá de nuevo.')
    }
  }

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola, pagué el cartel de venta (${data.marca} ${data.modelo}) y tuve un problema para descargarlo.`
  )}`

  if (step === 'confirm') {
    return (
      <div className={`rounded-lg border border-edge bg-surface-card p-4 ${className}`}>
        <p className="mb-3 text-sm font-semibold text-neutral-900">
          🖼️ Cartel de venta — {data.marca} {data.modelo}
        </p>
        <button
          type="button"
          onClick={handleDownloadClick}
          disabled={status === 'loading'}
          className="w-full rounded-md bg-auto-accent px-3 py-2 text-sm font-semibold text-[#09090B] transition-colors hover:bg-auto-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'loading' ? 'Generando PDF…' : 'Ya pagué, descargar cartel'}
        </button>
        {errorMessage && <p role="alert" className="mt-1.5 text-xs text-red-400">{errorMessage}</p>}
        <p className="mt-2 text-center text-[11px] text-neutral-400">
          Se abrió Mercado Pago en otra pestaña. Confirmá el pago y descargá tu cartel acá.{' '}
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="underline hover:text-auto-accent-strong">
            ¿Problema con el pago? Escribinos por WhatsApp
          </a>
        </p>
        <button
          type="button"
          onClick={() => setStep('form')}
          className="mt-2 w-full text-center text-[11px] text-neutral-400 underline"
        >
          Volver y editar los datos del cartel
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handlePaySubmit} className={`rounded-lg border border-edge bg-surface-card p-4 ${className}`}>
      <p className="mb-3 text-sm font-semibold text-neutral-900">
        🖼️ Generá un cartel de venta profesional (PDF, ARS {FLYER_PRICE_ARS})
      </p>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Marca (ej. Toyota)"
          value={data.marca}
          onChange={(e) => update('marca', e.target.value)}
          required
          className="w-full rounded-md border border-edge bg-surface-input px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Modelo (ej. Corolla)"
          value={data.modelo}
          onChange={(e) => update('modelo', e.target.value)}
          required
          className="w-full rounded-md border border-edge bg-surface-input px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Año (ej. 2019)"
          value={data.anio}
          onChange={(e) => update('anio', e.target.value)}
          required
          className="w-full rounded-md border border-edge bg-surface-input px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Kilometraje (opcional)"
          value={data.km}
          onChange={(e) => update('km', e.target.value)}
          className="w-full rounded-md border border-edge bg-surface-input px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Precio (ej. USD 15.000)"
          value={data.precio}
          onChange={(e) => update('precio', e.target.value)}
          required
          className="col-span-2 w-full rounded-md border border-edge bg-surface-input px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Teléfono de contacto"
          value={data.contacto}
          onChange={(e) => update('contacto', e.target.value)}
          required
          className="col-span-2 w-full rounded-md border border-edge bg-surface-input px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Ubicación (opcional, ej. Concepción del Uruguay)"
          value={data.ubicacion}
          onChange={(e) => update('ubicacion', e.target.value)}
          className="col-span-2 w-full rounded-md border border-edge bg-surface-input px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="mt-3 w-full rounded-md bg-auto-accent px-3 py-2 text-sm font-semibold text-[#09090B] transition-colors hover:bg-auto-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
      >
        Pagar cartel (ARS {FLYER_PRICE_ARS})
      </button>
      <p className="mt-2 text-center text-[11px] text-neutral-400">
        Se abre Mercado Pago en otra pestaña. Volvé acá para confirmar el pago y descargar tu cartel — se genera en tu navegador, no mandamos tus datos a ningún servidor.
      </p>
    </form>
  )
}
