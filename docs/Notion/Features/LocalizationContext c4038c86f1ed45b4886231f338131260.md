# LocalizationContext

Docs: ARCH 02 — Architektúra: Multi‑domain, Multi‑jurisdiction, Multi‑language (../Docs%2025dc6e821aa8460ba3fc3a90b5d86872/ARCH%2002%20%E2%80%94%20Architekt%C3%BAra%20Multi%E2%80%91domain,%20Multi%E2%80%91jurisdi%20b203472110454b5281b7a15600210aaa.md), ADR 002 — Detekcia jurisdikcie podľa domény a jazyka (../Docs%2025dc6e821aa8460ba3fc3a90b5d86872/ADR%20002%20%E2%80%94%20Detekcia%20jurisdikcie%20pod%C4%BEa%20dom%C3%A9ny%20a%20jazy%20a59a0bffb8344edfb9415af72295f031.md), I18N 05 — Decision Record — Výber i18next pre UI preklady (../Docs%2025dc6e821aa8460ba3fc3a90b5d86872/I18N%2005%20%E2%80%94%20Decision%20Record%20%E2%80%94%20V%C3%BDber%20i18next%20pre%20UI%20p%20e82ee57865b94dd195fc14766c5f10aa.md), JUR 02 — Spec — WillGeneratorWizard: načítanie pravidiel a validácie (../Docs%2025dc6e821aa8460ba3fc3a90b5d86872/JUR%2002%20%E2%80%94%20Spec%20%E2%80%94%20WillGeneratorWizard%20na%C4%8D%C3%ADtanie%20prav%20b32f9217d6dd4d89aaaa904fdbf13fab.md)
Goal: Globálny kontext v Reacte poskytujúci currentDomain, currentJurisdiction a currentLanguage pre celú aplikáciu.
Status: Idea

## Cieľ

Poskytovať jednotný zdroj pravdy pre lokalizačné a právne kontexty v UI.

## Scope

- React Context + hook useLocalization
- Persistencia a prepinanie používateľom
- Bez biznis logiky (len stav a distribúcia)

## Akceptačné kritériá

- Komponenty neobsahujú hard‑coded texty ani jurisdikčnú logiku
- Zmena jazyka/jurisdikcie sa prejaví v UI aj validáciách bez reloadu
