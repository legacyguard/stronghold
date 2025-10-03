import { useEffect, useCallback, useRef } from 'react';
import { behaviorTracker, UserInteraction, BehaviorPattern, HeatmapData } from '@/lib/analytics/behavior-tracker';

export interface UseBehaviorTrackingOptions {
  autoStart?: boolean;
  trackPageViews?: boolean;
  userId?: string;
  customEvents?: Record<string, any>;
}

export function useBehaviorTracking(options: UseBehaviorTrackingOptions = {}) {
  const {
    autoStart = true,
    trackPageViews = true,
    userId,
    customEvents = {}
  } = options;

  const isInitialized = useRef(false);
  const currentPath = useRef<string>('');

  useEffect(() => {
    if (autoStart && !isInitialized.current) {
      behaviorTracker.startTracking();
      isInitialized.current = true;
    }

    return () => {
      if (isInitialized.current) {
        behaviorTracker.stopTracking();
        isInitialized.current = false;
      }
    };
  }, [autoStart]);

  // Track page view when path changes
  useEffect(() => {
    if (trackPageViews && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path !== currentPath.current) {
        currentPath.current = path;
        behaviorTracker.trackPageView(path);
      }
    }
  }, [trackPageViews]);

  // Track custom events when they change
  useEffect(() => {
    Object.entries(customEvents).forEach(([eventName, properties]) => {
      behaviorTracker.trackCustomEvent(eventName, properties);
    });
  }, [customEvents]);

  const trackEvent = useCallback((eventName: string, properties: Record<string, any> = {}) => {
    behaviorTracker.trackCustomEvent(eventName, {
      ...properties,
      userId,
      timestamp: new Date().toISOString()
    });
  }, [userId]);

  const trackConversion = useCallback((conversionType: string, value?: number, metadata?: Record<string, any>) => {
    trackEvent('conversion', {
      conversion_type: conversionType,
      conversion_value: value,
      ...metadata
    });
  }, [trackEvent]);

  const trackFormInteraction = useCallback((formName: string, fieldName: string, action: 'start' | 'complete' | 'abandon', metadata?: Record<string, any>) => {
    trackEvent('form_interaction', {
      form_name: formName,
      field_name: fieldName,
      action,
      ...metadata
    });
  }, [trackEvent]);

  const trackFeatureUsage = useCallback((featureName: string, action: string, metadata?: Record<string, any>) => {
    trackEvent('feature_usage', {
      feature_name: featureName,
      action,
      ...metadata
    });
  }, [trackEvent]);

  const trackError = useCallback((errorType: string, errorMessage: string, context?: Record<string, any>) => {
    trackEvent('error_tracking', {
      error_type: errorType,
      error_message: errorMessage,
      context
    });
  }, [trackEvent]);

  const getSessionId = useCallback(() => {
    return behaviorTracker.getSessionId();
  }, []);

  const getSessionData = useCallback(async () => {
    return await behaviorTracker.getSessionData();
  }, []);

  return {
    trackEvent,
    trackConversion,
    trackFormInteraction,
    trackFeatureUsage,
    trackError,
    getSessionId,
    getSessionData,
    isTracking: isInitialized.current
  };
}

// Hook for component-level tracking
export function useComponentTracking(componentName: string, options: { trackMount?: boolean; trackUnmount?: boolean; trackInteractions?: boolean } = {}) {
  const { trackEvent } = useBehaviorTracking();
  const { trackMount = true, trackUnmount = true, trackInteractions = false } = options;

  useEffect(() => {
    if (trackMount) {
      trackEvent('component_lifecycle', {
        component_name: componentName,
        action: 'mount',
        timestamp: new Date().toISOString()
      });
    }

    return () => {
      if (trackUnmount) {
        trackEvent('component_lifecycle', {
          component_name: componentName,
          action: 'unmount',
          timestamp: new Date().toISOString()
        });
      }
    };
  }, [componentName, trackMount, trackUnmount, trackEvent]);

  const trackInteraction = useCallback((interactionType: string, details?: Record<string, any>) => {
    if (trackInteractions) {
      trackEvent('component_interaction', {
        component_name: componentName,
        interaction_type: interactionType,
        ...details
      });
    }
  }, [componentName, trackInteractions, trackEvent]);

  return { trackInteraction };
}

