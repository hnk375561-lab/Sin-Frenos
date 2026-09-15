# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** AutoFicha
**Generated:** 2026-09-15 02:51:55
**Category:** Automotive/Car Dealership
**Design Dials:** Variance 4/10 (Balanced / Modern) | Motion 3/10 (Subtle) | Density 8/10 (Dense / Dashboard)

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#1E293B` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#334155` | `--color-secondary` |
| On Secondary | `#FFFFFF` | `--color-on-secondary` |
| Accent/CTA | `#DC2626` | `--color-accent` |
| On Accent/CTA | `#FFFFFF` | `--color-on-accent` |
| Background | `#F8FAFC` | `--color-background` |
| Foreground | `#0F172A` | `--color-foreground` |
| Card | `#FFFFFF` | `--color-card` |
| Card Foreground | `#0F172A` | `--color-card-foreground` |
| Muted | `#E9EDF1` | `--color-muted` |
| Muted Foreground | `#475569` | `--color-muted-foreground` |
| Border | `#E2E8F0` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| On Destructive | `#FFFFFF` | `--color-on-destructive` |
| Ring | `#1E293B` | `--color-ring` |

**Color Notes:** Premium dark + action red

### Typography

- **Heading/UI Font:** Fira Sans
- **Data/Tabular Font:** Fira Code
- **Role split:** Fira Sans handles headings, labels, descriptions, controls, and evidence explanations; Fira Code is reserved for numeric specs, units, prices, comparison values, slugs, and source metadata where aligned numerals improve scanning.
- **Rationale:** Fira Sans provides a high-x-height, neutral, readable voice at dense UI sizes. Fira Code gives technical values stable character widths and clear numerals without turning the entire interface into a developer-themed monospace surface. Together they support credibility, compact tables, and rapid comparison rather than speed-brand theatrics.
- **Google Fonts:** [Fira Sans + Fira Code](https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');
```

### Spacing Variables

*Density: 8/10 — Dense / Dashboard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `2px` / `0.125rem` | Tight gaps |
| `--space-sm` | `4px` / `0.25rem` | Icon gaps, inline spacing |
| `--space-md` | `8px` / `0.5rem` | Standard padding |
| `--space-lg` | `12px` / `0.75rem` | Section padding |
| `--space-xl` | `16px` / `1rem` | Large gaps |
| `--space-2xl` | `24px` / `1.5rem` | Section margins |
| `--space-3xl` | `32px` / `2rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--color-accent);
  color: var(--color-on-accent);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-secondary);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: var(--color-card);
  color: var(--color-card-foreground);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
  cursor: pointer;
}

.card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-lg);
}
```

### Inputs

```css
.input {
  background: var(--color-card);
  color: var(--color-card-foreground);
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.input:focus {
  border-color: var(--color-ring);
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-ring) 12%, transparent);
}
```

### Modals

```css
.modal-overlay {
  background: color-mix(in srgb, var(--color-foreground) 50%, transparent);
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--color-card);
  color: var(--color-card-foreground);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Data-Dense Dashboard / Technical Reference

**Keywords:** information-dense, structured, flat surfaces, measurable hierarchy, compact tables, evidence-forward, neutral, technical catalog

**Best For:** Vehicle spec sheets, side-by-side comparators, reference catalogs, technical documentation, financial and operational data tools

**Core Principle:** Maximize trustworthy information visibility without visual noise. Use a restrained grid, clear borders, compact spacing, and strong typographic hierarchy. Density is intentional, but every value must remain legible and every confidence state must be distinguishable without relying on motion or color alone.

**Key Effects:** Row and card highlighting on hover, 150–200ms border/background transitions, filter-result updates, sticky comparison headers, and restrained disclosure transitions. No parallax, no decorative page transitions, no animation-heavy hero, and no content hidden behind entrance animations.

### Page Patterns

#### Vehicle Detail — Evidence-First Spec Sheet

- **Primary task:** Identify the vehicle, answer power/price/performance questions immediately, then inspect the evidence behind each claim.
- **Section order:** Compact identity header with manufacturer/class and confidence summary > dominant KPI/spec strip for power, price, speed, and acceleration > evidence panel with primary source and limitations > structured technical sections > related vehicles.
- **Layout:** Two-column desktop grid with a sticky or visually persistent summary rail; single-column mobile flow with the evidence summary kept near the primary specs.
- **CTA/action placement:** Compare and related-navigation actions sit beside the identity header; source links sit directly beside the evidence they support. Do not lead with a marketing CTA.
- **Density rule:** Empty optional fields collapse cleanly; populated fields extend the relevant section without creating artificial blank cards.

#### Comparator — Scannable Decision Matrix

- **Primary task:** Determine category winners and confidence differences across two or more vehicles without reading paragraphs.
- **Section order:** Vehicle selector row > compact vehicle identity columns > grouped comparison matrix for power, price, performance, dimensions, and equipment > evidence/confidence row per metric > caveats and source links.
- **Layout:** CSS grid/table-like alignment with sticky metric labels and sticky vehicle headers where practical; use horizontal scrolling on small screens with the metric label preserved.
- **Comparison treatment:** Highlight the stronger value only when the metric is meaningfully comparable; show “no concluyente” or an equivalent neutral state when units, markets, years, or evidence levels prevent a fair winner.
- **Motion rule:** Filter and selection changes may transition opacity/background subtly, but no animated reordering or decorative choreography.

#### Listing — Filterable Catalog Grid

- **Primary task:** Scan many vehicles quickly, narrow by manufacturer/class/market, and choose a detail page.
- **Section order:** Page title with result count and evidence coverage > compact filter/search toolbar > dense responsive card grid or row view > pagination/load-more affordance.
- **Card hierarchy:** Image and title > manufacturer/class > power, price, and one performance value > prominent confidence badge and source cue. Keep cards comparable and avoid oversized showroom imagery.
- **Layout:** Responsive grid optimized for multiple items per viewport; filters remain accessible without dominating the content. Each repeated vehicle link must preserve `prefetch={false}`.
- **Empty/loading rule:** Use stable skeleton geometry and explicit no-results guidance; never replace the catalog with a decorative hero.

---

## Motion

Motion is functional and immediate. Content is rendered in its final position on first paint; there are no scroll-triggered reveals, parallax effects, page-transition choreographies, or animation-library dependencies.

- **Hover and focus:** Use CSS transitions of 150–200ms for border, background, color, and box-shadow changes. Never move surrounding layout or rely on transform-based lift for essential state communication.
- **Filters and comparison updates:** Preserve the current layout and apply only a brief opacity or background transition when results or selected vehicles change. Do not animate row reordering or delay the updated data.
- **Disclosure controls:** Use an accessible native disclosure pattern; a short height/opacity transition is optional only when it does not hide content from keyboard or screen-reader users.
- **Loading states:** Use stable skeleton geometry or an inline status indicator. Do not make data appear only after an entrance animation.
- **Reduced motion:** Under `prefers-reduced-motion: reduce`, remove non-essential transitions and render all states immediately.

```css
@media (prefers-reduced-motion: no-preference) {
  .interactive-surface {
    transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

---

## Anti-Patterns (Do NOT Use)

- ❌ Static product pages
- ❌ Poor UX

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
