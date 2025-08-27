<!-- Mini Upgrade Tree Widget - Condensed upgrade progression -->
<template>
  <BaseWidget title="Mini Upgrade Tree" icon="fas fa-sitemap">
    <div class="space-y-3">
      <!-- Upgrade Tree Visualization -->
      <div class="bg-sim-background rounded p-3">
        <div class="text-xs mb-3">
          <div class="flex justify-between text-sim-text-secondary">
            <span>Tutorial</span>
            <span>Early</span>
            <span>Mid</span>
            <span>Late</span>
            <span>End</span>
          </div>
        </div>
        
        <!-- Mock Tree Grid -->
        <div class="space-y-1">
          <div class="flex items-center gap-1">
            <span class="text-green-400">●</span>
            <span class="text-gray-600">─</span>
            <span class="text-green-400">●</span>
            <span class="text-gray-600">─</span>
            <span class="text-yellow-400">⭐</span>
            <span class="text-gray-600">─</span>
            <span class="text-gray-600">○</span>
            <span class="text-gray-600">─</span>
            <span class="text-gray-600">○</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-green-400">●</span>
            <span class="text-gray-600">─</span>
            <span class="text-green-400">●</span>
            <span class="text-gray-600">─</span>
            <span class="text-gray-600">○</span>
            <span class="text-gray-600">─</span>
            <span class="text-gray-600">○</span>
            <span class="text-gray-600">─</span>
            <span class="text-gray-600">○</span>
          </div>
        </div>
      </div>

      <!-- Current Goal -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-target text-yellow-400 mr-2"></i>
            Current Goal
          </span>
        </div>
        <div class="text-xs">
          <div class="text-sim-text">Storage Shed II</div>
          <div class="text-sim-text-secondary">Need: 2,500 more gold</div>
        </div>
      </div>

      <!-- Legend -->
      <div class="bg-sim-background rounded p-3">
        <div class="text-xs text-sim-text-secondary">
          <div>● Owned  ⭐ Goal  ○ Locked</div>
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
