import { useState } from 'react'
import { ChevronDown, LogOut, WalletCards } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../lib/apiClient'
import { useAuthStore } from '../store/authStore'

export default function AccountMenu() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearUser = useAuthStore((state) => state.clearUser)
  const [open, setOpen] = useState(false)

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/login')} className="border border-lux-ink/15 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.1em] text-lux-ink hover:border-lux-copper hover:text-lux-copper">Sign in</button>
        <button onClick={() => navigate('/signup')} className="bg-lux-ink px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.1em] text-lux-paper hover:bg-lux-copper">Sign up</button>
      </div>
    )
  }

  const initials = user.name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  const balance = (user.wallet.balanceMinor / 100).toFixed(2)

  const logout = () => {
    apiClient.logout()
    clearUser('You have been logged out successfully.')
    navigate('/')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-12 items-center gap-2 border border-lux-ink/10 bg-white/70 px-2.5 py-2 hover:border-lux-copper"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lux-ink text-xs font-extrabold text-lux-paper">{initials}</span>
        <span className="hidden max-w-32 truncate text-left text-xs font-extrabold sm:block">{user.name}</span>
        <ChevronDown size={15} className="text-lux-ink/50" />
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-72 border border-lux-ink/10 bg-white p-4 shadow-xl" role="menu">
          <p className="truncate text-sm font-extrabold text-lux-ink">{user.name}</p>
          <p className="mt-1 truncate text-xs text-lux-ink/50">{user.email}</p>
          <div className="mt-4 flex items-center justify-between border-y border-lux-ink/10 py-3">
            <span className="flex items-center gap-2 text-xs font-bold text-lux-ink/55"><WalletCards size={16} className="text-lux-copper" /> Wallet</span>
            <span className="text-sm font-extrabold">₹{balance}</span>
          </div>
          <button onClick={logout} className="mt-3 flex min-h-10 w-full items-center gap-2 text-left text-xs font-extrabold uppercase tracking-[0.1em] text-red-600 hover:text-red-700" role="menuitem">
            <LogOut size={15} /> Log out
          </button>
        </div>
      )}
    </div>
  )
}
