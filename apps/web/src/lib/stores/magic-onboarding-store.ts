import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types for the onboarding flow
export interface FamilyStatus {
  id: 'married-children' | 'married-no-children' | 'single-children' | 'single';
  title: string;
  icon: string;
  description: string;
  protectionMultiplier: number;
}

export interface Priority {
  id: 'family-security' | 'asset-protection' | 'business-continuity' | 'legacy-planning';
  title: string;
  icon: string;
  description: string;
  scenario: string;
  missions: string[];
}

export interface OnboardingAnswers {
  familyStatus?: FamilyStatus;
  priority?: Priority;
}

export interface DashboardScenario {
  id: string;
  name: string;
  description: string;
  widgets: string[];
  missions: Mission[];
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  unlocked: boolean;
}

export interface ProtectionStats {
  protectionValue: number;
  riskReduction: number;
  timeToSecurity: number;
  legalCompliance: number;
}

interface MagicOnboardingState {
  // Flow state
  currentStep: number;
  isCompleted: boolean;
  answers: OnboardingAnswers;

  // Dashboard generation
  selectedScenario: DashboardScenario | null;
  isGenerating: boolean;
  generationProgress: number;

  // Professional UX state
  currentPhase: 'assessment' | 'strategy' | 'execution';
  achievements: Achievement[];
  protectionStats: ProtectionStats;

  // Sofia state
  sofiaMessage: string;
  isSofiaVisible: boolean;

  // Actions
  answerQuestion: (step: number, answer: FamilyStatus | Priority) => void;
  nextStep: () => void;
  generateDashboard: () => Promise<void>;
  unlockAchievement: (achievementId: string) => void;
  updateProtectionStats: (stats: Partial<ProtectionStats>) => void;
  setSofiaMessage: (message: string) => void;
  reset: () => void;
}

// Predefined data
export const FAMILY_STATUS_OPTIONS: FamilyStatus[] = [
  {
    id: 'married-children',
    title: 'Ženatý/vydatá s deťmi',
    icon: '👨‍👩‍👧‍👦',
    description: 'Komplexná ochrana pre celú rodinu',
    protectionMultiplier: 2.5
  },
  {
    id: 'married-no-children',
    title: 'Ženatý/vydatá bez detí',
    icon: '💑',
    description: 'Ochrana manželského majetku',
    protectionMultiplier: 1.8
  },
  {
    id: 'single-children',
    title: 'Slobodný/á s deťmi',
    icon: '👨‍👧‍👦',
    description: 'Prioritná ochrana detí',
    protectionMultiplier: 2.0
  },
  {
    id: 'single',
    title: 'Slobodný/á',
    icon: '🚶‍♂️',
    description: 'Ochrana osobného majetku',
    protectionMultiplier: 1.0
  }
];

export const PRIORITY_OPTIONS: Priority[] = [
  {
    id: 'family-security',
    title: 'Zabezpečenie rodiny',
    icon: '🛡️',
    description: 'Ochrana blízkych v prípade nepredvídaných situácií',
    scenario: 'family-guardian',
    missions: ['emergency-contacts', 'guardian-selection', 'will-basics']
  },
  {
    id: 'asset-protection',
    title: 'Ochrana majetku',
    icon: '🏠',
    description: 'Zabezpečenie nehnuteľností a finančných aktív',
    scenario: 'wealth-protector',
    missions: ['asset-inventory', 'legal-structures', 'tax-optimization']
  },
  {
    id: 'business-continuity',
    title: 'Kontinuita podnikania',
    icon: '💼',
    description: 'Zabezpečenie chodu firmy po vašom odchode',
    scenario: 'business-succession',
    missions: ['succession-plan', 'key-person-insurance', 'ownership-transfer']
  },
  {
    id: 'legacy-planning',
    title: 'Dedičské plánovanie',
    icon: '📜',
    description: 'Správne nastavenie dedičstva pre budúce generácie',
    scenario: 'legacy-architect',
    missions: ['inheritance-strategy', 'trust-setup', 'tax-minimization']
  }
];

