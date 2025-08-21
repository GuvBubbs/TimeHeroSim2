# Time Hero Simulator - Upgrade Tree
## Document 3: Dependency Graph & Visual Analysis

### Purpose & Goals
The Upgrade Tree provides a **visual dependency map** of all game progressions, displaying the interconnected web of prerequisites and unlocks as an interactive node graph. This tool enables designers to understand flow dependencies, identify bottlenecks, and ensure logical progression paths through the game's 35-day journey.

### Integration with Simulator Goals
- **Dependency Analysis**: Visualize prerequisite chains and unlock patterns
- **Bottleneck Detection**: Identify choke points in progression flow
- **Path Validation**: Ensure multiple viable routes to endgame
- **Balance Verification**: Spot over-centralized or orphaned upgrades
- **Phase Alignment**: Verify upgrades appear at appropriate game stages

### Graph Architecture

#### Node System
```typescript
interface UpgradeNode {
  id: string;
  name: string;
  category: NodeCategory;
  source: 'Farm' | 'Tower' | 'Town' | 'Adventure' | 'Forge' | 'Mine';
  tier: 1 | 2 | 3 | 4 | 5; // Game phase alignment
  position: { x: number; y: number; };
  
  // Data properties
  cost: {
    gold?: number;
    energy?: number;
    materials?: Record<string, number>;
    time?: number; // minutes
  };
  
  effects: {
    description: string;
    modifiers?: Record<string, number>;
  };
  
  // Graph properties
  prerequisites: string[]; // Node IDs required
  unlocks: string[]; // Node IDs this enables
  
  // Visual properties
  status: 'locked' | 'available' | 'owned' | 'highlighted';
  icon: string; // Font Awesome class
  color: string; // Category color
  size: 'small' | 'medium' | 'large'; // Based on importance
}

type NodeCategory = 
  | 'storage'      // Energy, water, seed capacity
  | 'production'   // Pumps, auto-catchers, efficiency
  | 'tools'        // Hoes, axes, pickaxes
  | 'combat'       // Weapons, armor
  | 'helpers'      // Gnome housing, training
  | 'land'         // Deeds, expansions
  | 'automation'   // Auto-systems
  | 'progression'; // Key unlocks, phase transitions
```

#### Edge System
```typescript
interface GraphEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  type: 'prerequisite' | 'soft-requirement' | 'synergy';
  strength: 'required' | 'recommended' | 'optional';
  
  // Visual properties
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
  width: number;
  animated: boolean;
  
  // Routing
  controlPoints?: { x: number; y: number; }[];
  routing: 'straight' | 'orthogonal' | 'curved';
}
```

### Layout System

#### Swim Lane Organization
```
┌─────────────────────────────────────────────────────────────┐
│                     Upgrade Tree Visualization              │
├─────────────────────────────────────────────────────────────┤
│ Tutorial    Early Game    Mid Game    Late Game    Endgame │
├─────────────────────────────────────────────────────────────┤
│ FARM    ●───────●───────●───────●───────●───────●          │
│         Plots   Shed I   Shed II  Barn I  Barn II  Silo    │
│                                                             │
│ TOWER   ●───────●───────●───────●───────●                  │
│         Reach 2 Reach 3  Net I    Net II   Auto-C          │
│                                                             │
│ TOWN    ●───────●───────●───────●───────●───────●          │
│         Skills  Tools    Deeds   Vendors  Master           │
│                                                             │
│ COMBAT  ●───────●───────●───────●───────●                  │
│         Spear I Sword I  Spear II Armor   Spear III        │
│                                                             │
│ FORGE           ●───────●───────●───────●                  │
│                 Bellows  Furnace  Anvil   Crystal          │
│                                                             │
│ MINE            ●───────●───────●───────●                  │
│                 Pick I   Pick II  Pick III Crystal         │
└─────────────────────────────────────────────────────────────┘
```

