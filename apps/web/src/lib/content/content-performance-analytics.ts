import { supabase } from '@/lib/supabase'
import { dynamicContentOptimizer } from './dynamic-content-optimizer'
import { userJourneyAnalytics } from '../ux/user-journey-analytics'

export interface ContentMetrics {
  content_id: string
  content_type: 'page' | 'component' | 'section' | 'element'
  url_pattern: string
  time_period: {
    start: Date
    end: Date
  }
  performance_data: {
    views: number
    unique_views: number
    time_on_content: number
    scroll_depth: number
    interactions: number
    shares: number
    conversions: number
    bounce_rate: number
  }
  engagement_metrics: {
    average_read_time: number
    scroll_completion_rate: number
    interaction_rate: number
    return_visitor_rate: number
    completion_rate: number
  }
  conversion_metrics: {
    conversion_rate: number
    conversion_value: number
    funnel_progression_rate: number
    micro_conversions: number
    attribution_score: number
  }
  quality_indicators: {
    readability_score: number
    sentiment_score: number
    relevance_score: number
    freshness_score: number
    authority_score: number
  }
  audience_insights: {
    primary_demographics: Record<string, number>
    behavior_segments: Record<string, number>
    geographic_distribution: Record<string, number>
    device_breakdown: Record<string, number>
  }
}

export interface ContentComparison {
  content_items: Array<{
    content_id: string
    name: string
    metrics: ContentMetrics
    performance_rank: number
    improvement_potential: number
  }>
  best_performers: Array<{
    content_id: string
    metric: string
    value: number
    benchmark_comparison: number
  }>
  underperformers: Array<{
    content_id: string
    issues: string[]
    recommended_actions: string[]
    priority_level: 'high' | 'medium' | 'low'
  }>
  trends: Array<{
    metric: string
    direction: 'increasing' | 'decreasing' | 'stable'
    change_percentage: number
    significance: number
  }>
}

export interface ContentOptimizationSuggestion {
  content_id: string
  suggestion_type: 'headline' | 'structure' | 'cta' | 'imagery' | 'flow' | 'timing'
  current_state: string
  suggested_change: string
  reasoning: string
  expected_impact: {
    metric: string
    improvement_estimate: number
    confidence_level: number
  }
  implementation_effort: 'low' | 'medium' | 'high'
  priority_score: number
}

export interface ContentROIAnalysis {
  content_id: string
  investment_data: {
    creation_cost: number
    maintenance_cost: number
    promotion_cost: number
    opportunity_cost: number
  }
  return_data: {
    direct_revenue: number
    attributed_revenue: number
    cost_savings: number
    brand_value: number
  }
  efficiency_metrics: {
    roi_percentage: number
    cost_per_conversion: number
    lifetime_value_impact: number
    payback_period_days: number
  }
  optimization_opportunities: Array<{
    area: string
    potential_improvement: number
    investment_required: number
    expected_roi: number
  }>
}

export interface ContentPortfolioAnalysis {
  total_content_pieces: number
  performance_distribution: {
    top_performers: number
    average_performers: number
    underperformers: number
  }
  content_gaps: Array<{
    topic_area: string
    audience_segment: string
    opportunity_score: number
    recommended_content_type: string
  }>
  cannibalization_analysis: Array<{
    competing_content: string[]
    overlap_percentage: number
    recommended_action: string
  }>
  optimization_roadmap: Array<{
    quarter: string
    focus_areas: string[]
    expected_impact: string
    resource_requirements: string
  }>
}

export interface RealTimeContentInsights {
  content_id: string
  current_performance: {
    active_users: number
    engagement_velocity: number
    conversion_momentum: number
    trending_score: number
  }
  anomaly_detection: Array<{
    metric: string
    expected_value: number
    actual_value: number
    deviation_significance: number
    possible_causes: string[]
  }>
  optimization_alerts: Array<{
    alert_type: 'opportunity' | 'warning' | 'critical'
    message: string
    recommended_action: string
    urgency_level: number
  }>
  predictive_insights: Array<{
    prediction_type: string
    forecast_value: number
    confidence_interval: [number, number]
    timeframe: string
  }>
}

