'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ExternalLink,
  Star,
  Clock,
  Euro,
  MapPin,
  Mail,
  Phone,
  Facebook,
  Award,
  CheckCircle
} from 'lucide-react';

import { LegalPartner, LegalService, partnershipManager } from '@/lib/partnership/legal-partners';
import { TrustSeal } from '@/lib/trust-seal/calculator';

interface LegalPartnerCardProps {
  partner: LegalPartner;
  userJurisdiction?: 'SK' | 'CZ' | 'AT' | 'DE' | 'PL';
  currentTrustSeal?: TrustSeal;
  highlightService?: string;
  className?: string;
}

export function LegalPartnerCard({
  partner,
  userJurisdiction,
  currentTrustSeal,
  highlightService,
  className
}: LegalPartnerCardProps) {
  const [isRedirecting, setIsRedirecting] = useState<string | null>(null);

  // Handle partnership link clicks with tracking
  const handlePartnershipClick = async (linkType: 'contact' | 'facebook') => {
    setIsRedirecting(linkType);

    try {
      // Track click and get referral URL
      const referralUrl = partnershipManager.generateReferralUrl(
        partner.id,
        linkType,
        'legacyguard',
        currentTrustSeal ? `trust_seal_${currentTrustSeal.level.toLowerCase()}` : 'will_generation'
      );

      if (referralUrl) {
        // Open in new tab
        window.open(referralUrl, '_blank', 'noopener,noreferrer');

        // Track the click
        const linkId = linkType === 'contact' ? `${partner.id}-contact` : `${partner.id}-facebook`;
        partnershipManager.trackClick(linkId);
      }
    } catch (error) {
      console.error('Partnership redirect error:', error);
    } finally {
      setTimeout(() => setIsRedirecting(null), 1000);
    }
  };

  // Get relevant services for user's jurisdiction
  const relevantServices = partner.services.filter(service =>
    !userJurisdiction || service.jurisdiction === userJurisdiction || service.jurisdiction === 'ALL'
  );

  // Get trust seal enhancement possibility
  const trustEnhancement = currentTrustSeal && userJurisdiction
    ? partnershipManager.recommendTrustSealEnhancement(currentTrustSeal.level, userJurisdiction)
    : null;

  const canEnhanceTrustSeal = trustEnhancement?.enhancementPossible &&
    trustEnhancement.recommendedPartners.some(p => p.id === partner.id);

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Trust level indicator */}
      <div className={`absolute top-0 right-0 w-16 h-16 ${
        partner.trustLevel === 'Platinum' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
        partner.trustLevel === 'Gold' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
        partner.trustLevel === 'Silver' ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
        'bg-gradient-to-br from-orange-400 to-orange-600'
      }`}>
        <Award className="h-4 w-4 text-white absolute top-2 right-2" />
      </div>

      <CardHeader className="pr-20">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{partner.name}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {partner.description}
            </CardDescription>
          </div>
        </div>

        {/* Trust level and rating */}
        <div className="flex items-center gap-4 mt-3">
          <Badge variant="secondary" className="px-2 py-1">
            {partner.trustLevel} Partner
          </Badge>

          {partner.averageRating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{partner.averageRating}</span>
              {partner.reviewsCount && (
                <span className="text-gray-500">({partner.reviewsCount})</span>
              )}
            </div>
          )}

          {partner.responseTime && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{partner.responseTime}</span>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
          <MapPin className="h-4 w-4" />
          <span>{partner.location}</span>
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1 mt-3">
          {partner.specialties.slice(0, 3).map((specialty, index) => (
            <Badge
              key={index}
              variant="outline"
              className={`text-xs ${
                highlightService && specialty.toLowerCase().includes(highlightService.toLowerCase())
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : ''
              }`}
            >
              {specialty}
            </Badge>
          ))}
          {partner.specialties.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{partner.specialties.length - 3} ďalších
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Trust Seal Enhancement Alert */}
        {canEnhanceTrustSeal && (
          <Alert className="mb-4 border-blue-500 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="font-medium mb-1">Trust Seal Enhancement dostupný!</div>
              <div className="text-sm">
                Profesionálna kontrola môže zvýšiť váš Trust Seal na{' '}
                <strong>{trustEnhancement!.targetTrustLevel}</strong> úroveň.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Services */}
        {relevantServices.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium mb-2 text-sm">Dostupné služby:</h4>
            <div className="space-y-2">
              {relevantServices.slice(0, 2).map((service) => (
                <div
                  key={service.id}
                  className={`p-3 rounded-lg border ${
                    highlightService && service.name.toLowerCase().includes(highlightService.toLowerCase())
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-sm">{service.name}</span>
                    {service.estimatedPrice && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Euro className="h-3 w-3" />
                        <span>
                          {service.estimatedPrice.from}€ - {service.estimatedPrice.to}€
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {service.description}
                  </p>
                  {service.estimatedDuration && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{service.estimatedDuration}</span>
                    </div>
                  )}
                </div>
              ))}
              {relevantServices.length > 2 && (
                <div className="text-xs text-gray-500 text-center py-1">
                  +{relevantServices.length - 2} ďalších služieb
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => handlePartnershipClick('contact')}
            disabled={isRedirecting === 'contact'}
            className="flex items-center gap-2 text-sm"
          >
            {isRedirecting === 'contact' ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Presmerovanie...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                Kontaktovať
              </>
            )}
          </Button>

          {partner.facebook && (
            <Button
              variant="outline"
              onClick={() => handlePartnershipClick('facebook')}
              disabled={isRedirecting === 'facebook'}
              className="flex items-center gap-2 text-sm"
            >
              {isRedirecting === 'facebook' ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Presmerovanie...
                </>
              ) : (
                <>
                  <Facebook className="h-4 w-4" />
                  Facebook
                </>
              )}
            </Button>
          )}
        </div>

        {/* Contact Info */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
            {partner.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span>{partner.email}</span>
              </div>
            )}
            {partner.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{partner.phone}</span>
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              Partner od {partner.partnerSince.toLocaleDateString('sk-SK')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}