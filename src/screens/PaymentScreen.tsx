import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, LoaderCircle, LockKeyhole } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import type { RazorpayOptions } from '../types'
import { apiClient } from '../lib/apiClient'

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined

export default function PaymentScreen() {
  const navigate = useNavigate()
  const totalCost = useSessionStore((state) => state.totalCost)
  const phone = useSessionStore((state) => state.phone)
  const razorpayOrderId = useSessionStore((state) => state.razorpayOrderId)
  const orderId = useSessionStore((state) => state.orderId)
  const setPayment = useSessionStore((state) => state.setPayment)
  const opened = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) navigate('/summary', { replace: true })
  }, [navigate, orderId])

  useEffect(() => {
    if (opened.current || !orderId || !razorpayOrderId) return
    opened.current = true
    if (!window.Razorpay || !RAZORPAY_KEY) {
      setError('Razorpay checkout is not configured. Please contact support.')
      return
    }

    const options: RazorpayOptions = {
      key: RAZORPAY_KEY,
      amount: Math.round(totalCost * 100),
      currency: 'INR',
      name: 'Ping & Print',
      description: `Print job - Order ${orderId}`,
      order_id: razorpayOrderId,
      prefill: { contact: phone || undefined },
      theme: { color: '#087f78' },
      handler: (response) => {
        void apiClient.verifyRazorpayPayment(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature)
          .then(() => { setPayment(response.razorpay_payment_id); navigate('/printing') })
          .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Payment verification failed.'))
      },
      modal: { ondismiss: () => navigate('/summary') },
    }

    const checkout = new window.Razorpay(options)
    checkout.on('payment.failed', () => setError('Payment was declined. No print job was started.'))
    checkout.open()
  }, [navigate, orderId, phone, razorpayOrderId, setPayment, totalCost])

  return <main className="flex min-h-screen items-center justify-center bg-[#e7f8f5] px-5 text-[#123a37]"><div className="w-full max-w-md text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#087f78] text-white"><LockKeyhole size={28} /></div>{error ? <><h1 className="mt-6 text-2xl font-extrabold">Payment could not start</h1><div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700"><AlertCircle className="shrink-0" size={18} />{error}</div><button onClick={() => navigate('/summary')} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#123a37] px-5 py-3 text-sm font-extrabold uppercase tracking-[0.1em] text-white"><ArrowLeft size={17} /> Back to order</button></> : <><h1 className="mt-6 text-2xl font-extrabold">Opening secure payment</h1><p className="mt-2 text-sm text-[#123a37]/60">Your Razorpay checkout will open in a moment.</p><LoaderCircle className="mx-auto mt-6 animate-spin text-[#087f78]" size={26} /></>}</div></main>
}
