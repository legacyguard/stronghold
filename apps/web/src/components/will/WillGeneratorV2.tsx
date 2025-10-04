'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BehaviorTracker } from '@/lib/analytics/behavior-tracker';
import { UsageTracker } from '@/lib/pricing/usage-tracker';
import { CreateWillGate } from '@/components/premium/PremiumGate';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft, ChevronRight, Check, AlertCircle, Save, Eye } from 'lucide-react';
import { WillGenerationExperiment } from '@/lib/experiments/ab-testing';

interface WillFormData {
  basicInfo: {
    fullName: string;
    birthDate: string;
    address: string;
    maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
    children: Array<{
      name: string;
      birthDate: string;
      relationship: string;
    }>;
  };
  beneficiaries: Array<{
    id: string;
    name: string;
    relationship: string;
    percentage: number;
    address: string;
    contingent?: boolean;
  }>;
  assets: {
    realEstate: Array<{
      type: string;
      description: string;
      value: number;
      location: string;
    }>;
    financial: Array<{
      type: 'bank' | 'investment' | 'insurance' | 'other';
      institution: string;
      accountNumber: string;
      value: number;
    }>;
    personal: Array<{
      description: string;
      value: number;
      beneficiary?: string;
    }>;
  };
  guardians: Array<{
    name: string;
    relationship: string;
    address: string;
    phone: string;
    forMinorChildren: boolean;
  }>;
  executors: Array<{
    name: string;
    relationship: string;
    address: string;
    phone: string;
    backup?: boolean;
  }>;
  specialInstructions: {
    funeral: string;
    charitable: Array<{
      organization: string;
      amount: number;
    }>;
    digitalAssets: {
      socialMedia: string;
      digitalAccounts: string;
      cryptocurrencies: string;
    };
    other: string;
  };
}

