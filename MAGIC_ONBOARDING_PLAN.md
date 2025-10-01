# Magic Onboarding - "Digital Guardian Awakening" Experience

**Dátum:** 10/01/2025
**Autor:** Claude Code Assistant
**Status:** Enhanced UX Návrh implementácie

> **"Nie je to len onboarding - je to magické prebudenie vašej digitálnej ochranky"**

## 🎭 UX Innovation Layer - "WOW" Moments

### 🌟 **The Sofia Awakening Sequence**
```
Sofia sa "prebúdza" postupne počas onboardingu:
1. Prvé stretnutie: Len text bubble s "..."
2. Po 1. otázke: Objaví sa jej silueta
3. Po 2. otázke: Materialization animation
4. Dashboard generation: Plná Sofia s personalizovaným vzhľadom
```

### 🎨 **Immersive 3D Environment Transitions**
```typescript
const sceneTransitions = {
  welcome: {
    environment: 'floating_in_space', // Používateľ floats v dark space
    effect: 'sofia_light_appears',    // Sofia's glow illuminates space
    audio: 'gentle_cosmic_hum'
  },
  question1: {
    environment: 'family_constellation', // Stars form family patterns
    effect: 'choices_materialize',       // 3D cards emerge from stars
    audio: 'warm_resonance'
  },
  question2: {
    environment: 'time_stream',         // Flowing time/priority river
    effect: 'path_formation',           // Golden path appears
    audio: 'flowing_harmony'
  },
  generation: {
    environment: 'stronghold_building', // 3D fortress construction
    effect: 'reality_weaving',          // Dashboard pieces assemble
    audio: 'creation_symphony'
  }
};
```

### 🎪 **"Choose Your Adventure" Gamification**

Namiesto nudných kariet → **Interactive Story Mode**:

```typescript
interface StoryBasedQuestion {
  scenario: 'mystery_inheritance' | 'time_traveler_mission' | 'guardian_calling';
  narrative: string;
  choices: ChoiceCard[];
  consequences: 'immediate_preview' | 'character_evolution';
}

// Príklad: Question 1 ako "Guardian Calling"
const guardianCalling: StoryBasedQuestion = {
  scenario: 'guardian_calling',
  narrative: `
    🔮 Sofia vám šepká: "Vidím vo vašej budúcnosti...
    dôležité rozhodnutia. Ukážte mi svoju cestu..."
  `,
  choices: [
    {
      id: 'young_family',
      title: '🏡 Ochranný Rodič',
      storyText: 'Vaše deti sa na vás spoliehajú. Potrebujete silný štít.',
      preview: '→ Sofia získa "protective aura" + family shields appear',
      powerUnlocked: 'Family Protection Matrix',
      magicMoment: 'Children avatars appear around Sofia'
    },
    {
      id: 'solo_adventurer',
      title: '⚡ Digitálny Nomád',
      storyText: 'Svet je váš playground. Organizácia je vaša sila.',
      preview: '→ Sofia transforms into efficiency mode + digital tools',
      powerUnlocked: 'Hyper-Organization Engine',
      magicMoment: 'Documents dance around Sofia in organized spiral'
    }
  ]
};
```

## 1. Architektonický Prehľad

### 1.1 Základné Princípy
- **Rule-Based Logic**: Žiadne GenAI volania, len preddefinované scenáre
- **Instant Value**: Personalizovaný dashboard do 30 sekúnd
- **Progressive Disclosure**: Postupné odhaľovanie funkcií
- **Context-Aware**: Scenáre založené na odpovediach používateľa

### 1.2 Kľúčové Komponenty
```
Magic Onboarding System
├── Questionnaire Engine (2 otázky)
├── Scenario Matcher (rule-based)
├── Dashboard Generator (template-based)
├── Mission Scheduler (predefined tasks)
└── Sofia Personality Adapter
```

## 2. Dátová Architektúra

### 2.1 User Profile Schema
```typescript
interface OnboardingProfile {
  id: string;
  userId: string;

  // Odpovede z onboardingu
  familyStatus: 'single' | 'married' | 'divorced' | 'widowed' | 'partner';
  dependents: {
    children: number;
    childrenAges: number[];
    elderlyParents: boolean;
    pets: boolean;
  };
  primaryGoal: 'will' | 'documents' | 'family_protection' | 'emergency_plan';
  riskTolerance: 'conservative' | 'balanced' | 'progressive';
  timeAvailable: '5min' | '15min' | '30min' | 'weekend';

  // Určený scenár
  scenarioId: string;
  personalityMode: 'empathetic' | 'pragmatic' | 'encouraging';

  // Progress tracking
  completedAt: Date;
  dashboardGenerated: boolean;
  firstMissionAssigned: boolean;
}
```

### 2.2 Predefined Scenarios
```typescript
interface DashboardScenario {
  id: string;
  name: string;
  description: string;
  targetUserTypes: string[];

  // Dashboard konfigurácia
  dashboardLayout: DashboardLayout;
  priorityWidgets: WidgetConfig[];
  quickActions: QuickAction[];

  // Misie
  initialMissions: Mission[];
  weekOneMissions: Mission[];

  // Sofia personalizácia
  sofiaMode: 'protective_guide' | 'efficiency_coach' | 'supportive_friend';
  welcomeMessage: string;
  motivationalTips: string[];
}
```

## 3. Questionnaire Design

### 3.1 Otázka 1: Rodinná Situácia & Priorita
```typescript
interface Question1 {
  type: 'card-selection';
  title: 'Aká je vaša aktuálna životná situácia?';
  subtitle: 'Pomôže nám pripraviť správne kroky pre vás';

  options: [
    {
      id: 'young_family',
      title: 'Mladá rodina s deťmi',
      subtitle: 'Máte deti do 18 rokov',
      icon: 'family-icon',
      color: 'warm-blue',
      implications: ['child_protection', 'education_planning', 'guardian_selection']
    },
    {
      id: 'established_couple',
      title: 'Zavedený pár',
      subtitle: 'Bez malých detí, stabilné financie',
      icon: 'couple-icon',
      color: 'elegant-green',
      implications: ['asset_protection', 'retirement_planning', 'legacy_planning']
    },
    {
      id: 'single_professional',
      title: 'Samostatný profesionál',
      subtitle: 'Chcete zabezpečiť svoje záležitosti',
      icon: 'professional-icon',
      color: 'confident-purple',
      implications: ['document_organization', 'emergency_contacts', 'simple_will']
    },
    {
      id: 'caring_for_parents',
      title: 'Starám sa o rodičov',
      subtitle: 'Riešite viacgeneračnú ochranu',
      icon: 'generations-icon',
      color: 'nurturing-orange',
      implications: ['multi_generation', 'healthcare_planning', 'complex_family']
    }
  ];
}
```

