import { useEffect, useState } from 'react'
import { Save, SlidersHorizontal } from 'lucide-react'
import { apiClient } from '../lib/apiClient'

type PricingValues = { price_bw_minor: number; price_color_minor: number; max_file_mb: number }

export default function AdminPricingPanel() {
  const [values, setValues] = useState({ bw: '', color: '', maxFileMb: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void apiClient.adminPricing().then((data: PricingValues) => {
      setValues({ bw: String(data.price_bw_minor / 100), color: String(data.price_color_minor / 100), maxFileMb: String(data.max_file_mb) })
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not load pricing.')).finally(() => setLoading(false))
  }, [])

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true); setMessage(null); setError(null)
    try {
      const data = await apiClient.adminUpdatePricing({ priceBwMinor: Math.round(Number(values.bw) * 100), priceColorMinor: Math.round(Number(values.color) * 100), maxFileMb: Number(values.maxFileMb) })
      setValues({ bw: String(data.price_bw_minor / 100), color: String(data.price_color_minor / 100), maxFileMb: String(data.max_file_mb) })
      setMessage('Master pricing saved.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save pricing.') }
    finally { setSaving(false) }
  }

  return <section className="mb-8 rounded-2xl bg-white p-6"><div className="mb-5 flex items-start gap-3"><SlidersHorizontal className="mt-1 text-lux-copper" size={20} /><div><h2 className="text-xl font-bold">Master data · Pricing</h2><p className="mt-1 text-sm text-lux-ink/50">These values are used for new print orders across the platform.</p></div></div><form onSubmit={save} className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-bold text-lux-ink/70">B&amp;W price per page (₹)<input required min="0.01" step="0.01" type="number" value={values.bw} disabled={loading || saving} onChange={(event) => setValues({ ...values, bw: event.target.value })} className="mt-2 w-full rounded-xl border p-3 text-base font-normal text-lux-ink" /></label><label className="text-sm font-bold text-lux-ink/70">Color price per page (₹)<input required min="0.01" step="0.01" type="number" value={values.color} disabled={loading || saving} onChange={(event) => setValues({ ...values, color: event.target.value })} className="mt-2 w-full rounded-xl border p-3 text-base font-normal text-lux-ink" /></label><label className="text-sm font-bold text-lux-ink/70">Maximum file size (MB)<input required min="1" step="1" type="number" value={values.maxFileMb} disabled={loading || saving} onChange={(event) => setValues({ ...values, maxFileMb: event.target.value })} className="mt-2 w-full rounded-xl border p-3 text-base font-normal text-lux-ink" /></label><div className="sm:col-span-3"><button disabled={loading || saving} className="flex items-center gap-2 rounded-xl bg-lux-copper px-5 py-3 font-bold text-white disabled:opacity-50"><Save size={16} /> {saving ? 'Saving...' : 'Save pricing'}</button>{message && <p className="mt-3 text-sm font-bold text-emerald-700">{message}</p>}{error && <p className="mt-3 text-sm font-bold text-red-600" role="alert">{error}</p>}</div></form></section>
}
