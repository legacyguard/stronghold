/**
 * Offline Storage System for LegacyGuard
 * Provides IndexedDB-based storage with automatic sync capabilities
 */

export interface StoredData {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  lastModified: number;
  syncStatus: 'pending' | 'synced' | 'conflict' | 'error';
  version: number;
  metadata?: {
    userId?: string;
    organizationId?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    tags?: string[];
  };
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
}

export interface OfflineConfig {
  dbName: string;
  version: number;
  tables: string[];
  syncEndpoint: string;
  maxRetries: number;
  syncInterval: number; // ms
  conflictResolution: 'client' | 'server' | 'manual';
}

export class OfflineStorageManager {
  private static instance: OfflineStorageManager;
  private db: IDBDatabase | null = null;
  private config: OfflineConfig;
  private syncQueue: SyncOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor(config: OfflineConfig) {
    this.config = config;
    this.setupNetworkListeners();
    this.startSyncTimer();
  }

  public static getInstance(config?: OfflineConfig): OfflineStorageManager {
    if (!OfflineStorageManager.instance) {
      if (!config) {
        throw new Error('Configuration required for first initialization');
      }
      OfflineStorageManager.instance = new OfflineStorageManager(config);
    }
    return OfflineStorageManager.instance;
  }

  /**
   * Initialize the offline storage system
   */
  public async initialize(): Promise<void> {
    try {
      console.log('Initializing offline storage...');

      await this.openDatabase();
      await this.loadSyncQueue();

      if (this.isOnline) {
        await this.processSyncQueue();
      }

      console.log('✓ Offline storage initialized successfully');
      this.emit('initialized', { success: true });
    } catch (error) {
      console.error('❌ Failed to initialize offline storage:', error);
      this.emit('error', { error: 'Failed to initialize offline storage', details: error });
      throw error;
    }
  }