export class ContentPerformanceAnalytics {
  private static instance: ContentPerformanceAnalytics
  private contentMetricsCache: Map<string, ContentMetrics> = new Map()
  private realTimeInsights: Map<string, RealTimeContentInsights> = new Map()

  static getInstance(): ContentPerformanceAnalytics {
    if (!ContentPerformanceAnalytics.instance) {
      ContentPerformanceAnalytics.instance = new ContentPerformanceAnalytics()
    }
    return ContentPerformanceAnalytics.instance
  }

  async initialize(): Promise<void> {
    this.setupRealTimeTracking()
    await this.loadExistingMetrics()
  }

  async trackContentPerformance(contentId: string, interactionType: string, metadata: Record<string, any>): Promise<void> {
    const timestamp = new Date()

    // Store interaction in database
    const { error } = await supabase
      .from('content_interactions')
      .insert([{
        content_id: contentId,
        interaction_type: interactionType,
        metadata,
        timestamp,
        user_id: metadata.user_id || 'anonymous',
        session_id: metadata.session_id
      }])

    if (error) {
      console.error('Failed to track content performance:', error)
    }

    // Update real-time insights
    await this.updateRealTimeInsights(contentId, interactionType, metadata)

    // Update cached metrics
    await this.incrementalMetricsUpdate(contentId, interactionType, metadata)
  }

  async getContentMetrics(contentId: string, timeRange: { start: Date; end: Date }): Promise<ContentMetrics> {
    // Check cache first
    const cacheKey = `${contentId}_${timeRange.start.toISOString()}_${timeRange.end.toISOString()}`
    if (this.contentMetricsCache.has(cacheKey)) {
      return this.contentMetricsCache.get(cacheKey)!
    }

    // Calculate metrics from database
    const metrics = await this.calculateContentMetrics(contentId, timeRange)

    // Cache the results
    this.contentMetricsCache.set(cacheKey, metrics)

    return metrics
  }

  async compareContent(contentIds: string[], timeRange: { start: Date; end: Date }): Promise<ContentComparison> {
    const contentMetrics = await Promise.all(
      contentIds.map(async (id, index) => {
        const metrics = await this.getContentMetrics(id, timeRange)
        return {
          content_id: id,
          name: `Content ${index + 1}`, // Would get from content metadata
          metrics,
          performance_rank: 0, // Will be calculated
          improvement_potential: 0 // Will be calculated
        }
      })
    )

    // Calculate performance ranks
    this.calculatePerformanceRanks(contentMetrics)

    // Identify best performers and underperformers
    const bestPerformers = this.identifyBestPerformers(contentMetrics)
    const underperformers = this.identifyUnderperformers(contentMetrics)

    // Calculate trends
    const trends = await this.calculateContentTrends(contentIds, timeRange)

    return {
      content_items: contentMetrics,
      best_performers: bestPerformers,
      underperformers: underperformers,
      trends
    }
  }

  async generateOptimizationSuggestions(contentId: string): Promise<ContentOptimizationSuggestion[]> {
    const metrics = await this.getContentMetrics(contentId, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    })

    const suggestions: ContentOptimizationSuggestion[] = []

    // Analyze headline performance
    if (metrics.engagement_metrics.interaction_rate < 0.1) {
      suggestions.push({
        content_id: contentId,
        suggestion_type: 'headline',
        current_state: 'Low interaction rate detected',
        suggested_change: 'Optimize headline for better engagement',
        reasoning: 'Headlines with action words and emotional triggers typically increase interaction rates by 20-40%',
        expected_impact: {
          metric: 'interaction_rate',
          improvement_estimate: 0.25,
          confidence_level: 0.75
        },
        implementation_effort: 'low',
        priority_score: 0.8
      })
    }

