# PREPRACOVANÝ IMPLEMENTAČNÝ PLÁN: Pokročilý Will Generation System v2.0

**Project**: LegacyGuard Enhanced Will Generation System
**Date**: October 1, 2025
**Status**: Ready for Implementation

## 🎯 **CORE STRATÉGIE A ROZHODNUTIA**

### Cost-First Approach

- **AI Budget**: ~$0.10/deň (20x úspora oproti súčasnému limitu)
- **Single API Call Strategy**: Zber všetkých údajov → jeden veľký optimalizovaný prompt
- **Smart Batching**: Využitie existujúceho Sofia AI Router systému

### Simplicity-First Approach

- **External Redirects**: Minimalizácia API integračných bodov
- **Database-Only Trust Seals**: Bez NFT complexity
- **Hard-Coded Templates**: Pre rýchlejší štart, admin panel neskôr

## 📋 **AKTUALIZOVANÁ ARCHITEKTÚRA**

### 1. Optimized Will Template Engine

```typescript
interface EnhancedWillTemplate {
  id: string;
  jurisdiction: 'SK' | 'CZ' | 'AT' | 'DE' | 'PL'; // EU-ready
  type: 'holographic' | 'witnessed' | 'notarized';
  complexity: 'basic' | 'intermediate' | 'advanced';

  // Cost optimization
  estimatedTokens: number;
  basePrompt: string; // Pre-optimized prompt template

  // Trust system
  trustRequirements: {
    minFields: string[];
    recommendedValidations: string[];
    confidenceBoost: number;
  };
}
```

### 2. Simplified Trust Seal System

```typescript
interface TrustSeal {
  id: string;
  userId: string;
  documentId: string;

  // Levels: Bronze (0-40%), Silver (41-70%), Gold (71-90%), Platinum (91-100%)
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  confidenceScore: number; // 0-100

  // Validation sources
  validations: {
    aiValidation: { score: number; timestamp: Date };
    legalRulesCheck: { score: number; issues: string[] };
    partnerReview?: { score: number; reviewDate: Date; cost: number };
  };

  // Simple database storage
  issuedAt: Date;
  validUntil: Date; // 365 days
  digitalSignature: string; // Internal signature
}
```

### 3. Streamlined Family Collaboration

```typescript
interface FamilyMember {
  id: string;
  userId: string;
  email: string;
  role: 'guardian' | 'executor' | 'heir' | 'emergency_contact';
  permissions: {
    viewDocuments: boolean;
    editWills: boolean;
    accessEmergency: boolean;
  };

  // Tier restrictions
  availableInTier: 'free' | 'paid' | 'family_edition';
  invitationStatus: 'pending' | 'accepted' | 'declined';
}
```

## 🏗️ **PREPRACOVANÉ IMPLEMENTAČNÉ FÁZY**

### FÁZA 1: Foundation + Cost Optimization (3 dni)

#### 1.1 Enhanced Sofia AI Router

- Rozšírenie existujúceho `src/lib/sofia/router.ts`
- **Single-Call Legal Generation**:

```typescript
// Nová metoda pre optimalizované generovanie
async generateWillSingleCall(userData: CompleteWillData): Promise<WillGenerationResult> {
  // Collect ALL data first
  const completeContext = this.buildCompleteContext(userData);

  // One optimized API call (estimated ~2000 tokens = $0.02)
  const generatedWill = await this.callOpenAI(completeContext, 'gpt-4o');

  // AI validation + trust score calculation
  const trustScore = this.calculateTrustScore(userData, generatedWill);

  return { will: generatedWill, trustSeal: this.generateTrustSeal(trustScore) };
}
```

#### 1.2 Simplified Legal Framework

- `src/lib/legal/jurisdictions/` - Hard-coded pravidlá pre SK/CZ
- `src/lib/legal/trust-calculator.ts` - Trust score algoritmus
- `src/lib/legal/validation-rules.ts` - Základné validačné pravidlá

### FÁZA 2: Enhanced Will Generation UI (2-3 dni)

#### 2.1 Tier-Based Will Generator

