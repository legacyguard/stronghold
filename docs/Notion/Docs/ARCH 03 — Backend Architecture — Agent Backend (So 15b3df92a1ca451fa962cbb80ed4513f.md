# ARCH 03 — Backend Architecture — Agent Backend (Sofia)

Area: Backend, Data, Infra, Product
Related Feature: UI i18n Layer (../Features%2065472ecceccf486fa4e2b758eb9d3e12/UI%20i18n%20Layer%2097b50617281d417c8a6fb7ef5b133a51.md), Domain and Language Middleware (../Features%2065472ecceccf486fa4e2b758eb9d3e12/Domain%20and%20Language%20Middleware%206533d40329844dff82ec013d7bb8d453.md)
Status: Draft
Type: Architecture

## Overview

> 🔧
>
> Auth and Framework baseline: This architecture uses Supabase Auth (JWT) for authentication and Next.js (App Router) for the frontend. All mentions of previous Clerk/Vite examples should be read as Supabase Auth and Next.js equivalents.

This document describes the backend architecture for the Family Protection Assistant using the n8n Cloud application as the orchestration and agent runtime. All descriptive text is in English. Code, JSON, and TypeScript examples remain in English for codebase consistency.

---

## 🎯 Why n8n Agent Makes Perfect Sense

### Traditional Backend Problems

- Complex conversation state management
- Tool integration overhead
- Memory handling complexity
- API orchestration logic

### n8n Agent Solutions

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

```mermaid
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

```mermaid
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
      "endpoint": "https://api.openai.com",
      "description": "Extract text from document images"
    },

### Workflow 3: Protection Score Calculator

```mermaid

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

```mermaid

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

// …inside your Supabase JWT verification node…
return {
  json: {
    userId: payload.sub,
    email: payload.email || null,
    roles: payload.role ? [payload.role] : [],
  }
};

// …inside your WebSocket setup…
const setupSofiaWebsocket = () => {
  const ws = new WebSocket('ws://n8n-instance.com/webhook/sofia/live');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
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

- Crisis workflows — perfect for emergency response automation
- Multi‑channel communication — essential for guardian notifications
- AI agent patterns — Sofia needs to USE tools, not just chat
- Complex triggers — dead man's switch, document expiry, etc.
