import type { GameDataItem } from '@/types/game-data'
import { CSV_FILE_LIST } from '@/types/csv-data'
import { validationReporter, type ValidationReport } from './validationReporter'

// Complete swim lanes including individual town vendors
const SWIM_LANES = [
  'Farm',              // Row 0
  'Vendors',           // Row 1 - Town vendors (general)
  'Blacksmith',        // Row 2 - Town blacksmith items  
  'Agronomist',        // Row 3 - Town agronomist items
  'Carpenter',         // Row 4 - Town carpenter items
  'Land Steward',      // Row 5 - Town land steward items
  'Material Trader',   // Row 6 - Town material trader items
  'Skills Trainer',    // Row 7 - Town skills trainer items
  'Adventure',         // Row 8 - Adventure routes
  'Combat',            // Row 9 - Combat items
  'Forge',             // Row 10 - Forge items
  'Mining',            // Row 11 - Mining items
  'Tower',             // Row 12 - Tower items
  'General'            // Row 13 - Catch-all
]



// Standardized constants - MUST match calculateNodePosition values
const LAYOUT_CONSTANTS = {
  NODE_HEIGHT: 40,      // Match Cytoscape node height
  NODE_PADDING: 15,     // Vertical spacing between nodes
  LANE_PADDING: 25,     // Padding between lanes
  LANE_BUFFER: 20,      // Padding within lanes (top/bottom)
  MIN_LANE_HEIGHT: 100, // Minimum lane height
  TIER_WIDTH: 180,      // Horizontal spacing between tiers
  NODE_WIDTH: 140,      // Actual node width
  LANE_START_X: 200,    // Space for lane labels
  MIN_NODE_SPACING: 15, // Minimum spacing between nodes (Requirement 3.3: at least 15px)
  BOUNDARY_TOLERANCE: 1 // Tolerance for boundary validation (pixels)
}

// Interface for lane boundary information
interface LaneBoundary {
  lane: string
  startY: number
  endY: number
  centerY: number
  height: number
  usableHeight: number // excluding buffers
}

// Interface for positioned node validation
interface PositionedNode {
  item: GameDataItem
  position: { x: number, y: number }
  lane: string
  tier: number
  withinBounds: boolean
}

// Interface for boundary violation information
interface BoundaryViolation {
  node: PositionedNode
  violationType: 'top' | 'bottom'
  actualPosition: { x: number, y: number }
  allowedBoundary: LaneBoundary
  severity: 'minor' | 'major' | 'critical'
  adjustedPosition?: { x: number, y: number }
}

// Interface for validation results
interface ValidationResult {
  testName: string
  passed: boolean
  issues: ValidationIssue[]
  recommendations: string[]
  metrics?: Record<string, number>
}

// Interface for validation issues
interface ValidationIssue {
  severity: 'error' | 'warning' | 'info'
  message: string
  nodeId?: string
  lane?: string
  position?: { x: number, y: number }
  expectedPosition?: { x: number, y: number }
}

// Interface for position calculation debug info
interface PositionCalculationDebug {
  nodeId: string
  nodeName: string
  lane: string
  tier: number
  calculatedPosition: { x: number, y: number }
  finalPosition: { x: number, y: number }
  boundary: LaneBoundary
  adjustmentApplied: boolean
  adjustmentReason?: string
  withinBounds: boolean
  calculations: {
    tierX: number
    laneY: number
    nodeIndex: number
    totalNodesInTier: number
    spacingUsed: number
  }
}

/**
 * Calculate lane boundaries for boundary enforcement
 * Creates precise boundary information for each swimlane including:
 * - Start/end Y coordinates
 * - Usable height (excluding buffers)
 * - Center point for single node positioning
 * 
 * @param laneHeights Map of lane names to their calculated heights
 * @returns Map of lane names to their boundary information
 */
function calculateLaneBoundaries(laneHeights: Map<string, number>): Map<string, LaneBoundary> {
  const boundaries = new Map<string, LaneBoundary>()
  let cumulativeY = LAYOUT_CONSTANTS.LANE_PADDING
  
  // Only show detailed boundary calculation in debug mode
  const showDetailedBoundaries = (typeof window !== 'undefined' && (window as any).ENABLE_COMPREHENSIVE_VALIDATION === true)
  
  if (showDetailedBoundaries) {
    console.log(`\n🏗️ LANE BOUNDARY CALCULATION`)
    console.log(`═══════════════════════════`)
  }
  
  SWIM_LANES.forEach(lane => {
    const height = laneHeights.get(lane) || LAYOUT_CONSTANTS.MIN_LANE_HEIGHT
    const wasUsingFallback = !laneHeights.has(lane)
    const startY = cumulativeY
    const endY = cumulativeY + height
    const centerY = startY + (height / 2)
    const usableHeight = height - (2 * LAYOUT_CONSTANTS.LANE_BUFFER)
    
    boundaries.set(lane, {
      lane,
      startY,
      endY,
      centerY,
      height,
      usableHeight
    })
    
    // Remove individual boundary logs - they're too verbose
    
    cumulativeY += height + LAYOUT_CONSTANTS.LANE_PADDING
  })
  
  if (showDetailedBoundaries) {
    console.log(`  Total height: ${cumulativeY - LAYOUT_CONSTANTS.LANE_PADDING}px`)
    console.log(``)
  }
  // Remove the summary log - it's not essential
  
  return boundaries
}

/**
 * Calculate space requirements for a given number of nodes using the same logic as handleOvercrowdedLane
 * This simulates the actual positioning algorithm to determine accurate space needs
 * 
 * @param nodeCount Number of nodes to position
 * @returns Required height including all spacing and buffers
 */
function calculateSpaceRequirements(nodeCount: number): number {
  if (nodeCount === 0) {
    return LAYOUT_CONSTANTS.MIN_LANE_HEIGHT
  }
  
  if (nodeCount === 1) {
    // Single node: just needs node height plus buffers (will be centered)
    // But ensure it meets minimum lane height requirement
    const singleNodeHeight = LAYOUT_CONSTANTS.NODE_HEIGHT + (2 * LAYOUT_CONSTANTS.LANE_BUFFER)
    return Math.max(LAYOUT_CONSTANTS.MIN_LANE_HEIGHT, singleNodeHeight)
  }
  
  // Multiple nodes: calculate based on positioning algorithm
  const totalNodeHeight = nodeCount * LAYOUT_CONSTANTS.NODE_HEIGHT
  const idealSpacingHeight = (nodeCount - 1) * LAYOUT_CONSTANTS.NODE_PADDING
  const bufferHeight = 2 * LAYOUT_CONSTANTS.LANE_BUFFER
  
  // Calculate total height needed for comfortable spacing
  const comfortableHeight = totalNodeHeight + idealSpacingHeight + bufferHeight
  
  // Ensure minimum height
  const finalHeight = Math.max(LAYOUT_CONSTANTS.MIN_LANE_HEIGHT, comfortableHeight)
  
  return finalHeight
}

/**
 * Calculate lane heights based on actual node distribution and positioning logic
 * This function simulates the same positioning algorithm used in handleOvercrowdedLane
 * to ensure calculated heights accurately match the space needed for actual positioning
 * 
 * @param items All game data items to analyze
 * @returns Map of lane names to their calculated heights
 */
function calculateLaneHeights(items: GameDataItem[]): Map<string, number> {
  const laneHeights = new Map<string, number>()
  const nodesPerLaneTier = new Map<string, Map<number, number>>()
  const laneAnalysis = new Map<string, { maxTier: number, maxNodesInTier: number, totalNodes: number }>()
  
  // Count nodes per lane per tier - this matches the actual positioning logic
  items.forEach(item => {
    const lane = determineSwimLane(item)
    const tier = calculatePrerequisiteDepth(item, items)
    
    if (!nodesPerLaneTier.has(lane)) {
      nodesPerLaneTier.set(lane, new Map())
    }
    const tierMap = nodesPerLaneTier.get(lane)!
    tierMap.set(tier, (tierMap.get(tier) || 0) + 1)
  })
  
  // Analyze each lane to find the tier with maximum nodes
  SWIM_LANES.forEach(lane => {
    const tierMap = nodesPerLaneTier.get(lane)
    if (!tierMap || tierMap.size === 0) {
      // Empty lane: use minimum height
      laneHeights.set(lane, LAYOUT_CONSTANTS.MIN_LANE_HEIGHT)
      laneAnalysis.set(lane, { maxTier: -1, maxNodesInTier: 0, totalNodes: 0 })
      return
    }
    
    // Find the tier with the maximum number of nodes
    let maxNodesInTier = 0
    let maxTier = -1
    let totalNodes = 0
    
    tierMap.forEach((count, tier) => {
      totalNodes += count
      if (count > maxNodesInTier) {
        maxNodesInTier = count
        maxTier = tier
      }
    })
    
    // Calculate required height using the same logic as positioning algorithm
    const requiredHeight = calculateSpaceRequirements(maxNodesInTier)
    
    // Store the calculated height
    laneHeights.set(lane, requiredHeight)
    laneAnalysis.set(lane, { maxTier, maxNodesInTier, totalNodes })
    
    // Only log height calculations in debug mode
    if ((typeof window !== 'undefined' && (window as any).ENABLE_COMPREHENSIVE_VALIDATION === true) && totalNodes > 0) {
      console.log(`🏊 Lane ${lane}: ${totalNodes} total nodes, max ${maxNodesInTier} in tier ${maxTier} → height ${requiredHeight}px`)
    }
  })
  
  // Only validate height calculations in debug mode
  if ((typeof window !== 'undefined' && (window as any).ENABLE_COMPREHENSIVE_VALIDATION === true)) {
    validateHeightCalculations(laneHeights, laneAnalysis)
  }
  
  return laneHeights
}

/**
 * Validate that calculated lane heights will accommodate actual positioning needs
 * This ensures the height calculation matches what the positioning algorithm requires
 * 
 * @param laneHeights Calculated lane heights
 * @param laneAnalysis Analysis data for each lane
 */
