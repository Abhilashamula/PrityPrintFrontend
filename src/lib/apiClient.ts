const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

export interface ApiUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
  age: number
  gender: string
  phone: string
  wallet: {
    balanceMinor: number
    currency: string
  }
}

export interface AuthResponse {
  accessToken: string
  user: ApiUser
}

export interface AvailablePrinter {
  id: string
  name: string
  location: string
  status: 'ONLINE' | 'BUSY' | 'OFFLINE' | 'PAPER_OUT' | 'ERROR' | string
}

export interface PrinterMediaOption {
  id: string
  paperSize: string
  paperType: string
  colorModes: string[]
  duplexSupported: boolean
  priceBwMinor: number
  priceColorMinor: number
}

export interface PrinterCapabilities {
  printerId: string
  available: boolean
  pageRangeSupported: boolean
  landscapeSupported: boolean
  mediaOptions: PrinterMediaOption[]
}

export interface AdminPrinter {
  id: string
  name: string
  location: string
  status: string
  active: boolean
  provider: 'EPSON_CONNECT' | 'LOCAL_AGENT' | string
  manufacturer: string | null
  model: string | null
  connectionState: string
  archived: boolean
}

export interface AdminTransaction {
  transaction_id: string; order_id: string; razorpay_order_id: string | null; razorpay_payment_id: string | null
  student_name: string; student_email: string | null; printer_id: string; printer_name: string; printer_location: string
  amount_minor: number; currency: string; payment_status: string; order_status: string; print_status: string
  created_at: string; paid_at: string | null; failure_reason: string | null; print_job_id: string | null
  file_name?: string; total_pages?: number; copies?: number; paper_size?: string; paper_type?: string; color_mode?: string
}
export interface PageResult<T> { items: T[]; page: number; size: number; total: number; totalPages: number }
export interface AdminDashboard {
  total_orders: number; successful_payments: number; revenue_minor: number
  queued_jobs: number; failed_jobs: number; active_printers: number
}

export interface SupportedMedia {
  paperSource: string
  paperSize: string
  paperType: string
  printQuality: string
  borderless: boolean
  duplexSupported: boolean
  colorSupported: boolean
  monoSupported: boolean
}

export interface AdminMediaConfig extends SupportedMedia {
  id: string | null
  enabled: boolean
  priceBwMinor: number
  priceColorMinor: number
}

let accessToken: string | null = sessionStorage.getItem('pingprint_access_token')
let adminToken: string | null = sessionStorage.getItem('pingprint_admin_token')

async function request<T>(path: string, options: RequestInit = {}, token: string | null = accessToken): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try { response = await fetch(`${API_URL}${path}`, { ...options, headers }) }
  catch { throw new ApiError('Could not connect to the Ping & Print server.', 'SERVER_UNAVAILABLE', 0) }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(body.message ?? body.error ?? 'The server request failed.', body.code ?? 'REQUEST_FAILED', response.status)
  return body as T
}

async function upload<T>(path: string, file: File): Promise<T> {
  const headers = new Headers()
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  const form = new FormData()
  form.append('file', file)
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 120_000)
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: form, signal: controller.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('The upload took too long. Please try a smaller or simpler document.', 'UPLOAD_TIMEOUT', 0)
    }
    throw new ApiError('Could not connect to the print server.', 'SERVER_UNAVAILABLE', 0)
  } finally {
    window.clearTimeout(timeout)
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(body.message ?? body.error ?? 'The upload failed.', body.code ?? 'UPLOAD_FAILED', response.status)
  return body as T
}

export class ApiError extends Error {
  constructor(message: string, public readonly code: string, public readonly status: number) { super(message) }
}

