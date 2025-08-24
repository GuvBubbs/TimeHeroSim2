# Design Document

## Overview

The Upgrade Tree Type and Category Grouping Enhancement implements intelligent node organization within swimlanes based on CSV data structure. Instead of positioning nodes solely by prerequisite tier, the system will create logical groupings using the `type` and `categories` columns, allowing users to read upgrade progressions naturally from left to right. This design maintains the existing swimlane system while adding a sophisticated sub-organization layer that respects both data relationships and visual clarity.

## Architecture

### Enhanced Positioning Pipeline

```
Current Flow: CSV Data → Swimlane Assignment → Tier Calculation → Position
Enhanced Flow: CSV Data → Swimlane Assignment → Type/Category Analysis → Group Organization → Tier-Aware Positioning → Position
```

### Core Components

```
Type/Category Grouping System
├── Data Analysis Engine
│   ├── Type Extraction → Parse type column from CSV
│   ├── Category Extraction → Parse categories column from CSV  
│   ├── Group Hierarchy Builder → Create type → category → items structure
│   └── Fallback Logic → Handle missing/inconsistent data
├── Group Organization Engine
│   ├── Vertical Group Layout → Position type groups within swimlane
│   ├── Category Row Layout → Position category rows within type groups
│   ├── Horizontal Flow Calculation → Maintain prerequisite left-to-right flow
│   └── Boundary Enforcement → Ensure all groups fit within lane bounds
├── Enhanced Positioning Engine
│   ├── Group-Aware Tier Calculation → Calculate tiers within category context
│   ├── Row-Constrained Positioning → Keep category items in same row
│   ├── Spacing Optimization → Balance group spacing and lane capacity
│   └── Collision Detection → Prevent overlapping between groups
└── Integration Layer
    ├── Existing System Compatibility → Maintain current functionality
    ├── Performance Optimization → Efficient grouping algorithms
    └── Debug/Validation Tools → Monitor grouping accuracy
```

## Components and Interfaces

### 1. Type/Category Data Analysis

```typescript
interface TypeCategoryAnalyzer {
  // Data extraction
  extractTypeData(items: GameDataItem[]): TypeGroupMap
  extractCategoryData(items: GameDataItem[]): CategoryGroupMap
  buildGroupHierarchy(items: GameDataItem[]): GroupHierarchy
  
  // Validation and cleanup
  validateGroupData(hierarchy: GroupHierarchy): ValidationResult
  handleMissingData(items: GameDataItem[]): GameDataItem[]
  normalizeGroupNames(hierarchy: GroupHierarchy): GroupHierarchy
}

interface TypeGroupMap {
  [swimlane: string]: {
    [type: string]: GameDataItem[]
  }
}

interface CategoryGroupMap {
  [swimlane: string]: {
    [type: string]: {
      [category: string]: GameDataItem[]
    }
  }
}

interface GroupHierarchy {
  [swimlane: string]: TypeGroup[]
}

interface TypeGroup {
  type: string
  items: GameDataItem[]
  categories: CategoryGroup[]
  verticalPosition: number // Y position within swimlane
  height: number // Total height needed for this type group
}

interface CategoryGroup {
  category: string
  items: GameDataItem[]
  rowPosition: number // Y position within type group
  tierSpread: number // Horizontal spread based on prerequisites
}
```

### 2. Group Organization Engine

```typescript
interface GroupOrganizer {
  // Main organization methods
  organizeSwimLane(swimlane: string, items: GameDataItem[]): OrganizedSwimLane
  calculateTypeGroupLayout(typeGroups: TypeGroup[], laneHeight: number): TypeGroup[]
  calculateCategoryRowLayout(categories: CategoryGroup[], groupHeight: number): CategoryGroup[]
  
  // Spacing and positioning
  calculateOptimalSpacing(groups: TypeGroup[], availableHeight: number): SpacingPlan
  enforceGroupBoundaries(groups: TypeGroup[], laneBoundary: LaneBoundary): TypeGroup[]
  resolveGroupCollisions(groups: TypeGroup[]): TypeGroup[]
}

interface OrganizedSwimLane {
  swimlane: string
  typeGroups: TypeGroup[]
  totalHeight: number
  spacingPlan: SpacingPlan
  boundaryCompliant: boolean
}

interface SpacingPlan {
  typeGroupSpacing: number // Space between type groups
  categoryRowSpacing: number // Space between category rows
  groupPadding: number // Padding within groups
  compressionRatio: number // How much compression was needed (1.0 = no compression)
}
```

