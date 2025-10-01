// Optimalized Will Generation Store using Zustand
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { CompleteWillData } from '@/lib/sofia/router';
import { TrustSeal } from '@/lib/trust-seal/calculator';

interface WillGenerationState {
  // Current will being edited
  currentWill: Partial<CompleteWillData> | null;
  currentStep: number;
  isGenerating: boolean;

  // Generated results
  generatedWill: string | null;
  trustSeal: TrustSeal | null;

  // UI states
  isSofiaOpen: boolean;
  isPreviewOpen: boolean;
  isEducationWizardOpen: boolean;

  // User preferences (cached)
  userPreferences: {
    jurisdiction: 'SK' | 'CZ' | 'AT' | 'DE' | 'PL';
    language: string;
    tier: 'free' | 'paid' | 'family_edition';
    showAdvancedOptions: boolean;
  };

  // Sync state
  syncStatus: {
    isOnline: boolean;
    lastSyncTime: Date | null;
    pendingChanges: number;
  };

  // Actions
  setCurrentWill: (will: Partial<CompleteWillData>) => void;
  updateWillField: (field: keyof CompleteWillData, value: any) => void;
  setCurrentStep: (step: number) => void;
  setGenerating: (isGenerating: boolean) => void;
  setGeneratedWill: (will: string, trustSeal: TrustSeal) => void;
  toggleSofia: (open?: boolean) => void;
  togglePreview: (open?: boolean) => void;
  toggleEducationWizard: (open?: boolean) => void;
  setUserPreferences: (prefs: Partial<WillGenerationState['userPreferences']>) => void;
  updateSyncStatus: (status: Partial<WillGenerationState['syncStatus']>) => void;
  resetWillGeneration: () => void;
}

export const useWillGenerationStore = create<WillGenerationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentWill: null,
      currentStep: 0,
      isGenerating: false,
      generatedWill: null,
      trustSeal: null,
      isSofiaOpen: false,
      isPreviewOpen: false,
      isEducationWizardOpen: false,
      userPreferences: {
        jurisdiction: 'SK',
        language: 'sk',
        tier: 'free',
        showAdvancedOptions: false
      },
      syncStatus: {
        isOnline: navigator?.onLine ?? true,
        lastSyncTime: null,
        pendingChanges: 0
      },

      // Actions
      setCurrentWill: (will) => set({ currentWill: will }),

      updateWillField: (field, value) => set((state) => ({
        currentWill: {
          ...state.currentWill,
          [field]: value
        }
      })),

      setCurrentStep: (step) => set({ currentStep: step }),

      setGenerating: (isGenerating) => set({ isGenerating }),

      setGeneratedWill: (will, trustSeal) => set({
        generatedWill: will,
        trustSeal,
        isGenerating: false
      }),

      toggleSofia: (open) => set((state) => ({
        isSofiaOpen: open ?? !state.isSofiaOpen
      })),

      togglePreview: (open) => set((state) => ({
        isPreviewOpen: open ?? !state.isPreviewOpen
      })),

      toggleEducationWizard: (open) => set((state) => ({
        isEducationWizardOpen: open ?? !state.isEducationWizardOpen
      })),

      setUserPreferences: (prefs) => set((state) => ({
        userPreferences: { ...state.userPreferences, ...prefs }
      })),

      updateSyncStatus: (status) => set((state) => ({
        syncStatus: { ...state.syncStatus, ...status }
      })),

      resetWillGeneration: () => set({
        currentWill: null,
        currentStep: 0,
        isGenerating: false,
        generatedWill: null,
        trustSeal: null,
        isPreviewOpen: false
      })
    }),
    { name: 'will-generation-store' }
  )
);

// Selectors for performance optimization
export const useCurrentWill = () => useWillGenerationStore((state) => state.currentWill);
export const useGenerationStatus = () => useWillGenerationStore((state) => state.isGenerating);
export const useCurrentStep = () => useWillGenerationStore((state) => state.currentStep);
export const useSofiaState = () => useWillGenerationStore((state) => state.isSofiaOpen);
export const useUserPreferences = () => useWillGenerationStore((state) => state.userPreferences);
export const useSyncStatus = () => useWillGenerationStore((state) => state.syncStatus);

// Computed selectors
export const useWillCompleteness = () => useWillGenerationStore((state) => {
  if (!state.currentWill) return 0;

  const requiredFields = ['fullName', 'birthDate', 'citizenship', 'executor'];
  const completedFields = requiredFields.filter(field =>
    state.currentWill?.[field as keyof CompleteWillData]
  );

  return (completedFields.length / requiredFields.length) * 100;
});

export const useCanGenerate = () => useWillGenerationStore((state) => {
  const will = state.currentWill;
  if (!will) return false;

  return !!(will.fullName && will.birthDate && will.executor?.name);
});