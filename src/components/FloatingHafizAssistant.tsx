import { useRef, useState } from 'react'
import { AiMatrixHalo } from './AiMatrixHalo'
import { HafizFaceRig } from './HafizFaceRig'
import type { AppTranslations } from '../i18n/translations'
import type { AvatarState } from '../utils/avatarAnimation'
import type { UiThemePreset } from '../utils/storageConfig'

export type DockSide = 'left' | 'right'

interface FloatingHafizAssistantProps {
  dockSide: DockSide
  onDockSideChange: (side: DockSide) => void
  state: AvatarState
  speechBeatAt: number
  micEnergy: number
  ar: boolean
  t: AppTranslations
  theme: UiThemePreset
  lastReply: string
  message: string
  onMessageChange: (value: string) => void
  onSubmitCommand: (text?: string) => void
  onToggleMic: () => void
  onToggleSpeak: () => void
  onGoStartup: () => void
}

/**
 * Persistent movable Floating HAFIZ Assistant inside workspaces.
 * Stays alive on either the left or right side of the screen (one-click snap OR drag-to-side),
 * keeps HAFIZ's animated face and blue AI halo running, and acts as the primary AI hub.
 */
export function FloatingHafizAssistant({
  dockSide,
  onDockSideChange,
  state,
  speechBeatAt,
  micEnergy,
  ar,
  t,
  theme,
  lastReply,
  message,
  onMessageChange,
  onSubmitCommand,
  onToggleMic,
  onToggleSpeak,
  onGoStartup,
}: FloatingHafizAssistantProps) {
  const [expanded, setExpanded] = useState(false)
  const [dragOffsetX, setDragOffsetX] = useState(0)
  const dragging = useRef<{ startX: number; moved: boolean } | null>(null)

  const isLight = theme === 'light_studio'
  const isGold = theme === 'graphite_gold'

  const statusLabel =
    state === 'listening'
      ? t.statusListening
      : state === 'thinking'
        ? t.statusThinking
        : state === 'speaking'
          ? t.statusSpeaking
          : state === 'laughing'
            ? t.statusLaughing
            : state === 'serious'
              ? t.statusSerious
              : t.floatingReady

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, input')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = { startX: e.clientX, moved: false }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const dx = e.clientX - dragging.current.startX
    if (Math.abs(dx) > 6) dragging.current.moved = true
    setDragOffsetX(dx)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const wasMoved = dragging.current.moved
    dragging.current = null
    setDragOffsetX(0)
    if (wasMoved) {
      const targetSide: DockSide = e.clientX < window.innerWidth / 2 ? 'left' : 'right'
      onDockSideChange(targetSide)
    }
  }

  const sideClass =
    dockSide === 'left'
      ? ar
        ? 'left-4 sm:left-6 items-start'
        : 'left-4 sm:left-6 lg:left-[92px] items-start'
      : ar
        ? 'right-4 sm:right-6 lg:right-[92px] items-end'
        : 'right-4 sm:right-6 items-end'

  const podSurface = isLight
    ? 'border-sky-400/70 bg-white/95 text-slate-900 shadow-[0_12px_36px_rgba(15,23,42,0.18)]'
    : isGold
      ? 'border-amber-400/55 bg-[#171a21]/95 text-stone-100 shadow-[0_10px_36px_rgba(0,0,0,0.8),0_0_24px_rgba(245,158,11,0.18)]'
      : 'border-cyan-400/55 bg-[#051324]/92 text-slate-100 shadow-[0_10px_36px_rgba(0,12,28,0.8),0_0_28px_rgba(0,168,255,0.28)]'

  const chipBtn = isLight
    ? 'border-slate-300 bg-slate-50 text-slate-800 hover:border-sky-500 hover:bg-sky-50'
    : isGold
      ? 'border-stone-700 bg-stone-800/70 text-amber-100 hover:border-amber-400/70 hover:bg-amber-400/15'
      : 'border-sky-700/70 bg-sky-500/10 text-sky-200 hover:border-cyan-400/70'

  return (
    <aside
      data-testid="floating-hafiz-assistant"
      data-dock-side={dockSide}
      aria-label={t.floatingAsideAria}
      style={{ transform: dragOffsetX ? `translateX(${dragOffsetX}px)` : undefined }}
      className={`fixed bottom-12 z-40 flex flex-col gap-3 transition-[left,right] duration-300 ${sideClass}`}
    >
      {/* Expanded conversational AI panel right beside the floating avatar */}
      {expanded && (
        <div
          role="dialog"
          aria-label={t.floatingDialogAria}
          className={`w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border p-4 backdrop-blur-xl ${podSurface}`}
        >
          <div className={`mb-3 flex items-center justify-between gap-2 border-b pb-2.5 ${isLight ? 'border-slate-200' : 'border-sky-800/60'}`}>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isGold ? 'bg-amber-400' : 'bg-cyan-400'}`} />
              <span dir="ltr" className={`text-xs font-semibold tracking-[.16em] ${isLight ? 'text-slate-900' : 'text-sky-100'}`}>HAFIZ</span>
              <span className={`font-[Cairo] text-sm font-semibold ${isLight ? 'text-sky-700' : isGold ? 'text-amber-300' : 'text-cyan-200'}`} lang="ar">
                حافظ
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onGoStartup}
                className={`whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] transition ${chipBtn}`}
              >
                {t.floatingFullStage}
              </button>
              <button
                type="button"
                aria-label={t.floatingMinimizeAria}
                onClick={() => setExpanded(false)}
                className={`grid h-8 w-8 place-items-center rounded-lg transition ${isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
              >
                ✕
              </button>
            </div>
          </div>

          <p className={`mb-3 rounded-xl border px-3 py-2 text-xs leading-6 ${isLight ? 'border-sky-200 bg-sky-50 text-slate-800' : 'border-sky-800/50 bg-[#081b30]/80 text-sky-100'}`}>
            {lastReply || t.floatingDefaultReply}
          </p>

          <form
            onSubmit={e => {
              e.preventDefault()
              onSubmitCommand()
            }}
            className={`flex items-center gap-1.5 rounded-xl border p-1.5 ${isLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-[#040d18]'}`}
          >
            <input
              aria-label={t.floatingAskAria}
              value={message}
              onChange={e => onMessageChange(e.target.value)}
              placeholder={t.floatingAskPlaceholder}
              className={`min-h-9 min-w-0 flex-1 bg-transparent px-2.5 text-xs outline-none ${isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-slate-100 placeholder:text-slate-400'}`}
            />
            <button
              type="submit"
              aria-label={t.floatingSendAria}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition ${isLight ? 'bg-sky-600 text-white hover:bg-sky-700' : 'bg-sky-500/25 text-cyan-200 hover:bg-sky-400/35'}`}
            >
              {ar ? '←' : '→'}
            </button>
          </form>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {t.floatingQuickChips.map(item => (
              <button
                key={item.cmd}
                type="button"
                onClick={() => onSubmitCommand(item.cmd)}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] transition ${chipBtn}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Always-visible Living Floating Avatar Pod (draggable & movable Left <-> Right) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`group relative flex cursor-grab items-center gap-2.5 rounded-2xl border p-2 backdrop-blur-xl active:cursor-grabbing ${podSurface}`}
      >
        {/* Live Animated Mini HAFIZ Avatar with Blue Matrix Halo */}
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? t.floatingMinimizeAria : t.floatingDialogAria}
          className="relative h-[86px] w-[86px] shrink-0 overflow-hidden rounded-xl border border-cyan-400/45 bg-[radial-gradient(circle_at_50%_45%,#0b3568,#040d1a)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <AiMatrixHalo state={state} compact />
          <div className="relative z-10 h-full w-full p-0.5">
            <HafizFaceRig state={state} speechBeatAt={speechBeatAt} micEnergy={micEnergy} compact />
          </div>
        </button>

        {/* Compact Live Controls beside the Floating Avatar */}
        <div className="flex flex-col gap-1.5 pe-1">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="text-start focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300"
            >
              <span className={`block text-xs font-semibold ${isLight ? 'text-slate-900' : isGold ? 'text-amber-200' : 'text-cyan-100'}`}>
                {ar ? 'حافظ' : 'HAFIZ'}
              </span>
              <span className={`flex items-center gap-1.5 whitespace-nowrap text-[11px] ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    state === 'speaking' || state === 'listening' || state === 'laughing'
                      ? 'bg-cyan-400 motion-safe:animate-ping'
                      : state === 'thinking' || state === 'serious'
                        ? 'bg-amber-400 motion-safe:animate-pulse'
                        : 'bg-cyan-400'
                  }`}
                />
                {statusLabel}
              </span>
            </button>

            {/* Move Left <-> Right Snap Toggle */}
            <button
              type="button"
              onClick={() => onDockSideChange(dockSide === 'right' ? 'left' : 'right')}
              aria-label={dockSide === 'right' ? t.floatingMoveLeftAria : t.floatingMoveRightAria}
              title={dockSide === 'right' ? t.floatingMoveLeftTitle : t.floatingMoveRightTitle}
              className={`inline-flex h-8 items-center justify-center rounded-lg border px-2 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${chipBtn}`}
            >
              {dockSide === 'right' ? '←' : '→'}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleMic}
              aria-label={state === 'listening' ? t.micStopAria : t.micStartAria}
              aria-pressed={state === 'listening'}
              className={`inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                state === 'listening'
                  ? 'border-cyan-400 bg-cyan-500/25 text-cyan-700 dark:text-cyan-100'
                  : chipBtn
              }`}
            >
              {state === 'listening' ? t.floatingStop : t.floatingMic}
            </button>
            <button
              type="button"
              onClick={onToggleSpeak}
              aria-label={state === 'speaking' ? t.voiceStopAria : t.voicePlayAria}
              className={`inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${chipBtn}`}
            >
              {state === 'speaking' ? t.floatingMute : t.floatingSpeak}
            </button>
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className={`inline-flex h-8 items-center rounded-lg border px-2.5 text-[11px] transition ${chipBtn}`}
            >
              {expanded ? t.floatingHideBtn : t.floatingAskBtn}
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