### 3.2 Otázka 2: Urgentnosť & Časová Dostupnosť
```typescript
interface Question2 {
  type: 'priority-matrix';
  title: 'Čo je pre vás momentálne najdôležitejšie?';
  subtitle: 'Prispôsobíme tempo a kroky vašim potrebám';

  dimensions: {
    urgency: {
      low: 'Chcem to riešiť postupne',
      medium: 'Je to dôležité, ale nie kritické',
      high: 'Potrebujem to vyriešiť čo najskôr'
    },
    complexity: {
      simple: 'Preferujem jednoduché riešenia',
      standard: 'Normálna úroveň detailov',
      comprehensive: 'Chcem komplexné pokrytie'
    }
  };

  timeCommitment: {
    micro: '5 minút denne',
    focused: '15-30 minút týždenne',
    weekend: 'Víkendové bloky',
    intensive: 'Chcem to dokončiť rýchlo'
  };
}
```

## 4. Scenario Definition Matrix

### 4.1 Hlavné Scenáre

#### A. "Protective Parent" (Mladá rodina + Vysoká urgentnosť)
```typescript
const protectiveParentScenario: DashboardScenario = {
  id: 'protective_parent',
  name: 'Ochranný Rodič',
  description: 'Pre rodičov, ktorí chcú zabezpečiť deti',

  dashboardLayout: {
    heroWidget: 'family_protection_status',
    primarySection: 'child_guardianship',
    secondaryWidgets: ['emergency_contacts', 'important_documents', 'sofia_tips'],
    sidebarQuickActions: ['add_child', 'set_guardian', 'emergency_plan']
  },

  initialMissions: [
    {
      id: 'guardian_selection',
      title: 'Vyberte opatrovníka pre deti',
      description: 'Zabezpečte kto sa postará o vaše deti',
      estimatedTime: '5 min',
      priority: 'critical',
      type: 'form_wizard'
    },
    {
      id: 'emergency_contacts',
      title: 'Nastavte núdzové kontakty',
      description: 'Kontakty pre školu, lekára, babky',
      estimatedTime: '3 min',
      priority: 'high',
      type: 'contact_list'
    }
  ],

  sofiaMode: 'protective_guide',
  welcomeMessage: 'Ahoj! Som Sofia a pomôžem vám vytvoriť ochranný štít pre vašu rodinu. Začneme s najdôležitejším - zabezpečením vašich detí.',
  motivationalTips: [
    'Každý krok, ktorý robíte, je prejav lásky k vašej rodine',
    'Vaše deti budú mať istotu vďaka vašej starostlivosti',
    'Už len nastavením opatrovníka chránite budúcnosť svojich detí'
  ]
};
```

#### B. "Efficient Organizer" (Profesionál + Stredná urgentnosť)
```typescript
const efficientOrganizerScenario: DashboardScenario = {
  id: 'efficient_organizer',
  name: 'Efektívny Organizátor',
  description: 'Pre profesionálov, ktorí chcú mať všetko v poriadku',

  dashboardLayout: {
    heroWidget: 'organization_progress',
    primarySection: 'document_vault',
    secondaryWidgets: ['quick_upload', 'task_checklist', 'legal_status'],
    sidebarQuickActions: ['scan_document', 'create_will', 'set_reminder']
  },

  initialMissions: [
    {
      id: 'document_scan',
      title: 'Nahrajte svoj prvý dokument',
      description: 'Začnite s občianskym preukazom alebo pasom',
      estimatedTime: '2 min',
      priority: 'medium',
      type: 'document_upload'
    },
    {
      id: 'will_assessment',
      title: 'Posúdenie potreby závetu',
      description: 'Krátky dotazník o vašej situácii',
      estimatedTime: '5 min',
      priority: 'medium',
      type: 'assessment_quiz'
    }
  ],

  sofiaMode: 'efficiency_coach',
  welcomeMessage: 'Dobrý deň! Som Sofia, vaša digitálna asistentka. Pomôžem vám efektívne zorganizovať všetky dôležité dokumenty a záležitosti.',
  motivationalTips: [
    'Organizovanosť je investícia do vašej budúcej pohody',
    'Každý dokument na správnom mieste vám ušetrí hodiny hľadania',
    'Váš systematický prístup je kľúčom k pokoju v duši'
  ]
};
```

#### C. "Legacy Builder" (Zavedený pár + Komplexnosť)
```typescript
const legacyBuilderScenario: DashboardScenario = {
  id: 'legacy_builder',
  name: 'Budovateľ Dedičstva',
  description: 'Pre páry, ktoré plánujú svoje dedičstvo',

  dashboardLayout: {
    heroWidget: 'estate_overview',
    primarySection: 'will_creator',
    secondaryWidgets: ['asset_inventory', 'beneficiary_management', 'legal_consultation'],
    sidebarQuickActions: ['add_asset', 'create_will', 'schedule_lawyer']
  },

  initialMissions: [
    {
      id: 'asset_inventory',
      title: 'Zmapujte váš majetok',
      description: 'Vytvorte prehľad nehnuteľností, účtov a investícií',
      estimatedTime: '15 min',
      priority: 'high',
      type: 'asset_wizard'
    },
    {
      id: 'will_draft',
      title: 'Vytvorte koncept závetu',
      description: 'Sprievodca vás prevedie základnými rozhodnutiami',
      estimatedTime: '20 min',
      priority: 'high',
      type: 'will_wizard'
    }
  ],

  sofiaMode: 'supportive_friend',
  welcomeMessage: 'Vitajte! Som Sofia a teším sa, že môžem pomôcť pri plánovaní vášho dedičstva. Spoločne vytvoríme plán, ktorý ochráni to, čo ste si vybudovali.',
  motivationalTips: [
    'Vaše dedičstvo je odrazom vašej životnej práce',
    'Premyslené plánovanie je dar, ktorý dávate svojim blízkym',
    'Každé rozhodnutie, ktoré robíte, vyjadruje vaše hodnoty'
  ]
};
```

