// Performance Optimization & Caching System
// Provides intelligent caching for templates, validation results, and user data

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize?: number; // Maximum cache size
  strategy: 'lru' | 'fifo' | 'lfu'; // Eviction strategy
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalSize: number;
  entryCount: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

export class CacheManager {
  private static caches = new Map<string, Map<string, CacheEntry<any>>>();
  private static configs = new Map<string, CacheConfig>();
  private static stats = new Map<string, { hits: number; misses: number }>();

  // Redis-like interface for production (would use actual Redis)
  private static redis = {
    setex: async (key: string, ttl: number, value: string): Promise<void> => {
      // In production, this would use actual Redis
      localStorage.setItem(key, JSON.stringify({
        value: JSON.parse(value),
        timestamp: Date.now(),
        ttl: ttl * 1000
      }));
    },

    get: async (key: string): Promise<string | null> => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const parsed = JSON.parse(item);
        if (Date.now() - parsed.timestamp > parsed.ttl) {
          localStorage.removeItem(key);
          return null;
        }

        return JSON.stringify(parsed.value);
      } catch {
        return null;
      }
    },

    del: async (key: string): Promise<void> => {
      localStorage.removeItem(key);
    }
  };

  // Initialize cache with configuration
  static initializeCache(cacheName: string, config: CacheConfig): void {
    this.caches.set(cacheName, new Map());
    this.configs.set(cacheName, config);
    this.stats.set(cacheName, { hits: 0, misses: 0 });

    console.log(`Cache '${cacheName}' initialized with config:`, config);
  }

  // Generic cache set method
  static async set<T>(
    cacheName: string,
    key: string,
    value: T,
    customTtl?: number
  ): Promise<void> {
    const cache = this.getCache(cacheName);
    const config = this.configs.get(cacheName);

    if (!cache || !config) {
      console.warn(`Cache '${cacheName}' not initialized`);
      return;
    }

    const ttl = (customTtl || config.ttl) * 1000; // Convert to milliseconds
    const size = this.calculateSize(value);

    // Check cache size limits
    if (config.maxSize && this.getCacheSize(cacheName) + size > config.maxSize) {
      await this.evictEntries(cacheName, size);
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      size
    };

    cache.set(key, entry);

    // Also store in persistent storage for important caches
    if (this.isPersistentCache(cacheName)) {
      await this.redis.setex(
        `${cacheName}:${key}`,
        Math.floor(ttl / 1000),
        JSON.stringify(value)
      );
    }
  }

  // Generic cache get method
  static async get<T>(cacheName: string, key: string): Promise<T | null> {
    const cache = this.getCache(cacheName);
    const stats = this.stats.get(cacheName);

    if (!cache || !stats) {
      console.warn(`Cache '${cacheName}' not initialized`);
      return null;
    }

    // Check in-memory cache first
    const entry = cache.get(key);

    if (entry && Date.now() - entry.timestamp <= entry.ttl) {
      entry.hits++;
      stats.hits++;
      return entry.value;
    }

    // Check persistent storage
    if (this.isPersistentCache(cacheName)) {
      const persistentValue = await this.redis.get(`${cacheName}:${key}`);
      if (persistentValue) {
        const value = JSON.parse(persistentValue);
        // Restore to in-memory cache
        await this.set(cacheName, key, value);
        stats.hits++;
        return value;
      }
    }

    // Cache miss
    if (entry) {
      cache.delete(key); // Remove expired entry
    }
    stats.misses++;
    return null;
  }

  // Remove from cache
  static async del(cacheName: string, key: string): Promise<void> {
    const cache = this.getCache(cacheName);
    if (cache) {
      cache.delete(key);
    }

    if (this.isPersistentCache(cacheName)) {
      await this.redis.del(`${cacheName}:${key}`);
    }
  }

  // Cache will template
  static async cacheWillTemplate(
    jurisdiction: string,
    templateType: string,
    template: any
  ): Promise<void> {
    const key = `${jurisdiction}:${templateType}`;
    await this.set('will-templates', key, template, 3600); // 1 hour
  }

  // Get cached will template
  static async getCachedWillTemplate(
    jurisdiction: string,
    templateType: string
  ): Promise<any | null> {
    const key = `${jurisdiction}:${templateType}`;
    return await this.get('will-templates', key);
  }

  // Cache validation result
  static async cacheValidationResult(
    dataHash: string,
    result: any
  ): Promise<void> {
    await this.set('validation-results', dataHash, result, 1800); // 30 minutes
  }

  // Get cached validation result
  static async getCachedValidationResult(dataHash: string): Promise<any | null> {
    return await this.get('validation-results', dataHash);
  }

  // Preload user data
  static async preloadUserData(userId: string): Promise<void> {
    try {
      // This would fetch user data from database
      const userData = await this.fetchUserProfile(userId);
      const documents = await this.fetchUserDocuments(userId);

      await Promise.all([
        this.set('user-profiles', userId, userData, 1800), // 30 minutes
        this.set('user-documents', userId, documents, 1800)
      ]);

      console.log(`Preloaded data for user: ${userId}`);
    } catch (error) {
      console.error('Failed to preload user data:', error);
    }
  }

  // Get cached user data
  static async getCachedUserData(userId: string): Promise<{
    profile: any | null;
    documents: any | null;
  }> {
    const [profile, documents] = await Promise.all([
      this.get('user-profiles', userId),
      this.get('user-documents', userId)
    ]);

    return { profile, documents };
  }

  // Cache legal content
  static async cacheLegalContent(
    jurisdiction: string,
    contentType: string,
    content: any
  ): Promise<void> {
    const key = `${jurisdiction}:${contentType}`;
    await this.set('legal-content', key, content, 86400); // 24 hours
  }

  // Cache AI response
  static async cacheAIResponse(
    requestHash: string,
    response: any,
    ttl: number = 3600
  ): Promise<void> {
    await this.set('ai-responses', requestHash, response, ttl);
  }

  // Get cached AI response
  static async getCachedAIResponse(requestHash: string): Promise<any | null> {
    return await this.get('ai-responses', requestHash);
  }

  // Warm up cache with frequently accessed data
  static async warmUpCache(): Promise<void> {
    console.log('Warming up cache...');

    const warmUpTasks = [
      // Cache essential templates
      this.warmUpTemplates(),
      // Cache validation rules
      this.warmUpValidationRules(),
      // Cache legal content
      this.warmUpLegalContent()
    ];

    await Promise.all(warmUpTasks);
    console.log('Cache warm-up completed');
  }

  // Warm up templates
  private static async warmUpTemplates(): Promise<void> {
    const jurisdictions = ['SK', 'CZ', 'AT', 'DE', 'PL'];
    const templateTypes = ['holographic', 'witnessed', 'notarized'];

    for (const jurisdiction of jurisdictions) {
      for (const type of templateTypes) {
        try {
          // This would fetch template from database/file system
          const template = await this.fetchTemplate(jurisdiction, type);
          if (template) {
            await this.cacheWillTemplate(jurisdiction, type, template);
          }
        } catch (error) {
          console.warn(`Failed to warm up template ${jurisdiction}:${type}`, error);
        }
      }
    }
  }

  // Warm up validation rules
  private static async warmUpValidationRules(): Promise<void> {
    const jurisdictions = ['SK', 'CZ', 'AT', 'DE', 'PL'];

    for (const jurisdiction of jurisdictions) {
      try {
        const rules = await this.fetchValidationRules(jurisdiction);
        if (rules) {
          await this.set('validation-rules', jurisdiction, rules, 86400);
        }
      } catch (error) {
        console.warn(`Failed to warm up validation rules for ${jurisdiction}`, error);
      }
    }
  }

  // Warm up legal content
  private static async warmUpLegalContent(): Promise<void> {
    const contentTypes = ['requirements', 'disclaimers', 'help-text'];

    for (const type of contentTypes) {
      try {
        const content = await this.fetchLegalContent(type);
        if (content) {
          await this.set('legal-content', type, content, 86400);
        }
      } catch (error) {
        console.warn(`Failed to warm up legal content: ${type}`, error);
      }
    }
  }

  // Get cache statistics
  static getCacheStats(cacheName: string): CacheStats {
    const cache = this.getCache(cacheName);
    const stats = this.stats.get(cacheName);

    if (!cache || !stats) {
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalSize: 0,
        entryCount: 0
      };
    }

    const entries = Array.from(cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const hitRate = stats.hits + stats.misses > 0
      ? stats.hits / (stats.hits + stats.misses)
      : 0;

    const timestamps = entries.map(e => e.timestamp);
    const oldestEntry = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : undefined;
    const newestEntry = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined;

    return {
      hits: stats.hits,
      misses: stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      totalSize,
      entryCount: cache.size,
      oldestEntry,
      newestEntry
    };
  }

  // Get all cache statistics
  static getAllCacheStats(): Map<string, CacheStats> {
    const allStats = new Map<string, CacheStats>();

    for (const cacheName of this.caches.keys()) {
      allStats.set(cacheName, this.getCacheStats(cacheName));
    }

    return allStats;
  }

  // Clear cache
  static clearCache(cacheName: string): void {
    const cache = this.getCache(cacheName);
    if (cache) {
      cache.clear();
    }

    // Reset stats
    this.stats.set(cacheName, { hits: 0, misses: 0 });
  }

  // Clear all caches
  static clearAllCaches(): void {
    for (const cacheName of this.caches.keys()) {
      this.clearCache(cacheName);
    }
  }

  // Helper methods
  private static getCache(cacheName: string): Map<string, CacheEntry<any>> | undefined {
    return this.caches.get(cacheName);
  }

  private static calculateSize(value: any): number {
    // Rough size calculation in bytes
    return JSON.stringify(value).length * 2; // Approximate UTF-16 size
  }

  private static getCacheSize(cacheName: string): number {
    const cache = this.getCache(cacheName);
    if (!cache) return 0;

    return Array.from(cache.values()).reduce((sum, entry) => sum + entry.size, 0);
  }

  private static async evictEntries(cacheName: string, spaceNeeded: number): Promise<void> {
    const cache = this.getCache(cacheName);
    const config = this.configs.get(cacheName);

    if (!cache || !config) return;

    const entries = Array.from(cache.entries());
    let freedSpace = 0;

    // Apply eviction strategy
    switch (config.strategy) {
      case 'lru':
        // Least Recently Used - sort by last access time (hits)
        entries.sort(([, a], [, b]) => a.hits - b.hits);
        break;
      case 'fifo':
        // First In, First Out - sort by timestamp
        entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
        break;
      case 'lfu':
        // Least Frequently Used - sort by hit count
        entries.sort(([, a], [, b]) => a.hits - b.hits);
        break;
    }

    // Remove entries until we have enough space
    for (const [key, entry] of entries) {
      cache.delete(key);
      freedSpace += entry.size;

      if (freedSpace >= spaceNeeded) {
        break;
      }
    }

    console.log(`Evicted entries from cache '${cacheName}', freed ${freedSpace} bytes`);
  }

  private static isPersistentCache(cacheName: string): boolean {
    // Define which caches should be persisted
    const persistentCaches = ['will-templates', 'legal-content', 'validation-rules'];
    return persistentCaches.includes(cacheName);
  }

  // Mock data fetching methods (would be real API calls in production)
  private static async fetchUserProfile(userId: string): Promise<any> {
    // Mock user profile data
    return {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      preferences: { jurisdiction: 'SK', language: 'sk' }
    };
  }

  private static async fetchUserDocuments(userId: string): Promise<any> {
    // Mock user documents
    return [
      { id: '1', title: 'My Will', type: 'will', lastModified: new Date() }
    ];
  }

  private static async fetchTemplate(jurisdiction: string, type: string): Promise<any> {
    // Mock template fetching
    return {
      id: `${jurisdiction}-${type}`,
      jurisdiction,
      type,
      content: `Template content for ${jurisdiction} ${type} will`,
      version: '1.0'
    };
  }

  private static async fetchValidationRules(jurisdiction: string): Promise<any> {
    // Mock validation rules
    return {
      jurisdiction,
      rules: ['executor_required', 'signature_required', 'date_required'],
      version: '1.0'
    };
  }

  private static async fetchLegalContent(type: string): Promise<any> {
    // Mock legal content
    return {
      type,
      content: `Legal content for ${type}`,
      lastUpdated: new Date()
    };
  }
}

