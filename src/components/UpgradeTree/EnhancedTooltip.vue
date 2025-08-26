/**
 * Enhanced Tooltip System for Phase 7
 * Rich contextual information and accessibility
 */
<template>
  <div
    v-if="visible"
    ref="tooltipRef"
    class="enhanced-tooltip"
    :class="tooltipClasses"
    :style="tooltipStyle"
    role="tooltip"
    :aria-describedby="tooltipId"
  >
    <!-- Header Section -->
    <div class="tooltip-header">
      <div class="node-icon-wrapper">
        <i 
          v-if="node.icon" 
          :class="node.icon" 
          :style="{ color: swimlaneColor }"
          class="node-icon"
        ></i>
        <div v-else class="default-icon" :style="{ backgroundColor: swimlaneColor }">
          {{ node.name.charAt(0).toUpperCase() }}
        </div>
      </div>
      
      <div class="header-content">
        <h3 class="node-name">{{ node.name }}</h3>
        <span class="node-type">{{ formatNodeType(node.type, node.category) }}</span>
      </div>
      
      <div class="swimlane-badge" :style="{ backgroundColor: swimlaneColor }">
        {{ swimlaneLabel }}
      </div>
    </div>

    <!-- Cost Section -->
    <div v-if="hasCosts" class="tooltip-section">
      <h4 class="section-title">
        <i class="fa fa-coins"></i>
        Costs
      </h4>
      
      <div class="cost-breakdown">
        <div v-if="node.cost.gold" class="cost-item">
          <i class="fa fa-coins cost-icon"></i>
          <span class="cost-amount">{{ formatNumber(node.cost.gold) }}</span>
          <span class="cost-label">gold</span>
        </div>
        
        <div v-if="node.cost.energy" class="cost-item">
          <i class="fa fa-bolt cost-icon"></i>
          <span class="cost-amount">{{ formatNumber(node.cost.energy) }}</span>
          <span class="cost-label">energy</span>
        </div>
        
        <div v-if="hasMaterials" class="materials-section">
          <div class="materials-grid">
            <div 
              v-for="(amount, material) in node.cost.materials" 
              :key="material" 
              class="material-item"
            >
              <i :class="getMaterialIcon(material)" class="material-icon"></i>
              <span class="material-name">{{ material }}</span>
              <span class="material-amount">x{{ formatNumber(amount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dependencies Section -->
    <div v-if="hasDependencies" class="tooltip-section">
      <h4 class="section-title">
        <i class="fa fa-project-diagram"></i>
        Dependencies
      </h4>
      
      <div class="dependency-info">
        <div v-if="prerequisiteCount > 0" class="dependency-stat">
          <div class="stat-header">
            <i class="fa fa-arrow-left"></i>
            <span>Prerequisites</span>
          </div>
          <div class="stat-value">{{ prerequisiteCount }}</div>
          <div v-if="prerequisiteCount <= 3" class="stat-details">
            <div 
              v-for="prereq in prerequisiteNames.slice(0, 3)" 
              :key="prereq" 
              class="dependency-name"
            >
              {{ prereq }}
            </div>
            <div v-if="prerequisiteCount > 3" class="more-indicator">
              +{{ prerequisiteCount - 3 }} more...
            </div>
          </div>
        </div>
        
        <div v-if="dependentCount > 0" class="dependency-stat">
          <div class="stat-header">
            <i class="fa fa-arrow-right"></i>
            <span>Dependents</span>
          </div>
          <div class="stat-value">{{ dependentCount }}</div>
          <div v-if="dependentCount <= 3" class="stat-details">
            <div 
              v-for="dependent in dependentNames.slice(0, 3)" 
              :key="dependent" 
              class="dependency-name"
            >
              {{ dependent }}
            </div>
            <div v-if="dependentCount > 3" class="more-indicator">
              +{{ dependentCount - 3 }} more...
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Effect Section -->
    <div v-if="node.effect" class="tooltip-section">
      <h4 class="section-title">
        <i class="fa fa-magic"></i>
        Effect
      </h4>
      <p class="effect-description">{{ node.effect }}</p>
    </div>

    <!-- Position Information (for debugging/power users) -->
    <div v-if="showDebugInfo" class="tooltip-section debug-section">
      <h4 class="section-title">
        <i class="fa fa-info-circle"></i>
        Debug Info
      </h4>
      <div class="debug-grid">
        <div class="debug-item">
          <span class="debug-label">Position:</span>
          <span class="debug-value">{{ node.column }}, {{ node.row }}</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">ID:</span>
          <span class="debug-value">{{ node.id }}</span>
        </div>
      </div>
    </div>

    <!-- Actions Section -->
    <div class="tooltip-actions">
      <div class="action-hints">
        <div class="action-hint">
          <kbd>Click</kbd>
          <span>Highlight dependencies</span>
        </div>
        <div class="action-hint">
          <kbd>E</kbd>
          <span>Edit node</span>
        </div>
        <div v-if="highlightMode" class="action-hint">
          <kbd>Esc</kbd>
          <span>Exit highlight</span>
        </div>
      </div>
    </div>

    <!-- Tooltip Arrow -->
    <div class="tooltip-arrow" :class="arrowPosition"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted } from 'vue'
import type { TreeNode } from '@/types/upgrade-tree'

interface Props {
  node: TreeNode
  visible: boolean
  position: { x: number; y: number }
  swimlaneColor: string
  swimlaneLabel: string
  prerequisiteCount?: number
  dependentCount?: number
  prerequisiteNames?: string[]
  dependentNames?: string[]
  highlightMode?: boolean
  showDebugInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  prerequisiteCount: 0,
  dependentCount: 0,
  prerequisiteNames: () => [],
  dependentNames: () => [],
  highlightMode: false,
  showDebugInfo: false
})

const tooltipRef = ref<HTMLElement>()
const tooltipId = `tooltip-${props.node.id}`

// Computed properties
const hasCosts = computed(() => {
  return props.node.cost.gold || props.node.cost.energy || hasMaterials.value
})

const hasMaterials = computed(() => {
  return props.node.cost.materials && Object.keys(props.node.cost.materials).length > 0
})

const hasDependencies = computed(() => {
  return props.prerequisiteCount > 0 || props.dependentCount > 0
})

const tooltipClasses = computed(() => {
  const classes = ['enhanced-tooltip']
  
  if (props.highlightMode) {
    classes.push('tooltip-highlight-mode')
  }
  
  return classes
})

// Positioning logic
const tooltipStyle = computed(() => {
  const style: Record<string, string> = {
    left: `${props.position.x}px`,
    top: `${props.position.y}px`,
    transform: 'translate(-50%, -100%)'
  }
  
  // Adjust position to stay in viewport
  if (props.position.x < 200) {
    style.transform = 'translate(0, -100%)'
  } else if (props.position.x > window.innerWidth - 200) {
    style.transform = 'translate(-100%, -100%)'
  }
  
  if (props.position.y < 100) {
    style.transform = style.transform.replace('-100%', '20px')
  }
  
  return style
})

const arrowPosition = computed(() => {
  if (props.position.x < 200) return 'arrow-left'
  if (props.position.x > window.innerWidth - 200) return 'arrow-right'
  return 'arrow-center'
})

// Helper functions
function formatNodeType(type: string, category: string): string {
  if (category && category !== type) {
    return `${type} - ${category}`
  }
  return type
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

function getMaterialIcon(material: string): string {
  const iconMap: Record<string, string> = {
    'Wood': 'fa fa-tree',
    'Stone': 'fa fa-cube',
    'Iron': 'fa fa-hammer',
    'Steel': 'fa fa-anvil',
    'Crystal': 'fa fa-gem',
    'Silver': 'fa fa-coins',
    'Gold': 'fa fa-crown',
    'Obsidian': 'fa fa-circle',
    'Mithril': 'fa fa-star',
    'Adamant': 'fa fa-shield-alt'
  }
  return iconMap[material] || 'fa fa-box'
}

// Accessibility
onMounted(() => {
  if (tooltipRef.value) {
    tooltipRef.value.setAttribute('id', tooltipId)
  }
})
</script>

<style scoped>
.enhanced-tooltip {
  @apply bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700;
  position: fixed;
  z-index: 1000;
  max-width: 320px;
  min-width: 280px;
  animation: tooltipFadeIn 0.2s ease-out;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -90%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1);
  }
}

