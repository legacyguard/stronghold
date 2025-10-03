import { supabase } from '@/lib/supabase'
import { userJourneyAnalytics } from '../ux/user-journey-analytics'
import { conversionAnalyticsIntegration } from '../ux/conversion-analytics-integration'

export interface ContentVariant {
  id: string
  content_id: string
  variant_name: string
  content_type: 'text' | 'image' | 'video' | 'component' | 'layout'
  content_data: Record<string, any>
  target_audience: {
    demographics?: {
      age_range?: [number, number]
      location?: string[]
      interests?: string[]
    }
    behavior?: {
      visit_frequency?: 'first_time' | 'returning' | 'frequent'
      conversion_stage?: 'awareness' | 'consideration' | 'decision' | 'retention'
      engagement_level?: 'low' | 'medium' | 'high'
    }
    context?: {
      device_type?: 'mobile' | 'tablet' | 'desktop'
      time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night'
      session_duration?: 'short' | 'medium' | 'long'
    }
  }
  performance_metrics: {
    impressions: number
    clicks: number
    conversions: number
    engagement_time: number
    bounce_rate: number
  }
  created_at: Date
  updated_at: Date
  is_active: boolean
}

export interface ContentExperiment {
  id: string
  name: string
  description: string
  content_id: string
  variants: ContentVariant[]
  allocation_strategy: 'equal' | 'performance_based' | 'custom'
  optimization_goal: 'engagement' | 'conversion' | 'retention' | 'revenue'
  start_date: Date
  end_date?: Date
  status: 'draft' | 'running' | 'paused' | 'completed'
  statistical_confidence: number
  winning_variant_id?: string
}

export interface UserProfile {
  user_id: string
  demographics: {
    age?: number
    location?: string
    language?: string
    timezone?: string
  }
  behavior_profile: {
    visit_frequency: number
    avg_session_duration: number
    pages_per_session: number
    conversion_events: string[]
    preferred_content_types: string[]
    engagement_patterns: Record<string, number>
  }
  preferences: {
    content_style?: 'formal' | 'casual' | 'technical' | 'simplified'
    communication_tone?: 'professional' | 'friendly' | 'urgent' | 'supportive'
    information_density?: 'brief' | 'detailed' | 'comprehensive'
  }
  context: {
    current_device: string
    current_location?: string
    session_start: Date
    referrer_source?: string
  }
  personalization_score: number
  last_updated: Date
}

export interface ContentRecommendation {
  content_id: string
  variant_id: string
  confidence_score: number
  reasoning: string[]
  expected_performance: {
    click_probability: number
    conversion_probability: number
    engagement_score: number
  }
  personalization_factors: string[]
}

export interface ContentPerformanceAnalysis {
  content_id: string
  variant_performance: Array<{
    variant_id: string
    metrics: {
      ctr: number
      conversion_rate: number
      engagement_rate: number
      bounce_rate: number
      revenue_per_impression: number
    }
    audience_breakdown: Record<string, number>
    performance_trend: Array<{
      date: string
      impressions: number
      conversions: number
    }>
  }>
  optimization_recommendations: Array<{
    type: 'audience_targeting' | 'content_variation' | 'timing' | 'placement'
    recommendation: string
    expected_impact: string
    confidence: number
  }>
  insights: string[]
}

export class DynamicContentOptimizer {
  private static instance: DynamicContentOptimizer
  private userProfiles: Map<string, UserProfile> = new Map()
  private activeExperiments: Map<string, ContentExperiment> = new Map()
  private contentVariants: Map<string, ContentVariant[]> = new Map()

  static getInstance(): DynamicContentOptimizer {
    if (!DynamicContentOptimizer.instance) {
      DynamicContentOptimizer.instance = new DynamicContentOptimizer()
    }
    return DynamicContentOptimizer.instance
  }

  async initialize(): Promise<void> {
    await this.loadActiveExperiments()
    await this.loadContentVariants()
    this.setupRealTimeOptimization()
  }