### 4.2 Kompletná Scenario Matrix

| Rodinná Situácia | Urgentnosť | Komplexnosť | Scenár | Sofia Mód |
|------------------|------------|-------------|---------|-----------|
| Mladá rodina | Vysoká | Jednoduchá | Protective Parent | protective_guide |
| Mladá rodina | Vysoká | Komplexná | Emergency Planner | protective_guide |
| Mladá rodina | Nízka | Jednoduchá | Gradual Family Builder | encouraging_friend |
| Profesionál | Stredná | Jednoduchá | Efficient Organizer | efficiency_coach |
| Profesionál | Vysoká | Stredná | Business Protector | efficiency_coach |
| Zavedený pár | Nízka | Komplexná | Legacy Builder | supportive_friend |
| Zavedený pár | Vysoká | Komplexná | Estate Strategist | supportive_friend |
| Starám sa o rodičov | Vysoká | Komplexná | Multi-Gen Caregiver | protective_guide |

## 5. Dashboard Generation Engine

### 5.1 Widget System
```typescript
interface WidgetConfig {
  id: string;
  type: 'hero' | 'primary' | 'secondary' | 'sidebar';
  component: string;
  props: Record<string, any>;
  position: { row: number; col: number; span: number };
  visibility: {
    scenarios: string[];
    conditions?: string[];
  };
}

// Príklad widget konfigurácií
const widgetLibrary: WidgetConfig[] = [
  {
    id: 'family_protection_status',
    type: 'hero',
    component: 'FamilyProtectionHero',
    props: {
      title: 'Ochrana Rodiny',
      showChildren: true,
      showGuardians: true,
      showEmergencyPlan: true
    },
    position: { row: 1, col: 1, span: 12 },
    visibility: { scenarios: ['protective_parent', 'emergency_planner'] }
  },
  {
    id: 'quick_missions',
    type: 'primary',
    component: 'MissionList',
    props: {
      title: '5-minútové misie',
      maxVisible: 3,
      autoRefresh: true
    },
    position: { row: 2, col: 1, span: 8 },
    visibility: { scenarios: ['all'] }
  }
];
```

### 5.2 Dashboard Layout Engine
```typescript
class DashboardGenerator {
  generateLayout(scenarioId: string, userProfile: OnboardingProfile): DashboardLayout {
    const scenario = getScenario(scenarioId);
    const widgets = this.selectWidgets(scenario, userProfile);
    const layout = this.arrangeWidgets(widgets, scenario.dashboardLayout);

    return {
      layout,
      quickActions: scenario.quickActions,
      sofiaSettings: {
        mode: scenario.sofiaMode,
        welcomeMessage: scenario.welcomeMessage,
        currentTips: this.selectTips(scenario, userProfile)
      }
    };
  }

  private selectWidgets(scenario: DashboardScenario, profile: OnboardingProfile): WidgetConfig[] {
    return widgetLibrary.filter(widget =>
      widget.visibility.scenarios.includes('all') ||
      widget.visibility.scenarios.includes(scenario.id) ||
      this.meetsConditions(widget.visibility.conditions, profile)
    );
  }
}
```

## 6. Mission System

### 6.1 Mission Categories
```typescript
type MissionCategory =
  | 'document_management'    // Nahrávanie, organizácia dokumentov
  | 'family_protection'     // Opatrovníci, kontakty, ochrana detí
  | 'legal_planning'        // Závety, plnomocenstvá
  | 'emergency_preparation' // Núdzové plány, health care proxy
  | 'asset_organization'    // Majetok, účty, investície
  | 'digital_legacy'        // Online účty, heslá, digitálne dedičstvo;

interface Mission {
  id: string;
  category: MissionCategory;
  title: string;
  description: string;
  estimatedTime: string; // '5 min', '15 min', '30 min'
  priority: 'critical' | 'high' | 'medium' | 'low';

  // Implementácia
  type: 'form_wizard' | 'document_upload' | 'contact_list' | 'assessment_quiz' | 'will_wizard';
  component: string;
  props: Record<string, any>;

  // Podmienky
  prerequisites: string[]; // IDs iných misií
  scenarioCompatibility: string[];
  userTypeCompatibility: string[];

  // Gamifikácia
  xpReward: number;
  badgeUnlocked?: string;
  nextSuggestedMissions: string[];
}
```

### 6.2 Mission Templates Pre Scenáre
```typescript
const missionTemplates = {
  protective_parent: [
    // Week 1 - Critical
    {
      id: 'guardian_selection',
      title: 'Vyberte opatrovníka pre deti',
      description: 'Zabezpečte, kto sa postará o vaše deti ak by sa niečo stalo',
      estimatedTime: '5 min',
      priority: 'critical',
      type: 'form_wizard',
      component: 'GuardianSelectionWizard'
    },
    {
      id: 'emergency_contacts_school',
      title: 'Kontakty pre školu',
      description: 'Nastavte alternatívne kontakty pre odber detí',
      estimatedTime: '3 min',
      priority: 'critical',
      type: 'contact_list',
      component: 'EmergencyContactsForm'
    },
    // Week 2 - High Priority
    {
      id: 'medical_authorization',
      title: 'Zdravotné plnomocenstvo',
      description: 'Umožnite opatrovníkovi rozhodovať o zdravotnej starostlivosti',
      estimatedTime: '8 min',
      priority: 'high',
      type: 'form_wizard',
      component: 'MedicalProxyWizard'
    }
  ],

  efficient_organizer: [
    // Week 1 - Quick wins
    {
      id: 'id_documents_upload',
      title: 'Nahrajte ID dokumenty',
      description: 'Občiansky preukaz, pas, vodičák',
      estimatedTime: '3 min',
      priority: 'medium',
      type: 'document_upload',
      component: 'DocumentUploader'
    },
    {
      id: 'will_needs_assessment',
      title: 'Potrebujete závet?',
      description: 'Krátky dotazník o vašej situácii',
      estimatedTime: '5 min',
      priority: 'medium',
      type: 'assessment_quiz',
      component: 'WillNeedsQuiz'
    }
  ]
};
```

## 7. Sofia Personality Adapter

### 🎪 **Instant Gratification Hooks**

