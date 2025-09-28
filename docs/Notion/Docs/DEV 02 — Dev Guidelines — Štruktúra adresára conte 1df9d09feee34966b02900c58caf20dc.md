# DEV 02 — Dev Guidelines — Štruktúra adresára /content

Area: Backend, i18n
Related Feature: Content Repository (../Features%2065472ecceccf486fa4e2b758eb9d3e12/Content%20Repository%20a58d4dee2fdd4a348605a6451359ba29.md), Jurisdiction Content Loader (../Features%2065472ecceccf486fa4e2b758eb9d3e12/Jurisdiction%20Content%20Loader%203a212da7a2dc4ce9aa7f5cc7a5c3b008.md)
Status: Draft
Type: Dev Guidelines

### Cieľ

Definovať konvencie pre /content tak, aby boli konzistentné a validovateľné.

### Konvencie

- /jurisdictions/{code}/will_templates/*.md
- /jurisdictions/{code}/legal_rules.json (schéma JSON)
- /jurisdictions/{code}/validation_rules.ts (exportované funkcie)
- /locales/{lang}/translation.json (i18next)

### Kvalita

- JSON schéma + CI validácia
- TS typy pre importované moduly

### Príklady

- SK a CZ ako referenčné implementácie