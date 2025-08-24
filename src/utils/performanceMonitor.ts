import type { GameDataItem } from '@/types/game-data'

// Performance monitoring interfaces
interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  memoryBefore?: number
  memoryAfter?: number
  metadata?: Record<string, any>
}

interface PerformanceReport {
  sessionId: string
  startTime: number
  endTime: number
  totalDuration: number
  metrics: PerformanceMetric[]
  memoryUsage: MemoryUsageReport
  recommendations: string[]
  bottlenecks: PerformanceBottleneck[]
}

interface MemoryUsageReport {
  initialMemory: number
  peakMemory: number
  finalMemory: number
  memoryLeaks: MemoryLeak[]
  gcEvents: number
}

interface MemoryLeak {
  component: string
  severity: 'minor' | 'moderate' | 'severe'
  description: string
  estimatedSize: number
}

interface PerformanceBottleneck {
  operation: string
  duration: number
  severity: 'minor' | 'moderate' | 'severe' | 'critical'
  impact: string
  recommendation: string
}

interface OptimizationConfig {
  enableCaching: boolean
  cacheSize: number
  enableBatching: boolean
  batchSize: number
  enableLazyLoading: boolean
  enableMemoryOptimization: boolean
  profileMemoryUsage: boolean
  trackRenderTimes: boolean
}

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  INITIAL_RENDER: 1000,      // Initial graph render
  REBUILD_GRAPH: 500,        // Graph rebuild
  POSITION_CALCULATION: 100,  // Single position calculation
  LANE_CALCULATION: 200,     // Lane height calculation
  BOUNDARY_ENFORCEMENT: 50,   // Boundary constraint enforcement
  VALIDATION: 300,           // Position validation
  MEMORY_LEAK_THRESHOLD: 10 * 1024 * 1024, // 10MB
  GC_FREQUENCY_THRESHOLD: 5  // GC events per minute
} as const

