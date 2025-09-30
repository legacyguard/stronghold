"use client";

import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, Loader2, Sparkles, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveDocumentWithAI } from '@/app/actions/documents';
import AIAnalysisConfirmation, { ConfirmedAnalysisData } from './AIAnalysisConfirmation';
import toast from 'react-hot-toast';
import { useNamespace } from '@/contexts/LocalizationContext';

interface AnalysisResult {
  category: string;
  confidence: number;
  metadata: {
    documentType: string;
    expirationDate?: string;
    contractNumber?: string;
    amount?: string;
    issuer?: string;
    keyDates?: string[];
    importantNumbers?: string[];
  };
  suggestions: Array<{
    type: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  description: string;
}

const AIDocumentUploader: React.FC = () => {
  const { t } = useNamespace('vault');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    // Reset previous analysis when new file is selected
    setAnalysisResult(null);
    setShowConfirmation(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const files = event.dataTransfer.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
      setAnalysisResult(null);
      setShowConfirmation(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const analyzeDocument = async () => {
    if (!selectedFile) {
      toast.error('Vyberte súbor na analýzu');
      return;
    }

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data) {
        setAnalysisResult(result.data);
        setExtractedText(result.data.extractedText || '');
        setShowConfirmation(true);
        toast.success('Dokument úspešne analyzovaný!');
      } else {
        toast.error(result.message || 'Analýza dokumentu zlyhala');
        console.error('Analysis failed:', result);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Nastala chyba pri analýze dokumentu');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAnalysis = async (confirmedData: ConfirmedAnalysisData) => {
    if (!selectedFile) return;

    setIsSaving(true);

    try {
      const aiAnalysisData = {
        category: confirmedData.category,
        confidence: analysisResult?.confidence || 0,
        metadata: confirmedData.metadata,
        suggestions: analysisResult?.suggestions || [],
        description: confirmedData.description,
        extractedText: extractedText
      };

      const result = await saveDocumentWithAI(selectedFile, aiAnalysisData);

      if (result.success) {
        toast.success('Dokument bol úspešne uložený!');

        // Reset form
        setSelectedFile(null);
        setAnalysisResult(null);
        setShowConfirmation(false);
        setExtractedText('');
        formRef.current?.reset();

        // Trigger document list refresh
        window.dispatchEvent(new CustomEvent('document-uploaded'));
      } else {
        toast.error(result.message || 'Uloženie dokumentu zlyhalo');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Nastala chyba pri ukladaní dokumentu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAnalysis = () => {
    setShowConfirmation(false);
    setAnalysisResult(null);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setShowConfirmation(false);
    const fileInput = document.getElementById('ai-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isFileSupported = (file: File) => {
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'text/plain', 'application/pdf'];
    return supportedTypes.includes(file.type);
  };

  return (
    <>
      <form ref={formRef} className="max-w-lg mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-sm">
              <div className="p-xs bg-primary/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-h3 text-text-dark font-semibold">
                  Inteligentný Organizátor Dokumentov
                </h3>
                <p className="text-caption text-text-light">
                  AI analyzuje a automaticky kategorizuje váš dokument
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-lg space-y-lg">
            {/* Drop Zone */}
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-lg text-center transition-all duration-300
                ${dragActive || selectedFile
                  ? 'border-primary bg-primary/5'
                  : 'border-border/30 hover:border-primary/50 hover:bg-neutral-beige/30'
                }
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Input
                id="ai-file-input"
                name="file"
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.txt,.jpg,.jpeg,.png"
              />

              {!selectedFile ? (
                <div className="space-y-sm">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-body font-medium text-text-dark">
                      Pretiahnite dokument sem alebo kliknite pre výber
                    </p>
                    <p className="text-caption text-text-light mt-xs">
                      AI automaticky rozpozná typ a extrahuje informácie
                    </p>
                  </div>
                  <p className="text-caption text-text-light">
                    Podporované: PDF, TXT, JPG, PNG (max 10MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-sm">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-body font-medium text-text-dark">Súbor pripravený na analýzu</p>
                    <p className="text-caption text-text-light">
                      {isFileSupported(selectedFile)
                        ? 'Kliknite "Analyzovať" pre spustenie AI analýzy'
                        : 'Tento typ súboru nie je podporovaný pre AI analýzu'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Selected File Info */}
            {selectedFile && (
              <div className="bg-neutral-beige/50 rounded-lg p-md border border-border/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm flex-1 min-w-0">
                    <div className="p-xs bg-primary/10 rounded">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-text-dark truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-caption text-text-light">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-xs rounded-lg hover:bg-neutral-light/20 transition-colors"
                  >
                    <X className="h-4 w-4 text-text-light hover:text-text-dark" />
                  </button>
                </div>
              </div>
            )}

            {/* Analysis Results Preview */}
            {analysisResult && (
              <div className="bg-primary/5 rounded-lg p-md border border-primary/20">
                <div className="flex items-center gap-sm mb-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-body font-medium text-text-dark">AI Analýza dokončená</span>
                </div>
                <div className="text-caption text-text-light space-y-xs">
                  <p>• Kategória: <span className="font-medium">{analysisResult.category}</span></p>
                  <p>• Typ: <span className="font-medium">{analysisResult.metadata.documentType}</span></p>
                  <p>• Dôvera: <span className="font-medium">{Math.round(analysisResult.confidence * 100)}%</span></p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-sm">
              {!analysisResult ? (
                <Button
                  type="button"
                  onClick={analyzeDocument}
                  disabled={!selectedFile || !isFileSupported(selectedFile!) || isAnalyzing}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzuje AI...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Analyzovať s AI
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAnalysisResult(null);
                      setExtractedText('');
                    }}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    Opätovne analyzovať
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowConfirmation(true)}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    Skontrolovať a uložiť
                  </Button>
                </>
              )}
            </div>
          </CardContent>

          <CardFooter className="bg-primary/5 border-t border-primary/10">
            <div className="w-full">
              <div className="flex items-start gap-sm">
                <div className="p-xs bg-primary/10 rounded mt-xs">
                  <Sparkles className="h-3 w-3 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-caption font-medium text-text-dark mb-xs">
                    AI Funkcie
                  </p>
                  <ul className="text-caption text-text-light space-y-xs">
                    <li>• Automatická kategorizácia dokumentov</li>
                    <li>• Extrakcia dôležitých dátumov a čísel</li>
                    <li>• Nastavenie pripomienok exspirácie</li>
                    <li>• Inteligentné návrhy na organizáciu</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </form>

      {/* AI Analysis Confirmation Modal */}
      {showConfirmation && analysisResult && selectedFile && (
        <AIAnalysisConfirmation
          analysisResult={analysisResult}
          fileName={selectedFile.name}
          onConfirm={handleConfirmAnalysis}
          onCancel={handleCancelAnalysis}
          isLoading={isSaving}
        />
      )}
    </>
  );
};

export default AIDocumentUploader;