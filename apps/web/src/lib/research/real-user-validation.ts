import { supabase } from '@/lib/supabase';
import { BehaviorTracker } from '@/lib/monitoring/behavior-tracker';
import { UserFeedbackCollector } from './user-feedback-collector';
import { ABTesting } from '@/lib/experiments/ab-testing';

interface UserProfile {
  id: string;
  created_at: Date;
  last_active: Date;
  usage_days: number;
  features_used: string[];
  subscription_tier: 'free' | 'premium';
  onboarding_completed: boolean;
  primary_use_case: string;
}

interface ValidationTest {
  id: string;
  name: string;
  description: string;
  target_users: number;
  completion_criteria: {
    min_participants: number;
    min_completion_rate: number;
    min_satisfaction_score: number;
  };
  tasks: ValidationTask[];
  status: 'planning' | 'recruiting' | 'running' | 'analyzing' | 'completed';
  results?: ValidationResults;
}

interface ValidationTask {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  success_criteria: string[];
  expected_duration_minutes: number;
  required_features: string[];
}

interface ValidationResults {
  participants: number;
  completion_rate: number;
  average_satisfaction: number;
  task_completion_rates: Record<string, number>;
  user_feedback: any[];
  key_insights: string[];
  recommendations: string[];
  pain_points: string[];
}

interface UserTestSession {
  session_id: string;
  user_id: string;
  test_id: string;
  started_at: Date;
  completed_at?: Date;
  tasks_completed: string[];
  satisfaction_score?: number;
  feedback?: string;
  session_recording?: string;
  notes?: string;
}

export class RealUserValidation {
  /**
   * Initialize user validation system
   */
  static async initializeValidationSystem(): Promise<void> {
    try {
      await this.createValidationTables();
      await this.setupDefaultValidationTests();
      console.log('✅ User validation system initialized');
    } catch (error) {
      console.error('❌ Failed to initialize validation system:', error);
      throw error;
    }
  }

  /**
   * Create validation database tables
   */
  private static async createValidationTables(): Promise<void> {
    const sql = `
      -- User validation tests table
      CREATE TABLE IF NOT EXISTS validation_tests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        target_users INTEGER NOT NULL,
        completion_criteria JSONB NOT NULL,
        tasks JSONB NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('planning', 'recruiting', 'running', 'analyzing', 'completed')),
        results JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- User test sessions table
      CREATE TABLE IF NOT EXISTS user_test_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id TEXT UNIQUE NOT NULL,
        user_id UUID REFERENCES auth.users(id),
        test_id UUID REFERENCES validation_tests(id),
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        tasks_completed JSONB,
        satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
        feedback TEXT,
        session_recording TEXT,
        notes TEXT,
        metadata JSONB
      );

      -- User segments table for targeting
      CREATE TABLE IF NOT EXISTS user_segments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id),
        segment_name TEXT NOT NULL,
        segment_criteria JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, segment_name)
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_validation_tests_status ON validation_tests(status);
      CREATE INDEX IF NOT EXISTS idx_user_test_sessions_user_id ON user_test_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_test_sessions_test_id ON user_test_sessions(test_id);
      CREATE INDEX IF NOT EXISTS idx_user_segments_user_id ON user_segments(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_segments_segment ON user_segments(segment_name);

      -- RLS Policies
      ALTER TABLE validation_tests ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_test_sessions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_segments ENABLE ROW LEVEL SECURITY;

      -- Admin and user policies
      CREATE POLICY validation_tests_policy ON validation_tests
        FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

      CREATE POLICY user_test_sessions_policy ON user_test_sessions
        FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

      CREATE POLICY user_segments_policy ON user_segments
        FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');
    `;

    await supabase.rpc('exec_sql', { sql });
  }

