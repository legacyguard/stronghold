'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Crown,
  Check,
  CreditCard,
  Shield,
  Zap,
  Users,
  FileText,
  Calendar,
  Gift,
  Lock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { PRICING_PLANS, calculateSavings } from '@/lib/pricing/plans';
import { UsageTracker } from '@/lib/pricing/usage-tracker';
import { BehaviorTracker } from '@/lib/monitoring/behavior-tracker';

interface StripeCheckoutProps {
  selectedPlan?: string;
  onSuccess: () => void;
  onCancel: () => void;
  className?: string;
}

interface SubscriptionInfo {
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export function StripeCheckout({ selectedPlan = 'premium', onSuccess, onCancel, className }: StripeCheckoutProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionInfo | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  const planId = isAnnual && selectedPlan === 'premium' ? 'premium_yearly' : selectedPlan;
  const plan = PRICING_PLANS[planId];
  const monthlyPlan = PRICING_PLANS['premium'];
  const yearlyPlan = PRICING_PLANS['premium_yearly'];

  useEffect(() => {
    if (user) {
      loadCurrentSubscription();
      trackCheckoutView();
    }
  }, [user, planId]);

  const trackCheckoutView = async () => {
    if (user) {
      await BehaviorTracker.trackEvent(user.id, {
        event_type: 'checkout_viewed',
        plan_id: planId,
        plan_price: plan.price,
        billing_period: plan.billing_period,
        timestamp: new Date().toISOString()
      });
    }
  };

  const loadCurrentSubscription = async () => {
    if (!user) return;

    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subscription) {
        setCurrentSubscription({
          planId: subscription.plan_id,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false
        });
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      // Simulate coupon validation (in real app, validate with Stripe)
      const validCoupons = {
        'WELCOME10': { discount: 10, type: 'percent' },
        'SAVE20': { discount: 20, type: 'percent' },
        'FIRST50': { discount: 50, type: 'percent' }
      };

      const coupon = validCoupons[couponCode.toUpperCase() as keyof typeof validCoupons];
      if (coupon) {
        setAppliedCoupon({ code: couponCode.toUpperCase(), discount: coupon.discount });
        setError(null);

        await BehaviorTracker.trackEvent(user!.id, {
          event_type: 'coupon_applied',
          coupon_code: couponCode.toUpperCase(),
          discount_percent: coupon.discount,
          plan_id: planId,
          timestamp: new Date().toISOString()
        });
      } else {
        setError('Neplatný kód kupónu');
        setAppliedCoupon(null);
      }
    } catch (error) {
      setError('Chyba pri aplikácii kupónu');
      setAppliedCoupon(null);
    }
  };

