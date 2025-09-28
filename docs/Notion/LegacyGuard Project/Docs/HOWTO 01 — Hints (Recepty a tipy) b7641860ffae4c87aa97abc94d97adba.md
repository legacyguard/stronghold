# HOWTO 01 — Hints (Recepty a tipy)

Area: Backend, Frontend, Product
Status: Draft
Type: How-to

### Účel

Praktické recepty na zjednodušenie vývoja UI, správy stavu, formulárov a vývojového cyklu.

---

## 1) Zjednodušenie UI komponentov — adoptuj Shadcn/ui ako jediný zdroj pravdy

### Checklist migrácie na Shadcn/ui (Button, Input, Dialog, Select)

- [ ]  Nainštaluj shadcn/ui CLI a inicializuj config (tailwind, aliasy, CSS vars)
- [ ]  Button: pridaj varianty `default`, `secondary`, `destructive`, `ghost`; skontroluj `disabled`, `loading`, `icon-left/right`
- [ ]  Input: validácia stavov `error`, `success`, `disabled`; priraď ARIA a `aria-invalid` pri chybách z RHF
- [ ]  Dialog: over focus trap, `Esc` close, close button, `aria-labelledby/aria-describedby`; otestuj scroll a mobilné zobrazenie
- [ ]  Select: klávesnica, searchable variant podľa potreby, stav `disabled`, prístupnosť cez Radix props
- [ ]  Napoj jednotné tokens: farby, radius, spacing, shadows; zosúlaď s Tailadmin/Hero UI vizuálom
- [ ]  Vytvor shared `FormField` wrapper pre RHF + Shadcn (label, helper, error)
- [ ]  Pridaj Storybook stories pre stavy: default, focus, hover, disabled, error, loading
- [ ]  V CI spusti vizuálne snímky a lint na ARIA atribúty

Problém: budovanie vlastných základných komponentov (stavy, ARIA, responzivita) je drahé a nekonzistentné.

Riešenie: Shadcn/ui kopíruje hotové, prístupné komponenty (postavené na Radix UI) priamo do projektu.

Prečo pre nás:

- Nulová runtime závislosť, kód je náš a upraviteľný
- Konzistentný dizajn naprieč appkou
- Rýchlosť dodania (Button, Input, Dialog za desiatky sekúnd)

Akčné kroky:

1. Prejdi projekt a označ základné prvky: Button, Input, Select, Textarea, Card, Dialog, DropdownMenu, Tabs
2. Nainštaluj recepty zo Shadcn/ui a nahraď existujúce implementácie
3. Zaveď jednotné tokens a varianty (primary, secondary, destructive) pre Button
4. Pridaj prístupnosť: focus-visible štýly, ARIA atribúty z receptov

---

## 2) Zjednodušenie správy stavu — používaj Zustand

### Rýchly snippet: useAppStore.ts (Zustand)

```tsx
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
  activeFilters: string[];
  isSofiaOpen: boolean;
  currentUserPreferences: { language: string; theme: 'light' | 'dark' };
  // actions
  setFilters: (filters: string[]) => void;
  toggleSofia: (open?: boolean) => void;
  setPreferences: (prefs: Partial<AppState['currentUserPreferences']>) => void;
}

export const useAppStore = create<AppState>()(
  devtools((set, get) => ({
    activeFilters: [],
    isSofiaOpen: false,
    currentUserPreferences: { language: 'sk', theme: 'light' },

    setFilters: (filters) => set({ activeFilters: filters }),
    toggleSofia: (open) => set({ isSofiaOpen: open ?? !get().isSofiaOpen }),
    setPreferences: (prefs) =>
      set({ currentUserPreferences: { ...get().currentUserPreferences, ...prefs } }),
  }))
);

// Usage in component
// const isOpen = useAppStore((s) => s.isSofiaOpen);
// const toggle = useAppStore((s) => s.toggleSofia);
```

