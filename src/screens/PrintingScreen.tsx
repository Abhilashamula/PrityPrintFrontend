import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Printer, CheckCircle2, AlertTriangle } from 'lucide-react'
import Logo from '../components/Logo'
import { useSessionStore } from '../store/sessionStore'
import { apiClient } from '../lib/apiClient'
import type { JobStatus } from '../types'

type PrintPhase = Extract<JobStatus, 'queued' | 'printing' | 'done' | 'jammed' | 'failed'>

function mapStatus(orderStatus: string, printJobStatus: string): PrintPhase {
  if (orderStatus === 'COMPLETED' || printJobStatus === 'COMPLETED') return 'done'
  if (orderStatus === 'FAILED' || orderStatus === 'PRINT_FAILED' || printJobStatus === 'FAILED') return 'failed'
  if (orderStatus === 'PRINTING' || printJobStatus === 'PRINTING' || printJobStatus === 'SUBMITTED' || printJobStatus === 'SUBMITTING') return 'printing'
  return 'queued'
}

function usePrinterJob(orderId: string | null) {
  const setJobStatus = useSessionStore((s) => s.setJobStatus)
  const [phase, setPhase] = useState<PrintPhase>('queued')
  const [completed, setCompleted] = useState(0)

  useEffect(() => {
    if (!orderId) return

    let cancelled = false
    const poll = async () => {
      try {
        const status = await apiClient.printOrderStatus(orderId)
        if (cancelled) return
        const nextPhase = mapStatus(status.orderStatus, status.printJobStatus)
        setPhase(nextPhase)
        setCompleted(status.pagesCompleted)
        setJobStatus(nextPhase, status.pagesCompleted)
      } catch {
        if (!cancelled) {
          setPhase('failed')
          setJobStatus('failed', 0)
        }
      }
    }

    void poll()
    const interval = window.setInterval(() => void poll(), 2500)
    return () => { cancelled = true; window.clearInterval(interval) }
  }, [orderId, setJobStatus])

  return { phase, completed }
}

// ── Animated printer SVG ──────────────────────────────────────────────────────
function PrinterAnimation({ printing }: { printing: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      <div className={`flex h-32 w-32 items-center justify-center rounded-[28px] border border-white/10 bg-lux-ink text-lux-paper shadow-[18px_20px_0_rgba(199,121,82,0.18),0_24px_50px_rgba(23,33,31,0.18)]
                       ${printing ? 'status-breathe' : ''}`}>
        <Printer size={62} strokeWidth={1.4} />
      </div>
      {printing && (
        <>
          {/* Paper lines animating out of printer */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute bottom-0 left-1/2 h-0.5 w-20 -translate-x-1/2 rounded bg-lux-copper/70"
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
  const orderId        = useSessionStore((s) => s.orderId)
  const totalPages     = useSessionStore((s) => s.totalPages)
  const file           = useSessionStore((s) => s.file)

  const { phase, completed } = usePrinterJob(orderId)

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

  const statusLabel: Record<PrintPhase, string> = {
    queued:   'Sending to printer…',
    printing: `Printing page ${completed} of ${totalPages}…`,
    done:     'Printer service reports the job completed.',
    jammed:   'Paper jam detected',
    failed:   'Printer is unavailable',
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-lux-paper px-5 text-lux-ink screen-enter">
      <div className="luxury-grid pointer-events-none absolute inset-0 opacity-40" />
      <Logo size="sm" className="absolute left-1/2 top-6 z-10 -translate-x-1/2" />

      <div className="surface-enter relative z-10 flex w-full max-w-md flex-col items-center gap-8 border border-lux-ink/10 bg-white/85 px-6 py-10 text-center shadow-[0_24px_60px_rgba(23,33,31,0.1)] backdrop-blur-sm sm:px-10">
        {/* Printer animation */}
        <PrinterAnimation printing={phase === 'printing'} />

        {/* Status */}
        <div>
          <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.24em] text-lux-copper">Live print status</p>
          <h1 className="font-display text-4xl font-semibold leading-none sm:text-5xl">
            {phase === 'done'   ? 'Job completed'
            : phase === 'jammed' ? 'Jam detected'
            : phase === 'failed' ? 'Printer unavailable'
            : 'Printing in Progress'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-lux-ink/60 sm:text-base">{statusLabel[phase]}</p>
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
            <div className="h-3 w-full overflow-hidden rounded-full bg-lux-ink/10">
              <div
                className="h-full rounded-full bg-lux-copper transition-all duration-500"
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
          <div className="flex items-center gap-3 text-lux-ink/60">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-lux-copper border-t-transparent" />
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

        <p className="border-t border-lux-ink/10 pt-5 text-xs leading-5 text-lux-ink/45">
          Please do not leave the kiosk — collect your prints from the output tray below.
        </p>
      </div>
    </div>
  )
}
