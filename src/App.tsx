import { useEffect, useRef, useState, type ReactNode } from 'react'

type IconName = 'home' | 'pen' | 'audio' | 'mic' | 'settings' | 'folder' | 'download' | 'arrow' | 'spark' | 'layers' | 'globe' | 'close' | 'play'
function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></>,
    pen: <><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z" /><path d="M13 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14" /></>,
    audio: <path d="M3 10v4m4-8v12m5-16v20m5-16v12m4-8v4" />,
    mic: <><rect x="8" y="2" width="8" height="13" rx="4" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></>,
    settings: <><path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 1 3h4l1-3 3-1 3-3-2-2 1-3-3-2-1-3Z" /><circle cx="11" cy="11" r="3" /></>,
    folder: <path d="M3 6h7l2 3h9v11H3Zm0 3V4h7l2 2h8v3" />,
    download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /><path d="M20 2v5m-2-2h5" /></>,
    layers: <><path d="m12 3 10 6-10 6L2 9Zm-10 11 10 6 10-6M2 19l10 5 10-5" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
    close: <path d="m5 5 14 14M19 5 5 19" />,
    play: <path d="m8 4 13 8-13 8Z" />,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 shrink-0 ${className}`} aria-hidden="true">{paths[name]}</svg>
}
const screens: { path: string; title: string; ar: string; icon: IconName; group: string }[] = [
  { path: 'welcome', title: 'Intelligence hub', ar: 'أهلاً بيك في عالم حافظ', icon: 'home', group: '' },
  { path: 'studio/editor', title: 'Lyrics Studio', ar: 'استوديو الكلمات', icon: 'pen', group: 'studio' },
  { path: 'studio/diacritics', title: 'Egyptian Diacritics', ar: 'التشكيل بالعامية', icon: 'spark', group: 'studio' },
  { path: 'studio/songwriting', title: 'Egyptian Songwriting', ar: 'كتابة الأغاني', icon: 'pen', group: 'studio' },
  { path: 'studio/rhymes', title: 'Rhymes & Rewriter', ar: 'القوافي وإعادة الصياغة', icon: 'spark', group: 'studio' },
  { path: 'audio/analysis', title: 'Music & Audio Analysis', ar: 'تحليل الصوت والموسيقى', icon: 'audio', group: 'audio' },
  { path: 'audio/web', title: 'YouTube & Research', ar: 'يوتيوب والبحث', icon: 'globe', group: 'audio' },
  { path: 'voice_stems/clone', title: 'Voice Cloning', ar: 'استنساخ الصوت', icon: 'mic', group: 'voice_stems' },
  { path: 'voice_stems/separation', title: 'Six-Stem Separation', ar: 'فصل التراكات', icon: 'layers', group: 'voice_stems' },
  { path: 'setup/models', title: 'AI Model Library', ar: 'مكتبة الذكاء الاصطناعي', icon: 'layers', group: 'setup' },
  { path: 'setup/downloads', title: 'Downloads & Installation', ar: 'التحميل والتثبيت', icon: 'download', group: 'setup' },
  { path: 'setup/general', title: 'Settings Center', ar: 'مركز الإعدادات', icon: 'settings', group: 'setup' },
  { path: 'conversation', title: 'Talk to HAFIZ', ar: 'اتكلم مع حافظ', icon: 'mic', group: '' },
  { path: 'projects', title: 'Projects & History', ar: 'المشاريع والمحفوظات', icon: 'folder', group: '' },
]
const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 text-sm transition hover:border-cyan-400/60 hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-60'
const field = 'w-full rounded-xl border border-slate-700 bg-black/20 p-4 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
const panel = 'rounded-2xl border border-slate-700/70 bg-[#0b1623]/90'
function load<T,>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback } }
function persist(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable */ } }
function download(text: string, name = 'HAFIZ-lyrics.txt') {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
}
function AudioPreview({ url, name }: { url: string; name: string }) {
  const [peaks, setPeaks] = useState<number[]>([])
  const [status, setStatus] = useState('Decoding waveform…')
  const [duration, setDuration] = useState(0)
  useEffect(() => {
    let disposed = false
    const decoder = new AudioContext()
    setPeaks([]); setStatus('Decoding waveform…')
    void fetch(url).then(r => r.arrayBuffer()).then(bytes => decoder.decodeAudioData(bytes)).then(buffer => {
      if (disposed) return
      const samples = buffer.getChannelData(0)
      const size = Math.max(1, Math.floor(samples.length / 180))
      const result = Array.from({ length: 180 }, (_, i) => {
        let peak = 0
        for (let j = i * size; j < Math.min((i + 1) * size, samples.length); j++) peak = Math.max(peak, Math.abs(samples[j]))
        return peak
      })
      setPeaks(result); setDuration(buffer.duration)
      setStatus(`${buffer.numberOfChannels} channels · ${buffer.sampleRate.toLocaleString()} Hz · ${buffer.duration.toFixed(2)} s`)
    }).catch(() => { if (!disposed) setStatus('Waveform decoding is unsupported for this file. Try WAV or MP3.') }).finally(() => void decoder.close())
    return () => { disposed = true }
  }, [url])
  return <div className={`${panel} mt-5 p-5`}>
    <div className="mb-4 flex flex-wrap justify-between gap-2"><h3 className="break-all text-sm">{name}</h3><p className="text-xs text-sky-200" role="status">{status}</p></div>
    {peaks.length > 0 && <svg viewBox="0 0 720 100" preserveAspectRatio="none" role="img" aria-label={`Decoded source waveform, ${duration.toFixed(2)} seconds`} className="mb-4 h-28 w-full rounded-lg bg-[#030b15] text-sky-400">
      <path d="M0 50H720" stroke="#1c3a50" />
      {peaks.map((value, i) => <line key={i} x1={i * 4 + 2} x2={i * 4 + 2} y1={50 - Math.max(1, value * 46)} y2={50 + Math.max(1, value * 46)} stroke="currentColor" strokeWidth="2" />)}
    </svg>}
    <audio aria-label={`Play ${name}`} src={url} controls className="w-full" />
  </div>
}
function NeuralBrain() {
  return <svg viewBox="0 0 700 520" className="pointer-events-none absolute -top-12 left-1/2 h-[86%] w-[140%] -translate-x-1/2 overflow-visible drop-shadow-[0_0_7px_#009dff]" aria-hidden="true">
    <defs>
      <radialGradient id="brain-fill"><stop stopColor="#007dff" stopOpacity=".25" /><stop offset="1" stopColor="#001c48" stopOpacity=".1" /></radialGradient>
      <path id="brain-outline" d="M345 82C295 30 226 45 205 80C151 66 110 105 116 146C62 163 62 225 92 250C58 300 93 351 139 358C143 406 197 434 240 415C270 457 320 436 346 412C375 451 433 449 454 414C507 431 557 397 552 353C607 335 629 284 600 247C639 202 613 153 571 143C572 96 528 69 483 80C445 30 380 42 345 82Z" />
      <clipPath id="brain-clip"><use href="#brain-outline" /></clipPath>
    </defs>
    <use href="#brain-outline" fill="url(#brain-fill)" stroke="#23c9ff" strokeWidth="3" />
    <use href="#brain-outline" fill="none" stroke="#7aeaff" strokeWidth="10" opacity=".13" />
    <g clipPath="url(#brain-clip)" fill="none">
      {Array.from({ length: 24 }, (_, i) => <path key={i} d={`M${75 + i * 24} 30 C${160 + i * 16} 110,${5 + i * 23} 130,${100 + i * 22} 183 S${200 + i * 14} 237,${120 + i * 23} 280 S${240 + i * 14} 340,${130 + i * 22} 460`} stroke={i % 3 ? '#008dff' : '#70eaff'} strokeWidth={i % 3 ? '1.5' : '2.5'} />)}
      {Array.from({ length: 11 }, (_, i) => <path key={i} d={`M80 ${90 + i * 31} Q180 ${25 + i * 35},275 ${100 + i * 32} T470 ${90 + i * 34} T640 ${110 + i * 28}`} stroke="#31caff" strokeWidth="1" strokeOpacity=".6" />)}
      <path d="M346 70C320 150 373 190 340 260S364 350 347 430" stroke="#94f5ff" strokeWidth="3" />
      {Array.from({ length: 50 }, (_, i) => <circle key={i} cx={110 + (i * 83) % 490} cy={85 + (i * 61) % 320} r={i % 4 ? 1.5 : 3} fill="#b6f8ff" />)}
    </g>
  </svg>
}
function Character({ active, state, front = false }: { active: boolean; state: string; front?: boolean }) {
  const [failed, setFailed] = useState(false)
  return <div className="relative isolate mx-auto h-[420px] w-full max-w-[680px] md:h-[530px]">
    <div className="absolute inset-x-[8%] top-2 aspect-square rounded-full bg-[radial-gradient(ellipse,#006ee75c_0%,#003e7e30_45%,transparent_70%)] blur-2xl" />
    <NeuralBrain />
    <svg viewBox="0 0 600 550" className={`absolute -top-12 left-0 h-[110%] w-full overflow-visible text-sky-400 motion-safe:animate-[orbit_100s_linear_infinite] ${state === 'thinking' ? '[animation-duration:12s]' : ''}`} aria-hidden="true">
      <defs><filter id="neon"><feGaussianBlur stdDeviation="3" /></filter></defs>
      <g fill="none" stroke="currentColor">
        <ellipse cx="300" cy="260" rx="238" ry="230" strokeOpacity=".4" />
        <ellipse cx="300" cy="260" rx="255" ry="245" strokeDasharray="4 13" strokeOpacity=".5" />
        <ellipse cx="300" cy="260" rx="270" ry="155" transform="rotate(-35 300 260)" strokeOpacity=".4" />
        <ellipse cx="300" cy="260" rx="250" ry="175" transform="rotate(40 300 260)" strokeOpacity=".35" />
        {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={300 + Math.cos(i * 1.7) * 240} cy={250 + Math.sin(i * 1.7) * 215} r={i % 3 === 0 ? 3 : 1.5} fill="#7eeaff" />)}
      </g>
    </svg>
    {active && <div className="pointer-events-none absolute inset-0 overflow-hidden text-center font-mono text-xs text-amber-300/70" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <div key={i} className="absolute -top-40 whitespace-pre-line motion-safe:animate-[rain_9s_linear_infinite]" style={{ left: `${i * 9}%`, animationDelay: `${-i * 1.3}s` }}>01{'\n'}∆7{'\n'}10{'\n'}λ0{'\n'}01{'\n'}Σ8{'\n'}10</div>)}</div>}
    <div className="absolute -inset-x-[24%] -bottom-5 h-24 rounded-[50%] border border-sky-500/70 bg-[repeating-radial-gradient(ellipse,#061a30_0px,#061a30_12px,#16435f_14px,#020915_17px)] shadow-[0_12px_0_#020812,0_15px_0_#1376a8,0_20px_45px_#008cff66]" />
    <div className="absolute -inset-x-[10%] bottom-0 h-20 rounded-[50%] border-2 border-cyan-300/80 bg-[radial-gradient(ellipse,#1bc5ff55,transparent_65%)] shadow-[0_10px_45px_#008cff45,inset_0_0_20px_#009dff55]" />
    <div className="absolute inset-x-[14%] bottom-5 h-10 rounded-[50%] border-2 border-cyan-300/80 shadow-[0_0_20px_#00c8ff,inset_0_0_16px_#008cff]" />
    {failed ? <div className="absolute inset-0 grid place-items-center"><Icon name="mic" className="h-24 w-24 text-cyan-300" /><p>Official character unavailable</p></div> : <img src={front ? '/assets/hafiz-front.png' : '/assets/hafiz-profile.png'} alt="Official HAFIZ metallic character with sunglasses and black leather jacket" onError={() => setFailed(true)} className="absolute inset-x-0 bottom-9 mx-auto h-[89%] w-full object-contain drop-shadow-[0_0_16px_#069cff77] motion-safe:animate-[breathe_7s_ease-in-out_infinite]" />}
    <svg viewBox="0 0 600 120" className="pointer-events-none absolute -bottom-2 left-[-10%] h-28 w-[120%] overflow-visible" aria-hidden="true"><ellipse cx="300" cy="55" rx="230" ry="35" fill="none" stroke="#33d4ff" strokeWidth="2" strokeDasharray="160 45 24 25" className="drop-shadow-[0_0_5px_#0af]" /><ellipse cx="300" cy="55" rx="185" ry="24" fill="none" stroke="#7aeaff" /><path d="M85 65Q300 125 515 65" fill="none" stroke="#d6b573" strokeWidth="2" /></svg>
  </div>
}

export default function App() {
  const [route, setRoute] = useState(location.hash.slice(1) || 'welcome')
  const [language, setLanguage] = useState(() => load('hafiz-language', 'en'))
  const [text, setText] = useState(() => load('hafiz-draft', ''))
  const [projects, setProjects] = useState<{ id: number; text: string; title: string }[]>(() => load('hafiz-projects', []))
  const [notice, setNotice] = useState('')
  const [state, setState] = useState('idle')
  const [levels, setLevels] = useState<number[]>(Array(40).fill(3))
  const [message, setMessage] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [audioName, setAudioName] = useState('')
  const [reference, setReference] = useState({ url: '', name: '' })
  const [settingsTab, setSettingsTab] = useState('General & Appearance')
  const [speechEnabled, setSpeechEnabled] = useState(() => load('hafiz-speech', true))
  const [search, setSearch] = useState('')
  const [undo, setUndo] = useState<string[]>([])
  const [redo, setRedo] = useState<string[]>([])
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantAssetFailed, setAssistantAssetFailed] = useState(false)
  const assistantPanel = useRef<HTMLDivElement>(null)
  const assistantTrigger = useRef<HTMLButtonElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const context = useRef<AudioContext | null>(null)
  const frame = useRef(0)
  const requestingMic = useRef(false)
  const isScene = route === 'welcome' || route === 'conversation'
  const current = screens.find(s => s.path === route) || screens[0]
  const ar = language === 'ar'
  useEffect(() => {
    if (!assistantOpen) return
    const prior = document.activeElement as HTMLElement | null
    assistantPanel.current?.focus()
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAssistantOpen(false)
      if (event.key !== 'Tab') return
      const nodes = assistantPanel.current?.querySelectorAll<HTMLElement>('button, input, [tabindex="0"]')
      if (!nodes?.length) return
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === assistantPanel.current)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === assistantPanel.current)) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handle)
    return () => { document.removeEventListener('keydown', handle); (prior || assistantTrigger.current)?.focus() }
  }, [assistantOpen])
  useEffect(() => { const fn = () => setRoute(location.hash.slice(1) || 'welcome'); window.addEventListener('hashchange', fn); return () => window.removeEventListener('hashchange', fn) }, [])
  useEffect(() => { persist('hafiz-draft', text) }, [text])
  useEffect(() => { persist('hafiz-projects', projects) }, [projects])
  useEffect(() => { persist('hafiz-language', language) }, [language])
  useEffect(() => { persist('hafiz-speech', speechEnabled) }, [speechEnabled])
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl) }, [audioUrl])
  useEffect(() => () => { if (reference.url) URL.revokeObjectURL(reference.url) }, [reference.url])
  useEffect(() => () => { stream.current?.getTracks().forEach(t => t.stop()); cancelAnimationFrame(frame.current); void context.current?.close(); speechSynthesis.cancel() }, [])
  function go(path: string) { location.hash = path; setRoute(path); setNotice(''); setAssistantOpen(false) }
  function edit(value: string) { setUndo(u => [...u.slice(-39), text]); setRedo([]); setText(value) }
  function blocked() { setNotice('Windows companion not connected. This operation needs the original local AI engine; no result or download has been simulated.') }
  function save() { if (!text.trim()) return setNotice('Write something before saving.'); setProjects(p => [{ id: Date.now(), title: text.trim().slice(0, 40), text }, ...p]); setNotice('Draft saved on this browser. Find it in Projects & History.') }
  function speak(value: string) {
    if (!value.trim()) return setNotice('Enter text before starting speech.')
    if (!speechEnabled) return setNotice('Enable browser speech in Settings → HAFIZ Assistant.')
    if (!('speechSynthesis' in window)) return setNotice('Speech synthesis is not supported by this browser.')
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(value); u.lang = 'ar-EG'; u.rate = .9
    u.onstart = () => setState('speaking'); u.onend = u.onerror = () => setState('idle'); speechSynthesis.speak(u)
    setNotice('Browser speech fallback • Egyptian voice availability depends on your device. Audio-driven lip-sync requires a TTS audio stream and a rigged face.')
  }
  async function mic() {
    if (requestingMic.current) return
    if (stream.current) { stream.current.getTracks().forEach(t => t.stop()); stream.current = null; cancelAnimationFrame(frame.current); await context.current?.close(); setState('idle'); setLevels(Array(40).fill(3)); return }
    requestingMic.current = true
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      context.current = new AudioContext(); const analyser = context.current.createAnalyser(); analyser.fftSize = 128
      context.current.createMediaStreamSource(stream.current).connect(analyser); setState('listening')
      const values = new Uint8Array(analyser.frequencyBinCount)
      const update = () => { analyser.getByteFrequencyData(values); setLevels(Array.from(values.slice(0, 40), v => Math.max(3, v / 5))); frame.current = requestAnimationFrame(update) }; update()
    } catch { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; void context.current?.close(); setNotice('Microphone permission was denied or no microphone is available.'); setState('idle') }
    finally { requestingMic.current = false }
  }
  function command() {
    const value = message.toLowerCase()
    const match = screens.find(s => value.includes(s.title.toLowerCase()) || value.includes(s.ar))
    if (match) go(match.path)
    else if (/lyrics|كلمات/.test(value)) go('studio/editor')
    else if (/song|أغنية/.test(value)) go('studio/songwriting')
    else if (/audio|صوت/.test(value)) go('audio/analysis')
    else blocked()
    setMessage('')
  }
  function file(file?: File, target: 'source' | 'reference' = 'source') {
    if (!file) return
    if (file.type.startsWith('audio/') || /\.(mp3|wav|flac|m4a|ogg|webm)$/i.test(file.name)) {
      if (file.size > 150 * 1024 * 1024) return setNotice('Choose an audio file under 150 MB for browser preview.')
      if (target === 'reference') setReference({ url: URL.createObjectURL(file), name: file.name })
      else { setAudioUrl(URL.createObjectURL(file)); setAudioName(file.name) }
    } else if (/\.txt$/i.test(file.name)) void file.text().then(edit).catch(() => setNotice('The text file could not be read.'))
    else setNotice('Unsupported file. Choose a TXT document or a supported audio file.')
  }
  const tools = [
    { path: 'studio/songwriting', icon: 'pen' as IconName, title: 'Egyptian Songwriting', ar: 'اكتب حكايتك، بطريقتك', description: 'From your first idea to the final hook.' },
    { path: 'voice_stems/clone', icon: 'mic' as IconName, title: 'Voice Cloning', ar: 'صوتك.. بإمكانيات جديدة', description: 'A new dimension for your voice.' },
    { path: 'voice_stems/separation', icon: 'layers' as IconName, title: 'Six-Stem Separation', ar: 'اسمع كل تفصيلة لوحدها', description: 'Take your music apart. Create more.' },
    { path: 'studio/diacritics', icon: 'spark' as IconName, title: 'Egyptian Diacritics', ar: 'عامية مظبوطة، إحساس حقيقي', description: 'Every word, exactly how you mean it.' },
    { path: 'audio/analysis', icon: 'audio' as IconName, title: 'Music & Audio Analysis', ar: 'افهم اللي ورا المزيكا', description: 'Discover the DNA of your sound.' },
    { path: 'audio/web', icon: 'globe' as IconName, title: 'YouTube & Research', ar: 'إلهامك ملوش حدود', description: 'Explore, research, and get inspired.' },
  ]
  function feature(t: typeof tools[number]) {
    return <button key={t.path} onClick={() => go(t.path)} style={{ transform: `perspective(850px) rotateY(${tools.indexOf(t) < 3 ? '12deg' : '-12deg'})` }} className="group relative flex min-h-[128px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-sky-400/70 bg-[linear-gradient(140deg,#16467866,#041123bb_60%,#0a345c88)] p-4 text-center shadow-[inset_0_1px_8px_#8bd5ff44,0_0_22px_#008cff20,0_15px_30px_#0008] backdrop-blur-xl transition duration-300 hover:border-cyan-200 hover:shadow-[0_0_35px_#008cff55] focus-visible:ring-2 focus-visible:ring-cyan-300">
      <Icon name={t.icon} className="h-9 w-9 text-cyan-200 drop-shadow-[0_0_7px_#00aaff]" />
      <span className="min-w-0"><span className="block font-[Cairo] text-base font-semibold text-slate-100" lang="ar">{screens.find(s => s.path === t.path)?.ar}</span><span className="mt-1 block text-sm text-sky-200">{t.title}</span></span>
    </button>
  }
  const aiAction = (label: string) => <button key={label} className={button} onClick={blocked}><Icon name="spark" />{label}</button>
  const upload = (label: string) => <label onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); file(e.dataTransfer.files[0], label.includes('reference') ? 'reference' : 'source') }} className={`${panel} flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 border-dashed p-5 text-sm hover:border-cyan-400`}><Icon name="download" className="h-8 w-8 text-sky-300" /><span>{label}</span><span className="text-xs text-slate-300">Drop WAV, MP3, FLAC, M4A, OGG · Up to 150 MB</span><input aria-label={label} type="file" accept="audio/*" className="max-w-full text-sm" onChange={e => file(e.target.files?.[0], label.includes('reference') ? 'reference' : 'source')} /></label>
  const editor = <textarea aria-label="Egyptian lyrics editor" dir="auto" value={text} onChange={e => edit(e.target.value)} placeholder="ابدأ حكايتك هنا…&#10;&#10;Write something only you could write." className={`${field} min-h-[330px] resize-y font-[Cairo] text-lg leading-9`} />
  return <div dir={ar ? 'rtl' : 'ltr'} className="min-h-screen overflow-x-hidden bg-[#050b13] font-[Outfit] text-slate-100 selection:bg-cyan-700">
    <header className="relative z-30 flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-[#080e17]/95 px-5 md:px-8">
      <button className="flex min-h-11 items-center gap-3 text-start focus-visible:ring-2 focus-visible:ring-cyan-400" onClick={() => go('welcome')} aria-label="HAFIZ home"><Icon name="audio" className="h-9 w-9 text-sky-400" /><span><span className="block text-3xl font-bold tracking-[.16em] text-slate-100">HAFIZ<span className="ms-2 text-xs font-normal tracking-[.14em] text-sky-200">IN SLANG</span></span><span className="block text-xs tracking-[.13em] text-slate-300">EGYPTIAN SOUL. ARTIFICIAL INTELLIGENCE.</span></span></button>
      <nav aria-label="Main navigation" className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
        {[['studio/editor', 'Lyrics Studio', 'pen'], ['audio/analysis', 'Audio & Web', 'audio'], ['voice_stems/clone', 'Voice & Stems', 'mic'], ['setup/general', 'Settings', 'settings']].map(([path, title, icon]) => <button key={path} onClick={() => go(path)} className={`${button} shrink-0 border-transparent bg-transparent px-3 ${current.group === path.split('/')[0] ? 'text-cyan-300 bg-sky-400/10' : 'text-slate-300'}`}><Icon name={icon as IconName} />{title}</button>)}
      </nav>
      <div className="flex items-center gap-3"><button className={`${button} px-3 font-[Cairo]`} onClick={() => setLanguage(ar ? 'en' : 'ar')}>{ar ? 'English' : 'العربية'}</button><span className="hidden h-5 w-px bg-slate-700 lg:block" /><button aria-label="Open settings" className={`${button} border-transparent px-2`} onClick={() => go('setup/general')}><Icon name="settings" /></button></div>
    </header>
    <div className="flex min-h-[calc(100vh-80px)]">
      <aside className="z-20 hidden w-[76px] shrink-0 flex-col items-center gap-4 border-e border-slate-800/80 bg-[#080f19] py-7 lg:flex">
        {(['welcome', 'studio/editor', 'audio/analysis', 'voice_stems/clone', 'projects'] as const).map(path => { const s = screens.find(s => s.path === path)!; return <button key={path} onClick={() => go(path)} aria-label={s.title} title={s.title} className={`grid h-12 w-12 place-items-center rounded-xl transition focus-visible:ring-2 focus-visible:ring-cyan-300 ${route === path ? 'border border-sky-500/40 bg-sky-500/15 text-sky-300 shadow-[0_0_20px_#008cff18]' : 'text-slate-300 hover:bg-white/5'}`}><Icon name={s.icon} /></button> })}
        <div className="mt-auto flex flex-col gap-3">{['setup/downloads', 'setup/general'].map(path => <button key={path} aria-label={path === 'setup/general' ? 'Settings' : 'Downloads'} onClick={() => go(path)} className={`${button} border-transparent px-3`}><Icon name={path === 'setup/general' ? 'settings' : 'download'} /></button>)}</div>
      </aside>
      <main className="relative min-w-0 flex-1">
        {isScene ? <section className="relative isolate overflow-hidden px-5 pb-8 pt-7 md:px-9">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_40%,#07366b55,transparent_60%)]" />
          <div className="flex items-center justify-between gap-4"><span className="inline-flex items-center gap-2 rounded-full border border-sky-800/60 bg-sky-950/30 px-3 py-1.5 text-xs tracking-wider text-sky-200"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#5eeaff]" /> YOUR CREATIVE INTELLIGENCE</span><button className="min-h-11 text-sm text-slate-300 hover:text-white" onClick={() => go('studio/editor')}>Go to workspace <span className="ms-2">↗</span></button></div>
          <div className="mt-3 text-center"><p className="text-xs uppercase tracking-[.28em] text-sky-200">HAFIZ INTELLIGENCE / حافظ بالعامية</p><h1 className="mt-2 font-[Cairo] text-2xl font-semibold tracking-tight md:text-3xl">{ar ? 'أهلاً بيك.. نبدأ بإيه النهارده؟' : 'Your imagination. Brought to life.'}</h1></div>
          <div dir="ltr" className="mx-auto mt-12 grid max-w-[1300px] items-center gap-5 md:grid-cols-[minmax(180px,1fr)_minmax(0,2.2fr)_minmax(180px,1fr)] xl:gap-12">
            <div className="order-2 flex flex-col gap-4 md:order-none md:pt-6">{tools.slice(0, 3).map(feature)}</div>
            <div className="order-1 min-w-0 md:order-none"><Character state={state} active={state === 'speaking'} front={route === 'conversation'} /></div>
            <div className="order-3 flex flex-col gap-4 md:pt-6">{tools.slice(3).map(feature)}</div>
          </div>
          <div className="relative mx-auto mt-12 max-w-[680px] rounded-2xl border border-sky-500/50 bg-[#061528bb] p-4 text-center shadow-[0_0_30px_#008cff22,inset_0_1px_0_#69d9ff33]">
            <p className="font-[Cairo] text-xl font-medium text-slate-100" lang="ar">كل فكرة ليها صوت.. خلّينا نسمّعها للعالم.</p>
            <p className="mt-2 text-sm text-slate-300">Tell me what you're creating. I'm right here.</p>
            <div className="mx-auto mt-5 flex h-[74px] max-w-[460px] items-center justify-center gap-5 rounded-2xl border border-sky-700/60 bg-[linear-gradient(120deg,#101e30,#071222)] px-5 shadow-[0_0_30px_#007bff12,inset_0_1px_0_#8ddcff20]">
              <div className="flex h-10 flex-1 items-center justify-end gap-[3px]" aria-label={state === 'listening' ? 'Live microphone levels' : 'Microphone inactive'}>{levels.slice(0, 20).map((v, i) => <span key={i} className="w-[3px] rounded-full bg-sky-400" style={{ height: `${v}px` }} />)}</div>
              <button aria-label={state === 'listening' ? 'Stop microphone' : 'Start microphone'} aria-pressed={state === 'listening'} onClick={() => void mic()} className={`grid h-14 w-14 shrink-0 place-items-center rounded-full border border-cyan-300 bg-sky-500/20 text-cyan-100 shadow-[0_0_23px_#00aaff55] focus-visible:ring-2 ${state === 'listening' ? 'motion-safe:animate-pulse' : ''}`}><Icon name="mic" className="h-6 w-6" /></button>
              <div className="flex h-10 flex-1 items-center gap-[3px]">{levels.slice(20).map((v, i) => <span key={i} className="w-[3px] rounded-full bg-sky-400" style={{ height: `${v}px` }} />)}</div>
            </div>
            <p className="mt-3 text-xs tracking-wide text-slate-300">{state === 'listening' ? 'Listening to your microphone • click to stop' : state === 'speaking' ? 'Speaking • browser voice' : 'Click the mic to connect your voice'}</p>
            <form onSubmit={e => { e.preventDefault(); command() }} className="mx-auto mt-4 flex max-w-[460px] items-center rounded-xl border border-slate-700 bg-[#0b1521] pe-2"><input aria-label="Tell HAFIZ which tool to open" value={message} onChange={e => setMessage(e.target.value)} className="min-h-11 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-400" placeholder="Or type where you'd like to start…" /><button aria-label="Send command" className={`${button} border-transparent px-2`}><Icon name="arrow" /></button></form>
            <button className="mt-3 min-h-11 text-xs text-sky-200 hover:underline" onClick={() => state === 'speaking' ? (speechSynthesis.cancel(), setState('idle')) : speak('أهلاً بيك، أنا حافظ. جاهز أساعدك. نبدأ بإيه النهارده؟')}>{state === 'speaking' ? 'Stop welcome voice' : 'Play welcome voice'} <span className="mx-2 text-slate-500">·</span> Browser speech</button>
          </div>
        </section> : <section className="mx-auto max-w-[1500px] p-5 md:p-9">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4"><div><p className="mb-2 text-xs uppercase tracking-[.2em] text-sky-300">HAFIZ / {current.group || 'Library'}</p><h1 className="text-3xl font-medium">{ar ? current.ar : current.title}</h1></div><button className={button} onClick={() => go('projects')}><Icon name="folder" />Projects & History</button></div>
          <nav aria-label="Workspace tools" className="mb-6 flex gap-2 overflow-x-auto pb-2">{screens.filter(s => s.group && s.group === current.group).map(s => <button key={s.path} onClick={() => go(s.path)} className={`${button} shrink-0 ${s.path === route ? 'border-sky-500/70 bg-sky-500/15 text-sky-200' : ''}`}>{s.title}</button>)}</nav>
          {route.startsWith('studio/') && <><div className="mb-4 flex flex-wrap gap-2"><button className={button} onClick={save}>Save draft</button><label className={`${button} cursor-pointer`}>Open TXT<input aria-label="Open text file" type="file" accept=".txt" className="hidden" onChange={e => file(e.target.files?.[0])} /></label><button className={button} onClick={() => download(text)}>Export TXT</button><button className={button} onClick={() => void navigator.clipboard.writeText(text).then(() => setNotice('Copied to clipboard.'), () => setNotice('Clipboard unavailable. Select and copy the text manually.'))}>Copy</button><button className={button} onClick={() => speak(text)}>Read text</button><button className={button} onClick={() => edit('')}>Clear</button></div>
            {route === 'studio/songwriting' && <div className={`${panel} mb-4 grid gap-4 p-5 md:grid-cols-3`}><label className="text-sm">Genre<select aria-label="Genre" className={`${field} mt-2`}>{'mahraganat shaabi trap_shaabi rap_egy pop_egy romantic afrobeat rnb hiphop pop rock jazz blues lofi edm reggaeton house indie classical'.split(' ').map(g => <option key={g}>{g}</option>)}</select></label><label className="text-sm">Mood<input className={`${field} mt-2`} placeholder="Intimate, hopeful, energetic…" /></label><label className="text-sm">Arrangement<input className={`${field} mt-2`} placeholder="Oud, warm bass, acoustic drums…" /></label></div>}
            {route === 'studio/diacritics' && <div className="mb-4 flex flex-wrap gap-3"><select aria-label="Address selection" className={`${field} max-w-52`}><option>Automatic address</option><option>Masculine</option><option>Feminine</option></select>{['Smart Diacritics', 'Suno Phonetic', 'Connected Egyptian', 'Proofread'].map(aiAction)}<button className={button} onClick={() => edit(text.replace(/[\u064B-\u065F\u0670]/g, ''))}>Strip diacritics locally</button></div>}
            <div className={`${panel} p-4`}><div className="mb-3 flex items-center justify-between"><span className="text-sm text-slate-300">{route === 'studio/songwriting' ? 'Song concept & sections' : route === 'studio/rhymes' ? 'Source lyric line' : 'Your writing space'}</span><div className="flex gap-2"><button className={button} disabled={!undo.length} onClick={() => { setRedo(r => [...r, text]); setText(undo[undo.length - 1]); setUndo(u => u.slice(0, -1)) }}>Undo</button><button className={button} disabled={!redo.length} onClick={() => { setUndo(u => [...u, text]); setText(redo[redo.length - 1]); setRedo(r => r.slice(0, -1)) }}>Redo</button></div></div>{editor}<div className="mt-3 flex justify-between text-xs text-slate-300"><span>Egyptian Arabic · UTF-8 · Browser-local autosave</span><span>{text.trim() ? text.trim().split(/\s+/).length : 0} words · {text.length} characters</span></div></div>
            <div className="mt-4 flex flex-wrap gap-2">{(route === 'studio/songwriting' ? ['Compose Song', 'Write Lyrics', 'Analyze Lyrics', 'Generate Suno / Udio Prompts'] : route === 'studio/rhymes' ? ['Find Egyptian Rhymes', 'Rewrite Line', 'Inspect Pronunciation', 'Check Meaning'] : ['Smart Diacritics', 'Analyze Lyrics']).map(aiAction)}</div>
          </>}
          {(route === 'audio/analysis' || route.startsWith('voice_stems/')) && <><div className="grid gap-5 md:grid-cols-2">{upload('Upload source audio')}{route.endsWith('clone') ? upload('Upload authorized reference voice') : <div className={`${panel} p-5`}><label className="text-sm">Authorized YouTube URL<input aria-label="Authorized YouTube URL" className={`${field} mt-3`} placeholder="https://youtube.com/watch?v=…" /></label><p className="mt-4 text-sm text-slate-300">Remote extraction requires the local companion and source permission.</p></div>}</div><div className={route.endsWith('clone') ? 'grid gap-5 md:grid-cols-2' : ''}>{audioUrl && <AudioPreview url={audioUrl} name={`Source · ${audioName}`} />}{route.endsWith('clone') && reference.url && <AudioPreview url={reference.url} name={`Reference · ${reference.name}`} />}</div><div className={`${panel} mt-5 space-y-5 p-5`}><label className="block text-sm">Processing mode<select aria-label="Processing mode" className={`${field} mt-2`}>{(route.endsWith('clone') ? ['Speech Conversion — speech_v2', 'Singing Conversion — singing_v1', 'Egyptian Text-to-Voice — text_omnivoice'] : route.endsWith('separation') ? ['Hybrid 6-Stems — hybrid_6stems', 'Vocal + Instrumental — bs_roformer_2stems', 'Fast 6-Stems — demucs_6s_fast'] : ['Egyptian transcription', 'General transcription', 'Clean transcription', 'Transcription + music prompt', 'Comprehensive musical analysis']).map(x => <option key={x}>{x}</option>)}</select></label>{route.endsWith('clone') && <label className="block text-sm">Pitch shift<input aria-label="Pitch in semitones" type="range" min="-12" max="12" defaultValue="0" className="mx-3 align-middle accent-sky-400" />−12 to +12 semitones</label>}<button className={`${button} border-sky-500 bg-sky-500/15`} onClick={blocked}><Icon name="play" />Start processing</button><p className="text-sm text-slate-300">No processed audio yet. GPU engines require the Windows companion.</p></div></>}
          {route === 'audio/web' && <div className={`${panel} space-y-5 p-6`}><label className="block text-sm">Source URL<input className={`${field} mt-2`} placeholder="Paste an authorized source URL" /></label><label className="block text-sm">Research query<input className={`${field} mt-2`} placeholder="What would you like to research?" /></label><div className="flex flex-wrap gap-2">{['Extract Available Lyrics', 'Research & Generate Prompt', 'Egyptian Phonetic Processing'].map(aiAction)}</div><p className="text-sm text-slate-300">Web agent disconnected. No source has been accessed.</p></div>}
          {route === 'setup/models' && <div className="grid gap-4 md:grid-cols-2">{['AI Assistant', 'Egyptian Speech Recognition', 'Egyptian Speech Generation', 'Egyptian Diacritics', 'Songwriting Intelligence', 'Voice Cloning', 'Singing Conversion', 'Vocal Separation', 'Six-Stem Separation'].map(name => <div key={name} className={`${panel} flex items-center gap-4 p-5`}><Icon name="layers" className="h-8 w-8 text-sky-300" /><div className="flex-1"><h2>{name}</h2><p className="mt-1 text-xs text-amber-200">Not verified · companion offline</p></div><button className={button} onClick={blocked}>Discover</button></div>)}</div>}
          {route === 'setup/downloads' && <div className={`${panel} flex min-h-80 flex-col items-center justify-center gap-5 p-7 text-center`}><Icon name="download" className="h-12 w-12 text-sky-300" /><h2 className="text-xl">Your installation, in one place.</h2><p className="max-w-lg text-sm leading-6 text-slate-300">No verified download jobs. Background transfers, checksum verification, recovery, and local model discovery require an authorized Windows companion.</p><div className="flex flex-wrap justify-center gap-3">{['Connect companion', 'Continue interrupted downloads', 'Use existing files', 'Verify installation'].map(label => <button key={label} className={button} onClick={blocked}>{label}</button>)}</div></div>}
          {route === 'setup/general' && <div className="grid gap-5 md:grid-cols-[230px_1fr]"><div className={`${panel} p-2`}>{['General & Appearance', 'HAFIZ Assistant', 'Microphone & Speech', 'AI Models & Engines', 'GPU & Performance', 'Audio Settings', 'Downloads & Storage', 'Memory & Profiles', 'Updates & Dependencies', 'Security & Privacy', 'Diagnostics', 'About & Credits'].map(t => <button key={t} onClick={() => setSettingsTab(t)} className={`min-h-11 w-full rounded-lg px-3 text-start text-sm ${settingsTab === t ? 'bg-sky-400/15 text-sky-200' : 'text-slate-300 hover:bg-white/5'}`}>{t}</button>)}</div><div className={`${panel} min-h-80 p-6`}><h2 className="mb-6 text-xl">{settingsTab}</h2>{settingsTab === 'General & Appearance' ? <label className="text-sm">Interface language<select value={language} onChange={e => setLanguage(e.target.value)} className={`${field} mt-3`}><option value="en">English · LTR</option><option value="ar">العربية · RTL</option></select></label> : settingsTab === 'HAFIZ Assistant' || settingsTab === 'Audio Settings' ? <label className="flex min-h-11 items-center justify-between text-sm">Browser speech fallback<input type="checkbox" checked={speechEnabled} onChange={e => setSpeechEnabled(e.target.checked)} className="h-5 w-5 accent-sky-400" /></label> : settingsTab === 'Microphone & Speech' ? <button className={button} onClick={() => void mic()}>{state === 'listening' ? 'Stop microphone test' : 'Test microphone permission'}</button> : settingsTab === 'About & Credits' ? <p className="text-sm leading-7 text-slate-300">HAFIZ In Slang · Creative web workspace<br />Official character artwork supplied by the owner.<br />Layered 2.5D character, not a rigged 3D model.</p> : <><p className="mb-5 text-sm leading-7 text-slate-300">This category requires live capabilities from the authorized Windows companion. No system settings have been changed.</p><button className={button} onClick={blocked}>Check companion connection</button></>}</div></div>}
          {route === 'projects' && <><input aria-label="Search saved projects" value={search} onChange={e => setSearch(e.target.value)} className={`${field} mb-5`} placeholder="Search your saved projects…" />{projects.length === 0 ? <div className={`${panel} py-20 text-center`}><Icon name="folder" className="mx-auto mb-5 h-10 w-10 text-sky-300" /><h2 className="text-xl">A fresh start for your next idea.</h2><p className="my-4 text-sm text-slate-300">Your saved lyrics will appear here. Stored only in this browser.</p><button className={button} onClick={() => go('studio/editor')}>Create your first project</button></div> : projects.filter(p => p.title.toLowerCase().includes(search.toLowerCase())).map(p => <div key={p.id} className={`${panel} mb-3 flex flex-wrap items-center gap-3 p-5`}><span className="min-w-0 flex-1 truncate">{p.title}</span><button className={button} onClick={() => { edit(p.text); go('studio/editor') }}>Open</button><button className={button} onClick={() => { const title = prompt('Project name', p.title); if (title?.trim()) setProjects(ps => ps.map(x => x.id === p.id ? { ...x, title } : x)) }}>Rename</button><button className={button} onClick={() => setProjects(ps => [{ ...p, id: Date.now(), title: `${p.title} (copy)` }, ...ps])}>Duplicate</button><button className={button} onClick={() => download(p.text)}>Export</button><button className={button} onClick={() => { if (confirm('Delete this locally saved project?')) setProjects(ps => ps.filter(x => x.id !== p.id)) }}>Delete</button></div>)}</>}
        </section>}
        {!isScene && <div className="flex justify-end px-6 pb-5"><button ref={assistantTrigger} className="z-40 flex min-h-14 items-center gap-3 rounded-xl border border-sky-500/60 bg-[#0b1a2a] px-4 text-sm text-sky-100 shadow-[0_0_25px_#008cff30] focus-visible:ring-2 focus-visible:ring-cyan-300" onClick={() => setAssistantOpen(true)}>{assistantAssetFailed ? <Icon name="mic" /> : <img src="/assets/hafiz-front.png" alt="" className="h-14 w-12 object-contain" onError={() => setAssistantAssetFailed(true)} />}نادي على حافظ <span className="text-xs text-slate-300">/ Call Hafiz</span></button></div>}
        {assistantOpen && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#010714aa] p-4 backdrop-blur-md" onClick={e => { if (e.target === e.currentTarget) setAssistantOpen(false) }}>
          <div ref={assistantPanel} role="dialog" aria-modal="true" aria-labelledby="assistant-heading" tabIndex={-1} className="relative my-auto w-full max-w-[650px] rounded-3xl border border-sky-500/40 bg-[radial-gradient(ellipse_at_center,#07316988,#020b16ee)] p-5 outline-none">
            <div className="relative z-10 flex items-center justify-between"><h2 id="assistant-heading" className="text-lg text-sky-100">HAFIZ <span className="ms-2 font-[Cairo]">حافظ</span></h2><button autoFocus className={button} aria-label="Close assistant" onClick={() => setAssistantOpen(false)}><Icon name="close" /></button></div>
            <div className="px-8 pt-10"><Character active={state === 'speaking'} state={state} front /></div>
            <div className="relative mt-8 rounded-2xl border border-sky-400/60 bg-[#071626] p-4 shadow-[0_0_25px_#008cff44]">
              <div className="flex items-center gap-4"><button className={`${button} min-w-14 border-cyan-400/60 text-cyan-200`} onClick={() => void mic()} aria-label={state === 'listening' ? 'Stop microphone' : 'Start microphone'} aria-pressed={state === 'listening'}><Icon name="mic" /></button><div className="min-w-0 flex-1"><p className="text-lg tracking-widest">HAFIZ <span className="font-[Cairo]">| حافظ</span></p><p className="mt-1 text-sm text-sky-200" role="status">{state === 'listening' ? 'Listening / بسمعك' : state === 'speaking' ? 'Speaking / بتكلم' : 'Ready / جاهز'}</p></div><div className="flex h-10 items-center gap-0.5" aria-label="Live microphone input levels">{levels.slice(0, 18).map((v, i) => <span key={i} className="w-0.5 rounded-full bg-cyan-300" style={{ height: v }} />)}</div></div>
              <form className="mt-4 flex gap-2" onSubmit={e => { e.preventDefault(); command() }}><input className={`${field} min-w-0 flex-1`} aria-label="Assistant command" value={message} onChange={e => setMessage(e.target.value)} placeholder={ar ? 'تحب نفتح أنهي أداة؟' : 'Which workspace would you like to open?'} /><button className={button} aria-label="Send command"><Icon name="arrow" /></button></form>
              <div className="mt-3 flex flex-wrap gap-2"><button className={button} onClick={() => { speechSynthesis.cancel(); setState('idle') }}>Interrupt speech</button><button className={button} onClick={() => go('conversation')}>Full conversation</button></div>
              <p className="mt-3 text-xs leading-5 text-slate-300">In-app overlay only · Local AI and audio-driven lip-sync are not connected.</p>
            </div>
          </div>
        </div>}
        {notice && <div role="status" className="fixed inset-x-5 bottom-14 z-50 mx-auto flex max-w-2xl items-start gap-3 rounded-xl border border-sky-700 bg-[#112136] p-4 text-sm leading-6 shadow-2xl"><span className="flex-1">{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice('')} className="grid min-h-11 min-w-11 place-items-center rounded-lg hover:bg-white/10 focus-visible:ring-2"><Icon name="close" /></button></div>}
      </main>
    </div>
    <footer className="relative z-20 flex min-h-10 flex-wrap items-center justify-between gap-2 border-t border-slate-800 bg-[#080f19] px-6 py-2 text-xs text-slate-300"><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" />Web preview <span className="mx-2 text-slate-600">|</span> Local companion not connected</span><span className="hidden md:block">Made for Egyptian expression. Built for your imagination.</span><button className="min-h-11 text-sky-200" onClick={() => go('setup/general')}>System & connection <span className="ms-1">↗</span></button></footer>
  </div>
}
