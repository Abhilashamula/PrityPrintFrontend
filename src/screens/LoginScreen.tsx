import { FormEvent, useState } from 'react'
import { ArrowLeft, ArrowRight, LockKeyhole, Printer } from 'lucide-react'
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
    <main className="min-h-screen bg-lux-paper text-lux-ink screen-enter">
      <header className="flex items-center justify-between border-b border-lux-ink/10 px-6 py-5 lg:px-10">
        <button onClick={() => navigate('/')} className="flex items-center gap-3" aria-label="Back to home"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-lux-ink text-lux-paper"><Printer size={20} /></span><span className="text-lg font-extrabold tracking-[-0.06em]">Ping<span className="text-lux-copper">&amp;</span>Print</span></button>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-bold text-lux-ink/60 hover:text-lux-ink"><ArrowLeft size={17} /> Back</button>
      </header>
      <div className="mx-auto flex max-w-md flex-col px-6 py-16">
        <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.25em] text-lux-copper">Your campus account</p>
        <h1 className="font-display text-6xl font-semibold leading-[0.9]">Welcome<br /><em className="text-lux-copper">back.</em></h1>
        <p className="mt-5 text-sm leading-6 text-lux-ink/60">Sign in to access your wallet and saved account details. You can always print as a guest.</p>
        <form onSubmit={submit} className="mt-8 space-y-4 border border-lux-ink/10 bg-white p-6 shadow-sm sm:p-8">
          <label className="block text-xs font-extrabold uppercase tracking-[0.1em] text-lux-ink/55">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full border border-lux-ink/15 bg-lux-paper px-4 text-sm font-normal normal-case tracking-normal outline-none focus:border-lux-copper" placeholder="you@example.com" /></label>
          <label className="block text-xs font-extrabold uppercase tracking-[0.1em] text-lux-ink/55">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-12 w-full border border-lux-ink/15 bg-lux-paper px-4 text-sm font-normal normal-case tracking-normal outline-none focus:border-lux-copper" placeholder="Your password" /></label>
          {error && <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button disabled={loading} className="flex min-h-13 w-full items-center justify-center gap-3 bg-lux-ink px-5 py-4 text-sm font-extrabold uppercase tracking-[0.12em] text-white hover:bg-lux-copper disabled:opacity-50">{loading ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} /></button>
        </form>
        <button onClick={() => navigate('/signup')} className="mt-5 text-center text-sm font-bold text-lux-copper">Create a new account</button>
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-lux-ink/45"><LockKeyhole size={14} className="text-lux-copper" /> JWT-secured account access</p>
      </div>
    </main>
  )
}
