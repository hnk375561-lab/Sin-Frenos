export const formStyles = {
  stepCard: 'rounded-3xl border border-[#3F3F46] bg-white p-5 shadow-[0_16px_40px_rgba(9,9,11,0.08)] sm:p-7',
  stepTitle: 'mb-1 text-2xl font-extrabold tracking-[-0.05em] text-[#09090B]',
  stepDescription: 'mb-5 text-sm leading-relaxed text-[#A1A1AA]',
  fieldGroup: 'space-y-2',
  label: 'block text-sm font-bold text-[#09090B]',
  helperText: 'text-xs leading-relaxed text-[#A1A1AA]',
  errorText: 'rounded-xl bg-[#FEE2E2] px-3 py-2 text-xs font-semibold text-[#7C2D12]',
  input: 'w-full rounded-xl border border-[#3F3F46] bg-white px-3.5 py-3 text-sm text-[#09090B] transition duration-200 focus:border-[#C2410C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C2410C]/35',
  inputError: 'w-full rounded-xl border border-red-400 bg-[#FEE2E2] px-3 py-3 text-sm transition duration-200 focus:border-red-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200',
  select: 'w-full rounded-xl border border-[#3F3F46] bg-white px-3.5 py-3 text-sm text-[#09090B] transition duration-200 focus:border-[#C2410C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C2410C]/35 disabled:cursor-not-allowed disabled:opacity-50',
  textarea: 'w-full rounded-xl border border-[#3F3F46] bg-white px-3.5 py-3 text-sm text-[#09090B] transition duration-200 focus:border-[#C2410C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C2410C]/35',
  primaryButton: 'inline-flex items-center justify-center gap-2 rounded-full bg-[#C2410C] px-5 py-3 text-sm font-extrabold text-white transition duration-200 hover:bg-[#7C2D12] hover:-translate-y-0.5 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C2410C]/35',
  secondaryButton: 'inline-flex items-center justify-center gap-2 rounded-full border border-[#3F3F46] bg-white px-5 py-3 text-sm font-bold text-[#C2410C] transition duration-200 hover:border-[#C2410C] hover:bg-[#18181B] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C2410C]/35',
  navRow: 'mt-7 flex items-center justify-between gap-3',
  selectableCard: 'flex w-full flex-col items-start gap-1 rounded-2xl border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C2410C]/35',
  selectableCardIdle: 'border-[#3F3F46] bg-white hover:-translate-y-1 hover:border-[#C2410C] hover:bg-[#18181B]',
  selectableCardSelected: 'border-[#C2410C] bg-[#FEE2E2] shadow-[0_8px_20px_rgba(194,65,12,.12)]',
  selectableCardDisabled: 'cursor-not-allowed border-[#27272A] bg-[#F4F4F5] opacity-60',
} as const

export const severityBadgeClasses: Record<'normal' | 'atencion' | 'grave', string> = {
  normal: 'border border-[#166534] bg-[#DCFCE7] text-[#166534]',
  atencion: 'border border-[#C2410C] bg-[#FFEDD5] text-[#166534]',
  grave: 'border border-[#C2410C] bg-[#FEE2E2] text-[#991B1B]',
}

export const severityBadgeBaseClass = 'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide'
