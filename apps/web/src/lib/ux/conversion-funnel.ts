import { supabase } from '@/lib/supabase'
import { userJourneyAnalytics } from './user-journey-analytics'

export interface FunnelStep {
  id: string
  name: string
  order: number
  page_pattern: string
  required_actions?: string[]
  conversion_value?: number
  time_limit_minutes?: number
}

export interface FunnelDefinition {
  id: string
  name: string
  description: string
  steps: FunnelStep[]
  is_active: boolean
  target_conversion_rate: number
  created_at: Date
  updated_at: Date
}

export interface FunnelProgress {
  session_id: string
  user_id: string
  funnel_id: string
  current_step: number
  started_at: Date
  last_activity: Date
  completed: boolean
  conversion_value?: number
  drop_off_step?: number
  drop_off_reason?: string
}

export interface FunnelAnalyticsData {
  funnel_id: string
  date_range: { start: Date; end: Date }
  total_entries: number
  total_completions: number
  overall_conversion_rate: number
  average_completion_time: number
  step_performance: Array<{
    step_id: string
    step_name: string
    entries: number
    completions: number
    drop_offs: number
    conversion_rate: number
    average_time_spent: number
    most_common_drop_reasons: string[]
  }>
  conversion_segments: Array<{
    segment_name: string
    entries: number
    conversion_rate: number
    characteristics: string[]
  }>
  optimization_recommendations: string[]
}

export interface ConversionEvent {
  id: string
  session_id: string
  user_id: string
  funnel_id: string
  step_id: string
  event_type: 'enter' | 'progress' | 'complete' | 'drop_off'
  timestamp: Date
  value?: number
  metadata?: Record<string, any>
}

export class ConversionFunnelTracker {
  private static instance: ConversionFunnelTracker
  private activeFunnels: Map<string, FunnelDefinition> = new Map()
  private userProgress: Map<string, FunnelProgress[]> = new Map()

  static getInstance(): ConversionFunnelTracker {
    if (!ConversionFunnelTracker.instance) {
      ConversionFunnelTracker.instance = new ConversionFunnelTracker()
    }
    return ConversionFunnelTracker.instance
  }

  async initialize(): Promise<void> {
    await this.loadActiveFunnels()
    this.setupPageTracking()
  }

  async createFunnel(funnelData: Omit<FunnelDefinition, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const funnel: FunnelDefinition = {
      id: crypto.randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
      ...funnelData
    }

    const { error } = await supabase
      .from('conversion_funnels')
      .insert([funnel])

    if (error) {
      throw new Error(`Failed to create funnel: ${error.message}`)
    }

    this.activeFunnels.set(funnel.id, funnel)
    return funnel.id
  }

  async getFunnel(funnelId: string): Promise<FunnelDefinition | null> {
    if (this.activeFunnels.has(funnelId)) {
      return this.activeFunnels.get(funnelId)!
    }

    const { data, error } = await supabase
      .from('conversion_funnels')
      .select('*')
      .eq('id', funnelId)
      .single()

    if (error || !data) {
      return null
    }

    const funnel = data as FunnelDefinition
    this.activeFunnels.set(funnelId, funnel)
    return funnel
  }

  async startFunnelTracking(sessionId: string, userId: string, funnelId: string): Promise<void> {
    const funnel = await this.getFunnel(funnelId)
    if (!funnel) {
      throw new Error(`Funnel ${funnelId} not found`)
    }

    const progress: FunnelProgress = {
      session_id: sessionId,
      user_id: userId,
      funnel_id: funnelId,
      current_step: 0,
      started_at: new Date(),
      last_activity: new Date(),
      completed: false
    }

    // Store in memory for quick access
    if (!this.userProgress.has(sessionId)) {
      this.userProgress.set(sessionId, [])
    }
    this.userProgress.get(sessionId)!.push(progress)

    // Store in database
    const { error } = await supabase
      .from('funnel_progress')
      .insert([progress])

    if (error) {
      console.error('Failed to store funnel progress:', error)
    }

    // Track funnel entry
    await this.trackConversionEvent({
      session_id: sessionId,
      user_id: userId,
      funnel_id: funnelId,
      step_id: funnel.steps[0].id,
      event_type: 'enter'
    })

    // Track in user journey
    await userJourneyAnalytics.trackFunnelStep(funnel.name, funnel.steps[0].name, 'enter')
  }

