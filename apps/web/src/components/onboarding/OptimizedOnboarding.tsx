'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  User,
  FileText,
  Users,
  Shield,
  Zap,
  Heart,
  Clock,
  Star,
  Gift,
  Target,
  Lightbulb,
  TrendingUp,
  Award,
  Mail,
  Phone,
  Calendar,
  MapPin
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { BehaviorTracker } from '@/lib/monitoring/behavior-tracker';
import { ExperimentManager } from '@/lib/experiments/ab-testing';
import { UsageTracker } from '@/lib/pricing/usage-tracker';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isCompleted: boolean;
  isOptional: boolean;
  estimatedTime: number; // in minutes
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  address: string;
  familyStatus: 'single' | 'married' | 'divorced' | 'widowed';
  hasChildren: boolean;
  primaryGoals: string[];
  experience: 'beginner' | 'intermediate' | 'advanced';
  preferences: {
    notifications: boolean;
    newsletter: boolean;
    tips: boolean;
  };
}

interface OptimizedOnboardingProps {
  onComplete: () => void;
  className?: string;
}

export function OptimizedOnboarding({ onComplete, className }: OptimizedOnboardingProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [startTime] = useState(Date.now());
  const [experimentVariant, setExperimentVariant] = useState<'A' | 'B'>('A');

  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: user?.email || '',
    phone: '',
    birthDate: '',
    address: '',
    familyStatus: 'single',
    hasChildren: false,
    primaryGoals: [],
    experience: 'beginner',
    preferences: {
      notifications: true,
      newsletter: true,
      tips: true
    }
  });

  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: 'Vitajte v LegacyGuard',
      description: 'Začnime s ochranou vášho rodinného dedičstva',
      icon: <Heart className="w-6 h-6" />,
      isCompleted: false,
      isOptional: false,
      estimatedTime: 1
    },
    {
      id: 'profile',
      title: 'Váš profil',
      description: 'Pomôžte nám lepšie pochopiť vaše potreby',
      icon: <User className="w-6 h-6" />,
      isCompleted: false,
      isOptional: false,
      estimatedTime: 3
    },
    {
      id: 'goals',
      title: 'Vaše ciele',
      description: 'Čo chcete dosiahnuť s LegacyGuard?',
      icon: <Target className="w-6 h-6" />,
      isCompleted: false,
      isOptional: false,
      estimatedTime: 2
    },
    {
      id: 'quick-setup',
      title: 'Rýchle nastavenie',
      description: 'Nastavme základy za pár minút',
      icon: <Zap className="w-6 h-6" />,
      isCompleted: false,
      isOptional: false,
      estimatedTime: 5
    },
    {
      id: 'preferences',
      title: 'Preferencie',
      description: 'Prispôsobte si notifikácie a komunikáciu',
      icon: <Shield className="w-6 h-6" />,
      isCompleted: false,
      isOptional: true,
      estimatedTime: 2
    }
  ]);

  const availableGoals = [
    { id: 'will', label: 'Vytvoriť testament', icon: <FileText className="w-4 h-4" /> },
    { id: 'documents', label: 'Organizovať dokumenty', icon: <FileText className="w-4 h-4" /> },
    { id: 'family', label: 'Chrániť rodinu', icon: <Users className="w-4 h-4" /> },
    { id: 'emergency', label: 'Núdzové plány', icon: <Shield className="w-4 h-4" /> },
    { id: 'assets', label: 'Spravovať majetok', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'legal', label: 'Právne poradenstvo', icon: <Award className="w-4 h-4" /> }
  ];

  useEffect(() => {
    if (user) {
      initializeOnboarding();
    }
  }, [user]);

  const initializeOnboarding = async () => {
    if (!user) return;

    try {
      // Set up A/B test
      const variant = await ExperimentManager.assignUserToExperiment(user.id, 'onboarding_flow_v2');
      setExperimentVariant(variant as 'A' | 'B');

      // Track onboarding start
      await BehaviorTracker.trackEvent(user.id, {
        event_type: 'onboarding_started',
        experiment_variant: variant,
        timestamp: new Date().toISOString()
      });

      // Load existing profile if any
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        setProfile(prev => ({
          ...prev,
          name: existingProfile.full_name || prev.name,
          phone: existingProfile.phone || prev.phone,
          birthDate: existingProfile.birth_date || prev.birthDate,
          address: existingProfile.address || prev.address,
          familyStatus: existingProfile.family_status || prev.familyStatus,
          hasChildren: existingProfile.has_children || prev.hasChildren,
          primaryGoals: existingProfile.primary_goals || prev.primaryGoals,
          experience: existingProfile.experience_level || prev.experience
        }));
      }
    } catch (error) {
      console.error('Error initializing onboarding:', error);
    }
  };

  const trackStepInteraction = async (stepId: string, action: string, data?: any) => {
    if (!user) return;

    await BehaviorTracker.trackEvent(user.id, {
      event_type: 'onboarding_step_interaction',
      step_id: stepId,
      action,
      experiment_variant: experimentVariant,
      step_number: currentStep + 1,
      total_steps: steps.length,
      data,
      timestamp: new Date().toISOString()
    });
  };

  const nextStep = async () => {
    const step = steps[currentStep];

    // Mark current step as completed
    setSteps(prev => prev.map((s, i) =>
      i === currentStep ? { ...s, isCompleted: true } : s
    ));

    await trackStepInteraction(step.id, 'completed', {
      time_spent: Date.now() - startTime
    });

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      await trackStepInteraction(steps[currentStep + 1].id, 'started');
    } else {
      await completeOnboarding();
    }
  };

  const prevStep = async () => {
    if (currentStep > 0) {
      await trackStepInteraction(steps[currentStep].id, 'previous');
      setCurrentStep(currentStep - 1);
    }
  };

  const skipStep = async () => {
    const step = steps[currentStep];
    if (!step.isOptional) return;

    await trackStepInteraction(step.id, 'skipped');

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Save user profile
      const profileData = {
        user_id: user.id,
        full_name: profile.name,
        phone: profile.phone,
        birth_date: profile.birthDate || null,
        address: profile.address || null,
        family_status: profile.familyStatus,
        has_children: profile.hasChildren,
        primary_goals: profile.primaryGoals,
        experience_level: profile.experience,
        notification_preferences: profile.preferences,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData);

      if (profileError) throw profileError;

      // Track completion
      const totalTime = Date.now() - startTime;
      await BehaviorTracker.trackEvent(user.id, {
        event_type: 'onboarding_completed',
        experiment_variant: experimentVariant,
        total_time_minutes: Math.round(totalTime / 60000),
        completed_steps: steps.filter(s => s.isCompleted).length,
        total_steps: steps.length,
        primary_goals: profile.primaryGoals,
        experience_level: profile.experience,
        timestamp: new Date().toISOString()
      });

      // Convert in A/B test
      await ExperimentManager.trackConversion(user.id, 'onboarding_flow_v2');

      // Initialize usage tracking
      await UsageTracker.getCurrentUsage(user.id);

      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const toggleGoal = (goalId: string) => {
    const newGoals = profile.primaryGoals.includes(goalId)
      ? profile.primaryGoals.filter(g => g !== goalId)
      : [...profile.primaryGoals, goalId];

    updateProfile({ primaryGoals: newGoals });
    trackStepInteraction('goals', 'goal_selected', { goal: goalId, selected: !profile.primaryGoals.includes(goalId) });
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Heart className="w-10 h-10 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3">Vitajte v LegacyGuard!</h2>
              <p className="text-muted-foreground text-lg">
                Začnime s ochranou vášho rodinného dedičstva. Celý proces trvá len {steps.reduce((sum, step) => sum + step.estimatedTime, 0)} minút.
              </p>
            </div>

            {experimentVariant === 'B' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Gift className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Špeciálna ponuka!</span>
                </div>
                <p className="text-sm text-blue-800">
                  Dokončite nastavenie dnes a získajte 30 dní Premium zadarmo!
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Bezpečné uloženie</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>GDPR kompatibilné</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>24/7 podpora</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Slovenské právo</span>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Váš profil</h2>
              <p className="text-muted-foreground">Pomôžte nám lepšie pochopiť vaše potreby</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Celé meno</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => updateProfile({ name: e.target.value })}
                  placeholder="Vaše meno a priezvisko"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefón</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => updateProfile({ phone: e.target.value })}
                  placeholder="+421 xxx xxx xxx"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birthDate">Dátum narodenia</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={profile.birthDate}
                  onChange={(e) => updateProfile({ birthDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="familyStatus">Rodinný stav</Label>
                <select
                  id="familyStatus"
                  value={profile.familyStatus}
                  onChange={(e) => updateProfile({ familyStatus: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="single">Slobodný/á</option>
                  <option value="married">Ženatý/Vydatá</option>
                  <option value="divorced">Rozvedený/á</option>
                  <option value="widowed">Ovdovený/á</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Adresa</Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => updateProfile({ address: e.target.value })}
                placeholder="Vaša adresa"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="hasChildren"
                checked={profile.hasChildren}
                onCheckedChange={(checked) => updateProfile({ hasChildren: checked })}
              />
              <Label htmlFor="hasChildren">Mám deti</Label>
            </div>

            <div>
              <Label htmlFor="experience">Skúsenosti s právnymi dokumentmi</Label>
              <select
                id="experience"
                value={profile.experience}
                onChange={(e) => updateProfile({ experience: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="beginner">Začiatočník - prvýkrát riešim</option>
                <option value="intermediate">Stredne pokročilý - už som mal skúsenosti</option>
                <option value="advanced">Pokročilý - dobre sa v tom orientujem</option>
              </select>
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Vaše ciele</h2>
              <p className="text-muted-foreground">Čo chcete dosiahnuť s LegacyGuard? (vyberte všetko, čo sa vás týka)</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {availableGoals.map((goal) => (
                <Card
                  key={goal.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    profile.primaryGoals.includes(goal.id)
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleGoal(goal.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        profile.primaryGoals.includes(goal.id)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {goal.icon}
                      </div>
                      <span className="font-medium">{goal.label}</span>
                      {profile.primaryGoals.includes(goal.id) && (
                        <CheckCircle className="w-4 h-4 text-primary ml-auto" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {profile.primaryGoals.length > 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  Vybrali ste {profile.primaryGoals.length} cieľov. Na základe vášho výberu vám pripravíme personalizovaný postup.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'quick-setup':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Rýchle nastavenie</h2>
              <p className="text-muted-foreground">Na základe vašich cieľov vám odporúčame začať s týmito krokmi</p>
            </div>

            <div className="space-y-3">
              {profile.primaryGoals.includes('will') && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <h3 className="font-medium">Začať s testamentom</h3>
                        <p className="text-sm text-muted-foreground">Vytvorte svoj prvý testament pomocou našej intuitivnej čarodejky</p>
                      </div>
                      <Button size="sm">Začať</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {profile.primaryGoals.includes('emergency') && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <h3 className="font-medium">Núdzové kontakty</h3>
                        <p className="text-sm text-muted-foreground">Pridajte svojich blízkych ako núdzové kontakty</p>
                      </div>
                      <Button size="sm" variant="outline">Nastaviť</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {profile.primaryGoals.includes('documents') && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <div className="flex-1">
                        <h3 className="font-medium">Nahrať dokumenty</h3>
                        <p className="text-sm text-muted-foreground">Organizujte svoje dôležité dokumenty na jednom mieste</p>
                      </div>
                      <Button size="sm" variant="outline">Nahrať</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Alert className="border-yellow-200 bg-yellow-50">
              <Clock className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700">
                Všetky tieto kroky môžete dokončiť kedykoľvek neskôr v aplikácii. Začnite tým, čo je pre vás najdôležitejšie.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Vaše preferencie</h2>
              <p className="text-muted-foreground">Prispôsobte si komunikáciu a notifikácie</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications">Email notifikácie</Label>
                  <p className="text-sm text-muted-foreground">Dôležité upozornenia o dokumentoch a termínoch</p>
                </div>
                <Switch
                  id="notifications"
                  checked={profile.preferences.notifications}
                  onCheckedChange={(checked) => updateProfile({
                    preferences: { ...profile.preferences, notifications: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newsletter">Newsletter</Label>
                  <p className="text-sm text-muted-foreground">Tipy a novinky o ochrane majetku</p>
                </div>
                <Switch
                  id="newsletter"
                  checked={profile.preferences.newsletter}
                  onCheckedChange={(checked) => updateProfile({
                    preferences: { ...profile.preferences, newsletter: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="tips">Užitočné tipy</Label>
                  <p className="text-sm text-muted-foreground">Personalizované rady na základe vašej situácie</p>
                </div>
                <Switch
                  id="tips"
                  checked={profile.preferences.tips}
                  onCheckedChange={(checked) => updateProfile({
                    preferences: { ...profile.preferences, tips: checked }
                  })}
                />
              </div>
            </div>

            {experimentVariant === 'B' && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Star className="w-5 h-5 text-green-600" />
                    <div>
                      <h3 className="font-medium text-green-900">Gratulujeme!</h3>
                      <p className="text-sm text-green-700">Dokončili ste nastavenie. Vaša 30-dňová Premium skúšobná verzia je aktivovaná!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-sm font-medium text-muted-foreground">
            Krok {currentStep + 1} z {steps.length}
          </h1>
          <Badge variant="outline">
            ~{currentStepData.estimatedTime} min
          </Badge>
        </div>
        <Progress value={progress} className="mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{currentStepData.title}</span>
          <span>{Math.round(progress)}% hotovo</span>
        </div>
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              {currentStepData.icon}
            </div>
            <div>
              <CardTitle>{currentStepData.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Späť
        </Button>

        <div className="flex space-x-2">
          {currentStepData.isOptional && (
            <Button variant="ghost" onClick={skipStep}>
              Preskočiť
            </Button>
          )}

          <Button
            onClick={nextStep}
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <div className="w-4 h-4 animate-spin rounded-full border border-current border-t-transparent" />
            ) : currentStep === steps.length - 1 ? (
              'Dokončiť'
            ) : (
              <>
                Pokračovať
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center mt-8 space-x-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`w-2 h-2 rounded-full transition-colors ${
              index <= currentStep
                ? 'bg-primary'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}