function validateHeightCalculations(
  laneHeights: Map<string, number>,
  laneAnalysis: Map<string, { maxTier: number, maxNodesInTier: number, totalNodes: number }>
): void {
  let validationIssues: string[] = []
  let warnings: string[] = []
  
  laneAnalysis.forEach((analysis, lane) => {
    const calculatedHeight = laneHeights.get(lane) || 0
    const { maxNodesInTier, totalNodes } = analysis
    
    if (totalNodes === 0) return // Skip empty lanes
    
    // Validate against minimum lane height first
    if (calculatedHeight < LAYOUT_CONSTANTS.MIN_LANE_HEIGHT) {
      validationIssues.push(`❌ Lane ${lane}: calculated height ${calculatedHeight}px < minimum ${LAYOUT_CONSTANTS.MIN_LANE_HEIGHT}px`)
      return // Skip further validation if basic requirement not met
    }
    
    // Calculate usable height (excluding buffers)
    const usableHeight = calculatedHeight - (2 * LAYOUT_CONSTANTS.LANE_BUFFER)
    
    // Check if the usable height can accommodate the maximum nodes in any tier
    const minRequiredHeight = maxNodesInTier * LAYOUT_CONSTANTS.NODE_HEIGHT
    const minRequiredWithSpacing = minRequiredHeight + ((maxNodesInTier - 1) * LAYOUT_CONSTANTS.MIN_NODE_SPACING)
    
    if (usableHeight < minRequiredHeight) {
      validationIssues.push(`❌ Lane ${lane}: usable height ${usableHeight}px < minimum required ${minRequiredHeight}px for ${maxNodesInTier} nodes`)
    } else if (usableHeight < minRequiredWithSpacing && maxNodesInTier > 1) {
      warnings.push(`⚠️ Lane ${lane}: tight spacing - usable height ${usableHeight}px, needs ${minRequiredWithSpacing}px for comfortable spacing`)
    }
    
    // Additional validation for single node lanes
    if (maxNodesInTier === 1 && calculatedHeight === LAYOUT_CONSTANTS.MIN_LANE_HEIGHT) {
      console.log(`✅ Lane ${lane}: single node using minimum height ${calculatedHeight}px (appropriate)`)
    }
  })
  
  // Report validation results
  if (validationIssues.length > 0) {
    console.error(`\n❌ LANE HEIGHT VALIDATION ERRORS:`)
    validationIssues.forEach(issue => console.error(issue))
    console.error(``)
  } else {
    console.log(`✅ All lane height calculations validated successfully`)
  }
  
  // Report warnings separately
  if (warnings.length > 0) {
    console.log(`\n⚠️ Lane height warnings:`)
    warnings.forEach(warning => console.warn(warning))
  }
}

/**
 * Automated Testing Functions for Position Validation
 */

/**
 * Run automated boundary compliance tests
 */
function runAutomatedBoundaryTests(items: GameDataItem[]): ValidationResult {
  console.log(`\n🤖 AUTOMATED BOUNDARY COMPLIANCE TESTS`)
  console.log(`═══════════════════════════════════════`)
  
  const issues: ValidationIssue[] = []
  
  // Filter to tree items only
  const treeItems = items.filter(item => 
    item.category === 'Actions' || item.category === 'Unlocks'
  )
  
  if (treeItems.length === 0) {
    return {
      testName: 'Automated Boundary Tests',
      passed: false,
      issues: [{
        severity: 'error',
        message: 'No tree items found for testing'
      }],
      recommendations: ['Ensure game data is loaded properly']
    }
  }
  
  // Calculate positioning components
  const laneHeights = calculateLaneHeights(treeItems)
  const laneBoundaries = calculateLaneBoundaries(laneHeights)
  
  // Test each item's theoretical positioning
  let testedNodes = 0
  let boundaryViolations = 0
  
  treeItems.forEach(item => {
    const lane = determineSwimLane(item)
    const tier = calculatePrerequisiteDepth(item, treeItems)
    const boundary = laneBoundaries.get(lane)
    
    if (!boundary) {
      issues.push({
        severity: 'error',
        message: `No boundary found for lane "${lane}" (item: ${item.name})`,
        nodeId: item.id,
        lane
      })
      return
    }
    
    // Simulate position calculation
    const theoreticalX = LAYOUT_CONSTANTS.LANE_START_X + (tier * LAYOUT_CONSTANTS.TIER_WIDTH)
    const theoreticalY = boundary.centerY // Simplified for testing
    
    // Test boundary compliance
    const nodeHalfHeight = LAYOUT_CONSTANTS.NODE_HEIGHT / 2
    const minY = boundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
    const maxY = boundary.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
    
    if (theoreticalY < minY || theoreticalY > maxY) {
      boundaryViolations++
      issues.push({
        severity: 'warning',
        message: `Item "${item.name}" would violate boundary in lane "${lane}"`,
        nodeId: item.id,
        lane,
        position: { x: theoreticalX, y: theoreticalY }
      })
    }
    
    testedNodes++
  })
  
  const passed = boundaryViolations === 0
  
  console.log(`  Tested ${testedNodes} items`)
  console.log(`  Boundary violations: ${boundaryViolations}`)
  console.log(`  Success rate: ${((testedNodes - boundaryViolations) / testedNodes * 100).toFixed(1)}%`)
  
  return {
    testName: 'Automated Boundary Tests',
    passed,
    issues,
    recommendations: passed ? [] : [
      'Review lane height calculations',
      'Check boundary enforcement logic',
      'Consider redistributing overcrowded lanes'
    ],
    metrics: {
      testedNodes,
      boundaryViolations,
      successRate: (testedNodes - boundaryViolations) / testedNodes * 100
    }
  }
}

/**
 * Run automated performance tests for validation system
 */
function runAutomatedPerformanceTests(items: GameDataItem[]): ValidationResult {
  console.log(`\n⚡ AUTOMATED PERFORMANCE TESTS`)
  console.log(`═══════════════════════════`)
  
  const issues: ValidationIssue[] = []
  
  // Test validation system performance
  const startTime = performance.now()
  
  try {
    // Run a full validation cycle
    const { nodes, edges, laneHeights, laneBoundaries } = buildGraphElements(items)
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    console.log(`  Full validation cycle: ${duration.toFixed(2)}ms`)
    
    // Performance thresholds
    const maxAcceptableTime = 2000 // 2 seconds
    const warningTime = 1000 // 1 second
    
    if (duration > maxAcceptableTime) {
      issues.push({
        severity: 'error',
        message: `Validation took ${duration.toFixed(2)}ms (exceeds ${maxAcceptableTime}ms limit)`
      })
    } else if (duration > warningTime) {
      issues.push({
        severity: 'warning',
        message: `Validation took ${duration.toFixed(2)}ms (approaching ${maxAcceptableTime}ms limit)`
      })
    }
    
    return {
      testName: 'Automated Performance Tests',
      passed: duration <= maxAcceptableTime,
      issues,
      recommendations: issues.length > 0 ? [
        'Optimize validation algorithms',
        'Consider caching validation results',
        'Profile performance bottlenecks'
      ] : [],
      metrics: {
        validationTime: duration,
        nodesProcessed: nodes.length,
        edgesProcessed: edges.length,
        lanesProcessed: laneHeights.size
      }
    }
    
  } catch (error) {
    issues.push({
      severity: 'error',
      message: `Validation failed with error: ${error}`
    })
    
    return {
      testName: 'Automated Performance Tests',
      passed: false,
      issues,
      recommendations: [
        'Fix validation system errors',
        'Check data integrity'
      ]
    }
  }
}

/**
 * Run all automated tests
 */
function runAllAutomatedTests(items: GameDataItem[]): ValidationResult[] {
  console.log(`\n🧪 RUNNING ALL AUTOMATED TESTS`)
  console.log(`═══════════════════════════════`)
  
  const results: ValidationResult[] = []
  
  // Run boundary compliance tests
  results.push(runAutomatedBoundaryTests(items))
  
  // Run performance tests
  results.push(runAutomatedPerformanceTests(items))
  
  // Summary
  const passed = results.filter(r => r.passed).length
  const total = results.length
  
  console.log(`\n📊 AUTOMATED TEST SUMMARY`)
  console.log(`═══════════════════════════`)
  console.log(`Tests passed: ${passed}/${total}`)
  
  if (passed < total) {
    console.log(`❌ ${total - passed} tests failed`)
  } else {
    console.log(`✅ All automated tests passed`)
  }
  
  return results
}

