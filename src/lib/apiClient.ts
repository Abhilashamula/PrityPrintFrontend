const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api').replace(/\/$/, '')

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
  verifyRazorpayPayment(orderId: string, paymentId: string, signature: string) {
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
    return request<{ verified: boolean; status: string }>('/payments/razorpay/verify', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentId, signature }),
    })
  },
  logout() {
    accessToken = null
  },
  setAccessToken(token: string) {
    accessToken = token
  },
}
