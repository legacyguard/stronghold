import { supabase } from '@/lib/supabase'

export interface UserJourneyEvent {
  id: string
  user_id: string
  session_id: string
  event_type: JourneyEventType
  page_path: string
  timestamp: Date
  duration_ms?: number
  metadata?: Record<string, any>
  funnel_step?: string
  conversion_value?: number
}

export enum JourneyEventType {
  PAGE_VIEW = 'page_view',
  BUTTON_CLICK = 'button_click',
  FORM_START = 'form_start',
  FORM_SUBMIT = 'form_submit',
  FORM_ABANDON = 'form_abandon',
  SCROLL_DEPTH = 'scroll_depth',
  TIME_ON_PAGE = 'time_on_page',
  EXIT = 'exit',
  CONVERSION = 'conversion',
  FUNNEL_ENTER = 'funnel_enter',
  FUNNEL_COMPLETE = 'funnel_complete',
  FUNNEL_DROP = 'funnel_drop'
}

export interface UserJourney {
  session_id: string
  user_id: string
  start_time: Date
  end_time?: Date
  total_duration_ms: number
  page_count: number
  conversion_events: number
  funnel_completed: boolean
  exit_page: string
  entry_page: string
  events: UserJourneyEvent[]
}

export interface JourneyAnalytics {
  total_sessions: number
  unique_users: number
  average_session_duration: number
  bounce_rate: number
  conversion_rate: number
  most_common_paths: Array<{
    path: string[]
    frequency: number
    conversion_rate: number
  }>
  drop_off_points: Array<{
    page: string
    drop_rate: number
    total_visits: number
  }>
  funnel_performance: FunnelAnalytics
}

export interface FunnelAnalytics {
  funnel_name: string
  total_entries: number
  completion_rate: number
  steps: Array<{
    step_name: string
    entries: number
    exits: number
    conversion_rate: number
    average_time_spent: number
  }>
}

export interface UserBehaviorPattern {
  pattern_id: string
  pattern_type: 'conversion' | 'abandonment' | 'exploration' | 'focused'
  frequency: number
  conversion_likelihood: number
  characteristics: string[]
  recommended_optimizations: string[]
}

export class UserJourneyAnalytics {
  private static instance: UserJourneyAnalytics
  private currentSession: string | null = null
  private sessionStartTime: Date | null = null
  private pageStartTime: Date | null = null
  private currentUserId: string | null = null

  static getInstance(): UserJourneyAnalytics {
    if (!UserJourneyAnalytics.instance) {
      UserJourneyAnalytics.instance = new UserJourneyAnalytics()
    }
    return UserJourneyAnalytics.instance
  }

