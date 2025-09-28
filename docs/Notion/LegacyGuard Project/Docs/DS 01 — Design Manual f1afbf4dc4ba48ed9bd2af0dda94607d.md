# DS 01 — Design Manual

Area: Frontend, Product
Status: Final
Type: Design System

### 1. Základná koncepcia

**Vízia:** Bezpečná platforma pre správu a zdieľanie dôležitých informácií s blízkymi.

**Dizajnová filozofia:**

- Minimalistický dizajn
- Prírodno-inšpirovaná paleta (rast, bezpečnosť, dedičstvo)
- Intuitívne UI s dôrazom na dostupnosť
- Dôveryhodný vzhľad

## 2. Farebná paleta

### Primárne farby

- **Hlavná zelená:** `#6B8E23`
- **Sekundárna zelená:** `#8FBC8F`
- **Svetlá zelená:** `#F0F8E8`

### Neutrálne farby

- **Tmavohnedá:** `#5D4037`
- **Svetlohnedá:** `#A1887F`
- **Béžová:** `#EFEBE9`

### Systémové farby

- **Čierny text:** `#2E2E2E`
- **Sivý text:** `#666666`
- **Svetlosivá:** `#F5F5F5`
- **Biela:** `#FFFFFF`

## 3. Typografia

### Font Stack

css

`font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;`

### Veľkosti a váhy

- **H1:** 32px, Semi-bold (600)
- **H2:** 18px, Regular (400)
- **H3:** 24px, Semi-bold (600)
- **Body:** 16px, Regular (400)
- **Caption:** 14px, Regular (400)
- **Navigation:** 12px, Medium (500)

## 4. Ikonografia

### Štýl ikon

- **Typ:** Filled/Solid s oblými rohmi
- **Veľkosť:** 24px (štandard), 32px (hlavné)
- **Farba:** Primárne farby palety
- **Štýl:** Minimalistické, jasné

### Hlavné ikony

- **My Vault:** 🔒 Zámok
- **Contacts:** 👤 Profil
- **Wishes:** ✅ Checklist
- **Home:** 🏠 Dom
- **Documents:** 📄 Dokument
- **Profile:** 👤 Profil

## 5. Layout a Grid systém

### Container

- **Max-width:** 1200px (desktop)
- **Padding:** 20px (mobile), 40px (tablet/desktop)
- **Centrované zarovnanie**

### Grid systém

- **Mobile:** 1 stĺpec
- **Tablet:** 2 stĺpce
- **Desktop:** 3 stĺpce

### Spacing

- **XS:** 4px
- **S:** 8px
- **M:** 16px
- **L:** 24px
- **XL:** 32px
- **XXL:** 48px

## 6. Komponenty

### Header

css

`.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #FFFFFF;
  border-bottom: 1px solid #F5F5F5;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: #2E2E2E;
}`

### Feature Cards

css

`.feature-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  margin-bottom: 24px;
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #F5F5F5;
  transition: all 0.2s ease;
}

.feature-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vault-icon { background: #6B8E23; color: white; }
.contacts-icon { background: #A1887F; color: white; }
.wishes-icon { background: #8FBC8F; color: white; }`

### Navigation

css

`.bottom-navigation {
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  background: #FFFFFF;
  border-top: 1px solid #F5F5F5;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  text-decoration: none;
  color: #666666;
  font-size: 12px;
  transition: color 0.2s ease;
}

.nav-item.active,
.nav-item:hover {
  color: #6B8E23;
}`

## 7. Hero sekcia

### Layout

css

`.hero-section {
  text-align: center;
  padding: 48px 20px;
  background: linear-gradient(135deg, #F0F8E8 0%, #EFEBE9 100%);
}

.hero-title {
  font-size: 32px;
  font-weight: 600;
  color: #2E2E2E;
  margin-bottom: 16px;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 18px;
  color: #666666;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.5;
}`

## 8. Responzívnosť

### Breakpoints

- **Mobile:** 0px-767px
- **Tablet:** 768px-1023px
- **Desktop:** 1024px+

### Mobile optimalizácia

- Plnoširokové karty
- Väčšie touch targets (min 44px)
- Zjednodušená navigácia
- Optimalizované font veľkosti

## 9. Stavy komponentov

### Hover efekty

- Jemný shadow a posun nahor
- Zmena farby pre interaktívne elementy
- Plynulé transitions (0.2s)

### Focus stavy

- Outline v primárnej farbe
- Zachovanie accessibility

### Loading stavy

- Skeleton screens
- Progress indikátory

## 10. Accessibility

### Minimum požiadavky

- WCAG 2.1 AA compliance
- Kontrast ratio min 4.5:1
- Keyboard navigation support
- Screen reader friendly labels
- Alt text pre ikony

### Implementácia

css

`<i>/* Focus viditeľnosť */</i>
.focusable:focus {
  outline: 2px solid #6B8E23;
  outline-offset: 2px;
}

<i>/* Responsive text scaling */</i>
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}`

## 11. Mikro-interakcie

### Animácie

- Plynulé transitions pre hover
- Fade-in efekty
- Jemné bounce pre CTA

### Timing funkcie

- `ease-out` pre exit
- `ease-in-out` pre hover
- Max 300ms

## 12. Brand Guidelines

### Logo použitie

- Min clear space: 16px
- Nedeformovať
- Len schválené verzie

### Tone of Voice

- Profesionálny ale prístupný
- Empatický a dôveryhodný
- Jasný jazyk
- Bez technického žargónu