#### Grid Snap System
```typescript
interface GridSystem {
  cellSize: 50; // pixels
  snapToGrid: boolean;
  showGrid: boolean;
  
  swimLanes: {
    height: 100; // pixels per lane
    padding: 20;
    labelWidth: 80;
  };
  
  tiers: {
    width: 280; // pixels per phase
    boundaries: [0, 280, 560, 840, 1120, 1400];
  };
}

function snapToGrid(x: number, y: number): Point {
  const gridSize = 50;
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize
  };
}
```

### Visualization Components

#### 1. Node Renderer
```typescript
interface NodeRenderer {
  render(node: UpgradeNode): VNode {
    return (
      <g class={`node ${node.status}`} transform={`translate(${node.position.x}, ${node.position.y})`}>
        {/* Background shape */}
        <rect 
          width={nodeWidth(node)} 
          height={40}
          rx={5}
          fill={node.color}
          stroke={getBorderColor(node.status)}
          stroke-width={node.status === 'highlighted' ? 3 : 1}
        />
        
        {/* Icon */}
        <text 
          x={10} 
          y={25} 
          class={`fa ${node.icon}`}
          fill="white"
          font-size="16"
        />
        
        {/* Name */}
        <text 
          x={35} 
          y={25} 
          fill="white"
          font-size="12"
          font-weight={node.size === 'large' ? 'bold' : 'normal'}
        >
          {node.name}
        </text>
        
        {/* Cost indicator */}
        {node.cost.gold && (
          <text x={nodeWidth(node) - 10} y={25} text-anchor="end" fill="#fbbf24" font-size="10">
            {formatNumber(node.cost.gold)}
          </text>
        )}
        
        {/* Edit button (hidden until hover) */}
        <g class="edit-button" opacity="0">
          <circle cx={nodeWidth(node) - 15} cy={5} r={8} fill="#4f46e5"/>
          <text x={nodeWidth(node) - 15} y={8} text-anchor="middle" fill="white" font-size="10">✎</text>
        </g>
        
        {/* Connection button (hidden until hover) */}
        <g class="connection-button" opacity="0">
          <circle cx={nodeWidth(node) - 35} cy={5} r={8} fill="#10b981"/>
          <text x={nodeWidth(node) - 35} y={8} text-anchor="middle" fill="white" font-size="10">◈</text>
        </g>
      </g>
    );
  }
}
```

#### 2. Edge Renderer
```typescript
interface EdgeRenderer {
  render(edge: GraphEdge, nodes: Map<string, UpgradeNode>): VNode {
    const source = nodes.get(edge.source);
    const target = nodes.get(edge.target);
    
    const path = calculatePath(source, target, edge.routing);
    
    return (
      <g class={`edge ${edge.type}`}>
        {/* Shadow for better visibility */}
        <path
          d={path}
          stroke="black"
          stroke-width={edge.width + 2}
          fill="none"
          opacity="0.3"
        />
        
        {/* Main edge line */}
        <path
          d={path}
          stroke={edge.color}
          stroke-width={edge.width}
          fill="none"
          stroke-dasharray={edge.style === 'dashed' ? '5,5' : undefined}
          class={edge.animated ? 'animated-dash' : ''}
        />
        
        {/* Arrowhead */}
        <polygon
          points="0,-5 10,0 0,5"
          fill={edge.color}
          transform={`translate(${target.position.x}, ${target.position.y}) rotate(${getAngle(source, target)})`}
        />
      </g>
    );
  }
}

function calculatePath(source: Node, target: Node, routing: string): string {
  switch (routing) {
    case 'straight':
      return `M ${source.position.x} ${source.position.y} L ${target.position.x} ${target.position.y}`;
    
    case 'orthogonal':
      const midX = (source.position.x + target.position.x) / 2;
      return `M ${source.position.x} ${source.position.y} 
              H ${midX} 
              V ${target.position.y} 
              H ${target.position.x}`;
    
    case 'curved':
      const cp1 = { x: source.position.x + 100, y: source.position.y };
      const cp2 = { x: target.position.x - 100, y: target.position.y };
      return `M ${source.position.x} ${source.position.y} 
              C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, 
              ${target.position.x} ${target.position.y}`;
  }
}
```

### Interaction System

