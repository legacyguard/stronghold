import { useCallback, useEffect } from 'react';
import { ErrorHandler, StrongholdError, ErrorType, ErrorContext } from '@/lib/error/error-handler';

export interface UseErrorHandlerOptions {
  enableGlobalHandlers?: boolean;
  userId?: string;
  onError?: (error: StrongholdError) => void;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { enableGlobalHandlers = true, userId, onError } = options;

  const handleError = useCallback(async (
    error: Error | StrongholdError,
    context?: Partial<ErrorContext>
  ) => {
    const fullContext: ErrorContext = {
      userId,
      pagePath: window.location.pathname,
      userAgent: navigator.userAgent,
      sessionId: sessionStorage.getItem('session_id') || undefined,
      ...context
    };

    let strongholdError: StrongholdError;

    if (error instanceof StrongholdError) {
      strongholdError = error;
      // Merge context using Object.assign since context is readonly
      Object.assign(strongholdError.context, fullContext);
    } else {
      strongholdError = new StrongholdError({
        type: 'unknown_error',
        message: error.message,
        originalError: error,
        context: fullContext,
        severity: 'medium'
      });
    }

    await ErrorHandler.handleError(strongholdError);
    onError?.(strongholdError);

    return strongholdError;
  }, [userId, onError]);

  const createError = useCallback((
    type: ErrorType,
    message: string,
    options: {
      severity?: 'low' | 'medium' | 'high' | 'critical';
      userFriendlyMessage?: string;
      retryable?: boolean;
      reportToUser?: boolean;
      context?: Partial<ErrorContext>;
    } = {}
  ) => {
    return new StrongholdError({
      type,
      message,
      severity: options.severity || 'medium',
      userFriendlyMessage: options.userFriendlyMessage,
      retryable: options.retryable,
      reportToUser: options.reportToUser,
      context: {
        userId,
        pagePath: window.location.pathname,
        userAgent: navigator.userAgent,
        sessionId: sessionStorage.getItem('session_id') || undefined,
        ...options.context
      }
    });
  }, [userId]);

  const reportError = useCallback(async (
    type: ErrorType,
    message: string,
    options: {
      severity?: 'low' | 'medium' | 'high' | 'critical';
      userFriendlyMessage?: string;
      retryable?: boolean;
      reportToUser?: boolean;
      context?: Partial<ErrorContext>;
    } = {}
  ) => {
    const error = createError(type, message, options);
    return await handleError(error);
  }, [createError, handleError]);

  // Initialize error handler on mount
  useEffect(() => {
    if (enableGlobalHandlers) {
      ErrorHandler.initialize();
    }
  }, [enableGlobalHandlers]);

  return {
    handleError,
    createError,
    reportError
  };
}

// Hook for component-level error boundary
export function useErrorBoundary() {
  const { handleError } = useErrorHandler();

  const catchError = useCallback((error: Error, errorInfo?: any) => {
    const strongholdError = new StrongholdError({
      type: 'ui_error',
      message: `React Error Boundary: ${error.message}`,
      originalError: error,
      severity: 'high',
      context: {
        pagePath: window.location.pathname,
        userAgent: navigator.userAgent,
        metadata: {
          componentStack: errorInfo?.componentStack,
          errorBoundary: true
        }
      }
    });

    handleError(strongholdError);
  }, [handleError]);

  return { catchError };
}

// Hook for async operation error handling
export function useAsyncError() {
  const { handleError, reportError } = useErrorHandler();

  const withErrorHandling = useCallback(<T extends any[], R>(
    asyncFn: (...args: T) => Promise<R>,
    errorType: ErrorType = 'api_error',
    errorMessage?: string
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        const message = errorMessage || `Async operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

        await reportError(errorType, message, {
          severity: 'medium',
          retryable: true,
          context: {
            metadata: {
              asyncOperation: true,
              args: args.length > 0 ? JSON.stringify(args) : undefined
            }
          }
        });

        return null;
      }
    };
  }, [handleError, reportError]);

  return { withErrorHandling };
}