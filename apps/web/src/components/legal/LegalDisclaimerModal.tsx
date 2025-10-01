'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Shield,
  Scale,
  FileText,
  Eye,
  Lock,
  Info
} from 'lucide-react';

interface LegalDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  jurisdiction: 'SK' | 'CZ' | 'AT' | 'DE' | 'PL';
  mode: 'will_generation' | 'ai_processing' | 'data_sharing';
}

interface DisclaimerContent {
  title: string;
  warnings: string[];
  requirements: string[];
  responsibilities: string[];
  dataProcessing: string[];
}

const DISCLAIMER_CONTENT: Record<string, DisclaimerContent> = {
  'SK': {
    title: 'Právne upozornenie - Slovenská republika',
    warnings: [
      'Tento nástroj neposkytuje právne poradenstvo a nenahrádzá konzultáciu s kvalifikovaným právnikom',
      'Automaticky generované dokumenty slúžia len ako návrh a nemusia spĺňať všetky právne požiadavky',
      'Platnosť závetu závisí od dodržania formálnych požiadaviek podľa slovenského práva',
      'LegacyGuard nezodpovedá za právne následky použitia týchto dokumentov',
      'Pri významnom majetku alebo zložitých rodinných pomeroch odporúčame konzultáciu s notárom'
    ],
    requirements: [
      'Závet musí byť napísaný vlastnou rukou (holografický závet)',
      'Alebo podpísaný pred dvoma svedkami (svedčený závet)',
      'Testátor musí byť spôsobilý na právne úkony',
      'Závet nesmie porušovať zákonné dedičstvo oprávnených dedičov',
      'Závet možno kedykoľvek odvolať alebo zmeniť'
    ],
    responsibilities: [
      'Používateľ je zodpovedný za overenie správnosti všetkých údajov',
      'Používateľ musí zabezpečiť súlad s platnou legislatívou',
      'Používateľ by mal pravidelně aktualizovať závet podľa zmien v živote',
      'Používateľ je zodpovedný za bezpečné uloženie originálu závetu'
    ],
    dataProcessing: [
      'Vaše osobné údaje sú spracovávané v súlade s GDPR',
      'Údaje použijeme len na generovanie právnych dokumentov',
      'AI spracovanie prebieha cez šifrované pripojenie',
      'Môžete kedykoľvek požiadať o vymazanie svojich údajov',
      'Nezdieľame vaše údaje s tretími stranami bez súhlasu'
    ]
  },
  'CZ': {
    title: 'Právní upozornění - Česká republika',
    warnings: [
      'Tento nástroj neposkytuje právní poradenství a nenahrazuje konzultaci s kvalifikovaným právníkem',
      'Automaticky generované dokumenty slouží pouze jako návrh a nemusí splňovat všechny právní požadavky',
      'Platnost závěti závisí na dodržení formálních požadavků podle českého práva',
      'LegacyGuard neodpovídá za právní důsledky použití těchto dokumentů',
      'Při významném majetku nebo složitých rodinných poměrech doporučujeme konzultaci s notářem'
    ],
    requirements: [
      'Závěť musí být napsána vlastní rukou (vlastnoruční závěť)',
      'Nebo podepsána před dvěma svědky (závěť se svědky)',
      'Zůstavitel musí být způsobilý k právním úkonům',
      'Závěť nesmí porušovat zákonné dědictví oprávněných dědiců',
      'Závěť lze kdykoliv odvolat nebo změnit'
    ],
    responsibilities: [
      'Uživatel je odpovědný za ověření správnosti všech údajů',
      'Uživatel musí zajistit soulad s platnou legislativou',
      'Uživatel by měl pravidelně aktualizovat závěť podle změn v životě',
      'Uživatel je odpovědný za bezpečné uložení originálu závěti'
    ],
    dataProcessing: [
      'Vaše osobní údaje jsou zpracovávány v souladu s GDPR',
      'Údaje použijeme pouze na generování právních dokumentů',
      'AI zpracování probíhá přes šifrované připojení',
      'Můžete kdykoliv požádat o vymazání svých údajů',
      'Nesdílíme vaše údaje s třetími stranami bez souhlasu'
    ]
  }
};

