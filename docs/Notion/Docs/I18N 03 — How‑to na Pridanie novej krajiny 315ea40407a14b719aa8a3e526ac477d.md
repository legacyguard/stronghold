# I18N 03 — How‑to na Pridanie novej krajiny

Area: Infra, Product, i18n
Related Feature: Content Repository (../Features%2065472ecceccf486fa4e2b758eb9d3e12/Content%20Repository%20a58d4dee2fdd4a348605a6451359ba29.md), UI i18n Layer (../Features%2065472ecceccf486fa4e2b758eb9d3e12/UI%20i18n%20Layer%2097b50617281d417c8a6fb7ef5b133a51.md), Domain and Language Middleware (../Features%2065472ecceccf486fa4e2b758eb9d3e12/Domain%20and%20Language%20Middleware%206533d40329844dff82ec013d7bb8d453.md)
Status: Draft
Type: How-to

## Cieľ

Bez zásahu do aplikačného kódu pridať novú jurisdikciu.

## Kroky

1. Pridaj doménu na Verceli ([legacyguard.at](http://legacyguard.at))
2. Vytvor /content/jurisdictions/at/ a vyplň právne šablóny a pravidlá
3. Dopln /content/locales/de/ alebo iné jazyky podľa potreby
4. Otestuj flows (UI jazyk × právna jurisdikcia)

## Kontrola

- Prejde CI validácia schém
- E2E test s preklopeným jazykom
