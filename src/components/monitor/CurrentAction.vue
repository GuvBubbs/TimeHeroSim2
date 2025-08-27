<!-- Current Action Widget - Active action with progress -->
<template>
  <BaseWidget title="Current Action" icon="fas fa-play-circle">
    <div class="space-y-4">
      <!-- Current Action Display -->
      <div v-if="currentAction" class="bg-sim-background rounded p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center">
            <i :class="getActionIcon(currentAction.type)" class="text-lg mr-3"></i>
            <div>
              <div class="font-semibold">{{ formatActionName((currentAction as any).name || currentAction.id) }}</div>
              <div class="text-sm text-sim-text-secondary">{{ currentAction.type }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm text-sim-text-secondary">Progress</div>
            <div class="font-mono">{{ progress.toFixed(0) }}%</div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-sim-background-darker rounded-full h-3 mb-3">
          <div 
            class="h-3 rounded-full transition-all duration-1000"
            :class="getProgressColor(currentAction.type)"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>

        <!-- Action Details - Horizontal Layout -->
        <div class="flex gap-3 text-xs">
          <div class="flex-1 bg-sim-background-darker rounded p-2 text-center">
            <div class="text-sim-text-secondary">Duration</div>
            <div class="font-mono text-sm">{{ formatDuration(currentAction.duration) }}</div>
          </div>
          <div class="flex-1 bg-sim-background-darker rounded p-2 text-center">
            <div class="text-sim-text-secondary">Remaining</div>
            <div class="font-mono text-sm">{{ formatDuration(timeRemaining) }}</div>
          </div>
          <div v-if="currentAction.energyCost" class="flex-1 bg-sim-background-darker rounded p-2 text-center">
            <div class="text-sim-text-secondary">Energy</div>
            <div class="font-mono text-sm text-yellow-400">{{ currentAction.energyCost }}</div>
          </div>
          <div v-if="(currentAction as any).expectedGain" class="flex-1 bg-sim-background-darker rounded p-2 text-center">
            <div class="text-sim-text-secondary">Gain</div>
            <div class="font-mono text-sm text-green-400">{{ (currentAction as any).expectedGain }}</div>
          </div>
        </div>

        <!-- Location/Target Info -->
        <div v-if="currentAction.target" class="mt-3 pt-3 border-t border-sim-border">
          <div class="text-sm">
            <span class="text-sim-text-secondary">Target:</span>
            <span class="ml-2">{{ currentAction.target }}</span>
          </div>
        </div>
      </div>

      <!-- No Action State -->
      <div v-else class="bg-sim-background rounded p-4 text-center">
        <i class="fas fa-pause-circle text-3xl text-sim-text-secondary mb-3 block"></i>
        <div class="text-sim-text-secondary">No active action</div>
        <div class="text-xs text-sim-text-secondary mt-1">
          Waiting for next decision or player input
        </div>
      </div>

      <!-- Next Action Preview -->
      <div v-if="nextAction" class="bg-sim-background rounded p-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <i :class="getActionIcon(nextAction.type)" class="text-sm mr-2 text-sim-text-secondary"></i>
            <div>
              <div class="text-sm font-medium">Next: {{ formatActionName((nextAction as any).name || nextAction.id) }}</div>
              <div class="text-xs text-sim-text-secondary">
                Score: {{ nextAction.score?.toFixed(1) || 'N/A' }}
              </div>
            </div>
          </div>
          <div class="text-xs text-sim-text-secondary">
            {{ (nextAction as any).reason || 'Queued' }}
          </div>
        </div>
      </div>
    </div>
  </BaseWidget>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseWidget from './BaseWidget.vue'
import type { GameState, GameAction } from '@/types'

interface Props {
  gameState: GameState | null
  currentAction?: GameAction | null
  nextAction?: GameAction | null
}

const props = defineProps<Props>()

// Real current action from simulation state
const currentAction = computed(() => {
  // First priority: use explicitly passed action
  if (props.currentAction) return props.currentAction
  
  // Second priority: derive from game state (ongoing processes)
  if (props.gameState) {
    // Check for ongoing adventure
    if (props.gameState.processes.adventure && !props.gameState.processes.adventure.isComplete) {
      const adventure = props.gameState.processes.adventure
      return {
        id: adventure.adventureId,
        type: 'adventure',
        name: adventure.adventureId,
        duration: adventure.duration * 60, // Convert minutes to seconds for UI
        target: adventure.adventureId,
        startTime: adventure.startedAt * 60 * 1000, // Convert to milliseconds
        progress: adventure.progress * 100,
        expectedRewards: adventure.rewards
      }
    }
    
    // Check for ongoing crafting
    if (props.gameState.processes.crafting && props.gameState.processes.crafting.length > 0) {
      const crafting = props.gameState.processes.crafting[0] // First in queue
      return {
        id: crafting.itemId,
        type: 'craft',
        name: crafting.itemId,
        duration: crafting.duration * 60, // Convert minutes to seconds
        target: crafting.itemId,
        startTime: crafting.startedAt * 60 * 1000, // Convert to milliseconds  
        progress: crafting.progress * 100
      }
    }
    
    // Check for ongoing mining
    if (props.gameState.processes.mining && props.gameState.processes.mining.isActive) {
      const mining = props.gameState.processes.mining
      return {
        id: 'mining',
        type: 'mine',
        name: `mining_depth_${mining.depth}`,
        target: `Depth ${mining.depth}`,
        energyCost: mining.energyDrain,
        duration: 0, // Mining is continuous
        progress: 0 // Continuous activity
      }
    }
  }
  
  return null
})

const nextAction = computed(() => {
  // Use explicitly passed next action if available
  if (props.nextAction) return props.nextAction
  
  // For now, return null - real next action would come from simulation engine's decision queue
  // TODO: Integrate with simulation engine's decision preview system
  return null
})

const progress = computed(() => {
  if (!currentAction.value) return 0
  
  // If action already has progress (from ongoing processes), use it
  if ((currentAction.value as any).progress !== undefined) {
    return (currentAction.value as any).progress
  }
  
  // Calculate progress from start time and duration
  if ((currentAction.value as any).startTime && currentAction.value.duration) {
    const elapsed = Date.now() - (currentAction.value as any).startTime
    const duration = (currentAction.value.duration || 0) * 1000 // Convert to milliseconds
    return Math.min((elapsed / duration) * 100, 100)
  }
  
  return 0
})

const timeRemaining = computed(() => {
  if (!currentAction.value) return 0
  
  // For ongoing processes that have progress, calculate from progress
  if ((currentAction.value as any).progress !== undefined) {
    const progressPercent = (currentAction.value as any).progress / 100
    const totalDuration = currentAction.value.duration || 0
    return totalDuration * (1 - progressPercent)
  }
  
  // Calculate from start time
  if ((currentAction.value as any).startTime && currentAction.value.duration) {
    const elapsed = (Date.now() - (currentAction.value as any).startTime) / 1000
    const remaining = (currentAction.value.duration || 0) - elapsed
    return Math.max(remaining, 0)
  }
  
  return 0
})

const getActionIcon = (type: string): string => {
  const icons: Record<string, string> = {
    plant: 'fas fa-seedling text-green-400',
    water: 'fas fa-tint text-blue-400', 
    harvest: 'fas fa-cut text-yellow-400',
    craft: 'fas fa-hammer text-orange-400',
    buy: 'fas fa-shopping-cart text-purple-400',
    sell: 'fas fa-coins text-yellow-500',
    travel: 'fas fa-route text-gray-400',
    combat: 'fas fa-sword text-red-400',
    mine: 'fas fa-mountain text-gray-500',
    upgrade: 'fas fa-arrow-up text-blue-500'
  }
  return icons[type] || 'fas fa-question text-gray-400'
}

const getProgressColor = (type: string): string => {
  const colors: Record<string, string> = {
    plant: 'bg-green-500',
    water: 'bg-blue-500',
    harvest: 'bg-yellow-500',
    craft: 'bg-orange-500',
    buy: 'bg-purple-500',
    sell: 'bg-yellow-600',
    travel: 'bg-gray-500',
    combat: 'bg-red-500',
    mine: 'bg-gray-600',
    upgrade: 'bg-blue-600'
  }
  return colors[type] || 'bg-gray-500'
}

const formatActionName = (name: string): string => {
  return name.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}
</script>
