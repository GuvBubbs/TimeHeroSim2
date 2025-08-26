/**
 * Optimized Positioning Engine for Upgrade Tree
 * Phase 7: Enhanced positioning algorithms and performance
 */

import type { TreeNode } from '@/types/upgrade-tree'

interface PositioningConfig {
  columnWidth: number
  rowHeight: number
  columnGap: number
  rowGap: number
  swimlanePadding: number
  enableOptimizations: boolean
  maxIterations: number
}

interface PositionResult {
  x: number
  y: number
  optimized: boolean
  iterations: number
}

class OptimizedPositioningEngine {
  private config: PositioningConfig = {
    columnWidth: 220,
    rowHeight: 60,
    columnGap: 40,
    rowGap: 20,
    swimlanePadding: 16,
    enableOptimizations: true,
    maxIterations: 10
  }

  configure(config: Partial<PositioningConfig>) {
    this.config = { ...this.config, ...config }
  }

  calculateOptimizedPosition(
    node: TreeNode,
    existingNodes: TreeNode[],
    constraints?: Record<string, any>
  ): PositionResult {
    if (!this.config.enableOptimizations) {
      return this.calculateBasicPosition(node)
    }

    let bestPosition = this.calculateBasicPosition(node)
    let iterations = 0

    // Iterative optimization
    while (iterations < this.config.maxIterations) {
      const candidate = this.tryPositionOptimization(node, existingNodes, bestPosition)
      
      if (this.isPositionBetter(candidate, bestPosition, existingNodes)) {
        bestPosition = candidate
      } else {
        break // No improvement found
      }
      
      iterations++
    }

    return {
      ...bestPosition,
      optimized: iterations > 0,
      iterations
    }
  }

  private calculateBasicPosition(node: TreeNode): PositionResult {
    const x = (node.column || 0) * (this.config.columnWidth + this.config.columnGap)
    const y = (node.row || 0) * (this.config.rowHeight + this.config.rowGap)

    return {
      x,
      y,
      optimized: false,
      iterations: 0
    }
  }

  private tryPositionOptimization(
    node: TreeNode,
    existingNodes: TreeNode[],
    currentPosition: PositionResult
  ): PositionResult {
    // Try small adjustments to reduce overlaps and improve aesthetics
    const variations = [
      { dx: 0, dy: -this.config.rowGap * 0.25 },  // Slight up
      { dx: 0, dy: this.config.rowGap * 0.25 },   // Slight down
      { dx: -this.config.columnGap * 0.1, dy: 0 }, // Slight left
      { dx: this.config.columnGap * 0.1, dy: 0 },  // Slight right
    ]

    let bestCandidate = currentPosition

    for (const variation of variations) {
      const candidate: PositionResult = {
        x: currentPosition.x + variation.dx,
        y: currentPosition.y + variation.dy,
        optimized: true,
        iterations: currentPosition.iterations + 1
      }

      if (this.isPositionValid(candidate, existingNodes)) {
        bestCandidate = candidate
        break
      }
    }

    return bestCandidate
  }

  private isPositionBetter(
    candidate: PositionResult,
    current: PositionResult,
    existingNodes: TreeNode[]
  ): boolean {
    const candidateScore = this.calculatePositionScore(candidate, existingNodes)
    const currentScore = this.calculatePositionScore(current, existingNodes)
    
    return candidateScore > currentScore
  }

  private calculatePositionScore(
    position: PositionResult,
    existingNodes: TreeNode[]
  ): number {
    let score = 100 // Base score

    // Penalty for overlaps
    for (const node of existingNodes) {
      const nodeX = (node.column || 0) * (this.config.columnWidth + this.config.columnGap)
      const nodeY = (node.row || 0) * (this.config.rowHeight + this.config.rowGap)
      
      const distance = Math.sqrt(
        Math.pow(position.x - nodeX, 2) + Math.pow(position.y - nodeY, 2)
      )
      
      if (distance < this.config.columnWidth) {
        score -= 50 // Heavy penalty for overlap
      } else if (distance < this.config.columnWidth * 1.5) {
        score -= 10 // Light penalty for close proximity
      }
    }

    // Bonus for grid alignment
    const gridX = position.x % (this.config.columnWidth + this.config.columnGap)
    const gridY = position.y % (this.config.rowHeight + this.config.rowGap)
    
    if (gridX < 5 && gridY < 5) {
      score += 20 // Bonus for near-perfect grid alignment
    }

    return score
  }

  private isPositionValid(
    position: PositionResult,
    existingNodes: TreeNode[]
  ): boolean {
    // Check for major overlaps
    for (const node of existingNodes) {
      const nodeX = (node.column || 0) * (this.config.columnWidth + this.config.columnGap)
      const nodeY = (node.row || 0) * (this.config.rowHeight + this.config.rowGap)
      
      const distance = Math.sqrt(
        Math.pow(position.x - nodeX, 2) + Math.pow(position.y - nodeY, 2)
      )
      
      if (distance < this.config.columnWidth * 0.8) {
        return false // Too close
      }
    }

    return true
  }

  // Batch optimization for multiple nodes
  optimizePositions(nodes: TreeNode[]): Map<string, PositionResult> {
    const results = new Map<string, PositionResult>()
    const processedNodes: TreeNode[] = []

    // Sort by dependency order (topological)
    const sortedNodes = this.sortNodesByDependency(nodes)

    for (const node of sortedNodes) {
      const position = this.calculateOptimizedPosition(node, processedNodes)
      results.set(node.id, position)
      processedNodes.push(node)
    }

    return results
  }

  private sortNodesByDependency(nodes: TreeNode[]): TreeNode[] {
    // Simple topological sort based on column (already computed)
    return [...nodes].sort((a, b) => {
      const colA = a.column || 0
      const colB = b.column || 0
      if (colA !== colB) return colA - colB
      
      const rowA = a.row || 0
      const rowB = b.row || 0
      return rowA - rowB
    })
  }
}

const positioningEngine = new OptimizedPositioningEngine()

export function getOptimizedPositioningEngine(): OptimizedPositioningEngine {
  return positioningEngine
}
