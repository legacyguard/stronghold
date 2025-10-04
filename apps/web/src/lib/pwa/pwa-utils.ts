// PWA Utilities for LegacyGuard
// Provides utilities for service worker management, offline detection, and PWA features

export interface PWACapabilities {
  isServiceWorkerSupported: boolean;
  isNotificationSupported: boolean;
  isBackgroundSyncSupported: boolean;
  isPushSupported: boolean;
  isCacheStorageSupported: boolean;
  isIndexedDBSupported: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
}

export interface ServiceWorkerStatus {
  isRegistered: boolean;
  isUpdating: boolean;
  isWaitingForActivation: boolean;
  hasUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
  controller: ServiceWorker | null;
}

export interface OfflineCapabilities {
  isOnline: boolean;
  hasOfflineData: boolean;
  offlineOperationsCount: number;
  syncStatus: 'idle' | 'syncing' | 'failed';
  lastSyncTime?: Date;
}

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

class PWAManager {
  private static instance: PWAManager;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private deferredPrompt: InstallPromptEvent | null = null;
  private isInitialized = false;
  private offlineQueue: Array<{ id: string; action: string; data: any; timestamp: Date }> = [];
  private eventListeners: Map<string, Function[]> = new Map();

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Register service worker
      await this.registerServiceWorker();

      // Setup offline handling
      this.setupOfflineHandling();

      // Setup install prompt handling
      this.setupInstallPrompt();

      // Setup notification permissions
      await this.setupNotifications();

