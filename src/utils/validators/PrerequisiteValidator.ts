/**
 * Comprehensive PrerequisiteValidator - Phase 8O Implementation
 * 
 * Validates CSV data for circular dependencies, prerequisite existence,
 * farm stage gates, tool requirements, and bootstrap economy viability.
 */

import type { GameDataItem } from '@/types'
import { CSVDataParser } from '../CSVDataParser'

interface ValidationError {
  type: 'circular_dependency' | 'missing_prerequisite' | 'bootstrap_failure' | 'missing_stage_gate' | 'invalid_tool_requirement'
  message: string
  item: string
  cycle?: string[]
  cost?: number
  requiredStage?: string
  suggestion?: string
}

interface ValidationWarning {
  type: 'progression_block' | 'missing_stage_gate' | 'inconsistent_gating'
  message: string
  item: string
  requiredStage?: string
  suggestion?: string
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  dependencyTree: Map<string, string[]>
}

interface DependencyNode {
  id: string
  prerequisites: string[]
  dependents: string[]
}

export class PrerequisiteValidator {
  private items: GameDataItem[]
  private errors: ValidationError[]
  private warnings: ValidationWarning[]
  private dependencyGraph: Map<string, DependencyNode>
  private visited: Set<string>
  private recursionStack: Set<string>

  constructor(csvData: { allItems: GameDataItem[] }) {
    this.items = csvData.allItems || []
    this.errors = []
    this.warnings = []
    this.dependencyGraph = new Map()
    this.visited = new Set()
    this.recursionStack = new Set()
  }

  /**
   * Performs comprehensive validation of all CSV data
   */
  validateAll(): ValidationResult {
    console.log(`🔍 PrerequisiteValidator: Starting comprehensive validation of ${this.items.length} items`)
    
    // Clear previous state
    this.errors = []
    this.warnings = []
    this.visited.clear()
    this.recursionStack.clear()
    
    // Build dependency graph
    this.buildDependencyGraph()
    
    // Run all validation checks
    this.checkCircularDependencies()
    this.validatePrerequisiteExistence()
    this.validateFarmStageGating()
    this.validateToolDependencies()
    this.validateMaterialChains()
    this.validateBootstrapEconomy()
    
    const result: ValidationResult = {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      dependencyTree: this.buildDependencyTree()
    }
    
    console.log(`✅ PrerequisiteValidator: Validation complete - ${this.errors.length} errors, ${this.warnings.length} warnings`)
    
    return result
  }

  /**
   * Builds internal dependency graph for efficient traversal
   */
  private buildDependencyGraph(): void {
    this.dependencyGraph.clear()
    
    for (const item of this.items) {
      if (!item.id) continue
      
      const node: DependencyNode = {
        id: item.id,
        prerequisites: this.parsePrerequisites(item.prerequisite || ''),
        dependents: []
      }
      
      this.dependencyGraph.set(item.id, node)
    }
    
    // Build reverse dependencies (dependents)
    for (const [itemId, node] of this.dependencyGraph.entries()) {
      for (const prereqId of node.prerequisites) {
        const prereqNode = this.dependencyGraph.get(prereqId)
        if (prereqNode) {
          prereqNode.dependents.push(itemId)
        }
      }
    }
  }

  /**
   * Checks for circular dependencies using DFS
   */
  private checkCircularDependencies(): void {
    console.log('🔄 Checking for circular dependencies...')
    
    for (const itemId of this.dependencyGraph.keys()) {
      if (!this.visited.has(itemId)) {
        this.detectCycle(itemId, [])
      }
    }
  }

  /**
   * DFS traversal to detect cycles
   */
  private detectCycle(itemId: string, path: string[]): boolean {
    if (this.recursionStack.has(itemId)) {
      // Found a cycle
      const cycleStart = path.indexOf(itemId)
      const cycle = [...path.slice(cycleStart), itemId]
      
      this.errors.push({
        type: 'circular_dependency',
        message: `Circular dependency detected: ${cycle.join(' → ')}`,
        item: itemId,
        cycle
      })
      
      return true
    }
    
    if (this.visited.has(itemId)) {
      return false
    }
    
    this.visited.add(itemId)
    this.recursionStack.add(itemId)
    
    const node = this.dependencyGraph.get(itemId)
    if (node) {
      for (const prereqId of node.prerequisites) {
        if (this.detectCycle(prereqId, [...path, itemId])) {
          return true
        }
      }
    }
    
    this.recursionStack.delete(itemId)
    return false
  }

