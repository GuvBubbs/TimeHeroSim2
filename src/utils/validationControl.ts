/**
 * Validation Control Utilities
 * Provides functions to enable/disable comprehensive validation for performance control
 */

/**
 * Enable comprehensive validation and detailed logging
 * This will significantly increase computation time and console output
 */
export function enableComprehensiveValidation(): void {
  if (typeof window !== 'undefined') {
    ;(window as any).ENABLE_COMPREHENSIVE_VALIDATION = true
    ;(window as any).ENABLE_DETAILED_VALIDATION_LOGGING = true
    console.log('🔍 Comprehensive validation enabled - expect detailed logging and slower performance')
  }
}

/**
 * Disable comprehensive validation for better performance
 * This is the default state for normal operation
 */
export function disableComprehensiveValidation(): void {
  if (typeof window !== 'undefined') {
    ;(window as any).ENABLE_COMPREHENSIVE_VALIDATION = false
    ;(window as any).ENABLE_DETAILED_VALIDATION_LOGGING = false
    console.log('⚡ Comprehensive validation disabled - performance optimized')
  }
}

/**
 * Check if comprehensive validation is currently enabled
 */
export function isComprehensiveValidationEnabled(): boolean {
  return typeof window !== 'undefined' && (window as any).ENABLE_COMPREHENSIVE_VALIDATION === true
}

/**
 * Enable only detailed logging without comprehensive validation
 * Useful for debugging without the full performance impact
 */
export function enableDetailedLogging(): void {
  if (typeof window !== 'undefined') {
    ;(window as any).ENABLE_DETAILED_VALIDATION_LOGGING = true
    console.log('📝 Detailed validation logging enabled')
  }
}

/**
 * Disable detailed logging
 */
export function disableDetailedLogging(): void {
  if (typeof window !== 'undefined') {
    ;(window as any).ENABLE_DETAILED_VALIDATION_LOGGING = false
    console.log('🔇 Detailed validation logging disabled')
  }
}

/**
 * Get current validation settings
 */
export function getValidationSettings(): {
  comprehensiveValidation: boolean
  detailedLogging: boolean
} {
  return {
    comprehensiveValidation: typeof window !== 'undefined' && (window as any).ENABLE_COMPREHENSIVE_VALIDATION === true,
    detailedLogging: typeof window !== 'undefined' && (window as any).ENABLE_DETAILED_VALIDATION_LOGGING === true
  }
}

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  ;(window as any).enableComprehensiveValidation = enableComprehensiveValidation
  ;(window as any).disableComprehensiveValidation = disableComprehensiveValidation
  ;(window as any).enableDetailedLogging = enableDetailedLogging
  ;(window as any).disableDetailedLogging = disableDetailedLogging
  ;(window as any).getValidationSettings = getValidationSettings
}