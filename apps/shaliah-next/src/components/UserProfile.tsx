'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useTranslations } from 'next-intl'
import { getUserProfile } from '@/lib/supabase/database'
import { Database } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

export function UserProfile() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const t = useTranslations('UserProfile')

  useEffect(() => {
    if (user) {
      getUserProfile(user.id).then((data) => {
        setProfile(data)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [user])

  if (authLoading || loading) {
    return <div className="text-center">{t('loading')}</div>
  }

  if (!user) {
    return (
      <div>
        <p>Please sign in to view your profile</p>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">{t('welcome')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        {profile && (
          <>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <p className="text-sm text-muted-foreground">{profile.full_name || 'Not set'}</p>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <p className="text-sm text-muted-foreground">{profile.language}</p>
            </div>

            <div className="space-y-2">
              <Label>Member since</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </>
        )}

        <Button
          onClick={signOut}
          variant="destructive"
          className="w-full"
        >
          {t('signOut')}
        </Button>
      </CardContent>
    </Card>
  )
}