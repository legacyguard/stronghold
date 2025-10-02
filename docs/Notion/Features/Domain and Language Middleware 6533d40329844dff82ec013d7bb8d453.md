# Domain and Language Middleware

Docs: ARCH 02 — Architektúra: Multi‑domain, Multi‑jurisdiction, Multi‑language (../Docs%2025dc6e821aa8460ba3fc3a90b5d86872/ARCH%2002%20%E2%80%94%20Architekt%C3%BAra%20Multi%E2%80%91domain,%20Multi%E2%80%91jurisdi%20b203472110454b5281b7a15600210aaa.md), ADR 002 — Detekcia jurisdikcie podľa domény a jazyka (../Docs%2025dc6e821aa8460ba3fc3a90b5d86872/ADR%20002%20%E2%80%94%20Detekcia%20jurisdikcie%20pod%C4%BEa%20dom%C3%A9ny%20a%20jazy%20a59a0bffb8344edfb9415af72295f031.md), I18N 03 — How‑to na Pridanie novej krajiny (../Docs%2025dc6e821aa8460ba3fc3a90b5d86872/I18N%2003%20%E2%80%94%20How%E2%80%91to%20na%20Pridanie%20novej%20krajiny%20315ea40407a14b719aa8a3e526ac477d.md)
Goal: Detegovať doménu a accept-language a naplniť LocalizationContext už pri štarte.
Status: Idea

## Cieľ

Zabezpečiť deterministické mapovanie host -> currentJurisdiction a výber default currentLanguage.

## Scope

- Middleware na edge/server vrstve
- Matica doména × jazyk prehliadača -> default language
- Bezpečné prepisovanie url parametrom alebo užívateľským prepínačom

## Akceptačné kritériá

- [legacyguard.sk](http://legacyguard.sk) => sk; [legacyguard.cz](http://legacyguard.cz) => cz
- UI defaultuje správne aj pri accept-language=en