#### 1. Node Selection & Details
```typescript
interface NodeInteraction {
  selectedNode: UpgradeNode | null;
  hoveredNode: UpgradeNode | null;
  focusedChain: Set<string>; // Highlighted prerequisite chain
  familyTreeMode: boolean; // Whether showing only connected nodes
  familyTreeRoot: string | null; // Root node ID for family tree view
  
  onNodeClick(node: UpgradeNode) {
    if (this.selectedNode === node) {
      this.showNodeDetails(node);
    } else {
      this.selectedNode = node;
      this.highlightDependencyChain(node);
    }
  }
  
  onEditButtonClick(node: UpgradeNode, event: MouseEvent) {
    event.stopPropagation();
    this.showEditModal(node);
  }
  
  onConnectionButtonClick(node: UpgradeNode, event: MouseEvent) {
    event.stopPropagation();
    this.toggleFamilyTreeView(node);
  }
  
  onNodeHover(node: UpgradeNode) {
    this.hoveredNode = node;
    this.showTooltip(node);
  }
  
  highlightDependencyChain(node: UpgradeNode) {
    this.focusedChain.clear();
    
    // Add all prerequisites recursively
    const addPrereqs = (id: string) => {
      this.focusedChain.add(id);
      const n = this.nodes.get(id);
      n?.prerequisites.forEach(prereq => addPrereqs(prereq));
    };
    
    // Add all unlocks recursively
    const addUnlocks = (id: string) => {
      this.focusedChain.add(id);
      const n = this.nodes.get(id);
      n?.unlocks.forEach(unlock => addUnlocks(unlock));
    };
    
    addPrereqs(node.id);
    addUnlocks(node.id);
  }
  
  toggleFamilyTreeView(node: UpgradeNode) {
    if (this.familyTreeMode && this.familyTreeRoot === node.id) {
      // Toggle off - show all nodes again
      this.familyTreeMode = false;
      this.familyTreeRoot = null;
      this.focusedChain.clear();
    } else {
      // Toggle on - show only connected nodes
      this.familyTreeMode = true;
      this.familyTreeRoot = node.id;
      this.buildFamilyTree(node);
    }
  }
  
  buildFamilyTree(node: UpgradeNode) {
    this.focusedChain.clear();
    
    // Get all connected nodes (prerequisites and unlocks, recursively)
    const visited = new Set<string>();
    
    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      this.focusedChain.add(id);
      
      const n = this.nodes.get(id);
      if (n) {
        n.prerequisites.forEach(prereq => traverse(prereq));
        n.unlocks.forEach(unlock => traverse(unlock));
      }
    };
    
    traverse(node.id);
  }
}
```

#### 2. Node Details Modal

When clicking the **Edit button** on a node, a comprehensive details modal opens showing all available data about the upgrade.

```typescript
interface NodeDetailsModal {
  node: UpgradeNode;
  mode: 'view' | 'edit';
  
  // Displayed data
  displayData: {
    // Basic Information
    id: string;
    name: string;
    category: NodeCategory;
    source: string;
    tier: number;
    
    // Full Cost Breakdown
    costs: {
      gold?: number;
      energy?: number;
      materials?: Record<string, number>;
      time?: number;
    };
    
    // Effects & Bonuses
    effects: {
      description: string;
      modifiers?: Record<string, number>;
      unlocks?: string[];
    };
    
    // Prerequisites
    prerequisites: {
      required: string[];
      met: string[];
      unmet: string[];
    };
    
    // Progression Analysis
    analysis: {
      timeToAfford: number; // minutes at current rate
      bottlenecks: string[];
      alternativePaths: string[];
      importance: 'critical' | 'important' | 'optional';
    };
    
    // Metadata
    metadata: {
      addedInVersion?: string;
      lastModified?: Date;
      notes?: string;
      tags?: string[];
    };
  };
  
  // Edit capabilities (when in edit mode)
  editableFields?: {
    name: string;
    goldCost: number;
    energyCost: number;
    materials: { type: string; amount: number; }[];
    prerequisites: string[];
    effects: string;
    tier: number;
  };
}
```

**Modal Layout**:
```
┌─────────────────────────────────────────────────┐
│  [View/Edit Toggle]    Storage Shed II     [X]  │
├─────────────────────────────────────────────────┤
│ ┌─────────────┬─────────────────────────────┐   │
│ │ BASIC INFO  │ COSTS                       │   │
│ ├─────────────┼─────────────────────────────┤   │
│ │ ID:         │ Gold:    100                │   │
│ │ shed_2      │ Energy:  50                 │   │
│ │             │ Materials:                  │   │
│ │ Category:   │   Stone x5                  │   │
│ │ Storage     │   Wood x10                 │   │
│ │             │                             │   │
│ │ Source:     │ Time to Afford: 5.2 min    │   │
│ │ Agronomist  │ (at current rates)          │   │
│ │             │                             │   │
│ │ Tier:       ├─────────────────────────────┤   │
│ │ Early Game  │ EFFECTS & BONUSES           │   │
│ │             ├─────────────────────────────┤   │
│ ├─────────────┤ • Energy cap 150→500        │   │
│ │PREREQUISITES│ • Unlocks: shed_3           │   │
│ ├─────────────┤ • Enables: Early automation │   │
│ │ ✓ shed_1    │                             │   │
│ │ ✓ farm_2    ├─────────────────────────────┤   │
│ │             │ ANALYSIS                    │   │
│ ├─────────────┼─────────────────────────────┤   │
│ │ METADATA    │ Importance: Critical        │   │
│ ├─────────────┤ Bottlenecks: None           │   │
│ │ Added: v1.0 │ Alt Paths: None             │   │
│ │ Modified:   │                             │   │
│ │ 2024-01-15  │ Part of main progression    │   │
│ └─────────────┴─────────────────────────────┘   │
│                                                  │
│ [Copy ID] [Export JSON] [Cancel] [Save Changes] │
└─────────────────────────────────────────────────┘
```

#### 3. Node Edit Modal
```typescript
interface NodeEditModal {
  node: UpgradeNode;
  originalData: UpgradeNode;
  changes: Partial<UpgradeNode>;
  
  fields: {
    name: string;
    goldCost: number;
    energyCost: number;
    materials: { type: string; amount: number; }[];
    prerequisites: string[];
    effects: string;
    tier: number;
  };
  
  validation: {
    isValid: boolean;
    errors: string[];
  };
}
```

**Modal Layout**:
```
┌─────────────────────────────────────────┐
│     Edit: Storage Shed II               │
├─────────────────────────────────────────┤
│ Basic Info                              │
│ Name: [Storage Shed II            ]     │
│ Category: [Storage              ▼]      │
│ Tier: [2 - Early Game           ▼]      │
│                                          │
│ Costs                                   │
│ Gold: [100                    ]         │
│ Energy: [50                   ]         │
│ Materials:                              │
│   [Stone    ▼] [5           ]  [X]     │
│   [+ Add Material]                      │
│                                          │
│ Prerequisites                           │
│ [x] storage_shed_1                     │
│ [ ] farm_stage_2                       │
│ [+ Add Prerequisite]                   │
│                                          │
│ Effects                                 │
│ [Energy capacity 150→500        ]       │
│                                          │
│ Position (Advanced)                     │
│ X: [280    ] Y: [100    ] Auto □       │
├─────────────────────────────────────────┤
│     [Cancel]    [Reset]    [Save]       │
└─────────────────────────────────────────┘
```

#### 4. Connection Filter View

When clicking the **Connection button** on a node, the graph filters to show only nodes in the selected node's family tree.

```typescript
interface ConnectionFilterView {
  active: boolean;
  rootNode: string;
  connectedNodes: Set<string>;
  
  // Visual indicators
  showBreadcrumb: boolean; // "Showing connections for: [Node Name]"
  exitButton: boolean; // "Show All Nodes" button
  
  // Animation
  transitionDuration: 300; // ms
  fadeOutHidden: boolean; // Fade non-connected nodes before hiding
  
  methods: {
    enterConnectionView(node: UpgradeNode) {
      // Hide all nodes except connected family
      this.active = true;
      this.rootNode = node.id;
      this.connectedNodes = this.getConnectedNodes(node);
      
      // Animate transition
      this.fadeOutUnconnected();
      setTimeout(() => {
        this.hideUnconnected();
        this.recenterGraph();
      }, this.transitionDuration);
    }
    
    exitConnectionView() {
      // Show all nodes again
      this.active = false;
      this.showAllNodes();
      this.rootNode = null;
      this.connectedNodes.clear();
    }
    
    getConnectedNodes(node: UpgradeNode): Set<string> {
      const connected = new Set<string>();
      const visited = new Set<string>();
      
      // Traverse all connections bidirectionally
      const traverse = (id: string) => {
        if (visited.has(id)) return;
        visited.add(id);
        connected.add(id);
        
        const n = this.nodes.get(id);
        if (n) {
          // Add prerequisites
          n.prerequisites.forEach(prereq => traverse(prereq));
          // Add unlocks
          n.unlocks.forEach(unlock => traverse(unlock));
          // Add nodes that require this one
          this.nodes.forEach(other => {
            if (other.prerequisites.includes(id)) {
              traverse(other.id);
            }
          });
        }
      };
      
      traverse(node.id);
      return connected;
    }
  }
}
```

**Connection View UI**:
```
┌─────────────────────────────────────────────────────┐
│ 🔗 Showing connections for: Storage Shed II         │
│ Connected nodes: 12 | Hidden nodes: 88             │
│                              [Show All Nodes]       │
└─────────────────────────────────────────────────────┘
```

#### 5. Pan & Zoom Controls
```typescript
interface ViewportControls {
  scale: number; // 0.25 to 2.0
  translation: { x: number; y: number; };
  
  // Mouse controls
  onWheel(event: WheelEvent) {
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    this.scale = clamp(this.scale * delta, 0.25, 2.0);
  }
  
  onDrag(event: MouseEvent) {
    if (this.isPanning) {
      this.translation.x += event.movementX;
      this.translation.y += event.movementY;
    }
  }
  
  // Keyboard shortcuts
  zoomToFit() {
    const bounds = this.calculateGraphBounds();
    this.scale = Math.min(
      viewport.width / bounds.width,
      viewport.height / bounds.height
    ) * 0.9;
  }
  
  centerOnNode(node: UpgradeNode) {
    this.translation = {
      x: viewport.width / 2 - node.position.x * this.scale,
      y: viewport.height / 2 - node.position.y * this.scale
    };
  }
}
```

### Analysis Features

#### 1. Critical Path Analysis
```typescript
interface CriticalPath {
  findCriticalPath(): PathAnalysis {
    const paths: Path[] = [];
    
    // Find all paths from start nodes to end nodes
    const startNodes = this.nodes.filter(n => n.prerequisites.length === 0);
    const endNodes = this.nodes.filter(n => n.unlocks.length === 0);
    
    for (const start of startNodes) {
      for (const end of endNodes) {
        const path = this.findPath(start, end);
        if (path) {
          paths.push({
            nodes: path,
            totalCost: this.calculatePathCost(path),
            totalTime: this.calculatePathTime(path),
            bottlenecks: this.findBottlenecks(path)
          });
        }
      }
    }
    
    // Identify the longest/most expensive path
    const critical = paths.reduce((longest, current) => 
      current.totalTime > longest.totalTime ? current : longest
    );
    
    return {
      critical,
      alternatives: paths.filter(p => p !== critical),
      recommendations: this.generateRecommendations(critical)
    };
  }
}
```

#### 2. Orphan Detection
```typescript
interface OrphanAnalysis {
  findOrphans(): UpgradeNode[] {
    return this.nodes.filter(node => {
      // No prerequisites and no unlocks = completely isolated
      const isolated = node.prerequisites.length === 0 && 
                      node.unlocks.length === 0;
      
      // Has prerequisites but nothing depends on it
      const deadEnd = node.prerequisites.length > 0 && 
                     node.unlocks.length === 0 &&
                     !this.isEssentialUpgrade(node);
      
      return isolated || deadEnd;
    });
  }
  
  findWeakLinks(): UpgradeNode[] {
    return this.nodes.filter(node => {
      // Nodes that too many things depend on
      const dependencyCount = this.nodes.filter(n => 
        n.prerequisites.includes(node.id)
      ).length;
      
      return dependencyCount > 5; // Threshold for "too many"
    });
  }
}
```

#### 3. Phase Balance Analysis
```typescript
interface PhaseBalance {
  analyzePhaseDistribution(): PhaseReport {
    const distribution = new Map<number, UpgradeNode[]>();
    
    // Group nodes by tier
    this.nodes.forEach(node => {
      if (!distribution.has(node.tier)) {
        distribution.set(node.tier, []);
      }
      distribution.get(node.tier).push(node);
    });
    
    // Calculate metrics per phase
    const phases = Array.from(distribution.entries()).map(([tier, nodes]) => ({
      tier,
      nodeCount: nodes.length,
      totalGoldCost: nodes.reduce((sum, n) => sum + (n.cost.gold || 0), 0),
      categories: this.categorizeNodes(nodes),
      complexity: this.calculateComplexity(nodes)
    }));
    
    return {
      phases,
      balanced: this.isBalanced(phases),
      recommendations: this.suggestRebalancing(phases)
    };
  }
}
```

### Filtering & Search

#### Filter System
```typescript
interface FilterOptions {
  categories: Set<NodeCategory>;
  sources: Set<string>;
  tiers: Set<number>;
  status: Set<'locked' | 'available' | 'owned'>;
  searchQuery: string;
  
  // Advanced filters
  showCriticalPath: boolean;
  showOrphans: boolean;
  showBottlenecks: boolean;
  minCost?: number;
  maxCost?: number;
}

function applyFilters(nodes: UpgradeNode[], filters: FilterOptions): UpgradeNode[] {
  return nodes.filter(node => {
    // Category filter
    if (filters.categories.size > 0 && !filters.categories.has(node.category)) {
      return false;
    }
    
    // Search query
    if (filters.searchQuery && !node.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
      return false;
    }
    
    // Cost range
    if (filters.minCost && node.cost.gold < filters.minCost) {
      return false;
    }
    
    return true;
  });
}
```

### State Management

#### Tree Store
```typescript
export const useTreeStore = defineStore('upgradeTree', {
  state: () => ({
    nodes: new Map<string, UpgradeNode>(),
    edges: new Map<string, GraphEdge>(),
    
    viewport: {
      scale: 1.0,
      translation: { x: 0, y: 0 }
    },
    
    selection: {
      selectedNode: null as UpgradeNode | null,
      focusedChain: new Set<string>(),
      hoveredNode: null as UpgradeNode | null,
      familyTreeMode: false,
      familyTreeRoot: null as string | null
    },
    
    filters: {
      categories: new Set<NodeCategory>(),
      searchQuery: ''
    },
    
    layout: {
      algorithm: 'swim-lane' as 'swim-lane' | 'force' | 'hierarchical',
      snapToGrid: true
    }
  }),
  
  getters: {
    visibleNodes: (state) => {
      const filtered = applyFilters(
        Array.from(state.nodes.values()),
        state.filters
      );
      
      // Family tree mode takes precedence
      if (state.selection.familyTreeMode && state.selection.focusedChain.size > 0) {
        return filtered.filter(n => 
          state.selection.focusedChain.has(n.id)
        );
      }
      
      // Regular focused chain highlighting
      if (!state.selection.familyTreeMode && state.selection.focusedChain.size > 0) {
        // In non-family-tree mode, we highlight but don't hide
        return filtered;
      }
      
      return filtered;
    },
    
    visibleEdges: (state) => {
      const visibleNodeIds = new Set(
        state.visibleNodes.map(n => n.id)
      );
      
      return Array.from(state.edges.values()).filter(edge =>
        visibleNodeIds.has(edge.source) && 
        visibleNodeIds.has(edge.target)
      );
    }
  },
  
  actions: {
    async loadTreeData() {
      // Load from CSV files and build graph
      const upgrades = await this.loadAllUpgrades();
      this.buildGraph(upgrades);
      this.calculateLayout();
    },
    
    updateNodePosition(nodeId: string, x: number, y: number) {
      const node = this.nodes.get(nodeId);
      if (node) {
        if (this.layout.snapToGrid) {
          const snapped = snapToGrid(x, y);
          node.position = snapped;
        } else {
          node.position = { x, y };
        }
        this.recalculateEdges(nodeId);
      }
    }
  }
});
```

### Performance Optimizations

#### Canvas Rendering
```typescript
class TreeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: OffscreenCanvas;
  
  // Use offscreen canvas for better performance
  renderTree(nodes: UpgradeNode[], edges: GraphEdge[]) {
    // Clear offscreen canvas
    this.offscreenCtx.clearRect(0, 0, this.width, this.height);
    
    // Render edges first (background layer)
    edges.forEach(edge => this.renderEdge(edge));
    
    // Render nodes (foreground layer)
    nodes.forEach(node => this.renderNode(node));
    
    // Copy to main canvas
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
  }
  
  // Culling - only render visible nodes
  getVisibleNodes(viewport: Viewport): UpgradeNode[] {
    return this.nodes.filter(node => {
      const screenPos = this.worldToScreen(node.position);
      return screenPos.x >= -100 && screenPos.x <= viewport.width + 100 &&
             screenPos.y >= -100 && screenPos.y <= viewport.height + 100;
    });
  }
}
```

#### Level of Detail (LOD)
```typescript
interface LODSystem {
  getNodeLOD(node: UpgradeNode, scale: number): 'full' | 'medium' | 'simple' {
    if (scale > 1.5) return 'full';
    if (scale > 0.5) return 'medium';
    return 'simple';
  }
  
  renderNodeLOD(node: UpgradeNode, lod: string) {
    switch (lod) {
      case 'full':
        // Render everything - icon, name, cost, effects
        break;
      case 'medium':
        // Render icon and name only
        break;
      case 'simple':
        // Render just a colored dot
        break;
    }
  }
}
```

### Export & Sharing

#### Image Export
```typescript
async function exportAsImage(format: 'png' | 'svg'): Promise<Blob> {
  if (format === 'png') {
    const canvas = document.createElement('canvas');
    canvas.width = this.graphBounds.width;
    canvas.height = this.graphBounds.height;
    
    const renderer = new TreeRenderer(canvas);
    renderer.renderTree(this.nodes, this.edges);
    
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/png');
    });
  } else {
    // Generate SVG
    const svg = this.generateSVG();
    return new Blob([svg], { type: 'image/svg+xml' });
  }
}
```

### Visual Indicators

#### Status Colors
```css
/* Node status colors */
.node.locked {
  opacity: 0.4;
  filter: grayscale(100%);
}

.node.available {
  filter: drop-shadow(0 0 8px #60a5fa);
}

.node.owned {
  filter: drop-shadow(0 0 4px #10b981);
}

.node.highlighted {
  filter: drop-shadow(0 0 12px #fbbf24);
  animation: pulse 2s infinite;
}

/* Category colors */
--cat-storage: #3b82f6;     /* blue */
--cat-production: #10b981;  /* green */
--cat-tools: #f59e0b;       /* amber */
--cat-combat: #ef4444;      /* red */
--cat-helpers: #8b5cf6;     /* purple */
--cat-land: #84cc16;        /* lime */
--cat-automation: #06b6d4;  /* cyan */
--cat-progression: #ec4899; /* pink */
```

### Testing Requirements

#### Graph Tests
- Node positioning algorithms
- Edge routing calculations
- Dependency chain traversal
- Cycle detection

#### Interaction Tests
- Pan/zoom controls
- Node selection
- Filter application
- Modal editing

#### Performance Tests
- Render 500+ nodes at 60fps
- Smooth zoom from 0.25x to 2x
- Filter response <100ms

### Conclusion
The Upgrade Tree visualization transforms complex dependency data into an intuitive, interactive graph that reveals the hidden structure of game progression. Its powerful analysis tools and visual clarity make it indispensable for identifying and resolving balance issues in the upgrade economy.
