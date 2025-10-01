// Multi-Device Sync & Offline Support System
// Provides real-time synchronization and offline functionality

import { supabase } from '@/lib/supabase';

export interface SyncableDocument {
  id: string;
  userId: string;
  type: 'will' | 'draft' | 'template';
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  version: number;
  lastModified: Date;
  lastSyncedAt?: Date;
  deviceId?: string;
  conflictResolution?: 'client_wins' | 'server_wins' | 'merge_required';
}

export interface DeviceInfo {
  deviceId: string;
  userId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  platform: string;
  lastSeen: Date;
  isOnline: boolean;
  syncEnabled: boolean;
}

export interface SyncConflict {
  documentId: string;
  clientVersion: SyncableDocument;
  serverVersion: SyncableDocument;
  conflictType: 'content' | 'metadata' | 'both';
  timestamp: Date;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  syncInProgress: boolean;
  conflicts: SyncConflict[];
}

export class DocumentSyncManager {
  private static readonly SYNC_INTERVAL = 30000; // 30 seconds
  private static readonly OFFLINE_STORAGE_KEY = 'legacyguard_offline_documents';
  private static readonly DEVICE_ID_KEY = 'legacyguard_device_id';

  private static deviceId: string;
  private static syncInterval: NodeJS.Timeout | null = null;
  private static isInitialized = false;
  private static eventListeners: Map<string, Function[]> = new Map();

  // Initialize sync manager
  static async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize device ID
      this.deviceId = this.getOrCreateDeviceId();

      // Register device
      await this.registerDevice(userId);

      // Setup online/offline detection
      this.setupNetworkDetection();

      // Start sync interval
      this.startSyncInterval(userId);

      // Setup service worker for offline support
      await this.setupServiceWorker();

      this.isInitialized = true;
      this.emit('initialized', { deviceId: this.deviceId });

