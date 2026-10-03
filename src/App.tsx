import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { useSessionStore } from './store/sessionStore'
import { usePricing } from './hooks/usePricing'
import KioskStatusBanner from './components/KioskStatusBanner'
import { apiClient } from './lib/apiClient'
import { useAuthStore } from './store/authStore'

// Screens
const WelcomeScreen = lazy(() => import('./screens/WelcomeScreen'))
const UploadScreen = lazy(() => import('./screens/UploadScreen'))
const PrintOptionsScreen = lazy(() => import('./screens/PrintOptionsScreen'))
const SummaryScreen = lazy(() => import('./screens/SummaryScreen'))
const PaymentScreen = lazy(() => import('./screens/PaymentScreen'))
const PrintingScreen = lazy(() => import('./screens/PrintingScreen'))
const DoneScreen = lazy(() => import('./screens/DoneScreen'))
const ErrorScreen = lazy(() => import('./screens/ErrorScreen'))
const SignupScreen = lazy(() => import('./screens/SignupScreen'))
const LoginScreen = lazy(() => import('./screens/LoginScreen'))
const AdminScreen = lazy(() => import('./screens/AdminScreen'))

export default function App() {
  // Load pricing from DB once on mount
  usePricing()

  // Read kiosk_id from URL query param (e.g. ?kiosk_id=kiosk_002)
  const setKioskId = useSessionStore((s) => s.setKioskId)
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clearUser)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const kiosk  = params.get('kiosk_id')
    if (kiosk) setKioskId(kiosk)
  }, [setKioskId])

  useEffect(() => {
    if (!apiClient.hasAccessToken()) return
    void apiClient.me().then(setUser).catch(() => {
      apiClient.logout()
      clearUser('Your session expired. Please sign in again.')
    })
  }, [clearUser, setUser])

  return (
    <BrowserRouter>
      {/* Global status banner — appears at the top when paper is low/out */}
      <KioskStatusBanner />

      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-lux-paper text-sm font-bold">Loading Ping &amp; Print...</div>}><Routes>
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
        <Route path="/admin"     element={<AdminScreen />} />
        {/* Catch-all back to home */}
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes></Suspense>
    </BrowserRouter>
  )
}