  const createCheckoutSession = async () => {
    if (!user || !plan) return;

    setIsLoading(true);
    setError(null);

    try {
      // Track checkout attempt
      await BehaviorTracker.trackEvent(user.id, {
        event_type: 'checkout_attempted',
        plan_id: planId,
        plan_price: plan.price,
        billing_period: plan.billing_period,
        coupon_applied: appliedCoupon?.code || null,
        timestamp: new Date().toISOString()
      });

      // In a real implementation, you would call your backend to create a Stripe checkout session
      const checkoutData = {
        plan_id: planId,
        price_id: plan.stripe_price_id,
        user_id: user.id,
        coupon: appliedCoupon?.code || null,
        success_url: `${window.location.origin}/dashboard?payment=success`,
        cancel_url: window.location.href
      };

      // Simulate API call to create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken || ''}`
        },
        body: JSON.stringify(checkoutData)
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;

    } catch (error) {
      console.error('Error creating checkout session:', error);
      setError('Chyba pri vytváraní platby. Skúste to znova.');

      await BehaviorTracker.trackEvent(user.id, {
        event_type: 'checkout_failed',
        plan_id: planId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFreeTrial = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Start free trial
      await UsageTracker.updatePlan(user.id, 'premium');

      // Create trial subscription record
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_id: 'premium',
          status: 'trialing',
          trial_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      await BehaviorTracker.trackEvent(user.id, {
        event_type: 'free_trial_started',
        plan_id: 'premium',
        trial_days: 30,
        timestamp: new Date().toISOString()
      });

      onSuccess();
    } catch (error) {
      console.error('Error starting free trial:', error);
      setError('Chyba pri spustení skúšobnej verzie');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFinalPrice = () => {
    if (!plan) return 0;
    let price = plan.price;
    if (appliedCoupon) {
      price = price * (1 - appliedCoupon.discount / 100);
    }
    return price;
  };

  const savings = isAnnual ? calculateSavings(monthlyPlan, yearlyPlan) : null;

  if (!plan) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <AlertDescription className="text-red-700">
          Vybraný plán nebol nájdený.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`max-w-md mx-auto space-y-6 ${className}`}>
      {/* Plan Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-primary" />
            <span>Vybraný plán</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{plan.name}</h3>
              {plan.popular && (
                <Badge className="bg-primary text-primary-foreground">Najpopulárnejší</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">{plan.description}</p>

            {selectedPlan === 'premium' && (
              <div className="flex items-center justify-between">
                <Label htmlFor="billing-toggle">Ročné fakturovanie</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="billing-toggle"
                    checked={isAnnual}
                    onCheckedChange={setIsAnnual}
                  />
                  {isAnnual && savings && (
                    <Badge className="bg-green-100 text-green-800">
                      Ušetríte {savings.savingsPercent.toFixed(0)}%
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-bold">€{calculateFinalPrice().toFixed(0)}</span>
                <span className="text-muted-foreground">/{plan.billing_period === 'yearly' ? 'rok' : 'mesiac'}</span>
              </div>

              {appliedCoupon && (
                <div className="text-sm text-green-600">
                  Kupón {appliedCoupon.code}: -{appliedCoupon.discount}%
                  <span className="line-through text-muted-foreground ml-2">€{plan.price}</span>
                </div>
              )}

              {isAnnual && savings && (
                <div className="text-sm text-green-600">
                  Ušetríte €{savings.savings.toFixed(0)} ročne oproti mesačnému plánu
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Čo získate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {plan.features.slice(0, 6).map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
            {plan.features.length > 6 && (
              <div className="text-sm text-muted-foreground">
                + {plan.features.length - 6} ďalších funkcií
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Coupon Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gift className="w-4 h-4" />
            <span>Máte zľavový kód?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Zadajte kód"
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <Button variant="outline" onClick={applyCoupon}>
              Aplikovať
            </Button>
          </div>
          {appliedCoupon && (
            <div className="mt-2 text-sm text-green-600">
              ✓ Kupón {appliedCoupon.code} bol úspešne aplikovaný
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <div className="flex items-center space-x-2">
            <Lock className="w-3 h-3" />
            <span className="text-xs">Zabezpečené Stripe platbou • SSL šifrovanie • PCI DSS</span>
          </div>
        </AlertDescription>
      </Alert>

      {/* Error Message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Subscription Notice */}
      {currentSubscription && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            Už máte aktívne predplatné ({PRICING_PLANS[currentSubscription.planId]?.name}).
            Upgrade bude aplikovaný okamžite a preplatok bude proporcionálne účtovaný.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Free Trial Option */}
        {!currentSubscription && selectedPlan === 'premium' && (
          <Button
            onClick={handleFreeTrial}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Calendar className="w-4 h-4 mr-2" />
            )}
            Začať 30-dňovú skúšku zadarmo
          </Button>
        )}

        {/* Main Purchase Button */}
        <Button
          onClick={createCheckoutSession}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <CreditCard className="w-4 h-4 mr-2" />
          )}
          {currentSubscription ? 'Upgradovať plán' : 'Pokračovať na platbu'}
        </Button>

        <Button variant="ghost" onClick={onCancel} className="w-full">
          Zrušiť
        </Button>
      </div>

      {/* Terms */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>Pokračovaním súhlasíte s našimi</p>
        <p>
          <a href="/terms" className="underline hover:text-primary">Všeobecnými podmienkami</a>
          {' a '}
          <a href="/privacy" className="underline hover:text-primary">Zásadami ochrany súkromia</a>
        </p>
        <p>Predplatné sa automaticky obnovuje. Môžete ho kedykoľvek zrušiť.</p>
      </div>
    </div>
  );
}