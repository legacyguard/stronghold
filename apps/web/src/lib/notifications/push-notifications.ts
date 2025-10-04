/**
 * Mobile Push Notifications System for LegacyGuard
 * Supports Web Push API, FCM, and native mobile notifications
 */

export interface PushSubscription {
  id: string;
  userId: string;
  deviceId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  platform: 'web' | 'ios' | 'android';
  userAgent: string;
  createdAt: Date;
  isActive: boolean;
  preferences: NotificationPreferences;
}

export interface NotificationPreferences {
  enabled: boolean;
  categories: {
    documents: boolean;
    deadlines: boolean;
    security: boolean;
    family_updates: boolean;
    system_alerts: boolean;
    marketing: boolean;
  };
  schedule: {
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
    timezone: string;
    weekdays: boolean[];
  };
  urgency: {
    immediate: boolean;
    high: boolean;
    normal: boolean;
    low: boolean;
  };
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  category: keyof NotificationPreferences['categories'];
  urgency: 'immediate' | 'high' | 'normal' | 'low';
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, any>;
  url?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
  silent?: boolean;
  requireInteraction?: boolean;
  vibrate?: number[];
  sound?: string;
}

export interface NotificationStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  dismissed: number;
  failed: number;
}

export class MobilePushNotificationManager {
  private static instance: MobilePushNotificationManager;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private vapidPublicKey: string;
  private isSupported: boolean = false;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor(vapidPublicKey: string) {
    this.vapidPublicKey = vapidPublicKey;
    this.checkSupport();
  }

  public static getInstance(vapidPublicKey?: string): MobilePushNotificationManager {
    if (!MobilePushNotificationManager.instance) {
      if (!vapidPublicKey) {
        throw new Error('VAPID public key required for first initialization');
      }
      MobilePushNotificationManager.instance = new MobilePushNotificationManager(vapidPublicKey);
    }
    return MobilePushNotificationManager.instance;
  }

  /**
   * Initialize push notification system
   */
  public async initialize(): Promise<void> {
    try {
      console.log('Initializing push notifications...');

      if (!this.isSupported) {
        console.warn('Push notifications not supported on this device');
        return;
      }

      // Register service worker if not already registered
      await this.registerServiceWorker();

      // Check existing subscription
      await this.checkExistingSubscription();

      console.log('✓ Push notifications initialized successfully');
      this.emit('initialized', { supported: this.isSupported });
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
      this.emit('error', { error: 'Failed to initialize push notifications', details: error });
      throw error;
    }
  }

  /**
   * Check if push notifications are supported
   */
  private checkSupport(): void {
    this.isSupported = (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );

    // Additional checks for mobile platforms
    if (this.isSupported) {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|iphone|ipad|ipod|mobile/i.test(userAgent);

      // Check for specific mobile browser limitations
      if (isMobile) {
        const isIOS = /iphone|ipad|ipod/i.test(userAgent);
        const isSafari = /safari/i.test(userAgent) && !/chrome|crios|fxios/i.test(userAgent);

        // iOS Safari has limited push support
        if (isIOS && isSafari) {
          const version = this.getIOSVersion();
          this.isSupported = version >= 16.4; // iOS 16.4+ supports web push
        }
      }
    }
  }

