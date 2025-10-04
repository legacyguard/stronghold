'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Star,
  Send,
  ThumbsUp,
  ThumbsDown,
  X,
  ChevronDown,
  ChevronUp,
  Heart,
  Lightbulb,
  Bug,
  HelpCircle
} from 'lucide-react';
import { UserFeedbackCollector } from '@/lib/research/user-feedback-collector';
import { BehaviorTracker } from '@/lib/monitoring/behavior-tracker';

interface FeedbackWidgetProps {
  userId?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark';
  customTrigger?: React.ReactNode;
}

interface QuickFeedback {
  type: 'quick_rating' | 'quick_sentiment';
  value: number | 'positive' | 'negative';
  context?: string;
}

export function FeedbackWidget({
  userId,
  position = 'bottom-right',
  theme = 'light',
  customTrigger
}: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [currentView, setCurrentView] = useState<'trigger' | 'quick' | 'detailed'>('trigger');
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'general' | 'usability' | 'feature_request' | 'bug_report' | 'satisfaction'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showQuickFeedback, setShowQuickFeedback] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  useEffect(() => {
    // Show quick feedback prompt after user has been on page for 30 seconds
    const timer = setTimeout(() => {
      if (!submitted && !isOpen) {
        setShowQuickFeedback(true);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [submitted, isOpen]);

  useEffect(() => {
    // Track widget interactions
    if (isOpen && userId) {
      BehaviorTracker.trackUserAction('feedback_widget_opened', userId, {
        page: window.location.pathname,
        view: currentView
      });
    }
  }, [isOpen, currentView, userId]);

  const handleQuickFeedback = async (type: 'positive' | 'negative') => {
    if (!userId) return;

    try {
      await UserFeedbackCollector.submitFeedback(userId, {
        rating: type === 'positive' ? 5 : 2,
        feedback: `Quick feedback: ${type}`,
        feedback_type: 'satisfaction',
        page_url: window.location.pathname,
        feature_context: 'quick_feedback_widget'
      });

      setSubmitted(true);
      setShowQuickFeedback(false);

      // Track quick feedback
      BehaviorTracker.trackUserAction('quick_feedback_submitted', userId, {
        sentiment: type,
        page: window.location.pathname
      });
    } catch (error) {
      console.error('Failed to submit quick feedback:', error);
    }
  };

  const handleDetailedSubmit = async () => {
    if (!userId || !rating || !feedback.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await UserFeedbackCollector.submitFeedback(userId, {
        rating,
        feedback: feedback.trim(),
        feedback_type: feedbackType,
        page_url: window.location.pathname,
        feature_context: window.location.pathname
      });

      if (result.success) {
        setSubmitted(true);
        setIsOpen(false);
        setCurrentView('trigger');
        setRating(0);
        setFeedback('');
        setFeedbackType('general');

        // Track detailed feedback submission
        BehaviorTracker.trackUserAction('detailed_feedback_submitted', userId, {
          rating,
          feedback_type: feedbackType,
          page: window.location.pathname,
          feedback_length: feedback.length
        });
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'satisfaction': return <Heart className="w-4 h-4" />;
      case 'feature_request': return <Lightbulb className="w-4 h-4" />;
      case 'bug_report': return <Bug className="w-4 h-4" />;
      case 'usability': return <HelpCircle className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getFeedbackTypeLabel = (type: string) => {
    switch (type) {
      case 'satisfaction': return 'Spokojnosť';
      case 'feature_request': return 'Návrh funkcie';
      case 'bug_report': return 'Nahlásenie chyby';
      case 'usability': return 'Použiteľnosť';
      default: return 'Všeobecné';
    }
  };

  if (submitted) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <Card className="w-80 shadow-lg border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ThumbsUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Ďakujeme za váš feedback!
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSubmitted(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quick feedback prompt
  if (showQuickFeedback && !isOpen) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <Card className="w-80 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Ako sa vám páči táto stránka?</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickFeedback(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFeedback('positive')}
                className="flex-1"
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                Páči sa
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFeedback('negative')}
                className="flex-1"
              >
                <ThumbsDown className="w-4 h-4 mr-1" />
                Nepáči sa
              </Button>
            </div>
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setShowQuickFeedback(false);
                setIsOpen(true);
                setCurrentView('detailed');
              }}
              className="w-full mt-2 text-xs"
            >
              Napísať podrobný feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (customTrigger) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {customTrigger}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <FeedbackForm
            rating={rating}
            setRating={setRating}
            feedback={feedback}
            setFeedback={setFeedback}
            feedbackType={feedbackType}
            setFeedbackType={setFeedbackType}
            isSubmitting={isSubmitting}
            onSubmit={handleDetailedSubmit}
            getFeedbackTypeIcon={getFeedbackTypeIcon}
            getFeedbackTypeLabel={getFeedbackTypeLabel}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Default floating widget
  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary-dark"
          size="lg"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      ) : (
        <Card className="w-80 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Feedback</CardTitle>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-6 w-6 p-0"
                >
                  {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent>
              <FeedbackForm
                rating={rating}
                setRating={setRating}
                feedback={feedback}
                setFeedback={setFeedback}
                feedbackType={feedbackType}
                setFeedbackType={setFeedbackType}
                isSubmitting={isSubmitting}
                onSubmit={handleDetailedSubmit}
                getFeedbackTypeIcon={getFeedbackTypeIcon}
                getFeedbackTypeLabel={getFeedbackTypeLabel}
              />
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

interface FeedbackFormProps {
  rating: number;
  setRating: (rating: number) => void;
  feedback: string;
  setFeedback: (feedback: string) => void;
  feedbackType: string;
  setFeedbackType: (type: any) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  getFeedbackTypeIcon: (type: string) => React.ReactNode;
  getFeedbackTypeLabel: (type: string) => string;
}

function FeedbackForm({
  rating,
  setRating,
  feedback,
  setFeedback,
  feedbackType,
  setFeedbackType,
  isSubmitting,
  onSubmit,
  getFeedbackTypeIcon,
  getFeedbackTypeLabel
}: FeedbackFormProps) {
  return (
    <div className="space-y-4">
      {/* Feedback Type Selection */}
      <div>
        <Label className="text-sm font-medium">Typ feedbacku</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {['general', 'satisfaction', 'feature_request', 'bug_report', 'usability'].map((type) => (
            <Button
              key={type}
              variant={feedbackType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFeedbackType(type)}
              className="justify-start"
            >
              {getFeedbackTypeIcon(type)}
              <span className="ml-1 text-xs">{getFeedbackTypeLabel(type)}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <Label className="text-sm font-medium">Hodnotenie</Label>
        <div className="flex space-x-1 mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`p-1 rounded transition-colors ${
                star <= rating
                  ? 'text-yellow-500 hover:text-yellow-600'
                  : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <Star className="w-6 h-6" fill={star <= rating ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            {rating === 1 && 'Veľmi nespokojný'}
            {rating === 2 && 'Nespokojný'}
            {rating === 3 && 'Neutrálny'}
            {rating === 4 && 'Spokojný'}
            {rating === 5 && 'Veľmi spokojný'}
          </div>
        )}
      </div>

      {/* Feedback Text */}
      <div>
        <Label className="text-sm font-medium">Váš komentár</Label>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={
            feedbackType === 'bug_report'
              ? 'Opíšte problém, ktorý ste zaznamenali...'
              : feedbackType === 'feature_request'
              ? 'Akú funkciu by ste chceli vidieť v aplikácii?'
              : 'Čo by sme mohli zlepšiť?'
          }
          className="mt-2 min-h-[80px]"
        />
        <div className="text-xs text-muted-foreground mt-1">
          {feedback.length}/500 znakov
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={onSubmit}
        disabled={!rating || !feedback.trim() || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Odosielam...
          </div>
        ) : (
          <div className="flex items-center">
            <Send className="w-4 h-4 mr-2" />
            Odoslať feedback
          </div>
        )}
      </Button>

      <div className="text-xs text-muted-foreground text-center">
        Váš feedback nám pomáha zlepšovať aplikáciu
      </div>
    </div>
  );
}