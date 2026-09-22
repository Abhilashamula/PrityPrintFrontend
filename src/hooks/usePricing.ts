import { useEffect } from 'react'
import { useSessionStore, DEFAULT_PRICING } from '../store/sessionStore'
import { apiClient } from '../lib/apiClient'

/**
 * usePricing — fetches the master pricing configuration from the backend.
 */
export function usePricing() {
  const setPricing = useSessionStore((s) => s.setPricing)

  useEffect(() => {
    void apiClient.pricing().then((data) => {
      setPricing({
        bwPerPage: data.price_bw_minor / 100,
        colorPerPage: data.price_color_minor / 100,
        maxFileMb: data.max_file_mb,
      })
    }).catch(() => setPricing(DEFAULT_PRICING))
  }, [setPricing])
}

