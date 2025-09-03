// Systems Barrel Export
// Provides clean import paths for all simulation systems

// Core Game Loop Systems
export { FarmSystem } from './core/FarmSystem'
export { TowerSystem } from './core/TowerSystem'
export { TownSystem } from './core/TownSystem'
export { AdventureSystem } from './core/AdventureSystem'
export { MineSystem } from './core/MineSystem'
export { ForgeSystem } from './core/ForgeSystem'
export { HelperSystem } from './core/HelperSystem'

// Support Systems
export { OfflineProgressionSystem } from './support/OfflineProgressionSystem'
export { PrerequisiteSystem } from './support/PrerequisiteSystem'
export { SeedSystem } from './support/SeedSystem'
export { SupportSystemManager } from './support/SupportSystemManager'

// System Infrastructure
export { GameSystem } from './GameSystem'
export { 
  CORE_SYSTEMS, 
  SUPPORT_SYSTEMS, 
  ALL_SYSTEMS,
  getSystem,
  getCoreSystemNames,
  getSupportSystemNames,
  getAllSystemNames,
  hasSystem,
  SYSTEM_METADATA,
  getConsolidatedSystems
} from './systemRegistry'

// Re-export types and interfaces
export type { 
  SystemTickResult,
  ActionResult,
  ValidationResult,
  EvaluationContext,
  GameSystemContract,
  GameSystem as GameSystemInterface
} from './GameSystem'

export type {
  CoreSystemType,
  SupportSystemType,
  SystemType
} from './systemRegistry'
