import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

type Tone = 'success' | 'error' | 'warning' | 'info'
type Toast = { id: number; tone: Tone; message: string }
const ToastContext = createContext<{ push: (message: string, tone?: Tone) => void } | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const push = useCallback((message: string, tone: Tone = 'info') => {
    const id = Date.now() + Math.random()
    setItems((current) => [...current.slice(-3), { id, tone, message }])
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 4500)
  }, [])
  const value = useMemo(() => ({ push }), [push])
  return <ToastContext.Provider value={value}>{children}<div className="fixed inset-x-3 top-3 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:w-[380px]" aria-live="polite">
    {items.map((item) => <div key={item.id} role={item.tone === 'error' ? 'alert' : 'status'} className={`flex w-full items-start gap-3 border bg-white p-4 shadow-lg ${item.tone === 'error' ? 'border-red-200' : item.tone === 'warning' ? 'border-amber-200' : 'border-lux-ink/10'}`}>
      {item.tone === 'success' ? <CheckCircle2 className="text-emerald-600" size={19} /> : item.tone === 'error' ? <AlertCircle className="text-red-600" size={19} /> : <Info className={item.tone === 'warning' ? 'text-amber-600' : 'text-blue-600'} size={19} />}
      <p className="min-w-0 flex-1 text-sm font-semibold leading-5">{item.message}</p>
      <button onClick={() => setItems((current) => current.filter((value) => value.id !== item.id))} aria-label="Dismiss notification" className="p-1"><X size={16} /></button>
    </div>)}
  </div></ToastContext.Provider>
}
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