```typescript
// Immediate wow moments that happen BEFORE questions
const preEngagementHooks = {
  magicDetection: {
    title: "🔍 Detekujeme vašu digitálnu identitu...",
    animation: "scanning_user_browser",
    reveals: [
      "💻 Používate {browser} - Sofia to bude vedieť optimalizovať",
      "🌍 Ste z {location} - pripravujeme lokálne právne informácie",
      "⏰ Je {time} - Sofia vie, kedy máte čas na úlohy"
    ],
    duration: 3000,
    climax: "Sofia: 'Ahh, už vás vidím! Poďme vytvoriť váš digitálny štít.'"
  },

  futureVision: {
    title: "🔮 Náhľad do budúcnosti...",
    animation: "crystal_ball_vision",
    preview: "Sofia ukáže 3D preview toho, čo bude používateľ mať po onboardingu",
    teasers: [
      "Vaše dokumenty budú organizované do 5 minút",
      "Žiadny dokument sa už nestratí",
      "Sofia bude vedieť, kedy je čas na action"
    ]
  }
};
```

### 🎨 **Visual Storytelling Evolution**

```typescript
// Sofia sa vyvíja počas onboardingu
const sofiaEvolution = {
  stage1_ghost: {
    appearance: 'translucent_silhouette',
    powers: ['basic_communication'],
    personality: 'curious_but_weak',
    message: "Som ešte slabá... pomôžte mi pochopiť vás"
  },
  stage2_awakening: {
    appearance: 'glowing_outline_with_features',
    powers: ['emotion_reading', 'basic_suggestions'],
    personality: 'becoming_confident',
    message: "Cítim vašu energiu! Ukážte mi viac..."
  },
  stage3_materialization: {
    appearance: 'full_3d_avatar_personalized',
    powers: ['dashboard_creation', 'mission_assignment', 'full_ai'],
    personality: 'confident_guardian',
    message: "Som tu pre vás! Poďme chrániť vašu budúcnosť."
  }
};
```

### 🎵 **Micro-Interactions & Sound Design**

```typescript
const audioLandscape = {
  ambient: {
    welcome: 'mysterious_digital_hum.mp3',        // Sci-fi, ale warm
    question1: 'family_heartbeat_rhythm.mp3',     // Organic, protective
    question2: 'time_flow_crystalline.mp3',      // Flowing, decisive
    generation: 'stronghold_construction.mp3'    // Epic building music
  },

  interactions: {
    card_hover: 'soft_chime.mp3',
    card_select: 'power_activation.mp3',
    sofia_speaks: 'gentle_voice_filter.mp3',
    progress: 'achievement_unlock.mp3',
    completion: 'victory_fanfare.mp3'
  },

  // Adaptive audio based on choices
  personalizedThemes: {
    protective_parent: 'lullaby_strength_theme.mp3',
    efficiency_master: 'productivity_flow_theme.mp3',
    legacy_builder: 'heritage_wisdom_theme.mp3'
  }
};
```

### 🎯 **Real-Time Value Demonstration**

```typescript
// Ukáž immediate value POČAS onboardingu, nie až po ňom
const liveValueDemos = {
  afterQuestion1: {
    preview: "instant_dashboard_preview",
    demonstrates: [
      "Vaše deti: {child_names} - budú chránené",
      "Kritické úlohy: {urgent_count} - už naplánované",
      "Čas na dokončenie: {time_estimate} - optimalizované pre vás"
    ]
  },

  duringGeneration: {
    showRealWork: [
      "✅ Vytvárané emergency kontakty pre {school_name}",
      "✅ Pripravené šablóny pre {jurisdiction}",
      "✅ Nastavené pripomienky pre {important_dates}",
      "✅ Aktivovaná ochrana pre {assets_count} majetkov"
    ]
  }
};
```

### 🎁 **Instant Reward System**

```typescript
const immediateRewards = {
  questionCompletion: {
    visual: 'sofia_gets_stronger_animation',
    unlock: 'new_sofia_ability',
    reward: '+50 Guardian Points',
    preview: 'next_power_teaser'
  },

  insights: {
    afterQuestion1: "💡 Insight: Rodičia ako vy dokončujú setup za priemerne 12 minút",
    afterQuestion2: "🎯 Perfect match: Váš profil sa zhoduje s našimi Top 5% používateľmi",
    beforeDashboard: "🚀 Ready: Váš personalizovaný systém bude silnejší ako u 87% používateľov"
  },

  // Easter eggs for different user types
  surprises: {
    tech_savvy: "🤖 Detektovali sme váš tech background - unlocking advanced features!",
    busy_parent: "⚡ Busy parent mode activated - extra automation enabled!",
    detail_oriented: "🔍 Precision mode detected - enhanced control panel ready!"
  }
};
```

### 7.1 Enhanced Personality Modes
```typescript
interface SofiaPersonality {
  mode: 'protective_guide' | 'efficiency_coach' | 'supportive_friend';
  communicationStyle: {
    tone: 'warm' | 'professional' | 'encouraging';
    formality: 'informal' | 'balanced' | 'formal';
    proactivity: 'high' | 'medium' | 'low';
  };

  messageTemplates: {
    welcome: string;
    taskCompletion: string;
    encouragement: string;
    explanation: string;
    reminder: string;
  };

  visualPresentation: {
    avatar: string;
    colors: string[];
    animations: string[];
  };
}

const sofiaPersonalities = {
  protective_guide: {
    mode: 'protective_guide',
    communicationStyle: {
      tone: 'warm',
      formality: 'informal',
      proactivity: 'high'
    },
    messageTemplates: {
      welcome: 'Ahoj {name}! Som Sofia a som tu, aby som vám pomohla chrániť vašu rodinu. Spoločne vytvoríme bezpečný štít okolo vašich najdrahších.',
      taskCompletion: 'Výborne! Každý krok, ktorý robíte, je prejav lásky k vašej rodine. {family_member} budú mať istotu vďaka vašej starostlivosti.',
      encouragement: 'Viem, že rozmýšľanie o týchto veciach môže byť ťažké. Ale vaša odvaha chrániť rodinu je inšpiratívna. Pokračujme spolu.',
      explanation: 'Vysvetlím vám to jednoducho: {explanation}. Toto je dôležité, pretože {reason}.',
      reminder: 'Nezabudnite na {task}. Vaša rodina sa na vás spolieha. 💙'
    },
    visualPresentation: {
      avatar: 'protective_sofia',
      colors: ['warm-blue', 'soft-green', 'gentle-purple'],
      animations: ['caring-gesture', 'protective-shield', 'family-embrace']
    }
  },

  efficiency_coach: {
    mode: 'efficiency_coach',
    communicationStyle: {
      tone: 'professional',
      formality: 'balanced',
      proactivity: 'medium'
    },
    messageTemplates: {
      welcome: 'Dobrý deň {name}! Som Sofia, vaša digitálna asistentka. Spoločne efektívne zorganizujeme všetko dôležité a ušetríme vám čas.',
      taskCompletion: 'Perfektne! Máte už {completed}/{total} úloh dokončených. Váš systematický prístup je kľúčom k úspechu.',
      encouragement: 'Každý dokument na správnom mieste vám ušetrí hodiny hľadania v budúcnosti. Pokračujte v dobrej práci!',
      explanation: 'Tu je efektívny spôsob: {explanation}. Tým ušetríte {time_saved} a budete mať {benefit}.',
      reminder: 'Plánovaná úloha: {task}. Odhadovaný čas: {time}. ⚡'
    },
    visualPresentation: {
      avatar: 'professional_sofia',
      colors: ['corporate-blue', 'success-green', 'focus-orange'],
      animations: ['check-completion', 'organize-files', 'time-efficient']
    }
  }
};
```

