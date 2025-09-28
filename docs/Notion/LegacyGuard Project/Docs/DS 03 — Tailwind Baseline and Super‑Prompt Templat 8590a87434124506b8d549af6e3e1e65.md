# DS 03 — Tailwind Baseline and Super‑Prompt Template

Area: Frontend, Product
Status: Draft
Type: Design System

### Krok 1: Základný kameň dizajnu v tailwind.config.ts

Tvoj tailwind.config.ts je jediný zdroj pravdy pre vizuálne prvky. Definuj farby, typografiu, spacing a radius skôr, než začneš generovať UI.

```tsx
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // === KROK 1: FARBY ===
      colors: {
        primary: '#6B8E23',        // Hlavná zelená
        'primary-light': '#8FBC8F', // Sekundárna zelená
        background: '#F0F8E8',     // Svetlá zelená na pozadie
        'text-dark': '#2E2E2E',     // Čierny text
        'text-light': '#666666',    // Sivý text
        'neutral-dark': '#5D4037',  // Tmavohnedá
        'neutral-light': '#A1887F', // Svetlohnedá
        surface: '#FFFFFF',        // Biela na karty
        border: '#F5F5F5',         // Svetlosivá na okraje
      },
      // === KROK 2: PÍSMO ===
      fontFamily: {
        // napr. sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        h1: '32px',
        h2: '18px',
        h3: '24px',
        body: '16px',
        caption: '14px',
        nav: '12px',
      },
      // === KROK 3: SPACING A RADIUS ===
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
      },
      borderRadius: {
        DEFAULT: '12px', // Predvolený radius pre všetky prvky
      },
    },
  },
  plugins: [],
}
export default config
```

---

### Krok 2: Super‑Prompt šablóna (pre Lovable a AI generovanie komponentov)

Používaj túto hlavičku pre každý prompt, aby AI striktne dodržiavala tvoj systém.

```
Design System & Context: You are building components for a premium, secure application called "LegacyGuard". The design must be clean, minimalist, and trustworthy. Adhere strictly to the following Tailwind CSS configuration. Do NOT use arbitrary values like `bg-[#123456]` or `p-3`.

Tailwind Configuration:
- Colors: Use semantic names only: `bg-primary`, `text-text-dark`, `border-border`, `bg-surface`.
  - primary: #6B8E23 (Olive Green)
  - primary-light: #8FBC8F (Dark Sea Green)
  - background: #F0F8E8 (Light Green Background)
  - text-dark: #2E2E2E
  - text-light: #666666
  - surface: #FFFFFF
  - border: #F5F5F5
- Spacing: Use semantic spacing: `p-md`, `gap-lg`, `m-xl`.
  - xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px
- Borders: Use `rounded-lg` for all rounded corners (12px).
- Fonts: Use semantic font sizes: `text-h1`, `text-body`.
- Icons: Use icons from the `lucide-react` library.

---
My Request: [Describe the exact component you need]
```

---

### Krok 3: Použitie v praxi — príklad promptu

```
Design System & Context: ... (full header above) ...
---
My Request: Create a React component for a feature card. It should be a `div` with a white background (`bg-surface`) and a subtle border (`border-border`). It should have medium padding (`p-md`) and large rounded corners (`rounded-lg`). Inside the card, create a flex container with a medium gap (`gap-md`). The first item is a circular icon using `lucide-react` (ShieldCheck). The second item is a vertical flex container for text with: (1) h3 heading `text-text-dark` `text-h3`: "Family Shield"; (2) paragraph `text-text-light` `text-body`: "Proactively protect your family with emergency plans and trusted guardians."
```

---

### Prečo tento postup funguje

### Getting started — shadcn/ui + lucide-react

### Reference component — FeatureCard (per Super‑Prompt)

```tsx
import { ShieldCheck } from 'lucide-react';

type FeatureCardProps = {
  title: string;
  description: string;
};

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="bg-surface border border-border p-md rounded-lg">
      <div className="flex items-start gap-md">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="text-primary" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-xs">
          <h3 className="text-text-dark text-h3 font-medium">{title}</h3>
          <p className="text-text-light text-body">{description}</p>
        </div>
      </div>
    </div>
  );
}

// Usage example
// <FeatureCard
//   title="Family Shield"
//   description="Proactively protect your family with emergency plans and trusted guardians."
// />
```

```bash
# Install shadcn/ui CLI
npx shadcn-ui@latest init

# Add core components (example)
npx shadcn-ui@latest add button input card dialog select

# Install icon library
npm i lucide-react

# Verify Tailwind setup (tailwind.config.ts, globals.css) and restart dev server
```

### Related

- [HOWTO 01 — Hints (Recepty a tipy)](HOWTO%2001%20%E2%80%94%20Hints%20(Recepty%20a%20tipy)%20b7641860ffae4c87aa97abc94d97adba.md)
- Eliminuje potrebu „pamäte“ AI: vždy dáváš presný, opakovateľný kontext
- Vynucuje konzistentnosť: zákaz magických hodnôt, len sémantické utility
- Buduje Design System: jedna zmena v tailwind.config.ts sa propaguje všade
- Udržuje kód čistý: sémantické názvy sú čitateľnejšie než náhodné čísla