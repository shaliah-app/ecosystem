import { NextRequest, NextResponse } from 'next/server'
import { updateUserProfile } from '@/lib/supabase/database'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    // Get the current session using Supabase server client
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { language } = body

    if (!language) {
      return NextResponse.json({ error: 'Language is required' }, { status: 400 })
    }

    // Update the user profile
    const updatedProfile = await updateUserProfile(user.id, { language })

    if (!updatedProfile) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}