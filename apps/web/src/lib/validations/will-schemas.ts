import { z } from 'zod';

// Base schemas for reusability
export const personSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  relationship: z.string().optional()
});

export const executorSchema = personSchema.extend({
  alternativeExecutor: personSchema.optional(),
  acceptanceStatement: z.boolean().refine(val => val === true, {
    message: 'Executor must accept the responsibility'
  })
});

export const beneficiarySchema = personSchema.extend({
  sharePercentage: z.number().min(0).max(100),
  shareDescription: z.string().optional(),
  conditions: z.string().optional()
});

export const assetSchema = z.object({
  type: z.enum(['real_estate', 'bank_account', 'investment', 'personal_property', 'other']),
  description: z.string().min(5, 'Asset description must be at least 5 characters'),
  value: z.number().min(0).optional(),
  location: z.string().optional(),
  beneficiaries: z.array(z.string()).min(1, 'At least one beneficiary must be specified'),
  conditions: z.string().optional()
});

// Main will generation schema
export const willGenerationSchema = z.object({
  // Personal Information
  fullName: z.string().min(2, 'Full name is required'),
  birthDate: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 18 && age <= 120;
  }, 'You must be at least 18 years old to create a will'),
  citizenship: z.string().min(2, 'Citizenship is required'),
  address: z.string().min(5, 'Address is required'),
  identificationNumber: z.string().optional(),

  // Will Configuration
  jurisdiction: z.enum(['SK', 'CZ', 'AT', 'DE', 'PL']),
  willType: z.enum(['holographic', 'witnessed', 'notarized']),
  language: z.enum(['sk', 'cs', 'de', 'en', 'pl']),

  // Executor Information
  executor: executorSchema,

  // Beneficiaries
  beneficiaries: z.array(beneficiarySchema).min(1, 'At least one beneficiary is required'),

  // Assets
  assets: z.array(assetSchema).min(1, 'At least one asset must be specified'),

  // Special Instructions
  specialInstructions: z.string().optional(),
  funeralArrangements: z.string().optional(),
  digitalAssets: z.string().optional(),

  // Legal Requirements
  mentalCapacityDeclaration: z.boolean().refine(val => val === true, {
    message: 'Mental capacity declaration is required'
  }),
  revokesPreviousWills: z.boolean().default(true),

  // Witness Information (for witnessed wills)
  witnesses: z.array(personSchema).optional().refine((witnesses, ctx) => {
    const willType = ctx.parent?.willType;
    if (willType === 'witnessed' && (!witnesses || witnesses.length < 2)) {
      return false;
    }
    return true;
  }, 'Witnessed wills require at least 2 witnesses'),

  // Notary Information (for notarized wills)
  notaryInfo: z.object({
    name: z.string(),
    registrationNumber: z.string(),
    location: z.string()
  }).optional().refine((notary, ctx) => {
    const willType = ctx.parent?.willType;
    if (willType === 'notarized' && !notary) {
      return false;
    }
    return true;
  }, 'Notarized wills require notary information')
}).refine((data) => {
  // Validate that beneficiary percentages add up to 100%
  const totalPercentage = data.beneficiaries.reduce((sum, beneficiary) =>
    sum + beneficiary.sharePercentage, 0);
  return Math.abs(totalPercentage - 100) < 0.01; // Allow for floating point precision
}, {
  message: 'Beneficiary shares must total 100%',
  path: ['beneficiaries']
}).refine((data) => {
  // Validate that all asset beneficiaries exist in the beneficiaries list
  const beneficiaryNames = data.beneficiaries.map(b => b.name);
  return data.assets.every(asset =>
    asset.beneficiaries.every(beneficiaryName =>
      beneficiaryNames.includes(beneficiaryName)
    )
  );
}, {
  message: 'All asset beneficiaries must be defined in the beneficiaries list',
  path: ['assets']
});

// Partial schemas for step-by-step validation
export const personalInfoSchema = willGenerationSchema.pick({
  fullName: true,
  birthDate: true,
  citizenship: true,
  address: true,
  identificationNumber: true
});

export const configurationSchema = willGenerationSchema.pick({
  jurisdiction: true,
  willType: true,
  language: true
});

export const executorInfoSchema = willGenerationSchema.pick({
  executor: true
});

export const beneficiariesSchema = willGenerationSchema.pick({
  beneficiaries: true
});

export const assetsSchema = willGenerationSchema.pick({
  assets: true
});

export const specialInstructionsSchema = willGenerationSchema.pick({
  specialInstructions: true,
  funeralArrangements: true,
  digitalAssets: true
});

export const legalRequirementsSchema = willGenerationSchema.pick({
  mentalCapacityDeclaration: true,
  revokesPreviousWills: true,
  witnesses: true,
  notaryInfo: true
});

// Type exports
export type WillGenerationData = z.infer<typeof willGenerationSchema>;
export type PersonData = z.infer<typeof personSchema>;
export type ExecutorData = z.infer<typeof executorSchema>;
export type BeneficiaryData = z.infer<typeof beneficiarySchema>;
export type AssetData = z.infer<typeof assetSchema>;

// Validation helpers
export function validateStep(step: number, data: Partial<WillGenerationData>): {
  isValid: boolean;
  errors: string[];
} {
  const schemas = [
    personalInfoSchema,
    configurationSchema,
    executorInfoSchema,
    beneficiariesSchema,
    assetsSchema,
    specialInstructionsSchema,
    legalRequirementsSchema
  ];

  if (step < 0 || step >= schemas.length) {
    return { isValid: false, errors: ['Invalid step number'] };
  }

  try {
    schemas[step].parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Validation failed'] };
  }
}

export function validateEntireWill(data: Partial<WillGenerationData>): {
  isValid: boolean;
  errors: string[];
  completeness: number;
} {
  try {
    willGenerationSchema.parse(data);
    return { isValid: true, errors: [], completeness: 100 };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);

      // Calculate completeness based on filled fields
      const requiredFields = [
        'fullName', 'birthDate', 'citizenship', 'address',
        'jurisdiction', 'willType', 'language',
        'executor', 'beneficiaries', 'assets'
      ];

      const filledFields = requiredFields.filter(field => {
        const value = data[field as keyof WillGenerationData];
        return value !== undefined && value !== null && value !== '';
      });

      const completeness = Math.round((filledFields.length / requiredFields.length) * 100);

      return { isValid: false, errors, completeness };
    }
    return { isValid: false, errors: ['Validation failed'], completeness: 0 };
  }
}