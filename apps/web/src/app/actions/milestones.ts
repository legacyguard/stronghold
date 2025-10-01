'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export interface Milestone {
  id: string
  user_id: string
  milestone_type: string
  milestone_title: string
  milestone_description?: string
  is_achieved: boolean
  achieved_at?: string
  points_awarded: number
  created_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  total_points: number
  documents_uploaded: number
  time_capsules_created: number
  milestones_achieved: number
  current_streak_days: number
  longest_streak_days: number
  last_activity_date: string
  created_at: string
  updated_at: string
}

export async function getUserMilestones() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Authentication required')
    }

    const { data: milestones, error } = await supabase
      .from('user_milestones')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get milestones error:', error)
      throw new Error('Failed to fetch milestones')
    }

    return { success: true, data: milestones || [] }
  } catch (error) {
    console.error('Get milestones error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}

export async function getUserProgress() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Authentication required')
    }

    const { data: progress, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Get user progress error:', error)
      throw new Error('Failed to fetch user progress')
    }

    return { success: true, data: progress }
  } catch (error) {
    console.error('Get user progress error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

export async function checkAndAwardMilestone(milestoneType: string, customData?: Record<string, unknown>) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Authentication required')
    }

    // Check if milestone already exists
    const { data: existing } = await supabase
      .from('user_milestones')
      .select('id')
      .eq('user_id', user.id)
      .eq('milestone_type', milestoneType)
      .single()

    if (existing) {
      return { success: true, alreadyAchieved: true }
    }

    // Get milestone definition
    const milestoneDefinition = getMilestoneDefinition(milestoneType, customData)
    if (!milestoneDefinition) {
      throw new Error('Invalid milestone type')
    }

    // Create new milestone
    const { data: milestone, error: insertError } = await supabase
      .from('user_milestones')
      .insert({
        user_id: user.id,
        milestone_type: milestoneType,
        milestone_title: milestoneDefinition.title,
        milestone_description: milestoneDefinition.description,
        is_achieved: true,
        achieved_at: new Date().toISOString(),
        points_awarded: milestoneDefinition.points
      })
      .select()
      .single()

    if (insertError) {
      console.error('Create milestone error:', insertError)
      throw new Error('Failed to create milestone')
    }

    // Update user progress with points and milestone count
    await updateUserProgressPoints(user.id, milestoneDefinition.points)

    revalidatePath('/dashboard')
    revalidatePath('/milestones')

    return { success: true, milestone, newAchievement: true }
  } catch (error) {
    console.error('Check and award milestone error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function updateUserStreak() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Authentication required')
    }

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Get current progress
    const { data: progress } = await supabase
      .from('user_progress')
      .select('current_streak_days, longest_streak_days, last_activity_date')
      .eq('user_id', user.id)
      .single()

    if (!progress) return { success: false, error: 'Progress not found' }

    let newStreak = 1
    let newLongestStreak = progress.longest_streak_days

    if (progress.last_activity_date === today) {
      // Already updated today
      return { success: true, noUpdate: true }
    } else if (progress.last_activity_date === yesterday) {
      // Continue streak
      newStreak = progress.current_streak_days + 1
    }
    // else: streak broken, start new (newStreak = 1)

    if (newStreak > newLongestStreak) {
      newLongestStreak = newStreak
    }

    // Update progress
    const { error: updateError } = await supabase
      .from('user_progress')
      .update({
        current_streak_days: newStreak,
        longest_streak_days: newLongestStreak,
        last_activity_date: today
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Update streak error:', updateError)
      throw new Error('Failed to update streak')
    }

    // Check for streak milestones
    await checkStreakMilestones(user.id, newStreak, newLongestStreak)

    return { success: true, newStreak, newLongestStreak }
  } catch (error) {
    console.error('Update user streak error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function updateUserProgressPoints(userId: string, points: number) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    // Get current progress
    const { data: currentProgress } = await supabase
      .from('user_progress')
      .select('total_points, milestones_achieved')
      .eq('user_id', userId)
      .single()

    if (currentProgress) {
      const { error } = await supabase
        .from('user_progress')
        .update({
          total_points: currentProgress.total_points + points,
          milestones_achieved: currentProgress.milestones_achieved + 1
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Update progress points error:', error)
      }
    }
  } catch (error) {
    console.error('Update progress points error:', error)
  }
}

async function checkStreakMilestones(userId: string, currentStreak: number, longestStreak: number) {
  const streakMilestones = [
    { days: 3, type: 'streak_3_days', title: '3-dňová série', points: 10 },
    { days: 7, type: 'streak_week', title: 'Týždenná série', points: 25 },
    { days: 30, type: 'streak_month', title: 'Mesačná série', points: 50 },
    { days: 100, type: 'streak_century', title: 'Storočná série', points: 100 }
  ]

  for (const milestone of streakMilestones) {
    if (currentStreak >= milestone.days || longestStreak >= milestone.days) {
      await checkAndAwardMilestone(milestone.type, { days: milestone.days })
    }
  }
}

function getMilestoneDefinition(type: string, _customData?: Record<string, unknown>) {
  const definitions: Record<string, { title: string; description: string; points: number }> = {
    // First achievements
    'first_login': {
      title: 'Prvé prihlásenie',
      description: 'Vitajte v LegacyGuard! Urobili ste prvý krok k ochrane svojho rodinného dedičstva.',
      points: 5
    },
    'first_document': {
      title: 'Prvý dokument',
      description: 'Nahráli ste svoj prvý dokument. Vaše dôležité papiere sú teraz v bezpečí.',
      points: 10
    },
    'first_time_capsule': {
      title: 'Prvá časová schránka',
      description: 'Vytvorili ste svoju prvú časovú schránku. Vaše spomienky sú teraz uložené pre budúcnosť.',
      points: 15
    },

    // Document milestones
    'document_organizer': {
      title: 'Organizátor dokumentov',
      description: 'Nahráli ste 5 dokumentov. Vaša digitálna knižnica rastie!',
      points: 20
    },
    'document_master': {
      title: 'Majster dokumentov',
      description: 'Nahráli ste 10 dokumentov. Ste skúsený správca digitálnych dokumentov.',
      points: 35
    },
    'document_archivist': {
      title: 'Archivár',
      description: 'Nahráli ste 25 dokumentov. Vaša zbierka je skutočne impozantná!',
      points: 75
    },

    // Time capsule milestones
    'time_capsule_creator': {
      title: 'Tvorca časových schránok',
      description: 'Vytvorili ste 5 časových schránok. Vaše spomienky pre budúcnosť sú bohaté.',
      points: 25
    },
    'time_capsule_master': {
      title: 'Majster časových schránok',
      description: 'Vytvorili ste 10 časových schránok. Ste skutočný strážca spomienok!',
      points: 50
    },

    // Streak milestones
    'streak_3_days': {
      title: '3-dňová séria',
      description: 'Boli ste aktívni 3 dni po sebe. Skvelé tempo!',
      points: 10
    },
    'streak_week': {
      title: 'Týždenná séria',
      description: 'Týždeň aktivity! Vaša disciplína je obdivuhodná.',
      points: 25
    },
    'streak_month': {
      title: 'Mesačná séria',
      description: 'Celý mesiac aktivity! Ste skutočný šampión v ochrane dedičstva.',
      points: 50
    },
    'streak_century': {
      title: 'Storočná séria',
      description: '100 dní aktivity! Vaša oddanosť je legendárna.',
      points: 100
    },

    // Special milestones
    'early_adopter': {
      title: 'Prvý používateľ',
      description: 'Patríte medzi prvých používateľov LegacyGuard. Ďakujeme za dôveru!',
      points: 30
    },
    'family_protector': {
      title: 'Ochránca rodiny',
      description: 'Dokončili ste základné nastavenie na ochranu svojej rodiny.',
      points: 40
    },
    'legacy_builder': {
      title: 'Staviteľ dedičstva',
      description: 'Vytvorili ste kompletný profil na ochranu svojho dedičstva.',
      points: 60
    }
  }

  return definitions[type] || null
}