export const apiClient = {
  async signup(details: {
    email: string
    password: string
    name: string
    age: number
    gender: string
    phone: string
  }) {
    return request<{ message: string; developmentVerificationToken?: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(details),
    })
  },
  async googleSignup(details: { credential: string; name: string; age: number; gender: string; phone: string }) {
    const result = await request<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(details),
    })
    accessToken = result.accessToken
    return result
  },
  async verifyEmail(token: string) {
    return request<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  },
  async login(email: string, password: string) {
    const result = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    accessToken = result.accessToken
    return result
  },
  me() {
    return request<ApiUser>('/auth/me')
  },
  wallet() {
    return request<{ balanceMinor: number; currency: string; transactions: unknown[] }>('/wallet')
  },
  availablePrinters() {
    return request<AvailablePrinter[]>('/printers')
  },
  printerCapabilities(printerId: string) {
    return request<PrinterCapabilities>(`/printers/${printerId}/capabilities`)
  },
  pricing() {
    return request<{ price_bw_minor: number; price_color_minor: number; max_file_mb: number }>('/pricing')
  },
  uploadDocument(file: File) {
    return upload<{ id: string; fileName: string; pageCount: number; contentType: string }>('/documents', file)
  },
  createGuestPrintSession(kioskId: string, fileName: string, pageCount: number) {
    return request<{ sessionId: string; guest: boolean; status: string; message: string }>('/print/guest-session', {
      method: 'POST',
      body: JSON.stringify({ kioskId, fileName, pageCount }),
    })
  },
  createRazorpayOrder(amountMinor: number, receipt: string) {
    return request<{ id: string; amount: number; currency: string }>('/payments/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify({ amountMinor, receipt }),
    })
  },
  createPrintOrder(details: { printerId: string; documentId: string; mediaConfigId: string | null; copies: number; paperSize: string; paperType: string; colorMode: string; duplex: boolean; orientation: string; pageRange: string | null }) {
    return request<{ id: string; amountMinor: number; currency: string; status: string; totalPages: number; copies: number; printerId: string; fileName: string }>('/print-orders', {
      method: 'POST',
      body: JSON.stringify(details),
    })
  },
  createRazorpayOrderForPrint(printOrderId: string) {
    return request<{ id: string; amount: number; currency: string }>('/payments/razorpay/create-order-for-print', {
      method: 'POST',
      body: JSON.stringify({ printOrderId }),
    })
  },
  verifyRazorpayPayment(orderId: string, paymentId: string, signature: string) {
    return request<{ verified: boolean; status: string; orderId: string }>('/payments/razorpay/verify', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentId, signature }),
    })
  },
  printOrderStatus(orderId: string) {
    return request<{ orderId: string; orderStatus: string; printJobStatus: string; pagesCompleted: number; totalPages: number; failureReason: string }>(`/print-orders/${orderId}/status`)
  },
  adminLogin(username: string, password: string) {
    return request<{ accessToken: string; role: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },
  adminPrinters() {
    return adminRequest<AdminPrinter[]>('/admin/printers')
  },
  adminAddPrinter(details: { name: string; location: string; provider: string; agentKey?: string }) {
    return adminRequest<AdminPrinter>('/admin/printers', {
      method: 'POST',
      body: JSON.stringify(details),
    })
  },
  adminUpdatePrinter(id: string, details: { name: string; location: string; active: boolean }) {
    return adminRequest<AdminPrinter>(`/admin/printers/${id}`, { method: 'PUT', body: JSON.stringify(details) })
  },
  adminUpdatePrinterStatus(id: string, status: string) {
    return adminRequest<{ id: string; status: string }>(`/admin/printers/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  },
  adminReport() {
    return adminRequest<{ totals: { orders: number; collected_minor: number; refunded_minor: number }; transactions: Array<Record<string, unknown>> }>('/admin/report')
  },
  adminDashboard() {
    return adminRequest<AdminDashboard>('/admin/dashboard')
  },
  adminTransactions(params: Record<string, string | number | undefined>) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)) })
    return adminRequest<PageResult<AdminTransaction>>(`/admin/transactions?${query}`)
  },
  adminTransaction(id: string) {
    return adminRequest<AdminTransaction>(`/admin/transactions/${id}`)
  },
  adminPrinterJobs(id: string, page = 0) {
    return adminRequest<PageResult<Record<string, unknown>>>(`/admin/printers/${id}/jobs?page=${page}&size=20`)
  },
  adminArchivePrinter(id: string) {
    return adminRequest<AdminPrinter>(`/admin/printers/${id}/archive`, { method: 'POST' })
  },
  adminTestPrint(id: string) {
    return adminRequest<{ jobId: string; status: string; message: string }>(`/admin/printers/${id}/test-print`, { method: 'POST' })
  },
  adminPricing() {
    return adminRequest<{ price_bw_minor: number; price_color_minor: number; max_file_mb: number }>('/admin/pricing')
  },
  adminUpdatePricing(details: { priceBwMinor: number; priceColorMinor: number; maxFileMb: number }) {
    return adminRequest<{ price_bw_minor: number; price_color_minor: number; max_file_mb: number }>('/admin/pricing', {
      method: 'PUT',
      body: JSON.stringify(details),
    })
  },
  logout() {
    accessToken = null
    sessionStorage.removeItem('pingprint_access_token')
  },
  adminEpsonConnect(id: string) {
    return adminRequest<{ authorizationUrl: string }>(`/admin/printers/${id}/epson/connect`)
  },
  adminEpsonTest(id: string) {
    return adminRequest<{ reachable: boolean; connected: boolean; productName: string }>(`/admin/printers/${id}/epson/test`, { method: 'POST' })
  },
  adminRefreshEpsonCapabilities(id: string) {
    return adminRequest<{ refreshed: boolean }>(`/admin/printers/${id}/epson/capabilities/refresh`, { method: 'POST' })
  },
  adminSupportedMedia(id: string) {
    return adminRequest<SupportedMedia[]>(`/admin/printers/${id}/supported-media`)
  },
  adminMedia(id: string) {
    return adminRequest<AdminMediaConfig[]>(`/admin/printers/${id}/media`)
  },
  adminConfigureMedia(id: string, details: AdminMediaConfig) {
    return adminRequest<AdminMediaConfig>(`/admin/printers/${id}/media`, { method: 'PUT', body: JSON.stringify(details) })
  },
  setAccessToken(token: string) {
    accessToken = token
    sessionStorage.setItem('pingprint_access_token', token)
  },
  setAdminAccessToken(token: string) {
    adminToken = token
    sessionStorage.setItem('pingprint_admin_token', token)
  },
}

function adminRequest<T>(path: string, options: RequestInit = {}) {
  return request<T>(path, options, adminToken)
}