### 3. Enhanced Positioning Engine

```typescript
interface EnhancedPositioningEngine {
  // Group-aware positioning
  calculateGroupAwarePositions(organizedLanes: OrganizedSwimLane[]): PositionedNode[]
  positionNodesWithinCategory(category: CategoryGroup): PositionedNode[]
  maintainPrerequisiteFlow(nodes: PositionedNode[]): PositionedNode[]
  
  // Tier calculation within groups
  calculateCategoryTiers(items: GameDataItem[]): Map<string, number>
  adjustTiersForGrouping(tiers: Map<string, number>, category: CategoryGroup): Map<string, number>
  
  // Boundary and collision handling
  enforceRowConstraints(nodes: PositionedNode[], rowY: number): PositionedNode[]
  resolveHorizontalCollisions(nodes: PositionedNode[]): PositionedNode[]
}

interface PositionedNode {
  item: GameDataItem
  position: { x: number, y: number }
  swimlane: string
  typeGroup: string
  category: string
  tier: number
  rowConstrained: boolean // Whether Y position is fixed by category row
}
```

## Data Models

### Enhanced Node Data Structure

```typescript
interface EnhancedGameDataItem extends GameDataItem {
  // Existing fields: id, name, prerequisite, etc.
  
  // Enhanced grouping data
  type: string // From CSV type column
  categories: string // From CSV categories column
  
  // Calculated grouping information
  typeGroup: string
  categoryGroup: string
  groupTier: number // Tier within the category group
  globalTier: number // Original tier calculation
  
  // Positioning metadata
  rowPosition: number // Y position within category row
  groupPosition: number // Position within type group
  constrainedByRow: boolean // Whether positioning is row-constrained
}
```

### Group Layout Configuration

```typescript
interface GroupLayoutConfig {
  // Spacing constants
  TYPE_GROUP_SPACING: number // Vertical space between type groups
  CATEGORY_ROW_SPACING: number // Vertical space between category rows
  GROUP_PADDING: number // Padding within groups
  MIN_ROW_HEIGHT: number // Minimum height for category rows
  
  // Compression settings
  MAX_COMPRESSION_RATIO: number // Maximum compression before warnings
  MIN_NODE_SPACING: number // Minimum space between nodes in a row
  OVERFLOW_HANDLING: 'compress' | 'wrap' | 'warn' // How to handle overflow
  
  // Fallback behavior
  FALLBACK_TO_TIER_POSITIONING: boolean // Whether to fall back on grouping failure
  PRESERVE_EXISTING_POSITIONS: boolean // Whether to preserve positions when possible
}
```

## Error Handling

### Grouping Error Recovery

```typescript
interface GroupingErrorHandler {
  // Data issues
  handleMissingTypeData(items: GameDataItem[]): GameDataItem[]
  handleInconsistentCategories(items: GameDataItem[]): GameDataItem[]
  handleEmptyGroups(hierarchy: GroupHierarchy): GroupHierarchy
  
  // Layout issues
  handleOvercrowdedGroups(groups: TypeGroup[]): TypeGroup[]
  handleBoundaryViolations(groups: TypeGroup[], boundary: LaneBoundary): TypeGroup[]
  handleCollisionResolution(nodes: PositionedNode[]): PositionedNode[]
  
  // Fallback strategies
  fallbackToTierPositioning(items: GameDataItem[]): PositionedNode[]
  applyEmergencySpacing(nodes: PositionedNode[]): PositionedNode[]
  generateWarningReport(issues: GroupingIssue[]): void
}

interface GroupingIssue {
  type: 'missing_data' | 'overcrowded' | 'boundary_violation' | 'collision'
  severity: 'warning' | 'error' | 'critical'
  affectedItems: GameDataItem[]
  suggestedAction: string
  appliedFix?: string
}
```

### Edge Rendering Enhancement

