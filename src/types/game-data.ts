/**
 * Core game data interfaces for processed/typed game entities
 */

export interface MaterialCost {
  [materialName: string]: number
}

export interface GameDataItem {
  id: string
  name: string
  prerequisites: string[] // Parsed from semicolon-separated string
  type: string
  categories: string[]
  
  // NEW: Optional grouping fields for enhanced tree organization
  // Note: type and categories above are for existing data structure,
  // grouping uses them optionally with fallbacks
  
  // Costs and gains
  goldCost?: number
  goldGain?: number
  energyCost?: number
  time?: number
  materialsCost?: MaterialCost
  materialsGain?: MaterialCost
  
  // Properties
  level?: number
  effect?: string
  ratio?: number
  sellPricePerUnit?: number
  minQuantity?: number
  exchangeRate?: number
  
  // Farming/seeds
  windLevel?: number
  seedLevel?: number
  seedPool?: string
  
  // Combat
  damage?: number
  attackSpeed?: number
  advantageVs?: string
  
  // Adventure/enemy
  length?: number
  boss?: string
  bossDrop?: string
  commonDrop?: string
  enemyRolls?: number
  depthRange?: string
  effectPerLevel?: number
  
  // Farm expansion
  plotsAdded?: number
  totalPlots?: number
  toolRequired?: string
  repeatable?: boolean
  
  // Metadata
  notes?: string
  sourceFile: string // Which CSV file this came from
  category: 'Actions' | 'Data' | 'Unlocks'
}

export interface ValidationIssue {
  id: string
  level: 'error' | 'warning' | 'info'
  message: string
  itemId?: string
  sourceFile?: string
}

export interface GameDataStats {
  totalItems: number
  itemsByCategory: Record<string, number>
  itemsByFile: Record<string, number>
  validationIssues: ValidationIssue[]
  lastLoadTime: Date
  memoryUsage: number
}

export interface DataFilter {
  category?: string
  type?: string
  minLevel?: number
  maxLevel?: number
  hasPrerequisites?: boolean
  searchText?: string
}

// Specific item type interfaces for more precise typing
export interface CropItem extends GameDataItem {
  type: 'crop'
  windLevel: number
  seedLevel: number
  energyCost: number
  time: number
  level: number
}

export interface WeaponItem extends GameDataItem {
  type: 'weapon'
  damage: number
  attackSpeed: number
  advantageVs: string
  level: number
}

export interface ActionItem extends GameDataItem {
  energyCost?: number
  time?: number
  toolRequired?: string
  plotsAdded?: number
  totalPlots?: number
  repeatable: boolean
}

export interface BlueprintItem extends GameDataItem {
  goldCost: number
  type: string
  categories: string[]
}
