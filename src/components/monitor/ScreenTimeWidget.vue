<!-- Screen Time Widget - Time distribution across screens -->
<template>
  <BaseWidget title="Screen Time" icon="fas fa-chart-pie">
    <div class="space-y-3">
      <!-- Screen Distribution -->
      <div class="bg-sim-background rounded p-3">
        <div class="space-y-2">
          <!-- Farm -->
          <div class="flex items-center justify-between">
            <span class="text-sm flex items-center">
              <div class="w-3 h-3 bg-green-500 rounded mr-2"></div>
              Farm
            </span>
            <span class="font-mono text-sm">42%</span>
          </div>
          <div class="w-full bg-sim-background-darker rounded-full h-2">
            <div class="bg-green-500 h-2 rounded-full" style="width: 42%"></div>
          </div>
          
          <!-- Tower -->
          <div class="flex items-center justify-between">
            <span class="text-sm flex items-center">
              <div class="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              Tower
            </span>
            <span class="font-mono text-sm">18%</span>
          </div>
          <div class="w-full bg-sim-background-darker rounded-full h-2">
            <div class="bg-blue-500 h-2 rounded-full" style="width: 18%"></div>
          </div>
          
          <!-- Town -->
          <div class="flex items-center justify-between">
            <span class="text-sm flex items-center">
              <div class="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
              Town
            </span>
            <span class="font-mono text-sm">16%</span>
          </div>
          <div class="w-full bg-sim-background-darker rounded-full h-2">
            <div class="bg-yellow-500 h-2 rounded-full" style="width: 16%"></div>
          </div>
          
          <!-- Adventure -->
          <div class="flex items-center justify-between">
            <span class="text-sm flex items-center">
              <div class="w-3 h-3 bg-red-500 rounded mr-2"></div>
              Adventure
            </span>
            <span class="font-mono text-sm">20%</span>
          </div>
          <div class="w-full bg-sim-background-darker rounded-full h-2">
            <div class="bg-red-500 h-2 rounded-full" style="width: 20%"></div>
          </div>
          
          <!-- Mine -->
          <div class="flex items-center justify-between">
            <span class="text-sm flex items-center">
              <div class="w-3 h-3 bg-purple-500 rounded mr-2"></div>
              Mine
            </span>
            <span class="font-mono text-sm">4%</span>
          </div>
          <div class="w-full bg-sim-background-darker rounded-full h-2">
            <div class="bg-purple-500 h-2 rounded-full" style="width: 4%"></div>
          </div>
        </div>
      </div>

      <!-- Trends -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-trending-up text-green-400 mr-2"></i>
            Trends
          </span>
        </div>
        <div class="text-xs space-y-1">
          <div class="flex justify-between">
            <span>Farm</span>
            <span class="text-green-400">↗ +5%</span>
          </div>
          <div class="flex justify-between">
            <span>Tower</span>
            <span class="text-red-400">↘ -2%</span>
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
