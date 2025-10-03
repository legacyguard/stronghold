'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Star,
  Send,
  Bug,
  Lightbulb,
  MessageCircle,
  Gauge,
  Eye,
  X,
  CheckCircle
} from 'lucide-react';
import { FeedbackManager, FeedbackType } from '@/lib/feedback/feedback-manager';

interface FeedbackWidgetProps {
  trigger?: React.ReactNode;
  defaultType?: FeedbackType;
  page?: string;
}

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  readonly?: boolean;
}

function StarRating({ rating, onRatingChange, readonly = false }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onRatingChange(star)}
          className={`text-xl ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
          disabled={readonly}
        >
          <Star className={`w-5 h-5 ${star <= rating ? 'fill-current' : ''}`} />
        </button>
      ))}
    </div>
  );
}

export function FeedbackWidget({ trigger, defaultType = 'general', page }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    type: defaultType,
    subject: '',
    message: '',
    rating: 0,
    email: '',
    includeSystemInfo: true
  });

  const feedbackTypes = [
    { value: 'bug_report', label: 'Bug Report', icon: Bug, color: 'bg-red-100 text-red-800' },
    { value: 'feature_request', label: 'Feature Request', icon: Lightbulb, color: 'bg-blue-100 text-blue-800' },
    { value: 'general', label: 'General Feedback', icon: MessageCircle, color: 'bg-green-100 text-green-800' },
    { value: 'usability', label: 'Usability Issue', icon: Eye, color: 'bg-orange-100 text-orange-800' },
    { value: 'performance', label: 'Performance Issue', icon: Gauge, color: 'bg-purple-100 text-purple-800' }
  ];

  const selectedType = feedbackTypes.find(type => type.value === formData.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await FeedbackManager.submitFeedback({
        type: formData.type as FeedbackType,
        subject: formData.subject,
        message: formData.message,
        rating: formData.rating || undefined,
        email: formData.email || undefined,
        includeSystemInfo: formData.includeSystemInfo,
        metadata: {
          page: page || window.location.pathname,
          widget_version: '1.0'
        }
      });

      if (result.success) {
        setIsSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setIsSubmitted(false);
          setFormData({
            type: defaultType,
            subject: '',
            message: '',
            rating: 0,
            email: '',
            includeSystemInfo: true
          });
        }, 2000);
      } else {
        alert(`Failed to submit feedback: ${result.error}`);
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      alert('An unexpected error occurred while submitting feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.subject.trim() && formData.message.trim();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            Feedback
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Thank you!</h3>
            <p className="text-gray-600">Your feedback has been submitted successfully.</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedType && <selectedType.icon className="w-5 h-5" />}
                Share Your Feedback
              </DialogTitle>
              <DialogDescription>
                Help us improve your experience with Stronghold
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Feedback Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Feedback Type</Label>
                <Select value={formData.type} onValueChange={(value: string) => setFormData({ ...formData, type: value as FeedbackType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {feedbackTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedType && (
                  <Badge className={selectedType.color}>
                    {selectedType.label}
                  </Badge>
                )}
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your feedback"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Please provide detailed information..."
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500">
                  {formData.type === 'bug_report' && 'Please include steps to reproduce the issue.'}
                  {formData.type === 'feature_request' && 'Describe the feature and how it would help you.'}
                  {formData.type === 'performance' && 'Please describe the performance issue you experienced.'}
                </p>
              </div>

              {/* Rating (optional) */}
              <div className="space-y-2">
                <Label>Overall Experience (optional)</Label>
                <div className="flex items-center gap-2">
                  <StarRating
                    rating={formData.rating}
                    onRatingChange={(rating) => setFormData({ ...formData, rating })}
                  />
                  {formData.rating > 0 && (
                    <span className="text-sm text-gray-600">({formData.rating}/5)</span>
                  )}
                </div>
              </div>

              {/* Email (optional) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  We'll only use this to follow up on your feedback if needed.
                </p>
              </div>

              {/* System Info */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="systemInfo" className="text-sm">Include system information</Label>
                  <p className="text-xs text-gray-500">
                    Helps us diagnose technical issues
                  </p>
                </div>
                <Switch
                  id="systemInfo"
                  checked={formData.includeSystemInfo}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, includeSystemInfo: checked })}
                />
              </div>

              {/* Submit */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Quick feedback buttons for specific scenarios
export function QuickBugReport({ trigger }: { trigger?: React.ReactNode }) {
  return (
    <FeedbackWidget
      trigger={trigger || (
        <Button variant="destructive" size="sm">
          <Bug className="w-4 h-4 mr-2" />
          Report Bug
        </Button>
      )}
      defaultType="bug_report"
    />
  );
}

export function QuickFeatureRequest({ trigger }: { trigger?: React.ReactNode }) {
  return (
    <FeedbackWidget
      trigger={trigger || (
        <Button variant="outline" size="sm">
          <Lightbulb className="w-4 h-4 mr-2" />
          Request Feature
        </Button>
      )}
      defaultType="feature_request"
    />
  );
}

// Floating feedback button
export function FloatingFeedbackButton() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <FeedbackWidget
        trigger={
          <Button size="lg" className="rounded-full shadow-lg">
            <MessageSquare className="w-5 h-5" />
            <span className="sr-only">Feedback</span>
          </Button>
        }
      />
    </div>
  );
}

// Inline feedback for specific features
export function InlineFeedback({ feature, className }: { feature: string; className?: string }) {
  return (
    <div className={`text-center ${className}`}>
      <p className="text-sm text-gray-600 mb-2">How was your experience with {feature}?</p>
      <FeedbackWidget
        trigger={
          <Button variant="outline" size="sm">
            Share feedback
          </Button>
        }
        defaultType="usability"
      />
    </div>
  );
}