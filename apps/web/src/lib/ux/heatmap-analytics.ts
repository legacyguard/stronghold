import { supabase } from '@/lib/supabase'

export interface HeatmapDataPoint {
  id: string
  session_id: string
  user_id: string
  page_path: string
  interaction_type: 'click' | 'hover' | 'scroll' | 'rage_click' | 'dead_click'
  x_coordinate: number
  y_coordinate: number
  viewport_width: number
  viewport_height: number
  timestamp: Date
  element_selector?: string
  element_text?: string
  duration_ms?: number
  metadata?: Record<string, any>
}

export interface ScrollDataPoint {
  id: string
  session_id: string
  user_id: string
  page_path: string
  scroll_depth: number
  max_scroll_depth: number
  viewport_height: number
  page_height: number
  time_to_scroll: number
  timestamp: Date
}

export interface HeatmapSettings {
  page_pattern: string
  collection_enabled: boolean
  sample_rate: number
  max_data_points: number
  data_retention_days: number
  excluded_selectors: string[]
  click_radius: number
  scroll_threshold: number
}

export interface HeatmapAnalysis {
  page_path: string
  date_range: { start: Date; end: Date }
  total_sessions: number
  unique_users: number
  click_zones: Array<{
    x: number
    y: number
    intensity: number
    click_count: number
    element_selector?: string
    conversion_rate?: number
  }>
  scroll_behavior: {
    average_scroll_depth: number
    bounce_at_fold: number
    full_page_readers: number
    scroll_pattern: Array<{
      depth_percentage: number
      user_percentage: number
      time_spent: number
    }>
  }
  rage_clicks: Array<{
    x: number
    y: number
    count: number
    element_selector?: string
    sessions_affected: number
  }>
  dead_clicks: Array<{
    x: number
    y: number
    count: number
    element_selector?: string
    sessions_affected: number
  }>
  insights: string[]
  recommendations: string[]
}

export interface ElementAnalytics {
  selector: string
  element_type: string
  total_interactions: number
  unique_users: number
  conversion_rate: number
  average_time_to_interact: number
  interaction_frequency: number
  position_data: {
    x: number
    y: number
    width: number
    height: number
  }
  visibility_analytics: {
    time_in_viewport: number
    scroll_to_view_rate: number
    attention_score: number
  }
}

export class HeatmapAnalytics {
  private static instance: HeatmapAnalytics
  private settings: Map<string, HeatmapSettings> = new Map()
  private isTracking: boolean = false
  private currentSessionId: string | null = null
  private dataBuffer: HeatmapDataPoint[] = []
  private scrollBuffer: ScrollDataPoint[] = []
  private lastScrollPosition: number = 0
  private maxScrollDepth: number = 0
  private pageLoadTime: Date | null = null

  static getInstance(): HeatmapAnalytics {
    if (!HeatmapAnalytics.instance) {
      HeatmapAnalytics.instance = new HeatmapAnalytics()
    }
    return HeatmapAnalytics.instance
  }

  async initialize(sessionId: string, userId?: string): Promise<void> {
    this.currentSessionId = sessionId
    this.pageLoadTime = new Date()
    await this.loadSettings()
    this.setupEventListeners()
    this.startTracking()
  }

  async startTracking(): Promise<void> {
    if (this.isTracking || typeof window === 'undefined') {
      return
    }

    this.isTracking = true
    const currentPath = window.location.pathname

    // Check if tracking is enabled for this page
    const pageSettings = this.getPageSettings(currentPath)
    if (!pageSettings || !pageSettings.collection_enabled) {
      return
    }

    // Apply sampling rate
    if (Math.random() > pageSettings.sample_rate) {
      return
    }

    this.setupClickTracking()
    this.setupScrollTracking()
    this.setupHoverTracking()
    this.setupRageClickDetection()
    this.setupDeadClickDetection()

    // Flush data periodically
    setInterval(() => this.flushData(), 5000)
  }

