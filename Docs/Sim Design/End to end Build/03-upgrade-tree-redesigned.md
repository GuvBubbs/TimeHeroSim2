# Phase 3: Upgrade Tree Visualization (Redesigned)
**Goal**: Simple grid-based dependency visualization with swimlanes

## Core Design Principles
- **Grid-based layout** using CSS Grid (no complex graph libraries)
- **Swimlane organization** with automatic height adjustment
- **Left-to-right dependency flow** via topological sorting
- **Simple scrolling** (no pan/zoom complexity)
- **Maintainable code** over feature richness

## Deliverables
- Grid-based visualization of all upgrades and dependencies
- Swimlane organization with smart grouping
- Simple connection lines between nodes
- Node detail modals (click to view)
- Dependency highlighting on hover
- Clean, color-coded visual design

## Technical Architecture

### Layout System
```
┌─────────────────────────────────────────────────────────────────┐
│                     Upgrade Tree (Scrollable)                   │
├─────────────────────────────────────────────────────────────────┤
│ Column →    1        2        3        4        5        6      │
├─────────────────────────────────────────────────────────────────┤
│ FARM       [Node]   [Node]            [Node]                    │
│            [Node]            [Node]   [Node]   [Node]           │
├─────────────────────────────────────────────────────────────────┤
│ TOWN -     [Node]   [Node]   [Node]                             │
│ Vendors                                                         │
├─────────────────────────────────────────────────────────────────┤
│ TOWN -              [Node]   [Node]   [Node]   [Node]           │
│ Blacksmith          [Node]   [Node]            [Node]           │
│                     [Node]                                      │
├─────────────────────────────────────────────────────────────────┤
│ FORGE               [Node]            [Node]   [Node]           │
│                                       [Node]   [Node]           │
└─────────────────────────────────────────────────────────────────┘
```

### Swimlanes Configuration
```typescript
const SWIMLANES = [
  { id: 'farm', label: 'Farm', color: '#84cc16' },           // lime
  { id: 'town-vendors', label: 'Town - Vendors', color: '#8b5cf6' },    // purple
  { id: 'town-blacksmith', label: 'Town - Blacksmith', color: '#f59e0b' }, // amber
  { id: 'town-agronomist', label: 'Town - Agronomist', color: '#10b981' }, // green
  { id: 'town-carpenter', label: 'Town - Carpenter', color: '#06b6d4' },  // cyan
  { id: 'town-land', label: 'Town - Land Steward', color: '#84cc16' },   // lime
  { id: 'town-trader', label: 'Town - Material Trader', color: '#6366f1' }, // indigo
  { id: 'town-skills', label: 'Town - Skills Trainer', color: '#ec4899' }, // pink
  { id: 'adventure', label: 'Adventure - Routes', color: '#ef4444' },     // red
  { id: 'forge', label: 'Forge', color: '#f97316' },         // orange
  { id: 'mining', label: 'Mining', color: '#78716c' },       // stone
  { id: 'tower', label: 'Tower', color: '#3b82f6' }          // blue
];

// Color application:
// - Nodes: Bright version of color for borders and icons
// - Swimlane backgrounds: 10-20% opacity of color
// - This allows dark theme background to show through
```

### Grid Configuration
```typescript
const GRID_CONFIG = {
  columnWidth: 220,      // Width of each column
  rowHeight: 60,         // Height of each row
  columnGap: 40,         // Horizontal gap between nodes (for arrows)
  rowGap: 20,            // Vertical gap between nodes
  swimlanePadding: 16,   // Padding inside swimlanes
  labelWidth: 120,       // Width reserved for swimlane labels
  
  // Node dimensions
  nodeWidth: 180,
  nodeHeight: 40,
  
  // Arrow routing
  arrowPadding: 8,       // Space between arrow and node edge
  cornerRadius: 8,       // Radius for 90° corners
  
  // Adjustable for arrow routing needs
  setColumnGap(gap: number) {
    this.columnGap = Math.max(30, gap); // Minimum 30px for arrows
  }
};
```

## Data Model (Simplified)

