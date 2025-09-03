// systemRegistry.ts - Phase 10A System Registry
// Central registry for all simulation systems after consolidation

import { FarmSystem } from './core/FarmSystem'
import { TowerSystem } from './core/TowerSystem'
import { TownSystem } from './core/TownSystem'
import { AdventureSystem } from './core/AdventureSystem'
import { MineSystem } from './core/MineSystem'
import { ForgeSystem } from './core/ForgeSystem'
import { HelperSystem } from './core/HelperSystem'
import { OfflineProgressionSystem } from './support/OfflineProgressionSystem'
import { PrerequisiteSystem } from './support/PrerequisiteSystem'
import { SeedSystem } from './support/SeedSystem'

/**
 * Core game systems - main gameplay mechanics
 */
export const CORE_SYSTEMS = {
  farm: FarmSystem,
  tower: TowerSystem,
  town: TownSystem,
  adventure: AdventureSystem,
  mine: MineSystem,
  forge: ForgeSystem,
  helper: HelperSystem
} as const

/**
 * Support systems - utility and cross-cutting concerns
 */
export const SUPPORT_SYSTEMS = {
  offline: OfflineProgressionSystem,
  prerequisites: PrerequisiteSystem,
  seeds: SeedSystem
} as const

/**
 * All systems combined
 */
export const ALL_SYSTEMS = {
  ...CORE_SYSTEMS,
  ...SUPPORT_SYSTEMS
} as const

/**
 * Type definitions for system keys
 */
export type CoreSystemType = keyof typeof CORE_SYSTEMS
export type SupportSystemType = keyof typeof SUPPORT_SYSTEMS
export type SystemType = keyof typeof ALL_SYSTEMS

/**
 * Get system by name
 */
export function getSystem(systemName: SystemType) {
  return ALL_SYSTEMS[systemName]
}

/**
 * Get all core system names
 */
export function getCoreSystemNames(): CoreSystemType[] {
  return Object.keys(CORE_SYSTEMS) as CoreSystemType[]
}

/**
 * Get all support system names
 */
export function getSupportSystemNames(): SupportSystemType[] {
  return Object.keys(SUPPORT_SYSTEMS) as SupportSystemType[]
}

/**
 * Get all system names
 */
export function getAllSystemNames(): SystemType[] {
  return Object.keys(ALL_SYSTEMS) as SystemType[]
}

/**
 * Check if a system exists
 */
export function hasSystem(systemName: string): systemName is SystemType {
  return systemName in ALL_SYSTEMS
}

/**
 * System metadata for documentation and tooling
 */
export const SYSTEM_METADATA = {
  farm: {
    description: 'Crop growth and water management',
    consolidatedFrom: ['CropSystem', 'WaterSystem']
  },
  tower: {
    description: 'Tower upgrades and seed catching',
    consolidatedFrom: []
  },
  town: {
    description: 'Town building and vendor interactions',
    consolidatedFrom: []
  },
  adventure: {
    description: 'Adventure routes, combat, and exploration',
    consolidatedFrom: ['CombatSystem', 'RouteEnemyRollSystem']
  },
  mine: {
    description: 'Mining operations and resource extraction',
    consolidatedFrom: [],
    renamedFrom: 'MiningSystem'
  },
  forge: {
    description: 'Forge management and crafting decisions',
    consolidatedFrom: []
  },
  helper: {
    description: 'Helper automation and gnome housing',
    consolidatedFrom: ['GnomeHousing']
  },
  offline: {
    description: 'Offline progression calculations',
    consolidatedFrom: []
  },
  prerequisites: {
    description: 'Prerequisite validation and dependency checking',
    consolidatedFrom: []
  },
  seeds: {
    description: 'Seed catching mechanics and wind management',
    consolidatedFrom: []
  },
  crafting: {
    description: 'Crafting process mechanics and furnace heat',
    consolidatedFrom: []
  }
} as const

/**
 * Get consolidated systems list (what was merged)
 */
export function getConsolidatedSystems(): { system: string, consolidatedFrom: string[], renamedFrom?: string }[] {
  return Object.entries(SYSTEM_METADATA)
    .filter(([_, meta]) => meta.consolidatedFrom.length > 0 || 'renamedFrom' in meta)
    .map(([system, meta]) => ({
      system,
      consolidatedFrom: [...meta.consolidatedFrom],
      renamedFrom: 'renamedFrom' in meta ? meta.renamedFrom : undefined
    }))
}
