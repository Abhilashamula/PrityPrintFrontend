import { create } from 'zustand'
import type { PrintOptions, JobStatus, PricingConfig } from '../types'

// ─── Default values ───────────────────────────────────────────────────────────

export const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  copies:          1,
  orientation:     'portrait',
  sides:           'single',
  colorMode:       'bw',
  pageRange:       'all',
  customPageRange: '',
  paperSize:       'A4',
}

export const DEFAULT_PRICING: PricingConfig = {
  bwPerPage:    Number(import.meta.env.VITE_PRICE_BW    ?? 2),
  colorPerPage: Number(import.meta.env.VITE_PRICE_COLOR ?? 10),
  maxFileMb:    Number(import.meta.env.VITE_MAX_FILE_MB ?? 20),
}

// ─── State shape ─────────────────────────────────────────────────────────────

interface SessionState {
  // Kiosk identification
  kioskId: string
  selectedPrinterId: string | null
  selectedPrinterName: string | null

  // Upload step
  file:            File | null
  filePreviewUrl:  string | null    // data URL for image / canvas for PDF first page
  parsedPageCount: number
  documentId: string | null

  // Options step
  printOptions: PrintOptions

  // Summary step
  phone:         string
  totalPages:    number             // computed from page range × copies
  totalCost:     number             // computed cost in ₹

  // Pricing (fetched from DB; falls back to env defaults)
  pricing: PricingConfig

  // Payment step
  orderId:          string | null   // our DB order ID
  localOrderId:     string | null   // development simulator order ID
  razorpayOrderId:  string | null   // Razorpay order ID
  paymentId:        string | null   // Razorpay payment ID

  // Printing step
  jobStatus:      JobStatus | null
  pagesCompleted: number
  refundAmount:   number | null     // set when jammed + partial refund issued
}

// ─── Actions ─────────────────────────────────────────────────────────────────

interface SessionActions {
  setKioskId:      (id: string) => void
  setPrinter:      (id: string, name: string) => void
  setFile:         (file: File | null, previewUrl: string | null, pageCount: number) => void
  setDocumentId:   (id: string | null) => void
  setPrintOptions: (opts: Partial<PrintOptions>) => void
  setPricing:      (pricing: PricingConfig) => void
  setPhone:        (phone: string) => void
  updateCost:      () => void
  setOrder:        (orderId: string, razorpayOrderId: string) => void
  setLocalOrderId:  (orderId: string | null) => void
  setPayment:      (paymentId: string) => void
  setJobStatus:    (status: JobStatus, pagesCompleted: number) => void
  setRefund:       (amount: number) => void
  reset:           () => void
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initial: SessionState = {
  kioskId:         import.meta.env.VITE_KIOSK_ID ?? 'kiosk_001',
  selectedPrinterId: null,
  selectedPrinterName: null,
  file:            null,
  filePreviewUrl:  null,
  parsedPageCount: 0,
  documentId:       null,
  printOptions:    DEFAULT_PRINT_OPTIONS,
  phone:           '',
  totalPages:      0,
  totalCost:       0,
  pricing:         DEFAULT_PRICING,
  orderId:         null,
  localOrderId:    null,
  razorpayOrderId: null,
  paymentId:       null,
  jobStatus:       null,
  pagesCompleted:  0,
  refundAmount:    null,
}

// ─── Price helpers ────────────────────────────────────────────────────────────

function computePages(pageCount: number, opts: PrintOptions): number {
  if (pageCount === 0) return 0
  const pagesInRange =
    opts.pageRange === 'all'
      ? pageCount
      : countCustomRange(opts.customPageRange, pageCount)
  return pagesInRange * opts.copies
}

function countCustomRange(rangeStr: string, max: number): number {
  if (!rangeStr.trim()) return max
  const pages = new Set<number>()
  for (const part of rangeStr.split(',')) {
    const t = part.trim()
    const match = t.match(/^(\d+)-(\d+)$/)
    if (match) {
      const lo = Math.max(1, parseInt(match[1]))
      const hi = Math.min(max, parseInt(match[2]))
      for (let p = lo; p <= hi; p++) pages.add(p)
    } else {
      const n = parseInt(t)
      if (!isNaN(n) && n >= 1 && n <= max) pages.add(n)
    }
  }
  return pages.size
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useSessionStore = create<SessionState & SessionActions>((set, get) => ({
  ...initial,

  setKioskId: (id) => set({ kioskId: id }),

  setPrinter: (id, name) => set({ selectedPrinterId: id, selectedPrinterName: name }),

  setFile: (file, filePreviewUrl, parsedPageCount) => {
    set({ file, filePreviewUrl, parsedPageCount })
    // Re-compute cost with new page count
    const { printOptions, pricing } = get()
    const totalPages = computePages(parsedPageCount, printOptions)
    const pricePerPage =
      printOptions.colorMode === 'color' ? pricing.colorPerPage : pricing.bwPerPage
    set({ totalPages, totalCost: totalPages * pricePerPage })
  },

  setDocumentId: (documentId) => set({ documentId }),

  setPrintOptions: (opts) => {
    const merged = { ...get().printOptions, ...opts }
    set({ printOptions: merged })
    // Re-compute cost
    const { parsedPageCount, pricing } = get()
    const totalPages = computePages(parsedPageCount, merged)
    const pricePerPage =
      merged.colorMode === 'color' ? pricing.colorPerPage : pricing.bwPerPage
    set({ totalPages, totalCost: totalPages * pricePerPage })
  },

  setPricing: (pricing) => {
    set({ pricing })
    // Re-compute with new pricing
    const { parsedPageCount, printOptions } = get()
    const totalPages = computePages(parsedPageCount, printOptions)
    const pricePerPage =
      printOptions.colorMode === 'color' ? pricing.colorPerPage : pricing.bwPerPage
    set({ totalPages, totalCost: totalPages * pricePerPage })
  },

  setPhone: (phone) => set({ phone }),

  updateCost: () => {
    const { parsedPageCount, printOptions, pricing } = get()
    const totalPages = computePages(parsedPageCount, printOptions)
    const pricePerPage =
      printOptions.colorMode === 'color' ? pricing.colorPerPage : pricing.bwPerPage
    set({ totalPages, totalCost: totalPages * pricePerPage })
  },

  setOrder: (orderId, razorpayOrderId) => set({ orderId, razorpayOrderId }),

  setLocalOrderId: (localOrderId) => set({ localOrderId }),

  setPayment: (paymentId) => set({ paymentId }),

  setJobStatus: (jobStatus, pagesCompleted) => set({ jobStatus, pagesCompleted }),

  setRefund: (refundAmount) => set({ refundAmount }),

  reset: () => {
    // Release object URL to avoid memory leaks
    const prev = get().filePreviewUrl
    if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
    set({ ...initial, pricing: get().pricing, kioskId: get().kioskId })
  },
}))

