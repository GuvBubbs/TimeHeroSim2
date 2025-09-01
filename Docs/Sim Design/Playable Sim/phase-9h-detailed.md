# Phase 9H: Extract Prerequisites & Validation - Detailed Implementation

## Overview
Extract ~300 lines of prerequisite checking and validation logic from SimulationEngine into comprehensive validation services. This centralizes all game rule validation, dependency checking, and prerequisite management with performance optimizations through caching.

## File Structure After Phase 9H

```
src/utils/validation/
├── PrerequisiteService.ts (enhanced ~150 lines)
├── ValidationService.ts (new ~100 lines)
├── DependencyGraph.ts (new ~100 lines)
├── ValidationCache.ts (new ~50 lines)
└── types/
    ├── ValidationTypes.ts (new ~50 lines)
    └── PrerequisiteTypes.ts (new ~50 lines)
```

## Current Validation Logic in SimulationEngine

### Methods to Extract (Lines ~3500-3800):
```typescript
// Prerequisite checking
- checkPrerequisites(itemId: string): boolean
- hasUnlockedPrerequisite(prereqId: string): boolean
- getUnmetPrerequisites(itemId: string): string[]
- validatePrerequisiteChain(itemId: string): boolean

// General validation
- validateAction(action: GameAction): ValidationResult
- validatePurchase(itemId: string): boolean
- validateBuilding(structureId: string): boolean
- validateCrafting(recipeId: string): boolean

// Dependency management
- buildDependencyTree(itemId: string): DependencyNode
- checkCircularDependencies(itemId: string): boolean
- getRequiredUnlocks(itemId: string): string[]
```

## 1. ValidationService.ts - Central Validation Hub

### Interface Design:
```typescript
export interface IValidationService {
  // Action validation
  validateAction(
    action: GameAction,
    gameState: GameState,
    gameDataStore: GameDataStore
  ): ValidationResult
  
  // Purchase validation
  canPurchase(
    itemId: string,
    gameState: GameState,
    gameDataStore: GameDataStore
  ): ValidationResult
  
  // Building validation
  canBuild(
    structureId: string,
    gameState: GameState,
    gameDataStore: GameDataStore
  ): ValidationResult
  
  // Crafting validation
  canCraft(
    recipeId: string,
    gameState: GameState,
    gameDataStore: GameDataStore
  ): ValidationResult
  
  // Batch validation
  validateBatch(
    validations: ValidationRequest[],
    gameState: GameState,
    gameDataStore: GameDataStore
  ): BatchValidationResult
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  metadata?: any
}

export interface ValidationError {
  code: string
  message: string
  field?: string
  details?: any
}

export interface ValidationWarning {
  code: string
  message: string
  severity: 'low' | 'medium' | 'high'
}

export interface ValidationRequest {
  type: 'action' | 'purchase' | 'build' | 'craft'
  target: string | GameAction
  options?: ValidationOptions
}

export interface ValidationOptions {
  checkPrerequisites?: boolean
  checkResources?: boolean
  checkLocation?: boolean
  checkConflicts?: boolean
  deep?: boolean
}
```

