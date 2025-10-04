'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  Database,
  HardDrive,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Activity,
  FileText,
  Zap
} from 'lucide-react';
import { BackupManager } from '@/lib/backup/backup-manager';
import { DisasterRecovery } from '@/lib/backup/disaster-recovery';
import { Logger } from '@/lib/monitoring/logger';

interface BackupStats {
  total_backups: number;
  total_size: number;
  successful_backups: number;
  failed_backups: number;
  oldest_backup: Date | null;
  newest_backup: Date | null;
  backup_frequency: number;
}

interface BackupMetadata {
  id: string;
  type: 'database' | 'files' | 'configuration' | 'full';
  size: number;
  timestamp: Date;
  checksum: string;
  status: 'creating' | 'completed' | 'failed' | 'corrupted';
  retention_days: number;
  location: string;
}

interface DisasterEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected_systems: string[];
  created_at: Date;
  resolved_at?: Date;
}

export function BackupDashboard() {
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null);
  const [recentBackups, setRecentBackups] = useState<BackupMetadata[]>([]);
  const [activeDisasters, setActiveDisasters] = useState<DisasterEvent[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isTestingRecovery, setIsTestingRecovery] = useState(false);
  const [selectedBackupType, setSelectedBackupType] = useState<'database' | 'files' | 'configuration' | 'full'>('database');

  const backupManager = BackupManager.getInstance();
  const disasterRecovery = DisasterRecovery.getInstance();
  const logger = Logger.getInstance();

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [stats, disasters] = await Promise.all([
        backupManager.getBackupStatistics(),
        Promise.resolve(disasterRecovery.getActiveDisasters())
      ]);

      setBackupStats(stats);
      setActiveDisasters(disasters);

      // Load recent backups (mock for now)
      setRecentBackups([]);
    } catch (error) {
      logger.error('Failed to load dashboard data', {
        category: 'backup_dashboard',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const handleCreateBackup = async () => {
    if (isCreatingBackup) return;

    setIsCreatingBackup(true);
    try {
      await backupManager.createBackup(selectedBackupType);
      await loadDashboardData();

      logger.info('Manual backup created successfully', {
        category: 'backup_dashboard',
        backup_type: selectedBackupType
      });
    } catch (error) {
      logger.error('Failed to create backup', {
        category: 'backup_dashboard',
        backup_type: selectedBackupType,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleTestRecovery = async () => {
    if (isTestingRecovery) return;

    setIsTestingRecovery(true);
    try {
      const results = await disasterRecovery.testRecoveryProcedures();

      const passedTests = results.filter(r => r.status === 'passed').length;
      const totalTests = results.length;

      logger.info('Recovery procedures tested', {
        category: 'backup_dashboard',
        results: { passed: passedTests, total: totalTests }
      });

      alert(`Test dokončený: ${passedTests}/${totalTests} procedúr úspešných`);
    } catch (error) {
      logger.error('Failed to test recovery procedures', {
        category: 'backup_dashboard',
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsTestingRecovery(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('sk-SK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'corrupted':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'creating':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };

    const labels = {
      low: 'Nízka',
      medium: 'Stredná',
      high: 'Vysoká',
      critical: 'Kritická'
    };

    return (
      <Badge className={variants[severity as keyof typeof variants] || variants.medium}>
        {labels[severity as keyof typeof labels] || severity}
      </Badge>
    );
  };

  if (!backupStats) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Načítavam dashboard...</span>
      </div>
    );
  }

  const successRate = backupStats.total_backups > 0
    ? (backupStats.successful_backups / backupStats.total_backups) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Zálohy a Obnova</h1>
          <p className="text-gray-600">Správa záloh a disaster recovery systému</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleTestRecovery}
            disabled={isTestingRecovery}
          >
            {isTestingRecovery ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Testovať obnovu
          </Button>
          <Button onClick={() => loadDashboardData()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Obnoviť
          </Button>
        </div>
      </div>

      {/* Active Disasters Alert */}
      {activeDisasters.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Aktívne incidenty ({activeDisasters.length}):</strong>
            {activeDisasters.map(disaster => (
              <div key={disaster.id} className="mt-1">
                • {disaster.description} ({getSeverityBadge(disaster.severity)})
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkové zálohy</CardTitle>
            <Database className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backupStats.total_backups}</div>
            <p className="text-xs text-gray-600">
              {backupStats.successful_backups} úspešných, {backupStats.failed_backups} neúspešných
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celková veľkosť</CardTitle>
            <HardDrive className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(backupStats.total_size)}</div>
            <p className="text-xs text-gray-600">
              Posledná záloha: {formatDate(backupStats.newest_backup)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Úspešnosť</CardTitle>
            <Activity className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <Progress value={successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frekvencia</CardTitle>
            <Clock className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backupStats.backup_frequency.toFixed(1)}</div>
            <p className="text-xs text-gray-600">záloh za deň</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup Creation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Vytvoriť zálohu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Typ zálohy</label>
              <select
                value={selectedBackupType}
                onChange={(e) => setSelectedBackupType(e.target.value as any)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="database">Databáza</option>
                <option value="files">Súbory</option>
                <option value="configuration">Konfigurácia</option>
                <option value="full">Kompletná záloha</option>
              </select>
            </div>

            <Button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              className="w-full"
            >
              {isCreatingBackup ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Vytváram zálohu...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Vytvoriť zálohu
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Backups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Posledné zálohy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentBackups.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Žiadne zálohy k dispozícii
              </p>
            ) : (
              <div className="space-y-3">
                {recentBackups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(backup.status)}
                      <div>
                        <div className="font-medium">{backup.type}</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(backup.timestamp)} • {formatBytes(backup.size)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{backup.status}</Badge>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Zdravie systému
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <div className="font-medium">Zálohy</div>
                <div className="text-sm text-gray-500">Funkčné</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <div className="font-medium">Databáza</div>
                <div className="text-sm text-gray-500">Dostupná</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <div className="font-medium">Úložisko</div>
                <div className="text-sm text-gray-500">Dostupné</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Konfigurácia záloh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Plánovanie</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Denné zálohy:</span>
                  <span>02:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Týždenné zálohy:</span>
                  <span>Nedeľa</span>
                </div>
                <div className="flex justify-between">
                  <span>Mesačné zálohy:</span>
                  <span>1. deň v mesiaci</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Uchovávanie</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Denné zálohy:</span>
                  <span>7 dní</span>
                </div>
                <div className="flex justify-between">
                  <span>Týždenné zálohy:</span>
                  <span>4 týždne</span>
                </div>
                <div className="flex justify-between">
                  <span>Mesačné zálohy:</span>
                  <span>12 mesiacov</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}