  async stopTracking(): Promise<void> {
    this.isTracking = false
    await this.flushData()
    this.removeEventListeners()
  }

  async trackClick(event: MouseEvent): Promise<void> {
    if (!this.isTracking || !this.currentSessionId) return

    const target = event.target as HTMLElement
    const rect = target.getBoundingClientRect()

    const dataPoint: HeatmapDataPoint = {
      id: crypto.randomUUID(),
      session_id: this.currentSessionId,
      user_id: this.getCurrentUserId(),
      page_path: window.location.pathname,
      interaction_type: 'click',
      x_coordinate: event.clientX,
      y_coordinate: event.clientY,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      timestamp: new Date(),
      element_selector: this.generateSelector(target),
      element_text: target.textContent?.substring(0, 100) || '',
      metadata: {
        element_tag: target.tagName.toLowerCase(),
        element_id: target.id,
        element_classes: Array.from(target.classList),
        page_url: window.location.href
      }
    }

    this.dataBuffer.push(dataPoint)
  }

  async trackScroll(): Promise<void> {
    if (!this.isTracking || !this.currentSessionId) return

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight
    const viewportHeight = window.innerHeight
    const scrollDepth = scrollTop + viewportHeight
    const scrollPercentage = (scrollDepth / scrollHeight) * 100

    // Update max scroll depth
    this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercentage)

