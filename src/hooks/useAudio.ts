import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * useAudio — wraps HTMLAudioElement with:
 *   - Lazy initialisation (respects browser autoplay policy)
 *   - Mute/unmute toggle persisted for the session
 *   - playGreeting() triggers on first user interaction
 */
export function useAudio(src = '/audio/welcome.mp3') {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [played, setPlayed] = useState(false)

  // Create audio element once
  useEffect(() => {
    const audio = new Audio(src)
    audio.preload = 'auto'
    audio.muted = false
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [src])

  const playGreeting = useCallback(() => {
    const audio = audioRef.current
    if (!audio || played) return
    if (isMuted) return
    setPlayed(true)
    audio.currentTime = 0
    audio.play().catch(() => {
      // Browser blocked autoplay — silently ignore.
      // The caption below the welcome screen still shows the text.
    })
  }, [isMuted, played])

  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      const next = !m
      if (audioRef.current) audioRef.current.muted = next
      return next
    })
  }, [])

  return { isMuted, toggleMute, playGreeting }
}

