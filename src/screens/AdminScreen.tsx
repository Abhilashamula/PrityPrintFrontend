import { useEffect, useState } from 'react'
import { LockKeyhole, Plus, Printer, RefreshCw, WalletCards } from 'lucide-react'
import { apiClient } from '../lib/apiClient'
import AdminPricingPanel from '../components/AdminPricingPanel'

type PrinterRecord = { id: string; name: string; location: string; status: string }
type Report = { totals: { orders: number; collected_minor: number; refunded_minor: number }; transactions: Array<Record<string, unknown>> }

export default function AdminScreen() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('pingprint_admin_token'))
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin')
  const [printers, setPrinters] = useState<PrinterRecord[]>([])
  const [report, setReport] = useState<Report | null>(null)
  const [form, setForm] = useState({ name: '', location: '', agentKey: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) apiClient.setAccessToken(token)
  }, [token])

  async function refresh() {
    try {
      const [printerList, totals] = await Promise.all([apiClient.adminPrinters(), apiClient.adminReport()])
      setPrinters(printerList); setReport(totals); setError(null)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load admin data.') }
  }

  useEffect(() => { if (token) void refresh() }, [token])

  async function login(event: React.FormEvent) {
    event.preventDefault()
    try {
      const result = await apiClient.adminLogin(username, password)
      apiClient.setAccessToken(result.accessToken)
      sessionStorage.setItem('pingprint_admin_token', result.accessToken)
      setToken(result.accessToken)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Admin login failed.') }
  }

  async function addPrinter(event: React.FormEvent) {
    event.preventDefault()
    try { await apiClient.adminAddPrinter(form); setForm({ name: '', location: '', agentKey: '' }); await refresh() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not add printer.') }
  }

  async function updateStatus(id: string, status: string) {
    try { await apiClient.adminUpdatePrinterStatus(id, status); await refresh() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update printer.') }
  }

  if (!token) return <main className="flex min-h-screen items-center justify-center bg-lux-paper px-4"><form onSubmit={login} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"><div className="mb-6 flex items-center gap-3"><LockKeyhole className="text-lux-copper" /><div><h1 className="font-display text-4xl">Admin login</h1><p className="text-sm text-lux-ink/50">Development account: admin / admin</p></div></div><input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" className="mb-3 w-full rounded-xl border p-3" /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="mb-4 w-full rounded-xl border p-3" /><button className="w-full rounded-xl bg-lux-ink p-3 font-bold text-white">Sign in</button>{error && <p className="mt-4 text-sm text-red-600">{error}</p>}</form></main>

  return <main className="min-h-screen bg-lux-paper px-4 py-8 text-lux-ink sm:px-8"><div className="mx-auto max-w-6xl"><header className="mb-8 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-lux-copper">Operations</p><h1 className="font-display text-5xl">Admin dashboard</h1></div><button onClick={() => void refresh()} className="flex items-center gap-2 rounded-xl border px-4 py-3 font-bold"><RefreshCw size={16} /> Refresh</button></header><AdminPricingPanel /><section className="mb-8 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-white p-5"><p className="text-sm text-lux-ink/50">Orders</p><p className="mt-2 text-3xl font-bold">{report?.totals.orders ?? 0}</p></div><div className="rounded-2xl bg-white p-5"><p className="text-sm text-lux-ink/50">Collected</p><p className="mt-2 text-3xl font-bold">INR {((report?.totals.collected_minor ?? 0) / 100).toFixed(2)}</p></div><div className="rounded-2xl bg-white p-5"><p className="text-sm text-lux-ink/50">Refunded</p><p className="mt-2 text-3xl font-bold">INR {((report?.totals.refunded_minor ?? 0) / 100).toFixed(2)}</p></div></section><div className="grid gap-8 lg:grid-cols-[360px_1fr]"><section className="rounded-2xl bg-white p-6"><h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Plus size={18} /> Add printer</h2><form onSubmit={addPrinter} className="space-y-3"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Printer name" className="w-full rounded-xl border p-3" /><input required value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Location" className="w-full rounded-xl border p-3" /><input required value={form.agentKey} onChange={(event) => setForm({ ...form, agentKey: event.target.value })} placeholder="Printer agent key" className="w-full rounded-xl border p-3" /><button className="w-full rounded-xl bg-lux-copper p-3 font-bold text-white">Register printer</button></form></section><section className="rounded-2xl bg-white p-6"><h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Printer size={18} /> Printers</h2><div className="space-y-3">{printers.map((printer) => <div key={printer.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><p className="font-bold">{printer.name}</p><p className="text-sm text-lux-ink/50">{printer.location} - {printer.id}</p></div><select value={printer.status} onChange={(event) => void updateStatus(printer.id, event.target.value)} className="rounded-lg border p-2"><option>ONLINE</option><option>BUSY</option><option>OFFLINE</option><option>PAPER_OUT</option><option>ERROR</option></select></div>)}</div></section></div><section className="mt-8 rounded-2xl bg-white p-6"><h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><WalletCards size={18} /> Transactions</h2><div className="overflow-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Payment</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Date</th></tr></thead><tbody>{report?.transactions.map((transaction) => <tr key={String(transaction.id)} className="border-b"><td className="p-3">{String(transaction.provider_payment_id ?? 'Pending')}</td><td className="p-3">INR {(Number(transaction.amount_minor ?? 0) / 100).toFixed(2)}</td><td className="p-3">{String(transaction.status)}</td><td className="p-3">{String(transaction.created_at)}</td></tr>)}</tbody></table></div></section>{error && <p className="mt-4 text-sm text-red-600">{error}</p>}</div></main>
}
