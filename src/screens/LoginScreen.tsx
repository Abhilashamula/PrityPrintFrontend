import { FormEvent, useState } from 'react'
import { ArrowLeft, ArrowRight, LockKeyhole, Printer, Sparkles, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../lib/apiClient'
import { useAuthStore } from '../store/authStore'

export default function LoginScreen() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const setUser = useAuthStore((state) => state.setUser)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (email.trim().toLowerCase() === 'admin' && password === 'admin') {
        const result = await apiClient.adminLogin('admin', 'admin')
        apiClient.setAdminAccessToken(result.accessToken)
        navigate('/admin')
        return
      }
      const result = await apiClient.login(email.trim(), password)
      setUser(result.user)
      navigate('/upload')
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Could not sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen text-ink screen-enter flex flex-col"
      style={{ background: 'linear-gradient(180deg, #091525 0%, #0f1923 100%)' }}>

      {/* Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="orb orb-purple" style={{ width: 400, height: 400, top: '-5%', left: '-5%', opacity: 0.6 }} />
        <div className="orb orb-pink" style={{ width: 300, height: 300, bottom: '10%', right: '-5%', opacity: 0.5 }} />
        <div className="dot-grid absolute inset-0 opacity-25" />
      </div>

      {/* Header */}
      <header className="header-enter relative z-10 flex items-center justify-between px-6 py-5 lg:px-10">
        <button onClick={() => navigate('/')} className="flex items-center gap-3" aria-label="Back to home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #FF3CAC 100%)' }}>
            <Printer size={20} className="text-white" strokeWidth={1.8} />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink" style={{ fontFamily: 'Syne, sans-serif' }}>
            Ping<span className="text-gradient-brand">&</span>Print
          </span>
        </button>
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm font-bold text-ink-muted hover:text-ink glass rounded-xl px-4 py-2">
          <ArrowLeft size={15} /> Back
        </button>
      </header>

      {/* Body */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 glass-brand rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-brand-light">
            <Sparkles size={12} /> Your campus account
          </div>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
            Welcome<br /><span className="text-gradient-brand">back.</span>
          </h1>
          <p className="mb-8 text-sm leading-6 text-ink-muted">
            Sign in to access your wallet and saved print preferences. You can always print as a guest.
          </p>

          {/* Form card */}
          <div className="glass rounded-3xl p-7 shadow-premium">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-ink-dim mb-2">
                  Email or username
                </label>
                <input
                  required
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark"
                  placeholder="you@college.edu"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-ink-dim mb-2">
                  Password
                </label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark"
                  placeholder="Your password"
                />
              </div>

              {error && (
                <p role="alert"
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              <button
                disabled={loading}
                className="btn-primary shine-on-hover relative w-full flex items-center justify-center gap-3 py-4 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Signing in…</>
                ) : (
                  <>Sign in <ArrowRight size={17} /></>
                )}
              </button>
            </form>

            <div className="mt-5 flex flex-col items-center gap-3 pt-5 border-t border-white/08">
              <button onClick={() => navigate('/signup')}
                className="text-sm font-bold text-brand-light hover:text-brand">
                Create a new account →
              </button>
              <p className="flex items-center gap-2 text-xs text-ink-dim">
                <LockKeyhole size={13} className="text-accent-teal" /> JWT-secured account access
              </p>
            </div>
          </div>

          {/* Feature chips */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {["Razorpay Payments", "Epson Cloud Print", "Multi-campus"].map((f) => (
              <span key={f} className="glass rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-dim flex items-center gap-1.5">
                <Zap size={10} className="text-brand" />{f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
