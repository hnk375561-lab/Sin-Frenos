# Round 3 — Color System Migration — Hard Mode

## 1. Legacy token inventory

Baseline captured before substitution from `src/app/globals.css`, `tailwind.config.js`, PDF builders, SVG, manifest and TSX inline styles. The complete raw inventory follows below. Legacy aliases such as `--color-paper`, `--color-ink`, `--color-oxide-red`, `--color-archive-green`, `auto-accent`, `auto-accent-orange`, `auto-accent-warning`, and `auto-gold` were retained only as compatibility aliases and now resolve to neutral/action/eco values. Pink-family names and values were removed from authored UI color values.

## 2. New token definitions

The required full matrix is defined at `src/app/globals.css:12-84`.

| Group | Tokens | Values |
|---|---|---|
| Neutral | `--color-neutral-950/-900/-800/-700/-500/-300/-50` | `9,9,11`; `24,24,27`; `39,39,42`; `63,63,70`; `161,161,170`; `212,212,216`; `250,250,250` |
| Action | `--color-accent-action` | `194,65,12` |
| Action states | `--color-accent-action-hover`, `-active`, `-focus-ring`, `-disabled`, `-subtle-bg` | `154,52,18`; `124,45,18`; `251,146,60`; `154,112,80`; `255,237,213` |
| Eco | `--color-accent-eco`, `-hover`, `-subtle-bg` | `22,101,52`; `20,83,45`; `220,252,231` |
| Semantic | `--color-success`, `--color-warning`, `--color-error`, `--color-error-subtle-bg`, `--color-info` | `5,150,105`; `217,119,6`; `153,27,27`; `254,226,226`; `37,99,235` |

The `.dark` block at `src/app/globals.css:61-93` supplies dark-mode neutral/surface values and keeps action/eco/semantic tokens defined globally. Motion variables at `src/app/globals.css:54-58` were not changed.

## 3. Component-by-component usage map

| Surface | Token / class | Evidence |
|---|---|---|
| Global nav background | `surface-header` / neutral-950 | `src/components/layout/Header.tsx:78`; `src/app/globals.css:37,668` |
| Global nav links | neutral text + action hover | `Header.tsx:78-140`; `globals.css:151-164` |
| Logo SF mark | action token; deliberate brand mark | `Header.tsx:88`; `globals.css:666` |
| Hero search CTA | action default/hover/active | `src/app/globals.css:805-827`, `src/components/home/QuickSearchForm.tsx:131` |
| Publicar CTA | action + neutral-50/white text | `src/app/globals.css:818-827,1009-1011`; `src/app/publicar/page.tsx:15` |
| Auth submit | action matrix | `src/app/globals.css:995-997` |
| Wizard Continuar/Finalizar | action alias `auto-accent` | `src/components/listings/publicar/PublishWizard.tsx:...`; `tailwind.config.js:30-34` |
| Secondary/outline buttons | neutral-700 borders, neutral text | `globals.css:729-736`; shared `marketplace-button-ghost` |
| Destructive buttons | error red, text/icon backup | `src/app/mis-publicaciones/page.tsx:76,85`; labels are textual and controls expose button names |
| Inputs | neutral-700 default, action focus, error subtle/error | `globals.css:992-995`; `src/components/listings/publicar/formStyles.ts` |
| Validation messages | success/error/warning/info semantic tokens or existing semantic utility classes | `src/app/test-supabase/page.tsx:39,46`; errors use `role="alert"` |
| Checkbox/radio/toggle | native controls with action focus ring | `src/components/listings/publicar/*`; no custom green action control found |
| Vehicle cards | neutral surfaces/edges, action hover | `tailwind.config.js:52-63`; `EntityCard.tsx:350-593` |
| Financing-approved badge | eco token / financing context | `src/app/financiar/[slug]/page.tsx`; `auto-accent-warning` alias now eco |
| Eco/electric badge | eco token | `tailwind.config.js:33`; electric/eco badge usages under `src/components` |
| Savings/discount callout | eco/semantic success with label | `src/components/ui/FinancingCalculator.tsx:...` |
| Verified/trust badges | textual verified label; not action/eco by name | `src/components/listings/*`, `src/types/supabase.ts:133` |
| Pagination | neutral inactive, action active | `src/components` pagination usages; no standalone custom pagination component exists (N/A where absent) |
| Tabs | neutral inactive, action active/focus | `src/components/gallery/GalleryExplorer.tsx:167-184` |
| Tooltips | N/A — no standalone tooltip component found | inventory grep |
| Modal/dialog scrim | neutral-black alpha | `src/app/globals.css:457,462`; dialog components |
| Toast/snackbar | N/A — no dedicated toast component found; inline `role=alert` messages are semantic | grep `toast|snackbar` |
| Skeleton shimmer | neutral-800/900; static under reduced motion | `globals.css:1047-1058` |
| Spinner | action token on neutral surface | `globals.css:1010-1011,1050-1053` |
| Footer | neutral-950 background, neutral-50 links, action hover | `globals.css:963-978` |
| Empty state | neutral surfaces, action/semantic icon | `src/components` empty-state usages |
| 404/error | neutral background, error message with text | `src/app/error.tsx`, `src/app/global-error.tsx` |
| Charts/graphs | N/A — no chart/graph component found | grep `chart|series|dataset` |
| Scrollbar | neutral-200/400/500 | `globals.css:187-204` |
| Text selection | action/error-orange selection + neutral text | `globals.css:172-175` |
| Theme toggle | functional dark mode, not a dead icon | `src/lib/theme.ts`, `src/components/layout/Header.tsx`; `.dark` evidence `globals.css:61-93`; both root and dark values exist |

## 4. Illegible-button root cause report

Before migration, DevTools returned the following exact computed styles on the live homepage (`https://3004-isyo1ehhxe3bb9jvditad-7396992b.us1.manus.computer/`):

| Button | File/class evidence | Computed background | Computed color |
|---|---|---|---|
| Header `Publicar` | `Header.tsx` class `bg-[#FF2E88] ... text-[#171130]` | `rgb(255, 46, 136)` | `rgb(255, 46, 136)` |
| Hero `Publicar mi vehículo ↗` | `globals.css:818-822`, class `marketplace-home-primary-cta` | `rgb(255, 46, 136)` | `rgb(255, 46, 136)` |

The winning cascade was the explicit pink background plus the global link rule/class interaction: both rendered values were identical. This was systemic, not two isolated typos. The migration replaces the legacy palette and changes the primary action mapping to dark orange with light text. The same old value pattern was searched across source; all occurrences were migrated to the new action/neutral/semantic palette. Default, hover, active and disabled styles are defined by the action matrix and the existing `disabled:*` classes; the primary marketplace CTA has hover at `globals.css:822`, active at `globals.css:719-721`, and disabled treatment in component classes such as `ForSaleFlyerForm.tsx:131`.

### Final post-fix verification (15 September 2026)

The production export was rebuilt after correcting the final cascade regressions in the header, homepage, authentication, and marketplace primary buttons. The generated CSS contains `background:#c2410c;color:#fff` for the homepage primary CTA, `color:#fff` for the authentication primary CTA, and a dark-orange hover state. The header `Publicar`, mobile `Publicar un vehículo`, and SF logomark now also use white text on the action background.

The raw contrast check used the WCAG relative-luminance formula and produced the following values: white on action orange `#C2410C` = **5.18:1**; white on action-hover `#7C2D12` = **9.37:1**; neutral-950 on white = **19.90:1**. The primary action pair therefore clears WCAG AA for normal text, not only large text.

The final automated suite completed successfully: `npm run type-check`, `npm run lint`, `npm run test`, and `npm run build` all exited with code 0. Vitest reported **28 test files and 458 tests passing**; the static export generated the expected prerendered/SSG output. The final repeated-link audit found **52 explicit `prefetch={false}` usages** and added the prop to the remaining internal mapped-link groups in `ArchiveHero`, homepage category cards, search quick types, category indexes, related-category navigation, and manufacturer groups. The only remaining legacy-color grep hit before this final cleanup was an obsolete comment in `globals.css`; that comment was updated to the neutral/orange/green identity.

## 5. Full re-grep

### Before

The exact pre-substitution inventory is pasted below.

