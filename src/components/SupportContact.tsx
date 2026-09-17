import { Phone, MessageSquare } from 'lucide-react'

interface SupportContactProps {
  className?: string
  compact?: boolean
}

const SUPPORT_PHONE = import.meta.env.VITE_SUPPORT_PHONE as string | undefined

export default function SupportContact({ className = '', compact = false }: SupportContactProps) {
  if (!SUPPORT_PHONE && compact) return null

  const phone = SUPPORT_PHONE ?? '+91-XXXXXXXXXX'

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-pp-gray text-sm ${className}`}>
        <Phone size={14} className="text-pp-blue" />
        <span>Support: <strong className="text-pp-dark">{phone}</strong></span>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border border-pp-blue/20 bg-pp-blue/5 p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-pp-blue/15 flex items-center justify-center shrink-0">
          <MessageSquare size={20} className="text-pp-blue" />
        </div>
        <div>
          <p className="text-pp-dark font-semibold text-sm">Need help?</p>
          <p className="text-pp-gray text-xs mt-0.5">
            Contact the kiosk operator directly
          </p>
        </div>
      </div>
      <a
        href={`tel:${phone}`}
        className="mt-3 flex items-center gap-2 text-pp-blue font-bold text-base hover:text-pp-blue-dark transition-colors"
      >
        <Phone size={18} />
        {phone}
      </a>
    </div>
  )
}

