'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WillGeneratorWizard } from '@/components/will-generator/WillGeneratorWizard';
import { WillFormData } from '@/lib/will/templates';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export default function WillGeneratorPage() {
  const router = useRouter();
  const { user, session } = useAuth();

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [lastGeneratedFilename, setLastGeneratedFilename] = useState<string | null>(null);

  // Check if user is authenticated
  if (!user || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Prihlásenie potrebné</CardTitle>
            <CardDescription>
              Pre vytvorenie závetu sa musíte prihlásiť do svojho účtu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/login')} className="w-full">
              Prihlásiť sa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleWillComplete = async (willData: WillFormData, generatedWill: string) => {
    setIsGeneratingPDF(true);
    setGenerationError(null);

    try {
      console.log('📄 Starting PDF generation for user:', user.email);

      // Get the access token
      const token = session.access_token;

      // Determine template ID based on will data
      const templateId = determineTemplateId(willData);

      // Call PDF generation API
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_type: 'will',
          template_id: templateId,
          will_data: willData,
          content: generatedWill
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Get PDF filename from headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename="([^"]+)"/)?.[1] || 'will.pdf';

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setLastGeneratedFilename(filename);
      setGenerationComplete(true);

      console.log('✅ PDF generated and downloaded successfully:', filename);

    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      setGenerationError(error instanceof Error ? error.message : 'Neočakávaná chyba');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const determineTemplateId = (willData: WillFormData): string => {
    const jurisdiction = willData.jurisdiction?.toLowerCase() || 'sk';

    if (willData.maritalStatus === 'married' && willData.hasChildren) {
      return `married_with_children_${jurisdiction}`;
    }

    return `simple_single_${jurisdiction}`;
  };

  if (generationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Závet úspešne vytvorený
            </CardTitle>
            <CardDescription>
              Váš závet bol vygenerovaný a stiahnutý do počítača.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastGeneratedFilename && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>Súbor:</strong> {lastGeneratedFilename}
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Dôležité:</strong> Nezabudnite závet vytlačiť, podpísať vlastnoručne a nechať úradne overiť podľa zákonov vašej krajiny.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button onClick={() => router.push('/vault')} className="flex-1">
                Späť do trezoru
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setGenerationComplete(false);
                  setLastGeneratedFilename(null);
                }}
              >
                Vytvoriť nový závet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isGeneratingPDF) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <div>
                <h3 className="font-semibold">Generujem PDF závet</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Prosím počkajte, vytvárám váš závet v PDF formáte...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-blue-600" />
                Sprievodca poslednou vôľou
              </h1>
              <p className="text-gray-600 mt-2">
                Vytvorte si právne platný závet s pomocou našeho inteligentného sprievodcu
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/vault')}
            >
              Späť do trezoru
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {generationError && (
        <div className="max-w-4xl mx-auto p-4">
          <Alert className="border-red-500">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Chyba pri generovaní PDF:</strong> {generationError}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <WillGeneratorWizard
          onComplete={handleWillComplete}
          className="bg-white rounded-lg shadow-sm"
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Sparkles className="h-4 w-4" />
              <span>Poháňané inteligentnou AI asistentkou Sofia</span>
            </div>
            <p className="text-xs text-gray-500 max-w-2xl mx-auto">
              Tento nástroj vytvára závet na základe vašich údajov a vybranej jurisdikcie.
              Vždy odporúčame konzultáciu s kvalifikovaným právnikom pre overenie súladu s miestnym právom.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}