interface StepProps {
  data: WillFormData;
  onChange: (data: WillFormData) => void;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

// Step Components
function BasicInfoStep({ data, onChange, onNext, onBack, isValid }: StepProps) {
  const handleChange = (field: string, value: any) => {
    onChange({
      ...data,
      basicInfo: { ...data.basicInfo, [field]: value }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Meno a priezvisko</label>
          <input
            type="text"
            value={data.basicInfo.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
            placeholder="Jozef Novák"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Dátum narodenia</label>
          <input
            type="date"
            value={data.basicInfo.birthDate}
            onChange={(e) => handleChange('birthDate', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Adresa</label>
        <textarea
          value={data.basicInfo.address}
          onChange={(e) => handleChange('address', e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
          rows={3}
          placeholder="Ulica 123, 821 01 Bratislava"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Rodinný stav</label>
        <select
          value={data.basicInfo.maritalStatus}
          onChange={(e) => handleChange('maritalStatus', e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
        >
          <option value="single">Slobodný/á</option>
          <option value="married">Ženatý/Vydatá</option>
          <option value="divorced">Rozvedený/á</option>
          <option value="widowed">Ovdovený/á</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        <Button onClick={onNext} disabled={!isValid}>
          Pokračovať
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function BeneficiariesStep({ data, onChange, onNext, onBack, isValid }: StepProps) {
  const addBeneficiary = () => {
    const newBeneficiary = {
      id: Date.now().toString(),
      name: '',
      relationship: '',
      percentage: 0,
      address: '',
      contingent: false
    };
    
    onChange({
      ...data,
      beneficiaries: [...data.beneficiaries, newBeneficiary]
    });
  };

  const updateBeneficiary = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      beneficiaries: data.beneficiaries.map(b => 
        b.id === id ? { ...b, [field]: value } : b
      )
    });
  };

  const removeBeneficiary = (id: string) => {
    onChange({
      ...data,
      beneficiaries: data.beneficiaries.filter(b => b.id !== id)
    });
  };

  const totalPercentage = data.beneficiaries.reduce((sum, b) => sum + b.percentage, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Dedičia</h3>
        <Button onClick={addBeneficiary} variant="outline">
          Pridať dediča
        </Button>
      </div>

      {totalPercentage !== 100 && data.beneficiaries.length > 0 && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Celkové percento musí byť 100%. Aktuálne: {totalPercentage}%
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {data.beneficiaries.map((beneficiary) => (
          <Card key={beneficiary.id}>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Meno</label>
                  <input
                    type="text"
                    value={beneficiary.name}
                    onChange={(e) => updateBeneficiary(beneficiary.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vzťah</label>
                  <input
                    type="text"
                    value={beneficiary.relationship}
                    onChange={(e) => updateBeneficiary(beneficiary.id, 'relationship', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="syn, dcéra, manžel/ka"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Podiel (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={beneficiary.percentage}
                    onChange={(e) => updateBeneficiary(beneficiary.id, 'percentage', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Adresa</label>
                <input
                  type="text"
                  value={beneficiary.address}
                  onChange={(e) => updateBeneficiary(beneficiary.id, 'address', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => removeBeneficiary(beneficiary.id)}
                  variant="destructive"
                  size="sm"
                >
                  Odstrániť
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Späť
        </Button>
        <Button onClick={onNext} disabled={!isValid || totalPercentage !== 100}>
          Pokračovať
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Additional step components would follow similar pattern...
function AssetsStep({ data, onChange, onNext, onBack, isValid }: StepProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Majetok</h3>
      {/* Asset management UI */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Späť
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Pokračovať
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function GuardiansStep({ data, onChange, onNext, onBack, isValid }: StepProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Opatrovníci</h3>
      {/* Guardian management UI */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Späť
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Pokračovať
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function ReviewStep({ data, onChange, onNext, onBack, isValid }: StepProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Generate will document
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate generation
    setIsGenerating(false);
    onNext();
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Kontrola a dokončenie</h3>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-3">Súhrn vašho testamentu:</h4>
        <div className="space-y-2 text-sm">
          <div><strong>Meno:</strong> {data.basicInfo.fullName}</div>
          <div><strong>Dedičia:</strong> {data.beneficiaries.length} osôb</div>
          <div><strong>Celkový podiel:</strong> {data.beneficiaries.reduce((sum, b) => sum + b.percentage, 0)}%</div>
        </div>
      </div>

      <Alert>
        <Eye className="w-4 h-4" />
        <AlertDescription>
          Pred dokončením si prosím skontrolujte všetky údaje. Po vygenerovaní si budete môcť testament stiahnuť ako PDF.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Späť
        </Button>
        <Button onClick={handleGenerate} disabled={!isValid || isGenerating}>
          {isGenerating ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generujem...
            </div>
          ) : (
            'Vygenerovať testament'
          )}
        </Button>
      </div>
    </div>
  );
}

// Progress Indicator Component
function ProgressIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Krok {currentStep} z {totalSteps}</span>
        <span className="text-sm text-muted-foreground">{Math.round(progress)}% dokončené</span>
      </div>
      <Progress value={progress} className="h-2" />
      
      <div className="flex justify-between mt-4">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              i + 1 < currentStep ? 'bg-primary border-primary text-white' :
              i + 1 === currentStep ? 'border-primary text-primary' :
              'border-gray-300 text-gray-300'
            }`}>
              {i + 1 < currentStep ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className="text-xs mt-1 hidden md:block">
              {['Základy', 'Dedičia', 'Majetok', 'Opatrovníci', 'Kontrola'][i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Will Generator Component
export function WillGeneratorV2() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<WillFormData>({
    basicInfo: {
      fullName: '',
      birthDate: '',
      address: '',
      maritalStatus: 'single',
      children: []
    },
    beneficiaries: [],
    assets: {
      realEstate: [],
      financial: [],
      personal: []
    },
    guardians: [],
    executors: [],
    specialInstructions: {
      funeral: '',
      charitable: [],
      digitalAssets: {
        socialMedia: '',
        digitalAccounts: '',
        cryptocurrencies: ''
      },
      other: ''
    }
  });
  const [variant, setVariant] = useState<'wizard' | 'form'>('wizard');
  const { user } = useAuth();

  const steps = [
    { component: BasicInfoStep, title: "Základné informácie", key: 'basic' },
    { component: BeneficiariesStep, title: "Dedičia", key: 'beneficiaries' },
    { component: AssetsStep, title: "Majetok", key: 'assets' },
    { component: GuardiansStep, title: "Opatrovníci", key: 'guardians' },
    { component: ReviewStep, title: "Kontrola", key: 'review' }
  ];

  // Track step progression and A/B test variant
  useEffect(() => {
    if (!user) return;

    const loadVariant = async () => {
      const testVariant = await WillGenerationExperiment.getVariant(user.id);
      setVariant(testVariant);
    };

    loadVariant();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    BehaviorTracker.trackFormInteraction('will_generator', `step_${step}`, 'focus', user.id, {
      variant,
      totalSteps: steps.length
    });
  }, [step, user, variant]);

  // Save progress automatically
  useEffect(() => {
    if (!user) return;
    
    const saveProgress = () => {
      localStorage.setItem(`will_progress_${user.id}`, JSON.stringify({
        step,
        formData,
        lastSaved: new Date().toISOString()
      }));
    };

    const debounceTimer = setTimeout(saveProgress, 1000);
    return () => clearTimeout(debounceTimer);
  }, [step, formData, user]);

  // Load saved progress
  useEffect(() => {
    if (!user) return;
    
    const savedProgress = localStorage.getItem(`will_progress_${user.id}`);
    if (savedProgress) {
      try {
        const { step: savedStep, formData: savedData } = JSON.parse(savedProgress);
        setStep(savedStep);
        setFormData(savedData);
      } catch (error) {
        console.error('Error loading saved progress:', error);
      }
    }
  }, [user]);

  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return !!(formData.basicInfo.fullName && formData.basicInfo.birthDate && formData.basicInfo.address);
      case 2:
        return formData.beneficiaries.length > 0 && 
               formData.beneficiaries.reduce((sum, b) => sum + b.percentage, 0) === 100;
      case 3:
        return true; // Assets are optional
      case 4:
        return true; // Guardians are optional
      case 5:
        return true; // Review step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    // Track completion
    await WillGenerationExperiment.trackConversion(user.id, variant, true);
    
    // Increment usage
    await UsageTracker.incrementUsage(user.id, 'wills');
    
    // Clear saved progress
    localStorage.removeItem(`will_progress_${user.id}`);
    
    // Redirect or show success
    console.log('Will generation completed!');
  };

  const CurrentStepComponent = steps[step - 1].component;
  const isValid = validateStep(step);

  return (
    <CreateWillGate>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Vytvoriť testament</h1>
          <p className="text-muted-foreground">
            Náš sprievodca vás prevedie krok za krokom vytvorením právne platného testamentu.
          </p>
        </div>

        <ProgressIndicator currentStep={step} totalSteps={steps.length} />

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {steps[step - 1].title}
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    BehaviorTracker.trackButtonClick('save_progress', window.location.pathname, user?.id || '');
                  }}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Uložené
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CurrentStepComponent
              data={formData}
              onChange={setFormData}
              onNext={step === steps.length ? handleComplete : handleNext}
              onBack={handleBack}
              isValid={isValid}
            />
          </CardContent>
        </Card>

        {/* Help section */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Potrebujete pomoc?</h4>
          <p className="text-sm text-blue-800">
            Ak máte otázky o vytváraní testamentu, môžete kontaktovať našu podporu alebo si prečítať našu príručku.
          </p>
        </div>
      </div>
    </CreateWillGate>
  );
}