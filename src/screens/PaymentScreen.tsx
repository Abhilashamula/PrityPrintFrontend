import { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, CheckCircle2, CreditCard, ExternalLink, LockKeyhole, QrCode, ShieldCheck, Smartphone, WalletCards } from 'lucide-react'
import { AlertCircle, ArrowLeft, CheckCircle2, CreditCard, ExternalLink, LockKeyhole, QrCode, ShieldCheck, Smartphone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import AccountMenu from '../components/AccountMenu'
import { useSessionStore } from '../store/sessionStore'
import type { RazorpayOptions } from '../types'
import { confirmLocalPayment } from '../lib/localBackend'
import { apiClient } from '../lib/apiClient'

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined
type PaymentMethod = 'upi' | 'cards' | 'netbanking' | 'wallet'
type PaymentMethod = 'upi' | 'cards' | 'netbanking'

export default function PaymentScreen() {
  const navigate = useNavigate()
  const totalCost = useSessionStore((s) => s.totalCost)
  const phone = useSessionStore((s) => s.phone)
  const razorpayOrderId = useSessionStore((s) => s.razorpayOrderId)
  const orderId = useSessionStore((s) => s.orderId)
  const setPayment = useSessionStore((s) => s.setPayment)
  const [method, setMethod] = useState<PaymentMethod>('upi')
  const [status, setStatus] = useState<'idle' | 'processing' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => { if (!orderId) navigate('/summary', { replace: true }) }, [orderId, navigate])

  const finishPayment = (paymentId: string) => { setPayment(paymentId); navigate('/printing') }
  const simulatePayment = () => {
    setStatus('processing'); setErrorMsg(null)
    window.setTimeout(() => {
      try { const order = confirmLocalPayment(orderId ?? ''); finishPayment(order.paymentId ?? '') }
      catch (error) { setStatus('error'); setErrorMsg(error instanceof Error ? error.message : 'Payment simulation failed.') }
    }, 1200)
  }
  const openRazorpay = () => {
    if (!window.Razorpay || !RAZORPAY_KEY || !razorpayOrderId) { simulatePayment(); return }
    setStatus('processing')
    const options: RazorpayOptions = {
      key: RAZORPAY_KEY, amount: Math.round(totalCost * 100), currency: 'INR', name: 'Ping & Print', description: `Print job - Order ${orderId}`, order_id: razorpayOrderId,
      prefill: { contact: phone || undefined }, theme: { color: '#087f78' }, handler: (response) => { void apiClient.verifyRazorpayPayment(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature).then(() => finishPayment(response.razorpay_payment_id)).catch((error: unknown) => { setStatus('error'); setErrorMsg(error instanceof Error ? error.message : 'Payment verification failed.') }) }, modal: { ondismiss: () => setStatus('idle') },
    }
    const checkout = new window.Razorpay(options)
    checkout.on('payment.failed', () => { setStatus('error'); setErrorMsg('Payment was declined. Your print order was not charged.') })
    checkout.open()
  }
  const methods: { id: PaymentMethod; label: string; icon: typeof Smartphone }[] = [
    { id: 'upi', label: 'UPI', icon: Smartphone }, { id: 'cards', label: 'Cards', icon: CreditCard }, { id: 'netbanking', label: 'Netbanking', icon: ShieldCheck }, { id: 'wallet', label: 'Wallet', icon: WalletCards },
    { id: 'upi', label: 'UPI', icon: Smartphone }, { id: 'cards', label: 'Cards', icon: CreditCard }, { id: 'netbanking', label: 'Netbanking', icon: ShieldCheck },
  ]

  return (
    <main className="min-h-screen bg-[#e7f8f5] text-[#123a37] screen-enter">
      <header className="flex items-center justify-between border-b border-[#087f78]/10 bg-white px-5 py-4 sm:px-8"><button onClick={() => navigate('/summary')} disabled={status === 'processing'} className="flex items-center gap-2 text-sm font-bold text-[#123a37]/60 hover:text-[#123a37] disabled:opacity-40" aria-label="Back to summary"><ArrowLeft size={19} /> Back</button><Logo size="sm" showText={false} /><AccountMenu /></header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#087f78]">Final step / Payment</p><h1 className="mt-2 font-display text-5xl leading-none text-[#123a37] sm:text-6xl">Pay securely.</h1></div><div className="flex items-center gap-2 text-xs font-bold text-[#123a37]/50"><LockKeyhole size={15} className="text-[#087f78]" /> Encrypted checkout</div></div>
        <section className="overflow-hidden rounded-[26px] bg-[#087f78] shadow-[0_24px_60px_rgba(8,127,120,0.2)]"><div className="grid lg:grid-cols-[300px_1fr]"><aside className="p-5 text-white sm:p-7"><div className="rounded-2xl bg-white/10 p-5"><p className="text-xs font-bold text-white/65">Price summary</p><p className="mt-3 text-4xl font-extrabold">₹{totalCost.toFixed(2)}</p><p className="mt-2 text-xs text-white/60">Order {orderId?.slice(-8) ?? 'pending'}</p></div><div className="mt-3 rounded-2xl bg-white/90 p-4 text-sm font-bold text-[#087f78]"><div className="flex items-center gap-2"><CheckCircle2 size={17} /> Document ready</div><p className="mt-1 pl-6 text-xs font-medium text-[#123a37]/55">Print starts after payment</p></div><p className="mt-8 text-xs font-bold text-white/55">Secured by Razorpay</p></aside>
          <div className="bg-white p-5 sm:p-8"><div className="flex items-center justify-between border-b border-[#123a37]/10 pb-4"><h2 className="text-lg font-extrabold">Payment options</h2><span className="text-xs font-bold text-[#123a37]/40">Order total ₹{totalCost.toFixed(2)}</span></div><div className="mt-5 grid gap-6 md:grid-cols-[220px_1fr]"><div className="space-y-2">{methods.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setMethod(id)} className={`flex min-h-14 w-full items-center justify-between rounded-xl px-4 text-left text-sm font-extrabold transition-colors ${method === id ? 'bg-[#dff8f3] text-[#087f78]' : 'text-[#123a37]/75 hover:bg-[#f1faf8]'}`}><span className="flex items-center gap-3"><Icon size={18} />{label}</span><span className="text-xs text-[#123a37]/30">›</span></button>)}</div><div><div className="flex items-center justify-between"><h3 className="text-sm font-extrabold">Available offers</h3><span className="text-xs text-[#123a37]/40">Automatic</span></div><div className="mt-3 flex items-center gap-3 rounded-xl bg-[#dff8f3] px-4 py-3 text-xs font-bold text-[#087f78]"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white"><CheckCircle2 size={15} /></span> Secure payment methods available</div><div className="mt-5 rounded-2xl bg-[#f1faf8] p-5">{method === 'upi' ? <><div className="flex items-center justify-between"><h3 className="text-sm font-extrabold">UPI payment</h3><QrCode size={20} className="text-[#087f78]" /></div><p className="mt-2 text-xs leading-5 text-[#123a37]/50">Razorpay will open a secure UPI, QR, card, netbanking, or wallet checkout.</p></> : <><h3 className="text-sm font-extrabold">{methods.find((item) => item.id === method)?.label} checkout</h3><p className="mt-2 text-xs leading-5 text-[#123a37]/50">Continue to Razorpay&apos;s secure checkout to complete your payment.</p></>}</div></div></div>{status === 'error' && errorMsg && <div className="mt-5 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={19} className="shrink-0" />{errorMsg}</div>}{status === 'processing' ? <div className="mt-6 flex min-h-14 items-center justify-center gap-3 rounded-xl bg-[#123a37] text-sm font-extrabold text-white"><span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />Opening secure checkout…</div> : <button onClick={openRazorpay} className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#123a37] text-sm font-extrabold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#087f78]">Continue to payment <ExternalLink size={17} /></button>}{!RAZORPAY_KEY && <button onClick={simulatePayment} className="mt-3 w-full text-center text-xs font-bold text-[#087f78] hover:underline">Use local test payment</button>}<p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-[#123a37]/45"><ShieldCheck size={14} className="text-[#087f78]" /> Card details are handled by Razorpay and never stored by Ping &amp; Print.</p></div></div></section>
      </div>
    </main>
  )
}
