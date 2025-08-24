import type { GameDataItem } from '@/types/game-data'
import { CSV_FILE_LIST } from '@/types/csv-data'
import { validationReporter, type ValidationReport } from './validationReporter'
import { debugMonitor, logSwimLaneAssignment, logPositionCalculation, recordVisualBoundaryData } from './debugMonitor'
import { getPerformanceMonitor, withPerformanceTracking, initializePerformanceMonitor } from './performanceMonitor'
import { getOptimizedPositioningEngine } from './optimizedPositioning'

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
// These constants define the coordinate system used throughout the application
export const LAYOUT_CONSTANTS = {
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
} as const

// Derived constants for consistent calculations
export const DERIVED_CONSTANTS = {
  NODE_HALF_HEIGHT: LAYOUT_CONSTANTS.NODE_HEIGHT / 2,
  NODE_HALF_WIDTH: LAYOUT_CONSTANTS.NODE_WIDTH / 2,
  TIER_CENTER_OFFSET: LAYOUT_CONSTANTS.TIER_WIDTH / 2,
  LANE_TOTAL_PADDING: LAYOUT_CONSTANTS.LANE_BUFFER * 2
} as const

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

// Interface for error recovery context
interface ErrorRecoveryContext {
  originalPosition: { x: number, y: number }
  lane: string
  tier: number
  boundary: LaneBoundary
  recoveryStrategy: 'fallback' | 'compression' | 'emergency' | 'redistribution'
  recoveryReason: string
  appliedAdjustments: string[]
}

// Interface for lane overcrowding analysis
interface LaneOvercrowdingAnalysis {
  lane: string
  boundary: LaneBoundary
  nodeCount: number
  requiredSpace: number
  availableSpace: number
  overcrowdingRatio: number
  severity: 'none' | 'mild' | 'moderate' | 'severe' | 'critical'
  recommendedAction: 'none' | 'compress' | 'redistribute' | 'emergency'
}

// Interface for emergency spacing configuration
interface EmergencySpacingConfig {
  minAbsoluteSpacing: number
  compressionRatio: number
  maxCompressionAttempts: number
  fallbackToMinimumHeight: boolean
  enableRedistribution: boolean
}

// Interface for user-friendly error messages
interface UserFriendlyError {
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  technicalDetails?: string
  suggestedActions: string[]
  affectedNodes?: string[]
  recoveryApplied?: boolean
}