### Node Interface
```typescript
interface TreeNode {
  id: string;
  name: string;
  swimlane: string;      // Which swimlane it belongs to
  type: string;          // e.g., 'weapon', 'tool', 'upgrade'
  category: string;      // e.g., 'bow', 'spear', 'storage'
  
  // Dependencies
  prerequisites: string[]; // IDs of prerequisite nodes
  
  // Display data
  cost: {
    gold?: number;
    energy?: number;
    materials?: Record<string, number>;
  };
  effect: string;        // Brief description
  icon?: string;         // Font Awesome class
  
  // Computed layout position
  column?: number;       // X position (from topological sort)
  row?: number;          // Y position within swimlane
}
```

## Layout Algorithm

### Phase 1: Topological Sort (Column Assignment)
```typescript
function assignColumns(nodes: TreeNode[]): void {
  // Build dependency graph
  const graph = buildDependencyGraph(nodes);
  
  // Topological sort with level assignment
  const levels = topologicalLevels(graph);
  
  // Assign column to each node
  nodes.forEach(node => {
    node.column = levels.get(node.id) || 0;
  });
}
```

### Phase 2: Swimlane Grouping (Row Assignment)
```typescript
function assignRows(nodes: TreeNode[]): void {
  // Group by swimlane
  const swimlaneGroups = groupBy(nodes, 'swimlane');
  
  swimlaneGroups.forEach((swimlaneNodes, swimlane) => {
    // Within swimlane, group by type
    const typeGroups = groupBy(swimlaneNodes, 'type');
    
    let currentRow = 0;
    typeGroups.forEach((typeNodes, type) => {
      // Within type, group by category
      const categoryGroups = groupBy(typeNodes, 'category');
      
      categoryGroups.forEach((categoryNodes, category) => {
        // Sort by column for left-to-right reading
        categoryNodes.sort((a, b) => a.column - b.column);
        
        // All nodes in same category get same row
        categoryNodes.forEach(node => {
          node.row = currentRow;
        });
        currentRow++;
      });
    });
  });
}
```

## Vue Components

### 1. UpgradeTreeView.vue (Main Container)
```vue
<template>
  <div class="upgrade-tree-container">
    <!-- Header with controls -->
    <div class="tree-header">
      <h2>Upgrade Dependencies</h2>
      <div class="tree-controls">
        <button @click="toggleGrid">
          <i class="fa fa-th"></i> Toggle Grid
        </button>
        <button 
          v-if="highlightMode" 
          @click="exitHighlightMode"
          class="exit-highlight-btn"
        >
          <i class="fa fa-times"></i> Exit Highlight Mode
        </button>
        <div v-if="highlightMode" class="highlight-info">
          Showing family tree for: {{ selectedNodeName }}
        </div>
      </div>
    </div>
    
    <!-- Scrollable tree area -->
    <div 
      class="tree-scroll-area"
      @click="handleBackgroundClick"
    >
      <TreeGrid 
        :nodes="processedNodes"
        :connections="connections"
        :swimlanes="swimlanes"
        :highlight-mode="highlightMode"
        :highlighted-nodes="highlightedNodes"
        @node-click="handleNodeClick"
        @edit-click="handleEditClick"
      />
    </div>
    
    <!-- Edit modal (reused from Configuration screen) -->
    <EditItemModal 
      v-if="editingNode"
      :item="editingNode"
      :file-name="getNodeFileName(editingNode)"
      @save="handleSaveNode"
      @close="editingNode = null"
    />
  </div>
</template>

<script setup lang="ts">
import { useTreeStore } from '@/stores/upgradeTree';
import { useGameDataStore } from '@/stores/gameData';
import EditItemModal from '@/components/config/EditItemModal.vue';

const treeStore = useTreeStore();
const gameDataStore = useGameDataStore();

const editingNode = ref<TreeNode | null>(null);

// Handle node body click (enter highlight mode)
function handleNodeClick(node: TreeNode) {
  if (treeStore.highlightMode && treeStore.selectedNodeId === node.id) {
    // Clicking same node exits highlight mode
    treeStore.exitHighlightMode();
  } else {
    // Enter highlight mode for this node
    treeStore.enterHighlightMode(node.id);
  }
}

// Handle edit button click
function handleEditClick(node: TreeNode) {
  editingNode.value = node;
}

// Handle clicking on background (exit highlight mode)
function handleBackgroundClick(event: MouseEvent) {
  // Only if clicking on the background, not on a node
  if ((event.target as HTMLElement).classList.contains('tree-scroll-area')) {
    treeStore.exitHighlightMode();
  }
}

// Save changes from edit modal
async function handleSaveNode(updatedNode: TreeNode) {
  await gameDataStore.updateItem(
    getNodeFileName(updatedNode),
    updatedNode
  );
  editingNode.value = null;
  // Reload tree to reflect changes
  await treeStore.loadTreeData();
}

// Helper to get the CSV file name for a node
function getNodeFileName(node: TreeNode): string {
  // Map swimlane/type to actual CSV file name
  // This would use the same mapping as the Configuration screen
  return gameDataStore.getFileNameForItem(node);
}
</script>
```

