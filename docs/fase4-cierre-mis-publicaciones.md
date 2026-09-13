# Fase 4 — cierre (13/09/2026)

Auditoría de continuidad al retomar la Fase 4: el wizard de publicación
(`/publicar`, `PublishWizard.tsx` + 8 steps), la subida real de fotos a
Supabase Storage (`create.ts`) y sus políticas (`006_storage_and_moderation_fase4.sql`)
ya estaban completos de una sesión anterior. Lo único que faltaba, y que
`docs/fase2-fase3-verificacion.md` ya dejaba anotado explícitamente como
pendiente ("`/publicar`, `/mis-publicaciones`, formulario de publicación
real: Fase 4"), era la pantalla `/mis-publicaciones`.

## Qué se agregó

- `src/app/mis-publicaciones/page.tsx`: lista las publicaciones del
  usuario logueado, en cualquier status (`draft`, `pending_review`,
  `published`, `paused`, `sold`, `removed`), con su foto de portada.
  Acciones habilitadas por las policies ya existentes de
  `003_rls_policies.sql` (nada nuevo de base necesario):
  - Pausar / reactivar (`published` <-> `paused`).
  - Marcar como vendido (`sold`, estado terminal, sin más acciones).
  - Borrar (con confirmación; cascada de `listing_media`/`favorites` ya
    la maneja la base).
  - Ver la publicación pública (solo si `status = 'published'`, único
    caso que `/listings/ver` puede resolver para cualquier visitante).
- `src/components/layout/Header.tsx`: se agregó el único link del sitio
  hacia `/mis-publicaciones`, visible solo con sesión iniciada, al lado
  del botón de cerrar sesión existente.

## Deliberadamente fuera de este cierre

- **Editar un listing existente.** El wizard de `/publicar` solo crea
  (`create.ts` es un INSERT, no un UPDATE). Ofrecer "editar" desde
  `/mis-publicaciones` sin que exista esa ruta de escritura sería
  prometer algo que no hay. Si se necesita, es un cambio de alcance del
  wizard, no de esta pantalla.
- **Reactivar una `pending_review`.** Ese status depende de la primera
  aprobación de moderación (Fase 7); no es algo que el propio vendedor
  pueda destrabar a mano, así que no se ofrece un botón para eso.

## Qué sigue sin tocar (correcto, es de otra fase)

- Búsqueda/filtros de `/listings`: Fase 5.
- Mensajería y favoritos ligados a cuenta: Fase 6.
- Moderación real (aprobar/rechazar `pending_review`, banear vendedor):
  Fase 7.
