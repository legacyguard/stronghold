import { supabase } from '@/lib/supabase';

interface QueryMetrics {
  query: string;
  duration: number;
  rowCount: number;
  cacheHit: boolean;
  timestamp: Date;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
  strategy: 'lru' | 'fifo' | 'lfu'; // Cache eviction strategy
}

interface OptimizationSuggestion {
  type: 'index' | 'query_rewrite' | 'caching' | 'pagination';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  implementation: string;
}

export class DatabaseOptimizer {
  private static cache = new Map<string, any>();
  private static cacheMetrics = new Map<string, { hits: number; lastAccess: Date }>();
  private static queryMetrics: QueryMetrics[] = [];
  private static slowQueryThreshold = 1000; // 1 second

  private static defaultCacheConfig: CacheConfig = {
    ttl: 300000, // 5 minutes
    maxSize: 1000,
    strategy: 'lru'
  };

  /**
   * Execute optimized query with caching and metrics
   */
  static async optimizedQuery<T>(
    queryBuilder: any,
    options: {
      cacheKey?: string;
      cacheConfig?: Partial<CacheConfig>;
      forceRefresh?: boolean;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = options.cacheKey;
    const config = { ...this.defaultCacheConfig, ...options.cacheConfig };

    // Check cache first
    if (cacheKey && !options.forceRefresh) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.recordCacheHit(cacheKey);
        return cached;
      }
    }

    // Execute query
    const { data, error, count } = await queryBuilder;

    if (error) {
      throw error;
    }

    const duration = Date.now() - startTime;

    // Record metrics
    this.recordQueryMetrics({
      query: this.getQueryString(queryBuilder),
      duration,
      rowCount: Array.isArray(data) ? data.length : (count || 1),
      cacheHit: false,
      timestamp: new Date()
    });

    // Cache result if specified
    if (cacheKey) {
      this.setCache(cacheKey, data, config);
    }

    // Check for slow query
    if (duration > this.slowQueryThreshold) {
      this.handleSlowQuery(queryBuilder, duration);
    }