const SCENARIOS: Record<string, DashboardScenario> = {
  'family-guardian': {
    id: 'family-guardian',
    name: 'Family Guardian',
    description: 'Kompletná ochrana pre rodiny s deťmi',
    widgets: ['family-overview', 'emergency-plan', 'guardian-contacts', 'will-status'],
    missions: [
      { id: 'emergency-contacts', title: 'Nastavenie núdzových kontaktov', description: 'Pridajte dôveryhodné osoby pre krízové situácie', priority: 'high', estimatedTime: '5 min', status: 'pending' },
      { id: 'guardian-selection', title: 'Výber opatrovníka detí', description: 'Určte, kto sa postará o vaše deti', priority: 'high', estimatedTime: '10 min', status: 'pending' },
      { id: 'will-basics', title: 'Základy testamentu', description: 'Vytvorte základný testament', priority: 'medium', estimatedTime: '15 min', status: 'pending' }
    ]
  },
  'wealth-protector': {
    id: 'wealth-protector',
    name: 'Wealth Protector',
    description: 'Ochrana majetku a finančných aktív',
    widgets: ['asset-overview', 'protection-level', 'legal-structures', 'tax-efficiency'],
    missions: [
      { id: 'asset-inventory', title: 'Inventár majetku', description: 'Zoznam všetkých aktív a záväzkov', priority: 'high', estimatedTime: '20 min', status: 'pending' },
      { id: 'legal-structures', title: 'Právne štruktúry', description: 'Optimalizácia vlastníckych štruktúr', priority: 'medium', estimatedTime: '30 min', status: 'pending' },
      { id: 'tax-optimization', title: 'Daňová optimalizácia', description: 'Minimalizácia daňovej záťaže', priority: 'medium', estimatedTime: '25 min', status: 'pending' }
    ]
  },
  'business-succession': {
    id: 'business-succession',
    name: 'Business Succession',
    description: 'Kontinuita podnikania a následníctvo',
    widgets: ['business-overview', 'succession-plan', 'key-persons', 'ownership-structure'],
    missions: [
      { id: 'succession-plan', title: 'Plán následníctva', description: 'Stratégia pre budúcnosť firmy', priority: 'high', estimatedTime: '45 min', status: 'pending' },
      { id: 'key-person-insurance', title: 'Poistenie kľúčových osôb', description: 'Ochrana pred stratou dôležitých ľudí', priority: 'high', estimatedTime: '15 min', status: 'pending' },
      { id: 'ownership-transfer', title: 'Prenos vlastníctva', description: 'Mechanizmy prenosu firmy', priority: 'medium', estimatedTime: '35 min', status: 'pending' }
    ]
  },
  'legacy-architect': {
    id: 'legacy-architect',
    name: 'Legacy Architect',
    description: 'Plánovanie dedičstva pre budúce generácie',
    widgets: ['legacy-timeline', 'inheritance-structure', 'trust-funds', 'generation-planning'],
    missions: [
      { id: 'inheritance-strategy', title: 'Stratégia dedičstva', description: 'Dlhodobé plánovanie pre potomkov', priority: 'high', estimatedTime: '40 min', status: 'pending' },
      { id: 'trust-setup', title: 'Nastavenie trustov', description: 'Vytvorenie trust fondov', priority: 'medium', estimatedTime: '60 min', status: 'pending' },
      { id: 'tax-minimization', title: 'Minimalizácia daní z dedičstva', description: 'Optimalizácia dedičských daní', priority: 'medium', estimatedTime: '30 min', status: 'pending' }
    ]
  }
};

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_answer',
    title: 'Prvé rozhodnutie',
    description: 'Začali ste svoju cestu k ochrane rodiny',
    icon: '🎯',
    xp: 100,
    unlocked: false
  },
  {
    id: 'strategic_analysis',
    title: 'Strategická analýza kompletná',
    description: 'Definovali ste svoju situáciu a priority',
    icon: '📊',
    xp: 250,
    unlocked: false
  },
  {
    id: 'dashboard_ready',
    title: 'Plán pripravený',
    description: 'Váš personalizovaný dashboard je aktívny',
    icon: '🚀',
    xp: 500,
    unlocked: false
  }
];

