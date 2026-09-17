import { FormEvent, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Printer } from 'lucide-react'
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
        name: name.trim(),
        age: Number(age),
        gender,
        phone: phone.trim(),
        email: email.trim(),
        password,
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

  return (
    <main className="min-h-screen bg-lux-paper text-lux-ink screen-enter">
      <header className="flex items-center justify-between border-b border-lux-ink/10 px-6 py-5 lg:px-10">
        <button onClick={() => navigate('/')} className="flex items-center gap-3" aria-label="Back to home">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lux-ink text-lux-paper"><Printer size={20} /></span>
          <span className="text-lg font-extrabold tracking-[-0.06em]">Ping<span className="text-lux-copper">&amp;</span>Print</span>
        </button>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-bold text-lux-ink/60 hover:text-lux-ink"><ArrowLeft size={17} /> Back</button>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-16">
        <section className="self-center">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.25em] text-lux-copper">Your campus account</p>
          <h1 className="font-display text-6xl font-semibold leading-[0.9]">Print with<br /><em className="text-lux-copper">less friction.</em></h1>
          <p className="mt-6 max-w-md text-sm leading-6 text-lux-ink/60">Save your print preferences, use your wallet later, and keep guest printing available whenever you need speed.</p>
          <div className="mt-8 space-y-3 text-sm font-bold text-lux-ink/65"><p className="flex items-center gap-3"><Check size={17} className="text-lux-copper" /> Basic wallet included</p><p className="flex items-center gap-3"><Check size={17} className="text-lux-copper" /> Email-secured account</p><p className="flex items-center gap-3"><Check size={17} className="text-lux-copper" /> Guest printing still available</p></div>
        </section>

        <section className="border border-lux-ink/10 bg-white p-6 shadow-[0_18px_50px_rgba(23,33,31,0.08)] sm:p-9">
          <div className="mb-7"><h2 className="font-display text-4xl leading-none">Create your account.</h2><p className="mt-3 text-sm text-lux-ink/55">All fields are used only for your account and support.</p></div>
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
              <div className="flex h-20 w-20 animate-bounce items-center justify-center rounded-full bg-lux-copper text-white shadow-[0_12px_30px_rgba(199,121,82,0.3)]">
                <Check size={38} strokeWidth={3} />
              </div>
              <h3 className="mt-6 font-display text-4xl">You&apos;re in.</h3>
              <p className="mt-3 text-sm text-lux-ink/55">Your account and wallet are ready.</p>
              <div className="mt-6 h-1.5 w-48 overflow-hidden bg-lux-paper"><div className="h-full animate-[progress_1.4s_ease-in-out] bg-lux-copper" /></div>
            </div>
          ) : <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-extrabold uppercase tracking-[0.1em] text-lux-ink/55">Name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-12 w-full border border-lux-ink/15 bg-lux-paper px-4 text-sm font-normal normal-case tracking-normal outline-none focus:border-lux-copper" placeholder="Your name" /></label>
              <label className="text-xs font-extrabold uppercase tracking-[0.1em] text-lux-ink/55">Age<input required min="13" max="120" type="number" value={age} onChange={(event) => setAge(event.target.value)} className="mt-2 min-h-12 w-full border border-lux-ink/15 bg-lux-paper px-4 text-sm font-normal normal-case tracking-normal outline-none focus:border-lux-copper" placeholder="20" /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-extrabold uppercase tracking-[0.1em] text-lux-ink/55">Gender<select value={gender} onChange={(event) => setGender(event.target.value)} className="mt-2 min-h-12 w-full border border-lux-ink/15 bg-lux-paper px-4 text-sm font-normal normal-case tracking-normal outline-none focus:border-lux-copper"><option value="prefer_not_to_say">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></label>
              <label className="text-xs font-extrabold uppercase tracking-[0.1em] text-lux-ink/55">Phone<input required type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} className="mt-2 min-h-12 w-full border border-lux-ink/15 bg-lux-paper px-4 text-sm font-normal normal-case tracking-normal outline-none focus:border-lux-copper" placeholder="10-digit phone number" /></label>
            </div>
            <label className="block text-xs font-extrabold uppercase tracking-[0.1em] text-lux-ink/55">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full border border-lux-ink/15 bg-lux-paper px-4 text-sm font-normal normal-case tracking-normal outline-none focus:border-lux-copper" placeholder="you@example.com" /></label>
            <label className="block text-xs font-extrabold uppercase tracking-[0.1em] text-lux-ink/55">Password<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-12 w-full border border-lux-ink/15 bg-lux-paper px-4 text-sm font-normal normal-case tracking-normal outline-none focus:border-lux-copper" placeholder="At least 6 characters" /></label>
            <label className="block text-xs font-extrabold uppercase tracking-[0.1em] text-lux-ink/55">Confirm password<input required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={`mt-2 min-h-12 w-full border bg-lux-paper px-4 text-sm font-normal normal-case tracking-normal outline-none focus:border-lux-copper ${confirmPassword && confirmPassword !== password ? 'border-red-300' : 'border-lux-ink/15'}`} placeholder="Repeat your password" /></label>
            <div className="border border-lux-ink/10 bg-lux-paper p-4">
              <div className="mb-3 flex items-center justify-between text-xs font-bold text-lux-ink/55"><span>Password strength</span><span>{passwordScore === 3 ? 'Ready' : `${passwordScore}/3`}</span></div>
              <div className="mb-3 flex h-1.5 gap-1"><span className={`flex-1 ${passwordScore >= 1 ? 'bg-lux-copper' : 'bg-lux-ink/10'}`} /><span className={`flex-1 ${passwordScore >= 2 ? 'bg-lux-copper' : 'bg-lux-ink/10'}`} /><span className={`flex-1 ${passwordScore >= 3 ? 'bg-lux-copper' : 'bg-lux-ink/10'}`} /></div>
              <div className="grid gap-1 text-xs text-lux-ink/50 sm:grid-cols-3"><span className={passwordChecks.length ? 'text-green-700' : ''}>{passwordChecks.length ? '✓' : '○'} 6+ characters</span><span className={passwordChecks.uppercase ? 'text-green-700' : ''}>{passwordChecks.uppercase ? '✓' : '○'} Uppercase</span><span className={passwordChecks.special ? 'text-green-700' : ''}>{passwordChecks.special ? '✓' : '○'} Special character</span></div>
            </div>
            {error && <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            {message && <p role="status" className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>}
            <button disabled={loading} className="flex min-h-13 w-full items-center justify-center gap-3 bg-lux-ink px-5 py-4 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition-colors hover:bg-lux-copper disabled:opacity-50">{loading ? 'Creating account…' : 'Create account'} <ArrowRight size={17} /></button>
          </form>}
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-lux-ink/45"><LockKeyhole size={14} className="text-lux-copper" /> You can still print as a guest.</p>
        </section>
      </div>
    </main>
  )
}
