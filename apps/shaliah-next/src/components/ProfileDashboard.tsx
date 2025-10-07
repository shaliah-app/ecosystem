'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { getUserProfile } from '@/lib/supabase/database'
import { Database } from '@/lib/supabase/types'
import { User } from '@supabase/supabase-js'
import { EzerAuthSection } from '@/modules/ezer-auth/ui/components/EzerAuthSection'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

const languageSchema = z.object({
  language: z.enum(['en-US', 'pt-BR', 'es', 'fr', 'de', 'uk', 'ru']),
})

type LanguageFormData = z.infer<typeof languageSchema>

interface TestUser {
  id: string
  fullName?: string | null
  avatarUrl?: string | null
  language?: string
  email?: string
}

interface ProfileDashboardProps {
  user?: TestUser | User
}

function isTestUser(user: TestUser | User): user is TestUser {
  return 'fullName' in user
}

export function ProfileDashboard({ user: propUser }: ProfileDashboardProps = {}) {
  const { user: authUser, signOut } = useAuth()
  const user = propUser !== undefined ? propUser : authUser
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations('profile')

  const form = useForm<LanguageFormData>({
    resolver: zodResolver(languageSchema),
    defaultValues: {
      language: 'pt-BR',
    },
  })

  const loadProfile = useCallback(async () => {
    if (!user) return

    try {
      const data = await getUserProfile(user.id)
      setProfile(data)
      if (data) {
        form.reset({ language: data.language as 'en-US' | 'pt-BR' | 'es' | 'fr' | 'de' | 'uk' | 'ru' })
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [user, form])

  useEffect(() => {
    if (user) {
      if (propUser) {
        // For testing: create a mock profile from the user prop
        if (isTestUser(user)) {
          setProfile({
            id: user.id,
            full_name: user.fullName || null,
            avatar_url: user.avatarUrl || null,
            language: user.language || 'en-US',
            active_space_id: null,
            telegram_user_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          form.reset({ language: (user.language || 'en-US') as 'en-US' | 'pt-BR' | 'es' | 'fr' | 'de' | 'uk' | 'ru' })
        }
        setLoading(false)
      } else {
        loadProfile()
      }
    } else {
      setLoading(false)
    }
  }, [user, propUser, loadProfile, form])

  const onLanguageChange = async (data: LanguageFormData) => {
    if (!user || !profile) return

    setUpdating(true)
    setError(null)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: data.language }),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        // The backend should set the locale cookie
        // For now, we might need to reload or handle locale change
      } else {
        setError('Failed to update language')
      }
    } catch (err) {
      console.error('Error updating language:', err)
      setError('Failed to update language')
    } finally {
      setUpdating(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return <div className="text-center">Loading...</div>
  }

  if (!user || !profile) {
    return <div className="text-center">Please sign in</div>
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const languageOptions = [
    { value: 'en-US', label: 'English' },
    { value: 'pt-BR', label: 'Português' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'uk', label: 'Українська' },
    { value: 'ru', label: 'Русский' },
  ]

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar and Name */}
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-20 h-20">
            <AvatarFallback className="text-lg">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className="text-lg font-semibold">{profile.full_name || 'No name set'}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* Profile Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Member since</label>
            <p className="text-sm text-muted-foreground">
              {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Language Selection */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onLanguageChange)} className="space-y-4">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('changeLanguage')}</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        // Auto-submit on change
                        form.handleSubmit(onLanguageChange)()
                      }}
                      value={field.value}
                      disabled={updating}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {languageOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          {error && (
            <div className="text-sm text-destructive text-center">
              {error}
            </div>
          )}
        </div>

        {/* Ezer Bot Authentication */}
        <EzerAuthSection />

        {/* Sign Out */}
        <Button
          onClick={handleSignOut}
          variant="destructive"
          className="w-full"
        >
          Sign Out
        </Button>
      </CardContent>
    </Card>
  )
}