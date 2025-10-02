import { supabase } from '@/lib/supabase';
import {
  Document,
  CreateDocumentRequest,
  DocumentCategory,
  DocumentType,
  DocumentAIAnalysis,
  APIResponse
} from '@/types';

export class DocumentManager {
  /**
   * Upload and create a new document with AI analysis
   */
  static async uploadDocument(
    userId: string,
    request: CreateDocumentRequest
  ): Promise<APIResponse<Document>> {
    try {
      const { title, description, document_type, visibility, file } = request;

      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let mimeType: string | undefined;

      // Handle file upload to Supabase Storage
      if (file) {
        const uploadResult = await this.uploadFileToStorage(userId, file);
        if (!uploadResult.success || !uploadResult.data) {
          return { success: false, error: uploadResult.error || 'File upload failed' };
        }

        fileUrl = uploadResult.data.url;
        fileName = file.name;
        fileSize = file.size;
        mimeType = file.type;
      }

      // AI-powered initial categorization (local processing)
      const aiCategory = await this.categorizeDocumentLocal(title, description, document_type, mimeType);

      // Create document record
      const documentData = {
        user_id: userId,
        title,
        description,
        document_type,
        category: aiCategory.category,
        subcategory: aiCategory.subcategory,
        tags: aiCategory.tags,
        confidence_score: aiCategory.confidence,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        visibility,
        processing_status: file ? 'pending' : 'completed',
        is_legal_document: this.isLegalDocumentType(document_type),
        legal_significance: this.getLegalSignificance(document_type),
        requires_witnesses: this.requiresWitnesses(document_type),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (error) {
        console.error('Error creating document:', error);
        return { success: false, error: error.message };
      }

      // Trigger background AI analysis if file exists
      if (file && fileUrl) {
        this.processDocumentInBackground(data.id, fileUrl, mimeType);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error uploading document:', error);
      return { success: false, error: 'Failed to upload document' };
    }
  }

  /**
   * Get documents for user with filtering and pagination
   */
  static async getDocuments(
    userId: string,
    options: {
      category?: DocumentCategory;
      document_type?: DocumentType;
      search?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<APIResponse<Document[]>> {
    try {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.document_type) {
        query = query.eq('document_type', options.document_type);
      }

      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching documents:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Unexpected error fetching documents:', error);
      return { success: false, error: 'Failed to fetch documents' };
    }
  }

  /**
   * Get single document by ID
   */
  static async getDocument(documentId: string, userId: string): Promise<APIResponse<Document>> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching document:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error fetching document:', error);
      return { success: false, error: 'Failed to fetch document' };
    }
  }

  /**
   * Update document metadata
   */
  static async updateDocument(
    documentId: string,
    userId: string,
    updates: Partial<Document>
  ): Promise<APIResponse<Document>> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', documentId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating document:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error updating document:', error);
      return { success: false, error: 'Failed to update document' };
    }
  }

  /**
   * Delete document and associated file
   */
  static async deleteDocument(documentId: string, userId: string): Promise<APIResponse> {
    try {
      // Get document to check for file
      const docResult = await this.getDocument(documentId, userId);
      if (!docResult.success || !docResult.data) {
        return { success: false, error: 'Document not found' };
      }

      const document = docResult.data;

      // Delete file from storage if exists
      if (document.file_url) {
        await this.deleteFileFromStorage(document.file_url);
      }

      // Delete document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting document:', error);
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Document deleted successfully' };
    } catch (error) {
      console.error('Unexpected error deleting document:', error);
      return { success: false, error: 'Failed to delete document' };
    }
  }

  /**
   * Get document categories with counts
   */
  static async getDocumentStats(userId: string): Promise<APIResponse<{
    total: number;
    by_category: Record<DocumentCategory, number>;
    by_type: Record<DocumentType, number>;
    recent_uploads: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('category, document_type, created_at')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching document stats:', error);
        return { success: false, error: error.message };
      }

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats = {
        total: data.length,
        by_category: {} as Record<DocumentCategory, number>,
        by_type: {} as Record<DocumentType, number>,
        recent_uploads: data.filter(doc => new Date(doc.created_at) > weekAgo).length
      };

      // Count by category
      data.forEach(doc => {
        const category = doc.category as DocumentCategory;
        const type = doc.document_type as DocumentType;
        stats.by_category[category] = (stats.by_category[category] || 0) + 1;
        stats.by_type[type] = (stats.by_type[type] || 0) + 1;
      });

      return { success: true, data: stats };
    } catch (error) {
      console.error('Unexpected error fetching document stats:', error);
      return { success: false, error: 'Failed to fetch document stats' };
    }
  }

  /**
   * Local AI categorization (zero cost)
   */
  private static async categorizeDocumentLocal(
    title: string,
    description?: string,
    documentType?: DocumentType,
    mimeType?: string
  ): Promise<{
    category: DocumentCategory;
    subcategory?: string;
    tags: string[];
    confidence: number;
  }> {
    const text = `${title} ${description || ''}`.toLowerCase();
    const confidence = 0.85; // High confidence for rule-based categorization

    // Rule-based categorization (zero API cost)
    const legalKeywords = ['závěť', 'will', 'testament', 'plná moc', 'power of attorney', 'smlouva', 'contract'];
    const financialKeywords = ['banka', 'bank', 'účet', 'account', 'investice', 'investment', 'úspora', 'savings'];
    const medicalKeywords = ['zdraví', 'health', 'lékař', 'doctor', 'nemocnice', 'hospital', 'pojištění', 'insurance'];
    const propertyKeywords = ['nemovitost', 'property', 'dům', 'house', 'byt', 'apartment', 'pozemek', 'land'];
    const identityKeywords = ['občanský', 'passport', 'řidičák', 'license', 'identita', 'identity'];

    let category: DocumentCategory = 'uncategorized';
    let subcategory: string | undefined;
    const tags: string[] = [];

    // Document type based categorization
    if (documentType) {
      switch (documentType) {
        case 'will':
        case 'power_of_attorney':
        case 'trust_document':
          category = 'legal_essential';
          tags.push('právní', 'legal');
          break;
        case 'medical_directive':
        case 'medical_record':
          category = 'medical';
          tags.push('zdraví', 'health');
          break;
        case 'insurance_policy':
          category = 'insurance';
          tags.push('pojištění', 'insurance');
          break;
        case 'property_deed':
          category = 'property';
          tags.push('nemovitost', 'property');
          break;
        case 'financial_account':
          category = 'financial';
          tags.push('finance', 'účet');
          break;
        case 'identification':
          category = 'identity';
          tags.push('doklad', 'identita');
          break;
        case 'contract':
          category = 'legal_supporting';
          tags.push('smlouva', 'contract');
          break;
        default:
          category = 'personal';
      }
    }

    // Content-based refinement
    if (legalKeywords.some(keyword => text.includes(keyword))) {
      if (category === 'uncategorized') {
        category = text.includes('závěť') || text.includes('will') ? 'legal_essential' : 'legal_supporting';
      }
      tags.push('právní');
    }

    if (financialKeywords.some(keyword => text.includes(keyword))) {
      if (category === 'uncategorized') category = 'financial';
      tags.push('finance');
    }

    if (medicalKeywords.some(keyword => text.includes(keyword))) {
      if (category === 'uncategorized') category = 'medical';
      tags.push('zdraví');
    }

    if (propertyKeywords.some(keyword => text.includes(keyword))) {
      if (category === 'uncategorized') category = 'property';
      tags.push('nemovitost');
    }

    if (identityKeywords.some(keyword => text.includes(keyword))) {
      if (category === 'uncategorized') category = 'identity';
      tags.push('doklad');
    }

    // MIME type based hints
    if (mimeType) {
      if (mimeType.includes('pdf')) tags.push('pdf');
      if (mimeType.includes('image')) tags.push('obrázek', 'image');
      if (mimeType.includes('word')) tags.push('dokument', 'document');
    }

    // Add date-based tag
    tags.push(new Date().getFullYear().toString());

    return {
      category,
      subcategory,
      tags: [...new Set(tags)], // Remove duplicates
      confidence
    };
  }

  /**
   * Background AI processing (called asynchronously)
   */
  private static async processDocumentInBackground(
    documentId: string,
    fileUrl: string,
    mimeType?: string
  ): Promise<void> {
    try {
      // This would be called via API route to avoid blocking
      // For now, just update processing status
      setTimeout(async () => {
        await supabase
          .from('documents')
          .update({
            processing_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
      }, 2000);
    } catch (error) {
      console.error('Error in background processing:', error);
    }
  }

  /**
   * Upload file to Supabase Storage
   */
  private static async uploadFileToStorage(
    userId: string,
    file: File
  ): Promise<APIResponse<{ url: string }>> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading file:', error);
        return { success: false, error: error.message };
      }

      const { data: publicUrl } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      return { success: true, data: { url: publicUrl.publicUrl } };
    } catch (error) {
      console.error('Unexpected error uploading file:', error);
      return { success: false, error: 'Failed to upload file' };
    }
  }

  /**
   * Delete file from Supabase Storage
   */
  private static async deleteFileFromStorage(fileUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = urlParts.slice(-2).join('/'); // userId/filename

      await supabase.storage
        .from('documents')
        .remove([filePath]);
    } catch (error) {
      console.error('Error deleting file from storage:', error);
    }
  }

  /**
   * Helper functions for legal classification
   */
  private static isLegalDocumentType(documentType: DocumentType): boolean {
    return ['will', 'power_of_attorney', 'medical_directive', 'trust_document', 'contract'].includes(documentType);
  }

  private static getLegalSignificance(documentType: DocumentType): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    switch (documentType) {
      case 'will':
      case 'trust_document':
        return 'critical';
      case 'power_of_attorney':
      case 'medical_directive':
        return 'high';
      case 'contract':
      case 'insurance_policy':
        return 'medium';
      case 'property_deed':
        return 'high';
      case 'financial_account':
        return 'medium';
      default:
        return 'low';
    }
  }

  private static requiresWitnesses(documentType: DocumentType): boolean {
    return ['will', 'power_of_attorney', 'trust_document'].includes(documentType);
  }

  /**
   * Get documents shared with user (family/guardian access)
   */
  static async getSharedDocuments(userId: string): Promise<APIResponse<Document[]>> {
    try {
      // This would query documents where the user is in shared_with_members
      // or has guardian/family access
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .contains('shared_with_members', [userId]);

      if (error) {
        console.error('Error fetching shared documents:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Unexpected error fetching shared documents:', error);
      return { success: false, error: 'Failed to fetch shared documents' };
    }
  }

  /**
   * Share document with family members or guardians
   */
  static async shareDocument(
    documentId: string,
    userId: string,
    sharedWithIds: string[]
  ): Promise<APIResponse<Document>> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          shared_with_members: sharedWithIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error sharing document:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error sharing document:', error);
      return { success: false, error: 'Failed to share document' };
    }
  }
}