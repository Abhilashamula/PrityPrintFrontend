import { FormEvent, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Printer, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../lib/apiClient'

export default function SignupScreen() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('prefer_not_to_say')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const passwordChecks = {
    length: password.length >= 6,
    uppercase: /[A-Z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length
  const passwordValid = passwordScore === 3 && password === confirmPassword

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    if (!passwordValid) {
      setError(password !== confirmPassword ? 'Passwords do not match.' : 'Password does not meet all requirements.')
      return
    }
    setLoading(true)
    try {
      await apiClient.signup({
        name: name.trim(), age: Number(age), gender,
        phone: phone.trim(), email: email.trim(), password,
      })
      setSuccess(true)
      setMessage('Your account is ready. Taking you to sign in…')
      setPassword('')
      setConfirmPassword('')
      window.setTimeout(() => navigate('/login'), 1400)
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Could not create your account.')
    } finally {
      setLoading(false)
    }
  }

  const scoreColors = ['bg-red-500', 'bg-yellow-400', 'bg-accent-teal']
  const scoreColor = scoreColors[Math.max(0, passwordScore - 1)] || 'bg-white/10'

  return (
    <main className="min-h-screen text-ink screen-enter"
      style={{ background: 'linear-gradient(180deg, #091525 0%, #0f1923 100%)' }}>

      {/* Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="orb orb-purple" style={{ width: 500, height: 500, top: '-10%', right: '-8%', opacity: 0.6 }} />
        <div className="orb orb-teal" style={{ width: 350, height: 350, bottom: '5%', left: '-5%', opacity: 0.5 }} />
        <div className="dot-grid absolute inset-0 opacity-25" />
      </div>

      {/* Header */}
      <header className="header-enter relative z-10 flex items-center justify-between px-6 py-5 lg:px-10">
        <button onClick={() => navigate('/')} className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #FF3CAC 100%)' }}>
            <Printer size={20} className="text-white" />
          </span>
          <span className="text-lg font-extrabold text-ink" style={{ fontFamily: 'Syne, sans-serif' }}>
            Ping<span className="text-gradient-brand">&</span>Print
          </span>
        </button>
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm font-bold text-ink-muted hover:text-ink glass rounded-xl px-4 py-2">
          <ArrowLeft size={15} /> Back
        </button>
      </header>

      {/* Body */}
      <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-12">

        {/* Left side — value props */}
        <section className="self-center">
          <div className="mb-5 inline-flex items-center gap-2 glass-brand rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-brand-light">
            <Sparkles size={12} /> Your campus account
          </div>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl mb-5"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Print with<br />
            <span className="text-gradient-brand">less friction.</span>
          </h1>
          <p className="max-w-md text-sm leading-6 text-ink-muted mb-8">
            Save your print preferences, access Epson Cloud printers across campuses, and pay securely with Razorpay.
          </p>
          <div className="space-y-4">
            {[
              { text: "Multi-campus Epson Cloud printing", color: "text-accent-teal" },
              { text: "Colour & B&W options with live pricing", color: "text-brand-light" },
              { text: "Secure Razorpay payment integration", color: "text-accent-orange" },
              { text: "Guest printing still available", color: "text-accent-teal" },
            ].map((item) => (
              <p key={item.text} className="flex items-center gap-3 text-sm font-medium text-ink-muted">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.color}`}
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <Check size={13} strokeWidth={2.5} />
                </span>
                {item.text}
              </p>
            ))}
          </div>
        </section>

        {/* Right side — form */}
        <section className="glass rounded-3xl p-6 shadow-premium sm:p-8">
          <h2 className="text-3xl font-extrabold mb-1 text-ink" style={{ fontFamily: 'Syne, sans-serif' }}>Create your account.</h2>
          <p className="text-sm text-ink-muted mb-7">All fields are used only for your account and support.</p>

          {success ? (
            <div className="flex flex-col items-center justify-center py-14 text-center" role="status">
              <div className="flex h-20 w-20 items-center justify-center rounded-full text-white shadow-glow-brand"
                style={{ background: 'linear-gradient(135deg, #6C63FF, #FF3CAC)' }}>
                <Check size={36} strokeWidth={3} />
              </div>
              <h3 className="mt-6 text-3xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif' }}>You're in.</h3>
              <p className="mt-3 text-sm text-ink-muted">Your account is ready. Redirecting…</p>
              <div className="mt-6 h-1.5 w-48 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }}>
                <div className="h-full rounded-full animate-[progress_1.4s_ease-in-out] progress-bar" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.12em] text-ink-dim mb-1.5">Name</label>
                  <input required value={name} onChange={(e) => setName(e.target.value)}
                    className="input-dark" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.12em] text-ink-dim mb-1.5">Age</label>
                  <input required min="13" max="120" type="number" value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="input-dark" placeholder="20" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.12em] text-ink-dim mb-1.5">Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)}
                    className="input-dark">
                    <option value="prefer_not_to_say">Prefer not to say</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.12em] text-ink-dim mb-1.5">Phone</label>
                  <input required type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="input-dark" placeholder="10-digit number" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-ink-dim mb-1.5">Email</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-dark" placeholder="you@college.edu" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-ink-dim mb-1.5">Password</label>
                <input required minLength={6} type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark" placeholder="At least 6 characters" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-ink-dim mb-1.5">Confirm password</label>
                <input required type="password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`input-dark ${confirmPassword && confirmPassword !== password ? '!border-red-500/50' : ''}`}
                  placeholder="Repeat your password" />
              </div>

              {/* Password strength */}
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="mb-2.5 flex items-center justify-between text-xs font-bold">
                  <span className="text-ink-dim">Password strength</span>
                  <span className="text-ink-muted">{passwordScore === 3 ? '✓ Ready' : `${passwordScore}/3`}</span>
                </div>
                <div className="flex h-1.5 gap-1 mb-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${passwordScore > i ? scoreColor : 'bg-white/10'}`} />
                  ))}
                </div>
                <div className="grid gap-1 text-xs sm:grid-cols-3">
                  {[
                    { ok: passwordChecks.length, text: '6+ characters' },
                    { ok: passwordChecks.uppercase, text: 'Uppercase' },
                    { ok: passwordChecks.special, text: 'Special char' },
                  ].map((c) => (
                    <span key={c.text} className={c.ok ? 'text-accent-teal' : 'text-ink-dim'}>
                      {c.ok ? '✓' : '○'} {c.text}
                    </span>
                  ))}
                </div>
              </div>

              {error && <p role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
              {message && <p role="status" className="rounded-2xl border border-accent-teal/30 bg-accent-teal/10 px-4 py-3 text-sm text-accent-teal">{message}</p>}

              <button disabled={loading}
                className="btn-primary shine-on-hover relative w-full flex items-center justify-center gap-3 py-4 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Creating account…</>
                ) : (
                  <>Create account <ArrowRight size={17} /></>
                )}
              </button>
            </form>
          )}

          {!success && (
            <p className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-dim">
              <LockKeyhole size={13} className="text-accent-teal" /> You can still print as a guest.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
