import { AlertTriangle } from 'lucide-react'
import { useKioskStatus } from '../hooks/useKioskStatus'

interface KioskStatusBannerProps {
  className?: string
}

export default function KioskStatusBanner({ className = '' }: KioskStatusBannerProps) {
  const { paperCount, status, isPaperOut } = useKioskStatus()

  // Nothing to show when everything is fine
  if (status === 'online' && !isPaperOut && paperCount > 50) return null

  const isLow = !isPaperOut && paperCount <= 50
  const bgColor = isPaperOut ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
  const iconColor = isPaperOut ? 'text-red-500' : 'text-amber-500'
  const textColor = isPaperOut ? 'text-red-700' : 'text-amber-700'

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 border-b px-4 py-2 flex items-center gap-3 ${bgColor} ${className}`}
      role="alert"
    >
      <AlertTriangle size={18} className={`shrink-0 ${iconColor}`} />
      <span className={`text-sm font-medium ${textColor}`}>
        {isPaperOut
          ? 'This kiosk is out of paper. Payments are temporarily disabled. Please try again later.'
          : isLow
          ? `Low paper warning: approximately ${paperCount} sheets remaining.`
          : 'Kiosk is currently offline. Please contact support.'}
      </span>
    </div>
  )
}

