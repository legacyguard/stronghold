'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Wifi,
  WifiOff,
  Sync,
  Check,
  AlertTriangle,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw
} from 'lucide-react';

import { DocumentSyncManager, SyncStatus, DeviceInfo } from '@/lib/sync/document-sync';

interface SyncStatusWidgetProps {
  userId: string;
  className?: string;
  compact?: boolean;
}

export function SyncStatusWidget({ userId, className, compact = false }: SyncStatusWidgetProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSyncTime: null,
    pendingChanges: 0,
    syncInProgress: false,
    conflicts: []
  });

  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [showDevices, setShowDevices] = useState(false);

  useEffect(() => {
    // Initialize sync manager
    initializeSync();

    // Setup event listeners
    const handleOnline = () => updateSyncStatus();
    const handleOffline = () => updateSyncStatus();

    DocumentSyncManager.on('online', handleOnline);
    DocumentSyncManager.on('offline', handleOffline);
    DocumentSyncManager.on('syncCompleted', handleOnline);
    DocumentSyncManager.on('conflictDetected', handleOnline);

    // Update status periodically
    const interval = setInterval(updateSyncStatus, 5000);

    return () => {
      DocumentSyncManager.off('online', handleOnline);
      DocumentSyncManager.off('offline', handleOffline);
      DocumentSyncManager.off('syncCompleted', handleOnline);
      DocumentSyncManager.off('conflictDetected', handleOnline);
      clearInterval(interval);
    };
  }, [userId]);

  const initializeSync = async () => {
    try {
      await DocumentSyncManager.initialize(userId);
      updateSyncStatus();
    } catch (error) {
      console.error('Failed to initialize sync:', error);
    }
  };

  const updateSyncStatus = () => {
    const status = DocumentSyncManager.getSyncStatus();
    setSyncStatus(status);
  };

  const handleManualSync = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, syncInProgress: true }));
      // Manual sync would be triggered here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate sync
      updateSyncStatus();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }));
    }
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'red';
    if (syncStatus.conflicts.length > 0) return 'yellow';
    if (syncStatus.pendingChanges > 0) return 'blue';
    return 'green';
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) return WifiOff;
    if (syncStatus.syncInProgress) return RefreshCw;
    if (syncStatus.conflicts.length > 0) return AlertTriangle;
    if (syncStatus.pendingChanges > 0) return Clock;
    return Check;
  };

  const getStatusMessage = () => {
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.syncInProgress) return 'Synchronizing...';
    if (syncStatus.conflicts.length > 0) return `${syncStatus.conflicts.length} conflicts`;
    if (syncStatus.pendingChanges > 0) return `${syncStatus.pendingChanges} pending`;
    return 'Up to date';
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      default: return Monitor;
    }
  };

  const StatusIcon = getStatusIcon();
  const statusColor = getStatusColor();

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <StatusIcon className={`h-4 w-4 text-${statusColor}-600 ${syncStatus.syncInProgress ? 'animate-spin' : ''}`} />
        <span className="text-sm font-medium">{getStatusMessage()}</span>
        {!syncStatus.isOnline && (
          <Badge variant="destructive" className="text-xs">
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 text-${statusColor}-600 ${syncStatus.syncInProgress ? 'animate-spin' : ''}`} />
            Sync Status
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualSync}
            disabled={syncStatus.syncInProgress || !syncStatus.isOnline}
          >
            <Sync className="h-3 w-3 mr-1" />
            Sync
          </Button>
        </CardTitle>
        <CardDescription>{getStatusMessage()}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {syncStatus.isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm font-medium">
              {syncStatus.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            Last sync: {formatLastSync(syncStatus.lastSyncTime)}
          </span>
        </div>

        {/* Sync Progress */}
        {syncStatus.syncInProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Synchronizing documents...</span>
            </div>
            <Progress value={75} className="h-1" />
          </div>
        )}

        {/* Pending Changes */}
        {syncStatus.pendingChanges > 0 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {syncStatus.pendingChanges} document{syncStatus.pendingChanges > 1 ? 's' : ''} waiting to sync
            </AlertDescription>
          </Alert>
        )}

        {/* Conflicts */}
        {syncStatus.conflicts.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-1">
                {syncStatus.conflicts.length} sync conflict{syncStatus.conflicts.length > 1 ? 's' : ''} detected
              </div>
              <div className="text-sm">
                Manual resolution required for some documents.
              </div>
              <Button size="sm" variant="outline" className="mt-2">
                Resolve Conflicts
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Offline Mode */}
        {!syncStatus.isOnline && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-1">Working Offline</div>
              <div className="text-sm">
                Your changes are being saved locally and will sync when you're back online.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Device Management */}
        <div className="pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDevices(!showDevices)}
            className="w-full justify-start"
          >
            <Monitor className="h-4 w-4 mr-2" />
            {showDevices ? 'Hide' : 'Show'} Devices
          </Button>

          {showDevices && (
            <div className="mt-3 space-y-2">
              {devices.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-2">
                  No other devices found
                </div>
              ) : (
                devices.map((device) => {
                  const DeviceIcon = getDeviceIcon(device.deviceType);
                  return (
                    <div key={device.deviceId} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <DeviceIcon className="h-4 w-4" />
                        <div>
                          <div className="text-sm font-medium">{device.deviceName}</div>
                          <div className="text-xs text-gray-500">{device.platform}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {device.isOnline ? (
                          <Badge variant="default" className="bg-green-600 text-xs">
                            Online
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Last seen: {formatLastSync(device.lastSeen)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm text-gray-500">Auto-sync enabled</span>
          <Button variant="ghost" size="sm">
            Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Minimal sync indicator for navigation/header
export function SyncIndicator({ userId }: { userId: string }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleSyncStart = () => setSyncing(true);
    const handleSyncEnd = () => setSyncing(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    DocumentSyncManager.on('syncCompleted', handleSyncEnd);
    DocumentSyncManager.on('syncFailed', handleSyncEnd);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      DocumentSyncManager.off('syncCompleted', handleSyncEnd);
      DocumentSyncManager.off('syncFailed', handleSyncEnd);
    };
  }, []);

  return (
    <div className="flex items-center gap-1">
      {syncing ? (
        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
      ) : isOnline ? (
        <Wifi className="h-4 w-4 text-green-600" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-600" />
      )}
    </div>
  );
}