    // Analyze scroll depth
    if (metrics.engagement_metrics.scroll_completion_rate < 0.4) {
      suggestions.push({
        content_id: contentId,
        suggestion_type: 'structure',
        current_state: 'Low scroll completion rate',
        suggested_change: 'Restructure content with better visual hierarchy and shorter paragraphs',
        reasoning: 'Improved content structure can increase scroll completion by 30-50%',
        expected_impact: {
          metric: 'scroll_completion_rate',
          improvement_estimate: 0.35,
          confidence_level: 0.7
        },
        implementation_effort: 'medium',
        priority_score: 0.7
      })
    }

    // Analyze conversion rate
    if (metrics.conversion_metrics.conversion_rate < 0.05) {
      suggestions.push({
        content_id: contentId,
        suggestion_type: 'cta',
        current_state: 'Low conversion rate',
        suggested_change: 'Optimize call-to-action placement and messaging',
        reasoning: 'Strategic CTA placement and compelling copy can improve conversions by 15-30%',
        expected_impact: {
          metric: 'conversion_rate',
          improvement_estimate: 0.2,
          confidence_level: 0.8
        },
        implementation_effort: 'low',
        priority_score: 0.9
      })
    }

    // Sort by priority score
    suggestions.sort((a, b) => b.priority_score - a.priority_score)

