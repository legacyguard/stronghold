"use client";

// Service Worker Registration and PWA utilities
// Provides offline functionality registration and management

interface ServiceWorkerUpdateEvent {
  type: 'update-available' | 'update-installed' | 'offline' | 'online';
  payload?: any;
}

type ServiceWorkerCallback = (event: ServiceWorkerUpdateEvent) => void;

class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private callbacks: ServiceWorkerCallback[] = [];
  private isOnline = true;

  private constructor() {
    this.initializeNetworkStatus();
  }

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  // Register service worker
  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported in this browser');
      return false;
    }

    try {
      console.log('Registering Service Worker...');

      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'imports'
      });

      console.log('Service Worker registered successfully');

      // Set up event listeners
      this.setupEventListeners();

      // Check for updates
      this.checkForUpdates();

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  // Set up service worker event listeners
  private setupEventListeners(): void {
    if (!this.registration) return;

    // Listen for updates
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration?.installing;
      if (!newWorker) return;

      console.log('New Service Worker found, installing...');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            console.log('New update available');
            this.notifyCallbacks({
              type: 'update-available',
              payload: { newWorker }
            });
          } else {
            // First install
            console.log('Service Worker installed for the first time');
            this.notifyCallbacks({
              type: 'update-installed',
              payload: { newWorker }
            });
          }
        }
      });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Message from Service Worker:', event.data);

      if (event.data.type === 'CACHE_UPDATED') {
        this.notifyCallbacks({
          type: 'update-installed',
          payload: event.data
        });
      }
    });

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed');
      window.location.reload();
    });
  }

  // Initialize network status monitoring
  private initializeNetworkStatus(): void {
    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      console.log('App is back online');
      this.isOnline = true;
      this.notifyCallbacks({ type: 'online' });
    });

    window.addEventListener('offline', () => {
      console.log('App is offline');
      this.isOnline = false;
      this.notifyCallbacks({ type: 'offline' });
    });
  }

  // Check for service worker updates
  async checkForUpdates(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log('Checked for Service Worker updates');
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }

  // Skip waiting and activate new service worker
  async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) return;

    // Send message to waiting service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  // Cache a document for offline access
  async cacheDocument(document: any): Promise<boolean> {
    if (!navigator.serviceWorker.controller) {
      console.warn('No active service worker to cache document');
      return false;
    }

    try {
      const messageChannel = new MessageChannel();

      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };

        if (!navigator.serviceWorker.controller) {
          resolve(false);
          return;
        }

        navigator.serviceWorker.controller.postMessage(
          {
            type: 'CACHE_DOCUMENT',
            document
          },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('Failed to cache document:', error);
      return false;
    }
  }

  // Get cache status
  async getCacheStatus(): Promise<any> {
    if (!navigator.serviceWorker.controller) {
      return { isOfflineReady: false, caches: [], totalSize: 0 };
    }

    try {
      const messageChannel = new MessageChannel();

      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.status || {});
        };

        if (!navigator.serviceWorker.controller) {
          resolve({ isOfflineReady: false, caches: [], totalSize: 0 });
          return;
        }

        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_STATUS' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('Failed to get cache status:', error);
      return { isOfflineReady: false, caches: [], totalSize: 0 };
    }
  }

  // Register background sync
  async registerBackgroundSync(tag: string): Promise<boolean> {
    if (!this.registration || !('sync' in this.registration)) {
      console.warn('Background sync not supported');
      return false;
    }

    try {
      await (this.registration as any).sync.register(tag);
      console.log(`Background sync registered: ${tag}`);
      return true;
    } catch (error) {
      console.error('Failed to register background sync:', error);
      return false;
    }
  }

  // Subscribe to callbacks
  onUpdate(callback: ServiceWorkerCallback): void {
    this.callbacks.push(callback);
  }

  // Remove callback
  offUpdate(callback: ServiceWorkerCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  // Notify all callbacks
  private notifyCallbacks(event: ServiceWorkerUpdateEvent): void {
    this.callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in service worker callback:', error);
      }
    });
  }

  // Check if app is online
  get online(): boolean {
    return this.isOnline;
  }

  // Get registration
  get serviceWorkerRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}

// Export singleton instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance();

// React hook for using service worker
export function useServiceWorker() {
  const [isOnline, setIsOnline] = React.useState(serviceWorkerManager.online);
  const [updateAvailable, setUpdateAvailable] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    const handleUpdate = (event: ServiceWorkerUpdateEvent) => {
      switch (event.type) {
        case 'online':
          setIsOnline(true);
          break;
        case 'offline':
          setIsOnline(false);
          break;
        case 'update-available':
          setUpdateAvailable(true);
          break;
        case 'update-installed':
          setIsInstalled(true);
          break;
      }
    };

    serviceWorkerManager.onUpdate(handleUpdate);

    return () => {
      serviceWorkerManager.offUpdate(handleUpdate);
    };
  }, []);

  const installUpdate = React.useCallback(async () => {
    await serviceWorkerManager.skipWaiting();
    setUpdateAvailable(false);
  }, []);

  const cacheDocument = React.useCallback(async (document: any) => {
    return await serviceWorkerManager.cacheDocument(document);
  }, []);

  const getCacheStatus = React.useCallback(async () => {
    return await serviceWorkerManager.getCacheStatus();
  }, []);

  return {
    isOnline,
    updateAvailable,
    isInstalled,
    installUpdate,
    cacheDocument,
    getCacheStatus
  };
}

// Auto-register service worker in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  serviceWorkerManager.register().catch(console.error);
}

// Import React for hook
import React from 'react';