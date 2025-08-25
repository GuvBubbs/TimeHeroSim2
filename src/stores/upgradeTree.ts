import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  TreeNode, 
  Connection, 
  NodePosition,
  Swimlane,
  GridConfig 
} from '@/types/upgrade-tree'
import { SWIMLANES, GRID_CONFIG } from '@/types/upgrade-tree'
import type { GameDataItem } from '@/types/game-data'
import { useGameDataStore } from './gameData'

export const useUpgradeTreeStore = defineStore('upgradeTree', () => {
  // State
  const nodes = ref<TreeNode[]>([])
  const connections = ref<Connection[]>([])
  const highlightMode = ref(false)
  const highlightedNodes = ref<Set<string>>(new Set())
  const selectedNodeId = ref<string | null>(null)
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)

  // Grid configuration (can be modified)
  const gridConfig = ref<GridConfig>({ ...GRID_CONFIG })
  
  // Swimlanes configuration
  const swimlanes = ref<Swimlane[]>([...SWIMLANES])

  // Computed properties
  const nodePositions = computed((): Map<string, NodePosition> => {
    const positions = new Map<string, NodePosition>()
    
    nodes.value.forEach(node => {
      if (node.column !== undefined && node.row !== undefined) {
        const x = gridConfig.value.labelWidth + (node.column * (gridConfig.value.columnWidth + gridConfig.value.columnGap))
        const y = getSwimlaneStartY(node.swimlane) + (node.row * (gridConfig.value.rowHeight + gridConfig.value.rowGap))
        
        positions.set(node.id, {
          x,
          y,
          swimlane: node.swimlane,
          row: node.row,
          column: node.column
        })
      }
    })
    
    return positions
  })

  const swimlaneNodes = computed(() => {
    const grouped: Record<string, TreeNode[]> = {}
    
    // Initialize all swimlanes
    swimlanes.value.forEach(swimlane => {
      grouped[swimlane.id] = []
    })
    
    // Group nodes by swimlane
    nodes.value.forEach(node => {
      if (grouped[node.swimlane]) {
        grouped[node.swimlane].push(node)
      }
    })
    
    return grouped
  })

  // Helper to get swimlane start Y position
  function getSwimlaneStartY(swimlaneId: string): number {
    let y = 0
    
    for (const swimlane of swimlanes.value) {
      if (swimlane.id === swimlaneId) {
        break
      }
      
      // Add height for this swimlane
      const swimlaneNodeCount = swimlaneNodes.value[swimlane.id]?.length || 0
      const maxRow = Math.max(0, ...swimlaneNodes.value[swimlane.id]?.map(n => n.row || 0) || [0])
      const swimlaneHeight = (maxRow + 1) * (gridConfig.value.rowHeight + gridConfig.value.rowGap) + (gridConfig.value.swimlanePadding * 2)
      y += swimlaneHeight
    }
    
    return y + gridConfig.value.swimlanePadding
  }

  // Helper to get swimlane by node type/category
  function getSwimlaneForNode(gameItem: GameDataItem): string {
    // Map game data items to swimlanes based on sourceFile and type
    const sourceFile = gameItem.sourceFile
    const type = gameItem.type
    
    // Farm actions
    if (sourceFile === 'farm_actions.csv') {
      return 'farm'
    }
    
    // Forge actions
    if (sourceFile === 'forge_actions.csv') {
      return 'forge'
    }
    
    // Tower actions
    if (sourceFile === 'tower_actions.csv') {
      return 'tower'
    }
    
    // Town vendors
    if (sourceFile.startsWith('town_') && sourceFile.includes('vendor')) {
      return 'town-vendors'
    }
    
    // Specific town systems
    if (sourceFile === 'town_blacksmith.csv') {
      return 'town-blacksmith'
    }
    if (sourceFile === 'town_agronomist.csv') {
      return 'town-agronomist'
    }
    if (sourceFile === 'town_carpenter.csv') {
      return 'town-carpenter'
    }
    if (sourceFile === 'town_land_steward.csv') {
      return 'town-land'
    }
    if (sourceFile === 'town_material_trader.csv') {
      return 'town-trader'
    }
    if (sourceFile === 'town_skills_trainer.csv') {
      return 'town-skills'
    }
    
    // Adventures
    if (sourceFile === 'adventures.csv') {
      return 'adventure'
    }
    
    // Mining
    if (sourceFile === 'mining.csv') {
      return 'mining'
    }
    
    // Default fallback
    return 'farm'
  }

  // Convert GameDataItem to TreeNode
  function convertToTreeNode(gameItem: GameDataItem): TreeNode {
    return {
      id: gameItem.id,
      name: gameItem.name,
      swimlane: getSwimlaneForNode(gameItem),
      type: gameItem.type,
      category: gameItem.categories?.[0] || gameItem.type || 'unknown',
      prerequisites: gameItem.prerequisites,
      cost: {
        gold: gameItem.goldCost,
        energy: gameItem.energyCost,
        materials: gameItem.materialsCost
      },
      effect: gameItem.effect || '',
      icon: getIconForNode(gameItem)
    }
  }

  // Get appropriate Font Awesome icon for node type
  function getIconForNode(gameItem: GameDataItem): string {
    const type = gameItem.type
    const category = gameItem.categories?.[0] || ''
    
    // Weapons
    if (type === 'weapon') {
      if (category.includes('bow')) return 'fa fa-bow-arrow'
      if (category.includes('spear')) return 'fa fa-spear'
      if (category.includes('sword')) return 'fa fa-sword'
      return 'fa fa-sword'
    }
    
    // Tools
    if (type === 'tool') {
      if (category.includes('hammer')) return 'fa fa-hammer'
      if (category.includes('pick')) return 'fa fa-pickaxe'
      return 'fa fa-wrench'
    }
    
    // Actions
    if (type === 'action') {
      return 'fa fa-play'
    }
    
    // Upgrades
    if (type === 'upgrade') {
      return 'fa fa-arrow-up'
    }
    
    // Crops
    if (type === 'crop') {
      return 'fa fa-seedling'
    }
    
    // Default
    return 'fa fa-cube'
  }

  // Load tree data from game data store
  async function loadTreeData(): Promise<void> {
    try {
      isLoading.value = true
      loadError.value = null
      
      const gameDataStore = useGameDataStore()
      
      // Wait for game data to be loaded if not already
      if (gameDataStore.items.length === 0) {
        await gameDataStore.loadGameData()
      }
      
      // Convert game data items to tree nodes
      const treeNodes = gameDataStore.items
        .filter(item => item.prerequisites.length > 0 || hasItemAsDependency(item.id, gameDataStore.items))
        .map(convertToTreeNode)
      
      nodes.value = treeNodes
      
      // Build connections
      connections.value = buildConnections(treeNodes)
      
      // TODO: In Phase 2, we'll add the layout algorithm here
      // For now, just set basic positions
      assignBasicPositions(treeNodes)
      
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Failed to load tree data'
      console.error('Error loading tree data:', error)
    } finally {
      isLoading.value = false
    }
  }
  
  // Check if an item is used as a dependency by other items
  function hasItemAsDependency(itemId: string, allItems: GameDataItem[]): boolean {
    return allItems.some(item => item.prerequisites.includes(itemId))
  }

  // Build connections array from nodes
  function buildConnections(treeNodes: TreeNode[]): Connection[] {
    const connections: Connection[] = []
    const nodeIds = new Set(treeNodes.map(n => n.id))
    
    treeNodes.forEach(node => {
      node.prerequisites.forEach(prereqId => {
        // Only create connection if both nodes exist in our tree
        if (nodeIds.has(prereqId)) {
          connections.push({
            from: prereqId,
            to: node.id
          })
        }
      })
    })
    
    return connections
  }

  // Temporary basic positioning (Phase 2 will replace this with proper algorithm)
  function assignBasicPositions(treeNodes: TreeNode[]): void {
    const swimlaneCounts: Record<string, number> = {}
    
    treeNodes.forEach(node => {
      const swimlane = node.swimlane
      const count = swimlaneCounts[swimlane] || 0
      
      node.column = count % 5  // Basic grid layout
      node.row = Math.floor(count / 5)
      
      swimlaneCounts[swimlane] = count + 1
    })
  }

  // Enter highlight mode for a node
  function enterHighlightMode(nodeId: string): void {
    highlightMode.value = true
    selectedNodeId.value = nodeId
    highlightedNodes.value.clear()
    
    // TODO: In Phase 5, we'll implement full family tree traversal
    // For now, just highlight the selected node
    highlightedNodes.value.add(nodeId)
  }

  // Exit highlight mode
  function exitHighlightMode(): void {
    highlightMode.value = false
    selectedNodeId.value = null
    highlightedNodes.value.clear()
  }

  // Check if a node should be dimmed
  function isNodeDimmed(nodeId: string): boolean {
    return highlightMode.value && !highlightedNodes.value.has(nodeId)
  }

  // Check if a node is highlighted
  function isNodeHighlighted(nodeId: string): boolean {
    return highlightedNodes.value.has(nodeId)
  }

  return {
    // State
    nodes,
    connections,
    highlightMode,
    highlightedNodes,
    selectedNodeId,
    isLoading,
    loadError,
    gridConfig,
    swimlanes,
    
    // Computed
    nodePositions,
    swimlaneNodes,
    
    // Actions
    loadTreeData,
    enterHighlightMode,
    exitHighlightMode,
    isNodeDimmed,
    isNodeHighlighted,
    getSwimlaneStartY
  }
})
