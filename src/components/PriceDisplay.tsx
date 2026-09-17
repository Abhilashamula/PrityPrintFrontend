import { IndianRupee } from 'lucide-react'

interface PriceDisplayProps {
  totalPages:  number
  totalCost:   number
  bwPerPage:   number
  colorPerPage:number
  colorMode:   'bw' | 'color'
  className?:  string
  large?:      boolean
}

export default function PriceDisplay({
  totalPages,
  totalCost,
  bwPerPage,
  colorPerPage,
  colorMode,
  className = '',
  large = false,
}: PriceDisplayProps) {
  const pricePerPage = colorMode === 'color' ? colorPerPage : bwPerPage
  const label        = colorMode === 'color' ? 'Color' : 'B&W'

  return (
    <div className={`rounded-2xl bg-gradient-to-br from-pp-blue to-pp-blue-dark text-white shadow-lg ${className}`}>
      <div className={`px-5 py-4 flex items-center justify-between ${large ? 'px-8 py-6' : ''}`}>
        <div>
          <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">
            Total to pay
          </p>
          <div className={`flex items-center gap-1 mt-1 ${large ? 'mt-2' : ''}`}>
            <IndianRupee
              size={large ? 32 : 22}
              strokeWidth={2.5}
              className="opacity-90"
            />
            <span className={`font-black leading-none ${large ? 'text-5xl' : 'text-3xl'}`}>
              {totalCost.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-blue-100 text-xs">
            {totalPages} {totalPages === 1 ? 'page' : 'pages'} × ₹{pricePerPage}/{label}
          </p>
          <div className="mt-2 flex gap-2 justify-end text-xs">
            <span className={`px-2 py-0.5 rounded-full font-semibold ${
              colorMode === 'bw'
                ? 'bg-white text-pp-blue'
                : 'bg-pp-orange text-white'
            }`}>
              {label}
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown line */}
      <div className="border-t border-white/20 px-5 py-2 text-xs text-blue-100 flex justify-between">
        <span>B&W: ₹{bwPerPage}/page</span>
        <span>Color: ₹{colorPerPage}/page</span>
      </div>
    </div>
  )
}