## 8. Technická Implementácia

### 8.1 Database Schema
```sql
-- Onboarding profily
CREATE TABLE onboarding_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),

  -- Odpovede z questionnaire
  family_status VARCHAR(50),
  dependents JSONB,
  primary_goal VARCHAR(50),
  risk_tolerance VARCHAR(50),
  time_available VARCHAR(20),

  -- Určený scenár
  scenario_id VARCHAR(100),
  personality_mode VARCHAR(50),

  -- Tracking
  completed_at TIMESTAMP WITH TIME ZONE,
  dashboard_generated BOOLEAN DEFAULT FALSE,
  first_mission_assigned BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre RLS
ALTER TABLE onboarding_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own onboarding profile" ON onboarding_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Dashboard konfigurácie
CREATE TABLE user_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  scenario_id VARCHAR(100),
  layout_config JSONB,
  widget_config JSONB,
  sofia_config JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Misie a progress
CREATE TABLE user_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  mission_id VARCHAR(100),
  scenario_id VARCHAR(100),

  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, skipped
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Progress data
  progress_data JSONB,
  xp_earned INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8.2 React Components Structure
```
src/components/onboarding/
├── OnboardingWizard.tsx          # Main orchestrator
├── questionnaire/
│   ├── Question1FamilyStatus.tsx
│   ├── Question2Priorities.tsx
│   └── QuestionnaireProgress.tsx
├── dashboard-generation/
│   ├── DashboardPreview.tsx
│   ├── ScenarioExplainer.tsx
│   └── GenerationProgress.tsx
├── widgets/
│   ├── FamilyProtectionHero.tsx
│   ├── MissionList.tsx
│   ├── QuickActions.tsx
│   ├── SofiaChat.tsx
│   └── ProgressTracker.tsx
└── missions/
    ├── GuardianSelectionWizard.tsx
    ├── DocumentUploader.tsx
    ├── EmergencyContactsForm.tsx
    └── WillNeedsQuiz.tsx
