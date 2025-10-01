// Advanced Security & Document Encryption System
// Provides end-to-end encryption for sensitive legal documents

import { supabase } from '@/lib/supabase';

export interface EncryptionKey {
  id: string;
  userId: string;
  keyType: 'master' | 'document' | 'backup';
  algorithm: 'AES-GCM' | 'RSA-OAEP' | 'ECDH';
  keyData: string; // Base64 encoded
  createdAt: Date;
  lastUsed?: Date;
  isRevoked: boolean;
}

export interface EncryptedDocument {
  documentId: string;
  encryptedContent: string;
  encryptionMetadata: {
    algorithm: string;
    keyId: string;
    iv: string;
    authTag?: string;
    encryptedAt: Date;
  };
  integrityHash: string;
}

export interface SecurityAuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class DocumentEncryptionManager {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256; // bits
  private static readonly IV_LENGTH = 12; // bytes for AES-GCM

  // Master key cache (in memory only)
  private static masterKeyCache = new Map<string, CryptoKey>();

  // Initialize encryption for user
  static async setupUserEncryption(userId: string): Promise<{ success: boolean; keyId?: string; error?: string }> {
    try {
      // Check if user already has a master key
      const existingKey = await this.getUserMasterKey(userId);
      if (existingKey) {
        return { success: true, keyId: existingKey.id };
      }

      // Generate new master key
      const masterKey = await crypto.subtle.generateKey(
        {
          name: this.ALGORITHM,
          length: this.KEY_LENGTH
        },
        true, // extractable for backup purposes
        ['encrypt', 'decrypt']
      );

      // Export key for storage
      const exportedKey = await crypto.subtle.exportKey('raw', masterKey);
      const keyData = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));

      // Store encrypted key in database
      const keyRecord: Partial<EncryptionKey> = {
        userId,
        keyType: 'master',
        algorithm: this.ALGORITHM,
        keyData: await this.encryptKeyForStorage(keyData, userId),
        createdAt: new Date(),
        isRevoked: false
      };

