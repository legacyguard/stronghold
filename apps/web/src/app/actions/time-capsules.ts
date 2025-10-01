'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export interface TimeCapsuleData {
  title: string
  message: string
  messageType: 'text' | 'audio' | 'video'
  deliveryDate: string
  recipientEmail?: string
  recipientName?: string
}

export interface TimeCapsule {
  id: string
  user_id: string
  title: string
  message: string
  message_type: 'text' | 'audio' | 'video'
  file_url?: string
  delivery_date: string
  recipient_email?: string
  recipient_name?: string
  is_delivered: boolean
  created_at: string
  updated_at: string
}

export async function createTimeCapsule(data: TimeCapsuleData, file?: File) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Authentication required')
    }

    let fileUrl: string | undefined

    // Upload file if provided (audio/video)
    if (file && (data.messageType === 'audio' || data.messageType === 'video')) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const filePath = `time-capsules/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('time-capsules')
        .upload(filePath, file)

      if (uploadError) {
        console.error('File upload error:', uploadError)
        throw new Error('Failed to upload file')
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('time-capsules')
        .getPublicUrl(filePath)

      fileUrl = publicUrl
    }

    // Create time capsule record
    const { data: timeCapsule, error: insertError } = await supabase
      .from('time_capsules')
      .insert({
        user_id: user.id,
        title: data.title,
        message: data.message,
        message_type: data.messageType,
        file_url: fileUrl,
        delivery_date: data.deliveryDate,
        recipient_email: data.recipientEmail || null,
        recipient_name: data.recipientName || null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw new Error('Failed to create time capsule')
    }

    // Update user progress
    await updateUserProgressForTimeCapsule(user.id)

    // Check for milestones
    await checkTimeCapsuleMilestones(user.id)

    revalidatePath('/dashboard')
    revalidatePath('/time-capsules')

    return { success: true, data: timeCapsule }
  } catch (error) {
    console.error('Create time capsule error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getTimeCapsules() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Authentication required')
    }

    const { data: timeCapsules, error } = await supabase
      .from('time_capsules')
      .select('*')
      .eq('user_id', user.id)
      .order('delivery_date', { ascending: true })

    if (error) {
      console.error('Get time capsules error:', error)
      throw new Error('Failed to fetch time capsules')
    }

    return { success: true, data: timeCapsules || [] }
  } catch (error) {
    console.error('Get time capsules error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}

export async function deleteTimeCapsule(timeCapsuleId: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Authentication required')
    }

    // Get time capsule to check file_url
    const { data: timeCapsule } = await supabase
      .from('time_capsules')
      .select('file_url')
      .eq('id', timeCapsuleId)
      .eq('user_id', user.id)
      .single()

    // Delete file from storage if exists
    if (timeCapsule?.file_url) {
      const filePath = timeCapsule.file_url.split('/').slice(-2).join('/')
      await supabase.storage
        .from('time-capsules')
        .remove([filePath])
    }

    // Delete time capsule record
    const { error: deleteError } = await supabase
      .from('time_capsules')
      .delete()
      .eq('id', timeCapsuleId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Delete time capsule error:', deleteError)
      throw new Error('Failed to delete time capsule')
    }

    revalidatePath('/dashboard')
    revalidatePath('/time-capsules')

    return { success: true }
  } catch (error) {
    console.error('Delete time capsule error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function updateUserProgressForTimeCapsule(userId: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    // Update time capsules count and last activity
    const { error } = await supabase
      .from('user_progress')
      .update({
        time_capsules_created: supabase.rpc('increment_time_capsules'),
        last_activity_date: new Date().toISOString().split('T')[0]
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Update user progress error:', error)
    }
  } catch (error) {
    console.error('Update user progress error:', error)
  }
}

async function checkTimeCapsuleMilestones(userId: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    // Get current time capsule count
    const { data: progress } = await supabase
      .from('user_progress')
      .select('time_capsules_created')
      .eq('user_id', userId)
      .single()

    if (!progress) return

    const milestones = [
      { count: 1, type: 'first_time_capsule', title: 'Prvá časová schránka', points: 15 },
      { count: 5, type: 'time_capsule_creator', title: 'Tvorca časových schránok', points: 25 },
      { count: 10, type: 'time_capsule_master', title: 'Majster časových schránok', points: 50 }
    ]

    for (const milestone of milestones) {
      if (progress.time_capsules_created >= milestone.count) {
        // Check if milestone already exists
        const { data: existing } = await supabase
          .from('user_milestones')
          .select('id')
          .eq('user_id', userId)
          .eq('milestone_type', milestone.type)
          .single()

        if (!existing) {
          // Create new milestone
          await supabase
            .from('user_milestones')
            .insert({
              user_id: userId,
              milestone_type: milestone.type,
              milestone_title: milestone.title,
              milestone_description: `Vytvoril si ${milestone.count} časov${milestone.count === 1 ? 'ú schránku' : milestone.count < 5 ? 'é schránky' : 'ých schránok'}`,
              is_achieved: true,
              achieved_at: new Date().toISOString(),
              points_awarded: milestone.points
            })

          // Update total points
          await supabase
            .from('user_progress')
            .update({
              total_points: supabase.rpc('add_points', { points: milestone.points }),
              milestones_achieved: supabase.rpc('increment_milestones')
            })
            .eq('user_id', userId)
        }
      }
    }
  } catch (error) {
    console.error('Check time capsule milestones error:', error)
  }
}