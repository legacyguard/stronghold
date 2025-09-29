"use server";

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface AddGuardianResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    name: string;
    email: string;
  };
  error?: string;
}

export async function addGuardian(formData: FormData): Promise<AddGuardianResponse> {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    // Validation
    if (!name || name.trim().length === 0) {
      return {
        success: false,
        message: 'Name is required',
        error: 'NAME_REQUIRED'
      };
    }

    if (!email || email.trim().length === 0) {
      return {
        success: false,
        message: 'Email is required',
        error: 'EMAIL_REQUIRED'
      };
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: 'Please enter a valid email address',
        error: 'INVALID_EMAIL'
      };
    }

    // Create Supabase client with server-side authentication
    const supabase = createServerComponentClient({ cookies });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'AUTH_REQUIRED'
      };
    }

    // Check if guardian with this email already exists for this user
    const { data: existingGuardian, error: checkError } = await supabase
      .from('guardians')
      .select('id')
      .eq('user_id', user.id)
      .eq('email', email.trim().toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Check existing guardian error:', checkError);
      return {
        success: false,
        message: 'Failed to check existing guardians',
        error: 'CHECK_FAILED'
      };
    }

    if (existingGuardian) {
      return {
        success: false,
        message: 'Guardian with this email already exists',
        error: 'GUARDIAN_EXISTS'
      };
    }

    // Insert new guardian
    const { data: guardianData, error: dbError } = await supabase
      .from('guardians')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        user_id: user.id,
        status: 'invited', // Default status
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return {
        success: false,
        message: 'Failed to add guardian',
        error: 'DB_INSERT_FAILED'
      };
    }

    return {
      success: true,
      message: 'Guardian added successfully',
      data: {
        id: guardianData.id,
        name: guardianData.name,
        email: guardianData.email
      }
    };

  } catch (error) {
    console.error('Unexpected error in addGuardian:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: 'UNKNOWN_ERROR'
    };
  }
}

export async function getGuardiansForUser() {
  try {
    // Create Supabase client with server-side authentication
    const supabase = createServerComponentClient({ cookies });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Fetch guardians for the authenticated user
    const { data: guardians, error: dbError } = await supabase
      .from('guardians')
      .select('id, name, email, status, created_at')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to fetch guardians');
    }

    return guardians || [];

  } catch (error) {
    console.error('Error in getGuardiansForUser:', error);
    throw error;
  }
}