  /**
   * Setup default validation tests
   */
  private static async setupDefaultValidationTests(): Promise<void> {
    const defaultTests: Omit<ValidationTest, 'id' | 'results'>[] = [
      {
        name: 'Will Generation User Journey',
        description: 'Test the complete will generation process from start to finish',
        target_users: 20,
        completion_criteria: {
          min_participants: 15,
          min_completion_rate: 0.70,
          min_satisfaction_score: 3.5
        },
        tasks: [
          {
            id: 'will_start',
            name: 'Start Will Creation',
            description: 'User navigates to will generator and starts the process',
            instructions: [
              'Go to the main dashboard',
              'Find and click the "Create Will" button',
              'Begin the will creation process'
            ],
            success_criteria: [
              'User successfully reaches will generator',
              'First step of will creation is displayed',
              'User can input basic information'
            ],
            expected_duration_minutes: 5,
            required_features: ['will_generator', 'dashboard']
          },
          {
            id: 'will_personal_info',
            name: 'Enter Personal Information',
            description: 'Complete personal information section of will',
            instructions: [
              'Fill in your personal details',
              'Add your address information',
              'Proceed to the next step'
            ],
            success_criteria: [
              'All required fields are completed',
              'Validation passes without errors',
              'User can proceed to next step'
            ],
            expected_duration_minutes: 8,
            required_features: ['will_generator', 'form_validation']
          },
          {
            id: 'will_beneficiaries',
            name: 'Add Beneficiaries',
            description: 'Add and configure beneficiaries for the will',
            instructions: [
              'Add at least one beneficiary',
              'Specify inheritance percentages',
              'Add contact information for beneficiaries'
            ],
            success_criteria: [
              'At least one beneficiary is added',
              'Percentages add up to 100%',
              'All required beneficiary fields are completed'
            ],
            expected_duration_minutes: 10,
            required_features: ['will_generator', 'beneficiary_management']
          },
          {
            id: 'will_review_complete',
            name: 'Review and Complete Will',
            description: 'Review the will and complete the generation process',
            instructions: [
              'Review all entered information',
              'Make any necessary corrections',
              'Generate and download the will document'
            ],
            success_criteria: [
              'User can review all information',
              'Will document is generated successfully',
              'PDF download works correctly'
            ],
            expected_duration_minutes: 7,
            required_features: ['will_generator', 'pdf_generation', 'document_download']
          }
        ],
        status: 'planning'
      },
      {
        name: 'New User Onboarding',
        description: 'Test the onboarding experience for first-time users',
        target_users: 15,
        completion_criteria: {
          min_participants: 10,
          min_completion_rate: 0.80,
          min_satisfaction_score: 4.0
        },
        tasks: [
          {
            id: 'signup_process',
            name: 'Account Registration',
            description: 'Complete the user registration process',
            instructions: [
              'Create a new account using email',
              'Verify email if required',
              'Complete initial profile setup'
            ],
            success_criteria: [
              'Account is created successfully',
              'User can log in',
              'Profile information is saved'
            ],
            expected_duration_minutes: 5,
            required_features: ['authentication', 'email_verification']
          },
          {
            id: 'onboarding_tour',
            name: 'Complete Onboarding Tour',
            description: 'Go through the guided onboarding experience',
            instructions: [
              'Follow the onboarding steps',
              'Learn about key features',
              'Complete the onboarding checklist'
            ],
            success_criteria: [
              'All onboarding steps are completed',
              'User understands main features',
              'Onboarding is marked as complete'
            ],
            expected_duration_minutes: 8,
            required_features: ['onboarding', 'feature_tour']
          },
          {
            id: 'first_action',
            name: 'Take First Meaningful Action',
            description: 'Complete a first meaningful action in the app',
            instructions: [
              'Choose your primary use case',
              'Start creating your first document or will',
              'Save your progress'
            ],
            success_criteria: [
              'User selects a primary use case',
              'First document creation is started',
              'Progress is saved successfully'
            ],
            expected_duration_minutes: 10,
            required_features: ['will_generator', 'document_management']
          }
        ],
        status: 'planning'
      },
      {
        name: 'Mobile Experience Validation',
        description: 'Test the mobile responsiveness and usability',
        target_users: 12,
        completion_criteria: {
          min_participants: 8,
          min_completion_rate: 0.65,
          min_satisfaction_score: 3.5
        },
        tasks: [
          {
            id: 'mobile_navigation',
            name: 'Navigate on Mobile',
            description: 'Test navigation and menu functionality on mobile',
            instructions: [
              'Access the application on mobile device',
              'Navigate through main sections',
              'Use mobile menu and navigation'
            ],
            success_criteria: [
              'All pages load correctly on mobile',
              'Navigation is intuitive and functional',
              'No horizontal scrolling issues'
            ],
            expected_duration_minutes: 5,
            required_features: ['mobile_responsive', 'navigation']
          },
          {
            id: 'mobile_form_filling',
            name: 'Complete Forms on Mobile',
            description: 'Test form completion experience on mobile',
            instructions: [
              'Fill out a form on mobile device',
              'Test input fields and validation',
              'Submit the form successfully'
            ],
            success_criteria: [
              'All form fields are accessible',
              'Keyboard and input work properly',
              'Form submission is successful'
            ],
            expected_duration_minutes: 8,
            required_features: ['mobile_responsive', 'form_handling']
          }
        ],
        status: 'planning'
      }
    ];

    for (const test of defaultTests) {
      try {
        await supabase
          .from('validation_tests')
          .insert({
            name: test.name,
            description: test.description,
            target_users: test.target_users,
            completion_criteria: test.completion_criteria,
            tasks: test.tasks,
            status: test.status
          });
      } catch (error) {
        console.warn('Default test may already exist:', test.name);
      }
    }
  }

