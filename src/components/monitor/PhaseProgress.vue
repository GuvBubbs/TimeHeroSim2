<!-- Phase Progress Widget - Game progression bar -->
<template>
  <BaseWidget title="Game Phase Progress" icon="fas fa-chart-line">
    <div class="space-y-2">
      <!-- Compact Phase Timeline -->
      <div class="flex items-center justify-between">
        <div class="flex-1">
                  <div class="flex justify-between text-xs text-sim-text-secondary mb-1">
          <span>Tutorial</span>
          <span>Early</span>
          <span>Mid</span>
          <span>Late</span>
          <span>End</span>
          <span>Post</span>
        </div>
          
          <!-- Progress Bar -->
          <div class="h-2 bg-sim-background rounded-full overflow-hidden">
            <div 
              class="h-full transition-all duration-1000 bg-gradient-to-r from-green-500 to-blue-500"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>
        </div>
        
        <!-- Compact Info -->
        <div class="ml-4 text-right">
          <div class="text-sm font-semibold">{{ currentPhase?.name || 'Tutorial' }}</div>
          <div class="text-xs text-sim-text-secondary">
            <span v-if="props.widgetPhaseProgress?.nextMilestone">{{ props.widgetPhaseProgress.nextMilestone }}</span>
            <span v-else>Day {{ gameState?.time.day || 0 }}</span>
            • {{ progressPercent.toFixed(1) }}%
          </div>
        </div>
      </div>
    </div>
  </BaseWidget>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseWidget from './BaseWidget.vue'
import type { GameState } from '@/types'

interface Props {
  gameState: GameState | null
  widgetPhaseProgress?: {
    currentPhase: string
    phaseProgress: number
    nextMilestone: string
    milestonesCompleted: string[]
    milestonesRemaining: string[]
    estimatedTimeToNext: number
  }
  widgetProgression?: {
    heroLevel: number
    experience: number
    farmStage: number
    farmPlots: number
    availablePlots: number
    currentPhase: string
    completedAdventures: string[]
    unlockedUpgrades: string[]
    unlockedAreas: string[]
  }
}

const props = defineProps<Props>()

// Game phases configuration (fallback)
const phaseNames = ['Tutorial', 'Early Game', 'Mid Game', 'Late Game', 'Endgame']

const currentPhase = computed(() => {
  if (props.widgetPhaseProgress?.currentPhase) {
    return { 
      name: props.widgetPhaseProgress.currentPhase,
      description: `Progress toward ${props.widgetPhaseProgress.nextMilestone}`
    }
  }
  
  if (props.widgetProgression?.currentPhase) {
    return { 
      name: props.widgetProgression.currentPhase,
      description: 'Upgrade-based progression'
    }
  }
  
  // Fallback to time-based for backwards compatibility
  if (props.gameState?.time.day <= 3) {
    return { name: 'Tutorial', description: 'Learning basic mechanics' }
  } else if (props.gameState?.time.day <= 10) {
    return { name: 'Early Game', description: 'Establishing farm and basic tools' }
  } else if (props.gameState?.time.day <= 20) {
    return { name: 'Mid Game', description: 'Expanding operations and combat' }
  } else if (props.gameState?.time.day <= 30) {
    return { name: 'Late Game', description: 'Advanced upgrades and optimization' }
  } else {
    return { name: 'Endgame', description: 'Final objectives and mastery' }
  }
})

const progressPercent = computed(() => {
  // Use milestone-based progress if available
  if (props.widgetPhaseProgress?.phaseProgress !== undefined) {
    return Math.max(0, Math.min(100, props.widgetPhaseProgress.phaseProgress))
  }
  
  // Fallback calculation based on farm plots (better than time-based)
  if (props.widgetProgression?.farmPlots) {
    const plots = props.widgetProgression.farmPlots
    if (plots <= 10) {
      return (plots / 10) * 25 // 0-25% for first 10 plots
    } else if (plots <= 30) {
      return 25 + ((plots - 10) / 20) * 25 // 25-50% for plots 11-30
    } else if (plots <= 60) {
      return 50 + ((plots - 30) / 30) * 25 // 50-75% for plots 31-60
    } else if (plots <= 90) {
      return 75 + ((plots - 60) / 30) * 25 // 75-100% for plots 61-90
    } else {
      return 100
    }
  }
  
  // Final fallback to time-based
  if (props.gameState?.time.day) {
    return Math.min((props.gameState.time.day / 35) * 100, 100)
  }
  
  return 0
})
</script>
