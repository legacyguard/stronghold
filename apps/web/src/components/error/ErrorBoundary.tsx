'use client';

import React, { Component, ReactNode } from 'react';
import { ErrorHandler, StrongholdError } from '@/lib/error/error-handler';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Send } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  level?: 'page' | 'component' | 'section';
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo });

    // Report error to our error handling system
    this.reportError(error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  private async reportError(error: Error, errorInfo: any) {
    try {
      const strongholdError = new StrongholdError({
        type: 'ui_error',
        message: `React Error Boundary (${this.props.level || 'component'}): ${error.message}`,
        originalError: error,
        severity: this.props.level === 'page' ? 'high' : 'medium',
        context: {
          pagePath: window.location.pathname,
          userAgent: navigator.userAgent,
          metadata: {
            componentStack: errorInfo?.componentStack,
            errorBoundary: true,
            level: this.props.level || 'component'
          }
        },
        userFriendlyMessage: this.getUserFriendlyMessage(),
        retryable: true
      });

      await ErrorHandler.handleError(strongholdError);

      // Generate error ID for user reference
      this.setState({ errorId: `ERR-${Date.now().toString(36).toUpperCase()}` });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  private getUserFriendlyMessage(): string {
    const level = this.props.level || 'component';

    if (level === 'page') {
      return 'This page encountered an error. Please try refreshing or navigating back.';
    } else if (level === 'section') {
      return 'This section encountered an error. You can continue using other parts of the application.';
    } else {
      return 'A component failed to load. This may not affect other parts of the page.';
    }
  }

  private retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  private goHome = () => {
    window.location.href = '/dashboard';
  };

  private reportIssue = () => {
    const subject = `Error Report - ${this.state.errorId}`;
    const body = `I encountered an error while using Stronghold.

Error ID: ${this.state.errorId}
Page: ${window.location.pathname}
Time: ${new Date().toISOString()}

Description of what I was doing:
[Please describe what you were trying to do when this error occurred]

Error Details:
${this.state.error?.message}`;

    const mailtoLink = `mailto:support@stronghold.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.retry);
      }

      // Default error UI based on level
      const level = this.props.level || 'component';

      if (level === 'page') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-xl">Something went wrong</CardTitle>
                <CardDescription>
                  This page encountered an unexpected error
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {this.state.errorId && (
                  <Alert>
                    <AlertDescription className="text-sm">
                      Error ID: <code className="font-mono">{this.state.errorId}</code>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Button onClick={this.retry} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>

                  <Button onClick={this.goHome} variant="outline" className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Button>

                  <Button onClick={this.reportIssue} variant="ghost" className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Report Issue
                  </Button>
                </div>

                {process.env.NODE_ENV === 'development' && (
                  <details className="text-xs bg-gray-100 p-2 rounded mt-4">
                    <summary className="cursor-pointer">Debug Info</summary>
                    <pre className="mt-2 whitespace-pre-wrap">
                      {this.state.error?.stack}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          </div>
        );
      }

      // Component/section level error
      return (
        <Alert className="my-4">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Component Error</p>
                <p className="text-sm text-gray-600">
                  {this.getUserFriendlyMessage()}
                </p>
                {this.state.errorId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Error ID: {this.state.errorId}
                  </p>
                )}
              </div>
              <Button onClick={this.retry} variant="outline" size="sm">
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper components
export function PageErrorBoundary({ children, onError }: {
  children: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}) {
  return (
    <ErrorBoundary level="page" onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

export function SectionErrorBoundary({ children, onError }: {
  children: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}) {
  return (
    <ErrorBoundary level="section" onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

export function ComponentErrorBoundary({ children, onError }: {
  children: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}) {
  return (
    <ErrorBoundary level="component" onError={onError}>
      {children}
    </ErrorBoundary>
  );
}