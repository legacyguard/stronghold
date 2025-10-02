'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase';
import {
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  Lightbulb,
  TrendingUp,
  Shield,
  Clock,
  Users,
  Zap,
  Star,
  ArrowRight
} from 'lucide-react';

export interface ProactiveNotification {
  id: string;
  type: 'onboarding' | 'feature_adoption' | 'health_check' | 'churn_prevention' | 'upgrade_suggestion';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  action_text?: string;
  action_url?: string;
  dismissible: boolean;
  expires_at?: string;
  created_at: string;
}

export interface UserSupportHealth {
  user_id: string;
  onboarding_completion: number;
  feature_adoption_score: number;
  support_sentiment_avg: number;
  tickets_created: number;
  churn_risk_score: number;
  intervention_needed: boolean;
  intervention_type?: string;
  last_positive_interaction?: string;
}

export interface ProactiveNotificationsProps {
  userId?: string;
  position?: 'top' | 'bottom' | 'sidebar';
  maxNotifications?: number;
  showDismissed?: boolean;
}

export const ProactiveNotifications: React.FC<ProactiveNotificationsProps> = ({
  userId,
  position = 'top',
  maxNotifications = 3,
  showDismissed = false
}) => {
  const [notifications, setNotifications] = useState<ProactiveNotification[]>([]);
  const [userHealth, setUserHealth] = useState<UserSupportHealth | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (userId) {
      loadUserSupportHealth();
      generateProactiveNotifications();
    }
  }, [userId]);

  const loadUserSupportHealth = async () => {
    try {
      const { data, error } = await supabase
        .from('user_support_health')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setUserHealth(data);
    } catch (error) {
      console.error('Failed to load user support health:', error);
    }
  };

  const generateProactiveNotifications = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const notifications: ProactiveNotification[] = [];

      // Onboarding completion notifications
      if (userHealth && userHealth.onboarding_completion < 1.0) {
        const completionPercent = Math.round(userHealth.onboarding_completion * 100);
        notifications.push({
          id: 'onboarding_incomplete',
          type: 'onboarding',
          priority: 'medium',
          title: 'Dokončite nastavenie účtu',
          message: `Váš účet je nastavený na ${completionPercent}%. Dokončte zostávajúce kroky pre plný prístup k funkciam.`,
          action_text: 'Dokončiť nastavenie',
          action_url: '/onboarding',
          dismissible: true,
          created_at: new Date().toISOString()
        });
      }

      // Feature adoption suggestions
      if (userHealth && userHealth.feature_adoption_score < 0.5) {
        notifications.push({
          id: 'feature_adoption_low',
          type: 'feature_adoption',
          priority: 'low',
          title: 'Objavte nové funkcie',
          message: 'Využívate len zlomok možností LegacyGuard. Pozrite si našu Feature Gallery.',
          action_text: 'Preskúmať funkcie',
          action_url: '/features',
          dismissible: true,
          created_at: new Date().toISOString()
        });
      }

      // Churn prevention for at-risk users
      if (userHealth && userHealth.churn_risk_score > 0.7) {
        notifications.push({
          id: 'churn_prevention',
          type: 'churn_prevention',
          priority: 'high',
          title: 'Potrebujete pomoc?',
          message: 'Všimli sme si, že možno máte problém s používaním platformy. Náš tím vám rád pomôže.',
          action_text: 'Kontaktovať podporu',
          action_url: '/support',
          dismissible: false,
          created_at: new Date().toISOString()
        });
      }

      // Subscription upgrade suggestions
      if (profile.subscription_tier === 'free' && userHealth && userHealth.feature_adoption_score > 0.6) {
        notifications.push({
          id: 'upgrade_suggestion',
          type: 'upgrade_suggestion',
          priority: 'medium',
          title: 'Pripravený na viac?',
          message: 'Aktívne využívate naše funkcie! Premium vám odomkne neobmedzené možnosti.',
          action_text: 'Zobraziť plány',
          action_url: '/pricing',
          dismissible: true,
          created_at: new Date().toISOString()
        });
      }

      // Health check notifications
      if (userHealth && userHealth.support_sentiment_avg < 0.4) {
        notifications.push({
          id: 'health_check_negative',
          type: 'health_check',
          priority: 'high',
          title: 'Vaša spokojnosť je dôležitá',
          message: 'Chceli by sme zlepšiť vašu skúsenosť. Povedzte nám, čo môžeme urobiť lepšie.',
          action_text: 'Poskytnúť feedback',
          action_url: '/feedback',
          dismissible: true,
          created_at: new Date().toISOString()
        });
      }

      // Recent feature announcements (example)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (profile.created_at && new Date(profile.created_at) < weekAgo) {
        notifications.push({
          id: 'new_features',
          type: 'feature_adoption',
          priority: 'low',
          title: 'Nové funkcie v Sofia AI',
          message: 'Sofia AI teraz rozumie slovenčine ešte lepšie a má nové možnosti pre právne poradenstvo.',
          action_text: 'Zistiť viac',
          action_url: '/features/sofia-ai',
          dismissible: true,
          created_at: new Date().toISOString()
        });
      }

      setNotifications(notifications.slice(0, maxNotifications));
    } catch (error) {
      console.error('Failed to generate proactive notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    setDismissedIds(prev => new Set([...prev, notificationId]));

    // Track dismissal for analytics
    try {
      await supabase
        .from('support_interactions')
        .insert({
          ticket_id: null,
          message_type: 'system',
          content: `Proactive notification dismissed: ${notificationId}`,
          confidence_score: 1.0,
          knowledge_source: 'rule_based'
        });
    } catch (error) {
      console.error('Failed to track notification dismissal:', error);
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case 'onboarding':
        return <CheckCircle className="w-4 h-4" />;
      case 'feature_adoption':
        return <Lightbulb className="w-4 h-4" />;
      case 'health_check':
        return <Shield className="w-4 h-4" />;
      case 'churn_prevention':
        return <AlertTriangle className="w-4 h-4" />;
      case 'upgrade_suggestion':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return priority === 'high' || priority === 'urgent'
          ? <AlertTriangle className="w-4 h-4" />
          : <Info className="w-4 h-4" />;
    }
  };

  const getNotificationVariant = (priority: string): 'default' | 'destructive' => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'destructive';
      case 'medium':
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  const visibleNotifications = notifications.filter(notification =>
    showDismissed || !dismissedIds.has(notification.id)
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (visibleNotifications.length === 0) {
    return null;
  }

  const NotificationCard = ({ notification }: { notification: ProactiveNotification }) => (
    <Alert key={notification.id} variant={getNotificationVariant(notification.priority)}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={getPriorityColor(notification.priority)}>
            {getNotificationIcon(notification.type, notification.priority)}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{notification.title}</span>
              <Badge variant="outline" className="text-xs">
                {notification.priority}
              </Badge>
            </div>
            <AlertDescription className="text-sm">
              {notification.message}
            </AlertDescription>
            {notification.action_text && notification.action_url && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = notification.action_url!}
                  className="h-8"
                >
                  {notification.action_text}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
        {notification.dismissible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dismissNotification(notification.id)}
            className="h-6 w-6 p-0 hover:bg-muted"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </Alert>
  );

  // Sidebar layout
  if (position === 'sidebar') {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="w-4 h-4" />
            Odporúčania
          </CardTitle>
          <CardDescription className="text-xs">
            Personalizované tipy pre lepšiu skúsenosť
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleNotifications.map(notification => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Top/bottom layout
  return (
    <div className={`space-y-3 ${position === 'bottom' ? 'mt-6' : 'mb-6'}`}>
      {visibleNotifications.map(notification => (
        <NotificationCard key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

// Hook for using proactive notifications
export const useProactiveNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<ProactiveNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (userId) {
      generateNotifications();
    }
  }, [userId]);

  const generateNotifications = async () => {
    // This would implement the same logic as in ProactiveNotifications component
    // but return data instead of rendering
    setIsLoading(false);
  };

  const dismissNotification = async (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );

    try {
      await supabase
        .from('support_interactions')
        .insert({
          ticket_id: null,
          message_type: 'system',
          content: `Proactive notification dismissed: ${notificationId}`,
          confidence_score: 1.0,
          knowledge_source: 'rule_based'
        });
    } catch (error) {
      console.error('Failed to track notification dismissal:', error);
    }
  };

  return {
    notifications,
    isLoading,
    dismissNotification
  };
};

export default ProactiveNotifications;