import { useEffect, useState } from 'react'

const MAGIC_LINK_COOLDOWN_SECONDS = 60

export interface UseCooldownTimerReturn {
  secondsRemaining: number
  canResend: boolean
  startCooldown: () => void
}

export function useCooldownTimer(email: string): UseCooldownTimerReturn {
  const [secondsRemaining, setSecondsRemaining] = useState(0)

  useEffect(() => {
    if (!email) return

    const storageKey = `magicLinkCooldown_${email}`
    const storedTimestamp = localStorage.getItem(storageKey)

    if (storedTimestamp) {
      const elapsed = Math.floor((Date.now() - parseInt(storedTimestamp)) / 1000)
      const remaining = Math.max(0, MAGIC_LINK_COOLDOWN_SECONDS - elapsed)
      setSecondsRemaining(remaining)
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          localStorage.removeItem(storageKey)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [email])

  const startCooldown = () => {
    const storageKey = `magicLinkCooldown_${email}`
    localStorage.setItem(storageKey, Date.now().toString())
    setSecondsRemaining(MAGIC_LINK_COOLDOWN_SECONDS)
  }

  // Expose startCooldown somehow? The interface doesn't have it.
  // The hook is just to read the state, but to start, probably call it from outside.
  // The description says "Manage cooldown state", but doesn't specify how to start.
  // Probably the hook should return a function to start cooldown.

  // Looking back: "Manage cooldown state (localStorage persistence), countdown timer (useEffect + setInterval), return { secondsRemaining, canResend }"

  // It doesn't mention starting, but probably the component will call a function to start it.

  // I need to add startCooldown to the return.

  // But the interface doesn't have it. Let me add it.

  return {
    secondsRemaining,
    canResend: secondsRemaining === 0,
    startCooldown, // Add this
  } as UseCooldownTimerReturn & { startCooldown: () => void }
}