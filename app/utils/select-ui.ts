export const dashboardNeonSelectUi = {
  base: 'group relative justify-between rounded-2xl border border-[#B6F500]/20 bg-[#B6F500]/8 px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-[0.18em] text-[#B6F500]/88 transition-all hover:border-[#B6F500]/38 hover:bg-[#B6F500]/12 data-[state=open]:border-[#B6F500]/52 data-[state=open]:bg-[#B6F500]/14 data-[state=open]:shadow-[0_0_24px_rgba(182,245,0,0.08)]',
  leadingIcon: 'text-[#B6F500] size-4 shrink-0',
  value: 'truncate text-[11px] font-black uppercase tracking-[0.18em] text-[#B6F500]/88',
  trailingIcon: 'text-[#B6F500]/45 size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180',
  content: 'rounded-2xl border border-[#B6F500]/12 bg-[#080808] p-1 shadow-2xl shadow-black/60',
  viewport: 'p-1',
  item: 'rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/60 data-highlighted:bg-[#B6F500]/10 data-highlighted:text-[#B6F500]',
  itemLabel: 'truncate',
  itemTrailingIcon: 'text-[#B6F500]',
  itemLeadingIcon: 'text-[#B6F500]/60'
} as const

export const dashboardNeonFilterSelectUi = {
  ...dashboardNeonSelectUi,
  base: `${dashboardNeonSelectUi.base} h-10 rounded-2xl py-0`
} as const

export const dashboardNeonSelectMenuUi = {
  base: 'relative flex h-10 items-center gap-2.5 rounded-full border border-[#B6F500]/25 bg-[#B6F500]/8 px-4 transition-all hover:border-[#B6F500]/40 hover:bg-[#B6F500]/15 data-[state=open]:border-[#B6F500]/50 data-[state=open]:bg-[#B6F500]/15 data-[state=open]:shadow-[0_0_24px_rgba(182,245,0,0.08)]',
  leading: 'flex items-center shrink-0',
  leadingIcon: 'text-[#B6F500] size-4',
  trailing: 'ms-auto flex items-center',
  trailingIcon: 'text-[#B6F500]/40 size-3 transition-transform duration-200',
  value: 'truncate text-[11px] font-bold uppercase tracking-[0.14em] text-[#B6F500]/90',
  content: 'rounded-xl bg-[#0a0a0a] p-1 ring-1 ring-[#B6F500]/12 shadow-2xl shadow-black/60',
  item: 'gap-2.5 rounded-lg py-1.5 data-[highlighted]:bg-[#B6F500]/8',
  itemLeadingIcon: 'text-[#B6F500]/50',
  itemLabel: 'text-xs font-semibold text-white/65',
  itemTrailingIcon: 'text-[#B6F500]',
  input: 'border-b border-[#B6F500]/10 text-xs placeholder:text-white/20'
} as const

export const dashboardNeonButtonUi = {
  base: 'group relative flex h-9 items-center justify-center gap-2 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none active:scale-95 border border-[#B6F500]/25 bg-[#B6F500]/8 px-[18px] hover:border-[#B6F500]/45 hover:bg-[#B6F500]/15 shadow-[0_0_20px_rgba(182,245,0,0.05)]',
  label: 'text-[11px] font-black uppercase tracking-[0.16em] text-[#B6F500] italic',
  leadingIcon: 'text-[#B6F500] size-4',
  trailingIcon: 'text-[#B6F500] size-4'
} as const

export const dashboardNeonFilterButtonUi = {
  ...dashboardNeonButtonUi,
  base: `${dashboardNeonButtonUi.base} h-10 rounded-2xl`
} as const

export const dashboardNeonGhostButtonUi = {
  base: 'group relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 active:scale-90 border border-[#B6F500]/25 bg-[#B6F500]/4 hover:border-[#B6F500]/40 hover:bg-[#B6F500]/12 shadow-[0_0_15px_rgba(182,245,0,0)] hover:shadow-[0_0_15px_rgba(182,245,0,0.05)]',
  leadingIcon: 'text-[#B6F500] size-4 transition-all group-hover:text-[#B6F500]'
} as const

export const dashboardNeonFilterGhostButtonUi = {
  ...dashboardNeonGhostButtonUi,
  base: `${dashboardNeonGhostButtonUi.base} h-10 w-10 rounded-2xl`
} as const

export const dashboardNeonInputUi = {
  root: 'w-44',
  base: 'rounded-2xl border border-[#B6F500]/20 bg-[#B6F500]/8 text-[11px] font-black uppercase tracking-[0.16em] text-[#B6F500]/90 placeholder:text-white/20 focus:border-[#B6F500]/45 focus:ring-0 transition-all hover:border-[#B6F500]/35 hover:bg-[#B6F500]/10',
  leading: 'ps-3',
  leadingIcon: 'text-[#B6F500]/50 size-3.5'
} as const

export const dashboardNeonFilterInputUi = {
  ...dashboardNeonInputUi,
  base: `${dashboardNeonInputUi.base} h-10`
} as const
