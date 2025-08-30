<!-- Equipment Widget - Tools, Weapons, Armor display -->
<template>
  <BaseWidget title="Equipment" icon="fas fa-hammer">
    <div class="space-y-2">
      <!-- Tools and Weapons Split -->
      <div class="grid grid-cols-2 gap-2">
        <!-- Tools -->
        <div class="bg-sim-background rounded p-2">
          <div class="text-xs font-semibold mb-1 text-orange-400">Tools</div>
          <div class="space-y-1" v-if="props.widgetEquipment?.tools && Object.keys(props.widgetEquipment.tools).length > 0">
            <div 
              v-for="(tool, name) in props.widgetEquipment.tools" 
              :key="name"
              class="flex justify-between items-center text-xs"
            >
              <span>{{ tool.name || name }}</span>
              <span class="bg-sim-background-darker rounded px-1" :class="tool.isEquipped ? 'text-green-400' : 'text-gray-400'">
                {{ tool.isEquipped ? '✓' : '-' }}
              </span>
            </div>
          </div>
          <div class="text-xs text-sim-text-secondary" v-else>
            No tools available
          </div>
        </div>

        <!-- Weapons -->
        <div class="bg-sim-background rounded p-2">
          <div class="text-xs font-semibold mb-1 text-red-400">Weapons</div>
          <div class="space-y-1" v-if="props.widgetEquipment?.weapons && Object.keys(props.widgetEquipment.weapons).length > 0">
            <div 
              v-for="(weapon, name) in props.widgetEquipment.weapons" 
              :key="name"
              class="flex justify-between items-center text-xs"
            >
              <span>{{ weapon.name || name }}</span>
              <span class="bg-sim-background-darker rounded px-1" :class="weapon.isEquipped ? 'text-green-400' : 'text-gray-400'">
                {{ weapon.isEquipped ? '✓' : '-' }}
              </span>
            </div>
          </div>
          <div class="text-xs text-sim-text-secondary" v-else>
            No weapons available
          </div>
        </div>
      </div>

      <!-- Armor Section (Full Width) -->
      <div class="bg-sim-background rounded p-2">
        <div class="text-xs font-semibold mb-2 text-blue-400">Armor</div>
        <div class="grid grid-cols-3 gap-2" v-if="props.widgetEquipment?.armor && Object.keys(props.widgetEquipment.armor).length > 0">
          <div 
            v-for="(armor, name) in props.widgetEquipment.armor" 
            :key="name"
            class="bg-sim-background-darker rounded p-2 h-12 flex items-center justify-center border border-dashed border-sim-border text-xs"
            :class="armor.isEquipped ? 'border-green-400' : 'border-sim-border'"
          >
            <div class="text-center">
              <div class="text-xs">{{ armor.defense }}def</div>
              <div class="text-xs" :class="armor.isEquipped ? 'text-green-400' : 'text-gray-400'">
                {{ armor.isEquipped ? '✓' : armor.name || name }}
              </div>
            </div>
          </div>
        </div>
        <div class="text-xs text-sim-text-secondary text-center py-4" v-else>
          No armor available
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
  widgetEquipment?: any
}

const props = defineProps<Props>()
</script>
