import { supabase } from '@/lib/supabase'
import { userJourneyAnalytics } from './user-journey-analytics'

export interface ABTestVariant {
  id: string
  name: string
  description: string
  weight: number
  config: Record<string, any>
  is_control: boolean
}

export interface ABTest {
  id: string
  name: string
  description: string
  hypothesis: string
  success_metric: string
  start_date: Date
  end_date?: Date
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled'
  traffic_allocation: number
  variants: ABTestVariant[]
  target_audience?: {
    include_rules: Array<{
      field: string
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
      value: any
    }>
    exclude_rules: Array<{
      field: string
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
      value: any
    }>
  }
  created_at: Date
  updated_at: Date
}

export interface TestAssignment {
  user_id: string
  session_id: string
  test_id: string
  variant_id: string
  assigned_at: Date
  converted: boolean
  conversion_value?: number
  conversion_events: ConversionEventData[]
}

export interface ConversionEventData {
  event_type: string
  timestamp: Date
  value?: number
  metadata?: Record<string, any>
}

export interface ABTestResults {
  test_id: string
  test_name: string
  status: string
  duration_days: number
  total_participants: number
  statistical_significance: number
  confidence_level: number
  recommended_action: 'continue' | 'stop_winner' | 'stop_no_winner' | 'need_more_data'
  winner_variant_id?: string
  variants_performance: Array<{
    variant_id: string
    variant_name: string
    participants: number
    conversions: number
    conversion_rate: number
    confidence_interval: {
      lower: number
      upper: number
    }
    lift_vs_control?: number
    statistical_significance: number
    revenue_impact?: number
  }>
  insights: string[]
  recommendations: string[]
}

export interface ExperimentConfig {
  feature_flags: Record<string, boolean>
  ui_variants: Record<string, any>
  content_variants: Record<string, string>
  behavioral_changes: Record<string, any>
}

export class ABTestingEngine {
  private static instance: ABTestingEngine
  private activeTests: Map<string, ABTest> = new Map()
  private userAssignments: Map<string, Map<string, string>> = new Map()

  static getInstance(): ABTestingEngine {
    if (!ABTestingEngine.instance) {
      ABTestingEngine.instance = new ABTestingEngine()
    }
    return ABTestingEngine.instance
  }

  async initialize(): Promise<void> {
    await this.loadActiveTests()
    await this.loadUserAssignments()
  }

  async createTest(testData: Omit<ABTest, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const test: ABTest = {
      id: crypto.randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
      ...testData
    }

    // Validate variant weights sum to 100
    const totalWeight = test.variants.reduce((sum, variant) => sum + variant.weight, 0)
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error('Variant weights must sum to 100')
    }

    // Ensure one control variant
    const controlVariants = test.variants.filter(v => v.is_control)
    if (controlVariants.length !== 1) {
      throw new Error('Test must have exactly one control variant')
    }

    const { error } = await supabase
      .from('ab_tests')
      .insert([test])

    if (error) {
      throw new Error(`Failed to create A/B test: ${error.message}`)
    }

    if (test.status === 'running') {
      this.activeTests.set(test.id, test)
    }

