import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, LogIn, MapPin, Menu, Printer, RefreshCw, ShieldCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import AccountMenu from '../components/AccountMenu'
import PrinterScene from '../components/PrinterScene'
import { useAuthStore } from '../store/authStore'
import { apiClient, type AvailablePrinter } from '../lib/apiClient'
import { useSessionStore } from '../store/sessionStore'

const BENEFITS = [
  { title: 'Private by default', body: 'Files are used for your print job and deleted after printing. Your documents are never kept for longer than necessary.' },
  { title: 'Low-cost printing', body: 'Transparent per-page pricing helps students print what they need without surprise charges or hidden fees.' },
  { title: 'Made for campus life', body: 'A calm, self-serve print moment between lectures, labs, and late-night submissions.' },
]

export default function WelcomeScreen() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const logoutMessage = useAuthStore((state) => state.logoutMessage)
  const clearLogoutMessage = useAuthStore((state) => state.clearLogoutMessage)
  const setPrinter = useSessionStore((state) => state.setPrinter)
  const [printers, setPrinters] = useState<AvailablePrinter[]>([])
  const [printerLoading, setPrinterLoading] = useState(true)
  const [printerError, setPrinterError] = useState<string | null>(null)
  const [printerPickerOpen, setPrinterPickerOpen] = useState(false)

  const loadPrinters = async () => {
    setPrinterLoading(true)
    setPrinterError(null)
    try {
      const available = await apiClient.availablePrinters()
      setPrinters(available.filter((printer) => printer.status === 'ONLINE' || printer.status === 'BUSY'))
    } catch (error) {
      setPrinterError(error instanceof Error ? error.message : 'Could not load printers.')
    } finally {
      setPrinterLoading(false)
    }
  }

  const startPrinting = () => {
    setPrinterPickerOpen(true)
    if (!printers.length && !printerLoading) void loadPrinters()
  }

  const choosePrinter = (printer: AvailablePrinter) => {
    setPrinter(printer.id, printer.name)
    setPrinterPickerOpen(false)
    navigate('/upload')
  }

  useEffect(() => {
    if (!logoutMessage) return
    const timer = window.setTimeout(clearLogoutMessage, 3500)
    return () => window.clearTimeout(timer)
  })

  useEffect(() => { void loadPrinters() }, [])

  return (
    <main className="min-h-screen overflow-hidden bg-lux-paper text-lux-ink screen-enter">
      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-10" aria-label="Main navigation">
        <a href="/" className="flex items-center gap-3 rounded-2xl border border-lux-ink/10 bg-white/65 px-3 py-2 shadow-[0_8px_24px_rgba(23,33,31,0.06)] backdrop-blur-sm" aria-label="Ping and Print home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lux-ink text-lux-paper"><Printer size={20} strokeWidth={1.6} /></span>
          <span className="leading-none"><span className="block text-lg font-extrabold tracking-[-0.06em]">Ping<span className="text-lux-copper">&amp;</span>Print</span><span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.16em] text-lux-ink/50">Campus printing</span></span>
        </a>
        <div className="hidden items-center gap-2 rounded-2xl border border-lux-ink/10 bg-white/65 p-2 shadow-[0_8px_24px_rgba(23,33,31,0.06)] backdrop-blur-sm md:flex"><a className="rounded-xl px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.13em] text-lux-ink/55 transition-colors hover:bg-lux-paper hover:text-lux-ink" href="#why">Why it works</a><a className="rounded-xl px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.13em] text-lux-ink/55 transition-colors hover:bg-lux-paper hover:text-lux-ink" href="#campus">For campus</a><span className="mx-1 h-5 w-px bg-lux-ink/10" /><span className="flex items-center gap-2 px-2 text-[10px] font-extrabold uppercase tracking-[0.13em] text-lux-ink/55"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Online</span><AccountMenu /></div>
        <div className="flex items-center gap-2"><button onClick={() => setMenuOpen(!menuOpen)} className="touch-target rounded-full bg-lux-ink p-3 text-lux-paper md:hidden" aria-label="Toggle menu">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button></div>
        {menuOpen && <div className="absolute right-6 top-20 flex w-64 flex-col gap-4 border border-lux-ink/10 bg-lux-paper p-5 text-sm font-bold shadow-xl md:hidden"><a href="#why" onClick={() => setMenuOpen(false)}>Why Ping &amp; Print</a><a href="#campus" onClick={() => setMenuOpen(false)}>For your campus</a><button className="flex items-center gap-2 border-t border-lux-ink/10 pt-4 text-left" onClick={() => { setMenuOpen(false); navigate('/login') }}><LogIn size={16} /> Log in</button><button className="flex items-center gap-2 text-left" onClick={() => { setMenuOpen(false); navigate('/signup') }}>Create account</button></div>}
      </nav>

      {logoutMessage && <div className="mx-auto mt-4 flex max-w-7xl items-center gap-2 border border-green-200 bg-green-50 px-5 py-3 text-sm font-bold text-green-800" role="status"><Check size={17} /> {logoutMessage}</div>}

      {printerPickerOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-lux-ink/55 px-0 backdrop-blur-sm sm:items-center sm:px-5" role="dialog" aria-modal="true" aria-labelledby="printer-picker-title">
        <div className="max-h-[88vh] w-full overflow-y-auto rounded-t-[28px] bg-lux-paper p-5 shadow-2xl sm:max-w-lg sm:rounded-[28px] sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-lux-copper">Step 01 / Choose a printer</p><h2 id="printer-picker-title" className="mt-2 font-display text-4xl leading-none sm:text-5xl">Where should we print?</h2><p className="mt-3 text-sm leading-6 text-lux-ink/60">Choose an available campus printer, then upload your document from this phone.</p></div>
            <button onClick={() => setPrinterPickerOpen(false)} className="touch-target shrink-0 rounded-full border border-lux-ink/10 p-3 text-lux-ink/55" aria-label="Close printer selection"><X size={18} /></button>
          </div>
          {printerLoading ? <div className="flex items-center justify-center gap-3 py-12 text-sm font-bold text-lux-ink/60"><span className="h-5 w-5 animate-spin rounded-full border-2 border-lux-copper border-t-transparent" /> Finding available printers...</div> : printerError ? <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert"><p>{printerError}</p><button onClick={() => void loadPrinters()} className="mt-3 flex items-center gap-2 font-extrabold text-red-800"><RefreshCw size={15} /> Try again</button></div> : printers.length === 0 ? <div className="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" role="status"><p className="font-bold">No printers are available right now.</p><p className="mt-1">Please try again when a registered printer is online.</p><button onClick={() => void loadPrinters()} className="mt-3 flex items-center gap-2 font-extrabold"><RefreshCw size={15} /> Refresh availability</button></div> : <div className="mt-6 grid gap-3">{printers.map((printer) => <button key={printer.id} onClick={() => choosePrinter(printer)} className="flex min-h-[78px] items-center gap-4 border border-lux-ink/10 bg-white px-4 py-4 text-left shadow-sm transition-colors hover:border-lux-copper hover:bg-lux-paper"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lux-ink text-lux-paper"><Printer size={22} /></span><span className="min-w-0 flex-1"><span className="block truncate text-base font-extrabold">{printer.name}</span><span className="mt-1 flex items-center gap-1.5 truncate text-xs text-lux-ink/55"><MapPin size={13} /> {printer.location}</span></span><span className="flex shrink-0 items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {printer.status === 'BUSY' ? 'Busy' : 'Ready'}</span><ArrowRight size={18} className="shrink-0 text-lux-copper" /></button>)}</div>}
        </div>
      </div>}

      {authOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-lux-ink/50 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="auth-title"><div className="relative w-full max-w-md bg-lux-paper p-7 shadow-2xl sm:p-9"><button onClick={() => setAuthOpen(false)} className="absolute right-4 top-4 rounded-full p-2 text-lux-ink/50" aria-label="Close account dialog"><X size={18} /></button><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-lux-copper">Ping &amp; Print account</p><h2 id="auth-title" className="mt-3 font-display text-5xl leading-none">Your account.</h2><p className="mt-4 text-sm leading-6 text-lux-ink/60">Sign in or create an account. Guest printing remains available without an account.</p><div className="mt-7 grid gap-3"><button onClick={() => { setAuthOpen(false); navigate('/login') }} className="flex w-full items-center justify-center gap-3 bg-lux-ink py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-lux-paper">Log in <ArrowRight size={17} /></button><button onClick={() => { setAuthOpen(false); navigate('/signup') }} className="flex w-full items-center justify-center gap-3 border border-lux-ink/20 bg-white py-4 text-sm font-extrabold uppercase tracking-[0.14em]">Create account <ArrowRight size={17} /></button></div></div></div>}

      <section className="welcome-hero luxury-grid relative mx-4 overflow-hidden border border-lux-ink/10 bg-[#E8E7D9] px-6 pb-16 pt-12 sm:mx-6 lg:mx-10 lg:min-h-[650px] lg:px-16 lg:pb-20 lg:pt-20">
        <div className="welcome-hero__paper welcome-hero__paper--one" />
        <div className="welcome-hero__paper welcome-hero__paper--two" />
        <div className="welcome-hero__registration welcome-hero__registration--one" />
        <div className="welcome-hero__registration welcome-hero__registration--two" />
        <div className="relative z-10 max-w-2xl"><p className="mb-6 flex items-center gap-3 text-xs font-extrabold uppercase tracking-[0.28em] text-lux-copper"><span className="h-px w-10 bg-lux-copper" /> Campus printing, reimagined</p><h1 className="max-w-2xl font-display text-6xl font-semibold leading-[0.88] tracking-tight text-lux-ink sm:text-8xl">A better way to <em className="text-lux-copper">bring ideas</em> to paper.</h1><p className="mt-8 max-w-lg text-base leading-7 text-lux-ink/70 sm:text-lg">Ping &amp; Print gives every student a beautifully simple place to print assignments, project boards, and the work that moves campus forward.</p><div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center"><button onClick={startPrinting} className="touch-target flex items-center gap-4 bg-lux-ink px-7 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-lux-paper transition-transform hover:-translate-y-1">Start printing <ArrowRight size={18} /></button><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-lux-ink/55"><ShieldCheck size={16} className="text-lux-copper" /> Private by default</span></div><div className="mt-10 grid max-w-xl grid-cols-3 border-y border-lux-ink/15 py-4 text-xs"><div><p className="font-extrabold uppercase tracking-[0.12em] text-lux-ink/45">Status</p><p className="mt-1 flex items-center gap-2 font-bold"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Online</p></div><div className="border-l border-lux-ink/15 pl-4"><p className="font-extrabold uppercase tracking-[0.12em] text-lux-ink/45">Formats</p><p className="mt-1 font-bold">PDF · JPG · DOCX</p></div><div className="border-l border-lux-ink/15 pl-4"><p className="font-extrabold uppercase tracking-[0.12em] text-lux-ink/45">Access</p><p className="mt-1 font-bold">Guest friendly</p></div></div></div>
        <div className="perspective-stage relative mx-auto mt-16 h-[290px] max-w-[430px] sm:h-[360px] lg:absolute lg:bottom-8 lg:right-16 lg:mt-0 lg:h-[480px] lg:w-[520px]" aria-label="A student boy and girl using a 3D printer kiosk"><PrinterScene /></div>
      </section>

      <section id="why" className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28"><div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-3 text-xs font-extrabold uppercase tracking-[0.25em] text-lux-copper">The Ping &amp; Print difference</p><h2 className="font-display text-5xl leading-none sm:text-6xl">Small friction.<br /><em>Big relief.</em></h2></div><p className="max-w-xs text-sm leading-6 text-lux-ink/60">A premium campus utility that respects students&apos; time, attention, and work.</p></div><div className="grid gap-px border-y border-lux-ink/15 bg-lux-ink/15 md:grid-cols-3">{BENEFITS.map((benefit, index) => <article key={benefit.title} className="bg-lux-paper p-7 lg:p-10"><span className="font-display text-4xl text-lux-copper">0{index + 1}</span><h3 className="mt-12 text-lg font-extrabold">{benefit.title}</h3><p className="mt-4 text-sm leading-6 text-lux-ink/60">{benefit.body}</p><Check size={20} className="mt-10 text-lux-copper" /></article>)}</div></section>
      <section id="campus" className="bg-lux-ink px-6 py-16 text-lux-paper lg:px-10 lg:py-24"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 md:flex-row md:items-end"><div><p className="mb-4 text-xs font-extrabold uppercase tracking-[0.25em] text-lux-copper">For the places that shape tomorrow</p><h2 className="max-w-2xl font-display text-5xl leading-[0.9] sm:text-7xl">Give your campus<br /><em className="text-lux-sage">room to create.</em></h2></div><button onClick={startPrinting} className="touch-target flex w-fit items-center gap-4 border border-lux-paper/30 px-6 py-4 text-xs font-extrabold uppercase tracking-[0.16em] transition-colors hover:bg-lux-paper hover:text-lux-ink">Use the kiosk <ArrowRight size={17} /></button></div></section>
      <footer className="flex flex-col justify-between gap-3 bg-lux-ink px-6 pb-8 text-xs font-bold uppercase tracking-[0.15em] text-lux-paper/40 sm:flex-row lg:px-10"><span>Ping &amp; Print</span><span>Built for learning in motion</span></footer>
    </main>
  )
}