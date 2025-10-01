# LegacyGuard Will Generation System - Complete Guide

## Overview

The LegacyGuard Will Generation System is a comprehensive solution for creating, signing, and managing legal wills across multiple jurisdictions. The system supports 14+ countries with jurisdiction-specific templates and legal requirements.

## Features

### ✅ Implemented Features

1. **Multi-Jurisdiction Support**
   - 14 countries supported (CZ, SK)
   - Jurisdiction-specific legal templates
   - Localized execution instructions
   - Country-specific formality requirements

2. **PDF Generation**
   - Dynamic PDF creation using jsPDF
   - Multi-page support with automatic page breaks
   - Witness signature sections
   - Digital signature stamp integration

3. **E-Signature Integration**
   - Simple consent-based signatures
   - LegacyGuard SVG signature stamps
   - Skribble QES (Qualified Electronic Signature) integration
   - Signature verification and tracking

4. **Will Management APIs**
   - Full CRUD operations for wills
   - Version control and history tracking
   - Backup and recovery functionality
   - Status workflow management

5. **Notarization Workflow**
   - Digital notarization records
   - Verification code generation
   - Witness management
   - Certificate storage

6. **Security Features**
   - Row-level security in database
   - Encrypted storage of sensitive data
   - Audit trails for all changes
   - User authentication via Clerk

## API Endpoints

### Will Management

- `GET /api/will/list` - List all wills for authenticated user
- `GET /api/will/[id]` - Get specific will details
- `PUT /api/will/[id]` - Update draft will
- `DELETE /api/will/[id]` - Delete draft will
- `POST /api/will/generate` - Generate new will with PDF
- `POST /api/will/sign` - Sign will document

### Notarization

- `POST /api/will/notarize` - Notarize signed will
- `GET /api/will/notarize?code=XXX` - Verify notarization

### Webhooks

- `POST /api/webhooks/skribble` - Handle Skribble signature callbacks

## Database Schema

### Core Tables

1. **generated_wills** - Main will documents
2. **will_templates** - Jurisdiction-specific templates
3. **will_versions** - Version history
4. **signature_requests** - E-signature tracking
5. **signed_documents** - Signature records
6. **will_notarization** - Notarization records
7. **will_witnesses** - Witness information

## Configuration

### Required Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Skribble E-Signature
SKRIBBLE_API_BASE=https://api.skribble.com
SKRIBBLE_API_KEY=your_skribble_api_key
SKRIBBLE_ACCOUNT_ID=your_skribble_account_id
SKRIBBLE_WEBHOOK_SECRET=your_webhook_secret

# Email Service
RESEND_API_KEY=your_resend_api_key

# Encryption
WILL_ENCRYPTION_KEY=your_encryption_key
```

## Usage Guide

### 1. Creating a Will

```typescript
// POST /api/will/generate
{
  "willContent": {
    "testator": {
      "name": "John Doe",
      "birthDate": "1980-01-01",
      "address": "123 Main St, City"
    },
    "beneficiaries": [{
      "name": "Jane Doe",
      "relationship": "spouse",
      "identification": "ID123",
      "allocation": [{
        "assetType": "percentage",
        "value": "50"
      }]
    }],
    "executor": {
      "name": "Legal Executor",
      "relationship": "lawyer",
      "address": "456 Law St"
    }
  },
  "requirements": {
    "witness_count": 2,
    "legal_language": {
      "title": "Last Will and Testament"
    }
  },
  "countryCode": "US"
}
```

### 2. Signing a Will

For simple signatures:

```typescript
// POST /api/will/sign
{
  "willId": "will-uuid",
  "documentType": "will"
}
```

For QES signatures (automatically triggered for wills):

- User is redirected to Skribble
- Webhook updates signature status
- Certificate stored in database

### 3. Notarizing a Will

```typescript
// POST /api/will/notarize
{
  "willId": "will-uuid",
  "notaryName": "Jane Notary",
  "notaryLicense": "NOT-12345",
  "notaryJurisdiction": "US-CA",
  "notarizationLocation": "San Francisco, CA",
  "witnesses": [{
    "name": "Witness One",
    "address": "789 Witness St"
  }]
}
```

## Testing

Run the test suite:

```bash
npm test will
```

## Security Considerations

1. **Data Protection**
   - All will content is encrypted at rest
   - TLS encryption for data in transit
   - Regular security audits

2. **Access Control**
   - Users can only access their own wills
   - Row-level security enforced at database
   - API authentication required

3. **Compliance**
   - GDPR compliant data handling
   - Jurisdiction-specific legal requirements
   - Audit trails for regulatory compliance

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Skribble account setup
- [ ] Email service configured
- [ ] SSL certificates installed
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Legal review completed

## Support

For issues or questions:

- Technical: <dev@legacyguard.com>
- Legal: <legal@legacyguard.com>
- Support: <support@legacyguard.com>
