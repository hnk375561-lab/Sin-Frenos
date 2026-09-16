'use client'

import { useState } from 'react'
import { trackPremiumReportCheckoutStarted } from '@/lib/analytics-events'
import { PREMIUM_REPORT_PRICE_ARS, PREMIUM_REPORT_PAYMENT_LINK } from '@/lib/premium-report'

const WHATSAPP_NUMBER = '5493445511081'

interface PremiumReportButtonProps {
  /** Slugs de los vehículos ya seleccionados en la comparación (2 a 5). */
  slugs: string[]
  className?: string
  trackingLabel?: string
}

/**
 * CTA de "Reporte comparativo" — ver `docs/monetizacion-plan.md` y
 * `src/lib/premium-report.ts` para el contexto histórico.
 *
 * Cobro real (16/09/2026): sin backend propio (sitio 100% estático), el
 * cobro se resuelve con un link de pago hosteado de Mercado Pago
 * (`PREMIUM_REPORT_PAYMENT_LINK`) creado a mano en su panel — no hay API
 * para verificar automáticamente que la persona pagó. El flujo es
 * "pagar → confirmar acá mismo que se pagó → descargar" (sistema de
 * honestidad, igual que un cartel de "dejá tu contribución"). Si esto
 * genera fraude en la práctica, la alternativa es volver a un backend
 * real con verificación server-side (ver docs/monetizacion-plan.md).
 *
 * `buildPremiumReportPdf` se importa dinámicamente recién al confirmar el
 * pago (arrastra el catálogo completo de vehículos) para no sumarlo al
 * bundle inicial de `/comparar`.
 */
export function PremiumReportButton({ slugs, className = '', trackingLabel }: PremiumReportButtonProps) {
  const [step, setStep] = useState<'pay' | 'confirm'>('pay')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const disabled = slugs.length < 2 || slugs.length > 5

  const handlePayClick = () => {
    if (disabled) return
    trackPremiumReportCheckoutStarted({ slugs, label: trackingLabel || 'comparar' })
    window.open(PREMIUM_REPORT_PAYMENT_LINK, '_blank', 'noopener,noreferrer')
    setStep('confirm')
  }

  const handleDownloadClick = async () => {
    if (disabled || status === 'loading') return
    setStatus('loading')
    setErrorMessage(null)
    try {
      const [{ buildPremiumReportPdf }, { downloadPdfBytes }] = await Promise.all([
        import('@/lib/pdf/build-premium-report'),
        import('@/lib/pdf/download'),
      ])
      const bytes = await buildPremiumReportPdf(slugs)
      downloadPdfBytes(bytes, `reporte-${slugs.join('-')}.pdf`)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo generar el PDF. Probá de nuevo.')
    }
  }

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola, pagué el reporte comparativo (${slugs.join(' vs ')}) y tuve un problema para descargarlo.`
  )}`

  return (
    <div className={className}>
      {step === 'pay' && (
        <button
          type="button"
          onClick={handlePayClick}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-auto-accent bg-transparent px-4 py-2 text-sm font-semibold text-auto-accent-strong transition-colors hover:bg-auto-accent hover:text-[#09090B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Pagar reporte (ARS {PREMIUM_REPORT_PRICE_ARS})
        </button>
      )}

      {step === 'confirm' && (
        <button
          type="button"
          onClick={handleDownloadClick}
          disabled={status === 'loading'}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-auto-accent px-4 py-2 text-sm font-semibold text-[#09090B] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 15V3m0 12-4-4m4 4 4-4" />
            <path d="M2 17l.6 3.4a2 2 0 0 0 2 1.6h14.8a2 2 0 0 0 2-1.6L22 17" />
          </svg>
          {status === 'loading' ? 'Generando PDF…' : 'Ya pagué, descargar PDF'}
        </button>
      )}

      {errorMessage && <p role="alert" className="mt-1.5 text-xs text-red-400">{errorMessage}</p>}

      {!errorMessage && step === 'pay' && (
        <p className="mt-1.5 text-[11px] text-neutral-400">
          Ficha técnica completa con evidencia citada, para guardar o llevar a la concesionaria.
        </p>
      )}

      {!errorMessage && step === 'confirm' && (
        <p className="mt-1.5 text-[11px] text-neutral-400">
          Se abrió Mercado Pago en otra pestaña. Volvé acá y descargá tu PDF una vez que confirmes el pago.{' '}
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="underline hover:text-auto-accent-strong">
            ¿Problema con el pago? Escribinos por WhatsApp
          </a>
        </p>
      )}
    </div>
  )
}
