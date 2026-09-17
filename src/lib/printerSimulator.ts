import type { JobStatus } from '../types'

export type PrinterSimulationMode =
  | 'normal'
  | 'offline'
  | 'paper_out'
  | 'jam_before_print'
  | 'jam_after_40_percent'

export interface PrintSimulationJob {
  totalPages: number
  mode?: PrinterSimulationMode
  pageIntervalMs?: number
  onUpdate: (update: PrintSimulationUpdate) => void
}

export interface PrintSimulationUpdate {
  status: JobStatus
  pagesCompleted: number
  pagesTotal: number
  reason?: 'OFFLINE' | 'PAPER_OUT' | 'PAPER_JAM'
}

export interface CancellablePrintJob {
  cancel: () => void
}

const DEFAULT_PAGE_INTERVAL_MS = 350

function configuredMode(): PrinterSimulationMode {
  const mode = import.meta.env.VITE_PRINTER_SIM_MODE as PrinterSimulationMode | undefined
  return mode ?? 'normal'
}

/**
 * Local stand-in for the printer bridge. The backend can later call the same
 * lifecycle through an API without changing the screen's state handling.
 */
export function startSimulatedPrintJob({
  totalPages,
  mode = configuredMode(),
  pageIntervalMs = DEFAULT_PAGE_INTERVAL_MS,
  onUpdate,
}: PrintSimulationJob): CancellablePrintJob {
  let cancelled = false
  let startTimer: ReturnType<typeof setTimeout> | undefined
  let pageTimer: ReturnType<typeof setInterval> | undefined

  const update = (status: JobStatus, pagesCompleted: number, reason?: PrintSimulationUpdate['reason']) => {
    if (!cancelled) onUpdate({ status, pagesCompleted, pagesTotal: totalPages, reason })
  }

  const cleanup = () => {
    if (startTimer) clearTimeout(startTimer)
    if (pageTimer) clearInterval(pageTimer)
  }

  const cancel = () => {
    cancelled = true
    cleanup()
  }

  update('queued', 0)

  startTimer = setTimeout(() => {
    if (cancelled) return

    if (mode === 'offline') {
      update('failed', 0, 'OFFLINE')
      return
    }

    if (mode === 'paper_out') {
      update('failed', 0, 'PAPER_OUT')
      return
    }

    if (mode === 'jam_before_print') {
      update('jammed', 0, 'PAPER_JAM')
      return
    }

    update('printing', 0)
    let printedPages = 0
    const jamPage = Math.max(1, Math.ceil(totalPages * 0.4))

    pageTimer = setInterval(() => {
      if (cancelled) return

      printedPages = Math.min(printedPages + 1, totalPages)

      if (mode === 'jam_after_40_percent' && printedPages >= jamPage) {
        cleanup()
        update('jammed', printedPages, 'PAPER_JAM')
        return
      }

      update('printing', printedPages)

      if (printedPages >= totalPages) {
        cleanup()
        update('done', totalPages)
      }
    }, Math.max(100, pageIntervalMs))
  }, 700)

  return { cancel }
}