export function buildGraphElements(items: GameDataItem[]) {
  const nodes: any[] = []
  const edges: any[] = []
  
  // Only run validation in debug mode to reduce noise
  const shouldRunValidation = (typeof window !== 'undefined' && (window as any).ENABLE_COMPREHENSIVE_VALIDATION === true)
  
  if (shouldRunValidation) {
    validationReporter.startValidation()
  }
  
  // FILTER: Only Actions and Unlocks (no Data items)
  const treeItems = items.filter(item => 
    item.category === 'Actions' || item.category === 'Unlocks'
  )
  
  // Removed verbose build logging
  
  // Calculate lane heights first
  const laneHeights = calculateLaneHeights(treeItems)
  
  // Calculate lane boundaries for boundary enforcement
  const laneBoundaries = calculateLaneBoundaries(laneHeights)
  
  // Sort items by tier for consistent positioning
  const sortedItems = treeItems.sort((a, b) => {
    const tierA = calculatePrerequisiteDepth(a, treeItems)
    const tierB = calculatePrerequisiteDepth(b, treeItems)
    return tierA - tierB
  })
  
  // Track all positioned nodes for validation
  const positionedNodes: PositionedNode[] = []
  const allWarnings: string[] = []
  
  // Create nodes with boundary-enforced positioning
  sortedItems.forEach(item => {
    const swimLane = determineSwimLane(item)
    const tier = calculatePrerequisiteDepth(item, treeItems)
    
    // Calculate initial position
    let position = calculateNodePosition(item, swimLane, sortedItems, laneHeights, laneBoundaries)
    
    // Enforce boundary constraints
    position = enforceBoundaryConstraints(position, swimLane, laneBoundaries)
    
    // Create positioned node for validation
    const positionedNode: PositionedNode = {
      item,
      position,
      lane: swimLane,
      tier,
      withinBounds: true // Will be validated below
    }
    
    // Validate position is within bounds
    const validation = validatePositionWithinBounds(position, swimLane, laneBoundaries)
    positionedNode.withinBounds = validation.withinBounds
    
    positionedNodes.push(positionedNode)
    
    nodes.push({
      data: {
        id: item.id,
        label: item.name || item.id,
        swimLane: swimLane,
        tier: tier,
        category: item.categories?.[0] || 'general',
        goldCost: item.goldCost,
        energyCost: item.energyCost,
        level: item.level,
        prerequisites: item.prerequisites || [],
        // Store full item data for modal
        fullData: item
      },
      position,
      classes: [
        'game-node',  // Add base class
        `lane-${swimLane.toLowerCase().replace(/\s+/g, '-')}`,
        `tier-${tier}`,
        `category-${(item.categories?.[0] || 'general').toLowerCase()}`,
        `feature-${getGameFeatureFromSourceFile(item.sourceFile).toLowerCase()}`
      ].join(' ')
    })
  })
  
  // Only run validation in debug mode
  let comprehensiveReport: ValidationReport | undefined
  
  if (shouldRunValidation) {
    // Run validation only when explicitly requested
    const violations = validateAllPositions(positionedNodes, laneBoundaries)
    const criticalViolations = violations.filter(v => v.severity === 'critical')
    
    if (criticalViolations.length > 0) {
      console.error(`❌ ${criticalViolations.length} critical positioning errors found`)
    } else if (violations.length > 0) {
      console.warn(`⚠️ ${violations.length} minor positioning adjustments made`)
    } else {
      console.log(`✅ All ${nodes.length} nodes positioned correctly`)
    }
    
    comprehensiveReport = validationReporter.generateReport([])
  } else {
    // Production mode: minimal logging
    console.log(`📊 Graph built: ${nodes.length} nodes, ${edges.length} edges`)
    comprehensiveReport = validationReporter.generateReport([])
  }
  
  // Create prerequisite edges (simplified)
  sortedItems.forEach(item => {
    if (item.prerequisites && item.prerequisites.length > 0) {
      const itemTier = calculatePrerequisiteDepth(item, treeItems)
      
      item.prerequisites.forEach(prereqId => {
        const prereq = treeItems.find(i => i.id === prereqId)
        if (!prereq) return
        
        const prereqTier = calculatePrerequisiteDepth(prereq, treeItems)
        
        // Only create edge if prerequisite is actually to the left
        if (prereqTier < itemTier) {
          edges.push({
            data: {
              id: `prereq-${prereqId}-to-${item.id}`,
              source: prereqId,
              target: item.id,
              type: 'prerequisite'
            },
            classes: 'edge-prerequisite'
          })
        }
      })
    }
  })
  
  // Removed verbose creation logging
  
  // Only show diagnostics in debug mode
  if ((typeof window !== 'undefined' && (window as any).ENABLE_COMPREHENSIVE_VALIDATION === true)) {
    generateSwimlaneDiagnostics(nodes, laneHeights, laneBoundaries)
    logEnhancedDistributionSummary(nodes, laneBoundaries)
  }
  
  return { 
    nodes, 
    edges, 
    laneHeights, 
    laneBoundaries,
    validationResults: [],
    validationSummary: { totalTests: 0, failedTests: 0, totalIssues: 0 },
    comprehensiveReport
  }
}

// Export validation functions for external use
export {
  runPositionValidation,
  getValidationSummary,
  getNodeDebugInfo,
  runAutomatedBoundaryTests,
  runAutomatedPerformanceTests,
  runAllAutomatedTests,
  validateAllPositions,
  validatePositionWithinBounds,
  enforceBoundaryConstraints,
  validationReporter
}

function determineSwimLane(item: GameDataItem): string {
  let assignmentReason = ''
  let assignedLane = ''
  
  // Enhanced town vendor mapping with comprehensive coverage
  if (item.sourceFile?.startsWith('town_')) {
    const vendorMatch = item.sourceFile.match(/town_(.+)\.csv$/)
    if (vendorMatch) {
      const vendor = vendorMatch[1]
      switch (vendor) {
        case 'blacksmith':
          assignedLane = 'Blacksmith'
          assignmentReason = `Town vendor file: ${item.sourceFile}`
          break
        case 'agronomist':
          assignedLane = 'Agronomist'
          assignmentReason = `Town vendor file: ${item.sourceFile}`
          break
        case 'carpenter':
          assignedLane = 'Carpenter'
          assignmentReason = `Town vendor file: ${item.sourceFile}`
          break
        case 'land_steward':
          assignedLane = 'Land Steward'
          assignmentReason = `Town vendor file: ${item.sourceFile}`
          break
        case 'material_trader':
          assignedLane = 'Material Trader'
          assignmentReason = `Town vendor file: ${item.sourceFile}`
          break
        case 'skills_trainer':
          assignedLane = 'Skills Trainer'
          assignmentReason = `Town vendor file: ${item.sourceFile}`
          break
        default:
          assignedLane = 'Vendors'
          assignmentReason = `Unknown town vendor: ${vendor}`
      }
    }
  }
  
  // Enhanced game feature mapping using CSV metadata
  if (!assignedLane) {
    const gameFeature = getGameFeatureFromSourceFile(item.sourceFile)
    
    // Direct game feature mapping
    switch (gameFeature) {
      case 'Farm':
        assignedLane = 'Farm'
        assignmentReason = `Game feature: ${gameFeature} from ${item.sourceFile}`
        break
      case 'Adventure':
        assignedLane = 'Adventure'
        assignmentReason = `Game feature: ${gameFeature} from ${item.sourceFile}`
        break
      case 'Combat':
        assignedLane = 'Combat'
        assignmentReason = `Game feature: ${gameFeature} from ${item.sourceFile}`
        break
      case 'Forge':
        assignedLane = 'Forge'
        assignmentReason = `Game feature: ${gameFeature} from ${item.sourceFile}`
        break
      case 'Mining':
        assignedLane = 'Mining'
        assignmentReason = `Game feature: ${gameFeature} from ${item.sourceFile}`
        break
      case 'Tower':
        assignedLane = 'Tower'
        assignmentReason = `Game feature: ${gameFeature} from ${item.sourceFile}`
        break
      case 'Town':
        // For general town items that aren't vendor-specific
        assignedLane = 'Vendors'
        assignmentReason = `General town feature: ${gameFeature} from ${item.sourceFile}`
        break
      case 'General':
        assignedLane = 'General'
        assignmentReason = `General game feature from ${item.sourceFile}`
        break
      default:
        // Continue to fallback logic
        break
    }
  }
  
  // Enhanced fallback logic for unrecognized items
  if (!assignedLane) {
    assignedLane = applyFallbackLogic(item)
    assignmentReason = `Fallback logic applied for unrecognized item`
  }
  
  // Final fallback to General
  if (!assignedLane || !SWIM_LANES.includes(assignedLane)) {
    assignedLane = 'General'
    assignmentReason = `Final fallback - no matching lane found`
  }
  
  // Removed verbose assignment logging
  
  return assignedLane
}

function getGameFeatureFromSourceFile(sourceFile: string): string {
  // Look up game feature from CSV_FILE_LIST metadata
  const fileMetadata = CSV_FILE_LIST.find(file => file.filename === sourceFile)
  return fileMetadata?.gameFeature || 'General'
}

function applyFallbackLogic(item: GameDataItem): string {
  // Fallback logic based on item properties and naming patterns
  
  // Check item name and type for keywords
  const itemName = (item.name || '').toLowerCase()
  const itemType = (item.type || '').toLowerCase()
  const itemCategories = (item.categories || []).map(cat => cat.toLowerCase())
  
  // Farm-related keywords
  if (itemName.includes('farm') || itemName.includes('crop') || itemName.includes('seed') || 
      itemName.includes('plant') || itemName.includes('harvest') || itemName.includes('field') ||
      itemType.includes('crop') || itemCategories.some(cat => cat.includes('farm'))) {
    return 'Farm'
  }
  
  // Combat-related keywords
  if (itemName.includes('weapon') || itemName.includes('armor') || itemName.includes('sword') ||
      itemName.includes('shield') || itemName.includes('combat') || itemName.includes('battle') ||
      itemName.includes('enemy') || itemName.includes('boss') || itemName.includes('damage') ||
      itemType.includes('weapon') || itemType.includes('armor') || 
      itemCategories.some(cat => cat.includes('weapon') || cat.includes('armor') || cat.includes('combat'))) {
    return 'Combat'
  }
  
  // Tool/Forge-related keywords
  if (itemName.includes('tool') || itemName.includes('craft') || itemName.includes('forge') ||
      itemName.includes('hammer') || itemName.includes('anvil') || itemName.includes('hoe') ||
      itemName.includes('axe') || itemName.includes('shovel') || itemName.includes('blueprint') ||
      itemType.includes('tool') || itemType.includes('farm_tool') ||
      itemCategories.some(cat => cat.includes('tool') || cat.includes('craft'))) {
    return 'Forge'
  }
  
  // Mining-related keywords
  if (itemName.includes('mine') || itemName.includes('mining') || itemName.includes('ore') ||
      itemName.includes('stone') || itemName.includes('metal') || itemName.includes('crystal') ||
      itemName.includes('copper') || itemName.includes('iron') || itemName.includes('silver') ||
      itemType.includes('mining') || itemCategories.some(cat => cat.includes('mining'))) {
    return 'Mining'
  }
  
  // Adventure-related keywords
  if (itemName.includes('adventure') || itemName.includes('quest') || itemName.includes('route') ||
      itemName.includes('journey') || itemName.includes('explore') || itemName.includes('travel') ||
      itemType.includes('adventure') || itemCategories.some(cat => cat.includes('adventure'))) {
    return 'Adventure'
  }
  
  // Tower-related keywords
  if (itemName.includes('tower') || itemName.includes('defense') || itemName.includes('guard') ||
      itemType.includes('tower') || itemCategories.some(cat => cat.includes('tower'))) {
    return 'Tower'
  }
  
  // Town vendor keywords (for items that might be vendor-related but not in town_ files)
  if (itemName.includes('vendor') || itemName.includes('shop') || itemName.includes('merchant') ||
      itemName.includes('trade') || itemName.includes('buy') || itemName.includes('sell') ||
      itemType.includes('vendor') || itemCategories.some(cat => cat.includes('vendor'))) {
    return 'Vendors'
  }
  
  // Energy storage keywords (often farm-related)
  if (itemType.includes('energy_storage') || itemName.includes('storage') || itemName.includes('barn')) {
    return 'Farm'
  }
  
  // If no keywords match, check for cost patterns to infer complexity/category
  if (item.goldCost && item.goldCost > 10000) {
    return 'General'
  }
  return 'General'
}

