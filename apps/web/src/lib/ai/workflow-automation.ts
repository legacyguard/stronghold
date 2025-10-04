import { createClient } from '@/lib/supabase';
import { sofiaEnhanced } from './sofia-enhanced';
import { documentGenerator } from './document-generator';
import { integrationManager } from '../integrations/integration-manager';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'estate_planning' | 'document_management' | 'client_onboarding' | 'compliance' | 'notification' | 'custom';
  trigger_type: 'manual' | 'scheduled' | 'event' | 'condition' | 'webhook';
  trigger_config: {
    event_type?: string;
    schedule?: {
      type: 'interval' | 'cron' | 'date';
      expression: string;
      timezone: string;
    };
    conditions?: WorkflowCondition[];
    manual_inputs?: WorkflowInput[];
  };
  steps: WorkflowStep[];
  error_handling: {
    retry_policy: {
      max_retries: number;
      backoff_strategy: 'fixed' | 'exponential' | 'linear';
      base_delay_ms: number;
    };
    failure_actions: WorkflowStep[];
    notification_on_error: boolean;
  };
  metadata: {
    created_by: string;
    created_at: Date;
    updated_at: Date;
    version: string;
    is_active: boolean;
    usage_count: number;
    success_rate: number;
    average_execution_time: number;
  };
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'ai_analysis' | 'document_generation' | 'notification' | 'integration' | 'condition' | 'delay' | 'user_input' | 'data_transformation' | 'api_call';
  order: number;
  configuration: Record<string, any>;
  inputs: WorkflowInput[];
  outputs: WorkflowOutput[];
  conditions?: WorkflowCondition[];
  timeout_ms?: number;
  retry_on_failure: boolean;
  critical: boolean;
}

export interface WorkflowInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'file';
  required: boolean;
  default_value?: any;
  validation?: {
    pattern?: string;
    min_value?: number;
    max_value?: number;
    allowed_values?: any[];
  };
  source: 'user_input' | 'previous_step' | 'trigger_data' | 'external_api' | 'database';
  source_path?: string;
  description: string;
}

export interface WorkflowOutput {
  name: string;
  type: string;
  description: string;
  target_path?: string;
  transform?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists' | 'matches';
  value: any;
  logic?: 'and' | 'or';
}

export interface WorkflowExecution {
  id: string;
  workflow_template_id: string;
  user_id: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  trigger_data: Record<string, any>;
  execution_context: {
    variables: Record<string, any>;
    step_results: Record<string, any>;
    current_step: number;
    started_at: Date;
    updated_at: Date;
    completed_at?: Date;
    error_message?: string;
  };
  steps_completed: number;
  steps_total: number;
  progress_percentage: number;
  metadata: {
    execution_time_ms?: number;
    resource_usage: {
      api_calls_made: number;
      documents_generated: number;
      notifications_sent: number;
    };
    performance_metrics: {
      step_timings: Record<string, number>;
      bottlenecks: string[];
    };
  };
}

export interface WorkflowSchedule {
  id: string;
  workflow_template_id: string;
  user_id: string;
  schedule_config: {
    type: 'interval' | 'cron' | 'date';
    expression: string;
    timezone: string;
    enabled: boolean;
  };
  next_execution: Date;
  last_execution?: Date;
  execution_count: number;
  failure_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  rule_type: 'trigger_automation' | 'data_validation' | 'notification_rule' | 'escalation_rule';
  conditions: WorkflowCondition[];
  actions: {
    workflow_template_id?: string;
    notification_config?: {
      recipients: string[];
      message_template: string;
      channels: ('email' | 'sms' | 'slack' | 'webhook')[];
    };
    data_transformation?: {
      target_field: string;
      transformation_rule: string;
    };
  };
  priority: number;
  is_active: boolean;
  created_at: Date;
  metadata: {
    trigger_count: number;
    success_count: number;
    last_triggered: Date;
  };
}

