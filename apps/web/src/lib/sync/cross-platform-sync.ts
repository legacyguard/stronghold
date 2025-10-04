/**
 * Cross-Platform Sync System for LegacyGuard
 * Provides real-time data synchronization across web, mobile, and desktop platforms
 */

export interface SyncEntity {
  id: string;
  type: string;
  data: any;
  version: number;
  lastModified: Date;
  deviceId: string;
  userId: string;
  organizationId?: string;
  metadata: {
    checksum: string;
    size: number;
    conflictResolution: 'auto' | 'manual';
    priority: 'low' | 'normal' | 'high' | 'critical';
    tags: string[];
  };
}

export interface SyncConflict {
  entityId: string;
  type: string;
  localVersion: SyncEntity;
  remoteVersion: SyncEntity;
  conflictType: 'version' | 'concurrent' | 'schema';
  resolutionStrategy: 'client' | 'server' | 'merge' | 'manual';
  createdAt: Date;
}

export interface DeviceInfo {
  deviceId: string;
  platform: 'web' | 'ios' | 'android' | 'desktop';
  browser?: string;
  version: string;
  capabilities: {
    offline: boolean;
    pushNotifications: boolean;
    fileSystem: boolean;
    camera: boolean;
    biometrics: boolean;
  };
  lastSeen: Date;
  isActive: boolean;
}

export interface SyncSession {
  id: string;
  deviceId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'failed' | 'interrupted';
  entitiesSynced: number;
  conflictsResolved: number;
  bytesTransferred: number;
  error?: string;
}

export interface SyncConfig {
  apiEndpoint: string;
  websocketEndpoint: string;
  syncInterval: number; // milliseconds
  batchSize: number;
  conflictResolution: 'client' | 'server' | 'merge' | 'manual';
  enableRealTime: boolean;
  enableCompression: boolean;
  retryAttempts: number;
  platforms: string[];
}

export class CrossPlatformSyncManager {
  private static instance: CrossPlatformSyncManager;
  private config: SyncConfig;
  private websocket: WebSocket | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;
  private currentSession: SyncSession | null = null;
  private pendingChanges: Map<string, SyncEntity> = new Map();
  private conflictQueue: SyncConflict[] = [];
  private deviceInfo: DeviceInfo;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor(config: SyncConfig) {
    this.config = config;
    this.deviceInfo = this.detectDeviceInfo();
    this.setupNetworkListeners();
  }

  public static getInstance(config?: SyncConfig): CrossPlatformSyncManager {
    if (!CrossPlatformSyncManager.instance) {
      if (!config) {
        throw new Error('Configuration required for first initialization');
      }
      CrossPlatformSyncManager.instance = new CrossPlatformSyncManager(config);
    }
    return CrossPlatformSyncManager.instance;
  }

  /**
   * Initialize the sync system
   */
  public async initialize(): Promise<void> {
    try {
      console.log('Initializing cross-platform sync...');

      // Register device
      await this.registerDevice();

      // Connect to real-time sync
      if (this.config.enableRealTime && this.isOnline) {
        await this.connectWebSocket();
      }

      // Start sync timer
      this.startSyncTimer();

      // Perform initial sync
      await this.performFullSync();

      console.log('✓ Cross-platform sync initialized successfully');
      this.emit('initialized', { deviceId: this.deviceInfo.deviceId });
    } catch (error) {
      console.error('❌ Failed to initialize cross-platform sync:', error);
      this.emit('error', { error: 'Failed to initialize sync system', details: error });
      throw error;
    }
  }

  /**
   * Detect device information
   */
  private detectDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    let platform: DeviceInfo['platform'] = 'web';

    if (/android/i.test(userAgent)) {
      platform = 'android';
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      platform = 'ios';
    } else if (/electron/i.test(userAgent)) {
      platform = 'desktop';
    }

    const deviceId = this.getOrCreateDeviceId();