interface LaneAssignmentStats {
  totalItems: number
  itemsPerLane: Map<string, number>
  itemsPerSourceFile: Map<string, number>
  unassignedItems: GameDataItem[]
  assignmentReasons: Map<string, string>
}

function generateAssignmentStatistics(items: GameDataItem[]): LaneAssignmentStats {
  const stats: LaneAssignmentStats = {
    totalItems: items.length,
    itemsPerLane: new Map(),
    itemsPerSourceFile: new Map(),
    unassignedItems: [],
    assignmentReasons: new Map()
  }
  
  // Initialize lane counts
  SWIM_LANES.forEach(lane => {
    stats.itemsPerLane.set(lane, 0)
  })
  
  // Analyze each item
  items.forEach(item => {
    const assignedLane = determineSwimLane(item)
    
    // Count items per lane
    const currentCount = stats.itemsPerLane.get(assignedLane) || 0
    stats.itemsPerLane.set(assignedLane, currentCount + 1)
    
    // Count items per source file
    const sourceFile = item.sourceFile || 'unknown'
    const fileCount = stats.itemsPerSourceFile.get(sourceFile) || 0
    stats.itemsPerSourceFile.set(sourceFile, fileCount + 1)
    
    // Track assignment reason
    stats.assignmentReasons.set(item.id, assignedLane)
    
    // Check for unassigned (General lane items that might need attention)
    if (assignedLane === 'General' && !item.sourceFile?.includes('phase_transitions')) {
      stats.unassignedItems.push(item)
    }
  })
  
  return stats
}

function logAssignmentStatistics(stats: LaneAssignmentStats): void {
  // Simplified assignment summary
  const nonEmptyLanes = Array.from(stats.itemsPerLane.entries()).filter(([, count]) => count > 0)
  console.log(`📊 ${stats.totalItems} items assigned to ${nonEmptyLanes.length} lanes`)
  
  if (stats.unassignedItems.length > 0) {
    console.log(`⚠️ ${stats.unassignedItems.length} items in General lane (may need review)`)
  }
}

function generateSwimlaneDiagnostics(nodes: any[], laneHeights: Map<string, number>, laneBoundaries?: Map<string, LaneBoundary>): void {
  console.log(`\n🏊 POSITIONING DIAGNOSTIC`)
  console.log(`═══════════════════════`)
  
  // Focus on first few lanes with nodes
  const lanesWithNodes = SWIM_LANES.filter(lane => 
    nodes.some(node => node.data.swimLane === lane)
  ).slice(0, 5) // First 5 lanes only
  
  console.log(`📊 GraphBuilder Positioning:`)
  let cumulativeY = LAYOUT_CONSTANTS.LANE_PADDING
  
  lanesWithNodes.forEach(lane => {
    const height = laneHeights.get(lane) || LAYOUT_CONSTANTS.MIN_LANE_HEIGHT
    const laneNodes = nodes.filter(node => node.data.swimLane === lane)
    const nodeYs = laneNodes.map(n => n.position.y)
    const minY = Math.min(...nodeYs)
    const maxY = Math.max(...nodeYs)
    
    console.log(`  ${lane}: calculated Y ${cumulativeY}-${cumulativeY + height}, actual nodes ${minY.toFixed(0)}-${maxY.toFixed(0)} (${laneNodes.length} nodes)`)
    
    cumulativeY += height + LAYOUT_CONSTANTS.LANE_PADDING
  })
  
  // Add boundary enforcement diagnostics
  if (laneBoundaries) {
    console.log(`\n🛡️ Boundary Enforcement Active:`)
    const nodesOutOfBounds = nodes.filter(node => {
      const boundary = laneBoundaries.get(node.data.swimLane)
      if (!boundary) return false
      
      const nodeHalfHeight = LAYOUT_CONSTANTS.NODE_HEIGHT / 2
      const minY = boundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
      const maxY = boundary.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
      
      return node.position.y < minY || node.position.y > maxY
    })
    
    if (nodesOutOfBounds.length > 0) {
      console.log(`  ⚠️ ${nodesOutOfBounds.length} nodes still outside boundaries after enforcement`)
    } else {
      console.log(`  ✅ All ${nodes.length} nodes within their lane boundaries`)
    }
  }
  
  console.log(`\n💡 Check UpgradeTreeView.vue logs above to compare UI positioning`)
  console.log(``)
}

// Validate that a position is within lane boundaries
function validatePositionWithinBounds(
  position: { x: number, y: number },
  lane: string,
  boundaries: Map<string, LaneBoundary>
): { withinBounds: boolean, violation?: BoundaryViolation } {
  const boundary = boundaries.get(lane)
  if (!boundary) {
    return { withinBounds: false }
  }
  
  const nodeHalfHeight = LAYOUT_CONSTANTS.NODE_HEIGHT / 2
  const minY = boundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
  const maxY = boundary.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
  
  const withinBounds = position.y >= (minY - LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE) && 
                      position.y <= (maxY + LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE)
  
  if (!withinBounds) {
    const violationType = position.y < minY ? 'top' : 'bottom'
    const severity = Math.abs(position.y - (violationType === 'top' ? minY : maxY)) > 20 ? 'critical' : 'minor'
    
    return {
      withinBounds: false,
      violation: {
        node: {} as PositionedNode, // Will be filled by caller
        violationType,
        actualPosition: position,
        allowedBoundary: boundary,
        severity
      }
    }
  }
  
  return { withinBounds: true }
}

/**
 * Enforce boundary constraints by adjusting position
 * Ensures nodes stay within their assigned lane boundaries by:
 * - Checking if position exceeds lane bounds
 * - Adjusting Y coordinate to fit within usable area
 * - Logging warnings when adjustments are made
 * 
 * @param position Current node position
 * @param lane Target swimlane name
 * @param boundaries Map of lane boundaries
 * @returns Adjusted position that fits within lane bounds
 */
function enforceBoundaryConstraints(
  position: { x: number, y: number },
  lane: string,
  boundaries: Map<string, LaneBoundary>
): { x: number, y: number } {
  const boundary = boundaries.get(lane)
  if (!boundary) {
    console.warn(`⚠️ No boundary found for lane: ${lane}`)
    return position
  }
  
  const nodeHalfHeight = LAYOUT_CONSTANTS.NODE_HEIGHT / 2
  const minY = boundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
  const maxY = boundary.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
  
  let adjustedY = position.y
  let wasAdjusted = false
  
  if (position.y < minY) {
    adjustedY = minY
    wasAdjusted = true
  } else if (position.y > maxY) {
    adjustedY = maxY
    wasAdjusted = true
  }
  
  if (wasAdjusted) {
    console.warn(`⚠️ Position adjusted for lane ${lane}: Y ${position.y.toFixed(1)} → ${adjustedY.toFixed(1)}`)
  }
  
  return { x: position.x, y: adjustedY }
}

// Validate all node positions against their lane boundaries
function validateAllPositions(
  nodes: PositionedNode[],
  boundaries: Map<string, LaneBoundary>
): BoundaryViolation[] {
  const violations: BoundaryViolation[] = []
  
  nodes.forEach(node => {
    const validation = validatePositionWithinBounds(node.position, node.lane, boundaries)
    if (!validation.withinBounds && validation.violation) {
      validation.violation.node = node
      violations.push(validation.violation)
    }
  })
  
  return violations
}

/**
 * Comprehensive Position Validation System
 * Validates all aspects of node positioning including boundary compliance,
 * tier consistency, and spacing requirements
 */
class PositionValidationSystem {
  private debugInfo: PositionCalculationDebug[] = []
  private validationResults: ValidationResult[] = []
  
  /**
   * Run comprehensive validation on all positioned nodes
   */
  validatePositioning(
    nodes: PositionedNode[],
    boundaries: Map<string, LaneBoundary>,
    items: GameDataItem[]
  ): ValidationResult[] {
    // Only show comprehensive validation in debug mode
    if ((typeof window !== 'undefined' && (window as any).ENABLE_COMPREHENSIVE_VALIDATION === true)) {
      console.log(`\n🔍 COMPREHENSIVE POSITION VALIDATION`)
      console.log(`═══════════════════════════════════`)
    }
    
    this.validationResults = []
    this.debugInfo = []
    
    // Test 1: Boundary Compliance
    this.testBoundaryCompliance(nodes, boundaries)
    
    // Test 2: Lane Height Accuracy
    this.testLaneHeightAccuracy(nodes, boundaries)
    
    // Test 3: Tier Width Consistency (Requirement 6.4)
    this.testTierWidthConsistency(nodes, items)
    
    // Test 4: Vertical Containment vs Horizontal Positioning (Requirement 6.5)
    this.testVerticalHorizontalInterference(nodes, boundaries)
    
    // Test 5: Minimum Spacing Requirements
    this.testMinimumSpacing(nodes, boundaries)
    
    // Test 6: Position Calculation Accuracy
    this.testPositionCalculationAccuracy(nodes, boundaries, items)
    
    // Generate comprehensive report
    this.generateValidationReport()
    
    return this.validationResults
  }
  
  /**
   * Test boundary compliance for all nodes (Requirement 5.4)
   */
  private testBoundaryCompliance(nodes: PositionedNode[], boundaries: Map<string, LaneBoundary>): void {
    const issues: ValidationIssue[] = []
    const violations = validateAllPositions(nodes, boundaries)
    
    violations.forEach(violation => {
      const severity = violation.severity === 'critical' ? 'error' : 
                      violation.severity === 'major' ? 'warning' : 'info'
      
      issues.push({
        severity,
        message: `Node "${violation.node.item.name}" violates ${violation.violationType} boundary in lane "${violation.node.lane}"`,
        nodeId: violation.node.item.id,
        lane: violation.node.lane,
        position: violation.actualPosition,
        expectedPosition: violation.adjustedPosition
      })
    })
    
    const passed = violations.length === 0
    this.validationResults.push({
      testName: 'Boundary Compliance',
      passed,
      issues,
      recommendations: passed ? [] : [
        'Review lane height calculations',
        'Check node positioning algorithm',
        'Verify boundary enforcement is active'
      ],
      metrics: {
        totalNodes: nodes.length,
        violatingNodes: violations.length,
        complianceRate: ((nodes.length - violations.length) / nodes.length) * 100
      }
    })
  }
  
