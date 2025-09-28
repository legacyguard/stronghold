# ARCH 03 — Backend Architecture — Agent Backend (Sofia)

Area: Backend, Data, Infra, Product
Related Feature: UI i18n Layer (../Features%2065472ecceccf486fa4e2b758eb9d3e12/UI%20i18n%20Layer%2097b50617281d417c8a6fb7ef5b133a51.md), Domain and Language Middleware (../Features%2065472ecceccf486fa4e2b758eb9d3e12/Domain%20and%20Language%20Middleware%206533d40329844dff82ec013d7bb8d453.md)
Status: Draft
Type: Architecture

### Overview

<aside>
🔧

Auth and Framework baseline: This architecture uses Supabase Auth (JWT) for authentication and Next.js (App Router) for the frontend. All mentions of previous Clerk/Vite examples should be read as Supabase Auth and Next.js equivalents.

</aside>

This document describes the backend architecture for the Family Protection Assistant using the n8n Cloud application as the orchestration and agent runtime. All descriptive text is in English. Code, JSON, and TypeScript examples remain in English for codebase consistency.

---

## 🎯 Why n8n Agent Makes Perfect Sense

### Traditional Backend Problems:

- Complex conversation state management
- Tool integration overhead
- Memory handling complexity
- API orchestration logic

### n8n Agent Solutions:

- ✅ Built-in conversation memory — automatic context retention
- ✅ Tool integration framework — easy external service connections
- ✅ Webhook interface — simple API for frontend
- ✅ Visual workflow — easy debugging and iteration
- ✅ No‑code AI logic — rapid prompt engineering

---

## 🏗️ Sofia AI Agent Architecture

### Core Components

### 1. Sofia Conversation Agent

```json
{
  "name": "Sofia Family Assistant",
  "model": "gpt-4o",
  "systemPrompt": "You are Sofia, a caring firefly AI assistant specializing in family protection and life organization...",
  "memory": "conversationBuffer",
  "tools": [
    "ANALYZE_DOCUMENT",
    "UPDATE_PROTECTION_SCORE",
    "SEND_GUARDIAN_NOTIFICATION",
    "CREATE_EMERGENCY_PLAN",
    "SCHEDULE_REMINDER",
    "SEARCH_FAMILY_DOCS"
  ]
}
```

### 2. Document Processing Agent

```json
{
  "name": "Document Analyzer",
  "trigger": "document_upload_webhook",
  "workflow": [
    "OCR_EXTRACTION",
    "GPT4_VISION_ANALYSIS",
    "METADATA_EXTRACTION",
    "CRISIS_CONTEXT_GENERATION",
    "SUPABASE_STORAGE",
    "SOFIA_NOTIFICATION"
  ]
}
```

### 3. Guardian Network Agent

```json
{
  "name": "Guardian Coordinator",
  "triggers": [
    "guardian_invitation",
    "crisis_activation",
    "emergency_access_request"
  ],
  "tools": [
    "EMAIL_SERVICE",
    "SMS_GATEWAY",
    "CALENDAR_INTEGRATION",
    "EMERGENCY_CONTACTS_API"
  ]
}
```

### 4. Crisis Management Agent

```json
{
  "name": "Crisis Manager",
  "triggers": [
    "dead_mans_switch",
    "manual_emergency_activation",
    "hospital_integration_webhook"
  ],
  "actions": [
    "NOTIFY_ALL_GUARDIANS",
    "GENERATE_EMERGENCY_PACKAGE",
    "ACTIVATE_ICE_PROFILE",
    "CONTACT_EMERGENCY_SERVICES"
  ]
}
```

---

## 🔧 n8n Workflows Design

### Workflow 1: Sofia Chat Interface