  async createContentExperiment(experiment: Omit<ContentExperiment, 'id' | 'created_at' | 'statistical_confidence'>): Promise<string> {
    const experimentId = crypto.randomUUID()

    const newExperiment: ContentExperiment = {
      id: experimentId,
      statistical_confidence: 0,
      ...experiment
    }

    const { error } = await supabase
      .from('content_experiments')
      .insert([newExperiment])

    if (error) {
      throw new Error(`Failed to create content experiment: ${error.message}`)
    }

    this.activeExperiments.set(experimentId, newExperiment)
    return experimentId
  }

  async createContentVariant(variant: Omit<ContentVariant, 'id' | 'created_at' | 'updated_at' | 'performance_metrics'>): Promise<string> {
    const variantId = crypto.randomUUID()

    const newVariant: ContentVariant = {
      id: variantId,
      created_at: new Date(),
      updated_at: new Date(),
      performance_metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        engagement_time: 0,
        bounce_rate: 0
      },
      ...variant
    }

    const { error } = await supabase
      .from('content_variants')
      .insert([newVariant])

    if (error) {
      throw new Error(`Failed to create content variant: ${error.message}`)
    }

    // Add to content variants map
    if (!this.contentVariants.has(variant.content_id)) {
      this.contentVariants.set(variant.content_id, [])
    }
    this.contentVariants.get(variant.content_id)!.push(newVariant)