// Initialize default caches
export function initializeDefaultCaches(): void {
  CacheManager.initializeCache('will-templates', {
    ttl: 3600, // 1 hour
    maxSize: 10 * 1024 * 1024, // 10MB
    strategy: 'lru'
  });

  CacheManager.initializeCache('validation-results', {
    ttl: 1800, // 30 minutes
    maxSize: 5 * 1024 * 1024, // 5MB
    strategy: 'lru'
  });

  CacheManager.initializeCache('user-profiles', {
    ttl: 1800, // 30 minutes
    maxSize: 2 * 1024 * 1024, // 2MB
    strategy: 'lru'
  });

  CacheManager.initializeCache('user-documents', {
    ttl: 1800, // 30 minutes
    maxSize: 5 * 1024 * 1024, // 5MB
    strategy: 'lru'
  });

  CacheManager.initializeCache('legal-content', {
    ttl: 86400, // 24 hours
    maxSize: 1 * 1024 * 1024, // 1MB
    strategy: 'fifo'
  });

  CacheManager.initializeCache('ai-responses', {
    ttl: 3600, // 1 hour
    maxSize: 20 * 1024 * 1024, // 20MB
    strategy: 'lru'
  });

  CacheManager.initializeCache('validation-rules', {
    ttl: 86400, // 24 hours
    maxSize: 1 * 1024 * 1024, // 1MB
    strategy: 'fifo'
  });

  console.log('Default caches initialized');
}

// Hash function for cache keys
export function generateCacheKey(...parts: string[]): string {
  return parts.join(':').toLowerCase().replace(/[^a-z0-9:]/g, '_');
}

// Precompute hash for validation data
export function hashValidationData(data: any): string {
  const jsonString = JSON.stringify(data, Object.keys(data).sort());
  let hash = 0;

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}