<template>
  <svg 
    class="connection-layer" 
    :style="svgStyle"
    :viewBox="`0 0 ${totalWidth} ${totalHeight}`"
  >
    <!-- Arrow marker definitions -->
    <defs>
      <marker
        id="arrowhead"
        markerWidth="6"
        markerHeight="5" 
        refX="5"
        refY="2.5"
        orient="auto"
      >
        <polygon
          points="0 0, 6 2.5, 0 5"
          :fill="defaultArrowColor"
        />
      </marker>
      
      <!-- Highlighted arrow marker -->
      <marker
        id="arrowhead-highlighted"
        markerWidth="6"
        markerHeight="5"
        refX="5"
        refY="2.5"
        orient="auto"
      >
        <polygon
          points="0 0, 6 2.5, 0 5"
          fill="#fbbf24"
        />
      </marker>
      
      <!-- Swimlane-specific arrow markers -->
      <marker
        v-for="swimlane in swimlanes"
        :key="`arrow-${swimlane.id}`"
        :id="`arrowhead-${swimlane.id}`"
        markerWidth="6"
        markerHeight="5"
        refX="5"
        refY="2.5"
        orient="auto"
      >
        <polygon
          points="0 0, 6 2.5, 0 5"
          :fill="swimlane.color"
        />
      </marker>
    </defs>

    <!-- Connection paths -->
    <path
      v-for="connection in visibleConnections"
      :key="`${connection.from}-${connection.to}`"
      :d="getConnectionPath(connection)"
      :class="getConnectionClasses(connection)"
      :stroke="getConnectionColor(connection)"
      :stroke-width="getConnectionWidth(connection)"
      :marker-end="getMarkerEnd(connection)"
      fill="none"
      @mouseenter="handleConnectionHover(connection, true)"
      @mouseleave="handleConnectionHover(connection, false)"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Connection, TreeNode, Swimlane, GridConfig } from '@/types/upgrade-tree'

interface Props {
  connections: Connection[]
  nodes: TreeNode[]
  nodePositions: Map<string, { x: number; y: number; swimlane: string }>
  swimlanes: Swimlane[]
  gridConfig: GridConfig
  totalWidth: number
  totalHeight: number
  highlightMode: boolean
  highlightedNodes: Set<string>
  getSwimlaneStartY: (swimlaneId: string) => number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'connection-hover': [connection: Connection, isHovering: boolean]
}>()

// Constants
const defaultArrowColor = '#666'

// SVG positioning to match the grid
const svgStyle = computed(() => ({
  position: 'absolute' as const,
  top: '0',
  left: '0',
  width: `${props.totalWidth}px`,
  height: `${props.totalHeight}px`,
  zIndex: 1, // Behind nodes (z-index 2) but above swimlane backgrounds
  pointerEvents: 'auto' as const
}))

// Filter connections based on highlight mode
const visibleConnections = computed(() => {
  if (!props.highlightMode) {
    // Normal mode: only show within-swimlane connections
    return props.connections.filter(connection => {
      const fromNode = props.nodes.find(n => n.id === connection.from)
      const toNode = props.nodes.find(n => n.id === connection.to)
      return fromNode && toNode && fromNode.swimlane === toNode.swimlane
    })
  } else {
    // Highlight mode: show all connections between highlighted nodes
    return props.connections.filter(connection => {
      return props.highlightedNodes.has(connection.from) && 
             props.highlightedNodes.has(connection.to)
    })
  }
})

// Get connection points for nodes (right side for source, left side for target)
function getNodeConnectionPoints(nodeId: string): { center: { x: number; y: number }, left: { x: number; y: number }, right: { x: number; y: number } } | null {
  const node = props.nodes.find(n => n.id === nodeId)
  if (!node || node.column === undefined || node.row === undefined) {
    return null
  }

  // Use the same positioning logic as TreeGrid
  const baseX = props.gridConfig.labelWidth + 
               (node.column * (props.gridConfig.columnWidth + props.gridConfig.columnGap))
  const baseY = props.getSwimlaneStartY(node.swimlane) + 
               (node.row * (props.gridConfig.rowHeight + props.gridConfig.rowGap))

  // Apply the same centering offsets as TreeGrid
  const centerOffsetX = (props.gridConfig.columnWidth - props.gridConfig.nodeWidth) / 2 + 16
  const centerOffsetY = (props.gridConfig.rowHeight - props.gridConfig.nodeHeight) / 2 + 5

  // Calculate node boundaries
  const nodeLeft = baseX + centerOffsetX
  const nodeRight = nodeLeft + props.gridConfig.nodeWidth
  const nodeTop = baseY + centerOffsetY
  const nodeBottom = nodeTop + props.gridConfig.nodeHeight
  const nodeVCenter = nodeTop + (props.gridConfig.nodeHeight / 2)

  return {
    center: { x: nodeLeft + (props.gridConfig.nodeWidth / 2), y: nodeVCenter },
    left: { x: nodeLeft, y: nodeVCenter },
    right: { x: nodeRight, y: nodeVCenter }
  }
}

// Generate SVG path for connection
function getConnectionPath(connection: Connection): string {
  const fromPoints = getNodeConnectionPoints(connection.from)
  const toPoints = getNodeConnectionPoints(connection.to)

  if (!fromPoints || !toPoints) {
    return ''
  }

  // Use right edge of source node and left edge of target node
  const from = fromPoints.right
  const to = toPoints.left

  const fromNode = props.nodes.find(n => n.id === connection.from)
  const toNode = props.nodes.find(n => n.id === connection.to)

  if (!fromNode || !toNode) {
    return ''
  }

  // Determine connection type
  const isCrossSwimlane = fromNode.swimlane !== toNode.swimlane
  
  if (isCrossSwimlane) {
    return getCrossSwimlaneePath(from, to)
  } else {
    return getWithinSwimlanePath(from, to)
  }
}

