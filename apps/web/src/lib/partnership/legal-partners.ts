export interface LegalPartner {
  id: string;
  name: string;
  description: string;
  specialties: string[];
  location: string;
  logo?: string;

  // Contact information
  website: string;
  email?: string;
  phone?: string;
  address?: string;

  // Social media
  facebook?: string;
  linkedin?: string;

  // Partnership details
  partnerSince: Date;
  isActive: boolean;
  trustLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

  // Services offered
  services: LegalService[];

  // Metrics (for display)
  reviewsCount?: number;
  averageRating?: number;
  responseTime?: string; // e.g., "24 hours"
}

export interface LegalService {
  id: string;
  name: string;
  description: string;
  jurisdiction: 'SK' | 'CZ' | 'AT' | 'DE' | 'PL' | 'ALL';
  estimatedPrice?: {
    from: number;
    to: number;
    currency: 'EUR';
    unit: 'consultation' | 'document' | 'hour';
  };
  estimatedDuration?: string; // e.g., "2-3 days"
}

export interface PartnershipLink {
  partner: LegalPartner;
  type: 'contact_redirect' | 'facebook_redirect' | 'consultation_booking';
  url: string;
  description: string;

  // Analytics
  clicks: number;
  conversions?: number;
  lastClicked?: Date;
}

// Partnership data - In production this would come from a database
export const LEGAL_PARTNERS: Record<string, LegalPartner> = {
  'brno-advokati': {
    id: 'brno-advokati',
    name: 'Brno Advokáti',
    description: 'Špecializovaná advokátska kancelária so zameraním na rodinné právo a dedičské konania. Poskytujeme komplexné právne služby pre rodiny v Brne a okolí.',
    specialties: [
      'Dedičské právo',
      'Rodinné právo',
      'Závety a testamenty',
      'Majetkové vyporiadania',
      'Notárske služby'
    ],
    location: 'Brno, Česká republika',
    website: 'https://brnoadvokati.cz',
    facebook: 'https://www.facebook.com/brnoadvokati',
    email: 'info@brnoadvokati.cz',
    phone: '+420 xxx xxx xxx',
    address: 'Brno, Česká republika',
    partnerSince: new Date('2024-01-15'),
    isActive: true,
    trustLevel: 'Gold',
    services: [
      {
        id: 'will-review',
        name: 'Kontrola závetu',
        description: 'Profesionálna kontrola vášho závetu právnikom so špecializáciou na dedičské právo',
        jurisdiction: 'CZ',
        estimatedPrice: {
          from: 50,
          to: 150,
          currency: 'EUR',
          unit: 'document'
        },
        estimatedDuration: '2-3 dni'
      },
      {
        id: 'inheritance-consultation',
        name: 'Konzultácia dedičského práva',
        description: 'Osobná konzultácia k otázkam dedenia a majetkového vyporiadania',
        jurisdiction: 'CZ',
        estimatedPrice: {
          from: 80,
          to: 120,
          currency: 'EUR',
          unit: 'consultation'
        },
        estimatedDuration: '1-2 hodiny'
      },
      {
        id: 'notary-services',
        name: 'Notárske služby',
        description: 'Notárske overenie dokumentov a spísanie notárskych zápisníc',
        jurisdiction: 'CZ',
        estimatedPrice: {
          from: 30,
          to: 200,
          currency: 'EUR',
          unit: 'document'
        },
        estimatedDuration: '1 deň'
      }
    ],
    reviewsCount: 87,
    averageRating: 4.8,
    responseTime: '24 hodín'
  }
};

export class PartnershipManager {
  private partners: Map<string, LegalPartner> = new Map();
  private partnershipLinks: Map<string, PartnershipLink> = new Map();

  constructor() {
    // Initialize with default partners
    Object.values(LEGAL_PARTNERS).forEach(partner => {
      this.partners.set(partner.id, partner);

      // Create default partnership links
      this.createPartnershipLinks(partner);
    });
  }

  private createPartnershipLinks(partner: LegalPartner): void {
    // Contact page link
    const contactLink: PartnershipLink = {
      partner,
      type: 'contact_redirect',
      url: `${partner.website}/kontakt/`,
      description: `Kontaktná stránka ${partner.name}`,
      clicks: 0
    };

    // Facebook link
    if (partner.facebook) {
      const facebookLink: PartnershipLink = {
        partner,
        type: 'facebook_redirect',
        url: partner.facebook,
        description: `Facebook stránka ${partner.name}`,
        clicks: 0
      };

      this.partnershipLinks.set(`${partner.id}-facebook`, facebookLink);
    }

    this.partnershipLinks.set(`${partner.id}-contact`, contactLink);
  }

  /**
   * Get partner by ID
   */
  getPartner(partnerId: string): LegalPartner | undefined {
    return this.partners.get(partnerId);
  }

  /**
   * Get all active partners
   */
  getActivePartners(): LegalPartner[] {
    return Array.from(this.partners.values()).filter(partner => partner.isActive);
  }

