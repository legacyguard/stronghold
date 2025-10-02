// Trust Seal Verification System
// Provides verification, validation, and lifecycle management for Trust Seals

import { supabase } from '@/lib/supabase';
import { TrustSeal, TrustSealLevel } from './calculator';

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  level?: TrustSealLevel;
  issuedAt?: Date;
  validUntil?: Date;
  warnings?: string[];
  metadata?: {
    confidenceScore?: number;
    documentInfo?: {
      jurisdiction?: string;
      documentType?: string;
      createdAt?: string;
    };
    [key: string]: unknown;
  };
}

export interface TrustSealCertificate {
  sealId: string;
  documentId: string;
  userId: string;
  level: TrustSealLevel;
  confidenceScore: number;
  issuedAt: Date;
  validUntil: Date;
  digitalSignature: string;
  verificationUrl: string;
  qrCode?: string;
}

export interface ValidationHistory {
  validationId: string;
  sealId: string;
  validatedAt: Date;
  validatedBy: string;
  result: 'valid' | 'invalid' | 'expired' | 'revoked';
  ipAddress?: string;
  userAgent?: string;
}

export class TrustSealVerifier {
  private static readonly VERIFICATION_BASE_URL = process.env.NEXT_PUBLIC_VERIFICATION_URL || 'https://legacyguard.eu/verify';

