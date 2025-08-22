import type { GameDataItem } from '@/types/game-data'
import { CSV_FILE_LIST } from '@/types/csv-data'

// UPDATED: 8 swim lanes with individual town vendors
const SWIM_LANES = [
  'Farm',           // Row 0
  'Tower',          // Row 1  
  'Adventure',      // Row 2
  'Combat',         // Row 3
  'Forge',          // Row 4
  'Mining',         // Row 5
  'Town',           // Row 6 (General town items)
  'General'         // Row 7 (catch-all)
]

// Town vendor mapping for more specific swim lanes
const TOWN_VENDORS = [
  'Blacksmith',     // town_blacksmith.csv
  'Agronomist',     // town_agronomist.csv  
  'Carpenter',      // town_carpenter.csv
  'Land Steward',   // town_land_steward.csv
  'Material Trader', // town_material_trader.csv
  'Skills Trainer', // town_skills_trainer.csv
]

// Calculate lane heights based on content
function calculateLaneHeights(items: GameDataItem[]): Map<string, number> {
  const laneHeights = new Map<string, number>()
  const nodesPerLaneTier = new Map<string, Map<number, number>>()
  
  // Count nodes per lane per tier
  items.forEach(item => {
    const lane = determineSwimLane(item)
    const tier = calculatePrerequisiteDepth(item, items)
    
    if (!nodesPerLaneTier.has(lane)) {
      nodesPerLaneTier.set(lane, new Map())
    }
    const tierMap = nodesPerLaneTier.get(lane)!
    tierMap.set(tier, (tierMap.get(tier) || 0) + 1)
  })
  
  // Calculate required height for each lane
  const NODE_HEIGHT = 50
  const NODE_PADDING = 15
  const MIN_LANE_HEIGHT = 80
  
  SWIM_LANES.forEach(lane => {
    const tierMap = nodesPerLaneTier.get(lane)
    if (!tierMap) {
      laneHeights.set(lane, MIN_LANE_HEIGHT)
      return
    }
    
    // Find max nodes in any tier for this lane
    let maxNodesInTier = 0
    tierMap.forEach(count => {
      maxNodesInTier = Math.max(maxNodesInTier, count)
    })
    
    const requiredHeight = Math.max(
      MIN_LANE_HEIGHT,
      (maxNodesInTier * NODE_HEIGHT) + ((maxNodesInTier + 1) * NODE_PADDING)
    )
    laneHeights.set(lane, requiredHeight)
  })
  
  return laneHeights
}

export function buildGraphElements(items: GameDataItem[]) {
  const nodes: any[] = []
  const edges: any[] = []
  
  // FILTER: Only Actions and Unlocks (no Data items)
  const treeItems = items.filter(item => 
    item.category === 'Actions' || item.category === 'Unlocks'
  )
  
  console.log(`📊 Building graph with ${treeItems.length} items (filtered from ${items.length} total)`)
  
  // Calculate lane heights first
  const laneHeights = calculateLaneHeights(treeItems)
  
  // Sort items by tier for consistent positioning
  const sortedItems = treeItems.sort((a, b) => {
    const tierA = calculatePrerequisiteDepth(a, treeItems)
    const tierB = calculatePrerequisiteDepth(b, treeItems)
    return tierA - tierB
  })
  
  // Create nodes with proper positioning
  sortedItems.forEach(item => {
    const swimLane = determineSwimLane(item)
    const position = calculateNodePosition(item, swimLane, sortedItems, laneHeights)
    const tier = calculatePrerequisiteDepth(item, treeItems)
    
    nodes.push({
      data: {
        id: item.id,
        label: item.name || item.id,
        swimLane: swimLane,
        tier: tier,
        category: item.categories?.[0] || 'general',
        goldCost: item.goldCost,
        energyCost: item.energyCost,
        level: item.level,
        prerequisites: item.prerequisites || [],
        // Store full item data for modal
        fullData: item
      },
      position,
      classes: [
        'game-node',  // Add base class
        `lane-${swimLane.toLowerCase().replace(/\s+/g, '-')}`,
        `tier-${tier}`,
        `category-${(item.categories?.[0] || 'general').toLowerCase()}`,
        `feature-${getGameFeatureFromSourceFile(item.sourceFile).toLowerCase()}`
      ].join(' ')
    })
  })
  
  // Create prerequisite edges with validation and debugging
  let edgeCreationLog: string[] = []
  sortedItems.forEach(item => {
    if (item.prerequisites && item.prerequisites.length > 0) {
      const itemTier = calculatePrerequisiteDepth(item, treeItems)
      edgeCreationLog.push(`${item.name} (tier ${itemTier}) requires: ${item.prerequisites.join(', ')}`)
      
      item.prerequisites.forEach(prereqId => {
        const prereq = treeItems.find(i => i.id === prereqId)
        if (!prereq) {
          edgeCreationLog.push(`  ❌ ${prereqId} NOT FOUND in filtered items`)
          return
        }
        
        const prereqTier = calculatePrerequisiteDepth(prereq, treeItems)
        
        // Only create edge if prerequisite is actually to the left
        if (prereqTier < itemTier) {
          edges.push({
            data: {
              id: `prereq-${prereqId}-to-${item.id}`,
              source: prereqId,
              target: item.id,
              type: 'prerequisite'
            },
            classes: 'edge-prerequisite'
          })
          edgeCreationLog.push(`  ✅ Created edge: ${prereq.name} (tier ${prereqTier}) → ${item.name} (tier ${itemTier})`)
        } else {
          edgeCreationLog.push(`  ⚠️ Invalid prerequisite: ${prereq.name} (tier ${prereqTier}) should be left of ${item.name} (tier ${itemTier})`)
        }
      })
    }
  })
  
  console.log(`📊 Edge Creation Summary:`)
  console.log(`- Created ${nodes.length} nodes and ${edges.length} prerequisite edges`)
  console.log(`- Items with prerequisites: ${sortedItems.filter(i => i.prerequisites?.length > 0).length}`)
  
  if (edges.length === 0) {
    console.error('❌ NO EDGES CREATED! Full debug log:')
    edgeCreationLog.forEach(log => console.log(log))
  }
  
  return { nodes, edges, laneHeights }
}