class PerformanceMonitor {
  private sessionId: string
  private sessionStartTime: number
  private metrics: Map<string, PerformanceMetric> = new Map()
  private memorySnapshots: number[] = []
  private config: OptimizationConfig
  private cache: Map<string, any> = new Map()
  private batchQueue: Array<() => void> = []
  private batchTimer: number | null = null

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.sessionId = `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.sessionStartTime = performance.now()
    
    this.config = {
      enableCaching: true,
      cacheSize: 100,
      enableBatching: true,
      batchSize: 10,
      enableLazyLoading: false,
      enableMemoryOptimization: true,
      profileMemoryUsage: true,
      trackRenderTimes: true,
      ...config
    }

    this.takeMemorySnapshot('session-start')
    
    // Setup memory monitoring
    if (this.config.profileMemoryUsage) {
      this.setupMemoryMonitoring()
    }
  }

  // Core performance tracking methods
  startMetric(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    }

    if (this.config.profileMemoryUsage) {
      metric.memoryBefore = this.getCurrentMemoryUsage()
    }

    this.metrics.set(name, metric)
  }

  endMetric(name: string): PerformanceMetric | null {
    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`)
      return null
    }

    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime

    if (this.config.profileMemoryUsage) {
      metric.memoryAfter = this.getCurrentMemoryUsage()
    }

    // Check for performance issues
    this.checkPerformanceThreshold(metric)

    return metric
  }

  // Memory monitoring
  private setupMemoryMonitoring(): void {
    // Take memory snapshots periodically
    setInterval(() => {
      this.takeMemorySnapshot('periodic')
    }, 5000) // Every 5 seconds

    // Monitor for memory leaks
    setInterval(() => {
      this.detectMemoryLeaks()
    }, 30000) // Every 30 seconds
  }

  private takeMemorySnapshot(label: string): void {
    const memory = this.getCurrentMemoryUsage()
    this.memorySnapshots.push(memory)
    
    // Keep only last 20 snapshots to prevent memory bloat
    if (this.memorySnapshots.length > 20) {
      this.memorySnapshots.shift()
    }

    if (this.config.profileMemoryUsage && label !== 'periodic') {
      console.log(`📊 Memory snapshot (${label}): ${(memory / 1024 / 1024).toFixed(2)}MB`)
    }
  }

  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  private detectMemoryLeaks(): void {
    if (this.memorySnapshots.length < 5) return

    const recent = this.memorySnapshots.slice(-5)
    const trend = this.calculateMemoryTrend(recent)
    
    if (trend > PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD) {
      console.warn(`🚨 Potential memory leak detected: ${(trend / 1024 / 1024).toFixed(2)}MB increase`)
      this.reportMemoryLeak('general', trend)
    }
  }

  private calculateMemoryTrend(snapshots: number[]): number {
    if (snapshots.length < 2) return 0
    return snapshots[snapshots.length - 1] - snapshots[0]
  }

  private reportMemoryLeak(component: string, size: number): void {
    const severity = size > 50 * 1024 * 1024 ? 'severe' : 
                    size > 20 * 1024 * 1024 ? 'moderate' : 'minor'
    
    console.warn(`Memory leak in ${component}: ${(size / 1024 / 1024).toFixed(2)}MB (${severity})`)
  }

  // Performance threshold checking
  private checkPerformanceThreshold(metric: PerformanceMetric): void {
    if (!metric.duration) return

    const thresholds: Record<string, number> = {
      'initial-render': PERFORMANCE_THRESHOLDS.INITIAL_RENDER,
      'rebuild-graph': PERFORMANCE_THRESHOLDS.REBUILD_GRAPH,
      'position-calculation': PERFORMANCE_THRESHOLDS.POSITION_CALCULATION,
      'lane-calculation': PERFORMANCE_THRESHOLDS.LANE_CALCULATION,
      'boundary-enforcement': PERFORMANCE_THRESHOLDS.BOUNDARY_ENFORCEMENT,
      'validation': PERFORMANCE_THRESHOLDS.VALIDATION
    }

    const threshold = thresholds[metric.name]
    if (threshold && metric.duration > threshold) {
      const severity = metric.duration > threshold * 2 ? 'critical' : 
                      metric.duration > threshold * 1.5 ? 'severe' : 'moderate'
      
      console.warn(`⚠️ Performance threshold exceeded: ${metric.name} took ${metric.duration.toFixed(2)}ms (threshold: ${threshold}ms, severity: ${severity})`)
    }
  }

  // Caching system
  getCached<T>(key: string): T | null {
    if (!this.config.enableCaching) return null
    return this.cache.get(key) || null
  }

  setCached<T>(key: string, value: T): void {
    if (!this.config.enableCaching) return

    // Implement LRU cache
    if (this.cache.size >= this.config.cacheSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, value)
  }

  clearCache(): void {
    this.cache.clear()
    console.log('🗑️ Performance cache cleared')
  }

  // Batching system
  addToBatch(operation: () => void): void {
    if (!this.config.enableBatching) {
      operation()
      return
    }

    this.batchQueue.push(operation)

    if (this.batchQueue.length >= this.config.batchSize) {
      this.processBatch()
    } else if (!this.batchTimer) {
      this.batchTimer = window.setTimeout(() => {
        this.processBatch()
      }, 16) // Next frame
    }
  }

  private processBatch(): void {
    if (this.batchQueue.length === 0) return

    this.startMetric('batch-processing', { operations: this.batchQueue.length })

    const operations = [...this.batchQueue]
    this.batchQueue = []

    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    // Process all operations in batch
    operations.forEach(op => {
      try {
        op()
      } catch (error) {
        console.error('Error in batched operation:', error)
      }
    })

    this.endMetric('batch-processing')
  }

  // Optimization methods
  optimizeForLargeDatasets(itemCount: number): OptimizationConfig {
    const optimizedConfig = { ...this.config }

    if (itemCount > 500) {
      optimizedConfig.enableCaching = true
      optimizedConfig.cacheSize = Math.min(200, itemCount / 5)
      optimizedConfig.enableBatching = true
      optimizedConfig.batchSize = Math.min(20, itemCount / 25)
      optimizedConfig.enableLazyLoading = true
    }

    if (itemCount > 1000) {
      optimizedConfig.enableMemoryOptimization = true
      optimizedConfig.profileMemoryUsage = false // Reduce overhead
    }

    this.config = optimizedConfig
    return optimizedConfig
  }

  // Reporting methods
  generatePerformanceReport(): PerformanceReport {
    const endTime = performance.now()
    const totalDuration = endTime - this.sessionStartTime

    const completedMetrics = Array.from(this.metrics.values())
      .filter(m => m.endTime !== undefined)

    const memoryUsage = this.generateMemoryReport()
    const bottlenecks = this.identifyBottlenecks(completedMetrics)
    const recommendations = this.generateRecommendations(completedMetrics, memoryUsage, bottlenecks)

    return {
      sessionId: this.sessionId,
      startTime: this.sessionStartTime,
      endTime,
      totalDuration,
      metrics: completedMetrics,
      memoryUsage,
      recommendations,
      bottlenecks
    }
  }

  private generateMemoryReport(): MemoryUsageReport {
    const initialMemory = this.memorySnapshots[0] || 0
    const finalMemory = this.memorySnapshots[this.memorySnapshots.length - 1] || 0
    const peakMemory = Math.max(...this.memorySnapshots)

    return {
      initialMemory,
      peakMemory,
      finalMemory,
      memoryLeaks: [], // Would be populated by leak detection
      gcEvents: 0 // Would be tracked if available
    }
  }

  private identifyBottlenecks(metrics: PerformanceMetric[]): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = []

    metrics.forEach(metric => {
      if (!metric.duration) return

      const thresholds: Record<string, number> = {
        'initial-render': PERFORMANCE_THRESHOLDS.INITIAL_RENDER,
        'rebuild-graph': PERFORMANCE_THRESHOLDS.REBUILD_GRAPH,
        'position-calculation': PERFORMANCE_THRESHOLDS.POSITION_CALCULATION,
        'lane-calculation': PERFORMANCE_THRESHOLDS.LANE_CALCULATION,
        'boundary-enforcement': PERFORMANCE_THRESHOLDS.BOUNDARY_ENFORCEMENT,
        'validation': PERFORMANCE_THRESHOLDS.VALIDATION
      }

      const threshold = thresholds[metric.name]
      if (threshold && metric.duration > threshold) {
        const severity = metric.duration > threshold * 2 ? 'critical' : 
                        metric.duration > threshold * 1.5 ? 'severe' : 'moderate'

        bottlenecks.push({
          operation: metric.name,
          duration: metric.duration,
          severity,
          impact: this.getBottleneckImpact(metric.name, severity),
          recommendation: this.getBottleneckRecommendation(metric.name, severity)
        })
      }
    })

    return bottlenecks.sort((a, b) => b.duration - a.duration)
  }

  private getBottleneckImpact(operation: string, severity: string): string {
    const impacts: Record<string, Record<string, string>> = {
      'initial-render': {
        'moderate': 'Slower initial page load',
        'severe': 'Noticeable delay in graph display',
        'critical': 'Significant user experience impact'
      },
      'rebuild-graph': {
        'moderate': 'Minor delay during graph updates',
        'severe': 'Noticeable lag during interactions',
        'critical': 'Poor responsiveness during updates'
      },
      'position-calculation': {
        'moderate': 'Slightly slower positioning',
        'severe': 'Cumulative performance impact',
        'critical': 'Major bottleneck for large datasets'
      }
    }

    return impacts[operation]?.[severity] || 'Performance impact detected'
  }

  private getBottleneckRecommendation(operation: string, severity: string): string {
    const recommendations: Record<string, Record<string, string>> = {
      'initial-render': {
        'moderate': 'Consider lazy loading or progressive rendering',
        'severe': 'Implement virtualization for large datasets',
        'critical': 'Redesign rendering strategy for better performance'
      },
      'rebuild-graph': {
        'moderate': 'Enable caching for repeated calculations',
        'severe': 'Implement incremental updates instead of full rebuilds',
        'critical': 'Consider background processing for heavy operations'
      },
      'position-calculation': {
        'moderate': 'Cache position calculations where possible',
        'severe': 'Optimize positioning algorithms',
        'critical': 'Implement spatial indexing or other advanced optimizations'
      }
    }

    return recommendations[operation]?.[severity] || 'Review and optimize the operation'
  }

  private generateRecommendations(
    metrics: PerformanceMetric[], 
    memoryUsage: MemoryUsageReport, 
    bottlenecks: PerformanceBottleneck[]
  ): string[] {
    const recommendations: string[] = []

    // Performance-based recommendations
    if (bottlenecks.length > 0) {
      recommendations.push(`Address ${bottlenecks.length} performance bottleneck(s)`)
    }

    const avgRenderTime = metrics
      .filter(m => m.name.includes('render') && m.duration)
      .reduce((sum, m) => sum + (m.duration || 0), 0) / 
      metrics.filter(m => m.name.includes('render')).length

    if (avgRenderTime > 500) {
      recommendations.push('Consider implementing progressive rendering')
    }

    // Memory-based recommendations
    const memoryIncrease = memoryUsage.finalMemory - memoryUsage.initialMemory
    if (memoryIncrease > 20 * 1024 * 1024) { // 20MB
      recommendations.push('Monitor for potential memory leaks')
    }

    // Configuration recommendations
    if (!this.config.enableCaching && metrics.length > 10) {
      recommendations.push('Enable caching to improve repeated operations')
    }

    if (!this.config.enableBatching && metrics.some(m => m.name.includes('calculation'))) {
      recommendations.push('Enable batching for calculation-heavy operations')
    }

    return recommendations
  }

  // Cleanup
  cleanup(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
    }
    this.processBatch() // Process any remaining operations
    this.clearCache()
    this.takeMemorySnapshot('session-end')
  }
}

