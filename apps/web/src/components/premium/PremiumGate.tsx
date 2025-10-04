'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Lock, Zap, Users, FileText, Shield, ArrowRight, Check } from 'lucide-react';
import { UsageTracker, type UsageSummary } from '@/lib/pricing/usage-tracker';
import { PRICING_PLANS } from '@/lib/pricing/plans';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PremiumGateProps {
  feature: string;
  resource?: keyof UsageSummary['limits'];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUsage?: boolean;
  upgradeMessage?: string;
}

interface UsageDisplayProps {
  usageSummary: UsageSummary;
  resource: keyof UsageSummary['limits'];
}

function UsageDisplay({ usageSummary, resource }: UsageDisplayProps) {
  const limit = usageSummary.limits[resource];
  const isUnlimited = limit.limit === -1;

  const getUsageColor = () => {
    if (isUnlimited) return 'text-green-600';
    if (limit.percentage >= 90) return 'text-red-600';
    if (limit.percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (limit.percentage >= 90) return 'bg-red-500';
    if (limit.percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">
          {resource === 'wills' && 'Testamenty'}
          {resource === 'documents' && 'Dokumenty'}
          {resource === 'emergency_contacts' && 'Núdzové kontakty'}
          {resource === 'storage_gb' && 'Úložisko'}
          {resource === 'family_members' && 'Rodinní členovia'}
          {resource === 'ai_queries' && 'AI dotazy'}
        </span>
        <span className={`text-sm font-medium ${getUsageColor()}`}>
          {isUnlimited ? (
            '∞'
          ) : (
            `${limit.used}/${limit.limit}`
          )}
        </span>
      </div>
      
      {!isUnlimited && (
        <div className="space-y-1">
          <Progress value={limit.percentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{limit.percentage.toFixed(0)}% využité</span>
            {limit.remaining > 0 && (
              <span>Zostáva: {limit.remaining}</span>
            )}
          </div>
        </div>
      )}
      
      {limit.exceeded && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700 text-xs">
            Prekročili ste limit! Upgradnite plán pre pokračovanie.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function PlanComparisonCard({ currentPlan, targetPlan }: {
  currentPlan: string;
  targetPlan: string;
}) {
  const current = PRICING_PLANS[currentPlan];
  const target = PRICING_PLANS[targetPlan];

  if (!current || !target) return null;

  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <Card className="border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{current.name}</CardTitle>
          <div className="text-lg font-bold">
            €{current.price}
            <span className="text-sm font-normal text-muted-foreground">/mesiac</span>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-1 text-xs">
            <div>Testamenty: {current.limits.wills === -1 ? '∞' : current.limits.wills}</div>
            <div>Dokumenty: {current.limits.documents === -1 ? '∞' : current.limits.documents}</div>
            <div>Úložisko: {current.limits.storage_gb}GB</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            {target.name}
            {target.popular && <Crown className="w-4 h-4 ml-1 text-yellow-500" />}
          </CardTitle>
          <div className="text-lg font-bold text-primary">
            €{target.price}
            <span className="text-sm font-normal text-muted-foreground">/mesiac</span>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <Check className="w-3 h-3 mr-1 text-green-500" />
              Testamenty: {target.limits.wills === -1 ? 'Neobmedzené' : target.limits.wills}
            </div>
            <div className="flex items-center">
              <Check className="w-3 h-3 mr-1 text-green-500" />
              Dokumenty: {target.limits.documents === -1 ? 'Neobmedzené' : target.limits.documents}
            </div>
            <div className="flex items-center">
              <Check className="w-3 h-3 mr-1 text-green-500" />
              Úložisko: {target.limits.storage_gb === -1 ? 'Neobmedzené' : `${target.limits.storage_gb}GB`}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PremiumGate({
  feature,
  resource,
  children,
  fallback,
  showUsage = true,
  upgradeMessage
}: PremiumGateProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [canUse, setCanUse] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const checkUsage = async () => {
      try {
        const summary = await UsageTracker.getUsageSummary(user.id);
        setUsageSummary(summary);
        
        if (summary && resource) {
          const limit = summary.limits[resource];
          setCanUse(!limit.exceeded);
        } else {
          // If no specific resource, check overall plan access
          setCanUse(summary?.plan.id !== 'free');
        }
      } catch (error) {
        console.error('Error checking usage:', error);
        setCanUse(false);
      } finally {
        setLoading(false);
      }
    };

    checkUsage();
  }, [user, resource]);

  if (!user) {
    return (
      <Card className="p-6 text-center border-primary/20 bg-primary/5">
        <Lock className="w-8 h-8 mx-auto mb-3 text-primary" />
        <h3 className="text-lg font-semibold mb-2">Prihlásenie potrebné</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Pre prístup k funkcii {feature} sa musíte prihlásiť.
        </p>
        <div className="flex space-x-2 justify-center">
          <Button asChild>
            <Link href="/auth/login">Prihlásiť sa</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth/register">Registrovať sa</Link>
          </Button>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (canUse) {
    return (
      <div>
        {children}
        {showUsage && usageSummary && resource && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <UsageDisplay usageSummary={usageSummary} resource={resource} />
          </div>
        )}
      </div>
    );
  }

  // Show premium gate
  const currentPlan = usageSummary?.plan.id || 'free';
  const recommendedPlan = currentPlan === 'free' ? 'premium' : 'enterprise';
  const planDetails = PRICING_PLANS[recommendedPlan];

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className="p-6 text-center border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="flex justify-center mb-4">
        <div className="relative">
          <Crown className="w-12 h-12 text-yellow-500" />
          <Zap className="w-4 h-4 absolute -top-1 -right-1 text-yellow-600" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold mb-2 text-gray-900">
        {resource && usageSummary?.limits[resource].exceeded
          ? 'Limit prekročený'
          : 'Premium funkcia'
        }
      </h3>
      
      <p className="text-muted-foreground mb-4">
        {upgradeMessage || (
          resource && usageSummary?.limits[resource].exceeded
            ? `Prekročili ste limit pre ${feature}. Upgradnite na ${planDetails?.name} plán pre pokračovanie.`
            : `Funkcia ${feature} je dostupná s ${planDetails?.name} plánom.`
        )}
      </p>

      {/* Usage display for current limit */}
      {usageSummary && resource && (
        <div className="mb-4 p-3 bg-white rounded-lg">
          <UsageDisplay usageSummary={usageSummary} resource={resource} />
        </div>
      )}

      {/* Plan comparison */}
      {usageSummary && (
        <PlanComparisonCard
          currentPlan={usageSummary.plan.id}
          targetPlan={recommendedPlan}
        />
      )}

      {/* Upgrade recommendations */}
      {usageSummary?.upgrade_recommendations && usageSummary.upgrade_recommendations.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2 text-blue-900">Odporúčania:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            {usageSummary.upgrade_recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <ArrowRight className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex space-x-3 justify-center mt-6">
        <Button 
          onClick={() => router.push('/pricing')}
          className="bg-primary hover:bg-primary-dark"
        >
          <Crown className="w-4 h-4 mr-2" />
          Upgrade na {planDetails?.name}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard')}
        >
          Späť na dashboard
        </Button>
      </div>

      {/* Benefits highlight */}
      <div className="mt-6 p-4 bg-white rounded-lg">
        <h4 className="text-sm font-semibold mb-3">Výhody {planDetails?.name} plánu:</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {planDetails?.features.slice(0, 4).map((feature, index) => (
            <div key={index} className="flex items-center">
              <Check className="w-3 h-3 mr-1 text-green-500" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// Specialized components for common use cases
export function CreateWillGate({ children }: { children: React.ReactNode }) {
  return (
    <PremiumGate
      feature="vytváranie testamentov"
      resource="wills"
      upgradeMessage="Vytvorili ste maximum testamentov pre váš plán. Upgradnite pre neobmedzené možnosti."
    >
      {children}
    </PremiumGate>
  );
}

export function DocumentUploadGate({ children }: { children: React.ReactNode }) {
  return (
    <PremiumGate
      feature="nahrávanie dokumentov"
      resource="documents"
      upgradeMessage="Dosiahli ste limit dokumentov. Premium plán ponúka neobmedzené ukladanie."
    >
      {children}
    </PremiumGate>
  );
}

export function FamilySharingGate({ children }: { children: React.ReactNode }) {
  return (
    <PremiumGate
      feature="rodinné zdieľanie"
      resource="family_members"
      upgradeMessage="Rodinné zdieľanie je dostupné s Premium plánom."
    >
      {children}
    </PremiumGate>
  );
}

export function AIQueriesGate({ children }: { children: React.ReactNode }) {
  return (
    <PremiumGate
      feature="Sofia AI asistentku"
      resource="ai_queries"
      upgradeMessage="Vyčerpali ste denný limit AI dotazov. Premium plán ponúka neobmedzené dotazy."
    >
      {children}
    </PremiumGate>
  );
}