import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData: Record<string, any>;
}

export class InputValidator {
  /**
   * Validate data against schema
   */
  static validate(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
    const errors: Record<string, string> = {};
    const sanitizedData: Record<string, any> = {};

    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field];
      const fieldError = this.validateField(value, rule, field);

      if (fieldError) {
        errors[field] = fieldError;
      } else {
        sanitizedData[field] = this.sanitizeField(value, field);
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData
    };
  }

  /**
   * Validate single field
   */
  private static validateField(value: any, rule: ValidationRule, fieldName: string): string | null {
    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      return `${fieldName} je povinné pole`;
    }

    // Skip other validations if value is empty and not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // Check length
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `${fieldName} musí mať aspoň ${rule.minLength} znakov`;
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        return `${fieldName} môže mať maximálne ${rule.maxLength} znakov`;
      }
    }

    // Check pattern
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return `${fieldName} má neplatný formát`;
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        return customError;
      }
    }

    return null;
  }

  /**
   * Sanitize field value
   */
  private static sanitizeField(value: any, fieldName: string): any {
    if (typeof value === 'string') {
      // Remove potentially dangerous characters
      value = value.trim();

      // Specific sanitization based on field type
      if (fieldName.includes('email')) {
        return validator.normalizeEmail(value) || value;
      }

      if (fieldName.includes('phone')) {
        return value.replace(/[^\d+\-\s\(\)]/g, '');
      }

      if (fieldName.includes('name') || fieldName.includes('address')) {
        // Allow only letters, numbers, spaces, and common punctuation
        return value.replace(/[^\p{L}\p{N}\s\-.,]/gu, '');
      }

      // General HTML sanitization
      return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
    }

    return value;
  }

  /**
   * Predefined validation schemas
   */
  static schemas = {
    userProfile: {
      full_name: {
        required: true,
        minLength: 2,
        maxLength: 100,
        pattern: /^[\p{L}\s\-.']+$/u
      },
      email: {
        required: true,
        custom: (value: string) => {
          if (!validator.isEmail(value)) {
            return 'Neplatná emailová adresa';
          }
          return null;
        }
      },
      phone: {
        required: false,
        custom: (value: string) => {
          if (value && !validator.isMobilePhone(value, 'sk-SK')) {
            return 'Neplatné telefónne číslo';
          }
          return null;
        }
      },
      birth_date: {
        required: false,
        custom: (value: string) => {
          if (value && !validator.isDate(value)) {
            return 'Neplatný dátum narodenia';
          }
          if (value) {
            const date = new Date(value);
            const now = new Date();
            const age = now.getFullYear() - date.getFullYear();
            if (age < 18 || age > 120) {
              return 'Vek musí byť medzi 18 a 120 rokmi';
            }
          }
          return null;
        }
      },
      address: {
        required: false,
        maxLength: 500
      }
    },

    willData: {
      testator_name: {
        required: true,
        minLength: 2,
        maxLength: 100,
        pattern: /^[\p{L}\s\-.']+$/u
      },
      birth_date: {
        required: true,
        custom: (value: string) => {
          if (!validator.isDate(value)) {
            return 'Neplatný dátum narodenia';
          }
          const date = new Date(value);
          const now = new Date();
          const age = now.getFullYear() - date.getFullYear();
          if (age < 18) {
            return 'Testátor musí byť plnoletý (18+ rokov)';
          }
          return null;
        }
      },
      id_number: {
        required: true,
        custom: (value: string) => {
          if (!this.validateSlovakIDNumber(value)) {
            return 'Neplatné rodné číslo';
          }
          return null;
        }
      },
      place_of_birth: {
        required: true,
        minLength: 2,
        maxLength: 100
      },
      permanent_address: {
        required: true,
        minLength: 10,
        maxLength: 500
      }
    },

    emergencyContact: {
      name: {
        required: true,
        minLength: 2,
        maxLength: 100,
        pattern: /^[\p{L}\s\-.']+$/u
      },
      relationship: {
        required: true,
        minLength: 2,
        maxLength: 50
      },
      email: {
        required: true,
        custom: (value: string) => {
          if (!validator.isEmail(value)) {
            return 'Neplatná emailová adresa';
          }
          return null;
        }
      },
      phone: {
        required: true,
        custom: (value: string) => {
          if (!validator.isMobilePhone(value, 'sk-SK')) {
            return 'Neplatné telefónne číslo';
          }
          return null;
        }
      },
      address: {
        required: false,
        maxLength: 500
      }
    },

    feedback: {
      rating: {
        required: true,
        custom: (value: number) => {
          if (!Number.isInteger(value) || value < 1 || value > 5) {
            return 'Hodnotenie musí byť medzi 1 a 5';
          }
          return null;
        }
      },
      feedback: {
        required: true,
        minLength: 10,
        maxLength: 1000
      },
      category: {
        required: false,
        custom: (value: string) => {
          const validCategories = ['bug', 'feature', 'improvement', 'other'];
          if (value && !validCategories.includes(value)) {
            return 'Neplatná kategória';
          }
          return null;
        }
      }
    }
  };

  /**
   * Validate Slovak ID number (rodné číslo)
   */
  private static validateSlovakIDNumber(idNumber: string): boolean {
    // Remove spaces and slashes
    const cleaned = idNumber.replace(/[\s/]/g, '');

    // Check format: YYMMDD/XXX or YYMMDD/XXXX
    if (!/^\d{6}\d{3,4}$/.test(cleaned)) {
      return false;
    }

    const year = parseInt(cleaned.substring(0, 2));
    const month = parseInt(cleaned.substring(2, 4));
    const day = parseInt(cleaned.substring(4, 6));

    // Check month (can be +50 for women, +20 for special cases)
    const actualMonth = month % 50;
    if (actualMonth < 1 || actualMonth > 12) {
      return false;
    }

    // Check day
    if (day < 1 || day > 31) {
      return false;
    }

    // Check modulo 11 for numbers with 4 digits after slash
    if (cleaned.length === 10) {
      const checksum = parseInt(cleaned.substring(9, 10));
      const number = parseInt(cleaned.substring(0, 9));
      const remainder = number % 11;

      if (remainder < 10 && remainder !== checksum) {
        return false;
      }
      if (remainder === 10 && checksum !== 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sanitize HTML content (for rich text fields)
   */
  static sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: []
    });
  }

  /**
   * Validate file upload
   */
  static validateFile(file: File, options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}): string | null {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
    } = options;

    if (file.size > maxSize) {
      return `Súbor je príliš veľký. Maximálna veľkosť je ${Math.round(maxSize / 1024 / 1024)}MB`;
    }

    if (!allowedTypes.includes(file.type)) {
      return 'Nepodporovaný typ súboru';
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return 'Nepodporovaná prípona súboru';
    }

    return null;
  }

  /**
   * Rate limiting validation
   */
  static validateRateLimit(identifier: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
    const key = `rate_limit_${identifier}`;
    const now = Date.now();

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        const validRequests = data.requests.filter((timestamp: number) => now - timestamp < windowMs);

        if (validRequests.length >= maxRequests) {
          return false;
        }

        validRequests.push(now);
        localStorage.setItem(key, JSON.stringify({ requests: validRequests }));
      } else {
        localStorage.setItem(key, JSON.stringify({ requests: [now] }));
      }
    }

    return true;
  }
}