// Global performance monitor instance
let globalPerformanceMonitor: PerformanceMonitor | null = null

// Feature flag for performance monitoring (disabled by default)
const ENABLE_PERFORMANCE_MONITORING = (typeof window !== 'undefined' && (window as any).ENABLE_PERFORMANCE_MONITORING === true)

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!ENABLE_PERFORMANCE_MONITORING) {
    // Return a no-op monitor when disabled
    return createNoOpMonitor()
  }
  
  if (!globalPerformanceMonitor) {
    globalPerformanceMonitor = new PerformanceMonitor()
  }
  return globalPerformanceMonitor
}

// No-op monitor for when performance monitoring is disabled
function createNoOpMonitor(): PerformanceMonitor {
  return {
    startMetric: () => {},
    endMetric: () => null,
    getCached: () => null,
    setCached: () => {},
    clearCache: () => {},
    addToBatch: (op) => op(), // Execute immediately
    optimizeForLargeDatasets: () => ({}),
    generatePerformanceReport: () => ({
      sessionId: 'disabled',
      startTime: 0,
      endTime: 0,
      totalDuration: 0,
      metrics: [],
      memoryUsage: { initialMemory: 0, peakMemory: 0, finalMemory: 0, memoryLeaks: [], gcEvents: 0 },
      recommendations: [],
      bottlenecks: []
    }),
    cleanup: () => {}
  } as any
}