  /**
   * Get partners by jurisdiction
   */
  getPartnersByJurisdiction(jurisdiction: 'SK' | 'CZ' | 'AT' | 'DE' | 'PL'): LegalPartner[] {
    return this.getActivePartners().filter(partner =>
      partner.services.some(service =>
        service.jurisdiction === jurisdiction || service.jurisdiction === 'ALL'
      )
    );
  }

  /**
   * Get partners by service type
   */
  getPartnersByService(serviceType: string): LegalPartner[] {
    return this.getActivePartners().filter(partner =>
      partner.services.some(service =>
        service.name.toLowerCase().includes(serviceType.toLowerCase()) ||
        service.description.toLowerCase().includes(serviceType.toLowerCase())
      )
    );
  }

  /**
   * Track partnership link click
   */
  trackClick(linkId: string): string | null {
    const link = this.partnershipLinks.get(linkId);

    if (!link) {
      return null;
    }

    // Update analytics
    link.clicks++;
    link.lastClicked = new Date();

    console.log('🔗 Partnership link clicked:', {
      partner: link.partner.name,
      type: link.type,
      url: link.url,
      totalClicks: link.clicks
    });

    // In production: Send analytics to database/service

    return link.url;
  }

  /**
   * Get partnership link
   */
  getPartnershipLink(partnerId: string, type: 'contact' | 'facebook'): PartnershipLink | undefined {
    const linkId = type === 'contact' ? `${partnerId}-contact` : `${partnerId}-facebook`;
    return this.partnershipLinks.get(linkId);
  }

  /**
   * Generate referral URL with tracking
   */
  generateReferralUrl(
    partnerId: string,
    linkType: 'contact' | 'facebook',
    source: string = 'legacyguard',
    campaign: string = 'will_generation'
  ): string | null {
    const partner = this.getPartner(partnerId);
    const link = this.getPartnershipLink(partnerId, linkType);

    if (!partner || !link) {
      return null;
    }

    // Create tracking URL
    const url = new URL(link.url);
    url.searchParams.set('utm_source', source);
    url.searchParams.set('utm_medium', 'referral');
    url.searchParams.set('utm_campaign', campaign);
    url.searchParams.set('ref', 'legacyguard');

    return url.toString();
  }

  /**
   * Get partnership analytics
   */
  getAnalytics(): {
    totalClicks: number;
    clicksByPartner: Record<string, number>;
    clicksByType: Record<string, number>;
    topPartners: { partner: string; clicks: number }[];
  } {
    const analytics = {
      totalClicks: 0,
      clicksByPartner: {} as Record<string, number>,
      clicksByType: {} as Record<string, number>,
      topPartners: [] as { partner: string; clicks: number }[]
    };

    this.partnershipLinks.forEach(link => {
      analytics.totalClicks += link.clicks;

      const partnerId = link.partner.id;
      analytics.clicksByPartner[partnerId] = (analytics.clicksByPartner[partnerId] || 0) + link.clicks;
      analytics.clicksByType[link.type] = (analytics.clicksByType[link.type] || 0) + link.clicks;
    });

    // Sort top partners
    analytics.topPartners = Object.entries(analytics.clicksByPartner)
      .map(([partner, clicks]) => ({ partner, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    return analytics;
  }

  /**
   * Create trust seal enhancement recommendation
   */
  recommendTrustSealEnhancement(
    currentTrustLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum',
    jurisdiction: 'SK' | 'CZ' | 'AT' | 'DE' | 'PL'
  ): {
    recommendedPartners: LegalPartner[];
    enhancementPossible: boolean;
    targetTrustLevel: 'Silver' | 'Gold' | 'Platinum';
    estimatedCost: { from: number; to: number; currency: 'EUR' };
  } {
    const partners = this.getPartnersByJurisdiction(jurisdiction)
      .filter(partner => partner.services.some(service =>
        service.name.toLowerCase().includes('kontrola') ||
        service.name.toLowerCase().includes('review')
      ));

    let targetTrustLevel: 'Silver' | 'Gold' | 'Platinum' = 'Silver';
    let enhancementPossible = true;

    switch (currentTrustLevel) {
      case 'Bronze':
        targetTrustLevel = 'Silver';
        break;
      case 'Silver':
        targetTrustLevel = 'Gold';
        break;
      case 'Gold':
        targetTrustLevel = 'Platinum';
        break;
      case 'Platinum':
        enhancementPossible = false;
        break;
    }

    // Calculate estimated cost range
    const reviewServices = partners.flatMap(partner =>
      partner.services.filter(service =>
        service.name.toLowerCase().includes('kontrola') ||
        service.name.toLowerCase().includes('review')
      )
    );

    const costs = reviewServices.map(service => service.estimatedPrice).filter(Boolean);
    const estimatedCost = {
      from: Math.min(...costs.map(c => c!.from)),
      to: Math.max(...costs.map(c => c!.to)),
      currency: 'EUR' as const
    };

    return {
      recommendedPartners: partners.slice(0, 3), // Top 3 partners
      enhancementPossible,
      targetTrustLevel,
      estimatedCost
    };
  }
}

// Export singleton instance
export const partnershipManager = new PartnershipManager();