### Implementation:
```typescript
export class ValidationService implements IValidationService {
  private prerequisiteService: PrerequisiteService
  private dependencyGraph: DependencyGraph
  private cache: ValidationCache
  
  constructor(gameDataStore: GameDataStore) {
    this.prerequisiteService = new PrerequisiteService(gameDataStore)
    this.dependencyGraph = new DependencyGraph(gameDataStore)
    this.cache = new ValidationCache()
  }
  
  validateAction(
    action: GameAction,
    gameState: GameState,
    gameDataStore: GameDataStore
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    // Check cache first
    const cacheKey = this.getCacheKey('action', action, gameState)
    const cached = this.cache.get(cacheKey)
    if (cached) return cached
    
    // 1. Validate action structure
    const structureErrors = this.validateActionStructure(action)
    errors.push(...structureErrors)
    
    // 2. Check prerequisites
    if (action.targetId) {
      const prereqResult = this.prerequisiteService.checkPrerequisites(
        action.targetId,
        gameState
      )
      if (!prereqResult.met) {
        errors.push({
          code: 'MISSING_PREREQUISITES',
          message: `Missing prerequisites: ${prereqResult.missing.join(', ')}`,
          details: prereqResult.missing
        })
      }
    }
    
    // 3. Validate resources
    const resourceResult = this.validateResources(action, gameState)
    if (!resourceResult.valid) {
      errors.push(...resourceResult.errors)
    }
    
    // 4. Validate location
    const locationResult = this.validateLocation(action, gameState)
    if (!locationResult.valid) {
      errors.push(...locationResult.errors)
    }
    
    // 5. Check for conflicts
    const conflictResult = this.checkConflicts(action, gameState)
    if (!conflictResult.valid) {
      errors.push(...conflictResult.errors)
    }
    
    // 6. Type-specific validation
    const typeResult = this.validateActionType(action, gameState, gameDataStore)
    if (!typeResult.valid) {
      errors.push(...typeResult.errors)
    }
    
    // Generate warnings
    warnings.push(...this.generateWarnings(action, gameState))
    
    const result: ValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings
    }
    
    // Cache result
    this.cache.set(cacheKey, result, 60000) // Cache for 1 minute
    
    return result
  }
  
  canPurchase(
    itemId: string,
    gameState: GameState,
    gameDataStore: GameDataStore
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    const item = gameDataStore.getItemById(itemId)
    if (!item) {
      return {
        valid: false,
        errors: [{
          code: 'ITEM_NOT_FOUND',
          message: `Item ${itemId} not found`
        }],
        warnings: []
      }
    }
    
    // Check if already owned
    if (this.isOwned(itemId, gameState)) {
      errors.push({
        code: 'ALREADY_OWNED',
        message: `Already own ${item.name}`
      })
    }
    
    // Check prerequisites
    const prereqResult = this.prerequisiteService.checkPrerequisites(itemId, gameState)
    if (!prereqResult.met) {
      errors.push({
        code: 'MISSING_PREREQUISITES',
        message: `Prerequisites not met for ${item.name}`,
        details: prereqResult.missing
      })
    }
    
    // Check cost
    const cost = this.parseCost(item)
    if (!this.canAfford(cost, gameState)) {
      errors.push({
        code: 'INSUFFICIENT_RESOURCES',
        message: `Cannot afford ${item.name}`,
        details: cost
      })
    }
    
    // Check vendor availability
    if (!this.isVendorAccessible(item.category, gameState)) {
      errors.push({
        code: 'VENDOR_NOT_ACCESSIBLE',
        message: `Vendor for ${item.name} is not accessible`
      })
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  canBuild(
    structureId: string,
    gameState: GameState,
    gameDataStore: GameDataStore
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    // Check if blueprint owned
    if (!gameState.unlockedContent.purchasedBlueprints.has(structureId)) {
      errors.push({
        code: 'NO_BLUEPRINT',
        message: `No blueprint for ${structureId}`
      })
    }
    
    // Check if already built
    if (gameState.unlockedContent.builtStructures.has(structureId)) {
      errors.push({
        code: 'ALREADY_BUILT',
        message: `${structureId} is already built`
      })
    }
    
    // Check build location
    if (gameState.location.current !== 'farm') {
      errors.push({
        code: 'WRONG_LOCATION',
        message: 'Must be at farm to build structures'
      })
    }
    
    // Check resources for building
    const buildCost = this.getBuildCost(structureId, gameDataStore)
    if (!this.canAfford(buildCost, gameState)) {
      errors.push({
        code: 'INSUFFICIENT_RESOURCES',
        message: `Cannot afford to build ${structureId}`,
        details: buildCost
      })
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  private validateResources(action: GameAction, gameState: GameState): ValidationResult {
    const errors: ValidationError[] = []
    
    // Energy check
    if (action.energyCost && action.energyCost > 0) {
      if (gameState.resources.energy.current < action.energyCost) {
        errors.push({
          code: 'INSUFFICIENT_ENERGY',
          message: `Need ${action.energyCost} energy, have ${gameState.resources.energy.current}`,
          field: 'energyCost'
        })
      }
    }
    
    // Gold check
    if (action.goldCost && action.goldCost > 0) {
      if (gameState.resources.gold < action.goldCost) {
        errors.push({
          code: 'INSUFFICIENT_GOLD',
          message: `Need ${action.goldCost} gold, have ${gameState.resources.gold}`,
          field: 'goldCost'
        })
      }
    }
    
    // Materials check
    if (action.materials) {
      for (const [material, required] of Object.entries(action.materials)) {
        const available = gameState.resources.materials.get(material) || 0
        if (available < required) {
          errors.push({
            code: 'INSUFFICIENT_MATERIAL',
            message: `Need ${required} ${material}, have ${available}`,
            field: 'materials',
            details: { material, required, available }
          })
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings: []
    }
  }
  
  private generateWarnings(action: GameAction, gameState: GameState): ValidationWarning[] {
    const warnings: ValidationWarning[] = []
    
    // Warn if using most of resources
    if (action.energyCost) {
      const energyPercent = action.energyCost / gameState.resources.energy.current
      if (energyPercent > 0.8) {
        warnings.push({
          code: 'HIGH_ENERGY_COST',
          message: 'This will use most of your energy',
          severity: 'medium'
        })
      }
    }
    
    // Warn if action might block other important actions
    if (action.type === 'adventure' && gameState.resources.energy.current < 200) {
      warnings.push({
        code: 'LOW_ENERGY_FOR_ADVENTURE',
        message: 'Low energy might prevent farming after adventure',
        severity: 'low'
      })
    }
    
    return warnings
  }
}
```