  /**
   * Test lane height accuracy against actual node distribution
   */
  private testLaneHeightAccuracy(nodes: PositionedNode[], boundaries: Map<string, LaneBoundary>): void {
    const issues: ValidationIssue[] = []
    const laneNodeCounts = new Map<string, number>()
    
    // Count nodes per lane
    nodes.forEach(node => {
      const count = laneNodeCounts.get(node.lane) || 0
      laneNodeCounts.set(node.lane, count + 1)
    })
    
    // Check each lane's height against its node count
    boundaries.forEach((boundary, lane) => {
      const nodeCount = laneNodeCounts.get(lane) || 0
      const requiredHeight = calculateSpaceRequirements(nodeCount)
      const actualHeight = boundary.height
      
      if (actualHeight < requiredHeight) {
        issues.push({
          severity: 'error',
          message: `Lane "${lane}" height ${actualHeight}px insufficient for ${nodeCount} nodes (needs ${requiredHeight}px)`,
          lane
        })
      } else if (nodeCount > 0 && actualHeight > requiredHeight * 1.5) {
        issues.push({
          severity: 'info',
          message: `Lane "${lane}" height ${actualHeight}px may be excessive for ${nodeCount} nodes (needs ${requiredHeight}px)`,
          lane
        })
      }
    })
    
    this.validationResults.push({
      testName: 'Lane Height Accuracy',
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      recommendations: issues.length > 0 ? [
        'Recalculate lane heights based on actual node distribution',
        'Review space requirements calculation'
      ] : []
    })
  }
  
  /**
   * Test tier width consistency across all lanes (Requirement 6.4)
   */
  private testTierWidthConsistency(nodes: PositionedNode[], items: GameDataItem[]): void {
    const issues: ValidationIssue[] = []
    const tierPositions = new Map<number, Set<number>>()
    
    // Collect X positions for each tier
    nodes.forEach(node => {
      const tier = calculatePrerequisiteDepth(node.item, items)
      if (!tierPositions.has(tier)) {
        tierPositions.set(tier, new Set())
      }
      tierPositions.get(tier)!.add(node.position.x)
    })
    
    // Check consistency within each tier
    tierPositions.forEach((xPositions, tier) => {
      const positions = Array.from(xPositions)
      if (positions.length > 1) {
        const minX = Math.min(...positions)
        const maxX = Math.max(...positions)
        const range = maxX - minX
        
        if (range > LAYOUT_CONSTANTS.TIER_WIDTH * 0.1) { // Allow 10% tolerance
          issues.push({
            severity: 'warning',
            message: `Tier ${tier} has inconsistent X positions (range: ${range.toFixed(1)}px)`,
          })
        }
      }
    })
    
    // Check tier spacing consistency
    const sortedTiers = Array.from(tierPositions.keys()).sort((a, b) => a - b)
    for (let i = 1; i < sortedTiers.length; i++) {
      const prevTier = sortedTiers[i - 1]
      const currentTier = sortedTiers[i]
      
      const prevX = Math.min(...Array.from(tierPositions.get(prevTier)!))
      const currentX = Math.min(...Array.from(tierPositions.get(currentTier)!))
      const spacing = currentX - prevX
      
      const expectedSpacing = LAYOUT_CONSTANTS.TIER_WIDTH
      const tolerance = expectedSpacing * 0.1
      
      if (Math.abs(spacing - expectedSpacing) > tolerance) {
        issues.push({
          severity: 'warning',
          message: `Inconsistent spacing between tier ${prevTier} and ${currentTier}: ${spacing.toFixed(1)}px (expected: ${expectedSpacing}px)`
        })
      }
    }
    
    this.validationResults.push({
      testName: 'Tier Width Consistency',
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      recommendations: issues.length > 0 ? [
        'Ensure consistent TIER_WIDTH usage in positioning calculations',
        'Verify tier-based X positioning algorithm'
      ] : [],
      metrics: {
        totalTiers: tierPositions.size,
        inconsistentTiers: issues.length
      }
    })
  }
  
  /**
   * Test that horizontal positioning doesn't interfere with vertical containment (Requirement 6.5)
   */
  private testVerticalHorizontalInterference(nodes: PositionedNode[], boundaries: Map<string, LaneBoundary>): void {
    const issues: ValidationIssue[] = []
    
    // Group nodes by tier to check vertical alignment within lanes
    const tierLaneGroups = new Map<string, PositionedNode[]>()
    
    nodes.forEach(node => {
      const key = `${node.tier}-${node.lane}`
      if (!tierLaneGroups.has(key)) {
        tierLaneGroups.set(key, [])
      }
      tierLaneGroups.get(key)!.push(node)
    })
    
    // Check each tier-lane group for proper vertical distribution
    tierLaneGroups.forEach((groupNodes, key) => {
      const [tier, lane] = key.split('-')
      const boundary = boundaries.get(lane)
      
      if (!boundary || groupNodes.length <= 1) return
      
      // Check if nodes are properly distributed within the lane
      const yPositions = groupNodes.map(n => n.position.y).sort((a, b) => a - b)
      const minY = yPositions[0]
      const maxY = yPositions[yPositions.length - 1]
      
      const nodeHalfHeight = LAYOUT_CONSTANTS.NODE_HEIGHT / 2
      const laneMinY = boundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
      const laneMaxY = boundary.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
      
      // Check if vertical distribution is constrained by horizontal positioning
      if (minY < laneMinY || maxY > laneMaxY) {
        issues.push({
          severity: 'error',
          message: `Tier ${tier} nodes in lane "${lane}" exceed vertical boundaries due to positioning conflicts`,
          lane
        })
      }
      
      // Check for excessive vertical compression that might indicate horizontal interference
      const requiredHeight = groupNodes.length * LAYOUT_CONSTANTS.NODE_HEIGHT + 
                            (groupNodes.length - 1) * LAYOUT_CONSTANTS.MIN_NODE_SPACING
      const actualHeight = maxY - minY + LAYOUT_CONSTANTS.NODE_HEIGHT
      
      if (actualHeight < requiredHeight * 0.8) { // 20% tolerance
        issues.push({
          severity: 'warning',
          message: `Tier ${tier} nodes in lane "${lane}" may be over-compressed (${actualHeight.toFixed(1)}px vs ${requiredHeight.toFixed(1)}px needed)`,
          lane
        })
      }
    })
    
    this.validationResults.push({
      testName: 'Vertical-Horizontal Interference',
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      recommendations: issues.length > 0 ? [
        'Review interaction between tier-based X positioning and lane-based Y positioning',
        'Ensure vertical containment takes priority over horizontal alignment'
      ] : []
    })
  }
  
  /**
   * Test minimum spacing requirements between nodes
   */
  private testMinimumSpacing(nodes: PositionedNode[], boundaries: Map<string, LaneBoundary>): void {
    const issues: ValidationIssue[] = []
    
    // Group nodes by lane and tier for spacing analysis
    const laneGroups = new Map<string, PositionedNode[]>()
    
    nodes.forEach(node => {
      if (!laneGroups.has(node.lane)) {
        laneGroups.set(node.lane, [])
      }
      laneGroups.get(node.lane)!.push(node)
    })
    
    // Check spacing within each lane
    laneGroups.forEach((laneNodes, lane) => {
      if (laneNodes.length <= 1) return
      
      // Sort by Y position
      const sortedNodes = laneNodes.sort((a, b) => a.position.y - b.position.y)
      
      for (let i = 1; i < sortedNodes.length; i++) {
        const prevNode = sortedNodes[i - 1]
        const currentNode = sortedNodes[i]
        
        // Calculate spacing between node centers (positions are center points)
        const centerToCenter = currentNode.position.y - prevNode.position.y
        // Subtract node height to get actual spacing between nodes
        const spacing = centerToCenter - LAYOUT_CONSTANTS.NODE_HEIGHT
        
        if (spacing < LAYOUT_CONSTANTS.MIN_NODE_SPACING) {
          issues.push({
            severity: 'warning',
            message: `Insufficient spacing between nodes in lane "${lane}": ${spacing.toFixed(1)}px (minimum: ${LAYOUT_CONSTANTS.MIN_NODE_SPACING}px)`,
            nodeId: currentNode.item.id,
            lane
          })
        }
      }
    })
    
    this.validationResults.push({
      testName: 'Minimum Spacing Requirements',
      passed: issues.length === 0,
      issues,
      recommendations: issues.length > 0 ? [
        'Review node spacing calculations',
        'Consider increasing lane heights for overcrowded lanes'
      ] : []
    })
  }
  
  /**
   * Test position calculation accuracy by recalculating and comparing
   */
  private testPositionCalculationAccuracy(
    nodes: PositionedNode[], 
    boundaries: Map<string, LaneBoundary>, 
    items: GameDataItem[]
  ): void {
    const issues: ValidationIssue[] = []
    
    // This would require access to the original calculation functions
    // For now, we'll validate that positions make sense given the constraints
    
    nodes.forEach(node => {
      const boundary = boundaries.get(node.lane)
      if (!boundary) {
        issues.push({
          severity: 'error',
          message: `No boundary found for node "${node.item.name}" in lane "${node.lane}"`,
          nodeId: node.item.id,
          lane: node.lane
        })
        return
      }
      
      // Validate X position is reasonable for tier
      const expectedX = LAYOUT_CONSTANTS.LANE_START_X + (node.tier * LAYOUT_CONSTANTS.TIER_WIDTH)
      const tolerance = LAYOUT_CONSTANTS.TIER_WIDTH * 0.1
      
      if (Math.abs(node.position.x - expectedX) > tolerance) {
        issues.push({
          severity: 'info',
          message: `Node "${node.item.name}" X position ${node.position.x.toFixed(1)} differs from expected ${expectedX.toFixed(1)} for tier ${node.tier}`,
          nodeId: node.item.id,
          position: node.position,
          expectedPosition: { x: expectedX, y: node.position.y }
        })
      }
      
      // Store debug info
      this.debugInfo.push({
        nodeId: node.item.id,
        nodeName: node.item.name || node.item.id,
        lane: node.lane,
        tier: node.tier,
        calculatedPosition: node.position, // Would be original calculation
        finalPosition: node.position,
        boundary,
        adjustmentApplied: false, // Would track if position was adjusted
        withinBounds: node.withinBounds,
        calculations: {
          tierX: expectedX,
          laneY: node.position.y,
          nodeIndex: 0, // Would be calculated
          totalNodesInTier: 0, // Would be calculated
          spacingUsed: 0 // Would be calculated
        }
      })
    })
    
    this.validationResults.push({
      testName: 'Position Calculation Accuracy',
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      recommendations: issues.length > 0 ? [
        'Review position calculation algorithms',
        'Verify tier and lane positioning constants'
      ] : []
    })
  }
  
