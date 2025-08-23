# Design Document

## Overview

The Upgrade Tree Swimlane Positioning Fix addresses the critical visual organization issues in the current upgrade tree implementation. Based on the current state analysis, the system lacks proper swimlane visual separation, node containment, and feature-based organization. This design implements a robust swimlane system that provides clear visual organization similar to Civilization V's tech tree.

## Architecture

### Current State Analysis

From the provided screenshot, the current implementation has several critical issues:
- No visible swimlane backgrounds or separation
- All nodes appear in a single continuous area
- Missing lane labels and visual organization
- Uniform node coloring prevents feature distinction
- No clear horizontal lane structure

### Target Architecture

```
Swimlane System Architecture
├── Lane Assignment Engine
│   ├── Source File Analysis → Determine correct lane
│   ├── Game Feature Mapping → Map to swimlane
│   └── Fallback Logic → Handle edge cases
├── Positioning Engine
│   ├── Lane Boundary Calculation → Define lane Y boundaries
│   ├── Tier-based X Positioning → Horizontal prerequisite flow
│   ├── Vertical Distribution → Even spacing within lanes
│   └── Boundary Enforcement → Prevent spillover
├── Visual Rendering System
│   ├── Lane Background Generation → Visual lane separation
│   ├── Lane Label Positioning → Clear lane identification
│   ├── Feature-based Coloring → Visual distinction
│   └── Z-index Management → Proper layering
└── Validation & Debug System
    ├── Position Validation → Ensure boundary compliance
    ├── Assignment Logging → Debug lane assignments
    └── Visual Verification → Confirm proper rendering
```

## Components and Interfaces

### 1. Enhanced Lane Assignment System

```typescript
interface SwimLaneAssignment {
  // Core lane determination
  determineSwimLane(item: GameDataItem): string
  validateAssignment(item: GameDataItem, lane: string): boolean
  
  // Enhanced mapping logic
  mapTownVendorToLane(sourceFile: string): string
  mapGameFeatureToLane(gameFeature: string): string
  
  // Debug and validation
  logAssignmentReason(item: GameDataItem, lane: string, reason: string): void
  getAssignmentStats(): LaneAssignmentStats
}

interface LaneAssignmentStats {
  totalItems: number
  itemsPerLane: Map<string, number>
  unassignedItems: GameDataItem[]
  assignmentReasons: Map<string, string>
}
```

### 2. Boundary-Enforced Positioning System

```typescript
interface PositioningEngine {
  // Lane boundary management
  calculateLaneBoundaries(): Map<string, LaneBoundary>
  enforceBoundaryConstraints(position: Position, lane: string): Position
  
  // Enhanced positioning logic
  calculateNodePosition(
    item: GameDataItem, 
    lane: string, 
    tier: number,
    laneItems: GameDataItem[]
  ): Position
  
  // Validation
  validateAllPositions(nodes: PositionedNode[]): ValidationResult[]
}

interface LaneBoundary {
  lane: string
  startY: number
  endY: number
  centerY: number
  height: number
  usableHeight: number // excluding buffers
}

interface PositionedNode {
  item: GameDataItem
  position: Position
  lane: string
  tier: number
  withinBounds: boolean
}
```

### 3. Visual Rendering Enhancement

```typescript
interface VisualRenderingSystem {
  // Lane visual elements
  generateLaneBackgrounds(boundaries: Map<string, LaneBoundary>): CytoscapeElement[]
  generateLaneLabels(boundaries: Map<string, LaneBoundary>): CytoscapeElement[]
  
  // Node styling
  applyFeatureBasedColors(nodes: CytoscapeElement[]): void
  applyLaneSpecificStyling(nodes: CytoscapeElement[]): void
  
  // Z-index management
  enforceProperLayering(): void
}

interface LaneVisualConfig {
  backgroundColor: string
  borderColor: string
  labelColor: string
  alternatingPattern: boolean
}
```

## Data Models

### Enhanced Node Data Structure

```typescript
interface EnhancedNodeData {
  // Existing data
  id: string
  label: string
  tier: number
  prerequisites: string[]
  
  // Enhanced swimlane data
  swimLane: string
  swimLaneIndex: number
  assignmentReason: string
  gameFeature: string
  sourceVendor?: string
  
  // Positioning data
  position: Position
  laneBoundary: LaneBoundary
  withinBounds: boolean
  positioningStrategy: 'centered' | 'distributed' | 'compressed'
  
  // Visual data
  featureColor: string
  laneColor: string
  visualPriority: number
}
```

### Lane Configuration System

```typescript
interface SwimLaneConfig {
  name: string
  index: number
  gameFeature: string
  color: string
  description: string
  sourceFiles: string[]
  vendorTypes?: string[]
  fallbackRules: string[]
}

const ENHANCED_SWIM_LANE_CONFIG: SwimLaneConfig[] = [
  {
    name: 'Farm',
    index: 0,
    gameFeature: 'Farm',
    color: '#059669',
    description: 'Agricultural actions and farm upgrades',
    sourceFiles: ['farm_actions.csv', 'farm_upgrades.csv'],
    fallbackRules: ['contains:farm', 'contains:crop', 'contains:seed']
  },
  {
    name: 'Blacksmith',
    index: 2,
    gameFeature: 'Town',
    color: '#dc2626',
    description: 'Blacksmith vendor items',
    sourceFiles: ['town_blacksmith.csv'],
    vendorTypes: ['blacksmith'],
    fallbackRules: ['contains:weapon', 'contains:tool', 'contains:metal']
  },
  // ... additional lane configurations
]
```

