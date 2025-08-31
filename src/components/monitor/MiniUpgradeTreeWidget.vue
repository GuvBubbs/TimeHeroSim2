<!-- Mini Upgrade Tree Widget - Condensed upgrade progression with SVG connections -->
<template>
  <BaseWidget title="Mini Upgrade Tree" icon="fas fa-sitemap">
    <template #actions>
      <button
        @click="openFullTree"
        class="text-xs px-2 py-1 rounded border border-sim-border text-sim-text-secondary hover:text-sim-text hover:border-sim-accent transition-colors"
      >
        <i class="fas fa-expand mr-1"></i>
        Full Tree
      </button>
    </template>

    <div class="space-y-3">
      <!-- Upgrade Tree Visualization with SVG -->
      <div class="bg-sim-background rounded p-3 cursor-pointer" @click="openFullTree">
        <div class="text-xs mb-3">
          <div class="flex justify-between text-sim-text-secondary">
            <span>Tutorial</span>
            <span>Early</span>
            <span>Mid</span>
            <span>Late</span>
            <span>End</span>
          </div>
        </div>
        
        <!-- SVG Tree with Connections -->
        <div class="relative" style="height: 80px;">
          <svg 
            class="absolute inset-0 w-full h-full" 
            viewBox="0 0 300 80"
            xmlns="http://www.w3.org/2000/svg"
          >
            <!-- Draw connections first (behind nodes) -->
            <g class="connections">
              <line 
                v-for="connection in connections" 
                :key="`${connection.from}-${connection.to}`"
                :x1="connection.x1"
                :y1="connection.y1"
                :x2="connection.x2"
                :y2="connection.y2"
                :class="connection.isUnlocked ? 'stroke-green-400' : 'stroke-gray-600'"
                stroke-width="1"
                opacity="0.6"
              />
            </g>
            
            <!-- Draw nodes on top -->
            <g class="nodes">
              <circle
                v-for="node in treeNodes"
                :key="node.id"
                :cx="node.x"
                :cy="node.y"
                r="4"
                :class="getNodeClass(node)"
                :title="`${node.name}: ${getUpgradeStatus(node)}`"
              />
              
              <!-- Node symbols -->
              <text
                v-for="node in treeNodes"
                :key="`text-${node.id}`"
                :x="node.x"
                :y="node.y + 1"
                text-anchor="middle"
                font-size="6"
                :class="getNodeTextClass(node)"
              >
                {{ getUpgradeSymbol(node) }}
              </text>
            </g>
          </svg>
          
          <!-- Hover tooltips -->
          <div 
            v-if="hoveredNode"
            class="absolute bg-gray-800 text-white text-xs p-2 rounded shadow-lg pointer-events-none z-10"
            :style="tooltipStyle"
          >
            <div class="font-semibold">{{ hoveredNode.name }}</div>
            <div class="text-gray-300">{{ getUpgradeStatus(hoveredNode) }}</div>
          </div>
        </div>
        
        <!-- Progress Summary -->
        <div class="mt-3 pt-2 border-t border-sim-border-darker text-xs">
          <div class="flex justify-between">
            <span class="text-sim-text-secondary">Progress:</span>
            <span class="text-sim-text">{{ ownedCount }}/{{ totalUpgrades }} upgrades</span>
          </div>
          <div class="flex justify-between mt-1">
            <span class="text-sim-text-secondary">Available:</span>
            <span class="text-sim-text">{{ availableCount }} ready to unlock</span>
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
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseWidget from './BaseWidget.vue'
import { useGameDataStore } from '@/stores/gameData'
import type { GameState } from '@/types'
import type { GameDataItem } from '@/types/game-data'

interface TreeNode extends GameDataItem {
  x: number
  y: number
  phase: string
}

interface Connection {
  from: string
  to: string
  x1: number
  y1: number
  x2: number
  y2: number
  isUnlocked: boolean
}

interface Props {
  gameState: GameState | null
}

const props = defineProps<Props>()
const gameDataStore = useGameDataStore()
const router = useRouter()
const hoveredNode = ref<TreeNode | null>(null)
const tooltipStyle = ref({})

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

const availableCount = computed(() => {
  return allUpgrades.value.filter(upgrade => {
    if (ownedUpgrades.value.has(upgrade.id)) return false
    return upgrade.prerequisites.every(prereqId => ownedUpgrades.value.has(prereqId))
  }).length
})

// Create positioned tree nodes for SVG rendering
const treeNodes = computed(() => {
  const nodes: TreeNode[] = []
  const phasePositions = {
    tutorial: { x: 30, startY: 20 },
    early: { x: 90, startY: 20 },
    mid: { x: 150, startY: 20 },
    late: { x: 210, startY: 20 },
    end: { x: 270, startY: 20 }
  }
  
  // Take up to 3 upgrades per phase for the mini tree
  Object.entries(upgradesByPhase.value).forEach(([phase, upgrades]) => {
    const position = phasePositions[phase as keyof typeof phasePositions]
    if (!position) return
    
    upgrades.slice(0, 3).forEach((upgrade, index) => {
      nodes.push({
        ...upgrade,
        x: position.x,
        y: position.startY + (index * 20),
        phase
      })
    })
  })
  
  return nodes
})

// Create connections between nodes based on prerequisites
const connections = computed(() => {
  const connections: Connection[] = []
  const nodeMap = new Map(treeNodes.value.map(node => [node.id, node]))
  
  treeNodes.value.forEach(node => {
    node.prerequisites.forEach(prereqId => {
      const prereqNode = nodeMap.get(prereqId)
      if (prereqNode) {
        connections.push({
          from: prereqId,
          to: node.id,
          x1: prereqNode.x + 4, // Offset from node center
          y1: prereqNode.y,
          x2: node.x - 4,
          y2: node.y,
          isUnlocked: ownedUpgrades.value.has(prereqId) && ownedUpgrades.value.has(node.id)
        })
      }
    })
  })
  
  return connections
})

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

// SVG node styling functions
const getNodeClass = (node: TreeNode): string => {
  if (ownedUpgrades.value.has(node.id)) return 'fill-green-400 stroke-green-500'
  if (node.id === currentGoal.value?.id) return 'fill-yellow-400 stroke-yellow-500'
  
  const prereqsMet = node.prerequisites.every(prereqId => 
    ownedUpgrades.value.has(prereqId)
  )
  
  return prereqsMet ? 'fill-blue-400 stroke-blue-500' : 'fill-gray-600 stroke-gray-700'
}

const getNodeTextClass = (node: TreeNode): string => {
  if (ownedUpgrades.value.has(node.id)) return 'fill-white'
  if (node.id === currentGoal.value?.id) return 'fill-black'
  
  const prereqsMet = node.prerequisites.every(prereqId => 
    ownedUpgrades.value.has(prereqId)
  )
  
  return prereqsMet ? 'fill-white' : 'fill-gray-400'
}

// Navigation function
const openFullTree = () => {
  router.push('/upgrade-tree')
}
</script>