```
[Webhook: /sofia/chat]
    ↓
[Extract Message + Context]
    ↓
[Sofia AI Agent]
    ├─ Tool: Analyze Family Data
    ├─ Tool: Search Documents
    ├─ Tool: Update Protection Score
    ├─ Tool: Schedule Actions
    └─ Tool: Generate Suggestions
    ↓
[Format Response]
    ↓
[Update Conversation Memory]
    ↓
[Send Response + Actions]
```

**Implementation:**

```json
{
  "nodes": [
    {
      "name": "Sofia Chat Webhook",
      "type": "webhook",
      "parameters": {
        "path": "sofia/chat",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Sofia AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "parameters": {
        "promptType": "define",
        "text": "You are Sofia, a caring firefly AI assistant specializing in family protection.\n\nPersonality: Warm, encouraging, proactive Slovak-speaking assistant\nExpertise: Family protection, document organization, legal guidance\nGoals: Help families organize their lives and protect each other\n\nUser Context:\n- Family situation:  $json.familySituation \n- Protection score:  $json.protectionScore /100\n- Recent documents:  $json.recentDocs \n- Guardian status:  $json.guardians \n\nAlways:\n1. Respond in Slovak naturally\n2. Provide actionable family protection advice\n3. Use relevant emojis (🧚‍♀️ for yourself, 🛡️ for protection)\n4. Suggest specific next steps\n5. Be encouraging about family security progress"
      }
    }
  ]
}
```

### Workflow 2: Document Processing Pipeline

```
[Document Upload Webhook]
    ↓
[File Processing]
    ├─ OCR Text Extraction
    ├─ GPT-4 Vision Analysis
    └─ Metadata Detection
    ↓
[Document Classification]
    ├─ Category Assignment
    ├─ Crisis Context Generation
    └─ Guardian Access Rules
    ↓
[Supabase Storage]
    ├─ Document Metadata
    ├─ AI Analysis Results
    └─ Protection Score Update
    ↓
[Sofia Notification]
    └─ "Document processed! Here's what I found..."
```

**Key Tools:**

```json
{
  "tools": [
    {
      "name": "OCR_PROCESSOR",
      "type": "customTool",
      "endpoint": "<[https://api.openai.com](https://api.openai.com)>",
      "description": "Extract text from document images"
    },
    {
      "name": "DOCUMENT_ANALYZER",
      "type": "openaiAssistant",
      "prompt": "Analyze this family document and extract:\n1. Document type and category\n2. Important dates (expiry, renewal)\n3. Key contacts and phone numbers\n4. Crisis context (what family needs to know in emergency)\n5. Suggested next actions"
    },
    {
      "name": "SUPABASE_UPDATER",
      "type": "httpRequest",
      "method": "POST",
      "url": " $env.SUPABASE_URL /rest/v1/documents",
      "headers": {
        "Authorization": "Bearer  $env.SUPABASE_SERVICE_KEY "
      }
    }
  ]
}
```

### Workflow 3: Protection Score Calculator

```
[Score Update Trigger]
    ↓
[Fetch User Data]
    ├─ Documents count & types
    ├─ Guardian network status
    ├─ Emergency plan completeness
    └─ Legal document status
    ↓
[AI Score Analysis]
    ├─ Calculate category scores
    ├─ Identify improvement areas
    └─ Generate recommendations
    ↓
[Update Database]
    ├─ New protection score
    ├─ Progress tracking
    └─ Next action suggestions
    ↓
[Sofia Celebration/Encouragement]
    └─ "Your protection score increased to 67%! 🎉"
```

### Workflow 4: Crisis Mode Activation

```
[Crisis Trigger]
    ├─ Manual activation
    ├─ Dead man's switch (48h inactive)
    ├─ Guardian emergency request
    └─ Hospital integration webhook
    ↓
[Emergency Assessment]
    ├─ Determine crisis type
    ├─ Identify required guardians
    └─ Generate action checklist
    ↓
[Multi-Channel Notification]
    ├─ Email to all guardians
    ├─ SMS to primary contacts
    ├─ App push notifications
    └─ Emergency services (if needed)
    ↓
[Emergency Package Generation]
    ├─ ICE profile for first responders
    ├─ Family instruction manual
    ├─ Document access bundle
    └─ Contact lists with context
    ↓
[Continuous Monitoring]
    └─ Track response, escalate if needed
```

