'use client'

import type { ListingDraft, VehicleConditionId } from '@/lib/listings/types'
import { formStyles } from '@/components/listings/publicar/formStyles'

/**
 * Paso 7 del wizard (sección 6: "Descripción libre (placeholder cambia
 * según la condición)"). `title` vive en este mismo paso, no en uno
 * propio — así lo agrupa `ListingDraft` en `types.ts` ("// Paso 7 —
 * descripción libre" cubre tanto `title` como `description`), y tiene
 * sentido de producto: recién acá el vendedor ya pasó por categoría,
 * condición, identificación y precio, así que titular la publicación con
 * criterio (en vez de antes, a ciegas) es más fácil.
 *
 * El placeholder de la descripción cambia según `conditionId` (sección 6,
 * paso 7 explícito) — el objetivo es que alguien publicando "no arranca"
 * o "para repuestos" vea de entrada qué tipo de detalle conviene incluir,
 * en vez de un placeholder genérico que no ayuda en esos casos.
 */

const DESCRIPTION_PLACEHOLDERS: Partial<Record<VehicleConditionId, string>> = {
  no_arranca:
    'Ej. Dejó de arrancar hace 2 meses, sospecho que es la batería o el alternador. Nunca lo llevé a revisar. El resto del auto está...',
  motor_roto:
    'Ej. Fundió el motor por sobrecalentamiento en ruta. La caja y el resto están en buen estado. Se vende con o sin motor de repuesto...',
  caja_rota:
    'Ej. La caja patina en 3ra desde hace unos meses, el motor anda perfecto. Ideal para alguien que quiera cambiarla o reparar...',
  chocado:
    'Ej. Golpe en el paragolpes delantero y guardabarros, sin daño en el chasis. Tengo fotos del antes y presupuesto de arreglo...',
  siniestrado:
    'Ej. Declarado siniestro total por la aseguradora por [motivo]. Vendo con papeles de baja, tal como está...',
  inundado:
    'Ej. Tomó agua hasta la altura de las puertas en la inundación de [fecha]. No arranca desde entonces, nunca lo probé después...',
  incendiado:
    'Ej. Incendio en el compartimento del motor, se apagó a tiempo y no llegó al habitáculo. Vendo para repuestos o restaurar...',
  desarmado:
    'Ej. Vendo desarmado, tengo la mayoría de las piezas guardadas (detallar cuáles faltan o cuáles no están en buen estado)...',
  para_repuestos:
    'Ej. Vendo para repuestos, no arranca y tiene [detallar qué partes están usables: motor, caja, chapa, interior]...',
  proyecto:
    'Ej. Proyecto sin terminar, arranqué la restauración y quedó en [detallar en qué etapa: motor listo, falta chapa y pintura, etc.]...',
  restauracion:
    'Ej. Restaurado hace [tiempo], trabajos realizados: [motor, chapa, tapizado]. Documentación y repuestos originales incluidos...',
  clasico:
    'Ej. Año, motor original o reemplazado, kilometraje real o estimado, estado de chapa/pintura/interior, historial conocido...',
  competicion:
    'Ej. Preparación (motor, suspensión, jaula antivuelco), categoría en la que corrió, papeles de competición si los tiene...',
}

const DEFAULT_DESCRIPTION_PLACEHOLDER =
  'Ej. Contá el estado real, service al día, detalles que no se ven en las fotos, motivo de venta...'

function descriptionPlaceholderFor(conditionId: VehicleConditionId | null): string {
  if (!conditionId) return DEFAULT_DESCRIPTION_PLACEHOLDER
  return DESCRIPTION_PLACEHOLDERS[conditionId] ?? DEFAULT_DESCRIPTION_PLACEHOLDER
}

interface StepDescriptionProps {
  draft: ListingDraft
  onChange: (patch: Partial<ListingDraft>) => void
  onNext: () => void
  onBack: () => void
}

export function StepDescription({ draft, onChange, onNext, onBack }: StepDescriptionProps) {
  const canContinue = draft.title.trim() !== ''

  return (
    <div className={formStyles.stepCard}>
      <h2 className={formStyles.stepTitle}>Título y descripción</h2>
      <p className={formStyles.stepDescription}>
        El título es lo primero que se ve en los resultados de búsqueda. La descripción es tu
        espacio para contar todo lo que las fotos no muestran.
      </p>

      <div className={formStyles.fieldGroup}>
        <label className={formStyles.label} htmlFor="listing-title">
          Título de la publicación
        </label>
        <input
          id="listing-title"
          type="text"
          placeholder="Ej. Toyota Hilux 2019 SRX 4x4, motor a reparar"
          value={draft.title}
          onChange={(e) => onChange({ title: e.target.value })}
          maxLength={120}
          className={formStyles.input}
        />
        <p className={formStyles.helperText}>{draft.title.length}/120 caracteres</p>
      </div>

      <div className={`${formStyles.fieldGroup} mt-4`}>
        <label className={formStyles.label} htmlFor="listing-description">
          Descripción (opcional, pero muy recomendada)
        </label>
        <textarea
          id="listing-description"
          rows={6}
          placeholder={descriptionPlaceholderFor(draft.conditionId)}
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className={formStyles.textarea}
        />
      </div>

      <div className={formStyles.navRow}>
        <button type="button" onClick={onBack} className={formStyles.secondaryButton}>
          Volver
        </button>
        <button
          type="button"
          disabled={!canContinue}
          onClick={onNext}
          className={formStyles.primaryButton}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