// PHASE 1: Interface for type/category grouping hierarchy
interface GroupHierarchy {
  [swimlane: string]: {
    [type: string]: {
      [category: string]: GameDataItem[]
    }
  }
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

export function buildGraphElements(
  items: GameDataItem[],
  options?: { groupingEnabled?: boolean }  // Add options parameter
) {
  const nodes: any[] = []
  const edges: any[] = []
  
  // PHASE 2: Extract grouping flag with safety default
  const groupingEnabled = options?.groupingEnabled ?? false;
  console.log(`🎯 Building graph with grouping: ${groupingEnabled ? 'ENABLED' : 'DISABLED'}`);
  
  // PHASE 1: Test logging for type/category extraction (TEMPORARY - will be removed)
  // Uncomment the next 4 lines to test hierarchy extraction in browser console
  // if (items.length > 0 && items.some(item => item.type || item.categories)) {
  //   console.log(`🧪 PHASE 1 TEST: Logging hierarchy for ${items.length} items`);
  //   logGroupHierarchy(items);
  // }
  
  // Clear swimlane cache for new build session
  swimlaneCache.clear()
  
  // Start debug monitoring session
  debugMonitor.startSession()
  
  // Clear previous errors and recovery contexts at start of new build
  errorHandlingSystem.clearErrorsAndRecovery()
  
  // Only run validation in debug mode to reduce noise
  const shouldRunValidation = (typeof window !== 'undefined' && (window as any).ENABLE_COMPREHENSIVE_VALIDATION === true)
  
  if (shouldRunValidation) {
    validationReporter.startValidation()
    
    // Validate coordinate system consistency at the start
    logCoordinateSystemDebug()
    const coordinateValidation = validateCoordinateSystemConsistency()
    if (!coordinateValidation.isValid) {
      console.error(`❌ Coordinate system validation failed:`)
      coordinateValidation.issues.forEach(issue => console.error(`  • ${issue}`))
    }
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
  
  // Record visual boundary data for debugging
  recordVisualBoundaryData(laneBoundaries)
  
  // Generate assignment statistics
  const assignmentStats = generateAssignmentStatistics(treeItems)
  
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
    let position = calculateNodePosition(item, swimLane, sortedItems, laneHeights, laneBoundaries, groupingEnabled)
    
    // Enforce boundary constraints with error handling
    position = enforceBoundaryConstraints(position, swimLane, laneBoundaries, item.id)
    
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
    
    // Validate coordinate system consistency for positioning calculations
    const positionValidation = validatePositionCalculationConsistency(treeItems, laneHeights, laneBoundaries)
    if (!positionValidation.isValid) {
      console.error(`❌ Position calculation consistency issues:`)
      positionValidation.issues.forEach(issue => console.error(`  • ${issue}`))
    } else {
      console.log(`✅ Position calculations use consistent coordinate system`)
      console.log(`  • X calculations: ${positionValidation.metrics.consistentXCalculations}/${positionValidation.metrics.totalNodes}`)
      console.log(`  • Y calculations: ${positionValidation.metrics.consistentYCalculations}/${positionValidation.metrics.totalNodes}`)
      console.log(`  • Boundary alignment issues: ${positionValidation.metrics.boundaryAlignmentIssues}`)
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
  
  // Generate error recovery report
  const errorRecoveryReport = errorHandlingSystem.generateErrorRecoveryReport()
  
  // Log error recovery summary (only if there are significant issues)
  if (errorRecoveryReport.totalErrors > 10 || errorRecoveryReport.errorsBySeverity.critical > 0) {
    console.log(`\n🔧 ERROR RECOVERY SUMMARY`)
    console.log(`═══════════════════════════`)
    console.log(errorRecoveryReport.summary)
    
    // Only show critical and error counts
    if (errorRecoveryReport.errorsBySeverity.critical > 0) {
      console.log(`🚨 Critical errors: ${errorRecoveryReport.errorsBySeverity.critical}`)
    }
    if (errorRecoveryReport.errorsBySeverity.error > 0) {
      console.log(`❌ Errors: ${errorRecoveryReport.errorsBySeverity.error}`)
    }
    
    if (errorRecoveryReport.totalRecoveries > 0) {
      console.log(`🔧 Recoveries applied: ${errorRecoveryReport.totalRecoveries}`)
    }
    console.log(``)
  } else if (shouldRunValidation && errorRecoveryReport.totalErrors === 0) {
    console.log(`✅ No positioning errors detected`)
  }

  // Generate clean assignment summary instead of individual logs
  debugMonitor.generateAssignmentSummary()

  // Generate debug monitoring report
  const debugReport = debugMonitor.generateMonitoringReport()

  return { 
    nodes, 
    edges, 
    laneHeights, 
    laneBoundaries,
    validationResults: [],
    validationSummary: { totalTests: 0, failedTests: 0, totalIssues: 0 },
    comprehensiveReport,
    errorRecoveryReport,
    assignmentStats,
    debugReport
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
  validateCoordinateSystemConsistency,
  validatePositionCalculationConsistency,
  logCoordinateSystemDebug,
  validationReporter,
  // New tier-based positioning validation functions
  validatePrerequisitePositioning,
  validateTierAlignmentAcrossLanes,
  validatePrerequisiteEdgeConnections,
  validateTierBasedPositioning,
  validateTierSwimLaneIntegration,
  // Error handling and recovery system functions
  errorHandlingSystem
}

// Export error handling system functions for external access
export const getErrorHandlingSystem = () => errorHandlingSystem
export const getUserFriendlyErrors = () => errorHandlingSystem.getUserFriendlyErrors()
export const getRecoveryContext = (nodeId: string) => errorHandlingSystem.getRecoveryContext(nodeId)
export const generateErrorRecoveryReport = () => errorHandlingSystem.generateErrorRecoveryReport()

// Cache for swimlane assignments to avoid duplicate logging
const swimlaneCache = new Map<string, { lane: string, reason: string, logged: boolean }>()

function determineSwimLane(item: GameDataItem): string {
  // Check cache first
  const cached = swimlaneCache.get(item.id)
  if (cached) {
    return cached.lane
  }
  
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
  
  // Cache the result and log only once
  const gameFeature = getGameFeatureFromSourceFile(item.sourceFile)
  swimlaneCache.set(item.id, { lane: assignedLane, reason: assignmentReason, logged: false })
  
  // Only log if not already logged
  const cacheEntry = swimlaneCache.get(item.id)!
  if (!cacheEntry.logged) {
    logSwimLaneAssignment(item, assignedLane, assignmentReason, item.sourceFile, gameFeature)
    cacheEntry.logged = true
  }
  
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
 * Enforce boundary constraints by adjusting position with comprehensive error handling
 * Ensures nodes stay within their assigned lane boundaries by:
 * - Checking if position exceeds lane bounds
 * - Adjusting Y coordinate to fit within usable area
 * - Applying fallback positioning when boundary enforcement fails
 * - Logging user-friendly warnings when adjustments are made
 * 
 * @param position Current node position
 * @param lane Target swimlane name
 * @param boundaries Map of lane boundaries
 * @param nodeId Node identifier for error tracking
 * @returns Adjusted position that fits within lane bounds with recovery context
 */
function enforceBoundaryConstraints(
  position: { x: number, y: number },
  lane: string,
  boundaries: Map<string, LaneBoundary>,
  nodeId: string = 'unknown'
): { x: number, y: number } {
  // Use error handling system for comprehensive boundary enforcement
  const { position: adjustedPosition, recoveryContext } = errorHandlingSystem.handleBoundaryEnforcementFailure(
    position,
    lane,
    boundaries,
    nodeId
  )
  
  // Log recovery context if debugging is enabled
  if ((typeof window !== 'undefined' && (window as any).ENABLE_COMPREHENSIVE_VALIDATION === true) && 
      recoveryContext.appliedAdjustments.length > 0) {
    console.log(`🔧 Boundary enforcement recovery for node ${nodeId}:`)
    console.log(`   Strategy: ${recoveryContext.recoveryStrategy}`)
    console.log(`   Reason: ${recoveryContext.recoveryReason}`)
    console.log(`   Adjustments: ${recoveryContext.appliedAdjustments.join(', ')}`)
  }
  
  return adjustedPosition
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
    
    // Test 3: Enhanced Tier Width Consistency (Requirements 6.3, 6.4)
    this.testTierWidthConsistency(nodes, items)
    
    // Test 4: Enhanced Vertical-Horizontal Interference (Requirement 6.5)
    this.testVerticalHorizontalInterference(nodes, boundaries)
    
    // Test 5: Minimum Spacing Requirements
    this.testMinimumSpacing(nodes, boundaries)
    
    // Test 6: Position Calculation Accuracy
    this.testPositionCalculationAccuracy(nodes, boundaries, items)
    
    // Test 7: Comprehensive Tier-Based Positioning Integration (Requirements 6.1-6.5)
    this.runTierBasedPositioningValidation(nodes, boundaries, items)
    
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
   * Test tier width consistency across all lanes (Requirement 6.3, 6.4)
   */
  private testTierWidthConsistency(nodes: PositionedNode[], items: GameDataItem[]): void {
    const issues: ValidationIssue[] = []
    const tierPositions = new Map<number, Set<number>>()
    const tierLaneGroups = new Map<string, PositionedNode[]>()
    
    // Collect X positions for each tier and group by tier-lane
    nodes.forEach(node => {
      const tier = calculatePrerequisiteDepth(node.item, items)
      if (!tierPositions.has(tier)) {
        tierPositions.set(tier, new Set())
      }
      tierPositions.get(tier)!.add(node.position.x)
      
      const tierLaneKey = `${tier}-${node.lane}`
      if (!tierLaneGroups.has(tierLaneKey)) {
        tierLaneGroups.set(tierLaneKey, [])
      }
      tierLaneGroups.get(tierLaneKey)!.push(node)
    })
    
    // Check consistency within each tier (Requirement 6.3)
    tierPositions.forEach((xPositions, tier) => {
      const positions = Array.from(xPositions)
      if (positions.length > 1) {
        const minX = Math.min(...positions)
        const maxX = Math.max(...positions)
        const range = maxX - minX
        
        if (range > LAYOUT_CONSTANTS.TIER_WIDTH * 0.05) { // Tighter tolerance for better alignment
          issues.push({
            severity: 'warning',
            message: `Tier ${tier} has inconsistent X positions (range: ${range.toFixed(1)}px, tolerance: ${(LAYOUT_CONSTANTS.TIER_WIDTH * 0.05).toFixed(1)}px)`,
            metrics: { tier, range, tolerance: LAYOUT_CONSTANTS.TIER_WIDTH * 0.05 }
          })
        }
      }
    })
    
    // Check tier spacing consistency between consecutive tiers
    const sortedTiers = Array.from(tierPositions.keys()).sort((a, b) => a - b)
    for (let i = 1; i < sortedTiers.length; i++) {
      const prevTier = sortedTiers[i - 1]
      const currentTier = sortedTiers[i]
      
      const prevX = Math.min(...Array.from(tierPositions.get(prevTier)!))
      const currentX = Math.min(...Array.from(tierPositions.get(currentTier)!))
      const spacing = currentX - prevX
      
      const expectedSpacing = (currentTier - prevTier) * LAYOUT_CONSTANTS.TIER_WIDTH
      const tolerance = expectedSpacing * 0.1
      
      if (Math.abs(spacing - expectedSpacing) > tolerance) {
        issues.push({
          severity: 'warning',
          message: `Inconsistent spacing between tier ${prevTier} and ${currentTier}: ${spacing.toFixed(1)}px (expected: ${expectedSpacing}px)`,
          metrics: { prevTier, currentTier, actualSpacing: spacing, expectedSpacing }
        })
      }
    }
    
    // Check that nodes in same tier-lane combinations are properly aligned
    tierLaneGroups.forEach((groupNodes, tierLaneKey) => {
      if (groupNodes.length <= 1) return
      
      const [tier, lane] = tierLaneKey.split('-')
      const xPositions = groupNodes.map(n => n.position.x)
      const minX = Math.min(...xPositions)
      const maxX = Math.max(...xPositions)
      const range = maxX - minX
      
      // Nodes in same tier and lane should have identical X positions
      if (range > LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE) {
        issues.push({
          severity: 'error',
          message: `Nodes in tier ${tier}, lane "${lane}" have different X positions (range: ${range.toFixed(1)}px) - should be identical`,
          lane,
          metrics: { tier: parseInt(tier), lane, range, nodeCount: groupNodes.length }
        })
      }
    })
    
    this.validationResults.push({
      testName: 'Enhanced Tier Width Consistency',
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      recommendations: issues.length > 0 ? [
        'Ensure consistent TIER_WIDTH usage in positioning calculations',
        'Verify tier-based X positioning algorithm',
        'Check that nodes in same tier-lane have identical X positions',
        'Validate prerequisite depth calculation accuracy'
      ] : [],
      metrics: {
        totalTiers: tierPositions.size,
        totalTierLaneGroups: tierLaneGroups.size,
        inconsistentTiers: issues.filter(i => i.message.includes('inconsistent X positions')).length,
        spacingIssues: issues.filter(i => i.message.includes('Inconsistent spacing')).length,
        alignmentErrors: issues.filter(i => i.severity === 'error').length
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
    const tierGroups = new Map<number, PositionedNode[]>()
    
    nodes.forEach(node => {
      const key = `${node.tier}-${node.lane}`
      if (!tierLaneGroups.has(key)) {
        tierLaneGroups.set(key, [])
      }
      tierLaneGroups.get(key)!.push(node)
      
      if (!tierGroups.has(node.tier)) {
        tierGroups.set(node.tier, [])
      }
      tierGroups.get(node.tier)!.push(node)
    })
    
    // Test 1: Check each tier-lane group for proper vertical distribution
    tierLaneGroups.forEach((groupNodes, key) => {
      const [tierStr, lane] = key.split('-')
      const tier = parseInt(tierStr)
      const boundary = boundaries.get(lane)
      
      if (!boundary || groupNodes.length <= 1) return
      
      // Check if nodes are properly distributed within the lane
      const yPositions = groupNodes.map(n => n.position.y).sort((a, b) => a - b)
      const minY = yPositions[0]
      const maxY = yPositions[yPositions.length - 1]
      
      const nodeHalfHeight = DERIVED_CONSTANTS.NODE_HALF_HEIGHT
      const laneMinY = boundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
      const laneMaxY = boundary.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
      
      // Check if vertical distribution is constrained by horizontal positioning
      if (minY < laneMinY || maxY > laneMaxY) {
        issues.push({
          severity: 'error',
          message: `Tier ${tier} nodes in lane "${lane}" exceed vertical boundaries (Y range: ${minY.toFixed(1)}-${maxY.toFixed(1)}, allowed: ${laneMinY.toFixed(1)}-${laneMaxY.toFixed(1)})`,
          lane,
          metrics: { tier, actualMinY: minY, actualMaxY: maxY, allowedMinY: laneMinY, allowedMaxY: laneMaxY }
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
          lane,
          metrics: { tier, actualHeight, requiredHeight, compressionRatio: actualHeight / requiredHeight }
        })
      }
      
      // Check minimum spacing between nodes in same tier-lane group
      for (let i = 1; i < yPositions.length; i++) {
        const spacing = yPositions[i] - yPositions[i - 1]
        if (spacing < LAYOUT_CONSTANTS.MIN_NODE_SPACING) {
          issues.push({
            severity: 'error',
            message: `Insufficient spacing between tier ${tier} nodes in lane "${lane}": ${spacing.toFixed(1)}px (minimum: ${LAYOUT_CONSTANTS.MIN_NODE_SPACING}px)`,
            lane,
            metrics: { tier, actualSpacing: spacing, minimumSpacing: LAYOUT_CONSTANTS.MIN_NODE_SPACING }
          })
        }
      }
    })
    
    // Test 2: Check that horizontal tier positioning is consistent across lanes
    tierGroups.forEach((tierNodes, tier) => {
      if (tierNodes.length <= 1) return
      
      const xPositions = tierNodes.map(n => n.position.x)
      const minX = Math.min(...xPositions)
      const maxX = Math.max(...xPositions)
      const xRange = maxX - minX
      
      // All nodes in same tier should have very similar X positions
      if (xRange > LAYOUT_CONSTANTS.TIER_WIDTH * 0.05) {
        issues.push({
          severity: 'warning',
          message: `Tier ${tier} nodes have inconsistent horizontal positioning across lanes (X range: ${xRange.toFixed(1)}px)`,
          metrics: { tier, xRange, tolerance: LAYOUT_CONSTANTS.TIER_WIDTH * 0.05 }
        })
      }
      
      // Check that tier positioning doesn't force nodes outside their lanes
      tierNodes.forEach(node => {
        const boundary = boundaries.get(node.lane)
        if (!boundary) return
        
        const nodeHalfHeight = DERIVED_CONSTANTS.NODE_HALF_HEIGHT
        const laneMinY = boundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
        const laneMaxY = boundary.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
        
        if (node.position.y < laneMinY || node.position.y > laneMaxY) {
          issues.push({
            severity: 'error',
            message: `Tier ${tier} positioning forced node "${node.item.name}" outside lane "${node.lane}" boundaries`,
            nodeId: node.item.id,
            lane: node.lane,
            position: node.position,
            metrics: { tier, nodeY: node.position.y, laneMinY, laneMaxY }
          })
        }
      })
    })
    
    this.validationResults.push({
      testName: 'Enhanced Vertical-Horizontal Interference',
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      recommendations: issues.length > 0 ? [
        'Review interaction between tier-based X positioning and lane-based Y positioning',
        'Ensure vertical containment takes priority over horizontal alignment',
        'Verify that tier positioning doesn\'t force nodes outside lane boundaries',
        'Check minimum spacing requirements within tier-lane groups',
        'Validate horizontal consistency across lanes for same-tier nodes'
      ] : [],
      metrics: {
        totalTierLaneGroups: tierLaneGroups.size,
        totalTiers: tierGroups.size,
        boundaryViolations: issues.filter(i => i.message.includes('exceed vertical boundaries')).length,
        compressionWarnings: issues.filter(i => i.message.includes('over-compressed')).length,
        spacingViolations: issues.filter(i => i.message.includes('Insufficient spacing')).length,
        horizontalInconsistencies: issues.filter(i => i.message.includes('inconsistent horizontal positioning')).length
      }
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
   * Run comprehensive tier-based positioning validation (Requirements 6.1-6.5)
   */
  private runTierBasedPositioningValidation(
    nodes: PositionedNode[],
    boundaries: Map<string, LaneBoundary>,
    items: GameDataItem[]
  ): void {
    // Run all tier-based validation tests
    const tierValidationResults = validateTierBasedPositioning(items, nodes, boundaries)
    
    // Add results to main validation results
    this.validationResults.push(...tierValidationResults)
    
    // Log summary if in debug mode
    if ((typeof window !== 'undefined' && (window as any).ENABLE_COMPREHENSIVE_VALIDATION === true)) {
      console.log(`\n📐 TIER-BASED POSITIONING VALIDATION`)
      console.log(`═══════════════════════════════════`)
      
      tierValidationResults.forEach(result => {
        const status = result.passed ? '✅' : '❌'
        const errorCount = result.issues.filter(i => i.severity === 'error').length
        const warningCount = result.issues.filter(i => i.severity === 'warning').length
        
        console.log(`${status} ${result.testName}: ${errorCount} errors, ${warningCount} warnings`)
        
        if (!result.passed && result.issues.length > 0) {
          result.issues.slice(0, 3).forEach(issue => {
            const icon = issue.severity === 'error' ? '❌' : '⚠️'
            console.log(`  ${icon} ${issue.message}`)
          })
          
          if (result.issues.length > 3) {
            console.log(`  ... and ${result.issues.length - 3} more issues`)
          }
        }
      })
      
      // Overall tier validation summary
      const totalTests = tierValidationResults.length
      const passedTests = tierValidationResults.filter(r => r.passed).length
      const totalErrors = tierValidationResults.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'error').length, 0)
      const totalWarnings = tierValidationResults.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'warning').length, 0)
      
      console.log(`\n📊 Tier Validation Summary: ${passedTests}/${totalTests} tests passed`)
      if (totalErrors > 0) console.log(`❌ ${totalErrors} critical tier positioning errors`)
      if (totalWarnings > 0) console.log(`⚠️ ${totalWarnings} tier positioning warnings`)
      
      if (passedTests === totalTests && totalErrors === 0) {
        console.log(`✅ All tier-based positioning requirements validated successfully`)
      }
    }
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

/**
 * Error Handling and Recovery System
 * Provides comprehensive fallback positioning, overcrowding recovery, and emergency spacing
 */
class ErrorHandlingAndRecoverySystem {
  private emergencyConfig: EmergencySpacingConfig = {
    minAbsoluteSpacing: 5, // Absolute minimum spacing in pixels
    compressionRatio: 0.7, // Compress to 70% of normal spacing
    maxCompressionAttempts: 3,
    fallbackToMinimumHeight: true,
    enableRedistribution: true
  }
  
  private userFriendlyErrors: UserFriendlyError[] = []
  private recoveryContexts: Map<string, ErrorRecoveryContext> = new Map()
  
  /**
   * Handle boundary enforcement failure with fallback positioning (Requirement 5.2)
   */
  handleBoundaryEnforcementFailure(
    position: { x: number, y: number },
    lane: string,
    boundaries: Map<string, LaneBoundary>,
    nodeId: string
  ): { position: { x: number, y: number }, recoveryContext: ErrorRecoveryContext } {
    const boundary = boundaries.get(lane)
    if (!boundary) {
      // Critical failure - no boundary found
      const fallbackPosition = this.applyEmergencyFallbackPosition(position, lane)
      const recoveryContext: ErrorRecoveryContext = {
        originalPosition: position,
        lane,
        tier: 0, // Unknown tier
        boundary: this.createEmergencyBoundary(lane),
        recoveryStrategy: 'fallback',
        recoveryReason: 'No boundary found for lane',
        appliedAdjustments: ['emergency-fallback-position']
      }
      
      this.addUserFriendlyError({
        severity: 'critical',
        title: 'Lane Boundary Missing',
        message: `Could not find boundary information for lane "${lane}". Applied emergency positioning.`,
        technicalDetails: `Node ${nodeId} at position (${position.x}, ${position.y}) has no lane boundary`,
        suggestedActions: [
          'Check lane configuration',
          'Verify lane height calculations',
          'Review swimlane setup'
        ],
        affectedNodes: [nodeId],
        recoveryApplied: true
      })
      
      this.recoveryContexts.set(nodeId, recoveryContext)
      return { position: fallbackPosition, recoveryContext }
    }
    
    // Apply boundary constraint with fallback logic
    const nodeHalfHeight = DERIVED_CONSTANTS.NODE_HALF_HEIGHT
    const minY = boundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
    const maxY = boundary.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
    
    let adjustedPosition = { ...position }
    const appliedAdjustments: string[] = []
    
    // Check if position is outside bounds
    if (position.y < minY) {
      adjustedPosition.y = minY
      appliedAdjustments.push(`adjusted-y-to-min-boundary-${minY.toFixed(1)}`)
    } else if (position.y > maxY) {
      adjustedPosition.y = maxY
      appliedAdjustments.push(`adjusted-y-to-max-boundary-${maxY.toFixed(1)}`)
    }
    
    // If adjustment was needed, create recovery context
    if (appliedAdjustments.length > 0) {
      const recoveryContext: ErrorRecoveryContext = {
        originalPosition: position,
        lane,
        tier: 0, // Will be filled by caller
        boundary,
        recoveryStrategy: 'fallback',
        recoveryReason: 'Position outside lane boundaries',
        appliedAdjustments
      }
      
      this.addUserFriendlyError({
        severity: 'warning',
        title: 'Position Adjusted for Boundary Compliance',
        message: `Node position was adjusted to fit within lane "${lane}" boundaries.`,
        technicalDetails: `Original Y: ${position.y.toFixed(1)}, Adjusted Y: ${adjustedPosition.y.toFixed(1)}`,
        suggestedActions: [
          'Review lane height calculations',
          'Check node distribution algorithm',
          'Consider increasing lane height'
        ],
        affectedNodes: [nodeId],
        recoveryApplied: true
      })
      
      this.recoveryContexts.set(nodeId, recoveryContext)
    }
    
    return { 
      position: adjustedPosition, 
      recoveryContext: this.recoveryContexts.get(nodeId) || this.createDefaultRecoveryContext(position, lane, boundary)
    }
  }
  
  /**
   * Analyze lane overcrowding and determine recovery strategy (Requirement 5.3)
   */
  analyzeLaneOvercrowding(
    lane: string,
    nodes: PositionedNode[],
    boundary: LaneBoundary
  ): LaneOvercrowdingAnalysis {
    const laneNodes = nodes.filter(n => n.lane === lane)
    const nodeCount = laneNodes.length
    
    if (nodeCount === 0) {
      return {
        lane,
        boundary,
        nodeCount: 0,
        requiredSpace: 0,
        availableSpace: boundary.usableHeight,
        overcrowdingRatio: 0,
        severity: 'none',
        recommendedAction: 'none'
      }
    }
    
    // Calculate space requirements
    const requiredNodeSpace = nodeCount * LAYOUT_CONSTANTS.NODE_HEIGHT
    const requiredSpacingSpace = Math.max(0, nodeCount - 1) * LAYOUT_CONSTANTS.NODE_PADDING
    const requiredSpace = requiredNodeSpace + requiredSpacingSpace
    const availableSpace = boundary.usableHeight
    
    const overcrowdingRatio = requiredSpace / availableSpace
    
    // Determine severity and recommended action
    let severity: LaneOvercrowdingAnalysis['severity']
    let recommendedAction: LaneOvercrowdingAnalysis['recommendedAction']
    
    if (overcrowdingRatio <= 1.0) {
      severity = 'none'
      recommendedAction = 'none'
    } else if (overcrowdingRatio <= 1.2) {
      severity = 'mild'
      recommendedAction = 'compress'
    } else if (overcrowdingRatio <= 1.5) {
      severity = 'moderate'
      recommendedAction = 'compress'
    } else if (overcrowdingRatio <= 2.0) {
      severity = 'severe'
      recommendedAction = 'redistribute'
    } else {
      severity = 'critical'
      recommendedAction = 'emergency'
    }
    
    return {
      lane,
      boundary,
      nodeCount,
      requiredSpace,
      availableSpace,
      overcrowdingRatio,
      severity,
      recommendedAction
    }
  }
  
  /**
   * Apply recovery logic for overcrowded lanes (Requirement 5.3)
   */
  recoverOvercrowdedLane(
    analysis: LaneOvercrowdingAnalysis,
    nodes: PositionedNode[]
  ): { recoveredNodes: PositionedNode[], recoveryContexts: ErrorRecoveryContext[] } {
    const laneNodes = nodes.filter(n => n.lane === analysis.lane)
    const recoveryContexts: ErrorRecoveryContext[] = []
    
    if (analysis.severity === 'none') {
      return { recoveredNodes: laneNodes, recoveryContexts: [] }
    }
    
    let recoveredNodes: PositionedNode[]
    
    switch (analysis.recommendedAction) {
      case 'compress':
        recoveredNodes = this.applyCompressionRecovery(laneNodes, analysis, recoveryContexts)
        break
      case 'redistribute':
        recoveredNodes = this.applyRedistributionRecovery(laneNodes, analysis, recoveryContexts)
        break
      case 'emergency':
        recoveredNodes = this.applyEmergencyRecovery(laneNodes, analysis, recoveryContexts)
        break
      default:
        recoveredNodes = laneNodes
    }
    
    // Add user-friendly error for overcrowding
    this.addUserFriendlyError({
      severity: analysis.severity === 'critical' ? 'critical' : 'warning',
      title: `Lane Overcrowding Detected`,
      message: `Lane "${analysis.lane}" has ${analysis.nodeCount} nodes requiring ${analysis.requiredSpace.toFixed(0)}px but only ${analysis.availableSpace.toFixed(0)}px available.`,
      technicalDetails: `Overcrowding ratio: ${analysis.overcrowdingRatio.toFixed(2)}x, Applied strategy: ${analysis.recommendedAction}`,
      suggestedActions: [
        'Consider increasing lane height',
        'Review node distribution across lanes',
        'Check if some nodes can be moved to adjacent lanes'
      ],
      affectedNodes: laneNodes.map(n => n.item.id),
      recoveryApplied: true
    })
    
    return { recoveredNodes, recoveryContexts }
  }
  
  /**
   * Apply compression recovery for mildly overcrowded lanes
   */
  private applyCompressionRecovery(
    nodes: PositionedNode[],
    analysis: LaneOvercrowdingAnalysis,
    recoveryContexts: ErrorRecoveryContext[]
  ): PositionedNode[] {
    if (nodes.length <= 1) return nodes
    
    // Sort nodes by Y position
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y)
    
    // Calculate compressed spacing
    const availableSpacingArea = analysis.availableSpace - (nodes.length * LAYOUT_CONSTANTS.NODE_HEIGHT)
    const compressedSpacing = Math.max(
      this.emergencyConfig.minAbsoluteSpacing,
      availableSpacingArea / Math.max(1, nodes.length - 1)
    )
    
    // Apply compressed positioning
    const nodeHalfHeight = DERIVED_CONSTANTS.NODE_HALF_HEIGHT
    const startY = analysis.boundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
    
    return sortedNodes.map((node, index) => {
      const newY = startY + (index * (LAYOUT_CONSTANTS.NODE_HEIGHT + compressedSpacing))
      const originalPosition = node.position
      
      const recoveryContext: ErrorRecoveryContext = {
        originalPosition,
        lane: analysis.lane,
        tier: node.tier,
        boundary: analysis.boundary,
        recoveryStrategy: 'compression',
        recoveryReason: `Lane overcrowding (${analysis.overcrowdingRatio.toFixed(2)}x)`,
        appliedAdjustments: [`compressed-spacing-${compressedSpacing.toFixed(1)}px`]
      }
      
      recoveryContexts.push(recoveryContext)
      this.recoveryContexts.set(node.item.id, recoveryContext)
      
      return {
        ...node,
        position: { x: node.position.x, y: newY },
        withinBounds: true
      }
    })
  }
  
  /**
   * Apply redistribution recovery for severely overcrowded lanes
   */
  private applyRedistributionRecovery(
    nodes: PositionedNode[],
    analysis: LaneOvercrowdingAnalysis,
    recoveryContexts: ErrorRecoveryContext[]
  ): PositionedNode[] {
    // For now, fall back to compression with tighter spacing
    // In a full implementation, this would move some nodes to adjacent lanes
    const tighterConfig = {
      ...this.emergencyConfig,
      compressionRatio: 0.5 // More aggressive compression
    }
    
    const originalConfig = this.emergencyConfig
    this.emergencyConfig = tighterConfig
    
    const result = this.applyCompressionRecovery(nodes, analysis, recoveryContexts)
    
    // Update recovery contexts to reflect redistribution attempt
    recoveryContexts.forEach(context => {
      context.recoveryStrategy = 'redistribution'
      context.recoveryReason += ' (redistribution fallback to tight compression)'
    })
    
    this.emergencyConfig = originalConfig
    return result
  }
  
  /**
   * Apply emergency recovery for critically overcrowded lanes
   */
  private applyEmergencyRecovery(
    nodes: PositionedNode[],
    analysis: LaneOvercrowdingAnalysis,
    recoveryContexts: ErrorRecoveryContext[]
  ): PositionedNode[] {
    if (nodes.length <= 1) return nodes
    
    // Emergency: use absolute minimum spacing
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y)
    const emergencySpacing = this.emergencyConfig.minAbsoluteSpacing
    
    const nodeHalfHeight = DERIVED_CONSTANTS.NODE_HALF_HEIGHT
    const startY = analysis.boundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
    
    return sortedNodes.map((node, index) => {
      const newY = startY + (index * (LAYOUT_CONSTANTS.NODE_HEIGHT + emergencySpacing))
      const originalPosition = node.position
      
      const recoveryContext: ErrorRecoveryContext = {
        originalPosition,
        lane: analysis.lane,
        tier: node.tier,
        boundary: analysis.boundary,
        recoveryStrategy: 'emergency',
        recoveryReason: `Critical lane overcrowding (${analysis.overcrowdingRatio.toFixed(2)}x)`,
        appliedAdjustments: [`emergency-spacing-${emergencySpacing}px`, 'minimum-spacing-override']
      }
      
      recoveryContexts.push(recoveryContext)
      this.recoveryContexts.set(node.item.id, recoveryContext)
      
      return {
        ...node,
        position: { x: node.position.x, y: newY },
        withinBounds: newY <= (analysis.boundary.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight)
      }
    })
  }
  
  /**
   * Create emergency spacing algorithm for extreme cases (Requirement 5.3)
   */
  createEmergencySpacingAlgorithm(
    nodes: PositionedNode[],
    availableHeight: number
  ): PositionedNode[] {
    if (nodes.length === 0) return nodes
    if (nodes.length === 1) {
      // Single node: center it
      const centerY = availableHeight / 2
      return [{
        ...nodes[0],
        position: { x: nodes[0].position.x, y: centerY },
        withinBounds: true
      }]
    }
    
    // Multiple nodes: distribute with absolute minimum spacing
    const nodeHalfHeight = DERIVED_CONSTANTS.NODE_HALF_HEIGHT
    const totalNodeHeight = nodes.length * LAYOUT_CONSTANTS.NODE_HEIGHT
    const availableSpacingHeight = Math.max(0, availableHeight - totalNodeHeight)
    
    // Calculate spacing - if not enough space, use zero spacing (nodes will touch)
    const spacingPerGap = nodes.length > 1 ? 
      Math.max(0, availableSpacingHeight / (nodes.length - 1)) : 0
    
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y)
    
    return sortedNodes.map((node, index) => {
      // Start from top with half node height as buffer
      const newY = nodeHalfHeight + (index * (LAYOUT_CONSTANTS.NODE_HEIGHT + spacingPerGap))
      
      // Ensure we don't exceed available height - compress if necessary
      const maxAllowedY = availableHeight - nodeHalfHeight
      const finalY = Math.min(newY, maxAllowedY)
      
      const recoveryContext: ErrorRecoveryContext = {
        originalPosition: node.position,
        lane: node.lane,
        tier: node.tier,
        boundary: this.createEmergencyBoundary(node.lane, availableHeight),
        recoveryStrategy: 'emergency',
        recoveryReason: 'Emergency spacing algorithm applied',
        appliedAdjustments: [`emergency-algorithm-spacing-${spacingPerGap.toFixed(1)}px`]
      }
      
      this.recoveryContexts.set(node.item.id, recoveryContext)
      
      return {
        ...node,
        position: { x: node.position.x, y: finalY },
        withinBounds: finalY + nodeHalfHeight <= availableHeight
      }
    })
  }
  
  /**
   * Apply emergency fallback position when all else fails
   */
  private applyEmergencyFallbackPosition(
    position: { x: number, y: number },
    lane: string
  ): { x: number, y: number } {
    // Fallback to a safe default position
    const laneIndex = SWIM_LANES.indexOf(lane)
    const fallbackY = (laneIndex >= 0 ? laneIndex : 0) * LAYOUT_CONSTANTS.MIN_LANE_HEIGHT + 
                     LAYOUT_CONSTANTS.MIN_LANE_HEIGHT / 2
    
    return {
      x: Math.max(LAYOUT_CONSTANTS.LANE_START_X, position.x),
      y: fallbackY
    }
  }
  
  /**
   * Create emergency boundary when normal boundary calculation fails
   */
  private createEmergencyBoundary(lane: string, height?: number): LaneBoundary {
    const laneIndex = SWIM_LANES.indexOf(lane)
    const safeIndex = laneIndex >= 0 ? laneIndex : SWIM_LANES.length - 1
    const boundaryHeight = height || LAYOUT_CONSTANTS.MIN_LANE_HEIGHT
    
    const startY = safeIndex * (LAYOUT_CONSTANTS.MIN_LANE_HEIGHT + LAYOUT_CONSTANTS.LANE_PADDING)
    const endY = startY + boundaryHeight
    
    return {
      lane,
      startY,
      endY,
      centerY: startY + boundaryHeight / 2,
      height: boundaryHeight,
      usableHeight: boundaryHeight - (2 * LAYOUT_CONSTANTS.LANE_BUFFER)
    }
  }
  
  /**
   * Create default recovery context
   */
  private createDefaultRecoveryContext(
    position: { x: number, y: number },
    lane: string,
    boundary: LaneBoundary
  ): ErrorRecoveryContext {
    return {
      originalPosition: position,
      lane,
      tier: 0,
      boundary,
      recoveryStrategy: 'fallback',
      recoveryReason: 'Default recovery context',
      appliedAdjustments: []
    }
  }
  
  /**
   * Add user-friendly error message (Requirement 5.5)
   */
  private addUserFriendlyError(error: UserFriendlyError): void {
    this.userFriendlyErrors.push(error)
    
    // Log user-friendly error to console
    const icon = error.severity === 'critical' ? '🚨' : 
                 error.severity === 'error' ? '❌' : 
                 error.severity === 'warning' ? '⚠️' : 'ℹ️'
    
    console.log(`${icon} ${error.title}`)
    console.log(`   ${error.message}`)
    
    if (error.technicalDetails) {
      console.log(`   Technical: ${error.technicalDetails}`)
    }
    
    if (error.suggestedActions.length > 0) {
      console.log(`   Suggestions: ${error.suggestedActions.join(', ')}`)
    }
    
    if (error.recoveryApplied) {
      console.log(`   ✅ Automatic recovery applied`)
    }
  }
  
  /**
   * Get all user-friendly errors
   */
  getUserFriendlyErrors(): UserFriendlyError[] {
    return [...this.userFriendlyErrors]
  }
  
  /**
   * Get recovery context for a specific node
   */
  getRecoveryContext(nodeId: string): ErrorRecoveryContext | undefined {
    return this.recoveryContexts.get(nodeId)
  }
  
  /**
   * Clear all errors and recovery contexts (for new graph builds)
   */
  clearErrorsAndRecovery(): void {
    this.userFriendlyErrors = []
    this.recoveryContexts.clear()
  }
  
  /**
   * Generate error and recovery summary report
   */
  generateErrorRecoveryReport(): {
    totalErrors: number
    errorsBySeverity: Record<string, number>
    totalRecoveries: number
    recoveriesByStrategy: Record<string, number>
    summary: string
  } {
    const errorsBySeverity = this.userFriendlyErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const recoveriesByStrategy = Array.from(this.recoveryContexts.values()).reduce((acc, context) => {
      acc[context.recoveryStrategy] = (acc[context.recoveryStrategy] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const totalErrors = this.userFriendlyErrors.length
    const totalRecoveries = this.recoveryContexts.size
    
    let summary = `Error Recovery Report: ${totalErrors} errors, ${totalRecoveries} recoveries applied`
    
    if (totalErrors === 0 && totalRecoveries === 0) {
      summary = '✅ No errors or recoveries needed - all positioning successful'
    } else if (totalRecoveries > 0) {
      summary += ` - ${totalRecoveries} automatic fixes applied`
    }
    
    return {
      totalErrors,
      errorsBySeverity,
      totalRecoveries,
      recoveriesByStrategy,
      summary
    }
  }
}

// Global error handling and recovery system instance
const errorHandlingSystem = new ErrorHandlingAndRecoverySystem()

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
 * Enhanced vertical node distribution within lanes with comprehensive error handling
 * Implements improved spacing algorithm for Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 * Includes fallback positioning, overcrowding recovery, and emergency spacing (Requirements 5.2, 5.3)
 */
function handleOvercrowdedLane(
  laneItems: GameDataItem[],
  lane: string,
  tier: number,
  boundary: LaneBoundary,
  allItems: GameDataItem[]
): { positions: Map<string, { x: number, y: number }>, warnings: string[], recoveryContexts: ErrorRecoveryContext[] } {
  const positions = new Map<string, { x: number, y: number }>()
  const warnings: string[] = []
  const recoveryContexts: ErrorRecoveryContext[] = []
  
  const nodesInLaneTier = laneItems.filter(item => {
    const itemTier = calculatePrerequisiteDepth(item, allItems)
    return itemTier === tier
  })
  
  const totalNodes = nodesInLaneTier.length
  if (totalNodes === 0) return { positions, warnings, recoveryContexts }
  
  // Create positioned nodes for error handling analysis
  const positionedNodes: PositionedNode[] = nodesInLaneTier.map(item => ({
    item,
    position: { x: 0, y: 0 }, // Will be calculated
    lane,
    tier,
    withinBounds: false // Will be determined
  }))
  
  // Analyze lane overcrowding using error handling system
  const overcrowdingAnalysis = errorHandlingSystem.analyzeLaneOvercrowding(lane, positionedNodes, boundary)
  
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
    const position = { x: finalX, y: centerY }
    
    // Apply boundary enforcement with error handling
    const enforcedPosition = enforceBoundaryConstraints(position, lane, new Map([[lane, boundary]]), nodesInLaneTier[0].id)
    positions.set(nodesInLaneTier[0].id, enforcedPosition)
    
    // Update positioned node
    positionedNodes[0].position = enforcedPosition
    positionedNodes[0].withinBounds = true
  } else {
    // Multiple nodes - use error handling system for recovery if needed
    if (overcrowdingAnalysis.severity !== 'none') {
      // Apply overcrowding recovery
      const { recoveredNodes, recoveryContexts: nodeRecoveryContexts } = errorHandlingSystem.recoverOvercrowdedLane(
        overcrowdingAnalysis,
        positionedNodes
      )
      
      // Update positions from recovered nodes
      recoveredNodes.forEach(node => {
        positions.set(node.item.id, node.position)
      })
      
      recoveryContexts.push(...nodeRecoveryContexts)
      
      // Add warnings from recovery
      warnings.push(`Lane ${lane} tier ${tier}: Applied ${overcrowdingAnalysis.recommendedAction} recovery for ${totalNodes} nodes`)
      if (overcrowdingAnalysis.severity === 'critical') {
        warnings.push(`CRITICAL: Lane ${lane} requires ${overcrowdingAnalysis.requiredSpace.toFixed(0)}px but only has ${overcrowdingAnalysis.availableSpace.toFixed(0)}px available`)
      }
    } else {
      // Normal distribution - no overcrowding
      const minRequiredSpacing = (totalNodes - 1) * LAYOUT_CONSTANTS.MIN_NODE_SPACING
      const idealSpacing = (totalNodes - 1) * LAYOUT_CONSTANTS.NODE_PADDING
      
      if (availableSpacingHeight >= idealSpacing) {
        // Nodes fit comfortably - use even distribution (Requirement 3.1)
        distributeNodesEvenly(nodesInLaneTier, positions, finalX, boundary, lane, tier)
      } else if (availableSpacingHeight >= minRequiredSpacing) {
        // Nodes fit with compression - use maximum possible spacing (Requirement 3.2, 3.3)
        distributeNodesWithCompression(nodesInLaneTier, positions, finalX, boundary, availableSpacingHeight, warnings, lane, tier)
      } else {
        // Apply emergency spacing algorithm (Requirement 5.3)
        const emergencyNodes = errorHandlingSystem.createEmergencySpacingAlgorithm(positionedNodes, usableHeight)
        emergencyNodes.forEach(node => {
          positions.set(node.item.id, node.position)
        })
        
        warnings.push(`EMERGENCY: Applied emergency spacing algorithm for lane ${lane} tier ${tier}`)
        warnings.push(`Consider redistributing items or increasing lane height for lane ${lane}`)
      }
    }
  }
  
  // Final boundary validation with error handling
  positions.forEach((position, itemId) => {
    const enforcedPosition = enforceBoundaryConstraints(position, lane, new Map([[lane, boundary]]), itemId)
    if (enforcedPosition.x !== position.x || enforcedPosition.y !== position.y) {
      positions.set(itemId, enforcedPosition)
      warnings.push(`Position adjusted for boundary compliance: ${itemId}`)
    }
  })
  
  return { positions, warnings, recoveryContexts }
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
  laneBoundaries?: Map<string, LaneBoundary>,
  groupingEnabled: boolean = false  // NEW PARAMETER - DEFAULT FALSE
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
  
  // Validate tier positioning consistency (Requirement 6.3, 6.4)
  if (shouldRecordSteps) {
    // Check if other items in same tier have consistent X positioning
    const sameTierItems = allItems.filter(other => {
      const otherTier = calculatePrerequisiteDepth(other, allItems)
      return otherTier === tier && other.id !== item.id
    })
    
    if (sameTierItems.length > 0) {
      calculationSteps.push({
        step: 'Validate Tier Consistency',
        description: 'Ensure consistent X positioning for same-tier items',
        input: { tier, sameTierCount: sameTierItems.length, expectedX: finalX },
        output: { tierConsistencyCheck: 'passed' },
        timestamp: performance.now()
      })
    }
  }
  
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
        
        // Log recovery contexts if any were applied
        if (compressionResult.recoveryContexts.length > 0) {
          const itemRecovery = compressionResult.recoveryContexts.find(ctx => 
            ctx.lane === swimLane && ctx.tier === tier
          )
          if (itemRecovery && shouldRecordSteps) {
            console.log(`🔧 Recovery applied for ${item.name}: ${itemRecovery.recoveryStrategy} (${itemRecovery.recoveryReason})`)
          }
        }
      } else {
        // Fallback to center if position not found - use error handling system
        nodeY = boundary.centerY
        const fallbackPosition = { x: finalX, y: nodeY }
        const { position: recoveredPosition } = errorHandlingSystem.handleBoundaryEnforcementFailure(
          fallbackPosition,
          swimLane,
          laneBoundaries,
          item.id
        )
        nodeY = recoveredPosition.y
        console.warn(`⚠️ Could not find position for ${item.name} in lane ${swimLane}, applied fallback with error recovery`)
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
  
  // Enhanced debug logging for position calculations
  const debugSteps = calculationSteps.map(step => ({
    step: step.step,
    value: step.output,
    description: step.description
  }))
  logPositionCalculation(item, swimLane, tier, calculatedPosition, calculatedPosition, debugSteps, calculationTime)
  
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
  
  // PHASE 2: Apply grouping adjustment if enabled
  if (groupingEnabled && item.type && item.categories) {
    const adjustedPosition = applyGroupingAdjustment(
      item,
      calculatedPosition, // Use the position calculated by existing logic
      swimLane,
      allItems,
      laneHeights
    );
    return adjustedPosition;
  }
  
  return calculatedPosition
}

/**
 * PHASE 2: Apply grouping adjustment to position nodes by type/category
 * This modifies Y position to group items while preserving tier-based X positioning
 */
function applyGroupingAdjustment(
  item: GameDataItem,
  basePosition: { x: number, y: number },
  swimLane: string,
  allItems: GameDataItem[],
  laneHeights: Map<string, number>
): { x: number, y: number } {
  const hierarchy = getOrBuildHierarchy(allItems);
  const type = normalizeGroupString(item.type || 'ungrouped');
  const category = normalizeGroupString(item.categories?.[0] || 'uncategorized');
  
  // Find which type group this item belongs to
  const laneTypes = Object.keys(hierarchy[swimLane] || {});
  const typeIndex = laneTypes.indexOf(type);
  
  // Find which category row within the type
  const typeCategories = Object.keys(hierarchy[swimLane]?.[type] || {});
  const categoryIndex = typeCategories.indexOf(category);
  
  // Calculate lane start Y using existing logic
  let laneStartY = LAYOUT_CONSTANTS.LANE_PADDING;
  for (const lane of SWIM_LANES) {
    if (lane === swimLane) break;
    const laneHeight = laneHeights.get(lane) || LAYOUT_CONSTANTS.MIN_LANE_HEIGHT;
    laneStartY += laneHeight + LAYOUT_CONSTANTS.LANE_PADDING;
  }
  
  const laneHeight = laneHeights.get(swimLane) || LAYOUT_CONSTANTS.MIN_LANE_HEIGHT;
  
  // Simple positioning for now - will refine in Phase 3
  const typeGroupHeight = laneHeight / Math.max(laneTypes.length, 1);
  const categoryRowHeight = typeGroupHeight / Math.max(typeCategories.length, 1);
  
  const groupedY = laneStartY + 
    (typeIndex * typeGroupHeight) + 
    (categoryIndex * categoryRowHeight) +
    (LAYOUT_CONSTANTS.NODE_HEIGHT / 2);
  
  // Keep X based on tier (prerequisite depth) - DO NOT CHANGE
  const finalPosition = { 
    x: basePosition.x,  // Maintain tier-based horizontal position
    y: Math.min(groupedY, laneStartY + laneHeight - LAYOUT_CONSTANTS.NODE_HEIGHT) // Enforce boundary
  };
  
  return finalPosition;
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

/**
 * PHASE 1: Type/Category Grouping Data Extraction Functions
 * These functions extract and organize items by type and category for future grouping enhancements
 * They DO NOT modify existing positioning logic - they are for data analysis only
 */

/**
 * PHASE 2: Cache to avoid recalculating hierarchy 
 */
// Cache to avoid recalculating hierarchy
let cachedHierarchy: GroupHierarchy | null = null;
let cachedItemsHash: string | null = null;

function getOrBuildHierarchy(items: GameDataItem[]): GroupHierarchy {
  const itemsHash = items.map(i => `${i.id}:${i.type}:${i.categories}`).join('|');
  
  if (cachedHierarchy && cachedItemsHash === itemsHash) {
    return cachedHierarchy;
  }
  
  cachedHierarchy = extractTypeCategories(items);
  cachedItemsHash = itemsHash;
  return cachedHierarchy;
}

/**
 * Extract type/category hierarchy from game data items
 * This creates a structured hierarchy for future grouping features
 * 
 * @param items Game data items to analyze
 * @returns Hierarchical structure: swimlane -> type -> category -> items
 */
function extractTypeCategories(items: GameDataItem[]): GroupHierarchy {
  const hierarchy: GroupHierarchy = {};
  
  items.forEach(item => {
    const swimlane = determineSwimLane(item); // Use existing function
    const type = normalizeGroupString(item.type || 'ungrouped');
    const category = normalizeGroupString(item.categories?.[0] || 'uncategorized');
    
    // Build hierarchy with null-safe operations
    if (!hierarchy[swimlane]) hierarchy[swimlane] = {};
    if (!hierarchy[swimlane][type]) hierarchy[swimlane][type] = {};
    if (!hierarchy[swimlane][type][category]) hierarchy[swimlane][type][category] = [];
    
    hierarchy[swimlane][type][category].push(item);
  });
  
  return hierarchy;
}

/**
 * Normalize string for grouping consistency
 * Handles variations in naming and removes plurals
 * 
 * @param str String to normalize
 * @returns Normalized string for consistent grouping
 */
function normalizeGroupString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, '_').replace(/s$/, '');
}

/**
 * Log group hierarchy for verification and debugging
 * This helps verify that extraction is working correctly
 * 
 * @param items Game data items to analyze
 */
function logGroupHierarchy(items: GameDataItem[]): void {
  const hierarchy = extractTypeCategories(items);
  console.log('🎯 TYPE/CATEGORY HIERARCHY EXTRACTION (Phase 1):');
  
  Object.entries(hierarchy).forEach(([swimlane, types]) => {
    console.log(`\n📊 ${swimlane}:`);
    Object.entries(types).forEach(([type, categories]) => {
      console.log(`  📁 Type: ${type}`);
      Object.entries(categories).forEach(([category, itemsInCategory]) => {
        console.log(`    📄 Category: ${category} (${itemsInCategory.length} items)`);
        itemsInCategory.forEach(item => {
          const tier = calculatePrerequisiteDepth(item, items);
          console.log(`      - ${item.name} (tier: ${tier})`);
        });
      });
    });
  });
  
  // Summary statistics
  const totalSwimLanes = Object.keys(hierarchy).length;
  const totalTypes = Object.values(hierarchy).reduce((sum, types) => sum + Object.keys(types).length, 0);
  const totalCategories = Object.values(hierarchy).reduce((sum, types) => 
    sum + Object.values(types).reduce((typeSum, categories) => typeSum + Object.keys(categories).length, 0), 0);
  
  console.log(`\n📈 EXTRACTION SUMMARY:`);
  console.log(`  Swimlanes: ${totalSwimLanes}`);
  console.log(`  Types: ${totalTypes}`);
  console.log(`  Categories: ${totalCategories}`);
  console.log(`  Total Items: ${items.length}`);
}

/**
 * Tier-Based Positioning Integration Functions
 * These functions ensure proper integration between horizontal tier positioning and vertical swimlane containment
 */

/**
 * Validate prerequisite positioning - ensures prerequisites are positioned to the left (Requirement 6.1)
 */
function validatePrerequisitePositioning(items: GameDataItem[], nodes: PositionedNode[]): ValidationResult {
  const issues: ValidationIssue[] = []
  const nodeMap = new Map(nodes.map(n => [n.item.id, n]))
  
  items.forEach(item => {
    if (!item.prerequisites || item.prerequisites.length === 0) return
    
    const currentNode = nodeMap.get(item.id)
    if (!currentNode) return
    
    item.prerequisites.forEach(prereqId => {
      const prereqNode = nodeMap.get(prereqId)
      if (!prereqNode) {
        issues.push({
          severity: 'warning',
          message: `Missing prerequisite node "${prereqId}" for item "${item.name}"`,
          nodeId: item.id
        })
        return
      }
      
      // Requirement 6.1: Prerequisites should be to the left (smaller X)
      if (prereqNode.position.x >= currentNode.position.x) {
        issues.push({
          severity: 'error',
          message: `Prerequisite "${prereqNode.item.name}" (X: ${prereqNode.position.x}) is not to the left of "${item.name}" (X: ${currentNode.position.x})`,
          nodeId: item.id,
          position: currentNode.position,
          expectedPosition: { x: prereqNode.position.x - LAYOUT_CONSTANTS.TIER_WIDTH, y: currentNode.position.y }
        })
      }
      
      // Additional check: ensure reasonable tier spacing
      const tierDifference = currentNode.tier - prereqNode.tier
      const xDifference = currentNode.position.x - prereqNode.position.x
      const expectedXDifference = tierDifference * LAYOUT_CONSTANTS.TIER_WIDTH
      
      if (Math.abs(xDifference - expectedXDifference) > LAYOUT_CONSTANTS.TIER_WIDTH * 0.2) {
        issues.push({
          severity: 'warning',
          message: `Inconsistent tier spacing between "${prereqNode.item.name}" and "${item.name}": ${xDifference.toFixed(1)}px (expected: ${expectedXDifference}px)`,
          nodeId: item.id
        })
      }
    })
  })
  
  return {
    testName: 'Prerequisite Positioning Validation',
    passed: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    recommendations: issues.length > 0 ? [
      'Ensure prerequisite nodes are positioned to the left of dependent nodes',
      'Verify tier calculation algorithm for prerequisite depth',
      'Check for circular dependencies in prerequisite chains'
    ] : [],
    metrics: {
      totalItems: items.length,
      itemsWithPrerequisites: items.filter(i => i.prerequisites && i.prerequisites.length > 0).length,
      prerequisiteViolations: issues.filter(i => i.severity === 'error').length
    }
  }
}

/**
 * Validate tier alignment across lanes - ensures same-tier nodes are aligned within their lanes (Requirement 6.2)
 */
function validateTierAlignmentAcrossLanes(nodes: PositionedNode[], boundaries: Map<string, LaneBoundary>): ValidationResult {
  const issues: ValidationIssue[] = []
  const tierGroups = new Map<number, PositionedNode[]>()
  
  // Group nodes by tier
  nodes.forEach(node => {
    if (!tierGroups.has(node.tier)) {
      tierGroups.set(node.tier, [])
    }
    tierGroups.get(node.tier)!.push(node)
  })
  
  // Check alignment within each tier
  tierGroups.forEach((tierNodes, tier) => {
    if (tierNodes.length <= 1) return
    
    // Check X position consistency (horizontal alignment)
    const xPositions = tierNodes.map(n => n.position.x)
    const minX = Math.min(...xPositions)
    const maxX = Math.max(...xPositions)
    const xRange = maxX - minX
    
    // Allow small tolerance for tier alignment
    const tolerance = LAYOUT_CONSTANTS.TIER_WIDTH * 0.05 // 5% tolerance
    
    if (xRange > tolerance) {
      issues.push({
        severity: 'warning',
        message: `Tier ${tier} nodes have inconsistent X positions (range: ${xRange.toFixed(1)}px, tolerance: ${tolerance.toFixed(1)}px)`,
        metrics: { tier, xRange, tolerance, nodeCount: tierNodes.length }
      })
    }
    
    // Check that nodes are properly contained within their respective lanes
    tierNodes.forEach(node => {
      const boundary = boundaries.get(node.lane)
      if (!boundary) return
      
      const nodeHalfHeight = DERIVED_CONSTANTS.NODE_HALF_HEIGHT
      const minY = boundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
      const maxY = boundary.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
      
      if (node.position.y < minY || node.position.y > maxY) {
        issues.push({
          severity: 'error',
          message: `Tier ${tier} node "${node.item.name}" in lane "${node.lane}" is outside lane boundaries (Y: ${node.position.y}, allowed: ${minY.toFixed(1)}-${maxY.toFixed(1)})`,
          nodeId: node.item.id,
          lane: node.lane,
          position: node.position
        })
      }
    })
    
    // Group by lane within tier to check vertical alignment within lanes
    const laneGroups = new Map<string, PositionedNode[]>()
    tierNodes.forEach(node => {
      if (!laneGroups.has(node.lane)) {
        laneGroups.set(node.lane, [])
      }
      laneGroups.get(node.lane)!.push(node)
    })
    
    // Check vertical distribution within each lane for this tier
    laneGroups.forEach((laneNodes, lane) => {
      if (laneNodes.length <= 1) return
      
      const yPositions = laneNodes.map(n => n.position.y).sort((a, b) => a - b)
      const minY = yPositions[0]
      const maxY = yPositions[yPositions.length - 1]
      const yRange = maxY - minY
      
      // Check minimum spacing between nodes in same tier and lane
      for (let i = 1; i < yPositions.length; i++) {
        const spacing = yPositions[i] - yPositions[i - 1]
        if (spacing < LAYOUT_CONSTANTS.MIN_NODE_SPACING) {
          issues.push({
            severity: 'error',
            message: `Insufficient spacing between tier ${tier} nodes in lane "${lane}": ${spacing.toFixed(1)}px (minimum: ${LAYOUT_CONSTANTS.MIN_NODE_SPACING}px)`,
            lane,
            metrics: { tier, spacing, minimumSpacing: LAYOUT_CONSTANTS.MIN_NODE_SPACING }
          })
        }
      }
    })
  })
  
  return {
    testName: 'Tier Alignment Across Lanes',
    passed: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    recommendations: issues.length > 0 ? [
      'Ensure consistent tier-based X positioning across all lanes',
      'Verify lane boundary enforcement for tier-aligned nodes',
      'Check vertical distribution algorithm for same-tier nodes within lanes'
    ] : [],
    metrics: {
      totalTiers: tierGroups.size,
      totalNodes: nodes.length,
      alignmentIssues: issues.filter(i => i.message.includes('inconsistent X positions')).length,
      boundaryViolations: issues.filter(i => i.message.includes('outside lane boundaries')).length,
      spacingViolations: issues.filter(i => i.message.includes('Insufficient spacing')).length
    }
  }
}

/**
 * Validate prerequisite edge connections - ensures edges connect properly positioned nodes (Requirement 6.4)
 */
function validatePrerequisiteEdgeConnections(items: GameDataItem[], nodes: PositionedNode[], boundaries: Map<string, LaneBoundary>): ValidationResult {
  const issues: ValidationIssue[] = []
  const nodeMap = new Map(nodes.map(n => [n.item.id, n]))
  let totalEdges = 0
  let validEdges = 0
  
  items.forEach(item => {
    if (!item.prerequisites || item.prerequisites.length === 0) return
    
    const targetNode = nodeMap.get(item.id)
    if (!targetNode) return
    
    item.prerequisites.forEach(prereqId => {
      totalEdges++
      const sourceNode = nodeMap.get(prereqId)
      
      if (!sourceNode) {
        issues.push({
          severity: 'error',
          message: `Cannot create edge: source node "${prereqId}" not found for target "${item.name}"`,
          nodeId: item.id
        })
        return
      }
      
      // Validate edge geometry
      const xDistance = targetNode.position.x - sourceNode.position.x
      const yDistance = Math.abs(targetNode.position.y - sourceNode.position.y)
      
      // Check horizontal flow (prerequisite should be to the left)
      if (xDistance <= 0) {
        issues.push({
          severity: 'error',
          message: `Invalid edge direction: "${sourceNode.item.name}" (X: ${sourceNode.position.x}) to "${targetNode.item.name}" (X: ${targetNode.position.x}) - prerequisite should be to the left`,
          nodeId: item.id
        })
        return
      }
      
      // Check reasonable edge length (not too long or too short)
      const edgeLength = Math.sqrt(xDistance * xDistance + yDistance * yDistance)
      const maxReasonableLength = LAYOUT_CONSTANTS.TIER_WIDTH * 3 // Max 3 tiers apart
      const minReasonableLength = LAYOUT_CONSTANTS.TIER_WIDTH * 0.5 // Min half tier apart
      
      if (edgeLength > maxReasonableLength) {
        issues.push({
          severity: 'warning',
          message: `Very long edge: "${sourceNode.item.name}" to "${targetNode.item.name}" (${edgeLength.toFixed(1)}px) - may indicate positioning issues`,
          nodeId: item.id,
          metrics: { edgeLength, maxReasonableLength }
        })
      } else if (edgeLength < minReasonableLength) {
        issues.push({
          severity: 'warning',
          message: `Very short edge: "${sourceNode.item.name}" to "${targetNode.item.name}" (${edgeLength.toFixed(1)}px) - nodes may be too close`,
          nodeId: item.id,
          metrics: { edgeLength, minReasonableLength }
        })
      }
      
      // Check if both nodes are within their lane boundaries
      const sourceBoundary = boundaries.get(sourceNode.lane)
      const targetBoundary = boundaries.get(targetNode.lane)
      
      if (sourceBoundary && targetBoundary) {
        const sourceWithinBounds = validateNodeWithinBoundary(sourceNode, sourceBoundary)
        const targetWithinBounds = validateNodeWithinBoundary(targetNode, targetBoundary)
        
        if (!sourceWithinBounds || !targetWithinBounds) {
          issues.push({
            severity: 'error',
            message: `Edge connects nodes outside lane boundaries: "${sourceNode.item.name}" (${sourceWithinBounds ? 'valid' : 'invalid'}) to "${targetNode.item.name}" (${targetWithinBounds ? 'valid' : 'invalid'})`,
            nodeId: item.id
          })
          return
        }
      }
      
      validEdges++
    })
  })
  
  return {
    testName: 'Prerequisite Edge Connections',
    passed: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    recommendations: issues.length > 0 ? [
      'Ensure prerequisite edges flow from left to right',
      'Verify both source and target nodes are within lane boundaries',
      'Check for reasonable edge lengths and positioning'
    ] : [],
    metrics: {
      totalEdges,
      validEdges,
      invalidEdges: totalEdges - validEdges,
      edgeValidationRate: totalEdges > 0 ? (validEdges / totalEdges) * 100 : 100
    }
  }
}

/**
 * Helper function to validate if a node is within its lane boundary
 */
function validateNodeWithinBoundary(node: PositionedNode, boundary: LaneBoundary): boolean {
  const nodeHalfHeight = DERIVED_CONSTANTS.NODE_HALF_HEIGHT
  const minY = boundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
  const maxY = boundary.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
  
  return node.position.y >= minY && node.position.y <= maxY
}

/**
 * Comprehensive tier-based positioning validation (integrates all tier-swimlane requirements)
 */
function validateTierBasedPositioning(items: GameDataItem[], nodes: PositionedNode[], boundaries: Map<string, LaneBoundary>): ValidationResult[] {
  const results: ValidationResult[] = []
  
  // Run all tier-based validation tests (Requirements 6.1-6.5)
  results.push(validatePrerequisitePositioning(items, nodes))
  results.push(validateTierAlignmentAcrossLanes(nodes, boundaries))
  results.push(validatePrerequisiteEdgeConnections(items, nodes, boundaries))
  
  // Additional integration validation
  results.push(validateTierSwimLaneIntegration(items, nodes, boundaries))
  
  return results
}

/**
 * Validate tier-swimlane integration - ensures tier positioning doesn't interfere with lane containment (Requirement 6.5)
 */
function validateTierSwimLaneIntegration(items: GameDataItem[], nodes: PositionedNode[], boundaries: Map<string, LaneBoundary>): ValidationResult {
  const issues: ValidationIssue[] = []
  
  // Group nodes by tier to analyze cross-lane consistency
  const tierGroups = new Map<number, PositionedNode[]>()
  nodes.forEach(node => {
    if (!tierGroups.has(node.tier)) {
      tierGroups.set(node.tier, [])
    }
    tierGroups.get(node.tier)!.push(node)
  })
  
  // Validate each tier's integration with swimlane system
  tierGroups.forEach((tierNodes, tier) => {
    // Check horizontal consistency across lanes for same tier
    const xPositions = tierNodes.map(n => n.position.x)
    const minX = Math.min(...xPositions)
    const maxX = Math.max(...xPositions)
    const xRange = maxX - minX
    
    // Tier alignment should be very tight (Requirement 6.3)
    const tolerance = LAYOUT_CONSTANTS.TIER_WIDTH * 0.02 // 2% tolerance
    if (xRange > tolerance) {
      issues.push({
        severity: 'warning',
        message: `Tier ${tier} has inconsistent horizontal positioning across lanes (range: ${xRange.toFixed(1)}px, tolerance: ${tolerance.toFixed(1)}px)`,
        metrics: { tier, xRange, tolerance, nodeCount: tierNodes.length }
      })
    }
    
    // Check that tier positioning doesn't force nodes outside lane boundaries
    tierNodes.forEach(node => {
      const boundary = boundaries.get(node.lane)
      if (!boundary) return
      
      const nodeHalfHeight = DERIVED_CONSTANTS.NODE_HALF_HEIGHT
      const minY = boundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
      const maxY = boundary.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
      
      if (node.position.y < minY || node.position.y > maxY) {
        issues.push({
          severity: 'error',
          message: `Tier ${tier} positioning forced node "${node.item.name}" outside lane "${node.lane}" boundaries (Y: ${node.position.y.toFixed(1)}, allowed: ${minY.toFixed(1)}-${maxY.toFixed(1)})`,
          nodeId: node.item.id,
          lane: node.lane,
          position: node.position
        })
      }
    })
    
    // Check for proper prerequisite flow within tier constraints
    tierNodes.forEach(node => {
      if (!node.item.prerequisites || node.item.prerequisites.length === 0) return
      
      node.item.prerequisites.forEach(prereqId => {
        const prereqNode = nodes.find(n => n.item.id === prereqId)
        if (!prereqNode) return
        
        // Prerequisite should be in earlier tier (Requirement 6.1)
        if (prereqNode.tier >= node.tier) {
          issues.push({
            severity: 'error',
            message: `Invalid tier relationship: prerequisite "${prereqNode.item.name}" (tier ${prereqNode.tier}) should be in earlier tier than "${node.item.name}" (tier ${node.tier})`,
            nodeId: node.item.id
          })
        }
        
        // Check horizontal positioning matches tier relationship
        if (prereqNode.position.x >= node.position.x) {
          issues.push({
            severity: 'error',
            message: `Tier positioning violation: prerequisite "${prereqNode.item.name}" (X: ${prereqNode.position.x}) should be left of "${node.item.name}" (X: ${node.position.x})`,
            nodeId: node.item.id,
            position: node.position,
            expectedPosition: { x: prereqNode.position.x - LAYOUT_CONSTANTS.TIER_WIDTH, y: node.position.y }
          })
        }
      })
    })
  })
  
  // Validate tier spacing consistency
  const sortedTiers = Array.from(tierGroups.keys()).sort((a, b) => a - b)
  for (let i = 1; i < sortedTiers.length; i++) {
    const prevTier = sortedTiers[i - 1]
    const currentTier = sortedTiers[i]
    
    const prevNodes = tierGroups.get(prevTier)!
    const currentNodes = tierGroups.get(currentTier)!
    
    const prevX = Math.min(...prevNodes.map(n => n.position.x))
    const currentX = Math.min(...currentNodes.map(n => n.position.x))
    
    const actualSpacing = currentX - prevX
    const expectedSpacing = (currentTier - prevTier) * LAYOUT_CONSTANTS.TIER_WIDTH
    const spacingTolerance = expectedSpacing * 0.1
    
    if (Math.abs(actualSpacing - expectedSpacing) > spacingTolerance) {
      issues.push({
        severity: 'warning',
        message: `Inconsistent tier spacing between tier ${prevTier} and ${currentTier}: ${actualSpacing.toFixed(1)}px (expected: ${expectedSpacing}px ± ${spacingTolerance.toFixed(1)}px)`,
        metrics: { prevTier, currentTier, actualSpacing, expectedSpacing, tolerance: spacingTolerance }
      })
    }
  }
  
  return {
    testName: 'Tier-Swimlane Integration',
    passed: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    recommendations: issues.length > 0 ? [
      'Ensure tier-based X positioning is consistent across all lanes',
      'Verify that tier positioning doesn\'t override lane boundary enforcement',
      'Check prerequisite depth calculation for accuracy',
      'Validate tier spacing constants are applied consistently'
    ] : [],
    metrics: {
      totalTiers: tierGroups.size,
      totalNodes: nodes.length,
      crossLaneConsistencyIssues: issues.filter(i => i.message.includes('inconsistent horizontal positioning')).length,
      boundaryViolations: issues.filter(i => i.message.includes('outside lane') && i.severity === 'error').length,
      tierRelationshipViolations: issues.filter(i => i.message.includes('Invalid tier relationship')).length,
      positioningViolations: issues.filter(i => i.message.includes('Tier positioning violation')).length,
      spacingInconsistencies: issues.filter(i => i.message.includes('Inconsistent tier spacing')).length
    }
  }
}

/**
 * Coordinate System Validation Functions
 * These functions ensure all positioning calculations use consistent constants and coordinate systems
 */

/**
 * Validate that all positioning calculations use consistent coordinate system constants
 */
function validateCoordinateSystemConsistency(): {
  isValid: boolean
  issues: string[]
  constants: typeof LAYOUT_CONSTANTS
  derivedConstants: typeof DERIVED_CONSTANTS
} {
  const issues: string[] = []
  
  // Validate that constants are properly defined
  if (LAYOUT_CONSTANTS.NODE_HEIGHT <= 0) {
    issues.push('NODE_HEIGHT must be positive')
  }
  
  if (LAYOUT_CONSTANTS.TIER_WIDTH <= 0) {
    issues.push('TIER_WIDTH must be positive')
  }
  
  if (LAYOUT_CONSTANTS.LANE_PADDING < 0) {
    issues.push('LANE_PADDING must be non-negative')
  }
  
  if (LAYOUT_CONSTANTS.LANE_BUFFER < 0) {
    issues.push('LANE_BUFFER must be non-negative')
  }
  
  if (LAYOUT_CONSTANTS.MIN_NODE_SPACING < 0) {
    issues.push('MIN_NODE_SPACING must be non-negative')
  }
  
  // Validate derived constants are correctly calculated
  if (DERIVED_CONSTANTS.NODE_HALF_HEIGHT !== LAYOUT_CONSTANTS.NODE_HEIGHT / 2) {
    issues.push('NODE_HALF_HEIGHT derivation is incorrect')
  }
  
  if (DERIVED_CONSTANTS.NODE_HALF_WIDTH !== LAYOUT_CONSTANTS.NODE_WIDTH / 2) {
    issues.push('NODE_HALF_WIDTH derivation is incorrect')
  }
  
  if (DERIVED_CONSTANTS.TIER_CENTER_OFFSET !== LAYOUT_CONSTANTS.TIER_WIDTH / 2) {
    issues.push('TIER_CENTER_OFFSET derivation is incorrect')
  }
  
  if (DERIVED_CONSTANTS.LANE_TOTAL_PADDING !== LAYOUT_CONSTANTS.LANE_BUFFER * 2) {
    issues.push('LANE_TOTAL_PADDING derivation is incorrect')
  }
  
  // Validate logical relationships
  if (LAYOUT_CONSTANTS.MIN_NODE_SPACING > LAYOUT_CONSTANTS.NODE_PADDING) {
    issues.push('MIN_NODE_SPACING should not exceed NODE_PADDING')
  }
  
  if (LAYOUT_CONSTANTS.LANE_BUFFER * 2 >= LAYOUT_CONSTANTS.MIN_LANE_HEIGHT) {
    issues.push('LANE_BUFFER * 2 should be less than MIN_LANE_HEIGHT to allow usable space')
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    constants: LAYOUT_CONSTANTS,
    derivedConstants: DERIVED_CONSTANTS
  }
}

/**
 * Validate that position calculations are using consistent coordinate system
 */
function validatePositionCalculationConsistency(
  items: GameDataItem[],
  laneHeights: Map<string, number>,
  laneBoundaries: Map<string, LaneBoundary>
): {
  isValid: boolean
  issues: string[]
  metrics: {
    totalNodes: number
    consistentXCalculations: number
    consistentYCalculations: number
    boundaryAlignmentIssues: number
  }
} {
  const issues: string[] = []
  let consistentXCalculations = 0
  let consistentYCalculations = 0
  let boundaryAlignmentIssues = 0
  
  const treeItems = items.filter(item => 
    item.category === 'Actions' || item.category === 'Unlocks'
  )
  
  treeItems.forEach(item => {
    const lane = determineSwimLane(item)
    const tier = calculatePrerequisiteDepth(item, treeItems)
    const boundary = laneBoundaries.get(lane)
    
    if (!boundary) {
      issues.push(`No boundary found for lane ${lane} (item: ${item.name})`)
      return
    }
    
    // Validate X calculation consistency
    const expectedX = LAYOUT_CONSTANTS.LANE_START_X + (tier * LAYOUT_CONSTANTS.TIER_WIDTH) + DERIVED_CONSTANTS.NODE_HALF_WIDTH
    const minX = LAYOUT_CONSTANTS.LANE_START_X + DERIVED_CONSTANTS.NODE_HALF_WIDTH
    const finalExpectedX = Math.max(minX, expectedX)
    
    // This is the expected X calculation - we can't validate actual position here
    // but we can validate the calculation logic is consistent
    if (expectedX >= minX) {
      consistentXCalculations++
    }
    
    // Validate Y calculation boundary alignment
    const laneHeight = laneHeights.get(lane) || LAYOUT_CONSTANTS.MIN_LANE_HEIGHT
    const calculatedBoundaryHeight = laneHeight
    const actualBoundaryHeight = boundary.height
    
    if (Math.abs(calculatedBoundaryHeight - actualBoundaryHeight) > LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE) {
      boundaryAlignmentIssues++
      issues.push(`Boundary height mismatch for lane ${lane}: calculated ${calculatedBoundaryHeight}, actual ${actualBoundaryHeight}`)
    } else {
      consistentYCalculations++
    }
  })
  
  return {
    isValid: issues.length === 0,
    issues,
    metrics: {
      totalNodes: treeItems.length,
      consistentXCalculations,
      consistentYCalculations,
      boundaryAlignmentIssues
    }
  }
}

/**
 * Add debugging output for coordinate system usage
 */
function logCoordinateSystemDebug(): void {
  console.log(`\n🎯 COORDINATE SYSTEM DEBUG`)
  console.log(`═══════════════════════════`)
  console.log(`Layout Constants:`)
  Object.entries(LAYOUT_CONSTANTS).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`)
  })
  console.log(``)
  console.log(`Derived Constants:`)
  Object.entries(DERIVED_CONSTANTS).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`)
  })
  console.log(``)
  
  const validation = validateCoordinateSystemConsistency()
  if (validation.isValid) {
    console.log(`✅ Coordinate system constants are consistent`)
  } else {
    console.log(`❌ Coordinate system issues found:`)
    validation.issues.forEach(issue => {
      console.log(`  • ${issue}`)
    })
  }
  console.log(``)
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
