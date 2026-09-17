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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-pp-bg
                    flex flex-col items-center justify-center screen-enter px-6">
      <div className="flex flex-col items-center gap-8 max-w-lg text-center">
        {/* Success icon */}
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 size={64} className="text-green-500" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-pp-blue
                          flex items-center justify-center shadow-md">
            <PrinterCheck size={20} className="text-white" />
          </div>
        </div>

        {/* Message */}
        <div>
          <h1 className="text-4xl font-black text-pp-dark">Your prints are ready!</h1>
          <p className="text-xl text-pp-gray mt-3">
            Please collect your document from the{' '}
            <strong className="text-pp-dark">output tray</strong> below the printer.
          </p>
        </div>

        {/* Receipt card */}
        <div className="w-full bg-white rounded-2xl border border-pp-blue/15 shadow-sm overflow-hidden">
          <div className="bg-pp-blue px-5 py-3">
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
            className="w-full bg-pp-orange hover:bg-pp-orange-dark text-white font-black text-lg
                       py-5 rounded-2xl touch-target flex items-center justify-center gap-3
                       transition-colors shadow-lg"
          >
            <RotateCcw size={22} /> Print Another Document
          </button>
          <button
            onClick={handleHome}
            className="w-full bg-white border-2 border-pp-blue/25 hover:border-pp-blue
                       text-pp-dark font-bold text-base py-4 rounded-2xl touch-target
                       transition-colors"
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
