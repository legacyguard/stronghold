'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SupportAIManager } from '@/lib/support/support-ai-manager';
import { createClient } from '@/lib/supabase';
import {
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Upload,
  X,
  Zap,
  Clock,
  Users,
  CreditCard
} from 'lucide-react';

export interface SupportTicketFormProps {
  onTicketCreated?: (ticketId: string) => void;
  onCancel?: () => void;
  initialCategory?: string;
  initialContext?: Record<string, any>;
  conversationId?: string;
}

interface TicketFormData {
  title: string;
  description: string;
  category: 'technical' | 'legal' | 'billing' | 'feature_request';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  context: Record<string, any>;
}

interface AIRecommendation {
  suggested_category: string;
  suggested_priority: string;
  escalation_reason: string;
  confidence: number;
  quick_fixes: string[];
}

export const SupportTicketForm: React.FC<SupportTicketFormProps> = ({
  onTicketCreated,
  onCancel,
  initialCategory,
  initialContext = {},
  conversationId
}) => {
  const [formData, setFormData] = useState<TicketFormData>({
    title: '',
    description: '',
    category: (initialCategory as any) || 'technical',
    priority: 'medium',
    context: initialContext
  });

  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showQuickFixes, setShowQuickFixes] = useState(false);

  const supportAI = new SupportAIManager();
  const supabase = createClient();

  // AI Analysis when description changes
  useEffect(() => {
    const analyzeTicket = async () => {
      if (formData.description.length > 50) {
        setIsAnalyzing(true);
        try {
          const analysis = await supportAI.analyzeTicketIntent(
            formData.title,
            formData.description,
            formData.context
          );
          setAiRecommendation(analysis);

          // Auto-update category and priority if confidence is high
          if (analysis.confidence > 0.8) {
            setFormData(prev => ({
              ...prev,
              category: analysis.suggested_category as any,
              priority: analysis.suggested_priority as any
            }));
          }
        } catch (err) {
          console.error('Failed to analyze ticket:', err);
        } finally {
          setIsAnalyzing(false);
        }
      }
    };

    const debounceTimer = setTimeout(analyzeTicket, 1000);
    return () => clearTimeout(debounceTimer);
  }, [formData.description, formData.title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Názov a popis sú povinné');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Používateľ nie je prihlásený');
      }

      // Create support ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          sentiment_score: aiRecommendation?.confidence || 0.5,
          complexity_score: formData.description.length > 500 ? 0.8 : 0.4,
          escalated_reason: aiRecommendation?.escalation_reason,
          tags: aiRecommendation?.quick_fixes || [],
          internal_notes: JSON.stringify({
            ai_analysis: aiRecommendation,
            context: formData.context,
            conversation_id: conversationId
          })
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create initial interaction
      await supabase
        .from('support_interactions')
        .insert({
          ticket_id: ticket.id,
          conversation_id: conversationId,
          message_type: 'user',
          content: formData.description,
          confidence_score: 1.0,
          knowledge_source: 'user_input'
        });

      // Update user support health
      await supabase
        .from('user_support_health')
        .upsert({
          user_id: user.id,
          tickets_created: 1, // Will be incremented by trigger
          last_positive_interaction: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      onTicketCreated?.(ticket.id);
    } catch (err) {
      console.error('Failed to create ticket:', err);
      setError(err instanceof Error ? err.message : 'Chyba pri vytváraní ticketu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles].slice(0, 5)); // Max 5 files
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <Zap className="w-4 h-4" />;
      case 'legal': return <Users className="w-4 h-4" />;
      case 'billing': return <CreditCard className="w-4 h-4" />;
      case 'feature_request': return <MessageSquare className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Vytvorenie support ticketu
        </CardTitle>
        <CardDescription>
          Sofia AI vám nemohla pomôcť? Vytvorte ticket pre ľudský support tím.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AI Quick Fixes */}
          {aiRecommendation?.quick_fixes && aiRecommendation.quick_fixes.length > 0 && (
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Sofia AI našla možné riešenia na váš problém</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuickFixes(!showQuickFixes)}
                  >
                    {showQuickFixes ? 'Skryť' : 'Zobraziť'}
                  </Button>
                </div>
                {showQuickFixes && (
                  <div className="mt-3 space-y-2">
                    {aiRecommendation.quick_fixes.map((fix, index) => (
                      <div key={index} className="p-2 bg-background rounded text-sm">
                        {fix}
                      </div>
                    ))}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Názov problému *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Stručne popíšte váš problém..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Detailný popis *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Popíšte čo sa stalo, čo ste očakávali, aké kroky ste vykonali..."
              className="min-h-[120px]"
              required
            />
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 animate-spin" />
                Sofia AI analyzuje váš problém...
              </div>
            )}
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategória</Label>
              <Select
                value={formData.category}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, category: value as TicketFormData['category'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Technický problém
                    </div>
                  </SelectItem>
                  <SelectItem value="legal">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Právne otázky
                    </div>
                  </SelectItem>
                  <SelectItem value="billing">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Billing a platby
                    </div>
                  </SelectItem>
                  <SelectItem value="feature_request">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Nová funkcia
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priorita</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, priority: value as TicketFormData['priority'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Nízka</SelectItem>
                  <SelectItem value="medium">Stredná</SelectItem>
                  <SelectItem value="high">Vysoká</SelectItem>
                  <SelectItem value="urgent">Urgentná</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI Recommendations */}
          {aiRecommendation && (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Sofia AI odporúčania:</div>
                  <div className="flex items-center gap-2">
                    <span>Kategória:</span>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getCategoryIcon(aiRecommendation.suggested_category)}
                      {aiRecommendation.suggested_category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Priorita:</span>
                    <Badge variant={getPriorityColor(aiRecommendation.suggested_priority)}>
                      {aiRecommendation.suggested_priority}
                    </Badge>
                  </div>
                  {aiRecommendation.escalation_reason && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Dôvod eskácie:</strong> {aiRecommendation.escalation_reason}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* File Attachments */}
          <div className="space-y-2">
            <Label htmlFor="attachments">Prílohy (voliteľné)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="attachments"
                type="file"
                multiple
                onChange={handleFileUpload}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('attachments')?.click()}
                disabled={attachments.length >= 5}
              >
                <Upload className="w-4 h-4 mr-2" />
                Pridať súbory ({attachments.length}/5)
              </Button>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Váš ticket bude priradený k najvhodnejšiemu agentovi
            </div>
            <div className="flex items-center gap-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Zrušiť
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting || isAnalyzing}>
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Vytváram...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Vytvoriť ticket
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SupportTicketForm;