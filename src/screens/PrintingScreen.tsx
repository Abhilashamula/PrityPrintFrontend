import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Printer, CheckCircle2, AlertTriangle } from 'lucide-react'
import Logo from '../components/Logo'
import { useSessionStore } from '../store/sessionStore'
import { startLocalPrintJob } from '../lib/localBackend'
import type { JobStatus } from '../types'

type SimPhase = Extract<JobStatus, 'queued' | 'printing' | 'done' | 'jammed' | 'failed'>

function usePrinterJob(totalPages: number, orderId: string | null) {
  const setJobStatus = useSessionStore((s) => s.setJobStatus)
  const [phase, setPhase] = useState<SimPhase>('queued')
  const [completed, setCompleted] = useState(0)

  useEffect(() => {
    if (!orderId) return

    let job: { cancel: () => void }
    try {
      job = startLocalPrintJob(orderId, ({ status, pagesCompleted }) => {
        setPhase(status)
        setCompleted(pagesCompleted)
        setJobStatus(status, pagesCompleted)
      })
    } catch {
      setPhase('failed')
      setJobStatus('failed', 0)
      return
    }

    return job.cancel
  }, [orderId, setJobStatus, totalPages])

  return { phase, completed }
}

// ── Animated printer SVG ──────────────────────────────────────────────────────
function PrinterAnimation({ printing }: { printing: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br from-pp-blue to-pp-blue-dark
                       flex items-center justify-center shadow-2xl
                       ${printing ? 'animate-pulse' : ''}`}>
        <Printer size={64} className="text-white" strokeWidth={1.5} />
      </div>
      {printing && (
        <>
          {/* Paper lines animating out of printer */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-0.5 bg-white/60 rounded"
              style={{
                animation: `slideDown 1.2s ease-in-out ${i * 0.4}s infinite`,
                transform: `translateX(-50%) translateY(${(i + 1) * 10}px)`,
              }}
            />
          ))}
        </>
      )}
    </div>
  )
}

export default function PrintingScreen() {
  const navigate       = useNavigate()
  const paymentId      = useSessionStore((s) => s.paymentId)
  const localOrderId   = useSessionStore((s) => s.localOrderId)
  const totalPages     = useSessionStore((s) => s.totalPages)
  const file           = useSessionStore((s) => s.file)

  const { phase, completed } = usePrinterJob(totalPages, localOrderId)

  // Guard: redirect if no payment
  useEffect(() => {
    if (!paymentId) navigate('/pay', { replace: true })
  }, [paymentId, navigate])

  // Navigate when done
  useEffect(() => {
    if (phase === 'done') {
      const t = setTimeout(() => navigate('/done'), 1200)
      return () => clearTimeout(t)
    }
    if (phase === 'jammed' || phase === 'failed') {
      const t = setTimeout(() => navigate('/error'), 1500)
      return () => clearTimeout(t)
    }
  }, [phase, navigate])

  const progressPct = totalPages > 0 ? Math.round((completed / totalPages) * 100) : 0

  const statusLabel: Record<SimPhase, string> = {
    queued:   'Sending to printer…',
    printing: `Printing page ${completed} of ${totalPages}…`,
    done:     'Printing complete!',
    jammed:   'Paper jam detected',
    failed:   'Printer is unavailable',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pp-blue-lighter/30 to-pp-bg
                    flex flex-col items-center justify-center screen-enter">
      <Logo size="sm" className="absolute top-6 left-1/2 -translate-x-1/2" />

      <div className="flex flex-col items-center gap-8 px-8 max-w-md text-center">
        {/* Printer animation */}
        <PrinterAnimation printing={phase === 'printing'} />

        {/* Status */}
        <div>
          <h1 className="text-3xl font-black text-pp-dark">
            {phase === 'done'   ? '✅ Done!'
            : phase === 'jammed' ? '⚠️ Jam Detected'
            : phase === 'failed' ? '⚠️ Printer Unavailable'
            : 'Printing in Progress'}
          </h1>
          <p className="text-pp-gray mt-2 text-lg">{statusLabel[phase]}</p>
          {file && (
            <p className="text-pp-gray/60 text-sm mt-1 truncate max-w-xs">{file.name}</p>
          )}
        </div>

        {/* Progress bar */}
        {(phase === 'printing' || phase === 'done') && (
          <div className="w-full">
            <div className="flex justify-between text-sm text-pp-gray mb-2">
              <span>{completed} of {totalPages} pages</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full bg-pp-blue/15 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pp-blue to-pp-blue-dark rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}

        {/* Queued spinner */}
        {phase === 'queued' && (
          <div className="flex items-center gap-3 text-pp-gray">
            <div className="w-6 h-6 border-3 border-pp-blue border-t-transparent rounded-full animate-spin" />
            <span>Connecting to printer…</span>
          </div>
        )}

        {/* Done check */}
        {phase === 'done' && (
          <CheckCircle2 size={56} className="text-green-500 animate-fade-in" />
        )}

        {/* Jam warning */}
        {(phase === 'jammed' || phase === 'failed') && (
          <AlertTriangle size={56} className="text-amber-500 animate-fade-in" />
        )}

        <p className="text-pp-dark/40 text-sm">
          Please do not leave the kiosk — collect your prints from the output tray below.
        </p>
      </div>
    </div>
  )
}
