'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  ExternalLink,
  Copy,
  QrCode
} from 'lucide-react';

import {
  TrustSealVerifier,
  VerificationResult,
  TrustSealCertificate
} from '@/lib/trust-seal/verification';
import { TrustSealLevel } from '@/lib/trust-seal/calculator';

interface TrustSealVerificationWidgetProps {
  className?: string;
  embedded?: boolean;
  initialSealId?: string;
}

export function TrustSealVerificationWidget({
  className,
  embedded = false,
  initialSealId
}: TrustSealVerificationWidgetProps) {
  const [sealInput, setSealInput] = useState(initialSealId || '');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  const handleVerification = async () => {
    if (!sealInput.trim()) return;

    try {
      setVerifying(true);
      setVerificationResult(null);

      // Extract seal ID from URL if needed
      let sealId = sealInput.trim();
      if (TrustSealVerifier.isValidVerificationUrl(sealInput)) {
        sealId = TrustSealVerifier.extractSealIdFromUrl(sealInput) || sealInput;
      }

      const result = await TrustSealVerifier.verifyTrustSeal(sealId, {
        includeMetadata: true,
        logVerification: true,
        requesterInfo: {
          userAgent: navigator.userAgent
        }
      });

      setVerificationResult(result);

    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({
        valid: false,
        reason: 'Verification failed due to system error'
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerification();
    }
  };

  const copyVerificationUrl = () => {
    if (verificationResult?.valid && sealInput) {
      const url = TrustSealVerifier.generatePublicVerificationUrl(sealInput);
      navigator.clipboard.writeText(url);
    }
  };

  const getTrustSealLevelInfo = (level: TrustSealLevel) => {
    const info = {
      Bronze: { color: 'orange', description: 'Základná úroveň dôvery' },
      Silver: { color: 'gray', description: 'Dobrá úroveň dôvery' },
      Gold: { color: 'yellow', description: 'Vysoká úroveň dôvery' },
      Platinum: { color: 'purple', description: 'Najvyššia úroveň dôvery' }
    };
    return info[level];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            {embedded ? 'Overenie Trust Seal' : 'Trust Seal Verification'}
          </CardTitle>
          <CardDescription>
            Zadajte ID Trust Seal alebo URL pre overenie platnosti a autenticity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Section */}
          <div className="flex gap-2">
            <Input
              placeholder="Zadajte Trust Seal ID alebo URL..."
              value={sealInput}
              onChange={(e) => setSealInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button
              onClick={handleVerification}
              disabled={verifying || !sealInput.trim()}
            >
              {verifying ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {verifying ? 'Overujem...' : 'Overiť'}
            </Button>
          </div>

          {/* Verification Result */}
          {verificationResult && (
            <div className="space-y-4">
              {verificationResult.valid ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="font-semibold mb-2">✅ Trust Seal je platný a autentický</div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Úroveň:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className={`bg-${getTrustSealLevelInfo(verificationResult.level!).color}-100 text-${getTrustSealLevelInfo(verificationResult.level!).color}-800`}
                          >
                            {verificationResult.level} Trust Seal
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {getTrustSealLevelInfo(verificationResult.level!).description}
                        </p>
                      </div>

                      <div>
                        <span className="font-medium">Platnosť:</span>
                        <div className="mt-1">
                          <div className="text-xs">
                            Vydané: {verificationResult.issuedAt && formatDate(verificationResult.issuedAt)}
                          </div>
                          <div className="text-xs">
                            Platné do: {verificationResult.validUntil && formatDate(verificationResult.validUntil)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {verificationResult.metadata && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <div className="text-sm font-medium mb-2">Detaily dokumentu:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-medium">Skóre dôvery:</span>{' '}
                            {verificationResult.metadata.confidenceScore}%
                          </div>
                          {verificationResult.metadata.documentInfo && (
                            <>
                              <div>
                                <span className="font-medium">Jurisdikcia:</span>{' '}
                                {verificationResult.metadata.documentInfo.jurisdiction}
                              </div>
                              <div>
                                <span className="font-medium">Typ:</span>{' '}
                                {verificationResult.metadata.documentInfo.documentType}
                              </div>
                              {verificationResult.metadata.documentInfo.createdAt && (
                                <div>
                                  <span className="font-medium">Vytvorené:</span>{' '}
                                  {new Date(verificationResult.metadata.documentInfo.createdAt).toLocaleDateString('sk-SK')}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {verificationResult.warnings && verificationResult.warnings.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-yellow-700 mb-1">⚠️ Upozornenia:</div>
                        {verificationResult.warnings.map((warning, index) => (
                          <div key={index} className="text-xs text-yellow-700">
                            • {warning}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyVerificationUrl}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Kopírovať URL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCertificate(!showCertificate)}
                      >
                        <QrCode className="h-3 w-3 mr-1" />
                        Certifikát
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-1">❌ Trust Seal nie je platný</div>
                    <div className="text-sm">
                      {verificationResult.reason || 'Neznámy dôvod neplatnosti'}
                    </div>

                    {verificationResult.level && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Úroveň:</span> {verificationResult.level}
                        {verificationResult.issuedAt && (
                          <div>
                            <span className="font-medium">Vydané:</span>{' '}
                            {formatDate(verificationResult.issuedAt)}
                          </div>
                        )}
                        {verificationResult.validUntil && (
                          <div>
                            <span className="font-medium">Platné do:</span>{' '}
                            {formatDate(verificationResult.validUntil)}
                          </div>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Certificate Modal/Section */}
              {showCertificate && verificationResult.valid && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Trust Seal Certificate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="w-32 h-32 mx-auto bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                        <QrCode className="h-16 w-16 text-gray-400" />
                        <div className="absolute text-xs">QR Kód</div>
                      </div>

                      <div className="text-sm">
                        <div className="font-semibold">Oficialny certifikát platnosti</div>
                        <div className="text-gray-600 mt-1">
                          Tento dokument má platný Trust Seal úrovne {verificationResult.level}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Seal ID: {sealInput}</div>
                        <div>Overené: {new Date().toLocaleString('sk-SK')}</div>
                        <div>
                          Verifikačná URL:{' '}
                          <span className="font-mono">
                            {TrustSealVerifier.generatePublicVerificationUrl(sealInput)}
                          </span>
                        </div>
                      </div>

                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Stiahnuť certifikát
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Help Section */}
          {!embedded && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">💡 Ako overiť Trust Seal:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Zadajte úplné Trust Seal ID (UUID formát)</li>
                <li>• Alebo vložte úplnú verifikačnú URL</li>
                <li>• Overenie je bezplatné a anonymné</li>
                <li>• Všetky overenia sú zaznamenané pre audit</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Simplified public verification component
export function PublicTrustSealVerification({ sealId }: { sealId: string }) {
  return (
    <TrustSealVerificationWidget
      embedded={true}
      initialSealId={sealId}
      className="max-w-lg"
    />
  );
}

// Verification badge component
export function TrustSealBadge({
  sealId,
  level,
  showVerifyButton = true
}: {
  sealId: string;
  level: TrustSealLevel;
  showVerifyButton?: boolean;
}) {
  const info = {
    Bronze: { color: 'orange', icon: '🥉' },
    Silver: { color: 'gray', icon: '🥈' },
    Gold: { color: 'yellow', icon: '🥇' },
    Platinum: { color: 'purple', icon: '💎' }
  }[level];

  const handleVerify = () => {
    const url = TrustSealVerifier.generatePublicVerificationUrl(sealId);
    window.open(url, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="secondary"
        className={`bg-${info.color}-100 text-${info.color}-800 flex items-center gap-1`}
      >
        <Shield className="h-3 w-3" />
        {info.icon} {level} Trust Seal
      </Badge>

      {showVerifyButton && (
        <Button size="sm" variant="ghost" onClick={handleVerify}>
          <ExternalLink className="h-3 w-3 mr-1" />
          Overiť
        </Button>
      )}
    </div>
  );
}