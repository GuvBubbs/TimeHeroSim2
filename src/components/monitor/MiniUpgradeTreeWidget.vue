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
        
        <!-- Real Upgrade Tree -->
        <div class="space-y-1">
          <div 
            v-for="(row, rowIndex) in upgradeRows" 
            :key="rowIndex"
            class="flex items-center gap-1"
          >
            <template v-for="(item, itemIndex) in row" :key="itemIndex">
              <span 
                :class="getUpgradeSymbolClass(item)"
                :title="item ? `${item.name}: ${getUpgradeStatus(item)}` : ''"
                class="cursor-help"
              >
                {{ getUpgradeSymbol(item) }}
              </span>
              <span v-if="itemIndex < row.length - 1" class="text-gray-600">─</span>
            </template>
          </div>
        </div>
        
        <!-- Progress Summary -->
        <div class="mt-3 pt-2 border-t border-sim-border-darker text-xs">
          <div class="flex justify-between">
            <span class="text-sim-text-secondary">Progress:</span>
            <span class="text-sim-text">{{ ownedCount }}/{{ totalUpgrades }} upgrades</span>
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
          <div v-if="currentGoal" class="space-y-1">
            <div class="text-sim-text">{{ currentGoal.name }}</div>
            <div class="text-sim-text-secondary">{{ getGoalRequirement(currentGoal) }}</div>
          </div>
          <div v-else class="text-sim-text-secondary">
            All available upgrades acquired
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="bg-sim-background rounded p-3">
        <div class="text-xs text-sim-text-secondary">
          <div class="flex justify-between">
            <span>● Owned</span>
            <span>⭐ Goal</span>
            <span>○ Available</span>
            <span>✗ Locked</span>
          </div>
        </div>
      </div>
    </div>
  </BaseWidget>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseWidget from './BaseWidget.vue'
import { useGameDataStore } from '@/stores/gameData'
import type { GameState } from '@/types'
import type { GameDataItem } from '@/types/game-data'

interface Props {
  gameState: GameState | null
}

const props = defineProps<Props>()
const gameDataStore = useGameDataStore()

// Get all upgrades from Town feature (where most upgrades are)
const allUpgrades = computed(() => {
  const townItems = gameDataStore.itemsByGameFeature['Town'] || []
  const otherUpgrades = gameDataStore.itemsByGameFeature['Farm'] || []
  return [...townItems, ...otherUpgrades].filter(item => 
    item.category === 'upgrade' || 
    item.type === 'building' || 
    item.type === 'tool' ||
    item.name.toLowerCase().includes('shed') ||
    item.name.toLowerCase().includes('expansion')
  )
})

// Get owned upgrades from game state
const ownedUpgrades = computed(() => {
  const owned = props.gameState?.progression?.unlockedUpgrades || []
  return new Set(owned)
})

// Categorize upgrades by phase/complexity
const upgradesByPhase = computed(() => {
  const phases = {
    tutorial: [] as GameDataItem[],
    early: [] as GameDataItem[],
    mid: [] as GameDataItem[],
    late: [] as GameDataItem[],
    end: [] as GameDataItem[]
  }
  
  allUpgrades.value.forEach(upgrade => {
    // Simple heuristic: categorize by prerequisites and gold cost
    const prereqCount = upgrade.prerequisites.length
    const goldCost = parseGoldCost(upgrade.materials)
    
    if (prereqCount === 0 && goldCost <= 100) {
      phases.tutorial.push(upgrade)
    } else if (prereqCount <= 1 && goldCost <= 500) {
      phases.early.push(upgrade)
    } else if (prereqCount <= 2 && goldCost <= 2000) {
      phases.mid.push(upgrade)
    } else if (goldCost <= 10000) {
      phases.late.push(upgrade)
    } else {
      phases.end.push(upgrade)
    }
  })
  
  return phases
})

