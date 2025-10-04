import crypto from 'crypto';

export class DataEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits

  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // Derive key from environment variable
    return crypto.scryptSync(key, 'salt', this.KEY_LENGTH);
  }

  /**
   * Encrypt sensitive data before storing in database
   */
  static encrypt(text: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipher(this.ALGORITHM, key);
      cipher.setAAD(Buffer.from('stronghold-app'));

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      // Return: iv:tag:encrypted
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data from database
   */
  static decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();
      const [ivHex, tagHex, encrypted] = encryptedData.split(':');

      if (!ivHex || !tagHex || !encrypted) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');

      const decipher = crypto.createDecipher(this.ALGORITHM, key);
      decipher.setAuthTag(tag);
      decipher.setAAD(Buffer.from('stronghold-app'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash passwords and sensitive identifiers
   */
  static hash(data: string, salt?: string): { hash: string; salt: string } {
    const finalSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(data, finalSalt, 64).toString('hex');

    return { hash, salt: finalSalt };
  }

  /**
   * Verify hashed data
   */
  static verifyHash(data: string, hash: string, salt: string): boolean {
    try {
      const { hash: newHash } = this.hash(data, salt);
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(newHash, 'hex'));
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate secure random tokens
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Sanitize sensitive data for logging
   */
  static sanitizeForLogging(data: any): any {
    if (typeof data === 'string') {
      // Mask emails
      data = data.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***@***.***');
      // Mask phone numbers
      data = data.replace(/\+?\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, '***-***-****');
      // Mask Slovak ID numbers (rodne cislo)
      data = data.replace(/\d{6}\/\d{3,4}/g, '******/****');
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = Array.isArray(data) ? [] : {};

      for (const [key, value] of Object.entries(data)) {
        // Skip sensitive fields entirely
        if (['password', 'token', 'secret', 'key', 'ssn', 'id_number'].includes(key.toLowerCase())) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeForLogging(value);
        }
      }

      return sanitized;
    }

    return data;
  }

  /**
   * Generate CSRF token
   */
  static generateCSRFToken(): string {
    return this.generateSecureToken(32);
  }

  /**
   * Validate CSRF token
   */
  static validateCSRFToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) return false;
    return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expectedToken, 'hex'));
  }
}

// PII (Personally Identifiable Information) helper
export class PIIProtection {
  private static readonly PII_FIELDS = [
    'email', 'phone', 'address', 'birth_date', 'id_number',
    'full_name', 'first_name', 'last_name', 'ssn'
  ];

  /**
   * Encrypt PII data before database storage
   */
  static encryptPII(data: Record<string, any>): Record<string, any> {
    const encrypted = { ...data };

    for (const field of this.PII_FIELDS) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = DataEncryption.encrypt(encrypted[field]);
      }
    }

    return encrypted;
  }

  /**
   * Decrypt PII data after database retrieval
   */
  static decryptPII(data: Record<string, any>): Record<string, any> {
    const decrypted = { ...data };

    for (const field of this.PII_FIELDS) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          decrypted[field] = DataEncryption.decrypt(decrypted[field]);
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          // Keep encrypted value if decryption fails
        }
      }
    }

    return decrypted;
  }

  /**
   * Check if data contains PII
   */
  static containsPII(data: Record<string, any>): boolean {
    return this.PII_FIELDS.some(field => data[field] !== undefined);
  }

  /**
   * Mask PII for display purposes
   */
  static maskPII(data: Record<string, any>): Record<string, any> {
    const masked = { ...data };

    if (masked.email) {
      const [local, domain] = masked.email.split('@');
      masked.email = `${local.substring(0, 2)}***@${domain}`;
    }

    if (masked.phone) {
      masked.phone = masked.phone.replace(/\d(?=\d{4})/g, '*');
    }

    if (masked.id_number) {
      masked.id_number = masked.id_number.replace(/\d/g, '*');
    }

    return masked;
  }
}