import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, PrinterCheck, RotateCcw } from 'lucide-react'
import Logo from '../components/Logo'
import SupportContact from '../components/SupportContact'
import { useSessionStore } from '../store/sessionStore'

export default function DoneScreen() {
  const navigate    = useNavigate()
  const file        = useSessionStore((s) => s.file)
  const totalPages  = useSessionStore((s) => s.totalPages)
  const totalCost   = useSessionStore((s) => s.totalCost)
  const paymentId   = useSessionStore((s) => s.paymentId)
  const phone       = useSessionStore((s) => s.phone)
  const reset       = useSessionStore((s) => s.reset)

  // Guard
  useEffect(() => {
    if (!paymentId) navigate('/', { replace: true })
  }, [paymentId, navigate])

  // Auto-reset and return home after 45 s of inactivity (kiosk UX)
  useEffect(() => {
    const t = setTimeout(() => {
      reset()
      navigate('/')
    }, 45_000)
    return () => clearTimeout(t)
  }, [reset, navigate])

  const handlePrintAnother = () => {
    reset()
    navigate('/upload')
  }

  const handleHome = () => {
    reset()
    navigate('/')
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-lux-paper px-4 py-12 text-lux-ink screen-enter sm:px-6">
      <div className="luxury-grid pointer-events-none absolute inset-0 opacity-35" />
      <div className="surface-enter relative z-10 flex w-full max-w-lg flex-col items-center gap-7 border border-lux-ink/10 bg-white/90 px-5 py-9 text-center shadow-[0_24px_60px_rgba(23,33,31,0.1)] sm:px-9">
        {/* Success icon */}
        <div className="relative">
          <div className="status-breathe flex h-24 w-24 items-center justify-center rounded-full bg-[#e5f3ea]">
            <CheckCircle2 size={55} className="text-[#287a50]" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-pp-blue
                          flex items-center justify-center shadow-md">
            <PrinterCheck size={20} className="text-white" />
          </div>
        </div>

        {/* Message */}
        <div>
          <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#287a50]">Ready to collect</p>
          <h1 className="font-display text-5xl font-semibold leading-none">Print job completed.</h1>
          <p className="mt-4 text-sm leading-6 text-lux-ink/60 sm:text-base">
            Epson Connect reports this job as completed. Please check the selected printer&apos;s output tray.
          </p>
        </div>

        {/* Receipt card */}
        <div className="w-full overflow-hidden border border-lux-ink/10 bg-white text-left">
          <div className="bg-lux-ink px-5 py-3">
            <p className="text-white font-bold">Receipt</p>
          </div>
          <div className="px-5 py-4 space-y-2 text-sm">
            {[
              ['File',         file?.name ?? '—'],
              ['Pages printed',`${totalPages}`],
              ['Amount paid',  `₹${totalCost.toFixed(2)}`],
              ['Payment ID',   paymentId ?? '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-pp-gray">{k}</span>
                <span className="text-pp-dark font-semibold truncate max-w-[55%] text-right">{v}</span>
              </div>
            ))}
            {phone && (
              <div className="flex justify-between">
                <span className="text-pp-gray">SMS receipt sent to</span>
                <span className="text-pp-dark font-semibold">{phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handlePrintAnother}
            className="touch-target flex w-full items-center justify-center gap-3 bg-lux-copper py-4 text-sm font-extrabold uppercase tracking-[0.1em] text-white shadow-lg hover:bg-[#b26743]"
          >
            <RotateCcw size={22} /> Print Another Document
          </button>
          <button
            onClick={handleHome}
            className="touch-target w-full border border-lux-ink/15 bg-white py-4 text-sm font-bold text-lux-ink hover:border-lux-copper"
          >
            Return to Home
          </button>
        </div>

        <SupportContact compact />

        <Logo size="sm" className="opacity-50" />

        <p className="text-pp-dark/25 text-xs">
          This screen will return to home automatically in 45 seconds.
        </p>
      </div>
    </div>
  )
}
