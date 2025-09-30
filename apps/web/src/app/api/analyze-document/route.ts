import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import vision from '@google-cloud/vision';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
// LangSmith tracing will be enabled via environment variables
// LANGCHAIN_TRACING_V2=true and LANGCHAIN_API_KEY in production

// Response schema for validation
const AnalysisResultSchema = z.object({
  category: z.string(),
  confidence: z.number().min(0).max(1),
  metadata: z.object({
    documentType: z.string(),
    expirationDate: z.string().optional(),
    contractNumber: z.string().optional(),
    amount: z.string().optional(),
    issuer: z.string().optional(),
    keyDates: z.array(z.string()).optional(),
    importantNumbers: z.array(z.string()).optional(),
  }),
  suggestions: z.array(z.object({
    type: z.string(),
    description: z.string(),
    priority: z.enum(['high', 'medium', 'low'])
  })),
  description: z.string(),
});

type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

interface DocumentAnalysisResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
  message: string;
}

// OCR function using Google Vision AI
async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  try {
    // Initialize the Vision client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientOptions: any = {};

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      clientOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    } else if (process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      clientOptions.apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    }

    const client = new vision.ImageAnnotatorClient(clientOptions);

    const [result] = await client.textDetection({
      image: { content: imageBuffer }
    });

    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      return '';
    }

    return detections[0].description || '';
  } catch (error) {
    console.error('OCR extraction failed:', error);
    throw new Error('Failed to extract text from image');
  }
}

// AI analysis using OpenAI GPT-4
async function analyzeDocumentWithAI(extractedText: string, fileName: string): Promise<AnalysisResult> {
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.1,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const systemPrompt = `You are an intelligent document analyzer for a family legacy protection platform called LegacyGuard.

Your task is to analyze documents and extract structured metadata to help families organize their important papers.

Categories to choose from:
- Insurance (Poistenie) - health, car, home, life insurance policies
- Banking (Bankovníctvo) - bank statements, loan documents, mortgage papers
- Legal (Právne) - contracts, agreements, court documents, wills
- Medical (Zdravotné) - medical reports, prescriptions, vaccination records
- Property (Nehnuteľnosti) - property deeds, rental agreements, utility bills
- Vehicles (Vozidlá) - registration, technical inspection, purchase contracts
- Education (Vzdelanie) - diplomas, certificates, transcripts
- Personal (Osobné) - ID documents, passports, birth certificates
- Business (Podnikanie) - business licenses, tax documents, invoices
- Other (Ostatné) - anything that doesn't fit other categories

Always respond with a valid JSON object matching this exact structure:
{
  "category": "category_name",
  "confidence": 0.95,
  "metadata": {
    "documentType": "specific type like 'Car Insurance Policy'",
    "expirationDate": "YYYY-MM-DD or null",
    "contractNumber": "contract/policy number or null",
    "amount": "monetary amount with currency or null",
    "issuer": "company/organization name or null",
    "keyDates": ["YYYY-MM-DD", "..."],
    "importantNumbers": ["policy numbers", "account numbers", "..."]
  },
  "suggestions": [
    {
      "type": "reminder",
      "description": "Set reminder 30 days before expiration",
      "priority": "high"
    }
  ],
  "description": "Brief, helpful description of what this document is and why it's important for family legacy planning"
}

Be practical and helpful. Focus on information that would be valuable for family emergency planning and legacy organization.`;

  const userPrompt = `Please analyze this document:

Filename: ${fileName}
Extracted text:
${extractedText}

Provide analysis in the exact JSON format specified.`;

  try {
    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt)
    ]);

    const content = response.content as string;

    // Try to parse JSON from the response
    let jsonStr = content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsedResult = JSON.parse(jsonStr);

    // Validate the result against our schema
    const result = AnalysisResultSchema.parse(parsedResult);

    return result;
  } catch (error) {
    console.error('AI analysis failed:', error);
    throw new Error('Failed to analyze document with AI');
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<DocumentAnalysisResponse>> {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required',
        error: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'No file provided',
        error: 'FILE_MISSING'
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        message: 'File size exceeds 10MB limit',
        error: 'FILE_TOO_LARGE'
      }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';

    // Extract text based on file type
    if (file.type.startsWith('image/')) {
      // Use OCR for images
      extractedText = await extractTextFromImage(buffer);
    } else if (file.type === 'application/pdf') {
      // For PDFs, you might want to use a PDF parsing library
      // For now, we'll handle this as a limitation
      extractedText = `PDF file: ${file.name}. Note: PDF text extraction not yet implemented.`;
    } else if (file.type === 'text/plain') {
      // For text files
      extractedText = buffer.toString('utf8');
    } else {
      return NextResponse.json({
        success: false,
        message: 'Unsupported file type for AI analysis',
        error: 'UNSUPPORTED_FILE_TYPE'
      }, { status: 400 });
    }

    if (!extractedText.trim()) {
      return NextResponse.json({
        success: false,
        message: 'No text could be extracted from the document',
        error: 'NO_TEXT_EXTRACTED'
      }, { status: 400 });
    }

    // Analyze the document with AI
    const analysisResult = await analyzeDocumentWithAI(extractedText, file.name);

    return NextResponse.json({
      success: true,
      message: 'Document analyzed successfully',
      data: analysisResult
    });

  } catch (error) {
    console.error('Document analysis error:', error);

    return NextResponse.json({
      success: false,
      message: 'Failed to analyze document',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }, { status: 500 });
  }
}