# ADR 002 — Detekcia jurisdikcie podľa domény a jazyka

Area: Infra, Routing
Related Feature: Domain and Language Middleware (../Features%2065472ecceccf486fa4e2b758eb9d3e12/Domain%20and%20Language%20Middleware%206533d40329844dff82ec013d7bb8d453.md), LocalizationContext (../Features%2065472ecceccf486fa4e2b758eb9d3e12/LocalizationContext%20c4038c86f1ed45b4886231f338131260.md)
Status: Draft
Type: ADR

## Kontext

Potrebujeme spoľahlivo odvodiť currentJurisdiction a vhodný default currentLanguage.

## Rozhodnutie

Použiť host (doménu) ako primárny signál pre jurisdikciu a accept-language pre výber default jazyka.

## Dôsledky

- Predvídateľnosť správania
- Možnosť manuálneho prepnutia používateľom

## Riziká

- Netypické proxy a multi-tenant scenáre — mitigovať explicitnými pravidlami
