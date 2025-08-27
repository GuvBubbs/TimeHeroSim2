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
          <div class="text-sim-text">Water Crops</div>
          <div class="text-xs text-sim-text-secondary">Score: 6.2</div>
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
          5 plots below 30% water level. Water efficiency parameter = 1.2x
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
          <div class="text-sim-text">In: 30 seconds</div>
          <div class="text-sim-text-secondary">Next check-in due</div>
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
}

defineProps<Props>()
</script>