  /**
   * Start a validation test session
   */
  static async startValidationSession(
    userId: string,
    testId: string
  ): Promise<{ success: boolean; session_id?: string; error?: string }> {
    try {
      const sessionId = crypto.randomUUID();

      const { data, error } = await supabase
        .from('user_test_sessions')
        .insert({
          session_id: sessionId,
          user_id: userId,
          test_id: testId,
          tasks_completed: [],
          metadata: {
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            screen_resolution: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '',
            start_url: typeof window !== 'undefined' ? window.location.href : ''
          }
        })
        .select('session_id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Track validation session start
      BehaviorTracker.trackUserAction('validation_session_started', userId, {
        test_id: testId,
        session_id: sessionId
      });

      return { success: true, session_id: sessionId };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Complete a validation task
   */
  static async completeValidationTask(
    sessionId: string,
    taskId: string,
    success: boolean,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current session
      const { data: session, error: sessionError } = await supabase
        .from('user_test_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (sessionError || !session) {
        return { success: false, error: 'Session not found' };
      }

      // Update tasks completed
      const tasksCompleted = session.tasks_completed || [];
      tasksCompleted.push({
        task_id: taskId,
        completed_at: new Date().toISOString(),
        success,
        notes
      });

      const { error } = await supabase
        .from('user_test_sessions')
        .update({
          tasks_completed: tasksCompleted
        })
        .eq('session_id', sessionId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Track task completion
      BehaviorTracker.trackUserAction('validation_task_completed', session.user_id, {
        test_id: session.test_id,
        session_id: sessionId,
        task_id: taskId,
        success,
        notes
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Complete a validation session
   */
  static async completeValidationSession(
    sessionId: string,
    satisfactionScore: number,
    feedback?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_test_sessions')
        .update({
          completed_at: new Date().toISOString(),
          satisfaction_score: satisfactionScore,
          feedback
        })
        .eq('session_id', sessionId)
        .select('user_id, test_id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Track session completion
      BehaviorTracker.trackUserAction('validation_session_completed', data.user_id, {
        test_id: data.test_id,
        session_id: sessionId,
        satisfaction_score: satisfactionScore,
        feedback_provided: !!feedback
      });

      // Submit feedback to feedback collector
      if (feedback) {
        await UserFeedbackCollector.submitFeedback(data.user_id, {
          rating: satisfactionScore,
          feedback,
          feedback_type: 'usability',
          page_url: '/validation-test',
          feature_context: 'user_validation_test'
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Analyze validation test results
   */
  static async analyzeValidationResults(testId: string): Promise<ValidationResults> {
    try {
      // Get test details
      const { data: test } = await supabase
        .from('validation_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (!test) {
        throw new Error('Test not found');
      }

      // Get all sessions for this test
      const { data: sessions } = await supabase
        .from('user_test_sessions')
        .select('*')
        .eq('test_id', testId);

      if (!sessions || sessions.length === 0) {
        return {
          participants: 0,
          completion_rate: 0,
          average_satisfaction: 0,
          task_completion_rates: {},
          user_feedback: [],
          key_insights: [],
          recommendations: [],
          pain_points: []
        };
      }

      // Calculate metrics
      const participants = sessions.length;
      const completedSessions = sessions.filter(s => s.completed_at).length;
      const completionRate = participants > 0 ? completedSessions / participants : 0;

      const satisfactionScores = sessions
        .filter(s => s.satisfaction_score)
        .map(s => s.satisfaction_score);
      const averageSatisfaction = satisfactionScores.length > 0
        ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
        : 0;

      // Calculate task completion rates
      const taskCompletionRates: Record<string, number> = {};
      test.tasks.forEach((task: any) => {
        const taskCompletions = sessions.filter(s =>
          s.tasks_completed?.some((t: any) => t.task_id === task.id && t.success)
        ).length;
        taskCompletionRates[task.id] = participants > 0 ? taskCompletions / participants : 0;
      });

      // Collect feedback
      const userFeedback = sessions
        .filter(s => s.feedback)
        .map(s => ({
          satisfaction_score: s.satisfaction_score,
          feedback: s.feedback,
          completed_at: s.completed_at
        }));

      // Generate insights
      const keyInsights = this.generateInsights(
        completionRate,
        averageSatisfaction,
        taskCompletionRates,
        userFeedback
      );

      const recommendations = this.generateRecommendations(
        completionRate,
        averageSatisfaction,
        taskCompletionRates,
        test.completion_criteria
      );

      const painPoints = this.identifyPainPoints(taskCompletionRates, userFeedback);

      const results: ValidationResults = {
        participants,
        completion_rate: completionRate,
        average_satisfaction: averageSatisfaction,
        task_completion_rates: taskCompletionRates,
        user_feedback: userFeedback,
        key_insights: keyInsights,
        recommendations,
        pain_points: painPoints
      };

      // Save results to test
      await supabase
        .from('validation_tests')
        .update({
          results,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', testId);

      return results;
    } catch (error) {
      console.error('Error analyzing validation results:', error);
      return {
        participants: 0,
        completion_rate: 0,
        average_satisfaction: 0,
        task_completion_rates: {},
        user_feedback: [],
        key_insights: [],
        recommendations: [],
        pain_points: []
      };
    }
  }

  /**
   * Get validation test status
   */
  static async getValidationStatus(): Promise<{
    active_tests: number;
    total_participants: number;
    average_completion_rate: number;
    recent_insights: string[];
  }> {
    try {
      const { data: tests } = await supabase
        .from('validation_tests')
        .select(`
          *,
          sessions:user_test_sessions(*)
        `);

      if (!tests) {
        return {
          active_tests: 0,
          total_participants: 0,
          average_completion_rate: 0,
          recent_insights: []
        };
      }

      const activeTests = tests.filter(t => t.status === 'running').length;
      const totalParticipants = tests.reduce((sum, test) => sum + (test.sessions?.length || 0), 0);

      const completionRates = tests
        .filter(t => t.results)
        .map(t => t.results.completion_rate);
      const averageCompletionRate = completionRates.length > 0
        ? completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length
        : 0;

      const recentInsights = tests
        .filter(t => t.results && t.results.key_insights)
        .flatMap(t => t.results.key_insights)
        .slice(0, 5);

      return {
        active_tests: activeTests,
        total_participants: totalParticipants,
        average_completion_rate: averageCompletionRate,
        recent_insights: recentInsights
      };
    } catch (error) {
      console.error('Error getting validation status:', error);
      return {
        active_tests: 0,
        total_participants: 0,
        average_completion_rate: 0,
        recent_insights: []
      };
    }
  }

  // Helper methods for analysis

  private static generateInsights(
    completionRate: number,
    satisfaction: number,
    taskRates: Record<string, number>,
    feedback: any[]
  ): string[] {
    const insights: string[] = [];

    if (completionRate < 0.5) {
      insights.push('Nízka miera dokončenia naznačuje zásadné problémy s používateľským rozhraním');
    } else if (completionRate > 0.8) {
      insights.push('Vysoká miera dokončenia ukazuje na dobrú použiteľnosť');
    }

    if (satisfaction < 3.0) {
      insights.push('Nízka spokojnosť používateľov vyžaduje okamžité zlepšenia');
    } else if (satisfaction > 4.0) {
      insights.push('Používatelia sú celkovo spokojní s aplikáciou');
    }

    // Identify problematic tasks
    const problematicTasks = Object.entries(taskRates)
      .filter(([, rate]) => rate < 0.6)
      .map(([taskId]) => taskId);

    if (problematicTasks.length > 0) {
      insights.push(`Problémy identifikované v úlohách: ${problematicTasks.join(', ')}`);
    }

    return insights;
  }

  private static generateRecommendations(
    completionRate: number,
    satisfaction: number,
    taskRates: Record<string, number>,
    criteria: any
  ): string[] {
    const recommendations: string[] = [];

    if (completionRate < criteria.min_completion_rate) {
      recommendations.push('Zjednodušiť používateľské rozhranie a zlepšiť navigáciu');
    }

    if (satisfaction < criteria.min_satisfaction_score) {
      recommendations.push('Analyzovať používateľský feedback a implementovať zlepšenia');
    }

    const worstTask = Object.entries(taskRates)
      .sort(([,a], [,b]) => a - b)[0];

    if (worstTask && worstTask[1] < 0.5) {
      recommendations.push(`Prioritne zlepšiť úlohu: ${worstTask[0]}`);
    }

    return recommendations;
  }

  private static identifyPainPoints(
    taskRates: Record<string, number>,
    feedback: any[]
  ): string[] {
    const painPoints: string[] = [];

    // Task-based pain points
    Object.entries(taskRates).forEach(([taskId, rate]) => {
      if (rate < 0.4) {
        painPoints.push(`Kritický problém s úlohou: ${taskId}`);
      }
    });

    // Feedback-based pain points
    const negativeKeywords = ['zložité', 'nejasné', 'pomalé', 'nefunguje', 'problém'];
    feedback.forEach(f => {
      const feedbackText = f.feedback.toLowerCase();
      negativeKeywords.forEach(keyword => {
        if (feedbackText.includes(keyword)) {
          painPoints.push(`Používatelia považujú aplikáciu za ${keyword}`);
        }
      });
    });

    return Array.from(new Set(painPoints)); // Remove duplicates
  }
}