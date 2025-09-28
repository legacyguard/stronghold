# Jurisdiction Content Loader

Docs: ARCH 02 — Architektúra: Multi‑domain, Multi‑jurisdiction, Multi‑language (../Docs%2025dc6e821aa8460ba3fc3a90b5d86872/ARCH%2002%20%E2%80%94%20Architekt%C3%BAra%20Multi%E2%80%91domain,%20Multi%E2%80%91jurisdi%20b203472110454b5281b7a15600210aaa.md), ADR 001 — Oddelenie právneho rámca od jazyka (../Docs%2025dc6e821aa8460ba3fc3a90b5d86872/ADR%20001%20%E2%80%94%20Oddelenie%20pr%C3%A1vneho%20r%C3%A1mca%20od%20jazyka%207c4612f42c0a4454956f58a8da6427b0.md), DEV 02 — Dev Guidelines — Štruktúra adresára /content (../Docs%2025dc6e821aa8460ba3fc3a90b5d86872/DEV%2002%20%E2%80%94%20Dev%20Guidelines%20%E2%80%94%20%C5%A0trukt%C3%BAra%20adres%C3%A1ra%20conte%201df9d09feee34966b02900c58caf20dc.md), JUR 02 — Spec — WillGeneratorWizard: načítanie pravidiel a validácie (../Docs%2025dc6e821aa8460ba3fc3a90b5d86872/JUR%2002%20%E2%80%94%20Spec%20%E2%80%94%20WillGeneratorWizard%20na%C4%8D%C3%ADtanie%20prav%20b32f9217d6dd4d89aaaa904fdbf13fab.md)
Goal: Dynamicky načítať legal_rules, validation_rules a will_templates podľa currentJurisdiction.
Status: Idea

### Cieľ

Oddeliť a lazy‑loadovať právne dáta a validačné funkcie podľa jurisdikcie.

### Scope

- Import z /content/jurisdictions/{code}/...
- Typové kontrakty pre legal_rules a validation_rules
- Fallback a error handling

### Akceptačné kritériá

- Úspešné načítanie pre SK a CZ
- Typová bezpečnosť v TS pre načítané moduly