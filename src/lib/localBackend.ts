import type { JobStatus, PaperSize } from '../types'
import { startSimulatedPrintJob, type CancellablePrintJob } from './printerSimulator'

export interface LocalOrderRequest {
  kioskId: string
  printerId: string
  fileName: string
  totalPages: number
  totalCost: number
  paperSize: PaperSize
  paperWidthMm: number
  paperHeightMm: number
}

export interface LocalOrder {
  id: string
  gatewayOrderId: string
  kioskId: string
  printerId: string
  fileName: string
  totalPages: number
  totalCost: number
  paperSize: PaperSize
  paperWidthMm: number
  paperHeightMm: number
  status: 'created' | 'paid' | 'queued' | 'printing' | 'done' | 'jammed' | 'failed'
  paymentId: string | null
  jobId: string | null
}

export interface LocalJobUpdate {
  status: JobStatus
  pagesCompleted: number
  pagesTotal: number
  reason?: 'OFFLINE' | 'PAPER_OUT' | 'PAPER_JAM'
}

const orders = new Map<string, LocalOrder>()
const activeJobs = new Map<string, CancellablePrintJob>()

function id(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function simulatorIsUnavailable(): boolean {
  const mode = import.meta.env.VITE_PRINTER_SIM_MODE
  return mode === 'offline' || mode === 'paper_out'
}

export function createLocalOrder(request: LocalOrderRequest): LocalOrder {
  if (request.totalPages < 1 || request.totalCost <= 0) {
    throw new Error('Order must contain at least one page and a positive amount.')
  }

  if (simulatorIsUnavailable()) {
    throw new Error('The printer is unavailable. Payment cannot be started.')
  }

  const order: LocalOrder = {
    ...request,
    id: id('ord_local'),
    gatewayOrderId: id('gateway_mock'),
    status: 'created',
    paymentId: null,
    jobId: null,
  }
  orders.set(order.id, order)
  return order
}

/** Mock payment boundary. Replace this function with server-created Razorpay orders later. */
export function confirmLocalPayment(orderId: string): LocalOrder {
  const order = getLocalOrder(orderId)
  if (order.status === 'paid' || order.status === 'queued' || order.status === 'printing' || order.status === 'done') {
    return order
  }
  if (order.status !== 'created') throw new Error('This order cannot be paid.')

  order.status = 'paid'
  order.paymentId = id('pay_sim')
  order.jobId = id('job_local')
  order.status = 'queued'
  return order
}

export function startLocalPrintJob(
  orderId: string,
  onUpdate: (update: LocalJobUpdate) => void,
): CancellablePrintJob {
  const order = getLocalOrder(orderId)
  if (!order.paymentId || !order.jobId) throw new Error('A verified payment is required before printing.')

  const existing = activeJobs.get(order.id)
  if (existing) return existing

  const job = startSimulatedPrintJob({
    totalPages: order.totalPages,
    onUpdate: (update) => {
      order.status = update.status === 'printing' ? 'printing' : update.status
      onUpdate(update)
      if (update.status === 'done' || update.status === 'jammed' || update.status === 'failed') {
        activeJobs.delete(order.id)
      }
    },
  })
  activeJobs.set(order.id, job)
  return job
}

export function getLocalOrder(orderId: string): LocalOrder {
  const order = orders.get(orderId)
  if (!order) throw new Error('Order was not found or has expired.')
  return order
}
