import { AuthForm } from '@/components/AuthForm'
import { headers } from 'next/headers'
import { inferLanguage } from '@/lib/infer-language'

export default async function AuthPage() {
  // Server-side language inference
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language')
  const inferredLanguage = inferLanguage(acceptLanguage)

  // Note: The middleware should handle setting the locale cookie
  // We could set it here if needed, but next-intl middleware handles it

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuthForm />
    </div>
  )
}