.tooltip-header {
  @apply p-4 border-b border-gray-700 flex items-center gap-3;
}

.node-icon-wrapper {
  @apply flex-shrink-0;
}

.node-icon {
  @apply text-2xl;
}

.default-icon {
  @apply w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm;
}

.header-content {
  @apply flex-1 min-w-0;
}

.node-name {
  @apply text-lg font-semibold text-white truncate m-0;
}

.node-type {
  @apply text-sm text-gray-300;
}

.swimlane-badge {
  @apply px-2 py-1 rounded text-xs font-medium text-white flex-shrink-0;
}

.tooltip-section {
  @apply p-4 border-b border-gray-700 last:border-b-0;
}

.section-title {
  @apply flex items-center gap-2 text-sm font-semibold text-gray-200 mb-3 m-0;
}

.cost-breakdown {
  @apply space-y-2;
}

.cost-item {
  @apply flex items-center gap-2;
}

.cost-icon {
  @apply text-yellow-400 w-4;
}

.cost-amount {
  @apply font-bold text-white;
}

.cost-label {
  @apply text-gray-300 text-sm;
}

.materials-grid {
  @apply grid grid-cols-2 gap-2 mt-2;
}

.material-item {
  @apply flex items-center gap-2 p-2 bg-gray-800 rounded;
}