class SmartWorkflowAutomation {
  private static instance: SmartWorkflowAutomation;
  private supabase = createClient();
  private isInitialized = false;
  private workflowTemplates: Map<string, WorkflowTemplate> = new Map();
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private automationRules: Map<string, AutomationRule> = new Map();
  private executionQueue: WorkflowExecution[] = [];

  static getInstance(): SmartWorkflowAutomation {
    if (!SmartWorkflowAutomation.instance) {
      SmartWorkflowAutomation.instance = new SmartWorkflowAutomation();
    }
    return SmartWorkflowAutomation.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadWorkflowTemplates();
    await this.loadAutomationRules();
    await this.startExecutionEngine();
    await this.startScheduler();
    this.isInitialized = true;
  }

  async createWorkflowTemplate(
    userId: string,
    template: Omit<WorkflowTemplate, 'id' | 'metadata'>
  ): Promise<string> {
    const templateId = crypto.randomUUID();

    const fullTemplate: WorkflowTemplate = {
      id: templateId,
      ...template,
      metadata: {
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
        version: '1.0.0',
        is_active: true,
        usage_count: 0,
        success_rate: 0,
        average_execution_time: 0
      }
    };

    const { error } = await this.supabase
      .from('workflow_templates')
      .insert(fullTemplate);

    if (error) throw error;

    this.workflowTemplates.set(templateId, fullTemplate);
    return templateId;
  }

  async executeWorkflow(
    workflowTemplateId: string,
    userId: string,
    triggerData: Record<string, any> = {},
    manualInputs: Record<string, any> = {}
  ): Promise<string> {
    const template = this.workflowTemplates.get(workflowTemplateId);
    if (!template) {
      throw new Error('Workflow template not found');
    }

    const executionId = crypto.randomUUID();

    const execution: WorkflowExecution = {
      id: executionId,
      workflow_template_id: workflowTemplateId,
      user_id: userId,
      status: 'pending',
      trigger_data: { ...triggerData, ...manualInputs },
      execution_context: {
        variables: {},
        step_results: {},
        current_step: 0,
        started_at: new Date(),
        updated_at: new Date()
      },
      steps_completed: 0,
      steps_total: template.steps.length,
      progress_percentage: 0,
      metadata: {
        resource_usage: {
          api_calls_made: 0,
          documents_generated: 0,
          notifications_sent: 0
        },
        performance_metrics: {
          step_timings: {},
          bottlenecks: []
        }
      }
    };

    const { error } = await this.supabase
      .from('workflow_executions')
      .insert(execution);

    if (error) throw error;

    this.activeExecutions.set(executionId, execution);
    this.executionQueue.push(execution);

    return executionId;
  }

  async getWorkflowStatus(executionId: string): Promise<WorkflowExecution | null> {
    if (this.activeExecutions.has(executionId)) {
      return this.activeExecutions.get(executionId)!;
    }

    const { data, error } = await this.supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (error) return null;
    return data;
  }

  async pauseWorkflow(executionId: string): Promise<void> {
    await this.updateExecutionStatus(executionId, 'paused');
  }

  async resumeWorkflow(executionId: string): Promise<void> {
    const execution = await this.getWorkflowStatus(executionId);
    if (execution && execution.status === 'paused') {
      execution.status = 'running';
      this.executionQueue.push(execution);
      await this.updateExecutionStatus(executionId, 'running');
    }
  }

  async cancelWorkflow(executionId: string): Promise<void> {
    await this.updateExecutionStatus(executionId, 'cancelled');
    this.activeExecutions.delete(executionId);
  }

  async createAutomationRule(
    userId: string,
    rule: Omit<AutomationRule, 'id' | 'created_at' | 'metadata'>
  ): Promise<string> {
    const ruleId = crypto.randomUUID();

    const fullRule: AutomationRule = {
      id: ruleId,
      ...rule,
      created_at: new Date(),
      metadata: {
        trigger_count: 0,
        success_count: 0,
        last_triggered: new Date()
      }
    };

    const { error } = await this.supabase
      .from('automation_rules')
      .insert(fullRule);

    if (error) throw error;

    this.automationRules.set(ruleId, fullRule);
    return ruleId;
  }

