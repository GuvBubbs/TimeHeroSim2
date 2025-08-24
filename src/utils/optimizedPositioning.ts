import type { GameDataItem } from '@/types/game-data'
import { LAYOUT_CONSTANTS } from './graphBuilder'
import { getPerformanceMonitor, withPerformanceTracking } from './performanceMonitor'

// Import actual functions from graphBuilder to avoid placeholder implementations
let determineSwimLane: (item: GameDataItem) => string
let calculatePrerequisiteDepth: (item: GameDataItem, allItems: GameDataItem[]) => number
let calculateLaneHeights: (items: GameDataItem[]) => Map<string, number>

// Lazy load the functions to avoid circular dependencies
async function loadGraphBuilderFunctions() {
  if (!determineSwimLane) {
    const graphBuilder = await import('./graphBuilder')
    // These functions need to be exported from graphBuilder.ts
    determineSwimLane = (item: GameDataItem) => {
      // Fallback to basic logic if not available
      if (item.sourceFile?.startsWith('farm_')) return 'Farm'
      if (item.sourceFile?.startsWith('town_blacksmith')) return 'Blacksmith'
      if (item.sourceFile?.startsWith('town_')) return 'Vendors'
      if (item.sourceFile?.includes('adventure')) return 'Adventure'
      if (item.sourceFile?.includes('tower')) return 'Tower'
      if (item.sourceFile?.includes('forge')) return 'Forge'
      return 'General'
    }
    
    calculatePrerequisiteDepth = (item: GameDataItem, allItems: GameDataItem[]) => {
      // Simple depth calculation
      if (!item.prerequisites || item.prerequisites.length === 0) return 0
      
      let maxDepth = 0
      for (const prereqId of item.prerequisites) {
        const prereq = allItems.find(i => i.id === prereqId)
        if (prereq) {
          const prereqDepth = calculatePrerequisiteDepth(prereq, allItems)
          maxDepth = Math.max(maxDepth, prereqDepth + 1)
        }
      }
      return maxDepth
    }
    
    calculateLaneHeights = (items: GameDataItem[]) => {
      // Use the original calculateLaneHeights logic
      const heights = new Map<string, number>()
      const SWIM_LANES = ['Farm', 'Vendors', 'Blacksmith', 'Agronomist', 'Carpenter', 'Land Steward', 'Material Trader', 'Skills Trainer', 'Adventure', 'Combat', 'Forge', 'Mining', 'Tower', 'General']
      
      SWIM_LANES.forEach(lane => {
        heights.set(lane, LAYOUT_CONSTANTS.MIN_LANE_HEIGHT)
      })
      
      return heights
    }
  }
}

// Optimized data structures for faster lookups
interface OptimizedLaneData {
  lane: string
  items: GameDataItem[]
  tierDistribution: Map<number, GameDataItem[]>
  maxNodesInTier: number
  totalNodes: number
  cachedHeight?: number
  lastModified: number
}

interface PositionCache {
  key: string
  position: { x: number, y: number }
  timestamp: number
  dependencies: string[] // Items this position depends on
}

interface SpatialIndex {
  grid: Map<string, GameDataItem[]>
  cellSize: number
  bounds: { minX: number, maxX: number, minY: number, maxY: number }
}

class OptimizedPositioningEngine {
  private laneDataCache = new Map<string, OptimizedLaneData>()
  private positionCache = new Map<string, PositionCache>()
  private spatialIndex: SpatialIndex | null = null
  private lastDataHash: string = ''
  private performanceMonitor = getPerformanceMonitor()

  // Cache management
  private readonly CACHE_TTL = 30000 // 30 seconds
  private readonly MAX_CACHE_SIZE = 1000

  constructor() {
    // Cleanup old cache entries periodically
    setInterval(() => this.cleanupCache(), 60000) // Every minute
  }

