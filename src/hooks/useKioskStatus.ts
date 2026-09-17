import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { useSessionStore } from '../store/sessionStore'
import type { KioskHealth } from '../types'

const POLL_INTERVAL_MS = 30_000   // check every 30s

/**
 * useKioskStatus — polls the `kiosks` table for the current kiosk's paper count and status.
 * Exposes `paperCount` and `isPaperOut` so the UI can disable payment when paper = 0.
 * Falls back gracefully when Supabase is not configured.
 */
export function useKioskStatus(): KioskHealth & { isPaperOut: boolean } {
  const kioskId = useSessionStore((s) => s.kioskId)
  const [health, setHealth] = useState<KioskHealth>({
    paperCount: import.meta.env.VITE_PRINTER_SIM_MODE === 'paper_out' ? 0 : 999,
    status:     import.meta.env.VITE_PRINTER_SIM_MODE === 'offline' ? 'offline' : 'online',
    lastSeenAt: null,
  })

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const fetch = async () => {
      if (!supabase) return
      const { data } = await supabase
        .from('kiosks')
        .select('paper_count, status, last_seen_at')
        .eq('id', kioskId)
        .single()

      if (data) {
        setHealth({
          paperCount: data.paper_count as number,
          status:     data.status as KioskHealth['status'],
          lastSeenAt: data.last_seen_at as string,
        })
      }
    }

    void fetch()
    const interval = setInterval(fetch, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [kioskId])

  return { ...health, isPaperOut: health.paperCount === 0 }
}