## Error Handling

### Positioning Error Recovery

```typescript
interface PositioningErrorHandler {
  handleBoundaryViolation(node: PositionedNode, violation: BoundaryViolation): Position
  handleOvercrowdedLane(lane: string, nodes: PositionedNode[]): PositionedNode[]
  handleMissingLaneAssignment(item: GameDataItem): string
  
  // Recovery strategies
  compressNodesInLane(lane: string, nodes: PositionedNode[]): PositionedNode[]
  redistributeOverflowNodes(sourceNodes: PositionedNode[]): PositionedNode[]
  applyEmergencySpacing(nodes: PositionedNode[]): PositionedNode[]
}

interface BoundaryViolation {
  node: PositionedNode
  violationType: 'top' | 'bottom' | 'left' | 'right'
  actualPosition: Position
  allowedBoundary: LaneBoundary
  severity: 'minor' | 'major' | 'critical'
}
```

### Visual Rendering Fallbacks

```typescript
interface RenderingFallbacks {
  handleMissingLaneBackground(lane: string): CytoscapeElement
  handleInvisibleLaneLabel(lane: string): CytoscapeElement
  handleColorConflicts(nodes: CytoscapeElement[]): void
  
  // Emergency rendering
  renderMinimalLaneStructure(): CytoscapeElement[]
  applyDefaultStyling(elements: CytoscapeElement[]): void
}
```

## Testing Strategy

### Visual Validation Tests

```typescript
interface VisualValidationSuite {
  // Boundary compliance tests
  testAllNodesWithinBounds(): TestResult[]
  testLaneBackgroundAlignment(): TestResult[]
  testLaneLabelVisibility(): TestResult[]
  
  // Spacing validation tests
  testMinimumNodeSpacing(): TestResult[]
  testLaneHeightCalculation(): TestResult[]
  testTierAlignment(): TestResult[]
  
  // Assignment validation tests
  testSwimLaneAssignments(): TestResult[]
  testFeatureColorMapping(): TestResult[]
  testVendorCategorization(): TestResult[]
}

interface TestResult {
  testName: string
  passed: boolean
  issues: ValidationIssue[]
  recommendations: string[]
}
```

### Performance Testing

```typescript
interface PerformanceTestSuite {
  // Rendering performance
  testInitialRenderTime(): PerformanceMetric
  testRebuildPerformance(): PerformanceMetric
  testLargeDatasetHandling(): PerformanceMetric
  
  // Memory usage
  testMemoryUsageWithLanes(): PerformanceMetric
  testMemoryLeakDetection(): PerformanceMetric
}
```

## Implementation Phases

### Phase 1: Core Lane Assignment Fix
- Fix `determineSwimLane()` function with comprehensive mapping
- Add assignment validation and logging
- Implement fallback logic for edge cases
- Add debug output for assignment verification

### Phase 2: Boundary Enforcement System
- Implement strict boundary calculation and enforcement
- Add position validation for all nodes
- Create overflow handling and compression logic
- Add warning system for overcrowded lanes

### Phase 3: Visual Rendering Enhancement
- Implement proper lane background generation
- Add lane labels with correct positioning
- Apply feature-based color coding
- Fix z-index layering issues

### Phase 4: Integration and Polish
- Integrate all systems with existing codebase
- Add comprehensive error handling
- Implement performance optimizations
- Add visual validation tools

## Success Metrics

### Visual Organization Metrics
- **Lane Containment**: 100% of nodes positioned within their assigned lane boundaries
- **Visual Clarity**: All 14 swimlanes clearly visible with backgrounds and labels
- **Color Distinction**: Each game feature has distinct coloring for easy identification
- **Spacing Consistency**: Consistent spacing maintained across all lanes and tiers

### Technical Performance Metrics
- **Render Time**: Initial render < 1 second for 150+ nodes
- **Rebuild Performance**: Graph rebuild < 500ms
- **Memory Usage**: No memory leaks during repeated rebuilds
- **Assignment Accuracy**: 100% of items correctly assigned to appropriate lanes

### User Experience Metrics
- **Visual Clarity**: Clear distinction between different game systems
- **Navigation Ease**: Easy to follow prerequisite chains within and across lanes
- **Professional Appearance**: Clean, organized layout similar to Civilization V
- **Debug Capability**: Clear logging and validation for troubleshooting

## Conclusion

This design addresses the fundamental swimlane organization issues by implementing a comprehensive system for proper lane assignment, boundary enforcement, and visual rendering. The solution ensures that the upgrade tree achieves the intended Civilization V-style organization with clear visual separation between game systems, proper node containment, and professional appearance.