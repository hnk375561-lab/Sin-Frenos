export const formStyles = {
  stepCard: 'rounded-3xl border border-[#D8CDF7] bg-white p-5 shadow-[0_16px_40px_rgba(23,17,48,0.08)] sm:p-7',
  stepTitle: 'mb-1 text-2xl font-extrabold tracking-[-0.05em] text-[#171130]',
  stepDescription: 'mb-5 text-sm leading-relaxed text-[#4E446C]',
  fieldGroup: 'space-y-2',
  label: 'block text-sm font-bold text-[#171130]',
  helperText: 'text-xs leading-relaxed text-[#6C618B]',
  errorText: 'rounded-xl bg-[#FFE0ED] px-3 py-2 text-xs font-semibold text-[#D90067]',
  input: 'w-full rounded-xl border border-[#D8CDF7] bg-white px-3.5 py-3 text-sm text-[#171130] transition duration-200 focus:border-[#FF2E88] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#23D9FF]/35',
  inputError: 'w-full rounded-xl border border-red-400 bg-[#FFE0ED] px-3 py-3 text-sm transition duration-200 focus:border-red-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200',
  select: 'w-full rounded-xl border border-[#D8CDF7] bg-white px-3.5 py-3 text-sm text-[#171130] transition duration-200 focus:border-[#FF2E88] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#23D9FF]/35 disabled:cursor-not-allowed disabled:opacity-50',
  textarea: 'w-full rounded-xl border border-[#D8CDF7] bg-white px-3.5 py-3 text-sm text-[#171130] transition duration-200 focus:border-[#FF2E88] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#23D9FF]/35',
  primaryButton: 'inline-flex items-center justify-center gap-2 rounded-full bg-[#FF2E88] px-5 py-3 text-sm font-extrabold text-white transition duration-200 hover:bg-[#D90067] hover:-translate-y-0.5 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF5BA3]/35',
  secondaryButton: 'inline-flex items-center justify-center gap-2 rounded-full border border-[#D8CDF7] bg-white px-5 py-3 text-sm font-bold text-[#FF2E88] transition duration-200 hover:border-[#FF2E88] hover:bg-[#F0EBFF] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#23D9FF]/35',
  navRow: 'mt-7 flex items-center justify-between gap-3',
  selectableCard: 'flex w-full flex-col items-start gap-1 rounded-2xl border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#23D9FF]/35',
  selectableCardIdle: 'border-[#D8CDF7] bg-white hover:-translate-y-1 hover:border-[#FF2E88] hover:bg-[#F0EBFF]',
  selectableCardSelected: 'border-[#FF2E88] bg-[#FFE0ED] shadow-[0_8px_20px_rgba(255,46,136,.12)]',
  selectableCardDisabled: 'cursor-not-allowed border-[#ECE7FA] bg-[#F6F3FF] opacity-60',
} as const

export const severityBadgeClasses: Record<'normal' | 'atencion' | 'grave', string> = {
  normal: 'border border-[#A7C900] bg-[#F1FFD0] text-[#435400]',
  atencion: 'border border-[#23D9FF] bg-[#D9F9FF] text-[#075A70]',
  grave: 'border border-[#FF5BA3] bg-[#FFE0ED] text-[#9C064B]',
}

export const severityBadgeBaseClass = 'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide'
