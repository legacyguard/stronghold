# LegacyGuard Production Deployment Guide

## Prerequisites

1. **Vercel Account**: Ensure you have a Vercel account and CLI installed
2. **Environment Variables**: Prepare all required environment variables
3. **Supabase Project**: Production Supabase project with proper configuration

## Deployment Steps

### 1. Vercel CLI Setup

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login
```

### 2. Project Configuration

The project is already configured with:

- `vercel.json` - Deployment configuration
- `.vercelignore` - Files to exclude from deployment
- `.env.example` - Template for environment variables

### 3. Environment Variables Setup

In Vercel dashboard or CLI, set these environment variables:

**Supabase Configuration:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**AI Services:**

- `OPENAI_API_KEY`
- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_CLOUD_PRIVATE_KEY`
- `GOOGLE_CLOUD_CLIENT_EMAIL`

**LangChain/LangSmith:**

- `LANGCHAIN_TRACING_V2=true`
- `LANGCHAIN_API_KEY`
- `LANGCHAIN_PROJECT=stronghold-production`

**Next.js:**

- `NEXT_TELEMETRY_DISABLED=1`

### 4. Deployment Commands

```bash
# Deploy to production
vercel --prod

# Or for development/preview
vercel
```

### 5. Post-Deployment Verification

1. Check that all API endpoints are working
2. Verify Supabase connectivity
3. Test AI services integration
4. Confirm environment variables are loaded correctly

## Monorepo Structure

The project uses a monorepo structure with the main app in `apps/web/`. Vercel is configured to:

- Build command: `npm run build:web`
- Install command: `npm install`
- Framework: Next.js
- Output directory: `apps/web/.next`

## Features Included in Production

- **Phase 3 Part A**: AI Document Analysis
- **Phase 3 Part B**: Emotional Core (Time Capsules, Legacy Garden)
- **Phase 3 Part C**: Premium Features (Sofia AI, Will Generator)
- Cost monitoring and optimization
- A/B testing infrastructure
- Multi-language support (i18n)
- Progressive Web App capabilities

## Monitoring

- LangSmith integration for AI monitoring
- Cost tracking for AI services
- Error tracking and logging
