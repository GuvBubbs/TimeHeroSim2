<!-- Next Decision Widget - AI Decision Preview -->
<template>
  <BaseWidget title="Next Decision" icon="fas fa-brain">
    <div class="space-y-3">
      <!-- Next Action -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex items-center justify-between mb-2">
          <span class="flex items-center text-sm">
            <i class="fas fa-forward text-blue-400 mr-2"></i>
            Next Action
          </span>
        </div>
        <div v-if="nextDecision" class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <i :class="getActionIcon(nextDecision.action)" class="mr-2"></i>
              <span class="font-medium">{{ formatActionName(nextDecision.action) }}</span>
            </div>
            <div v-if="nextDecision.priority" class="text-xs px-2 py-1 bg-sim-background-darker rounded">
              Priority: {{ nextDecision.priority.toFixed(1) }}
            </div>
          </div>
          <div class="text-xs text-sim-text-secondary">
            {{ nextDecision.reason || 'Decision based on current priorities' }}
          </div>
        </div>
        <div v-else class="text-sm text-sim-text-secondary">
          🤔 Evaluating options...
        </div>
      </div>

      <!-- Decision Timing -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex items-center justify-between mb-2">
          <span class="flex items-center text-sm">
            <i class="fas fa-clock text-green-400 mr-2"></i>
            Next Check-in
          </span>
        </div>
        <div class="text-xs">
          <div v-if="nextDecision?.nextCheck" class="font-mono">
            {{ formatNextCheckTime(nextDecision.nextCheck) }}
          </div>
          <div v-else class="text-sim-text-secondary">
            Based on persona schedule ({{ personaSchedule }})
          </div>
        </div>
      </div>

      <!-- Current Strategy -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex items-center justify-between mb-2">
          <span class="flex items-center text-sm">
            <i class="fas fa-lightbulb text-yellow-400 mr-2"></i>
            Current Focus
          </span>
        </div>
        <div class="text-xs text-sim-text-secondary">
          <div v-if="currentPhase">
            {{ getCurrentFocusDescription(currentPhase) }}
          </div>
          <div v-else>
            Analyzing current priorities and bottlenecks
          </div>
        </div>
      </div>

      <!-- Decision Alternatives -->
      <div class="bg-sim-background rounded p-3" v-if="alternativeActions.length > 0">
        <div class="flex items-center justify-between mb-2">
          <span class="flex items-center text-sm">
            <i class="fas fa-list text-purple-400 mr-2"></i>
            Alternatives
          </span>
        </div>
        <div class="text-xs space-y-1">
          <div 
            v-for="(alt, index) in alternativeActions.slice(0, 3)" 
            :key="index"
            class="flex justify-between"
          >
            <span>{{ formatActionName(alt.action) }}</span>
            <span class="text-sim-text-secondary">{{ alt.score.toFixed(1) }}</span>
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
  widgetCurrentAction?: any
  widgetPhaseProgress?: any
}

const props = defineProps<Props>()

// Get next decision from widget data or game state
const nextDecision = computed(() => {
  // Check if widget current action has next action data
  if (props.widgetCurrentAction?.nextAction) {
    return {
      action: props.widgetCurrentAction.nextAction.type || props.widgetCurrentAction.nextAction.id,
      reason: props.widgetCurrentAction.nextAction.reason || 'Highest priority action',
      priority: props.widgetCurrentAction.nextAction.score,
      nextCheck: props.widgetCurrentAction.nextAction.nextCheck
    }
  }
  
  // Check if game state has decision queue information
  if (props.gameState?.automation?.nextDecision) {
    const next = props.gameState.automation.nextDecision
    return {
      action: next.action || 'evaluate_options',
      reason: next.reason || 'Automated decision making',
      priority: next.priority || 5.0,
      nextCheck: next.nextCheck
    }
  }
  
  return null
})

// Get alternative actions for decision comparison
const alternativeActions = computed(() => {
  if (props.widgetCurrentAction?.alternativeActions) {
    return props.widgetCurrentAction.alternativeActions
  }
  
  // Mock alternatives if not available (for development)
  if (nextDecision.value) {
    return [
      { action: 'plant_seeds', score: 4.2 },
      { action: 'harvest_crops', score: 3.8 },
      { action: 'travel_to_town', score: 2.5 }
    ].filter(alt => alt.action !== nextDecision.value?.action)
  }
  
  return []
})

// Get current phase for focus description
const currentPhase = computed(() => {
  return props.widgetPhaseProgress?.currentPhase || 
         props.gameState?.progression?.currentPhase || 'Early'
})

// Get persona schedule information
const personaSchedule = computed(() => {
  // This would come from the simulation engine's persona settings
  if (props.gameState?.persona) {
    const persona = props.gameState.persona
    if (persona.type === 'speedrunner') return '10 check-ins/day'
    if (persona.type === 'casual') return '2 check-ins/day'  
    if (persona.type === 'weekend-warrior') return '1-8 check-ins'
  }
  return 'Variable schedule'
})

// Helper methods
const formatActionName = (actionId: string): string => {
  if (!actionId) return 'Unknown'
  return actionId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

const formatNextCheckTime = (nextCheck: number | string): string => {
  if (typeof nextCheck === 'number') {
    const hours = Math.floor(nextCheck / 60)
    const minutes = Math.floor(nextCheck % 60)
    return `${hours}:${minutes.toString().padStart(2, '0')}`
  }
  return nextCheck?.toString() || 'Soon'
}

const getCurrentFocusDescription = (phase: string): string => {
  const descriptions: Record<string, string> = {
    'Tutorial': 'Learning basic farming and tool usage',
    'Early': 'Building up farm infrastructure and basic tools',
    'Mid': 'Expanding operations and unlocking adventure content',
    'Late': 'Optimizing production and high-tier content',
    'Endgame': 'Maximizing efficiency and completing final goals'
  }
  return descriptions[phase] || 'Balanced progression focus'
}

const getActionIcon = (actionType: string): string => {
  const icons: Record<string, string> = {
    plant: 'fas fa-seedling text-green-400',
    plant_seeds: 'fas fa-seedling text-green-400',
    water: 'fas fa-tint text-blue-400', 
    harvest: 'fas fa-cut text-yellow-400',
    harvest_crops: 'fas fa-cut text-yellow-400',
    craft: 'fas fa-hammer text-orange-400',
    purchase: 'fas fa-shopping-cart text-purple-400',
    travel_to_town: 'fas fa-route text-gray-400',
    travel: 'fas fa-route text-gray-400',
    adventure: 'fas fa-sword text-red-400',
    mine: 'fas fa-mountain text-gray-500',
    cleanup: 'fas fa-broom text-amber-400',
    rescue: 'fas fa-heart text-pink-400',
    evaluate_options: 'fas fa-brain text-cyan-400'
  }
  return icons[actionType] || 'fas fa-question text-gray-400'
}
</script>
