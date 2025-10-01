'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw
} from 'lucide-react';

import { useAIBudgetMonitoring, UsageStats, BudgetAlert } from '@/lib/ai-cost-monitoring/budget-manager';

interface BudgetDashboardProps {
  userId: string;
  className?: string;
}

export function BudgetDashboard({ userId, className }: BudgetDashboardProps) {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const {
    getUsageStats,
    getRecentAlerts,
    budgetSettings,
    estimateCost
  } = useAIBudgetMonitoring(userId);

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [stats, alerts] = await Promise.all([
        getUsageStats(),
        getRecentAlerts()
      ]);

      setUsageStats(stats);
      setRecentAlerts(alerts);
    } catch (error) {
      console.error('Failed to load budget dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getBudgetStatus = (): {
    status: 'good' | 'warning' | 'critical' | 'exceeded';
    color: string;
    icon: any;
    message: string;
  } => {
    if (!usageStats) return { status: 'good', color: 'green', icon: CheckCircle, message: 'Načítavam...' };

    const utilization = usageStats.budgetUtilization;

    if (utilization >= 100) {
      return {
        status: 'exceeded',
        color: 'red',
        icon: AlertTriangle,
        message: 'Denný limit prekročený'
      };
    } else if (utilization >= 90) {
      return {
        status: 'critical',
        color: 'red',
        icon: AlertTriangle,
        message: 'Kriticky vysoké využitie'
      };
    } else if (utilization >= 80) {
      return {
        status: 'warning',
        color: 'yellow',
        icon: Clock,
        message: 'Vysoké využitie rozpočtu'
      };
    } else {
      return {
        status: 'good',
        color: 'green',
        icon: CheckCircle,
        message: 'Rozpočet v poriadku'
      };
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(4)}`;
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value)}%`;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const budgetStatus = getBudgetStatus();
  const StatusIcon = budgetStatus.icon;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            AI Rozpočet a Monitoring
          </h2>
          <p className="text-gray-600">
            Sledovanie nákladov a využitia AI služieb
          </p>
        </div>

        <Button
          onClick={refreshData}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Obnoviť
        </Button>
      </div>

      {/* Budget Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 text-${budgetStatus.color}-600`} />
            Denný rozpočet
          </CardTitle>
          <CardDescription>
            Limit: {formatCurrency(budgetSettings.dailyLimit)} / deň
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {usageStats ? formatCurrency(usageStats.todayUsage) : '$0.0000'}
                </p>
                <p className="text-sm text-gray-600">
                  Zostáva: {usageStats ? formatCurrency(usageStats.remainingBudget) : formatCurrency(budgetSettings.dailyLimit)}
                </p>
              </div>
              <Badge
                variant={budgetStatus.status === 'good' ? 'default' : 'destructive'}
                className={`bg-${budgetStatus.color}-600`}
              >
                {budgetStatus.message}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Využitie rozpočtu</span>
                <span>{usageStats ? formatPercentage(usageStats.budgetUtilization) : '0%'}</span>
              </div>
              <Progress
                value={usageStats?.budgetUtilization || 0}
                className="h-2"
                // Add color based on status
                style={{
                  background: budgetStatus.status === 'exceeded' ? '#fecaca' :
                             budgetStatus.status === 'critical' ? '#fed7aa' :
                             budgetStatus.status === 'warning' ? '#fef3c7' : '#dcfce7'
                }}
              />
            </div>

            {budgetStatus.status !== 'good' && (
              <Alert className={`border-${budgetStatus.color}-200 bg-${budgetStatus.color}-50`}>
                <AlertTriangle className={`h-4 w-4 text-${budgetStatus.color}-600`} />
                <AlertDescription className={`text-${budgetStatus.color}-800`}>
                  {budgetStatus.status === 'exceeded' &&
                    'Denný limit AI služieb bol prekročený. Ďalšie generovanie bude dostupné zajtra.'
                  }
                  {budgetStatus.status === 'critical' &&
                    'Približujete sa k dennému limitu. Použite AI služby opatrne.'
                  }
                  {budgetStatus.status === 'warning' &&
                    'Využili ste značnú časť denného rozpočtu. Zvážte optimalizáciu používania.'
                  }
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Prehľad</TabsTrigger>
          <TabsTrigger value="usage">Využitie</TabsTrigger>
          <TabsTrigger value="alerts">Upozornenia</TabsTrigger>
          <TabsTrigger value="settings">Nastavenia</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today's Usage */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Dnes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats ? formatCurrency(usageStats.todayUsage) : '$0.0000'}
                </div>
                <p className="text-xs text-gray-600">
                  Denné využitie
                </p>
              </CardContent>
            </Card>

            {/* Week Usage */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Týždeň</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats ? formatCurrency(usageStats.weekUsage) : '$0.0000'}
                </div>
                <p className="text-xs text-gray-600">
                  Týždenné využitie
                </p>
              </CardContent>
            </Card>

            {/* Month Usage */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Mesiac</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats ? formatCurrency(usageStats.monthUsage) : '$0.0000'}
                </div>
                <p className="text-xs text-gray-600">
                  Mesačné využitie
                </p>
              </CardContent>
            </Card>

            {/* Total Requests */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Požiadavky</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats?.totalRequests || 0}
                </div>
                <p className="text-xs text-gray-600">
                  Celkový počet
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usage Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Efektívnosť používania
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Priemerná cena za požiadavku</span>
                    <span className="font-medium">
                      {usageStats ? formatCurrency(usageStats.averageCostPerRequest) : '$0.0000'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Odhadovaná cena GPT-4o (2K tokenov)</span>
                    <span className="font-medium">
                      {formatCurrency(estimateCost(2000, 'gpt-4o'))}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Odhadovaná cena GPT-4o-mini (2K tokenov)</span>
                    <span className="font-medium">
                      {formatCurrency(estimateCost(2000, 'gpt-4o-mini'))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Model Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Ceny modelov
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(budgetSettings.modelCosts).map(([model, cost]) => (
                    <div key={model} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{model}</span>
                      <span className="text-sm">{formatCurrency(cost)}/1K tokenov</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Nedávne upozornenia
              </CardTitle>
              <CardDescription>
                História upozornení o rozpočte a využití
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Žiadne upozornenia o rozpočte</p>
                  <p className="text-sm">Vaše využitie AI služieb je v normálnych medziach.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${
                        alert.alertType === 'limit_exceeded'
                          ? 'border-red-200 bg-red-50'
                          : alert.alertType === 'warning'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {alert.alertType === 'limit_exceeded' && (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          {alert.alertType === 'warning' && (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                          {alert.alertType === 'daily_reset' && (
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {alert.alertType === 'limit_exceeded' && 'Limit prekročený'}
                            {alert.alertType === 'warning' && 'Upozornenie o rozpočte'}
                            {alert.alertType === 'daily_reset' && 'Rozpočet obnovený'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {alert.sentAt.toLocaleString('sk-SK')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Nastavenia rozpočtu</CardTitle>
              <CardDescription>
                Aktuálne limity a prahovými hodnoty pre AI služby
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Denný limit</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(budgetSettings.dailyLimit)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Maximálne náklady na AI služby za deň
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Varovný prah</h4>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(budgetSettings.warningThreshold)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Pošle upozornenie pri dosiahnutí tejto sumy
                    </p>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Tieto limity sú nastavené na optimalizáciu nákladov a zabezpečenie dostupnosti služby
                    pre všetkých používateľov. Pre vyššie limity kontaktujte podporu.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}