export function LegalDisclaimerModal({
  isOpen,
  onClose,
  onAccept,
  jurisdiction,
  mode
}: LegalDisclaimerModalProps) {
  const [acceptedWarnings, setAcceptedWarnings] = useState(false);
  const [acceptedRequirements, setAcceptedRequirements] = useState(false);
  const [acceptedDataProcessing, setAcceptedDataProcessing] = useState(false);
  const [hasReadAll, setHasReadAll] = useState(false);

  const content = DISCLAIMER_CONTENT[jurisdiction] || DISCLAIMER_CONTENT['SK'];
  const canProceed = acceptedWarnings && acceptedRequirements && acceptedDataProcessing && hasReadAll;

  const handleAccept = () => {
    if (canProceed) {
      // Track legal disclaimer acceptance
      trackDisclaimerAcceptance(jurisdiction, mode);
      onAccept();
    }
  };

  const getModeSpecificContent = () => {
    switch (mode) {
      case 'ai_processing':
        return {
          title: 'AI Spracovanie údajov',
          description: 'Vaše údaje budú odoslané na AI službu na generovanie dokumentov.',
          icon: <Shield className="h-5 w-5" />
        };
      case 'data_sharing':
        return {
          title: 'Zdieľanie dokumentov',
          description: 'Dokumenty budú sprístupnené vybraným členom rodiny.',
          icon: <Lock className="h-5 w-5" />
        };
      default:
        return {
          title: 'Generovanie závetu',
          description: 'Budú vytvorené právne dokumenty na základe vašich údajov.',
          icon: <FileText className="h-5 w-5" />
        };
    }
  };

  const modeContent = getModeSpecificContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {modeContent.icon}
            {modeContent.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode-specific alert */}
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="font-medium mb-1">{modeContent.title}</div>
              <div className="text-sm">{modeContent.description}</div>
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="warnings" className="h-96">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="warnings" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Varovania
              </TabsTrigger>
              <TabsTrigger value="requirements" className="flex items-center gap-1">
                <Scale className="h-3 w-3" />
                Požiadavky
              </TabsTrigger>
              <TabsTrigger value="responsibilities" className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Zodpovednosti
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                GDPR
              </TabsTrigger>
            </TabsList>

            <TabsContent value="warnings" className="h-80">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Dôležité upozornenia
                  </h4>
                  <ul className="space-y-2">
                    {content.warnings.map((warning, index) => (
                      <li key={index} className="flex gap-2 text-sm">
                        <span className="text-red-500 font-bold">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center space-x-2 mt-4 p-3 bg-red-50 rounded-lg">
                    <Checkbox
                      id="accept-warnings"
                      checked={acceptedWarnings}
                      onCheckedChange={setAcceptedWarnings}
                    />
                    <label
                      htmlFor="accept-warnings"
                      className="text-sm font-medium text-red-800 cursor-pointer"
                    >
                      Čítal som a rozumiem všetkým varovaniam
                    </label>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="requirements" className="h-80">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Právne požiadavky ({jurisdiction})
                  </h4>
                  <ul className="space-y-2">
                    {content.requirements.map((requirement, index) => (
                      <li key={index} className="flex gap-2 text-sm">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center space-x-2 mt-4 p-3 bg-blue-50 rounded-lg">
                    <Checkbox
                      id="accept-requirements"
                      checked={acceptedRequirements}
                      onCheckedChange={setAcceptedRequirements}
                    />
                    <label
                      htmlFor="accept-requirements"
                      className="text-sm font-medium text-blue-800 cursor-pointer"
                    >
                      Zaväzujem sa dodržiavať právne požiadavky
                    </label>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="responsibilities" className="h-80">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Zodpovednosti používateľa
                  </h4>
                  <ul className="space-y-2">
                    {content.responsibilities.map((responsibility, index) => (
                      <li key={index} className="flex gap-2 text-sm">
                        <span className="text-gray-500 font-bold">•</span>
                        <span>{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="data" className="h-80">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-700 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Ochrana osobných údajov (GDPR)
                  </h4>
                  <ul className="space-y-2">
                    {content.dataProcessing.map((item, index) => (
                      <li key={index} className="flex gap-2 text-sm">
                        <span className="text-green-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center space-x-2 mt-4 p-3 bg-green-50 rounded-lg">
                    <Checkbox
                      id="accept-data"
                      checked={acceptedDataProcessing}
                      onCheckedChange={setAcceptedDataProcessing}
                    />
                    <label
                      htmlFor="accept-data"
                      className="text-sm font-medium text-green-800 cursor-pointer"
                    >
                      Súhlasím so spracovaním osobných údajov
                    </label>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Final confirmation */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                id="read-all"
                checked={hasReadAll}
                onCheckedChange={setHasReadAll}
              />
              <label
                htmlFor="read-all"
                className="text-sm font-medium cursor-pointer"
              >
                Prečítal som si všetky sekcie a rozumiem právnym implikáciám
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Zrušiť
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!canProceed}
            className="bg-green-600 hover:bg-green-700"
          >
            {canProceed ? (
              'Súhlasím a pokračujem'
            ) : (
              'Prečítajte a potvrďte všetky sekcie'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Compliance tracking utilities
async function trackDisclaimerAcceptance(
  jurisdiction: string,
  mode: string
): Promise<void> {
  try {
    const { supabase } = await import('@/lib/supabase');

    await supabase.from('audit_logs').insert({
      action: 'legal_disclaimer_accepted',
      resource_type: 'compliance',
      new_values: {
        jurisdiction,
        mode,
        timestamp: new Date().toISOString(),
        version: '1.0' // Track disclaimer version
      }
    });
  } catch (error) {
    console.error('Failed to track disclaimer acceptance:', error);
  }
}

// Hook for easy disclaimer integration
export function useLegalDisclaimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    jurisdiction: 'SK' | 'CZ' | 'AT' | 'DE' | 'PL';
    mode: 'will_generation' | 'ai_processing' | 'data_sharing';
    onAccept: () => void;
  }>({
    jurisdiction: 'SK',
    mode: 'will_generation',
    onAccept: () => {}
  });

  const showDisclaimer = (
    jurisdiction: 'SK' | 'CZ' | 'AT' | 'DE' | 'PL',
    mode: 'will_generation' | 'ai_processing' | 'data_sharing',
    onAccept: () => void
  ) => {
    setConfig({ jurisdiction, mode, onAccept });
    setIsOpen(true);
  };

  const hideDisclaimer = () => {
    setIsOpen(false);
  };

  const DisclaimerModal = () => (
    <LegalDisclaimerModal
      isOpen={isOpen}
      onClose={hideDisclaimer}
      onAccept={() => {
        config.onAccept();
        hideDisclaimer();
      }}
      jurisdiction={config.jurisdiction}
      mode={config.mode}
    />
  );

  return {
    showDisclaimer,
    hideDisclaimer,
    DisclaimerModal
  };
}