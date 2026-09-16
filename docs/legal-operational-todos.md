# Tareas legales operativas pendientes

Este documento no constituye registro, certificación ni asesoramiento legal. Enumera acciones que debe completar el operador real antes de habilitar o escalar el marketplace.

## Registro de base de datos ante AAIP

- **Estado:** pendiente de verificación y eventual inscripción por el operador.
- **Acción:** confirmar el alcance de la base de datos y tramitar el registro ante la [Agencia de Acceso a la Información Pública](https://www.argentina.gob.ar/aaip/datospersonales/registro).
- **Responsable:** operador de la plataforma.
- **No hacer:** no afirmar que la base está registrada ni agregar un número hasta contar con constancia real.

## Identidad del proveedor

Completar `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_TAX_ID` y `NEXT_PUBLIC_LEGAL_ADDRESS` con datos reales antes de habilitar operaciones comerciales. La aplicación muestra un aviso visible mientras falte alguno.

## Retención operativa

Configurar un proceso revisado por el operador para ejecutar las ventanas de `src/lib/data-retention-policy.ts`, incluyendo limpieza de archivos en Supabase Storage y eliminación/anominización de PII de cuentas dadas de baja. Los consentimientos deben conservarse como evidencia mientras exista la cuenta.

## Alcance de pagos

No se implementó botón de arrepentimiento porque el sitio no procesa pagos dentro de la plataforma. Reabrir esta tarea antes de añadir checkout, cobros de publicaciones destacadas o cualquier otra transacción concluida online.