// Hook for form tracking
export function useFormTracking(formName: string) {
  const { trackFormInteraction } = useBehaviorTracking();
  const formStartTime = useRef<number | null>(null);
  const fieldInteractions = useRef<Record<string, { start_time: number; interactions: number }>>({});

  const startForm = useCallback(() => {
    formStartTime.current = Date.now();
    trackFormInteraction(formName, 'form', 'start', {
      start_time: formStartTime.current
    });
  }, [formName, trackFormInteraction]);

  const completeForm = useCallback((submissionData?: Record<string, any>) => {
    const completionTime = Date.now();
    const duration = formStartTime.current ? completionTime - formStartTime.current : 0;

    trackFormInteraction(formName, 'form', 'complete', {
      completion_time: completionTime,
      form_duration: duration,
      field_interactions: Object.keys(fieldInteractions.current).length,
      ...submissionData
    });
  }, [formName, trackFormInteraction]);

  const abandonForm = useCallback((reason?: string) => {
    const abandonTime = Date.now();
    const duration = formStartTime.current ? abandonTime - formStartTime.current : 0;

    trackFormInteraction(formName, 'form', 'abandon', {
      abandon_time: abandonTime,
      form_duration: duration,
      abandon_reason: reason,
      fields_completed: Object.keys(fieldInteractions.current).length
    });
  }, [formName, trackFormInteraction]);

  const trackFieldInteraction = useCallback((fieldName: string, action: 'focus' | 'blur' | 'input' | 'error') => {
    if (!fieldInteractions.current[fieldName]) {
      fieldInteractions.current[fieldName] = { start_time: Date.now(), interactions: 0 };
    }

    fieldInteractions.current[fieldName].interactions++;

    trackFormInteraction(formName, fieldName, action as any, {
      field_interaction_count: fieldInteractions.current[fieldName].interactions,
      field_time_spent: Date.now() - fieldInteractions.current[fieldName].start_time
    });
  }, [formName, trackFormInteraction]);

  return {
    startForm,
    completeForm,
    abandonForm,
    trackFieldInteraction
  };
}

// Hook for performance tracking
export function usePerformanceTracking() {
  const { trackEvent } = useBehaviorTracking();

  const trackPageLoad = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      trackEvent('performance_metrics', {
        metric_type: 'page_load',
        dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp_connection: navigation.connectEnd - navigation.connectStart,
        request_response: navigation.responseEnd - navigation.requestStart,
        dom_processing: navigation.domContentLoadedEventEnd - navigation.responseEnd,
        total_load_time: navigation.loadEventEnd - navigation.navigationStart,
        page_path: window.location.pathname
      });
    }
  }, [trackEvent]);

  const trackResourceLoad = useCallback((resourceName: string, loadTime: number, success: boolean) => {
    trackEvent('performance_metrics', {
      metric_type: 'resource_load',
      resource_name: resourceName,
      load_time: loadTime,
      success,
      page_path: window.location.pathname
    });
  }, [trackEvent]);

  const trackMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;

      trackEvent('performance_metrics', {
        metric_type: 'memory_usage',
        used_heap: memory.usedJSHeapSize,
        total_heap: memory.totalJSHeapSize,
        heap_limit: memory.jsHeapSizeLimit,
        memory_percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      });
    }
  }, [trackEvent]);

  return {
    trackPageLoad,
    trackResourceLoad,
    trackMemoryUsage
  };
}

// Hook for A/B testing tracking
export function useABTestTracking() {
  const { trackEvent } = useBehaviorTracking();

  const trackVariantView = useCallback((testName: string, variant: string, metadata?: Record<string, any>) => {
    trackEvent('ab_test', {
      action: 'variant_view',
      test_name: testName,
      variant,
      ...metadata
    });
  }, [trackEvent]);

  const trackConversion = useCallback((testName: string, variant: string, conversionType: string, value?: number) => {
    trackEvent('ab_test', {
      action: 'conversion',
      test_name: testName,
      variant,
      conversion_type: conversionType,
      conversion_value: value
    });
  }, [trackEvent]);

  return {
    trackVariantView,
    trackConversion
  };
}