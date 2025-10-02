// Support System Components - Phase 6B Intelligence Layer
// Centralized exports for all support-related components

// AI Chat Widget
export { default as SofiaChatWidget } from './SofiaChatWidget';
export type { SofiaChatWidgetProps } from './SofiaChatWidget';

// Help Center
export { default as HelpCenter } from './HelpCenter';
export type { HelpCenterProps } from './HelpCenter';

// Support Ticket Forms
export { SupportTicketForm } from './SupportTicketForm';
export type { SupportTicketFormProps } from './SupportTicketForm';

// Proactive Notifications
export { ProactiveNotifications, useProactiveNotifications } from './ProactiveNotifications';
export type {
  ProactiveNotificationsProps,
  ProactiveNotification
} from './ProactiveNotifications';

// Re-export UserSupportHealth type
export interface UserSupportHealth {
  user_id: string;
  onboarding_completion: number;
  feature_adoption_score: number;
  support_sentiment_avg: number;
  tickets_created: number;
  churn_risk_score: number;
  intervention_needed: boolean;
}

// Support System Types (shared)
export interface SupportSystemContext {
  user_id: string;
  user_tier: 'free' | 'premium' | 'enterprise';
  current_page?: string;
  onboarding_completed: boolean;
  feature_adoption_score: number;
  support_health: UserSupportHealth;
}

export interface SupportComponentConfig {
  enableChatWidget: boolean;
  enableProactiveNotifications: boolean;
  enableHelpCenter: boolean;
  enableTicketCreation: boolean;
  position: 'top' | 'bottom' | 'sidebar' | 'floating';
  maxNotifications: number;
  autoTriggerThreshold: number;
}

// Default configuration for Phase 6B
export const defaultSupportConfig: SupportComponentConfig = {
  enableChatWidget: true,
  enableProactiveNotifications: true,
  enableHelpCenter: true,
  enableTicketCreation: true,
  position: 'floating',
  maxNotifications: 3,
  autoTriggerThreshold: 0.7
};

// Utility functions
export const createSupportContext = (
  userId: string,
  userTier: 'free' | 'premium' | 'enterprise',
  additionalContext?: Partial<SupportSystemContext>
): SupportSystemContext => ({
  user_id: userId,
  user_tier: userTier,
  onboarding_completed: false,
  feature_adoption_score: 0,
  support_health: {
    user_id: userId,
    onboarding_completion: 0,
    feature_adoption_score: 0,
    support_sentiment_avg: 0.5,
    tickets_created: 0,
    churn_risk_score: 0,
    intervention_needed: false
  },
  ...additionalContext
});

// Support system initialization
export const initializeSupportSystem = async (config: Partial<SupportComponentConfig> = {}) => {
  const finalConfig = { ...defaultSupportConfig, ...config };

  // This could initialize analytics, load user health data, etc.
  console.log('Support system initialized with config:', finalConfig);

  return finalConfig;
};