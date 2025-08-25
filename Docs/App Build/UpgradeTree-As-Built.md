# Upgrade Tree As-Built Documentation - TimeHero Sim

## Overview

The Upgrade Tree system provides an interactive visualization of game upgrade dependencies using a grid-based layout with swimlane organization. Built as Phase 3 of the TimeHero Sim project, it displays prerequisite relationships in a left-to-right dependency flow without requiring complex graph libraries. The current implementation (Phase 1 complete) establishes the foundation for a full dependency visualization system.

## Architecture Overview

```
UpgradeTreeView.vue (Main Container)
├── Header Section
│   ├── Title and status display
│   └── Loading/error state controls
├── TreeGrid.vue (Grid Layout Manager) ⭐
│   ├── CSS Grid-based positioning system
│   ├── Swimlane background rendering
│   ├── Fixed swimlane labels (left sidebar)
│   └── Scrollable tree content area
├── TreeNode.vue (Individual Node Display)
│   ├── Icon/title/edit button layout
│   ├── Material cost indicators
│   ├── Highlighting states (normal/highlighted/dimmed)
│   └── Click interaction handling
├── Data Integration
│   ├── upgradeTree store → Layout and interaction state
│   ├── gameData store → Source CSV data
│   └── Node conversion and swimlane mapping
└── Planned Components (Future Phases)
    ├── ConnectionLayer.vue → SVG arrow rendering
    ├── Edit modal integration → Reuse Configuration modals
    └── Highlight mode system → Family tree traversal
```

**File Locations**:
- `src/views/UpgradeTreeView.vue` - Main container
- `src/components/UpgradeTree/TreeGrid.vue` - Grid layout manager
- `src/components/UpgradeTree/TreeNode.vue` - Individual nodes
- `src/stores/upgradeTree.ts` - State management
- `src/types/upgrade-tree.ts` - Type definitions

## Phase Implementation Status

### ✅ Phase 1: Basic Structure (COMPLETED)
- **Component files created** with proper TypeScript interfaces
- **CSS Grid container** with responsive layout system  
- **Scrollable wrapper** with fixed swimlane labels
- **Data loading** from existing gameData store
- **Basic node display** with swimlane organization

### ✅ Phase 2: Layout Algorithm (COMPLETED)
- **Topological sort** for proper dependency-based column assignment
- **Grouping logic** for rows within swimlanes (type → category → column)
- **Swimlane height calculation** with dynamic sizing
- **Circular dependency detection** with console warnings
- **Debug logging** for layout validation

### 🔄 Phase 3: Node Components (PLANNED)  
- Enhanced TreeNode styling with swimlane colors
- SwimLane component optimization
- Complete visual design implementation

### 🔄 Phase 4: Connection Layer (PLANNED)
- SVG overlay for dependency arrows
- Path calculation algorithms
- Arrow markers and routing

### 🔄 Phase 5: Highlight Mode (PLANNED)
- Node click handling for family tree highlighting
- Dependency chain traversal
- Visual feedback and dimming

### 🔄 Phase 6: Edit Integration (PLANNED)
- Configuration screen modal reuse
- Data update flow
- Save/cancel operations

### 🔄 Phase 7: Polish & Test (PLANNED)
- Color scheme refinement
- Performance optimization
- Edge case handling

## Data Model & Type System

### Core Interfaces

```typescript
// Main tree node structure
interface TreeNode {
  id: string
  name: string
  swimlane: string      // Which swimlane it belongs to
  type: string          // e.g., 'weapon', 'tool', 'upgrade' 
  category: string      // e.g., 'bow', 'spear', 'storage'
  prerequisites: string[] // IDs of prerequisite nodes
  cost: {
    gold?: number
    energy?: number
    materials?: Record<string, number>
  }
  effect: string        // Brief description
  icon?: string         // Font Awesome class
  column?: number       // X position (from topological sort)
  row?: number          // Y position within swimlane
}

// Connection between nodes
interface Connection {
  from: string
  to: string
  highlighted?: boolean
}

// Grid layout configuration
interface GridConfig {
  columnWidth: number      // 220px - Width of each column
  rowHeight: number        // 60px - Height of each row
  columnGap: number        // 40px - Horizontal gap for arrows
  rowGap: number          // 20px - Vertical gap between nodes
  swimlanePadding: number  // 16px - Padding inside swimlanes
  labelWidth: number       // 120px - Width for swimlane labels
  nodeWidth: number        // 180px - Individual node width
  nodeHeight: number       // 40px - Individual node height
  arrowPadding: number     // 8px - Space for arrow routing
  cornerRadius: number     // 8px - Radius for 90° corners
}
```

### Swimlane Configuration

**12 Predefined Swimlanes** with color coding:

```typescript
const SWIMLANES: Swimlane[] = [
  { id: 'farm', label: 'Farm', color: '#84cc16' },                    // lime
  { id: 'town-vendors', label: 'Town - Vendors', color: '#8b5cf6' },         // purple  
  { id: 'town-blacksmith', label: 'Town - Blacksmith', color: '#f59e0b' },   // amber
  { id: 'town-agronomist', label: 'Town - Agronomist', color: '#10b981' },   // green
  { id: 'town-carpenter', label: 'Town - Carpenter', color: '#06b6d4' },     // cyan
  { id: 'town-land', label: 'Town - Land Steward', color: '#84cc16' },       // lime
  { id: 'town-trader', label: 'Town - Material Trader', color: '#6366f1' },  // indigo
  { id: 'town-skills', label: 'Town - Skills Trainer', color: '#ec4899' },   // pink
  { id: 'adventure', label: 'Adventure - Routes', color: '#ef4444' },        // red
  { id: 'forge', label: 'Forge', color: '#f97316' },                // orange
  { id: 'mining', label: 'Mining', color: '#78716c' },              // stone
  { id: 'tower', label: 'Tower', color: '#3b82f6' }                 // blue
]
```

## Store Architecture (upgradeTree.ts)

### State Management

```typescript
export const useUpgradeTreeStore = defineStore('upgradeTree', () => {
  // Core data
  const nodes = ref<TreeNode[]>([])
  const connections = ref<Connection[]>([])
  
  // Interaction state
  const highlightMode = ref(false)
  const highlightedNodes = ref<Set<string>>(new Set())
  const selectedNodeId = ref<string | null>(null)
  
  // Loading state
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)
  
  // Configuration
  const gridConfig = ref<GridConfig>({ ...GRID_CONFIG })
  const swimlanes = ref<Swimlane[]>([...SWIMLANES])
})
```

### Data Conversion Pipeline

**GameDataItem → TreeNode Conversion**:

1. **Data Filtering**: Only items with prerequisites OR items that serve as prerequisites
2. **Swimlane Mapping**: Based on `sourceFile` property using `getSwimlaneForNode()`
3. **Icon Assignment**: Font Awesome icons based on type/category via `getIconForNode()`
4. **Cost Processing**: Converts from GameDataItem cost structure to TreeNode format

```typescript
// Example mapping logic
function getSwimlaneForNode(gameItem: GameDataItem): string {
  const sourceFile = gameItem.sourceFile
  
  if (sourceFile === 'farm_actions.csv') return 'farm'
  if (sourceFile === 'forge_actions.csv') return 'forge' 
  if (sourceFile === 'tower_actions.csv') return 'tower'
  if (sourceFile === 'town_blacksmith.csv') return 'town-blacksmith'
  // ... etc for all file mappings
  
  return 'farm' // Default fallback
}
```

### Layout System (Current: Topological Sort + Grouping)

**Phase 2 Implementation** (Current):
- **Topological Sort Algorithm**: Kahn's algorithm for dependency-based column assignment
- **Row Grouping Logic**: Type → Category → Column organization within swimlanes  
- **Circular Dependency Detection**: DFS-based cycle detection with console warnings
- **Dynamic Height Calculation**: Swimlanes adjust to actual content requirements

**Algorithm Details**:
```typescript
// Column assignment using topological sort (Kahn's algorithm)
function assignColumns(treeNodes: TreeNode[]): void {
  // 1. Build dependency graph with in-degrees and adjacency list
  // 2. Find all nodes with no dependencies (in-degree = 0)
  // 3. Process nodes level by level, updating dependent levels
  // 4. Assign computed levels as columns
}

// Row assignment within swimlanes
function assignRows(treeNodes: TreeNode[]): void {
  // 1. Group nodes by swimlane
  // 2. Within each swimlane: group by type, then by category
  // 3. Assign sequential rows to categories
  // 4. Add spacing between type groups
}
```

**Phase 1 Implementation** (Legacy):
- Simple incremental positioning within swimlanes
- 5-column wrapping (column = count % 5)
- Row calculation via Math.floor(count / 5)

## Component Details

### TreeGrid.vue (Grid Layout Manager)

**Responsibilities**:
- CSS Grid container management
- Swimlane background rendering with color gradients
- Fixed left sidebar with swimlane labels
- Scrollable content area coordination
- Node positioning calculations
- Event delegation for clicks

**Key Features**:
```vue
<!-- Grid calculation with dynamic sizing -->
<div class="tree-grid" :style="gridStyle" @click="handleBackgroundClick">
  <!-- Swimlane backgrounds with transparency gradients -->
  <div v-for="swimlane in swimlanes" 
       class="swimlane-background"
       :style="getSwimlaneBackgroundStyle(swimlane)" />
  
  <!-- Positioned tree nodes -->
  <TreeNodeComponent v-for="node in nodes"
                     :style="getNodeStyle(node)" />
</div>
```

