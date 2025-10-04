export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_period: 'monthly' | 'yearly';
  features: string[];
  limits: {
    wills: number; // -1 = unlimited
    documents: number;
    emergency_contacts: number;
    storage_gb: number;
    family_members?: number;
    ai_queries?: number;
    premium_support?: boolean;
  };
  popular?: boolean;
  description: string;
  stripe_price_id?: string;
}

export const PRICING_PLANS: Record<string, PricingPlan> = {
  free: {
    id: 'free',
    name: 'Základný',
    price: 0,
    currency: 'EUR',
    billing_period: 'monthly',
    description: 'Pre jednotlivcov, ktorí začínajú s plánovaním dedičstva',
    features: [
      'Jeden základný testament',
      'Základné právne dokumenty',
      'Až 3 núdzové kontakty',
      'Základná podpora emailom',
      'Bezpečné uloženie dokumentov'
    ],
    limits: {
      wills: 1,
      documents: 5,
      emergency_contacts: 3,
      storage_gb: 0.1,
      ai_queries: 10
    }
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 19,
    currency: 'EUR',
    billing_period: 'monthly',
    description: 'Pre rodiny, ktoré chcú komplexnú ochranu dedičstva',
    popular: true,
    features: [
      'Neobmedzené testamenty a dokumenty',
      'Pokročilé právne šablóny',
      'Neobmedzené núdzové kontakty',
      'Sofia AI asistentka',
      'Rodinné zdieľanie (6 členov)',
      'Prioritná podpora 24/7',
      'Automatické zálohovanie',
      'Pokročilé analytiky',
      'Export do všetkých formátov'
    ],
    limits: {
      wills: -1,
      documents: -1,
      emergency_contacts: -1,
      storage_gb: 5,
      family_members: 6,
      ai_queries: -1,
      premium_support: true
    },
    stripe_price_id: process.env.STRIPE_PREMIUM_PRICE_ID
  },
  premium_yearly: {
    id: 'premium_yearly',
    name: 'Premium Ročný',
    price: 190, // 2 months free
    currency: 'EUR',
    billing_period: 'yearly',
    description: 'Ušetrite 2 mesiace s ročným predplatným',
    features: [
      'Všetky Premium funkcie',
      'Ušetrite 17% oproti mesačnému predplatnému',
      'Prioritná implementácia nových funkcií',
      'Ročný prehľad a optimalizácia dokumentov'
    ],
    limits: {
      wills: -1,
      documents: -1,
      emergency_contacts: -1,
      storage_gb: 10,
      family_members: 6,
      ai_queries: -1,
      premium_support: true
    },
    stripe_price_id: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    currency: 'EUR',
    billing_period: 'monthly',
    description: 'Pre veľké rodiny a podnikateľov s komplexnými potrebami',
    features: [
      'Všetky Premium funkcie',
      'Neobmedzený počet rodinných členov',
      'Dedicated account manager',
      'Právne poradenstvo (4h mesačne)',
      'Custom integrácie',
      'White-label riešenie',
      'API prístup',
      'SLA 99.9% uptime',
      'On-premise deployment možnosti'
    ],
    limits: {
      wills: -1,
      documents: -1,
      emergency_contacts: -1,
      storage_gb: -1,
      family_members: -1,
      ai_queries: -1,
      premium_support: true
    },
    stripe_price_id: process.env.STRIPE_ENTERPRISE_PRICE_ID
  }
};

export function getPlan(planId: string): PricingPlan | null {
  return PRICING_PLANS[planId] || null;
}

export function getAllPlans(): PricingPlan[] {
  return Object.values(PRICING_PLANS);
}

export function getMonthlyPlans(): PricingPlan[] {
  return Object.values(PRICING_PLANS).filter(plan => plan.billing_period === 'monthly');
}

export function getYearlyPlans(): PricingPlan[] {
  return Object.values(PRICING_PLANS).filter(plan => plan.billing_period === 'yearly');
}

export function calculateSavings(monthlyPlan: PricingPlan, yearlyPlan: PricingPlan): {
  monthlyTotal: number;
  yearlyPrice: number;
  savings: number;
  savingsPercent: number;
} {
  const monthlyTotal = monthlyPlan.price * 12;
  const yearlyPrice = yearlyPlan.price;
  const savings = monthlyTotal - yearlyPrice;
  const savingsPercent = (savings / monthlyTotal) * 100;

  return {
    monthlyTotal,
    yearlyPrice,
    savings,
    savingsPercent
  };
}

export function isPlanFeatureAvailable(planId: string, feature: string): boolean {
  const plan = getPlan(planId);
  if (!plan) return false;

  // Check if feature is in the plan's features list
  return plan.features.some(f => 
    f.toLowerCase().includes(feature.toLowerCase())
  );
}

export function comparePlans(planId1: string, planId2: string): {
  plan1: PricingPlan;
  plan2: PricingPlan;
  differences: {
    features: {
      plan1Only: string[];
      plan2Only: string[];
      common: string[];
    };
    limits: {
      better: string;
      differences: Record<string, { plan1: any; plan2: any }>;
    };
  };
} | null {
  const plan1 = getPlan(planId1);
  const plan2 = getPlan(planId2);

  if (!plan1 || !plan2) return null;

  const plan1Features = new Set(plan1.features);
  const plan2Features = new Set(plan2.features);

  const plan1Only = plan1.features.filter(f => !plan2Features.has(f));
  const plan2Only = plan2.features.filter(f => !plan1Features.has(f));
  const common = plan1.features.filter(f => plan2Features.has(f));

  const limitDifferences: Record<string, { plan1: any; plan2: any }> = {};
  let betterLimitsPlan = '';
  let plan1BetterCount = 0;
  let plan2BetterCount = 0;

  Object.keys(plan1.limits).forEach(limitKey => {
    const limit1 = plan1.limits[limitKey as keyof typeof plan1.limits];
    const limit2 = plan2.limits[limitKey as keyof typeof plan2.limits];

    if (limit1 !== limit2) {
      limitDifferences[limitKey] = { plan1: limit1, plan2: limit2 };

      // Compare numeric limits (-1 means unlimited)
      if (typeof limit1 === 'number' && typeof limit2 === 'number') {
        if (limit1 === -1 && limit2 !== -1) {
          plan1BetterCount++;
        } else if (limit2 === -1 && limit1 !== -1) {
          plan2BetterCount++;
        } else if (limit1 > limit2) {
          plan1BetterCount++;
        } else if (limit2 > limit1) {
          plan2BetterCount++;
        }
      }
    }
  });

  betterLimitsPlan = plan1BetterCount > plan2BetterCount ? plan1.name : 
                     plan2BetterCount > plan1BetterCount ? plan2.name : 'equal';

  return {
    plan1,
    plan2,
    differences: {
      features: {
        plan1Only,
        plan2Only,
        common
      },
      limits: {
        better: betterLimitsPlan,
        differences: limitDifferences
      }
    }
  };
}