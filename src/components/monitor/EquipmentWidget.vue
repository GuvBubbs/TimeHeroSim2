<!-- Equipment Widget - Complete tools/weapons/armor system -->
<template>
  <BaseWidget title="Equipment" icon="fas fa-hammer">
    <div class="space-y-2">
      <!-- Tools and Weapons Split -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Tools Section -->
        <div>
          <div class="text-xs font-semibold mb-2 text-orange-400">Tools</div>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span>Hoe</span>
              <span>{{ getToolIcon('hoe') }}</span>
            </div>
            <div class="flex justify-between">
              <span>Hammer</span>
              <span>{{ getToolIcon('hammer') }}</span>
            </div>
            <div class="flex justify-between">
              <span>Axe</span>
              <span>{{ getToolIcon('axe') }}</span>
            </div>
            <div class="flex justify-between">
              <span>Shovel</span>
              <span>{{ getToolIcon('shovel') }}</span>
            </div>
            <div class="flex justify-between">
              <span>Pickaxe</span>
              <span>{{ getToolIcon('pickaxe') }}</span>
            </div>
            <div class="flex justify-between">
              <span>Water Can</span>
              <span>{{ getToolIcon('watercan') }}</span>
            </div>
          </div>
        </div>

        <!-- Weapons Section -->
        <div>
          <div class="text-xs font-semibold mb-2 text-red-400">Weapons</div>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span>Spear</span>
              <span>{{ getWeaponIcon('spear') }}</span>
            </div>
            <div class="flex justify-between">
              <span>Sword</span>
              <span>{{ getWeaponIcon('sword') }}</span>
            </div>
            <div class="flex justify-between">
              <span>Bow</span>
              <span>{{ getWeaponIcon('bow') }}</span>
            </div>
            <div class="flex justify-between">
              <span>Crossbow</span>
              <span>{{ getWeaponIcon('crossbow') }}</span>
            </div>
            <div class="flex justify-between">
              <span>Wand</span>
              <span>{{ getWeaponIcon('wand') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Armor Section (Full Width) -->
      <div class="bg-sim-background rounded p-2">
        <div class="text-xs font-semibold mb-1 text-blue-400">Armor</div>
        <div class="flex gap-2">
          <div 
            v-for="i in 3" 
            :key="i"
            class="flex-1 border border-dashed border-sim-border rounded text-center p-2 text-xs"
            :class="getArmorSlot(i-1) ? 'border-green-400' : 'border-sim-border'"
          >
            <div v-if="getArmorSlot(i-1)" class="space-y-1">
              <div>🛡️</div>
              <div>{{ getArmorSlot(i-1).defense }}def</div>
              <div v-if="getArmorSlot(i-1).effect">{{ getEffectIcon(getArmorSlot(i-1).effect) }}</div>
            </div>
            <div v-else class="space-y-1 opacity-30">
              <div>⬚</div>
              <div class="text-xs">Empty</div>
            </div>
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
  widgetEquipment?: any
}

const props = defineProps<Props>()

// Tool icon helper - shows: - / 🔨 / 🛠️ / 🏆
const getToolIcon = (toolName: string): string => {
  if (!props.widgetEquipment?.tools) return '-'
  
  const tool = props.widgetEquipment.tools[toolName]
  if (!tool || tool.level === 0) return '-'
  
  // Convert level to tool progression: 1=base, 2=plus, 3=master
  if (tool.level >= 3) return '🏆'
  if (tool.level >= 2) return '🛠️'
  if (tool.level >= 1) return '🔨'
  return '-'
}

// Weapon icon helper - shows: - / 1️⃣-🔟
const getWeaponIcon = (weaponName: string): string => {
  if (!props.widgetEquipment?.weapons) return '-'
  
  const weapon = props.widgetEquipment.weapons[weaponName]
  const level = weapon?.level || 0
  
  if (level === 0) return '-'
  
  const emojis = ['', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
  return emojis[Math.min(level, 10)] || '🔟'
}

// Armor slot extraction
const getArmorSlot = (slotIndex: number) => {
  if (!props.widgetEquipment?.armor) return null
  
  const armorArray = Object.values(props.widgetEquipment.armor)
  return armorArray[slotIndex] || null
}

// Helper function for armor effect icons
function getEffectIcon(effect: string | undefined): string {
  if (!effect) return ''
  const effectIcons: Record<string, string> = {
    'speed': '⚡',
    'defense': '🛡️',
    'health': '❤️',
    'magic': '✨',
    'stealth': '👻'
  }
  return effectIcons[effect.toLowerCase()] || '?'
}
</script>
