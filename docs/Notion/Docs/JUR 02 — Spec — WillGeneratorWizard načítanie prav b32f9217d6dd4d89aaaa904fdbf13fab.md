# JUR 02 — Spec — WillGeneratorWizard: načítanie pravidiel a validácie

Area: Frontend, i18n
Related Feature: WillGeneratorWizard (../Features%2065472ecceccf486fa4e2b758eb9d3e12/WillGeneratorWizard%20986fbcb2e067435780059a5ca6060585.md), Jurisdiction Content Loader (../Features%2065472ecceccf486fa4e2b758eb9d3e12/Jurisdiction%20Content%20Loader%203a212da7a2dc4ce9aa7f5cc7a5c3b008.md), UI i18n Layer (../Features%2065472ecceccf486fa4e2b758eb9d3e12/UI%20i18n%20Layer%2097b50617281d417c8a6fb7ef5b133a51.md)
Status: Draft
Type: Spec

### Účel

Špecifikácia kontraktov, stavov a interakcií WillGeneratorWizard bez pevne zakódovaných textov.

### API

- legal_rules.json: štruktúra a povinné polia
- validation_rules.ts: signatúry validačných funkcií
- i18n kľúče a namespaces

### Stavy

- Načítavanie, chyba, pripravené
- Validácia vstupov s okamžitou odozvou

### Telemetria

- Metriky úspešnosti krokov a chýb