// Generate path for within-swimlane connections (simple horizontal with small curves)
function getWithinSwimlanePath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const arrowPadding = 6 // Reduced padding for smaller arrows

  // Adjust end point to account for arrow padding
  const adjustedTo = {
    x: to.x - arrowPadding,
    y: to.y
  }

  // If nodes are on the same row, use simple horizontal line
  if (Math.abs(from.y - adjustedTo.y) < 5) {
    return `M ${from.x} ${from.y} L ${adjustedTo.x} ${adjustedTo.y}`
  }

  // For different rows, use L-shaped path with rounded corners
  const midX = from.x + (adjustedTo.x - from.x) * 0.7 // 70% of the way horizontally
  const cornerRadius = props.gridConfig.cornerRadius

  if (cornerRadius > 0) {
    // Rounded corner path
    const path = []
    path.push(`M ${from.x} ${from.y}`)
    
    if (from.x < midX - cornerRadius) {
      path.push(`L ${midX - cornerRadius} ${from.y}`)
      path.push(`Q ${midX} ${from.y} ${midX} ${from.y + Math.sign(adjustedTo.y - from.y) * cornerRadius}`)
    } else {
      path.push(`L ${midX} ${from.y}`)
    }
    
    if (Math.abs(adjustedTo.y - from.y) > 2 * cornerRadius) {
      path.push(`L ${midX} ${adjustedTo.y - Math.sign(adjustedTo.y - from.y) * cornerRadius}`)
      path.push(`Q ${midX} ${adjustedTo.y} ${midX + cornerRadius} ${adjustedTo.y}`)
    } else {
      path.push(`L ${midX} ${adjustedTo.y}`)
    }
    
    path.push(`L ${adjustedTo.x} ${adjustedTo.y}`)
    return path.join(' ')
  } else {
    // Sharp corner path
    return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${adjustedTo.y} L ${adjustedTo.x} ${adjustedTo.y}`
  }
}

// Generate path for cross-swimlane connections (elegant bezier curves)
function getCrossSwimlaneePath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const arrowPadding = 6 // Reduced padding for smaller arrows

  // Adjust end point to account for arrow padding
  const adjustedTo = {
    x: to.x - arrowPadding,
    y: to.y
  }

  // Calculate control points for smooth curve
  const deltaX = adjustedTo.x - from.x
  const deltaY = adjustedTo.y - from.y
  
  // Control points for bezier curve
  const cp1x = from.x + deltaX * 0.5
  const cp1y = from.y
  const cp2x = from.x + deltaX * 0.5
  const cp2y = adjustedTo.y

  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${adjustedTo.x} ${adjustedTo.y}`
}

// Get CSS classes for connection
function getConnectionClasses(connection: Connection): string {
  const classes = ['connection-line']
  
  if (connection.highlighted || 
      (props.highlightMode && props.highlightedNodes.has(connection.from) && props.highlightedNodes.has(connection.to))) {
    classes.push('highlighted')
  }

  const fromNode = props.nodes.find(n => n.id === connection.from)
  const toNode = props.nodes.find(n => n.id === connection.to)
  
  if (fromNode && toNode) {
    if (fromNode.swimlane !== toNode.swimlane) {
      classes.push('cross-swimlane')
    } else {
      classes.push('within-swimlane')
    }
  }

  return classes.join(' ')
}

// Get connection color
function getConnectionColor(connection: Connection): string {
  if (connection.highlighted || 
      (props.highlightMode && props.highlightedNodes.has(connection.from) && props.highlightedNodes.has(connection.to))) {
    return '#fbbf24' // Gold for highlighted
  }

  // Use source node's swimlane color
  const fromNode = props.nodes.find(n => n.id === connection.from)
  if (fromNode) {
    const swimlane = props.swimlanes.find(s => s.id === fromNode.swimlane)
    return swimlane?.color || defaultArrowColor
  }

  return defaultArrowColor
}

// Get connection stroke width
function getConnectionWidth(connection: Connection): number {
  if (connection.highlighted || 
      (props.highlightMode && props.highlightedNodes.has(connection.from) && props.highlightedNodes.has(connection.to))) {
    return 3
  }
  return 2
}

// Get marker end for arrow
function getMarkerEnd(connection: Connection): string {
  if (connection.highlighted || 
      (props.highlightMode && props.highlightedNodes.has(connection.from) && props.highlightedNodes.has(connection.to))) {
    return 'url(#arrowhead-highlighted)'
  }

  // Use swimlane-specific arrow
  const fromNode = props.nodes.find(n => n.id === connection.from)
  if (fromNode) {
    return `url(#arrowhead-${fromNode.swimlane})`
  }

  return 'url(#arrowhead)'
}

// Handle connection hover
function handleConnectionHover(connection: Connection, isHovering: boolean) {
  emit('connection-hover', connection, isHovering)
}
</script>

<style scoped>
.connection-layer {
  pointer-events: none; /* Allow clicks to pass through to grid */
}

.connection-line {
  transition: all 0.2s ease;
  opacity: 0.6;
  pointer-events: auto; /* Allow hover on connection lines */
  cursor: pointer;
}

.connection-line.highlighted {
  opacity: 1;
  stroke-width: 3;
}

.connection-line.cross-swimlane {
  opacity: 0.4; /* Slightly more subdued for cross-swimlane in normal mode */
}

.connection-line.within-swimlane {
  opacity: 0.7;
}

.connection-line:hover {
  opacity: 1;
  stroke-width: 3;
}

/* Hide cross-swimlane connections in normal mode */
.connection-line.cross-swimlane:not(.highlighted) {
  opacity: 0;
  pointer-events: none;
}
</style>
