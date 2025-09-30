# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Preference

**IMPORTANT**: The user prefers to communicate in Slovak language, but all code, documentation, comments, variable names, and technical implementation must be written in English only.

## Error Handling Policy

**CRITICAL**: All errors, warnings, and technical issues MUST be immediately investigated and resolved or properly documented. Never leave unresolved errors as "technical debt":

1. **Immediate Resolution Required**: Any HTTP 500 errors, build failures, runtime exceptions, or system errors must be debugged and fixed immediately
2. **Root Cause Analysis**: Always investigate the root cause, not just symptoms
3. **Documentation**: If an error cannot be resolved quickly, create a detailed issue tracking record with:
   - Error description and reproduction steps
   - Root cause analysis attempts
   - Temporary workarounds applied
   - Next steps for resolution
4. **Cache Issues**: For Turbopack/Next.js cache corruption issues, clean cache with `rm -rf .next` and restart dev server
5. **Never Ignore**: Never dismiss errors as "minor" or "will fix later" - address them immediately or escalate to user

## Overview

**LegacyGuard Project** - Multi-jurisdiction family legacy protection platform

- **Architecture**: Monorepo with Next.js 15 (App Router) web application
- **Framework**: Next.js 15 with TypeScript, React 19
- **Build engine**: Turbopack (via `next dev --turbopack` and `next build --turbopack`)
- **Styling**: Tailwind CSS v3 with semantic design system
- **Database**: Supabase with Row Level Security (RLS)
- **Backend**: Windmill.dev for AI agent orchestration
- **AI**: Sofia AI assistant (GPT-4o) for family protection guidance
- **Internationalization**: i18next with namespace-based lazy loading
- **Package manager**: npm with workspaces
- **Linting**: ESLint with Next.js configuration

## Project Structure

```
stronghold-monorepo/
├── apps/web/                    # Main Next.js application
│   └── src/
│       ├── /api                 # Windmill API calls
│       ├── /components
│       │   ├── /ui              # Shadcn components
│       │   └── /features        # Business components
│       ├── /contexts            # LocalizationContext
│       ├── /hooks               # Custom hooks
│       ├── /lib                 # supabase.ts, utilities
│       └── /types               # TypeScript definitions
├── packages/                    # Shared packages (currently empty)
├── supabase/                    # Supabase configuration and migrations
├── scripts/                     # Utility scripts (Supabase provider configuration)
└── docs/                        # Project documentation (Notion exports)
    ├── Docs/                    # Architecture decisions (ADRs)
    ├── Features/                # Feature specifications
    ├── Tasks/                   # Development phases
    └── Prompts/                 # AI prompt templates
```

## Common Commands

### Development
```bash
# Start development server (from root)
npm run web

# Or directly in web app
cd apps/web && npm run dev
```

### Build and Production
```bash
# Build web application
npm run build:web

# Start production server
npm run start:web
```

### Linting and Type Checking
```bash
# Lint web application
npm run lint:web

# Type check (run from apps/web/)
npx tsc --noEmit
```

### Supabase Provider Configuration
```bash
# Dry run (preview changes)
npm run providers:dry-run

# Apply provider configuration
npm run providers:apply
```

## Architecture Details

### Multi-domain, Multi-jurisdiction, Multi-language Architecture

**Core Architectural Decisions (ADRs):**
- **ADR 001**: Legal framework separated from UI language (jurisdiction vs locale)
- **ADR 002**: Jurisdiction detection via domain mapping, language via accept-language header

**Content Repository Structure:**
```
/content/
├── /jurisdictions/{code}/
│   ├── will_templates/*.md
│   ├── legal_rules.json
│   └── validation_rules.ts
└── /locales/{lang}/
    └── translation.json (i18next)
```

### Web Application (`apps/web/`)
- **Entry points**: `src/app/layout.tsx`, `src/app/page.tsx`
- **Routing**: Next.js App Router with file-based routing
- **Styling**: Global styles in `src/app/globals.css` with semantic Tailwind utilities
- **Path alias**: `@/*` maps to `src/*`
- **TypeScript**: Strict mode enabled with Next.js plugin
- **Key Components**:
  - `LocalizationContext`: Global state for domain/jurisdiction/language
  - `WillGeneratorWizard`: Modular wizard without hard-coded content
  - `Sofia AI`: Multilingual personal assistant

### AI Backend Architecture (Sofia)
- **Windmill Agent Orchestration**: Single endpoint `/api/legacyguard-main`
- **Main workflows**: Sofia Chat, Document Pipeline, Guardian Coordinator, Crisis Manager
- **AI Model**: GPT-4o with family protection specialist personality
- **Security**: Supabase JWT verification, Row Level Security on all tables

### Internationalization (i18n)
- **Framework**: i18next with namespace-based lazy loading
- **Structure**: `/public/locales/{lang}/{namespace}.json`
- **Key namespaces**: common, dashboard, will_generator, family_shield
- **Language Matrix**: Tier 1 markets (SK, CS, DE) with EN, PL, UK, RU support