---

## 🛠️ Implementation Strategy

### Phase 1: Basic Sofia Agent (Week 1)

Setup n8n Workflow:

```bash
# Install n8n locally
npm install -g n8n

# Start n8n
n8n start

# Import Sofia agent template
# Configure OpenAI API key
# Test basic chat functionality
```

Core Sofia Agent:

- Basic conversation with memory
- Family protection prompts
- Simple tool integration (search, calculate)
- Webhook interface for frontend

### Phase 2: Document Processing (Week 2)

Document Pipeline Workflow:

- File upload webhook
- OCR + Vision processing
- Supabase integration
- Sofia notification system

Tools Integration:

- OpenAI Vision API
- Text extraction services
- Database connectors
- File storage handlers

### Phase 3: Advanced Features (Week 3-4)

Guardian Network Workflow:

- Invitation system
- Email/SMS integration
- Access control logic
- Crisis activation triggers

Protection Score System:

- Real-time calculation
- Progress tracking
- Achievement celebrations
- Recommendation engine

### Phase 4: Crisis Management (Week 5-6)

Emergency Response System:

- Multi-trigger detection
- Guardian notification cascade
- Emergency services integration
- Recovery planning workflows

---

## 🔌 Frontend Integration

## 🧭 Main Orchestrator Agent (Single Entry Webhook)

- Single public endpoint: `/api/legacyguard-main` handles all frontend requests.
- Request shape: `{ "action": "chat" | "upload_document" | "protection_score" | "crisis_event" | "guardian_invite", "payload": { ... } }`.
- First node: `Switch` on `action` to route into sub‑agents (Sofia, Document Processor, Protection Score, Crisis Manager, Guardian Coordinator).
- Benefit: one endpoint in frontend, centralized logging, consistent auth and rate‑limits, simpler monitoring.

```json
{
  "nodes": [
    {
      "name": "LegacyGuard Main Webhook",
      "type": "webhook",
      "parameters": { "path": "api/legacyguard-main", "httpMethod": "POST" }
    },
    { "name": "Auth: Verify Supabase JWT", "type": "httpRequest" },
    { "name": "Switch: Action Router", "type": "switch", "parameters": { "propertyName": "json.action" } },
    { "name": "Case: chat → Sofia Agent", "type": "executeWorkflow", "parameters": { "workflowId": "sofia_chat" } },
    { "name": "Case: upload_document → Doc Pipeline", "type": "executeWorkflow", "parameters": { "workflowId": "doc_pipeline" } },
    { "name": "Case: protection_score → Score Calc", "type": "executeWorkflow", "parameters": { "workflowId": "score_calc" } },
    { "name": "Case: crisis_event → Crisis Manager", "type": "executeWorkflow", "parameters": { "workflowId": "crisis_manager" } }
  ]
}
```

## ♻️ Sub‑Workflows (Callable Workflows)

- Break down logic into reusable units and call them via `Execute Workflow` nodes.
- Examples:
    - `SendMultiChannelNotification(userId, message)` → email, SMS, push
    - `PersistAnalysisToSupabase(userId, docMeta, aiFindings)`
    - `UpdateProtectionScore(userId, delta, reasons)`
- Benefits: readability, reuse, focused unit testing of each building block.

## 🧯 Robust Error Handling

- Use `Error Trigger` workflows to capture failures from any workflow.
- Error handler responsibilities:
    - Persist detailed error entry in `error_logs` table (correlate `requestId`, `userId`, `action`, `node`, `error`)
    - Notify ops channel (Slack or email) with severity and context
    - Return safe, localized error payload to frontend