  async triggerAutomationRule(
    eventType: string,
    eventData: Record<string, any>
  ): Promise<string[]> {
    const triggeredWorkflows: string[] = [];

    for (const rule of this.automationRules.values()) {
      if (!rule.is_active) continue;

      if (rule.rule_type === 'trigger_automation') {
        const shouldTrigger = this.evaluateConditions(rule.conditions, eventData);

        if (shouldTrigger && rule.actions.workflow_template_id) {
          try {
            const executionId = await this.executeWorkflow(
              rule.actions.workflow_template_id,
              eventData.user_id || 'system',
              eventData
            );

            triggeredWorkflows.push(executionId);

            // Update rule metadata
            await this.updateRuleMetadata(rule.id, true);
          } catch (error) {
            console.error('Failed to trigger workflow:', error);
            await this.updateRuleMetadata(rule.id, false);
          }
        }
      }
    }

    return triggeredWorkflows;
  }

  async getWorkflowAnalytics(
    userId: string,
    timeRange: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    average_execution_time: number;
    most_used_templates: Array<{
      template_id: string;
      template_name: string;
      execution_count: number;
    }>;
    performance_trends: Array<{
      date: string;
      executions: number;
      success_rate: number;
      avg_time: number;
    }>;
  }> {
    const timeAgo = new Date();
    switch (timeRange) {
      case 'day':
        timeAgo.setDate(timeAgo.getDate() - 1);
        break;
      case 'week':
        timeAgo.setDate(timeAgo.getDate() - 7);
        break;
      case 'month':
        timeAgo.setMonth(timeAgo.getMonth() - 1);
        break;
    }

    const { data: executions } = await this.supabase
      .from('workflow_executions')
      .select('*')
      .eq('user_id', userId)
      .gte('execution_context->started_at', timeAgo.toISOString());

    const totalExecutions = executions?.length || 0;
    const successfulExecutions = executions?.filter(e => e.status === 'completed').length || 0;
    const failedExecutions = executions?.filter(e => e.status === 'failed').length || 0;

    const avgExecutionTime = executions?.reduce((sum, e) => {
      return sum + (e.metadata?.execution_time_ms || 0);
    }, 0) / Math.max(totalExecutions, 1);

    // Group by template
    const templateUsage = new Map<string, number>();
    executions?.forEach(e => {
      const count = templateUsage.get(e.workflow_template_id) || 0;
      templateUsage.set(e.workflow_template_id, count + 1);
    });

    const mostUsedTemplates = Array.from(templateUsage.entries())
      .map(([templateId, count]) => {
        const template = this.workflowTemplates.get(templateId);
        return {
          template_id: templateId,
          template_name: template?.name || 'Unknown',
          execution_count: count
        };
      })
      .sort((a, b) => b.execution_count - a.execution_count)
      .slice(0, 5);

    return {
      total_executions: totalExecutions,
      successful_executions: successfulExecutions,
      failed_executions: failedExecutions,
      average_execution_time: avgExecutionTime,
      most_used_templates: mostUsedTemplates,
      performance_trends: [] // Would calculate daily trends
    };
  }

