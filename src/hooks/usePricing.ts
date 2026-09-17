import { useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { useSessionStore, DEFAULT_PRICING } from '../store/sessionStore'
import type { PricingConfig } from '../types'

/**
 * usePricing — fetches pricing config from the `pricing_config` Supabase table once on mount.
 * Falls back to env-var defaults when Supabase is not yet configured.
 */
export function usePricing() {
  const setPricing = useSessionStore((s) => s.setPricing)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    supabase
      .from('pricing_config')
      .select('key, value')
      .then(({ data, error }) => {
        if (error || !data) return
        const map: Record<string, string> = {}
        for (const row of data) map[row.key] = row.value

        const pricing: PricingConfig = {
          bwPerPage:    Number(map['price_bw_per_page']    ?? DEFAULT_PRICING.bwPerPage),
          colorPerPage: Number(map['price_color_per_page'] ?? DEFAULT_PRICING.colorPerPage),
          maxFileMb:    Number(map['max_file_mb']          ?? DEFAULT_PRICING.maxFileMb),
        }
        setPricing(pricing)
      })
  }, [setPricing])
}

