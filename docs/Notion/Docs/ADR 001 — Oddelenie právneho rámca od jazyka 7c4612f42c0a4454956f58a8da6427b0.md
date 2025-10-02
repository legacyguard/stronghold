# ADR 001 — Oddelenie právneho rámca od jazyka

Area: Product, i18n
Related Feature: Content Repository (../Features%2065472ecceccf486fa4e2b758eb9d3e12/Content%20Repository%20a58d4dee2fdd4a348605a6451359ba29.md), UI i18n Layer (../Features%2065472ecceccf486fa4e2b758eb9d3e12/UI%20i18n%20Layer%2097b50617281d417c8a6fb7ef5b133a51.md), Jurisdiction Content Loader (../Features%2065472ecceccf486fa4e2b758eb9d3e12/Jurisdiction%20Content%20Loader%203a212da7a2dc4ce9aa7f5cc7a5c3b008.md)
Status: Draft
Type: ADR

## Kontext

Právne pravidlá a UI preklady majú rozdielne tempo zmien a odlišnú zodpovednosť.

## Rozhodnutie

Oddeliť právny obsah podľa jurisdikcie (/content/jurisdictions) od jazykových prekladov (/content/locales).

## Dôsledky

- UI môže byť v EN pri zachovaní právne platných SK pravidiel
- Jednoduchšie revízie a audity právneho obsahu

## Alternatívy

- Jednotný monolitický i18n súbor — zamietnuté pre ťažkú údržbu