```typescript
interface WillGeneratorConfig {
  tier: 'free' | 'paid' | 'family_edition';
  mode: 'basic' | 'guided' | 'expert'; // Mapped to tiers

  features: {
    aiAssistance: boolean;
    livePreview: boolean;
    trustSealGeneration: boolean;
    familyCollaboration: boolean;
  };
}
```

#### 2.2 Data Collection Wizard

- **Smart Data Collection**: Postupné zbieranie údajov namiesto komplexných formulárov
- **Context Building**: Príprava na single AI call
- **Real-time Validation**: Client-side validácia pred AI call

### FÁZA 3: Trust Seal & Partnership Integration (2 dni)

#### 3.1 Database-Only Trust Seals

```sql
-- Jednoduchá databázová schéma
CREATE TABLE trust_seals (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  document_id uuid,
  level trust_level_enum,
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  validations jsonb,
  digital_signature text,
  issued_at timestamptz DEFAULT now(),
  valid_until timestamptz DEFAULT (now() + interval '365 days')
);
```

#### 3.2 Simple Partnership Links

```typescript
interface PartnershipLink {
  firm: 'brno-advokati.cz';
  type: 'contact_redirect' | 'facebook_redirect';
  url: string;
  description: string;

  // Simple analytics
  clicks: number;
  conversions?: number;
}
```

### FÁZA 4: Family Collaboration MVP (2 dni)

#### 4.1 Basic Family Features

- **Free Tier**: 1 guardian/executor
- **Paid Tier**: Unlimited guardians + guided mode
- **Family Edition**: Full collaboration + expert mode

#### 4.2 Emergency Access System

```typescript
interface EmergencyAccess {
  triggerType: 'dead_mans_switch' | 'manual_activation';
  activatedBy: string; // User ID
  activatedAt: Date;

  // Simple notification system
  notifiedMembers: string[]; // Email notifications
  documentsShared: string[]; // Document IDs
}
```

### FÁZA 5: Advanced Features & Future-Proofing (2-3 dni)

#### 5.1 Multi-Jurisdiction Support

- Template system rozšírený pre AT, DE, PL
- Quarterly releases pre legal updates

#### 5.2 B2B Dashboard Foundation

```typescript
interface LawyerDashboard {
  firmId: string;
  activeReviews: ReviewRequest[];
  completedReviews: ReviewResult[];

  // Revenue tracking
  reviewsPerMonth: number;
  averageReviewTime: number;
  revenue: number;
}
```

## 💰 **COST OPTIMIZATION STRATEGY**

### AI Usage Optimization

```typescript
// Single optimized prompt template
const OPTIMIZED_WILL_PROMPT = `
Generate a legally compliant will for {jurisdiction} with the following consolidated data:
PERSONAL: {personalData}
ASSETS: {assetData}
BENEFICIARIES: {beneficiaryData}
PREFERENCES: {preferences}

Requirements:
- Use template: {templateId}
- Include mandatory elements for {jurisdiction}
- Generate confidence assessment
- Highlight potential issues

Return structured JSON with: {will_text, confidence_score, validation_notes}
`;

// Estimated cost per will: $0.02-0.05 (vs current potential $5+)
```

### Trust Seal Algorithm (Free)

```typescript
function calculateTrustScore(userData: WillFormData, generatedWill: string): number {
  let score = 0;

  // Basic data completeness (40%)
  score += calculateDataCompleteness(userData) * 0.4;

  // Legal compliance check (40%) - rule-based, free
  score += checkLegalCompliance(userData, generatedWill) * 0.4;

  // AI validation confidence (20%)
  score += extractAIConfidence(generatedWill) * 0.2;

  return Math.round(score * 100);
}
```

## 🎨 **TIER-BASED FEATURE MATRIX**

| Funkcia | Free | Paid | Family Edition |
|---------|------|------|----------------|
| Will Generator | Basic mode | Guided mode | Expert mode |
| Trust Seal | Bronze/Silver | Silver/Gold | Gold/Platinum |
| Family Members | 1 guardian | Unlimited | Unlimited + roles |
| AI Assistance | Minimal | Standard | Comprehensive |
| Legal Review | External link | Paid option | Included |
| Document Storage | 30 days | 365 days | Unlimited |
| Emergency Access | Basic | Advanced | Full automation |