function determineSwimLane(item: GameDataItem): string {
  // For town items, try to determine vendor from source file
  if (item.sourceFile?.startsWith('town_')) {
    const vendorMatch = item.sourceFile.match(/town_(.+)\.csv$/)
    if (vendorMatch) {
      const vendor = vendorMatch[1]
      switch (vendor) {
        case 'blacksmith': return 'Blacksmith'
        case 'agronomist': return 'Agronomist'
        case 'carpenter': return 'Carpenter'
        case 'land_steward': return 'Land Steward'
        case 'material_trader': return 'Material Trader'
        case 'skills_trainer': return 'Skills Trainer'
        default: return 'Town'
      }
    }
  }
  
  // Map game feature to swim lane  
  const gameFeature = getGameFeatureFromSourceFile(item.sourceFile)
  if (gameFeature && SWIM_LANES.includes(gameFeature)) {
    return gameFeature
  }
  
  // Default to General
  return 'General'
}

function getGameFeatureFromSourceFile(sourceFile: string): string {
  // Look up game feature from CSV_FILE_LIST metadata
  const fileMetadata = CSV_FILE_LIST.find(file => file.filename === sourceFile)
  return fileMetadata?.gameFeature || 'General'
}

function determineTier(item: GameDataItem): number {
  // Smart tier determination based on available data
  
  // 1. Check explicit level
  if (item.level) {
    if (item.level <= 2) return 1   // Tutorial
    if (item.level <= 5) return 2   // Early
    if (item.level <= 10) return 3  // Mid
    if (item.level <= 15) return 4  // Late
    return 5  // Endgame
  }
  
  // 2. Use cost as proxy
  if (item.goldCost) {
    if (item.goldCost < 100) return 1
    if (item.goldCost < 1000) return 2
    if (item.goldCost < 10000) return 3
    if (item.goldCost < 100000) return 4
    return 5
  }
  
  // 3. Use prerequisite count as proxy
  const prereqCount = item.prerequisites?.length || 0
  if (prereqCount === 0) return 1  // Starting items
  if (prereqCount <= 2) return 2   // Early progression
  if (prereqCount <= 4) return 3   // Mid progression
  if (prereqCount <= 6) return 4   // Late progression
  return 5  // Complex endgame items
}