```

## 9. 🎯 ENHANCED ATTENTION-GRABBING FEATURES

Táto sekcia obsahuje inovatívne prvky, ktoré robia Magic Onboarding atraktívny a odlišný od klasických onboardingov.

### 9.1 🌟 Digital Guardian Awakening Experience

**"Your Digital Guardian Is Born" Sequence:**

```typescript
// Sofia Awakening Animation Sequence
const SofiaAwakeningSequence = () => {
  const [stage, setStage] = useState<'dormant' | 'stirring' | 'awakening' | 'alive'>('dormant');

  useEffect(() => {
    const sequence = async () => {
      // Stage 1: Dormant (particles floating)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stage 2: Stirring (particles converging)
      setStage('stirring');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Stage 3: Awakening (Sofia taking shape)
      setStage('awakening');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stage 4: Alive (full Sofia with breathing animation)
      setStage('alive');
    };

    sequence();
  }, []);

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Particle System */}
      <ParticleSystem stage={stage} />

      {/* Sofia Avatar */}
      <SofiaAvatar stage={stage} />

      {/* Awakening Messages */}
      {stage === 'stirring' && (
        <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-xl text-blue-300 animate-pulse">
            "Cítim vašu prítomnosť... prebúdzam sa..."
          </p>
        </div>
      )}

      {stage === 'awakening' && (
        <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-2xl text-blue-200 animate-bounce">
            "Ahoj {userName}! Som Sofia, vaša digitálna strážkyňa..."
          </p>
        </div>
      )}

      {stage === 'alive' && (
        <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-3xl text-white font-bold mb-4">
            "Pripravená chrániť vašu rodinu!"
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary-dark pulse-glow"
            onClick={() => startOnboarding()}
          >
            Začnime spoločne
          </Button>
        </div>
      )}
    </div>
  );
};
```

### 9.2 🏰 3D Environment Transitions

**Immersive Scene Changes Between Steps:**

```typescript
// 3D Environment Transition System
const EnvironmentTransition = ({ currentStep }: { currentStep: number }) => {
  const environments = {
    1: 'family-home',     // Warm family setting
    2: 'guardian-tower',  // Protective fortress
    3: 'legacy-vault',    // Secure document vault
    4: 'mission-control'  // Command center dashboard
  };

  return (
    <div className="absolute inset-0 transition-all duration-2000 ease-in-out">
      {/* CSS 3D transforms for environment layers */}
      <div
        className={`environment-layer ${environments[currentStep]}`}
        style={{
          transform: `perspective(1000px) rotateY(${currentStep * 90}deg)`,
          transition: 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {currentStep === 1 && <FamilyHomeEnvironment />}
        {currentStep === 2 && <GuardianTowerEnvironment />}
        {currentStep === 3 && <LegacyVaultEnvironment />}
        {currentStep === 4 && <MissionControlEnvironment />}
      </div>

      {/* Particle effects during transitions */}
      <TransitionParticles />
    </div>
  );
};

// Environment Components with CSS 3D
const FamilyHomeEnvironment = () => (
  <div className="environment-scene">
    <div className="background-layer bg-gradient-to-b from-orange-200 to-orange-400" />
    <div className="family-silhouettes animate-gentle-sway" />
    <div className="warm-lighting animate-pulse opacity-60" />
  </div>
);
```

### 9.3 🎮 Story-Based Gamified Questions

**Namiesto nudných formulárov - interaktívne príbehy:**

```typescript
// Interactive Story Question Component
const StoryQuestion = ({ questionData }: { questionData: StoryQuestionData }) => {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const handleChoice = (choiceId: string) => {
    setSelectedChoice(choiceId);
    setIsRevealing(true);

    // Dramatic pause before revealing consequences
    setTimeout(() => {
      showChoiceConsequences(choiceId);
    }, 1500);
  };

  return (
    <div className="story-container relative h-screen bg-gradient-to-br from-slate-800 to-slate-900">
      {/* Animated Story Scene */}
      <div className="story-scene absolute inset-0">
        <AnimatedBackground scenario={questionData.scenario} />

        {/* Character Speech Bubble */}
        <div className="character-dialogue absolute bottom-1/3 left-1/4">
          <div className="speech-bubble bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
            <TypewriterText text={questionData.storyText} />
          </div>
          <SofiaCharacter emotion="concerned" />
        </div>

        {/* Interactive Choices */}
        <div className="choices-container absolute bottom-1/4 right-1/4 space-y-4">
          {questionData.choices.map((choice, index) => (
            <ChoiceButton
              key={choice.id}
              choice={choice}
              index={index}
              selected={selectedChoice === choice.id}
              onSelect={() => handleChoice(choice.id)}
              delay={index * 500} // Staggered appearance
            />
          ))}
        </div>
      </div>

      {/* Consequence Reveal Animation */}
      {isRevealing && (
        <ConsequenceReveal
          choice={selectedChoice}
          scenario={questionData.scenario}
        />
      )}
    </div>
  );
};

// Story-based question examples
const storyQuestions = {
  familyStatus: {
    scenario: 'family-crisis',
    storyText: "Je noc. Váš telefón zazvoní - nehoda. Sofia vás kontaktuje: 'Potrebujem okamžite vedieť o vašej rodine, aby som mohla konať. Kto je vo vašom živote najdôležitejší?'",
    choices: [
      {
        id: 'spouse-children',
        text: 'Manžel/ka a deti',
        icon: '👨‍👩‍👧‍👦',
        consequence: 'Sofia aktivuje rodinný ochranný protokol...'
      },
      {
        id: 'single-parent',
        text: 'Som sám/sama s deťmi',
        icon: '👨‍👧‍👦',
        consequence: 'Sofia pripraví krízový plán pre osamelého rodiča...'
      }
    ]
  }
};
```

### 9.4 ⚡ Real-Time Value Demonstration

**Okamžité zobrazenie hodnoty počas procesu:**

```typescript
// Live Value Calculator
const LiveValueCalculator = ({ userAnswers }: { userAnswers: QuestionnaireAnswers }) => {
  const [calculatedValue, setCalculatedValue] = useState(0);
  const [protectionLevel, setProtectionLevel] = useState(0);

  useEffect(() => {
    const value = calculateFamilyProtectionValue(userAnswers);
    const protection = calculateProtectionLevel(userAnswers);

    // Animated counter
    animateValue(0, value, 2000, setCalculatedValue);
    animateValue(0, protection, 2000, setProtectionLevel);
  }, [userAnswers]);

  return (
    <div className="value-display fixed top-4 right-4 bg-primary/20 backdrop-blur-sm rounded-xl p-4 border border-primary/30">
      <div className="text-center">
        <h3 className="text-sm text-primary-light mb-2">Hodnota ochrany</h3>

        {/* Animated Value Counter */}
        <div className="text-3xl font-bold text-white mb-2">
          €{calculatedValue.toLocaleString()}
        </div>

        {/* Protection Level Gauge */}
        <div className="relative w-20 h-20 mx-auto">
          <CircularProgress
            value={protectionLevel}
            color="primary"
            animationDuration={2000}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">
              {Math.round(protectionLevel)}%
            </span>
          </div>
        </div>

        <p className="text-xs text-primary-light mt-2">
          Úroveň ochrany rodiny
        </p>
      </div>

      {/* Milestone Rewards */}
      {protectionLevel >= 25 && (
        <div className="mt-4 p-2 bg-green-500/20 rounded-lg border border-green-500/30">
          <div className="flex items-center space-x-2">
            <span className="text-green-400">🏆</span>
            <span className="text-xs text-green-300">Základná ochrana aktivovaná!</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Value calculation based on family scenario
const calculateFamilyProtectionValue = (answers: QuestionnaireAnswers): number => {
  const baseValue = 50000;
  const familyMultiplier = answers.familyStatus === 'spouse-children' ? 2.5 : 1.8;
  const assetsMultiplier = answers.assets ? 1.5 : 1.0;

  return Math.round(baseValue * familyMultiplier * assetsMultiplier);
};
```


### 9.5 🏆 Instant Gratification & Reward System

**Okamžité odmeňovanie pokroku:**

```typescript
// Achievement System
const AchievementUnlock = ({ achievement }: { achievement: Achievement }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    // Auto-hide after celebration
    setTimeout(() => {
      setIsVisible(false);
    }, 4000);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-8 text-center shadow-2xl">
            <div className="text-6xl mb-4">{achievement.icon}</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {achievement.title}
            </h2>
            <p className="text-white/90 mb-4">
              {achievement.description}
            </p>
            <div className="bg-white/20 rounded-lg p-2">
              <span className="text-white font-bold">
                +{achievement.xp} XP
              </span>
            </div>
          </div>

          {/* Celebration Particles */}
          <ConfettiExplosion />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Progress Milestones with Instant Rewards
const progressMilestones = {
  first_answer: {
    title: "Prvé rozhodnutie",
    icon: "🎯",
    description: "Začali ste svoju cestu k ochrane rodiny!",
    xp: 100,
    unlock: "Sofia je teraz naladená na vašu situáciu"
  },
  scenario_match: {
    title: "Perfektná zhoda",
    icon: "🎪",
    description: "Našli sme ideálny scenár pre vašu rodinu!",
    xp: 250,
    unlock: "Odomknutý personalizovaný dashboard"
  },
  first_mission: {
    title: "Prvá misia",
    icon: "🚀",
    description: "Pripravený na akciu!",
    xp: 500,
    unlock: "Aktívna ochrana rodiny"
  }
};
```

### 9.6 🎭 Micro-Interactions & Professional Design

**Detailné interakcie, ktoré vytvárajú pocit:**

```typescript
// Emotional Micro-Interactions
const EmotionalButton = ({ children, emotion, onClick }: EmotionalButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const emotionalStyles = {
    protective: 'shadow-lg shadow-blue-500/25 border-2 border-blue-400/50',
    confident: 'shadow-lg shadow-green-500/25 border-2 border-green-400/50',
    urgent: 'shadow-lg shadow-red-500/25 border-2 border-red-400/50 animate-pulse'
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ripple = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    setRipples(prev => [...prev, ripple]);
    setIsPressed(true);

    // Haptic feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    setTimeout(() => {
      setIsPressed(false);
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, 600);

    onClick?.(e);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative overflow-hidden rounded-xl p-4 transition-all duration-300
        ${emotionalStyles[emotion]}
        ${isPressed ? 'scale-95' : 'scale-100'}
      `}
      onClick={handleClick}
    >
      {children}

      {/* Ripple Effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ping"
          style={{
            left: ripple.x - 50,
            top: ripple.y - 50,
            width: 100,
            height: 100
          }}
        />
      ))}
    </motion.button>
  );
};

// Breathing Progress Indicators
const BreathingProgress = ({ progress }: { progress: number }) => (
  <div className="relative w-32 h-32">
    <motion.div
      className="absolute inset-0 rounded-full border-4 border-primary/30"
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.7, 0.3]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <div className="absolute inset-2 rounded-full bg-primary/20 flex items-center justify-center">
      <span className="text-2xl font-bold text-primary">
        {Math.round(progress)}%
      </span>
    </div>
  </div>
);
```

### 9.7 🌊 Professional Storytelling Arc

**Celý onboarding ako profesionálny proces:**

```typescript
// Story Arc Manager
const OnboardingStoryArc = () => {
  const storyBeats = {
    1: {
      emotion: 'concern',
      narrative: 'Uvedomenie si zraniteľnosti',
      sofiaLine: "Všetci sme zraniteľní. Ale máte moc to zmeniť.",
      environment: 'stormy-night',
      music: 'tense-realization'
    },
    2: {
      emotion: 'hope',
      narrative: 'Objavenie riešenia',
      sofiaLine: "Spolu dokážeme vybudovať neprekonateľnú ochranu.",
      environment: 'dawn-breaking',
      music: 'hopeful-strings'
    },
    3: {
      emotion: 'empowerment',
      narrative: 'Aktivácia sily',
      sofiaLine: "Teraz ste pripravení chrániť tých, ktorých milujete.",
      environment: 'guardian-fortress',
      music: 'triumphant-orchestral'
    },
    4: {
      emotion: 'confidence',
      narrative: 'Nová identita',
      sofiaLine: "Vitajte v rade Guardians. Vaša misia začína.",
      environment: 'mission-control',
      music: 'heroic-theme'
    }
  };

  return (
    <StoryBeatOrchestrator beats={storyBeats} />
  );
};
```

### 8.3 State Management (Zustand)
```typescript
interface OnboardingStore {
  // Questionnaire state
  currentStep: number;
  answers: QuestionnaireAnswers;

  // Scenario state
  selectedScenario: DashboardScenario | null;
  dashboardPreview: DashboardLayout | null;

  // Progress state
  isGenerating: boolean;
  generationProgress: number;

  // Enhanced UX state
  currentEmotion: 'concern' | 'hope' | 'empowerment' | 'confidence';
  achievementsUnlocked: Achievement[];
  audioEnabled: boolean;

  // Actions
  answerQuestion: (questionId: string, answer: any) => void;
  selectScenario: (scenarioId: string) => void;
  generateDashboard: () => Promise<void>;
  completeMission: (missionId: string, data: any) => Promise<void>;
  unlockAchievement: (achievementId: string) => void;
  transitionEmotion: (emotion: string) => void;
}

const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  currentStep: 1,
  answers: {},
  selectedScenario: null,
  dashboardPreview: null,
  isGenerating: false,
  generationProgress: 0,
  currentEmotion: 'concern',
  achievementsUnlocked: [],
  audioEnabled: true,

  answerQuestion: (questionId, answer) => {
    set(state => ({
      answers: { ...state.answers, [questionId]: answer }
    }));

    // Trigger achievement for first answer
    if (Object.keys(get().answers).length === 1) {
      get().unlockAchievement('first_answer');
    }

    // Auto-advance to next step with emotion transition
    if (get().currentStep < 3) {
      set(state => ({ currentStep: state.currentStep + 1 }));
      get().transitionEmotion(getEmotionForStep(get().currentStep + 1));
    }
  },

  generateDashboard: async () => {
    set({ isGenerating: true, generationProgress: 0 });

    try {
      const answers = get().answers;
      const scenarioId = determineScenario(answers);
      const scenario = getScenario(scenarioId);

      set({ generationProgress: 25, selectedScenario: scenario });

      // Unlock scenario match achievement
      get().unlockAchievement('scenario_match');

      // Simulate dashboard generation steps with realistic delays
      await new Promise(resolve => setTimeout(resolve, 800));
      set({ generationProgress: 50 });

      await new Promise(resolve => setTimeout(resolve, 1000));
      set({ generationProgress: 75 });

      // Generate actual dashboard layout
      const dashboardLayout = generateDashboardLayout(scenario, answers);

      await new Promise(resolve => setTimeout(resolve, 600));
      set({
        generationProgress: 100,
        dashboardPreview: dashboardLayout,
        isGenerating: false
      });

      // Final transition to confidence emotion
      get().transitionEmotion('confidence');

    } catch (error) {
      console.error('Dashboard generation failed:', error);
      set({ isGenerating: false, generationProgress: 0 });
    }
  },

  unlockAchievement: (achievementId) => {
    const achievement = progressMilestones[achievementId];
    if (achievement) {
      set(state => ({
        achievementsUnlocked: [...state.achievementsUnlocked, achievement]
      }));
    }
  },

  transitionEmotion: (emotion) => {
    set({ currentEmotion: emotion });
  }
}));
```

## 10. 🎬 CINEMATIC IMPLEMENTATION ROADMAP

### 10.1 Development Phases

**Phase 1: Core Magic Experience (2-3 týždne)**
- Sofia Awakening Sequence
- Basic 3D environment transitions
- Story-based question framework
- Achievement system with visual rewards

**Phase 2: Audio & Advanced UX (1-2 týždne)**
- Immersive audio landscape
- Advanced micro-interactions
- Real-time value demonstration
- Haptic feedback integration

**Phase 3: Polish & Optimization (1 týždeň)**
- Performance optimization
- Mobile responsiveness
- Accessibility features
- A/B testing framework

### 10.2 🎯 Success Metrics

**Engagement Metrics:**
- Onboarding completion rate > 85%
- Time to first action < 30 sekúnd
- User session duration > 8 minút
- Return rate within 24 hodín > 60%

**Emotional Response Indicators:**
- Achievement unlock rate
- Audio engagement (users who enable sound)
- Choice interaction depth
- Scenario exploration patterns

### 10.3 🔧 Technical Requirements

**Dependencies:**
```json
{
  "framer-motion": "^10.x",
  "three": "^0.157.0",
  "@react-three/fiber": "^8.x",
  "@react-three/drei": "^9.x",
  "howler": "^2.x",
  "react-spring": "^9.x",
  "lottie-react": "^2.x"
}
```

**Performance Optimizations:**
- Lazy loading pre 3D assets
- Audio preloading strategies
- Progressive enhancement pre mobile
- WebGL fallbacks

### 10.4 🎮 Interactive Demo Script

**"The Guardian Awakening" - 5-minútová demo sekvencia:**

1. **[0:00-0:30] Sofia Birth**
   - Particles floating → converging → Sofia materialization
   - "Cítim vašu prítomnosť... prebúdzam sa..."

2. **[0:30-1:30] Crisis Scenario**
   - Night scene, emergency call simulation
   - "Je noc. Váš telefón zazvoní..."
   - Interactive choice with dramatic consequences

3. **[1:30-2:30] Protection Calculation**
   - Real-time value counter animation
   - Protection level gauge filling
   - Achievement unlock: "Základná ochrana aktivovaná!"

4. **[2:30-4:00] 3D Environment Journey**
   - Transition from family home → guardian tower → vault
   - Background music evolution
   - Sofia commentary throughout

5. **[4:00-5:00] Dashboard Materialization**
   - Cinematic reveal of personalized dashboard
   - Mission cards appearing with sound effects
   - "Vitajte v rade Guardians. Vaša misia začína."

---

## 🏆 EXPECTED OUTCOMES

**Pre Používateľov:**
- Emotívne zapojenie namiesto nudného formulára
- Okamžité pochopenie hodnoty produktu
- Silná motivácia dokončiť setup
- Pocit exkluzivity a dôležitosti

**Pre Business:**
- Výrazne vyššia conversion rate
- Nižší churn rate v prvých dňoch
- Vyšší lifetime value
- Viral potenciál (users sharing the experience)

**Diferenciácia:**
Magic Onboarding robí z Stronghold premium produkt, ktorý sa už pri prvom kontakte odlišuje od všetkých konkurentov svojou kinematografickou kvalitou a emocionálnym dopadom.
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ generationProgress: 50 });

      const dashboard = generateDashboardLayout(scenario, answers);
      set({ generationProgress: 75, dashboardPreview: dashboard });

      await new Promise(resolve => setTimeout(resolve, 500));
      set({ generationProgress: 100 });

      // Save to database
      await saveDashboardConfig(dashboard);
      await assignInitialMissions(scenario);

    } finally {
      set({ isGenerating: false });
    }
  }
}));
```

## 9. UI/UX Dizajn Špecifikácie

### 9.1 Questionnaire UX
- **Card-based Selection**: Veľké, vizuálne karty s ikonami
- **Progressive Disclosure**: Len 2 otázky, žiadne overwhelm
- **Visual Feedback**: Progress bar, hover stavy, plynulé transitions
- **Accessibility**: Keyboard navigation, screen reader support

### 9.2 Dashboard Generation Animation
```typescript
const generationSteps = [
  {
    step: 1,
    title: 'Analyzujem vašu situáciu',
    description: 'Na základe vašich odpovedi...',
    icon: 'analysis-icon',
    duration: 2000
  },
  {
    step: 2,
    title: 'Vyberám najlepší scenár',
    description: 'Našiel som pre vás: {scenario_name}',
    icon: 'selection-icon',
    duration: 1500
  },
  {
    step: 3,
    title: 'Generujem dashboard',
    description: 'Pripravujem personalizované nástroje...',
    icon: 'generation-icon',
    duration: 2000
  },
  {
    step: 4,
    title: 'Prideľujem prvé misie',
    description: 'Máte pripravených {mission_count} úloh',
    icon: 'mission-icon',
    duration: 1000
  }
];
```

### 9.3 Sofia Integration Points
- **Welcome Message**: Personalizovaný podľa scenára
- **Contextual Tips**: Inline pomocník v každom kroku
- **Progress Celebrations**: Pozitívny feedback po dokončení
- **Proaktívne Suggestions**: Smart recommendations

## 10. Deployment & Testing Strategy

### 10.1 Implementation Phases
1. **Phase 1**: Questionnaire + Scenario Matching (1 týždeň)
2. **Phase 2**: Dashboard Generation Engine (1 týždeň)
3. **Phase 3**: Mission System + Sofia Integration (1 týždeň)
4. **Phase 4**: Polish + Analytics (3 dni)

### 10.2 A/B Testing Points
- **Question Wording**: Testovanie clarity otázok
- **Scenario Names**: User-friendly vs. descriptive názvy
- **Sofia Personality**: Warm vs. Professional ton
- **Mission Ordering**: Critical-first vs. Quick-win first

### 10.3 Success Metrics
- **Completion Rate**: % používateľov, ktorí dokončia onboarding
- **Time to First Value**: Priemerný čas do prvej dokončenej misie
- **Dashboard Engagement**: Čas strávený na dashboard po onboardingu
- **Mission Completion**: % dokončených misií v prvom týždni

## 11. Záver

Tento plán poskytuje robustný, rule-based systém pre Magic Onboarding bez závislosti na GenAI. Kľúčové výhody:

- **Predictable Performance**: Žiadne AI API calls = konzistentné response times
- **Cost Effective**: Žiadne external AI služby = fixné náklady
- **Scalable**: Pre-defined scenáre = easy maintenance a updates
- **Personalized**: Rule-based matching stále poskytuje relevantnú personalizáciu

Systém je navrhnutý modulárne, čo umožňuje budúce rozšírenie o AI funkcie bez refactoringu základnej architektúry.