```typescript
interface EnhancedEdgeRenderer {
  // Improved edge visibility
  calculateOptimalEdgePaths(nodes: PositionedNode[]): EdgePath[]
  avoidGroupBoundaryCollisions(edges: EdgePath[], groups: TypeGroup[]): EdgePath[]
  enhanceEdgeContrast(edges: EdgePath[], backgrounds: SwimLaneBackground[]): EdgePath[]
  
  // Cross-swimlane edge handling
  renderCrossLaneEdges(edges: EdgePath[]): CytoscapeElement[]
  addEdgeLabelsForClarity(edges: EdgePath[]): CytoscapeElement[]
  optimizeEdgeRouting(edges: EdgePath[]): EdgePath[]
}

interface EdgePath {
  source: PositionedNode
  target: PositionedNode
  path: { x: number, y: number }[]
  crossesLanes: boolean
  crossesGroups: boolean
  visibility: 'high' | 'medium' | 'low'
}
```

## Testing Strategy

### Group Organization Validation

```typescript
interface GroupingValidationSuite {
  // Data integrity tests
  testTypeExtractionAccuracy(): TestResult
  testCategoryGroupingLogic(): TestResult
  testHierarchyBuilding(): TestResult
  
  // Layout validation tests
  testGroupBoundaryCompliance(): TestResult
  testCategoryRowAlignment(): TestResult
  testPrerequisiteFlowMaintenance(): TestResult
  
  // Visual organization tests
  testReadabilityFromLeftToRight(): TestResult
  testGroupSpacingConsistency(): TestResult
  testOverallVisualClarity(): TestResult
}
```

### Performance Testing

```typescript
interface GroupingPerformanceTests {
  // Algorithm performance
  testGroupingAlgorithmSpeed(): PerformanceMetric
  testLargeDatasetHandling(): PerformanceMetric
  testMemoryUsageWithGrouping(): PerformanceMetric
  
  // Rendering performance
  testGroupedRenderTime(): PerformanceMetric
  testEdgeRenderingPerformance(): PerformanceMetric
}
```

## Implementation Strategy

### Phase 1: Data Analysis and Group Building
1. Implement type/category extraction from CSV data
2. Build group hierarchy structure for all swimlanes
3. Add validation and error handling for missing/inconsistent data
4. Create debug tools to visualize group structure

### Phase 2: Group Layout Engine
1. Implement vertical layout algorithm for type groups
2. Add category row positioning within type groups
3. Create spacing optimization algorithms
4. Add boundary enforcement and collision detection

### Phase 3: Enhanced Positioning Integration
1. Integrate group-aware positioning with existing tier system
2. Implement row-constrained positioning for category items
3. Maintain prerequisite left-to-right flow within constraints
4. Add fallback mechanisms for edge cases

### Phase 4: Edge Rendering Enhancement
1. Improve edge visibility and contrast
2. Optimize edge routing to avoid group collisions
3. Enhance cross-swimlane edge rendering
4. Add edge path optimization algorithms

### Phase 5: Integration and Polish
1. Integrate all components with existing codebase
2. Add comprehensive error handling and recovery
3. Implement performance optimizations
4. Add validation tools and debug capabilities

## Success Metrics

### Organization Quality Metrics
- **Group Accuracy**: 100% of items correctly grouped by type and category
- **Row Alignment**: All items in same category appear in same horizontal row
- **Prerequisite Flow**: Left-to-right prerequisite relationships maintained within groups
- **Boundary Compliance**: All groups fit within their swimlane boundaries

### Visual Clarity Metrics
- **Readability**: Users can follow upgrade progressions left-to-right naturally
- **Group Distinction**: Clear visual separation between type groups
- **Edge Visibility**: Parent/child relationships clearly visible across swimlanes
- **Professional Appearance**: Clean, organized layout without visual clutter

### Technical Performance Metrics
- **Grouping Speed**: Group analysis and layout < 200ms for full dataset
- **Render Performance**: No degradation in render times with grouping enabled
- **Memory Efficiency**: Minimal memory overhead for grouping data structures
- **Error Recovery**: Graceful handling of all data inconsistencies

## Conclusion

This design creates a sophisticated grouping system that organizes nodes logically within swimlanes while maintaining the existing prerequisite-based flow. By leveraging the type and category data already present in CSV files, the system provides intuitive organization that allows users to read upgrade progressions naturally from left to right, creating a more professional and understandable upgrade tree visualization.