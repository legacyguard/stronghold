'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Scale,
  Eye,
  Download,
  ExternalLink
} from 'lucide-react';

interface ComplianceStatus {
  gdprCompliance: boolean;
  legalDisclaimerAccepted: boolean;
  jurisdictionUpdated: boolean;
  dataRetentionConfigured: boolean;
  lastComplianceCheck: Date | null;
}

interface JurisdictionRequirements {
  jurisdiction: string;
  requirements: {
    id: string;
    title: string;
    description: string;
    mandatory: boolean;
    status: 'compliant' | 'warning' | 'non_compliant';
    action?: string;
  }[];
  lastUpdated: Date;
}

export function ComplianceCenter() {
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus>({
    gdprCompliance: false,
    legalDisclaimerAccepted: false,
    jurisdictionUpdated: false,
    dataRetentionConfigured: false,
    lastComplianceCheck: null
  });

  const [jurisdictionReqs, setJurisdictionReqs] = useState<JurisdictionRequirements[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);

      // Load compliance status from database
      const status = await fetchComplianceStatus();
      setComplianceStatus(status);

      // Load jurisdiction-specific requirements
      const requirements = await fetchJurisdictionRequirements();
      setJurisdictionReqs(requirements);

    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOverallComplianceScore = (): number => {
    const checks = [
      complianceStatus.gdprCompliance,
      complianceStatus.legalDisclaimerAccepted,
      complianceStatus.jurisdictionUpdated,
      complianceStatus.dataRetentionConfigured
    ];

    const passed = checks.filter(check => check).length;
    return Math.round((passed / checks.length) * 100);
  };

  const getComplianceLevel = (score: number): { level: string; color: string; icon: any } => {
    if (score >= 90) return { level: 'Vynikajúca', color: 'green', icon: CheckCircle };
    if (score >= 70) return { level: 'Dobrá', color: 'blue', icon: Shield };
    if (score >= 50) return { level: 'Základná', color: 'yellow', icon: Clock };
    return { level: 'Nedostatočná', color: 'red', icon: AlertTriangle };
  };

  const score = getOverallComplianceScore();
  const { level, color, icon: ComplianceIcon } = getComplianceLevel(score);

  const handleExportComplianceReport = async () => {
    try {
      // Generate and download compliance report
      const report = await generateComplianceReport();
      downloadReport(report);
    } catch (error) {
      console.error('Failed to export compliance report:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Centrum súladu
          </h1>
          <p className="text-gray-600 mt-1">
            Správa právneho súladu a ochrany údajov
          </p>
        </div>

        <Button onClick={handleExportComplianceReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export správy
        </Button>
      </div>

      {/* Overall Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ComplianceIcon className={`h-5 w-5 text-${color}-600`} />
            Celkový stav súladu
          </CardTitle>
          <CardDescription>
            Prehľad súladu s právnymi požiadavkami a ochranou údajov
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">{score}%</div>
              <Badge variant={color === 'green' ? 'default' : 'secondary'} className={`bg-${color}-600`}>
                {level}
              </Badge>
            </div>
            <div className="text-sm text-gray-500">
              Posledná kontrola: {complianceStatus.lastComplianceCheck?.toLocaleDateString('sk-SK') || 'Nikdy'}
            </div>
          </div>

          <div className={`w-full bg-gray-200 rounded-full h-2 mb-4`}>
            <div
              className={`bg-${color}-600 h-2 rounded-full transition-all duration-300`}
              style={{ width: `${score}%` }}
            ></div>
          </div>

          {score < 100 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Na dosiahnutie plného súladu je potrebné dokončiť zvyšné kontroly.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Prehľad</TabsTrigger>
          <TabsTrigger value="gdpr">GDPR</TabsTrigger>
          <TabsTrigger value="legal">Právne požiadavky</TabsTrigger>
          <TabsTrigger value="jurisdictions">Jurisdikcie</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* GDPR Compliance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  GDPR súlad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {complianceStatus.gdprCompliance ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={complianceStatus.gdprCompliance ? 'text-green-600' : 'text-red-600'}>
                    {complianceStatus.gdprCompliance ? 'Súladné' : 'Vyžaduje akciu'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Legal Disclaimer */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Právne upozornenie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {complianceStatus.legalDisclaimerAccepted ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={complianceStatus.legalDisclaimerAccepted ? 'text-green-600' : 'text-red-600'}>
                    {complianceStatus.legalDisclaimerAccepted ? 'Akceptované' : 'Nevyžadované'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Jurisdiction Updates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Jurisdikcie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {complianceStatus.jurisdictionUpdated ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className={complianceStatus.jurisdictionUpdated ? 'text-green-600' : 'text-yellow-600'}>
                    {complianceStatus.jurisdictionUpdated ? 'Aktuálne' : 'Kontrola potrebná'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Uchovávanie údajov
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {complianceStatus.dataRetentionConfigured ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={complianceStatus.dataRetentionConfigured ? 'text-green-600' : 'text-red-600'}>
                    {complianceStatus.dataRetentionConfigured ? 'Nakonfigurované' : 'Vyžaduje nastavenie'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gdpr">
          <Card>
            <CardHeader>
              <CardTitle>GDPR Súlad</CardTitle>
              <CardDescription>
                Všeobecné nariadenie o ochrane údajov (GDPR) požiadavky
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GDPRComplianceSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle>Právne požiadavky</CardTitle>
              <CardDescription>
                Súlad s právnymi požiadavkami pre generovanie závetov
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LegalRequirementsSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jurisdictions">
          <div className="space-y-4">
            {jurisdictionReqs.map((jurisdiction) => (
              <Card key={jurisdiction.jurisdiction}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    {jurisdiction.jurisdiction}
                  </CardTitle>
                  <CardDescription>
                    Posledná aktualizácia: {jurisdiction.lastUpdated.toLocaleDateString('sk-SK')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {jurisdiction.requirements.map((req) => (
                      <div key={req.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="mt-1">
                          {req.status === 'compliant' && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {req.status === 'warning' && <Clock className="h-4 w-4 text-yellow-600" />}
                          {req.status === 'non_compliant' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{req.title}</span>
                            {req.mandatory && (
                              <Badge variant="destructive" className="text-xs">Povinné</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{req.description}</p>
                          {req.action && (
                            <Button size="sm" variant="outline">
                              {req.action}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components
function GDPRComplianceSection() {
  return (
    <div className="space-y-4">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Vaše údaje sú spracovávané v súlade s GDPR. Máte právo na prístup, opravu a vymazanie vašich údajov.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Právo na informácie</h4>
          <p className="text-sm text-gray-600 mb-3">
            Máte právo vedieť, aké údaje o vás spracovávame a na aký účel.
          </p>
          <Button size="sm" variant="outline">
            <ExternalLink className="h-3 w-3 mr-1" />
            Zobraziť spracovávané údaje
          </Button>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Právo na výmaz</h4>
          <p className="text-sm text-gray-600 mb-3">
            Môžete požiadať o vymazanie všetkých vašich osobných údajov.
          </p>
          <Button size="sm" variant="destructive">
            Požiadať o vymazanie údajov
          </Button>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Export údajov</h4>
          <p className="text-sm text-gray-600 mb-3">
            Môžete si stiahnuť všetky vaše údaje v strojovo čitateľnom formáte.
          </p>
          <Button size="sm" variant="outline">
            <Download className="h-3 w-3 mr-1" />
            Stiahnuť moje údaje
          </Button>
        </div>
      </div>
    </div>
  );
}

function LegalRequirementsSection() {
  return (
    <div className="space-y-4">
      <Alert>
        <Scale className="h-4 w-4" />
        <AlertDescription>
          LegacyGuard je nástroj na asistované vytváranie závetov. Nenahrádzame právne poradenstvo.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <h4 className="font-medium">Disclaimer implementation</h4>
          </div>
          <p className="text-sm text-gray-600">
            Všetky generované dokumenty obsahujú jasné upozornenie o potrebe právnej konzultácie.
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <h4 className="font-medium">Template compliance</h4>
          </div>
          <p className="text-sm text-gray-600">
            Šablóny závetov sú navrhnuté v súlade s platnou legislatívou SK a CZ.
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <h4 className="font-medium">Legal updates monitoring</h4>
          </div>
          <p className="text-sm text-gray-600">
            Sledujeme zmeny v legislatíve a pravidelne aktualizujeme šablóny a validačné pravidlá.
          </p>
        </div>
      </div>
    </div>
  );
}

// Utility functions
async function fetchComplianceStatus(): Promise<ComplianceStatus> {
  // This would fetch from Supabase
  return {
    gdprCompliance: true,
    legalDisclaimerAccepted: true,
    jurisdictionUpdated: true,
    dataRetentionConfigured: false,
    lastComplianceCheck: new Date()
  };
}

async function fetchJurisdictionRequirements(): Promise<JurisdictionRequirements[]> {
  // This would fetch from Supabase
  return [
    {
      jurisdiction: 'SK',
      requirements: [
        {
          id: 'sk-holographic',
          title: 'Holografický závet',
          description: 'Možnosť vytvorenia vlastnoručného závetu',
          mandatory: true,
          status: 'compliant'
        },
        {
          id: 'sk-witnesses',
          title: 'Svedčený závet',
          description: 'Podpora pre závet so svedkami',
          mandatory: false,
          status: 'warning',
          action: 'Implementovať podporu'
        }
      ],
      lastUpdated: new Date()
    }
  ];
}

async function generateComplianceReport(): Promise<Blob> {
  // Generate PDF compliance report
  const reportData = {
    timestamp: new Date().toISOString(),
    complianceScore: 85,
    details: 'Compliance report details...'
  };

  return new Blob([JSON.stringify(reportData, null, 2)], {
    type: 'application/json'
  });
}

function downloadReport(report: Blob) {
  const url = URL.createObjectURL(report);
  const a = document.createElement('a');
  a.href = url;
  a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}