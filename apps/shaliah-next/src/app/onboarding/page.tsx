'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { OnboardingForm } from '@/components/OnboardingForm'
import { inferLanguage } from '@/lib/infer-language'

export default function OnboardingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  // Infer language for the form default
  const inferredLanguage = inferLanguage()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <OnboardingForm initialLanguage={inferredLanguage} />
    </div>
  )
}