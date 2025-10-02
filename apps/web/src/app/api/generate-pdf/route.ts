import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { pdfGenerator } from '@/lib/pdf/generator';
import { WillFormData, renderTemplate, getTemplateById } from '@/lib/will/templates';

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
    const { document_type, template_id, will_data, content } = body;

    console.log('📋 PDF generation parameters:', {
      document_type: document_type || 'will',
      template_id: template_id || 'not_specified',
      has_will_data: !!will_data,
      has_content: !!content,
      user_id: user.id
    });

    // Validate required parameters
    if (!content && !will_data) {
      return NextResponse.json(
        { error: 'Either content or will_data is required' },
        { status: 400 }
      );
    }

    let willContent: string;
    let willData: WillFormData;

    // Generate will content if not provided
    if (content) {
      willContent = content;
      willData = will_data || { fullName: user.email || 'Unknown User' } as WillFormData;
    } else if (will_data && template_id) {
      willData = will_data;
      const template = getTemplateById(template_id);

      if (!template) {
        return NextResponse.json(
          { error: `Template not found: ${template_id}` },
          { status: 400 }
        );
      }

      console.log(`📋 Using template: ${template.id} for jurisdiction: ${template.jurisdiction}`);
      willContent = renderTemplate(template, willData);
    } else {
      return NextResponse.json(
        { error: 'Invalid parameters. Either content or (will_data + template_id) required.' },
        { status: 400 }
      );
    }

    console.log('📄 Will content length:', willContent.length, 'characters');

    // Health check PDF service
    const isHealthy = await pdfGenerator.healthCheck();
    if (!isHealthy) {
      console.error('❌ PDF service is not healthy');
      return NextResponse.json(
        { error: 'PDF generation service unavailable' },
        { status: 503 }
      );
    }

    // Generate PDF
    console.log('🔄 Generating PDF with Puppeteer...');
    const pdfResult = await pdfGenerator.generateWillPDF(willContent, willData);

    if (!pdfResult.success) {
      console.error('❌ PDF generation failed:', pdfResult.error);
      return NextResponse.json(
        {
          error: 'PDF generation failed',
          details: pdfResult.error,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    console.log('✅ PDF generated successfully:', {
      filename: pdfResult.filename,
      pages: pdfResult.metadata.pages,
      size: pdfResult.metadata.size,
      user_id: user.id
    });

    // Save PDF generation record to database
    try {
      const { error: saveError } = await supabase
        .from('user_documents')
        .insert({
          user_id: user.id,
          document_type: 'will_pdf',
          filename: pdfResult.filename,
          file_size: pdfResult.metadata.size,
          metadata: {
            pages: pdfResult.metadata.pages,
            template_id: template_id,
            generated_at: pdfResult.metadata.generatedAt.toISOString()
          }
        });

      if (saveError) {
        console.warn('⚠️ Failed to save PDF record to database:', saveError);
      }
    } catch (dbError) {
      console.warn('⚠️ Database save error (non-critical):', dbError);
    }

    // Return PDF as binary response
    const response = new NextResponse(pdfResult.pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfResult.filename}"`,
        'Content-Length': pdfResult.metadata.size.toString(),
        'X-PDF-Pages': pdfResult.metadata.pages.toString(),
        'X-Generated-At': pdfResult.metadata.generatedAt.toISOString()
      }
    });

    console.log('✅ PDF response sent:', {
      filename: pdfResult.filename,
      size: pdfResult.metadata.size,
      user_id: user.id,
      timestamp: new Date().toISOString()
    });

    return response;

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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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