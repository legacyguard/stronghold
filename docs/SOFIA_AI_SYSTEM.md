# Sofia AI - Guided Dialog System

## 🎯 **Strategický prehľad**

Sofia AI prešla z jednoduchého chatbota na **inteligentný "Vedený Dialóg" systém**, ktorý minimalizuje náklady a maximalizuje užitočnosť pomocou:

- **80% FREE interakcií** (preddefinované akcie)
- **15% LOW COST interakcií** (znalostná báza + jednoduché AI)  
- **5% PREMIUM interakcií** (kreatívne AI generovanie)

---

## 📋 **Architektura systému**

### **Core Components**

```
┌─────────────────────────────────────────────────────┐
│                 SofiaChatV2                         │
│           (Hlavné používateľské rozhranie)          │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────┼───────────────────────────────────┐
│                 │        Sofia Router               │
│                 │     (Mozog systému)               │
│                 │                                   │
├─────────────────┼───────────────────────────────────┤
│  FREE (80%)     │  LOW COST (15%)    │ PREMIUM (5%) │
│                 │                    │              │
│ • Navigation    │ • Knowledge Base   │ • AI Letters │
│ • UI Actions    │ • Simple AI Query  │ • Summaries  │
│ • Quick Replies │ • FAQ Responses    │ • Creative   │
└─────────────────┴────────────────────┴──────────────┘
```

### **Súbory a zodpovědnosti**

| Súbor | Účel | Typ |
|-------|------|-----|
| `sofia-types.ts` | TypeScript definície a interfaces | Core |
| `sofia-router.ts` | Hlavná rozhodovacia logika | Core |
| `sofia-knowledge-base.ts` | FAQ a predpísané odpovede | Data |
| `sofia-api.ts` | OpenAI komunikácia | API |
| `SofiaChatV2.tsx` | Používateľské rozhranie | UI |
| `SofiaActionButtons.tsx` | Akčné tlačidlá | UI |
| `sofiaStore.ts` | State management | Store |

---

## 🚀 **Ako systém funguje**

### **1. Používateľ klikne na Sofia button**

```typescript
// Automaticky sa inicializuje s kontextovými akciami
initializeGuidedDialog() {
  const welcomeCommand = {
    command: 'show_sofia',
    category: 'ui_action',
    context: userContext
  }
  
  // Router vráti uvítaciu správu + action buttons
  sofiaRouter.processCommand(welcomeCommand)
}
```

### **2. Používateľ vidí personalizovanú uvítaciu správu + akcie**

```
"Dobrý deň, Jana! Vidím, že ste už zabezpečili 12 dokumentov. 
Skvelá práca! Ako vám dnes môžem pomôcť?"

[📁 Otvoriť môj trezor]  [➕ Pridať dokument]
[💡 Čo mám robiť ďalej?]  [🔒 Ako sú chránené dáta?]
```

### **3. Router rozhoduje o spracovaní**

```typescript
processCommand(command) {
  // Kategória 1: FREE - Navigation/UI actions
  if (category === 'navigation') return handleNavigation()
  
  // Kategória 2: LOW COST - Knowledge base
  if (command.startsWith('faq_')) return handleKnowledgeBase()
  
  // Kategória 3: PREMIUM - AI generation 
  if (category === 'premium_feature') return handlePremiumAI()
}
```

---

## 💡 **Príklady interakcií**

### **FREE Akcia: "Otvoriť môj trezor"**
```typescript
// Input: Klik na [📁 Otvoriť môj trezor]
// Process: handleNavigationCommand('navigate_vault')
// Output: navigate('/vault') + close chat
// Cost: 🆓 FREE
```

### **LOW COST Akcia: "Ako sú chránené dáta?"**
```typescript
// Input: Klik na [🔒 Ako sú chránené dáta?]
// Process: sofiaKnowledgeBase.getAnswer('faq_security')
// Output: Predpísaná odpoveď z knowledge base
// Cost: ⚡ LOW COST (ale v skutočnosti FREE, lebo bez AI)
```

### **PREMIUM Akcia: "Napísať osobný odkaz"**
```typescript
// Input: Klik na [💌 Napísať osobný odkaz] 
// Process: sofiaAPI.processPremiumGeneration() -> OpenAI GPT-4
// Output: Personalizovaný odkaz generovaný AI
// Cost: ⭐ PREMIUM
```

