export const formStyles = {
  stepCard: 'rounded-3xl border border-[#c7dcda] bg-white p-5 shadow-[0_16px_40px_rgba(18,33,42,0.08)] sm:p-7',
  stepTitle: 'mb-1 text-2xl font-extrabold tracking-[-0.05em] text-[#12212a]',
  stepDescription: 'mb-5 text-sm leading-relaxed text-[#62717a]',
  fieldGroup: 'space-y-2',
  label: 'block text-sm font-bold text-[#12212a]',
  helperText: 'text-xs leading-relaxed text-[#71858c]',
  errorText: 'rounded-xl bg-[#fff0ed] px-3 py-2 text-xs font-semibold text-[#b83d2a]',
  input: 'w-full rounded-xl border border-[#c7dcda] bg-white px-3.5 py-3 text-sm text-[#12212a] transition duration-200 focus:border-[#0b7a75] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#82d4ce]/35',
  inputError: 'w-full rounded-xl border border-red-400 bg-[#fff0ed] px-3 py-3 text-sm transition duration-200 focus:border-red-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200',
  select: 'w-full rounded-xl border border-[#c7dcda] bg-white px-3.5 py-3 text-sm text-[#12212a] transition duration-200 focus:border-[#0b7a75] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#82d4ce]/35 disabled:cursor-not-allowed disabled:opacity-50',
  textarea: 'w-full rounded-xl border border-[#c7dcda] bg-white px-3.5 py-3 text-sm text-[#12212a] transition duration-200 focus:border-[#0b7a75] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#82d4ce]/35',
  primaryButton: 'inline-flex items-center justify-center gap-2 rounded-full bg-[#f05a3c] px-5 py-3 text-sm font-extrabold text-white transition duration-200 hover:bg-[#d9472f] hover:-translate-y-0.5 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f47b5d]/35',
  secondaryButton: 'inline-flex items-center justify-center gap-2 rounded-full border border-[#b8d6d3] bg-white px-5 py-3 text-sm font-bold text-[#0b7a75] transition duration-200 hover:border-[#0b7a75] hover:bg-[#eef8f7] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#82d4ce]/35',
  navRow: 'mt-7 flex items-center justify-between gap-3',
  selectableCard: 'flex w-full flex-col items-start gap-1 rounded-2xl border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#82d4ce]/35',
  selectableCardIdle: 'border-[#c7dcda] bg-white hover:-translate-y-1 hover:border-[#0b7a75] hover:bg-[#eef8f7]',
  selectableCardSelected: 'border-[#f05a3c] bg-[#fff0ed] shadow-[0_8px_20px_rgba(240,90,60,.12)]',
  selectableCardDisabled: 'cursor-not-allowed border-[#dce8e7] bg-[#f5f8f8] opacity-60',
} as const

export const severityBadgeClasses: Record<'normal' | 'atencion' | 'grave', string> = {
  normal: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  atencion: 'border border-amber-200 bg-amber-50 text-amber-700',
  grave: 'border border-red-200 bg-red-50 text-red-700',
}

export const severityBadgeBaseClass = 'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide'
