# ARCH 02 — Architektúra: Multi‑domain, Multi‑jurisdiction, Multi‑language

Area: Backend, Frontend, Infra, Routing, i18n
Related Feature: LocalizationContext (../Features%2065472ecceccf486fa4e2b758eb9d3e12/LocalizationContext%20c4038c86f1ed45b4886231f338131260.md), Jurisdiction Content Loader (../Features%2065472ecceccf486fa4e2b758eb9d3e12/Jurisdiction%20Content%20Loader%203a212da7a2dc4ce9aa7f5cc7a5c3b008.md), UI i18n Layer (../Features%2065472ecceccf486fa4e2b758eb9d3e12/UI%20i18n%20Layer%2097b50617281d417c8a6fb7ef5b133a51.md), Domain and Language Middleware (../Features%2065472ecceccf486fa4e2b758eb9d3e12/Domain%20and%20Language%20Middleware%206533d40329844dff82ec013d7bb8d453.md), WillGeneratorWizard (../Features%2065472ecceccf486fa4e2b758eb9d3e12/WillGeneratorWizard%20986fbcb2e067435780059a5ca6060585.md), Content Repository (../Features%2065472ecceccf486fa4e2b758eb9d3e12/Content%20Repository%20a58d4dee2fdd4a348605a6451359ba29.md)
Status: Draft
Type: Architecture

## Prehľad

Oddelenie obsahu od kódu, škálovateľnosť naprieč doménami, jurisdikciami a jazykmi.

## Ciele

- Jediný zdroj pravdy pre právne pravidlá a šablóny
- UI preklady oddelené od právneho obsahu
- Deterministická detekcia kontextu (doména, jazyk)

## Návrh

- LocalizationContext pre distribúciu currentDomain, currentJurisdiction, currentLanguage
- Štruktúra /content (jurisdictions, locales)
- Middleware pre mapovanie host a accept-language
- Dynamické načítavanie legal_rules, validation_rules a will_templates

## Nefunkčné požiadavky

- Výkon: lazy loading, code-splitting
- Bezpečnosť: kontrola vstupov a obsahové schémy
- Rozšíriteľnosť: jednoduché pridanie krajiny/jazyka

## Otvorené otázky

- Strategia fallbacku pri chýbajúcich prekladoch alebo šablónach
- Konvencie versioningu obsahu