### 2. TreeGrid.vue (Grid Layout Manager)
```vue
<template>
  <div class="tree-grid-container">
    <!-- Swimlane labels (fixed position on left) -->
    <div class="swimlane-labels">
      <div 
        v-for="swimlane in swimlanes"
        :key="swimlane.id"
        class="swimlane-label"
        :style="getSwimlaneLabel

### 3. TreeNode.vue (Individual Node)
```vue
<template>
  <div 
    class="tree-node"
    :class="{ 
      highlighted: highlighted,
      dimmed: dimmed 
    }"
    :style="nodeStyle"
    @click="$emit('node-click')"
  >
    <!-- Icon on left -->
    <div class="node-icon">
      <i :class="node.icon || 'fa fa-cube'"></i>
    </div>
    
    <!-- Title in middle -->
    <div class="node-title">
      {{ node.name }}
    </div>
    
    <!-- Material costs (if any) -->
    <div class="node-materials" v-if="hasMaterials">
      <span 
        v-for="(amount, material) in node.cost.materials" 
        :key="material"
        class="material-cost"
        :title="`${material}: ${amount}`"
      >
        <i :class="getMaterialIcon(material)"></i>
        <span class="material-amount">{{ amount }}</span>
      </span>
    </div>
    
    <!-- Edit button on right -->
    <button 
      class="node-edit-btn"
      @click.stop="$emit('edit-click')"
      title="Edit"
    >
      <i class="fa fa-edit"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  node: TreeNode;
  highlighted: boolean;
  dimmed: boolean;
  swimlaneColor: string;
}

const props = defineProps<Props>();

// Compute node border color based on swimlane
const nodeStyle = computed(() => ({
  '--node-color': props.swimlaneColor,
  borderColor: props.highlighted ? '#fbbf24' : props.swimlaneColor
}));

// Check if node has material costs
const hasMaterials = computed(() => {
  return props.node.cost.materials && 
         Object.keys(props.node.cost.materials).length > 0;
});

// Map materials to Font Awesome icons
function getMaterialIcon(material: string): string {
  const iconMap: Record<string, string> = {
    'Wood': 'fa fa-tree',
    'Stone': 'fa fa-cube',
    'Iron': 'fa fa-hammer',
    'Copper': 'fa fa-coins',
    'Silver': 'fa fa-gem',
    'Gold': 'fa fa-coins',
    'Crystal': 'fa fa-diamond',
    'Mythril': 'fa fa-star',
    'Obsidian': 'fa fa-circle'
  };
  return iconMap[material] || 'fa fa-box';
}
</script>

<style>
.tree-node {
  background: rgba(0, 0, 0, 0.6); /* Dark background */
  border: 2px solid var(--node-color);
  border-radius: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: grid;
  grid-template-columns: 24px 1fr auto 24px;
  align-items: center;
  gap: 0.5rem;
  height: 40px;
  width: 180px;
  position: relative;
}

.node-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--node-color);
  font-size: 14px;
}

