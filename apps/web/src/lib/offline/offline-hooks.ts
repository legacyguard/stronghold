'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { OfflineStorageManager, StoredData, defaultOfflineConfig } from './offline-storage';

/**
 * Hook for managing online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);
  const [lastOfflineTime, setLastOfflineTime] = useState<Date | null>(null);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);

      if (online) {
        setLastOnlineTime(new Date());
      } else {
        setLastOfflineTime(new Date());
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    lastOnlineTime,
    lastOfflineTime
  };
}

/**
 * Hook for offline storage operations
 */
export function useOfflineStorage(config = defaultOfflineConfig) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{
    issyncing: boolean;
    pendingOperations: number;
    lastSyncTime: Date | null;
  }>({
    issyncing: false,
    pendingOperations: 0,
    lastSyncTime: null
  });

  const storageRef = useRef<OfflineStorageManager | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeStorage = async () => {
      try {
        const storage = OfflineStorageManager.getInstance(config);
        await storage.initialize();

        if (mounted) {
          storageRef.current = storage;
          setIsInitialized(true);
          setError(null);

          // Set up event listeners
          storage.on('syncCompleted', (data: any) => {
            setSyncStatus(prev => ({
              ...prev,
              issyncing: false,
              pendingOperations: data.remaining,
              lastSyncTime: new Date()
            }));
          });

          storage.on('error', (data: any) => {
            setError(data.error);
          });
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize offline storage');
        }
      }
    };

    initializeStorage();

    return () => {
      mounted = false;
    };
  }, []);

  const store = useCallback(async (type: string, data: any, options?: any) => {
    if (!storageRef.current) {
      throw new Error('Storage not initialized');
    }
    return await storageRef.current.store(type, data, options);
  }, []);

  const get = useCallback(async (id: string) => {
    if (!storageRef.current) {
      throw new Error('Storage not initialized');
    }
    return await storageRef.current.get(id);
  }, []);

  const query = useCallback(async (type: string, filters?: any) => {
    if (!storageRef.current) {
      throw new Error('Storage not initialized');
    }
    return await storageRef.current.query(type, filters);
  }, []);

  const update = useCallback(async (id: string, updates: any, options?: any) => {
    if (!storageRef.current) {
      throw new Error('Storage not initialized');
    }
    return await storageRef.current.update(id, updates, options);
  }, []);

  const remove = useCallback(async (id: string, options?: any) => {
    if (!storageRef.current) {
      throw new Error('Storage not initialized');
    }
    return await storageRef.current.delete(id, options);
  }, []);

  const sync = useCallback(async () => {
    if (!storageRef.current) {
      throw new Error('Storage not initialized');
    }

    setSyncStatus(prev => ({ ...prev, issyncing: true }));

    try {
      await storageRef.current.processSyncQueue();
      await storageRef.current.downloadUpdates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    }
  }, []);

  const clearAll = useCallback(async () => {
    if (!storageRef.current) {
      throw new Error('Storage not initialized');
    }
    return await storageRef.current.clearAll();
  }, []);

  return {
    isInitialized,
    error,
    syncStatus,
    store,
    get,
    query,
    update,
    remove,
    sync,
    clearAll
  };
}

/**
 * Hook for managing offline documents
 */
