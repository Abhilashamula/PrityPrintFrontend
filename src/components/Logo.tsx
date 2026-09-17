import { Printer } from 'lucide-react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

const sizeMap = {
  sm: { icon: 24, text: 'text-xl',   sub: 'text-xs',  gap: 'gap-2' },
  md: { icon: 36, text: 'text-2xl',  sub: 'text-sm',  gap: 'gap-3' },
  lg: { icon: 52, text: 'text-4xl',  sub: 'text-base',gap: 'gap-4' },
  xl: { icon: 72, text: 'text-6xl',  sub: 'text-lg',  gap: 'gap-5' },
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const s = sizeMap[size]

  return (
    <div className={`flex flex-col items-center ${s.gap} ${className}`}>
      {/* Icon badge */}
      <div className="relative">
        <div
          className="rounded-3xl bg-gradient-to-br from-pp-blue to-pp-blue-dark shadow-xl flex items-center justify-center"
          style={{ width: s.icon * 1.6, height: s.icon * 1.6 }}
        >
          <Printer size={s.icon} className="text-white" strokeWidth={1.5} />
        </div>
        {/* Orange dot — "online" indicator */}
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pp-orange border-2 border-white shadow" />
      </div>

      {showText && (
        <div className="text-center leading-tight">
          <p className={`font-black tracking-tight text-pp-dark ${s.text}`}>
            Ping<span className="text-pp-orange">&</span>Print
          </p>
          <p className={`text-pp-gray font-medium ${s.sub}`}>
            Print Your World, Instantly!
          </p>
        </div>
      )}
    </div>
  )
}