.material-icon {
  @apply text-blue-400 w-4;
}

.material-name {
  @apply text-sm text-gray-300 flex-1;
}

.material-amount {
  @apply text-sm font-bold text-white;
}

.dependency-info {
  @apply grid grid-cols-2 gap-4;
}

.dependency-stat {
  @apply space-y-2;
}

.stat-header {
  @apply flex items-center gap-1 text-sm text-gray-300;
}

.stat-value {
  @apply text-xl font-bold text-white;
}

.stat-details {
  @apply space-y-1;
}

.dependency-name {
  @apply text-xs text-gray-400 truncate;
}

.more-indicator {
  @apply text-xs text-gray-500 italic;
}

.effect-description {
  @apply text-sm text-gray-300 leading-relaxed m-0;
}

.debug-section {
  @apply bg-gray-800;
}

.debug-grid {
  @apply grid grid-cols-2 gap-2 text-xs;
}

.debug-item {
  @apply flex justify-between;
}

.debug-label {
  @apply text-gray-400;
}

.debug-value {
  @apply text-gray-200 font-mono;
}

.tooltip-actions {
  @apply p-3 bg-gray-800;
}

.action-hints {
  @apply space-y-1;
}

.action-hint {
  @apply flex items-center gap-2 text-xs text-gray-400;
}

kbd {
  @apply bg-gray-700 text-gray-200 px-1.5 py-0.5 rounded text-xs font-mono border border-gray-600;
}

/* Tooltip Arrow */
.tooltip-arrow {
  @apply absolute w-3 h-3 bg-gray-900 border-gray-700;
  bottom: -6px;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}

.tooltip-arrow.arrow-center {
  @apply left-1/2 transform -translate-x-1/2;
}

.tooltip-arrow.arrow-left {
  @apply left-4;
}

.tooltip-arrow.arrow-right {
  @apply right-4;
}

/* Highlight mode styling */
.tooltip-highlight-mode {
  @apply border-yellow-500;
}

.tooltip-highlight-mode .section-title {
  @apply text-yellow-200;
}
</style>