    return suggestions
  }

  async analyzeContentROI(contentId: string, timeRange: { start: Date; end: Date }): Promise<ContentROIAnalysis> {
    const metrics = await this.getContentMetrics(contentId, timeRange)

    // Get investment data (would come from content management system)
    const investmentData = {
      creation_cost: 500, // Default values - would be tracked
      maintenance_cost: 50,
      promotion_cost: 200,
      opportunity_cost: 100
    }

    // Calculate return data
    const directRevenue = metrics.conversion_metrics.conversion_value
    const attributedRevenue = directRevenue * 1.3 // Attribution factor
    const costSavings = metrics.performance_data.views * 0.01 // Cost per impression saved
    const brandValue = metrics.engagement_metrics.interaction_rate * 1000 // Brand value estimation

    const returnData = {
      direct_revenue: directRevenue,
      attributed_revenue: attributedRevenue,
      cost_savings: costSavings,
      brand_value: brandValue
    }

    const totalInvestment = Object.values(investmentData).reduce((sum, cost) => sum + cost, 0)
    const totalReturn = Object.values(returnData).reduce((sum, value) => sum + value, 0)

    const efficiencyMetrics = {
      roi_percentage: totalInvestment > 0 ? ((totalReturn - totalInvestment) / totalInvestment) * 100 : 0,
      cost_per_conversion: metrics.conversion_metrics.conversion_rate > 0 ?
        totalInvestment / (metrics.performance_data.conversions || 1) : 0,
      lifetime_value_impact: totalReturn * 0.3,
      payback_period_days: totalReturn > 0 ? (totalInvestment / totalReturn) * 30 : 999
    }

    const optimizationOpportunities = [
      {
        area: 'Conversion Rate',
        potential_improvement: 0.25,
        investment_required: 200,
        expected_roi: 150
      },
      {
        area: 'Engagement',
        potential_improvement: 0.15,
        investment_required: 100,
        expected_roi: 75
      }
    ]

    return {
      content_id: contentId,
      investment_data: investmentData,
      return_data: returnData,
      efficiency_metrics: efficiencyMetrics,
      optimization_opportunities: optimizationOpportunities
    }
  }

  async getPortfolioAnalysis(contentIds: string[]): Promise<ContentPortfolioAnalysis> {
    const timeRange = {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: new Date()
    }

    const allMetrics = await Promise.all(
      contentIds.map(id => this.getContentMetrics(id, timeRange))
    )

    // Calculate performance distribution
    const sortedByPerformance = allMetrics.sort((a, b) =>
      b.conversion_metrics.conversion_rate - a.conversion_metrics.conversion_rate
    )

    const topPerformers = Math.ceil(sortedByPerformance.length * 0.2)
    const underperformers = Math.ceil(sortedByPerformance.length * 0.2)
    const averagePerformers = sortedByPerformance.length - topPerformers - underperformers

    const performanceDistribution = {
      top_performers: topPerformers,
      average_performers: averagePerformers,
      underperformers: underperformers
    }

    // Identify content gaps
    const contentGaps = await this.identifyContentGaps(allMetrics)

    // Analyze cannibalization
    const cannibalizationAnalysis = await this.analyzeCannibalization(allMetrics)

    // Generate optimization roadmap
    const optimizationRoadmap = this.generateOptimizationRoadmap(allMetrics)

    return {
      total_content_pieces: contentIds.length,
      performance_distribution,
      content_gaps,
      cannibalization_analysis,
      optimization_roadmap
    }
  }

  async getRealTimeInsights(contentId: string): Promise<RealTimeContentInsights> {
    if (this.realTimeInsights.has(contentId)) {
      return this.realTimeInsights.get(contentId)!
    }

    // Calculate real-time insights
    const insights = await this.calculateRealTimeInsights(contentId)
    this.realTimeInsights.set(contentId, insights)

    return insights
  }

  private setupRealTimeTracking(): void {
    if (typeof window === 'undefined') return

    // Track page views
    this.trackContentPerformance(window.location.pathname, 'page_view', {
      timestamp: new Date(),
      referrer: document.referrer
    })

    // Track scroll events
    let maxScrollDepth = 0
    window.addEventListener('scroll', () => {
      const scrollDepth = (window.scrollY + window.innerHeight) / document.body.scrollHeight
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth
        this.trackContentPerformance(window.location.pathname, 'scroll', {
          scroll_depth: scrollDepth,
          timestamp: new Date()
        })
      }
    })

    // Track time on page
    const startTime = Date.now()
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Date.now() - startTime
      this.trackContentPerformance(window.location.pathname, 'time_on_page', {
        duration: timeOnPage,
        timestamp: new Date()
      })
    })
  }

  private async loadExistingMetrics(): Promise<void> {
    // Load recent metrics from database to warm cache
    const { data, error } = await supabase
      .from('content_metrics_cache')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (error) {
      console.error('Failed to load existing metrics:', error)
      return
    }

    data?.forEach(metric => {
      this.contentMetricsCache.set(metric.cache_key, metric.data)
    })
  }

  private async calculateContentMetrics(contentId: string, timeRange: { start: Date; end: Date }): Promise<ContentMetrics> {
    // Get interaction data from database
    const { data: interactions, error } = await supabase
      .from('content_interactions')
      .select('*')
      .eq('content_id', contentId)
      .gte('timestamp', timeRange.start.toISOString())
      .lte('timestamp', timeRange.end.toISOString())

    if (error) {
      throw new Error(`Failed to fetch content interactions: ${error.message}`)
    }

    const interactionsData = interactions || []

    // Calculate performance data
    const views = interactionsData.filter(i => i.interaction_type === 'page_view').length
    const uniqueViews = new Set(interactionsData.map(i => i.user_id)).size
    const scrollEvents = interactionsData.filter(i => i.interaction_type === 'scroll')
    const timeEvents = interactionsData.filter(i => i.interaction_type === 'time_on_page')
    const conversions = interactionsData.filter(i => i.interaction_type === 'conversion').length

    const averageTimeOnPage = timeEvents.length > 0
      ? timeEvents.reduce((sum, event) => sum + (event.metadata?.duration || 0), 0) / timeEvents.length
      : 0

    const averageScrollDepth = scrollEvents.length > 0
      ? scrollEvents.reduce((sum, event) => sum + (event.metadata?.scroll_depth || 0), 0) / scrollEvents.length
      : 0

    const performanceData = {
      views,
      unique_views: uniqueViews,
      time_on_content: averageTimeOnPage,
      scroll_depth: averageScrollDepth,
      interactions: interactionsData.filter(i => i.interaction_type === 'click').length,
      shares: interactionsData.filter(i => i.interaction_type === 'share').length,
      conversions,
      bounce_rate: views > 0 ? 1 - (uniqueViews / views) : 0
    }

    // Calculate engagement metrics
    const engagementMetrics = {
      average_read_time: averageTimeOnPage / 1000, // Convert to seconds
      scroll_completion_rate: averageScrollDepth,
      interaction_rate: views > 0 ? performanceData.interactions / views : 0,
      return_visitor_rate: 0, // Would need session tracking
      completion_rate: averageScrollDepth > 0.8 ? 1 : averageScrollDepth
    }

    // Calculate conversion metrics
    const conversionMetrics = {
      conversion_rate: views > 0 ? conversions / views : 0,
      conversion_value: conversions * 50, // Default value per conversion
      funnel_progression_rate: 0.5, // Would calculate from funnel data
      micro_conversions: interactionsData.filter(i => i.interaction_type === 'micro_conversion').length,
      attribution_score: 0.7 // Default attribution score
    }

    // Calculate quality indicators (simplified)
    const qualityIndicators = {
      readability_score: 0.75,
      sentiment_score: 0.6,
      relevance_score: 0.8,
      freshness_score: this.calculateFreshnessScore(contentId),
      authority_score: 0.7
    }

    // Calculate audience insights (simplified)
    const audienceInsights = {
      primary_demographics: { '25-34': 0.4, '35-44': 0.3, '45-54': 0.2, '55+': 0.1 },
      behavior_segments: { 'new_visitors': 0.6, 'returning': 0.4 },
      geographic_distribution: { 'US': 0.5, 'EU': 0.3, 'Other': 0.2 },
      device_breakdown: { 'mobile': 0.6, 'desktop': 0.3, 'tablet': 0.1 }
    }

    return {
      content_id: contentId,
      content_type: 'page', // Would be determined from content metadata
      url_pattern: contentId,
      time_period: timeRange,
      performance_data: performanceData,
      engagement_metrics: engagementMetrics,
      conversion_metrics: conversionMetrics,
      quality_indicators: qualityIndicators,
      audience_insights: audienceInsights
    }
  }

  private async updateRealTimeInsights(contentId: string, interactionType: string, metadata: Record<string, any>): Promise<void> {
    let insights = this.realTimeInsights.get(contentId)

    if (!insights) {
      insights = await this.calculateRealTimeInsights(contentId)
    }

    // Update current performance based on interaction
    switch (interactionType) {
      case 'page_view':
        insights.current_performance.active_users++
        break
      case 'click':
        insights.current_performance.engagement_velocity += 0.1
        break
      case 'conversion':
        insights.current_performance.conversion_momentum += 0.2
        break
    }

    // Update trending score
    insights.current_performance.trending_score = this.calculateTrendingScore(insights.current_performance)

    this.realTimeInsights.set(contentId, insights)
  }

  private async incrementalMetricsUpdate(contentId: string, interactionType: string, metadata: Record<string, any>): Promise<void> {
    // Update cached metrics incrementally for performance
    // This would update specific metrics without recalculating everything
  }

  private calculatePerformanceRanks(contentMetrics: Array<{ content_id: string; metrics: ContentMetrics; performance_rank: number; improvement_potential: number }>): void {
    // Sort by conversion rate and assign ranks
    contentMetrics.sort((a, b) => b.metrics.conversion_metrics.conversion_rate - a.metrics.conversion_metrics.conversion_rate)

    contentMetrics.forEach((item, index) => {
      item.performance_rank = index + 1
      // Calculate improvement potential based on gap to best performer
      const bestPerformance = contentMetrics[0].metrics.conversion_metrics.conversion_rate
      item.improvement_potential = bestPerformance - item.metrics.conversion_metrics.conversion_rate
    })
  }

  private identifyBestPerformers(contentMetrics: Array<{ content_id: string; metrics: ContentMetrics }>): Array<{
    content_id: string
    metric: string
    value: number
    benchmark_comparison: number
  }> {
    const bestPerformers: Array<{
      content_id: string
      metric: string
      value: number
      benchmark_comparison: number
    }> = []

    // Find best conversion rate
    const bestConversion = contentMetrics.reduce((best, current) =>
      current.metrics.conversion_metrics.conversion_rate > best.metrics.conversion_metrics.conversion_rate ? current : best
    )

    bestPerformers.push({
      content_id: bestConversion.content_id,
      metric: 'conversion_rate',
      value: bestConversion.metrics.conversion_metrics.conversion_rate,
      benchmark_comparison: 1.5 // 50% above benchmark
    })

    return bestPerformers
  }

  private identifyUnderperformers(contentMetrics: Array<{ content_id: string; metrics: ContentMetrics }>): Array<{
    content_id: string
    issues: string[]
    recommended_actions: string[]
    priority_level: 'high' | 'medium' | 'low'
  }> {
    const underperformers: Array<{
      content_id: string
      issues: string[]
      recommended_actions: string[]
      priority_level: 'high' | 'medium' | 'low'
    }> = []

    contentMetrics.forEach(item => {
      const issues: string[] = []
      const recommendedActions: string[] = []

      if (item.metrics.conversion_metrics.conversion_rate < 0.02) {
        issues.push('Low conversion rate')
        recommendedActions.push('Optimize call-to-action placement and messaging')
      }

      if (item.metrics.engagement_metrics.scroll_completion_rate < 0.3) {
        issues.push('Poor content engagement')
        recommendedActions.push('Improve content structure and readability')
      }

      if (issues.length > 0) {
        underperformers.push({
          content_id: item.content_id,
          issues,
          recommended_actions: recommendedActions,
          priority_level: issues.length > 2 ? 'high' : issues.length > 1 ? 'medium' : 'low'
        })
      }
    })

    return underperformers
  }

  private async calculateContentTrends(contentIds: string[], timeRange: { start: Date; end: Date }): Promise<Array<{
    metric: string
    direction: 'increasing' | 'decreasing' | 'stable'
    change_percentage: number
    significance: number
  }>> {
    // Simplified trend calculation
    return [
      {
        metric: 'conversion_rate',
        direction: 'increasing',
        change_percentage: 12.5,
        significance: 0.85
      },
      {
        metric: 'engagement_rate',
        direction: 'stable',
        change_percentage: 2.1,
        significance: 0.3
      }
    ]
  }

  private calculateFreshnessScore(contentId: string): number {
    // Simplified freshness calculation
    return 0.8
  }

  private async calculateRealTimeInsights(contentId: string): Promise<RealTimeContentInsights> {
    return {
      content_id: contentId,
      current_performance: {
        active_users: 0,
        engagement_velocity: 0,
        conversion_momentum: 0,
        trending_score: 0
      },
      anomaly_detection: [],
      optimization_alerts: [],
      predictive_insights: []
    }
  }

  private calculateTrendingScore(performance: any): number {
    return (performance.active_users * 0.3 +
            performance.engagement_velocity * 0.4 +
            performance.conversion_momentum * 0.3)
  }

  private async identifyContentGaps(metrics: ContentMetrics[]): Promise<Array<{
    topic_area: string
    audience_segment: string
    opportunity_score: number
    recommended_content_type: string
  }>> {
    return [
      {
        topic_area: 'Advanced Features',
        audience_segment: 'Power Users',
        opportunity_score: 0.8,
        recommended_content_type: 'Tutorial'
      }
    ]
  }

  private async analyzeCannibalization(metrics: ContentMetrics[]): Promise<Array<{
    competing_content: string[]
    overlap_percentage: number
    recommended_action: string
  }>> {
    return [
      {
        competing_content: ['content_1', 'content_2'],
        overlap_percentage: 0.3,
        recommended_action: 'Consolidate similar content pieces'
      }
    ]
  }

  private generateOptimizationRoadmap(metrics: ContentMetrics[]): Array<{
    quarter: string
    focus_areas: string[]
    expected_impact: string
    resource_requirements: string
  }> {
    return [
      {
        quarter: 'Q1 2024',
        focus_areas: ['Conversion Optimization', 'Engagement Improvement'],
        expected_impact: '15-25% improvement in key metrics',
        resource_requirements: '2-3 content specialists, 1 analyst'
      }
    ]
  }
}

export const contentPerformanceAnalytics = ContentPerformanceAnalytics.getInstance()