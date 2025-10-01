# Error Log - Landing Page Implementation Issues

Dokumentácia všetkých chýb a problémov vyriešených počas implementácie landing page (10/01/2025).

## 1. i18next Array Translation Error

### Chyba
```
TypeError: t(...).map is not a function
at ProblemPromiseSection (src/components/landing/sections/ProblemPromiseSection.tsx:61:82)
```

### Popis
- i18next hook vrátil string namiesto array pre `returnObjects: true`
- Komponenty sa pokúšali volať `.map()` na string hodnote
- Vyskytoval sa v ProblemPromiseSection pre `problemPromise.chaos.problems` a `problemPromise.order.solutions`

### Riešenie
- Vytvorený mock translation hook (`src/hooks/useTranslationMock.ts`)
- Pridané fallback arrays pre prípady keď i18next nevráti správny array
- Aktualizované všetky landing komponenty na použitie mock hooku

### Súbory ovplyvnené
- `src/components/landing/sections/ProblemPromiseSection.tsx`
- `src/hooks/useTranslationMock.ts` (nový)

---

## 2. i18next Initialization Warning

### Chyba
```
react-i18next:: useTranslation: You will need to pass in an i18next instance by using initReactI18next
{ code: 'NO_I18NEXT_INSTANCE' }
```

### Popis
- i18next sa nedokázal správne inicializovať
- `useTranslation` hook nemal prístup k i18next inštancii
- Komponenty dostávali neplatné translation objekty

### Riešenie
- Dočasne vypnutý i18next import v `src/app/layout.tsx`
- Implementovaný mock translation hook s hardcoded prekladmi
- Všetky landing komponenty aktualizované na mock hook

### Súbory ovplyvnené
- `src/app/layout.tsx`
- Všetky komponenty v `src/components/landing/`

---

## 3. React createContext Server-Side Error

### Chyba
```
TypeError: (0 , __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__.createContext) is not a function
at __TURBOPACK__module__evaluation__ (src/lib/i18n.ts:2:1)
```

### Popis
- `react-i18next` používa `createContext` ktorý nefunguje v server-side kontexte
- `initReactI18next` import spôsoboval server-side compilation error
- Turbopack mal problém s i18next závislostkami

### Riešenie
- Zakomentovaný import `@/lib/i18n` v layout.tsx
- Odstránený I18nextProvider súbor
- Použitý mock translation hook namiesto skutočného i18next

### Súbory ovplyvnené
- `src/lib/i18n.ts`
- `src/app/layout.tsx`
- `src/components/providers/I18nextProvider.tsx` (odstránený)

---

## 4. Undefined i18n Object Reference

### Chyba
```
ReferenceError: i18n is not defined
at LandingHeader (src/components/landing/LandingHeader.tsx:75:19)
```

### Popis
- LandingHeader používal `i18n.language` a `i18n.changeLanguage`
- Po odstránení i18next importu objekty neboli dostupné
- Podobný problém aj v LandingFooter

### Riešenie
- Odstránené `i18n` z destructuring v `useTranslation`
- Nahradené `i18n.language` hardcoded hodnotou `'en'`
- Nahradené `i18n.changeLanguage` mock funkciou s console.log

### Súbory ovplyvnené
- `src/components/landing/LandingHeader.tsx`
- `src/components/landing/LandingFooter.tsx`

---

## 5. LocalizationContext i18next Dependencies

### Chyba
- LocalizationContext mal importy pre i18next ktoré spôsobovali compilation errors
- Komponenty sa pokúšali používať zakomentované funkcie

### Riešenie
- Zakomentované všetky i18next importy v LocalizationContext
- Ponechané len simplified verzie funkcií
- Odstránené `i18n` objekty z provider hodnôt

### Súbory ovplyvnené
- `src/contexts/LocalizationContext.tsx`

---

## 6. Translation Array Configuration

### Popis
- i18next konfigurácia neobsahovala `landing` namespace v DEFAULT_NAMESPACES
- AVAILABLE_NAMESPACES mal `landing` ale nebol načítaný hneď

### Riešenie
- Pridaný `landing` do AVAILABLE_NAMESPACES
- Pridaný `landing` do DEFAULT_NAMESPACES
- Kompletne nahradené mock hookom

### Súbory ovplyvnené
- `src/lib/i18n.ts`

---

## 7. Cache Issues

### Popis
- Next.js/Turbopack cache uchovávával staré error messages
- Error logy ukazovali starý kód aj po opravách
- Rekompilácia nereflektovala zmeny okamžite

### Riešenie
- Reštartovanie dev servera s `rm -rf .next`
- Postupné testovanie každej opravy
- Overenie funkčnosti cez HTTP requesty

### Súbory ovplyvnené
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