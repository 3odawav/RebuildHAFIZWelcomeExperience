import { useRef, useState } from 'react'
import { AiMatrixHalo } from './AiMatrixHalo'
import { HafizFaceRig } from './HafizFaceRig'
import type { AppTranslations } from '../i18n/translations'
import type { AvatarState } from '../utils/avatarAnimation'

export type DockSide = 'left' | 'right'

interface FloatingHafizAssistantProps {
  dockSide: DockSide
  onDockSideChange: (side: DockSide) => void
  state: AvatarState
  speechBeatAt: number
  micEnergy: number
  ar: boolean
  t: AppTranslations
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

  const statusLabel =
    state === 'listening'
      ? t.statusListening
      : state === 'thinking'
        ? t.statusThinking
        : state === 'speaking'
          ? t.statusSpeaking
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
          className="w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-cyan-400/45 bg-[#061324]/95 p-4 shadow-[0_16px_50px_rgba(0,12,30,0.85),0_0_30px_rgba(0,166,255,0.22)] backdrop-blur-xl"
        >
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-sky-800/60 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#4de8ff]" />
              <span dir="ltr" className="text-xs font-semibold tracking-[.16em] text-sky-100">HAFIZ</span>
              <span className="font-[Cairo] text-sm font-semibold text-cyan-200" lang="ar">
                حافظ
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onGoStartup}
                className="whitespace-nowrap rounded-lg border border-sky-700/60 bg-sky-500/10 px-2.5 py-1 text-[11px] text-sky-200 transition hover:border-cyan-400 hover:bg-sky-400/20"
              >
                {t.floatingFullStage}
              </button>
              <button
                type="button"
                aria-label={t.floatingMinimizeAria}
                onClick={() => setExpanded(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          <p className="mb-3 rounded-xl border border-sky-800/50 bg-[#081b30]/80 px-3 py-2 text-xs leading-6 text-sky-100">
            {lastReply || t.floatingDefaultReply}
          </p>

          <form
            onSubmit={e => {
              e.preventDefault()
              onSubmitCommand()
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-[#040d18] p-1.5"
          >
            <input
              aria-label={t.floatingAskAria}
              value={message}
              onChange={e => onMessageChange(e.target.value)}
              placeholder={t.floatingAskPlaceholder}
              className="min-h-9 min-w-0 flex-1 bg-transparent px-2.5 text-xs text-slate-100 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              aria-label={t.floatingSendAria}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-500/25 text-cyan-200 transition hover:bg-sky-400/35"
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
                className="rounded-lg border border-sky-800/60 bg-sky-950/40 px-2.5 py-1.5 text-[11px] text-sky-200 transition hover:border-cyan-400/70 hover:bg-sky-400/15"
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
        className="group relative flex cursor-grab items-center gap-2.5 rounded-2xl border border-cyan-400/55 bg-[#051324]/92 p-2 shadow-[0_10px_36px_rgba(0,12,28,0.8),0_0_28px_rgba(0,168,255,0.28)] backdrop-blur-xl active:cursor-grabbing"
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
              <span className="block text-xs font-semibold text-cyan-100">
                {ar ? 'حافظ' : 'HAFIZ'}
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-sky-300">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    state === 'speaking' || state === 'listening'
                      ? 'bg-cyan-300 motion-safe:animate-ping'
                      : state === 'thinking'
                        ? 'bg-sky-400 motion-safe:animate-pulse'
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
              className="inline-flex h-8 items-center justify-center rounded-lg border border-sky-700/70 bg-sky-950/60 px-2 text-xs text-sky-200 transition hover:border-cyan-400 hover:bg-sky-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
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
                  ? 'border-cyan-300 bg-cyan-400/25 text-cyan-100'
                  : 'border-sky-700/70 bg-sky-500/10 text-sky-200 hover:border-cyan-400/70'
              }`}
            >
              {state === 'listening' ? t.floatingStop : t.floatingMic}
            </button>
            <button
              type="button"
              onClick={onToggleSpeak}
              aria-label={state === 'speaking' ? t.voiceStopAria : t.voicePlayAria}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-sky-700/70 bg-sky-500/10 px-2.5 text-[11px] text-sky-200 transition hover:border-cyan-400/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              {state === 'speaking' ? t.floatingMute : t.floatingSpeak}
            </button>
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="inline-flex h-8 items-center rounded-lg border border-sky-700/70 bg-sky-500/10 px-2.5 text-[11px] text-sky-200 transition hover:border-cyan-400/70"
            >
              {expanded ? t.floatingHideBtn : t.floatingAskBtn}
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
