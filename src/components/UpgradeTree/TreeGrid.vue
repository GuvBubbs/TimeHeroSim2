<template>
  <div class="tree-grid-container">
    <!-- Swimlane labels (fixed position on left) -->
    <div class="swimlane-labels">
      <div 
        v-for="swimlane in swimlanes"
        :key="swimlane.id"
        class="swimlane-label"
        :style="getSwimlaneLabel(swimlane)"
      >
        {{ swimlane.label }}
      </div>
    </div>
    
    <!-- Scrollable grid area -->
    <div class="tree-grid-scroll">
      <div 
        class="tree-grid"
        :style="gridStyle"
        @click="handleBackgroundClick"
      >
        <!-- Swimlane backgrounds -->
        <div 
          v-for="swimlane in swimlanes"
          :key="`bg-${swimlane.id}`"
          class="swimlane-background"
          :style="getSwimlaneBackgroundStyle(swimlane)"
        />
        
        <!-- Tree nodes -->
        <TreeNodeComponent
          v-for="node in nodes"
          :key="node.id"
          :node="node"
          :highlighted="isNodeHighlighted(node.id)"
          :dimmed="isNodeDimmed(node.id)"
          :swimlane-color="getSwimlaneColor(node.swimlane)"
          :style="getNodeStyle(node)"
          @node-click="handleNodeClick(node)"
          @edit-click="handleEditClick(node)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TreeNode, Swimlane } from '@/types/upgrade-tree'
import TreeNodeComponent from './TreeNode.vue'

interface Props {
  nodes: TreeNode[]
  swimlanes: Swimlane[]
  gridConfig: any
  isNodeHighlighted: (id: string) => boolean
  isNodeDimmed: (id: string) => boolean
  getSwimlaneStartY: (swimlaneId: string) => number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'node-click': [node: TreeNode]
  'edit-click': [node: TreeNode]
  'background-click': []
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
      // Empty swimlane - minimal height
      totalHeight += props.gridConfig.swimlanePadding * 2 + props.gridConfig.rowHeight
    } else {
      // Find the maximum row number (could be fractional from spacing)
      const maxRow = Math.max(0, ...swimlaneNodes.map(n => n.row || 0))
      
      // Calculate height: (maxRow + 1) * row spacing + padding
      const rowSpace = (maxRow + 1) * (props.gridConfig.rowHeight + props.gridConfig.rowGap)
      const swimlaneHeight = rowSpace + (props.gridConfig.swimlanePadding * 2)
      totalHeight += swimlaneHeight
    }
  })
  
  // Add some bottom padding
  totalHeight += props.gridConfig.swimlanePadding
  
  return {
    width: `${totalWidth}px`,
    height: `${totalHeight}px`,
    position: 'relative' as const
  }
})

// Get style for individual nodes
function getNodeStyle(node: TreeNode) {
  if (node.column === undefined || node.row === undefined) {
    return { display: 'none' }
  }
  
  const x = props.gridConfig.labelWidth + 
           (node.column * (props.gridConfig.columnWidth + props.gridConfig.columnGap))
  const y = props.getSwimlaneStartY(node.swimlane) + 
           (node.row * (props.gridConfig.rowHeight + props.gridConfig.rowGap))
  
  return {
    position: 'absolute' as const,
    left: `${x}px`,
    top: `${y}px`,
    width: `${props.gridConfig.nodeWidth}px`,
    height: `${props.gridConfig.nodeHeight}px`,
    zIndex: 2
  }
}

// Get swimlane background style
function getSwimlaneBackgroundStyle(swimlane: Swimlane) {
  const startY = props.getSwimlaneStartY(swimlane.id)
  const swimlaneNodes = props.nodes.filter(n => n.swimlane === swimlane.id)
  
  let height: number
  if (swimlaneNodes.length === 0) {
    // Empty swimlane - minimal height
    height = props.gridConfig.swimlanePadding * 2 + props.gridConfig.rowHeight
  } else {
    // Calculate height based on actual row usage (matching store logic)
    const maxRow = Math.max(0, ...swimlaneNodes.map(n => n.row || 0))
    const rowSpace = (maxRow + 1) * (props.gridConfig.rowHeight + props.gridConfig.rowGap)
    height = rowSpace + (props.gridConfig.swimlanePadding * 2)
  }
  
  // Convert hex color to RGB for opacity
  const hex = swimlane.color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  return {
    position: 'absolute' as const,
    left: '0',
    top: `${startY - props.gridConfig.swimlanePadding}px`,
    width: '100%',
    height: `${height}px`,
    background: `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0.15), rgba(${r}, ${g}, ${b}, 0.05))`,
    borderLeft: `4px solid ${swimlane.color}`,
    zIndex: 0
  }
}

// Get swimlane label style
function getSwimlaneLabel(swimlane: Swimlane) {
  const startY = props.getSwimlaneStartY(swimlane.id)
  const swimlaneNodes = props.nodes.filter(n => n.swimlane === swimlane.id)
  
  let height: number
  if (swimlaneNodes.length === 0) {
    // Empty swimlane - minimal height
    height = props.gridConfig.swimlanePadding * 2 + props.gridConfig.rowHeight
  } else {
    // Calculate height based on actual row usage (matching store logic)
    const maxRow = Math.max(0, ...swimlaneNodes.map(n => n.row || 0))
    const rowSpace = (maxRow + 1) * (props.gridConfig.rowHeight + props.gridConfig.rowGap)
    height = rowSpace + (props.gridConfig.swimlanePadding * 2)
  }
  
  return {
    position: 'absolute' as const,
    left: '0',
    top: `${startY - props.gridConfig.swimlanePadding}px`,
    width: `${props.gridConfig.labelWidth}px`,
    height: `${height}px`,
    color: swimlane.color,
    borderRight: `1px solid rgba(255, 255, 255, 0.1)`,
    zIndex: 1
  }
}

// Get swimlane color for a swimlane ID
function getSwimlaneColor(swimlaneId: string): string {
  const swimlane = props.swimlanes.find(s => s.id === swimlaneId)
  return swimlane?.color || '#666'
}

// Event handlers
function handleNodeClick(node: TreeNode) {
  emit('node-click', node)
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
</script>

<style scoped>
.tree-grid-container {
  display: flex;
  height: 100%;
  width: 100%;
  position: relative;
  background: #1a1a1a; /* Dark background */
}

.swimlane-labels {
  flex-shrink: 0;
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  z-index: 3;
}

.swimlane-label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  text-align: center;
  padding: 0.5rem;
  writing-mode: horizontal-tb;
}

.tree-grid-scroll {
  flex: 1;
  overflow: auto;
  background: #1a1a1a;
}

.tree-grid {
  min-height: 100%;
  background: transparent;
}

.swimlane-background {
  pointer-events: none;
}

/* Show grid lines in development mode */
.show-grid .tree-grid::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
  pointer-events: none;
  z-index: 1;
}
</style>