.node-title {
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: white;
}

.node-materials {
  display: flex;
  gap: 0.25rem;
  font-size: 0.75rem;
}

.material-cost {
  display: flex;
  align-items: center;
  gap: 2px;
  color: rgba(255, 255, 255, 0.7);
}

.material-cost i {
  font-size: 10px;
}

.material-amount {
  font-size: 10px;
}

.node-edit-btn {
  width: 24px;
  height: 24px;
  border-radius: 0.25rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.node-edit-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-color: rgba(255, 255, 255, 0.3);
}

.tree-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border-width: 3px;
}

.tree-node.highlighted {
  border-color: #fbbf24 !important;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.6);
  z-index: 10;
}

.tree-node.dimmed {
  opacity: 0.3;
}
</style>
```

### 4. ConnectionLayer.vue (SVG Connections)
```vue
<template>
  <svg class="connection-layer">
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="10" 
              refX="9" refY="3" orient="auto">
        <polygon points="0 0, 10 3, 0 6" fill="#666" />
      </marker>
      <marker id="arrowhead-highlight" markerWidth="10" markerHeight="10" 
              refX="9" refY="3" orient="auto">
        <polygon points="0 0, 10 3, 0 6" fill="#fbbf24" />
      </marker>
    </defs>
    
    <path
      v-for="connection in visibleConnections"
      :key="`${connection.from}-${connection.to}`"
      :d="getOrthogonalPath(connection)"
      class="connection-line"
      :class="{ highlighted: connection.highlighted }"
      :stroke="connection.highlighted ? '#fbbf24' : '#666'"
      stroke-width="2"
      fill="none"
      :marker-end="connection.highlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'"
    />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  connections: Connection[];
  nodes: Map<string, NodePosition>;
  highlightMode: boolean;
  highlightedNodes: Set<string>;
  gridConfig: GridConfig;
}

const props = defineProps<Props>();

// Filter connections based on display rules
const visibleConnections = computed(() => {
  return props.connections.filter(conn => {
    if (props.highlightMode) {
      // In highlight mode, show connections between highlighted nodes
      return props.highlightedNodes.has(conn.from) && 
             props.highlightedNodes.has(conn.to);
    } else {
      // Default: only show within-swimlane connections
      const fromNode = props.nodes.get(conn.from);
      const toNode = props.nodes.get(conn.to);
      return fromNode?.swimlane === toNode?.swimlane;
    }
  }).map(conn => ({
    ...conn,
    highlighted: props.highlightMode && 
                 props.highlightedNodes.has(conn.from) && 
                 props.highlightedNodes.has(conn.to)
  }));
});

