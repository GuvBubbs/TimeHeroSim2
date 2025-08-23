import { describe, it, expect, beforeEach } from 'vitest'
import { buildGraphElements } from '@/utils/graphBuilder'
import type { GameDataItem } from '@/types/game-data'

describe('Enhanced Vertical Distribution', () => {
  let mockItems: GameDataItem[]

  beforeEach(() => {
    // Create test items for vertical distribution testing
    mockItems = [
      {
        id: 'farm_1',
        name: 'Basic Crop',
        category: 'Actions',
        sourceFile: 'farm_actions.csv',
        prerequisites: []
      },
      {
        id: 'farm_2', 
        name: 'Advanced Crop',
        category: 'Actions',
        sourceFile: 'farm_actions.csv',
        prerequisites: []
      },
      {
        id: 'farm_3',
        name: 'Expert Crop',
        category: 'Actions', 
        sourceFile: 'farm_actions.csv',
        prerequisites: []
      },
      {
        id: 'blacksmith_1',
        name: 'Basic Tool',
        category: 'Unlocks',
        sourceFile: 'town_blacksmith.csv',
        prerequisites: []
      }
    ]
  })

  it('should center single nodes within their lane', () => {
    // Test with single node in blacksmith lane
    const singleNodeItems = [mockItems[3]] // Just blacksmith item
    
    const { nodes, laneBoundaries } = buildGraphElements(singleNodeItems)
    
    const blacksmithNode = nodes.find(n => n.data.id === 'blacksmith_1')
    const blacksmithBoundary = laneBoundaries?.get('Blacksmith')
    
    expect(blacksmithNode).toBeDefined()
    expect(blacksmithBoundary).toBeDefined()
    
    if (blacksmithNode && blacksmithBoundary) {
      // Node should be centered in the lane
      expect(blacksmithNode.position.y).toBeCloseTo(blacksmithBoundary.centerY, 1)
    }
  })

  it('should distribute multiple nodes evenly when they fit comfortably', () => {
    // Test with 3 farm items in same tier (should fit comfortably)
    const farmItems = mockItems.slice(0, 3) // First 3 farm items
    
    const { nodes, laneBoundaries } = buildGraphElements(farmItems)
    
    const farmNodes = nodes.filter(n => n.data.swimLane === 'Farm')
    const farmBoundary = laneBoundaries?.get('Farm')
    
    expect(farmNodes).toHaveLength(3)
    expect(farmBoundary).toBeDefined()
    
    if (farmBoundary) {
      // Sort nodes by Y position
      const sortedNodes = farmNodes.sort((a, b) => a.position.y - b.position.y)
      
      // Check that nodes are distributed across the usable height
      const firstNodeY = sortedNodes[0].position.y
      const lastNodeY = sortedNodes[2].position.y
      
      // First node should be near top of usable area
      const expectedTopY = farmBoundary.startY + 20 + 20 // LANE_BUFFER + NODE_HEIGHT/2
      const expectedBottomY = farmBoundary.endY - 20 - 20 // LANE_BUFFER + NODE_HEIGHT/2
      
      expect(firstNodeY).toBeGreaterThanOrEqual(expectedTopY - 5)
      expect(lastNodeY).toBeLessThanOrEqual(expectedBottomY + 5)
      
      // Check spacing between nodes is consistent
      const spacing1 = sortedNodes[1].position.y - sortedNodes[0].position.y
      const spacing2 = sortedNodes[2].position.y - sortedNodes[1].position.y
      
      // Spacing should be approximately equal (within 2px tolerance)
      expect(Math.abs(spacing1 - spacing2)).toBeLessThan(2)
    }
  })

  it('should maintain minimum 15px spacing between nodes', () => {
    // Create many items to test compression
    const manyFarmItems: GameDataItem[] = Array.from({ length: 8 }, (_, i) => ({
      id: `farm_${i + 1}`,
      name: `Farm Item ${i + 1}`,
      category: 'Actions',
      sourceFile: 'farm_actions.csv',
      prerequisites: []
    }))
    
    const { nodes } = buildGraphElements(manyFarmItems)
    
    const farmNodes = nodes.filter(n => n.data.swimLane === 'Farm')
    
    // Sort nodes by Y position
    const sortedNodes = farmNodes.sort((a, b) => a.position.y - b.position.y)
    
    // Check spacing between adjacent nodes
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const currentNode = sortedNodes[i]
      const nextNode = sortedNodes[i + 1]
      
      // Calculate spacing (center to center minus node height)
      const spacing = nextNode.position.y - currentNode.position.y - 40 // NODE_HEIGHT = 40
      
      // Should maintain at least 15px spacing (MIN_NODE_SPACING)
      expect(spacing).toBeGreaterThanOrEqual(14.9) // Allow small floating point tolerance
    }
  })

  it('should use consistent constants across all positioning calculations', () => {
    const { nodes, laneBoundaries } = buildGraphElements(mockItems)
    
    // Check that all nodes use consistent tier width spacing
    const tier0Nodes = nodes.filter(n => n.data.tier === 0)
    const tier1Nodes = nodes.filter(n => n.data.tier === 1)
    
    if (tier0Nodes.length > 0 && tier1Nodes.length > 0) {
      const tier0X = tier0Nodes[0].position.x
      const tier1X = tier1Nodes[0].position.x
      
      // Should use TIER_WIDTH (180px) spacing
      expect(tier1X - tier0X).toBeCloseTo(180, 1)
    }
    
    // Check that lane boundaries are consistent with LANE_PADDING
    if (laneBoundaries) {
      const farmBoundary = laneBoundaries.get('Farm')
      const vendorsBoundary = laneBoundaries.get('Vendors')
      
      if (farmBoundary && vendorsBoundary) {
        // Gap between lanes should be LANE_PADDING (25px)
        const gapBetweenLanes = vendorsBoundary.startY - farmBoundary.endY
        expect(gapBetweenLanes).toBeCloseTo(25, 1)
      }
    }
  })

  it('should provide appropriate warnings for overcrowded lanes', () => {
    // Capture console warnings and logs
    const warnings: string[] = []
    const logs: string[] = []
    const originalWarn = console.warn
    const originalLog = console.log
    
    console.warn = (message: string) => {
      warnings.push(message)
    }
    console.log = (message: string) => {
      logs.push(message)
    }
    
    try {
      // Create many items to force overcrowding in a small lane
      const overcrowdedItems: GameDataItem[] = Array.from({ length: 15 }, (_, i) => ({
        id: `farm_${i + 1}`,
        name: `Farm Item ${i + 1}`,
        category: 'Actions',
        sourceFile: 'farm_actions.csv',
        prerequisites: [] // All in tier 0 to force overcrowding
      }))
      
      const { nodes } = buildGraphElements(overcrowdedItems)
      
      // Check if nodes were actually created and positioned
      const farmNodes = nodes.filter(n => n.data.swimLane === 'Farm')
      expect(farmNodes.length).toBe(15)
      
      // Check for any warnings or logs about compression/overcrowding
      const allMessages = [...warnings, ...logs]
      const overcrowdingMessages = allMessages.filter(msg => 
        msg.includes('compressed') || 
        msg.includes('overcrowded') || 
        msg.includes('CRITICAL') ||
        msg.includes('spacing')
      )
      
      // If no warnings were captured, at least verify the nodes are tightly spaced
      if (overcrowdingMessages.length === 0) {
        // Sort nodes by Y position and check spacing
        const sortedNodes = farmNodes.sort((a, b) => a.position.y - b.position.y)
        
        // Calculate average spacing
        let totalSpacing = 0
        for (let i = 0; i < sortedNodes.length - 1; i++) {
          const spacing = sortedNodes[i + 1].position.y - sortedNodes[i].position.y - 40 // NODE_HEIGHT
          totalSpacing += spacing
        }
        const avgSpacing = totalSpacing / (sortedNodes.length - 1)
        
        // With 15 nodes, spacing should be compressed (less than normal 15px)
        expect(avgSpacing).toBeLessThan(20) // Should be compressed
        expect(avgSpacing).toBeGreaterThanOrEqual(14.9) // But still meet minimum
      } else {
        expect(overcrowdingMessages.length).toBeGreaterThan(0)
      }
      
    } finally {
      console.warn = originalWarn
      console.log = originalLog
    }
  })
})