    return {
      deviceId,
      platform,
      browser: this.detectBrowser(),
      version: this.getAppVersion(),
      capabilities: this.detectCapabilities(),
      lastSeen: new Date(),
      isActive: true
    };
  }

  /**
   * Get or create unique device ID
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');

    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', deviceId);
    }

    return deviceId;
  }

  /**
   * Detect browser type
   */
  private detectBrowser(): string {
    const userAgent = navigator.userAgent;

    if (userAgent.includes('Chrome')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari';
    if (userAgent.includes('Edge')) return 'edge';

    return 'unknown';
  }

  /**
   * Get application version
   */
  private getAppVersion(): string {
    return process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
  }

  /**
   * Detect device capabilities
   */
  private detectCapabilities(): DeviceInfo['capabilities'] {
    return {
      offline: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window && 'Notification' in window,
      fileSystem: 'showSaveFilePicker' in window,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      biometrics: 'credentials' in navigator && 'create' in navigator.credentials
    };
  }

  /**
   * Register device with server
   */
  private async registerDevice(): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(this.deviceInfo)
      });

      if (!response.ok) {
        throw new Error(`Device registration failed: ${response.statusText}`);
      }

      console.log('Device registered successfully');
    } catch (error) {
      console.error('Failed to register device:', error);
      throw error;
    }
  }

  /**
   * Connect to WebSocket for real-time sync
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem('authToken') || '';
        const wsUrl = `${this.config.websocketEndpoint}?token=${token}&deviceId=${this.deviceInfo.deviceId}`;

        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
          console.log('WebSocket connected for real-time sync');
          this.emit('realTimeConnected');
          resolve();
        };

        this.websocket.onmessage = (event) => {
          this.handleWebSocketMessage(event);
        };

        this.websocket.onclose = () => {
          console.log('WebSocket disconnected');
          this.emit('realTimeDisconnected');

          // Attempt to reconnect after delay
          setTimeout(() => {
            if (this.isOnline) {
              this.connectWebSocket();
            }
          }, 5000);
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        // Connection timeout
        setTimeout(() => {
          if (this.websocket?.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'entity_updated':
          this.handleRemoteEntityUpdate(message.entity);
          break;
        case 'entity_deleted':
          this.handleRemoteEntityDeletion(message.entityId);
          break;
        case 'conflict_detected':
          this.handleRemoteConflict(message.conflict);
          break;
        case 'sync_request':
          this.performIncrementalSync();
          break;
        default:
          console.log('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to handle WebSocket message:', error);
    }
  }

  /**
   * Sync an entity to all platforms
   */
  public async syncEntity(entity: Partial<SyncEntity>): Promise<string> {
    try {
      const syncEntity: SyncEntity = {
        id: entity.id || this.generateEntityId(),
        type: entity.type || 'unknown',
        data: entity.data || {},
        version: entity.version || 1,
        lastModified: new Date(),
        deviceId: this.deviceInfo.deviceId,
        userId: await this.getCurrentUserId(),
        organizationId: entity.organizationId,
        metadata: {
          checksum: this.calculateChecksum(entity.data),
          size: this.calculateSize(entity.data),
          conflictResolution: entity.metadata?.conflictResolution || 'auto',
          priority: entity.metadata?.priority || 'normal',
          tags: entity.metadata?.tags || []
        }
      };

      // Add to pending changes
      this.pendingChanges.set(syncEntity.id, syncEntity);

      // Send immediately if high priority and online
      if (syncEntity.metadata.priority === 'critical' && this.isOnline) {
        await this.uploadEntity(syncEntity);
        this.pendingChanges.delete(syncEntity.id);
      }

      this.emit('entityQueued', { entity: syncEntity });
      return syncEntity.id;
    } catch (error) {
      console.error('Failed to sync entity:', error);
      throw error;
    }
  }

  /**
   * Perform full synchronization
   */
  public async performFullSync(): Promise<void> {
    if (!this.isOnline) {
      console.log('Cannot perform full sync while offline');
      return;
    }

    try {
      this.currentSession = await this.createSyncSession();
      this.emit('syncStarted', { sessionId: this.currentSession.id });

      // Upload pending changes
      await this.uploadPendingChanges();

      // Download remote changes
      await this.downloadRemoteChanges();

      // Resolve conflicts
      await this.resolveConflicts();

      // Complete session
      await this.completeSyncSession(this.currentSession);

      this.emit('syncCompleted', {
        sessionId: this.currentSession.id,
        entitiesSynced: this.currentSession.entitiesSynced
      });

    } catch (error) {
      console.error('Full sync failed:', error);

      if (this.currentSession) {
        await this.failSyncSession(this.currentSession, error);
      }

      this.emit('syncFailed', { error });
      throw error;
    } finally {
      this.currentSession = null;
    }
  }

  /**
   * Perform incremental synchronization
   */
  public async performIncrementalSync(): Promise<void> {
    if (!this.isOnline || this.pendingChanges.size === 0) {
      return;
    }

    try {
      // Upload only pending changes
      await this.uploadPendingChanges();

      this.emit('incrementalSyncCompleted', {
        entitiesUploaded: this.pendingChanges.size
      });

    } catch (error) {
      console.error('Incremental sync failed:', error);
      this.emit('syncFailed', { error });
    }
  }

  /**
   * Upload pending changes to server
   */
  private async uploadPendingChanges(): Promise<void> {
    const entities = Array.from(this.pendingChanges.values());
    const batches = this.createBatches(entities, this.config.batchSize);

    for (const batch of batches) {
      await this.uploadBatch(batch);
    }

    // Clear uploaded entities
    this.pendingChanges.clear();
  }

  /**
   * Upload a batch of entities
   */
  private async uploadBatch(entities: SyncEntity[]): Promise<void> {
    try {
      const payload = this.config.enableCompression
        ? await this.compressData(entities)
        : entities;

      const response = await fetch(`${this.config.apiEndpoint}/sync/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'X-Device-ID': this.deviceInfo.deviceId,
          'X-Compression': this.config.enableCompression ? 'gzip' : 'none'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Handle conflicts returned by server
      if (result.conflicts && result.conflicts.length > 0) {
        this.conflictQueue.push(...result.conflicts);
      }

      if (this.currentSession) {
        this.currentSession.entitiesSynced += entities.length;
        this.currentSession.bytesTransferred += JSON.stringify(entities).length;
      }

    } catch (error) {
      console.error('Failed to upload batch:', error);
      throw error;
    }
  }

  /**
   * Download remote changes from server
   */
  private async downloadRemoteChanges(): Promise<void> {
    try {
      const lastSyncTime = await this.getLastSyncTimestamp();

      const response = await fetch(`${this.config.apiEndpoint}/sync/download?since=${lastSyncTime}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'X-Device-ID': this.deviceInfo.deviceId
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const data = await response.json();
      let entities = data.entities || [];

      if (data.compressed) {
        entities = await this.decompressData(entities);
      }

      // Process downloaded entities
      for (const entity of entities) {
        await this.processRemoteEntity(entity);
      }

      // Update last sync timestamp
      await this.setLastSyncTimestamp(Date.now());

    } catch (error) {
      console.error('Failed to download remote changes:', error);
      throw error;
    }
  }

  /**
   * Process remote entity and handle conflicts
   */
  private async processRemoteEntity(remoteEntity: SyncEntity): Promise<void> {
    try {
      // Check for local entity
      const localEntity = await this.getLocalEntity(remoteEntity.id);

      if (!localEntity) {
        // New entity - store locally
        await this.storeLocalEntity(remoteEntity);
        this.emit('entityReceived', { entity: remoteEntity });
        return;
      }

      // Check for conflicts
      if (this.hasConflict(localEntity, remoteEntity)) {
        const conflict: SyncConflict = {
          entityId: remoteEntity.id,
          type: remoteEntity.type,
          localVersion: localEntity,
          remoteVersion: remoteEntity,
          conflictType: this.determineConflictType(localEntity, remoteEntity),
          resolutionStrategy: this.config.conflictResolution,
          createdAt: new Date()
        };

        this.conflictQueue.push(conflict);
        this.emit('conflictDetected', { conflict });
      } else {
        // No conflict - update local entity
        await this.storeLocalEntity(remoteEntity);
        this.emit('entityUpdated', { entity: remoteEntity });
      }

    } catch (error) {
      console.error('Failed to process remote entity:', error);
    }
  }

  /**
   * Resolve pending conflicts
   */
  private async resolveConflicts(): Promise<void> {
    for (const conflict of this.conflictQueue) {
      try {
        await this.resolveConflict(conflict);
      } catch (error) {
        console.error('Failed to resolve conflict:', error);
      }
    }

    this.conflictQueue = [];
  }

  /**
   * Resolve individual conflict
   */
  private async resolveConflict(conflict: SyncConflict): Promise<void> {
    let resolvedEntity: SyncEntity;

    switch (conflict.resolutionStrategy) {
      case 'client':
        resolvedEntity = conflict.localVersion;
        break;

      case 'server':
        resolvedEntity = conflict.remoteVersion;
        break;

      case 'merge':
        resolvedEntity = await this.mergeEntities(conflict.localVersion, conflict.remoteVersion);
        break;

      case 'manual':
        this.emit('manualConflictResolution', { conflict });
        return; // Don't resolve automatically
    }

    // Store resolved entity
    await this.storeLocalEntity(resolvedEntity);

    // Upload resolution if it was merged or client won
    if (conflict.resolutionStrategy === 'client' || conflict.resolutionStrategy === 'merge') {
      this.pendingChanges.set(resolvedEntity.id, resolvedEntity);
    }

    if (this.currentSession) {
      this.currentSession.conflictsResolved++;
    }

    this.emit('conflictResolved', { conflict, resolvedEntity });
  }

  /**
   * Merge two conflicting entities
   */
  private async mergeEntities(local: SyncEntity, remote: SyncEntity): Promise<SyncEntity> {
    // Basic merge strategy - can be customized per entity type
    const mergedData = {
      ...remote.data,
      ...local.data
    };

    return {
      ...remote,
      data: mergedData,
      version: Math.max(local.version, remote.version) + 1,
      lastModified: new Date(),
      deviceId: this.deviceInfo.deviceId,
      metadata: {
        ...remote.metadata,
        checksum: this.calculateChecksum(mergedData),
        size: this.calculateSize(mergedData)
      }
    };
  }

  /**
   * Check if entities have conflicts
   */
  private hasConflict(local: SyncEntity, remote: SyncEntity): boolean {
    // Version conflict
    if (local.version !== remote.version) {
      return true;
    }

    // Data checksum conflict
    if (local.metadata.checksum !== remote.metadata.checksum) {
      return true;
    }

    return false;
  }

  /**
   * Determine conflict type
   */
  private determineConflictType(local: SyncEntity, remote: SyncEntity): SyncConflict['conflictType'] {
    if (local.version !== remote.version) {
      return 'version';
    }

    if (Math.abs(local.lastModified.getTime() - remote.lastModified.getTime()) < 1000) {
      return 'concurrent';
    }

    return 'schema';
  }

  /**
   * Create batches from entities
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Upload single entity
   */
  private async uploadEntity(entity: SyncEntity): Promise<void> {
    await this.uploadBatch([entity]);
  }

  /**
   * Handle remote entity updates via WebSocket
   */
  private handleRemoteEntityUpdate(entity: SyncEntity): void {
    this.processRemoteEntity(entity);
  }

  /**
   * Handle remote entity deletions via WebSocket
   */
  private handleRemoteEntityDeletion(entityId: string): void {
    this.deleteLocalEntity(entityId);
    this.emit('entityDeleted', { entityId });
  }

  /**
   * Handle remote conflicts via WebSocket
   */
  private handleRemoteConflict(conflict: SyncConflict): void {
    this.conflictQueue.push(conflict);
    this.emit('conflictDetected', { conflict });
  }

  // Utility methods
  private generateEntityId(): string {
    return 'entity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private calculateChecksum(data: any): string {
    // Simple checksum calculation
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length;
  }

  private async compressData(data: any): Promise<any> {
    // Implement compression logic (e.g., using gzip)
    return data; // Placeholder
  }

  private async decompressData(data: any): Promise<any> {
    // Implement decompression logic
    return data; // Placeholder
  }

  private async getLocalEntity(id: string): Promise<SyncEntity | null> {
    // Implement local storage retrieval
    const stored = localStorage.getItem(`entity_${id}`);
    return stored ? JSON.parse(stored) : null;
  }

  private async storeLocalEntity(entity: SyncEntity): Promise<void> {
    // Implement local storage
    localStorage.setItem(`entity_${entity.id}`, JSON.stringify(entity));
  }

  private async deleteLocalEntity(id: string): Promise<void> {
    // Implement local storage deletion
    localStorage.removeItem(`entity_${id}`);
  }

  private async createSyncSession(): Promise<SyncSession> {
    const session: SyncSession = {
      id: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      deviceId: this.deviceInfo.deviceId,
      userId: await this.getCurrentUserId(),
      startTime: new Date(),
      status: 'active',
      entitiesSynced: 0,
      conflictsResolved: 0,
      bytesTransferred: 0
    };

    return session;
  }

  private async completeSyncSession(session: SyncSession): Promise<void> {
    session.endTime = new Date();
    session.status = 'completed';

    // Log session to server
    try {
      await fetch(`${this.config.apiEndpoint}/sync/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(session)
      });
    } catch (error) {
      console.error('Failed to log sync session:', error);
    }
  }

  private async failSyncSession(session: SyncSession, error: any): Promise<void> {
    session.endTime = new Date();
    session.status = 'failed';
    session.error = error instanceof Error ? error.message : 'Unknown error';

    // Log failed session
    try {
      await fetch(`${this.config.apiEndpoint}/sync/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(session)
      });
    } catch (logError) {
      console.error('Failed to log failed sync session:', logError);
    }
  }

  private async getLastSyncTimestamp(): Promise<number> {
    const timestamp = localStorage.getItem('lastSyncTimestamp');
    return timestamp ? parseInt(timestamp) : 0;
  }

  private async setLastSyncTimestamp(timestamp: number): Promise<void> {
    localStorage.setItem('lastSyncTimestamp', timestamp.toString());
  }

  private async getCurrentUserId(): Promise<string> {
    // Implement user ID retrieval
    return localStorage.getItem('userId') || '';
  }

  private async getAuthToken(): Promise<string> {
    return localStorage.getItem('authToken') || '';
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online');

      // Reconnect WebSocket
      if (this.config.enableRealTime) {
        this.connectWebSocket();
      }

      // Perform sync when coming back online
      this.performIncrementalSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline');

      // Close WebSocket
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }
    });
  }

  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline && this.pendingChanges.size > 0) {
        this.performIncrementalSync();
      }
    }, this.config.syncInterval);
  }

  // Public API methods
  public getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  public getPendingChanges(): SyncEntity[] {
    return Array.from(this.pendingChanges.values());
  }

  public getConflictQueue(): SyncConflict[] {
    return [...this.conflictQueue];
  }

  public getCurrentSession(): SyncSession | null {
    return this.currentSession;
  }

  public isOnlineStatus(): boolean {
    return this.isOnline;
  }

  public async manualConflictResolution(conflictId: string, resolution: 'local' | 'remote' | 'merge'): Promise<void> {
    const conflict = this.conflictQueue.find(c => c.entityId === conflictId);
    if (!conflict) {
      throw new Error('Conflict not found');
    }

    conflict.resolutionStrategy = resolution === 'local' ? 'client' : resolution === 'remote' ? 'server' : 'merge';
    await this.resolveConflict(conflict);

    // Remove from queue
    this.conflictQueue = this.conflictQueue.filter(c => c.entityId !== conflictId);
  }

  // Event system
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  public destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    if (this.websocket) {
      this.websocket.close();
    }

    this.eventListeners.clear();
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
  }
}

// Default configuration
export const defaultSyncConfig: SyncConfig = {
  apiEndpoint: '/api/sync',
  websocketEndpoint: 'wss://api.legacyguard.com/ws',
  syncInterval: 30000, // 30 seconds
  batchSize: 50,
  conflictResolution: 'merge',
  enableRealTime: true,
  enableCompression: true,
  retryAttempts: 3,
  platforms: ['web', 'ios', 'android', 'desktop']
};

export default CrossPlatformSyncManager;