'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  Crown,
  Gift,
  ArrowRight,
  Calendar,
  Mail,
  Download,
  FileText,
  Users,
  Shield,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { PRICING_PLANS } from '@/lib/pricing/plans';
import { BehaviorTracker } from '@/lib/monitoring/behavior-tracker';
import { UsageTracker } from '@/lib/pricing/usage-tracker';

interface PaymentSuccessProps {
  sessionId?: string;
  planId?: string;
  onContinue: () => void;
  className?: string;
}

interface SubscriptionDetails {
  planId: string;
  status: 'active' | 'trialing';
  currentPeriodEnd: string;
  trialEnd?: string;
  amount: number;
  currency: string;
}

export function PaymentSuccess({ sessionId, planId, onContinue, className }: PaymentSuccessProps) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextSteps] = useState([
    {
      id: 'create_will',
      title: 'Vytvorte svoj prvý testament',
      description: 'Využite našu intuitívnu čarodejku na vytvorenie testamentu',
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      action: 'Začať s testamentom',
      href: '/will/create'
    },
    {
      id: 'emergency_contacts',
      title: 'Pridajte núdzové kontakty',
      description: 'Nastavte svojich blízkych ako núdzové kontakty',
      icon: <Users className="w-5 h-5 text-green-600" />,
      action: 'Pridať kontakty',
      href: '/emergency-contacts'
    },
    {
      id: 'upload_documents',
      title: 'Nahrajte dokumenty',
      description: 'Organizujte svoje dôležité dokumenty na jednom mieste',
      icon: <Shield className="w-5 h-5 text-purple-600" />,
      action: 'Nahrať dokumenty',
      href: '/documents'
    }
  ]);

  useEffect(() => {
    if (user) {
      loadSubscriptionDetails();
    }
  }, [user, sessionId, planId]);

  const loadSubscriptionDetails = async () => {
    if (!user) return;

    try {
      // Load subscription details
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subscriptionData) {
        setSubscription({
          planId: subscriptionData.plan_id,
          status: subscriptionData.status,
          currentPeriodEnd: subscriptionData.current_period_end,
          trialEnd: subscriptionData.trial_end,
          amount: subscriptionData.amount || 0,
          currency: subscriptionData.currency || 'EUR'
        });

        // Update usage tracker
        await UsageTracker.updatePlan(user.id, subscriptionData.plan_id);
      }

      // Track payment success
      await BehaviorTracker.trackEvent(user.id, {
        event_type: 'payment_completed',
        plan_id: subscriptionData?.plan_id || planId || 'unknown',
        session_id: sessionId || null,
        amount: subscriptionData?.amount || 0,
        currency: subscriptionData?.currency || 'EUR',
        status: subscriptionData?.status || 'unknown',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error loading subscription details:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackNextStepClick = async (stepId: string) => {
    if (!user) return;

    await BehaviorTracker.trackEvent(user.id, {
      event_type: 'onboarding_next_step_clicked',
      step_id: stepId,
      timestamp: new Date().toISOString()
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const plan = subscription ? PRICING_PLANS[subscription.planId] : null;
  const isTrialing = subscription?.status === 'trialing';

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* Success Header */}
      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">
            {isTrialing ? 'Skúšobná verzia aktivovaná!' : 'Platba úspešná!'}
          </h1>

          <p className="text-muted-foreground mb-4">
            {isTrialing
              ? 'Máte 30 dní na vyskúšanie všetkých Premium funkcií zadarmo.'
              : 'Ďakujeme za dôveru. Váš účet bol úspešne upgradovaný.'
            }
          </p>

          {plan && (
            <div className="flex justify-center">
              <Badge className="bg-primary text-primary-foreground flex items-center space-x-1">
                <Crown className="w-4 h-4" />
                <span>{plan.name}</span>
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Details */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Detaily predplatného</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plán:</span>
                <span className="font-medium">{plan?.name}</span>
              </div>

              {!isTrialing && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cena:</span>
                  <span className="font-medium">
                    €{subscription.amount.toFixed(2)} {subscription.currency}
                    {plan?.billing_period === 'yearly' ? '/rok' : '/mesiac'}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isTrialing ? 'Skúška končí:' : 'Ďalšia platba:'}
                </span>
                <span className="font-medium">
                  {new Date(subscription.trialEnd || subscription.currentPeriodEnd).toLocaleDateString('sk-SK')}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Stav:</span>
                <Badge className={isTrialing ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                  {isTrialing ? 'Skúšobná verzia' : 'Aktívne'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium Features Unlocked */}
      {plan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gift className="w-5 h-5 text-primary" />
              <span>Odomknuté funkcie</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plan.features.slice(0, 8).map((feature, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
            {plan.features.length > 8 && (
              <p className="text-sm text-muted-foreground mt-3">
                + {plan.features.length - 8} ďalších funkcií
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Ďalšie kroky</CardTitle>
          <p className="text-sm text-muted-foreground">
            Začnite využívať vaše nové Premium funkcie
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nextSteps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => trackNextStepClick(step.id)}
                  asChild
                >
                  <a href={step.href}>
                    {step.action}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Welcome Email Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Mail className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <div className="flex items-center justify-between">
            <span>Uvítací email s detailmi bol odoslaný na {user?.email}</span>
            <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-800">
              <Download className="w-4 h-4 mr-1" />
              Stiahnuť účtenku
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Quick Actions */}
      <div className="flex justify-center space-x-4">
        <Button onClick={onContinue} size="lg" className="min-w-[150px]">
          <Zap className="w-4 h-4 mr-2" />
          Začať používať
        </Button>

        <Button variant="outline" size="lg" asChild>
          <a href="/dashboard">
            Prejsť na dashboard
          </a>
        </Button>
      </div>

      {/* Support Notice */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Potrebujete pomoc? Kontaktujte našu podporu na</p>
        <p>
          <a href="mailto:support@legacyguard.sk" className="text-primary hover:underline">
            support@legacyguard.sk
          </a>
          {' alebo '}
          <a href="tel:+421900000000" className="text-primary hover:underline">
            +421 900 000 000
          </a>
        </p>
      </div>
    </div>
  );
}