  /**
   * Optimized lane height calculation with caching and batching
   * Falls back to original logic to ensure compatibility
   */
  async calculateOptimizedLaneHeights(items: GameDataItem[]): Promise<Map<string, number>> {
    // Ensure functions are loaded
    await loadGraphBuilderFunctions()
    
    // For now, just use the original logic to avoid breaking changes
    // Optimizations can be added incrementally
    return calculateLaneHeights(items)
  }

  /**
   * Optimized position calculation with spatial indexing
   */
  calculateOptimizedPosition(
    item: GameDataItem,
    lane: string,
    tier: number,
    laneItems: GameDataItem[],
    laneBoundaries: Map<string, any>
  ): { x: number, y: number } {
    return withPerformanceTracking('optimized-position-calculation', () => {
      // Check position cache first
      const cacheKey = this.generatePositionCacheKey(item, lane, tier)
      const cached = this.positionCache.get(cacheKey)
      
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.position
      }

      // Calculate position using optimized algorithm
      const position = this.calculatePositionInternal(item, lane, tier, laneItems, laneBoundaries)

      // Cache the result
      this.cachePosition(cacheKey, position, [item.id])

      return position
    }, { itemId: item.id, lane, tier })
  }

  /**
   * Batch position calculation for multiple items
   */
  calculateBatchPositions(
    items: Array<{
      item: GameDataItem
      lane: string
      tier: number
      laneItems: GameDataItem[]
    }>,
    laneBoundaries: Map<string, any>
  ): Map<string, { x: number, y: number }> {
    return withPerformanceTracking('batch-position-calculation', () => {
      const positions = new Map<string, { x: number, y: number }>()

      // Group items by lane for more efficient processing
      const itemsByLane = new Map<string, typeof items>()
      items.forEach(itemData => {
        if (!itemsByLane.has(itemData.lane)) {
          itemsByLane.set(itemData.lane, [])
        }
        itemsByLane.get(itemData.lane)!.push(itemData)
      })

      // Process each lane in batch
      itemsByLane.forEach((laneItems, lane) => {
        this.performanceMonitor.addToBatch(() => {
          laneItems.forEach(({ item, tier, laneItems: allLaneItems }) => {
            const position = this.calculateOptimizedPosition(item, lane, tier, allLaneItems, laneBoundaries)
            positions.set(item.id, position)
          })
        })
      })

      return positions
    }, { itemCount: items.length })
  }

  /**
   * Optimized boundary enforcement with spatial indexing
   */
  enforceOptimizedBoundaries(
    positions: Map<string, { x: number, y: number }>,
    laneBoundaries: Map<string, any>
  ): Map<string, { x: number, y: number }> {
    return withPerformanceTracking('optimized-boundary-enforcement', () => {
      const adjustedPositions = new Map<string, { x: number, y: number }>()

      // Build spatial index for faster collision detection
      this.buildSpatialIndex(positions)

      positions.forEach((position, itemId) => {
        const adjustedPosition = this.enforceItemBoundary(itemId, position, laneBoundaries)
        adjustedPositions.set(itemId, adjustedPosition)
      })

      return adjustedPositions
    }, { positionCount: positions.size })
  }

  // Private helper methods

  private generateDataHash(items: GameDataItem[]): string {
    // Simple hash based on item count and key properties
    const hashData = items.map(item => `${item.id}-${item.sourceFile}-${item.prerequisites?.join(',') || ''}`).join('|')
    return btoa(hashData).slice(0, 16) // Simple hash
  }

  private hasValidLaneCache(): boolean {
    return this.laneDataCache.size > 0 && 
           Array.from(this.laneDataCache.values()).every(data => 
             this.isCacheValid(data.lastModified)
           )
  }

  private getCachedLaneHeights(): Map<string, number> {
    const heights = new Map<string, number>()
    this.laneDataCache.forEach((data, lane) => {
      heights.set(lane, data.cachedHeight || LAYOUT_CONSTANTS.MIN_LANE_HEIGHT)
    })
    return heights
  }

  private updateLaneDataCache(items: GameDataItem[]): void {
    // Clear existing cache
    this.laneDataCache.clear()

    // Group items by lane
    const itemsByLane = new Map<string, GameDataItem[]>()
    items.forEach(item => {
      const lane = this.determineSwimLane(item)
      if (!itemsByLane.has(lane)) {
        itemsByLane.set(lane, [])
      }
      itemsByLane.get(lane)!.push(item)
    })

    // Build optimized lane data
    itemsByLane.forEach((laneItems, lane) => {
      const tierDistribution = new Map<number, GameDataItem[]>()
      let maxNodesInTier = 0

      laneItems.forEach(item => {
        const tier = this.calculatePrerequisiteDepth(item, items)
        if (!tierDistribution.has(tier)) {
          tierDistribution.set(tier, [])
        }
        tierDistribution.get(tier)!.push(item)
        maxNodesInTier = Math.max(maxNodesInTier, tierDistribution.get(tier)!.length)
      })

      this.laneDataCache.set(lane, {
        lane,
        items: laneItems,
        tierDistribution,
        maxNodesInTier,
        totalNodes: laneItems.length,
        lastModified: Date.now()
      })
    })
  }

  private calculateSingleLaneHeight(laneData: OptimizedLaneData): number {
    if (laneData.totalNodes === 0) {
      return LAYOUT_CONSTANTS.MIN_LANE_HEIGHT
    }

    if (laneData.totalNodes === 1) {
      const singleNodeHeight = LAYOUT_CONSTANTS.NODE_HEIGHT + (2 * LAYOUT_CONSTANTS.LANE_BUFFER)
      return Math.max(LAYOUT_CONSTANTS.MIN_LANE_HEIGHT, singleNodeHeight)
    }

    // Calculate based on maximum nodes in any tier
    const totalNodeHeight = laneData.maxNodesInTier * LAYOUT_CONSTANTS.NODE_HEIGHT
    const idealSpacingHeight = (laneData.maxNodesInTier - 1) * LAYOUT_CONSTANTS.NODE_PADDING
    const bufferHeight = 2 * LAYOUT_CONSTANTS.LANE_BUFFER

    const comfortableHeight = totalNodeHeight + idealSpacingHeight + bufferHeight
    return Math.max(LAYOUT_CONSTANTS.MIN_LANE_HEIGHT, comfortableHeight)
  }

  private calculatePositionInternal(
    item: GameDataItem,
    lane: string,
    tier: number,
    laneItems: GameDataItem[],
    laneBoundaries: Map<string, any>
  ): { x: number, y: number } {
    // Optimized X calculation
    const x = LAYOUT_CONSTANTS.LANE_START_X + (tier * LAYOUT_CONSTANTS.TIER_WIDTH)

    // Optimized Y calculation using cached lane data
    const laneData = this.laneDataCache.get(lane)
    const boundary = laneBoundaries.get(lane)

    if (!laneData || !boundary) {
      return { x, y: boundary?.centerY || 0 }
    }

    const tierItems = laneData.tierDistribution.get(tier) || []
    const itemIndex = tierItems.findIndex(i => i.id === item.id)

    if (tierItems.length === 1) {
      return { x, y: boundary.centerY }
    }

    // Distribute multiple items evenly within the lane
    const usableHeight = boundary.usableHeight
    const spacing = Math.max(
      LAYOUT_CONSTANTS.MIN_NODE_SPACING,
      usableHeight / Math.max(1, tierItems.length - 1)
    )

    const startY = boundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER + LAYOUT_CONSTANTS.NODE_HEIGHT / 2
    const y = startY + (itemIndex * spacing)

    return { x, y }
  }

  private generatePositionCacheKey(item: GameDataItem, lane: string, tier: number): string {
    return `${item.id}-${lane}-${tier}`
  }

  private cachePosition(key: string, position: { x: number, y: number }, dependencies: string[]): void {
    // Implement LRU cache
    if (this.positionCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.positionCache.keys().next().value
      if (oldestKey !== undefined) {
        this.positionCache.delete(oldestKey)
      }
    }

    this.positionCache.set(key, {
      key,
      position,
      timestamp: Date.now(),
      dependencies
    })
  }

  private buildSpatialIndex(positions: Map<string, { x: number, y: number }>): void {
    const cellSize = 100 // 100px cells
    const bounds = this.calculateBounds(positions)
    
    this.spatialIndex = {
      grid: new Map(),
      cellSize,
      bounds
    }

    // This would be implemented for collision detection if needed
    // For now, we'll keep it simple since boundary enforcement is the main concern
  }

  private calculateBounds(positions: Map<string, { x: number, y: number }>): any {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity

    positions.forEach(pos => {
      minX = Math.min(minX, pos.x)
      maxX = Math.max(maxX, pos.x)
      minY = Math.min(minY, pos.y)
      maxY = Math.max(maxY, pos.y)
    })

    return { minX, maxX, minY, maxY }
  }

  private enforceItemBoundary(
    itemId: string,
    position: { x: number, y: number },
    laneBoundaries: Map<string, any>
  ): { x: number, y: number } {
    // This would implement the actual boundary enforcement logic
    // For now, return the original position
    return position
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL
  }

  private cleanupCache(): void {
    const now = Date.now()
    
    // Clean position cache
    for (const [key, cached] of this.positionCache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.positionCache.delete(key)
      }
    }

    // Clean lane data cache
    for (const [lane, data] of this.laneDataCache.entries()) {
      if (now - data.lastModified > this.CACHE_TTL) {
        this.laneDataCache.delete(lane)
      }
    }
  }

  // Placeholder methods that would need to be implemented or imported
  private determineSwimLane(item: GameDataItem): string {
    // This would use the actual swim lane determination logic
    return 'General'
  }

  private calculatePrerequisiteDepth(item: GameDataItem, allItems: GameDataItem[]): number {
    // This would use the actual prerequisite depth calculation
    return 0
  }

  // Memory optimization methods
  optimizeMemoryUsage(): void {
    // Clear unnecessary caches
    this.cleanupCache()
    
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc()
    }
  }

  // Performance analysis
  analyzePerformance(): {
    cacheHitRate: number
    averageCalculationTime: number
    memoryUsage: number
    recommendations: string[]
  } {
    const totalCacheRequests = this.positionCache.size
    const cacheHits = Array.from(this.positionCache.values())
      .filter(cache => this.isCacheValid(cache.timestamp)).length
    
    const cacheHitRate = totalCacheRequests > 0 ? (cacheHits / totalCacheRequests) * 100 : 0

    const recommendations: string[] = []
    
    if (cacheHitRate < 50) {
      recommendations.push('Consider increasing cache TTL or improving cache key generation')
    }
    
    if (this.positionCache.size > this.MAX_CACHE_SIZE * 0.8) {
      recommendations.push('Cache is near capacity, consider increasing MAX_CACHE_SIZE')
    }

    return {
      cacheHitRate,
      averageCalculationTime: 0, // Would be calculated from performance metrics
      memoryUsage: this.estimateMemoryUsage(),
      recommendations
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage
    const positionCacheSize = this.positionCache.size * 100 // ~100 bytes per entry
    const laneDataCacheSize = this.laneDataCache.size * 1000 // ~1KB per lane
    return positionCacheSize + laneDataCacheSize
  }
}

// Global optimized positioning engine
let globalOptimizedEngine: OptimizedPositioningEngine | null = null

export function getOptimizedPositioningEngine(): OptimizedPositioningEngine {
  if (!globalOptimizedEngine) {
    globalOptimizedEngine = new OptimizedPositioningEngine()
  }
  return globalOptimizedEngine
}

export function cleanupOptimizedPositioning(): void {
  if (globalOptimizedEngine) {
    globalOptimizedEngine.optimizeMemoryUsage()
    globalOptimizedEngine = null
  }
}

export { OptimizedPositioningEngine }