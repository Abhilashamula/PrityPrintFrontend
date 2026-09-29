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
  mediaOptions: PrinterMediaOption[]
}

let accessToken: string | null = null

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error ?? 'The server request failed.')
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
      throw new Error('The upload took too long. Please try a smaller or simpler document.')
    }
    throw new Error('Could not connect to the print server.')
  } finally {
    window.clearTimeout(timeout)
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error ?? 'The upload failed.')
  return body as T
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
    return request<Array<{ id: string; name: string; location: string; status: string }>>('/admin/printers')
  },
  adminAddPrinter(details: { name: string; location: string; agentKey: string }) {
    return request<{ id: string; name: string; location: string; status: string; agentKey: string }>('/admin/printers', {
      method: 'POST',
      body: JSON.stringify(details),
    })
  },
  adminUpdatePrinterStatus(id: string, status: string) {
    return request<{ id: string; status: string }>(`/admin/printers/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  },
  adminReport() {
    return request<{ totals: { orders: number; collected_minor: number; refunded_minor: number }; transactions: Array<Record<string, unknown>> }>('/admin/report')
  },
  adminPricing() {
    return request<{ price_bw_minor: number; price_color_minor: number; max_file_mb: number }>('/admin/pricing')
  },
  adminUpdatePricing(details: { priceBwMinor: number; priceColorMinor: number; maxFileMb: number }) {
    return request<{ price_bw_minor: number; price_color_minor: number; max_file_mb: number }>('/admin/pricing', {
      method: 'PUT',
      body: JSON.stringify(details),
    })
  },
  logout() {
    accessToken = null
  },
  setAccessToken(token: string) {
    accessToken = token
  },
}