  /**
   * Validates that all prerequisites exist in the data
   */
  private validatePrerequisiteExistence(): void {
    console.log('📋 Validating prerequisite existence...')
    
    for (const item of this.items) {
      if (!item.prerequisite) continue
      
      const prerequisites = this.parsePrerequisites(item.prerequisite)
      for (const prereqId of prerequisites) {
        if (!this.prerequisiteExists(prereqId)) {
          this.errors.push({
            type: 'missing_prerequisite',
            message: `Item "${item.id}" requires "${prereqId}" which doesn't exist`,
            item: item.id
          })
        }
      }
    }
  }

  /**
   * Validates farm stage gating is consistent
   */
  private validateFarmStageGating(): void {
    console.log('🏡 Validating farm stage gating...')
    
    const stageGates = {
      'small_hold': 'small_hold_complete',
      'homestead': 'homestead_deed',
      'manor_grounds': 'manor_grounds_deed',
      'great_estate': 'great_estate_deed'
    }
    
    for (const item of this.items) {
      const requiredStage = this.detectRequiredFarmStage(item)
      if (requiredStage && stageGates[requiredStage]) {
        const expectedGate = stageGates[requiredStage]
        
        if (!this.hasPrerequisite(item, expectedGate)) {
          this.warnings.push({
            type: 'missing_stage_gate',
            message: `Item "${item.id}" may require ${requiredStage} stage but lacks prerequisite`,
            item: item.id,
            requiredStage,
            suggestion: `Add prerequisite: ${expectedGate}`
          })
        }
      }
    }
  }

  /**
   * Validates tool requirements match cleanup actions
   */
  private validateToolDependencies(): void {
    console.log('🔨 Validating tool dependencies...')
    
    const TOOL_GATES = {
      // Hammer requirements
      'clear_small_boulders': 'hammer',
      'crack_small_boulders': 'hammer',
      'break_boulders': 'hammer',
      'crack_boulders': 'hammer_plus',
      'break_mineral_depost': 'hammer_plus',
      'break_stone_monoliths': 'stone_breaker',
      
      // Axe requirements
      'split_small_stumps': 'axe',
      'remove_stumps': 'axe',
      'clear_thickets': 'axe_plus',
      'buck_fallen_trunks': 'axe_plus',
      'cut_ancient_roots': 'world_splitter',
      
      // Shovel requirements
      'level_molehills': 'shovel',
      'dig_buried_stones': 'shovel',
      'eliminate_molehills': 'shovel_plus',
      'landscape_section': 'shovel_plus',
      'flatten_hill': 'earth_mover',
      
      // Hoe requirements
      'small_hold_till_soil_1': 'hoe',
      'small_hold_till_soil_2': 'hoe',
      'small_hold_till_soil_3': 'hoe',
      'small_hold_till_soil_4': 'hoe',
      'homestead_till_soil_4': 'hoe_plus',
      'homestead_till_soil_5': 'hoe_plus',
      'homestead_till_soil_6': 'hoe_plus',
      'till_manor_grounds_4': 'terra_former',
      'till_manor_grounds_5': 'terra_former',
      'till_manor_grounds_6': 'terra_former'
    }
    
    for (const [actionId, requiredTool] of Object.entries(TOOL_GATES)) {
      const action = this.items.find(item => item.id === actionId)
      if (!action) continue
      
      const hasToolInPrereqs = this.hasPrerequisite(action, `craft_${requiredTool}`)
      const hasToolRequired = action.tool_required === requiredTool
      
      if (!hasToolInPrereqs && !hasToolRequired) {
        this.warnings.push({
          type: 'missing_stage_gate',
          message: `Cleanup "${actionId}" should require ${requiredTool} tool`,
          item: actionId,
          suggestion: `Add prerequisite: craft_${requiredTool} or set tool_required: ${requiredTool}`
        })
      }
    }
  }

  /**
   * Validates material chains are accessible
   */
  private validateMaterialChains(): void {
    console.log('⚒️ Validating material chains...')
    
    // Check that basic materials are obtainable
    const essentialMaterials = ['wood', 'stone', 'copper', 'iron', 'silver']
    
    for (const material of essentialMaterials) {
      const obtainableSources = this.items.filter(item => 
        item.materials_gain?.includes(material) || 
        item.type === 'clean_up' && item.materials_gain?.includes(material)
      )
      
      if (obtainableSources.length === 0) {
        this.warnings.push({
          type: 'progression_block',
          message: `Essential material "${material}" has no obtainable sources`,
          item: material,
          suggestion: 'Add cleanup actions or mining sources for this material'
        })
      }
    }
  }

