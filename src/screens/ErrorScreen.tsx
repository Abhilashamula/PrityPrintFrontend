import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, RotateCcw, Home, IndianRupee } from 'lucide-react'
import Logo from '../components/Logo'
import SupportContact from '../components/SupportContact'
import { useSessionStore } from '../store/sessionStore'

export default function ErrorScreen() {
  const navigate     = useNavigate()
  const jobStatus    = useSessionStore((s) => s.jobStatus)
  const refundAmount = useSessionStore((s) => s.refundAmount)
  const totalCost    = useSessionStore((s) => s.totalCost)
  const pagesCompleted = useSessionStore((s) => s.pagesCompleted)
  const totalPages   = useSessionStore((s) => s.totalPages)
  const reset        = useSessionStore((s) => s.reset)

  // Guard
  useEffect(() => {
    if (!jobStatus || (jobStatus !== 'jammed' && jobStatus !== 'failed')) {
      // If landed here without a real error, treat as unknown — stay on page
    }
  }, [jobStatus, navigate])

  // Auto-reset after 60 s
  useEffect(() => {
    const t = setTimeout(() => { reset(); navigate('/') }, 60_000)
    return () => clearTimeout(t)
  }, [reset, navigate])

  const isJam        = jobStatus === 'jammed'
  const pagesNotDone = Math.max(0, totalPages - pagesCompleted)
  const refundAmt    = refundAmount ?? (pagesNotDone > 0 ? null : 0)

  const handleRetry = () => {
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
        {/* Warning icon */}
        <div className="status-breathe flex h-24 w-24 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle size={64} className="text-amber-500" />
        </div>

        {/* Message */}
        <div>
          <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.24em] text-amber-700">Attention required</p>
          <h1 className="font-display text-5xl font-semibold leading-none">
            {isJam ? 'Paper Jam Detected' : 'Print Job Failed'}
          </h1>
          <p className="text-pp-gray mt-3">
            {isJam
              ? `There was a paper jam after printing ${pagesCompleted} of ${totalPages} pages.`
              : 'Your print job could not be completed due to a printer error.'
            }
          </p>
        </div>

        {/* Refund card */}
        <div className="w-full overflow-hidden border border-amber-200 bg-white text-left">
          <div className="bg-amber-500 px-5 py-3">
            <p className="text-white font-bold flex items-center gap-2">
              <IndianRupee size={18} /> Refund Status
            </p>
          </div>
          <div className="px-5 py-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-pp-gray">Pages printed</span>
              <span className="text-pp-dark font-semibold">{pagesCompleted} of {totalPages}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-pp-gray">Amount paid</span>
              <span className="text-pp-dark font-semibold">₹{totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-amber-100 pt-3">
              <span className="text-pp-gray font-semibold">Refund due</span>
              <span className="text-amber-600 font-black text-base">
                {refundAmt !== null
                  ? `₹${refundAmt.toFixed(2)}`
                  : 'Calculating…'
                }
              </span>
            </div>
            {refundAmt !== null && (
              <p className="text-pp-gray/70 text-xs">
                {refundAmt > 0
                  ? 'Your refund has been initiated. It will appear in your account within 5–7 business days.'
                  : 'All pages were printed — no refund is due.'}
              </p>
            )}
            {refundAmt === null && (
              <p className="text-pp-gray/70 text-xs">
                Our team has been alerted and will process your refund manually within 24 hours.
              </p>
            )}
          </div>
        </div>

        {/* Support */}
        <SupportContact />

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleRetry}
            className="touch-target flex w-full items-center justify-center gap-3 bg-lux-copper py-4 text-sm font-extrabold uppercase tracking-[0.1em] text-white shadow-lg hover:bg-[#b26743]"
          >
            <RotateCcw size={22} /> Try Again
          </button>
          <button
            onClick={handleHome}
            className="touch-target w-full border border-lux-ink/15 bg-white py-4 text-sm font-bold text-lux-ink hover:border-lux-copper"
          >
            <Home size={18} className="inline mr-2" />
            Return to Home
          </button>
        </div>

        <Logo size="sm" className="opacity-40" />
        <p className="text-pp-dark/25 text-xs">
          This screen will return to home automatically in 60 seconds.
        </p>
      </div>
    </div>
  )
}
