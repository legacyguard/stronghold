'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Scale,
  Download,
  Eye,
  Play,
  Pause,
  Settings
} from 'lucide-react';

import {
  JurisdictionContentUpdater,
  ContentUpdate,
  ValidationResult
} from '@/lib/content-management/jurisdiction-updater';

interface UpdateStatistics {
  totalUpdates: number;
  appliedUpdates: number;
  pendingUpdates: number;
  lastUpdateDate: Date | null;
  updatesByJurisdiction: Record<string, number>;
}

export function ContentUpdateDashboard() {
  const [pendingUpdates, setPendingUpdates] = useState<ContentUpdate[]>([]);
  const [statistics, setStatistics] = useState<UpdateStatistics>({
    totalUpdates: 0,
    appliedUpdates: 0,
    pendingUpdates: 0,
    lastUpdateDate: null,
    updatesByJurisdiction: {}
  });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [updates, stats] = await Promise.all([
        JurisdictionContentUpdater.getPendingUpdates(),
        JurisdictionContentUpdater.getUpdateStatistics()
      ]);

      setPendingUpdates(updates);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForUpdates = async () => {
    try {
      setChecking(true);
      const updates = await JurisdictionContentUpdater.checkForLegalUpdates();

      if (updates.length > 0) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setChecking(false);
    }
  };

  const applyUpdate = async (update: ContentUpdate) => {
    try {
      setApplying(update.id);

      // Validate first
      const validation = await JurisdictionContentUpdater.validateContentUpdate(update);

      if (!validation.isValid) {
        alert(`Nemožno aplikovať aktualizáciu: ${validation.errors.join(', ')}`);
        return;
      }

      await JurisdictionContentUpdater.applyContentUpdate(update);
      await loadDashboardData();

    } catch (error) {
      console.error('Failed to apply update:', error);
      alert('Chyba pri aplikovaní aktualizácie');
    } finally {
      setApplying(null);
    }
  };

  const getUpdateTypeIcon = (type: string) => {
    switch (type) {
      case 'template': return <FileText className="h-4 w-4" />;
      case 'validation_rules': return <CheckCircle className="h-4 w-4" />;
      case 'legal_requirements': return <Scale className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getUpdateTypeLabel = (type: string) => {
    switch (type) {
      case 'template': return 'Šablóna';
      case 'validation_rules': return 'Validačné pravidlá';
      case 'legal_requirements': return 'Právne požiadavky';
      default: return 'Neznámy';
    }
  };

  const getJurisdictionName = (jurisdiction: string) => {
    const names = {
      'SK': 'Slovensko',
      'CZ': 'Česko',
      'AT': 'Rakúsko',
      'DE': 'Nemecko',
      'PL': 'Poľsko'
    };
    return names[jurisdiction as keyof typeof names] || jurisdiction;
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
            <Scale className="h-8 w-8" />
            Správa právneho obsahu
          </h1>
          <p className="text-gray-600 mt-1">
            Monitoring a aktualizácia právnych požiadaviek pre jednotlivé jurisdikcie
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={checkForUpdates}
            disabled={checking}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Kontrolujem...' : 'Skontrolovať aktualizácie'}
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Celkové aktualizácie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalUpdates}</div>
            <p className="text-xs text-gray-600">Všetky zaznamenané</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aplikované</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.appliedUpdates}</div>
            <p className="text-xs text-gray-600">Úspešne aplikované</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Čakajúce</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statistics.pendingUpdates}</div>
            <p className="text-xs text-gray-600">Vyžadujú pozornosť</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Posledná aktualizácia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {statistics.lastUpdateDate
                ? statistics.lastUpdateDate.toLocaleDateString('sk-SK')
                : 'Nikdy'
              }
            </div>
            <p className="text-xs text-gray-600">Dátum poslednej zmeny</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Čakajúce aktualizácie</TabsTrigger>
          <TabsTrigger value="statistics">Štatistiky</TabsTrigger>
          <TabsTrigger value="settings">Nastavenia</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Čakajúce aktualizácie
              </CardTitle>
              <CardDescription>
                Aktualizácie, ktoré boli detegované ale ešte neboli aplikované
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUpdates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="font-medium">Žiadne čakajúce aktualizácie</p>
                  <p className="text-sm">Všetky právne zmeny sú aktuálne aplikované.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUpdates.map((update) => (
                    <div
                      key={update.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getUpdateTypeIcon(update.updateType)}
                            <span className="font-medium">{getUpdateTypeLabel(update.updateType)}</span>
                            <Badge variant="secondary">{getJurisdictionName(update.jurisdiction)}</Badge>
                            <Badge variant="outline">v{update.version}</Badge>
                          </div>

                          <p className="text-sm text-gray-600">
                            {update.updateDescription}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Platné od: {update.effectiveFrom.toLocaleDateString('sk-SK')}</span>
                            <span>Autor: {update.createdBy}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {/* Preview update */}}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Náhľad
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => applyUpdate(update)}
                            disabled={applying === update.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {applying === update.id ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Aplikujem...
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                Aplikovať
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {(update.effectiveFrom > new Date()) && (
                        <Alert>
                          <Clock className="h-4 w-4" />
                          <AlertDescription>
                            Táto aktualizácia bude platná od {update.effectiveFrom.toLocaleDateString('sk-SK')}.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Updates by Jurisdiction */}
            <Card>
              <CardHeader>
                <CardTitle>Aktualizácie podle jurisdikcie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(statistics.updatesByJurisdiction).map(([jurisdiction, count]) => (
                    <div key={jurisdiction} className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {getJurisdictionName(jurisdiction)}
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}

                  {Object.keys(statistics.updatesByJurisdiction).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Žiadne údaje o aktualizáciách
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Update Types */}
            <Card>
              <CardHeader>
                <CardTitle>Typy aktualizácií</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">Šablóny závetov</span>
                    </div>
                    <Badge variant="secondary">
                      {pendingUpdates.filter(u => u.updateType === 'template').length}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Validačné pravidlá</span>
                    </div>
                    <Badge variant="secondary">
                      {pendingUpdates.filter(u => u.updateType === 'validation_rules').length}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      <span className="text-sm">Právne požiadavky</span>
                    </div>
                    <Badge variant="secondary">
                      {pendingUpdates.filter(u => u.updateType === 'legal_requirements').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Nastavenia monitorovania
              </CardTitle>
              <CardDescription>
                Konfigurácia automatického monitorovania právnych zmien
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Sledované jurisdikcie</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {['SK', 'CZ', 'AT', 'DE', 'PL'].map((jurisdiction) => (
                      <div key={jurisdiction} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{getJurisdictionName(jurisdiction)}</span>
                        <Badge variant="default" className="bg-green-600">
                          Aktívne
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Frekvencia kontrol</h4>
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Automatické kontroly sa vykonávajú štvrťročne (každé 3 mesiace).
                      Ďalšia kontrola je naplánovaná na 1. januára 2025.
                    </AlertDescription>
                  </Alert>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Notifikácie</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email upozornenia pri nových aktualizáciách</span>
                      <Badge variant="default" className="bg-green-600">Zapnuté</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Slack notifikácie pre tím</span>
                      <Badge variant="default" className="bg-green-600">Zapnuté</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Dashboard alerts pre kritické zmeny</span>
                      <Badge variant="default" className="bg-green-600">Zapnuté</Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export audit logu
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}