export function useOfflineDocuments() {
  const { store, query, update, remove, isInitialized } = useOfflineStorage();
  const [documents, setDocuments] = useState<StoredData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setLoading(true);
      const docs = await query('documents', {
        sortBy: 'lastModified',
        sortOrder: 'desc'
      });
      setDocuments(docs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [isInitialized, query]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const createDocument = useCallback(async (documentData: any, options?: any) => {
    try {
      const id = await store('documents', documentData, options);
      await loadDocuments(); // Refresh the list
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
      throw err;
    }
  }, [store, loadDocuments]);

  const updateDocument = useCallback(async (id: string, updates: any, options?: any) => {
    try {
      await update(id, updates, options);
      await loadDocuments(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document');
      throw err;
    }
  }, [update, loadDocuments]);

  const deleteDocument = useCallback(async (id: string, options?: any) => {
    try {
      await remove(id, options);
      await loadDocuments(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      throw err;
    }
  }, [remove, loadDocuments]);

  const getDraftDocuments = useCallback(() => {
    return documents.filter(doc => doc.data.status === 'draft');
  }, [documents]);

  const getPendingSyncDocuments = useCallback(() => {
    return documents.filter(doc => doc.syncStatus === 'pending');
  }, [documents]);

  return {
    documents,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    getDraftDocuments,
    getPendingSyncDocuments,
    refresh: loadDocuments
  };
}

/**
 * Hook for managing offline cache
 */
export function useOfflineCache<T>(key: string, fetcher: () => Promise<T>, options: {
  ttl?: number; // Time to live in milliseconds
  refetchOnMount?: boolean;
  refetchOnFocus?: boolean;
  syncImmediately?: boolean;
} = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const { store, get, isInitialized } = useOfflineStorage();
  const { isOnline } = useOnlineStatus();

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!isInitialized) return;

    try {
      setLoading(true);
      setError(null);

      // Try to get from cache first
      const cached = await get(key);
      const now = Date.now();
      const isExpired = cached && options.ttl && (now - cached.timestamp) > options.ttl;

      if (cached && !isExpired && !forceRefresh) {
        setData(cached.data);
        setLastFetch(new Date(cached.timestamp));
        setLoading(false);
        return cached.data;
      }

      // Fetch fresh data if online
      if (isOnline || forceRefresh) {
        const freshData = await fetcher();

        // Store in cache
        await store('cache', freshData, {
          id: key,
          syncImmediately: options.syncImmediately
        });

        setData(freshData);
        setLastFetch(new Date());
        return freshData;
      } else if (cached) {
        // Use stale cache when offline
        setData(cached.data);
        setLastFetch(new Date(cached.timestamp));
        return cached.data;
      } else {
        throw new Error('No cached data available and device is offline');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, get, store, isInitialized, isOnline, options.ttl, options.syncImmediately]);

  // Initial fetch
  useEffect(() => {
    if (options.refetchOnMount !== false) {
      fetchData();
    }
  }, [fetchData, options.refetchOnMount]);

  // Refetch on focus
  useEffect(() => {
    if (!options.refetchOnFocus) return;

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData, options.refetchOnFocus]);

  // Refetch when coming back online
  useEffect(() => {
    if (isOnline && lastFetch) {
      const timeSinceLastFetch = Date.now() - lastFetch.getTime();
      if (options.ttl && timeSinceLastFetch > options.ttl) {
        fetchData();
      }
    }
  }, [isOnline, lastFetch, fetchData, options.ttl]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastFetch,
    refresh,
    isStale: lastFetch && options.ttl ? (Date.now() - lastFetch.getTime()) > options.ttl : false
  };
}

/**
 * Hook for managing offline form data
 */
export function useOfflineForm<T extends Record<string, any>>(
  formId: string,
  initialData: T,
  options: {
    autosave?: boolean;
    autosaveDelay?: number;
    syncOnComplete?: boolean;
  } = {}
) {
  const [formData, setFormData] = useState<T>(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { store, get, update, isInitialized } = useOfflineStorage();
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Load saved form data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      if (!isInitialized) return;

      try {
        const saved = await get(`form_${formId}`);
        if (saved) {
          setFormData(saved.data);
          setLastSaved(new Date(saved.timestamp));
        }
      } catch (err) {
        console.error('Failed to load saved form data:', err);
      }
    };

    loadSavedData();
  }, [formId, get, isInitialized]);

  // Auto-save with debouncing
  useEffect(() => {
    if (!options.autosave || !isDirty || !isInitialized) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);

        const existingData = await get(`form_${formId}`);

        if (existingData) {
          await update(`form_${formId}`, formData);
        } else {
          await store('form_drafts', formData, { id: `form_${formId}` });
        }

        setLastSaved(new Date());
        setIsDirty(false);
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setIsSaving(false);
      }
    }, options.autosaveDelay || 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, isDirty, formId, store, update, get, isInitialized, options.autosave, options.autosaveDelay]);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const updateFields = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  const saveForm = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setIsSaving(true);

      const existingData = await get(`form_${formId}`);

      if (existingData) {
        await update(`form_${formId}`, formData, {
          syncImmediately: options.syncOnComplete
        });
      } else {
        await store('form_drafts', formData, {
          id: `form_${formId}`,
          syncImmediately: options.syncOnComplete
        });
      }

      setLastSaved(new Date());
      setIsDirty(false);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save form');
    } finally {
      setIsSaving(false);
    }
  }, [formId, formData, store, update, get, isInitialized, options.syncOnComplete]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setIsDirty(false);
  }, [initialData]);

  const clearSaved = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await update(`form_${formId}`, null);
      setLastSaved(null);
    } catch (err) {
      console.error('Failed to clear saved form:', err);
    }
  }, [formId, update, isInitialized]);

  return {
    formData,
    isDirty,
    lastSaved,
    isSaving,
    updateField,
    updateFields,
    saveForm,
    resetForm,
    clearSaved
  };
}

/**
 * Hook for offline sync status and controls
 */
export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<{
    issyncing: boolean;
    pendingOperations: number;
    lastSyncTime: Date | null;
    errors: string[];
  }>({
    issyncing: false,
    pendingOperations: 0,
    lastSyncTime: null,
    errors: []
  });

  const { sync, isInitialized } = useOfflineStorage();
  const { isOnline } = useOnlineStatus();

  const forcSync = useCallback(async () => {
    if (!isInitialized || !isOnline) return;

    try {
      setSyncStatus(prev => ({ ...prev, issyncing: true, errors: [] }));
      await sync();
      setSyncStatus(prev => ({
        ...prev,
        issyncing: false,
        lastSyncTime: new Date()
      }));
    } catch (err) {
      setSyncStatus(prev => ({
        ...prev,
        issyncing: false,
        errors: [...prev.errors, err instanceof Error ? err.message : 'Sync failed']
      }));
    }
  }, [sync, isInitialized, isOnline]);

  return {
    syncStatus,
    canSync: isInitialized && isOnline,
    forcSync
  };
}

export default {
  useOnlineStatus,
  useOfflineStorage,
  useOfflineDocuments,
  useOfflineCache,
  useOfflineForm,
  useOfflineSync
};