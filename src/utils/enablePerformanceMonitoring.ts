/**
 * Utility to enable performance monitoring
 * This should be called in development/debugging scenarios only
 */

export function enablePerformanceMonitoring(): void {
  if (typeof window !== 'undefined') {
    (window as any).ENABLE_PERFORMANCE_MONITORING = true
    console.log('🚀 Performance monitoring enabled')
    console.log('Refresh the page to activate performance monitoring features')
  }
}

export function disablePerformanceMonitoring(): void {
  if (typeof window !== 'undefined') {
    (window as any).ENABLE_PERFORMANCE_MONITORING = false
    console.log('⏸️ Performance monitoring disabled')
    console.log('Refresh the page to deactivate performance monitoring features')
  }
}

export function isPerformanceMonitoringEnabled(): boolean {
  return typeof window !== 'undefined' && (window as any).ENABLE_PERFORMANCE_MONITORING === true
}

// Make functions available globally for easy access in console
if (typeof window !== 'undefined') {
  (window as any).enablePerformanceMonitoring = enablePerformanceMonitoring;
  (window as any).disablePerformanceMonitoring = disablePerformanceMonitoring;
  (window as any).isPerformanceMonitoringEnabled = isPerformanceMonitoringEnabled
}

export default {
  enablePerformanceMonitoring,
  disablePerformanceMonitoring,
  isPerformanceMonitoringEnabled
}