  /**
   * Open IndexedDB database
   */
  private async openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create main data store
        if (!db.objectStoreNames.contains('data')) {
          const dataStore = db.createObjectStore('data', { keyPath: 'id' });
          dataStore.createIndex('type', 'type', { unique: false });
          dataStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          dataStore.createIndex('timestamp', 'timestamp', { unique: false });
          dataStore.createIndex('userId', ['metadata', 'userId'], { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('type', 'type', { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Store data with offline support
   */
  public async store(type: string, data: any, options: {
    id?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    metadata?: any;
    syncImmediately?: boolean;
  } = {}): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const id = options.id || this.generateId();
    const timestamp = Date.now();

    const storedData: StoredData = {
      id,
      type,
      data,
      timestamp,
      lastModified: timestamp,
      syncStatus: this.isOnline ? 'pending' : 'pending',
      version: 1,
      metadata: {
        priority: options.priority || 'normal',
        ...options.metadata
      }
    };

    // Store locally
    await this.storeLocal(storedData);

    // Add to sync queue
    await this.addToSyncQueue({
      id: this.generateId(),
      type: 'create',
      table: type,
      data: storedData,
      timestamp,
      retryCount: 0,
      maxRetries: this.config.maxRetries
    });

    // Sync immediately if requested and online
    if (options.syncImmediately && this.isOnline) {
      await this.processSyncQueue();
    }

    this.emit('stored', { id, type, data: storedData });
    return id;
  }

  /**
   * Retrieve data by ID
   */
  public async get(id: string): Promise<StoredData | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readonly');
      const store = transaction.objectStore('data');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Query data by type with filters
   */
  public async query(type: string, filters: {
    limit?: number;
    offset?: number;
    sortBy?: 'timestamp' | 'lastModified';
    sortOrder?: 'asc' | 'desc';
    syncStatus?: 'pending' | 'synced' | 'conflict' | 'error';
    userId?: string;
  } = {}): Promise<StoredData[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readonly');
      const store = transaction.objectStore('data');
      const index = store.index('type');
      const request = index.getAll(type);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        let results = request.result || [];

        // Apply filters
        if (filters.syncStatus) {
          results = results.filter(item => item.syncStatus === filters.syncStatus);
        }

        if (filters.userId) {
          results = results.filter(item => item.metadata?.userId === filters.userId);
        }

        // Sort
        if (filters.sortBy) {
          results.sort((a, b) => {
            const aValue = a[filters.sortBy!];
            const bValue = b[filters.sortBy!];
            const comparison = aValue - bValue;
            return filters.sortOrder === 'desc' ? -comparison : comparison;
          });
        }

        // Pagination
        if (filters.offset) {
          results = results.slice(filters.offset);
        }
        if (filters.limit) {
          results = results.slice(0, filters.limit);
        }

        resolve(results);
      };
    });
  }

  /**
   * Update existing data
   */
  public async update(id: string, updates: Partial<any>, options: {
    syncImmediately?: boolean;
  } = {}): Promise<void> {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Data with ID ${id} not found`);
    }

    const updatedData: StoredData = {
      ...existing,
      data: { ...existing.data, ...updates },
      lastModified: Date.now(),
      syncStatus: 'pending',
      version: existing.version + 1
    };

    await this.storeLocal(updatedData);

    // Add to sync queue
    await this.addToSyncQueue({
      id: this.generateId(),
      type: 'update',
      table: existing.type,
      data: updatedData,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.config.maxRetries
    });

    if (options.syncImmediately && this.isOnline) {
      await this.processSyncQueue();
    }

    this.emit('updated', { id, data: updatedData });
  }

  /**
   * Delete data
   */
  public async delete(id: string, options: {
    syncImmediately?: boolean;
  } = {}): Promise<void> {
    const existing = await this.get(id);
    if (!existing) {
      return; // Already deleted
    }

    // Remove from local storage
    await this.deleteLocal(id);

    // Add to sync queue
    await this.addToSyncQueue({
      id: this.generateId(),
      type: 'delete',
      table: existing.type,
      data: { id },
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.config.maxRetries
    });

    if (options.syncImmediately && this.isOnline) {
      await this.processSyncQueue();
    }

    this.emit('deleted', { id });
  }

  /**
   * Store data locally in IndexedDB
   */
  private async storeLocal(data: StoredData): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readwrite');
      const store = transaction.objectStore('data');
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Delete data locally from IndexedDB
   */
  private async deleteLocal(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readwrite');
      const store = transaction.objectStore('data');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Add operation to sync queue
   */
  private async addToSyncQueue(operation: SyncOperation): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    this.syncQueue.push(operation);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.put(operation);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Load sync queue from storage
   */
  private async loadSyncQueue(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.syncQueue = request.result || [];
        resolve();
      };
    });
  }

  /**
   * Process sync queue - upload changes to server
   */
  public async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    console.log(`Processing ${this.syncQueue.length} sync operations...`);

    const operations = [...this.syncQueue];

    for (const operation of operations) {
      try {
        await this.syncOperation(operation);
        await this.removeSyncOperation(operation.id);
        this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
      } catch (error) {
        console.error(`Sync operation ${operation.id} failed:`, error);

        operation.retryCount++;
        operation.lastError = error instanceof Error ? error.message : 'Unknown error';

        if (operation.retryCount >= operation.maxRetries) {
          // Mark as error and remove from queue
          await this.markSyncError(operation);
          await this.removeSyncOperation(operation.id);
          this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
        } else {
          // Update retry count
          await this.updateSyncOperation(operation);
        }
      }
    }

    this.emit('syncCompleted', {
      processed: operations.length,
      remaining: this.syncQueue.length
    });
  }

  /**
   * Sync individual operation with server
   */
  private async syncOperation(operation: SyncOperation): Promise<void> {
    const endpoint = `${this.config.syncEndpoint}/${operation.table}`;

    let response: Response;

    switch (operation.type) {
      case 'create':
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getAuthToken()}`
          },
          body: JSON.stringify(operation.data)
        });
        break;

      case 'update':
        response = await fetch(`${endpoint}/${operation.data.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getAuthToken()}`
          },
          body: JSON.stringify(operation.data)
        });
        break;

      case 'delete':
        response = await fetch(`${endpoint}/${operation.data.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${await this.getAuthToken()}`
          }
        });
        break;

      default:
        throw new Error(`Unknown sync operation type: ${operation.type}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Update local data sync status
    if (operation.type !== 'delete') {
      const updatedData = { ...operation.data, syncStatus: 'synced' as const };
      await this.storeLocal(updatedData);
    }
  }

  /**
   * Download updates from server
   */
  public async downloadUpdates(since?: number): Promise<void> {
    if (!this.isOnline) {
      return;
    }

    try {
      const timestamp = since || await this.getLastSyncTimestamp();
      const endpoint = `${this.config.syncEndpoint}/changes?since=${timestamp}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const changes = await response.json();

      for (const change of changes) {
        await this.handleServerChange(change);
      }

      await this.setLastSyncTimestamp(Date.now());

      this.emit('downloaded', { changesCount: changes.length });
    } catch (error) {
      console.error('Failed to download updates:', error);
      this.emit('error', { error: 'Failed to download updates', details: error });
    }
  }

  /**
   * Handle server change (conflict resolution)
   */
  private async handleServerChange(serverData: any): Promise<void> {
    const localData = await this.get(serverData.id);

    if (!localData) {
      // New data from server
      const storedData: StoredData = {
        id: serverData.id,
        type: serverData.type,
        data: serverData.data,
        timestamp: serverData.timestamp,
        lastModified: serverData.lastModified,
        syncStatus: 'synced',
        version: serverData.version,
        metadata: serverData.metadata
      };

      await this.storeLocal(storedData);
      this.emit('serverDataReceived', { data: storedData });
      return;
    }

    // Check for conflicts
    if (localData.syncStatus === 'pending' && localData.version !== serverData.version) {
      // Conflict detected
      await this.handleConflict(localData, serverData);
      return;
    }

    // Update local data with server version
    const updatedData: StoredData = {
      ...localData,
      data: serverData.data,
      lastModified: serverData.lastModified,
      syncStatus: 'synced',
      version: serverData.version
    };

    await this.storeLocal(updatedData);
    this.emit('dataUpdated', { data: updatedData });
  }

  /**
   * Handle data conflicts
   */
  private async handleConflict(localData: StoredData, serverData: any): Promise<void> {
    switch (this.config.conflictResolution) {
      case 'client':
        // Keep local data, mark as conflict
        localData.syncStatus = 'conflict';
        await this.storeLocal(localData);
        break;

      case 'server':
        // Accept server data
        const serverStoredData: StoredData = {
          ...localData,
          data: serverData.data,
          lastModified: serverData.lastModified,
          syncStatus: 'synced',
          version: serverData.version
        };
        await this.storeLocal(serverStoredData);
        break;

      case 'manual':
        // Mark as conflict for manual resolution
        localData.syncStatus = 'conflict';
        await this.storeLocal(localData);
        this.emit('conflict', { local: localData, server: serverData });
        break;
    }
  }

  /**
   * Clear all offline data
   */
  public async clearAll(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['data', 'syncQueue', 'metadata'], 'readwrite');

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('data').clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('syncQueue').clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('metadata').clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      })
    ]);

    this.syncQueue = [];
    this.emit('cleared');
  }

  /**
   * Get storage statistics
   */
  public async getStats(): Promise<{
    totalItems: number;
    pendingSync: number;
    syncErrors: number;
    conflicts: number;
    storageSize: number;
  }> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const [allData, syncQueue] = await Promise.all([
      this.query('*'),
      this.loadSyncQueue()
    ]);

    const stats = {
      totalItems: allData.length,
      pendingSync: allData.filter(item => item.syncStatus === 'pending').length,
      syncErrors: allData.filter(item => item.syncStatus === 'error').length,
      conflicts: allData.filter(item => item.syncStatus === 'conflict').length,
      storageSize: await this.getStorageSize()
    };

    return stats;
  }

  // Helper methods
  private generateId(): string {
    return 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private async getAuthToken(): Promise<string> {
    // Implement auth token retrieval
    return localStorage.getItem('authToken') || '';
  }

  private async getLastSyncTimestamp(): Promise<number> {
    const metadata = await this.getMetadata('lastSyncTimestamp');
    return metadata ? parseInt(metadata) : 0;
  }

  private async setLastSyncTimestamp(timestamp: number): Promise<void> {
    await this.setMetadata('lastSyncTimestamp', timestamp.toString());
  }

  private async getMetadata(key: string): Promise<string | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.value || null);
    });
  }

  private async setMetadata(key: string, value: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const request = store.put({ key, value });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async getStorageSize(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }

  private async removeSyncOperation(id: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async updateSyncOperation(operation: SyncOperation): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.put(operation);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async markSyncError(operation: SyncOperation): Promise<void> {
    const data = await this.get(operation.data.id);
    if (data) {
      data.syncStatus = 'error';
      await this.storeLocal(data);
    }
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online');
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline');
    });
  }

  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline) {
        this.downloadUpdates();
        this.processSyncQueue();
      }
    }, this.config.syncInterval);
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
    if (this.db) {
      this.db.close();
    }
    this.eventListeners.clear();
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
  }
}

// Default configuration
export const defaultOfflineConfig: OfflineConfig = {
  dbName: 'LegacyGuardOffline',
  version: 1,
  tables: ['documents', 'users', 'organizations', 'tasks', 'notifications'],
  syncEndpoint: '/api/sync',
  maxRetries: 3,
  syncInterval: 30000, // 30 seconds
  conflictResolution: 'manual'
};

export default OfflineStorageManager;