<template>
  <div 
    ref="nodeRef"
    class="tree-node"
    :class="nodeClasses"
    :style="nodeStyle"
    @click="$emit('node-click', $event)"
    @mouseenter="$emit('node-hover', true)"
    @mouseleave="$emit('node-hover', false)"
  >
    <!-- Title in center -->
    <div class="node-title">
      {{ node.name || 'NO NAME' }}
    </div>
    
    <!-- Depth indicator for indirect dependencies -->
    <div v-if="depthIndicator" class="depth-indicator depth-badge">
      {{ depthIndicator }}
    </div>
    
    <!-- Edit button centered -->
    <button 
      class="node-edit-btn"
      @click.stop="$emit('edit-click', node)"
      title="Edit"
    >
      <i class="fa fa-edit"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { TreeNode, HighlightState } from '@/types/upgrade-tree'

interface Props {
  node: TreeNode
  highlighted: boolean
  dimmed: boolean
  swimlaneColor: string
  highlightState?: HighlightState
  depth?: number
  connectionType?: 'prerequisite' | 'dependent'
}

const props = withDefaults(defineProps<Props>(), {
  highlightState: 'none',
  depth: 0
})

defineEmits<{
  'node-click': [event: MouseEvent]
  'edit-click': [node: TreeNode]
  'node-hover': [isHovering: boolean]
}>()

const nodeRef = ref<HTMLElement>()

// Enhanced node classes for different highlight states
const nodeClasses = computed(() => {
  const classes = []
  
  // Phase 5: Enhanced highlight states take precedence
  if (props.highlightState !== 'none') {
    classes.push(`highlight-${props.highlightState}`)
    
    // Connection type classes
    if (props.connectionType) {
      classes.push(`connection-${props.connectionType}`)
    }
    
    // Depth classes for staggered animations
    if (props.depth && props.depth > 0) {
      classes.push(`depth-${Math.min(props.depth, 5)}`) // Cap at depth-5
    }
  } else {
    // Legacy support only when new system is not active
    if (props.highlighted) classes.push('highlighted')
    if (props.dimmed) classes.push('dimmed')
  }
  
  return classes
})

// Enhanced depth indicator
const depthIndicator = computed(() => {
  if (props.highlightState === 'indirect' && props.depth && props.depth > 1) {
    // Prerequisites show negative depth (below selected node)
    // Dependents show positive depth (above selected node)
    const depthValue = props.connectionType === 'prerequisite' ? -props.depth : props.depth
    return depthValue < 0 ? `${depthValue}` : `+${depthValue}`
  }
  return null
})

// Enhanced node styling
const nodeStyle = computed(() => {
  const baseStyle: Record<string, string> = {
    '--node-color': props.swimlaneColor,
    '--animation-delay': `${(props.depth || 0) * 50}ms` // Staggered animation
  }
  
  // Border color logic
  if (props.highlightState === 'selected') {
    baseStyle.borderColor = '#fbbf24' // Gold for selected
  } else if (props.highlightState === 'direct') {
    baseStyle.borderColor = '#f59e0b' // Orange for direct dependencies
  } else if (props.highlightState === 'indirect') {
    baseStyle.borderColor = '#d97706' // Darker orange for indirect
  } else {
    baseStyle.borderColor = props.highlighted ? '#fbbf24' : props.swimlaneColor
  }
  
  return baseStyle
})
</script>

<style scoped>
.tree-node {
  background: white;
  border: 2px solid var(--node-color);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
  position: relative;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-sizing: border-box;
}

.tree-node:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px) scale(1.05);
  border-width: 3px;
}

.tree-node.highlighted {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-color: #fbbf24;
  border-color: #fbbf24 !important;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.6);
  z-index: 10;
}

/* Legacy dimmed state - only applies when enhanced highlights are NOT active */
.tree-node.dimmed:not(.highlight-selected):not(.highlight-direct):not(.highlight-indirect):not(.highlight-dimmed) {
  opacity: 0.5;
}

