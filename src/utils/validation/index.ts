/**
 * Validation Module Index - Phase 9H Implementation
 * 
 * Exports centralized validation services and types
 */

export { DependencyGraph } from './DependencyGraph'
export type { DependencyNode, DependencyPath } from './DependencyGraph'

export { PrerequisiteService, prerequisiteService } from './PrerequisiteService'
export type { PrerequisiteResult, PrerequisiteCache } from './PrerequisiteService'

export { ValidationService, validationService } from './ValidationService'
export type { 
  ActionValidationResult, 
  ResourceValidation 
} from './ValidationService'

// Re-export common types for convenience
export type { ValidationResult, ExecutionContext } from '../execution/types/ActionResult'