```json
{
  "onError": {
    "workflow": "error_handler",
    "payload": { "requestId": "$json.requestId", "userId": "$json.userId", "action": "$json.action", "node": "$json._node", "error": "$json.error" }
  }
}
```

## 🔐 Webhook Security

### Verifying Supabase JWT in n8n (Orchestrator)

Use a lightweight verification step before routing. Example with a Function item (or HTTP Request to JWKS if needed).

```tsx
// n8n Function item (TypeScript)
// Input: headers.Authorization = 'Bearer <jwt>'
// Env: SUPABASE_JWKS_URL or use supabase-js for verification server-side

const auth = $json.headers?.authorization || $json.headers?.Authorization;
if (!auth || !auth.startsWith('Bearer ')) {
  throw new Error('Missing bearer token');
}
const token = auth.substring('Bearer '.length);

// Option A: Verify against Supabase JWKS
// Fetch JWKS and verify signature using jose
const { createRemoteJWKSet, jwtVerify } = await import('jose');
const JWKS = createRemoteJWKSet(new URL($env.SUPABASE_JWKS_URL));
const { payload } = await jwtVerify(token, JWKS, { issuer: $env.SUPABASE_ISSUER });

// Option B: Call a small Next.js API route that uses @supabase/auth-helpers to validate
// and returns user context; then use it here. (Prefer Option A to keep single hop.)

if (!payload?.sub) {
  throw new Error('Invalid token payload');
}

return {
  json: {
    userId: payload.sub,
    email: [payload.email](http://payload.email) || null,
    roles: payload.role ? [payload.role] : [],
  }
};
```

Then reference `$json.userId` in downstream nodes and apply per-user rate limits and authorization checks.

- All requests must carry Supabase JWT in `Authorization: Bearer <token>`.
- First step: `Verify Supabase JWT` node calls Supabase Auth or uses local verification with the public JWKS.
- Reject invalid/expired tokens with 401 and stop execution.
- Add basic rate limiting per `userId` and IP at the Orchestrator.
- Log `requestId` for traceability across sub‑workflows.

### API Endpoints via n8n Webhooks

```tsx
// Sofia chat interface
const chatWithSofia = async (message: string, userId: string) => {
  const response = await fetch('/webhook/sofia/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      userId,
      context: await getUserContext(userId)
    })
  });
  return response.json();
};

// Document processing
const uploadDocument = async (file: File, userId: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);

  const response = await fetch('/webhook/document/process', {
    method: 'POST',
    body: formData
  });
  return response.json();
};

// Protection score update
const updateProtectionScore = async (userId: string, action: string) => {
  const response = await fetch('/webhook/protection/score', {
    method: 'POST',
    body: JSON.stringify({ userId, action })
  });
  return response.json();
};
```

### Real-time Updates via Webhooks

```tsx
// Listen for Sofia notifications
const setupSofiaWebsocket = () => {
  const ws = new WebSocket('ws://[n8n-instance.com/webhook/sofia/live](http://n8n-instance.com/webhook/sofia/live)');

  ws.onmessage = (event) => {
    const data = JSON.parse([event.data](http://event.data));

    switch(data.type) {
      case 'sofia_message':
        updateChatInterface(data.message);
        break;
      case 'score_update':
        updateProtectionScore(data.newScore);
        break;
      case 'document_processed':
        refreshDocumentList();
        break;
      case 'guardian_notification':
        showGuardianAlert(data.alert);
        break;
    }
  };
};
```

---

## 🎯 Advantages of n8n Agent Architecture

## 🔒 Security & Compliance (n8n Cloud + Supabase)

### Authentication

- Frontend → n8n: Supabase JWT in `Authorization: Bearer <token>` on every request
- n8n Orchestrator verifies JWT against Supabase Auth or JWKS before any processing
- Service-to-service secrets stored in n8n Credentials vault, never hardcoded

### Authorization

- Pass `userId` and derived roles/claims from JWT
- Node-level guards: verify resource ownership before DB writes or reads
- Callable workflows accept only whitelisted actions via Switch router