  // Main verification method - publicly accessible
  static async verifyTrustSeal(sealId: string, options?: {
    includeMetadata?: boolean;
    logVerification?: boolean;
    requesterInfo?: {
      ipAddress?: string;
      userAgent?: string;
      userId?: string;
    };
  }): Promise<VerificationResult> {
    try {
      // Get trust seal from database
      const { data: seal, error } = await supabase
        .from('trust_seals')
        .select(`
          *,
          will_documents (
            title,
            jurisdiction,
            document_type,
            created_at
          )
        `)
        .eq('id', sealId)
        .eq('revoked_at', null) // Only non-revoked seals
        .single();

      if (error || !seal) {
        return {
          valid: false,
          reason: 'Seal not found or has been revoked'
        };
      }

      // Check expiration
      const now = new Date();
      const validUntil = new Date(seal.valid_until);

      if (now > validUntil) {
        return {
          valid: false,
          reason: 'Seal has expired',
          level: seal.level,
          issuedAt: new Date(seal.issued_at),
          validUntil: validUntil
        };
      }

      // Verify digital signature
      const signatureValid = await this.verifyDigitalSignature(
        seal.digital_signature,
        seal.document_id,
        seal.user_id
      );

      if (!signatureValid) {
        return {
          valid: false,
          reason: 'Invalid digital signature',
          warnings: ['The digital signature could not be verified. The seal may have been tampered with.']
        };
      }

      // Additional validations
      const warnings: string[] = [];

      // Check if seal is close to expiration (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      if (validUntil < thirtyDaysFromNow) {
        warnings.push('This Trust Seal will expire within 30 days');
      }

      // Check confidence score
      if (seal.confidence_score < 70) {
        warnings.push('This Trust Seal has a lower confidence score. Consider professional review.');
      }

      // Log verification if requested
      if (options?.logVerification) {
        await this.logVerification(sealId, 'valid', options.requesterInfo);
      }

      const result: VerificationResult = {
        valid: true,
        level: seal.level,
        issuedAt: new Date(seal.issued_at),
        validUntil: validUntil,
        warnings: warnings.length > 0 ? warnings : undefined
      };

      // Include metadata if requested
      if (options?.includeMetadata) {
        result.metadata = {
          confidenceScore: seal.confidence_score,
          validations: seal.validations,
          documentInfo: seal.will_documents ? {
            jurisdiction: seal.will_documents.jurisdiction,
            documentType: seal.will_documents.document_type,
            createdAt: seal.will_documents.created_at
          } : undefined
        };
      }

      return result;

    } catch (error) {
      console.error('Trust seal verification error:', error);
      return {
        valid: false,
        reason: 'Verification system error. Please try again later.'
      };
    }
  }

  // Verify digital signature
  private static async verifyDigitalSignature(
    signature: string,
    documentId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Use a proper cryptographic signature verification
      // 2. Check against a certificate authority
      // 3. Validate the signature chain

      // For now, we'll do a basic format check and content verification
      if (!signature || !signature.startsWith('ts-sig-')) {
        return false;
      }

      // Check if signature matches expected pattern
      const expectedSignature = await this.generateSignature(documentId, userId);

      // In production, this would be a proper cryptographic verification
      return signature.length > 20 && signature.includes(documentId.substring(0, 8));

    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  // Generate signature for comparison (simplified for demo)
  private static async generateSignature(documentId: string, userId: string): Promise<string> {
    // This would use proper cryptographic signing in production
    const content = `${documentId}-${userId}-${process.env.TRUST_SEAL_SECRET || 'default-secret'}`;

    // Simplified hash for demo
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `ts-sig-${Math.abs(hash).toString(16)}`;
  }

  // Generate verification certificate
  static async generateCertificate(trustSeal: TrustSeal): Promise<TrustSealCertificate> {
    const verificationUrl = `${this.VERIFICATION_BASE_URL}/${trustSeal.id}`;

    return {
      sealId: trustSeal.id,
      documentId: trustSeal.documentId,
      userId: trustSeal.userId,
      level: trustSeal.level,
      confidenceScore: trustSeal.confidenceScore,
      issuedAt: trustSeal.issuedAt,
      validUntil: trustSeal.validUntil,
      digitalSignature: trustSeal.digitalSignature,
      verificationUrl,
      qrCode: await this.generateQRCode(verificationUrl)
    };
  }

  // Generate QR code for verification URL
  private static async generateQRCode(url: string): Promise<string> {
    // In a real implementation, this would generate an actual QR code
    // For now, return a placeholder
    return `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="white"/>
        <text x="50" y="50" text-anchor="middle" font-size="8">QR Code for ${url}</text>
      </svg>
    `)}`;
  }

  // Log verification attempt
  private static async logVerification(
    sealId: string,
    result: 'valid' | 'invalid' | 'expired' | 'revoked',
    requesterInfo?: {
      ipAddress?: string;
      userAgent?: string;
      userId?: string;
    }
  ): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        action: 'trust_seal_verification',
        resource_type: 'trust_seal',
        resource_id: sealId,
        new_values: {
          verification_result: result,
          ip_address: requesterInfo?.ipAddress,
          user_agent: requesterInfo?.userAgent,
          requesting_user_id: requesterInfo?.userId
        }
      });
    } catch (error) {
      console.error('Failed to log verification:', error);
    }
  }

  // Get verification history for a seal
  static async getVerificationHistory(
    sealId: string,
    limit: number = 50
  ): Promise<ValidationHistory[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'trust_seal_verification')
        .eq('resource_id', sealId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get verification history:', error);
        return [];
      }

      return data?.map(log => ({
        validationId: log.id,
        sealId: log.resource_id,
        validatedAt: new Date(log.created_at),
        validatedBy: log.new_values?.requesting_user_id || 'anonymous',
        result: log.new_values?.verification_result || 'unknown',
        ipAddress: log.new_values?.ip_address,
        userAgent: log.new_values?.user_agent
      })) || [];

    } catch (error) {
      console.error('Error getting verification history:', error);
      return [];
    }
  }

  // Revoke a trust seal
  static async revokeTrustSeal(
    sealId: string,
    reason: string,
    revokedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('trust_seals')
        .update({
          revoked_at: new Date().toISOString()
        })
        .eq('id', sealId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log revocation
      await supabase.from('audit_logs').insert({
        action: 'trust_seal_revoked',
        resource_type: 'trust_seal',
        resource_id: sealId,
        new_values: {
          reason,
          revoked_by: revokedBy,
          revoked_at: new Date().toISOString()
        }
      });

      return { success: true };

    } catch (error) {
      console.error('Failed to revoke trust seal:', error);
      return { success: false, error: 'System error during revocation' };
    }
  }

  // Renew a trust seal (extend validity)
  static async renewTrustSeal(
    sealId: string,
    extensionDays: number = 365
  ): Promise<{ success: boolean; newValidUntil?: Date; error?: string }> {
    try {
      // Get current seal
      const { data: seal, error: fetchError } = await supabase
        .from('trust_seals')
        .select('valid_until, level, confidence_score')
        .eq('id', sealId)
        .single();

      if (fetchError || !seal) {
        return { success: false, error: 'Trust seal not found' };
      }

      // Calculate new expiration date
      const currentValidUntil = new Date(seal.valid_until);
      const now = new Date();
      const baseDate = currentValidUntil > now ? currentValidUntil : now;
      const newValidUntil = new Date(baseDate.getTime() + extensionDays * 24 * 60 * 60 * 1000);

      // Update seal
      const { error: updateError } = await supabase
        .from('trust_seals')
        .update({
          valid_until: newValidUntil.toISOString()
        })
        .eq('id', sealId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Log renewal
      await supabase.from('audit_logs').insert({
        action: 'trust_seal_renewed',
        resource_type: 'trust_seal',
        resource_id: sealId,
        new_values: {
          old_valid_until: seal.valid_until,
          new_valid_until: newValidUntil.toISOString(),
          extension_days: extensionDays
        }
      });

      return { success: true, newValidUntil };

    } catch (error) {
      console.error('Failed to renew trust seal:', error);
      return { success: false, error: 'System error during renewal' };
    }
  }

  // Batch verify multiple seals
  static async batchVerifySeals(sealIds: string[]): Promise<Map<string, VerificationResult>> {
    const results = new Map<string, VerificationResult>();

    // Process in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < sealIds.length; i += batchSize) {
      const batch = sealIds.slice(i, i + batchSize);

      const batchPromises = batch.map(async (sealId) => {
        const result = await this.verifyTrustSeal(sealId);
        return { sealId, result };
      });

      const batchResults = await Promise.all(batchPromises);

      batchResults.forEach(({ sealId, result }) => {
        results.set(sealId, result);
      });
    }

    return results;
  }

  // Get trust seal statistics
  static async getTrustSealStatistics(): Promise<{
    totalSeals: number;
    validSeals: number;
    expiredSeals: number;
    revokedSeals: number;
    sealsByLevel: Record<TrustSealLevel, number>;
    averageConfidenceScore: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('trust_seals')
        .select('level, confidence_score, valid_until, revoked_at');

      if (error) {
        console.error('Failed to get trust seal statistics:', error);
        return {
          totalSeals: 0,
          validSeals: 0,
          expiredSeals: 0,
          revokedSeals: 0,
          sealsByLevel: { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 },
          averageConfidenceScore: 0
        };
      }

      const now = new Date();
      const totalSeals = data?.length || 0;
      const revokedSeals = data?.filter(seal => seal.revoked_at).length || 0;
      const expiredSeals = data?.filter(seal =>
        !seal.revoked_at && new Date(seal.valid_until) < now
      ).length || 0;
      const validSeals = totalSeals - revokedSeals - expiredSeals;

      const sealsByLevel = data?.reduce((acc, seal) => {
        acc[seal.level as TrustSealLevel] = (acc[seal.level as TrustSealLevel] || 0) + 1;
        return acc;
      }, { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 } as Record<TrustSealLevel, number>) ||
      { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };

      const averageConfidenceScore = totalSeals > 0
        ? (data?.reduce((sum, seal) => sum + seal.confidence_score, 0) || 0) / totalSeals
        : 0;

      return {
        totalSeals,
        validSeals,
        expiredSeals,
        revokedSeals,
        sealsByLevel,
        averageConfidenceScore: Math.round(averageConfidenceScore)
      };

    } catch (error) {
      console.error('Error getting trust seal statistics:', error);
      return {
        totalSeals: 0,
        validSeals: 0,
        expiredSeals: 0,
        revokedSeals: 0,
        sealsByLevel: { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 },
        averageConfidenceScore: 0
      };
    }
  }

  // Public verification URL (for sharing)
  static generatePublicVerificationUrl(sealId: string): string {
    return `${this.VERIFICATION_BASE_URL}/${sealId}`;
  }

  // Validate verification URL format
  static isValidVerificationUrl(url: string): boolean {
    const pattern = new RegExp(`^${this.VERIFICATION_BASE_URL}/[a-f0-9-]{36}$`);
    return pattern.test(url);
  }

  // Extract seal ID from verification URL
  static extractSealIdFromUrl(url: string): string | null {
    if (!this.isValidVerificationUrl(url)) {
      return null;
    }

    return url.split('/').pop() || null;
  }
}