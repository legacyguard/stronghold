'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Eye, Check, AlertTriangle, FileText, Download, Sparkles } from 'lucide-react';
import { WillFormData, WillTemplate, getTemplatesByJurisdiction, renderTemplate } from '@/lib/will/templates';
import { ENHANCED_WILL_TEMPLATES, getTemplatesByUserTier, getEnhancedTemplateById } from '@/lib/will/enhanced-templates';
import { SofiaAIRouter, SofiaCommand, SofiaResponse, CompleteWillData, WillGenerationResult } from '@/lib/sofia/router';
import { TrustSeal, TrustSealLevel, getTrustSealLevel, getTrustSealDescription } from '@/lib/trust-seal/calculator';

type WizardStep = 'jurisdiction' | 'personal' | 'marital' | 'assets' | 'executors' | 'review' | 'preview' | 'complete';

interface WillGeneratorWizardProps {
  onComplete: (willData: WillFormData, generatedWill: string, trustSeal?: TrustSeal) => void;
  userTier?: 'free' | 'paid' | 'family_edition';
  userId?: string;
  className?: string;
}

type GenerationMode = 'basic' | 'guided' | 'expert';

interface TierFeatures {
  mode: GenerationMode;
  aiAssistance: boolean;
  livePreview: boolean;
  trustSealGeneration: boolean;
  familyCollaboration: boolean;
  maxGuardians: number;
  advancedValidation: boolean;
}

