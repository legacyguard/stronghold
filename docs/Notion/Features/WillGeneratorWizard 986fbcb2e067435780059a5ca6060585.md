# WillGeneratorWizard

Docs: ARCH 02 — Architektúra: Multi‑domain, Multi‑jurisdiction, Multi‑language (../Docs%2025dc6e821aa8460ba3fc3a90b5d86872/ARCH%2002%20%E2%80%94%20Architekt%C3%BAra%20Multi%E2%80%91domain,%20Multi%E2%80%91jurisdi%20b203472110454b5281b7a15600210aaa.md), JUR 02 — Spec — WillGeneratorWizard: načítanie pravidiel a validácie (../Docs%2025dc6e821aa8460ba3fc3a90b5d86872/JUR%2002%20%E2%80%94%20Spec%20%E2%80%94%20WillGeneratorWizard%20na%C4%8D%C3%ADtanie%20prav%20b32f9217d6dd4d89aaaa904fdbf13fab.md)
Goal: “Hlúpy” sprievodca, ktorý berie texty z i18n a logiku z Content Loaderu.
Status: Idea

## Cieľ

Zostaviť modulárny wizard bez pevne zakódovaných textov a právnej logiky.

## Scope

- Prepojenie s useLocalization a useTranslation
- Vstupy, kroky, stav a validácie cez injekciu
- Chybové stavy a accessibility

## Akceptačné kritériá

- Funkčný základný tok pre SK a CZ
- Validácie sa volajú z dynamicky načítanej funkcie