// Create orthogonal path (straight lines with 90° corners)
function getOrthogonalPath(connection: Connection): string {
  const from = props.nodes.get(connection.from);
  const to = props.nodes.get(connection.to);
  
  if (!from || !to) return '';
  
  // Calculate connection points (right-center of from, left-center of to)
  const startX = from.x + props.gridConfig.nodeWidth;
  const startY = from.y + props.gridConfig.nodeHeight / 2;
  const endX = to.x;
  const endY = to.y + props.gridConfig.nodeHeight / 2;
  
  const cornerRadius = props.gridConfig.cornerRadius;
  
  // Same row - straight horizontal line
  if (from.row === to.row && from.swimlane === to.swimlane) {
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }
  
  // Different rows or swimlanes - use orthogonal routing
  const midX = startX + (endX - startX) / 2;
  
  // Build path with rounded corners
  const path = [];
  path.push(`M ${startX} ${startY}`); // Start point
  
  if (startY === endY) {
    // Same Y level - straight line
    path.push(`L ${endX} ${endY}`);
  } else {
    // Need to route around with 90° corners
    const horizontalFirst = Math.abs(endX - startX) > props.gridConfig.columnGap;
    
    if (horizontalFirst) {
      // Go horizontal first, then vertical
      const turnX = midX;
      
      // First segment (horizontal)
      path.push(`L ${turnX - cornerRadius} ${startY}`);
      
      // Rounded corner
      if (endY > startY) {
        path.push(`Q ${turnX} ${startY} ${turnX} ${startY + cornerRadius}`);
      } else {
        path.push(`Q ${turnX} ${startY} ${turnX} ${startY - cornerRadius}`);
      }
      
      // Vertical segment
      path.push(`L ${turnX} ${endY > startY ? endY - cornerRadius : endY + cornerRadius}`);
      
      // Second rounded corner
      if (endY > startY) {
        path.push(`Q ${turnX} ${endY} ${turnX + cornerRadius} ${endY}`);
      } else {
        path.push(`Q ${turnX} ${endY} ${turnX + cornerRadius} ${endY}`);
      }
      
      // Final horizontal segment
      path.push(`L ${endX} ${endY}`);
    } else {
      // Go vertical first, then horizontal (for close nodes)
      const turnY = startY + (endY - startY) / 2;
      
      // First segment (horizontal to clear the node)
      const clearance = props.gridConfig.arrowPadding;
      path.push(`L ${startX + clearance} ${startY}`);
      
      // First corner
      path.push(`Q ${startX + clearance + cornerRadius} ${startY} 
                   ${startX + clearance + cornerRadius} ${startY + (endY > startY ? cornerRadius : -cornerRadius)}`);
      
      // Vertical segment
      path.push(`L ${startX + clearance + cornerRadius} ${turnY}`);
      
      // Middle corners to go around
      path.push(`Q ${startX + clearance + cornerRadius} ${turnY + (endY > startY ? cornerRadius : -cornerRadius)} 
                   ${startX + clearance + 2 * cornerRadius} ${turnY + (endY > startY ? cornerRadius : -cornerRadius)}`);
      
      path.push(`L ${endX - cornerRadius} ${turnY + (endY > startY ? cornerRadius : -cornerRadius)}`);
      
      // Final corner
      path.push(`Q ${endX - cornerRadius} ${endY} ${endX} ${endY}`);
    }
  }
  
  return path.join(' ');
}
</script>

<style>
.connection-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.connection-line {
  transition: all 0.2s;
  opacity: 0.6;
}

.connection-line.highlighted {
  opacity: 1;
  stroke-width: 3;
}
</style>
```

## Interaction Features

### Connection Display Rules
- **Default**: Only show arrows between nodes within the same swimlane
- **Highlight Mode**: Show all connections in the highlighted family tree (including cross-swimlane)
- **Example**: Blacksmith blueprints → Forge actions only visible when highlighting either node

### Node Interactions
- **Edit Button Click**: Opens the same edit modal used in Configuration screen
- **Node Body Click**: Enters highlight mode for that node's family tree
- **Hover**: Shows tooltip with basic info

### Highlight Mode
When a node is clicked (not the edit button):
- Highlight the clicked node
- Highlight all prerequisites (recursive, across swimlanes)
- Highlight all dependents (recursive, across swimlanes)
- Show ALL connection arrows between highlighted nodes
- Dim non-highlighted nodes for contrast
- Click anywhere outside nodes to exit highlight mode

### Visual Feedback
```css
/* Swimlane backgrounds - muted with transparency */
.swimlane {
  /* Use 10-20% opacity of swimlane color */
  background: linear-gradient(
    to right,
    rgba(var(--swimlane-color-rgb), 0.15),
    rgba(var(--swimlane-color-rgb), 0.05)
  );
  border-left: 4px solid rgb(var(--swimlane-color-rgb));
}

/* Node colors - bright and clear */
.tree-node {
  /* Dark semi-transparent background for contrast */
  background: rgba(0, 0, 0, 0.6);
  /* Bright swimlane color for border */
  border: 2px solid var(--swimlane-color);
}

.tree-node .node-icon {
  /* Icon uses bright swimlane color */
  color: var(--swimlane-color);
}

