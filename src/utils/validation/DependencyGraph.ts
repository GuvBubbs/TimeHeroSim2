/**
 * DependencyGraph - Phase 9H Implementation
 * 
 * Builds and manages dependency graphs from CSV data for optimized prerequisite checking.
 * Provides efficient lookup of dependencies and circular dependency detection.
 */

import type { GameDataItem } from '@/types'
import { CSVDataParser } from '../CSVDataParser'

export interface DependencyNode {
  id: string
  prerequisites: Set<string>
  dependents: Set<string>
  depth: number // Depth in dependency tree for optimization
}

export interface DependencyPath {
  path: string[]
  isCycle: boolean
}

export class DependencyGraph {
  private nodes: Map<string, DependencyNode> = new Map()
  private reverseMap: Map<string, Set<string>> = new Map() // Quick lookup: what depends on this?
  private builtFromData: GameDataItem[] = []
  private lastBuildTime: number = 0
  private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  constructor() {}

  /**
   * Builds the dependency graph from CSV data
   * Caches results for performance
   */
  buildFromGameData(gameData: GameDataItem[]): void {
    const now = Date.now()
    
    // Use cache if data hasn't changed and cache is fresh
    if (this.builtFromData === gameData && (now - this.lastBuildTime) < DependencyGraph.CACHE_DURATION) {
      return
    }

    console.log(`🏗️ DependencyGraph: Building graph from ${gameData.length} items`)
    
    this.clear()
    this.builtFromData = [...gameData]
    this.lastBuildTime = now

    // First pass: Create all nodes
    for (const item of gameData) {
      this.nodes.set(item.id, {
        id: item.id,
        prerequisites: new Set(),
        dependents: new Set(),
        depth: 0
      })
    }

    // Second pass: Build relationships
    for (const item of gameData) {
      if (item.prerequisites && item.prerequisites.length > 0) {
        const prerequisites = item.prerequisites
        const node = this.nodes.get(item.id)!
        
        for (const prereqId of prerequisites) {
          // Add to this node's prerequisites
          node.prerequisites.add(prereqId)
          
          // Add reverse mapping
          if (!this.reverseMap.has(prereqId)) {
            this.reverseMap.set(prereqId, new Set())
          }
          this.reverseMap.get(prereqId)!.add(item.id)
          
          // Add to prerequisite's dependents if it exists
          const prereqNode = this.nodes.get(prereqId)
          if (prereqNode) {
            prereqNode.dependents.add(item.id)
          }
        }
      }
    }

    // Third pass: Calculate depths for optimization
    this.calculateDepths()
    
    console.log(`✅ DependencyGraph: Built graph with ${this.nodes.size} nodes`)
  }

  /**
   * Gets all items that depend on the given item
   */
  getDependents(itemId: string): string[] {
    return Array.from(this.reverseMap.get(itemId) || new Set())
  }

  /**
   * Gets all prerequisites for an item (direct only)
   */
  getPrerequisites(itemId: string): string[] {
    const node = this.nodes.get(itemId)
    return node ? Array.from(node.prerequisites) : []
  }

  /**
   * Gets all prerequisites for an item recursively
   */
  getAllPrerequisites(itemId: string): string[] {
    const visited = new Set<string>()
    const result = new Set<string>()
    
    const traverse = (id: string) => {
      if (visited.has(id)) return
      visited.add(id)
      
      const node = this.nodes.get(id)
      if (node) {
        for (const prereq of node.prerequisites) {
          result.add(prereq)
          traverse(prereq)
        }
      }
    }
    
    traverse(itemId)
    return Array.from(result)
  }