/* Phase 5: Enhanced Highlight States - These override legacy states */
.tree-node.highlight-selected {
  border-color: #fbbf24;
  background-color: #fffbeb;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  animation: pulseGold 2s infinite;
  border-color: #fbbf24 !important;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.6);
  z-index: 10;
  opacity: 1 !important; /* Override any other opacity rules */
}

.tree-node.highlight-direct {
  border-color: #fb923c;
  background-color: #fff7ed;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  animation: fadeInBounce 0.3s ease-out forwards;
  border-color: #f59e0b !important;
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.5);
  opacity: 1 !important; /* Override any other opacity rules */
}

.tree-node.highlight-indirect {
  border-color: #ea580c;
  background-color: #fffbf5;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  animation: fadeInBounce 0.3s ease-out forwards;
  border-color: #d97706 !important;
  box-shadow: 0 0 10px rgba(217, 119, 6, 0.4);
  opacity: 1 !important; /* Override any other opacity rules */
}

/* Dimmed state for Phase 5 highlight system - Override legacy dimmed */
.tree-node.highlight-dimmed {
  opacity: 0.6 !important; /* Increase base opacity */
  background-color: rgba(255, 255, 255, 0.9) !important; /* Ensure solid background */
}

/* Ensure text is highly visible in dimmed nodes */
.tree-node.highlight-dimmed .node-title {
  color: #000000 !important; /* Pure black for maximum contrast */
  font-weight: 700 !important; /* Extra bold */
  text-shadow: 0 0 1px rgba(255, 255, 255, 0.8) !important; /* White outline */
}

/* Make depth indicator more visible too */
.tree-node.highlight-dimmed .depth-indicator {
  color: #000000 !important;
  font-weight: 800 !important;
  background-color: rgba(255, 255, 255, 0.9) !important;
}

/* Connection Type Styling */
.tree-node.connection-prerequisite {
  box-shadow: -4px 0 8px rgba(251, 191, 36, 0.3);
}

.tree-node.connection-dependent {
  box-shadow: 4px 0 8px rgba(245, 158, 11, 0.3);
}

/* Depth-based Animation Delays */
.tree-node.depth-1 { animation-delay: calc(var(--animation-delay) + 0ms); }
.tree-node.depth-2 { animation-delay: calc(var(--animation-delay) + 50ms); }
.tree-node.depth-3 { animation-delay: calc(var(--animation-delay) + 100ms); }
.tree-node.depth-4 { animation-delay: calc(var(--animation-delay) + 150ms); }
.tree-node.depth-5 { animation-delay: calc(var(--animation-delay) + 200ms); }

.depth-indicator {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  background-color: #f97316;
  color: white;
  font-size: 10px;
  font-weight: bold;
  border-radius: 9999px;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  z-index: 10;
}

/* Depth Indicator Badge */
.depth-badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  background-color: #f97316;
  color: white;
  font-size: 10px;
  font-weight: bold;
  border-radius: 9999px;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  z-index: 10;
}

.node-title {
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #111827;
  flex: 1;
  width: 100%;
  /* Ensure text is always visible even in dimmed nodes */
  position: relative;
  z-index: 5;
}

/* Ensure text visibility in dimmed states */
.tree-node.highlight-dimmed .node-title {
  color: #374151 !important; /* Slightly lighter but still visible */
  font-weight: 600; /* Bolder to compensate for opacity */
}

.node-edit-btn {
  width: 24px;
  height: 24px;
  border-radius: 0.25rem;
  background: transparent;
  border: 1px solid rgba(107, 114, 128, 0.3);
  color: rgba(107, 114, 128, 0.6);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
}

.node-edit-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  border-color: rgba(59, 130, 246, 0.3);
}

/* Enhanced Animations */
@keyframes pulseGold {
  0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
  50% { box-shadow: 0 0 0 8px rgba(251, 191, 36, 0); }
}

@keyframes fadeInBounce {
  0% { 
    opacity: 0; 
    transform: scale(0.8) translateY(-10px);
  }
  60% { 
    opacity: 0.8; 
    transform: scale(1.05) translateY(2px);
  }
  100% { 
    opacity: 1; 
    transform: scale(1) translateY(0);
  }
}
</style>