/* Grid lines (development mode) */
.show-grid .tree-grid::before {
  content: '';
  position: absolute;
  background-image: 
    repeating-linear-gradient(0deg, 
      rgba(255,255,255,0.05) 0px, 
      rgba(255,255,255,0.05) 1px, 
      transparent 1px, 
      transparent 60px),
    repeating-linear-gradient(90deg, 
      rgba(255,255,255,0.05) 0px, 
      rgba(255,255,255,0.05) 1px, 
      transparent 1px, 
      transparent 220px);
}

/* Material icons styling */
.material-cost {
  color: rgba(255, 255, 255, 0.7);
  font-size: 10px;
}

/* Arrow colors */
.connection-line {
  stroke: #666; /* Neutral gray for default */
}

.connection-line.highlighted {
  stroke: #fbbf24; /* Gold for highlighted connections */
}
```

## State Management

### Tree Store (Simplified)
```typescript
export const useTreeStore = defineStore('upgradeTree', () => {
  const nodes = ref<TreeNode[]>([]);
  const connections = ref<Connection[]>([]);
  const highlightMode = ref(false);
  const highlightedNodes = ref<Set<string>>(new Set());
  const selectedNodeId = ref<string | null>(null);
  
  // Load and process data
  async function loadTreeData() {
    const rawData = await loadFromCSV();
    nodes.value = processNodes(rawData);
    connections.value = buildConnections(nodes.value);
    
    // Calculate layout
    assignColumns(nodes.value);
    assignRows(nodes.value);
  }
  
  // Enter highlight mode for a node
  function enterHighlightMode(nodeId: string) {
    highlightMode.value = true;
    selectedNodeId.value = nodeId;
    highlightedNodes.value.clear();
    
    // Build family tree (all connected nodes)
    const visited = new Set<string>();
    
    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      highlightedNodes.value.add(id);
      
      const node = nodes.value.find(n => n.id === id);
      if (node) {
        // Add prerequisites
        node.prerequisites.forEach(traverse);
        
        // Add dependents
        nodes.value
          .filter(n => n.prerequisites.includes(id))
          .forEach(n => traverse(n.id));
      }
    };
    
    traverse(nodeId);
  }
  
  // Exit highlight mode
  function exitHighlightMode() {
    highlightMode.value = false;
    selectedNodeId.value = null;
    highlightedNodes.value.clear();
  }
  
  // Check if a node should be dimmed
  function isNodeDimmed(nodeId: string): boolean {
    return highlightMode.value && !highlightedNodes.value.has(nodeId);
  }
  
  return {
    nodes,
    connections,
    highlightMode,
    highlightedNodes,
    selectedNodeId,
    loadTreeData,
    enterHighlightMode,
    exitHighlightMode,
    isNodeDimmed
  };
});
```

## Layout Rules & Constraints

### Column Alignment
- **Maintain gaps**: If topological sort creates gaps (empty columns), preserve them for alignment
- **Prerequisites left rule**: All prerequisites must appear in columns to the left of their dependents
- **No column compression**: Empty columns remain empty to maintain visual consistency

### Row Organization
- **Strict category rows**: Items of the same category within a swimlane share the same row
- **No floating**: Categories never "float up" to fill gaps - this preserves left-to-right reading
- **Arrow crossing**: Arrows can cross over row gaps when connecting nodes

### Future Enhancements (Post-Phase 3)
```
┌─────────────────────────────────────────────────────────────────────┐
│ PHASES  │Tutorial│ Early │  Mid  │  Late │Endgame│ Post  │         │
│         │        │ Game  │ Game  │ Game  │       │ Game  │         │
├─────────────────────────────────────────────────────────────────────┤
│ FARM    │ [Node]───[Node]         [Node]                           │
│         │        ↑                                                 │
│         │   Phase boundary                                         │
└─────────────────────────────────────────────────────────────────────┘