export function WillGeneratorWizard({
  onComplete,
  userTier = 'free',
  userId = 'anonymous',
  className
}: WillGeneratorWizardProps) {
  // Tier-based feature configuration
  const tierFeatures = useMemo((): TierFeatures => {
    switch (userTier) {
      case 'family_edition':
        return {
          mode: 'expert',
          aiAssistance: true,
          livePreview: true,
          trustSealGeneration: true,
          familyCollaboration: true,
          maxGuardians: -1, // unlimited
          advancedValidation: true
        };
      case 'paid':
        return {
          mode: 'guided',
          aiAssistance: true,
          livePreview: true,
          trustSealGeneration: true,
          familyCollaboration: false,
          maxGuardians: 5,
          advancedValidation: true
        };
      default: // free
        return {
          mode: 'basic',
          aiAssistance: false,
          livePreview: false,
          trustSealGeneration: true, // Bronze/Silver only
          familyCollaboration: false,
          maxGuardians: 1,
          advancedValidation: false
        };
    }
  }, [userTier]);

  // State Management
  const [currentStep, setCurrentStep] = useState<WizardStep>('jurisdiction');
  const [focusMode, setFocusMode] = useState(false);
  const [willData, setWillData] = useState<Partial<WillFormData>>({
    assets: [],
    children: [],
    digitalAssets: []
  });
  const [selectedTemplate, setSelectedTemplate] = useState<WillTemplate | null>(null);
  const [generatedWill, setGeneratedWill] = useState<string>('');
  const [sofiaReview, setSofiaReview] = useState<SofiaResponse | null>(null);
  const [willGenerationResult, setWillGenerationResult] = useState<WillGenerationResult | null>(null);
  const [trustSeal, setTrustSeal] = useState<TrustSeal | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Sofia AI Router
  const [sofiaRouter] = useState(() => new SofiaAIRouter(process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''));

  // Steps configuration
  const steps = useMemo(() => [
    { id: 'jurisdiction' as WizardStep, title: 'Jurisdikcia', description: 'Vyberte právnu jurisdikciu' },
    { id: 'personal' as WizardStep, title: 'Osobné údaje', description: 'Zadajte vaše osobné informácie' },
    { id: 'marital' as WizardStep, title: 'Rodinný stav', description: 'Informácie o manželstve a deťoch' },
    { id: 'assets' as WizardStep, title: 'Majetok', description: 'Definujte váš majetok a dedičov' },
    { id: 'executors' as WizardStep, title: 'Vykonávatelia', description: 'Určite vykonávateľa závetu' },
    { id: 'review' as WizardStep, title: 'Kontrola', description: 'Skontrolujte všetky údaje' },
    { id: 'preview' as WizardStep, title: 'Náhľad', description: 'Živý náhľad závetu' },
    { id: 'complete' as WizardStep, title: 'Dokončenie', description: 'Finalizácia závetu' }
  ], []);

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Step validation
  const validateCurrentStep = useCallback((): boolean => {
    const errors: string[] = [];

    switch (currentStep) {
      case 'jurisdiction':
        if (!willData.jurisdiction) errors.push('Vyberte jurisdikciu');
        break;
      case 'personal':
        if (!willData.fullName) errors.push('Zadajte celé meno');
        if (!willData.birthDate) errors.push('Zadajte dátum narodenia');
        if (!willData.birthPlace) errors.push('Zadajte miesto narodenia');
        if (!willData.address) errors.push('Zadajte adresu');
        break;
      case 'marital':
        if (!willData.maritalStatus) errors.push('Vyberte rodinný stav');
        if (willData.maritalStatus === 'married' && !willData.spouseName) {
          errors.push('Zadajte meno manžela/manželky');
        }
        break;
      case 'assets':
        if (!willData.assets || willData.assets.length === 0) {
          errors.push('Pridajte aspoň jeden majetok');
        }
        break;
      case 'executors':
        if (!willData.executor?.name) errors.push('Zadajte meno vykonávateľa');
        if (!willData.executor?.address) errors.push('Zadajte adresu vykonávateľa');
        break;
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [currentStep, willData]);

  // Navigation
  const nextStep = useCallback(() => {
    if (validateCurrentStep()) {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setCurrentStep(steps[nextIndex].id);
      }
    }
  }, [currentStepIndex, steps, validateCurrentStep]);

  const prevStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  }, [currentStepIndex, steps]);

  // Update will data
  const updateWillData = useCallback((updates: Partial<WillFormData>) => {
    setWillData(prev => ({ ...prev, ...updates }));
  }, []);

  // Sofia AI Integration
  const requestSofiaReview = useCallback(async () => {
    if (!willData.jurisdiction || !willData.fullName) return;

    try {
      const command: SofiaCommand = {
        type: 'smart',
        action: 'legal_check',
        data: willData as WillFormData,
        estimatedCost: 0.02,
        userId: willData.fullName || 'unknown'
      };

      const response = await sofiaRouter.processCommand(command);
      setSofiaReview(response);
    } catch (error) {
      console.error('Sofia review error:', error);
    }
  }, [willData, sofiaRouter]);

  // Enhanced will generation with tier-based features
  const generateEnhancedWill = useCallback(async () => {
    if (!willData.jurisdiction) return;

    setIsGenerating(true);
    try {
      // Prepare complete will data for single-call generation
      const completeWillData: CompleteWillData = {
        ...willData as WillFormData,
        userTier,
        targetTrustLevel: userTier === 'family_edition' ? 'Platinum' :
                          userTier === 'paid' ? 'Gold' : 'Silver',
        jurisdiction: willData.jurisdiction as 'SK' | 'CZ' | 'AT' | 'DE' | 'PL',
        userId
      };

      if (tierFeatures.aiAssistance) {
        // Use enhanced single-call AI generation
        const command: SofiaCommand = {
          type: userTier === 'free' ? 'free' : 'premium',
          action: 'generate_will_single_call',
          data: completeWillData,
          estimatedCost: userTier === 'free' ? 0 : 0.05,
          userId
        };

        const response = await sofiaRouter.processCommand(command);

        if (response.type === 'will_generated' && response.willResult) {
          setWillGenerationResult(response.willResult);
          setGeneratedWill(response.willResult.willContent);
          setTrustSeal(response.willResult.trustSeal);
          setSofiaReview({
            type: 'response',
            content: `Závet úspešne vygenerovaný s ${response.willResult.trustSeal.level} Trust Seal (${response.willResult.confidenceScore}% dôveryhodnosť)`,
            cost: response.cost,
            tierUsed: response.tierUsed,
            suggestions: response.willResult.validationNotes
          });
        } else {
          // Fallback to template generation
          await generateTemplateWill();
        }
      } else {
        // Free tier: use template-based generation
        await generateTemplateWill();
      }
    } catch (error) {
      console.error('Enhanced will generation error:', error);
      await generateTemplateWill(); // Fallback
    } finally {
      setIsGenerating(false);
    }
  }, [willData, userTier, userId, tierFeatures.aiAssistance, sofiaRouter]);

  // Fallback template-based generation
  const generateTemplateWill = useCallback(async () => {
    try {
      // Get appropriate template for user tier
      const templates = getTemplatesByUserTier(willData.jurisdiction as string, userTier);
      const template = templates[0] || selectedTemplate;

      if (template) {
        const completeData = willData as WillFormData;
        const rendered = renderTemplate(template, completeData);
        setGeneratedWill(rendered);

        // Generate trust seal for template-based generation
        if (tierFeatures.trustSealGeneration) {
          const mockTrustSeal: TrustSeal = {
            id: crypto.randomUUID(),
            userId,
            documentId: crypto.randomUUID(),
            level: userTier === 'free' ? 'Bronze' : 'Silver',
            confidenceScore: userTier === 'free' ? 65 : 75,
            validations: {
              aiValidation: { score: 70, timestamp: new Date() },
              legalRulesCheck: { score: userTier === 'free' ? 60 : 80, issues: [] }
            },
            issuedAt: new Date(),
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            digitalSignature: btoa(`${userId}:template:${Date.now()}`)
          };

          setTrustSeal(mockTrustSeal);
        }

        // Request basic Sofia review for guided/expert modes
        if (tierFeatures.mode !== 'basic') {
          await requestSofiaReview();
        }
      }
    } catch (error) {
      console.error('Template generation error:', error);
    }
  }, [willData, userTier, userId, selectedTemplate, tierFeatures, requestSofiaReview]);

  // Backwards compatibility - Generate will preview
  const generatePreview = generateEnhancedWill;

  // Effect to select appropriate template
  useEffect(() => {
    if (willData.jurisdiction && willData.maritalStatus) {
      const templates = getTemplatesByJurisdiction(willData.jurisdiction);
      const scenario = willData.maritalStatus === 'married' && willData.hasChildren ? 'married' : 'single';
      const template = templates.find(t => t.scenario === scenario) || templates[0];
      setSelectedTemplate(template);
    }
  }, [willData.jurisdiction, willData.maritalStatus, willData.hasChildren]);

  // Effect to generate preview when reaching preview step
  useEffect(() => {
    if (currentStep === 'preview' && selectedTemplate) {
      generatePreview();
    }
  }, [currentStep, selectedTemplate, generatePreview]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'jurisdiction':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Vyberte právnu jurisdikciu</CardTitle>
              <CardDescription>
                Závet musí byť v súlade s právnymi predpismi krajiny, kde budete mať trvalý pobyt.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { code: 'SK', name: 'Slovensko', flag: '🇸🇰' },
                  { code: 'CZ', name: 'Česko', flag: '🇨🇿' },
                  { code: 'DE', name: 'Nemecko', flag: '🇩🇪' },
                  { code: 'EN', name: 'UK/USA', flag: '🇬🇧' }
                ].map((jurisdiction) => (
                  <Button
                    key={jurisdiction.code}
                    variant={willData.jurisdiction === jurisdiction.code ? 'default' : 'outline'}
                    className="h-16 flex flex-col"
                    onClick={() => updateWillData({ jurisdiction: jurisdiction.code as 'SK' | 'CZ' | 'DE' | 'EN' })}
                  >
                    <span className="text-2xl mb-1">{jurisdiction.flag}</span>
                    <span>{jurisdiction.name}</span>
                  </Button>
                ))}
              </div>
              {willData.jurisdiction && (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    Vybratá jurisdikcia: {willData.jurisdiction}. Závet bude vytvorený podľa miestnych zákonov.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        );

      case 'personal':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Osobné informácie</CardTitle>
              <CardDescription>
                Zadajte vaše základné osobné údaje potrebné pre závet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Celé meno *</Label>
                  <Input
                    id="fullName"
                    value={willData.fullName || ''}
                    onChange={(e) => updateWillData({ fullName: e.target.value })}
                    placeholder="Ján Novák"
                  />
                </div>
                <div>
                  <Label htmlFor="birthDate">Dátum narodenia *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={willData.birthDate || ''}
                    onChange={(e) => updateWillData({ birthDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="birthPlace">Miesto narodenia *</Label>
                <Input
                  id="birthPlace"
                  value={willData.birthPlace || ''}
                  onChange={(e) => updateWillData({ birthPlace: e.target.value })}
                  placeholder="Bratislava, Slovensko"
                />
              </div>
              <div>
                <Label htmlFor="address">Adresa trvalého pobytu *</Label>
                <Input
                  id="address"
                  value={willData.address || ''}
                  onChange={(e) => updateWillData({ address: e.target.value })}
                  placeholder="Hlavná 1, 811 01 Bratislava"
                />
              </div>
              <div>
                <Label htmlFor="citizenship">Štátne občianstvo</Label>
                <Input
                  id="citizenship"
                  value={willData.citizenship || ''}
                  onChange={(e) => updateWillData({ citizenship: e.target.value })}
                  placeholder="Slovenská republika"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'marital':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Rodinný stav a deti</CardTitle>
              <CardDescription>
                Tieto informácie ovplyvnia štruktúru vášho závetu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Rodinný stav *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { value: 'single', label: 'Slobodný/á' },
                    { value: 'married', label: 'Ženatý/Vydatá' },
                    { value: 'divorced', label: 'Rozvedený/á' },
                    { value: 'widowed', label: 'Ovdovelý/á' }
                  ].map((status) => (
                    <Button
                      key={status.value}
                      variant={willData.maritalStatus === status.value ? 'default' : 'outline'}
                      onClick={() => updateWillData({ maritalStatus: status.value as 'single' | 'married' | 'divorced' | 'widowed' })}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>

              {willData.maritalStatus === 'married' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="spouseName">Meno manžela/manželky *</Label>
                    <Input
                      id="spouseName"
                      value={willData.spouseName || ''}
                      onChange={(e) => updateWillData({ spouseName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="spouseBirthDate">Dátum narodenia</Label>
                    <Input
                      id="spouseBirthDate"
                      type="date"
                      value={willData.spouseBirthDate || ''}
                      onChange={(e) => updateWillData({ spouseBirthDate: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Máte deti?</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={willData.hasChildren === true ? 'default' : 'outline'}
                    onClick={() => updateWillData({ hasChildren: true })}
                  >
                    Áno
                  </Button>
                  <Button
                    variant={willData.hasChildren === false ? 'default' : 'outline'}
                    onClick={() => updateWillData({ hasChildren: false })}
                  >
                    Nie
                  </Button>
                </div>
              </div>

              {willData.hasChildren && (
                <div>
                  <Label>Deti</Label>
                  <div className="space-y-2 mt-2">
                    {willData.children?.map((child, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Meno dieťaťa"
                          value={child.name}
                          onChange={(e) => {
                            const newChildren = [...(willData.children || [])];
                            newChildren[index] = { ...child, name: e.target.value };
                            updateWillData({ children: newChildren });
                          }}
                        />
                        <Input
                          type="date"
                          value={child.birthDate}
                          onChange={(e) => {
                            const newChildren = [...(willData.children || [])];
                            newChildren[index] = { ...child, birthDate: e.target.value };
                            updateWillData({ children: newChildren });
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newChildren = willData.children?.filter((_, i) => i !== index);
                            updateWillData({ children: newChildren });
                          }}
                        >
                          Odstrániť
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newChildren = [...(willData.children || []), { name: '', birthDate: '', relationship: 'son' as const }];
                        updateWillData({ children: newChildren });
                      }}
                    >
                      Pridať dieťa
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'assets':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Majetok a dedičstvo</CardTitle>
              <CardDescription>
                Definujte váš majetok a určite, kto ho zdedí.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {willData.assets?.map((asset, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Majetok #{index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newAssets = willData.assets?.filter((_, i) => i !== index);
                        updateWillData({ assets: newAssets });
                      }}
                    >
                      Odstrániť
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Typ majetku</Label>
                      <select
                        className="w-full p-2 border rounded"
                        value={asset.type}
                        onChange={(e) => {
                          const newAssets = [...(willData.assets || [])];
                          newAssets[index] = { ...asset, type: e.target.value as 'property' | 'financial' | 'personal' | 'business' };
                          updateWillData({ assets: newAssets });
                        }}
                      >
                        <option value="property">Nehnuteľnosť</option>
                        <option value="financial">Finančné prostriedky</option>
                        <option value="personal">Osobné veci</option>
                        <option value="business">Podnikanie</option>
                      </select>
                    </div>
                    <div>
                      <Label>Dedič</Label>
                      <Input
                        value={asset.beneficiary}
                        onChange={(e) => {
                          const newAssets = [...(willData.assets || [])];
                          newAssets[index] = { ...asset, beneficiary: e.target.value };
                          updateWillData({ assets: newAssets });
                        }}
                        placeholder="Meno dediča"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Popis majetku</Label>
                    <Textarea
                      value={asset.description}
                      onChange={(e) => {
                        const newAssets = [...(willData.assets || [])];
                        newAssets[index] = { ...asset, description: e.target.value };
                        updateWillData({ assets: newAssets });
                      }}
                      placeholder="Detailný popis majetku..."
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  const newAssets = [...(willData.assets || []), {
                    type: 'property' as const,
                    description: '',
                    beneficiary: ''
                  }];
                  updateWillData({ assets: newAssets });
                }}
              >
                Pridať majetok
              </Button>
            </CardContent>
          </Card>
        );

      case 'executors':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Vykonávatelia závetu</CardTitle>
              <CardDescription>
                Určite osobu, ktorá bude vykonávať váš závet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Hlavný vykonávateľ *</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="executorName">Meno *</Label>
                    <Input
                      id="executorName"
                      value={willData.executor?.name || ''}
                      onChange={(e) => updateWillData({
                        executor: { ...willData.executor, name: e.target.value, address: willData.executor?.address || '', relationship: willData.executor?.relationship || '' }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="executorAddress">Adresa *</Label>
                    <Input
                      id="executorAddress"
                      value={willData.executor?.address || ''}
                      onChange={(e) => updateWillData({
                        executor: { ...willData.executor, name: willData.executor?.name || '', address: e.target.value, relationship: willData.executor?.relationship || '' }
                      })}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Label htmlFor="executorRelationship">Vzťah k vám</Label>
                  <Input
                    id="executorRelationship"
                    value={willData.executor?.relationship || ''}
                    onChange={(e) => updateWillData({
                      executor: { ...willData.executor, name: willData.executor?.name || '', address: willData.executor?.address || '', relationship: e.target.value }
                    })}
                    placeholder="napr. manžel/ka, syn/dcéra, priateľ"
                  />
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Náhradný vykonávateľ (odporúčané)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="altExecutorName">Meno</Label>
                    <Input
                      id="altExecutorName"
                      value={willData.alternateExecutor?.name || ''}
                      onChange={(e) => updateWillData({
                        alternateExecutor: { ...willData.alternateExecutor, name: e.target.value, address: willData.alternateExecutor?.address || '', relationship: willData.alternateExecutor?.relationship || '' }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="altExecutorAddress">Adresa</Label>
                    <Input
                      id="altExecutorAddress"
                      value={willData.alternateExecutor?.address || ''}
                      onChange={(e) => updateWillData({
                        alternateExecutor: { ...willData.alternateExecutor, name: willData.alternateExecutor?.name || '', address: e.target.value, relationship: willData.alternateExecutor?.relationship || '' }
                      })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'review':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Kontrola údajov</CardTitle>
              <CardDescription>
                Skontrolujte všetky zadané informácie pred vytvorením závetu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal">Osobné</TabsTrigger>
                  <TabsTrigger value="family">Rodina</TabsTrigger>
                  <TabsTrigger value="assets">Majetok</TabsTrigger>
                  <TabsTrigger value="executors">Vykonávatelia</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-2">
                  <div><strong>Meno:</strong> {willData.fullName}</div>
                  <div><strong>Narodenie:</strong> {willData.birthDate} v {willData.birthPlace}</div>
                  <div><strong>Adresa:</strong> {willData.address}</div>
                  <div><strong>Jurisdikcia:</strong> {willData.jurisdiction}</div>
                </TabsContent>

                <TabsContent value="family" className="space-y-2">
                  <div><strong>Rodinný stav:</strong> {willData.maritalStatus}</div>
                  {willData.spouseName && <div><strong>Manžel/ka:</strong> {willData.spouseName}</div>}
                  <div><strong>Deti:</strong> {willData.hasChildren ? willData.children?.map(c => c.name).join(', ') || 'Zadané' : 'Žiadne'}</div>
                </TabsContent>

                <TabsContent value="assets" className="space-y-2">
                  {willData.assets?.map((asset, i) => (
                    <div key={i} className="p-2 bg-gray-50 rounded">
                      <div><strong>{asset.type}:</strong> {asset.description}</div>
                      <div><strong>Dedič:</strong> {asset.beneficiary}</div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="executors" className="space-y-2">
                  <div><strong>Vykonávateľ:</strong> {willData.executor?.name} ({willData.executor?.address})</div>
                  {willData.alternateExecutor?.name && (
                    <div><strong>Náhradný:</strong> {willData.alternateExecutor.name} ({willData.alternateExecutor.address})</div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        );

      case 'preview':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Živý náhľad závetu
                </CardTitle>
                <CardDescription>
                  Toto je vaš závet v konečnej forme. Skontrolujte ho pred dokončením.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setFocusMode(!focusMode)}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Režim sústredenia
                  </Button>
                  {selectedTemplate && (
                    <Badge variant="secondary">
                      {selectedTemplate.costTier} tier
                    </Badge>
                  )}
                </div>

                <ScrollArea className={`${focusMode ? 'h-96' : 'h-64'} border rounded-lg p-4 bg-white`}>
                  {isGenerating ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                        <p>Generujem závet...</p>
                      </div>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">
                      {generatedWill}
                    </pre>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {sofiaReview && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Kontrola od Sofie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className={sofiaReview.type === 'error' ? 'border-red-500' : 'border-green-500'}>
                    {sofiaReview.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    <AlertDescription className="whitespace-pre-wrap">
                      {sofiaReview.content}
                    </AlertDescription>
                  </Alert>
                  {sofiaReview.suggestions && sofiaReview.suggestions.length > 0 && (
                    <div className="mt-3">
                      <h4 className="font-medium mb-2">Odporúčania:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {sofiaReview.suggestions.map((suggestion, i) => (
                          <li key={i}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'complete':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Závet je pripravený
              </CardTitle>
              <CardDescription>
                Váš závet bol úspešne vytvorený. Môžete ho teraz stiahnuť a vytlačiť.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Nezabudnite závet podpísať vlastnoručne a nechať ho úradne overiť podľa zákonov vašej krajiny.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button
                  onClick={() => onComplete(willData as WillFormData, generatedWill, trustSeal || undefined)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Stiahnuť PDF
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep('preview')}>
                  Zobraziť náhľad
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return <div>Neznámy krok</div>;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Sprievodca poslednou vôľou</h1>
          <Badge variant="outline">
            Krok {currentStepIndex + 1} z {steps.length}
          </Badge>
        </div>

        <Progress value={progress} className="mb-2" />

        <div className="flex justify-between text-sm text-gray-600">
          <span>{steps[currentStepIndex]?.title}</span>
          <span>{Math.round(progress)}% dokončené</span>
        </div>

        <p className="text-sm text-gray-500 mt-1">
          {steps[currentStepIndex]?.description}
        </p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert className="mb-6 border-red-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">Opravte prosím nasledujúce chyby:</div>
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Späť
        </Button>

        <div className="flex gap-2">
          {currentStep === 'complete' ? (
            <Button
              onClick={() => onComplete(willData as WillFormData, generatedWill, trustSeal || undefined)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Dokončiť
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={currentStepIndex === steps.length - 1}
              className="flex items-center gap-2"
            >
              Ďalej
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}