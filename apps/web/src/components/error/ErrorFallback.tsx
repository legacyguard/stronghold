'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  Copy,
  CheckCircle,
  Clock,
  WifiOff,
  Lock,
  Shield,
  ExternalLink
} from 'lucide-react';
import { StrongholdError, ErrorType } from '@/lib/error/error-handler';

interface ErrorFallbackProps {
  error: Error | StrongholdError;
  resetError?: () => void;
  componentStack?: string;
  className?: string;
}

interface ErrorAction {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  variant?: 'default' | 'outline' | 'destructive';
  primary?: boolean;
}

export function ErrorFallback({ error, resetError, componentStack, className }: ErrorFallbackProps) {
  const [copied, setCopied] = React.useState(false);
  const [isReporting, setIsReporting] = React.useState(false);

  const strongholdError = error instanceof StrongholdError ? error : null;
  const errorType = strongholdError?.type || 'unknown_error';
  const severity = strongholdError?.severity || 'medium';
  const userMessage = strongholdError?.userFriendlyMessage || 'Vyskytla sa neočakávaná chyba';

  const getErrorConfig = (type: ErrorType) => {
    const configs = {
      validation_error: {
        icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
        title: 'Chyba validácie',
        color: 'yellow',
        canRetry: true,
        showDetails: false
      },
      authentication_error: {
        icon: <Lock className="w-8 h-8 text-blue-500" />,
        title: 'Chyba prihlásenia',
        color: 'blue',
        canRetry: false,
        showDetails: false
      },
      authorization_error: {
        icon: <Shield className="w-8 h-8 text-red-500" />,
        title: 'Chyba oprávnení',
        color: 'red',
        canRetry: false,
        showDetails: false
      },
      network_error: {
        icon: <WifiOff className="w-8 h-8 text-orange-500" />,
        title: 'Chyba pripojenia',
        color: 'orange',
        canRetry: true,
        showDetails: true
      },
      database_error: {
        icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
        title: 'Chyba databázy',
        color: 'red',
        canRetry: true,
        showDetails: true
      },
      api_error: {
        icon: <ExternalLink className="w-8 h-8 text-purple-500" />,
        title: 'Chyba služby',
        color: 'purple',
        canRetry: true,
        showDetails: true
      },
      ui_error: {
        icon: <Bug className="w-8 h-8 text-green-500" />,
        title: 'Chyba rozhrania',
        color: 'green',
        canRetry: true,
        showDetails: true
      },
      performance_error: {
        icon: <Clock className="w-8 h-8 text-yellow-500" />,
        title: 'Chyba výkonu',
        color: 'yellow',
        canRetry: true,
        showDetails: true
      },
      third_party_error: {
        icon: <ExternalLink className="w-8 h-8 text-gray-500" />,
        title: 'Externá chyba',
        color: 'gray',
        canRetry: true,
        showDetails: false
      },
      unknown_error: {
        icon: <AlertTriangle className="w-8 h-8 text-gray-500" />,
        title: 'Neznáma chyba',
        color: 'gray',
        canRetry: true,
        showDetails: true
      }
    };

    return configs[type] || configs.unknown_error;
  };

  const config = getErrorConfig(errorType);

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
      critical: 'bg-red-200 text-red-900 font-bold'
    };

    const labels = {
      low: 'Nízka',
      medium: 'Stredná',
      high: 'Vysoká',
      critical: 'Kritická'
    };

    return (
      <Badge className={variants[severity as keyof typeof variants]}>
        {labels[severity as keyof typeof labels] || severity}
      </Badge>
    );
  };

  const getErrorActions = (): ErrorAction[] => {
    const actions: ErrorAction[] = [];

    // Primary action based on error type
    if (config.canRetry && resetError) {
      actions.push({
        label: strongholdError?.retryable ? 'Skúsiť znova' : 'Obnoviť',
        icon: <RefreshCw className="w-4 h-4" />,
        action: resetError,
        primary: true
      });
    }

    // Specific actions for different error types
    switch (errorType) {
      case 'authentication_error':
        actions.push({
          label: 'Prihlásiť sa',
          icon: <Lock className="w-4 h-4" />,
          action: () => window.location.href = '/auth/login',
          primary: true
        });
        break;

      case 'network_error':
        actions.push({
          label: 'Skontrolovať pripojenie',
          icon: <WifiOff className="w-4 h-4" />,
          action: () => window.location.reload(),
          variant: 'outline'
        });
        break;

      case 'authorization_error':
        actions.push({
          label: 'Kontaktovať podporu',
          icon: <ExternalLink className="w-4 h-4" />,
          action: () => window.open('/support', '_blank'),
          primary: true
        });
        break;
    }

    // Common actions
    actions.push({
      label: 'Domovská stránka',
      icon: <Home className="w-4 h-4" />,
      action: () => window.location.href = '/',
      variant: 'outline'
    });

    if (config.showDetails && process.env.NODE_ENV === 'development') {
      actions.push({
        label: 'Nahlásiť chybu',
        icon: <Bug className="w-4 h-4" />,
        action: handleReportError,
        variant: 'outline'
      });
    }

    return actions;
  };

  const copyErrorDetails = async () => {
    const errorDetails = {
      message: error.message,
      type: errorType,
      severity,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      stack: error.stack,
      componentStack
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleReportError = async () => {
    setIsReporting(true);

    try {
      // In real implementation, this would send to error reporting service
      console.log('Reporting error:', {
        error: error.message,
        type: errorType,
        severity,
        url: window.location.href
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('Chyba bola úspešne nahlásená. Ďakujeme!');
    } catch (err) {
      console.error('Failed to report error:', err);
      alert('Nepodarilo sa nahlásiť chybu. Skúste to neskôr.');
    } finally {
      setIsReporting(false);
    }
  };

  const actions = getErrorActions();

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-gray-50 ${className}`}>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {config.icon}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{config.title}</CardTitle>
              <div className="flex items-center space-x-2">
                {getSeverityBadge(severity)}
                {strongholdError?.retryable && (
                  <Badge className="bg-blue-100 text-blue-800">
                    Opakovateľná
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User-friendly message */}
          <Alert>
            <AlertDescription className="text-base">
              {userMessage}
            </AlertDescription>
          </Alert>

          {/* Error details for development */}
          {config.showDetails && process.env.NODE_ENV === 'development' && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Technické detaily:</h3>
                <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Chybová správa:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyErrorDetails}
                      disabled={copied}
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Skopírované
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Kopírovať
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="break-words">{error.message}</p>

                  {strongholdError?.context && Object.keys(strongholdError.context).length > 0 && (
                    <div className="mt-4">
                      <span className="font-medium">Kontext:</span>
                      <pre className="mt-1 text-xs overflow-x-auto">
                        {JSON.stringify(strongholdError.context, null, 2)}
                      </pre>
                    </div>
                  )}

                  {componentStack && (
                    <div className="mt-4">
                      <span className="font-medium">Komponent stack:</span>
                      <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
                        {componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || (action.primary ? 'default' : 'outline')}
                onClick={action.action}
                disabled={isReporting}
                className={action.primary ? 'order-first' : ''}
              >
                {isReporting && action.label.includes('Nahlásiť') ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <>
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                  </>
                )}
              </Button>
            ))}
          </div>

          {/* Additional help */}
          <div className="border-t pt-4 text-sm text-gray-600">
            <p>
              Ak sa problém opakuje, prosím{' '}
              <a
                href="/support"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                kontaktujte našu podporu
              </a>
              {' '}s kódom chyby: <code className="bg-gray-200 px-1 rounded">{errorType}</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Specialized error fallbacks for common scenarios
export function NetworkErrorFallback({ resetError }: { resetError?: () => void }) {
  return (
    <ErrorFallback
      error={new Error('Network connection failed')}
      resetError={resetError}
    />
  );
}

export function AuthErrorFallback() {
  return (
    <ErrorFallback
      error={new Error('Authentication required')}
    />
  );
}

export function NotFoundFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-6">
          <div className="mb-4">
            <span className="text-6xl">🔍</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Stránka nenájdená</h1>
          <p className="text-gray-600 mb-6">
            Stránka, ktorú hľadáte, neexistuje alebo bola presunutá.
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <a href="/">
                <Home className="w-4 h-4 mr-2" />
                Domovská stránka
              </a>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
              Späť
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function LoadingErrorFallback({ resetError }: { resetError?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-6">
          <div className="mb-4">
            <Clock className="w-12 h-12 mx-auto text-yellow-500" />
          </div>
          <h1 className="text-xl font-bold mb-2">Načítavanie trvá dlho</h1>
          <p className="text-gray-600 mb-6">
            Stránka sa načítava dlhšie ako obvykle. Skúste to znova.
          </p>
          <div className="space-y-2">
            {resetError && (
              <Button onClick={resetError} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Skúsiť znova
              </Button>
            )}
            <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
              Obnoviť stránku
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}