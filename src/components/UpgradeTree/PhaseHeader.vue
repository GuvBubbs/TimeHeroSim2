<template>
  <div class="phase-header-wrapper">
    <!-- Sticky header row -->
    <div class="phase-header-row" :style="headerStyle">
      <div 
        v-for="phase in visiblePhases"
        :key="phase.id"
        class="phase-cell"
        :style="getPhaseCellStyle(phase)"
      >
        <span class="phase-name">{{ phase.name }}</span>
      </div>
    </div>
    
    <!-- Vertical boundary lines -->
    <svg class="phase-boundary-lines" :style="svgStyle">
      <line
        v-for="(boundary, index) in phaseBoundaries"
        :key="index"
        :x1="boundary"
        :y1="0"
        :x2="boundary"
        :y2="gridHeight"
        stroke="#000000"
        stroke-width="3"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GamePhase, GridConfig } from '@/types/upgrade-tree'

interface Props {
  phases: GamePhase[]
  gridConfig: GridConfig
  gridHeight: number
  focusMode: boolean
  visibleNodeColumns?: Set<number>
}

const props = defineProps<Props>()

// Calculate which phases are visible in focus mode
const visiblePhases = computed(() => {
  if (!props.focusMode) return props.phases
  
  // Only show phases that contain visible columns
  return props.phases.filter(phase => {
    if (!props.visibleNodeColumns) return true
    for (let col = phase.startColumn; col <= phase.endColumn; col++) {
      if (props.visibleNodeColumns.has(col)) return true
    }
    return false
  })
})

// Calculate x positions for phase boundaries
const phaseBoundaries = computed(() => {
  const boundaries: number[] = []
  
  visiblePhases.value.forEach((phase, index) => {
    // Add boundary at the start of each phase (except the first one)
    if (index > 0) {
      const x = phase.startColumn * (props.gridConfig.columnWidth + props.gridConfig.columnGap)
      boundaries.push(x)
    }
    // Add boundary at the end of each phase (except the last one)
    if (index < visiblePhases.value.length - 1) {
      const x = (phase.endColumn + 1) * (props.gridConfig.columnWidth + props.gridConfig.columnGap)
      boundaries.push(x)
    }
  })
  // Remove duplicates and sort
  const finalBoundaries = [...new Set(boundaries)].sort((a, b) => a - b)
  return finalBoundaries
})

// Calculate style for each phase cell
function getPhaseCellStyle(phase: GamePhase) {
  const startX = phase.startColumn * (props.gridConfig.columnWidth + props.gridConfig.columnGap)
  const endX = (phase.endColumn + 1) * (props.gridConfig.columnWidth + props.gridConfig.columnGap)
  const width = endX - startX
  
  // Get unique texture pattern for this phase
  const texturePattern = getPhaseTexture(phase.id)
  
  return {
    left: `${startX}px`,
    width: `${width}px`,
    backgroundImage: `linear-gradient(135deg, 
      rgba(30, 30, 35, 0.95) 0%, 
      rgba(40, 40, 45, 0.9) 50%, 
      rgba(30, 30, 35, 0.95) 100%), ${texturePattern}`
  }
}

// Get unique texture pattern for each phase
function getPhaseTexture(phaseId: string): string {
  const textures = {
    'tutorial': `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='10' cy='10' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
    'early-game': `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M15 5L20 15L15 25L10 15Z'/%3E%3C/g%3E%3C/svg%3E")`,
    'mid-game': `url("data:image/svg+xml,%3Csvg width='25' height='25' viewBox='0 0 25 25' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M5 5L20 5L20 20L5 20Z'/%3E%3C/g%3E%3C/svg%3E")`,
    'late-game': `url("data:image/svg+xml,%3Csvg width='35' height='35' viewBox='0 0 35 35' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M17.5 7L25 17.5L17.5 28L10 17.5Z M17.5 14L21 17.5L17.5 21L14 17.5Z'/%3E%3C/g%3E%3C/svg%3E")`,
    'endgame': `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M20 5L35 20L20 35L5 20Z M20 10L30 20L20 30L10 20Z'/%3E%3C/g%3E%3C/svg%3E")`,
    'post-game': `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M25 5L45 25L25 45L5 25Z M25 15L35 25L25 35L15 25Z M25 20L30 25L25 30L20 25Z'/%3E%3C/g%3E%3C/svg%3E")`
  }
  
  return textures[phaseId as keyof typeof textures] || textures['tutorial']
}

const headerStyle = computed(() => ({
  marginLeft: `${props.gridConfig.labelWidth}px`
}))

const svgStyle = computed(() => {
  // Calculate the total width needed to show all boundaries
  const maxBoundary = phaseBoundaries.value.length > 0 
    ? Math.max(...phaseBoundaries.value) 
    : 0
  
  // Add some padding to ensure all lines are visible
  const totalWidth = Math.max(maxBoundary + 500, 1000)
  
  
  return {
    left: `${props.gridConfig.labelWidth}px`,
    height: `${props.gridHeight}px`,
    width: `${totalWidth}px`
  }
})
</script>

<style scoped>
.phase-header-wrapper {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-background);
  height: 45px;
  margin-bottom: 0;
}

.phase-header-row {
  position: relative;
  height: 45px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.phase-cell {
  position: absolute;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-repeat: repeat;
}

.phase-name {
  font-weight: 700;
  font-size: 14px;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.phase-boundary-lines {
  position: absolute;
  top: 45px;
  left: 0;
  pointer-events: none;
  z-index: 5;
  overflow: visible;
}
</style>