  async trackStepProgress(sessionId: string, funnelId: string, stepId: string, metadata?: Record<string, any>): Promise<void> {
    const progress = this.getUserProgress(sessionId, funnelId)
    const funnel = await this.getFunnel(funnelId)

    if (!progress || !funnel) {
      return
    }

    const stepIndex = funnel.steps.findIndex(step => step.id === stepId)
    if (stepIndex === -1) {
      return
    }

    // Update progress
    progress.current_step = Math.max(progress.current_step, stepIndex)
    progress.last_activity = new Date()

    // Check if funnel is completed
    if (stepIndex === funnel.steps.length - 1) {
      progress.completed = true
      const step = funnel.steps[stepIndex]
      if (step.conversion_value) {
        progress.conversion_value = step.conversion_value
      }

      // Track completion
      await this.trackConversionEvent({
        session_id: sessionId,
        user_id: progress.user_id,
        funnel_id: funnelId,
        step_id: stepId,
        event_type: 'complete',
        value: step.conversion_value,
        metadata
      })

      await userJourneyAnalytics.trackFunnelStep(funnel.name, funnel.steps[stepIndex].name, 'complete')
      await userJourneyAnalytics.trackConversion(`funnel_${funnel.name}`, step.conversion_value)
    } else {
      // Track progress
      await this.trackConversionEvent({
        session_id: sessionId,
        user_id: progress.user_id,
        funnel_id: funnelId,
        step_id: stepId,
        event_type: 'progress',
        metadata
      })
    }

    // Update database
    const { error } = await supabase
      .from('funnel_progress')
      .update({
        current_step: progress.current_step,
        last_activity: progress.last_activity,
        completed: progress.completed,
        conversion_value: progress.conversion_value
      })
      .eq('session_id', sessionId)
      .eq('funnel_id', funnelId)

    if (error) {
      console.error('Failed to update funnel progress:', error)
    }
  }

  async trackStepDropOff(sessionId: string, funnelId: string, stepId: string, reason?: string): Promise<void> {
    const progress = this.getUserProgress(sessionId, funnelId)
    const funnel = await this.getFunnel(funnelId)

    if (!progress || !funnel) {
      return
    }

    const stepIndex = funnel.steps.findIndex(step => step.id === stepId)
    if (stepIndex === -1) {
      return
    }

    progress.drop_off_step = stepIndex
    progress.drop_off_reason = reason
    progress.last_activity = new Date()

    // Track drop off event
    await this.trackConversionEvent({
      session_id: sessionId,
      user_id: progress.user_id,
      funnel_id: funnelId,
      step_id: stepId,
      event_type: 'drop_off',
      metadata: { reason }
    })

    await userJourneyAnalytics.trackFunnelStep(funnel.name, funnel.steps[stepIndex].name, 'drop')

    // Update database
    const { error } = await supabase
      .from('funnel_progress')
      .update({
        drop_off_step: progress.drop_off_step,
        drop_off_reason: progress.drop_off_reason,
        last_activity: progress.last_activity
      })
      .eq('session_id', sessionId)
      .eq('funnel_id', funnelId)

    if (error) {
      console.error('Failed to update funnel drop off:', error)
    }
  }

