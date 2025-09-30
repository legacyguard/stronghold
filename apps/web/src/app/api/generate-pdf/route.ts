import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    console.log('📄 Starting PDF generation request...', new Date().toISOString());

    // Create Supabase client with user's session
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ No authorization header provided');
      return NextResponse.json(
        { error: 'Unauthorized - No authorization header' },
        { status: 401 }
      );
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');

    // Set the session using the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message || 'No user found');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token or user not found' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', {
      user_id: user.id,
      email: user.email,
      timestamp: new Date().toISOString()
    });

    // Parse request body to get PDF generation parameters
    const body = await request.json().catch(() => ({}));
    const { document_type, template_name, data } = body;

    console.log('📋 PDF generation parameters:', {
      document_type: document_type || 'not_specified',
      template_name: template_name || 'not_specified',
      data_provided: !!data,
      user_id: user.id
    });

    // TODO: Implement actual PDF generation logic
    // For now, return a simple text response as requested
    console.log('🔄 [SKELETON] Would generate PDF for user:', user.email);
    console.log('🔄 [SKELETON] Document type:', document_type || 'default');
    console.log('🔄 [SKELETON] Template:', template_name || 'default_template');

    // Skeleton response - in future this would be actual PDF binary data
    const skeletonResponse = {
      success: true,
      message: 'PDF generation endpoint is working',
      details: {
        user_id: user.id,
        user_email: user.email,
        document_type: document_type || 'default',
        template_name: template_name || 'default_template',
        timestamp: new Date().toISOString(),
        status: 'skeleton_implementation'
      }
    };

    console.log('✅ PDF generation skeleton completed:', {
      user_id: user.id,
      document_type: document_type || 'default',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(skeletonResponse);

  } catch (error) {
    console.error('❌ Error in PDF generation:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle GET requests (for basic endpoint testing)
export async function GET(request: NextRequest) {
  console.log('📄 PDF generation endpoint accessed via GET');

  // For GET requests, just return basic info without auth check
  return NextResponse.json({
    message: 'PDF generation endpoint is working',
    method: 'GET',
    note: 'Use POST method with Authorization header for actual PDF generation',
    timestamp: new Date().toISOString()
  });
}