    // Track significant scroll movements
    if (Math.abs(scrollTop - this.lastScrollPosition) > 100) {
      const timeToScroll = this.pageLoadTime ? Date.now() - this.pageLoadTime.getTime() : 0

      const scrollPoint: ScrollDataPoint = {
        id: crypto.randomUUID(),
        session_id: this.currentSessionId,
        user_id: this.getCurrentUserId(),
        page_path: window.location.pathname,
        scroll_depth: scrollPercentage,
        max_scroll_depth: this.maxScrollDepth,
        viewport_height: viewportHeight,
        page_height: scrollHeight,
        time_to_scroll: timeToScroll,
        timestamp: new Date()
      }

      this.scrollBuffer.push(scrollPoint)
      this.lastScrollPosition = scrollTop
    }
  }

  async trackHover(event: MouseEvent): Promise<void> {
    if (!this.isTracking || !this.currentSessionId) return

    const target = event.target as HTMLElement

    // Only track hovers on interactive elements
    if (!this.isInteractiveElement(target)) return

    const dataPoint: HeatmapDataPoint = {
      id: crypto.randomUUID(),
      session_id: this.currentSessionId,
      user_id: this.getCurrentUserId(),
      page_path: window.location.pathname,
      interaction_type: 'hover',
      x_coordinate: event.clientX,
      y_coordinate: event.clientY,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      timestamp: new Date(),
      element_selector: this.generateSelector(target),
      duration_ms: 0 // Will be updated on mouse leave
    }

    this.dataBuffer.push(dataPoint)
  }

  async getHeatmapData(pagePath: string, dateRange: { start: Date; end: Date }): Promise<HeatmapAnalysis> {
    const { data: clickData, error: clickError } = await supabase
      .from('heatmap_data')
      .select('*')
      .eq('page_path', pagePath)
      .gte('timestamp', dateRange.start.toISOString())
      .lte('timestamp', dateRange.end.toISOString())

    const { data: scrollData, error: scrollError } = await supabase
      .from('scroll_data')
      .select('*')
      .eq('page_path', pagePath)
      .gte('timestamp', dateRange.start.toISOString())
      .lte('timestamp', dateRange.end.toISOString())

    if (clickError || scrollError) {
      throw new Error('Failed to fetch heatmap data')
    }

    return this.analyzeHeatmapData(pagePath, dateRange, clickData || [], scrollData || [])
  }

  async getElementAnalytics(selector: string, dateRange: { start: Date; end: Date }): Promise<ElementAnalytics[]> {
    const { data, error } = await supabase
      .from('heatmap_data')
      .select('*')
      .eq('element_selector', selector)
      .gte('timestamp', dateRange.start.toISOString())
      .lte('timestamp', dateRange.end.toISOString())

    if (error) {
      throw new Error(`Failed to fetch element analytics: ${error.message}`)
    }

    return this.analyzeElementData(data || [])
  }

  async getScrollAnalytics(pagePath: string, dateRange: { start: Date; end: Date }): Promise<{
    depth_distribution: Array<{ depth: number; percentage: number }>
    reading_patterns: Array<{ time_range: string; average_depth: number }>
    exit_points: Array<{ depth: number; exit_rate: number }>
  }> {
    const { data, error } = await supabase
      .from('scroll_data')
      .select('*')
      .eq('page_path', pagePath)
      .gte('timestamp', dateRange.start.toISOString())
      .lte('timestamp', dateRange.end.toISOString())

    if (error) {
      throw new Error(`Failed to fetch scroll analytics: ${error.message}`)
    }

    return this.analyzeScrollPatterns(data || [])
  }

  async generateHeatmapVisualization(pagePath: string, dateRange: { start: Date; end: Date }): Promise<{
    click_heatmap: Array<{ x: number; y: number; intensity: number }>
    scroll_map: Array<{ depth: number; intensity: number }>
    attention_map: Array<{ selector: string; attention_score: number }>
  }> {
    const analysis = await this.getHeatmapData(pagePath, dateRange)

    return {
      click_heatmap: analysis.click_zones.map(zone => ({
        x: zone.x,
        y: zone.y,
        intensity: zone.intensity
      })),
      scroll_map: analysis.scroll_behavior.scroll_pattern.map(pattern => ({
        depth: pattern.depth_percentage,
        intensity: pattern.user_percentage
      })),
      attention_map: await this.calculateAttentionMap(pagePath, dateRange)
    }
  }

  private async loadSettings(): Promise<void> {
    const { data, error } = await supabase
      .from('heatmap_settings')
      .select('*')

    if (error) {
      console.error('Failed to load heatmap settings:', error)
      this.setDefaultSettings()
      return
    }

    this.settings.clear()
    data?.forEach(setting => {
      this.settings.set(setting.page_pattern, setting as HeatmapSettings)
    })

    // Set default if none exist
    if (this.settings.size === 0) {
      this.setDefaultSettings()
    }
  }

  private setDefaultSettings(): void {
    const defaultSettings: HeatmapSettings = {
      page_pattern: '.*',
      collection_enabled: true,
      sample_rate: 0.1,
      max_data_points: 10000,
      data_retention_days: 30,
      excluded_selectors: ['.no-track', '[data-no-track]'],
      click_radius: 10,
      scroll_threshold: 50
    }

    this.settings.set('default', defaultSettings)
  }

  private getPageSettings(path: string): HeatmapSettings | null {
    for (const [pattern, settings] of this.settings) {
      if (new RegExp(pattern).test(path)) {
        return settings
      }
    }
    return this.settings.get('default') || null
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return

    // Remove existing listeners first
    this.removeEventListeners()

    // Add new listeners
    window.addEventListener('click', this.handleClick.bind(this), true)
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true })
    window.addEventListener('mouseover', this.handleHover.bind(this), true)
  }

  private removeEventListeners(): void {
    if (typeof window === 'undefined') return

    window.removeEventListener('click', this.handleClick.bind(this), true)
    window.removeEventListener('scroll', this.handleScroll.bind(this))
    window.removeEventListener('mouseover', this.handleHover.bind(this), true)
  }

  private setupClickTracking(): void {
    // Click tracking is handled in setupEventListeners
  }

  private setupScrollTracking(): void {
    // Scroll tracking is handled in setupEventListeners
  }

  private setupHoverTracking(): void {
    // Hover tracking is handled in setupEventListeners
  }

  private setupRageClickDetection(): void {
    let clickHistory: Array<{ x: number; y: number; timestamp: number }> = []

    const originalTrackClick = this.trackClick.bind(this)
    this.trackClick = async (event: MouseEvent) => {
      await originalTrackClick(event)

      const now = Date.now()
      const clickRadius = 50
      const timeWindow = 3000

      // Add current click to history
      clickHistory.push({
        x: event.clientX,
        y: event.clientY,
        timestamp: now
      })

      // Remove old clicks outside time window
      clickHistory = clickHistory.filter(click => now - click.timestamp <= timeWindow)

      // Detect rage click (multiple clicks in small area within time window)
      const nearbyClicks = clickHistory.filter(click => {
        const distance = Math.sqrt(
          Math.pow(click.x - event.clientX, 2) + Math.pow(click.y - event.clientY, 2)
        )
        return distance <= clickRadius
      })

      if (nearbyClicks.length >= 3) {
        await this.trackRageClick(event)
        clickHistory = [] // Reset after detection
      }
    }
  }

  private setupDeadClickDetection(): void {
    // Track clicks that don't result in any page changes
    let pageState = window.location.href

    const checkForDeadClick = async (event: MouseEvent) => {
      const initialState = pageState

      setTimeout(() => {
        if (window.location.href === initialState &&
            !this.hasVisualChange(event.target as HTMLElement)) {
          this.trackDeadClick(event)
        }
      }, 500)
    }

    window.addEventListener('click', checkForDeadClick, true)
  }

  private async handleClick(event: MouseEvent): Promise<void> {
    await this.trackClick(event)
  }

  private async handleScroll(): Promise<void> {
    await this.trackScroll()
  }

  private async handleHover(event: MouseEvent): Promise<void> {
    await this.trackHover(event)
  }

  private async trackRageClick(event: MouseEvent): Promise<void> {
    const target = event.target as HTMLElement

    const dataPoint: HeatmapDataPoint = {
      id: crypto.randomUUID(),
      session_id: this.currentSessionId!,
      user_id: this.getCurrentUserId(),
      page_path: window.location.pathname,
      interaction_type: 'rage_click',
      x_coordinate: event.clientX,
      y_coordinate: event.clientY,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      timestamp: new Date(),
      element_selector: this.generateSelector(target),
      metadata: {
        element_tag: target.tagName.toLowerCase(),
        frustration_indicator: true
      }
    }

    this.dataBuffer.push(dataPoint)
  }

  private async trackDeadClick(event: MouseEvent): Promise<void> {
    const target = event.target as HTMLElement

    const dataPoint: HeatmapDataPoint = {
      id: crypto.randomUUID(),
      session_id: this.currentSessionId!,
      user_id: this.getCurrentUserId(),
      page_path: window.location.pathname,
      interaction_type: 'dead_click',
      x_coordinate: event.clientX,
      y_coordinate: event.clientY,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      timestamp: new Date(),
      element_selector: this.generateSelector(target),
      metadata: {
        element_tag: target.tagName.toLowerCase(),
        usability_issue: true
      }
    }

    this.dataBuffer.push(dataPoint)
  }

  private hasVisualChange(element: HTMLElement): boolean {
    // Simple check for visual changes
    const computedStyle = window.getComputedStyle(element)
    return computedStyle.cursor === 'pointer' ||
           element.tagName.toLowerCase() === 'button' ||
           element.tagName.toLowerCase() === 'a'
  }

  private isInteractiveElement(element: HTMLElement): boolean {
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea']
    const hasClickHandler = element.onclick !== null
    const hasCursor = window.getComputedStyle(element).cursor === 'pointer'

    return interactiveTags.includes(element.tagName.toLowerCase()) ||
           hasClickHandler ||
           hasCursor
  }

  private generateSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`
    }

    let selector = element.tagName.toLowerCase()

    if (element.classList.length > 0) {
      selector += '.' + Array.from(element.classList).join('.')
    }

    // Add nth-child if needed for uniqueness
    const parent = element.parentElement
    if (parent) {
      const siblings = Array.from(parent.children)
      const index = siblings.indexOf(element)
      if (siblings.filter(s => s.tagName === element.tagName).length > 1) {
        selector += `:nth-child(${index + 1})`
      }
    }

    return selector
  }

  private getCurrentUserId(): string {
    // Get from session or context
    return 'anonymous'
  }

  private async flushData(): Promise<void> {
    if (this.dataBuffer.length === 0 && this.scrollBuffer.length === 0) {
      return
    }

    try {
      if (this.dataBuffer.length > 0) {
        const { error: heatmapError } = await supabase
          .from('heatmap_data')
          .insert(this.dataBuffer)

        if (!heatmapError) {
          this.dataBuffer = []
        }
      }

      if (this.scrollBuffer.length > 0) {
        const { error: scrollError } = await supabase
          .from('scroll_data')
          .insert(this.scrollBuffer)

        if (!scrollError) {
          this.scrollBuffer = []
        }
      }
    } catch (error) {
      console.error('Failed to flush heatmap data:', error)
    }
  }

  private analyzeHeatmapData(pagePath: string, dateRange: { start: Date; end: Date },
                           clickData: HeatmapDataPoint[], scrollData: ScrollDataPoint[]): HeatmapAnalysis {
    const totalSessions = new Set(clickData.map(d => d.session_id)).size
    const uniqueUsers = new Set(clickData.map(d => d.user_id)).size

    // Analyze click zones
    const clickZones = this.calculateClickZones(clickData)

    // Analyze scroll behavior
    const scrollBehavior = this.analyzeScrollBehavior(scrollData)

    // Find rage and dead clicks
    const rageClicks = this.analyzeRageClicks(clickData)
    const deadClicks = this.analyzeDeadClicks(clickData)

    return {
      page_path: pagePath,
      date_range: dateRange,
      total_sessions: totalSessions,
      unique_users: uniqueUsers,
      click_zones: clickZones,
      scroll_behavior: scrollBehavior,
      rage_clicks: rageClicks,
      dead_clicks: deadClicks,
      insights: this.generateInsights(clickZones, scrollBehavior, rageClicks, deadClicks),
      recommendations: this.generateRecommendations(clickZones, scrollBehavior, rageClicks, deadClicks)
    }
  }

  private calculateClickZones(clickData: HeatmapDataPoint[]): Array<{
    x: number; y: number; intensity: number; click_count: number; element_selector?: string; conversion_rate?: number
  }> {
    const gridSize = 20
    const zones = new Map<string, { x: number; y: number; count: number; selectors: Set<string> }>()

    clickData.forEach(click => {
      const gridX = Math.floor(click.x_coordinate / gridSize) * gridSize
      const gridY = Math.floor(click.y_coordinate / gridSize) * gridSize
      const key = `${gridX},${gridY}`

      if (!zones.has(key)) {
        zones.set(key, { x: gridX, y: gridY, count: 0, selectors: new Set() })
      }

      const zone = zones.get(key)!
      zone.count++
      if (click.element_selector) {
        zone.selectors.add(click.element_selector)
      }
    })

    const maxCount = Math.max(...Array.from(zones.values()).map(z => z.count))

    return Array.from(zones.values()).map(zone => ({
      x: zone.x,
      y: zone.y,
      intensity: zone.count / maxCount,
      click_count: zone.count,
      element_selector: Array.from(zone.selectors)[0]
    }))
  }

  private analyzeScrollBehavior(scrollData: ScrollDataPoint[]): {
    average_scroll_depth: number
    bounce_at_fold: number
    full_page_readers: number
    scroll_pattern: Array<{ depth_percentage: number; user_percentage: number; time_spent: number }>
  } {
    if (scrollData.length === 0) {
      return {
        average_scroll_depth: 0,
        bounce_at_fold: 0,
        full_page_readers: 0,
        scroll_pattern: []
      }
    }

    const sessions = new Map<string, ScrollDataPoint[]>()
    scrollData.forEach(point => {
      if (!sessions.has(point.session_id)) {
        sessions.set(point.session_id, [])
      }
      sessions.get(point.session_id)!.push(point)
    })

    const maxScrollDepths = Array.from(sessions.values()).map(sessionData => {
      return Math.max(...sessionData.map(d => d.max_scroll_depth))
    })

    const averageScrollDepth = maxScrollDepths.reduce((a, b) => a + b, 0) / maxScrollDepths.length
    const bounceAtFold = maxScrollDepths.filter(depth => depth < 50).length / maxScrollDepths.length
    const fullPageReaders = maxScrollDepths.filter(depth => depth > 90).length / maxScrollDepths.length

    return {
      average_scroll_depth: averageScrollDepth,
      bounce_at_fold: bounceAtFold,
      full_page_readers: fullPageReaders,
      scroll_pattern: this.calculateScrollPattern(scrollData)
    }
  }

  private analyzeRageClicks(clickData: HeatmapDataPoint[]): Array<{
    x: number; y: number; count: number; element_selector?: string; sessions_affected: number
  }> {
    const rageClicks = clickData.filter(d => d.interaction_type === 'rage_click')
    const rageZones = new Map<string, { x: number; y: number; count: number; sessions: Set<string>; selector?: string }>()

    rageClicks.forEach(click => {
      const key = `${Math.floor(click.x_coordinate/20)*20},${Math.floor(click.y_coordinate/20)*20}`

      if (!rageZones.has(key)) {
        rageZones.set(key, {
          x: click.x_coordinate,
          y: click.y_coordinate,
          count: 0,
          sessions: new Set(),
          selector: click.element_selector
        })
      }

      const zone = rageZones.get(key)!
      zone.count++
      zone.sessions.add(click.session_id)
    })

    return Array.from(rageZones.values()).map(zone => ({
      x: zone.x,
      y: zone.y,
      count: zone.count,
      element_selector: zone.selector,
      sessions_affected: zone.sessions.size
    }))
  }

  private analyzeDeadClicks(clickData: HeatmapDataPoint[]): Array<{
    x: number; y: number; count: number; element_selector?: string; sessions_affected: number
  }> {
    const deadClicks = clickData.filter(d => d.interaction_type === 'dead_click')
    const deadZones = new Map<string, { x: number; y: number; count: number; sessions: Set<string>; selector?: string }>()

    deadClicks.forEach(click => {
      const key = `${Math.floor(click.x_coordinate/20)*20},${Math.floor(click.y_coordinate/20)*20}`

      if (!deadZones.has(key)) {
        deadZones.set(key, {
          x: click.x_coordinate,
          y: click.y_coordinate,
          count: 0,
          sessions: new Set(),
          selector: click.element_selector
        })
      }

      const zone = deadZones.get(key)!
      zone.count++
      zone.sessions.add(click.session_id)
    })

    return Array.from(deadZones.values()).map(zone => ({
      x: zone.x,
      y: zone.y,
      count: zone.count,
      element_selector: zone.selector,
      sessions_affected: zone.sessions.size
    }))
  }

  private calculateScrollPattern(scrollData: ScrollDataPoint[]): Array<{
    depth_percentage: number; user_percentage: number; time_spent: number
  }> {
    const depthBuckets = new Map<number, Set<string>>()

    scrollData.forEach(point => {
      const bucket = Math.floor(point.scroll_depth / 10) * 10
      if (!depthBuckets.has(bucket)) {
        depthBuckets.set(bucket, new Set())
      }
      depthBuckets.get(bucket)!.add(point.session_id)
    })

    const totalSessions = new Set(scrollData.map(d => d.session_id)).size

    return Array.from(depthBuckets.entries())
      .map(([depth, sessions]) => ({
        depth_percentage: depth,
        user_percentage: sessions.size / totalSessions,
        time_spent: 0 // Would need more detailed timing data
      }))
      .sort((a, b) => a.depth_percentage - b.depth_percentage)
  }

  private analyzeElementData(data: HeatmapDataPoint[]): ElementAnalytics[] {
    const elementMap = new Map<string, HeatmapDataPoint[]>()

    data.forEach(point => {
      if (point.element_selector) {
        if (!elementMap.has(point.element_selector)) {
          elementMap.set(point.element_selector, [])
        }
        elementMap.get(point.element_selector)!.push(point)
      }
    })

    return Array.from(elementMap.entries()).map(([selector, points]) => ({
      selector,
      element_type: this.getElementType(selector),
      total_interactions: points.length,
      unique_users: new Set(points.map(p => p.user_id)).size,
      conversion_rate: 0, // Would need conversion data
      average_time_to_interact: 0, // Would need timing data
      interaction_frequency: points.length / new Set(points.map(p => p.session_id)).size,
      position_data: this.calculateAveragePosition(points),
      visibility_analytics: {
        time_in_viewport: 0,
        scroll_to_view_rate: 0,
        attention_score: points.length / Math.max(1, new Set(points.map(p => p.session_id)).size)
      }
    }))
  }

  private analyzeScrollPatterns(data: ScrollDataPoint[]): {
    depth_distribution: Array<{ depth: number; percentage: number }>
    reading_patterns: Array<{ time_range: string; average_depth: number }>
    exit_points: Array<{ depth: number; exit_rate: number }>
  } {
    return {
      depth_distribution: [],
      reading_patterns: [],
      exit_points: []
    }
  }

  private async calculateAttentionMap(pagePath: string, dateRange: { start: Date; end: Date }): Promise<Array<{
    selector: string; attention_score: number
  }>> {
    return []
  }

  private getElementType(selector: string): string {
    if (selector.includes('button')) return 'button'
    if (selector.includes('a')) return 'link'
    if (selector.includes('input')) return 'input'
    return 'element'
  }

  private calculateAveragePosition(points: HeatmapDataPoint[]): {
    x: number; y: number; width: number; height: number
  } {
    const avgX = points.reduce((sum, p) => sum + p.x_coordinate, 0) / points.length
    const avgY = points.reduce((sum, p) => sum + p.y_coordinate, 0) / points.length

    return { x: avgX, y: avgY, width: 0, height: 0 }
  }

  private generateInsights(clickZones: any[], scrollBehavior: any, rageClicks: any[], deadClicks: any[]): string[] {
    const insights: string[] = []

    if (scrollBehavior.bounce_at_fold > 0.5) {
      insights.push(`${(scrollBehavior.bounce_at_fold * 100).toFixed(1)}% of users don't scroll past the fold`)
    }

    if (rageClicks.length > 0) {
      insights.push(`${rageClicks.length} rage click zones detected - potential usability issues`)
    }

    if (deadClicks.length > 0) {
      insights.push(`${deadClicks.length} dead click zones found - elements appear clickable but aren't`)
    }

    return insights
  }

  private generateRecommendations(clickZones: any[], scrollBehavior: any, rageClicks: any[], deadClicks: any[]): string[] {
    const recommendations: string[] = []

    if (scrollBehavior.bounce_at_fold > 0.4) {
      recommendations.push('Consider moving important content above the fold')
    }

    if (rageClicks.length > 0) {
      recommendations.push('Investigate and fix elements causing user frustration')
    }

    if (deadClicks.length > 0) {
      recommendations.push('Make non-interactive elements appear less clickable or add functionality')
    }

    return recommendations
  }
}

export const heatmapAnalytics = HeatmapAnalytics.getInstance()