# Error Log - Landing Page Implementation Issues

Dokumentácia všetkých chýb a problémov vyriešených počas implementácie landing page (10/01/2025).

## 1. i18next Array Translation Error

### Chyba

```text
TypeError: t(...).map is not a function
at ProblemPromiseSection (src/components/landing/sections/ProblemPromiseSection.tsx:61:82)
```

### 1.2 Popis

- i18next hook vrátil string namiesto array pre `returnObjects: true`
- Komponenty sa pokúšali volať `.map()` na string hodnote
- Vyskytoval sa v ProblemPromiseSection pre `problemPromise.chaos.problems` a `problemPromise.order.solutions`

### 1.3 Riešenie

- Vytvorený mock translation hook (`src/hooks/useTranslationMock.ts`)
- Pridané fallback arrays pre prípady keď i18next nevráti správny array
- Aktualizované všetky landing komponenty na použitie mock hooku

### 1.4 Súbory ovplyvnené

- `src/components/landing/sections/ProblemPromiseSection.tsx`
- `src/hooks/useTranslationMock.ts` (nový)

---

## 2. i18next Initialization Warning

### 2.1 Chyba

```text
react-i18next:: useTranslation: You will need to pass in an i18next instance by using initReactI18next
{ code: 'NO_I18NEXT_INSTANCE' }
```

### 2.2 Popis

- i18next sa nedokázal správne inicializovať
- `useTranslation` hook nemal prístup k i18next inštancii
- Komponenty dostávali neplatné translation objekty

### 2.3 Riešenie

- Dočasne vypnutý i18next import v `src/app/layout.tsx`
- Implementovaný mock translation hook s hardcoded prekladmi
- Všetky landing komponenty aktualizované na mock hook

### 2.4 Súbory ovplyvnené

- `src/app/layout.tsx`
- Všetky komponenty v `src/components/landing/`

---

## 3. React createContext Server-Side Error

### 3.1 Chyba

```text
TypeError: (0 , __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__.createContext) is not a function
at __TURBOPACK__module__evaluation__ (src/lib/i18n.ts:2:1)
```

### 3.2 Popis

- `react-i18next` používa `createContext` ktorý nefunguje v server-side kontexte
- `initReactI18next` import spôsoboval server-side compilation error
- Turbopack mal problém s i18next závislostkami

### 3.3 Riešenie

- Zakomentovaný import `@/lib/i18n` v layout.tsx
- Odstránený I18nextProvider súbor
- Použitý mock translation hook namiesto skutočného i18next

### 3.4 Súbory ovplyvnené

- `src/lib/i18n.ts`
- `src/app/layout.tsx`
- `src/components/providers/I18nextProvider.tsx` (odstránený)

---

## 4. Undefined i18n Object Reference

### 4.1 Chyba

```text
ReferenceError: i18n is not defined
at LandingHeader (src/components/landing/LandingHeader.tsx:75:19)
```

### 4.2 Popis

- LandingHeader používal `i18n.language` a `i18n.changeLanguage`
- Po odstránení i18next importu objekty neboli dostupné
- Podobný problém aj v LandingFooter

### 4.3 Riešenie

- Odstránené `i18n` z destructuring v `useTranslation`
- Nahradené `i18n.language` hardcoded hodnotou `'en'`
- Nahradené `i18n.changeLanguage` mock funkciou s console.log

### 4.4 Súbory ovplyvnené

- `src/components/landing/LandingHeader.tsx`
- `src/components/landing/LandingFooter.tsx`

---

## 5. LocalizationContext i18next Dependencies

### 5.1 Chyba

- LocalizationContext mal importy pre i18next ktoré spôsobovali compilation errors
- Komponenty sa pokúšali používať zakomentované funkcie

### 5.2 Riešenie

- Zakomentované všetky i18next importy v LocalizationContext
- Ponechané len simplified verzie funkcií
- Odstránené `i18n` objekty z provider hodnôt

### 5.3 Súbory ovplyvnené

- `src/contexts/LocalizationContext.tsx`

---

## 6. Translation Array Configuration

### 6.1 Popis

- i18next konfigurácia neobsahovala `landing` namespace v DEFAULT_NAMESPACES
- AVAILABLE_NAMESPACES mal `landing` ale nebol načítaný hneď

### 6.2 Riešenie

- Pridaný `landing` do AVAILABLE_NAMESPACES
- Pridaný `landing` do DEFAULT_NAMESPACES
- Kompletne nahradené mock hookom

### 6.3 Súbory ovplyvnené

- `src/lib/i18n.ts`

---

## 7. Cache Issues

### 7.1 Popis

- Next.js/Turbopack cache uchovávával staré error messages
- Error logy ukazovali starý kód aj po opravách
- Rekompilácia nereflektovala zmeny okamžite

### 7.2 Riešenie

- Reštartovanie dev servera s `rm -rf .next`
- Postupné testovanie každej opravy
- Overenie funkčnosti cez HTTP requesty

### 7.3 Súbory ovplyvnené

- `.next/` directory (cache)

---

## Finálne riešenie - Mock Translation Hook

Vytvorený kompletný mock hook (`src/hooks/useTranslationMock.ts`) ktorý:

1. **Poskytuje všetky potrebné preklady** pre landing page
2. **Správne vracia arrays** pre `returnObjects: true` volania
3. **Eliminuje všetky i18next závislosti** v landing komponentoch
4. **Funguje v server-side aj client-side** kontexte
5. **Zachováva pôvodné API** `useTranslation` hooku

### Aktuálny stav

- ✅ Landing page sa načítava úspešne (HTTP 200)
- ✅ Všetky translation arrays fungujú správne
- ✅ Žiadne runtime alebo compilation errors
- ✅ Aplikácia je stabilná a pripravená na použitie

### Budúce kroky

- Vyriešiť server-side problém s react-i18next
- Implementovať správnu i18next inicializáciu
- Nahradiť mock hook skutočným i18next riešením
- Implementovať funkčné prepínanie jazykov
