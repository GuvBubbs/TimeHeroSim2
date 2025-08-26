<template>
  <div class="swimlane-wrapper">
    <!-- Swimlane label (fixed position) -->
    <div 
      class="swimlane-label"
      :style="labelStyle"
    >
      {{ swimlane.label }}
    </div>
    
    <!-- Swimlane background -->
    <div 
      class="swimlane-background"
      :style="backgroundStyle"
    />
    
    <!-- Slot for nodes within this swimlane -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Swimlane, GridConfig } from '@/types/upgrade-tree'

interface Props {
  swimlane: Swimlane
  startY: number
  height: number
  gridConfig: GridConfig
}

const props = defineProps<Props>()

// Debug: Log when swimlanes are actually rendered
onMounted(() => {
})

// Compute label style
const labelStyle = computed(() => ({
  position: 'absolute' as const,
  left: '0',
  top: `${props.startY}px`,
  width: `${props.gridConfig.labelWidth}px`,
  height: `${props.height}px`,
  color: props.swimlane.color,
  borderRight: `1px solid rgba(255, 255, 255, 0.1)`,
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.875rem',
  fontWeight: '500',
  textAlign: 'center' as const,
  padding: '0 0.5rem',
  background: 'rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(4px)'
}))

// Compute background style with gradient
const backgroundStyle = computed(() => {
  // Convert hex color to RGB for opacity
  const hex = props.swimlane.color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  return {
    position: 'absolute' as const,
    left: '0',
    top: `${props.startY}px`,
    width: '100%',
    height: `${props.height}px`,
    background: `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0.15), rgba(${r}, ${g}, ${b}, 0.05))`,
    borderLeft: `4px solid ${props.swimlane.color}`,
    borderRadius: '0 0.5rem 0.5rem 0',
    zIndex: 0
  }
})
</script>

<style scoped>
.swimlane-wrapper {
  position: relative;
}

.swimlane-label {
  writing-mode: horizontal-tb;
  text-orientation: mixed;
  white-space: normal;
  word-wrap: break-word;
  hyphens: auto;
  line-height: 1.2;
  overflow-wrap: break-word;
}

.swimlane-background {
  pointer-events: none; /* Allow clicks to pass through to nodes */
}

@media (max-width: 768px) {
  .swimlane-label {
    font-size: 0.75rem;
    padding: 0 0.25rem;
  }
}
</style>