  async getFunnelAnalytics(funnelId: string, dateRange: { start: Date; end: Date }): Promise<FunnelAnalyticsData> {
    const funnel = await this.getFunnel(funnelId)
    if (!funnel) {
      throw new Error(`Funnel ${funnelId} not found`)
    }

    // Get conversion events for the date range
    const { data: events, error } = await supabase
      .from('conversion_events')
      .select('*')
      .eq('funnel_id', funnelId)
      .gte('timestamp', dateRange.start.toISOString())
      .lte('timestamp', dateRange.end.toISOString())
      .order('timestamp', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch funnel analytics: ${error.message}`)
    }

    return this.analyzeFunnelData(funnel, events || [], dateRange)
  }

  async getTopPerformingFunnels(dateRange: { start: Date; end: Date }): Promise<Array<{
    funnel_id: string
    name: string
    conversion_rate: number
    total_entries: number
    total_revenue: number
  }>> {
    const funnelAnalytics: Array<{
      funnel_id: string
      name: string
      conversion_rate: number
      total_entries: number
      total_revenue: number
    }> = []

    for (const [funnelId, funnel] of this.activeFunnels) {
      try {
        const analytics = await this.getFunnelAnalytics(funnelId, dateRange)

        funnelAnalytics.push({
          funnel_id: funnelId,
          name: funnel.name,
          conversion_rate: analytics.overall_conversion_rate,
          total_entries: analytics.total_entries,
          total_revenue: analytics.total_completions * (funnel.steps[funnel.steps.length - 1].conversion_value || 0)
        })
      } catch (error) {
        console.error(`Failed to get analytics for funnel ${funnelId}:`, error)
      }
    }

    return funnelAnalytics.sort((a, b) => b.conversion_rate - a.conversion_rate)
  }

  private async loadActiveFunnels(): Promise<void> {
    const { data, error } = await supabase
      .from('conversion_funnels')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Failed to load active funnels:', error)
      return
    }

    this.activeFunnels.clear()
    data?.forEach(funnel => {
      this.activeFunnels.set(funnel.id, funnel as FunnelDefinition)
    })
  }

  private setupPageTracking(): void {
    if (typeof window !== 'undefined') {
      // Track page changes for funnel progression
      const originalPushState = window.history.pushState
      const originalReplaceState = window.history.replaceState

      window.history.pushState = (...args) => {
        originalPushState.apply(window.history, args)
        this.checkFunnelProgression()
      }

      window.history.replaceState = (...args) => {
        originalReplaceState.apply(window.history, args)
        this.checkFunnelProgression()
      }

      window.addEventListener('popstate', () => {
        this.checkFunnelProgression()
      })
    }
  }

  private async checkFunnelProgression(): Promise<void> {
    const currentPath = window.location.pathname
    const sessionId = userJourneyAnalytics['currentSession']

    if (!sessionId) {
      return
    }

    // Check each active funnel to see if current page matches any step
    for (const [funnelId, funnel] of this.activeFunnels) {
      const progress = this.getUserProgress(sessionId, funnelId)

      if (progress && !progress.completed) {
        // Find matching step
        const matchingStep = funnel.steps.find(step => {
          return new RegExp(step.page_pattern).test(currentPath)
        })

        if (matchingStep) {
          await this.trackStepProgress(sessionId, funnelId, matchingStep.id)
        }
      }
    }
  }

  private getUserProgress(sessionId: string, funnelId: string): FunnelProgress | null {
    const sessionProgress = this.userProgress.get(sessionId)
    if (!sessionProgress) {
      return null
    }

    return sessionProgress.find(p => p.funnel_id === funnelId) || null
  }

  private async trackConversionEvent(eventData: Omit<ConversionEvent, 'id' | 'timestamp'>): Promise<void> {
    const event: ConversionEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...eventData
    }

    const { error } = await supabase
      .from('conversion_events')
      .insert([event])

    if (error) {
      console.error('Failed to track conversion event:', error)
    }
  }

  private analyzeFunnelData(funnel: FunnelDefinition, events: ConversionEvent[], dateRange: { start: Date; end: Date }): FunnelAnalyticsData {
    const entries = events.filter(e => e.event_type === 'enter').length
    const completions = events.filter(e => e.event_type === 'complete').length
    const conversionRate = entries > 0 ? completions / entries : 0

    // Calculate completion times
    const completionTimes: number[] = []
    const sessionCompletions = new Map<string, Date>()
    const sessionStarts = new Map<string, Date>()

    events.forEach(event => {
      if (event.event_type === 'enter') {
        sessionStarts.set(event.session_id, event.timestamp)
      } else if (event.event_type === 'complete') {
        sessionCompletions.set(event.session_id, event.timestamp)
      }
    })

    sessionCompletions.forEach((completionTime, sessionId) => {
      const startTime = sessionStarts.get(sessionId)
      if (startTime) {
        completionTimes.push(completionTime.getTime() - startTime.getTime())
      }
    })

    const avgCompletionTime = completionTimes.length > 0 ?
      completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length : 0

    // Calculate step performance
    const stepPerformance = funnel.steps.map(step => {
      const stepEntries = events.filter(e => e.step_id === step.id && e.event_type !== 'drop_off').length
      const stepCompletions = events.filter(e => e.step_id === step.id && (e.event_type === 'complete' || e.event_type === 'progress')).length
      const stepDropOffs = events.filter(e => e.step_id === step.id && e.event_type === 'drop_off').length

      return {
        step_id: step.id,
        step_name: step.name,
        entries: stepEntries,
        completions: stepCompletions,
        drop_offs: stepDropOffs,
        conversion_rate: stepEntries > 0 ? stepCompletions / stepEntries : 0,
        average_time_spent: 0, // Would need more detailed timing data
        most_common_drop_reasons: this.getCommonDropReasons(events, step.id)
      }
    })

    return {
      funnel_id: funnel.id,
      date_range: dateRange,
      total_entries: entries,
      total_completions: completions,
      overall_conversion_rate: conversionRate,
      average_completion_time: avgCompletionTime,
      step_performance: stepPerformance,
      conversion_segments: this.analyzeConversionSegments(events),
      optimization_recommendations: this.generateOptimizationRecommendations(stepPerformance, conversionRate)
    }
  }

  private getCommonDropReasons(events: ConversionEvent[], stepId: string): string[] {
    const dropEvents = events.filter(e => e.step_id === stepId && e.event_type === 'drop_off')
    const reasonCounts = new Map<string, number>()

    dropEvents.forEach(event => {
      const reason = event.metadata?.reason || 'Unknown'
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1)
    })

    return Array.from(reasonCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason]) => reason)
  }

  private analyzeConversionSegments(events: ConversionEvent[]): Array<{
    segment_name: string
    entries: number
    conversion_rate: number
    characteristics: string[]
  }> {
    // Basic segmentation - could be enhanced with user data
    return [
      {
        segment_name: 'All Users',
        entries: events.filter(e => e.event_type === 'enter').length,
        conversion_rate: events.filter(e => e.event_type === 'complete').length /
                        Math.max(1, events.filter(e => e.event_type === 'enter').length),
        characteristics: ['General population']
      }
    ]
  }

  private generateOptimizationRecommendations(stepPerformance: any[], overallConversionRate: number): string[] {
    const recommendations: string[] = []

    // Find bottleneck steps
    const bottleneckSteps = stepPerformance.filter(step => step.conversion_rate < 0.5)
    if (bottleneckSteps.length > 0) {
      recommendations.push(`Optimize step: ${bottleneckSteps[0].step_name} (${(bottleneckSteps[0].conversion_rate * 100).toFixed(1)}% conversion rate)`)
    }

    // Overall conversion rate suggestions
    if (overallConversionRate < 0.1) {
      recommendations.push('Consider simplifying the funnel flow or improving value proposition')
    } else if (overallConversionRate > 0.3) {
      recommendations.push('High-performing funnel - test incremental improvements')
    }

    // Drop-off analysis
    const highDropOffSteps = stepPerformance.filter(step => step.drop_offs > step.completions)
    if (highDropOffSteps.length > 0) {
      recommendations.push(`Investigate high drop-off at: ${highDropOffSteps[0].step_name}`)
    }

    return recommendations
  }
}

export const conversionFunnelTracker = ConversionFunnelTracker.getInstance()