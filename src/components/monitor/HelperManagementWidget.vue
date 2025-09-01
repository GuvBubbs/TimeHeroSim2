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
          <span class="font-mono" v-if="props.widgetHelpers">
            {{ props.widgetHelpers.currentHoused || 0 }}/{{ props.widgetHelpers.housingCapacity || 0 }} housed
          </span>
          <span class="font-mono text-sim-text-secondary" v-else>
            0/0 housed
          </span>
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
        
        <!-- Real Gnome Data -->
        <div class="space-y-2 text-xs" v-if="props.widgetHelpers?.gnomes?.length">
          <div class="flex justify-between items-center" v-for="gnome in props.widgetHelpers.gnomes" :key="gnome.id">
            <span>{{ gnome.name }} (Lvl {{ gnome.level }})</span>
            <span :class="getRoleColor(gnome.role)">{{ gnome.role }}</span>
          </div>
        </div>
        <!-- Fallback when no helpers -->
        <div class="space-y-2 text-xs text-sim-text-secondary" v-else>
          <div>No helpers assigned</div>
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
  widgetHelpers?: any
}

const props = defineProps<Props>()

// Helper function for role colors
function getRoleColor(role: string): string {
  switch (role.toLowerCase()) {
    case 'waterer': return 'text-blue-400'
    case 'sower': return 'text-green-400'
    case 'harvester': return 'text-yellow-400'
    case 'dual-role': return 'text-purple-400'
    case 'general': return 'text-gray-400'
    default: return 'text-gray-300'
  }
}
</script>
