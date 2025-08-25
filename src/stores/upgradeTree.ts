import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  TreeNode, 
  Connection, 
  NodePosition,
  Swimlane,
  GridConfig,
  DependencyTree,
  ConnectionPath,
  HighlightState,
  NodeHighlightInfo
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

  // Phase 5: Enhanced highlight state management
  const nodeHighlightInfo = ref<Map<string, NodeHighlightInfo>>(new Map())
  const currentDependencyTree = ref<DependencyTree | null>(null)
  const hoveredConnection = ref<Connection | null>(null)
  const multiSelectMode = ref(false)
  const selectedNodes = ref<Set<string>>(new Set())

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
      
      // Calculate height for this swimlane based on actual row usage
      const swimlaneNodesInThisLane = swimlaneNodes.value[swimlane.id] || []
      if (swimlaneNodesInThisLane.length === 0) {
        // Empty swimlane - use single row height for grid alignment
        y += gridConfig.value.rowHeight + gridConfig.value.rowGap
        continue
      }
      
      // Find the maximum row number (could be fractional)
      const maxRow = Math.max(0, ...swimlaneNodesInThisLane.map(n => n.row || 0))
      
      // Calculate height: (maxRow + 1) * row spacing (no extra padding)
      const rowSpace = (maxRow + 1) * (gridConfig.value.rowHeight + gridConfig.value.rowGap)
      y += rowSpace
    }
    
    return y
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
    
    // Town vendors - General vendors.csv goes to town-vendors
    if (sourceFile === 'vendors.csv') {
      return 'town-vendors'
    }
    if (sourceFile.startsWith('town_') && sourceFile.includes('vendor')) {
      return 'town-vendors'
    }
    
    // Specific town vendor systems - each gets their own swimlane
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
      // Exclude crops and other non-upgrade items from the upgrade tree
      const treeNodes = gameDataStore.items
        .filter(item => {
          // Exclude crops (they're farmable items, not upgrades)
          if (item.sourceFile === 'crops.csv') return false
          
          // Only include items that have prerequisites OR are dependencies of other items
          return item.prerequisites.length > 0 || hasItemAsDependency(item.id, gameDataStore.items)
        })
        .map(convertToTreeNode)
      
      nodes.value = treeNodes
      
      // Build connections
      connections.value = buildConnections(treeNodes)
      
      // Apply Phase 2 layout algorithm
      assignLayoutPositions(treeNodes)
      
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

  // Phase 2: Proper layout algorithm with topological sort and grouping
  function assignLayoutPositions(treeNodes: TreeNode[]): void {
    console.log(`📐 Starting layout calculation for ${treeNodes.length} nodes`)
    
    // Validate for circular dependencies first
    const circularDeps = detectCircularDependencies(treeNodes)
    if (circularDeps.length > 0) {
      console.warn('Circular dependencies detected:', circularDeps)
      // For now, continue with layout but log the issues
    }
    
    // Phase 1: Assign columns using topological sort
    assignColumns(treeNodes)
    
    // Phase 2: Assign rows within swimlanes using grouping logic
    assignRows(treeNodes)
    
    // Check for node overlaps after layout
    detectNodeOverlaps()
  }

  // Detect circular dependencies
  function detectCircularDependencies(treeNodes: TreeNode[]): string[][] {
    const nodeMap = new Map<string, TreeNode>()
    treeNodes.forEach(node => nodeMap.set(node.id, node))
    
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const cycles: string[][] = []
    
    function dfs(nodeId: string, path: string[]): void {
      if (recursionStack.has(nodeId)) {
        // Found a cycle
        const cycleStart = path.indexOf(nodeId)
        cycles.push(path.slice(cycleStart).concat(nodeId))
        return
      }
      
      if (visited.has(nodeId)) return
      
      visited.add(nodeId)
      recursionStack.add(nodeId)
      path.push(nodeId)
      
      const node = nodeMap.get(nodeId)
      if (node) {
        node.prerequisites.forEach(prereqId => {
          if (nodeMap.has(prereqId)) {
            dfs(prereqId, [...path])
          }
        })
      }
      
      recursionStack.delete(nodeId)
      path.pop()
    }
    
    treeNodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id, [])
      }
    })
    
    return cycles
  }

  // Get breakdown of nodes by swimlane for debugging
  function getSwimlaneBreakdown(treeNodes: TreeNode[]): Record<string, number> {
    const breakdown: Record<string, number> = {}
    treeNodes.forEach(node => {
      breakdown[node.swimlane] = (breakdown[node.swimlane] || 0) + 1
    })
    return breakdown
  }

  // Detect node position overlaps
  function detectNodeOverlaps(): void {
    try {
      console.log(`🔍 Overlap detection: nodePositions has ${nodePositions.value.size} entries`)
      
      if (nodePositions.value.size === 0) {
        console.log('⚠️ No node positions available for overlap detection')
        return
      }

      const positionMap = new Map<string, string[]>()
      const overlaps: Array<{
        position: string
        coordinates: { x: number; y: number }
        nodes: string[]
        nodeNames: string[]
      }> = []

      console.log('🔍 Building position map...')
      
      // Build position map from nodePositions
      nodePositions.value.forEach((pos, nodeId) => {
        const positionKey = `${pos.x},${pos.y}`
        
        if (!positionMap.has(positionKey)) {
          positionMap.set(positionKey, [])
        }
        positionMap.get(positionKey)!.push(nodeId)
      })

      console.log(`🔍 Found ${positionMap.size} unique positions, checking for overlaps...`)

      // Find overlaps
      positionMap.forEach((nodeIds, positionKey) => {
        if (nodeIds.length > 1) {
          const [x, y] = positionKey.split(',').map(Number)
          const nodeNames = nodeIds.map(id => {
            const node = nodes.value.find(n => n.id === id)
            return node?.name || id
          })
          
          overlaps.push({
            position: positionKey,
            coordinates: { x, y },
            nodes: nodeIds,
            nodeNames: nodeNames
          })
        }
      })

      console.log(`🔍 Overlap analysis complete, found ${overlaps.length} overlaps`)

      // Simple one-line summary
      if (overlaps.length === 0) {
        console.log('✅ Layout complete: No node overlaps detected')
      } else {
        console.warn(`❌ Layout complete: ${overlaps.length} overlaps detected`)
        console.warn('📋 Overlapping nodes that need category fixes:')
        
        // Show detailed list of overlapping nodes
        overlaps.forEach((overlap, index) => {
          const nodeNames = overlap.nodeNames || overlap.nodes || ['unknown']
          const coords = overlap.coordinates || { x: 'unknown', y: 'unknown' }
          console.warn(`  ${index + 1}. ${nodeNames.join(', ')}`)
        })
        
        console.warn(`💡 Fix: Update categories in CSV files to make these ${overlaps.length} groups distinct`)
      }
    } catch (error) {
      console.error('❌ Overlap detection failed:', error)
    }
  }

  // Topological sort for column assignment (dependency depth)
  function assignColumns(treeNodes: TreeNode[]): void {
    const nodeMap = new Map<string, TreeNode>()
    const inDegree = new Map<string, number>()
    const adjList = new Map<string, string[]>()
    
    // Build graph structures
    treeNodes.forEach(node => {
      nodeMap.set(node.id, node)
      inDegree.set(node.id, 0)
      adjList.set(node.id, [])
    })
    
    // Calculate in-degrees and adjacency list
    treeNodes.forEach(node => {
      node.prerequisites.forEach(prereqId => {
        if (nodeMap.has(prereqId)) {
          // prereqId -> node.id (dependency edge)
          const adj = adjList.get(prereqId) || []
          adj.push(node.id)
          adjList.set(prereqId, adj)
          
          // Increase in-degree for dependent node
          inDegree.set(node.id, (inDegree.get(node.id) || 0) + 1)
        }
      })
    })
    
    // Topological sort using Kahn's algorithm
    const queue: string[] = []
    const levels = new Map<string, number>()
    
    // Find all nodes with no dependencies (in-degree = 0)
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId)
        levels.set(nodeId, 0)
      }
    }
    
    // Process nodes level by level
    while (queue.length > 0) {
      const currentId = queue.shift()!
      const currentLevel = levels.get(currentId)!
      
      // Process all dependents
      const dependents = adjList.get(currentId) || []
      dependents.forEach(dependentId => {
        // Reduce in-degree
        const newInDegree = (inDegree.get(dependentId) || 0) - 1
        inDegree.set(dependentId, newInDegree)
        
        // Update level (max of all prerequisite levels + 1)
        const currentDependentLevel = levels.get(dependentId) || 0
        const newLevel = Math.max(currentDependentLevel, currentLevel + 1)
        levels.set(dependentId, newLevel)
        
        // If all prerequisites processed, add to queue
        if (newInDegree === 0) {
          queue.push(dependentId)
        }
      })
    }
    
    // Assign computed levels as columns
    treeNodes.forEach(node => {
      node.column = levels.get(node.id) || 0
    })
    
    // Handle orphan nodes (not in dependency graph)
    treeNodes.forEach(node => {
      if (node.column === undefined) {
        node.column = 0
      }
    })
  }

  // Row assignment within swimlanes using grouping logic
  function assignRows(treeNodes: TreeNode[]): void {
    // Group nodes by swimlane
    const swimlaneGroups = new Map<string, TreeNode[]>()
    
    treeNodes.forEach(node => {
      const swimlane = node.swimlane
      if (!swimlaneGroups.has(swimlane)) {
        swimlaneGroups.set(swimlane, [])
      }
      swimlaneGroups.get(swimlane)!.push(node)
    })
    
    // Process each swimlane independently
    swimlaneGroups.forEach((nodes, swimlaneId) => {
      assignRowsInSwimlane(nodes, swimlaneId)
    })
  }

  // Assign rows within a single swimlane
  function assignRowsInSwimlane(nodes: TreeNode[], swimlaneId: string): void {
    // Group by type, then by category, then by column
    const typeGroups = new Map<string, TreeNode[]>()
    
    nodes.forEach(node => {
      const type = node.type || 'unknown'
      if (!typeGroups.has(type)) {
        typeGroups.set(type, [])
      }
      typeGroups.get(type)!.push(node)
    })
    
    let currentRow = 0
    
    // Process each type group
    typeGroups.forEach((typeNodes, type) => {
      // Group by category within type
      const categoryGroups = new Map<string, TreeNode[]>()
      
      typeNodes.forEach(node => {
        const category = node.category || 'unknown'
        if (!categoryGroups.has(category)) {
          categoryGroups.set(category, [])
        }
        categoryGroups.get(category)!.push(node)
      })
      
      // Process each category group
      categoryGroups.forEach((categoryNodes, category) => {
        // Sort by column to maintain left-to-right reading order
        categoryNodes.sort((a, b) => (a.column || 0) - (b.column || 0))
        
        // Group by column for same-row placement
        const columnGroups = new Map<number, TreeNode[]>()
        categoryNodes.forEach(node => {
          const column = node.column || 0
          if (!columnGroups.has(column)) {
            columnGroups.set(column, [])
          }
          columnGroups.get(column)!.push(node)
        })
        
        // Assign rows: nodes in same category+column share the same row
        columnGroups.forEach((columnNodes, column) => {
          columnNodes.forEach((node, index) => {
            node.row = currentRow  // Same row for all nodes in same category+column
          })
        })
        
        // Move to next row for the next category
        currentRow++
      })
      
      // Add one row spacing between type groups (only if we have more types coming)
      const typeEntries = Array.from(typeGroups.entries())
      const currentTypeIndex = typeEntries.findIndex(([t]) => t === type)
      if (currentTypeIndex < typeEntries.length - 1) {
        currentRow++ // One full row gap between different types
      }
    })
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

  // Phase 5: Enhanced dependency traversal algorithms
  
  // Build dependency graph for efficient traversal
  function buildDependencyGraph(): { dependencies: Map<string, string[]>, dependents: Map<string, string[]> } {
    const dependencies = new Map<string, string[]>() // node -> prerequisites
    const dependents = new Map<string, string[]>()   // node -> what depends on it
    
    // Initialize maps
    nodes.value.forEach(node => {
      dependencies.set(node.id, [...node.prerequisites])
      dependents.set(node.id, [])
    })
    
    // Build dependents map
    nodes.value.forEach(node => {
      node.prerequisites.forEach(prereqId => {
        if (dependents.has(prereqId)) {
          const list = dependents.get(prereqId) || []
          list.push(node.id)
          dependents.set(prereqId, list)
        }
      })
    })
    
    return { dependencies, dependents }
  }

  // Recursive function to find all prerequisites (what this node needs)
  function findAllPrerequisites(nodeId: string, visited = new Set<string>(), depth = 0): ConnectionPath[] {
    if (visited.has(nodeId)) return [] // Avoid cycles
    visited.add(nodeId)
    
    const { dependencies } = buildDependencyGraph()
    const directPrereqs = dependencies.get(nodeId) || []
    const paths: ConnectionPath[] = []
    
    // Add direct prerequisites
    directPrereqs.forEach(prereqId => {
      if (nodes.value.find(n => n.id === prereqId)) {
        const fromNode = nodes.value.find(n => n.id === prereqId)
        const toNode = nodes.value.find(n => n.id === nodeId)
        
        paths.push({
          from: prereqId,
          to: nodeId,
          depth: depth + 1,
          type: 'prerequisite',
          swimlaneSpan: fromNode && toNode ? [fromNode.swimlane, toNode.swimlane] : []
        })
        
        // Recursively find deeper prerequisites
        const deeperPaths = findAllPrerequisites(prereqId, new Set(visited), depth + 1)
        paths.push(...deeperPaths)
      }
    })
    
    return paths
  }

  // Recursive function to find all dependents (what depends on this node)
  function findAllDependents(nodeId: string, visited = new Set<string>(), depth = 0): ConnectionPath[] {
    if (visited.has(nodeId)) return [] // Avoid cycles
    visited.add(nodeId)
    
    const { dependents } = buildDependencyGraph()
    const directDeps = dependents.get(nodeId) || []
    const paths: ConnectionPath[] = []
    
    // Add direct dependents
    directDeps.forEach(depId => {
      if (nodes.value.find(n => n.id === depId)) {
        const fromNode = nodes.value.find(n => n.id === nodeId)
        const toNode = nodes.value.find(n => n.id === depId)
        
        paths.push({
          from: nodeId,
          to: depId,
          depth: depth + 1,
          type: 'dependent',
          swimlaneSpan: fromNode && toNode ? [fromNode.swimlane, toNode.swimlane] : []
        })
        
        // Recursively find deeper dependents
        const deeperPaths = findAllDependents(depId, new Set(visited), depth + 1)
        paths.push(...deeperPaths)
      }
    })
    
    return paths
  }

  // Build complete dependency tree for selected nodes
  function buildDependencyTree(nodeIds: string[]): DependencyTree {
    const allPrereqPaths: ConnectionPath[] = []
    const allDepPaths: ConnectionPath[] = []
    
    // Collect all paths for all selected nodes
    nodeIds.forEach(nodeId => {
      const prereqPaths = findAllPrerequisites(nodeId)
      const depPaths = findAllDependents(nodeId)
      allPrereqPaths.push(...prereqPaths)
      allDepPaths.push(...depPaths)
    })
    
    // Extract unique node IDs by depth
    const directPrerequisites = [...new Set(allPrereqPaths.filter(p => p.depth === 1).map(p => p.from))]
    const indirectPrerequisites = [...new Set(allPrereqPaths.filter(p => p.depth > 1).map(p => p.from))]
    const directDependents = [...new Set(allDepPaths.filter(p => p.depth === 1).map(p => p.to))]
    const indirectDependents = [...new Set(allDepPaths.filter(p => p.depth > 1).map(p => p.to))]

    const result = {
      selected: [...nodeIds],
      directPrerequisites,
      indirectPrerequisites,
      directDependents,
      indirectDependents,
      connectionPaths: [...allPrereqPaths, ...allDepPaths]
    }
    
    return result
  }

  // Update node highlight information based on dependency tree
  function updateNodeHighlightInfo(dependencyTree: DependencyTree): void {
    const info = new Map<string, NodeHighlightInfo>()
    
    // Clear all first
    nodes.value.forEach(node => {
      info.set(node.id, { state: 'dimmed' })
    })
    
    // Selected nodes - primary highlight
    dependencyTree.selected.forEach(nodeId => {
      info.set(nodeId, { state: 'selected' })
    })
    
    // Direct dependencies
    dependencyTree.directPrerequisites.forEach(nodeId => {
      info.set(nodeId, { 
        state: 'direct', 
        depth: 1, 
        connectionType: 'prerequisite' 
      })
    })
    
    dependencyTree.directDependents.forEach(nodeId => {
      info.set(nodeId, { 
        state: 'direct', 
        depth: 1, 
        connectionType: 'dependent' 
      })
    })
    
    // Indirect dependencies
    dependencyTree.indirectPrerequisites.forEach(nodeId => {
      if (!info.has(nodeId) || info.get(nodeId)?.state === 'dimmed') {
        const paths = dependencyTree.connectionPaths.filter(p => p.from === nodeId && p.type === 'prerequisite')
        const minDepth = Math.min(...paths.map(p => p.depth))
        info.set(nodeId, { 
          state: 'indirect', 
          depth: minDepth, 
          connectionType: 'prerequisite' 
        })
      }
    })
    
    dependencyTree.indirectDependents.forEach(nodeId => {
      if (!info.has(nodeId) || info.get(nodeId)?.state === 'dimmed') {
        const paths = dependencyTree.connectionPaths.filter(p => p.to === nodeId && p.type === 'dependent')
        const minDepth = Math.min(...paths.map(p => p.depth))
        info.set(nodeId, { 
          state: 'indirect', 
          depth: minDepth, 
          connectionType: 'dependent' 
        })
      }
    })
    
    nodeHighlightInfo.value = info
  }

  // Enhanced enter highlight mode with full family tree traversal
  function enterHighlightMode(nodeId: string, addToSelection = false): void {
    highlightMode.value = true
    
    if (addToSelection && multiSelectMode.value) {
      // Multi-select mode: add to existing selection
      selectedNodes.value.add(nodeId)
      selectedNodeId.value = nodeId // Keep track of primary selection
    } else {
      // Single select mode: replace selection
      selectedNodes.value.clear()
      selectedNodes.value.add(nodeId)
      selectedNodeId.value = nodeId
      multiSelectMode.value = false
    }
    
    // Build complete dependency tree
    const dependencyTree = buildDependencyTree([...selectedNodes.value])
    currentDependencyTree.value = dependencyTree
    
    console.log('🌳 Dependencies found:', dependencyTree.directPrerequisites.length + dependencyTree.indirectPrerequisites.length, 'prereqs,', dependencyTree.directDependents.length + dependencyTree.indirectDependents.length, 'dependents')
    
    // Update highlight information for all nodes
    updateNodeHighlightInfo(dependencyTree)
    
    // Update legacy highlightedNodes set for backward compatibility
    highlightedNodes.value.clear()
    const allHighlighted = new Set([
      ...dependencyTree.selected,
      ...dependencyTree.directPrerequisites,
      ...dependencyTree.indirectPrerequisites,
      ...dependencyTree.directDependents,
      ...dependencyTree.indirectDependents
    ])
    highlightedNodes.value = allHighlighted
  }

  // Toggle multi-select mode
  function toggleMultiSelectMode(enable: boolean): void {
    multiSelectMode.value = enable
    if (!enable) {
      // Clear extra selections, keep only the primary
      if (selectedNodeId.value) {
        selectedNodes.value.clear()
        selectedNodes.value.add(selectedNodeId.value)
        enterHighlightMode(selectedNodeId.value)
      }
    }
  }

  // Enhanced exit highlight mode
  function exitHighlightMode(): void {
    highlightMode.value = false
    selectedNodeId.value = null
    selectedNodes.value.clear()
    highlightedNodes.value.clear()
    nodeHighlightInfo.value.clear()
    currentDependencyTree.value = null
    hoveredConnection.value = null
    multiSelectMode.value = false
  }

  // Handle connection hover for enhanced interactions
  function handleConnectionHover(connection: Connection | null): void {
    hoveredConnection.value = connection
  }

  // Handle connection click for path-based navigation
  function handleConnectionClick(connection: Connection): void {
    // Navigate to the target node and highlight its family tree
    enterHighlightMode(connection.to)
  }

  // Get enhanced highlight state for a node
  function getNodeHighlightState(nodeId: string): HighlightState {
    const info = nodeHighlightInfo.value.get(nodeId)
    const state = info?.state || 'none'
    return state
  }

  // Get connection depth for styling
  function getConnectionDepth(connection: Connection): number {
    if (!currentDependencyTree.value) return 0
    
    const path = currentDependencyTree.value.connectionPaths.find(
      p => p.from === connection.from && p.to === connection.to
    )
    return path?.depth || 0
  }

  // Check if connection should be highlighted
  function isConnectionHighlighted(connection: Connection): boolean {
    if (!highlightMode.value || !currentDependencyTree.value) return false
    
    // Check if both nodes are in the highlighted tree
    const isInTree = currentDependencyTree.value.connectionPaths.some(
      p => p.from === connection.from && p.to === connection.to
    )
    
    return isInTree || hoveredConnection.value === connection
  }

  // Get node dependency depth for visual hierarchy
  function getNodeDepth(nodeId: string): number {
    const info = nodeHighlightInfo.value.get(nodeId)
    const depth = info?.depth || 0
    return depth
  }

  // Get node connection type for styling
  function getNodeConnectionType(nodeId: string): 'prerequisite' | 'dependent' | undefined {
    const info = nodeHighlightInfo.value.get(nodeId)
    const connectionType = info?.connectionType
    return connectionType
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
    
    // Phase 5: Enhanced state
    nodeHighlightInfo,
    currentDependencyTree,
    hoveredConnection,
    multiSelectMode,
    selectedNodes,
    
    // Computed
    nodePositions,
    swimlaneNodes,
    
    // Actions
    loadTreeData,
    enterHighlightMode,
    exitHighlightMode,
    isNodeDimmed,
    isNodeHighlighted,
    getSwimlaneStartY,
    
    // Phase 5: Enhanced actions
    toggleMultiSelectMode,
    handleConnectionHover,
    handleConnectionClick,
    getNodeHighlightState,
    getConnectionDepth,
    isConnectionHighlighted,
    getNodeDepth,
    getNodeConnectionType,
    buildDependencyTree,
    findAllPrerequisites,
    findAllDependents
  }
})
