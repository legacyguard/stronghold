# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

- Framework: Next.js 15 (App Router) with TypeScript
- Dev/build engine: Turbopack (via `next dev --turbopack` and `next build --turbopack`)
- Styling: Tailwind CSS v4 via PostCSS plugin (`@tailwindcss/postcss`); no Tailwind config file required
- Linting: ESLint Flat Config with `next/core-web-vitals` and `next/typescript`
- Package manager: npm (lockfile present)

Important references:
- Root Next config: `next.config.ts` (currently minimal)
- TypeScript config with strict mode and alias: `tsconfig.json` (alias `@/*` -> `src/*`)
- ESLint config: `eslint.config.mjs` (Flat Config, ignores: `node_modules`, `.next`, `out`, `build`, `next-env.d.ts`)
- PostCSS/Tailwind: `postcss.config.mjs`
- App entry points: `src/app/layout.tsx`, `src/app/page.tsx`, global styles in `src/app/globals.css`

README highlights: run the dev server and edit `src/app/page.tsx`; app served at http://localhost:3000.

## Common commands

Installation

```bash
# install deps (use CI-friendly clean install when possible)
npm ci  # or: npm install
```

Development

```bash
# start dev server with Turbopack
npm run dev
```

Build and run

```bash
# build with Turbopack
npm run build

# start the production server
npm start
```

Linting

```bash
# lint the entire repo (explicit path recommended with ESLint Flat Config)
npm run lint -- .

# lint a single file
npm run lint -- src/app/page.tsx
```

Type checking

```bash
# run a TypeScript project-wide type check without emitting JS
npx tsc -p tsconfig.json --noEmit
```

Testing

```text
No test framework is configured in this repository (no jest/vitest/playwright/cypress configs and no test scripts in package.json).
```

## High-level architecture

This is a single Next.js App Router application organized under `src/app`.

- Routing and layouts
  - `src/app/layout.tsx` defines the root layout, metadata, and integrates Google fonts via `next/font` (Geist, Geist_Mono).
  - `src/app/page.tsx` is the root route component (home page).
  - Additional routes can be added by creating directories with `page.tsx` under `src/app/<route>`.

- Styling and design tokens
  - Tailwind CSS v4 is enabled via PostCSS: `@tailwindcss/postcss` in `postcss.config.mjs`.
  - Global styles live in `src/app/globals.css`, which imports Tailwind and defines CSS variables and an inline theme.
  - There is no `tailwind.config.*` file because Tailwind v4 can operate configuration-free for common cases.

- TypeScript and module resolution
  - Strict TypeScript config with `noEmit` (build uses Next’s compiler/bundler).
  - Path alias `@/*` -> `src/*` is defined in `tsconfig.json`.

- Linting
  - ESLint Flat Config via `eslint.config.mjs` extends `next/core-web-vitals` and `next/typescript`.
  - Ignores: `node_modules`, `.next`, `out`, `build`, `next-env.d.ts`.

- Next.js configuration
  - `next.config.ts` currently exports a minimal `NextConfig` object; extend here for custom behavior (images, headers, redirects, etc.).

## Notes for agents

- Use npm commands (lockfile is `package-lock.json`).
- When linting, pass an explicit path (e.g., `.` or specific files) to avoid ESLint Flat Config path resolution issues.
- There are no repository-specific AI assistant rules (no CLAUDE/Cursor/Copilot instruction files present).