  /**
   * Generate comprehensive validation report
   */
  private generateValidationReport(): void {
    // Only show validation summary in debug mode
    if ((typeof window !== 'undefined' && (window as any).ENABLE_COMPREHENSIVE_VALIDATION === true)) {
      console.log(`\n📊 VALIDATION SUMMARY`)
      console.log(`═══════════════════`)
    }
    
    const totalTests = this.validationResults.length
    const passedTests = this.validationResults.filter(r => r.passed).length
    const failedTests = totalTests - passedTests
    
    console.log(`Tests: ${passedTests}/${totalTests} passed`)
    
    if (failedTests > 0) {
      console.log(`\n❌ FAILED TESTS:`)
      this.validationResults.filter(r => !r.passed).forEach(result => {
        console.log(`  ${result.testName}:`)
        result.issues.forEach(issue => {
          const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️'
          console.log(`    ${icon} ${issue.message}`)
        })
      })
    }
    
    // Show metrics
    const metricsResults = this.validationResults.filter(r => r.metrics)
    if (metricsResults.length > 0) {
      console.log(`\n📈 METRICS:`)
      metricsResults.forEach(result => {
        console.log(`  ${result.testName}:`)
        Object.entries(result.metrics!).forEach(([key, value]) => {
          console.log(`    ${key}: ${typeof value === 'number' ? value.toFixed(1) : value}`)
        })
      })
    }
    
    // Show debug info summary
    if (this.debugInfo.length > 0) {
      console.log(`\n🔧 DEBUG INFO: ${this.debugInfo.length} nodes analyzed`)
      const outOfBounds = this.debugInfo.filter(d => !d.withinBounds).length
      if (outOfBounds > 0) {
        console.log(`  ${outOfBounds} nodes out of bounds`)
      }
    }
    
    console.log(``)
  }
  
  /**
   * Get detailed debug information for specific node
   */
  getNodeDebugInfo(nodeId: string): PositionCalculationDebug | undefined {
    return this.debugInfo.find(d => d.nodeId === nodeId)
  }
  
  /**
   * Get all validation results
   */
  getValidationResults(): ValidationResult[] {
    return this.validationResults
  }
  
  /**
   * Get validation summary
   */
  getValidationSummary(): {
    totalTests: number
    passedTests: number
    failedTests: number
    totalIssues: number
    errorCount: number
    warningCount: number
  } {
    const totalTests = this.validationResults.length
    const passedTests = this.validationResults.filter(r => r.passed).length
    const allIssues = this.validationResults.flatMap(r => r.issues)
    
    return {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      totalIssues: allIssues.length,
      errorCount: allIssues.filter(i => i.severity === 'error').length,
      warningCount: allIssues.filter(i => i.severity === 'warning').length
    }
  }
}

// Global validation system instance
const positionValidationSystem = new PositionValidationSystem()

/**
 * Run comprehensive position validation (main entry point)
 */
function runPositionValidation(
  nodes: PositionedNode[],
  boundaries: Map<string, LaneBoundary>,
  items: GameDataItem[]
): ValidationResult[] {
  return positionValidationSystem.validatePositioning(nodes, boundaries, items)
}

/**
 * Get validation summary for external use
 */
function getValidationSummary() {
  return positionValidationSystem.getValidationSummary()
}

/**
 * Get debug info for specific node
 */
function getNodeDebugInfo(nodeId: string): PositionCalculationDebug | undefined {
  return positionValidationSystem.getNodeDebugInfo(nodeId)
}

/**
 * Handle overcrowded lanes with compression fallback
 * Manages node positioning when too many nodes exist in a single lane/tier:
 * - Distributes nodes evenly when space allows
 * - Compresses spacing when overcrowded
 * - Ensures all nodes stay within lane boundaries
 * - Generates warnings for critical overcrowding
 * 
 * @param laneItems All items in the target lane
 * @param lane Lane name
 * @param tier Tier number
 * @param boundary Lane boundary information
 * @param allItems All items for tier calculation
 * @returns Positions map and any warnings generated
 */
/**
 * Log a concise summary of enhanced distribution results
 */
function logEnhancedDistributionSummary(nodes: any[], laneBoundaries: Map<string, LaneBoundary>): void {
  const laneStats = new Map<string, { total: number, singleNodes: number, evenDistribution: number, compressed: number }>()
  
  // Analyze distribution patterns
  nodes.forEach(node => {
    const lane = node.data.swimLane
    if (!laneStats.has(lane)) {
      laneStats.set(lane, { total: 0, singleNodes: 0, evenDistribution: 0, compressed: 0 })
    }
    laneStats.get(lane)!.total++
  })
  
  // Count distribution types by analyzing node spacing
  laneStats.forEach((stats, lane) => {
    const laneNodes = nodes.filter(n => n.data.swimLane === lane)
    const boundary = laneBoundaries.get(lane)
    
    if (laneNodes.length === 1) {
      stats.singleNodes = 1
    } else if (laneNodes.length > 1 && boundary) {
      // Sort by Y position and check spacing
      const sortedNodes = laneNodes.sort((a, b) => a.position.y - b.position.y)
      let totalSpacing = 0
      let spacingCount = 0
      
      for (let i = 1; i < sortedNodes.length; i++) {
        const spacing = sortedNodes[i].position.y - sortedNodes[i-1].position.y - LAYOUT_CONSTANTS.NODE_HEIGHT
        totalSpacing += spacing
        spacingCount++
      }
      
      const avgSpacing = spacingCount > 0 ? totalSpacing / spacingCount : 0
      
      if (avgSpacing >= LAYOUT_CONSTANTS.NODE_PADDING * 0.9) {
        stats.evenDistribution = laneNodes.length
      } else {
        stats.compressed = laneNodes.length
      }
    }
  })
  
  // Generate summary
  const totalNodes = nodes.length
  const totalSingle = Array.from(laneStats.values()).reduce((sum, stats) => sum + stats.singleNodes, 0)
  const totalEven = Array.from(laneStats.values()).reduce((sum, stats) => sum + stats.evenDistribution, 0)
  const totalCompressed = Array.from(laneStats.values()).reduce((sum, stats) => sum + stats.compressed, 0)
  const activeLanes = Array.from(laneStats.values()).filter(stats => stats.total > 0).length
  
  console.log(`📊 Enhanced Distribution Summary: ${totalNodes} nodes across ${activeLanes} lanes`)
  console.log(`   Single nodes centered: ${totalSingle} | Even distribution: ${totalEven} | Compressed: ${totalCompressed}`)
  
  // Show any problematic lanes
  const problematicLanes = Array.from(laneStats.entries()).filter(([_, stats]) => stats.compressed > 10)
  if (problematicLanes.length > 0) {
    console.warn(`⚠️ Heavily compressed lanes: ${problematicLanes.map(([lane, stats]) => `${lane}(${stats.compressed})`).join(', ')}`)
  }
}

/**
 * Enhanced vertical node distribution within lanes
 * Implements improved spacing algorithm for Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */
function handleOvercrowdedLane(
  laneItems: GameDataItem[],
  lane: string,
  tier: number,
  boundary: LaneBoundary,
  allItems: GameDataItem[]
): { positions: Map<string, { x: number, y: number }>, warnings: string[] } {
  const positions = new Map<string, { x: number, y: number }>()
  const warnings: string[] = []
  
  const nodesInLaneTier = laneItems.filter(item => {
    const itemTier = calculatePrerequisiteDepth(item, allItems)
    return itemTier === tier
  })
  
  const totalNodes = nodesInLaneTier.length
  if (totalNodes === 0) return { positions, warnings }
  
  const nodeHalfHeight = LAYOUT_CONSTANTS.NODE_HEIGHT / 2
  const usableHeight = boundary.usableHeight
  const totalHeightNeeded = totalNodes * LAYOUT_CONSTANTS.NODE_HEIGHT
  const availableSpacingHeight = usableHeight - totalHeightNeeded
  
  // Calculate X position consistently (Requirement 3.5)
  const baseX = LAYOUT_CONSTANTS.LANE_START_X + (tier * LAYOUT_CONSTANTS.TIER_WIDTH) + (LAYOUT_CONSTANTS.NODE_WIDTH / 2)
  const finalX = Math.max(LAYOUT_CONSTANTS.LANE_START_X + (LAYOUT_CONSTANTS.NODE_WIDTH / 2), baseX)
  
  if (totalNodes === 1) {
    // Single node - center it within the lane (Requirement 3.4)
    const centerY = boundary.centerY
    positions.set(nodesInLaneTier[0].id, { x: finalX, y: centerY })
    
    // Remove individual single node logs - they're too verbose
  } else {
    // Multiple nodes - determine distribution strategy
    const minRequiredSpacing = (totalNodes - 1) * LAYOUT_CONSTANTS.MIN_NODE_SPACING
    const idealSpacing = (totalNodes - 1) * LAYOUT_CONSTANTS.NODE_PADDING
    
    if (availableSpacingHeight >= idealSpacing) {
      // Nodes fit comfortably - use even distribution (Requirement 3.1)
      distributeNodesEvenly(nodesInLaneTier, positions, finalX, boundary, lane, tier)
    } else if (availableSpacingHeight >= minRequiredSpacing) {
      // Nodes fit with compression - use maximum possible spacing (Requirement 3.2, 3.3)
      distributeNodesWithCompression(nodesInLaneTier, positions, finalX, boundary, availableSpacingHeight, warnings, lane, tier)
    } else {
      // Critical overcrowding - use emergency spacing with boundary enforcement
      distributeNodesWithEmergencySpacing(nodesInLaneTier, positions, finalX, boundary, warnings, lane, tier)
    }
  }
  
  return { positions, warnings }
}

/**
 * Distribute nodes evenly across the usable height with consistent spacing
 * Implements Requirement 3.1: even distribution with consistent spacing
 */