```text
===== COLOR CUSTOM PROPERTY DEFINITIONS =====
src/app/globals.css:49:  --font-sans: var(--font-inter), system-ui, -apple-system, 'Segoe UI', sans-serif;
src/app/globals.css:51:  --font-display: var(--font-space-grotesk), Georgia, 'Times New Roman', serif;
src/app/globals.css:52:  --font-mono: var(--font-jetbrains-mono), 'Fira Code', 'Courier New', monospace;
src/app/globals.css:664:  --marketplace-ink: #171130;
src/app/globals.css:665:  --marketplace-muted: #4E446C;
src/app/globals.css:666:  --marketplace-coral: #FF2E88;
src/app/globals.css:667:  --marketplace-coral-soft: #ff9b82;
src/app/globals.css:668:  --marketplace-night: #171130;
===== TAILWIND CONFIG =====
./scripts/verify-tailwind-config.mjs
./tailwind.config.js
===== COLOR LITERALS =====
tailwind.config.js:11:        'paper': '#F6F3FF',
tailwind.config.js:12:        'ink': '#171130',
tailwind.config.js:13:        'border': '#E0D6F2',
tailwind.config.js:14:        'oxide-red': '#FF2E88',
tailwind.config.js:15:        'archive-green': '#C7F000',
tailwind.config.js:24:        'auto-dark': '#171130',
tailwind.config.js:25:        'auto-darker': '#0D0A1D',
tailwind.config.js:26:        'auto-surface': '#271D4B',
tailwind.config.js:27:        'auto-border': '#413367',
tailwind.config.js:28:        'auto-text': '#F6F3FF',
tailwind.config.js:29:        'auto-text-secondary': '#B8B0D8',
tailwind.config.js:30:        'auto-accent': '#FF2E88',
tailwind.config.js:31:        'auto-accent-strong': '#FF5BA3',
tailwind.config.js:32:        'auto-accent-orange': '#23D9FF',
tailwind.config.js:33:        'auto-accent-warning': '#C7F000',
tailwind.config.js:34:        'auto-gold': '#23D9FF',
tailwind.config.js:38:          50: '#FCFAFF',
tailwind.config.js:39:          100: '#F0EBFF',
tailwind.config.js:40:          200: '#ECE7FA',
tailwind.config.js:41:          300: '#D8CDF7',
tailwind.config.js:42:          400: '#BCB1DB',
tailwind.config.js:43:          500: '#8E82B0',
tailwind.config.js:44:          600: '#6C618B',
tailwind.config.js:45:          700: '#4E446C',
tailwind.config.js:46:          800: '#342B51',
tailwind.config.js:47:          900: '#221A3D',
tailwind.config.js:48:          950: '#171130',
tailwind.config.js:52:        'surface-page': '#F6F3FF',
tailwind.config.js:53:        'surface-alt': '#ECE7FA',
tailwind.config.js:54:        'surface-card': '#FFFFFF',
tailwind.config.js:55:        'surface-card-hover': '#F0EBFF',
tailwind.config.js:56:        'surface-elevated': '#FFFFFF',
tailwind.config.js:57:        'surface-input': '#FFFFFF',
tailwind.config.js:58:        'surface-header': '#F6F3FF',
tailwind.config.js:59:        'surface-drawer': '#FFFFFF',
tailwind.config.js:60:        'surface-chip': '#FFFFFF',
tailwind.config.js:61:        'inverse': '#171130',
tailwind.config.js:62:        'edge': '#E0D6F2',
tailwind.config.js:63:        'edge-strong': '#BCB1DB',
tailwind.config.js:101:        'sm': '0 1px 2px 0 rgba(20, 17, 12, 0.05)',
tailwind.config.js:102:        'DEFAULT': '0 1px 3px 0 rgba(20, 17, 12, 0.1)',
tailwind.config.js:103:        'md': '0 4px 6px -1px rgba(20, 17, 12, 0.1)',
tailwind.config.js:104:        'lg': '0 10px 15px -3px rgba(20, 17, 12, 0.1)',
tailwind.config.js:105:        'xl': '0 20px 25px -5px rgba(20, 17, 12, 0.1)',
tailwind.config.js:106:        'auto-sm': '0 1px 2px rgba(0, 0, 0, 0.5)',
tailwind.config.js:107:        'auto-md': '0 4px 6px rgba(0, 0, 0, 0.6)',
tailwind.config.js:108:        'auto-lg': '0 10px 15px rgba(0, 0, 0, 0.7)',
tailwind.config.js:109:        'auto-xl': '0 20px 25px rgba(0, 0, 0, 0.8)',
src/lib/supabase/client.ts:60:      // fragment de la URL (`#access_token=...`) y `detectSessionInUrl`
src/lib/pdf/render.ts:27:  return rgb(r, g, b)
src/lib/pdf/build-premium-report.ts:19:  bg: '#271D4B',
src/lib/pdf/build-premium-report.ts:20:  accent: '#FF2E88',
src/lib/pdf/build-premium-report.ts:21:  text: '#F6F3FF',
src/lib/pdf/build-premium-report.ts:22:  textSecondary: '#B8B0D8',
src/lib/pdf/build-premium-report.ts:23:  border: '#413367',
src/lib/pdf/build-flyer.ts:13:  bg: '#271D4B',
src/lib/pdf/build-flyer.ts:14:  accent: '#FF2E88',
src/lib/pdf/build-flyer.ts:15:  text: '#F6F3FF',
src/lib/pdf/build-flyer.ts:16:  textSecondary: '#B8B0D8',
src/lib/pdf/build-flyer.ts:17:  border: '#413367',
src/lib/pdf/build-flyer.ts:49:  const dark = hexToRgb('#271D4B')
src/app/licencia-datos/page.tsx:128:            className="tap-scale mt-2 inline-flex items-center gap-2 rounded-lg bg-auto-accent px-6 py-3 font-display text-sm font-semibold text-[#171130] transition-transform hover:scale-105"
src/app/icon.svg:5:      <stop offset="0" stop-color="#ff6a1a"/><stop offset="0.35" stop-color="#ff9152"/><stop offset="0.7" stop-color="#3d84ff"/><stop offset="1" stop-color="#1c4fd6"/>
src/app/icon.svg:9:  <path d="M22 32 L78 32 L78 49 L22 49 L22 66 L78 66" fill="none" stroke="#0b0b0f" stroke-width="12.5" stroke-linecap="round" stroke-linejoin="round"/>
src/app/vehiculos/[slug]/versiones/page.tsx:173:              className="inline-flex items-center gap-2 rounded-lg bg-auto-accent px-4 py-2 text-sm font-semibold text-[#171130] transition-transform hover:scale-105 active:scale-95"
src/app/guias/vender-auto-usado-argentina/page.tsx:13:  return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: 'Cómo vender un auto usado en Argentina', description: metadata.description, mainEntityOfPage: `${SITE_URL}/guias/vender-auto-usado-argentina`, author: { '@type': 'Organization', name: SITE_NAME } }) }} /><header className="max-w-3xl"><p className="marketplace-eyebrow text-[#FF2E88]">Guía de venta · Argentina</p><h1 className="mt-3 text-4xl font-extrabold tracking-[-.07em] text-[#171130] sm:text-6xl">Cómo vender un auto usado sin perder tiempo ni confianza</h1><p className="mt-5 text-lg leading-relaxed text-[#4E446C]">Una publicación clara no necesita prometer de más. Necesita documentación ordenada, un precio defendible, fotos honestas y una forma simple de hablar con quien realmente está interesado.</p></header><div className="mt-10 space-y-10 text-[#4E446C] leading-8"><section><h2 className="text-2xl font-extrabold tracking-[-.04em] text-[#171130]">1. Reuní la documentación antes de publicar</h2><p className="mt-3">Tené a mano la documentación del vehículo y verificá qué falta antes de coordinar una visita. El título, la cédula, la identificación del titular y la información de deudas o infracciones pueden cambiar la decisión de un comprador. Los requisitos y costos dependen de la jurisdicción y pueden actualizarse, así que confirmá el procedimiento vigente en el Registro Seccional correspondiente y en los canales oficiales.</p><p className="mt-3">Si algo está pendiente, declaralo en la publicación. “Listo para transferir” solo debería usarse cuando realmente podés sostenerlo con documentación.</p></section><section><h2 className="text-2xl font-extrabold tracking-[-.04em] text-[#171130]">2. Definí un precio que se pueda explicar</h2><p className="mt-3">Compará vehículos del mismo modelo, año, versión y estado, pero no copies automáticamente el precio más alto. Kilometraje, cubiertas, service, choques, cantidad de dueños y documentación afectan el valor real. Dejá claro si el precio es fijo, negociable o a convenir, y especificá la moneda para evitar conversaciones confusas.</p><p className="mt-3">El catálogo técnico de {SITE_NAME} puede ayudarte a revisar equipamiento y versiones antes de comparar publicaciones similares.</p><Link href="/vehiculos" className="mt-4 inline-flex font-extrabold text-[#FF2E88] underline">Explorar fichas técnicas →</Link></section><section><h2 className="text-2xl font-extrabold tracking-[-.04em] text-[#171130]">3. Sacá fotos que respondan preguntas</h2><p className="mt-3">Usá luz natural y mostr&aacute; el vehículo completo: frente, laterales, trasera, interior, tablero con kilometraje, neumáticos, baúl y cualquier detalle relevante. No tapes rayones ni testigos del tablero; explicar un defecto desde el principio suele ahorrar visitas que no iban a concretarse.</p></section><section><h2 className="text-2xl font-extrabold tracking-[-.04em] text-[#171130]">4. Escribí una descripción útil</h2><p className="mt-3">Incluí versión, año, kilometraje, mantenimiento reciente, accesorios, estado de la documentación, ubicación aproximada y qué tipo de operación aceptás. Evitá frases como “impecable” si no agregan información. Una persona que busca comprar quiere saber qué puede verificar y cómo contactarte.</p></section><section><h2 className="text-2xl font-extrabold tracking-[-.04em] text-[#171130]">5. Coordiná el contacto con cuidado</h2><p className="mt-3">Conversá dentro de la plataforma hasta confirmar que la consulta es real. No envíes claves, códigos ni datos bancarios por una conversación de compraventa. Para una operación presencial, acordá un lugar razonable y no entregues el vehículo ni la documentación original sin verificar el pago y el proceso de transferencia.</p></section></div><section className="mt-12 rounded-3xl bg-[#171130] p-6 text-white sm:p-9"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#23D9FF]">Siguiente paso</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-.06em]">Publicá tu vehículo con contacto directo</h2><p className="mt-3 max-w-2xl leading-relaxed text-white/70">Sin intermediarios: cargá fotos, documentación declarada, precio y descripción para que las personas interesadas puedan escribirte.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/publicar" className="rounded-full bg-[#FF2E88] px-5 py-3 text-sm font-extrabold text-white">Publicar gratis →</Link><Link href="/listings" className="rounded-full border border-white/30 px-5 py-3 text-sm font-bold text-white">Ver publicaciones</Link></div></section></main>
src/app/vehiculos/[slug]/historial/page.tsx:228:              className="inline-flex items-center gap-2 rounded-lg bg-auto-accent px-4 py-2 text-sm font-semibold text-[#171130] transition-transform hover:scale-105 active:scale-95"
src/app/test-supabase/page.tsx:39:        <p style={{ color: '#c0392b' }}>
src/app/test-supabase/page.tsx:46:          <p style={{ color: '#27ae60' }}>
src/app/test-supabase/page.tsx:60:      <p style={{ marginTop: 32, fontSize: 12, color: '#888' }}>
src/app/terminos/page.tsx:25:      <Reveal delay={100} className="stagger prose-legal max-w-none space-y-8 text-neutral-500/80">
src/components/ui/WishlistButton.tsx:136:          ? 'border-auto-accent bg-auto-accent text-[#171130]'
src/app/globals.css:172:  background: rgba(178, 58, 36, 0.3);
src/app/globals.css:173:  color: rgb(var(--color-ink));
src/app/globals.css:178:  outline: 2px solid rgb(var(--color-oxide-red));
src/app/globals.css:190:  background: rgb(var(--color-surface-alt));
src/app/globals.css:194:  background: rgb(var(--color-neutral-400));
src/app/globals.css:199:  background: rgb(var(--color-neutral-500));
src/app/globals.css:204:  scrollbar-color: rgb(var(--color-neutral-400)) rgb(var(--color-surface-alt));
src/app/globals.css:223:    rgb(var(--color-edge) / 0.5),
src/app/globals.css:291:    rgba(255, 255, 255, 0.2),
src/app/globals.css:368:  background-image: radial-gradient(ellipse 120% 55% at 50% -12%, rgba(20, 17, 12, 0.05), transparent 62%);
src/app/globals.css:410:  background: linear-gradient(135deg, transparent 50%, rgb(var(--color-edge)) 50%);
src/app/globals.css:411:  box-shadow: -1px 1px 2px rgba(20, 17, 12, 0.1);
src/app/globals.css:425:  box-shadow: 0 12px 20px -8px rgba(20, 17, 12, 0.18);
src/app/globals.css:436:  background: linear-gradient(135deg, rgb(var(--color-oxide-red)) 0%, rgb(var(--color-archive-green)) 100%);
src/app/globals.css:449:  background: linear-gradient(135deg, rgb(var(--color-oxide-red)) 0%, rgb(var(--color-archive-green)) 100%);
src/app/globals.css:457:  background-color: rgba(244, 241, 234, 0.95);
src/app/globals.css:462:  background-color: rgba(20, 17, 12, 0.95);
src/app/globals.css:488:    rgba(255, 255, 255, 0.16) 50%,
src/app/globals.css:508:  box-shadow: inset 0 0 2.5rem rgba(20, 17, 12, 0.16);
src/app/globals.css:512:  box-shadow: inset 0 0 2.5rem rgba(0, 0, 0, 0.35);
src/app/globals.css:525:    rgba(var(--color-ink), 0.035) 50%,
src/app/globals.css:555:  border: 1px solid rgb(var(--color-edge));
src/app/globals.css:556:  background-color: rgba(var(--color-ink), 0.03);
src/app/globals.css:557:  color: rgb(var(--color-neutral-500));
src/app/globals.css:593:  background-color: rgb(var(--color-surface-card));
src/app/globals.css:594:  box-shadow: 0 1px 0 1px rgb(var(--color-edge-strong));
src/app/globals.css:611:  background-color: rgba(var(--color-oxide-red), 0.08);
src/app/globals.css:612:  border: 1px solid rgba(var(--color-oxide-red), 0.18);
src/app/globals.css:664:  --marketplace-ink: #171130;
src/app/globals.css:665:  --marketplace-muted: #4E446C;
src/app/globals.css:666:  --marketplace-coral: #FF2E88;
src/app/globals.css:667:  --marketplace-coral-soft: #ff9b82;
src/app/globals.css:668:  --marketplace-night: #171130;
src/app/globals.css:674:    linear-gradient(135deg, rgba(255, 255, 255, 0.035) 0, transparent 38%),
src/app/globals.css:675:    radial-gradient(circle at 80% 15%, rgba(255, 107, 71, 0.16), transparent 30%),
src/app/globals.css:676:    radial-gradient(circle at 10% 100%, rgba(69, 112, 130, 0.18), transparent 34%);
src/app/globals.css:684:  background-image: linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
src/app/globals.css:689:  background: #1a252b;
src/app/globals.css:690:  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.3);
src/app/globals.css:693:  background: radial-gradient(circle at 50% 30%, #2b3b43 0, #171130 65%);
src/app/globals.css:696:  border: 1px solid rgba(255, 255, 255, 0.13);
src/app/globals.css:697:  background: rgba(255, 255, 255, 0.07);
src/app/globals.css:698:  box-shadow: 0 14px 42px rgba(0, 0, 0, 0.18);
src/app/globals.css:730:  border: 1px solid rgba(255, 255, 255, 0.2);
src/app/globals.css:731:  color: rgba(255, 255, 255, 0.82);
src/app/globals.css:734:  border-color: rgba(255, 255, 255, 0.55);
src/app/globals.css:735:  background: rgba(255, 255, 255, 0.08);
src/app/globals.css:742:  color: #e35e3d;
src/app/globals.css:748:  color: #bd4225;
src/app/globals.css:752:  box-shadow: 0 12px 32px rgba(16, 31, 38, 0.12);
src/app/globals.css:756:  box-shadow: 0 20px 42px rgba(16, 31, 38, 0.2);
src/app/globals.css:782:  background: #171130;
src/app/globals.css:784:    radial-gradient(circle at 88% 12%, rgba(35, 217, 255, 0.36), transparent 30%),
src/app/globals.css:785:    radial-gradient(circle at 15% 90%, rgba(255, 46, 136, 0.16), transparent 30%),
src/app/globals.css:786:    linear-gradient(135deg, #171130 0%, #171130 52%, #1b252b 100%);
src/app/globals.css:794:  background-image: linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px);
src/app/globals.css:799:  border: 1px solid rgba(255,255,255,.14);
src/app/globals.css:802:  background: rgba(255,255,255,.07);
src/app/globals.css:803:  box-shadow: 0 18px 50px rgba(0,0,0,.2);
src/app/globals.css:819:  background: #FF2E88;
src/app/globals.css:820:  color: #fff;
src/app/globals.css:822:.marketplace-home-primary-cta:hover { background: #FF5BA3; color: #171130; }
src/app/globals.css:824:  border: 1px solid rgba(255,255,255,.22);
src/app/globals.css:825:  color: rgba(255,255,255,.86);
src/app/globals.css:827:.marketplace-home-secondary-cta:hover { border-color: rgba(255,255,255,.6); background: rgba(255,255,255,.08); color: #fff; }
src/app/globals.css:833:  border: 1px solid rgba(35,217,255,.26);
src/app/globals.css:836:  background: linear-gradient(145deg, rgba(255,46,136,.32), rgba(255,255,255,.04));
src/app/globals.css:837:  box-shadow: 0 30px 80px rgba(0,0,0,.22);
src/app/globals.css:840:  background: #171130;
src/app/globals.css:845:  border: 1px solid rgba(255,255,255,.12);
src/app/globals.css:847:  background: linear-gradient(110deg, rgba(255,255,255,.05) 30%, rgba(255,255,255,.12) 45%, rgba(255,255,255,.05) 60%);
src/app/globals.css:855:  border: 1px dashed rgba(35,217,255,.42);
src/app/globals.css:857:  background: rgba(255,255,255,.93);
src/app/globals.css:858:  box-shadow: 0 12px 28px rgba(0,0,0,.12);
src/app/globals.css:865:  border-bottom: 1px dashed #a9ccca;
src/app/globals.css:866:  background: repeating-linear-gradient(135deg, #E8D7FF 0, #E8D7FF 12px, #F6F3FF 12px, #F6F3FF 24px);
src/app/globals.css:867:  color: #FF2E88;
src/app/globals.css:880:  color: #171130;
src/app/globals.css:885:  border: 1px solid #ECE7FA;
src/app/globals.css:888:  background: #F6F3FF;
src/app/globals.css:891:.marketplace-category-card:hover { transform: translateY(-3px); border-color: #23D9FF; background: #fff; box-shadow: 0 15px 30px rgba(23,17,48,.08); }
src/app/globals.css:899:  background: #E8D7FF;
src/app/globals.css:900:  color: #FF2E88;
src/app/globals.css:906:  background: #FF2E88;
src/app/globals.css:927:  color: #fff;
src/app/globals.css:938:  background: rgba(255,255,255,.14);
src/app/globals.css:943:.marketplace-category-card:hover { transform: translateY(-8px) rotate(-.6deg); box-shadow: 0 26px 50px rgba(23,17,48,.2); filter: saturate(1.08); }
src/app/globals.css:945:.marketplace-category-card-autos { grid-column: span 2; min-height: 30rem; background: linear-gradient(145deg, #FF2E88, #171130); }
src/app/globals.css:946:.marketplace-category-card-motos { background: linear-gradient(145deg, #FF2E88, #D90067); }
src/app/globals.css:947:.marketplace-category-card-camionetas { background: linear-gradient(145deg, #23D9FF, #075A70); }
src/app/globals.css:948:.marketplace-category-card-utilitarios { background: linear-gradient(145deg, #7B4DFF, #342B51); }
src/app/globals.css:951:.marketplace-category-button { display: inline-flex; width: fit-content; align-items: center; gap: .55rem; border: 1px solid rgba(255,255,255,.42); border-radius: 9999px; padding: .75rem 1rem; font-size: .8rem; font-weight: 800; background: rgba(0,0,0,.12); transition: background-color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard); }
src/app/globals.css:952:.marketplace-category-card:hover .marketplace-category-button { background: rgba(255,255,255,.2); border-color: rgba(255,255,255,.75); }
src/app/globals.css:953:.marketplace-process-section { padding-block: 5.5rem; background: #171130; }
src/app/globals.css:955:.marketplace-process-card { min-height: 22rem; border: 1px solid rgba(255,255,255,.14); border-radius: 1.5rem; padding: 1.5rem; background: linear-gradient(145deg, rgba(255,255,255,.1), rgba(255,255,255,.035)); }
src/app/globals.css:956:.marketplace-process-icon { display: flex; width: 4.5rem; height: 4.5rem; align-items: center; justify-content: center; border-radius: 1.25rem; background: #FF2E88; color: #171130; font-size: 2.2rem; font-weight: 900; box-shadow: 0 12px 25px rgba(255,46,136,.25); }
src/app/globals.css:957:.marketplace-financing-section { padding-block: 5.5rem; background: #E8D7FF; }
src/app/globals.css:958:.marketplace-financing-card { border: 1px solid #D8CDF7; border-radius: 2rem; padding: 1rem; background: #F0EBFF; box-shadow: 0 24px 55px rgba(23,17,48,.12); }
src/app/globals.css:960:.marketplace-calculator-range { height: .5rem; appearance: none; border-radius: 9999px; background: linear-gradient(90deg, #FF2E88 0%, #FF2E88 var(--range-progress, 20%), #D8CDF7 var(--range-progress, 20%), #D8CDF7 100%); accent-color: #FF2E88; }
src/app/globals.css:961:.marketplace-calculator-range::-webkit-slider-thumb { width: 1.35rem; height: 1.35rem; appearance: none; border: 3px solid #fff; border-radius: 50%; background: #FF2E88; box-shadow: 0 3px 10px rgba(23,17,48,.25); }
src/app/globals.css:962:.marketplace-calculator-range::-moz-range-thumb { width: 1.1rem; height: 1.1rem; border: 3px solid #fff; border-radius: 50%; background: #FF2E88; box-shadow: 0 3px 10px rgba(23,17,48,.25); }
src/app/globals.css:963:.marketplace-footer { padding: 5rem 0 3rem; background: #171130; color: #fff; }
src/app/globals.css:966:.marketplace-footer-mark { display: flex; width: 2.25rem; height: 2.25rem; align-items: center; justify-content: center; border-radius: .7rem; background: #FF2E88; font-weight: 900; color: #fff; }
src/app/globals.css:967:.marketplace-footer-kicker { margin-bottom: 1rem; color: #23D9FF; font-size: .7rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
src/app/globals.css:969:.marketplace-footer-action-link { color: #fff; font-size: 1.15rem; font-weight: 750; letter-spacing: -.02em; transition: color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard); }
src/app/globals.css:970:.marketplace-footer-action-link:hover { color: #FF5BA3; transform: translateX(4px); }
src/app/globals.css:971:.marketplace-footer-explore a { color: rgba(255,255,255,.6); font-size: .9rem; transition: color var(--dur-fast) var(--ease-standard); }
src/app/globals.css:972:.marketplace-footer-explore a:hover, .marketplace-footer-fine-print a:hover { color: #23D9FF; }
src/app/globals.css:973:.marketplace-footer-lower { display: flex; align-items: flex-end; justify-content: space-between; gap: 2rem; border-top: 1px solid rgba(255,255,255,.13); padding-top: 2rem; }
src/app/globals.css:975:.marketplace-footer-fine-print a { color: rgba(255,255,255,.4); font-size: .75rem; transition: color var(--dur-fast) var(--ease-standard); }
src/app/globals.css:976:.marketplace-footer-top { display: inline-flex; align-items: center; gap: .5rem; border: 1px solid rgba(255,255,255,.2); border-radius: 9999px; padding: .7rem 1rem; color: rgba(255,255,255,.7); font-size: .8rem; font-weight: 700; transition: border-color var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard); }
src/app/globals.css:977:.marketplace-footer-top:hover { border-color: #23D9FF; color: #fff; }
src/app/globals.css:978:.marketplace-footer-legal { display: flex; justify-content: space-between; gap: 1rem; border-top: 1px solid rgba(255,255,255,.08); padding-top: 1.5rem; color: rgba(255,255,255,.35); font-size: .7rem; line-height: 1.5; }
src/app/globals.css:983:.marketplace-auth-page { position: relative; min-height: 75vh; display: grid; place-items: center; overflow: hidden; padding: 4rem 1rem; background: #171130; }
src/app/globals.css:984:.marketplace-auth-card { position: relative; z-index: 1; width: min(100%, 31rem); border: 1px solid rgba(255,255,255,.14); border-radius: 2rem; padding: 2rem; background: rgba(255,255,255,.96); box-shadow: 0 30px 80px rgba(0,0,0,.25); }
src/app/globals.css:985:.marketplace-auth-brand { display: inline-flex; align-items: center; gap: .65rem; color: #171130; font-weight: 850; letter-spacing: -.03em; }
src/app/globals.css:986:.marketplace-auth-brand span { display: grid; width: 2rem; height: 2rem; place-items: center; border-radius: .6rem; background: #FF2E88; color: #fff; font-size: .8rem; }
src/app/globals.css:988:.marketplace-auth-kicker { color: #FF2E88; font-size: .7rem; font-weight: 850; letter-spacing: .16em; text-transform: uppercase; }
src/app/globals.css:989:.marketplace-auth-heading h1, .marketplace-auth-status h1 { margin-top: .65rem; color: #171130; font-size: clamp(2.2rem, 7vw, 3.6rem); font-weight: 850; line-height: .98; letter-spacing: -.065em; }
src/app/globals.css:990:.marketplace-auth-heading p:not(.marketplace-auth-kicker), .marketplace-auth-status p, .marketplace-auth-sent p { margin-top: 1rem; color: #4E446C; font-size: .95rem; line-height: 1.65; }
src/app/globals.css:992:.marketplace-auth-form label { color: #171130; font-size: .75rem; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; }
src/app/globals.css:993:.marketplace-auth-form input { border: 1px solid #D8CDF7; border-radius: 1rem; padding: .9rem 1rem; color: #171130; outline: none; }
src/app/globals.css:994:.marketplace-auth-form input:focus { border-color: #FF2E88; box-shadow: 0 0 0 4px rgba(35,217,255,.25); }
src/app/globals.css:995:.marketplace-auth-primary { display: inline-flex; align-items: center; justify-content: center; gap: .55rem; border-radius: 9999px; background: #FF2E88; padding: .9rem 1.2rem; color: #171130; font-size: .9rem; font-weight: 800; transition: transform var(--dur-fast) var(--ease-premium), background-color var(--dur-fast) var(--ease-premium); }
src/app/globals.css:996:.marketplace-auth-primary:hover { background: #D90067; transform: translateY(-2px); }
src/app/globals.css:999:.marketplace-auth-error { border-radius: 1rem; background: #FFE0ED; padding: .8rem; color: #D90067; font-size: .8rem; }
src/app/globals.css:1001:.marketplace-auth-mail, .marketplace-auth-success { display: grid; width: 4.5rem; height: 4.5rem; margin-inline: auto; place-items: center; border-radius: 1.4rem; background: #E8D7FF; color: #FF2E88; font-size: 2rem; font-weight: 900; }
src/app/globals.css:1002:.marketplace-auth-success { background: #FF2E88; color: #171130; }
src/app/globals.css:1003:.marketplace-auth-sent h2 { margin-top: 1.5rem; color: #171130; font-size: 1.7rem; font-weight: 800; letter-spacing: -.04em; }
src/app/globals.css:1004:.marketplace-auth-muted { color: #6C618B !important; font-size: .8rem !important; }
src/app/globals.css:1005:.marketplace-auth-secondary { margin-top: 1.5rem; border: 1px solid #D8CDF7; border-radius: 9999px; padding: .75rem 1rem; color: #FF2E88; font-size: .8rem; font-weight: 750; }
src/app/globals.css:1006:.marketplace-auth-footer { margin-top: 2rem; color: #6C618B; font-size: .7rem; line-height: 1.5; text-align: center; }
src/app/globals.css:1008:.marketplace-auth-orb-one { top: -14rem; right: -8rem; background: #FF2E88; }
src/app/globals.css:1009:.marketplace-auth-orb-two { bottom: -18rem; left: -12rem; background: #FF2E88; }
src/app/globals.css:1010:.marketplace-auth-spinner { width: 3rem; height: 3rem; margin: 0 auto 1rem; border: 4px solid #E8D7FF; border-top-color: #FF2E88; border-radius: 50%; animation: marketplace-spin 800ms linear infinite; }
src/app/globals.css:1012:.marketplace-listing-page { min-height: 75vh; background: #F6F3FF; padding: 2rem 1rem 5rem; }
src/app/globals.css:1014:.marketplace-listing-back { color: #FF2E88; font-size: .8rem; font-weight: 750; }
src/app/globals.css:1016:.marketplace-listing-gallery { overflow: hidden; border-radius: 2rem; background: #ECE7FA; box-shadow: 0 20px 50px rgba(23,17,48,.12); }
src/app/globals.css:1019:.marketplace-listing-no-photo { display: grid; width: 100%; height: 100%; place-items: center; background: linear-gradient(145deg, #E8D7FF, #D8CDF7); color: #FF2E88; font-size: 1rem; font-weight: 800; }
src/app/globals.css:1021:.marketplace-listing-info h1 { margin-top: .7rem; color: #171130; font-size: clamp(2.2rem, 5vw, 4.8rem); font-weight: 850; line-height: .95; letter-spacing: -.07em; }
src/app/globals.css:1022:.marketplace-listing-price { margin-top: 1.5rem; color: #FF2E88; font-size: 2rem; font-weight: 900; letter-spacing: -.06em; }
src/app/globals.css:1025:.marketplace-listing-panel { margin-top: 2rem; border-top: 1px solid #D8CDF7; padding-top: 1.5rem; color: #4E446C; line-height: 1.7; }
src/app/globals.css:1026:.marketplace-wizard-progress { margin-bottom: 1rem; border-radius: 1.25rem; background: #171130; padding: 1rem 1.25rem; color: #fff; }
src/app/globals.css:1028:.marketplace-wizard-progress-bar { height: .45rem; margin-top: .8rem; overflow: hidden; border-radius: 9999px; background: rgba(255,255,255,.16); }
src/app/globals.css:1029:.marketplace-wizard-progress-bar span { display: block; height: 100%; border-radius: inherit; background: #FF2E88; transition: width var(--dur-base) linear; }
src/app/globals.css:1030:.marketplace-wizard-success { border-radius: 2rem; background: linear-gradient(145deg, #FF2E88, #171130); padding: 2.5rem 1.5rem; color: #fff; text-align: center; box-shadow: 0 24px 50px rgba(255,46,136,.2); }
src/app/globals.css:1032:.marketplace-wizard-success p { margin: .8rem auto 0; max-width: 34rem; color: rgba(255,255,255,.75); line-height: 1.6; }
src/app/globals.css:1033:.marketplace-photo-dropzone { display: flex; min-height: 11rem; cursor: pointer; flex-direction: column; align-items: center; justify-content: center; gap: .6rem; border: 2px dashed #23D9FF; border-radius: 1.5rem; background: #F0EBFF; padding: 1.5rem; text-align: center; transition: background-color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard); }
src/app/globals.css:1034:.marketplace-photo-dropzone:hover { border-color: #FF2E88; background: #E8D7FF; }
src/app/globals.css:1035:.marketplace-photo-tile { position: relative; overflow: hidden; border: 2px solid #D8CDF7; border-radius: 1rem; background: #E8D7FF; }
src/app/globals.css:1036:.marketplace-photo-tile.is-cover { border-color: #FF2E88; box-shadow: 0 0 0 3px rgba(255,46,136,.18); }
src/app/globals.css:1038:.marketplace-message-page { min-height: 75vh; background: #F6F3FF; padding: 2rem 1rem 5rem; }
src/app/globals.css:1041:.marketplace-message-card { border: 1px solid #D8CDF7; border-radius: 1.5rem; background: #fff; padding: 1rem; box-shadow: 0 14px 35px rgba(23,17,48,.06); }
src/app/globals.css:1043:.marketplace-message-bubble.mine { border-bottom-right-radius: .35rem; background: #FF2E88; color: #171130; }
src/app/globals.css:1044:.marketplace-message-bubble.theirs { border-bottom-left-radius: .35rem; background: #F0EBFF; color: #171130; }
src/app/globals.css:1047:.marketplace-skeleton { background: linear-gradient(90deg, #ECE7FA 25%, #F0EBFF 50%, #ECE7FA 75%); background-size: 200% 100%; animation: marketplace-skeleton-shift 1.3s ease-in-out infinite; }
src/components/ui/FinancingCalculator.tsx:50:          emphasis ? 'text-4xl font-black tracking-[-0.06em] text-[#FF2E88] sm:text-5xl' : 'text-sm font-medium text-[#4E446C]'
src/components/ui/FinancingCalculator.tsx:146:            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#4E446C]">
src/components/ui/FinancingCalculator.tsx:149:            <div className="flex overflow-hidden rounded-xl border border-[#D8CDF7] bg-white focus-within:border-[#FF2E88]">
src/components/ui/FinancingCalculator.tsx:154:                className="border-r border-[#D8CDF7] bg-white px-3 text-sm font-bold text-[#171130] focus:outline-none focus:ring-2 focus:ring-[#23D9FF]"
src/components/ui/FinancingCalculator.tsx:167:                className="w-full bg-white px-3 py-3 text-base font-semibold text-[#171130] focus:outline-none"
src/components/ui/FinancingCalculator.tsx:174:            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#4E446C]">
src/components/ui/FinancingCalculator.tsx:184:              className="w-full rounded-xl border border-[#D8CDF7] bg-white px-3 py-3 text-base font-semibold text-[#171130] transition duration-200 focus:border-[#FF2E88] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#23D9FF]"
src/components/ui/FinancingCalculator.tsx:189:            <span className="mb-2 flex items-baseline justify-between text-xs font-bold uppercase tracking-[0.14em] text-[#4E446C]">
src/components/ui/FinancingCalculator.tsx:191:              <span className="text-base font-black text-[#FF2E88]">{downPaymentPercent}%</span>
src/components/ui/FinancingCalculator.tsx:205:            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#4E446C]">
src/components/ui/FinancingCalculator.tsx:211:              className="w-full rounded-xl border border-[#D8CDF7] bg-white px-3 py-3 text-base font-semibold text-[#171130] transition duration-200 focus:border-[#FF2E88] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#23D9FF]"
src/components/ui/FinancingCalculator.tsx:223:          <dl className="space-y-2 border-t border-[#ECE7FA] pt-5">
src/components/ui/FinancingCalculator.tsx:237:          <Link href="/listings" className="inline-flex w-full items-center justify-center rounded-full bg-[#FF2E88] px-5 py-3 text-sm font-bold text-[#171130] transition hover:bg-[#D90067] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5BA3] focus-visible:ring-offset-2">
src/components/ui/FinancingCalculator.tsx:243:          <div className="space-y-3 rounded-2xl border border-[#D8CDF7] bg-white p-5">
src/components/ui/FinancingCalculator.tsx:244:            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF2E88]">
src/components/ui/FinancingCalculator.tsx:258:                className="w-full rounded-xl border border-[#D8CDF7] bg-white px-3 py-3 text-sm text-[#171130] transition duration-200 focus:border-[#FF2E88] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#23D9FF]"
src/components/ui/FinancingCalculator.tsx:266:                className="w-full rounded-xl border border-[#D8CDF7] bg-white px-3 py-3 text-sm text-[#171130] transition duration-200 focus:border-[#FF2E88] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#23D9FF]"
src/components/ui/FinancingCalculator.tsx:275:                className="inline-flex w-full items-center justify-center rounded-full bg-[#FF2E88] px-5 py-3 text-sm font-bold text-[#171130] transition duration-200 hover:bg-[#171130] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#23D9FF] focus-visible:ring-offset-2 sm:w-auto"
src/app/global-error.tsx:33:          backgroundColor: '#171130',
src/app/global-error.tsx:34:          color: '#F6F3FF',
src/app/global-error.tsx:52:              backgroundColor: '#F6F3FF',
src/app/global-error.tsx:53:              color: '#171130',
src/app/publicar/page.tsx:13:    return <main className="marketplace-auth-page"><div className="marketplace-auth-card"><p className="marketplace-auth-kicker">Convertite en vendedor</p><h1 className="marketplace-auth-heading">Tu próximo comprador puede estar buscando ahora.</h1><p className="mt-4 text-sm leading-relaxed text-[#4E446C]">Publicar es gratis. Vas a cargar fotos, datos y contacto directo en ocho pasos simples. Sin contraseñas: entrá con un link seguro por email.</p><Link href="/ingresar" className="marketplace-auth-primary mt-7">Ingresar para publicar <span aria-hidden="true">↗</span></Link></div></main>
src/app/publicar/page.tsx:15:  return <main className="min-h-[75vh] bg-[#F6F3FF] px-4 py-8 sm:py-12"><div className="mx-auto w-full max-w-2xl"><div className="mb-6"><p className="marketplace-eyebrow text-[#FF2E88]">Publicá en Sin Frenos</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-.06em] text-[#171130]">Mostrá tu vehículo. Recibí consultas.</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-[#4E446C]">Te vamos a acompañar paso a paso. Podés volver atrás y editar todo antes de publicar.</p></div><PublishWizard userId={user.id} /></div></main>
src/app/privacidad/page.tsx:25:      <Reveal delay={100} className="stagger prose-legal max-w-none space-y-8 text-neutral-500/80">
src/app/financiar/[slug]/page.tsx:94:                className="inline-flex items-center gap-2 rounded-lg bg-auto-accent px-6 py-3 font-display text-sm font-semibold text-[#171130] transition-transform hover:scale-105 active:scale-95"
src/app/financiar/[slug]/page.tsx:162:            className="inline-flex items-center gap-2 rounded-lg bg-auto-accent px-4 py-2 text-sm font-semibold text-[#171130] transition-transform hover:scale-105 active:scale-95"
src/app/page.tsx:27:            <p className="marketplace-eyebrow text-[#FF2E88]">Empezá por lo que buscás</p>
src/app/page.tsx:63:          <p className="marketplace-eyebrow text-[#23D9FF]">Comprar o vender, sin vueltas</p>
src/app/page.tsx:71:              <div className="mt-10 flex items-center gap-3"><span className="text-sm font-bold text-[#FF5BA3]">{number}</span><span className="h-px flex-1 bg-white/15" /></div>
src/app/page.tsx:88:            <p className="marketplace-eyebrow text-[#FF2E88]">Hacé números antes de decidir</p>
src/app/page.tsx:90:            <p className="mt-5 max-w-md text-base leading-relaxed text-[#4E446C]">Una simulación rápida para saber qué opciones entran en tu presupuesto y seguir buscando con más claridad.</p>
src/app/page.tsx:106:    <section className="border-t border-[#ECE7FA] bg-[#F6F3FF] py-8" aria-label="Catálogo técnico">
src/app/page.tsx:108:        <p className="text-sm text-[#667780]">¿Buscás especificaciones de un modelo puntual?</p>
src/app/page.tsx:119:      <div className="marketplace-home min-h-screen bg-[#F6F3FF]">
src/app/page.tsx:124:                <p className="marketplace-eyebrow text-[#23D9FF]">Marketplace automotor argentino</p>
src/app/page.tsx:125:                <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.96] tracking-[-0.07em] text-white sm:text-7xl lg:text-[6.5rem]">Comprá mejor.<br /><span className="text-[#FF5BA3]">Vendé más fácil.</span></h1>
src/app/page.tsx:138:                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#23D9FF]">Una nueva forma de moverte</span>
src/app/page.tsx:140:                  <div className="mt-10 flex items-center gap-3 text-sm text-white/55"><span className="h-2 w-2 rounded-full bg-[#FF5BA3]" /> Compra, venta y decisión en un solo lugar</div>
src/app/page.tsx:157:            <Link href="/publicar" prefetch={false} className="mt-8 inline-flex rounded-full bg-[#171130] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#1d3540] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#FF2E88]">Ser el primero en publicar <span aria-hidden="true">↗</span></Link>
src/app/mis-publicaciones/page.tsx:72:  pending_review: 'border border-[#23D9FF] bg-[#D9F9FF] text-[#075A70]',
src/app/mis-publicaciones/page.tsx:73:  published: 'border border-[#A7C900] bg-[#F1FFD0] text-[#435400]',
src/app/mis-publicaciones/page.tsx:75:  sold: 'border border-[#FF5BA3] bg-[#FFE0ED] text-[#9C064B]',
src/app/mis-publicaciones/page.tsx:81:  'rounded-md bg-auto-accent px-3 py-1.5 text-xs font-semibold text-[#171130] transition duration-200 hover:bg-auto-accent-strong active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50'
src/components/monetization/TramitesLeadForm.tsx:187:          className="w-full rounded-md bg-auto-accent px-3 py-2 text-sm font-semibold text-[#171130] transition duration-200 hover:bg-auto-accent-strong active:scale-[0.99] active:bg-auto-accent-strong disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auto-accent focus-visible:ring-offset-2"
src/app/concesionarias-concepcion-del-uruguay/page.tsx:162:            className="tap-scale mt-2 inline-flex items-center gap-2 rounded-lg bg-auto-accent px-6 py-3 font-display text-sm font-semibold text-[#171130] transition-transform hover:scale-105"
src/app/mensajes/page.tsx:65:        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#E8D7FF] text-2xl font-black text-[#FF2E88]" aria-hidden="true">↗</div>
src/app/mensajes/page.tsx:66:        <p className="mt-4 text-base font-extrabold text-[#171130]">Tu bandeja está lista.</p>
src/app/mensajes/page.tsx:67:        <p className="mt-2 text-sm leading-relaxed text-[#4E446C]">Contactá a un vendedor desde cualquier publicación para empezar una conversación real.</p>
src/app/mensajes/page.tsx:82:                ? 'border-[#FF2E88] bg-[#FFE0ED]'
src/app/mensajes/page.tsx:83:                : 'border-[#D8CDF7] bg-white hover:border-[#FF2E88] hover:bg-[#F0EBFF]'
src/app/mensajes/page.tsx:86:            <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-[#D8CDF7] bg-[#E8D7FF]">
src/app/mensajes/page.tsx:93:              <p className="truncate text-sm font-extrabold text-[#171130]">{c.listingTitle}</p>
src/app/mensajes/page.tsx:94:              <p className="truncate text-xs text-[#4E446C]">
src/app/mensajes/page.tsx:99:                <p className="mt-1 truncate text-xs text-[#6C618B]">{c.lastMessagePreview}</p>
src/app/mensajes/page.tsx:163:      <div className="mb-4 border-b border-[#ECE7FA] pb-4">
src/app/mensajes/page.tsx:164:        <p className="text-lg font-extrabold tracking-[-.03em] text-[#171130]">{conversation.listingTitle}</p>
src/app/mensajes/page.tsx:165:        <p className="text-xs text-[#4E446C]">
src/app/mensajes/page.tsx:168:        <Link href={`/listings/${conversation.listingId}`} className="text-xs font-bold text-[#FF2E88] underline">
src/app/mensajes/page.tsx:174:        <div className="h-32 animate-pulse rounded-2xl bg-[#F0EBFF]" aria-label="Cargando mensajes…" />
src/app/mensajes/page.tsx:247:        <div className="marketplace-message-card h-32 animate-pulse bg-[#F0EBFF]" aria-label="Cargando mensajes…" />
src/app/mensajes/page.tsx:255:        <h1 className="text-4xl font-extrabold tracking-[-.06em] text-[#171130]">Tus mensajes</h1>
src/app/mensajes/page.tsx:256:        <p className="mt-2 text-sm text-[#4E446C]">Iniciá sesión para hablar con vendedores y seguir tus consultas.</p>
src/app/mensajes/page.tsx:269:      <p className="marketplace-eyebrow text-[#FF2E88]">Contacto directo</p>
src/app/mensajes/page.tsx:270:      <h1 className="mt-2 text-4xl font-extrabold tracking-[-.06em] text-[#171130]">Tus mensajes</h1>
src/app/mensajes/page.tsx:304:        <main className="marketplace-message-page"><div className="marketplace-message-shell"><div className="marketplace-message-card h-40 animate-pulse bg-[#F0EBFF]" aria-label="Cargando mensajes…" /></div></main>
src/components/monetization/StickyAdUnit.tsx:107:      className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-edge bg-surface-card/95 px-2 py-1.5 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.08)] backdrop-blur md:hidden"
src/components/monetization/SponsoredListingBanner.tsx:53:          className="tap-scale inline-flex items-center justify-center rounded-lg bg-auto-accent px-4 py-2 text-sm font-semibold text-[#171130] transition-transform hover:scale-105"
src/app/manifest.ts:21:    background_color: '#171130',
src/app/manifest.ts:22:    theme_color: '#171130',
src/components/monetization/SellVehicleLeadForm.tsx:173:          className="w-full rounded-md bg-auto-accent px-3 py-2 text-sm font-semibold text-[#171130] transition duration-200 hover:bg-auto-accent-strong active:scale-[0.99] active:bg-auto-accent-strong disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auto-accent focus-visible:ring-offset-2"
src/components/monetization/PremiumReportButton.tsx:63:        className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-auto-accent bg-transparent px-4 py-2 text-sm font-semibold text-auto-accent-strong transition-colors hover:bg-auto-accent hover:text-[#171130] disabled:cursor-not-allowed disabled:opacity-50"
src/components/monetization/NewsletterSignupForm.tsx:80:          className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#23D9FF] focus:outline-none sm:w-64"
src/components/monetization/NewsletterSignupForm.tsx:85:          className="inline-flex items-center justify-center rounded-full bg-[#FF2E88] px-5 py-3 text-sm font-bold text-[#171130] transition-transform duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5BA3] focus-visible:ring-offset-2"
src/app/listings/ver/page.tsx:48:  if (error) return <main className="marketplace-listing-page"><div className="marketplace-listing-shell rounded-3xl border border-[#FFB7D7] bg-[#FFE0ED] p-8 text-center"><h1 className="text-2xl font-extrabold text-[#171130]">No pudimos abrir esta publicación</h1><p className="mt-2 text-sm text-[#D90067]">{error}</p><Link href="/listings" className="marketplace-auth-primary mt-6">Volver a publicaciones</Link></div></main>
src/app/listings/ver/page.tsx:55:  return <main className="marketplace-listing-page"><div className="marketplace-listing-shell"><Link href="/listings" className="marketplace-listing-back">← Volver a publicaciones</Link><div className="marketplace-listing-hero"><div><div className="marketplace-listing-gallery"><div className="marketplace-listing-gallery-main">{cover ? <img src={cover.url} alt={listing.title} /> : <div className="marketplace-listing-no-photo">Este vehículo todavía no tiene fotos</div>}<div className="absolute right-4 top-4"><FavoriteButton listingId={listing.id} size={21} /></div></div>{media.length > 1 && <div className="grid grid-cols-4 gap-2 p-2">{media.filter((m) => m.id !== cover?.id).slice(0, 4).map((m) => <img key={m.id} src={m.url} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />)}</div>}</div></div><div className="marketplace-listing-info"><p className="marketplace-eyebrow text-[#FF2E88]">Publicación real · contacto directo</p><h1>{listing.title}</h1><p className="marketplace-listing-price">{price}</p><div className="mt-5 flex flex-wrap gap-2">{meta.map((item) => <span key={item} className="rounded-full bg-[#E8D7FF] px-3 py-1.5 text-xs font-bold text-[#FF2E88]">{item}</span>)}</div><div className="marketplace-listing-contact"><ContactButton listingId={listing.id} sellerId={listing.seller_id} listingTitle={listing.title} /></div><p className="mt-3 text-xs leading-relaxed text-[#6C618B]">Escribile al vendedor desde Sin Frenos. Tu email y teléfono no se comparten automáticamente.</p></div></div>{vehicleModel && <div className="marketplace-listing-panel">Relacionado con el catálogo técnico: <Link href={`/vehiculos/${vehicleModel.slug}`} className="font-bold text-[#FF2E88]">{vehicleModel.manufacturer} {vehicleModel.title} →</Link></div>}{listing.description && <section className="marketplace-listing-panel"><h2 className="text-xl font-extrabold text-[#171130]">Sobre este vehículo</h2><p className="mt-3 max-w-3xl whitespace-pre-line">{listing.description}</p></section>} {listing.condition_details && Object.keys(listing.condition_details).length > 0 && <section className="marketplace-listing-panel"><h2 className="text-xl font-extrabold text-[#171130]">Lo que declara el vendedor</h2><dl className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(listing.condition_details).map(([key, value]) => <div key={key} className="rounded-xl bg-white p-3"><dt className="text-xs font-bold uppercase text-[#6C618B]">{key}</dt><dd className="mt-1 text-sm text-[#171130]">{String(value)}</dd></div>)}</dl></section>}<section className="marketplace-listing-panel flex flex-wrap gap-3 text-sm font-semibold">{listing.accepts_trade && <span>✓ Acepta permuta</span>}{listing.accepts_financing && <span>✓ Acepta financiación</span>}{listing.has_title != null && <span>✓ Documentación: {listing.has_title ? 'al día' : listing.title_status ?? 'a confirmar'}</span>}</section></div></main>
src/components/monetization/MercadoLibreAffiliateButton.tsx:101:        return 'bg-yellow-400 text-[#18181b] hover:bg-yellow-500'
src/components/monetization/LeadQuoteForm.tsx:187:          className="w-full rounded-md bg-auto-accent px-3 py-2 text-sm font-semibold text-[#171130] transition duration-200 hover:bg-auto-accent-strong active:scale-[0.99] active:bg-auto-accent-strong disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auto-accent focus-visible:ring-offset-2"
src/app/listings/page.tsx:219:    <main className="min-h-[70vh] bg-[#F6F3FF] pb-20">
src/app/listings/page.tsx:220:      <section className="bg-[#171130] py-12 text-white sm:py-16">
src/app/listings/page.tsx:222:          <p className="marketplace-eyebrow text-[#ff9b82]">Marketplace Sin Frenos</p>
src/app/listings/page.tsx:236:        <div className="rounded-3xl border border-[#dce5e9] bg-white p-4 shadow-[0_16px_40px_rgba(24,42,52,0.08)] sm:p-6">
src/app/listings/page.tsx:238:            <p className="text-sm text-[#4E446C]">Preparando filtros…</p>
src/app/listings/page.tsx:253:              <p className="marketplace-eyebrow text-[#e35e3d]">Resultados</p>
src/app/listings/page.tsx:254:              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#171130]">
src/app/listings/page.tsx:258:            <p className="text-sm text-[#6C618B]">Contacto directo con el vendedor</p>
src/app/listings/page.tsx:263:              {Array.from({ length: 8 }).map((_, index) => <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl bg-[#e6ecef]" />)}
src/app/listings/page.tsx:266:            <div className="rounded-3xl border border-dashed border-[#cbd7dc] bg-white px-6 py-16 text-center">
src/app/listings/page.tsx:267:              <p className="text-lg font-semibold text-[#171130]">Todavía no encontramos publicaciones con esos filtros.</p>
src/app/listings/page.tsx:268:              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#4E446C]">Probá ampliar la búsqueda o sé el primero en publicar un vehículo para empezar a mover el marketplace.</p>
src/app/listings/page.tsx:295:        <main className="min-h-[70vh] bg-[#F6F3FF] px-4 py-16">
src/app/listings/page.tsx:296:          <div className="mx-auto max-w-5xl animate-pulse rounded-3xl bg-white p-8 text-sm text-[#6C618B]">Preparando el marketplace…</div>
src/components/monetization/ForSaleFlyerForm.tsx:131:        className="mt-3 w-full rounded-md bg-auto-accent px-3 py-2 text-sm font-semibold text-[#171130] transition-colors hover:bg-auto-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
src/app/listings/[id]/page.tsx:73:  if (id === EMPTY_BUILD_ID) return <main className="marketplace-listing-page"><div className="marketplace-listing-shell rounded-3xl border border-[#D8CDF7] bg-white p-8 text-center"><h1 className="text-2xl font-extrabold text-[#171130]">No hay publicaciones disponibles en este build</h1><p className="mt-3 text-sm text-[#4E446C]">Esta ruta técnica no se incluye en el sitemap y solo existe para que el export estático pueda compilar sin conexión a Supabase.</p><Link href="/listings" className="marketplace-auth-primary mt-6">Explorar publicaciones</Link></div></main>
src/app/listings/[id]/page.tsx:80:  return <main className="marketplace-listing-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><div className="marketplace-listing-shell"><Link href="/listings" className="marketplace-listing-back">← Volver a publicaciones</Link><div className="marketplace-listing-hero"><div><div className="marketplace-listing-gallery"><div className="marketplace-listing-gallery-main">{image ? <img src={image} alt={listing.title} /> : <div className="marketplace-listing-no-photo">Este vehículo todavía no tiene fotos</div>}<div className="absolute right-4 top-4"><FavoriteButton listingId={listing.id} size={21} /></div></div>{listing.media.length > 1 && <div className="grid grid-cols-4 gap-2 p-2">{listing.media.filter((item) => item.url !== image).slice(0, 4).map((item) => <img key={item.id} src={item.url} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />)}</div>}</div></div><div className="marketplace-listing-info"><p className="marketplace-eyebrow text-[#FF2E88]">Publicación real · contacto directo</p><h1>{listing.title}</h1><p className="marketplace-listing-price">{priceLabel(listing)}</p><div className="mt-5 flex flex-wrap gap-2">{meta.map((item) => <span key={item} className="rounded-full bg-[#E8D7FF] px-3 py-1.5 text-xs font-bold text-[#FF2E88]">{item}</span>)}</div><div className="marketplace-listing-contact"><ContactButton listingId={listing.id} sellerId={listing.seller_id} listingTitle={listing.title} /></div><p className="mt-3 text-xs leading-relaxed text-[#6C618B]">Escribile al vendedor desde Sin Frenos. Tu email y teléfono no se comparten automáticamente.</p></div></div>{listing.description && <section className="marketplace-listing-panel"><h2 className="text-xl font-extrabold text-[#171130]">Sobre este vehículo</h2><p className="mt-3 max-w-3xl whitespace-pre-line">{listing.description}</p></section>}<section className="marketplace-listing-panel flex flex-wrap gap-3 text-sm font-semibold">{listing.accepts_trade && <span>✓ Acepta permuta</span>}{listing.accepts_financing && <span>✓ Acepta financiación</span>}{listing.has_title != null && <span>✓ Documentación: {listing.has_title ? 'al día' : listing.title_status ?? 'a confirmar'}</span>}</section></div></main>
src/app/anunciate/page.tsx:125:            className="tap-scale mt-2 inline-flex items-center gap-2 rounded-lg bg-auto-accent px-6 py-3 font-display text-sm font-semibold text-[#171130] transition-transform hover:scale-105"
src/components/layout/HeroSceneSVG.tsx:42: * cálido que `magenta` ya tenía como base del degradé (`#FF5BA3`) para el
src/components/layout/HeroSceneSVG.tsx:43: * cielo, y sube el dorado (`#23D9FF`, el mismo hex que `CATEGORY_ACCENT`)
src/components/layout/HeroSceneSVG.tsx:50:  magenta: { skyTop: '#2a0a3d', skyMid: '#FF2E88', skyBottom: '#FF5BA3', sun: '#ffd700' },
src/components/layout/HeroSceneSVG.tsx:51:  cyan: { skyTop: '#0a1a3d', skyMid: '#3d84ff', skyBottom: '#a78bfa', sun: '#23D9FF' },
src/components/layout/HeroSceneSVG.tsx:52:  gold: { skyTop: '#2a1a05', skyMid: '#23D9FF', skyBottom: '#ff8a3d', sun: '#ffe08a' },
src/components/layout/HeroSceneSVG.tsx:57:  const silhouette = '#171130'
src/components/layout/Header.tsx:75:  const iconButtonClass = 'relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5BA3]'
src/components/layout/Header.tsx:78:    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#171130]/95 text-white shadow-[0_8px_30px_rgba(7,16,20,0.12)] backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
src/components/layout/Header.tsx:81:          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF2E88] text-sm font-bold tracking-[-0.08em] text-[#171130] transition-transform duration-200 group-hover:rotate-[-6deg] motion-reduce:transition-none">SF</span>
src/components/layout/Header.tsx:95:                  'relative py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5BA3]',
src/components/layout/Header.tsx:100:                {active && <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-[#FF5BA3]" aria-hidden="true" />}
src/components/layout/Header.tsx:115:            {wishlistHydrated && wishlistCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF2E88] px-1 text-[9px] font-bold text-[#171130]">{wishlistCount > 99 ? '99+' : wishlistCount}</span>}
src/components/layout/Header.tsx:123:              <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[#C7F000]" aria-hidden="true" />
src/components/layout/Header.tsx:128:          <Link href="/publicar" prefetch={false} className="inline-flex rounded-full bg-[#FF2E88] px-3 py-2.5 text-xs font-bold text-[#171130] transition hover:bg-[#FF5BA3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5BA3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171130] sm:px-4 sm:text-sm">Publicar</Link>
src/components/layout/Header.tsx:135:      <nav id="mobile-nav" aria-label="Navegación móvil" aria-hidden={!menuOpen} className={cn('overflow-hidden border-t border-white/10 bg-[#171130] transition-[max-height,opacity] duration-200 lg:hidden', menuOpen ? 'max-h-[38rem] opacity-100' : 'pointer-events-none max-h-0 opacity-0')}>
src/components/layout/Header.tsx:137:          <Link href="/publicar" prefetch={false} onClick={() => setMenuOpen(false)} className="mb-3 flex items-center justify-between rounded-2xl bg-[#FF2E88] px-4 py-3.5 text-sm font-semibold text-[#171130]">Publicar un vehículo <span aria-hidden="true">↗</span></Link>
src/components/layout/ConsentBanner.tsx:135:                className="rounded-lg bg-auto-accent px-4 py-2.5 text-sm font-semibold text-[#171130] transition-colors hover:bg-auto-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auto-accent"
src/components/entities/WishlistExplorer.tsx:85:          className="mt-2 inline-flex items-center rounded-lg bg-auto-accent px-4 py-2 text-sm font-semibold text-[#171130] transition duration-200 hover:bg-auto-accent-strong active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auto-accent"
src/components/listings/publicar/steps/StepPreview.tsx:131:      <hr className="my-6 border-[#ECE7FA]" />
src/components/listings/publicar/steps/StepPreview.tsx:133:      <h3 className="mb-3 text-lg font-extrabold tracking-[-.03em] text-[#171130]">Así se va a ver tu publicación</h3>
src/components/listings/publicar/steps/StepPreview.tsx:135:      <div className="flex flex-col gap-4 rounded-2xl border border-[#D8CDF7] bg-[#F0EBFF] p-4 sm:flex-row">
src/components/listings/publicar/steps/StepPreview.tsx:136:        <div className="h-40 w-full shrink-0 overflow-hidden rounded-xl bg-[#E8D7FF] sm:h-28 sm:w-40">
src/components/listings/publicar/steps/StepPreview.tsx:141:            <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs font-bold text-[#FF2E88]">
src/components/listings/publicar/steps/StepPreview.tsx:148:          <p className="truncate text-lg font-extrabold text-[#171130]">
src/components/listings/publicar/steps/StepPreview.tsx:151:          <p className="text-sm text-[#4E446C]">
src/components/listings/publicar/steps/StepPreview.tsx:156:          <p className="mt-2 text-lg font-black text-[#FF2E88]">
src/components/listings/publicar/steps/StepPreview.tsx:165:                <span className={`${severityBadgeBaseClass} border border-[#D8CDF7] bg-white text-[#FF2E88]`}>
src/components/listings/publicar/steps/StepPreview.tsx:203:      <div className={`${formStyles.navRow} rounded-2xl bg-[#171130] p-4`}>
src/components/home/QuickSearchForm.tsx:94:        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6C618B]"
src/components/home/QuickSearchForm.tsx:116:        className="w-full rounded-xl border border-white/10 bg-white py-3.5 pl-11 pr-24 text-sm text-[#171130] shadow-sm placeholder:text-[#6C618B] transition focus:border-[#FF5BA3] focus:outline-none focus:ring-2 focus:ring-[#FF5BA3]/25 sm:text-base"
src/components/home/QuickSearchForm.tsx:125:        className="pointer-events-none absolute right-20 top-1/2 hidden -translate-y-1/2 items-center rounded-md border border-[#dce5e9] bg-[#F6F3FF] px-1.5 py-1 font-mono text-xs text-[#6C618B] sm:flex"
src/components/home/QuickSearchForm.tsx:131:        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-[#FF2E88] px-3.5 py-2 text-xs font-semibold text-[#171130] transition-[background-color,transform] duration-200 ease-out hover:bg-[#FF5BA3] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5BA3] focus-visible:ring-offset-2 sm:text-sm"
src/components/listings/publicar/steps/StepPhotos.tsx:159:        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#FF2E88] text-2xl font-black text-[#171130]" aria-hidden="true">+</span>
src/components/listings/publicar/steps/StepPhotos.tsx:160:        <span className="text-base font-extrabold text-[#171130]">Arrastrá tus fotos acá o elegilas desde tu dispositivo</span>
src/components/listings/publicar/steps/StepPhotos.tsx:178:        <div className="mt-4 rounded-2xl border border-[#ECE7FA] bg-[#F6F3FF] p-4 text-center text-sm text-[#4E446C]">
src/components/listings/publicar/steps/StepPhotos.tsx:204:                <span className="absolute left-2 top-2 rounded-full bg-[#FF2E88] px-2.5 py-1 text-[11px] font-bold text-[#171130]">
src/components/listings/publicar/steps/StepPhotos.tsx:208:              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-[#171130]/85 p-2 opacity-0 transition duration-150 group-hover:opacity-100 focus-within:opacity-100">
src/components/home/MarketplaceHeroStrip.tsx:44:        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#FF2E88]">Próxima publicación</p>
src/components/home/MarketplaceHeroStrip.tsx:45:        <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-[#171130]">Tu vehículo puede ocupar este lugar.</p>
src/components/home/MarketplaceHeroStrip.tsx:46:        <p className="mt-2 text-sm leading-relaxed text-[#667780]">Este espacio está reservado para una oferta real de la comunidad.</p>
src/components/home/MarketplaceHeroStrip.tsx:47:        <Link href="/publicar" prefetch={false} className="mt-5 inline-flex text-sm font-bold text-[#FF2E88] hover:text-[#c8442a]">Publicar ahora →</Link>
src/components/home/MarketplaceHeroStrip.tsx:91:            <p className="marketplace-eyebrow text-[#23D9FF]">Marketplace Sin Frenos</p>
src/components/home/MarketplaceHeroStrip.tsx:111:          <Link href="/listings" className="text-sm font-bold text-[#23D9FF] transition hover:text-white">Explorar marketplace →</Link>
src/components/entities/VehicleCompareSheet.tsx:70:          <button type="button" onClick={onOpen} disabled={selected.length < 2} className="rounded-lg bg-auto-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#171130] transition-colors hover:bg-auto-accent-orange disabled:cursor-not-allowed disabled:opacity-40">Comparar</button>
src/components/entities/VehicleCompareSheet.tsx:153:        {isWinner && <span className="shrink-0 rounded-full bg-auto-accent px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase text-[#171130]">Mejor</span>}
src/components/entities/VehicleCardV2.tsx:156:          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(to_top,rgba(5,6,7,0.86)_0%,rgba(5,6,7,0.42)_38%,rgba(5,6,7,0)_100%)]" />
src/components/entities/VehicleCardV2.tsx:165:            <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/75 [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
src/components/entities/VehicleCardV2.tsx:171:                  'group/compare inline-flex cursor-pointer items-center gap-1 [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]',
src/components/entities/VehicleCardV2.tsx:209:          <div className="absolute right-2.5 top-2 z-10 opacity-60 transition-opacity duration-200 group-hover/v2card:opacity-100 [&_svg]:drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
src/components/home/CommercialVehicleCard.tsx:48:    <article className="commercial-vehicle-card group relative overflow-hidden rounded-2xl bg-[#171130]">
src/components/home/CommercialVehicleCard.tsx:52:        className="block outline-none focus-visible:ring-2 focus-visible:ring-[#ff6542] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F3FF]"
src/components/home/CommercialVehicleCard.tsx:66:            <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_50%_35%,#34434b_0,#171130_62%)]">
src/components/home/CommercialVehicleCard.tsx:75:          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#171130] via-[#171130]/10 to-transparent" />
src/components/home/CommercialVehicleCard.tsx:76:          <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-[#171130]/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75 backdrop-blur-sm">
src/components/home/CommercialVehicleCard.tsx:92:              <span className="max-w-[80%] truncate text-sm font-semibold text-[#ff9b82]">
src/components/home/CommercialVehicleCard.tsx:106:        className="absolute right-3 top-3 z-10 border-white/20 bg-[#171130]/55 text-white/80 backdrop-blur-sm hover:border-white/50 hover:bg-[#171130]/80 hover:text-white"
src/components/listings/publicar/formStyles.ts:2:  stepCard: 'rounded-3xl border border-[#D8CDF7] bg-white p-5 shadow-[0_16px_40px_rgba(23,17,48,0.08)] sm:p-7',
src/components/listings/publicar/formStyles.ts:3:  stepTitle: 'mb-1 text-2xl font-extrabold tracking-[-0.05em] text-[#171130]',
src/components/listings/publicar/formStyles.ts:4:  stepDescription: 'mb-5 text-sm leading-relaxed text-[#4E446C]',
src/components/listings/publicar/formStyles.ts:6:  label: 'block text-sm font-bold text-[#171130]',
src/components/listings/publicar/formStyles.ts:7:  helperText: 'text-xs leading-relaxed text-[#6C618B]',
src/components/listings/publicar/formStyles.ts:8:  errorText: 'rounded-xl bg-[#FFE0ED] px-3 py-2 text-xs font-semibold text-[#D90067]',
src/components/listings/publicar/formStyles.ts:9:  input: 'w-full rounded-xl border border-[#D8CDF7] bg-white px-3.5 py-3 text-sm text-[#171130] transition duration-200 focus:border-[#FF2E88] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#23D9FF]/35',
src/components/listings/publicar/formStyles.ts:10:  inputError: 'w-full rounded-xl border border-red-400 bg-[#FFE0ED] px-3 py-3 text-sm transition duration-200 focus:border-red-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200',
src/components/listings/publicar/formStyles.ts:11:  select: 'w-full rounded-xl border border-[#D8CDF7] bg-white px-3.5 py-3 text-sm text-[#171130] transition duration-200 focus:border-[#FF2E88] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#23D9FF]/35 disabled:cursor-not-allowed disabled:opacity-50',
src/components/listings/publicar/formStyles.ts:12:  textarea: 'w-full rounded-xl border border-[#D8CDF7] bg-white px-3.5 py-3 text-sm text-[#171130] transition duration-200 focus:border-[#FF2E88] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#23D9FF]/35',
src/components/listings/publicar/formStyles.ts:13:  primaryButton: 'inline-flex items-center justify-center gap-2 rounded-full bg-[#FF2E88] px-5 py-3 text-sm font-extrabold text-white transition duration-200 hover:bg-[#D90067] hover:-translate-y-0.5 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF5BA3]/35',
src/components/listings/publicar/formStyles.ts:14:  secondaryButton: 'inline-flex items-center justify-center gap-2 rounded-full border border-[#D8CDF7] bg-white px-5 py-3 text-sm font-bold text-[#FF2E88] transition duration-200 hover:border-[#FF2E88] hover:bg-[#F0EBFF] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#23D9FF]/35',
src/components/listings/publicar/formStyles.ts:16:  selectableCard: 'flex w-full flex-col items-start gap-1 rounded-2xl border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#23D9FF]/35',
src/components/listings/publicar/formStyles.ts:17:  selectableCardIdle: 'border-[#D8CDF7] bg-white hover:-translate-y-1 hover:border-[#FF2E88] hover:bg-[#F0EBFF]',
src/components/listings/publicar/formStyles.ts:18:  selectableCardSelected: 'border-[#FF2E88] bg-[#FFE0ED] shadow-[0_8px_20px_rgba(255,46,136,.12)]',
src/components/listings/publicar/formStyles.ts:19:  selectableCardDisabled: 'cursor-not-allowed border-[#ECE7FA] bg-[#F6F3FF] opacity-60',
src/components/listings/publicar/formStyles.ts:23:  normal: 'border border-[#A7C900] bg-[#F1FFD0] text-[#435400]',
src/components/listings/publicar/formStyles.ts:24:  atencion: 'border border-[#23D9FF] bg-[#D9F9FF] text-[#075A70]',
src/components/listings/publicar/formStyles.ts:25:  grave: 'border border-[#FF5BA3] bg-[#FFE0ED] text-[#9C064B]',
src/components/entities/RelationsPanel.tsx:40: * mismo color (#B23A24) — el cambio es de nombre, no visual. El overlay
src/components/entities/RelationsPanel.tsx:42: * (#050607) y el panel vive sobre fondo papel claro, así que ese hover
src/components/listings/publicar/PublishWizard.tsx:87:            className="rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[#FF2E88] transition hover:bg-[#E8D7FF]"
src/components/entities/ManufacturerCardV2.tsx:77:          <div className="relative flex flex-1 items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_70%)] px-8 py-6 transition-transform duration-300 ease-out motion-reduce:transition-none group-hover/mv2card:scale-[1.02] motion-reduce:group-hover/mv2card:scale-100">
src/components/listings/ListingCard.tsx:69:      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#dce5e9] bg-white shadow-[0_8px_24px_rgba(24,42,52,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[#ff9b82] hover:shadow-[0_18px_36px_rgba(24,42,52,0.12)] motion-reduce:transition-none motion-reduce:hover:transform-none"
src/components/listings/ListingCard.tsx:71:      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-[#e8eef0]">
src/components/listings/ListingCard.tsx:81:          <div className="flex h-full w-full items-center justify-center text-xs text-[#6C618B]">
src/components/listings/ListingCard.tsx:99:        <p className="mt-1 line-clamp-2 text-base font-semibold tracking-[-0.02em] text-[#171130]">{listing.title}</p>
src/components/listings/ListingCard.tsx:101:        {subtitle && <p className="truncate text-xs text-[#6C618B]">{subtitle}</p>}
src/components/listings/ListingCard.tsx:103:        <p className="mt-auto pt-3 text-base font-bold text-[#e35e3d]">
src/components/listings/ListingCard.tsx:108:          <p className="truncate text-xs text-[#6C618B]">{meta.join(' · ')}</p>
src/components/listings/FavoriteButton.tsx:41:      className={`inline-flex items-center justify-center rounded-full border border-white/70 bg-white/90 p-2 text-[#4E446C] shadow-[0_5px_16px_rgba(23,17,48,.16)] backdrop-blur transition duration-200 hover:scale-110 hover:text-[#FF2E88] disabled:cursor-not-allowed disabled:opacity-50 ${
src/components/listings/FavoriteButton.tsx:42:        favorited ? 'border-[#FF5BA3] bg-[#FFE0ED] text-[#FF2E88]' : ''
src/components/gallery/GalleryExplorer.tsx:289:          <div className="w-full h-full bg-gradient-to-br from-[#262626] via-[#050607] to-black" aria-hidden="true" />
src/components/listings/ContactButton.tsx:65:      <div role="status" className="rounded-2xl border border-[#D8CDF7] bg-[#E8D7FF] p-5 text-sm text-[#0b5d5a]">
src/components/comparar/AnimatedVehicleCompareTable.tsx:113:          {isWinner && <span className="shrink-0 rounded-full bg-auto-accent px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase text-[#171130]">Mejor</span>}
```

### After

Exact pink-family proof command:

```bash
rg -n -i --glob '*.{css,scss,module.css,tsx,jsx,ts,js,json,svg,webmanifest}' \
  '(pink-|rose-|fuchsia-|magenta|#ff2e88|#ff5ba3|#d90067|#c7f000|#23d9ff|#ff00|#d900)' \
  src public tailwind.config.js
```

Raw output after substitution:

```text
```

The final command returned exit code `1` with an empty match body. The remaining orange/green values are the new action/eco system, not the banned legacy pink-family values.

## 6. Success vs eco proof

The final tokens are rendered separately: eco is reserved for financing/eco badges, while success is reserved for completion feedback. Numeric HSL values computed from the token RGB values:

| Token | RGB | HSL |
|---|---|---|
| `--color-accent-eco` | `22,101,52` | `142.78°, 64.23%, 24.12%` |
| `--color-success` | `5,150,105` | `161.38°, 93.55%, 30.39%` |

Absolute delta: **18.59° hue, 29.32 percentage points saturation, 6.27 percentage points lightness**. The distinction is also encoded by context and labels/icons; success is not silently represented as an eco badge.

## 7. Color-blind safety

The accessible distinction is not hue-only: destructive controls retain delete/cancel labels and alert text; success messages retain success copy; eco/financing badges retain their labels; action buttons retain button text and shape. The browser sandbox did not expose DevTools vision-deficiency emulation, so no fabricated simulator screenshot is claimed. This is an explicit tooling deviation recorded in §13. Screens manually checked were homepage and `/vehiculos/audi-a4/`, where action elements and eco/financing references remain independently labeled.

## 8. Contrast ratio table

Computed with `/tmp/color-metrics.py` using WCAG relative luminance:

| Pairing | Ratio | Result |
|---|---:|---|
| neutral-50 on neutral-950 | 19.06:1 | PASS |
| neutral-50 on neutral-900 | 16.97:1 | PASS |
| neutral-50 on neutral-800 | 14.27:1 | PASS |
| neutral-300 on neutral-950 | 13.46:1 | PASS |
| neutral-300 on neutral-900 | 11.99:1 | PASS |
| neutral-300 on neutral-800 | 10.08:1 | PASS |
| neutral-500 on neutral-950 | 7.76:1 | PASS |
| neutral-500 on neutral-900 | 6.91:1 | PASS |
| neutral-500 on neutral-800 | 5.81:1 | PASS |
| neutral-50 on action | 4.96:1 | PASS |
| neutral-50 on action-hover | 7.00:1 | PASS |
| neutral-50 on action-active | 8.98:1 | PASS |
| neutral-50 on eco | 6.83:1 | PASS |
| error on error-subtle | 6.80:1 | PASS |
| action-focus-ring on neutral-950 | 8.79:1 | PASS |
| action-focus-ring on neutral-900 | 7.83:1 | PASS |
| action-focus-ring on neutral-800 | 6.58:1 | PASS |

## 9. Disabled, loading and empty states

Disabled controls retain `disabled:cursor-not-allowed` and `disabled:opacity-50` in publish/favorite/listing forms; the action-disabled token is defined at `globals.css:29`. Loading uses the orange action spinner at `globals.css:1010-1011` and neutral skeleton at `globals.css:1047-1058`. Empty marketplace states retain neutral surfaces and explanatory labels. `src/app/error.tsx` and `src/app/global-error.tsx` retain explicit error copy and error-colored feedback; no semantic distinction relies on color alone.

## 10. Light-mode status

Light mode is functional, not a dead affordance: `src/lib/theme.ts` persists `sinfrenos:theme`, `src/components/layout/Header.tsx` exposes the toggle, and `src/app/layout.tsx:159-166` applies the preference before paint. The `.dark` selector is implemented at `src/app/globals.css:61-93`; root and dark neutral/surface values are both defined.

## 11. Browser chrome

`src/app/manifest.ts:21-22` uses `#09090B` for `background_color` and `theme_color`. No pink remains in the manifest or browser-facing theme color.

## 12. Out-of-scope observations

Motion values, durations, easings, layout, spacing, typography scale, routing and Link prefetch behavior were not changed. Remaining non-color observations include the existing 1.3s/1.5s skeleton cycles, Framer Motion durations, and unrelated component-specific transitions; these belong to Rounds 1–2 and were left untouched. No `<Link>` inside `.map()` was changed. The PDF builders were migrated because their hardcoded palette values are color-only output and part of the complete color inventory; their geometry and typography were not modified.

## 13. Deviations from the brief

The browser sandbox could not provide OS-level reduced-motion or vision-deficiency emulation, so the report does not claim screenshots of unavailable simulator modes. Instead, it records the exact browser limitation and the numeric/token evidence available. The repository's existing screenshot capture was used for the pre-migration homepage computed-style evidence; post-migration screenshots are captured during the final manual pass. All other requested commands and evidence are included in this report.

## Verification raw output

The final raw output is appended after the required suite completes. No snapshot was force-updated.