## 📊 **EXPECTED OUTCOMES**

### Cost Efficiency

- **AI Budget**: $0.10/deň namiesto $5/deň (98% úspora)
- **Development Time**: 2-3 týždne namiesto 4-6 týždňov
- **Maintenance**: Minimálne API dependencies

### User Value

- **Trust Seals**: Immediate confidence boost
- **Family Collaboration**: Tier-appropriate functionality
- **Future-Proof**: EU-ready architecture

### Business Model Support

- **Free to Paid Conversion**: Clear upgrade path
- **Family Edition Positioning**: Premium collaborative features
- **B2B Ready**: Foundation pre lawyer dashboard

## 🔗 **PARTNERSHIP INTEGRATION**

### Legal Firm Integration (brno-advokati.cz)

- **Contact Page**: <https://brnoadvokati.cz/kontakt/>
- **Facebook**: <https://www.facebook.com/brnoadvokati>
- **Integration Type**: External redirect links
- **User Flow**: LegacyGuard → Generate Will → Option to "Get Professional Review" → Redirect to partner firm

### Trust Seal Enhancement via Legal Review

- **Process**: User pays partner firm directly for review
- **Result**: Enhanced Trust Seal level (Gold → Platinum)
- **Implementation**: Simple status update in our database after manual confirmation

## 📋 **USER EXPERIENCE CONSIDERATIONS**

### GDPR & Privacy

- **Data Retention**: 365 days for drafts, permanent for final wills (with user consent)
- **AI Processing**: Clear consent for OpenAI processing
- **Family Sharing**: Granular permission controls
- **Right to Erasure**: Full data deletion capability

### Collaborative Features

- **Free Tier**: 1 guardian/executor invitation
- **Paid Tier**: Unlimited family members with role-based permissions
- **Family Edition**: Full collaboration with shared calendars and milestones
- **B2B Future**: Lawyer dashboard for professional will reviews

## 🚀 **IMPLEMENTATION TIMELINE**

**Week 1**: Fáza 1 + 2 (Foundation + Enhanced UI)
**Week 2**: Fáza 3 + 4 (Trust Seals + Family Collaboration)
**Week 3**: Fáza 5 + Testing (Advanced Features + QA)

**Total Estimated Time**: 2-3 týždne
**Primary Focus**: Cost optimization a user value maximization

## ✅ **SUCCESS METRICS**

### Technical

- AI cost per will: < $0.05
- Average generation time: < 30 seconds
- Trust Seal accuracy: > 85%

### Business

- Free-to-Paid conversion: > 15%
- Legal partner referrals: > 5 per month
- User satisfaction: > 4.5/5

### Legal

- Zero legal liability incidents
- 100% GDPR compliance
- Clear disclaimers and user education

---

## 🏭 **PRODUCTION-READY ENHANCEMENTS**

### Database Schema & Migrations

```sql
-- Core tables for production deployment
CREATE TABLE will_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  jurisdiction jurisdiction_enum NOT NULL,
  document_type will_type_enum NOT NULL,
  content text,
  metadata jsonb DEFAULT '{}',
  is_final boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE trust_seals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES will_documents(id) ON DELETE CASCADE,
  level trust_level_enum NOT NULL,
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  validations jsonb NOT NULL DEFAULT '{}',
  digital_signature text NOT NULL,
  issued_at timestamptz DEFAULT now(),
  valid_until timestamptz DEFAULT (now() + interval '365 days'),
  revoked_at timestamptz
);

CREATE TABLE ai_usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  operation_type varchar(50) NOT NULL,
  tokens_used integer NOT NULL,
  cost_usd decimal(10,4) NOT NULL,
  model_used varchar(50) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE partnership_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id varchar(100) NOT NULL,
  click_type varchar(50) NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  trust_seal_level trust_level_enum,
  referral_context varchar(100),
  clicked_at timestamptz DEFAULT now()
);
```