      console.log('Document sync manager initialized');

    } catch (error) {
      console.error('Failed to initialize document sync:', error);
      throw error;
    }
  }

  // Sync document changes
  static async syncDocumentChanges(documentId: string, userId: string): Promise<void> {
    try {
      const localChanges = await this.getLocalChanges(documentId);
      const serverChanges = await this.getServerChanges(documentId, userId);

      if (!localChanges && !serverChanges) {
        return; // No changes to sync
      }

      // Check for conflicts
      if (localChanges && serverChanges) {
        const conflict = this.detectConflict(localChanges, serverChanges);
        if (conflict) {
          await this.handleConflict(conflict);
          return;
        }
      }

      // Merge changes
      const mergedDocument = await this.mergeChanges(localChanges, serverChanges);

      // Update both local and server
      await Promise.all([
        this.updateLocalDocument(documentId, mergedDocument),
        this.updateServerDocument(documentId, mergedDocument, userId)
      ]);

      this.emit('documentSynced', { documentId, mergedDocument });

    } catch (error) {
      console.error(`Failed to sync document ${documentId}:`, error);
      throw error;
    }
  }

  // Get local changes for a document
  private static async getLocalChanges(documentId: string): Promise<SyncableDocument | null> {
    try {
      const localData = localStorage.getItem(this.OFFLINE_STORAGE_KEY);
      if (!localData) return null;

      const documents = JSON.parse(localData) as SyncableDocument[];
      const localDoc = documents.find(doc => doc.id === documentId);

      return localDoc || null;
    } catch (error) {
      console.error('Failed to get local changes:', error);
      return null;
    }
  }

  // Get server changes for a document
  private static async getServerChanges(documentId: string, userId: string): Promise<SyncableDocument | null> {
    try {
      const { data, error } = await supabase
        .from('will_documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        type: 'will',
        title: data.title,
        content: data.content || '',
        metadata: data.metadata || {},
        version: data.version || 1,
        lastModified: new Date(data.updated_at),
        lastSyncedAt: new Date()
      };

    } catch (error) {
      console.error('Failed to get server changes:', error);
      return null;
    }
  }

  // Detect conflicts between local and server versions
  private static detectConflict(
    localDoc: SyncableDocument,
    serverDoc: SyncableDocument
  ): SyncConflict | null {
    // Check if both have been modified since last sync
    if (localDoc.lastSyncedAt && serverDoc.lastModified > localDoc.lastSyncedAt) {
      return {
        documentId: localDoc.id,
        clientVersion: localDoc,
        serverVersion: serverDoc,
        conflictType: localDoc.content !== serverDoc.content ? 'content' : 'metadata',
        timestamp: new Date()
      };
    }

    return null;
  }

  // Handle sync conflicts
  private static async handleConflict(conflict: SyncConflict): Promise<void> {
    // Store conflict for user resolution
    await this.storeConflict(conflict);

    // Emit conflict event for UI handling
    this.emit('conflictDetected', conflict);

    console.warn('Sync conflict detected:', conflict);
  }

  // Merge changes from local and server
  private static async mergeChanges(
    localDoc: SyncableDocument | null,
    serverDoc: SyncableDocument | null
  ): Promise<SyncableDocument> {
    if (!localDoc && !serverDoc) {
      throw new Error('No documents to merge');
    }

    if (!localDoc) return serverDoc!;
    if (!serverDoc) return localDoc;

    // Use server version as base, apply local changes
    const merged: SyncableDocument = {
      ...serverDoc,
      version: Math.max(localDoc.version, serverDoc.version) + 1,
      lastModified: new Date(),
      lastSyncedAt: new Date(),
      deviceId: this.deviceId
    };

    // Merge metadata
    merged.metadata = {
      ...serverDoc.metadata,
      ...localDoc.metadata,
      lastMergedAt: new Date().toISOString(),
      mergeReason: 'automatic_sync'
    };

    return merged;
  }

  // Update local document
  private static async updateLocalDocument(
    documentId: string,
    document: SyncableDocument
  ): Promise<void> {
    try {
      const localData = localStorage.getItem(this.OFFLINE_STORAGE_KEY);
      const documents = localData ? JSON.parse(localData) as SyncableDocument[] : [];

      const existingIndex = documents.findIndex(doc => doc.id === documentId);

      if (existingIndex >= 0) {
        documents[existingIndex] = document;
      } else {
        documents.push(document);
      }

      localStorage.setItem(this.OFFLINE_STORAGE_KEY, JSON.stringify(documents));

    } catch (error) {
      console.error('Failed to update local document:', error);
      throw error;
    }
  }

  // Update server document
  private static async updateServerDocument(
    documentId: string,
    document: SyncableDocument,
    userId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('will_documents')
        .upsert({
          id: documentId,
          user_id: userId,
          title: document.title,
          content: document.content,
          metadata: {
            ...document.metadata,
            version: document.version,
            deviceId: this.deviceId,
            lastSyncedAt: new Date().toISOString()
          },
          version: document.version,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Failed to update server document: ${error.message}`);
      }

    } catch (error) {
      console.error('Failed to update server document:', error);
      throw error;
    }
  }

  // Enable offline mode
  static async enableOfflineMode(): Promise<void> {
    try {
      // Cache essential templates and validation rules
      await this.cacheEssentialData();

      // Setup service worker for offline functionality
      await this.registerServiceWorker();

      console.log('Offline mode enabled');
      this.emit('offlineModeEnabled');

    } catch (error) {
      console.error('Failed to enable offline mode:', error);
      throw error;
    }
  }

  // Cache essential data for offline use
  private static async cacheEssentialData(): Promise<void> {
    try {
      const essentialData = {
        templates: await this.getEssentialTemplates(),
        validationRules: await this.getEssentialValidationRules(),
        cachedAt: new Date().toISOString()
      };

      localStorage.setItem('legacyguard_offline_cache', JSON.stringify(essentialData));

    } catch (error) {
      console.error('Failed to cache essential data:', error);
    }
  }

  // Get essential templates for offline use
  private static async getEssentialTemplates(): Promise<any[]> {
    // This would fetch basic templates for SK/CZ jurisdictions
    return [
      {
        id: 'basic-sk-holographic',
        jurisdiction: 'SK',
        type: 'holographic',
        content: 'Basic Slovak holographic will template...'
      },
      {
        id: 'basic-cz-holographic',
        jurisdiction: 'CZ',
        type: 'holographic',
        content: 'Basic Czech holographic will template...'
      }
    ];
  }

  // Get essential validation rules for offline use
  private static async getEssentialValidationRules(): Promise<any[]> {
    return [
      {
        jurisdiction: 'SK',
        rules: ['executor_required', 'signature_required', 'date_required']
      },
      {
        jurisdiction: 'CZ',
        rules: ['executor_required', 'signature_required', 'date_required']
      }
    ];
  }

  // Setup service worker
  private static async setupServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered:', registration);
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }
  }

  // Register service worker for offline functionality
  private static async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }
  }

  // Get or create device ID
  private static getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);

    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
  }

  // Register device with server
  private static async registerDevice(userId: string): Promise<void> {
    try {
      const deviceInfo: DeviceInfo = {
        deviceId: this.deviceId,
        userId,
        deviceName: this.getDeviceName(),
        deviceType: this.getDeviceType(),
        platform: navigator.platform,
        lastSeen: new Date(),
        isOnline: navigator.onLine,
        syncEnabled: true
      };

      // Store device info (would be in a devices table in production)
      await supabase.from('audit_logs').insert({
        action: 'device_registered',
        resource_type: 'sync_device',
        resource_id: this.deviceId,
        new_values: deviceInfo
      });

    } catch (error) {
      console.error('Failed to register device:', error);
    }
  }

  // Get device name
  private static getDeviceName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';
    return 'Unknown Browser';
  }

  // Get device type
  private static getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  // Setup network detection
  private static setupNetworkDetection(): void {
    window.addEventListener('online', () => {
      this.emit('online');
      this.resumeSync();
    });

    window.addEventListener('offline', () => {
      this.emit('offline');
      this.pauseSync();
    });
  }

  // Start sync interval
  private static startSyncInterval(userId: string): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (navigator.onLine) {
        await this.performFullSync(userId);
      }
    }, this.SYNC_INTERVAL);
  }

  // Perform full sync
  private static async performFullSync(userId: string): Promise<void> {
    try {
      const localDocuments = await this.getAllLocalDocuments();

      for (const doc of localDocuments) {
        await this.syncDocumentChanges(doc.id, userId);
      }

      this.emit('syncCompleted', { documentsCount: localDocuments.length });

    } catch (error) {
      console.error('Full sync failed:', error);
      this.emit('syncFailed', { error });
    }
  }

  // Get all local documents
  private static async getAllLocalDocuments(): Promise<SyncableDocument[]> {
    try {
      const localData = localStorage.getItem(this.OFFLINE_STORAGE_KEY);
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error('Failed to get local documents:', error);
      return [];
    }
  }

  // Resume sync after coming online
  private static resumeSync(): void {
    console.log('Network restored, resuming sync');
    // Sync will resume on next interval
  }

  // Pause sync when offline
  private static pauseSync(): void {
    console.log('Network lost, sync paused');
  }

  // Store conflict for user resolution
  private static async storeConflict(conflict: SyncConflict): Promise<void> {
    try {
      const conflicts = JSON.parse(localStorage.getItem('legacyguard_conflicts') || '[]');
      conflicts.push(conflict);
      localStorage.setItem('legacyguard_conflicts', JSON.stringify(conflicts));
    } catch (error) {
      console.error('Failed to store conflict:', error);
    }
  }

  // Get sync status
  static getSyncStatus(): SyncStatus {
    const localData = localStorage.getItem(this.OFFLINE_STORAGE_KEY);
    const documents = localData ? JSON.parse(localData) : [];
    const conflicts = JSON.parse(localStorage.getItem('legacyguard_conflicts') || '[]');

    return {
      isOnline: navigator.onLine,
      lastSyncTime: this.getLastSyncTime(),
      pendingChanges: documents.filter((doc: SyncableDocument) => !doc.lastSyncedAt).length,
      syncInProgress: false, // Would track actual sync state
      conflicts
    };
  }

  // Get last sync time
  private static getLastSyncTime(): Date | null {
    const lastSync = localStorage.getItem('legacyguard_last_sync');
    return lastSync ? new Date(lastSync) : null;
  }

  // Event system
  static on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  static off(event: string, callback: Function): void {
    const callbacks = this.eventListeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private static emit(event: string, data?: any): void {
    const callbacks = this.eventListeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Cleanup
  static cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.eventListeners.clear();
    this.isInitialized = false;
  }
}