export function initializePerformanceMonitor(config?: Partial<OptimizationConfig>): PerformanceMonitor {
  globalPerformanceMonitor = new PerformanceMonitor(config)
  return globalPerformanceMonitor
}

export function cleanupPerformanceMonitor(): void {
  if (globalPerformanceMonitor) {
    globalPerformanceMonitor.cleanup()
    globalPerformanceMonitor = null
  }
}

// Utility functions for common performance patterns
export function withPerformanceTracking<T>(
  name: string, 
  operation: () => T, 
  metadata?: Record<string, any>
): T {
  const monitor = getPerformanceMonitor()
  monitor.startMetric(name, metadata)
  
  try {
    const result = operation()
    monitor.endMetric(name)
    return result
  } catch (error) {
    monitor.endMetric(name)
    throw error
  }
}

export async function withAsyncPerformanceTracking<T>(
  name: string, 
  operation: () => Promise<T>, 
  metadata?: Record<string, any>
): Promise<T> {
  const monitor = getPerformanceMonitor()
  monitor.startMetric(name, metadata)
  
  try {
    const result = await operation()
    monitor.endMetric(name)
    return result
  } catch (error) {
    monitor.endMetric(name)
    throw error
  }
}

export {
  PerformanceMonitor,
  type PerformanceMetric,
  type PerformanceReport,
  type MemoryUsageReport,
  type PerformanceBottleneck,
  type OptimizationConfig,
  PERFORMANCE_THRESHOLDS
}