### Enhanced Error Handling & Recovery

```typescript
// src/lib/error-handling/will-generation-errors.ts
export class WillGenerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'WillGenerationError';
  }
}

export class ErrorRecoveryManager {
  static async handleAIFailure(userData: CompleteWillData): Promise<WillGenerationResult> {
    // Fallback to template-based generation
    const template = await getEnhancedWillTemplate(userData.jurisdiction, userData.userTier);
    return await generateFromTemplate(userData, template);
  }

  static async handleDatabaseFailure(): Promise<void> {
    // Queue for retry with exponential backoff
    await this.queueForRetry();
  }
}
```

### Legal Disclaimer & Compliance System

```typescript
// src/components/legal/DisclaimerModal.tsx
export function LegalDisclaimerModal({ jurisdiction }: { jurisdiction: string }) {
  return (
    <Dialog>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Právne upozornenie</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Tento dokument je generovaný automaticky a slúži len ako návrh.
              Pre právnu platnosť odporúčame konzultáciu s kvalifikovaným právnikom.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <h4 className="font-medium">Dôležité upozornenia:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Tento nástroj neposkytuje právne poradenstvo</li>
              <li>Platnosť dokumentu závisí od jurisdikcie a dodržania formálnych požiadaviek</li>
              <li>Odporúčame overenie u kvalifikovaného právnika</li>
              <li>LegacyGuard nezodpovedá za právne následky použitia týchto dokumentov</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### AI Cost Monitoring & Budget Alerts

```typescript
// src/lib/ai-cost-monitoring/budget-manager.ts
export class AIBudgetManager {
  private static DAILY_LIMIT = 0.10; // $0.10/day
  private static WARNING_THRESHOLD = 0.08; // $0.08 (80%)

  static async checkBudgetBeforeRequest(userId: string): Promise<boolean> {
    const todayUsage = await this.getTodayUsage(userId);
    return todayUsage < this.DAILY_LIMIT;
  }

  static async trackUsage(userId: string, cost: number, tokens: number): Promise<void> {
    await supabase.from('ai_usage_tracking').insert({
      user_id: userId,
      operation_type: 'will_generation',
      tokens_used: tokens,
      cost_usd: cost,
      model_used: 'gpt-4o'
    });

    // Check for budget alerts
    const todayUsage = await this.getTodayUsage(userId);
    if (todayUsage >= this.WARNING_THRESHOLD) {
      await this.sendBudgetAlert(userId, todayUsage);
    }
  }
}
```

### Jurisdiction Content Update System

```typescript
// src/lib/content-management/jurisdiction-updater.ts
export class JurisdictionContentUpdater {
  static async checkForLegalUpdates(): Promise<ContentUpdate[]> {
    // Quarterly check for legal changes in SK/CZ
    const lastCheck = await this.getLastUpdateCheck();
    const updates = await this.fetchLegalUpdates(lastCheck);

    return updates.filter(update =>
      this.requiresTemplateUpdate(update) ||
      this.requiresValidationUpdate(update)
    );
  }

  static async applyContentUpdate(update: ContentUpdate): Promise<void> {
    if (update.type === 'template') {
      await this.updateWillTemplate(update);
    } else if (update.type === 'validation') {
      await this.updateValidationRules(update);
    }

    // Create audit log
    await this.createUpdateLog(update);
  }
}
```

### Trust Seal Verification System

```typescript
// src/lib/trust-seal/verification.ts
export class TrustSealVerifier {
  static async verifyTrustSeal(sealId: string): Promise<VerificationResult> {
    const seal = await supabase
      .from('trust_seals')
      .select('*')
      .eq('id', sealId)
      .single();

    if (!seal) {
      return { valid: false, reason: 'Seal not found' };
    }

    // Check expiration
    if (new Date() > new Date(seal.valid_until)) {
      return { valid: false, reason: 'Seal expired' };
    }

    // Verify digital signature
    const signatureValid = await this.verifyDigitalSignature(
      seal.digital_signature,
      seal.document_id
    );

    return {
      valid: signatureValid,
      level: seal.level,
      issuedAt: seal.issued_at,
      validUntil: seal.valid_until
    };
  }
}
```

### Multi-Device Sync & Offline Support

```typescript
// src/lib/sync/document-sync.ts
export class DocumentSyncManager {
  static async syncDocumentChanges(documentId: string): Promise<void> {
    const localChanges = await this.getLocalChanges(documentId);
    const serverChanges = await this.getServerChanges(documentId);

    // Conflict resolution
    const mergedChanges = await this.mergeChanges(localChanges, serverChanges);

    // Update local and server
    await this.updateLocalDocument(documentId, mergedChanges);
    await this.updateServerDocument(documentId, mergedChanges);
  }