  private async processWorkflowExecution(execution: WorkflowExecution): Promise<void> {
    try {
      const template = this.workflowTemplates.get(execution.workflow_template_id);
      if (!template) {
        throw new Error('Workflow template not found');
      }

      await this.updateExecutionStatus(execution.id, 'running');

      const startTime = Date.now();

      for (let i = execution.execution_context.current_step; i < template.steps.length; i++) {
        const step = template.steps[i];

        // Check if execution is paused or cancelled
        const currentExecution = await this.getWorkflowStatus(execution.id);
        if (currentExecution?.status === 'paused' || currentExecution?.status === 'cancelled') {
          return;
        }

        const stepStartTime = Date.now();

        try {
          // Evaluate step conditions if any
          if (step.conditions && step.conditions.length > 0) {
            const shouldExecute = this.evaluateConditions(
              step.conditions,
              execution.execution_context.variables
            );

            if (!shouldExecute) {
              execution.execution_context.step_results[step.id] = { skipped: true };
              continue;
            }
          }

          // Execute step
          const stepResult = await this.executeWorkflowStep(step, execution);

          // Store step result
          execution.execution_context.step_results[step.id] = stepResult;
          execution.execution_context.current_step = i + 1;
          execution.steps_completed = i + 1;
          execution.progress_percentage = Math.round((execution.steps_completed / execution.steps_total) * 100);

          // Record step timing
          const stepTime = Date.now() - stepStartTime;
          execution.metadata.performance_metrics.step_timings[step.id] = stepTime;

          // Update execution in database
          await this.updateExecutionProgress(execution);

        } catch (stepError) {
          if (step.retry_on_failure && template.error_handling.retry_policy.max_retries > 0) {
            // Implement retry logic
            await this.retryStep(step, execution, stepError);
          } else {
            throw stepError;
          }
        }
      }

      // Workflow completed successfully
      execution.status = 'completed';
      execution.execution_context.completed_at = new Date();
      execution.metadata.execution_time_ms = Date.now() - startTime;

      await this.updateExecutionStatus(execution.id, 'completed');
      await this.updateTemplateMetrics(template.id, true, execution.metadata.execution_time_ms);

      this.activeExecutions.delete(execution.id);

    } catch (error) {
      execution.status = 'failed';
      execution.execution_context.error_message = error instanceof Error ? error.message : 'Unknown error';
      execution.execution_context.completed_at = new Date();

      await this.updateExecutionStatus(execution.id, 'failed');
      await this.updateTemplateMetrics(execution.workflow_template_id, false, 0);

      // Execute error handling steps if defined
      const template = this.workflowTemplates.get(execution.workflow_template_id);
      if (template?.error_handling.failure_actions.length > 0) {
        await this.executeErrorHandling(template, execution, error);
      }

      this.activeExecutions.delete(execution.id);
    }
  }

  private async executeWorkflowStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<any> {
    const inputs = this.resolveStepInputs(step.inputs, execution);

    switch (step.type) {
      case 'ai_analysis':
        return await this.executeAIAnalysisStep(step, inputs);

      case 'document_generation':
        return await this.executeDocumentGenerationStep(step, inputs);

      case 'notification':
        return await this.executeNotificationStep(step, inputs);

      case 'integration':
        return await this.executeIntegrationStep(step, inputs);

      case 'condition':
        return await this.executeConditionStep(step, inputs);

      case 'delay':
        return await this.executeDelayStep(step, inputs);

      case 'user_input':
        return await this.executeUserInputStep(step, inputs, execution);

      case 'data_transformation':
        return await this.executeDataTransformationStep(step, inputs);

      case 'api_call':
        return await this.executeAPICallStep(step, inputs);

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeAIAnalysisStep(step: WorkflowStep, inputs: Record<string, any>): Promise<any> {
    const { document_id, analysis_type } = inputs;

    if (step.configuration.use_sofia) {
      // Use Sofia for intelligent analysis
      const conversationId = await sofiaEnhanced.startConversation(
        inputs.user_id,
        'document_review'
      );

      return await sofiaEnhanced.analyzeDocumentInConversation(
        conversationId,
        document_id,
        analysis_type
      );
    } else {
      // Use document analyzer directly
      return await documentAnalyzer.analyzeDocument(
        document_id,
        inputs.user_id,
        analysis_type
      );
    }
  }

  private async executeDocumentGenerationStep(step: WorkflowStep, inputs: Record<string, any>): Promise<any> {
    const { template_id, field_values, options } = inputs;

    const generationId = await documentGenerator.startDocumentGeneration(
      inputs.user_id,
      template_id,
      field_values,
      options
    );

    // Wait for generation to complete if configured
    if (step.configuration.wait_for_completion) {
      return await this.waitForDocumentGeneration(generationId, step.timeout_ms || 300000);
    }

    return { generation_id: generationId };
  }

  private async executeNotificationStep(step: WorkflowStep, inputs: Record<string, any>): Promise<any> {
    const { recipients, message, channels } = inputs;

    const results = [];

    for (const channel of channels) {
      switch (channel) {
        case 'email':
          // Send email notification
          results.push({ channel: 'email', status: 'sent', recipients });
          break;

        case 'slack':
          // Send Slack notification
          if (step.configuration.slack_integration_id) {
            await integrationManager.sendToSlack(
              step.configuration.slack_integration_id,
              message
            );
            results.push({ channel: 'slack', status: 'sent' });
          }
          break;

        case 'webhook':
          // Send webhook notification
          if (step.configuration.webhook_url) {
            await fetch(step.configuration.webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message, recipients, timestamp: new Date() })
            });
            results.push({ channel: 'webhook', status: 'sent' });
          }
          break;
      }
    }

