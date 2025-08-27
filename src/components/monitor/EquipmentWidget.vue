<!-- Equipment Widget - Tools, Weapons, Armor display -->
<template>
  <BaseWidget title="Equipment" icon="fas fa-hammer">
    <div class="space-y-2">
      <!-- Tools and Weapons Split -->
      <div class="grid grid-cols-2 gap-2">
        <!-- Tools (Left) -->
        <div class="bg-sim-background rounded p-2">
          <div class="text-xs font-semibold mb-1 text-orange-400">Tools</div>
          <div class="space-y-1">
            <div class="flex justify-between items-center text-xs">
              <span>Hoe</span>
              <span class="bg-sim-background-darker rounded px-1">🛠️</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span>Hammer</span>
              <span class="bg-sim-background-darker rounded px-1">🔨</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span>Axe</span>
              <span class="bg-sim-background-darker rounded px-1">-</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span>Pickaxe</span>
              <span class="bg-sim-background-darker rounded px-1">🏆</span>
            </div>
          </div>
        </div>

        <!-- Weapons (Right) -->
        <div class="bg-sim-background rounded p-2">
          <div class="text-xs font-semibold mb-1 text-red-400">Weapons</div>
          <div class="space-y-1">
            <div class="flex justify-between items-center text-xs">
              <span>Sword</span>
              <span class="bg-sim-background-darker rounded px-1">4️⃣</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span>Bow</span>
              <span class="bg-sim-background-darker rounded px-1">2️⃣</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span>Spear</span>
              <span class="bg-sim-background-darker rounded px-1">-</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span>Crossbow</span>
              <span class="bg-sim-background-darker rounded px-1">3️⃣</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span>Wand</span>
              <span class="bg-sim-background-darker rounded px-1">1️⃣</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Armor Section (Full Width) -->
      <div class="bg-sim-background rounded p-2">
        <div class="text-xs font-semibold mb-2 text-blue-400">Armor</div>
        <div class="grid grid-cols-3 gap-2">
          <!-- Armor Slot 1 -->
          <div class="bg-sim-background-darker rounded p-2 h-12 flex items-center justify-center border border-dashed border-sim-border text-xs text-sim-text-secondary"
               title="[15def/Regen] - Regeneration effect">
            <div class="text-center">
              <div class="text-xs">15def</div>
              <div class="text-xs text-green-400">Regen</div>
            </div>
          </div>
          
          <!-- Armor Slot 2 -->
          <div class="bg-sim-background-darker rounded p-2 h-12 flex items-center justify-center border border-dashed border-sim-border text-xs text-sim-text-secondary"
               title="[10def/Gold+] - Gold magnet effect">
            <div class="text-center">
              <div class="text-xs">10def</div>
              <div class="text-xs text-yellow-400">Gold+</div>
            </div>
          </div>
          
          <!-- Armor Slot 3 -->
          <div class="bg-sim-background-darker rounded p-2 h-12 flex items-center justify-center border border-dashed border-sim-border text-xs text-sim-text-secondary"
               title="Empty armor slot">
            <span class="text-sim-text-secondary">Empty</span>
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