    return variantId
  }

  async getOptimalContent(contentId: string, userId: string, context: Record<string, any>): Promise<ContentRecommendation | null> {
    const userProfile = await this.getUserProfile(userId)
    const variants = this.contentVariants.get(contentId) || []

    if (variants.length === 0) {
      return null
    }

    // Score each variant based on user profile and context
    const scoredVariants = await Promise.all(
      variants.map(async variant => {
        const score = await this.scoreVariantForUser(variant, userProfile, context)
        return { variant, score }
      })
    )

    // Sort by score and get the best variant
    scoredVariants.sort((a, b) => b.score.confidence_score - a.score.confidence_score)
    const bestVariant = scoredVariants[0]

    if (!bestVariant) {
      return null
    }

    // Track the recommendation
    await this.trackContentImpression(contentId, bestVariant.variant.id, userId)

    return {
      content_id: contentId,
      variant_id: bestVariant.variant.id,
      confidence_score: bestVariant.score.confidence_score,
      reasoning: bestVariant.score.reasoning,
      expected_performance: bestVariant.score.expected_performance,
      personalization_factors: bestVariant.score.personalization_factors
    }
  }

  async trackContentInteraction(contentId: string, variantId: string, userId: string, interactionType: 'click' | 'conversion' | 'engagement', value?: number): Promise<void> {
    // Update variant performance metrics
    const variants = this.contentVariants.get(contentId) || []
    const variant = variants.find(v => v.id === variantId)

    if (variant) {
      switch (interactionType) {
        case 'click':
          variant.performance_metrics.clicks++
          break
        case 'conversion':
          variant.performance_metrics.conversions++
          break
        case 'engagement':
          variant.performance_metrics.engagement_time += value || 0
          break
      }

      // Update in database
      const { error } = await supabase
        .from('content_variants')
        .update({
          performance_metrics: variant.performance_metrics,
          updated_at: new Date()
        })
        .eq('id', variantId)

      if (error) {
        console.error('Failed to update variant metrics:', error)
      }
    }

    // Track interaction event
    const { error: trackingError } = await supabase
      .from('content_interactions')
      .insert([{
        content_id: contentId,
        variant_id: variantId,
        user_id: userId,
        interaction_type: interactionType,
        value: value,
        timestamp: new Date()
      }])

    if (trackingError) {
      console.error('Failed to track content interaction:', error)
    }

    // Update user profile based on interaction
    await this.updateUserProfileFromInteraction(userId, contentId, variantId, interactionType)
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    // Check cache first
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!
    }

    // Load from database
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // Create new user profile
      const newProfile = await this.createUserProfile(userId)
      this.userProfiles.set(userId, newProfile)
      return newProfile
    }

    const profile = data as UserProfile
    this.userProfiles.set(userId, profile)
    return profile
  }

  async getContentPerformanceAnalysis(contentId: string, dateRange: { start: Date; end: Date }): Promise<ContentPerformanceAnalysis> {
    const variants = this.contentVariants.get(contentId) || []

    const variantPerformance = await Promise.all(
      variants.map(async variant => {
        const metrics = await this.calculateVariantMetrics(variant, dateRange)
        const audienceBreakdown = await this.getAudienceBreakdown(variant.id, dateRange)
        const performanceTrend = await this.getPerformanceTrend(variant.id, dateRange)

        return {
          variant_id: variant.id,
          metrics,
          audience_breakdown: audienceBreakdown,
          performance_trend: performanceTrend
        }
      })
    )

    const optimizationRecommendations = this.generateOptimizationRecommendations(variantPerformance)
    const insights = this.generateContentInsights(variantPerformance)

    return {
      content_id: contentId,
      variant_performance: variantPerformance,
      optimization_recommendations: optimizationRecommendations,
      insights
    }
  }

  async optimizeContentAllocation(contentId: string): Promise<void> {
    const analysis = await this.getContentPerformanceAnalysis(contentId, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    })

    // Find best performing variant
    const bestVariant = analysis.variant_performance.reduce((best, current) =>
      current.metrics.conversion_rate > best.metrics.conversion_rate ? current : best
    )

    // Update allocation strategy based on performance
    const experiment = Array.from(this.activeExperiments.values())
      .find(exp => exp.content_id === contentId)

    if (experiment && experiment.allocation_strategy === 'performance_based') {
      // Gradually shift traffic to better performing variants
      await this.updateAllocationWeights(experiment.id, analysis.variant_performance)
    }
  }

  private async loadActiveExperiments(): Promise<void> {
    const { data, error } = await supabase
      .from('content_experiments')
      .select('*')
      .eq('status', 'running')

    if (error) {
      console.error('Failed to load active experiments:', error)
      return
    }

    this.activeExperiments.clear()
    data?.forEach(experiment => {
      this.activeExperiments.set(experiment.id, experiment as ContentExperiment)
    })
  }

  private async loadContentVariants(): Promise<void> {
    const { data, error } = await supabase
      .from('content_variants')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Failed to load content variants:', error)
      return
    }

    this.contentVariants.clear()
    data?.forEach(variant => {
      const typedVariant = variant as ContentVariant
      if (!this.contentVariants.has(typedVariant.content_id)) {
        this.contentVariants.set(typedVariant.content_id, [])
      }
      this.contentVariants.get(typedVariant.content_id)!.push(typedVariant)
    })
  }

  private setupRealTimeOptimization(): void {
    // Set up periodic optimization checks
    setInterval(async () => {
      for (const contentId of this.contentVariants.keys()) {
        await this.optimizeContentAllocation(contentId)
      }
    }, 60 * 60 * 1000) // Every hour
  }

  private async scoreVariantForUser(variant: ContentVariant, userProfile: UserProfile, context: Record<string, any>): Promise<{
    confidence_score: number
    reasoning: string[]
    expected_performance: {
      click_probability: number
      conversion_probability: number
      engagement_score: number
    }
    personalization_factors: string[]
  }> {
    let score = 0.5 // Base score
    const reasoning: string[] = []
    const personalizationFactors: string[] = []

    // Demographic matching
    if (variant.target_audience.demographics) {
      if (variant.target_audience.demographics.age_range && userProfile.demographics.age) {
        const [minAge, maxAge] = variant.target_audience.demographics.age_range
        if (userProfile.demographics.age >= minAge && userProfile.demographics.age <= maxAge) {
          score += 0.15
          reasoning.push('Age demographic match')
          personalizationFactors.push('age')
        }
      }

      if (variant.target_audience.demographics.location && userProfile.demographics.location) {
        if (variant.target_audience.demographics.location.includes(userProfile.demographics.location)) {
          score += 0.1
          reasoning.push('Location targeting match')
          personalizationFactors.push('location')
        }
      }
    }

    // Behavioral matching
    if (variant.target_audience.behavior) {
      if (variant.target_audience.behavior.visit_frequency) {
        const userFrequency = this.categorizeVisitFrequency(userProfile.behavior_profile.visit_frequency)
        if (userFrequency === variant.target_audience.behavior.visit_frequency) {
          score += 0.2
          reasoning.push('Visit frequency match')
          personalizationFactors.push('visit_frequency')
        }
      }

      if (variant.target_audience.behavior.engagement_level) {
        const userEngagement = this.categorizeEngagementLevel(userProfile.behavior_profile.avg_session_duration)
        if (userEngagement === variant.target_audience.behavior.engagement_level) {
          score += 0.15
          reasoning.push('Engagement level match')
          personalizationFactors.push('engagement')
        }
      }
    }

    // Context matching
    if (variant.target_audience.context) {
      if (variant.target_audience.context.device_type && context.device_type) {
        if (variant.target_audience.context.device_type === context.device_type) {
          score += 0.1
          reasoning.push('Device type match')
          personalizationFactors.push('device')
        }
      }

      if (variant.target_audience.context.time_of_day) {
        const currentTime = this.categorizeTimeOfDay(new Date())
        if (variant.target_audience.context.time_of_day === currentTime) {
          score += 0.05
          reasoning.push('Time of day optimization')
          personalizationFactors.push('timing')
        }
      }
    }

    // Historical performance factor
    const performanceBonus = this.calculatePerformanceBonus(variant)
    score += performanceBonus
    if (performanceBonus > 0) {
      reasoning.push('High historical performance')
      personalizationFactors.push('performance_history')
    }

    // Ensure score is between 0 and 1
    score = Math.max(0, Math.min(1, score))

    return {
      confidence_score: score,
      reasoning,
      expected_performance: {
        click_probability: score * 0.8,
        conversion_probability: score * 0.3,
        engagement_score: score * 100
      },
      personalization_factors: personalizationFactors
    }
  }

  private async createUserProfile(userId: string): Promise<UserProfile> {
    const newProfile: UserProfile = {
      user_id: userId,
      demographics: {},
      behavior_profile: {
        visit_frequency: 1,
        avg_session_duration: 0,
        pages_per_session: 1,
        conversion_events: [],
        preferred_content_types: [],
        engagement_patterns: {}
      },
      preferences: {},
      context: {
        current_device: 'unknown',
        session_start: new Date()
      },
      personalization_score: 0.5,
      last_updated: new Date()
    }

    const { error } = await supabase
      .from('user_profiles')
      .insert([newProfile])

    if (error) {
      console.error('Failed to create user profile:', error)
    }

    return newProfile
  }

  private async trackContentImpression(contentId: string, variantId: string, userId: string): Promise<void> {
    // Update impression count
    const variants = this.contentVariants.get(contentId) || []
    const variant = variants.find(v => v.id === variantId)

    if (variant) {
      variant.performance_metrics.impressions++

      const { error } = await supabase
        .from('content_variants')
        .update({
          performance_metrics: variant.performance_metrics,
          updated_at: new Date()
        })
        .eq('id', variantId)

      if (error) {
        console.error('Failed to update impression count:', error)
      }
    }

    // Track impression event
    const { error } = await supabase
      .from('content_interactions')
      .insert([{
        content_id: contentId,
        variant_id: variantId,
        user_id: userId,
        interaction_type: 'impression',
        timestamp: new Date()
      }])

    if (error) {
      console.error('Failed to track impression:', error)
    }
  }

  private async updateUserProfileFromInteraction(userId: string, contentId: string, variantId: string, interactionType: string): Promise<void> {
    const profile = await this.getUserProfile(userId)

    // Update behavior patterns based on interaction
    if (interactionType === 'conversion') {
      profile.behavior_profile.conversion_events.push(contentId)
    }

    // Update engagement patterns
    if (!profile.behavior_profile.engagement_patterns[contentId]) {
      profile.behavior_profile.engagement_patterns[contentId] = 0
    }
    profile.behavior_profile.engagement_patterns[contentId]++

    profile.last_updated = new Date()

    // Update in database
    const { error } = await supabase
      .from('user_profiles')
      .update(profile)
      .eq('user_id', userId)

    if (error) {
      console.error('Failed to update user profile:', error)
    }

    // Update cache
    this.userProfiles.set(userId, profile)
  }

  private categorizeVisitFrequency(frequency: number): 'first_time' | 'returning' | 'frequent' {
    if (frequency === 1) return 'first_time'
    if (frequency <= 5) return 'returning'
    return 'frequent'
  }

  private categorizeEngagementLevel(avgSessionDuration: number): 'low' | 'medium' | 'high' {
    if (avgSessionDuration < 60000) return 'low' // < 1 minute
    if (avgSessionDuration < 300000) return 'medium' // < 5 minutes
    return 'high'
  }

  private categorizeTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = date.getHours()
    if (hour < 6) return 'night'
    if (hour < 12) return 'morning'
    if (hour < 18) return 'afternoon'
    if (hour < 22) return 'evening'
    return 'night'
  }

  private calculatePerformanceBonus(variant: ContentVariant): number {
    const { impressions, clicks, conversions } = variant.performance_metrics

    if (impressions === 0) return 0

    const ctr = clicks / impressions
    const conversionRate = conversions / impressions

    // Normalize and combine metrics
    const ctrBonus = Math.min(0.1, ctr * 10) // Max 0.1 bonus for 1% CTR
    const conversionBonus = Math.min(0.15, conversionRate * 50) // Max 0.15 bonus for 3% conversion

    return ctrBonus + conversionBonus
  }

  private async calculateVariantMetrics(variant: ContentVariant, dateRange: { start: Date; end: Date }): Promise<{
    ctr: number
    conversion_rate: number
    engagement_rate: number
    bounce_rate: number
    revenue_per_impression: number
  }> {
    const { impressions, clicks, conversions } = variant.performance_metrics

    return {
      ctr: impressions > 0 ? clicks / impressions : 0,
      conversion_rate: impressions > 0 ? conversions / impressions : 0,
      engagement_rate: impressions > 0 ? (clicks + conversions) / impressions : 0,
      bounce_rate: variant.performance_metrics.bounce_rate,
      revenue_per_impression: 0 // Would need revenue data
    }
  }

  private async getAudienceBreakdown(variantId: string, dateRange: { start: Date; end: Date }): Promise<Record<string, number>> {
    // Simplified audience breakdown
    return {
      'mobile': 0.6,
      'desktop': 0.4,
      'returning_users': 0.7,
      'new_users': 0.3
    }
  }

  private async getPerformanceTrend(variantId: string, dateRange: { start: Date; end: Date }): Promise<Array<{
    date: string
    impressions: number
    conversions: number
  }>> {
    // Simplified trend data
    return []
  }

  private generateOptimizationRecommendations(variantPerformance: any[]): Array<{
    type: 'audience_targeting' | 'content_variation' | 'timing' | 'placement'
    recommendation: string
    expected_impact: string
    confidence: number
  }> {
    const recommendations: Array<{
      type: 'audience_targeting' | 'content_variation' | 'timing' | 'placement'
      recommendation: string
      expected_impact: string
      confidence: number
    }> = []

    // Find best and worst performing variants
    if (variantPerformance.length > 1) {
      const bestVariant = variantPerformance.reduce((best, current) =>
        current.metrics.conversion_rate > best.metrics.conversion_rate ? current : best
      )

      const worstVariant = variantPerformance.reduce((worst, current) =>
        current.metrics.conversion_rate < worst.metrics.conversion_rate ? current : worst
      )

      if (bestVariant.metrics.conversion_rate > worstVariant.metrics.conversion_rate * 1.5) {
        recommendations.push({
          type: 'content_variation',
          recommendation: 'Allocate more traffic to high-performing variant',
          expected_impact: 'Could improve overall conversion rate by 20-40%',
          confidence: 0.8
        })
      }
    }

    return recommendations
  }

  private generateContentInsights(variantPerformance: any[]): string[] {
    const insights: string[] = []

    const avgConversionRate = variantPerformance.reduce((sum, variant) =>
      sum + variant.metrics.conversion_rate, 0) / variantPerformance.length

    if (avgConversionRate > 0.05) {
      insights.push('Content is performing above average with strong conversion rates')
    } else if (avgConversionRate < 0.01) {
      insights.push('Content may benefit from messaging or targeting optimization')
    }

    return insights
  }

  private async updateAllocationWeights(experimentId: string, variantPerformance: any[]): Promise<void> {
    // Update allocation weights based on performance
    // This would involve updating the experiment configuration
    console.log(`Updating allocation weights for experiment ${experimentId}`)
  }
}

export const dynamicContentOptimizer = DynamicContentOptimizer.getInstance()