**Styling System**:
- **Swimlane backgrounds**: 15% → 5% opacity gradient of swimlane color
- **Fixed labels**: Left sidebar with 120px width reservation
- **Responsive grid**: Auto-calculates total dimensions based on content
- **Dark theme**: Semi-transparent overlays on dark background

### TreeNode.vue (Individual Node Display)

**Layout**: 4-column grid system within 180x40px node
```
┌─────┬──────────────┬─────────┬─────┐
│Icon │    Title     │Materials│Edit │
│24px │    flex      │  auto   │24px │
└─────┴──────────────┴─────────┴─────┘
```

**Visual States**:
- **Normal**: Semi-transparent dark background, swimlane color border
- **Highlighted**: Gold border (#fbbf24) with glow effect
- **Dimmed**: 30% opacity when not part of highlighted family
- **Hover**: 2px upward transform with enhanced shadow

**Material Cost Display**:
- Icons mapped to material types (Wood→tree, Iron→hammer, etc.)
- Compact display with icon + quantity
- Tooltip shows full material name and amount

### UpgradeTreeView.vue (Main Container)

**Layout Structure**:
```vue
<div class="upgrade-tree-container">
  <!-- Fixed header with title and status -->
  <div class="tree-header">
    <h2>Upgrade Dependencies</h2>
    <div class="tree-controls">{{ nodeCount }} nodes loaded</div>
  </div>
  
  <!-- Flex-grow scrollable area -->
  <div class="tree-scroll-area card">
    <TreeGrid v-if="!loading" />
    <LoadingState v-else />
  </div>
</div>
```

**State Handling**:
- **Loading state**: Spinner with "Loading upgrade tree..." message
- **Error state**: Error display with retry button
- **Success state**: TreeGrid component with full functionality
- **Empty state**: Handled gracefully with "No nodes to display"

## Integration Points

### GameData Store Integration

**Data Source**: Leverages existing `gameDataStore.items` array
- **Access Pattern**: `useGameDataStore().items` → conversion to TreeNode[]
- **Filtering Logic**: Only items with dependencies or serving as dependencies
- **Real-time Updates**: Reactive to gameData changes (auto-reload capability)

**Dependency Resolution**:
```typescript
// Connection building from prerequisites
function buildConnections(treeNodes: TreeNode[]): Connection[] {
  const connections: Connection[] = []
  const nodeIds = new Set(treeNodes.map(n => n.id))
  
  treeNodes.forEach(node => {
    node.prerequisites.forEach(prereqId => {
      if (nodeIds.has(prereqId)) {  // Only valid connections
        connections.push({ from: prereqId, to: node.id })
      }
    })
  })
  return connections
}
```

### Future Configuration Integration (Phase 6)

**Planned Modal Reuse**:
- `EditItemModal.vue` from Configuration screen
- Same form validation and material management
- Direct updates to source CSV data through gameData store
- Immediate tree refresh after save operations

## CSS Grid Implementation

### Grid Container Structure

**Two-area layout**:
```css
.tree-grid-container {
  display: flex;
  height: 100%;
}

.swimlane-labels {
  flex-shrink: 0;        /* Fixed 120px width */
  position: relative;
  background: rgba(0, 0, 0, 0.3);
}

.tree-grid-scroll {
  flex: 1;               /* Remaining space */
  overflow: auto;        /* Scrollable content */
}
```

**Dynamic grid sizing**:
```typescript
// Total width calculation
const totalWidth = labelWidth + (maxColumn + 1) * (columnWidth + columnGap)

// Total height calculation  
let totalHeight = 0
swimlanes.forEach(swimlane => {
  const maxRow = Math.max(...swimlaneNodes.map(n => n.row || 0))
  const swimlaneHeight = (maxRow + 1) * (rowHeight + rowGap) + (2 * swimlanePadding)
  totalHeight += swimlaneHeight
})
```

### Positioning Algorithm

**Absolute positioning within grid**:
```typescript
function getNodeStyle(node: TreeNode) {
  const x = labelWidth + (node.column * (columnWidth + columnGap))
  const y = getSwimlaneStartY(node.swimlane) + (node.row * (rowHeight + rowGap))
  
  return {
    position: 'absolute' as const,
    left: `${x}px`,
    top: `${y}px`,
    width: `${nodeWidth}px`, 
    height: `${nodeHeight}px`
  }
}
```

## Event System & Interactions

### Current Event Handling (Phase 1)

**Node Interactions**:
```typescript
// TreeNode events
@node-click="handleNodeClick"    // Future: Enter highlight mode
@edit-click="handleEditClick"    // Future: Open edit modal

// TreeGrid events  
@background-click="handleBackgroundClick"  // Future: Exit highlight mode
```

**Background Click Detection**:
```typescript
function handleBackgroundClick(event: MouseEvent) {
  // Only trigger if clicking actual grid background
  if ((event.target as HTMLElement).classList.contains('tree-grid')) {
    emit('background-click')
  }
}
```

### Planned Event System (Future Phases)

**Highlight Mode (Phase 5)**:
- Node click → Enter highlight mode → Family tree traversal
- Background click → Exit highlight mode
- Same node re-click → Toggle highlight off

**Edit Mode (Phase 6)**:
- Edit button click → Open Configuration modal
- Modal save → Update gameData → Refresh tree
- Modal cancel → No changes

## Performance Considerations

### Rendering Optimization

**Efficient Node Rendering**:
- **Absolute positioning**: Avoids layout recalculation
- **CSS transforms**: Hardware-accelerated hover effects
- **Computed properties**: Cached position calculations
- **Minimal re-renders**: Reactive dependencies carefully managed

**Scroll Performance**:
- **Fixed labels**: Prevent scroll-sync calculations
- **CSS Grid**: Browser-optimized layout engine
- **Event delegation**: Single click handler per grid

### Memory Management

**Data Efficiency**:
- **Filtered datasets**: Only nodes with dependencies loaded
- **Reactive cleanup**: Automatic garbage collection via Vue 3
- **Lazy loading ready**: Architecture supports future virtualization

## Development Tools & Debugging

### Grid Visualization (Development Mode)

**Grid lines overlay**:
```css
.show-grid .tree-grid::before {
  background-image: 
    repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, transparent 60px),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, transparent 220px);
}
```

**Debug Information**:
- Node count display in header
- Loading state feedback
- Error boundary with retry capability
- Console logging for data loading pipeline

### Testing Access Points

**Store Access**:
```javascript
// Vue DevTools access
const store = useUpgradeTreeStore()
console.log('Nodes:', store.nodes.length)
console.log('Connections:', store.connections.length)
console.log('Grid config:', store.gridConfig)
```

**Component Props Inspection**:
- TreeGrid receives all necessary data as props
- TreeNode displays all cost/material information
- Clear data flow from store → view → components

## Known Issues & Limitations

### Current Limitations (Phase 1)

1. **Basic Layout**: Simple grid without topological ordering
2. **No Connections**: Dependency arrows not yet implemented
3. **No Highlight Mode**: Click interactions stubbed out
4. **No Edit Integration**: Edit button only logs to console

### TypeScript Issues (Non-blocking)

- Some existing Configuration components have type issues
- TreeGrid component fully typed and error-free
- New upgrade tree code follows strict TypeScript patterns

### Future Optimization Needs

1. **Large Dataset Performance**: Virtual scrolling for 100+ nodes
2. **Connection Routing**: Smart arrow paths avoiding node overlaps
3. **Responsive Design**: Mobile/tablet layout considerations
4. **Accessibility**: Keyboard navigation and screen reader support

## File Structure Summary

```
src/
├── views/
│   └── UpgradeTreeView.vue          # Main container (85 lines)
├── components/UpgradeTree/
│   ├── TreeGrid.vue                 # Grid manager (240 lines)
│   └── TreeNode.vue                 # Individual nodes (150 lines)
├── stores/
│   └── upgradeTree.ts               # State management (350 lines)
└── types/
    └── upgrade-tree.ts              # Type definitions (80 lines)
```

**Total Implementation**: ~905 lines of well-structured, documented code

## Next Steps (Phase 3)

### Immediate Tasks

1. **Enhanced Node Components**: 
   - Improve TreeNode visual styling with better swimlane color integration
   - Add hover effects and visual feedback improvements
   - Optimize node layout for better information density

2. **SwimLane Component Optimization**:
   - Create dedicated SwimLane component for better encapsulation
   - Improve swimlane header styling and information display
   - Add swimlane-level interaction capabilities

3. **Visual Design Implementation**:
   - Implement complete color scheme per design document
   - Add smooth transitions and animations
   - Improve overall visual hierarchy and readability

### Success Criteria for Phase 3

- ✅ Enhanced visual design with proper color scheme
- ✅ Improved node styling and readability
- ✅ Better component organization and maintainability
- ✅ Smooth animations and visual feedback
- ✅ Consistent styling with rest of application

### Previous Success Criteria (Phase 2) - ✅ COMPLETED

- ✅ All prerequisites appear left of their dependents
- ✅ No node overlap or collision
- ✅ Consistent spacing and alignment
- ✅ Proper swimlane height calculation
- ✅ Maintainable and debuggable algorithm

---

*Document updated: {{ new Date().toISOString() }}*  
*Phase 1 Status: ✅ COMPLETE*  
*Phase 2 Status: ✅ COMPLETE*  
*Current Phase: Ready for Phase 3 Implementation*