  /**
   * Get iOS version for compatibility check
   */
  private getIOSVersion(): number {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/OS (\d+)_(\d+)/);
    if (match) {
      return parseInt(match[1]);
    }
    return 0;
  }

  /**
   * Register service worker for push notifications
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported');
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      console.log('Service worker registered successfully');
    } catch (error) {
      throw new Error(`Failed to register service worker: ${error}`);
    }
  }

  /**
   * Check for existing push subscription
   */
  private async checkExistingSubscription(): Promise<void> {
    if (!this.registration) return;

    try {
      const existingSubscription = await this.registration.pushManager.getSubscription();

      if (existingSubscription) {
        // Convert to our format and validate
        const subscription = this.convertSubscription(existingSubscription);
        await this.validateSubscription(subscription);
        this.subscription = subscription;

        console.log('Found existing push subscription');
        this.emit('subscriptionFound', { subscription });
      }
    } catch (error) {
      console.warn('Failed to check existing subscription:', error);
    }
  }

  /**
   * Request permission for push notifications
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported');
    }

    // Check current permission
    let permission = Notification.permission;

    // Request permission if not granted
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    this.emit('permissionChange', { permission });
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  public async subscribe(preferences?: Partial<NotificationPreferences>): Promise<PushSubscription> {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported');
    }

    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    // Request permission first
    const permission = await this.requestPermission();

    if (permission !== 'granted') {
      throw new Error('Push notification permission denied');
    }

    try {
      // Subscribe to push manager
      const pushSubscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Convert to our format
      const subscription = this.convertSubscription(pushSubscription);

      // Set preferences
      if (preferences) {
        subscription.preferences = {
          ...this.getDefaultPreferences(),
          ...preferences
        };
      } else {
        subscription.preferences = this.getDefaultPreferences();
      }

      // Save subscription to server
      await this.saveSubscriptionToServer(subscription);

      this.subscription = subscription;

      console.log('Successfully subscribed to push notifications');
      this.emit('subscribed', { subscription });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw new Error(`Subscription failed: ${error}`);
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribe(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    try {
      const pushSubscription = await this.registration.pushManager.getSubscription();

      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }

      if (this.subscription) {
        await this.removeSubscriptionFromServer(this.subscription.id);
        this.subscription = null;
      }

      console.log('Successfully unsubscribed from push notifications');
      this.emit('unsubscribed');
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  public async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    if (!this.subscription) {
      throw new Error('No active subscription');
    }

    try {
      this.subscription.preferences = {
        ...this.subscription.preferences,
        ...preferences
      };

      await this.updateSubscriptionOnServer(this.subscription);

      this.emit('preferencesUpdated', { preferences: this.subscription.preferences });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Send a push notification (for testing)
   */
  public async sendTestNotification(): Promise<void> {
    if (!this.subscription) {
      throw new Error('No active subscription');
    }

    const notification: PushNotification = {
      id: 'test_' + Date.now(),
      title: 'LegacyGuard Test',
      body: 'This is a test notification from LegacyGuard',
      icon: '/icons/icon-192x192.png',
      category: 'system_alerts',
      urgency: 'normal',
      data: { test: true },
      actions: [
        {
          action: 'view',
          title: 'View Dashboard',
          icon: '/icons/dashboard.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    await this.sendNotification(notification, [this.subscription.id]);
  }

  /**
   * Send push notification to specific subscriptions
   */
  private async sendNotification(notification: PushNotification, subscriptionIds: string[]): Promise<void> {
    try {
      const response = await fetch('/api/notifications/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          notification,
          subscriptionIds
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.emit('notificationSent', { notification, subscriptionIds });
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Handle notification click events
   */
  public setupNotificationHandlers(): void {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'notification-click':
          this.handleNotificationClick(data);
          break;
        case 'notification-close':
          this.handleNotificationClose(data);
          break;
        default:
          console.log('Unknown message type:', type);
      }
    });
  }

  /**
   * Handle notification click
   */
  private handleNotificationClick(data: any): void {
    const { notification, action } = data;

    // Track click event
    this.trackNotificationEvent(notification.id, 'clicked', { action });

    // Handle different actions
    switch (action) {
      case 'view':
        if (notification.url) {
          window.open(notification.url, '_blank');
        }
        break;
      case 'dismiss':
        // Just close the notification
        break;
      default:
        // Default action - open the app
        window.focus();
        if (notification.url) {
          window.location.href = notification.url;
        }
    }

    this.emit('notificationClicked', { notification, action });
  }

  /**
   * Handle notification close
   */
  private handleNotificationClose(data: any): void {
    const { notification } = data;

    // Track dismiss event
    this.trackNotificationEvent(notification.id, 'dismissed');

    this.emit('notificationDismissed', { notification });
  }

  /**
   * Track notification events for analytics
   */
  private async trackNotificationEvent(notificationId: string, event: string, data?: any): Promise<void> {
    try {
      await fetch('/api/analytics/notification-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          notificationId,
          event,
          timestamp: new Date().toISOString(),
          data
        })
      });
    } catch (error) {
      console.error('Failed to track notification event:', error);
    }
  }

  /**
   * Get notification statistics
   */
  public async getNotificationStats(timeRange: { start: Date; end: Date }): Promise<NotificationStats> {
    try {
      const response = await fetch(`/api/notifications/stats?start=${timeRange.start.toISOString()}&end=${timeRange.end.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      throw error;
    }
  }

  /**
   * Convert browser push subscription to our format
   */
  private convertSubscription(pushSubscription: globalThis.PushSubscription): PushSubscription {
    const keys = pushSubscription.getKey && {
      p256dh: this.arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
      auth: this.arrayBufferToBase64(pushSubscription.getKey('auth')!)
    };

    return {
      id: this.generateSubscriptionId(),
      userId: '', // Will be set by server
      deviceId: this.getDeviceId(),
      endpoint: pushSubscription.endpoint,
      keys: keys || { p256dh: '', auth: '' },
      platform: this.detectPlatform(),
      userAgent: navigator.userAgent,
      createdAt: new Date(),
      isActive: true,
      preferences: this.getDefaultPreferences()
    };
  }

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      categories: {
        documents: true,
        deadlines: true,
        security: true,
        family_updates: true,
        system_alerts: true,
        marketing: false
      },
      schedule: {
        startTime: '08:00',
        endTime: '22:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        weekdays: [true, true, true, true, true, true, true] // All days
      },
      urgency: {
        immediate: true,
        high: true,
        normal: true,
        low: false
      }
    };
  }

  /**
   * Detect platform (web, iOS, Android)
   */
  private detectPlatform(): 'web' | 'ios' | 'android' {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/android/i.test(userAgent)) {
      return 'android';
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      return 'ios';
    } else {
      return 'web';
    }
  }

  /**
   * Generate unique device ID
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');

    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', deviceId);
    }

    return deviceId;
  }

  /**
   * Generate subscription ID
   */
  private generateSubscriptionId(): string {
    return 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Save subscription to server
   */
  private async saveSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    const response = await fetch('/api/notifications/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`
      },
      body: JSON.stringify(subscription)
    });

    if (!response.ok) {
      throw new Error(`Failed to save subscription: ${response.statusText}`);
    }

    const result = await response.json();
    subscription.id = result.id;
    subscription.userId = result.userId;
  }

  /**
   * Update subscription on server
   */
  private async updateSubscriptionOnServer(subscription: PushSubscription): Promise<void> {
    const response = await fetch(`/api/notifications/push/subscription/${subscription.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`
      },
      body: JSON.stringify(subscription)
    });

    if (!response.ok) {
      throw new Error(`Failed to update subscription: ${response.statusText}`);
    }
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(subscriptionId: string): Promise<void> {
    const response = await fetch(`/api/notifications/push/subscription/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to remove subscription: ${response.statusText}`);
    }
  }

  /**
   * Validate subscription with server
   */
  private async validateSubscription(subscription: PushSubscription): Promise<void> {
    const response = await fetch(`/api/notifications/push/validate/${subscription.id}`, {
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Subscription validation failed');
    }
  }

  // Utility methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private async getAuthToken(): Promise<string> {
    return localStorage.getItem('authToken') || '';
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

  public getSubscription(): PushSubscription | null {
    return this.subscription;
  }

  public isSubscribed(): boolean {
    return this.subscription !== null;
  }

  public isNotificationSupported(): boolean {
    return this.isSupported;
  }

  public destroy(): void {
    this.eventListeners.clear();
  }
}

// Default VAPID public key (should be set from environment)
export const defaultVapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export default MobilePushNotificationManager;