  async initializeSession(userId?: string): Promise<string> {
    this.currentSession = this.generateSessionId()
    this.sessionStartTime = new Date()
    this.currentUserId = userId || null

    // Track session start
    await this.trackEvent({
      event_type: JourneyEventType.PAGE_VIEW,
      page_path: window.location.pathname,
      metadata: {
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    })

    return this.currentSession
  }

  async trackEvent(eventData: Partial<UserJourneyEvent>): Promise<void> {
    if (!this.currentSession) {
      await this.initializeSession()
    }

    const event: UserJourneyEvent = {
      id: crypto.randomUUID(),
      user_id: this.currentUserId || 'anonymous',
      session_id: this.currentSession!,
      timestamp: new Date(),
      ...eventData
    } as UserJourneyEvent

    try {
      const { error } = await supabase
        .from('user_journey_events')
        .insert([event])

      if (error) {
        console.error('Failed to track journey event:', error)
      }
    } catch (error) {
      console.error('Journey tracking error:', error)
    }
  }

  async trackPageView(path: string): Promise<void> {
    // Track previous page duration
    if (this.pageStartTime) {
      const duration = Date.now() - this.pageStartTime.getTime()
      await this.trackEvent({
        event_type: JourneyEventType.TIME_ON_PAGE,
        page_path: window.location.pathname,
        duration_ms: duration
      })
    }

    this.pageStartTime = new Date()

    await this.trackEvent({
      event_type: JourneyEventType.PAGE_VIEW,
      page_path: path
    })
  }

  async trackFormInteraction(formId: string, action: 'start' | 'submit' | 'abandon', fieldData?: Record<string, any>): Promise<void> {
    const eventType = action === 'start' ? JourneyEventType.FORM_START :
                     action === 'submit' ? JourneyEventType.FORM_SUBMIT :
                     JourneyEventType.FORM_ABANDON

    await this.trackEvent({
      event_type: eventType,
      page_path: window.location.pathname,
      metadata: {
        form_id: formId,
        field_data: fieldData
      }
    })
  }

  async trackConversion(conversionType: string, value?: number): Promise<void> {
    await this.trackEvent({
      event_type: JourneyEventType.CONVERSION,
      page_path: window.location.pathname,
      conversion_value: value,
      metadata: {
        conversion_type: conversionType
      }
    })
  }

  async trackFunnelStep(funnelName: string, stepName: string, action: 'enter' | 'complete' | 'drop'): Promise<void> {
    const eventType = action === 'enter' ? JourneyEventType.FUNNEL_ENTER :
                     action === 'complete' ? JourneyEventType.FUNNEL_COMPLETE :
                     JourneyEventType.FUNNEL_DROP

    await this.trackEvent({
      event_type: eventType,
      page_path: window.location.pathname,
      funnel_step: `${funnelName}:${stepName}`,
      metadata: {
        funnel_name: funnelName,
        step_name: stepName
      }
    })
  }

  async trackScrollDepth(depth: number): Promise<void> {
    await this.trackEvent({
      event_type: JourneyEventType.SCROLL_DEPTH,
      page_path: window.location.pathname,
      metadata: {
        scroll_depth: depth,
        page_height: document.body.scrollHeight,
        viewport_height: window.innerHeight
      }
    })
  }

  async getJourneyAnalytics(timeRange: { start: Date; end: Date }): Promise<JourneyAnalytics> {
    const { data: events, error } = await supabase
      .from('user_journey_events')
      .select('*')
      .gte('timestamp', timeRange.start.toISOString())
      .lte('timestamp', timeRange.end.toISOString())
      .order('timestamp', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch journey analytics: ${error.message}`)
    }

    return this.analyzeJourneyData(events || [])
  }

  async getUserJourney(sessionId: string): Promise<UserJourney | null> {
    const { data: events, error } = await supabase
      .from('user_journey_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })

    if (error || !events || events.length === 0) {
      return null
    }

    const firstEvent = events[0]
    const lastEvent = events[events.length - 1]
    const conversionEvents = events.filter(e => e.event_type === JourneyEventType.CONVERSION)
    const funnelCompleted = events.some(e => e.event_type === JourneyEventType.FUNNEL_COMPLETE)

    return {
      session_id: sessionId,
      user_id: firstEvent.user_id,
      start_time: new Date(firstEvent.timestamp),
      end_time: new Date(lastEvent.timestamp),
      total_duration_ms: new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime(),
      page_count: events.filter(e => e.event_type === JourneyEventType.PAGE_VIEW).length,
      conversion_events: conversionEvents.length,
      funnel_completed: funnelCompleted,
      exit_page: lastEvent.page_path,
      entry_page: firstEvent.page_path,
      events: events
    }
  }

  async identifyBehaviorPatterns(timeRange: { start: Date; end: Date }): Promise<UserBehaviorPattern[]> {
    const analytics = await this.getJourneyAnalytics(timeRange)
    const patterns: UserBehaviorPattern[] = []

    // High conversion pattern
    if (analytics.conversion_rate > 0.1) {
      patterns.push({
        pattern_id: 'high_conversion',
        pattern_type: 'conversion',
        frequency: analytics.total_sessions,
        conversion_likelihood: analytics.conversion_rate,
        characteristics: [
          'Users spend optimal time on key pages',
          'Low bounce rate from landing pages',
          'High form completion rates'
        ],
        recommended_optimizations: [
          'Maintain current UX elements',
          'A/B test minor improvements',
          'Scale successful patterns'
        ]
      })
    }

    // High bounce pattern
    if (analytics.bounce_rate > 0.7) {
      patterns.push({
        pattern_id: 'high_bounce',
        pattern_type: 'abandonment',
        frequency: Math.floor(analytics.total_sessions * analytics.bounce_rate),
        conversion_likelihood: 0.02,
        characteristics: [
          'Users leave quickly from landing pages',
          'Low scroll depth',
          'Minimal interaction with CTAs'
        ],
        recommended_optimizations: [
          'Improve landing page relevance',
          'Optimize page load speed',
          'Enhance value proposition clarity'
        ]
      })
    }

    return patterns
  }

  private analyzeJourneyData(events: UserJourneyEvent[]): JourneyAnalytics {
    const sessions = new Map<string, UserJourneyEvent[]>()

    // Group events by session
    events.forEach(event => {
      if (!sessions.has(event.session_id)) {
        sessions.set(event.session_id, [])
      }
      sessions.get(event.session_id)!.push(event)
    })

    const totalSessions = sessions.size
    const uniqueUsers = new Set(events.map(e => e.user_id)).size
    const conversions = events.filter(e => e.event_type === JourneyEventType.CONVERSION).length
    const conversionRate = totalSessions > 0 ? conversions / totalSessions : 0

    // Calculate bounce rate (sessions with only one page view)
    let bounceSessions = 0
    let totalDuration = 0

    sessions.forEach(sessionEvents => {
      const pageViews = sessionEvents.filter(e => e.event_type === JourneyEventType.PAGE_VIEW)
      if (pageViews.length <= 1) {
        bounceSessions++
      }

      if (sessionEvents.length > 1) {
        const duration = new Date(sessionEvents[sessionEvents.length - 1].timestamp).getTime() -
                        new Date(sessionEvents[0].timestamp).getTime()
        totalDuration += duration
      }
    })

    const bounceRate = totalSessions > 0 ? bounceSessions / totalSessions : 0
    const avgSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0

    return {
      total_sessions: totalSessions,
      unique_users: uniqueUsers,
      average_session_duration: avgSessionDuration,
      bounce_rate: bounceRate,
      conversion_rate: conversionRate,
      most_common_paths: this.calculateCommonPaths(sessions),
      drop_off_points: this.calculateDropOffPoints(events),
      funnel_performance: this.analyzeFunnelPerformance(events)
    }
  }

  private calculateCommonPaths(sessions: Map<string, UserJourneyEvent[]>): Array<{path: string[]; frequency: number; conversion_rate: number}> {
    const pathCounts = new Map<string, {count: number; conversions: number}>()

    sessions.forEach(events => {
      const pageViews = events.filter(e => e.event_type === JourneyEventType.PAGE_VIEW)
      if (pageViews.length > 1) {
        const path = pageViews.map(e => e.page_path)
        const pathKey = path.join(' -> ')
        const hasConversion = events.some(e => e.event_type === JourneyEventType.CONVERSION)

        if (!pathCounts.has(pathKey)) {
          pathCounts.set(pathKey, {count: 0, conversions: 0})
        }

        const current = pathCounts.get(pathKey)!
        current.count++
        if (hasConversion) current.conversions++
      }
    })

    return Array.from(pathCounts.entries())
      .map(([pathKey, data]) => ({
        path: pathKey.split(' -> '),
        frequency: data.count,
        conversion_rate: data.count > 0 ? data.conversions / data.count : 0
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
  }

  private calculateDropOffPoints(events: UserJourneyEvent[]): Array<{page: string; drop_rate: number; total_visits: number}> {
    const pageStats = new Map<string, {visits: number; exits: number}>()

    events.forEach(event => {
      if (event.event_type === JourneyEventType.PAGE_VIEW) {
        if (!pageStats.has(event.page_path)) {
          pageStats.set(event.page_path, {visits: 0, exits: 0})
        }
        pageStats.get(event.page_path)!.visits++
      } else if (event.event_type === JourneyEventType.EXIT) {
        if (pageStats.has(event.page_path)) {
          pageStats.get(event.page_path)!.exits++
        }
      }
    })

    return Array.from(pageStats.entries())
      .map(([page, stats]) => ({
        page,
        drop_rate: stats.visits > 0 ? stats.exits / stats.visits : 0,
        total_visits: stats.visits
      }))
      .sort((a, b) => b.drop_rate - a.drop_rate)
      .slice(0, 10)
  }

  private analyzeFunnelPerformance(events: UserJourneyEvent[]): FunnelAnalytics {
    const funnelEvents = events.filter(e => e.funnel_step)

    if (funnelEvents.length === 0) {
      return {
        funnel_name: 'default',
        total_entries: 0,
        completion_rate: 0,
        steps: []
      }
    }

    // For now, return basic funnel analytics
    const entries = funnelEvents.filter(e => e.event_type === JourneyEventType.FUNNEL_ENTER).length
    const completions = funnelEvents.filter(e => e.event_type === JourneyEventType.FUNNEL_COMPLETE).length

    return {
      funnel_name: 'will_generator',
      total_entries: entries,
      completion_rate: entries > 0 ? completions / entries : 0,
      steps: []
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async endSession(): Promise<void> {
    if (this.currentSession && this.pageStartTime) {
      const duration = Date.now() - this.pageStartTime.getTime()
      await this.trackEvent({
        event_type: JourneyEventType.TIME_ON_PAGE,
        page_path: window.location.pathname,
        duration_ms: duration
      })

      await this.trackEvent({
        event_type: JourneyEventType.EXIT,
        page_path: window.location.pathname
      })
    }

    this.currentSession = null
    this.sessionStartTime = null
    this.pageStartTime = null
    this.currentUserId = null
  }
}

export const userJourneyAnalytics = UserJourneyAnalytics.getInstance()