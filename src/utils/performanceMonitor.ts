/**
 * Performance Monitor for Upgrade Tree
 * Phase 7: Performance optimization and monitoring
 */

interface PerformanceMetrics {
  renderTime: number
  nodeCount: number
  connectionCount: number
  memoryUsage: number
  frameRate: number
  lastUpdate: number
}

interface PerformanceEntry {
  name: string
  startTime: number
  duration?: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    nodeCount: 0,
    connectionCount: 0,
    memoryUsage: 0,
    frameRate: 0,
    lastUpdate: Date.now()
  }

  private entries: PerformanceEntry[] = []
  private frameCount = 0
  private lastFrameTime = 0

  startMeasure(name: string, metadata?: Record<string, any>): string {
    const entry: PerformanceEntry = {
      name,
      startTime: performance.now(),
      metadata
    }
    
    this.entries.push(entry)
    return `${name}-${entry.startTime}`
  }

  endMeasure(name: string): number {
    const entry = this.entries.find(e => e.name === name && e.duration === undefined)
    if (entry) {
      entry.duration = performance.now() - entry.startTime
      return entry.duration
    }
    return 0
  }

  updateMetrics(partial: Partial<PerformanceMetrics>) {
    this.metrics = {
      ...this.metrics,
      ...partial,
      lastUpdate: Date.now()
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  getMeasures(name?: string): PerformanceEntry[] {
    return name 
      ? this.entries.filter(e => e.name === name)
      : [...this.entries]
  }

  clearMeasures() {
    this.entries = []
  }

  measureFrameRate() {
    const now = performance.now()
    if (this.lastFrameTime > 0) {
      const delta = now - this.lastFrameTime
      this.frameCount++
      
      // Calculate FPS over last second
      if (this.frameCount >= 60) {
        this.metrics.frameRate = 1000 / (delta / this.frameCount)
        this.frameCount = 0
      }
    }
    this.lastFrameTime = now
  }

  measureMemory(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
      return this.metrics.memoryUsage
    }
    return 0
  }

  getAverageTime(name: string): number {
    const measures = this.getMeasures(name).filter(e => e.duration !== undefined)
    if (measures.length === 0) return 0
    
    const total = measures.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    return total / measures.length
  }
}

const performanceMonitor = new PerformanceMonitor()

export function getPerformanceMonitor(): PerformanceMonitor {
  return performanceMonitor
}

export function withPerformanceTracking<T>(
  name: string, 
  fn: () => T,
  metadata?: Record<string, any>
): T {
  const monitor = getPerformanceMonitor()
  monitor.startMeasure(name, metadata)
  
  try {
    const result = fn()
    monitor.endMeasure(name)
    return result
  } catch (error) {
    monitor.endMeasure(name)
    throw error
  }
}

export function initializePerformanceMonitor() {
  const monitor = getPerformanceMonitor()
  
  // Start frame rate monitoring
  function frameRateLoop() {
    monitor.measureFrameRate()
    requestAnimationFrame(frameRateLoop)
  }
  
  requestAnimationFrame(frameRateLoop)
  
  // Memory monitoring every 5 seconds
  setInterval(() => {
    monitor.measureMemory()
  }, 5000)
  
  return monitor
}