## 2. PrerequisiteService.ts - Enhanced Prerequisite Management

```typescript
export class PrerequisiteService {
  private gameDataStore: GameDataStore
  private cache: Map<string, PrerequisiteResult>
  private dependencyGraph: DependencyGraph
  
  constructor(gameDataStore: GameDataStore) {
    this.gameDataStore = gameDataStore
    this.cache = new Map()
    this.dependencyGraph = new DependencyGraph(gameDataStore)
  }
  
  checkPrerequisites(
    itemId: string,
    gameState: GameState,
    options: PrerequisiteOptions = {}
  ): PrerequisiteResult {
    // Check cache
    const cacheKey = `${itemId}_${this.getStateHash(gameState)}`
    if (!options.skipCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }
    
    const item = this.gameDataStore.getItemById(itemId)
    if (!item) {
      return { met: true, missing: [], chain: [] }
    }
    
    if (!item.prerequisites) {
      return { met: true, missing: [], chain: [] }
    }
    
    const missing: string[] = []
    const chain: PrerequisiteChain[] = []
    
    // Parse prerequisites
    const prereqs = this.parsePrerequisites(item.prerequisites)
    
    for (const prereq of prereqs) {
      const unlocked = this.isUnlocked(prereq, gameState)
      
      if (!unlocked) {
        missing.push(prereq)
        
        // Build prerequisite chain if requested
        if (options.includeChain) {
          const subChain = this.buildPrerequisiteChain(prereq, gameState)
          chain.push(subChain)
        }
      }
    }
    
    const result: PrerequisiteResult = {
      met: missing.length === 0,
      missing,
      chain
    }
    
    // Cache result
    this.cache.set(cacheKey, result)
    
    return result
  }
  
  private buildPrerequisiteChain(
    itemId: string,
    gameState: GameState
  ): PrerequisiteChain {
    const item = this.gameDataStore.getItemById(itemId)
    
    const chain: PrerequisiteChain = {
      id: itemId,
      name: item?.name || itemId,
      unlocked: this.isUnlocked(itemId, gameState),
      prerequisites: []
    }
    
    if (item?.prerequisites) {
      const prereqs = this.parsePrerequisites(item.prerequisites)
      for (const prereq of prereqs) {
        // Recursive build (with cycle detection)
        if (!this.dependencyGraph.wouldCreateCycle(itemId, prereq)) {
          chain.prerequisites.push(
            this.buildPrerequisiteChain(prereq, gameState)
          )
        }
      }
    }
    
    return chain
  }
  
  private parsePrerequisites(prerequisites: string): string[] {
    // Handle various formats:
    // "item1;item2" - multiple prerequisites
    // "item1|item2" - alternative prerequisites
    // "item1&item2" - required combination
    
    if (prerequisites.includes('|')) {
      // Alternative prerequisites - need at least one
      return this.parseAlternativePrerequisites(prerequisites)
    }
    
    if (prerequisites.includes('&')) {
      // Combined prerequisites - need all
      return prerequisites.split('&').map(p => p.trim())
    }
    
    // Default semicolon-separated
    return prerequisites.split(';').map(p => p.trim()).filter(p => p.length > 0)
  }
  
  private parseAlternativePrerequisites(prerequisites: string): string[] {
    // For alternatives, return empty if any one is met
    const alternatives = prerequisites.split('|').map(p => p.trim())
    // This needs special handling in checkPrerequisites
    return alternatives
  }
  
  private isUnlocked(itemId: string, gameState: GameState): boolean {
    // Check various unlock locations
    if (gameState.unlockedContent.all.has(itemId)) return true
    if (gameState.unlockedContent.purchasedBlueprints.has(itemId)) return true
    if (gameState.unlockedContent.builtStructures.has(itemId)) return true
    if (gameState.unlockedContent.adventureRoutes.has(itemId)) return true
    
    // Check inventory
    if (gameState.inventory.tools.has(itemId)) return true
    if (gameState.inventory.weapons.has(itemId)) return true
    
    // Check if it's a farm stage
    if (itemId.startsWith('farm_stage_')) {
      const stageNum = parseInt(itemId.replace('farm_stage_', ''))
      return gameState.farm.stage >= stageNum
    }
    
    // Check if it's a hero level
    if (itemId.startsWith('hero_level_')) {
      const level = parseInt(itemId.replace('hero_level_', ''))
      return gameState.hero.level >= level
    }
    
    return false
  }
  
  clearCache(): void {
    this.cache.clear()
  }
  
  private getStateHash(gameState: GameState): string {
    // Simple hash of unlocked content for cache invalidation
    const unlockCount = gameState.unlockedContent.all.size
    const level = gameState.hero.level
    const stage = gameState.farm.stage
    return `${unlockCount}_${level}_${stage}`
  }
}

export interface PrerequisiteResult {
  met: boolean
  missing: string[]
  chain: PrerequisiteChain[]
}

export interface PrerequisiteChain {
  id: string
  name: string
  unlocked: boolean
  prerequisites: PrerequisiteChain[]
}

export interface PrerequisiteOptions {
  skipCache?: boolean
  includeChain?: boolean
  maxDepth?: number
}
```

