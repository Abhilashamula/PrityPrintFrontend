import { Printer, Smartphone, Sparkles, UserRound } from 'lucide-react'

export default function PrinterScene() {
  return (
    <div className="printer-scene" aria-label="A student boy and girl using a modern 3D printer kiosk">
      <div className="printer-scene__floor" />

      {/* Boy (Left) */}
      <div className="printer-scene__person printer-scene__person--left">
        <span className="printer-scene__head printer-scene__head--boy" />
        <span className="printer-scene__eye printer-scene__eye--left" />
        <span className="printer-scene__eye printer-scene__eye--right" />
        <span className="printer-scene__mouth" />
        <span className="printer-scene__blush printer-scene__blush--left" />
        <span className="printer-scene__blush printer-scene__blush--right" />
        <span className="printer-scene__body printer-scene__body--boy">
          <UserRound size={28} strokeWidth={2.5} />
        </span>
        <span className="printer-scene__phone printer-scene__phone--left">
          <Smartphone size={18} strokeWidth={2.5} />
        </span>
      </div>

      {/* Modern Kiosk Printer (Center) */}
      <div className="printer-scene__printer">
        <div className="printer-scene__base" />
        <div className="printer-scene__slot-bg" />
        <div className="printer-scene__paper" />
        <div className="printer-scene__slot-cover" />
        <div className="printer-scene__screen">
          <Printer size={28} strokeWidth={2} />
        </div>
        <div className="printer-scene__top">
          <Sparkles size={18} strokeWidth={2.5} />
        </div>
      </div>

      {/* Girl (Right) */}
      <div className="printer-scene__person printer-scene__person--right">
        <span className="printer-scene__hair" />
        <span className="printer-scene__head printer-scene__head--girl" />
        <span className="printer-scene__eye printer-scene__eye--left" />
        <span className="printer-scene__eye printer-scene__eye--right" />
        <span className="printer-scene__mouth" />
        <span className="printer-scene__blush printer-scene__blush--left" />
        <span className="printer-scene__blush printer-scene__blush--right" />
        <span className="printer-scene__earring printer-scene__earring--left" />
        <span className="printer-scene__earring printer-scene__earring--right" />
        <span className="printer-scene__necklace" />
        <span className="printer-scene__body printer-scene__body--girl">
          <UserRound size={28} strokeWidth={2.5} />
        </span>
        <span className="printer-scene__phone printer-scene__phone--right">
          <Smartphone size={18} strokeWidth={2.5} />
        </span>
      </div>
    </div>
  )
}