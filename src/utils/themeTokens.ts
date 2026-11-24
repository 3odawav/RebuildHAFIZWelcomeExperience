import type { UiThemePreset } from './storageConfig'

export interface ThemeTokens {
  isLight: boolean
  rootBg: string
  headerBar: string
  sidebar: string
  footer: string
  panel: string
  subCard: string
  subCardAlt: string
  modalSurface: string
  modalBackdrop: string
  button: string
  buttonActive: string
  buttonAccent: string
  field: string
  heading: string
  titleAccent: string
  textPrimary: string
  textMuted: string
  textAccent: string
  borderSubtle: string
  badgeInfo: string
  badgeWarn: string
  badgeSuccess: string
  toast: string
}

export function getThemeTokens(theme: UiThemePreset): ThemeTokens {
  if (theme === 'light_studio') {
    return {
      isLight: true,
      rootBg: 'bg-[#f3f6fb] text-slate-900 selection:bg-sky-200 selection:text-slate-950',
      headerBar: 'border-slate-200 bg-white/95 text-slate-900 shadow-xs',
      sidebar: 'border-slate-200 bg-white/90 text-slate-700',
      footer: 'border-slate-200 bg-white/95 text-slate-600',
      panel: 'rounded-2xl border border-slate-300/90 bg-white/95 text-slate-900 shadow-xs',
      subCard: 'rounded-xl border border-slate-200 bg-slate-50/95 text-slate-800',
      subCardAlt: 'rounded-xl border border-sky-200 bg-sky-50/80 text-slate-900',
      modalSurface: 'border-sky-400/60 bg-white text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.22)]',
      modalBackdrop: 'bg-slate-900/45 backdrop-blur-sm',
      button: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-800 transition hover:border-sky-500 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-55',
      buttonActive: '!border-sky-600 !bg-sky-100 font-medium !text-sky-900',
      buttonAccent: '!border-sky-600 !bg-sky-600 font-medium !text-white hover:!bg-sky-700 hover:!border-sky-700',
      field: 'block w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500',
      heading: 'text-slate-900',
      titleAccent: 'text-sky-700',
      textPrimary: 'text-slate-900',
      textMuted: 'text-slate-600',
      textAccent: 'text-sky-700',
      borderSubtle: 'border-slate-200',
      badgeInfo: 'border-sky-300 bg-sky-50 text-sky-800',
      badgeWarn: 'border-amber-300 bg-amber-50 text-amber-800',
      badgeSuccess: 'border-emerald-300 bg-emerald-50 text-emerald-800',
      toast: 'border-sky-400 bg-white/98 text-slate-900 shadow-[0_16px_42px_rgba(15,23,42,0.2)]',
    }
  }

  if (theme === 'graphite_gold') {
    return {
      isLight: false,
      rootBg: 'bg-[#101216] text-stone-100 selection:bg-amber-700 selection:text-white',
      headerBar: 'border-stone-800 bg-[#15181f]/95 text-stone-100',
      sidebar: 'border-stone-800/90 bg-[#14171d] text-stone-300',
      footer: 'border-stone-800/90 bg-[#14171d]/95 text-stone-300',
      panel: 'rounded-2xl border border-stone-700/80 bg-[#181b22]/95 text-stone-100',
      subCard: 'rounded-xl border border-stone-800 bg-[#12151b]/90 text-stone-200',
      subCardAlt: 'rounded-xl border border-amber-500/35 bg-amber-500/10 text-amber-100',
      modalSurface: 'border-amber-400/50 bg-[#171a21] text-stone-100 shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_32px_rgba(245,158,11,0.16)]',
      modalBackdrop: 'bg-black/75 backdrop-blur-md',
      button: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-700 bg-stone-800/60 px-4 text-sm text-stone-100 transition hover:border-amber-400/70 hover:bg-amber-400/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60',
      buttonActive: '!border-amber-400 !bg-amber-400/20 font-medium !text-amber-100',
      buttonAccent: '!border-amber-400/80 !bg-amber-500/25 font-medium !text-amber-50 hover:!bg-amber-400/35',
      field: 'block w-full rounded-xl border border-stone-700 bg-[#0d0f13] p-3.5 text-sm text-stone-100 outline-none placeholder:text-stone-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400',
      heading: 'text-amber-100',
      titleAccent: 'text-amber-300',
      textPrimary: 'text-stone-100',
      textMuted: 'text-stone-300',
      textAccent: 'text-amber-300',
      borderSubtle: 'border-stone-800',
      badgeInfo: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
      badgeWarn: 'border-amber-400/45 bg-amber-500/15 text-amber-200',
      badgeSuccess: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
      toast: 'border-amber-400/55 bg-[#1b1e26]/95 text-stone-100 shadow-[0_16px_42px_rgba(0,0,0,0.8)]',
    }
  }

  return {
    isLight: false,
    rootBg: 'bg-[#050b13] text-slate-100 selection:bg-cyan-700',
    headerBar: 'border-slate-800 bg-[#080e17]/95 text-slate-100',
    sidebar: 'border-slate-800/80 bg-[#080f19] text-slate-300',
    footer: 'border-slate-800/80 bg-[#080f19]/90 text-slate-300',
    panel: 'rounded-2xl border border-slate-700/70 bg-[#0b1623]/90 text-slate-100',
    subCard: 'rounded-xl border border-slate-800 bg-[#06111e]/80 text-slate-200',
    subCardAlt: 'rounded-xl border border-sky-800/60 bg-[#061425]/85 text-sky-100',
    modalSurface: 'border-cyan-400/45 bg-[#071525] text-slate-100 shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_32px_rgba(0,160,255,0.2)]',
    modalBackdrop: 'bg-[#020814cc] backdrop-blur-md',
    button: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 text-sm text-slate-100 transition hover:border-cyan-400/60 hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-60',
    buttonActive: '!border-cyan-400 !bg-sky-500/20 font-medium !text-cyan-100',
    buttonAccent: '!border-cyan-400/75 !bg-sky-500/25 font-medium !text-cyan-50 hover:!bg-sky-400/35',
    field: 'block w-full rounded-xl border border-slate-700 bg-black/20 p-3.5 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400',
    heading: 'text-sky-100',
    titleAccent: 'text-cyan-300',
    textPrimary: 'text-slate-100',
    textMuted: 'text-slate-300',
    textAccent: 'text-cyan-200',
    borderSubtle: 'border-slate-800',
    badgeInfo: 'border-cyan-500/35 bg-cyan-500/10 text-cyan-200',
    badgeWarn: 'border-amber-400/35 bg-amber-500/10 text-amber-200',
    badgeSuccess: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
    toast: 'border-cyan-400/50 bg-[#091c31]/95 text-slate-100 shadow-[0_16px_42px_rgba(0,8,20,0.8)]',
  }
}