  /**
   * Validates bootstrap economy (50g start allows weapon blueprint access)
   */
  private validateBootstrapEconomy(): void {
    console.log('💰 Validating bootstrap economy...')
    
    const startingGold = 50
    
    // Check that first weapon blueprint is affordable
    const swordBlueprint = this.items.find(item => item.id === 'blueprint_sword_1')
    if (swordBlueprint) {
      const cost = swordBlueprint.gold_cost || 0
      if (cost > startingGold) {
        this.errors.push({
          type: 'bootstrap_failure',
          message: `Sword I blueprint costs ${cost}g, but players start with only ${startingGold}g`,
          item: swordBlueprint.id,
          cost
        })
      } else {
        console.log(`✅ Bootstrap economy valid: Sword I blueprint (${cost}g) <= starting gold (${startingGold}g)`)
      }
    }
    
    // Verify first adventure is accessible
    const firstAdventure = this.items.find(item => item.id === 'meadow_path_short')
    if (firstAdventure && firstAdventure.prerequisite) {
      const prereqs = this.parsePrerequisites(firstAdventure.prerequisite)
      const hasComplexPrereqs = prereqs.some(p => !['tutorial', ''].includes(p))
      
      if (hasComplexPrereqs) {
        this.warnings.push({
          type: 'progression_block',
          message: 'First adventure may be blocked by complex prerequisites',
          item: firstAdventure.id,
          suggestion: 'Ensure tutorial prerequisites are easily obtainable'
        })
      }
    }
  }

  /**
   * Builds dependency tree for visualization
   */
  private buildDependencyTree(): Map<string, string[]> {
    const tree = new Map<string, string[]>()
    
    for (const [itemId, node] of this.dependencyGraph.entries()) {
      tree.set(itemId, node.prerequisites)
    }
    
    return tree
  }

  /**
   * Helper: Parse prerequisites from CSV field
   */
  private parsePrerequisites(prerequisiteField: string): string[] {
    if (!prerequisiteField || prerequisiteField.trim() === '') {
      return []
    }
    
    return prerequisiteField
      .split(';')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => CSVDataParser.normalizeId(p))
  }

  /**
   * Helper: Check if prerequisite exists in data
   */
  private prerequisiteExists(prereqId: string): boolean {
    // Check if it's an item in our data
    if (this.items.some(item => item.id === prereqId)) {
      return true
    }
    
    // Check if it's a special prerequisite type
    const specialTypes = [
      'tutorial', 'farm_stage_', 'hero_level_', 'craft_', 
      'tower_reach_', 'small_hold', 'homestead', 'manor_grounds', 
      'great_estate', '_deed', '_complete'
    ]
    
    return specialTypes.some(type => prereqId.includes(type))
  }

  /**
   * Helper: Detect required farm stage from item
   */
  private detectRequiredFarmStage(item: GameDataItem): string | null {
    // Check categories for farm stage indicators
    if (item.categories?.includes('farm_clean_up_route_1')) {
      return 'homestead' // Most route 1 actions need homestead
    }
    
    // Check prerequisites for stage indicators
    const prerequisites = this.parsePrerequisites(item.prerequisite || '')
    
    if (prerequisites.some(p => p.includes('great_estate'))) {
      return 'great_estate'
    }
    if (prerequisites.some(p => p.includes('manor_grounds'))) {
      return 'manor_grounds'
    }
    if (prerequisites.some(p => p.includes('homestead'))) {
      return 'homestead'
    }
    if (prerequisites.some(p => p.includes('small_hold'))) {
      return 'small_hold'
    }
    
    return null
  }

  /**
   * Helper: Check if item has specific prerequisite
   */
  private hasPrerequisite(item: GameDataItem, expectedPrereq: string): boolean {
    if (!item.prerequisite) return false
    
    const prerequisites = this.parsePrerequisites(item.prerequisite)
    return prerequisites.includes(expectedPrereq) || 
           prerequisites.some(p => p.includes(expectedPrereq))
  }

  /**
   * Static method to validate specific CSV file
   */
  static validateCSVFile(csvData: { allItems: GameDataItem[] }): ValidationResult {
    const validator = new PrerequisiteValidator(csvData)
    return validator.validateAll()
  }

  /**
   * Static method to quickly check for critical errors
   */
  static quickCheck(csvData: { allItems: GameDataItem[] }): { hasCriticalErrors: boolean; errorCount: number } {
    const result = PrerequisiteValidator.validateCSVFile(csvData)
    const criticalErrors = result.errors.filter(e => 
      e.type === 'circular_dependency' || e.type === 'bootstrap_failure'
    ).length
    
    return {
      hasCriticalErrors: criticalErrors > 0,
      errorCount: result.errors.length
    }
  }
}
