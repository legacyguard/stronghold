"use server";

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    fileName: string;
    filePath: string;
  };
  error?: string;
}

interface AIAnalysisData {
  category: string;
  confidence: number;
  metadata: {
    documentType: string;
    expirationDate?: string;
    contractNumber?: string;
    amount?: string;
    issuer?: string;
    keyDates?: string[];
    importantNumbers?: string[];
  };
  suggestions: Array<{
    type: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  description: string;
  extractedText?: string;
}

export async function uploadDocument(formData: FormData): Promise<UploadResponse> {
  try {
    const file = formData.get('file') as File;

    if (!file) {
      return {
        success: false,
        message: 'No file provided',
        error: 'FILE_MISSING'
      };
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return {
        success: false,
        message: 'File size exceeds 10MB limit',
        error: 'FILE_TOO_LARGE'
      };
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        message: 'File type not supported',
        error: 'INVALID_FILE_TYPE'
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

    // Generate unique file name
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${user.id}/${uniqueFileName}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user_documents')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        message: 'Failed to upload file to storage',
        error: 'UPLOAD_FAILED'
      };
    }

    // Save document metadata to database
    const { data: documentData, error: dbError } = await supabase
      .from('documents')
      .insert({
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        file_type: file.type,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);

      // Cleanup: delete uploaded file if database insert failed
      await supabase.storage
        .from('user_documents')
        .remove([uploadData.path]);

      return {
        success: false,
        message: 'Failed to save document metadata',
        error: 'DB_INSERT_FAILED'
      };
    }

    return {
      success: true,
      message: 'Document uploaded successfully',
      data: {
        id: documentData.id,
        fileName: file.name,
        filePath: uploadData.path
      }
    };

  } catch (error) {
    console.error('Unexpected error in uploadDocument:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: 'UNKNOWN_ERROR'
    };
  }
}

// Simplified addDocument function for metadata only (for testing basic flow)
export async function addDocument(fileName: string, description?: string) {
  try {
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

    // Insert document metadata only (for basic end-to-end testing)
    const { data: documentData, error: dbError } = await supabase
      .from('documents')
      .insert({
        file_name: fileName,
        file_path: `placeholder/${fileName}`, // Placeholder path for testing
        file_size: 0, // Placeholder size
        file_type: 'text/plain', // Placeholder type
        description: description || null,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return {
        success: false,
        message: 'Failed to save document metadata',
        error: 'DB_INSERT_FAILED'
      };
    }

    return {
      success: true,
      message: 'Document added successfully',
      data: {
        id: documentData.id,
        fileName: fileName
      }
    };

  } catch (error) {
    console.error('Error in addDocument:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: 'UNKNOWN_ERROR'
    };
  }
}

// New function to save document with AI analysis data
export async function saveDocumentWithAI(
  file: File,
  aiAnalysis: AIAnalysisData
): Promise<UploadResponse> {
  try {
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

    // Generate unique file name
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${user.id}/${uniqueFileName}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user_documents')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        message: 'Failed to upload file to storage',
        error: 'UPLOAD_FAILED'
      };
    }

    // Save document metadata with AI analysis to database
    const { data: documentData, error: dbError } = await supabase
      .from('documents')
      .insert({
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        file_type: file.type,
        user_id: user.id,
        ai_category: aiAnalysis.category,
        ai_metadata: aiAnalysis.metadata,
        ai_confidence: aiAnalysis.confidence,
        ai_suggestions: aiAnalysis.suggestions,
        extracted_text: aiAnalysis.extractedText,
        description: aiAnalysis.description,
        expires_at: aiAnalysis.metadata.expirationDate ? new Date(aiAnalysis.metadata.expirationDate).toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);

      // Cleanup: delete uploaded file if database insert failed
      await supabase.storage
        .from('user_documents')
        .remove([uploadData.path]);

      return {
        success: false,
        message: 'Failed to save document metadata',
        error: 'DB_INSERT_FAILED'
      };
    }

    return {
      success: true,
      message: 'Document uploaded and analyzed successfully',
      data: {
        id: documentData.id,
        fileName: file.name,
        filePath: uploadData.path
      }
    };

  } catch (error) {
    console.error('Unexpected error in saveDocumentWithAI:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: 'UNKNOWN_ERROR'
    };
  }
}

export async function getDocumentsForUser() {
  try {
    // Create Supabase client with server-side authentication
    const supabase = createServerComponentClient({ cookies });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Fetch documents for the authenticated user with AI metadata
    const { data: documents, error: dbError } = await supabase
      .from('documents')
      .select('id, file_name, created_at, description, ai_category, ai_confidence, expires_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to fetch documents');
    }

    return documents || [];

  } catch (error) {
    console.error('Error in getDocumentsForUser:', error);
    throw error;
  }
}