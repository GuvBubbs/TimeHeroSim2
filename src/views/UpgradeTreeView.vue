<template>
  <div class="upgrade-tree-view h-full relative">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-3xl font-bold">Upgrade Tree</h2>
      <div class="text-sm text-sim-muted">
        Interactive Dependency Graph
      </div>
    </div>
    
    <!-- Graph container -->
    <div ref="cyContainer" class="cytoscape-container bg-sim-surface rounded-lg border border-sim-border relative"></div>
    
    <!-- Loading indicator -->
    <div v-if="isLoading" class="loading-overlay absolute inset-0 bg-sim-surface/80 flex flex-col items-center justify-center rounded-lg">
      <i class="fas fa-spinner fa-spin text-4xl text-sim-accent mb-4"></i>
      <p class="text-sim-text">Building dependency graph...</p>
      <p class="text-xs text-sim-muted mt-1">Loading {{ filteredItemsCount }} items</p>
    </div>
    
    <!-- Node Controls (click-based) -->
    <div v-if="selectedNode" 
         class="node-controls absolute pointer-events-none z-50"
         :style="nodeControlsPosition">
      <div class="flex flex-col gap-1 pointer-events-auto">
        <button @click.stop="openEditModal(selectedNode)"
                class="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs flex items-center justify-center transition-colors shadow-lg">
          <i class="fas fa-edit"></i>
        </button>
        <button @click.stop="showFamilyTree(selectedNode)"
                class="w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded text-xs flex items-center justify-center transition-colors shadow-lg">
          <i class="fas fa-project-diagram"></i>
        </button>
      </div>
    </div>
    
    <!-- Search Bar -->
    <div class="search-bar absolute top-4 left-4 w-80 max-w-sm">
      <div class="relative">
        <input v-model="searchQuery"
               @input="filterNodes"
               placeholder="Search items..."
               class="w-full px-4 py-2 pl-10 bg-sim-surface border border-sim-border rounded-lg text-sim-text placeholder-sim-muted focus:outline-none focus:border-sim-accent transition-colors">
        <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-sim-muted text-sm"></i>
        <button v-if="searchQuery" 
                @click="clearSearch"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-sim-muted hover:text-sim-text transition-colors">
          <i class="fas fa-times text-sm"></i>
        </button>
      </div>
      
      <!-- Search Stats -->
      <div v-if="searchQuery && searchStats" class="mt-2 text-xs text-sim-muted bg-sim-surface border border-sim-border rounded px-2 py-1">
        <i class="fas fa-filter mr-1"></i>
        {{ searchStats.visible }} of {{ searchStats.total }} items visible
      </div>
    </div>

    <!-- Controls Panel -->
    <div class="controls-panel absolute top-4 right-4 bg-sim-surface rounded-lg shadow-lg p-2 space-y-2">
      <!-- Material Edges Toggle -->
      <div class="controls-section border-b border-sim-border pb-2">
        <label class="flex items-center space-x-2 text-sm cursor-pointer">
          <input type="checkbox" v-model="showMaterialEdges" @change="toggleMaterialEdges" 
                 class="accent-sim-accent">
          <span><i class="fas fa-exchange-alt mr-1 text-xs"></i>Material Flows</span>
        </label>
      </div>
      
      <!-- Zoom Controls -->
      <div class="controls-section space-x-1">
        <button @click="zoomIn" 
                class="px-3 py-2 bg-sim-accent text-white rounded hover:bg-blue-600 transition-colors" 
                title="Zoom In">
          <i class="fas fa-plus"></i>
        </button>
        <button @click="zoomOut"
                class="px-3 py-2 bg-sim-accent text-white rounded hover:bg-blue-600 transition-colors"
                title="Zoom Out">
          <i class="fas fa-minus"></i>
        </button>
        <button @click="fitGraph"
                class="px-3 py-2 bg-sim-accent text-white rounded hover:bg-blue-600 transition-colors"
                title="Fit to View">
          <i class="fas fa-expand"></i>
        </button>
      </div>
    </div>
    
    <!-- Family Tree Mode Indicator (when not searching) -->
    <div v-if="familyTreeMode && !searchQuery" 
         class="family-tree-indicator absolute top-20 left-4 bg-sim-surface rounded-lg shadow-lg p-3 z-40">
      <div class="flex items-center justify-between">
        <span class="text-sm">
          <i class="fas fa-filter mr-2 text-green-500"></i>
          Showing connections for: <strong>{{ familyTreeRoot?.name }}</strong>
        </span>
        <button @click="exitFamilyTree"
                class="ml-4 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm transition-colors">
          Show All
        </button>
      </div>
        </div>
    
    <!-- Graph Stats -->
    <div v-if="!isLoading && graphStats" class="graph-stats absolute bottom-4 left-4 bg-sim-surface rounded-lg shadow-lg p-3 text-sm">
      <div class="flex items-center space-x-4 text-sim-muted">
        <span><i class="fas fa-circle mr-1 text-xs"></i>{{ graphStats.nodes }} nodes</span>
        <span><i class="fas fa-arrow-right mr-1 text-xs"></i>{{ graphStats.edges }} edges</span>
        <span><i class="fas fa-layer-group mr-1 text-xs"></i>{{ graphStats.lanes }} lanes</span>
      </div>
    </div>
    
    <!-- REUSE EXISTING MODAL! -->
    <EditItemModal 
      v-if="editingItem"
      :show="!!editingItem"
      :item="editingItem"
      @save="handleSaveItem"
      @close="editingItem = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import cytoscape from 'cytoscape'
import cola from 'cytoscape-cola'
import fcose from 'cytoscape-fcose'
import { useGameDataStore } from '@/stores/gameData'
import { useConfigurationStore } from '@/stores/configuration'
import { buildGraphElements, addMaterialEdges } from '@/utils/graphBuilder'
import EditItemModal from '@/components/GameConfiguration/EditItemModal.vue'
import type { GameDataItem } from '@/types/game-data'

// Register layouts
cytoscape.use(cola)
cytoscape.use(fcose)

const gameData = useGameDataStore()
const configStore = useConfigurationStore()

const cyContainer = ref<HTMLElement>()
const isLoading = ref(true)
let cy: cytoscape.Core

// Modal and interaction state
const editingItem = ref<GameDataItem | null>(null)
const selectedNode = ref<GameDataItem | null>(null)
const nodeControlsPosition = ref<Record<string, string>>({})
const familyTreeMode = ref(false)
const familyTreeRoot = ref<GameDataItem | null>(null)
const showMaterialEdges = ref(false)
const searchQuery = ref('')
const searchStats = ref<{ visible: number, total: number } | null>(null)

// Computed properties
const filteredItemsCount = computed(() => {
  return gameData.items.filter(item => 
    item.category === 'Actions' || item.category === 'Unlocks'
  ).length
})

const graphStats = ref<{ nodes: number, edges: number, lanes: number } | null>(null)

// Cytoscape graph methods  
const zoomIn = () => {
  if (cy) {
    cy.zoom(cy.zoom() * 1.2)
    cy.center()
  }
}

const zoomOut = () => {
  if (cy) {
    cy.zoom(cy.zoom() * 0.8) 
    cy.center()
  }
}

const fitGraph = () => {
  if (cy) {
    cy.fit()
  }
}

// Modal and family tree methods
const openEditModal = (item: GameDataItem) => {
  editingItem.value = item
  console.log(`📝 Opening edit modal for: ${item.name} (${item.id})`)
}

const handleSaveItem = (updatedItem: GameDataItem) => {
  // Update in configuration store (already handles everything!)
  configStore.updateItem(updatedItem)
  
  console.log(`💾 Saved item: ${updatedItem.name} (${updatedItem.id})`)
  
  // Close modal
  editingItem.value = null
  
  // Rebuild graph to reflect changes
  rebuildGraph()
}

const toggleMaterialEdges = () => {
  console.log(`🔄 Material edges ${showMaterialEdges.value ? 'enabled' : 'disabled'}`)
  rebuildGraph()
}

// Search functionality
const filterNodes = () => {
  if (!cy) return
  
  const query = searchQuery.value.toLowerCase().trim()
  let visibleCount = 0
  let totalCount = 0
  
  cy.nodes().forEach(node => {
    totalCount++
    const data = node.data()
    const matches = !query || 
                   data.label.toLowerCase().includes(query) ||
                   data.id.toLowerCase().includes(query) ||
                   (data.fullData.type && data.fullData.type.toLowerCase().includes(query)) ||
                   (data.swimLane && data.swimLane.toLowerCase().includes(query))
    
    if (matches) {
      node.style('display', 'element')
      visibleCount++
    } else {
      node.style('display', 'none')
    }
  })
  
  // Update edges visibility based on node visibility
  cy.edges().forEach(edge => {
    const sourceVisible = edge.source().style('display') !== 'none'
    const targetVisible = edge.target().style('display') !== 'none'
    edge.style('display', sourceVisible && targetVisible ? 'element' : 'none')
  })
  
  // Update search stats
  searchStats.value = { visible: visibleCount, total: totalCount }
  
  // Fit to visible nodes if search is active
  if (query) {
    const visibleNodes = cy.nodes().filter(node => node.style('display') !== 'none')
    if (visibleNodes.length > 0) {
      cy.fit(visibleNodes, 50) // 50px padding
    }
  }
  
  console.log(`🔍 Search "${query}": ${visibleCount}/${totalCount} nodes visible`)
}

const clearSearch = () => {
  searchQuery.value = ''
  searchStats.value = null
  
  if (cy) {
    // Show all elements
    cy.elements().style('display', 'element')
    cy.fit()
  }
  
  console.log('🔍 Search cleared - showing all nodes')
}

const showFamilyTree = (item: GameDataItem) => {
  if (!cy) return
  
  familyTreeMode.value = true
  familyTreeRoot.value = item
  
  console.log(`🌳 Showing family tree for: ${item.name}`)
  
  // Get all connected nodes
  const node = cy.getElementById(item.id)
  const connected = node.predecessors().union(node.successors()).union(node)
  
  // Hide non-connected
  cy.elements().not(connected).style('display', 'none')
  
  // Fit to visible
  cy.fit(connected)
}

const exitFamilyTree = () => {
  if (!cy) return
  
  familyTreeMode.value = false
  familyTreeRoot.value = null
  
  console.log('🌳 Exiting family tree mode')
  
  // Show all nodes
  cy.elements().style('display', 'element')
  cy.fit()
}

const rebuildGraph = async () => {
  if (!cy || !cyContainer.value) return
  
  console.log('🔄 Rebuilding graph with updated data...')
  
  // Build new elements
  const { nodes, edges, laneHeights } = buildGraphElements(gameData.items)
  
  // Add material edges if enabled
  if (showMaterialEdges.value) {
    addMaterialEdges(gameData.items, edges, showMaterialEdges.value)
  }
  
  // Update stats
  graphStats.value = {
    nodes: nodes.length,
    edges: edges.length,
    lanes: 14
  }
  
  // Replace elements
  cy.elements().remove()
  cy.add({ nodes, edges })
  
  // Re-add swim lane visuals
  addSwimLaneVisuals()
  
  // Re-setup event handlers
  setupEventHandlers()
  
  // Update container size using consistent constants
  const LANE_PADDING = 25  // Match graphBuilder.ts LAYOUT_CONSTANTS.LANE_PADDING
  const TIER_WIDTH = 180   // Match graphBuilder.ts LAYOUT_CONSTANTS.TIER_WIDTH
  const LANE_START_X = 200 // Match graphBuilder.ts LAYOUT_CONSTANTS.LANE_START_X
  
  const totalHeight = Array.from(laneHeights.values()).reduce((sum, h) => sum + h, 0) + 
                      (14 * LANE_PADDING) + 40  // 14 lanes + extra padding
  const maxTier = Math.max(...nodes.map(n => n.data.tier))
  const totalWidth = Math.max(window.innerWidth, LANE_START_X + ((maxTier + 1) * TIER_WIDTH) + 100)
  
  const container = cyContainer.value!
  container.style.width = `${totalWidth}px`
  container.style.height = `${Math.max(600, totalHeight)}px`
  
  // Force proper z-index ordering on rebuild too
  setTimeout(() => {
    cy.nodes('.lane-background').forEach(node => {
      node.style('z-index', -1)
      node.lock()
      node.ungrabify()
    })
    
    cy.nodes('.lane-label').forEach(node => {
      node.style('z-index', 1)
      node.lock()
    })
    
    cy.nodes('.game-node').forEach(node => {
      node.style('z-index', 10)
    })
    
    cy.edges().forEach(edge => {
      edge.style('z-index', 5)
    })
    
    cy.forceRender()
  }, 10)
  
  // Re-fit
  cy.fit()
}

// Add visual swim lane backgrounds with dynamic heights
const addSwimLaneVisuals = () => {
  if (!cy) return
  
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
  
  // Wait for nodes to be fully rendered before calculating sizes
  setTimeout(() => {
    // Get all game nodes (must exist first)
    const allGameNodes = cy.nodes('.game-node')
    if (allGameNodes.length === 0) {
      console.warn('No game nodes found for swimlane sizing')
      return
    }
    
    console.log(`📏 Calculating swimlane sizes for ${allGameNodes.length} nodes`)
    
    // Calculate graph width from actual nodes
    const graphBounds = allGameNodes.boundingBox()
    const graphWidth = graphBounds.x2 - graphBounds.x1 + 200 // Full width + padding
    const graphCenterX = graphBounds.x1 + (graphWidth / 2)
    
    // First pass: collect lane data and sort by vertical position
    const laneData = []
    SWIM_LANES.forEach((lane, index) => {
      const laneNodes = allGameNodes.filter(node => node.data('swimLane') === lane)
      
      if (laneNodes.length === 0) {
        // Empty lane - add placeholder
        laneData.push({
          name: lane,
          index,
          nodes: 0,
          minY: index * 80 + 50,
          maxY: index * 80 + 90,
          isEmpty: true
        })
        return
      }
      
      const laneNodePositions = laneNodes.map(node => node.position().y)
      const laneMinY = Math.min(...laneNodePositions)
      const laneMaxY = Math.max(...laneNodePositions)
      
      laneData.push({
        name: lane,
        index,
        nodes: laneNodes.length,
        minY: laneMinY,
        maxY: laneMaxY,
        isEmpty: false
      })
    })
    
    // Sort lanes by their actual vertical position (topmost first)
    laneData.sort((a, b) => a.minY - b.minY)
    
    console.log('Lane order by position:', laneData.map(l => `${l.name}(${l.minY.toFixed(0)}-${l.maxY.toFixed(0)})`))
    
    // Second pass: create continuous backgrounds that butt against each other
    let currentTopY = laneData[0].minY - 40 // Start 40px above first lane for padding
    
    laneData.forEach((lane, sortedIndex) => {
      const NODE_HALF_HEIGHT = 20 // Half of NODE_HEIGHT (40px)
      
      if (lane.isEmpty) {
        // Empty lane gets minimal space
        const laneHeight = 60
        const laneCenterY = currentTopY + (laneHeight / 2)
        
        cy.add({
          group: 'nodes',
          data: { id: `lane-bg-${lane.name}`, label: '' },
          position: { x: graphCenterX, y: laneCenterY },
          classes: 'lane-background'
        })
        
        cy.add({
          group: 'nodes', 
          data: { id: `lane-label-${lane.name}`, label: lane.name },
          position: { x: 100, y: laneCenterY },
          classes: 'lane-label',
          selectable: false, 
          grabbable: false,
          locked: true
        })
        
        // Style empty lane label immediately
        const emptyLabelNode = cy.getElementById(`lane-label-${lane.name}`)
        if (emptyLabelNode.length > 0) {
          emptyLabelNode.style({
            'z-index': 100,
            'background-opacity': 1,
            'color': '#94a3b8',  // Dimmer color for empty lanes
            'font-weight': 'bold',
            'font-size': '13px'
          })
          console.log(`Styled empty lane label "${lane.name}"`)
        }
        
        // Style the background
        const bgNode = cy.getElementById(`lane-bg-${lane.name}`)
        if (bgNode.length > 0) {
          bgNode.style({
            'width': graphWidth - 120,
            'height': laneHeight,
            'z-index': -1,
            'events': 'no'
          })
        }
        
        currentTopY += laneHeight
        return
      }
      
      // For lanes with nodes: use consistent padding that matches node positioning
      const LANE_PADDING = 25 // Match graphBuilder.ts LAYOUT_CONSTANTS.LANE_PADDING
      const nodeRange = lane.maxY - lane.minY
      const laneHeight = Math.max(120, nodeRange + (LANE_PADDING * 2)) // +80px total padding
      const laneCenterY = currentTopY + (laneHeight / 2)
      
      console.log(`Lane "${lane.name}": ${lane.nodes} nodes, range ${nodeRange.toFixed(0)}px, height ${laneHeight.toFixed(0)}px (${LANE_PADDING}px padding), positioned at Y=${currentTopY.toFixed(0)}-${(currentTopY + laneHeight).toFixed(0)}`)
      
      // Add background rectangle
      cy.add({
        group: 'nodes',
        data: { id: `lane-bg-${lane.name}`, label: '' },
        position: { x: graphCenterX, y: laneCenterY },
        classes: 'lane-background',
        selectable: false,
        grabbable: false,
        locked: true
      })
      
      // Add lane label centered on the background
      cy.add({
        group: 'nodes',
        data: { id: `lane-label-${lane.name}`, label: lane.name },
        position: { x: 100, y: laneCenterY },
        classes: 'lane-label',
        selectable: false, 
        grabbable: false,
        locked: true
      })
      
      console.log(`Added lane label "${lane.name}" at position (100, ${laneCenterY.toFixed(0)})`)
      
      // Immediately style the lane label to ensure visibility
      const labelNode = cy.getElementById(`lane-label-${lane.name}`)
      if (labelNode.length > 0) {
        labelNode.style({
          'z-index': 100,  // High z-index to ensure visibility
          'background-opacity': 1,
          'color': '#e2e8f0',
          'font-weight': 'bold',
          'font-size': '14px'
        })
        console.log(`Styled lane label "${lane.name}" - visible: ${labelNode.style('display') !== 'none'}`)
      } else {
        console.error(`Failed to find lane label "${lane.name}" after creation`)
      }
      
      // Apply proper sizing to make it span full width
      const bgNode = cy.getElementById(`lane-bg-${lane.name}`)
      if (bgNode.length > 0) {
        bgNode.style({
          'width': graphWidth - 120,  // Full graph width minus margin
          'height': laneHeight,
          'z-index': -1,
          'events': 'no'
        })
      }
      
      // Move to next lane position (no gap - they butt against each other)
      currentTopY += laneHeight
    })
    
    // Force proper layering
    cy.nodes('.lane-background').forEach(node => {
      node.lock()
      node.ungrabify()
    })
    cy.nodes('.lane-label').forEach(node => {
      node.lock()
      node.ungrabify()
    })
    
    // Final debug: check all lane labels
    const allLabels = cy.nodes('.lane-label')
    console.log(`✅ Created ${allLabels.length} lane labels:`, allLabels.map(l => `${l.data('label')} at (${l.position().x}, ${l.position().y})`))
    
    console.log('✅ Swimlane backgrounds sized to actual node positions')
    cy.forceRender()
    
  }, 150) // Wait for nodes to be fully positioned
}

// Helper function for calculating prerequisite depth (needed for visualization)
const calculatePrerequisiteDepth = (item: GameDataItem, allItems: GameDataItem[]): number => {
  if (!item.prerequisites || item.prerequisites.length === 0) {
    return 0
  }
  
  let maxDepth = 0
  const visited = new Set<string>()
  
  function getDepth(itemId: string): number {
    if (visited.has(itemId)) return 0
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

const initializeGraph = async () => {
  if (!cyContainer.value) {
    console.error('❌ Cytoscape container not available')
    return
  }
  
  isLoading.value = true
  
  try {
    console.log('🔄 Initializing dependency graph...')
    
    // Build elements from game data
    const { nodes, edges, laneHeights } = buildGraphElements(gameData.items)
    
    // Add material edges if enabled
    if (showMaterialEdges.value) {
      addMaterialEdges(gameData.items, edges, showMaterialEdges.value)
    }
    
    // Update stats
    graphStats.value = {
      nodes: nodes.length,
      edges: edges.length,
      lanes: 14 // We have 14 swim lanes (including individual town vendors)
    }
    
    // Initialize Cytoscape
    cy = cytoscape({
      container: cyContainer.value,
      
      elements: { nodes, edges },
      
      style: [
        // Updated node styles for reduced size and better spacing
        {
          selector: 'node.game-node',
          style: {
            'background-color': '#1e293b',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#e2e8f0',
            'font-size': '11px',  // Reduced from 12px
            'font-family': 'system-ui, sans-serif',
            'width': '140px',  // Reduced from 200px
            'height': '40px',  // Reduced from 50px
            'shape': 'round-rectangle',
            'border-width': 2,
            'border-color': '#475569',
            'text-wrap': 'wrap',
            'text-max-width': '130px',  // Adjusted for new width
            'padding': '5px',  // Reduced from 10px
            'overlay-padding': '6px',
            'z-compound-depth': 'top',
            'z-index': 10,
            'overlay-opacity': 0,
            'min-zoomed-font-size': 8,
            'events': 'yes',
            'transition-property': 'background-color, border-color',
            'transition-duration': '0.2s'
          }
        },
        
        // Feature-specific colors (matching swim lanes)
        { selector: '.feature-farm', style: { 'background-color': '#059669', 'border-color': '#047857' } },
        { selector: '.feature-tower', style: { 'background-color': '#7c3aed', 'border-color': '#6d28d9' } },
        { selector: '.feature-town', style: { 'background-color': '#dc2626', 'border-color': '#b91c1c' } },
        { selector: '.feature-adventure', style: { 'background-color': '#ea580c', 'border-color': '#c2410c' } },
        { selector: '.feature-combat', style: { 'background-color': '#b91c1c', 'border-color': '#991b1b' } },
        { selector: '.feature-forge', style: { 'background-color': '#ca8a04', 'border-color': '#a16207' } },
        { selector: '.feature-mining', style: { 'background-color': '#0891b2', 'border-color': '#0e7490' } },
        { selector: '.feature-general', style: { 'background-color': '#6b7280', 'border-color': '#4b5563' } },
        
        // Grid-aligned edge styles (Civ V style) - ENHANCED VISIBILITY
        {
          selector: 'edge.edge-prerequisite',
          style: {
            'width': 4,
            'line-color': '#64748b',  // Light slate for good visibility
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'target-arrow-width': 3,
            'arrow-scale': 1.5,
            'curve-style': 'taxi',  // 90° corners
            'taxi-direction': 'horizontal',
            'taxi-turn': '50px',
            'taxi-turn-min-distance': 30,
            'edge-distances': 'node-position',
            'control-point-step-size': 40,
            'opacity': 1,
            'z-index': 2,
            'z-index-compare': 'manual',
            'overlay-color': '#64748b',
            'overlay-opacity': 0.1
          }
        },
        
        // Highlighted edge style (for dependency chains)
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#fbbf24',
            'target-arrow-color': '#fbbf24',
            'width': 4,
            'opacity': 1,
            'z-index': 10,
            'curve-style': 'taxi',
            'taxi-direction': 'horizontal',
            'taxi-turn': '50px'
          }
        },
        
        // Material edges with taxi routing
        {
          selector: 'edge.edge-material',
          style: {
            'line-style': 'dashed',
            'line-dash-pattern': [10, 5],
            'line-color': '#10b981',
            'target-arrow-color': '#10b981',
            'opacity': 0.6,
            'width': 2,
            'curve-style': 'taxi',
            'taxi-direction': 'horizontal',
            'taxi-turn': '30px'
          }
        },
        
        // Remove invalid node:hover selector - using click-based interaction
        // Hover effects handled via JavaScript events, not CSS selectors
        
        {
          selector: '.highlighted',
          style: {
            'border-color': '#fbbf24',
            'border-width': 3,
            'z-index': 999
          }
        },
        
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.3
          }
        },
        
        // Lane backgrounds with alternating colors - ENHANCED Z-INDEX CONTROL
        {
          selector: '.lane-background',
          style: {
            'shape': 'rectangle',
            'background-color': (ele: any) => {
              const lane = ele.data('id').replace('lane-bg-', '')
              const lanes = ['Farm', 'Tower', 'Adventure', 'Combat', 'Forge', 'Mining', 'Town', 'General']
              const index = lanes.indexOf(lane)
              return index % 2 === 0 ? '#1a2332' : '#0f172a'
            },
            'background-opacity': 0.6,
            'border-width': 2,
            'border-color': '#2d3748',
            'border-style': 'solid',
            'z-index': -1,  // MUST be negative
            'overlay-opacity': 0,
            'events': 'no'  // Disable all events
          }
        },
        
        // Swim lane labels
        {
          selector: '.lane-label',
          style: {
            'shape': 'rectangle',
            'width': '120px',
            'height': '40px',
            'background-color': '#0f172a',
            'background-opacity': 0.8,
            'border-width': 2,
            'border-color': '#334155',
            'label': 'data(label)',  // Display the node's label text
            'text-valign': 'center',
            'text-halign': 'center',
            'font-weight': 'bold',
            'font-size': '13px',
            'color': '#94a3b8',
            'z-index': 5,
            'overlay-opacity': 0
          }
        }
      ],
      
      layout: {
        name: 'preset',  // Use our calculated positions
        fit: false,      // Don't auto-fit, we want horizontal scroll
        padding: 30
      },
      
      // Update viewport settings for horizontal scrolling
      minZoom: 0.3,
      maxZoom: 2,
      wheelSensitivity: 0.2,
      
      // Set initial viewport to show leftmost nodes
      pan: { x: 50, y: 50 },
      zoom: 1,
      
      // Performance settings for ~400 nodes
      textureOnViewport: true,
      motionBlur: false,       // OFF for better performance
      hideEdgesOnViewport: false, // Keep edges visible for better UX
      hideLabelsOnViewport: false, // Keep labels visible
      pixelRatio: 1,           // Lower for better performance
      
      // Interaction settings - DISABLE NODE DRAGGING
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      selectionType: 'single',
      autoungrabify: true  // Disable node dragging globally
    })
    
    // Add event handlers
    setupEventHandlers()
    
    // Add swim lane visuals
    addSwimLaneVisuals()
    
    // Calculate and set container size using consistent constants
    const LANE_PADDING = 25  // Match graphBuilder.ts constants
    const TIER_WIDTH = 180
    const LANE_START_X = 200
    
    const totalHeight = Array.from(laneHeights.values()).reduce((sum, h) => sum + h, 0) + 
                        (14 * LANE_PADDING) + 40  // 14 lanes + extra padding
    const maxTier = Math.max(...nodes.map(n => n.data.tier))
    const totalWidth = Math.max(window.innerWidth, LANE_START_X + ((maxTier + 1) * TIER_WIDTH) + 100)
    
    const container = cyContainer.value!
    container.style.width = `${totalWidth}px`
    container.style.height = `${Math.max(600, totalHeight)}px`
    
    // FORCE PROPER Z-INDEX ORDERING - ENHANCED
    // OPTIMIZED Z-INDEX ENFORCEMENT
    setTimeout(() => {
      // Layer elements efficiently without excessive logging
      cy.nodes('.lane-background').forEach(node => {
        node.style({ 'z-index': -1, 'events': 'no' })
        node.lock()
        node.ungrabify()
      })
      
      cy.edges().forEach(edge => edge.style('z-index', 2))
      cy.nodes('.lane-label').forEach(node => {
        node.style('z-index', 5)
        node.lock()
        node.ungrabify()
      })
      cy.nodes('.game-node').forEach(node => {
        node.style('z-index', 10)
        node.lock()
        node.ungrabify()
      })
      
      cy.forceRender()
      console.log('✅ Layout complete')
    }, 10)
    
    // COMPREHENSIVE EDGE DEBUG LOGGING
    const edgeCount = cy.edges().length
    const nodeCount = cy.nodes('.game-node').length
    
    console.log(`🗺️ GRAPH SUMMARY:`)
    console.log(`- Total nodes: ${nodeCount}`)
    console.log(`- Total edges: ${edgeCount}`)
    
    if (edgeCount === 0) {
      console.error('❌ NO EDGES CREATED! Running comprehensive diagnostics...')
      
      const treeItems = gameData.items.filter(item => 
        item.category === 'Actions' || item.category === 'Unlocks'
      )
      
      console.log(`🔎 Analyzing ${treeItems.length} tree items:`)
      
      let totalPrereqs = 0
      let foundPrereqs = 0
      let invalidTierPrereqs = 0
      
      treeItems.forEach(item => {
        if (item.prerequisites?.length > 0) {
          const itemTier = calculatePrerequisiteDepth(item, treeItems)
          console.log(`
📄 ${item.name} (${item.id}, tier ${itemTier}) requires:`, item.prerequisites)
          
          item.prerequisites.forEach(prereqId => {
            totalPrereqs++
            const found = treeItems.find(i => i.id === prereqId)
            if (!found) {
              console.error(`  ❌ ${prereqId} NOT FOUND in filtered items`)
            } else {
              foundPrereqs++
              const prereqTier = calculatePrerequisiteDepth(found, treeItems)
              if (prereqTier >= itemTier) {
                invalidTierPrereqs++
                console.warn(`  ⚠️ ${found.name} (tier ${prereqTier}) invalid - not left of ${item.name} (tier ${itemTier})`)
              } else {
                console.log(`  ✅ ${found.name} (tier ${prereqTier}) → ${item.name} (tier ${itemTier})`)
              }
            }
          })
        }
      })
      
      console.log(`
📊 PREREQUISITES ANALYSIS:`)
      console.log(`- Total prerequisites: ${totalPrereqs}`)
      console.log(`- Found prerequisites: ${foundPrereqs}`)
      console.log(`- Missing prerequisites: ${totalPrereqs - foundPrereqs}`)
      console.log(`- Invalid tier prerequisites: ${invalidTierPrereqs}`)
      console.log(`- Valid edges created: ${foundPrereqs - invalidTierPrereqs}`)
      
      // Try to force edge creation as fallback
      if (edgeCount === 0 && foundPrereqs > invalidTierPrereqs) {
        console.log('🔧 Attempting fallback edge creation...')
        setTimeout(() => {
          const fallbackEdges: any[] = []
          treeItems.forEach(item => {
            if (item.prerequisites?.length > 0) {
              item.prerequisites.forEach(prereqId => {
                const found = treeItems.find(i => i.id === prereqId)
                if (found) {
                  fallbackEdges.push({
                    data: {
                      id: `fallback-${prereqId}-to-${item.id}`,
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
          
          if (fallbackEdges.length > 0) {
            cy.add(fallbackEdges)
            console.log(`✅ Added ${fallbackEdges.length} fallback edges`)
            cy.forceRender()
          }
        }, 100)
      }
    } else {
      console.log(`✅ Successfully created ${edgeCount} edges for ${nodeCount} nodes`)
      
      // Log edge details
      cy.edges('.edge-prerequisite').forEach(edge => {
        const data = edge.data()
        const sourceNode = cy.getElementById(data.source)
        const targetNode = cy.getElementById(data.target)
        if (sourceNode.length && targetNode.length) {
          console.log(`🔗 ${sourceNode.data('label')} → ${targetNode.data('label')}`)
        }
      })
    }
    
    // Fit to viewport
    await nextTick()
    cy.fit()
    
    console.log(`✅ Graph initialized with ${nodes.length} nodes and ${edges.length} edges`)
    
  } catch (error) {
    console.error('❌ Failed to initialize graph:', error)
  } finally {
    isLoading.value = false
  }
}

const setupEventHandlers = () => {
  if (!cy) return
  
  // Node click handler for selection and controls
  cy.on('tap', 'node', (evt) => {
    const node = evt.target
    const data = node.data()
    
    // Set selected node
    selectedNode.value = data.fullData
    
    // Clear previous highlighting
    cy.elements().removeClass('highlighted dimmed')
    
    // Highlight dependency chain
    const predecessors = node.predecessors()
    const successors = node.successors()
    const connected = predecessors.union(successors).union(node)
    
    connected.addClass('highlighted')
    cy.elements().not(connected).addClass('dimmed')
    
    // Position controls to the right of the node
    const pos = node.renderedPosition()
    const zoom = cy.zoom()
    const pan = cy.pan()
    
    nodeControlsPosition.value = {
      left: `${pos.x + (90 * zoom) + pan.x}px`,  // 90px is half node width
      top: `${pos.y - (25 * zoom) + pan.y}px`,   // Center vertically
      transform: `scale(${Math.max(0.8, Math.min(1.2, zoom))})`  // Scale with zoom
    }
    
    console.log(`📍 Selected: ${data.label} (${data.id}) | Lane: ${data.swimLane} | Tier: ${data.tier}`)
  })
  
  // Clear selection on background tap
  cy.on('tap', (evt) => {
    if (evt.target === cy) {
      cy.elements().removeClass('highlighted dimmed')
      selectedNode.value = null
    }
  })
}

onMounted(async () => {
  // Ensure data is loaded
  if (gameData.items.length === 0) {
    console.log('🔄 Loading game data...')
    await gameData.loadGameData()
  }
  
  console.log(`📊 Found ${gameData.items.length} total items, ${filteredItemsCount.value} are Actions/Unlocks`)
  
  // Initialize graph
  await initializeGraph()
})
</script>

<style scoped>
.upgrade-tree-view {
  height: calc(100vh - 120px); /* Account for header space */
}

.cytoscape-container {
  height: calc(100% - 80px); /* Account for header within this view */
  min-height: 600px;
}

.loading-overlay {
  z-index: 1000;
}

.zoom-controls {
  z-index: 100;
}

.graph-stats {
  z-index: 100;
}

/* Ensure proper responsive behavior */
@media (max-width: 768px) {
  .zoom-controls {
    position: fixed;
    top: auto;
    bottom: 20px;
    right: 20px;
  }
  
  .graph-stats {
    position: fixed;
    bottom: 20px;
    left: 20px;
    font-size: 12px;
  }
}
</style>