export const useMagicOnboardingStore = create<MagicOnboardingState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentStep: 1,
      isCompleted: false,
      answers: {},
      selectedScenario: null,
      isGenerating: false,
      generationProgress: 0,
      currentPhase: 'assessment',
      achievements: [...ACHIEVEMENTS],
      protectionStats: {
        protectionValue: 50000,
        riskReduction: 0,
        timeToSecurity: 30,
        legalCompliance: 25
      },
      sofiaMessage: 'Dobrý deň. Som Sofia, vaša digitálna poradkyňa pre ochranu dedičstva. Pomôžem vám pripraviť optimálnu stratégiu za menej než 3 minúty.',
      isSofiaVisible: true,

      // Actions
      answerQuestion: (step, answer) => {
        const state = get();
        const newAnswers = { ...state.answers };

        if (step === 1) {
          newAnswers.familyStatus = answer as FamilyStatus;
          // Unlock first achievement
          get().unlockAchievement('first_answer');

          // Update protection stats based on family status
          const multiplier = (answer as FamilyStatus).protectionMultiplier;
          get().updateProtectionStats({
            protectionValue: Math.round(50000 * multiplier),
            riskReduction: Math.min(multiplier * 15, 60),
            legalCompliance: Math.min(25 + multiplier * 10, 75)
          });

          set({
            answers: newAnswers,
            sofiaMessage: 'Výborne. Teraz mi povedzte - čo je vašou najvyššou prioritou? To ovplyvní, na čom sa zameriame ako prvé.',
            currentPhase: 'strategy'
          });

          // Auto-advance to next step
          setTimeout(() => {
            get().nextStep();
          }, 1500);

        } else if (step === 2) {
          newAnswers.priority = answer as Priority;

          set({
            answers: newAnswers,
            sofiaMessage: 'Na základe vašich odpovedí pripravujem personalizovaný plán. Analyzujem vašu situáciu...',
            currentPhase: 'execution'
          });

          // Unlock strategic analysis achievement
          get().unlockAchievement('strategic_analysis');

          // Auto-generate dashboard
          setTimeout(() => {
            get().generateDashboard();
          }, 1000);
        }
      },

      nextStep: () => {
        const state = get();
        if (state.currentStep < 2) {
          set({ currentStep: state.currentStep + 1 });
        }
      },

      generateDashboard: async () => {
        const state = get();
        set({ isGenerating: true, generationProgress: 0 });

        try {
          // Simulate generation process
          const steps = [
            { progress: 25, message: 'Analyzujem vašu situáciu...', delay: 800 },
            { progress: 50, message: 'Vyberám optimálnu stratégiu...', delay: 1000 },
            { progress: 75, message: 'Pripravujem personalizované nástroje...', delay: 800 },
            { progress: 100, message: 'Plán je pripravený!', delay: 600 }
          ];

          for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, step.delay));
            set({
              generationProgress: step.progress,
              sofiaMessage: step.message
            });
          }

          // Get scenario based on priority
          const priority = state.answers.priority;
          const scenario = priority ? SCENARIOS[priority.scenario] : null;

          if (scenario) {
            set({
              selectedScenario: scenario,
              isGenerating: false,
              isCompleted: true,
              sofiaMessage: `Váš strategický plán ochrany je pripravený. Máte pred sebou ${scenario.missions.length} prioritných úloh, ktoré zabezpečia vašu rodinu.`
            });

            // Unlock dashboard ready achievement
            get().unlockAchievement('dashboard_ready');

            // Final stats update
            get().updateProtectionStats({
              riskReduction: Math.min(state.protectionStats.riskReduction + 25, 85),
              legalCompliance: Math.min(state.protectionStats.legalCompliance + 20, 95),
              timeToSecurity: Math.max(state.protectionStats.timeToSecurity - 15, 7)
            });
          }

        } catch (error) {
          console.error('Dashboard generation failed:', error);
          set({
            isGenerating: false,
            generationProgress: 0,
            sofiaMessage: 'Nastala chyba pri generovaní plánu. Skúste to prosím znovu.'
          });
        }
      },

      unlockAchievement: (achievementId) => {
        set(state => ({
          achievements: state.achievements.map(achievement =>
            achievement.id === achievementId
              ? { ...achievement, unlocked: true }
              : achievement
          )
        }));
      },

      updateProtectionStats: (stats) => {
        set(state => ({
          protectionStats: { ...state.protectionStats, ...stats }
        }));
      },

      setSofiaMessage: (message) => {
        set({ sofiaMessage: message });
      },

      reset: () => {
        set({
          currentStep: 1,
          isCompleted: false,
          answers: {},
          selectedScenario: null,
          isGenerating: false,
          generationProgress: 0,
          currentPhase: 'assessment',
          achievements: [...ACHIEVEMENTS],
          protectionStats: {
            protectionValue: 50000,
            riskReduction: 0,
            timeToSecurity: 30,
            legalCompliance: 25
          },
          sofiaMessage: 'Dobrý deň. Som Sofia, vaša digitálna poradkyňa pre ochranu dedičstva. Pomôžem vám pripraviť optimálnu stratégiu za menej než 3 minúty.',
          isSofiaVisible: true
        });
      }
    }),
    { name: 'magic-onboarding-store' }
  )
);

// Selectors
export const useOnboardingStep = () => useMagicOnboardingStore(state => state.currentStep);
export const useOnboardingAnswers = () => useMagicOnboardingStore(state => state.answers);
export const useOnboardingGeneration = () => useMagicOnboardingStore(state => ({
  isGenerating: state.isGenerating,
  progress: state.generationProgress,
  scenario: state.selectedScenario
}));
export const useProtectionStats = () => useMagicOnboardingStore(state => state.protectionStats);
export const useSofiaState = () => useMagicOnboardingStore(state => ({
  message: state.sofiaMessage,
  isVisible: state.isSofiaVisible
}));
export const useAchievements = () => useMagicOnboardingStore(state => state.achievements);