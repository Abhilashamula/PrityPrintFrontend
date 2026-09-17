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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-pp-bg
                    flex flex-col items-center justify-center screen-enter px-6">
      <div className="flex flex-col items-center gap-8 max-w-lg text-center">
        {/* Warning icon */}
        <div className="w-28 h-28 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertTriangle size={64} className="text-amber-500" />
        </div>

        {/* Message */}
        <div>
          <h1 className="text-3xl font-black text-pp-dark">
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
        <div className="w-full bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
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
            className="w-full bg-pp-orange hover:bg-pp-orange-dark text-white font-black text-lg
                       py-5 rounded-2xl touch-target flex items-center justify-center gap-3
                       transition-colors shadow-lg"
          >
            <RotateCcw size={22} /> Try Again
          </button>
          <button
            onClick={handleHome}
            className="w-full bg-white border-2 border-pp-blue/25 hover:border-pp-blue
                       text-pp-dark font-bold text-base py-4 rounded-2xl touch-target
                       transition-colors"
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