  /**
   * Detects circular dependencies in the graph
   */
  detectCircularDependencies(): DependencyPath[] {
    const cycles: DependencyPath[] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const detectCycle = (nodeId: string, path: string[]): void => {
      if (recursionStack.has(nodeId)) {
        // Found a cycle
        const cycleStart = path.indexOf(nodeId)
        const cyclePath = [...path.slice(cycleStart), nodeId]
        cycles.push({
          path: cyclePath,
          isCycle: true
        })
        return
      }

      if (visited.has(nodeId)) {
        return
      }

      visited.add(nodeId)
      recursionStack.add(nodeId)

      const node = this.nodes.get(nodeId)
      if (node) {
        for (const prereq of node.prerequisites) {
          detectCycle(prereq, [...path, nodeId])
        }
      }

      recursionStack.delete(nodeId)
    }

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        detectCycle(nodeId, [])
      }
    }

    return cycles
  }

  /**
   * Finds the shortest path between two items in the dependency graph
   */
  findPath(fromId: string, toId: string): string[] | null {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
      return null
    }

    const queue: Array<{ id: string; path: string[] }> = [{ id: fromId, path: [fromId] }]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const { id, path } = queue.shift()!
      
      if (visited.has(id)) continue
      visited.add(id)

      if (id === toId) {
        return path
      }

      const node = this.nodes.get(id)
      if (node) {
        // Check both prerequisites and dependents for bidirectional search
        for (const nextId of [...node.prerequisites, ...node.dependents]) {
          if (!visited.has(nextId)) {
            queue.push({ id: nextId, path: [...path, nextId] })
          }
        }
      }
    }

    return null
  }

  /**
   * Gets items at a specific depth level
   */
  getItemsAtDepth(depth: number): string[] {
    return Array.from(this.nodes.values())
      .filter(node => node.depth === depth)
      .map(node => node.id)
  }

  /**
   * Gets the maximum depth of the dependency tree
   */
  getMaxDepth(): number {
    return Math.max(...Array.from(this.nodes.values()).map(node => node.depth))
  }

  /**
   * Checks if an item exists in the graph
   */
  hasItem(itemId: string): boolean {
    return this.nodes.has(itemId)
  }

  /**
   * Gets dependency statistics
   */
  getStats(): {
    totalNodes: number
    totalDependencies: number
    maxDepth: number
    itemsWithoutPrereqs: number
    cycles: number
  } {
    const cycles = this.detectCircularDependencies()
    const itemsWithoutPrereqs = Array.from(this.nodes.values())
      .filter(node => node.prerequisites.size === 0).length

    return {
      totalNodes: this.nodes.size,
      totalDependencies: Array.from(this.nodes.values())
        .reduce((sum, node) => sum + node.prerequisites.size, 0),
      maxDepth: this.getMaxDepth(),
      itemsWithoutPrereqs,
      cycles: cycles.length
    }
  }

  /**
   * Clears the dependency graph
   */
  private clear(): void {
    this.nodes.clear()
    this.reverseMap.clear()
  }

  /**
   * Calculates depths for all nodes (for optimization)
   */
  private calculateDepths(): void {
    const visited = new Set<string>()
    
    // Start with nodes that have no prerequisites
    const rootNodes = Array.from(this.nodes.values())
      .filter(node => node.prerequisites.size === 0)
    
    // Set root nodes to depth 0
    for (const node of rootNodes) {
      node.depth = 0
      visited.add(node.id)
    }

    // BFS to calculate depths
    const queue = [...rootNodes]
    
    while (queue.length > 0) {
      const currentNode = queue.shift()!
      
      for (const dependentId of currentNode.dependents) {
        const dependentNode = this.nodes.get(dependentId)
        
        if (dependentNode && !visited.has(dependentId)) {
          // Check if all prerequisites have been visited
          const allPrereqsVisited = Array.from(dependentNode.prerequisites)
            .every(prereqId => visited.has(prereqId) || !this.nodes.has(prereqId))
          
          if (allPrereqsVisited) {
            // Calculate depth as max of prerequisite depths + 1
            const prereqDepths = Array.from(dependentNode.prerequisites)
              .map(prereqId => this.nodes.get(prereqId)?.depth ?? 0)
            
            dependentNode.depth = Math.max(...prereqDepths, 0) + 1
            visited.add(dependentId)
            queue.push(dependentNode)
          }
        }
      }
    }
  }
}
