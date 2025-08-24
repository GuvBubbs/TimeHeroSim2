import { getPerformanceMonitor, withPerformanceTracking } from './performanceMonitor'
import { getOptimizedPositioningEngine } from './optimizedPositioning'
import { buildGraphElements } from './graphBuilder'
import { gameDataFixtures } from '../tests/fixtures/gameDataFixtures'

/**
 * Performance monitoring demonstration
 * This function demonstrates the performance monitoring capabilities
 */
export async function runPerformanceDemo(): Promise<void> {
  console.log('🚀 Starting Performance Monitoring Demo')
  console.log('=' .repeat(50))

  const monitor = getPerformanceMonitor()
  const engine = getOptimizedPositioningEngine()

  try {
    // Demo 1: Basic performance tracking
    console.log('\n📊 Demo 1: Basic Performance Tracking')
    await withPerformanceTracking('demo-basic-operation', async () => {
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log('  ✅ Basic operation completed')
    })

    // Demo 2: Graph building performance
    console.log('\n📊 Demo 2: Graph Building Performance')
    const smallDataset = gameDataFixtures.smallDataset.slice(0, 20) // Use smaller subset
    
    const result = await withPerformanceTracking('demo-graph-build', async () => {
      return buildGraphElements(smallDataset)
    })
    
    console.log(`  ✅ Built graph with ${result.nodes.length} nodes and ${result.edges.length} edges`)

    // Demo 3: Multiple operations for caching demonstration
    console.log('\n📊 Demo 3: Caching Performance')
    for (let i = 0; i < 3; i++) {
      await withPerformanceTracking(`demo-cached-operation-${i}`, async () => {
        buildGraphElements(smallDataset)
      })
    }
    console.log('  ✅ Completed multiple operations (should show caching benefits)')

    // Demo 4: Memory optimization
    console.log('\n📊 Demo 4: Memory Optimization')
    monitor.startMetric('demo-memory-optimization')
    engine.optimizeMemoryUsage()
    monitor.endMetric('demo-memory-optimization')
    console.log('  ✅ Memory optimization completed')

    // Generate and display performance report
    console.log('\n📊 Performance Report')
    console.log('-' .repeat(30))
    
    const report = monitor.generatePerformanceReport()
    
    console.log(`Session Duration: ${(report.totalDuration / 1000).toFixed(2)}s`)
    console.log(`Total Operations: ${report.metrics.length}`)
    
    if (report.memoryUsage.initialMemory > 0) {
      const memoryChange = report.memoryUsage.finalMemory - report.memoryUsage.initialMemory
      console.log(`Memory Change: ${(memoryChange / 1024 / 1024).toFixed(2)}MB`)
    }

    // Show operation timings
    console.log('\nOperation Timings:')
    report.metrics
      .filter(m => m.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 5)
      .forEach(metric => {
        console.log(`  ${metric.name}: ${metric.duration!.toFixed(2)}ms`)
      })

    // Show recommendations if any
    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:')
      report.recommendations.forEach(rec => {
        console.log(`  💡 ${rec}`)
      })
    }

    // Show bottlenecks if any
    if (report.bottlenecks.length > 0) {
      console.log('\nPerformance Issues:')
      report.bottlenecks.forEach(bottleneck => {
        const icon = bottleneck.severity === 'critical' ? '🚨' : 
                    bottleneck.severity === 'severe' ? '⚠️' : '⚡'
        console.log(`  ${icon} ${bottleneck.operation}: ${bottleneck.duration.toFixed(2)}ms (${bottleneck.severity})`)
      })
    }

    // Demo 5: Engine performance analysis
    console.log('\n📊 Demo 5: Engine Performance Analysis')
    const analysis = engine.analyzePerformance()
    console.log(`  Cache Hit Rate: ${analysis.cacheHitRate.toFixed(1)}%`)
    console.log(`  Memory Usage: ${(analysis.memoryUsage / 1024).toFixed(1)}KB`)
    
    if (analysis.recommendations.length > 0) {
      console.log('  Engine Recommendations:')
      analysis.recommendations.forEach(rec => {
        console.log(`    💡 ${rec}`)
      })
    }

    console.log('\n✅ Performance Demo Completed Successfully!')
    
  } catch (error) {
    console.error('❌ Performance Demo Failed:', error)
  }
}

/**
 * Run a performance stress test with larger datasets
 */
export async function runPerformanceStressTest(): Promise<void> {
  console.log('🔥 Starting Performance Stress Test')
  console.log('=' .repeat(50))

  const monitor = getPerformanceMonitor()
  
  // Configure for large datasets
  monitor.optimizeForLargeDatasets(500)

  try {
    // Test with progressively larger datasets
    const datasets = [
      { name: 'Small', data: gameDataFixtures.smallDataset.slice(0, 25) },
      { name: 'Medium', data: gameDataFixtures.mediumDataset.slice(0, 75) },
      { name: 'Large', data: gameDataFixtures.largeDataset.slice(0, 200) }
    ]

    for (const dataset of datasets) {
      console.log(`\n🧪 Testing ${dataset.name} Dataset (${dataset.data.length} items)`)
      
      const result = await withPerformanceTracking(`stress-test-${dataset.name.toLowerCase()}`, async () => {
        return buildGraphElements(dataset.data)
      })
      
      console.log(`  ✅ ${dataset.name}: ${result.nodes.length} nodes in ${monitor.generatePerformanceReport().metrics.slice(-1)[0].duration?.toFixed(2)}ms`)
    }

    // Final report
    const finalReport = monitor.generatePerformanceReport()
    console.log('\n📊 Stress Test Results')
    console.log('-' .repeat(30))
    
    const stressMetrics = finalReport.metrics.filter(m => m.name.includes('stress-test'))
    stressMetrics.forEach(metric => {
      console.log(`${metric.name}: ${metric.duration?.toFixed(2)}ms`)
    })

    if (finalReport.bottlenecks.length > 0) {
      console.log('\n⚠️ Performance Issues Detected:')
      finalReport.bottlenecks.forEach(bottleneck => {
        console.log(`  ${bottleneck.operation}: ${bottleneck.duration.toFixed(2)}ms (${bottleneck.severity})`)
        console.log(`    💡 ${bottleneck.recommendation}`)
      })
    } else {
      console.log('\n✅ No significant performance issues detected')
    }

    console.log('\n🔥 Stress Test Completed!')
    
  } catch (error) {
    console.error('❌ Stress Test Failed:', error)
  }
}

// Export for use in development/debugging
export { getPerformanceMonitor, getOptimizedPositioningEngine }