    return data;
  }

  /**
   * Optimized pagination with cursor-based approach
   */
  static async paginatedQuery<T>(
    table: string,
    options: {
      pageSize?: number;
      cursor?: string;
      orderBy?: string;
      filters?: Record<string, any>;
      select?: string;
    } = {}
  ): Promise<{
    data: T[];
    nextCursor?: string;
    hasMore: boolean;
    totalCount?: number;
  }> {
    const {
      pageSize = 50,
      cursor,
      orderBy = 'created_at',
      filters = {},
      select = '*'
    } = options;

    let query = supabase
      .from(table)
      .select(select, { count: 'exact' })
      .order(orderBy, { ascending: false })
      .limit(pageSize + 1); // Request one extra to check if there's more

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // Apply cursor for pagination
    if (cursor) {
      query = query.lt(orderBy, cursor);
    }

    const result = await this.optimizedQuery(query, {
      cacheKey: `paginated_${table}_${JSON.stringify({ cursor, filters, orderBy })}`
    });

    const data = result.data || [];
    const hasMore = data.length > pageSize;

    // Remove extra item if present
    if (hasMore) {
      data.pop();
    }

    const nextCursor = hasMore && data.length > 0
      ? data[data.length - 1][orderBy]
      : undefined;

    return {
      data,
      nextCursor,
      hasMore,
      totalCount: result.count
    };
  }

  /**
   * Batch operations for better performance
   */
  static async batchInsert<T>(
    table: string,
    records: T[],
    options: {
      batchSize?: number;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ): Promise<void> {
    const { batchSize = 100, onProgress } = options;
    const batches: T[][] = [];

    // Split into batches
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }

    // Process batches
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      await supabase
        .from(table)
        .insert(batch);

      if (onProgress) {
        onProgress((i + 1) * batchSize, records.length);
      }
    }
  }

  /**
   * Optimized search with full-text search and ranking
   */
  static async optimizedSearch<T>(
    table: string,
    searchTerm: string,
    options: {
      searchColumns: string[];
      rankingColumn?: string;
      filters?: Record<string, any>;
      limit?: number;
    }
  ): Promise<T[]> {
    const {
      searchColumns,
      rankingColumn = 'ts_rank',
      filters = {},
      limit = 50
    } = options;

    // Use full-text search if available
    let query = supabase
      .from(table)
      .select('*')
      .textSearch(searchColumns.join(' | '), searchTerm)
      .order(rankingColumn, { ascending: false })
      .limit(limit);

    // Apply additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    return this.optimizedQuery(query, {
      cacheKey: `search_${table}_${searchTerm}_${JSON.stringify(filters)}`
    });
  }

  /**
   * Aggregate data with optimized queries
   */
  static async getAggregatedData(
    table: string,
    aggregations: {
      groupBy?: string[];
      sum?: string[];
      count?: string[];
      avg?: string[];
      max?: string[];
      min?: string[];
    },
    filters: Record<string, any> = {}
  ): Promise<any[]> {
    const { groupBy = [], sum = [], count = [], avg = [], max = [], min = [] } = aggregations;

    // Build select clause for aggregations
    const selectParts: string[] = [...groupBy];

    sum.forEach(col => selectParts.push(`${col}.sum()`));
    count.forEach(col => selectParts.push(`${col}.count()`));
    avg.forEach(col => selectParts.push(`${col}.avg()`));
    max.forEach(col => selectParts.push(`${col}.max()`));
    min.forEach(col => selectParts.push(`${col}.min()`));

    let query = supabase
      .from(table)
      .select(selectParts.join(', '));

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    return this.optimizedQuery(query, {
      cacheKey: `aggregated_${table}_${JSON.stringify(aggregations)}_${JSON.stringify(filters)}`,
      cacheConfig: { ttl: 600000 } // Cache longer for aggregated data
    });
  }

  /**
   * Optimize joins to reduce N+1 queries
   */
  static async optimizedJoin<T>(
    mainTable: string,
    joinConfig: {
      table: string;
      foreignKey: string;
      select?: string;
      filters?: Record<string, any>;
    }[],
    mainFilters: Record<string, any> = {}
  ): Promise<T[]> {
    // Build complex select with joins
    const selectParts = ['*'];

    joinConfig.forEach(join => {
      const selectClause = join.select || '*';
      selectParts.push(`${join.table}(${selectClause})`);
    });

    let query = supabase
      .from(mainTable)
      .select(selectParts.join(', '));

    // Apply main filters
    Object.entries(mainFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    return this.optimizedQuery(query, {
      cacheKey: `joined_${mainTable}_${JSON.stringify(joinConfig)}_${JSON.stringify(mainFilters)}`
    });
  }

  /**
   * Real-time subscription with optimization
   */
  static optimizedSubscription(
    table: string,
    callback: (payload: any) => void,
    options: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      filter?: string;
      throttle?: number;
    } = {}
  ) {
    const { event = '*', filter, throttle = 0 } = options;

    let lastCall = 0;
    const throttledCallback = (payload: any) => {
      const now = Date.now();
      if (now - lastCall >= throttle) {
        callback(payload);
        lastCall = now;
      }
    };

    const subscription = supabase
      .channel(`optimized_${table}`)
      .on('postgres_changes', {
        event,
        schema: 'public',
        table,
        filter
      }, throttle > 0 ? throttledCallback : callback)
      .subscribe();

    return subscription;
  }

  /**
   * Cache management
   */
  private static getFromCache(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;

    const { data, expiry } = item;
    if (Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheMetrics.delete(key);
      return null;
    }

    return data;
  }

  private static setCache(key: string, data: any, config: CacheConfig): void {
    // Check cache size and evict if necessary
    if (this.cache.size >= config.maxSize) {
      this.evictCache(config.strategy);
    }

    const expiry = Date.now() + config.ttl;
    this.cache.set(key, { data, expiry });
    this.cacheMetrics.set(key, { hits: 0, lastAccess: new Date() });
  }

  private static evictCache(strategy: CacheConfig['strategy']): void {
    let keyToEvict: string | undefined;

    switch (strategy) {
      case 'lru':
        keyToEvict = this.findLRUKey();
        break;
      case 'fifo':
        keyToEvict = this.cache.keys().next().value;
        break;
      case 'lfu':
        keyToEvict = this.findLFUKey();
        break;
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
      this.cacheMetrics.delete(keyToEvict);
    }
  }

  private static findLRUKey(): string | undefined {
    let oldestKey: string | undefined;
    let oldestTime = Date.now();

    for (const [key, metrics] of this.cacheMetrics.entries()) {
      if (metrics.lastAccess.getTime() < oldestTime) {
        oldestTime = metrics.lastAccess.getTime();
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private static findLFUKey(): string | undefined {
    let leastUsedKey: string | undefined;
    let leastHits = Infinity;

    for (const [key, metrics] of this.cacheMetrics.entries()) {
      if (metrics.hits < leastHits) {
        leastHits = metrics.hits;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  private static recordCacheHit(key: string): void {
    const metrics = this.cacheMetrics.get(key);
    if (metrics) {
      metrics.hits++;
      metrics.lastAccess = new Date();
    }
  }

  /**
   * Query metrics and optimization
   */
  private static recordQueryMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);

    // Keep only last 1000 metrics
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics.shift();
    }
  }

  private static getQueryString(queryBuilder: any): string {
    // Extract query information for logging
    return queryBuilder.toString?.() || 'Unknown query';
  }

  private static async handleSlowQuery(queryBuilder: any, duration: number): Promise<void> {
    console.warn(`Slow query detected: ${duration}ms`);

    // Log slow query for analysis
    try {
      await supabase
        .from('slow_queries')
        .insert({
          query: this.getQueryString(queryBuilder),
          duration,
          timestamp: new Date().toISOString(),
          stack_trace: new Error().stack
        });
    } catch (error) {
      console.error('Failed to log slow query:', error);
    }
  }

  /**
   * Performance analysis and suggestions
   */
  static getPerformanceAnalysis(): {
    cacheStats: {
      hitRate: number;
      size: number;
      topKeys: string[];
    };
    queryStats: {
      averageDuration: number;
      slowQueries: number;
      totalQueries: number;
    };
    suggestions: OptimizationSuggestion[];
  } {
    // Calculate cache hit rate
    const totalAccess = Array.from(this.cacheMetrics.values())
      .reduce((sum, metrics) => sum + metrics.hits, 0);
    const cacheHits = this.queryMetrics.filter(m => m.cacheHit).length;
    const hitRate = totalAccess > 0 ? (cacheHits / totalAccess) * 100 : 0;

    // Calculate query statistics
    const totalQueries = this.queryMetrics.length;
    const averageDuration = totalQueries > 0
      ? this.queryMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries
      : 0;
    const slowQueries = this.queryMetrics.filter(m => m.duration > this.slowQueryThreshold).length;

    // Top cache keys by hits
    const topKeys = Array.from(this.cacheMetrics.entries())
      .sort(([,a], [,b]) => b.hits - a.hits)
      .slice(0, 5)
      .map(([key]) => key);

    // Generate suggestions
    const suggestions = this.generateOptimizationSuggestions();

    return {
      cacheStats: {
        hitRate,
        size: this.cache.size,
        topKeys
      },
      queryStats: {
        averageDuration,
        slowQueries,
        totalQueries
      },
      suggestions
    };
  }

  private static generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Check cache hit rate
    const cacheHitRate = this.getCacheHitRate();
    if (cacheHitRate < 60) {
      suggestions.push({
        type: 'caching',
        priority: 'high',
        description: 'Low cache hit rate detected',
        impact: 'Improve response times by 2-5x',
        implementation: 'Review caching strategy and increase cache TTL for stable data'
      });
    }

    // Check for frequent slow queries
    const slowQueryRate = this.getSlowQueryRate();
    if (slowQueryRate > 10) {
      suggestions.push({
        type: 'index',
        priority: 'critical',
        description: 'High percentage of slow queries',
        impact: 'Reduce query time by 10-100x',
        implementation: 'Add database indexes on frequently filtered columns'
      });
    }

    // Check for large result sets
    const avgRowCount = this.getAverageRowCount();
    if (avgRowCount > 1000) {
      suggestions.push({
        type: 'pagination',
        priority: 'medium',
        description: 'Large result sets detected',
        impact: 'Reduce memory usage and improve initial load time',
        implementation: 'Implement cursor-based pagination for large datasets'
      });
    }

    return suggestions;
  }

  private static getCacheHitRate(): number {
    const totalQueries = this.queryMetrics.length;
    if (totalQueries === 0) return 100;

    const cacheHits = this.queryMetrics.filter(m => m.cacheHit).length;
    return (cacheHits / totalQueries) * 100;
  }

  private static getSlowQueryRate(): number {
    const totalQueries = this.queryMetrics.length;
    if (totalQueries === 0) return 0;

    const slowQueries = this.queryMetrics.filter(m => m.duration > this.slowQueryThreshold).length;
    return (slowQueries / totalQueries) * 100;
  }

  private static getAverageRowCount(): number {
    const totalQueries = this.queryMetrics.length;
    if (totalQueries === 0) return 0;

    const totalRows = this.queryMetrics.reduce((sum, m) => sum + m.rowCount, 0);
    return totalRows / totalQueries;
  }

  /**
   * Clear all caches
   */
  static clearCache(): void {
    this.cache.clear();
    this.cacheMetrics.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): any {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      metrics: Object.fromEntries(this.cacheMetrics)
    };
  }
}