### Data Protection and PII

- Store only necessary PII in Supabase with Row Level Security (RLS) policies per `userId`
- Mask sensitive fields in logs and error payloads; use structured logging with redaction
- Separate tables for AI outputs vs. source documents to simplify retention

### Encryption

- TLS in transit for all webhooks and external calls
- At rest: n8n Cloud managed encryption for credentials; Supabase Postgres storage encryption
- Client-side encryption optional for highly sensitive attachments before upload

### Auditing & Monitoring

- Append-only `audit_logs` table: `requestId`, `userId`, `action`, `workflow`, `nodes`, `status`, `duration`
- `error_logs` table for failures with correlation to `audit_logs`
- Alerts: Slack or email on error rate spike, latency SLO breaches, auth failures

### Compliance Posture (baseline)

- Data residency: prefer EU regions for n8n Cloud and Supabase
- Data retention: define TTL for logs and AI intermediates; periodic purge jobs
- Access control: least-privilege API keys, rotate credentials, MFA on n8n and Supabase admin

### Development Speed

- ✅ Visual workflow design — see the logic flow
- ✅ No backend coding — focus on frontend + prompts
- ✅ Rapid iteration — change AI logic without deployment
- ✅ Built-in integrations — 400+ service connectors

### AI Capabilities

- ✅ Advanced agent patterns — tools, memory, function calling
- ✅ Multi-model support — OpenAI, Anthropic, local models
- ✅ Conversation persistence — automatic memory management
- ✅ Tool orchestration — complex multi-step AI workflows

### Production Ready

- ✅ Webhook APIs — standard REST interface
- ✅ Error handling — built-in retry and fallback logic
- ✅ Monitoring — execution logs and performance tracking
- ✅ Scalability — cloud deployment options

### Family App Specific

- ✅ Crisis management — complex trigger-based workflows
- ✅ Multi-channel notifications — email, SMS, push, emergency services
- ✅ Document processing — AI analysis pipelines
- ✅ Guardian orchestration — role-based access workflows

---

## 📊 Performance Considerations

### Response Times

- Sofia chat: ~2–3 seconds (acceptable for thoughtful responses)
- Document processing: ~5–10 seconds (background processing OK)
- Crisis activation: <30 seconds (critical path optimization)

### Reliability

- Webhook redundancy (multiple endpoints)
- Fallback mechanisms (if AI service down)
- Queue processing (handle traffic spikes)
- Data persistence (Supabase backup)

### Monitoring

- n8n execution logs
- AI token usage tracking
- Response time metrics
- Error rate monitoring

---

## 🚀 Migration Path

### Current Plan Update

### Week 1–2: [Lovable.dev](http://Lovable.dev) Frontend ✅

- All UI components
- Chat interface for Sofia
- Document upload forms
- Dashboard layouts

### Week 3: n8n Sofia Agent ✅ (NEW)

- Basic conversation agent
- Memory management
- Tool integration setup
- Webhook API endpoints

### Week 4: Document Processing ✅ (NEW)

- Upload workflow
- AI analysis pipeline
- Supabase integration
- Protection score updates

### Week 5–6: Advanced Features ✅ (NEW)

- Guardian network workflows
- Crisis management system
- Emergency notifications
- Production optimization

Total: 6 weeks to production‑ready MVP (adjusted timeline for n8n agent implementation)

---

## 💡 Why This Is Actually Brilliant

### For Solo Developer

- No complex backend architecture — n8n handles orchestration
- Visual debugging — see exactly what the AI agent is doing
- Rapid prompt engineering — change Sofia's behavior instantly
- Tool ecosystem — 400+ integrations available immediately

### For Family Protection App

- Crisis workflows — perfect for emergency response automation
- Multi‑channel communication — essential for guardian notifications
- AI agent patterns — Sofia needs to USE tools, not just chat
- Complex triggers — dead man's switch, document expiry, etc.