Problém: Context/Redux vedú k zbytočnej komplexite a re-renderom.

Riešenie: Jeden globálny store so selektormi, bez providerov navyše.

Prečo:

- Minimum kódu, žiadne actions/reducers
- Výkon: re-render len tam, kde sa číta stav
- Jednoduchý prístup z hociktorého komponentu

Akčné kroky:

1. Vytvor `useAppStore.ts` pre globálne stavy: `activeFilters`, `isSofiaOpen`, `currentUserPreferences`, atď.
2. Používaj selektory a `shallow` porovnanie pre výkon
3. Zložitejšie odvodené hodnoty rieš memoizáciou alebo explicitnými selektormi

---

## 3) Zjednodušenie formulárov — React Hook Form + Zod

### Rýchly snippet: RHF + Zod formulár

```tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const Schema = z.object({
  email: z.string().email(),
  age: z.coerce.number().min(18),
  agree: z.boolean().refine((v) => v, 'You must agree to continue')
});

type FormData = z.infer<typeof Schema>;

export function GuardianInviteForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: { email: '', age: 18, agree: false }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Email</label>
        <input type="email" {...register('email')} />
        {errors.email && <p role="alert">{errors.email.message}</p>}
      </div>
      <div>
        <label>Age</label>
        <input type="number" {...register('age', { valueAsNumber: true })} />
        {errors.age && <p role="alert">{errors.age.message}</p>}
      </div>
      <div>
        <label>
          <input type="checkbox" {...register('agree')} /> I agree
        </label>
        {errors.agree && <p role="alert">{errors.agree.message}</p>}
      </div>
      <button disabled={isSubmitting} type="submit">Invite</button>
    </form>
  );
}
```

Problém: Manuálna validácia, chyby a stavy sú repetitívne.

Riešenie: Centrálna šema v Zod, RHF sa postará o validáciu a stavy.

Prečo:

- Jeden zdroj pravdy pre validáciu
- Menej kódu, vyššia spoľahlivosť
- Typová bezpečnosť z generovaných typov Zod

Akčné kroky:

1. Pre všetky formuláre (napr. „Pridať strážcu“, „Upraviť dokument“) definuj Zod schému
2. Použi RHF `zodResolver` a zobrazovanie chýb priamo z šemy
3. Dopln jednotné chybové UI komponenty (FieldError) z Shadcn/ui

---

## 4) Zjednodušenie vývojového cyklu — Storybook

Problém: Testovanie komponentu naprieč appkou je pomalé a rozptyľujúce.

Riešenie: Izolovaný vývoj a vizuálna knižnica komponentov.

Prečo:

- Rýchle stavové scenáre (loading, error, 1 položka, 50 položiek)
- Živá dokumentácia UI
- Lepšia spolupráca a regresné testy vizuálu

Akčné kroky:

1. Nainštaluj Storybook a pridaj príbehy pre Button, Card, Dialog
2. Postupne pridávaj komplexné komponenty (napr. wizard kroky)
3. Zaveď interakčné testy a vizuálne snímky pre kritické komponenty

---

## Zhrnutie stratégie maximálnej jednoduchosti

## Supabase Auth + Next.js App Router — starter

Krátky základ pre Next.js (App Router) so Supabase Auth a chránenými trasami.

### Inštalácia helperov

```bash
npm i @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### env

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase klient

```tsx
// lib/supabase.ts
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
  )
  // optional: fetch user server-side
  await supabase.auth.getUser()

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### Middleware — ochrana trás

```tsx
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  const isPublic = req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up')
  if (!user && !isPublic) {
    const url = req.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- UI komponenty: nechaj Shadcn/ui robiť ťažkú prácu
- Správa stavu: nechaj Zustand držať globálne dáta
- Formuláre: nech RHF + Zod riešia validáciu a stavy
- Vývoj: izoluj komponenty v Storybooku a buduj knižnicu

### Revízia

- Last Reviewed: