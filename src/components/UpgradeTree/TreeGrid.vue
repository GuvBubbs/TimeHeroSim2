<template>
  <div class="tree-grid-container">
    <!-- Scrollable grid area -->
    <div class="tree-grid-scroll">
      <div 
        class="tree-grid"
        :style="gridStyle"
        @click="handleBackgroundClick"
      >
        <!-- Grid lines -->
        <div class="grid-lines">
          <!-- Vertical lines -->
          <div 
            v-for="col in maxColumns"
            :key="`col-${col}`"
            class="grid-line-vertical"
            :style="getVerticalLineStyle(col)"
          />
          <!-- Horizontal lines -->
          <div 
            v-for="(line, index) in horizontalLines"
            :key="`row-${index}`"
            class="grid-line-horizontal"
            :style="line"
          />
        </div>
        <!-- Swimlanes -->
        <SwimLaneComponent
          v-for="swimlane in swimlanes"
          :key="swimlane.id"
          :swimlane="swimlane"
          :start-y="getSwimlaneStartY(swimlane.id)"
          :height="getSwimlaneHeight(swimlane)"
          :grid-config="gridConfig"
        />
        
        <!-- Connection Layer (SVG arrows) -->
        <ConnectionLayerComponent
          :connections="connections"
          :nodes="nodes"
          :node-positions="nodePositions"
          :swimlanes="swimlanes"
          :grid-config="gridConfig"
          :total-width="parseInt(gridStyle.width?.toString() || '0')"
          :total-height="parseInt(gridStyle.height?.toString() || '0')"
          :highlight-mode="highlightMode"
          :highlighted-nodes="highlightedNodes"
          :get-swimlane-start-y="getSwimlaneStartY"
          :get-connection-depth="getConnectionDepth"
          :is-connection-highlighted="isConnectionHighlighted"
          @connection-hover="handleConnectionHover"
          @connection-click="handleConnectionClick"
        />
        
        <!-- Tree nodes -->
        <TreeNodeComponent
          v-for="node in nodes"
          :key="node.id"
          :node="node"
          :highlighted="isNodeHighlighted(node.id)"
          :dimmed="isNodeDimmed(node.id)"
          :swimlane-color="getSwimlaneColor(node.swimlane)"
          :highlight-state="(getNodeHighlightState ? getNodeHighlightState(node.id) : 'none') as any"
          :depth="getNodeDepth ? getNodeDepth(node.id) : 0"
          :connection-type="getNodeConnectionType ? getNodeConnectionType(node.id) : undefined"
          :style="getNodeStyle(node)"
          @node-click="handleNodeClick(node, $event)"
          @edit-click="handleEditClick(node)"
          @node-hover="handleNodeHover(node, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TreeNode, Swimlane, Connection } from '@/types/upgrade-tree'
import TreeNodeComponent from '@/components/UpgradeTree/TreeNode.vue'
import SwimLaneComponent from '@/components/UpgradeTree/SwimLane.vue'
import ConnectionLayerComponent from '@/components/UpgradeTree/ConnectionLayer.vue'

interface Props {
  nodes: TreeNode[]
  connections: Connection[]
  swimlanes: Swimlane[]
  gridConfig: any
  nodePositions: Map<string, { x: number; y: number; swimlane: string }>
  highlightMode: boolean
  highlightedNodes: Set<string>
  isNodeHighlighted: (id: string) => boolean
  isNodeDimmed: (id: string) => boolean
  getSwimlaneStartY: (swimlaneId: string) => number
  // Phase 5: Enhanced functions
  nodeHighlightInfo?: Map<string, any>
  getNodeHighlightState?: (id: string) => string
  getNodeDepth?: (id: string) => number
  getNodeConnectionType?: (id: string) => 'prerequisite' | 'dependent' | undefined
  getConnectionDepth?: (connection: Connection) => number
  isConnectionHighlighted?: (connection: Connection) => boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'node-click': [node: TreeNode, event: MouseEvent]
  'edit-click': [node: TreeNode]
  'background-click': []
  'connection-hover': [connection: Connection, isHovering: boolean]
  'connection-click': [connection: Connection]
  'node-hover': [node: TreeNode, isHovering: boolean]
}>()

// Calculate total grid dimensions
const gridStyle = computed(() => {
  const maxColumn = Math.max(0, ...props.nodes.map(n => n.column || 0))
  const totalWidth = props.gridConfig.labelWidth + 
                    (maxColumn + 2) * (props.gridConfig.columnWidth + props.gridConfig.columnGap) // +2 for padding
  
  // Calculate total height by adding up all swimlane heights (matching store logic)
  let totalHeight = 0
  props.swimlanes.forEach(swimlane => {
    const swimlaneNodes = props.nodes.filter(n => n.swimlane === swimlane.id)
    
    if (swimlaneNodes.length === 0) {
      // Empty swimlane - use zero height to eliminate gaps
      // totalHeight += 0 (no need to add anything)
    } else {
      // Find the maximum row number (could be fractional from spacing)
      const maxRow = Math.max(0, ...swimlaneNodes.map(n => n.row || 0))
      
      // Calculate height: (maxRow + 1) * row spacing (no extra padding)
      const rowSpace = (maxRow + 1) * (props.gridConfig.rowHeight + props.gridConfig.rowGap)
      totalHeight += rowSpace
    }
  })
  
  // Add minimal bottom padding
  totalHeight += props.gridConfig.rowGap
  
  return {
    width: `${totalWidth}px`,
    height: `${totalHeight}px`,
    position: 'relative' as const
  }
})

// Generate aligned grid lines
const maxColumns = computed(() => {
  return Math.max(0, ...props.nodes.map(n => n.column || 0)) + 2
})

const horizontalLines = computed(() => {
  const lines: Array<{ top: string; left: string; width: string; height: string }> = []
  
  // Create regular grid lines instead of swimlane-based lines
  const totalGridHeight = parseInt(gridStyle.value.height?.toString() || '0')
  const lineSpacing = props.gridConfig.rowHeight + props.gridConfig.rowGap // 60px
  
  for (let y = 0; y < totalGridHeight; y += lineSpacing) {
    lines.push({
      top: `${y}px`,
      left: '0',
      width: '100%',
      height: '1px'
    })
  }
  
  return lines
})

function getVerticalLineStyle(col: number) {
  const x = props.gridConfig.labelWidth + (col * (props.gridConfig.columnWidth + props.gridConfig.columnGap))
  return {
    position: 'absolute' as const,
    top: '0',
    left: `${x}px`,
    width: '1px',
    height: '100%'
  }
}

// Get style for individual nodes
function getNodeStyle(node: TreeNode) {
  if (node.column === undefined || node.row === undefined) {
    return { display: 'none' }
  }
  
  // Calculate base grid position
  const baseX = props.gridConfig.labelWidth + 
               (node.column * (props.gridConfig.columnWidth + props.gridConfig.columnGap))
  const baseY = props.getSwimlaneStartY(node.swimlane) + 
               (node.row * (props.gridConfig.rowHeight + props.gridConfig.rowGap))
  
  // Add centering offsets to position node in center of grid cell
  // Grid cell is 220px wide, node is 180px wide
  // But we need to center the VISUAL CONTENT, not just the box
  // The visual content is offset by padding (8px) from the box edges
  const centerOffsetX = (props.gridConfig.columnWidth - props.gridConfig.nodeWidth) / 2 + 16 // Fine-tuned for perfect horizontal centering
  const centerOffsetY = (props.gridConfig.rowHeight - props.gridConfig.nodeHeight) / 2 + 5 // Fine-tuned for perfect vertical centering
  
  const x = baseX + centerOffsetX
  const y = baseY + centerOffsetY

  return {
    position: 'absolute' as const,
    left: `${x}px`,
    top: `${y}px`,
    width: `${props.gridConfig.nodeWidth}px`,
    height: `${props.gridConfig.nodeHeight}px`,
    zIndex: 2
  }
}

// Get swimlane height
function getSwimlaneHeight(swimlane: Swimlane): number {
  const swimlaneNodes = props.nodes.filter(n => n.swimlane === swimlane.id)
  
  if (swimlaneNodes.length === 0) {
    // Empty swimlane - use zero height to eliminate gaps
    return 0
  } else {
    // Calculate height based on actual row usage (matching store logic)
    const maxRow = Math.max(0, ...swimlaneNodes.map(n => n.row || 0))
    const rowSpace = (maxRow + 1) * (props.gridConfig.rowHeight + props.gridConfig.rowGap)
    return rowSpace
  }
}

// Get swimlane color for a swimlane ID
// Get swimlane color for a node
function getSwimlaneColor(swimlaneId: string): string {
  const swimlane = props.swimlanes.find(s => s.id === swimlaneId)
  return swimlane?.color || '#666'
}

// Get node depth from highlight info
function getNodeDepth(nodeId: string): number {
  if (props.nodeHighlightInfo) {
    const info = props.nodeHighlightInfo.get(nodeId)
    return info?.depth || 0
  }
  return 0
}

// Get node connection type from highlight info
function getNodeConnectionType(nodeId: string): 'prerequisite' | 'dependent' | undefined {
  if (props.nodeHighlightInfo) {
    const info = props.nodeHighlightInfo.get(nodeId)
    return info?.connectionType
  }
  return undefined
}

// Event handlers
function handleNodeClick(node: TreeNode, event: MouseEvent) {
  emit('node-click', node, event)
}

function handleEditClick(node: TreeNode) {
  emit('edit-click', node)
}

function handleBackgroundClick(event: MouseEvent) {
  // Only if clicking on the grid background itself
  if ((event.target as HTMLElement).classList.contains('tree-grid')) {
    emit('background-click')
  }
}

function handleConnectionHover(connection: Connection, isHovering: boolean) {
  emit('connection-hover', connection, isHovering)
}

function handleConnectionClick(connection: Connection) {
  emit('connection-click', connection)
}

function handleNodeHover(node: TreeNode, isHovering: boolean) {
  emit('node-hover', node, isHovering)
}
</script>

<style scoped>
.tree-grid-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #1a1a1a; /* Dark background */
}

.tree-grid-scroll {
  flex: 1;
  overflow: auto;
  background: #1a1a1a;
}

.tree-grid {
  min-height: 100%;
  background: transparent;
  position: relative;
}

.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.grid-line-vertical {
  position: absolute;
  background: rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

.grid-line-horizontal {
  position: absolute;
  background: rgba(255, 255, 255, 0.03);
  pointer-events: none;
}
</style>
