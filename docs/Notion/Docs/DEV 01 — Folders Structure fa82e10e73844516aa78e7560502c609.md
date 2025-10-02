# DEV 01 — Folders Structure

Area: Backend, Frontend
Status: Draft
Type: Dev Guidelines

## Účel

Štandard pre štruktúru frontend projektu a pomenovacie konvencie.

```text
/src
├── /api                  # volania na n8n
├── /assets               # obrázky, SVG
├── /components
│   ├── /ui               # Shadcn komponenty (Button, Card, ...)
│   └── /features         # komplexné komponenty (DocumentUploader, WillGenerator, ...)
├── /contexts             # napr. LocalizationContext
├── /hooks                # napr. usePageTitle
├── /lib                  # supabase.ts, text-manager.ts, ...
├── /pages                # jednotlivé stránky aplikácie
├── /styles               # globálne CSS
└── /types                # definície typov
```

## Revízia

- Last Reviewed:
