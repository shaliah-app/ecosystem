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
import { getUserProfile, updateUserProfile } from '@/lib/supabase/database'
import { Database } from '@/lib/supabase/types'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

const languageSchema = z.object({
  language: z.enum(['en-US', 'pt-BR', 'es', 'fr', 'de', 'uk', 'ru']),
})

type LanguageFormData = z.infer<typeof languageSchema>

export function ProfileDashboard() {
  const { user, signOut } = useAuth()
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
      loadProfile()
    }
  }, [user, loadProfile])

  const onLanguageChange = async (data: LanguageFormData) => {
    if (!user || !profile) return

    setUpdating(true)
    setError(null)

    try {
      const result = await updateUserProfile(user.id, {
        language: data.language,
      })

      if (result) {
        setProfile(result)
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