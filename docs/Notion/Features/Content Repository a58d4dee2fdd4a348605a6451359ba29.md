# Content Repository

Docs: ARCH 02 — Architektúra: Multi‑domain, Multi‑jurisdiction, Multi‑language (../Docs%2025dc6e821aa8460ba3fc3a90b5d86872/ARCH%2002%20%E2%80%94%20Architekt%C3%BAra%20Multi%E2%80%91domain,%20Multi%E2%80%91jurisdi%20b203472110454b5281b7a15600210aaa.md), ADR 001 — Oddelenie právneho rámca od jazyka (../Docs%2025dc6e821aa8460ba3fc3a90b5d86872/ADR%20001%20%E2%80%94%20Oddelenie%20pr%C3%A1vneho%20r%C3%A1mca%20od%20jazyka%207c4612f42c0a4454956f58a8da6427b0.md), DEV 02 — Dev Guidelines — Štruktúra adresára /content (../Docs%2025dc6e821aa8460ba3fc3a90b5d86872/DEV%2002%20%E2%80%94%20Dev%20Guidelines%20%E2%80%94%20%C5%A0trukt%C3%BAra%20adres%C3%A1ra%20conte%201df9d09feee34966b02900c58caf20dc.md), I18N 03 — How‑to na Pridanie novej krajiny (../Docs%2025dc6e821aa8460ba3fc3a90b5d86872/I18N%2003%20%E2%80%94%20How%E2%80%91to%20na%20Pridanie%20novej%20krajiny%20315ea40407a14b719aa8a3e526ac477d.md)
Goal: Štruktúrovaný adresár /content s konvenciami, schémami a CI validáciou.
Status: Idea

## Cieľ

Udržiavať obsah mimo kódu s jasnými konvenciami a automatickou kontrolou kvality.

## Scope

- Štruktúra /content/jurisdictions a /content/locales
- JSON schémy, TS typy, lint a CI kontroly
- Guidelines pre templaty a verzovanie obsahu

## Akceptačné kritériá

- CI zlyhá pri nevalidných legal_rules alebo chýbajúcich prekladoch
- Dokumentované naming konvencie a príklady
