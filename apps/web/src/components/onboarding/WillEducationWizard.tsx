'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Scale,
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Play,
  FileText,
  Heart,
  Award,
  Info,
  AlertTriangle
} from 'lucide-react';

interface EducationStep {
  id: string;
  title: string;
  content: string;
  interactive?: React.ReactNode;
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  };
}

interface WillEducationWizardProps {
  onComplete?: () => void;
  jurisdiction?: 'SK' | 'CZ' | 'AT' | 'DE' | 'PL';
  className?: string;
}

export function WillEducationWizard({
  onComplete,
  jurisdiction = 'SK',
  className
}: WillEducationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, number>>(new Map());
  const [showQuizFeedback, setShowQuizFeedback] = useState(false);

  const steps: EducationStep[] = [
    {
      id: 'what-is-will',
      title: 'Čo je závet?',
      content: `Závet je právny dokument, ktorým môžete určiť, ako sa má rozdeliť váš majetok po smrti.
      Je to váš posledný prejav vôle, ktorý zabezpečuje, že vaše želania budú rešpektované.`,
      quiz: {
        question: 'Čo je hlavným účelom závetu?',
        options: [
          'Určiť, kto zdedí váš majetok',
          'Zaplatiť dane',
          'Zaregistrovať sa u notára',
          'Iba pre bohatých ľudí'
        ],
        correctAnswer: 0,
        explanation: 'Závet slúži predovšetkým na určenie dedičov a rozdelenie majetku podľa vašich predstáv.'
      },
      interactive: <WillBasicsDemo />
    },
    {
      id: 'legal-requirements',
      title: 'Právne požiadavky',
      content: `Každá jurisdikcia má špecifické požiadavky na platnosť závetu. V ${getJurisdictionName(jurisdiction)}
      musí závet spĺňať určité formálne kritériá, aby bol právne platný.`,
      quiz: {
        question: jurisdiction === 'SK'
          ? 'Aké sú hlavné typy závetov na Slovensku?'
          : 'Jaké jsou hlavní typy závětí v České republice?',
        options: [
          'Holografický a svedčený',
          'Elektronický a papierový',
          'Súkromný a verejný',
          'Ústny a písomný'
        ],
        correctAnswer: 0,
        explanation: jurisdiction === 'SK'
          ? 'Na Slovensku rozoznávame holografický (vlastnoručný) a svedčený závet.'
          : 'V České republice máme vlastnoruční a závěť se svědky.'
      },
      interactive: <JurisdictionSelector jurisdiction={jurisdiction} />
    },
    {
      id: 'trust-seal-system',
      title: 'Trust Seal systém',
      content: `Náš Trust Seal vám pomôže posúdiť kvalitu a spoľahlivosť vášho závetu.
      Systém analyzuje váš dokument a prideľuje mu jednu zo štyroch úrovní dôvery.`,
      interactive: <TrustSealDemo />
    },
    {
      id: 'family-protection',
      title: 'Ochrana rodiny',
      content: `Závet nie je len o majetku - je to o ochrane vašej rodiny. Môžete určiť poručníkov
      pre maloletké deti, vykonávateľa závetu a zabezpečiť, aby vaša rodina bola chránená.`,
      quiz: {
        question: 'Prečo je dôležité určiť poručníka pre maloletké deti?',
        options: [
          'Je to povinné zo zákona',
          'Zabezpečuje starostlivosť o deti po vašej smrti',
          'Znižuje dane',
          'Urýchľuje dedičské konanie'
        ],
        correctAnswer: 1,
        explanation: 'Poručník zabezpečí starostlivosť a výchovu vašich detí, ak sa im niečo stane.'
      },
      interactive: <FamilyProtectionDemo />
    },
    {
      id: 'digital-age-wills',
      title: 'Závety v digitálnom veku',
      content: `Moderné závety musia riešiť aj digitálne aktíva - sociálne siete, kryptomeny,
      online účty. LegacyGuard vám pomôže zahrnúť aj tieto moderné formy majetku.`,
      interactive: <DigitalAssetsDemo />
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
      setShowQuizFeedback(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setShowQuizFeedback(false);
    }
  };

  const handleQuizAnswer = (stepIndex: number, answerIndex: number) => {
    setQuizAnswers(prev => new Map(prev.set(stepIndex, answerIndex)));
    setShowQuizFeedback(true);
  };

  const handleComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    onComplete?.();
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const userAnswer = quizAnswers.get(currentStep);
  const isQuizCorrect = currentStepData.quiz && userAnswer === currentStepData.quiz.correctAnswer;

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Will Education Wizard</h1>
        </div>
        <p className="text-gray-600">
          Naučte sa základy tvorby závetov a ochrany rodinného dedičstva
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span>Pokrok</span>
          <span>{currentStep + 1} z {steps.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
              {currentStep + 1}
            </span>
            {currentStepData.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content */}
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {currentStepData.content}
            </p>
          </div>

          {/* Interactive Component */}
          {currentStepData.interactive && (
            <div className="border rounded-lg p-4 bg-gray-50">
              {currentStepData.interactive}
            </div>
          )}

          {/* Quiz */}
          {currentStepData.quiz && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Kvíz: {currentStepData.quiz.question}
              </h4>
              <div className="space-y-2 mb-4">
                {currentStepData.quiz.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={userAnswer === index ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleQuizAnswer(currentStep, index)}
                  >
                    <span className="mr-2 font-bold">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </Button>
                ))}
              </div>

              {showQuizFeedback && (
                <Alert className={isQuizCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <div className="flex items-center gap-2">
                    {isQuizCorrect ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`font-medium ${isQuizCorrect ? 'text-green-800' : 'text-red-800'}`}>
                      {isQuizCorrect ? 'Správne!' : 'Nesprávne'}
                    </span>
                  </div>
                  <AlertDescription className={isQuizCorrect ? 'text-green-700' : 'text-red-700'}>
                    {currentStepData.quiz.explanation}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Späť
        </Button>

        <div className="flex gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === currentStep
                  ? 'bg-blue-600'
                  : completedSteps.has(index)
                  ? 'bg-green-600'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {isLastStep ? (
          <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Dokončiť
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Ďalej
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Completion Stats */}
      {completedSteps.size > 0 && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">
              Dokončili ste {completedSteps.size} z {steps.length} krokov
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Interactive components for education steps
function WillBasicsDemo() {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Základné komponenty závetu:</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 border rounded bg-white">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Dedičia</span>
          </div>
          <p className="text-sm text-gray-600">
            Osoby, ktoré zdedia váš majetok
          </p>
        </div>
        <div className="p-3 border rounded bg-white">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Vykonávateľ</span>
          </div>
          <p className="text-sm text-gray-600">
            Osoba, ktorá zabezpečí vykonanie závetu
          </p>
        </div>
        <div className="p-3 border rounded bg-white">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Majetok</span>
          </div>
          <p className="text-sm text-gray-600">
            Čo chcete zanechať a komu
          </p>
        </div>
        <div className="p-3 border rounded bg-white">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Osobné želania</span>
          </div>
          <p className="text-sm text-gray-600">
            Pohrebné želania a ostatné pokyny
          </p>
        </div>
      </div>
    </div>
  );
}

function JurisdictionSelector({ jurisdiction }: { jurisdiction: string }) {
  const jurisdictionInfo = {
    'SK': {
      name: 'Slovensko',
      requirements: [
        'Holografický závet - vlastnou rukou',
        'Svedčený závet - 2 svedkovia',
        'Verejný závet - u notára'
      ]
    },
    'CZ': {
      name: 'Česko',
      requirements: [
        'Vlastnoruční závěť - vlastní rukou',
        'Závěť se svědky - 2 svědkové',
        'Veřejná závěť - u notáře'
      ]
    }
  };

  const info = jurisdictionInfo[jurisdiction as keyof typeof jurisdictionInfo] || jurisdictionInfo.SK;

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Typy závetov v jurisdikcii: {info.name}</h4>
      <div className="space-y-2">
        {info.requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">{req}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustSealDemo() {
  const levels = [
    { name: 'Bronze', color: 'orange', score: '0-40%', description: 'Základná validácia' },
    { name: 'Silver', color: 'gray', score: '41-70%', description: 'Dobrá validácia' },
    { name: 'Gold', color: 'yellow', score: '71-90%', description: 'Vysoká kvalita' },
    { name: 'Platinum', color: 'purple', score: '91-100%', description: 'Profesionálne overené' }
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Úrovne Trust Seal:</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {levels.map((level) => (
          <div key={level.name} className="p-3 border rounded bg-white">
            <div className="flex items-center gap-2 mb-2">
              <Shield className={`h-4 w-4 text-${level.color}-600`} />
              <span className="font-medium">{level.name}</span>
              <Badge variant="outline" className="text-xs">{level.score}</Badge>
            </div>
            <p className="text-sm text-gray-600">{level.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FamilyProtectionDemo() {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Ochrana vašej rodiny:</h4>
      <div className="space-y-3">
        <div className="p-3 border rounded bg-white">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Poručník pre deti</span>
          </div>
          <p className="text-sm text-gray-600">
            Určte, kto sa postará o vaše maloletné deti
          </p>
        </div>
        <div className="p-3 border rounded bg-white">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Vykonávateľ závetu</span>
          </div>
          <p className="text-sm text-gray-600">
            Dôveryhodná osoba, ktorá zabezpečí splnenie vašich želaní
          </p>
        </div>
        <div className="p-3 border rounded bg-white">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Núdzové kontakty</span>
          </div>
          <p className="text-sm text-gray-600">
            Systém upozornení pre prípad krízy
          </p>
        </div>
      </div>
    </div>
  );
}

function DigitalAssetsDemo() {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Moderné digitálne aktíva:</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 border rounded bg-white">
          <span className="font-medium">💻 Online účty</span>
          <p className="text-sm text-gray-600 mt-1">
            Sociálne siete, email, cloud storage
          </p>
        </div>
        <div className="p-3 border rounded bg-white">
          <span className="font-medium">💰 Kryptomeny</span>
          <p className="text-sm text-gray-600 mt-1">
            Bitcoin, Ethereum a iné digitálne meny
          </p>
        </div>
        <div className="p-3 border rounded bg-white">
          <span className="font-medium">🎵 Digitálny obsah</span>
          <p className="text-sm text-gray-600 mt-1">
            Fotky, videá, hudba, dokumenty
          </p>
        </div>
        <div className="p-3 border rounded bg-white">
          <span className="font-medium">💼 Online biznis</span>
          <p className="text-sm text-gray-600 mt-1">
            Domény, weby, online príjmy
          </p>
        </div>
      </div>
    </div>
  );
}

function getJurisdictionName(jurisdiction: string): string {
  const names = {
    'SK': 'na Slovensku',
    'CZ': 'v Česku',
    'AT': 'v Rakúsku',
    'DE': 'v Nemecku',
    'PL': 'v Poľsku'
  };
  return names[jurisdiction as keyof typeof names] || 'na Slovensku';
}