// ─── Shared Domain Types ──────────────────────────────────────────────────────

export type ColorMode   = 'bw' | 'color'
export type Orientation = 'portrait' | 'landscape'
export type Sides       = 'single' | 'double'
export type PageRange   = 'all' | 'custom'
export type PaperSize   = 'A4' | 'A6'

export const PAPER_DIMENSIONS_MM: Record<PaperSize, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A6: { width: 105, height: 148 },
}

export interface PrintOptions {
  copies:          number
  orientation:     Orientation
  sides:           Sides
  colorMode:       ColorMode
  pageRange:       PageRange
  customPageRange: string   // e.g. "1-5, 8, 10-12"
  paperSize:       PaperSize
}

export interface PricingConfig {
  bwPerPage:    number   // ₹ per page B&W
  colorPerPage: number   // ₹ per page Color
  maxFileMb:    number   // upload size limit
}

// Job status values produced by the printer bridge / backend
export type JobStatus =
  | 'queued'
  | 'printing'
  | 'done'
  | 'jammed'
  | 'failed'

export interface JobStatusDetail {
  status:         JobStatus
  pagesCompleted: number
  pagesTotal:     number
}

// Kiosk health status from the backend heartbeat
export interface KioskHealth {
  paperCount:  number   // current paper tray count
  status:      'online' | 'offline' | 'error'
  lastSeenAt:  string | null
}

// Razorpay globals (injected via <script> in index.html)
declare global {
  interface Window {
    Razorpay: new (opts: RazorpayOptions) => RazorpayInstance
  }
}

export interface RazorpayOptions {
  key:          string
  amount:       number   // paise
  currency:     string
  name:         string
  description:  string
  order_id:     string
  prefill?:     { contact?: string; email?: string }
  theme?:       { color?: string }
  handler:      (response: RazorpaySuccessResponse) => void
  modal?:       { ondismiss?: () => void }
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id:  string
  razorpay_order_id:    string
  razorpay_signature:   string
}

export interface RazorpayInstance {
  open: () => void
  on:   (event: string, handler: () => void) => void
}