      // Setup background sync
      this.setupBackgroundSync();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('PWA Manager initialized successfully');
    } catch (error) {
      console.error('PWA Manager initialization failed:', error);
      throw error;
    }
  }

  async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('Service Worker registered:', this.serviceWorkerRegistration);

      // Listen for updates
      this.serviceWorkerRegistration.addEventListener('updatefound', () => {
        const newWorker = this.serviceWorkerRegistration!.installing;
        if (newWorker) {
          this.handleServiceWorkerUpdate(newWorker);
        }
      });

      // Check for existing update
      if (this.serviceWorkerRegistration.waiting) {
        this.emit('updateAvailable', this.serviceWorkerRegistration.waiting);
      }

      return this.serviceWorkerRegistration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  private handleServiceWorkerUpdate(newWorker: ServiceWorker): void {
    console.log('Service Worker update detected');

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New update available
        this.emit('updateAvailable', newWorker);
      }
    });
  }

  async updateServiceWorker(): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service Worker not registered');
    }

    const waitingWorker = this.serviceWorkerRegistration.waiting;
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });

      // Wait for the new service worker to take control
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          resolve();
        });
      });

      this.emit('updateApplied');

      // Reload the page to apply changes
      window.location.reload();
    }
  }

  getCapabilities(): PWACapabilities {
    return {
      isServiceWorkerSupported: 'serviceWorker' in navigator,
      isNotificationSupported: 'Notification' in window,
      isBackgroundSyncSupported: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      isPushSupported: 'serviceWorker' in navigator && 'PushManager' in window,
      isCacheStorageSupported: 'caches' in window,
      isIndexedDBSupported: 'indexedDB' in window,
      isInstallable: this.deferredPrompt !== null,
      isInstalled: this.isAppInstalled(),
      isStandalone: this.isStandaloneMode()
    };
  }

  getServiceWorkerStatus(): ServiceWorkerStatus {
    return {
      isRegistered: this.serviceWorkerRegistration !== null,
      isUpdating: this.serviceWorkerRegistration?.installing !== null,
      isWaitingForActivation: this.serviceWorkerRegistration?.waiting !== null,
      hasUpdate: this.serviceWorkerRegistration?.waiting !== null,
      registration: this.serviceWorkerRegistration,
      controller: navigator.serviceWorker.controller
    };
  }

  getOfflineCapabilities(): OfflineCapabilities {
    return {
      isOnline: navigator.onLine,
      hasOfflineData: this.offlineQueue.length > 0,
      offlineOperationsCount: this.offlineQueue.length,
      syncStatus: this.getSyncStatus(),
      lastSyncTime: this.getLastSyncTime()
    };
  }

  async installApp(): Promise<void> {
    if (!this.deferredPrompt) {
      throw new Error('App installation not available');
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('App installation accepted');
        this.emit('appInstalled');
      } else {
        console.log('App installation dismissed');
        this.emit('appInstallDismissed');
      }

      this.deferredPrompt = null;
    } catch (error) {
      console.error('App installation failed:', error);
      throw error;
    }
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    this.emit('notificationPermissionChanged', permission);

    return permission;
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service Worker not registered');
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
      });

      console.log('Push subscription created:', subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      this.emit('pushSubscribed', subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    }
  }

  async unsubscribeFromPushNotifications(): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service Worker not registered');
    }

    const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await this.removeSubscriptionFromServer(subscription);
      this.emit('pushUnsubscribed');
    }
  }

  async addToOfflineQueue(action: string, data: any): Promise<string> {
    const id = crypto.randomUUID();
    const operation = {
      id,
      action,
      data,
      timestamp: new Date()
    };

    this.offlineQueue.push(operation);
    await this.saveOfflineQueue();

    this.emit('offlineOperationAdded', operation);

    return id;
  }

  async syncOfflineOperations(): Promise<void> {
    if (!navigator.onLine || this.offlineQueue.length === 0) {
      return;
    }

    this.emit('syncStarted');

    const operations = [...this.offlineQueue];
    const successfulOps: string[] = [];

    for (const operation of operations) {
      try {
        await this.executeOfflineOperation(operation);
        successfulOps.push(operation.id);
        this.emit('offlineOperationSynced', operation);
      } catch (error) {
        console.error('Failed to sync operation:', operation.id, error);
        this.emit('offlineOperationFailed', { operation, error });
      }
    }

    // Remove successful operations
    this.offlineQueue = this.offlineQueue.filter(op => !successfulOps.includes(op.id));
    await this.saveOfflineQueue();

    this.emit('syncCompleted', { synced: successfulOps.length, failed: operations.length - successfulOps.length });
  }

  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      this.emit('cacheCleared');
    }
  }

  async getCacheSize(): Promise<number> {
    if (!this.serviceWorkerRegistration) {
      return 0;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data.status.totalSize || 0);
        } else {
          resolve(0);
        }
      };

      this.serviceWorkerRegistration!.active?.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [messageChannel.port2]
      );
    });
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
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

  // Private helper methods

  private setupOfflineHandling(): void {
    window.addEventListener('online', () => {
      console.log('App came online');
      this.emit('online');
      this.syncOfflineOperations();
    });

    window.addEventListener('offline', () => {
      console.log('App went offline');
      this.emit('offline');
    });

    // Load offline queue from storage
    this.loadOfflineQueue();
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as InstallPromptEvent;
      this.emit('installPromptAvailable');
    });

    window.addEventListener('appinstalled', () => {
      console.log('App was installed');
      this.deferredPrompt = null;
      this.emit('appInstalled');
    });
  }

  private async setupNotifications(): Promise<void> {
    if ('Notification' in window) {
      this.emit('notificationPermissionChanged', Notification.permission);
    }
  }

  private setupBackgroundSync(): void {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      // Background sync will be handled by the service worker
      console.log('Background sync is supported');
    }
  }

  private async executeOfflineOperation(operation: any): Promise<void> {
    // Execute the offline operation by making the actual API call
    const response = await fetch(`/api/${operation.action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(operation.data)
    });

    if (!response.ok) {
      throw new Error(`Operation failed: ${response.status}`);
    }

    return response.json();
  }

  private async saveOfflineQueue(): Promise<void> {
    try {
      localStorage.setItem('pwa_offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private async loadOfflineQueue(): Promise<void> {
    try {
      const stored = localStorage.getItem('pwa_offline_queue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  private getSyncStatus(): 'idle' | 'syncing' | 'failed' {
    // Simplified sync status - would be more sophisticated in production
    return navigator.onLine ? 'idle' : 'failed';
  }

  private getLastSyncTime(): Date | undefined {
    const stored = localStorage.getItem('pwa_last_sync');
    return stored ? new Date(stored) : undefined;
  }

  private isAppInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://');
  }

  private isStandaloneMode(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instance
export const pwaManager = PWAManager.getInstance();

// Utility functions for common PWA operations
export const PWAUtils = {
  /**
   * Check if the app is running in PWA mode
   */
  isPWAMode(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  },

  /**
   * Check if the device is mobile
   */
  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  /**
   * Check if the device supports touch
   */
  isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  /**
   * Get network information
   */
  getNetworkInfo(): { effectiveType?: string; downlink?: number; rtt?: number } {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      };
    }

    return {};
  },

  /**
   * Get device memory info
   */
  getDeviceMemory(): number | undefined {
    return (navigator as any).deviceMemory;
  },

  /**
   * Check if the user prefers reduced motion
   */
  prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Check if the user prefers dark mode
   */
  prefersDarkMode(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },

  /**
   * Get viewport dimensions
   */
  getViewportSize(): { width: number; height: number } {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  },

  /**
   * Show a native share dialog if available
   */
  async nativeShare(data: { title?: string; text?: string; url?: string }): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('Native share failed:', error);
      }
    }
    return false;
  },

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      return false;
    }
  },

  /**
   * Vibrate the device if supported
   */
  vibrate(pattern: number | number[]): boolean {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
      return true;
    }
    return false;
  },

  /**
   * Request wake lock to prevent screen from turning off
   */
  async requestWakeLock(): Promise<WakeLockSentinel | null> {
    try {
      if ('wakeLock' in navigator) {
        return await (navigator as any).wakeLock.request('screen');
      }
    } catch (error) {
      console.error('Wake lock request failed:', error);
    }
    return null;
  }
};

export default pwaManager;