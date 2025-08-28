<!-- Helper Management Widget - Gnomes and their roles -->
<template>
  <BaseWidget title="Helper Management" icon="fas fa-users">
    <div class="space-y-3">
      <!-- Housing Status -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-home text-yellow-400 mr-2"></i>
            Housing
          </span>
          <span class="font-mono">3/5 housed</span>
        </div>
        <div class="text-xs text-sim-text-secondary">
          Buildings: Hut, House will display here
        </div>
      </div>

      <!-- Gnome List -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-child-reaching text-green-400 mr-2"></i>
            Gnomes
          </span>
        </div>
        
        <!-- Mock Gnomes -->
        <div class="space-y-2 text-xs">
          <div class="flex justify-between items-center">
            <span>Gnomey (Lvl 2)</span>
            <span class="text-green-400">Waterer</span>
          </div>
          <div class="flex justify-between items-center">
            <span>Helper (Lvl 1)</span>
            <span class="text-blue-400">Sower</span>
          </div>
          <div class="flex justify-between items-center">
            <span>Worker (Lvl 3)</span>
            <span class="text-purple-400">Dual-Role*</span>
          </div>
        </div>
      </div>

      <!-- Special Buildings -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-university text-purple-400 mr-2"></i>
            Special Buildings
          </span>
        </div>
        <div class="text-xs text-sim-text-secondary">
          Training Grounds, Master Academy status will display here
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
