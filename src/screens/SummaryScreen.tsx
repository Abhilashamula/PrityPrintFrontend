import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Edit2, FileCheck2, LockKeyhole, Phone, Printer, ShieldCheck, Sparkles } from 'lucide-react'
import FilePreview from '../components/FilePreview'
import SupportContact from '../components/SupportContact'
import { useSessionStore } from '../store/sessionStore'
import { useKioskStatus } from '../hooks/useKioskStatus'
import { createLocalOrder } from '../lib/localBackend'
import { PAPER_DIMENSIONS_MM } from '../types'
import AccountMenu from '../components/AccountMenu'
import { apiClient } from '../lib/apiClient'

export default function SummaryScreen() {
  const navigate      = useNavigate()
  const file          = useSessionStore((s) => s.file)
  const filePreviewUrl = useSessionStore((s) => s.filePreviewUrl)
  const parsedPageCount = useSessionStore((s) => s.parsedPageCount)
  const printOptions  = useSessionStore((s) => s.printOptions)
  const totalPages    = useSessionStore((s) => s.totalPages)
  const totalCost     = useSessionStore((s) => s.totalCost)
  const pricing       = useSessionStore((s) => s.pricing)
  const phone         = useSessionStore((s) => s.phone)
  const setPhone      = useSessionStore((s) => s.setPhone)
  const setOrder      = useSessionStore((s) => s.setOrder)

  const { isPaperOut } = useKioskStatus()
  const [loading, setLoading] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) navigate('/upload', { replace: true })
  }, [file, navigate])

  const handleProceed = async () => {
    if (!file || isPaperOut) return
    setLoading(true)
    setOrderError(null)
    try {
      const order = createLocalOrder({
        kioskId: useSessionStore.getState().kioskId,
        fileName: file.name,
        totalPages,
        totalCost,
        paperSize: printOptions.paperSize,
        paperWidthMm: PAPER_DIMENSIONS_MM[printOptions.paperSize].width,
        paperHeightMm: PAPER_DIMENSIONS_MM[printOptions.paperSize].height,
      })
      const razorpayOrder = await apiClient.createRazorpayOrder(
        Math.round(totalCost * 100),
        `print_${order.id}`,
      )
      setOrder(order.id, razorpayOrder.id)
      navigate('/pay')
    } catch (error) {
      setLoading(false)
      setOrderError(error instanceof Error ? error.message : 'Could not create the order.')
    }
  }

  const rows = [
    ['File',        file?.name ?? '—'],
    ['Total pages to print', `${totalPages} pages`],
    ['Copies',      `${printOptions.copies}×`],
    ['Orientation', printOptions.orientation === 'portrait' ? '↕ Portrait' : '↔ Landscape'],
    ['Sides',       printOptions.sides === 'single' ? 'Single-sided' : 'Double-sided'],
    ['Color mode',  printOptions.colorMode === 'bw' ? '⬛ Black & White' : '🎨 Color'],
    ['Page range',  printOptions.pageRange === 'all'
                      ? `All ${parsedPageCount} pages`
                      : printOptions.customPageRange || '—'],
    ['Paper size',  `${printOptions.paperSize} · ${PAPER_DIMENSIONS_MM[printOptions.paperSize].width} × ${PAPER_DIMENSIONS_MM[printOptions.paperSize].height} mm`],
  ]

  return (
    <main className="min-h-screen bg-lux-paper text-lux-ink screen-enter">
      <header className="sticky top-0 z-30 border-b border-lux-ink/10 bg-lux-paper/95 px-4 py-3 backdrop-blur-md sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <button onClick={() => navigate('/options')} className="touch-target flex items-center gap-2 text-sm font-bold text-lux-ink/60 transition-colors hover:text-lux-ink" aria-label="Back to options"><ArrowLeft size={18} /><span className="hidden sm:inline">Back</span></button>
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] sm:gap-3 sm:text-xs"><span className="text-lux-ink/30">Upload</span><span className="text-lux-copper">/</span><span className="text-lux-ink/30">Options</span><span className="text-lux-copper">/</span><span className="flex h-7 w-7 items-center justify-center rounded-full bg-lux-copper text-white">3</span><span>Review</span></div>
          <div className="flex items-center gap-3"><AccountMenu /><span className="flex h-10 w-10 items-center justify-center rounded-full bg-lux-ink text-lux-paper"><Printer size={19} strokeWidth={1.5} /></span></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <section className="min-w-0">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-lux-copper"><Sparkles size={14} /> Almost there</p><h1 className="font-display text-5xl font-semibold leading-none sm:text-6xl">Review your order.</h1><p className="mt-4 text-sm leading-6 text-lux-ink/55 sm:text-base">Everything looks good? We&apos;ll prepare it as soon as payment is confirmed.</p></div><button onClick={() => navigate('/options')} className="touch-target flex items-center gap-2 text-sm font-extrabold text-lux-copper transition-colors hover:text-lux-ink"><Edit2 size={15} /> Edit options</button></div>
          {file && <div className="overflow-hidden rounded-[24px] border border-lux-ink/10 bg-white shadow-[0_16px_40px_rgba(23,33,31,0.07)]"><FilePreview file={file} previewUrl={filePreviewUrl} parsedPageCount={parsedPageCount} /></div>}
          <div className="mt-6 overflow-hidden rounded-[24px] border border-lux-ink/10 bg-white shadow-[0_16px_40px_rgba(23,33,31,0.06)]"><div className="flex items-center gap-3 border-b border-lux-ink/10 px-5 py-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lux-paper text-lux-copper"><FileCheck2 size={18} /></span><div><h2 className="text-sm font-extrabold">Print details</h2><p className="text-xs text-lux-ink/45">Your selected finishing options</p></div></div><dl className="divide-y divide-lux-ink/10">{rows.map(([key, val]) => <div key={key} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-4 px-5 py-3.5 text-sm"><dt className="text-lux-ink/45">{key}</dt><dd className="min-w-0 truncate text-right font-bold text-lux-ink">{val}</dd></div>)}</dl></div>
          <div className="mt-6"><label className="mb-2 flex items-center gap-2 text-sm font-extrabold"><Phone size={16} className="text-lux-copper" /> Phone number <span className="font-normal text-lux-ink/45">(optional for SMS receipt)</span></label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="min-h-[54px] w-full rounded-2xl border border-lux-ink/15 bg-white px-5 text-base text-lux-ink outline-none transition-colors placeholder:text-lux-ink/30 focus:border-lux-copper focus:ring-4 focus:ring-lux-copper/10" /></div>
          <SupportContact compact className="mt-5 !text-lux-ink/55" />
        </section>

        <aside className="h-fit lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-[26px] border border-lux-ink/10 bg-white shadow-[0_18px_50px_rgba(23,33,31,0.09)]"><div className="bg-lux-ink px-6 py-7 text-lux-paper"><p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-lux-paper/55">Your total</p><div className="mt-3 flex items-end justify-between gap-4"><span className="font-display text-6xl leading-none">₹{totalCost.toFixed(2)}</span><span className="rounded-full bg-lux-copper px-3 py-1.5 text-[10px] font-extrabold uppercase">{printOptions.colorMode === 'bw' ? 'B&W' : 'Color'}</span></div><p className="mt-4 text-sm text-lux-paper/60">{totalPages} printable page{totalPages === 1 ? '' : 's'} · updates live</p></div><div className="p-6"><div className="mb-5 flex items-start gap-3 rounded-2xl bg-lux-paper px-4 py-3.5"><LockKeyhole size={18} className="mt-0.5 shrink-0 text-lux-copper" /><p className="text-xs leading-5 text-lux-ink/60">Your document stays private and is removed after printing.</p></div><div className="space-y-2 border-b border-lux-ink/10 pb-5 text-sm"><div className="flex justify-between gap-4"><span className="text-lux-ink/45">Black &amp; white</span><span>₹{pricing.bwPerPage}/page</span></div><div className="flex justify-between gap-4"><span className="text-lux-ink/45">Color</span><span>₹{pricing.colorPerPage}/page</span></div></div><div className="mt-5 flex items-center gap-2 text-xs font-bold text-lux-ink/55"><ShieldCheck size={16} className="text-lux-copper" /> Secure payment ready</div></div></div>
          {isPaperOut && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">This kiosk is out of paper. Payment is disabled until it is refilled.</div>}
          {orderError && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{orderError}</div>}
          <button onClick={handleProceed} disabled={loading || isPaperOut || totalPages === 0} className="mt-5 flex min-h-[60px] w-full items-center justify-center gap-3 rounded-[18px] bg-lux-copper px-5 py-4 text-sm font-extrabold uppercase tracking-[0.1em] text-white shadow-[0_14px_28px_rgba(199,121,82,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#b26743] disabled:cursor-not-allowed disabled:opacity-40">{loading ? <><div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Creating order...</> : <>Proceed to payment <ArrowRight size={19} /></>}</button><p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-lux-ink/45"><Check size={14} className="text-lux-copper" /> Documents are deleted after printing</p>
        </aside>
      </div>
    </main>
  )
}
