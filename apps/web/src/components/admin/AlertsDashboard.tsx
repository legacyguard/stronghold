'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertManager, type Alert, type AlertConfig } from '@/lib/monitoring/alerts';
import { AlertCircle, CheckCircle, Clock, Settings, RefreshCw, Bell, BellOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface HealthReport {
  status: 'healthy' | 'warning' | 'critical';
  alerts: Alert[];
  metrics: Record<string, number>;
}

function AlertCard({ alert, onResolve }: { alert: Alert; onResolve?: (id: string) => void }) {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default: return <AlertCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getAlertColor = () => {
    switch (alert.type) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Card className={`${getAlertColor()} transition-all hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getAlertIcon()}
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{alert.message}</h4>
              <p className="text-xs text-muted-foreground mt-1">{alert.action}</p>
              
              {alert.metric && (
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {alert.metric}: {alert.value?.toFixed(1)}
                  </Badge>
                  {alert.threshold && (
                    <Badge variant="secondary" className="text-xs">
                      práh: {alert.threshold.toFixed(1)}
                    </Badge>
                  )}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-2">
                {alert.timestamp.toLocaleString('sk-SK')}
              </p>
            </div>
          </div>
          
          {onResolve && (
            <Button size="sm" variant="outline" onClick={() => onResolve('alert-id')}>
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ConfigDialog({ config, onSave }: { config: AlertConfig; onSave: (config: AlertConfig) => void }) {
  const [localConfig, setLocalConfig] = useState<AlertConfig>(config);

  const handleSave = () => {
    onSave(localConfig);
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Nastavenia upozornení</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        <div>
          <Label>Prah chybovosti (%)</Label>
          <div className="mt-2">
            <Slider
              value={[localConfig.errorRateThreshold]}
              onValueChange={([value]) => setLocalConfig(prev => ({ ...prev, errorRateThreshold: value }))}
              max={20}
              min={1}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1%</span>
              <span className="font-medium">{localConfig.errorRateThreshold}%</span>
              <span>20%</span>
            </div>
          </div>
        </div>

        <div>
          <Label>Prah poklesu konverzie (%)</Label>
          <div className="mt-2">
            <Slider
              value={[localConfig.conversionDropThreshold]}
              onValueChange={([value]) => setLocalConfig(prev => ({ ...prev, conversionDropThreshold: value }))}
              max={50}
              min={10}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>10%</span>
              <span className="font-medium">{localConfig.conversionDropThreshold}%</span>
              <span>50%</span>
            </div>
          </div>
        </div>

        <div>
          <Label>Minimálna spokojnosť</Label>
          <div className="mt-2">
            <Slider
              value={[localConfig.satisfactionThreshold]}
              onValueChange={([value]) => setLocalConfig(prev => ({ ...prev, satisfactionThreshold: value }))}
              max={5}
              min={1}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1.0</span>
              <span className="font-medium">{localConfig.satisfactionThreshold.toFixed(1)}</span>
              <span>5.0</span>
            </div>
          </div>
        </div>

        <div>
          <Label>Prah churn rate (%)</Label>
          <div className="mt-2">
            <Slider
              value={[localConfig.churnRateThreshold]}
              onValueChange={([value]) => setLocalConfig(prev => ({ ...prev, churnRateThreshold: value }))}
              max={25}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1%</span>
              <span className="font-medium">{localConfig.churnRateThreshold}%</span>
              <span>25%</span>
            </div>
          </div>
        </div>

        <div>
          <Label>Maximálny čas odozvy (ms)</Label>
          <div className="mt-2">
            <Slider
              value={[localConfig.responseTimeThreshold]}
              onValueChange={([value]) => setLocalConfig(prev => ({ ...prev, responseTimeThreshold: value }))}
              max={10000}
              min={1000}
              step={500}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1s</span>
              <span className="font-medium">{(localConfig.responseTimeThreshold / 1000).toFixed(1)}s</span>
              <span>10s</span>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          Uložiť nastavenia
        </Button>
      </div>
    </DialogContent>
  );
}

function HealthStatusCard({ report }: { report: HealthReport }) {
  const getStatusColor = () => {
    switch (report.status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getStatusIcon = () => {
    switch (report.status) {
      case 'healthy': return <CheckCircle className="w-6 h-6" />;
      case 'warning': return <AlertCircle className="w-6 h-6" />;
      case 'critical': return <AlertCircle className="w-6 h-6" />;
    }
  };

  const getStatusText = () => {
    switch (report.status) {
      case 'healthy': return 'Systém funguje správne';
      case 'warning': return 'Upozornenia vyžadujú pozornosť';
      case 'critical': return 'Kritické problémy vyžadujú okamžitú akciu';
    }
  };

  return (
    <Card className={`${getStatusColor()} border-2`}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          {getStatusIcon()}
          <div>
            <h3 className="font-bold text-lg capitalize">{report.status}</h3>
            <p className="text-sm opacity-80">{getStatusText()}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{report.alerts.length}</p>
            <p className="text-xs opacity-80">Aktívnych upozornení</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{report.alerts.filter(a => a.type === 'critical').length}</p>
            <p className="text-xs opacity-80">Kritických</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AlertsDashboard() {
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [monitoring, setMonitoring] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2 * 60 * 1000); // Check every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [report, alerts, alertConfig] = await Promise.all([
        AlertManager.generateHealthReport(),
        AlertManager.getActiveAlerts(),
        AlertManager.loadConfig()
      ]);

      setHealthReport(report);
      setActiveAlerts(alerts);
      setConfig(alertConfig);
      setLastCheck(new Date());
      
    } catch (error) {
      console.error('Error loading alerts data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMonitoring = async () => {
    setMonitoring(true);
    await AlertManager.startMonitoring();
  };

  const handleConfigSave = async (newConfig: AlertConfig) => {
    await AlertManager.updateConfig(newConfig);
    setConfig(newConfig);
  };

  const resolveAlert = async (alertId: string) => {
    await AlertManager.resolveAlert(alertId);
    await loadData();
  };

  if (loading && !healthReport) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Systém upozornení</h1>
          <div className="animate-pulse bg-gray-200 rounded w-20 h-8"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Systém upozornení</h1>
          <p className="text-muted-foreground">
            Posledná kontrola: {lastCheck.toLocaleTimeString('sk-SK')}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Obnoviť
          </Button>
          
          {config && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Nastavenia
                </Button>
              </DialogTrigger>
              <ConfigDialog config={config} onSave={handleConfigSave} />
            </Dialog>
          )}
          
          <Button 
            onClick={handleStartMonitoring} 
            disabled={monitoring}
            className={monitoring ? 'bg-green-600' : ''}
          >
            {monitoring ? <Bell className="w-4 h-4 mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
            {monitoring ? 'Monitoring aktívny' : 'Spustiť monitoring'}
          </Button>
        </div>
      </div>

      {/* Health Status Overview */}
      {healthReport && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HealthStatusCard report={healthReport} />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Kľúčové metriky</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Chybovosť</span>
                <Badge variant={healthReport.metrics.error_rate > 5 ? 'destructive' : 'default'}>
                  {healthReport.metrics.error_rate.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Odozva</span>
                <Badge variant={healthReport.metrics.avg_response_time > 3000 ? 'destructive' : 'default'}>
                  {healthReport.metrics.avg_response_time.toFixed(0)}ms
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Spokojnosť</span>
                <Badge variant={healthReport.metrics.user_satisfaction < 3.5 ? 'destructive' : 'default'}>
                  {healthReport.metrics.user_satisfaction.toFixed(1)}/5
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Aktívni dnes</span>
                <Badge variant="outline">
                  {healthReport.metrics.daily_active_users}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Rozloženie upozornení</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Kritické</span>
                  <Badge variant="destructive">
                    {healthReport.alerts.filter(a => a.type === 'critical').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Upozornenia</span>
                  <Badge variant="secondary">
                    {healthReport.alerts.filter(a => a.type === 'warning').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Info</span>
                  <Badge variant="outline">
                    {healthReport.alerts.filter(a => a.type === 'info').length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>Aktuálne upozornenia</span>
              {healthReport && (
                <Badge variant="outline">
                  {healthReport.alerts.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {healthReport?.alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p>Žiadne aktívne upozornenia</p>
              </div>
            ) : (
              healthReport?.alerts.map((alert, index) => (
                <AlertCard 
                  key={index} 
                  alert={alert}
                  onResolve={resolveAlert}
                />
              ))
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>História upozornení</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Žiadne historické upozornenia</p>
              </div>
            ) : (
              activeAlerts.map((alert, index) => (
                <AlertCard key={index} alert={alert} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}