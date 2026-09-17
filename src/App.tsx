import AdminScreen     from './screens/AdminScreen'
  <Route path="/admin"      element={<AdminScreen />} />
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useSessionStore } from './store/sessionStore'
import { usePricing } from './hooks/usePricing'
import KioskStatusBanner from './components/KioskStatusBanner'

// Screens
import WelcomeScreen    from './screens/WelcomeScreen'
import UploadScreen     from './screens/UploadScreen'
import PrintOptionsScreen from './screens/PrintOptionsScreen'
import SummaryScreen    from './screens/SummaryScreen'
import PaymentScreen    from './screens/PaymentScreen'
import PrintingScreen   from './screens/PrintingScreen'
import DoneScreen       from './screens/DoneScreen'
import ErrorScreen      from './screens/ErrorScreen'
import SignupScreen     from './screens/SignupScreen'
import LoginScreen      from './screens/LoginScreen'

export default function App() {
  // Load pricing from DB once on mount
  usePricing()

  // Read kiosk_id from URL query param (e.g. ?kiosk_id=kiosk_002)
  const setKioskId = useSessionStore((s) => s.setKioskId)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const kiosk  = params.get('kiosk_id')
    if (kiosk) setKioskId(kiosk)
  }, [setKioskId])

  return (
    <BrowserRouter>
      {/* Global status banner — appears at the top when paper is low/out */}
      <KioskStatusBanner />

      <Routes>
        <Route path="/"          element={<WelcomeScreen />} />
        <Route path="/upload"    element={<UploadScreen />} />
        <Route path="/options"   element={<PrintOptionsScreen />} />
        <Route path="/summary"   element={<SummaryScreen />} />
        <Route path="/pay"       element={<PaymentScreen />} />
        <Route path="/printing"  element={<PrintingScreen />} />
        <Route path="/done"      element={<DoneScreen />} />
        <Route path="/error"     element={<ErrorScreen />} />
        <Route path="/signup"    element={<SignupScreen />} />
        <Route path="/login"     element={<LoginScreen />} />
        {/* Catch-all back to home */}
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