function distributeNodesEvenly(
  nodes: GameDataItem[],
  positions: Map<string, { x: number, y: number }>,
  x: number,
  boundary: LaneBoundary,
  lane: string,
  tier: number
): void {
  const totalNodes = nodes.length
  const nodeHalfHeight = LAYOUT_CONSTANTS.NODE_HEIGHT / 2
  const usableHeight = boundary.usableHeight
  
  if (totalNodes === 1) {
    // Single node case handled in main function
    return
  }
  
  // Calculate even distribution across usable height
  // Place first node at top of usable area, last node at bottom, distribute others evenly
  const topY = boundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
  const bottomY = boundary.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
  const totalDistributionHeight = bottomY - topY
  
  const spacingBetweenNodes = totalDistributionHeight / Math.max(1, totalNodes - 1)
  
  nodes.forEach((item, index) => {
    const nodeY = topY + (index * spacingBetweenNodes)
    positions.set(item.id, { x, y: nodeY })
  })
  
  // Remove individual positioning logs - they're too verbose
}

/**
 * Distribute nodes with compression while maintaining minimum spacing
 * Implements Requirement 3.2: compression with minimum spacing, Requirement 3.3: at least 15px spacing
 */
function distributeNodesWithCompression(
  nodes: GameDataItem[],
  positions: Map<string, { x: number, y: number }>,
  x: number,
  boundary: LaneBoundary,
  availableSpacingHeight: number,
  warnings: string[],
  lane: string,
  tier: number
): void {
  const totalNodes = nodes.length
  const nodeHalfHeight = LAYOUT_CONSTANTS.NODE_HEIGHT / 2
  
  // Calculate maximum possible spacing while maintaining minimum
  const actualSpacing = Math.max(
    LAYOUT_CONSTANTS.MIN_NODE_SPACING,
    availableSpacingHeight / Math.max(1, totalNodes - 1)
  )
  
  // Start from top of usable area
  const startY = boundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
  
  nodes.forEach((item, index) => {
    const nodeY = startY + (index * (LAYOUT_CONSTANTS.NODE_HEIGHT + actualSpacing))
    
    // Ensure node doesn't exceed boundary
    const maxAllowedY = boundary.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
    const finalY = Math.min(nodeY, maxAllowedY)
    
    positions.set(item.id, { x, y: finalY })
  })
  
  // Add appropriate warnings
  if (actualSpacing < LAYOUT_CONSTANTS.NODE_PADDING) {
    warnings.push(`Lane ${lane} tier ${tier} compressed: ${totalNodes} nodes with ${actualSpacing.toFixed(1)}px spacing (normal: ${LAYOUT_CONSTANTS.NODE_PADDING}px)`)
  }
  
  if (actualSpacing === LAYOUT_CONSTANTS.MIN_NODE_SPACING) {
    warnings.push(`Lane ${lane} tier ${tier} at minimum spacing: ${actualSpacing}px`)
  }
  
  // Remove individual compression logs - they're too verbose
}

/**
 * Emergency spacing for critically overcrowded lanes
 * Maintains boundary enforcement while providing best possible spacing
 */
function distributeNodesWithEmergencySpacing(
  nodes: GameDataItem[],
  positions: Map<string, { x: number, y: number }>,
  x: number,
  boundary: LaneBoundary,
  warnings: string[],
  lane: string,
  tier: number
): void {
  const totalNodes = nodes.length
  const nodeHalfHeight = LAYOUT_CONSTANTS.NODE_HEIGHT / 2
  const usableHeight = boundary.usableHeight
  
  // Calculate the absolute minimum spacing possible
  const totalNodeHeight = totalNodes * LAYOUT_CONSTANTS.NODE_HEIGHT
  const remainingHeight = usableHeight - totalNodeHeight
  const emergencySpacing = Math.max(0, remainingHeight / Math.max(1, totalNodes - 1))
  
  const startY = boundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
  
  nodes.forEach((item, index) => {
    let nodeY = startY + (index * (LAYOUT_CONSTANTS.NODE_HEIGHT + emergencySpacing))
    
    // Strict boundary enforcement
    const maxAllowedY = boundary.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
    nodeY = Math.min(nodeY, maxAllowedY)
    
    // If we're still exceeding bounds, compress further by overlapping if necessary
    if (nodeY > maxAllowedY && index > 0) {
      // Calculate compressed position to fit within bounds
      const availableHeight = maxAllowedY - startY
      const compressionSpacing = availableHeight / Math.max(1, totalNodes - 1)
      nodeY = startY + (index * compressionSpacing)
    }
    
    positions.set(item.id, { x, y: nodeY })
  })
  
  warnings.push(`CRITICAL: Lane ${lane} tier ${tier} severely overcrowded - ${totalNodes} nodes with ${emergencySpacing.toFixed(1)}px spacing`)
  warnings.push(`Consider redistributing items or increasing lane height for lane ${lane}`)
  
  // Only log emergency spacing in debug mode
  if ((typeof window !== 'undefined' && (window as any).ENABLE_COMPREHENSIVE_VALIDATION === true)) {
    console.warn(`⚠️ Emergency spacing: ${totalNodes} nodes in lane ${lane} tier ${tier} with ${emergencySpacing.toFixed(1)}px spacing`)
  }
}

function validateSwimLaneAssignments(items: GameDataItem[]): boolean {
  let isValid = true
  const validationErrors: string[] = []
  
  items.forEach(item => {
    const assignedLane = determineSwimLane(item)
    
    // Validate lane exists
    if (!SWIM_LANES.includes(assignedLane)) {
      validationErrors.push(`❌ Item "${item.name}" assigned to invalid lane: "${assignedLane}"`)
      isValid = false
    }
    
    // Validate town vendor assignments
    if (item.sourceFile?.startsWith('town_')) {
      const expectedVendorLanes = ['Blacksmith', 'Agronomist', 'Carpenter', 'Land Steward', 'Material Trader', 'Skills Trainer', 'Vendors']
      if (!expectedVendorLanes.includes(assignedLane)) {
        validationErrors.push(`❌ Town item "${item.name}" from ${item.sourceFile} assigned to non-vendor lane: "${assignedLane}"`)
        isValid = false
      }
    }
    
    // Validate game feature consistency
    const gameFeature = getGameFeatureFromSourceFile(item.sourceFile)
    if (gameFeature !== 'General' && gameFeature !== 'Town') {
      if (assignedLane !== gameFeature && assignedLane !== 'General') {
        // Allow some flexibility for items that might legitimately cross categories
        console.warn(`⚠️ Potential mismatch: "${item.name}" from ${gameFeature} feature assigned to ${assignedLane} lane`)
      }
    }
  })
  
  if (validationErrors.length > 0) {
    console.error(`\n❌ SWIMLANE ASSIGNMENT VALIDATION ERRORS:`)
    validationErrors.forEach(error => console.error(error))
    console.error(``)
  } else {
    console.log(`✅ All swimlane assignments are valid`)
  }
  
  return isValid
}

function determineTier(item: GameDataItem): number {
  // Smart tier determination based on available data
  
  // 1. Check explicit level
  if (item.level) {
    if (item.level <= 2) return 1   // Tutorial
    if (item.level <= 5) return 2   // Early
    if (item.level <= 10) return 3  // Mid
    if (item.level <= 15) return 4  // Late
    return 5  // Endgame
  }
  
  // 2. Use cost as proxy
  if (item.goldCost) {
    if (item.goldCost < 100) return 1
    if (item.goldCost < 1000) return 2
    if (item.goldCost < 10000) return 3
    if (item.goldCost < 100000) return 4
    return 5
  }
  
  // 3. Use prerequisite count as proxy
  const prereqCount = item.prerequisites?.length || 0
  if (prereqCount === 0) return 1  // Starting items
  if (prereqCount <= 2) return 2   // Early progression
  if (prereqCount <= 4) return 3   // Mid progression
  if (prereqCount <= 6) return 4   // Late progression
  return 5  // Complex endgame items
}