### Supabase Integration
- **Configuration**: Located in `supabase/` directory
- **Auth providers**: Google and Apple OAuth support via configuration script
- **Environment variables**: Provider credentials managed through `.env.providers.local`
- **Migration system**: Database migrations in `supabase/migrations/`
- **Security**: Row Level Security (RLS) enabled on all tables

### Design System
**Semantic Tailwind Configuration:**
- Colors: `primary` (#6B8E23), `primary-light`, `background`, `text-dark`, `surface`
- Spacing: `xs` (4px), `sm` (8px), `md` (16px), `lg` (24px), `xl` (32px), `2xl` (48px)
- Typography: `h1` (32px), `h2` (18px), `h3` (24px), `body` (16px), `caption` (14px)
- **Rule**: Use ONLY semantic utilities (`bg-primary`, `p-md`), NO arbitrary values

## Key Configuration Files

- `apps/web/next.config.ts` - Next.js configuration (minimal)
- `apps/web/tsconfig.json` - TypeScript configuration with path aliases
- `apps/web/eslint.config.mjs` - ESLint Flat Config
- `apps/web/postcss.config.mjs` - PostCSS with Tailwind
- `scripts/configure_supabase_providers.sh` - Supabase auth provider setup

## Core Features

### Key Application Modules
- **WillGeneratorWizard**: Modular wizard system without hard-coded content
- **LocalizationContext**: Global React context managing domain/jurisdiction/language state
- **Content Repository**: Structured storage for legal content by jurisdiction
- **Sofia AI**: Multilingual personal assistant for family protection guidance
- **Guardian Network**: Trusted contact system for crisis management
- **Crisis Management**: Dead man's switch + emergency response automation

### Development Phases
- **Phase 0 (✅ Completed)**: Prerequisites for Infra - /Users/luborfedak/Documents/Github/stronghold/docs/Notion/Tasks/Fáza\ 0\ Príprava\ Infraštruktúry\ 90241f2dd4b4496e91e950aa9935d4f5.md 
- **Phase 1 (✅ Completed)**: Supabase setup, auth, basic tables with RLS - /Users/luborfedak/Documents/Github/stronghold/docs/Notion/Tasks/Fáza\ 1\ Nastavenie\ Nervového\ Systému\ \(Backend\ a\ Aut\ 3118ebe201d64a098d421cbff6fa27f6.md 
- **Phase 2 (Planned)**: First Functional Prototype - /Users/luborfedak/Documents/Github/stronghold/docs/Notion/Tasks/Fáza\ 2\ Oživenie\ Aplikácie\ \(Prvý\ Funkčný\ Prototyp\)\ 376b8fd88e0f4da5bdd846e7fa456988.md 
- **Phase 3 (Planned)**: LangGraph + Vercel AI SDK - /Users/luborfedak/Documents/Github/stronghold/docs/Notion/Tasks/Fáza\ 3\ Inteligentný\ Mozog\ \(LangGraph\ +\ Vercel\ AI\ S\ 28885e1f3bf24e48b57c535b85bd9212.md 
- **Phase 4 (Planned)**: Workflow for Texts Actualisation - /Users/luborfedak/Documents/Github/stronghold/docs/Notion/Tasks/Fáza\ 4\ localization\ —\ Workflow\ pre\ Aktualizáciu\ Te\ 1a995308bc6a46e4a1e690d172c743c4.md 
- **Phase 5 (Planned)**: Roadmap and Tasks - /Users/luborfedak/Documents/Github/stronghold/docs/Notion/Tasks/Fáza\ 5\ Roadmap\ and\ Tasks\ \(Cestovná\ Mapa\ a\ Úlohy\)\ 8e2f5059510c42f2a5d8d406ea8075c9.md 
- **Phase 6 (Planned)**: User Support Basics - /Users/luborfedak/Documents/Github/stronghold/docs/Notion/Tasks/Fáza\ 6\ User\ Support\ Basics\ \(Základy\ Používateľskej\ 0da30672a69640fc8c149073f929be81.md 

## Development Guidelines

### Code Standards
- **Language**: All code, comments, and documentation in English only
- **Styling**: Use ONLY semantic Tailwind utilities (`bg-primary`, `p-md`)
- **TypeScript**: Strict mode enforced across the project
- **Components**: Follow existing patterns, use Shadcn/ui for base components
- **File Creation**: NEVER create files unless absolutely necessary, prefer editing existing files

### Development Workflow
- Use npm commands from root for web app operations
- Supabase project reference stored in `supabase/.temp/project-ref`
- Auth provider configuration requires environment variables for credentials
- JSON schema validation for `legal_rules`, TypeScript types for all modules
- i18next key validation, lint rules for semantic utilities

### Quality Assurance
- No test framework currently configured
- CI/CD controls for legal content validation
- TypeScript project-wide type checking required before commits