function calculateNodePosition(
  item: GameDataItem, 
  swimLane: string, 
  allItems: GameDataItem[],
  laneHeights: Map<string, number>
): { x: number, y: number } {
  const TIER_WIDTH = 180   // Fixed: Must be >= NODE_WIDTH + spacing to prevent overlaps
  const NODE_WIDTH = 140   // Actual node width
  const NODE_HEIGHT = 40   // Actual node height  
  const NODE_PADDING = 10
  const LANE_PADDING = 25  // Increased for better separation
  const LANE_START_X = 200 // Space for lane labels
  const VERTICAL_SPACING = 15  // Increased from 10px
  const LANE_BUFFER = 20   // Increased from 15px
  
  // Calculate cumulative Y position for this lane
  let laneStartY = LANE_PADDING
  for (const lane of SWIM_LANES) {
    if (lane === swimLane) break
    laneStartY += (laneHeights.get(lane) || 80) + LANE_PADDING
  }
  
  // Calculate tier (X position) using consistent TIER_WIDTH
  const tier = calculatePrerequisiteDepth(item, allItems)
  const baseX = LANE_START_X + (tier * TIER_WIDTH) + (NODE_WIDTH / 2)
  
  // Ensure minimum X position (must be right of lane labels)
  const finalX = Math.max(LANE_START_X + (NODE_WIDTH / 2), baseX)
  
  // Group nodes by lane and tier first
  const nodesInLaneTier = allItems.filter(other => {
    const otherLane = determineSwimLane(other)
    const otherTier = calculatePrerequisiteDepth(other, allItems)
    return otherLane === swimLane && otherTier === tier
  })
  
  // Get this item's index in the group
  const indexInGroup = nodesInLaneTier.findIndex(n => n.id === item.id)
  const totalInGroup = nodesInLaneTier.length
  
  // Enhanced vertical distribution - prevent clustering and ensure proper spacing
  const laneHeight = laneHeights.get(swimLane) || 80
  const usableHeight = laneHeight - (2 * LANE_BUFFER)
  const minSpacingBetweenNodes = 15  // Minimum gap between node edges
  const totalHeightNeeded = totalInGroup * NODE_HEIGHT + (totalInGroup - 1) * minSpacingBetweenNodes
  
  let nodeY: number
  if (totalInGroup === 1) {
    // Single node - center it in the lane
    nodeY = laneStartY + (laneHeight / 2)
  } else if (totalHeightNeeded <= usableHeight) {
    // Nodes fit comfortably - distribute evenly with extra spacing
    const extraSpace = (usableHeight - totalHeightNeeded) / (totalInGroup + 1)
    const startY = laneStartY + LANE_BUFFER + extraSpace
    nodeY = startY + (indexInGroup * (NODE_HEIGHT + minSpacingBetweenNodes + extraSpace)) + (NODE_HEIGHT / 2)
  } else {
    // Too many nodes - use minimum spacing and expand lane if needed
    const actualSpacing = Math.max(5, (usableHeight - (totalInGroup * NODE_HEIGHT)) / Math.max(1, totalInGroup - 1))
    const startY = laneStartY + LANE_BUFFER
    nodeY = startY + (indexInGroup * (NODE_HEIGHT + actualSpacing)) + (NODE_HEIGHT / 2)
    
    // Log warning about crowded lane
    if (actualSpacing < 10) {
      console.warn(`⚠️ Lane ${swimLane} tier ${tier} is crowded: ${totalInGroup} nodes with ${actualSpacing.toFixed(1)}px spacing`)
    }
  }
  
  return { x: finalX, y: nodeY }
}

// Add this helper function to calculate prerequisite depth
function calculatePrerequisiteDepth(item: GameDataItem, allItems: GameDataItem[]): number {
  if (!item.prerequisites || item.prerequisites.length === 0) {
    return 0  // No prerequisites = tier 0 (leftmost)
  }
  
  // Find max depth of all prerequisites
  let maxDepth = 0
  const visited = new Set<string>()
  
  function getDepth(itemId: string): number {
    if (visited.has(itemId)) return 0  // Prevent infinite recursion
    visited.add(itemId)
    
    const currentItem = allItems.find(i => i.id === itemId)
    if (!currentItem || !currentItem.prerequisites || currentItem.prerequisites.length === 0) {
      return 0
    }
    
    let max = 0
    for (const prereqId of currentItem.prerequisites) {
      max = Math.max(max, getDepth(prereqId) + 1)
    }
    return max
  }
  
  maxDepth = getDepth(item.id)
  return maxDepth
}

// Optional: Add material relationship edges
export function addMaterialEdges(items: GameDataItem[], edges: any[], showMaterialEdges: boolean = false) {
  if (!showMaterialEdges) return
  
  // Only consider Actions and Unlocks
  const treeItems = items.filter(item => 
    item.category === 'Actions' || item.category === 'Unlocks'
  )
  
  // Index producers
  const producerIndex = new Map<string, string[]>()
  
  treeItems.forEach(item => {
    if (item.materialsGain) {
      Object.keys(item.materialsGain).forEach(material => {
        if (!producerIndex.has(material)) {
          producerIndex.set(material, [])
        }
        producerIndex.get(material)!.push(item.id)
      })
    }
  })
  
  // Create material edges
  treeItems.forEach(consumer => {
    if (consumer.materialsCost) {
      Object.keys(consumer.materialsCost).forEach(material => {
        const producers = producerIndex.get(material) || []
        producers.forEach(producerId => {
          edges.push({
            data: {
              id: `mat-${producerId}-to-${consumer.id}`,
              source: producerId,
              target: consumer.id,
              type: 'material',
              material: material
            },
            classes: 'edge-material'
          })
        })
      })
    }
  })
  
  console.log(`📊 Added material edges (${showMaterialEdges ? 'enabled' : 'disabled'})`)
}