  static async enableOfflineMode(): Promise<void> {
    // Cache essential templates and validation rules
    await this.cacheEssentialData();

    // Setup service worker for offline functionality
    await this.registerServiceWorker();
  }
}
```

### Advanced Security & Document Encryption

```typescript
// src/lib/security/document-encryption.ts
export class DocumentEncryptionManager {
  static async encryptWillContent(content: string, userId: string): Promise<string> {
    const key = await this.getUserEncryptionKey(userId);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
      key,
      new TextEncoder().encode(content)
    );
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  static async setupUserEncryption(userId: string): Promise<void> {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Store encrypted key in secure vault
    await this.storeUserKey(userId, key);
  }
}
```

### User Onboarding & Education Components

```typescript
// src/components/onboarding/WillEducationWizard.tsx
export function WillEducationWizard() {
  const steps = [
    {
      title: "Čo je závet?",
      content: "Závet je právny dokument, ktorý určuje, ako sa rozdelí váš majetok po smrti.",
      interactive: <WillBasicsQuiz />
    },
    {
      title: "Právne požiadavky",
      content: "Každá jurisdikcia má špecifické požiadavky na platnosť závetu.",
      interactive: <JurisdictionSelector />
    },
    {
      title: "Trust Seal systém",
      content: "Náš Trust Seal vám pomôže posúdiť kvalitu a spoľahlivosť vášho závetu.",
      interactive: <TrustSealDemo />
    }
  ];

  return <StepWizard steps={steps} />;
}
```

### Performance Optimization & Caching

```typescript
// src/lib/performance/cache-manager.ts
export class CacheManager {
  private static redis = new Redis(process.env.REDIS_URL);

  static async cacheWillTemplate(jurisdiction: string, template: string): Promise<void> {
    await this.redis.setex(
      `template:${jurisdiction}`,
      3600, // 1 hour
      JSON.stringify(template)
    );
  }

  static async getCachedValidationResult(dataHash: string): Promise<ValidationResult | null> {
    const cached = await this.redis.get(`validation:${dataHash}`);
    return cached ? JSON.parse(cached) : null;
  }

  static async preloadUserData(userId: string): Promise<void> {
    // Preload frequently accessed data
    const userData = await this.getUserProfile(userId);
    const documents = await this.getUserDocuments(userId);

    await Promise.all([
      this.redis.setex(`user:${userId}`, 1800, JSON.stringify(userData)),
      this.redis.setex(`docs:${userId}`, 1800, JSON.stringify(documents))
    ]);
  }
}
```

---

## 🎯 **PRODUCTION IMPLEMENTATION PRIORITY**

### Priority 1: Critical Infrastructure

1. Database schema and migrations
2. Enhanced error handling and recovery
3. Legal disclaimer and compliance system
4. AI cost monitoring and budget alerts

### Priority 2: Core Features

1. Trust Seal verification system
2. Jurisdiction content update system
3. Multi-device sync functionality

### Priority 3: Advanced Features

1. Advanced security with document encryption
2. User onboarding and education components
3. Performance optimization with caching

### Priority 4: Monitoring & Analytics

1. Partnership analytics and tracking
2. User behavior analytics
3. System performance monitoring

---

**Note**: This enhanced plan includes production-ready features ensuring scalability, security, and legal compliance while maintaining the core cost efficiency and user value proposition.
