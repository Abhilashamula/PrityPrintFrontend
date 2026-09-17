import { Printer, Smartphone, Sparkles, UserRound } from 'lucide-react'

export default function PrinterScene() {
  return (
    <div className="printer-scene" aria-label="A student boy and girl using a 3D printer kiosk">
      <div className="printer-scene__floor" />

      <div className="printer-scene__person printer-scene__person--left">
        <span className="printer-scene__head printer-scene__head--boy" />
        <span className="printer-scene__body printer-scene__body--boy"><UserRound size={26} /></span>
        <span className="printer-scene__phone printer-scene__phone--left"><Smartphone size={17} /></span>
      </div>

      <div className="printer-scene__printer">
        <div className="printer-scene__top"><Sparkles size={17} /></div>
        <div className="printer-scene__screen"><Printer size={23} /></div>
        <div className="printer-scene__slot" />
        <div className="printer-scene__paper" />
        <div className="printer-scene__base" />
      </div>

      <div className="printer-scene__person printer-scene__person--right">
        <span className="printer-scene__head printer-scene__head--girl" />
        <span className="printer-scene__body printer-scene__body--girl"><UserRound size={26} /></span>
        <span className="printer-scene__phone printer-scene__phone--right"><Smartphone size={17} /></span>
      </div>
    </div>
  )
}