    return { notification_results: results };
  }

  private async executeIntegrationStep(step: WorkflowStep, inputs: Record<string, any>): Promise<any> {
    const { integration_id, action, data } = inputs;

    // Execute integration action based on configuration
    switch (action) {
      case 'sync_data':
        return await integrationManager.triggerZapierWebhook(integration_id, data);

      case 'send_message':
        if (step.configuration.integration_type === 'slack') {
          return await integrationManager.sendToSlack(integration_id, data.message);
        } else if (step.configuration.integration_type === 'teams') {
          return await integrationManager.sendToTeams(integration_id, data.title, data.message);
        }
        break;

      default:
        throw new Error(`Unknown integration action: ${action}`);
    }
  }

  private async executeConditionStep(step: WorkflowStep, inputs: Record<string, any>): Promise<any> {
    const conditions = step.configuration.conditions || [];
    const result = this.evaluateConditions(conditions, inputs);

    return {
      condition_result: result,
      evaluated_at: new Date()
    };
  }

  private async executeDelayStep(step: WorkflowStep, inputs: Record<string, any>): Promise<any> {
    const delayMs = step.configuration.delay_ms || inputs.delay_ms || 1000;

    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ delayed_for_ms: delayMs, completed_at: new Date() });
      }, delayMs);
    });
  }

  private async executeUserInputStep(
    step: WorkflowStep,
    inputs: Record<string, any>,
    execution: WorkflowExecution
  ): Promise<any> {
    // Pause execution and wait for user input
    await this.updateExecutionStatus(execution.id, 'paused');

    // In a real implementation, this would trigger a user interface
    // for the user to provide the required inputs

    return {
      awaiting_user_input: true,
      required_inputs: step.inputs,
      instruction: step.configuration.instruction || 'Please provide the required information'
    };
  }

  private async executeDataTransformationStep(step: WorkflowStep, inputs: Record<string, any>): Promise<any> {
    const transformationRules = step.configuration.transformation_rules || [];
    const transformedData: Record<string, any> = {};

    for (const rule of transformationRules) {
      const { source_field, target_field, transformation } = rule;
      const sourceValue = inputs[source_field];

      switch (transformation) {
        case 'uppercase':
          transformedData[target_field] = String(sourceValue).toUpperCase();
          break;
        case 'lowercase':
          transformedData[target_field] = String(sourceValue).toLowerCase();
          break;
        case 'date_format':
          transformedData[target_field] = new Date(sourceValue).toISOString();
          break;
        case 'currency_format':
          transformedData[target_field] = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(parseFloat(sourceValue));
          break;
        default:
          transformedData[target_field] = sourceValue;
      }
    }

    return { transformed_data: transformedData };
  }

  private async executeAPICallStep(step: WorkflowStep, inputs: Record<string, any>): Promise<any> {
    const { url, method, headers, body } = step.configuration;

    const response = await fetch(url, {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify({ ...body, ...inputs }) : undefined
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();

    return {
      status_code: response.status,
      response_data: responseData,
      completed_at: new Date()
    };
  }

  private resolveStepInputs(
    inputDefinitions: WorkflowInput[],
    execution: WorkflowExecution
  ): Record<string, any> {
    const resolvedInputs: Record<string, any> = {};

    for (const input of inputDefinitions) {
      let value = input.default_value;

      switch (input.source) {
        case 'user_input':
          value = execution.trigger_data[input.name];
          break;

        case 'previous_step':
          if (input.source_path) {
            const [stepId, outputPath] = input.source_path.split('.');
            const stepResult = execution.execution_context.step_results[stepId];
            value = this.getNestedValue(stepResult, outputPath);
          }
          break;

        case 'trigger_data':
          value = execution.trigger_data[input.name];
          break;

        case 'database':
          // Would fetch from database using source_path
          break;
      }

      resolvedInputs[input.name] = value;
    }

    return resolvedInputs;
  }

  private evaluateConditions(
    conditions: WorkflowCondition[],
    data: Record<string, any>
  ): boolean {
    if (conditions.length === 0) return true;

    let result = true;

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      const fieldValue = data[condition.field];
      let conditionResult = false;

      switch (condition.operator) {
        case 'equals':
          conditionResult = fieldValue === condition.value;
          break;
        case 'not_equals':
          conditionResult = fieldValue !== condition.value;
          break;
        case 'greater_than':
          conditionResult = parseFloat(fieldValue) > parseFloat(condition.value);
          break;
        case 'less_than':
          conditionResult = parseFloat(fieldValue) < parseFloat(condition.value);
          break;
        case 'contains':
          conditionResult = String(fieldValue).includes(String(condition.value));
          break;
        case 'exists':
          conditionResult = fieldValue !== undefined && fieldValue !== null;
          break;
        case 'matches':
          conditionResult = new RegExp(condition.value).test(String(fieldValue));
          break;
      }

      if (i === 0) {
        result = conditionResult;
      } else if (condition.logic === 'and') {
        result = result && conditionResult;
      } else if (condition.logic === 'or') {
        result = result || conditionResult;
      }
    }

    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async waitForDocumentGeneration(generationId: string, timeoutMs: number): Promise<any> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(checkInterval);
          reject(new Error('Document generation timeout'));
          return;
        }

        const status = await documentGenerator.getGenerationStatus(generationId);
        if (status?.status === 'completed') {
          clearInterval(checkInterval);
          resolve({ generation_id: generationId, status: 'completed', result: status });
        } else if (status?.status === 'failed') {
          clearInterval(checkInterval);
          reject(new Error(`Document generation failed: ${status.generated_content.legal_warnings.join(', ')}`));
        }
      }, 2000);
    });
  }

  private async retryStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    error: any
  ): Promise<void> {
    // Implement retry logic with backoff
    // This is a simplified version
    throw error;
  }

  private async executeErrorHandling(
    template: WorkflowTemplate,
    execution: WorkflowExecution,
    error: any
  ): Promise<void> {
    // Execute error handling steps
    for (const errorStep of template.error_handling.failure_actions) {
      try {
        await this.executeWorkflowStep(errorStep, execution);
      } catch (errorHandlingError) {
        console.error('Error in error handling step:', errorHandlingError);
      }
    }

    // Send notification if configured
    if (template.error_handling.notification_on_error) {
      // Send error notification
    }
  }

  private async updateExecutionStatus(executionId: string, status: string): Promise<void> {
    await this.supabase
      .from('workflow_executions')
      .update({
        status,
        'execution_context->updated_at': new Date()
      })
      .eq('id', executionId);

    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      execution.status = status as any;
      execution.execution_context.updated_at = new Date();
    }
  }

  private async updateExecutionProgress(execution: WorkflowExecution): Promise<void> {
    await this.supabase
      .from('workflow_executions')
      .update({
        steps_completed: execution.steps_completed,
        progress_percentage: execution.progress_percentage,
        execution_context: execution.execution_context,
        metadata: execution.metadata
      })
      .eq('id', execution.id);
  }

  private async updateTemplateMetrics(
    templateId: string,
    success: boolean,
    executionTime: number
  ): Promise<void> {
    const template = this.workflowTemplates.get(templateId);
    if (template) {
      template.metadata.usage_count++;

      if (success) {
        const successCount = template.metadata.usage_count * template.metadata.success_rate / 100 + 1;
        template.metadata.success_rate = (successCount / template.metadata.usage_count) * 100;

        const totalTime = template.metadata.average_execution_time * (template.metadata.usage_count - 1) + executionTime;
        template.metadata.average_execution_time = totalTime / template.metadata.usage_count;
      }

      await this.supabase
        .from('workflow_templates')
        .update({ metadata: template.metadata })
        .eq('id', templateId);
    }
  }

  private async updateRuleMetadata(ruleId: string, success: boolean): Promise<void> {
    const rule = this.automationRules.get(ruleId);
    if (rule) {
      rule.metadata.trigger_count++;
      if (success) {
        rule.metadata.success_count++;
      }
      rule.metadata.last_triggered = new Date();

      await this.supabase
        .from('automation_rules')
        .update({ metadata: rule.metadata })
        .eq('id', ruleId);
    }
  }

  private async loadWorkflowTemplates(): Promise<void> {
    const { data: templates } = await this.supabase
      .from('workflow_templates')
      .select('*')
      .eq('metadata->>is_active', 'true');

    if (templates) {
      for (const template of templates) {
        this.workflowTemplates.set(template.id, template);
      }
    }
  }

  private async loadAutomationRules(): Promise<void> {
    const { data: rules } = await this.supabase
      .from('automation_rules')
      .select('*')
      .eq('is_active', true);

    if (rules) {
      for (const rule of rules) {
        this.automationRules.set(rule.id, rule);
      }
    }
  }

  private async startExecutionEngine(): Promise<void> {
    setInterval(async () => {
      try {
        // Process queued executions
        const execution = this.executionQueue.shift();
        if (execution && execution.status === 'pending') {
          this.processWorkflowExecution(execution);
        }

        // Check for paused executions that should resume
        const { data: pausedExecutions } = await this.supabase
          .from('workflow_executions')
          .select('*')
          .eq('status', 'paused')
          .limit(5);

        if (pausedExecutions) {
          for (const execution of pausedExecutions) {
            // Check if user input is now available
            if (this.hasRequiredUserInput(execution)) {
              execution.status = 'running';
              this.executionQueue.push(execution);
            }
          }
        }
      } catch (error) {
        console.error('Execution engine error:', error);
      }
    }, 5000); // Check every 5 seconds
  }

  private async startScheduler(): Promise<void> {
    setInterval(async () => {
      try {
        const { data: schedules } = await this.supabase
          .from('workflow_schedules')
          .select('*')
          .eq('schedule_config->>enabled', 'true')
          .lte('next_execution', new Date().toISOString());

        if (schedules) {
          for (const schedule of schedules) {
            try {
              await this.executeWorkflow(
                schedule.workflow_template_id,
                schedule.user_id,
                { scheduled_execution: true }
              );

              // Calculate next execution time
              const nextExecution = this.calculateNextExecution(schedule.schedule_config);

              await this.supabase
                .from('workflow_schedules')
                .update({
                  last_execution: new Date(),
                  next_execution: nextExecution,
                  execution_count: schedule.execution_count + 1
                })
                .eq('id', schedule.id);
            } catch (error) {
              await this.supabase
                .from('workflow_schedules')
                .update({
                  failure_count: schedule.failure_count + 1
                })
                .eq('id', schedule.id);
            }
          }
        }
      } catch (error) {
        console.error('Scheduler error:', error);
      }
    }, 60000); // Check every minute
  }

  private hasRequiredUserInput(execution: WorkflowExecution): boolean {
    // Check if all required user inputs are now available
    // This is a simplified implementation
    return false;
  }

  private calculateNextExecution(scheduleConfig: any): Date {
    const now = new Date();

    switch (scheduleConfig.type) {
      case 'interval':
        const intervalMs = parseInt(scheduleConfig.expression);
        return new Date(now.getTime() + intervalMs);

      case 'cron':
        // Would use a cron parser to calculate next execution
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Daily for now

      case 'date':
        return new Date(scheduleConfig.expression);

      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }
}

export const workflowAutomation = SmartWorkflowAutomation.getInstance();