      const { data, error } = await supabase
        .from('encryption_keys')
        .insert(keyRecord)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to store encryption key: ${error.message}`);
      }

      // Cache the key
      this.masterKeyCache.set(userId, masterKey);

      // Log security event
      await this.logSecurityEvent(userId, 'encryption_setup', 'user_encryption', userId, {
        keyId: data.id,
        algorithm: this.ALGORITHM
      });

      return { success: true, keyId: data.id };

    } catch (error) {
      console.error('Failed to setup user encryption:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown encryption setup error'
      };
    }
  }

  // Encrypt will content
  static async encryptWillContent(
    content: string,
    userId: string,
    documentId: string
  ): Promise<{ success: boolean; encryptedData?: EncryptedDocument; error?: string }> {
    try {
      // Get or create master key
      const masterKey = await this.getMasterKey(userId);
      if (!masterKey) {
        const setupResult = await this.setupUserEncryption(userId);
        if (!setupResult.success) {
          return { success: false, error: 'Failed to setup encryption' };
        }
      }

      // Generate document-specific IV
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      // Encrypt content
      const encoder = new TextEncoder();
      const contentBytes = encoder.encode(content);

      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        masterKey!,
        contentBytes
      );

      // Create encryption metadata
      const encryptionMetadata = {
        algorithm: this.ALGORITHM,
        keyId: await this.getMasterKeyId(userId) || 'unknown',
        iv: btoa(String.fromCharCode(...iv)),
        encryptedAt: new Date()
      };

      // Convert to base64
      const encryptedContent = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));

      // Generate integrity hash
      const integrityHash = await this.generateIntegrityHash(encryptedContent, encryptionMetadata);

      const encryptedDocument: EncryptedDocument = {
        documentId,
        encryptedContent,
        encryptionMetadata,
        integrityHash
      };

      // Log encryption event
      await this.logSecurityEvent(userId, 'document_encrypted', 'will_document', documentId, {
        contentLength: content.length,
        encryptedLength: encryptedContent.length
      });

      return { success: true, encryptedData: encryptedDocument };

    } catch (error) {
      console.error('Failed to encrypt will content:', error);
      await this.logSecurityEvent(userId, 'encryption_failed', 'will_document', documentId, {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'high');

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Encryption failed'
      };
    }
  }

  // Decrypt will content
  static async decryptWillContent(
    encryptedDocument: EncryptedDocument,
    userId: string
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      // Verify integrity first
      const integrityValid = await this.verifyIntegrity(encryptedDocument);
      if (!integrityValid) {
        await this.logSecurityEvent(userId, 'integrity_check_failed', 'will_document',
          encryptedDocument.documentId, {}, 'critical');
        return { success: false, error: 'Document integrity verification failed' };
      }

      // Get master key
      const masterKey = await this.getMasterKey(userId);
      if (!masterKey) {
        return { success: false, error: 'Encryption key not available' };
      }

      // Decode IV and encrypted content
      const iv = new Uint8Array(atob(encryptedDocument.encryptionMetadata.iv).split('').map(c => c.charCodeAt(0)));
      const encryptedBytes = new Uint8Array(atob(encryptedDocument.encryptedContent).split('').map(c => c.charCodeAt(0)));

      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        masterKey,
        encryptedBytes
      );

      // Convert back to string
      const decoder = new TextDecoder();
      const content = decoder.decode(decryptedBuffer);

      // Log decryption event
      await this.logSecurityEvent(userId, 'document_decrypted', 'will_document',
        encryptedDocument.documentId, {
          contentLength: content.length
        });

      return { success: true, content };

    } catch (error) {
      console.error('Failed to decrypt will content:', error);
      await this.logSecurityEvent(userId, 'decryption_failed', 'will_document',
        encryptedDocument.documentId, {
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 'high');

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed'
      };
    }
  }

  // Generate integrity hash
  private static async generateIntegrityHash(
    encryptedContent: string,
    metadata: any
  ): Promise<string> {
    const data = JSON.stringify({
      content: encryptedContent,
      metadata: metadata
    });

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  }

  // Verify document integrity
  private static async verifyIntegrity(encryptedDocument: EncryptedDocument): Promise<boolean> {
    try {
      const expectedHash = await this.generateIntegrityHash(
        encryptedDocument.encryptedContent,
        encryptedDocument.encryptionMetadata
      );

      return expectedHash === encryptedDocument.integrityHash;
    } catch (error) {
      console.error('Integrity verification failed:', error);
      return false;
    }
  }

  // Get master key (from cache or load from storage)
  private static async getMasterKey(userId: string): Promise<CryptoKey | null> {
    try {
      // Check cache first
      if (this.masterKeyCache.has(userId)) {
        return this.masterKeyCache.get(userId)!;
      }

      // Load from storage
      const keyRecord = await this.getUserMasterKey(userId);
      if (!keyRecord) {
        return null;
      }

      // Decrypt key data
      const decryptedKeyData = await this.decryptKeyFromStorage(keyRecord.keyData, userId);

      // Import key
      const keyBytes = new Uint8Array(atob(decryptedKeyData).split('').map(c => c.charCodeAt(0)));
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        {
          name: this.ALGORITHM,
          length: this.KEY_LENGTH
        },
        false,
        ['encrypt', 'decrypt']
      );

      // Cache the key
      this.masterKeyCache.set(userId, cryptoKey);

      return cryptoKey;

    } catch (error) {
      console.error('Failed to get master key:', error);
      return null;
    }
  }

  // Get user's master key record
  private static async getUserMasterKey(userId: string): Promise<EncryptionKey | null> {
    try {
      const { data, error } = await supabase
        .from('encryption_keys')
        .select('*')
        .eq('user_id', userId)
        .eq('key_type', 'master')
        .eq('is_revoked', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        keyType: data.key_type,
        algorithm: data.algorithm,
        keyData: data.key_data,
        createdAt: new Date(data.created_at),
        lastUsed: data.last_used ? new Date(data.last_used) : undefined,
        isRevoked: data.is_revoked
      };

    } catch (error) {
      console.error('Failed to get user master key:', error);
      return null;
    }
  }

  // Get master key ID
  private static async getMasterKeyId(userId: string): Promise<string | null> {
    const keyRecord = await this.getUserMasterKey(userId);
    return keyRecord?.id || null;
  }

  // Encrypt key for storage (using user-derived key)
  private static async encryptKeyForStorage(keyData: string, userId: string): Promise<string> {
    // In production, this would use a user-derived key (e.g., from password)
    // For now, we'll use a simple encoding with a salt
    const salt = userId + process.env.ENCRYPTION_SALT || 'default-salt';
    const encoder = new TextEncoder();

    // Simple XOR encryption for demo (use proper encryption in production)
    const saltBytes = encoder.encode(salt);
    const keyBytes = encoder.encode(keyData);
    const encrypted = new Uint8Array(keyBytes.length);

    for (let i = 0; i < keyBytes.length; i++) {
      encrypted[i] = keyBytes[i] ^ saltBytes[i % saltBytes.length];
    }

    return btoa(String.fromCharCode(...encrypted));
  }

  // Decrypt key from storage
  private static async decryptKeyFromStorage(encryptedKeyData: string, userId: string): Promise<string> {
    // Reverse of encryptKeyForStorage
    const salt = userId + process.env.ENCRYPTION_SALT || 'default-salt';
    const encoder = new TextEncoder();

    const saltBytes = encoder.encode(salt);
    const encryptedBytes = new Uint8Array(atob(encryptedKeyData).split('').map(c => c.charCodeAt(0)));
    const decrypted = new Uint8Array(encryptedBytes.length);

    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ saltBytes[i % saltBytes.length];
    }

    return String.fromCharCode(...decrypted);
  }

  // Rotate encryption keys
  static async rotateUserKeys(userId: string): Promise<{ success: boolean; newKeyId?: string; error?: string }> {
    try {
      // Generate new master key
      const newKey = await crypto.subtle.generateKey(
        {
          name: this.ALGORITHM,
          length: this.KEY_LENGTH
        },
        true,
        ['encrypt', 'decrypt']
      );

      // Export and store new key
      const exportedKey = await crypto.subtle.exportKey('raw', newKey);
      const keyData = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));

      const keyRecord: Partial<EncryptionKey> = {
        userId,
        keyType: 'master',
        algorithm: this.ALGORITHM,
        keyData: await this.encryptKeyForStorage(keyData, userId),
        createdAt: new Date(),
        isRevoked: false
      };

      const { data, error } = await supabase
        .from('encryption_keys')
        .insert(keyRecord)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to store new encryption key: ${error.message}`);
      }

      // Revoke old keys
      await supabase
        .from('encryption_keys')
        .update({ is_revoked: true })
        .eq('user_id', userId)
        .eq('key_type', 'master')
        .neq('id', data.id);

      // Update cache
      this.masterKeyCache.set(userId, newKey);

      // Log key rotation
      await this.logSecurityEvent(userId, 'key_rotated', 'encryption_key', data.id, {
        oldKeyRevoked: true,
        algorithm: this.ALGORITHM
      }, 'medium');

      return { success: true, newKeyId: data.id };

    } catch (error) {
      console.error('Failed to rotate user keys:', error);
      await this.logSecurityEvent(userId, 'key_rotation_failed', 'encryption_key', '', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'high');

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Key rotation failed'
      };
    }
  }

  // Create secure backup
  static async createSecureBackup(userId: string, documents: EncryptedDocument[]): Promise<{
    success: boolean;
    backupData?: string;
    error?: string;
  }> {
    try {
      const backupData = {
        userId,
        timestamp: new Date().toISOString(),
        documents: documents,
        version: '1.0'
      };

      // Compress and encrypt backup
      const jsonData = JSON.stringify(backupData);
      const compressed = await this.compressData(jsonData);
      const encrypted = await this.encryptWillContent(compressed, userId, `backup-${Date.now()}`);

      if (!encrypted.success) {
        throw new Error(encrypted.error || 'Backup encryption failed');
      }

      // Log backup creation
      await this.logSecurityEvent(userId, 'backup_created', 'document_backup', '', {
        documentCount: documents.length,
        backupSize: jsonData.length
      });

      return {
        success: true,
        backupData: btoa(JSON.stringify(encrypted.encryptedData))
      };

    } catch (error) {
      console.error('Failed to create secure backup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backup creation failed'
      };
    }
  }

  // Restore from secure backup
  static async restoreFromSecureBackup(
    userId: string,
    backupData: string
  ): Promise<{ success: boolean; documents?: EncryptedDocument[]; error?: string }> {
    try {
      const encryptedBackup = JSON.parse(atob(backupData)) as EncryptedDocument;
      const decrypted = await this.decryptWillContent(encryptedBackup, userId);

      if (!decrypted.success) {
        throw new Error(decrypted.error || 'Backup decryption failed');
      }

      const decompressed = await this.decompressData(decrypted.content!);
      const backupInfo = JSON.parse(decompressed);

      // Verify backup belongs to user
      if (backupInfo.userId !== userId) {
        throw new Error('Backup does not belong to this user');
      }

      // Log restoration
      await this.logSecurityEvent(userId, 'backup_restored', 'document_backup', '', {
        documentCount: backupInfo.documents.length,
        backupTimestamp: backupInfo.timestamp
      });

      return { success: true, documents: backupInfo.documents };

    } catch (error) {
      console.error('Failed to restore from secure backup:', error);
      await this.logSecurityEvent(userId, 'backup_restore_failed', 'document_backup', '', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'high');

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backup restoration failed'
      };
    }
  }

  // Compress data (simple gzip simulation)
  private static async compressData(data: string): Promise<string> {
    // In production, use actual compression library
    return btoa(data); // Simple base64 encoding for demo
  }

  // Decompress data
  private static async decompressData(data: string): Promise<string> {
    // In production, use actual decompression
    return atob(data); // Simple base64 decoding for demo
  }

  // Log security events
  private static async logSecurityEvent(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, unknown> = {},
    riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: `security_${action}`,
        resource_type: resourceType,
        resource_id: resourceId,
        new_values: {
          ...metadata,
          risk_level: riskLevel,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Get security audit logs
  static async getSecurityAuditLogs(
    userId: string,
    limit: number = 50
  ): Promise<SecurityAuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .like('action', 'security_%')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get security audit logs:', error);
        return [];
      }

      return data?.map(log => ({
        id: log.id,
        userId: log.user_id,
        action: log.action,
        resourceType: log.resource_type,
        resourceId: log.resource_id,
        ipAddress: log.new_values?.ip_address,
        userAgent: log.new_values?.user_agent,
        metadata: log.new_values || {},
        timestamp: new Date(log.created_at),
        riskLevel: log.new_values?.risk_level || 'low'
      })) || [];

    } catch (error) {
      console.error('Error getting security audit logs:', error);
      return [];
    }
  }

  // Clear cached keys (for security)
  static clearKeyCache(userId?: string): void {
    if (userId) {
      this.masterKeyCache.delete(userId);
    } else {
      this.masterKeyCache.clear();
    }
  }

  // Validate encryption setup
  static async validateEncryptionSetup(userId: string): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check if master key exists
      const masterKey = await this.getUserMasterKey(userId);
      if (!masterKey) {
        issues.push('No master encryption key found');
        recommendations.push('Initialize encryption by creating your first will');
      }

      // Check key age
      if (masterKey) {
        const keyAge = Date.now() - masterKey.createdAt.getTime();
        const oneYear = 365 * 24 * 60 * 60 * 1000;

        if (keyAge > oneYear) {
          recommendations.push('Consider rotating your encryption keys (older than 1 year)');
        }
      }

      // Check for recent security events
      const recentLogs = await this.getSecurityAuditLogs(userId, 10);
      const criticalEvents = recentLogs.filter(log => log.riskLevel === 'critical');

      if (criticalEvents.length > 0) {
        issues.push(`${criticalEvents.length} critical security events detected`);
        recommendations.push('Review recent security events and consider key rotation');
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error) {
      console.error('Failed to validate encryption setup:', error);
      return {
        isValid: false,
        issues: ['Failed to validate encryption setup'],
        recommendations: ['Contact support for assistance']
      };
    }
  }
}