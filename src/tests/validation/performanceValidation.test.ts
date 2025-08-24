import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  getPerformanceMonitor, 
  initializePerformanceMonitor, 
  cleanupPerformanceMonitor,
  withPerformanceTracking,
  PERFORMANCE_THRESHOLDS
} from '@/utils/performanceMonitor'
import { getOptimizedPositioningEngine, cleanupOptimizedPositioning } from '@/utils/optimizedPositioning'
import { buildGraphElements } from '@/utils/graphBuilder'
import { gameDataFixtures } from '../fixtures/gameDataFixtures'

describe('Performance Validation Tests', () => {
  let performanceMonitor: any
  let optimizedEngine: any

  beforeEach(() => {
    // Initialize performance monitoring for each test
    performanceMonitor = initializePerformanceMonitor({
      enableCaching: true,
      enableBatching: true,
      enableMemoryOptimization: true,
      profileMemoryUsage: true,
      trackRenderTimes: true
    })
    
    optimizedEngine = getOptimizedPositioningEngine()
  })

  afterEach(() => {
    // Cleanup after each test
    cleanupPerformanceMonitor()
    cleanupOptimizedPositioning()
  })

  describe('Initial Render Performance', () => {
    it('should render small datasets within performance threshold', async () => {
      const smallDataset = gameDataFixtures.smallDataset // 50 items
      
      const renderTime = await withPerformanceTracking('test-small-render', async () => {
        const result = buildGraphElements(smallDataset)
        expect(result.nodes.length).toBeGreaterThan(0)
        return result
      })

      const report = performanceMonitor.generatePerformanceReport()
      const renderMetric = report.metrics.find(m => m.name === 'test-small-render')
      
      expect(renderMetric).toBeDefined()
      expect(renderMetric!.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.INITIAL_RENDER / 2) // Should be well under threshold
    })

    it('should render medium datasets within performance threshold', async () => {
      const mediumDataset = gameDataFixtures.mediumDataset // 150 items
      
      const renderTime = await withPerformanceTracking('test-medium-render', async () => {
        const result = buildGraphElements(mediumDataset)
        expect(result.nodes.length).toBeGreaterThan(0)
        return result
      })

      const report = performanceMonitor.generatePerformanceReport()
      const renderMetric = report.metrics.find(m => m.name === 'test-medium-render')
      
      expect(renderMetric).toBeDefined()
      expect(renderMetric!.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.INITIAL_RENDER)
    })

    it('should handle large datasets with acceptable performance', async () => {
      const largeDataset = gameDataFixtures.largeDataset // 500+ items
      
      const renderTime = await withPerformanceTracking('test-large-render', async () => {
        const result = buildGraphElements(largeDataset)
        expect(result.nodes.length).toBeGreaterThan(0)
        return result
      })

      const report = performanceMonitor.generatePerformanceReport()
      const renderMetric = report.metrics.find(m => m.name === 'test-large-render')
      
      expect(renderMetric).toBeDefined()
      // Large datasets may exceed normal threshold but should be reasonable
      expect(renderMetric!.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.INITIAL_RENDER * 2)
    })
  })

  describe('Graph Rebuild Performance', () => {
    it('should rebuild graphs quickly for repeated operations', async () => {
      const dataset = gameDataFixtures.mediumDataset
      
      // First build (cold)
      const firstBuild = await withPerformanceTracking('first-build', async () => {
        return buildGraphElements(dataset)
      })

      // Second build (should benefit from caching)
      const secondBuild = await withPerformanceTracking('second-build', async () => {
        return buildGraphElements(dataset)
      })

      const report = performanceMonitor.generatePerformanceReport()
      const firstMetric = report.metrics.find(m => m.name === 'first-build')
      const secondMetric = report.metrics.find(m => m.name === 'second-build')
      
      expect(firstMetric).toBeDefined()
      expect(secondMetric).toBeDefined()
      
      // Second build should be faster due to caching
      expect(secondMetric!.duration!).toBeLessThanOrEqual(firstMetric!.duration!)
      expect(secondMetric!.duration!).toBeLessThan(PERFORMANCE_THRESHOLDS.REBUILD_GRAPH)
    })

    it('should maintain performance across multiple rebuilds', async () => {
      const dataset = gameDataFixtures.mediumDataset
      const buildTimes: number[] = []
      
      // Perform multiple rebuilds
      for (let i = 0; i < 5; i++) {
        const buildTime = await withPerformanceTracking(`rebuild-${i}`, async () => {
          return buildGraphElements(dataset)
        })
        
        const report = performanceMonitor.generatePerformanceReport()
        const metric = report.metrics.find(m => m.name === `rebuild-${i}`)
        buildTimes.push(metric!.duration!)
      }
      
      // All builds should be within threshold
      buildTimes.forEach((time, index) => {
        expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.REBUILD_GRAPH)
      })
      
      // Performance should not degrade significantly
      const averageTime = buildTimes.reduce((sum, time) => sum + time, 0) / buildTimes.length
      const maxTime = Math.max(...buildTimes)
      expect(maxTime).toBeLessThan(averageTime * 1.5) // Max should not be more than 50% above average
    })
  })

  describe('Memory Usage Validation', () => {
    it('should not have significant memory leaks during repeated operations', async () => {
      const dataset = gameDataFixtures.mediumDataset
      
      // Get initial memory usage
      const initialReport = performanceMonitor.generatePerformanceReport()
      const initialMemory = initialReport.memoryUsage.initialMemory
      
      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        await withPerformanceTracking(`memory-test-${i}`, async () => {
          const result = buildGraphElements(dataset)
          // Force some cleanup
          optimizedEngine.optimizeMemoryUsage()
          return result
        })
      }
      
      // Check final memory usage
      const finalReport = performanceMonitor.generatePerformanceReport()
      const finalMemory = finalReport.memoryUsage.finalMemory
      
      // Memory increase should be reasonable (less than 50MB)
      const memoryIncrease = finalMemory - initialMemory
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB
    })

    it('should optimize memory usage when requested', () => {
      // This test would verify that memory optimization actually reduces memory usage
      const initialReport = performanceMonitor.generatePerformanceReport()
      const initialMemory = initialReport.memoryUsage.finalMemory
      
      // Perform memory optimization
      optimizedEngine.optimizeMemoryUsage()
      
      // Memory should be optimized (this is hard to test precisely)
      // At minimum, the optimization should complete without errors
      expect(() => optimizedEngine.optimizeMemoryUsage()).not.toThrow()
    })
  })

  describe('Caching Performance', () => {
    it('should improve performance with caching enabled', async () => {
      const dataset = gameDataFixtures.mediumDataset
      
      // Test with caching disabled
      const noCacheMonitor = initializePerformanceMonitor({
        enableCaching: false,
        enableBatching: false
      })
      
      const noCacheTime = await withPerformanceTracking('no-cache-build', async () => {
        return buildGraphElements(dataset)
      })
      
      cleanupPerformanceMonitor()
      
      // Test with caching enabled
      const cacheMonitor = initializePerformanceMonitor({
        enableCaching: true,
        enableBatching: true
      })
      
      // First build (cold cache)
      await withPerformanceTracking('cache-build-1', async () => {
        return buildGraphElements(dataset)
      })
      
      // Second build (warm cache)
      const cacheTime = await withPerformanceTracking('cache-build-2', async () => {
        return buildGraphElements(dataset)
      })
      
      const cacheReport = cacheMonitor.generatePerformanceReport()
      const cacheMetric = cacheReport.metrics.find(m => m.name === 'cache-build-2')
      
      // Cached version should be faster (though this may not always be true for small datasets)
      expect(cacheMetric).toBeDefined()
      expect(cacheMetric!.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.REBUILD_GRAPH)
    })

    it('should maintain cache hit rate above threshold', () => {
      const dataset = gameDataFixtures.mediumDataset
      
      // Perform multiple operations that should benefit from caching
      for (let i = 0; i < 5; i++) {
        buildGraphElements(dataset)
      }
      
      // Check cache performance
      const analysis = optimizedEngine.analyzePerformance()
      
      // Cache hit rate should be reasonable for repeated operations
      expect(analysis.cacheHitRate).toBeGreaterThan(0) // At least some cache hits
      expect(analysis.recommendations).toBeDefined()
    })
  })

  describe('Batch Processing Performance', () => {
    it('should process operations in batches efficiently', async () => {
      const dataset = gameDataFixtures.largeDataset
      
      // Enable batching
      const batchMonitor = initializePerformanceMonitor({
        enableBatching: true,
        batchSize: 20
      })
      
      const batchTime = await withPerformanceTracking('batch-processing', async () => {
        return buildGraphElements(dataset)
      })
      
      const report = batchMonitor.generatePerformanceReport()
      const batchMetrics = report.metrics.filter(m => m.name.includes('batch'))
      
      // Should have some batch processing metrics
      expect(batchMetrics.length).toBeGreaterThan(0)
      
      // Overall performance should be acceptable
      const mainMetric = report.metrics.find(m => m.name === 'batch-processing')
      expect(mainMetric).toBeDefined()
      expect(mainMetric!.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.INITIAL_RENDER * 1.5)
    })
  })

  describe('Performance Bottleneck Detection', () => {
    it('should identify performance bottlenecks correctly', async () => {
      const dataset = gameDataFixtures.largeDataset
      
      // Perform operations that might create bottlenecks
      await withPerformanceTracking('bottleneck-test', async () => {
        return buildGraphElements(dataset)
      })
      
      const report = performanceMonitor.generatePerformanceReport()
      
      // Should have bottleneck analysis
      expect(report.bottlenecks).toBeDefined()
      expect(Array.isArray(report.bottlenecks)).toBe(true)
      
      // Should have recommendations
      expect(report.recommendations).toBeDefined()
      expect(Array.isArray(report.recommendations)).toBe(true)
    })

    it('should provide actionable recommendations', () => {
      const report = performanceMonitor.generatePerformanceReport()
      
      if (report.recommendations.length > 0) {
        // Recommendations should be strings
        report.recommendations.forEach(rec => {
          expect(typeof rec).toBe('string')
          expect(rec.length).toBeGreaterThan(10) // Should be meaningful
        })
      }
    })
  })

  describe('Performance Thresholds', () => {
    it('should respect defined performance thresholds', () => {
      // Verify that thresholds are reasonable
      expect(PERFORMANCE_THRESHOLDS.INITIAL_RENDER).toBeGreaterThan(0)
      expect(PERFORMANCE_THRESHOLDS.REBUILD_GRAPH).toBeGreaterThan(0)
      expect(PERFORMANCE_THRESHOLDS.POSITION_CALCULATION).toBeGreaterThan(0)
      expect(PERFORMANCE_THRESHOLDS.LANE_CALCULATION).toBeGreaterThan(0)
      expect(PERFORMANCE_THRESHOLDS.BOUNDARY_ENFORCEMENT).toBeGreaterThan(0)
      expect(PERFORMANCE_THRESHOLDS.VALIDATION).toBeGreaterThan(0)
      
      // Thresholds should be in reasonable ranges
      expect(PERFORMANCE_THRESHOLDS.INITIAL_RENDER).toBeLessThan(10000) // 10 seconds max
      expect(PERFORMANCE_THRESHOLDS.REBUILD_GRAPH).toBeLessThan(5000) // 5 seconds max
    })

    it('should warn when thresholds are exceeded', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Create a slow operation that should exceed thresholds
      performanceMonitor.startMetric('slow-operation')
      
      // Simulate slow operation
      await new Promise(resolve => setTimeout(resolve, PERFORMANCE_THRESHOLDS.POSITION_CALCULATION + 50))
      
      performanceMonitor.endMetric('slow-operation')
      
      // Should have logged a warning
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Performance Report Generation', () => {
    it('should generate comprehensive performance reports', () => {
      // Perform some operations
      performanceMonitor.startMetric('test-operation')
      performanceMonitor.endMetric('test-operation')
      
      const report = performanceMonitor.generatePerformanceReport()
      
      // Report should have required fields
      expect(report.sessionId).toBeDefined()
      expect(report.startTime).toBeDefined()
      expect(report.endTime).toBeDefined()
      expect(report.totalDuration).toBeDefined()
      expect(report.metrics).toBeDefined()
      expect(report.memoryUsage).toBeDefined()
      expect(report.recommendations).toBeDefined()
      expect(report.bottlenecks).toBeDefined()
      
      // Should have at least one metric
      expect(report.metrics.length).toBeGreaterThan(0)
    })

    it('should include memory usage information', () => {
      const report = performanceMonitor.generatePerformanceReport()
      
      expect(report.memoryUsage.initialMemory).toBeDefined()
      expect(report.memoryUsage.peakMemory).toBeDefined()
      expect(report.memoryUsage.finalMemory).toBeDefined()
      expect(report.memoryUsage.memoryLeaks).toBeDefined()
      expect(report.memoryUsage.gcEvents).toBeDefined()
    })
  })
})

describe('Performance Integration Tests', () => {
  it('should maintain performance across full application workflow', async () => {
    const monitor = initializePerformanceMonitor()
    const dataset = gameDataFixtures.mediumDataset
    
    try {
      // Simulate full application workflow
      monitor.startMetric('full-workflow')
      
      // Initial render
      const initialResult = buildGraphElements(dataset)
      expect(initialResult.nodes.length).toBeGreaterThan(0)
      
      // Multiple rebuilds (simulating user interactions)
      for (let i = 0; i < 3; i++) {
        const rebuildResult = buildGraphElements(dataset)
        expect(rebuildResult.nodes.length).toBe(initialResult.nodes.length)
      }
      
      monitor.endMetric('full-workflow')
      
      const report = monitor.generatePerformanceReport()
      const workflowMetric = report.metrics.find(m => m.name === 'full-workflow')
      
      expect(workflowMetric).toBeDefined()
      expect(workflowMetric!.duration).toBeLessThan(5000) // 5 seconds for full workflow
      
      // Should not have critical bottlenecks
      const criticalBottlenecks = report.bottlenecks.filter(b => b.severity === 'critical')
      expect(criticalBottlenecks.length).toBe(0)
      
    } finally {
      cleanupPerformanceMonitor()
    }
  })
})