## 3. DependencyGraph.ts - Dependency Analysis

```typescript
export class DependencyGraph {
  private graph: Map<string, Set<string>>
  private reverseGraph: Map<string, Set<string>>
  private gameDataStore: GameDataStore
  
  constructor(gameDataStore: GameDataStore) {
    this.gameDataStore = gameDataStore
    this.graph = new Map()
    this.reverseGraph = new Map()
    this.buildGraph()
  }
  
  private buildGraph(): void {
    // Build dependency graph from all items
    const allItems = this.gameDataStore.getAllItems()
    
    for (const item of allItems) {
      if (!item.prerequisites) continue
      
      const itemId = item.id
      const prereqs = item.prerequisites.split(';').map(p => p.trim())
      
      // Forward graph: item -> its prerequisites
      this.graph.set(itemId, new Set(prereqs))
      
      // Reverse graph: prerequisite -> items that depend on it
      for (const prereq of prereqs) {
        if (!this.reverseGraph.has(prereq)) {
          this.reverseGraph.set(prereq, new Set())
        }
        this.reverseGraph.get(prereq)!.add(itemId)
      }
    }
  }
  
  getDependencies(itemId: string): string[] {
    return Array.from(this.graph.get(itemId) || [])
  }
  
  getDependents(itemId: string): string[] {
    return Array.from(this.reverseGraph.get(itemId) || [])
  }
  
  getAllDependencies(itemId: string, visited: Set<string> = new Set()): string[] {
    if (visited.has(itemId)) return []
    visited.add(itemId)
    
    const dependencies: string[] = []
    const direct = this.getDependencies(itemId)
    
    for (const dep of direct) {
      dependencies.push(dep)
      dependencies.push(...this.getAllDependencies(dep, visited))
    }
    
    return [...new Set(dependencies)]
  }
  
  getAllDependents(itemId: string, visited: Set<string> = new Set()): string[] {
    if (visited.has(itemId)) return []
    visited.add(itemId)
    
    const dependents: string[] = []
    const direct = this.getDependents(itemId)
    
    for (const dep of direct) {
      dependents.push(dep)
      dependents.push(...this.getAllDependents(dep, visited))
    }
    
    return [...new Set(dependents)]
  }
  
  detectCycles(): string[][] {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    for (const node of this.graph.keys()) {
      if (!visited.has(node)) {
        const cycle = this.detectCyclesUtil(node, visited, recursionStack, [])
        if (cycle.length > 0) {
          cycles.push(cycle)
        }
      }
    }
    
    return cycles
  }
  
  private detectCyclesUtil(
    node: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[]
  ): string[] {
    visited.add(node)
    recursionStack.add(node)
    path.push(node)
    
    const neighbors = this.getDependencies(node)
    
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const cycle = this.detectCyclesUtil(neighbor, visited, recursionStack, [...path])
        if (cycle.length > 0) return cycle
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor)
        return path.slice(cycleStart)
      }
    }
    
    recursionStack.delete(node)
    return []
  }
  
  wouldCreateCycle(from: string, to: string): boolean {
    // Check if adding edge from -> to would create a cycle
    const dependencies = this.getAllDependencies(to)
    return dependencies.includes(from)
  }
  
  getUnlockOrder(targetId: string): string[] {
    // Get the order in which items should be unlocked to reach target
    const order: string[] = []
    const visited = new Set<string>()
    
    this.topologicalSort(targetId, visited, order)
    
    return order.reverse()
  }
  
  private topologicalSort(
    node: string,
    visited: Set<string>,
    order: string[]
  ): void {
    if (visited.has(node)) return
    visited.add(node)
    
    const dependencies = this.getDependencies(node)
    for (const dep of dependencies) {
      this.topologicalSort(dep, visited, order)
    }
    
    order.push(node)
  }
}
```

