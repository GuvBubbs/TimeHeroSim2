# Performance Monitoring System

## Overview
The performance monitoring system has been implemented with a **feature flag** to prevent regressions. By default, performance monitoring is **DISABLED** to ensure the existing system continues to work normally.

## How to Enable Performance Monitoring

### Option 1: Browser Console (Recommended for Development)
```javascript
// Enable performance monitoring
window.enablePerformanceMonitoring()

// Refresh the page to activate features
location.reload()

// Check if enabled
window.isPerformanceMonitoringEnabled()

// Disable when done
window.disablePerformanceMonitoring()
```

### Option 2: Direct Flag Setting
```javascript
// Enable
window.ENABLE_PERFORMANCE_MONITORING = true

// Disable  
window.ENABLE_PERFORMANCE_MONITORING = false
```

## Features Available When Enabled

### 1. Performance Panel in Upgrade Tree View
- Click the "Performance" button in the controls panel
- View real-time performance metrics
- See memory usage and bottlenecks
- Export performance data

### 2. Performance Monitoring APIs
```javascript
import { getPerformanceMonitor, withPerformanceTracking } from '@/utils/performanceMonitor'

// Track operation performance
const result = await withPerformanceTracking('my-operation', async () => {
  // Your code here
  return someResult
})

// Get performance report
const monitor = getPerformanceMonitor()
const report = monitor.generatePerformanceReport()
```

### 3. Optimized Positioning Engine
```javascript
import { getOptimizedPositioningEngine } from '@/utils/optimizedPositioning'

const engine = getOptimizedPositioningEngine()
const analysis = engine.analyzePerformance()
```

## Performance Monitoring Components

### 1. Performance Monitor (`performanceMonitor.ts`)
- **Metrics tracking**: Start/end timing for operations
- **Memory monitoring**: Track memory usage and detect leaks
- **Caching system**: LRU cache for improved performance
- **Batching**: Group operations for better efficiency
- **Bottleneck detection**: Identify performance issues
- **Threshold checking**: Automatic warnings for slow operations

### 2. Optimized Positioning Engine (`optimizedPositioning.ts`)
- **Cached calculations**: Avoid repeated lane height calculations
- **Position caching**: Cache node positions with dependency tracking
- **Batch processing**: Process multiple items efficiently
- **Memory optimization**: Cleanup and garbage collection hints

### 3. Performance Demo (`performanceDemo.ts`)
```javascript
import { runPerformanceDemo, runPerformanceStressTest } from '@/utils/performanceDemo'

// Run basic demo
await runPerformanceDemo()

// Run stress test with large datasets
await runPerformanceStressTest()
```

## Performance Thresholds

The system monitors these performance thresholds:
- **Initial Render**: < 1000ms
- **Graph Rebuild**: < 500ms  
- **Position Calculation**: < 100ms
- **Lane Calculation**: < 200ms
- **Boundary Enforcement**: < 50ms
- **Validation**: < 300ms

## Default Behavior (Performance Monitoring Disabled)

When performance monitoring is disabled (default):
- **No performance overhead**: Zero impact on existing functionality
- **No additional logging**: Clean console output
- **No UI changes**: Performance panel is hidden
- **Fallback to original logic**: All optimizations are bypassed

## Testing

Run performance validation tests:
```bash
npm run test -- src/tests/validation/performanceValidation.test.ts
```

## Troubleshooting

### Issue: Excessive Logging
**Solution**: Performance monitoring is now disabled by default. Only enable when needed for debugging.

### Issue: Performance Regressions  
**Solution**: The system falls back to original logic when disabled. Enable only for analysis.

### Issue: Memory Issues
**Solution**: Use the memory optimization features:
```javascript
const engine = getOptimizedPositioningEngine()
engine.optimizeMemoryUsage()
```

## Best Practices

1. **Enable only when needed**: Keep performance monitoring disabled in production
2. **Use for debugging**: Enable when investigating performance issues
3. **Export data**: Use export features to analyze performance offline
4. **Monitor thresholds**: Watch for operations exceeding thresholds
5. **Clean up**: Disable when analysis is complete

## Integration Points

The performance monitoring integrates with:
- **Graph Builder**: Tracks graph construction performance
- **Upgrade Tree View**: Provides UI for performance analysis  
- **Positioning System**: Optimizes node positioning calculations
- **Validation System**: Monitors validation performance

## Future Enhancements

When performance monitoring is enabled, future enhancements could include:
- **Real-time performance graphs**
- **Performance regression detection**
- **Automated optimization suggestions**
- **Performance budgets and alerts**
- **Integration with browser dev tools**