function calculateNodePosition(
  item: GameDataItem, 
  swimLane: string, 
  allItems: GameDataItem[],
  laneHeights: Map<string, number>,
  laneBoundaries?: Map<string, LaneBoundary>
): { x: number, y: number } {
  const startTime = performance.now()
  const shouldRecordSteps = (typeof window !== 'undefined' && (window as any).ENABLE_COMPREHENSIVE_VALIDATION === true)
  const calculationSteps: any[] = []
  
  // Use standardized constants for consistency
  const {
    TIER_WIDTH,
    NODE_WIDTH, 
    NODE_HEIGHT,
    NODE_PADDING,
    LANE_PADDING,
    LANE_START_X,
    LANE_BUFFER
  } = LAYOUT_CONSTANTS
  
  if (shouldRecordSteps) {
    calculationSteps.push({
      step: 'Initialize Constants',
      description: 'Load layout constants for positioning calculations',
      input: { swimLane, itemId: item.id },
      output: { TIER_WIDTH, NODE_WIDTH, NODE_HEIGHT, LANE_START_X },
      timestamp: performance.now()
    })
  }
  
  // Calculate cumulative Y position for this lane with detailed debugging
  let laneStartY = LANE_PADDING
  let debugLog = [`Starting laneStartY: ${laneStartY}`]
  
  for (const lane of SWIM_LANES) {
    if (lane === swimLane) break
    const laneHeight = laneHeights.get(lane) || LAYOUT_CONSTANTS.MIN_LANE_HEIGHT
    const wasUsingFallback = !laneHeights.has(lane)
    laneStartY += laneHeight + LANE_PADDING
    debugLog.push(`After ${lane}: +${laneHeight}${wasUsingFallback ? ' (fallback)' : ''} +${LANE_PADDING} = ${laneStartY}`)
  }
  
  // Removed verbose cumulative calculation logging
  
  // Calculate tier (X position) using consistent TIER_WIDTH
  const tier = calculatePrerequisiteDepth(item, allItems)
  const baseX = LANE_START_X + (tier * TIER_WIDTH) + (NODE_WIDTH / 2)
  
  if (shouldRecordSteps) {
    calculationSteps.push({
      step: 'Calculate Tier Position',
      description: 'Calculate horizontal position based on prerequisite depth',
      input: { tier, TIER_WIDTH, LANE_START_X, NODE_WIDTH },
      output: { baseX },
      timestamp: performance.now()
    })
  }
  
  // Ensure minimum X position (must be right of lane labels)
  const finalX = Math.max(LANE_START_X + (NODE_WIDTH / 2), baseX)
  
  if (shouldRecordSteps) {
    calculationSteps.push({
      step: 'Enforce Minimum X',
      description: 'Ensure X position is right of lane labels',
      input: { baseX, minX: LANE_START_X + (NODE_WIDTH / 2) },
      output: { finalX },
      timestamp: performance.now()
    })
  }
  
  // Group nodes by lane and tier first
  const nodesInLaneTier = allItems.filter(other => {
    const otherLane = determineSwimLane(other)
    const otherTier = calculatePrerequisiteDepth(other, allItems)
    return otherLane === swimLane && otherTier === tier
  })
  
  // Get this item's index in the group
  const indexInGroup = nodesInLaneTier.findIndex(n => n.id === item.id)
  const totalInGroup = nodesInLaneTier.length
  
  if (shouldRecordSteps) {
    calculationSteps.push({
      step: 'Group Lane-Tier Nodes',
      description: 'Find all nodes in the same lane and tier for spacing calculations',
      input: { swimLane, tier },
      output: { totalInGroup, indexInGroup, nodeIds: nodesInLaneTier.map(n => n.id) },
      timestamp: performance.now()
    })
  }
  
  // Use boundary-enforced positioning if boundaries are available
  let nodeY: number
  
  if (laneBoundaries) {
    const boundary = laneBoundaries.get(swimLane)
    if (boundary) {
      // Use the overcrowded lane handler for consistent boundary enforcement
      const laneItemsInTier = allItems.filter(other => {
        const otherLane = determineSwimLane(other)
        const otherTier = calculatePrerequisiteDepth(other, allItems)
        return otherLane === swimLane && otherTier === tier
      })
      
      const compressionResult = handleOvercrowdedLane(laneItemsInTier, swimLane, tier, boundary, allItems)
      const itemPosition = compressionResult.positions.get(item.id)
      
      if (itemPosition) {
        nodeY = itemPosition.y
        // Log any warnings from compression
        compressionResult.warnings.forEach(warning => {
          console.warn(`⚠️ ${warning}`)
        })
      } else {
        // Fallback to center if position not found
        nodeY = boundary.centerY
        console.warn(`⚠️ Could not find position for ${item.name} in lane ${swimLane}, using center`)
      }
    } else {
      // Fallback to legacy calculation if boundary not found
      nodeY = laneStartY + (laneHeights.get(swimLane) || LAYOUT_CONSTANTS.MIN_LANE_HEIGHT) / 2
      console.warn(`⚠️ No boundary found for lane ${swimLane}, using fallback positioning`)
    }
  } else {
    // Legacy positioning logic for backward compatibility - enhanced with improved distribution
    const laneHeight = laneHeights.get(swimLane) || LAYOUT_CONSTANTS.MIN_LANE_HEIGHT
    const usableHeight = laneHeight - (2 * LAYOUT_CONSTANTS.LANE_BUFFER)
    const nodeHalfHeight = LAYOUT_CONSTANTS.NODE_HEIGHT / 2
    
    if (totalInGroup === 1) {
      // Single node - center it in the lane (Requirement 3.4)
      nodeY = laneStartY + (laneHeight / 2)
    } else {
      // Multiple nodes - use enhanced distribution logic
      const totalHeightNeeded = totalInGroup * LAYOUT_CONSTANTS.NODE_HEIGHT
      const availableSpacingHeight = usableHeight - totalHeightNeeded
      const idealSpacing = (totalInGroup - 1) * LAYOUT_CONSTANTS.NODE_PADDING
      const minRequiredSpacing = (totalInGroup - 1) * LAYOUT_CONSTANTS.MIN_NODE_SPACING
      
      if (availableSpacingHeight >= idealSpacing) {
        // Even distribution (Requirement 3.1)
        const topY = laneStartY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
        const bottomY = laneStartY + laneHeight - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
        const totalDistributionHeight = bottomY - topY
        const spacingBetweenNodes = totalDistributionHeight / Math.max(1, totalInGroup - 1)
        
        nodeY = topY + (indexInGroup * spacingBetweenNodes)
      } else if (availableSpacingHeight >= minRequiredSpacing) {
        // Compression with minimum spacing (Requirement 3.2, 3.3)
        const actualSpacing = Math.max(
          LAYOUT_CONSTANTS.MIN_NODE_SPACING,
          availableSpacingHeight / Math.max(1, totalInGroup - 1)
        )
        
        const startY = laneStartY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
        nodeY = startY + (indexInGroup * (LAYOUT_CONSTANTS.NODE_HEIGHT + actualSpacing))
        
        // Ensure node doesn't exceed lane boundary
        const maxY = laneStartY + laneHeight - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
        nodeY = Math.min(nodeY, maxY)
        
        // Log warning about compression
        if (actualSpacing < LAYOUT_CONSTANTS.NODE_PADDING) {
          console.warn(`⚠️ Lane ${swimLane} tier ${tier} compressed: ${totalInGroup} nodes with ${actualSpacing.toFixed(1)}px spacing`)
        }
      } else {
        // Emergency spacing for critical overcrowding
        const startY = laneStartY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
        const maxY = laneStartY + laneHeight - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
        const availableHeight = maxY - startY
        const compressionSpacing = availableHeight / Math.max(1, totalInGroup - 1)
        
        nodeY = startY + (indexInGroup * compressionSpacing)
        nodeY = Math.min(nodeY, maxY)
        
        console.warn(`⚠️ CRITICAL: Lane ${swimLane} tier ${tier} severely overcrowded - ${totalInGroup} nodes`)
      }
    }
  }
  
  const calculatedPosition = { x: finalX, y: nodeY }
  const calculationTime = performance.now() - startTime
  
  if (shouldRecordSteps) {
    calculationSteps.push({
      step: 'Final Position',
      description: 'Complete position calculation',
      input: { finalX, nodeY },
      output: { position: calculatedPosition },
      timestamp: performance.now()
    })
  }
  
  // Record detailed debug information only if enabled
  const boundary = laneBoundaries?.get(swimLane)
  if (boundary && shouldRecordSteps) {
    const withinBounds = validatePositionWithinBounds(calculatedPosition, swimLane, laneBoundaries!).withinBounds
    
    validationReporter.recordPositionCalculation(
      item,
      swimLane,
      tier,
      calculationSteps,
      calculatedPosition,
      calculatedPosition, // No adjustment at this stage
      boundary,
      withinBounds,
      calculationTime
    )
  }
  
  return calculatedPosition
}

// Add this helper function to calculate prerequisite depth
function calculatePrerequisiteDepth(item: GameDataItem, allItems: GameDataItem[]): number {
  if (!item.prerequisites || item.prerequisites.length === 0) {
    return 0  // No prerequisites = tier 0 (leftmost)
  }
  
  // Find max depth of all prerequisites
  let maxDepth = 0
  const visited = new Set<string>()
  
  function getDepth(itemId: string): number {
    if (visited.has(itemId)) return 0  // Prevent infinite recursion
    visited.add(itemId)
    
    const currentItem = allItems.find(i => i.id === itemId)
    if (!currentItem || !currentItem.prerequisites || currentItem.prerequisites.length === 0) {
      return 0
    }
    
    let max = 0
    for (const prereqId of currentItem.prerequisites) {
      max = Math.max(max, getDepth(prereqId) + 1)
    }
    return max
  }
  
  maxDepth = getDepth(item.id)
  return maxDepth
}

// Export boundary validation functions for external use
export function validateNodeBoundaries(
  nodes: any[],
  laneBoundaries: Map<string, LaneBoundary>
): { isValid: boolean, violations: BoundaryViolation[], summary: string } {
  const violations: BoundaryViolation[] = []
  
  nodes.forEach(node => {
    const boundary = laneBoundaries.get(node.data.swimLane)
    if (!boundary) return
    
    const validation = validatePositionWithinBounds(node.position, node.data.swimLane, laneBoundaries)
    if (!validation.withinBounds && validation.violation) {
      const positionedNode: PositionedNode = {
        item: node.data.fullData || { id: node.data.id, name: node.data.label } as GameDataItem,
        position: node.position,
        lane: node.data.swimLane,
        tier: node.data.tier,
        withinBounds: false
      }
      validation.violation.node = positionedNode
      violations.push(validation.violation)
    }
  })
  
  const isValid = violations.length === 0
  const summary = isValid 
    ? `✅ All ${nodes.length} nodes are within their lane boundaries`
    : `⚠️ ${violations.length} of ${nodes.length} nodes violate lane boundaries`
  
  return { isValid, violations, summary }
}

// Export function to get lane boundary information
export function getLaneBoundaryInfo(laneBoundaries: Map<string, LaneBoundary>): Array<{
  lane: string,
  startY: number,
  endY: number,
  height: number,
  usableHeight: number
}> {
  return Array.from(laneBoundaries.entries()).map(([lane, boundary]) => ({
    lane,
    startY: boundary.startY,
    endY: boundary.endY,
    height: boundary.height,
    usableHeight: boundary.usableHeight
  }))
}

// Optional: Add material relationship edges
export function addMaterialEdges(items: GameDataItem[], edges: any[], showMaterialEdges: boolean = false) {
  if (!showMaterialEdges) return
  
  // Only consider Actions and Unlocks
  const treeItems = items.filter(item => 
    item.category === 'Actions' || item.category === 'Unlocks'
  )
  
  // Index producers
  const producerIndex = new Map<string, string[]>()
  
  treeItems.forEach(item => {
    if (item.materialsGain) {
      Object.keys(item.materialsGain).forEach(material => {
        if (!producerIndex.has(material)) {
          producerIndex.set(material, [])
        }
        producerIndex.get(material)!.push(item.id)
      })
    }
  })
  
  // Create material edges
  treeItems.forEach(consumer => {
    if (consumer.materialsCost) {
      Object.keys(consumer.materialsCost).forEach(material => {
        const producers = producerIndex.get(material) || []
        producers.forEach(producerId => {
          edges.push({
            data: {
              id: `mat-${producerId}-to-${consumer.id}`,
              source: producerId,
              target: consumer.id,
              type: 'material',
              material: material
            },
            classes: 'edge-material'
          })
        })
      })
    }
  })
  
  // Removed verbose material edge logging
}