    return test.id
  }

  async startTest(testId: string): Promise<void> {
    const { error } = await supabase
      .from('ab_tests')
      .update({
        status: 'running',
        start_date: new Date(),
        updated_at: new Date()
      })
      .eq('id', testId)

    if (error) {
      throw new Error(`Failed to start test: ${error.message}`)
    }

    await this.loadActiveTests()
  }

  async stopTest(testId: string, reason: 'completed' | 'cancelled' = 'completed'): Promise<void> {
    const { error } = await supabase
      .from('ab_tests')
      .update({
        status: reason,
        end_date: new Date(),
        updated_at: new Date()
      })
      .eq('id', testId)

    if (error) {
      throw new Error(`Failed to stop test: ${error.message}`)
    }

    this.activeTests.delete(testId)
  }

  async assignUserToTest(userId: string, sessionId: string, testId: string): Promise<string | null> {
    const test = this.activeTests.get(testId)
    if (!test || test.status !== 'running') {
      return null
    }

    // Check if user is already assigned
    const existingAssignment = await this.getUserAssignment(userId, testId)
    if (existingAssignment) {
      return existingAssignment.variant_id
    }

    // Check if user qualifies for the test
    if (!(await this.userQualifiesForTest(userId, test))) {
      return null
    }

    // Apply traffic allocation
    if (Math.random() > test.traffic_allocation) {
      return null
    }

    // Assign variant based on weights
    const variantId = this.selectVariantByWeight(test.variants)

    const assignment: TestAssignment = {
      user_id: userId,
      session_id: sessionId,
      test_id: testId,
      variant_id: variantId,
      assigned_at: new Date(),
      converted: false,
      conversion_events: []
    }

    // Store assignment
    const { error } = await supabase
      .from('test_assignments')
      .insert([assignment])

    if (error) {
      console.error('Failed to store test assignment:', error)
      return null
    }

    // Cache assignment
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map())
    }
    this.userAssignments.get(userId)!.set(testId, variantId)

    return variantId
  }

  async getVariantConfig(userId: string, testId: string): Promise<ExperimentConfig | null> {
    const variantId = await this.getUserVariant(userId, testId)
    if (!variantId) {
      return null
    }

    const test = this.activeTests.get(testId)
    if (!test) {
      return null
    }

    const variant = test.variants.find(v => v.id === variantId)
    if (!variant) {
      return null
    }

    return variant.config as ExperimentConfig
  }

  async trackConversion(userId: string, testId: string, eventType: string, value?: number, metadata?: Record<string, any>): Promise<void> {
    const assignment = await this.getUserAssignment(userId, testId)
    if (!assignment) {
      return
    }

    const conversionEvent: ConversionEventData = {
      event_type: eventType,
      timestamp: new Date(),
      value,
      metadata
    }

    // Update assignment
    assignment.converted = true
    if (value) {
      assignment.conversion_value = (assignment.conversion_value || 0) + value
    }
    assignment.conversion_events.push(conversionEvent)

    // Update database
    const { error } = await supabase
      .from('test_assignments')
      .update({
        converted: assignment.converted,
        conversion_value: assignment.conversion_value,
        conversion_events: assignment.conversion_events
      })
      .eq('user_id', userId)
      .eq('test_id', testId)

    if (error) {
      console.error('Failed to track conversion:', error)
    }

    // Track in user journey
    await userJourneyAnalytics.trackConversion(`ab_test_${testId}_${eventType}`, value)
  }

  async getTestResults(testId: string): Promise<ABTestResults | null> {
    const test = await this.getTest(testId)
    if (!test) {
      return null
    }

    const { data: assignments, error } = await supabase
      .from('test_assignments')
      .select('*')
      .eq('test_id', testId)

    if (error) {
      console.error('Failed to fetch test assignments:', error)
      return null
    }

    return this.calculateTestResults(test, assignments || [])
  }

  async getUserVariant(userId: string, testId: string): Promise<string | null> {
    // Check cache first
    const userTests = this.userAssignments.get(userId)
    if (userTests && userTests.has(testId)) {
      return userTests.get(testId)!
    }

    // Check database
    const assignment = await this.getUserAssignment(userId, testId)
    return assignment?.variant_id || null
  }

  async getRunningTestsForUser(userId: string): Promise<Array<{test_id: string; variant_id: string; config: ExperimentConfig}>> {
    const results: Array<{test_id: string; variant_id: string; config: ExperimentConfig}> = []

    for (const [testId, test] of this.activeTests) {
      const variantId = await this.getUserVariant(userId, testId)
      if (variantId) {
        const variant = test.variants.find(v => v.id === variantId)
        if (variant) {
          results.push({
            test_id: testId,
            variant_id: variantId,
            config: variant.config as ExperimentConfig
          })
        }
      }
    }

    return results
  }

  async generateTestReport(testId: string): Promise<{
    summary: ABTestResults
    detailed_data: any[]
    visualizations: any[]
  } | null> {
    const results = await this.getTestResults(testId)
    if (!results) {
      return null
    }

    // Get detailed assignment data
    const { data: assignments } = await supabase
      .from('test_assignments')
      .select('*')
      .eq('test_id', testId)

    return {
      summary: results,
      detailed_data: assignments || [],
      visualizations: this.generateVisualizationData(results)
    }
  }

  private async loadActiveTests(): Promise<void> {
    const { data, error } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('status', 'running')

    if (error) {
      console.error('Failed to load active tests:', error)
      return
    }

    this.activeTests.clear()
    data?.forEach(test => {
      this.activeTests.set(test.id, test as ABTest)
    })
  }

  private async loadUserAssignments(): Promise<void> {
    const { data, error } = await supabase
      .from('test_assignments')
      .select('user_id, test_id, variant_id')
      .in('test_id', Array.from(this.activeTests.keys()))

    if (error) {
      console.error('Failed to load user assignments:', error)
      return
    }

    this.userAssignments.clear()
    data?.forEach(assignment => {
      if (!this.userAssignments.has(assignment.user_id)) {
        this.userAssignments.set(assignment.user_id, new Map())
      }
      this.userAssignments.get(assignment.user_id)!.set(assignment.test_id, assignment.variant_id)
    })
  }

  private async getTest(testId: string): Promise<ABTest | null> {
    if (this.activeTests.has(testId)) {
      return this.activeTests.get(testId)!
    }

    const { data, error } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('id', testId)
      .single()

    return error ? null : data as ABTest
  }

  private async getUserAssignment(userId: string, testId: string): Promise<TestAssignment | null> {
    const { data, error } = await supabase
      .from('test_assignments')
      .select('*')
      .eq('user_id', userId)
      .eq('test_id', testId)
      .single()

    return error ? null : data as TestAssignment
  }

  private async userQualifiesForTest(userId: string, test: ABTest): Promise<boolean> {
    if (!test.target_audience) {
      return true
    }

    // Get user data for qualification check
    const { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!user) {
      return false
    }

    // Check include rules
    for (const rule of test.target_audience.include_rules) {
      if (!this.evaluateRule(user, rule)) {
        return false
      }
    }

    // Check exclude rules
    for (const rule of test.target_audience.exclude_rules) {
      if (this.evaluateRule(user, rule)) {
        return false
      }
    }

    return true
  }

  private evaluateRule(userData: any, rule: {field: string; operator: string; value: any}): boolean {
    const fieldValue = userData[rule.field]

    switch (rule.operator) {
      case 'equals':
        return fieldValue === rule.value
      case 'not_equals':
        return fieldValue !== rule.value
      case 'contains':
        return String(fieldValue).includes(String(rule.value))
      case 'greater_than':
        return Number(fieldValue) > Number(rule.value)
      case 'less_than':
        return Number(fieldValue) < Number(rule.value)
      default:
        return false
    }
  }

  private selectVariantByWeight(variants: ABTestVariant[]): string {
    const random = Math.random() * 100
    let cumulative = 0

    for (const variant of variants) {
      cumulative += variant.weight
      if (random <= cumulative) {
        return variant.id
      }
    }

    return variants[0].id
  }

  private calculateTestResults(test: ABTest, assignments: TestAssignment[]): ABTestResults {
    const variantStats = new Map<string, {
      participants: number
      conversions: number
      totalValue: number
    }>()

    // Initialize stats for all variants
    test.variants.forEach(variant => {
      variantStats.set(variant.id, {
        participants: 0,
        conversions: 0,
        totalValue: 0
      })
    })

    // Calculate stats from assignments
    assignments.forEach(assignment => {
      const stats = variantStats.get(assignment.variant_id)
      if (stats) {
        stats.participants++
        if (assignment.converted) {
          stats.conversions++
          stats.totalValue += assignment.conversion_value || 0
        }
      }
    })

    const controlVariant = test.variants.find(v => v.is_control)!
    const controlStats = variantStats.get(controlVariant.id)!
    const controlConversionRate = controlStats.participants > 0 ?
      controlStats.conversions / controlStats.participants : 0

    const variantsPerformance = test.variants.map(variant => {
      const stats = variantStats.get(variant.id)!
      const conversionRate = stats.participants > 0 ? stats.conversions / stats.participants : 0

      // Calculate statistical significance (simplified z-test)
      const significance = this.calculateStatisticalSignificance(
        controlStats.conversions, controlStats.participants,
        stats.conversions, stats.participants
      )

      return {
        variant_id: variant.id,
        variant_name: variant.name,
        participants: stats.participants,
        conversions: stats.conversions,
        conversion_rate: conversionRate,
        confidence_interval: this.calculateConfidenceInterval(stats.conversions, stats.participants),
        lift_vs_control: variant.is_control ? undefined :
          controlConversionRate > 0 ? ((conversionRate - controlConversionRate) / controlConversionRate) * 100 : 0,
        statistical_significance: significance,
        revenue_impact: stats.totalValue
      }
    })

    const totalParticipants = assignments.length
    const overallSignificance = Math.max(...variantsPerformance.map(v => v.statistical_significance))

    // Determine winner
    const significantVariants = variantsPerformance.filter(v => v.statistical_significance > 0.95)
    const winner = significantVariants.length > 0 ?
      significantVariants.reduce((best, current) =>
        current.conversion_rate > best.conversion_rate ? current : best
      ) : null

    const durationDays = test.end_date ?
      (test.end_date.getTime() - test.start_date.getTime()) / (1000 * 60 * 60 * 24) :
      (Date.now() - test.start_date.getTime()) / (1000 * 60 * 60 * 24)

    return {
      test_id: test.id,
      test_name: test.name,
      status: test.status,
      duration_days: durationDays,
      total_participants: totalParticipants,
      statistical_significance: overallSignificance,
      confidence_level: 0.95,
      recommended_action: this.getRecommendedAction(overallSignificance, durationDays, totalParticipants),
      winner_variant_id: winner?.variant_id,
      variants_performance: variantsPerformance,
      insights: this.generateInsights(variantsPerformance, test),
      recommendations: this.generateRecommendations(variantsPerformance, overallSignificance)
    }
  }

  private calculateStatisticalSignificance(controlConversions: number, controlTotal: number,
                                         variantConversions: number, variantTotal: number): number {
    if (controlTotal === 0 || variantTotal === 0) return 0

    const p1 = controlConversions / controlTotal
    const p2 = variantConversions / variantTotal
    const pooledP = (controlConversions + variantConversions) / (controlTotal + variantTotal)

    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/controlTotal + 1/variantTotal))
    if (se === 0) return 0

    const z = Math.abs(p1 - p2) / se

    // Convert z-score to confidence level (simplified)
    return Math.min(0.999, 1 - 2 * (1 - this.normalCDF(Math.abs(z))))
  }

  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)))
  }

  private erf(x: number): number {
    const a1 =  0.254829592
    const a2 = -0.284496736
    const a3 =  1.421413741
    const a4 = -1.453152027
    const a5 =  1.061405429
    const p  =  0.3275911

    const sign = x >= 0 ? 1 : -1
    x = Math.abs(x)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return sign * y
  }

  private calculateConfidenceInterval(conversions: number, total: number): {lower: number; upper: number} {
    if (total === 0) return {lower: 0, upper: 0}

    const p = conversions / total
    const z = 1.96 // 95% confidence
    const margin = z * Math.sqrt((p * (1 - p)) / total)

    return {
      lower: Math.max(0, p - margin),
      upper: Math.min(1, p + margin)
    }
  }

  private getRecommendedAction(significance: number, durationDays: number, participants: number):
    'continue' | 'stop_winner' | 'stop_no_winner' | 'need_more_data' {

    if (participants < 100) return 'need_more_data'
    if (significance > 0.95) return 'stop_winner'
    if (durationDays > 30 && significance < 0.8) return 'stop_no_winner'
    return 'continue'
  }

  private generateInsights(variants: any[], test: ABTest): string[] {
    const insights: string[] = []

    const bestVariant = variants.reduce((best, current) =>
      current.conversion_rate > best.conversion_rate ? current : best
    )

    if (bestVariant.lift_vs_control && bestVariant.lift_vs_control > 10) {
      insights.push(`${bestVariant.variant_name} shows ${bestVariant.lift_vs_control.toFixed(1)}% improvement over control`)
    }

    const totalRevenue = variants.reduce((sum, v) => sum + (v.revenue_impact || 0), 0)
    if (totalRevenue > 0) {
      insights.push(`Test generated $${totalRevenue.toLocaleString()} in total revenue`)
    }

    return insights
  }

  private generateRecommendations(variants: any[], significance: number): string[] {
    const recommendations: string[] = []

    if (significance < 0.8) {
      recommendations.push('Consider running the test longer to reach statistical significance')
    }

    const hasWinner = variants.some(v => v.statistical_significance > 0.95 && v.lift_vs_control && v.lift_vs_control > 0)
    if (hasWinner) {
      recommendations.push('Implement the winning variant across all traffic')
    }

    return recommendations
  }

  private generateVisualizationData(results: ABTestResults): any[] {
    return [
      {
        type: 'conversion_rate_comparison',
        data: results.variants_performance.map(v => ({
          variant: v.variant_name,
          conversion_rate: v.conversion_rate,
          confidence_interval: v.confidence_interval
        }))
      },
      {
        type: 'statistical_significance',
        data: results.variants_performance.map(v => ({
          variant: v.variant_name,
          significance: v.statistical_significance
        }))
      }
    ]
  }
}

export const abTestingEngine = ABTestingEngine.getInstance()