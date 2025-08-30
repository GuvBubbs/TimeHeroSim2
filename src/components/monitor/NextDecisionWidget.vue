<!-- Next Decision Widget - Preview what AI will do next -->
<template>
  <BaseWidget title="Next Decision" icon="fas fa-brain">
    <div class="space-y-3">
      <!-- Next Action -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-forward text-blue-400 mr-2"></i>
            Next Action
          </span>
        </div>
        <div class="text-sm mb-2">
          <div v-if="props.widgetCurrentAction?.nextAction" class="text-sim-text">
            {{ formatActionName(props.widgetCurrentAction.nextAction.id || props.widgetCurrentAction.nextAction.type) }}
          </div>
          <div v-else class="text-sim-text-secondary">
            No next action queued
          </div>
          <div v-if="props.widgetCurrentAction?.nextAction?.score" class="text-xs text-sim-text-secondary">
            Score: {{ props.widgetCurrentAction.nextAction.score.toFixed(1) }}
          </div>
        </div>
      </div>

      <!-- Decision Reasoning -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-lightbulb text-yellow-400 mr-2"></i>
            Reasoning
          </span>
        </div>
        <div class="text-xs text-sim-text-secondary">
          <div v-if="props.widgetCurrentAction?.nextAction">
            Next action will be executed based on current game state analysis
          </div>
          <div v-else>
            Waiting for next decision cycle
          </div>
        </div>
      </div>

      <!-- Timing -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-stopwatch text-green-400 mr-2"></i>
            Timing
          </span>
        </div>
        <div class="text-xs">
          <div class="text-sim-text-secondary">
            Decision timing based on simulation speed
          </div>
        </div>
      </div>

      <!-- Alternatives Considered -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-list text-purple-400 mr-2"></i>
            Alternatives
          </span>
        </div>
        <div class="text-xs space-y-1 text-sim-text-secondary">
          <div class="flex justify-between">
            <span>Plant Carrots</span>
            <span>5.8</span>
          </div>
          <div class="flex justify-between">
            <span>Travel to Town</span>
            <span>3.2</span>
          </div>
          <div class="flex justify-between">
            <span>Harvest Ready</span>
            <span>2.1</span>
          </div>
        </div>
      </div>
    </div>
  </BaseWidget>
</template>

<script setup lang="ts">
import BaseWidget from './BaseWidget.vue'
import type { GameState } from '@/types'

interface Props {
  gameState: GameState | null
  widgetCurrentAction?: any
  widgetPhaseProgress?: any
}

const props = defineProps<Props>()

// Format action names
function formatActionName(actionId: string): string {
  if (!actionId) return 'Unknown'
  return actionId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}
</script>
