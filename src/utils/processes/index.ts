// Process Module Index - Phase 9G Implementation
// Exports for the unified process management system

export { ProcessManager } from './ProcessManager'
export { ProcessRegistry } from './ProcessRegistry'

// Export types
export type {
  ProcessType,
  ProcessState,
  ProcessData,
  ProcessHandle,
  ProcessUpdateResult,
  ProcessTickResult,
  ProcessCompletionResult,
  ValidationResult,
  InitResult,
  ProcessMetadata,
  StateChanges,
  ProcessEvent,
  IProcessHandler,
  CropProcessData,
  AdventureProcessData,
  CraftingProcessData,
  MiningProcessData,
  SeedCatchingProcessData,
  HelperTrainingProcessData
} from './types/ProcessTypes'

// Export handlers
export { CropGrowthHandler } from './handlers/CropGrowthHandler'
export { AdventureHandler } from './handlers/AdventureHandler'
export { CraftingHandler } from './handlers/CraftingHandler'
export { MiningHandler } from './handlers/MiningHandler'
export { SeedCatchingHandler } from './handlers/SeedCatchingHandler'
export { HelperTrainingHandler } from './handlers/HelperTrainingHandler'
