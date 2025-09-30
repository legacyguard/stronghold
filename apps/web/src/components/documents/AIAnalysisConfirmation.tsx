"use client";

import React, { useState } from 'react';
import {
  CheckCircle,
  Edit2,
  FileText,
  Calendar,
  DollarSign,
  Building,
  Hash,
  AlertTriangle,
  Sparkles,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useNamespace } from '@/contexts/LocalizationContext';

interface AIMetadata {
  documentType: string;
  expirationDate?: string;
  contractNumber?: string;
  amount?: string;
  issuer?: string;
  keyDates?: string[];
  importantNumbers?: string[];
}

interface AISuggestion {
  type: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface AnalysisResult {
  category: string;
  confidence: number;
  metadata: AIMetadata;
  suggestions: AISuggestion[];
  description: string;
}

interface Props {
  analysisResult: AnalysisResult;
  fileName: string;
  onConfirm: (confirmedData: ConfirmedAnalysisData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface ConfirmedAnalysisData {
  category: string;
  metadata: AIMetadata;
  description: string;
  extractedText?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'Insurance': 'Poistenie',
  'Banking': 'Bankovníctvo',
  'Legal': 'Právne',
  'Medical': 'Zdravotné',
  'Property': 'Nehnuteľnosti',
  'Vehicles': 'Vozidlá',
  'Education': 'Vzdelanie',
  'Personal': 'Osobné',
  'Business': 'Podnikanie',
  'Other': 'Ostatné'
};

const PRIORITY_COLORS: Record<string, string> = {
  'high': 'bg-red-100 text-red-800 border-red-200',
  'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'low': 'bg-blue-100 text-blue-800 border-blue-200'
};

const AIAnalysisConfirmation: React.FC<Props> = ({
  analysisResult,
  fileName,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  const { t } = useNamespace('vault');

  const [editableData, setEditableData] = useState<ConfirmedAnalysisData>({
    category: analysisResult.category,
    metadata: { ...analysisResult.metadata },
    description: analysisResult.description
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleConfirm = () => {
    onConfirm(editableData);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'Vysoká dôvera';
    if (confidence >= 0.6) return 'Stredná dôvera';
    return 'Nízka dôvera';
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('sk-SK');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-md z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-sm">
              <div className="p-xs bg-primary/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-h3 font-semibold text-text-dark">
                  AI Analýza Dokumentu
                </h3>
                <p className="text-caption text-text-light">
                  Skontrolujte a potvrďte výsledky analýzy
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-text-light hover:text-text-dark"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-lg space-y-lg">
          {/* File Info */}
          <div className="flex items-center gap-sm p-md bg-neutral-beige/50 rounded-lg">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-medium text-text-dark">{fileName}</span>
          </div>

          {/* AI Confidence */}
          <div className="flex items-center justify-between p-md bg-surface rounded-lg border">
            <div className="flex items-center gap-sm">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-body font-medium">AI Dôvera:</span>
            </div>
            <div className="flex items-center gap-sm">
              <span className={`font-semibold ${getConfidenceColor(analysisResult.confidence)}`}>
                {Math.round(analysisResult.confidence * 100)}%
              </span>
              <Badge variant="outline" className="text-xs">
                {getConfidenceLabel(analysisResult.confidence)}
              </Badge>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-sm">
            <Label className="text-body font-medium">Kategória dokumentu</Label>
            {isEditing ? (
              <select
                className="w-full p-sm rounded-lg border border-border bg-white"
                value={editableData.category}
                onChange={(e) => setEditableData({...editableData, category: e.target.value})}
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-sm">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {CATEGORY_LABELS[editableData.category] || editableData.category}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-text-light hover:text-primary"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-md">
            <Label className="text-body font-medium">Extrahované informácie</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">

              {/* Document Type */}
              <div className="space-y-xs">
                <Label className="text-caption text-text-light">Typ dokumentu</Label>
                {isEditing ? (
                  <Input
                    value={editableData.metadata.documentType || ''}
                    onChange={(e) => setEditableData({
                      ...editableData,
                      metadata: {...editableData.metadata, documentType: e.target.value}
                    })}
                  />
                ) : (
                  <div className="flex items-center gap-xs text-body">
                    <FileText className="h-3 w-3 text-text-light" />
                    {editableData.metadata.documentType || 'Neznámy'}
                  </div>
                )}
              </div>

              {/* Expiration Date */}
              {editableData.metadata.expirationDate && (
                <div className="space-y-xs">
                  <Label className="text-caption text-text-light">Dátum exspirácie</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editableData.metadata.expirationDate || ''}
                      onChange={(e) => setEditableData({
                        ...editableData,
                        metadata: {...editableData.metadata, expirationDate: e.target.value}
                      })}
                    />
                  ) : (
                    <div className="flex items-center gap-xs text-body">
                      <Calendar className="h-3 w-3 text-text-light" />
                      {formatDate(editableData.metadata.expirationDate)}
                    </div>
                  )}
                </div>
              )}

              {/* Amount */}
              {editableData.metadata.amount && (
                <div className="space-y-xs">
                  <Label className="text-caption text-text-light">Suma</Label>
                  {isEditing ? (
                    <Input
                      value={editableData.metadata.amount || ''}
                      onChange={(e) => setEditableData({
                        ...editableData,
                        metadata: {...editableData.metadata, amount: e.target.value}
                      })}
                    />
                  ) : (
                    <div className="flex items-center gap-xs text-body">
                      <DollarSign className="h-3 w-3 text-text-light" />
                      {editableData.metadata.amount}
                    </div>
                  )}
                </div>
              )}

              {/* Issuer */}
              {editableData.metadata.issuer && (
                <div className="space-y-xs">
                  <Label className="text-caption text-text-light">Vydavateľ</Label>
                  {isEditing ? (
                    <Input
                      value={editableData.metadata.issuer || ''}
                      onChange={(e) => setEditableData({
                        ...editableData,
                        metadata: {...editableData.metadata, issuer: e.target.value}
                      })}
                    />
                  ) : (
                    <div className="flex items-center gap-xs text-body">
                      <Building className="h-3 w-3 text-text-light" />
                      {editableData.metadata.issuer}
                    </div>
                  )}
                </div>
              )}

              {/* Contract Number */}
              {editableData.metadata.contractNumber && (
                <div className="space-y-xs">
                  <Label className="text-caption text-text-light">Číslo zmluvy</Label>
                  {isEditing ? (
                    <Input
                      value={editableData.metadata.contractNumber || ''}
                      onChange={(e) => setEditableData({
                        ...editableData,
                        metadata: {...editableData.metadata, contractNumber: e.target.value}
                      })}
                    />
                  ) : (
                    <div className="flex items-center gap-xs text-body">
                      <Hash className="h-3 w-3 text-text-light" />
                      {editableData.metadata.contractNumber}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-sm">
            <Label className="text-body font-medium">Popis</Label>
            {isEditing ? (
              <Textarea
                value={editableData.description}
                onChange={(e) => setEditableData({...editableData, description: e.target.value})}
                rows={3}
                className="resize-none"
              />
            ) : (
              <p className="text-body text-text-dark bg-neutral-beige/30 p-md rounded-lg">
                {editableData.description}
              </p>
            )}
          </div>

          {/* AI Suggestions */}
          {analysisResult.suggestions.length > 0 && (
            <div className="space-y-sm">
              <Label className="text-body font-medium">AI Odporúčania</Label>
              <div className="space-y-xs">
                {analysisResult.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-sm p-sm rounded-lg border ${
                      suggestion.priority === 'high' ? 'bg-red-50 border-red-200' :
                      suggestion.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <AlertTriangle className={`h-4 w-4 mt-xs ${
                      suggestion.priority === 'high' ? 'text-red-600' :
                      suggestion.priority === 'medium' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    <div className="flex-1">
                      <p className="text-caption font-medium">
                        {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
                      </p>
                      <p className="text-caption text-text-light">
                        {suggestion.description}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${PRIORITY_COLORS[suggestion.priority]}`}
                    >
                      {suggestion.priority === 'high' ? 'Vysoká' :
                       suggestion.priority === 'medium' ? 'Stredná' : 'Nízka'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-neutral-beige/30 border-t flex gap-sm justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Zrušiť
          </Button>
          {isEditing ? (
            <Button
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
            >
              Uložiť zmeny
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? 'Ukladá sa...' : 'Potvrdiť a uložiť'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AIAnalysisConfirmation;