---

## 🛠️ **Konfigurácia a nasadenie**

### **Environment Variables**
```bash
# V .env.local
VITE_OPENAI_API_KEY=sk-your-key-here  # Pre AI funkcie
```

### **Testovanie bez OpenAI**
Sofia funguje aj bez API kľúča - používa mock responses:
```typescript
// Ak nie je API key, Sofia používa predpísané odpovede
getMockResponse(request) {
  return predefinedResponses[request.type]
}
```

### **Aktivácia nového systému**
```typescript
// V DashboardLayout.tsx
import SofiaChatV2 from '@/components/sofia/SofiaChatV2'

<SofiaChatV2 
  isOpen={isSofiaOpen}
  onClose={() => setIsSofiaOpen(false)}
  variant="floating"
/>
```

---

## 📊 **Metriky a optimalizácia**

### **Očakávané rozdelenie interakcií**
- **FREE (80%)**: Navigation, základné UI akcie
- **LOW COST (15%)**: FAQ, jednoduché AI dotazy  
- **PREMIUM (5%)**: Kreatívne generovanie obsahu

### **Nákladová optimalizácia**
```typescript
// Router najprv skúša najlacnejšie riešenia
if (canSolveWithoutAI) return freeResponse
if (canSolveWithKnowledgeBase) return lowCostResponse  
if (isPremiumFeature) return premiumAIResponse
```

### **Performance monitoring**
```typescript
// Každá odpoveď má metadata
metadata: {
  cost: 'free' | 'low_cost' | 'premium',
  source: 'predefined' | 'knowledge_base' | 'ai_generated',
  processingTime: number
}
```

---

## 🎨 **UX Features**

### **Vizuálne indikátory nákladov**
- 🆓 **Zadarmo** - Zelený badge
- ⚡ **Rýchle** - Modrý badge  
- ⭐ **Premium** - Fialový badge + gradient button

### **Responsívny design**
- **Desktop**: Floating chat (400x600px)
- **Mobile**: Fullscreen modal
- **Tablet**: Embedded variant

### **Animácie a feedback**
- Action buttons s hover effects
- Loading states pre AI responses
- Toast notifikácie pre akcie
- Plynulé transitions

---

## 🔒 **Security & Privacy**

### **OpenAI API Security**
```typescript
// NIKDY neposielame citlivé údaje do AI
const safeToCommunicate = sanitizeUserData(context)
const apiRequest = createSafeSofiaRequest(prompt, safeToCommunicate)
```

### **Local storage**
```typescript
// Conversation history je lokálne uložená
const conversations = localStorage.getItem(`sofia_${userId}`)
// Auto-cleanup po 50 správach
```

---

## 🚀 **Ďalšie kroky rozšírenia**

### **Fáza 1: Produkcia (aktuálne)**
- ✅ Guided Dialog systém
- ✅ Action-based rozhranie
- ✅ Cost optimization
- ✅ Knowledge base

### **Fáza 2: Pokročilé funkcie**
- [ ] Proactive suggestions
- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Analytics dashboard

### **Fáza 3: Enterprise**
- [ ] Custom knowledge bases
- [ ] Team collaboration
- [ ] Advanced AI models
- [ ] API pre tretie strany

---

## 📚 **Dokumentácia API**

### **Sofia Router API**
```typescript
interface SofiaCommand {
  id: string
  command: string  
  category: 'navigation' | 'ui_action' | 'ai_query' | 'premium_feature'
  parameters?: any
  context: SofiaContext
}

interface CommandResult {
  type: 'response' | 'navigation' | 'ui_action' | 'error'
  payload: any
  cost: 'free' | 'low_cost' | 'premium'
}
```

### **Knowledge Base API**
```typescript
sofiaKnowledgeBase.getAnswer(queryId, context)
sofiaKnowledgeBase.searchByKeywords(keywords, context)  
sofiaKnowledgeBase.getContextualTips(context)
```

### **AI API**
```typescript  
sofiaAPI.processSimpleQuery(request)     // Low cost
sofiaAPI.processPremiumGeneration(request) // High cost
sofiaAPI.isAvailable()                   // Check status
```

---

**🎉 Sofia AI je teraz pripravená poskytnúť inteligentné, cost-effective vedenie pre všetkých používateľov LegacyGuard!**