Phase guidelines will be vertical lines showing game progression stages
Based on farm expansion milestones (Small Hold, Homestead, Manor, etc.)
```

### Layout Tests
- ✅ All nodes appear in correct swimlanes
- ✅ Prerequisites always appear left of dependents
- ✅ Same category items share rows
- ✅ Swimlanes expand to fit content
- ✅ Grid aligns properly

### Interaction Tests
- ✅ Hovering highlights dependency chains
- ✅ Clicking opens detail modal
- ✅ Connections draw correctly
- ✅ Scrolling works smoothly
- ✅ Tooltips show on hover

### Data Tests
- ✅ All CSV data loads into nodes
- ✅ Prerequisites resolve correctly
- ✅ No circular dependencies
- ✅ Orphan nodes are flagged
- ✅ Categories group correctly

## Modal Integration

### Edit Modal
The edit button on each node opens the **same EditItemModal component** used in the Configuration screen:
- Provides full CRUD operations for the node
- Handles material management with the same UI
- Validates prerequisites and circular dependencies
- Updates are immediately reflected in the tree after saving

### Interaction Behavior

#### Scroll Behavior
- **No auto-scroll**: Clicking nodes maintains current scroll position
- **Manual scrolling**: Users control their view with standard scrollbars
- **Scroll persistence**: Position is maintained when entering/exiting highlight mode

#### Click Behavior
- **Node body click**: Enters highlight mode for that node's family
- **Edit button click**: Opens Configuration screen's edit modal
- **Background click**: Exits highlight mode
- **Same node re-click**: Toggles highlight mode off

#### Default View (No Highlight)
```
TOWN - Blacksmith:  [Hammer Blueprint] ──→ [Hammer+ Blueprint]
                    (shows arrow within swimlane)

FORGE:              [Craft Hammer]     [Craft Hammer+]
                    (no arrows shown between these and blueprints above)
```

#### Highlight Mode (Hammer Blueprint selected)
```
TOWN - Blacksmith:  [HAMMER BLUEPRINT] ══→ [Hammer+ Blueprint]
                           ║                      ║
                           ╚═══════╗   ╔══════════╝
                                   ↓   ↓
FORGE:              [Craft Hammer] [Craft Hammer+]
                    (all family connections now visible)
```

### Visual States
- **Normal Node**: Standard swimlane color border
- **Highlighted Node**: Golden border with glow effect
- **Family Member**: Also highlighted when a related node is selected
- **Dimmed Node**: 30% opacity when not part of highlighted family
- **Edit Button**: Subtle until hovered, then becomes prominent

### Simplicity
- No external graph library dependencies
- Standard CSS Grid for layout
- Simple SVG for connections
- Vue's reactive system handles updates

### Maintainability
- Clear separation of concerns
- Easy to debug with browser DevTools
- Predictable layout algorithm
- Simple to add new nodes

### Performance
- Browser-optimized CSS Grid
- No complex force calculations
- Minimal re-renders
- Virtual scrolling not needed (simple scroll)

### Flexibility
- Easy to adjust swimlane colors
- Simple to modify grouping rules
- Straightforward to add new swimlanes
- Layout algorithm is transparent

## Implementation Order

1. **Set up basic structure**
   - Create component files
   - Set up CSS Grid container
   - Add scrollable wrapper

2. **Implement layout algorithm**
   - Topological sort for columns
   - Grouping logic for rows
   - Swimlane height calculation

3. **Create node components**
   - TreeNode component with icon/title/edit layout
   - SwimLane component
   - Basic styling with swimlane colors

4. **Add connection layer**
   - SVG overlay
   - Path calculation for within-swimlane
   - Different curves for cross-swimlane (highlight mode only)
   - Arrow markers

5. **Implement highlight mode**
   - Node click handling
   - Family tree traversal
   - Connection visibility rules
   - Dimming non-highlighted nodes

6. **Integrate edit modal**
   - Reuse Configuration screen's edit modal
   - Wire up edit button click events
   - Ensure data updates flow back to tree

7. **Polish and test**
   - Color scheme per swimlane
   - Smooth transitions
   - Edge cases and circular dependencies
   - Performance with large datasets

## Notes

This redesigned approach prioritizes:
- **Clarity** over complexity
- **Maintainability** over features
- **Standard web tech** over specialized libraries
- **Grid-based layout** over force-directed graphs
- **Swimlane organization** as the primary visual hierarchy

The result will be a clean, understandable dependency visualization that clearly shows the progression path through Time Hero's upgrade system.