## 4. ValidationCache.ts - Performance Optimization

```typescript
export class ValidationCache {
  private cache: Map<string, CacheEntry>
  private maxSize: number
  private defaultTTL: number
  
  constructor(maxSize: number = 1000, defaultTTL: number = 60000) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }
  
  get(key: string): any | undefined {
    const entry = this.cache.get(key)
    
    if (!entry) return undefined
    
    // Check expiration
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return undefined
    }
    
    // Update access time for LRU
    entry.lastAccess = Date.now()
    
    return entry.value
  }
  
  set(key: string, value: any, ttl?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }
    
    const entry: CacheEntry = {
      value,
      expiry: Date.now() + (ttl || this.defaultTTL),
      lastAccess: Date.now()
    }
    
    this.cache.set(key, entry)
  }
  
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.clear()
      return
    }
    
    // Invalidate entries matching pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

interface CacheEntry {
  value: any
  expiry: number
  lastAccess: number
}
```

## Migration Strategy for Phase 9H

### Step 1: Create Validation Module
```bash
mkdir -p src/utils/validation/types
touch src/utils/validation/ValidationService.ts
touch src/utils/validation/PrerequisiteService.ts
touch src/utils/validation/DependencyGraph.ts
touch src/utils/validation/ValidationCache.ts
```

### Step 2: Update SimulationEngine
```typescript
// SimulationEngine.ts
import { ValidationService } from './validation/ValidationService'
import { PrerequisiteService } from './validation/PrerequisiteService'

export class SimulationEngine {
  private validationService: ValidationService
  private prerequisiteService: PrerequisiteService
  
  constructor(config: SimulationConfig, gameDataStore: GameDataStore) {
    this.validationService = new ValidationService(gameDataStore)
    this.prerequisiteService = new PrerequisiteService(gameDataStore)
    // ...
  }
  
  // Use validation service
  private validateAction(action: GameAction): boolean {
    const result = this.validationService.validateAction(
      action,
      this.gameState,
      this.gameDataStore
    )
    
    if (!result.valid) {
      console.warn('Action validation failed:', result.errors)
      
      // Log warnings
      for (const warning of result.warnings) {
        console.warn(`Warning: ${warning.message}`)
      }
    }
    
    return result.valid
  }
}
```

## Testing Strategy

```typescript
describe('ValidationService', () => {
  let validationService: ValidationService
  let gameState: GameState
  
  beforeEach(() => {
    validationService = new ValidationService(gameDataStore)
    gameState = createMockGameState()
  })
  
  describe('Action Validation', () => {
    it('should validate valid action', () => {
      const action: GameAction = {
        id: 'plant_1',
        type: 'plant',
        targetId: 'carrot',
        energyCost: 0
      }
      
      gameState.resources.seeds.set('carrot', 5)
      
      const result = validationService.validateAction(action, gameState, gameDataStore)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should catch missing prerequisites', () => {
      const action: GameAction = {
        id: 'build_1',
        type: 'build',
        targetId: 'advanced_structure'
      }
      
      const result = validationService.validateAction(action, gameState, gameDataStore)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_PREREQUISITES'
        })
      )
    })
  })
})

describe('DependencyGraph', () => {
  it('should detect circular dependencies', () => {
    const graph = new DependencyGraph(gameDataStore)
    const cycles = graph.detectCycles()
    
    expect(cycles).toHaveLength(0) // Should have no cycles in valid data
  })
  
  it('should calculate unlock order', () => {
    const graph = new DependencyGraph(gameDataStore)
    const order = graph.getUnlockOrder('endgame_item')
    
    expect(order[0]).toBe('starting_item')
    expect(order[order.length - 1]).toBe('endgame_item')
  })
})
```

## Benefits After Phase 9H

1. **Centralized Validation**: All validation logic in one place
2. **Performance**: Caching reduces redundant checks
3. **Dependency Analysis**: Clear understanding of unlock chains
4. **Better Errors**: Detailed error messages with codes
5. **SimulationEngine Reduction**: ~300 lines moved out
6. **Warnings System**: Non-blocking warnings for UX

## Next Phase Preview
Phase 9I will extract the event system, creating a robust event bus for all game events, logging, and inter-system communication.