// Create visual rows for the upgrade tree
const upgradeRows = computed(() => {
  const maxLength = Math.max(
    upgradesByPhase.value.tutorial.length,
    upgradesByPhase.value.early.length,
    upgradesByPhase.value.mid.length,
    upgradesByPhase.value.late.length,
    upgradesByPhase.value.end.length,
    3 // Minimum 3 rows for visualization
  )
  
  const rows: (GameDataItem | null)[][] = []
  
  for (let i = 0; i < Math.min(maxLength, 3); i++) {
    const row: (GameDataItem | null)[] = [
      upgradesByPhase.value.tutorial[i] || null,
      upgradesByPhase.value.early[i] || null,
      upgradesByPhase.value.mid[i] || null,
      upgradesByPhase.value.late[i] || null,
      upgradesByPhase.value.end[i] || null
    ]
    rows.push(row)
  }
  
  return rows
})

// Find current upgrade goal
const currentGoal = computed(() => {
  // Find the first available upgrade that can be purchased
  const availableUpgrades = allUpgrades.value.filter(upgrade => {
    if (ownedUpgrades.value.has(upgrade.id)) return false
    
    // Check if prerequisites are met
    const prereqsMet = upgrade.prerequisites.every(prereqId => 
      ownedUpgrades.value.has(prereqId)
    )
    
    return prereqsMet
  })
  
  // Sort by priority (low cost first, then by prerequisite count)
  availableUpgrades.sort((a, b) => {
    const costA = parseGoldCost(a.materials)
    const costB = parseGoldCost(b.materials)
    return costA - costB
  })
  
  return availableUpgrades[0] || null
})

// Count statistics
const ownedCount = computed(() => {
  return allUpgrades.value.filter(upgrade => ownedUpgrades.value.has(upgrade.id)).length
})

const totalUpgrades = computed(() => allUpgrades.value.length)

// Helper functions
const parseGoldCost = (materials: string): number => {
  if (!materials) return 0
  const match = materials.match(/Gold x(\d+)/i)
  return match ? parseInt(match[1]) : 0
}

const getUpgradeSymbol = (item: GameDataItem | null): string => {
  if (!item) return '·'
  
  if (ownedUpgrades.value.has(item.id)) return '●'
  if (item.id === currentGoal.value?.id) return '⭐'
  
  // Check if available (prerequisites met)
  const prereqsMet = item.prerequisites.every(prereqId => 
    ownedUpgrades.value.has(prereqId)
  )
  
  return prereqsMet ? '○' : '✗'
}

const getUpgradeSymbolClass = (item: GameDataItem | null): string => {
  if (!item) return 'text-gray-700'
  
  if (ownedUpgrades.value.has(item.id)) return 'text-green-400'
  if (item.id === currentGoal.value?.id) return 'text-yellow-400 animate-pulse'
  
  const prereqsMet = item.prerequisites.every(prereqId => 
    ownedUpgrades.value.has(prereqId)
  )
  
  return prereqsMet ? 'text-blue-400' : 'text-red-400'
}

const getUpgradeStatus = (item: GameDataItem): string => {
  if (ownedUpgrades.value.has(item.id)) return 'Owned'
  if (item.id === currentGoal.value?.id) return 'Current Goal'
  
  const prereqsMet = item.prerequisites.every(prereqId => 
    ownedUpgrades.value.has(prereqId)
  )
  
  if (!prereqsMet) {
    const missingPrereqs = item.prerequisites.filter(prereqId => 
      !ownedUpgrades.value.has(prereqId)
    )
    return `Missing: ${missingPrereqs.join(', ')}`
  }
  
  const goldCost = parseGoldCost(item.materials)
  const currentGold = props.gameState?.resources?.gold || 0
  
  if (goldCost > currentGold) {
    return `Need ${goldCost - currentGold} more gold`
  }
  
  return 'Available'
}

const getGoalRequirement = (goal: GameDataItem): string => {
  const goldCost = parseGoldCost(goal.materials)
  const currentGold = props.gameState?.resources?.gold || 0
  
  if (goldCost > currentGold) {
    return `Need: ${goldCost - currentGold} more gold`
  }
  
  if (goal.prerequisites.length > 0) {
    const missingPrereqs = goal.prerequisites.filter(prereqId => 
      !ownedUpgrades.value.has(prereqId)
    )
    if (missingPrereqs.length > 0) {
      return `Missing: ${missingPrereqs.join(', ')}`
    }
  }
  
  return `Ready to purchase (${goldCost} gold)`
}
</script>
