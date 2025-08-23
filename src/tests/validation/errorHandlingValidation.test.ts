import { describe, it, expect, beforeEach } from 'vitest'
import { 
  getErrorHandlingSystem,
  getUserFriendlyErrors,
  getRecoveryContext,
  generateErrorRecoveryReport,
  LAYOUT_CONSTANTS
} from '@/utils/graphBuilder'
import type { GameDataItem } from '@/types/game-data'

describe('Error Handling and Recovery System', () => {
  const mockGameData: GameDataItem[] = [
    {
      id: 'test-item-1',
      name: 'Test Item 1',
      category: 'Actions',
      sourceFile: 'farm_actions.csv',
      prerequisites: []
    },
    {
      id: 'test-item-2', 
      name: 'Test Item 2',
      category: 'Actions',
      sourceFile: 'farm_actions.csv',
      prerequisites: ['test-item-1']
    }
  ]

  beforeEach(() => {
    // Clear errors before each test
    getErrorHandlingSystem().clearErrorsAndRecovery()
  })

  it('should handle boundary enforcement failure', () => {
    const errorSystem = getErrorHandlingSystem()
    
    // Create a mock boundary
    const mockBoundary = {
      lane: 'Farm',
      startY: 100,
      endY: 200,
      centerY: 150,
      height: 100,
      usableHeight: 60
    }
    
    const boundaries = new Map([['Farm', mockBoundary]])
    
    // Test position that violates boundary (too high)
    const violatingPosition = { x: 300, y: 50 }
    
    const result = errorSystem.handleBoundaryEnforcementFailure(
      violatingPosition,
      'Farm',
      boundaries,
      'test-node-1'
    )
    
    // Should adjust position to be within bounds
    expect(result.position.y).toBeGreaterThanOrEqual(mockBoundary.startY + LAYOUT_CONSTANTS.LANE_BUFFER)
    expect(result.recoveryContext.recoveryStrategy).toBe('fallback')
    expect(result.recoveryContext.appliedAdjustments.length).toBeGreaterThan(0)
  })

  it('should analyze lane overcrowding correctly', () => {
    const errorSystem = getErrorHandlingSystem()
    
    // Create mock positioned nodes
    const mockNodes = mockGameData.map((item, index) => ({
      item,
      position: { x: 300, y: 100 + (index * 50) },
      lane: 'Farm',
      tier: index,
      withinBounds: true
    }))
    
    const mockBoundary = {
      lane: 'Farm',
      startY: 100,
      endY: 150, // Very small boundary to force overcrowding
      centerY: 125,
      height: 50,
      usableHeight: 10 // Very small usable height
    }
    
    const analysis = errorSystem.analyzeLaneOvercrowding('Farm', mockNodes, mockBoundary)
    
    expect(analysis.lane).toBe('Farm')
    expect(analysis.nodeCount).toBe(2)
    expect(analysis.overcrowdingRatio).toBeGreaterThan(1)
    expect(analysis.severity).not.toBe('none')
    expect(analysis.recommendedAction).not.toBe('none')
  })

  it('should apply compression recovery for overcrowded lanes', () => {
    const errorSystem = getErrorHandlingSystem()
    
    // Create overcrowded scenario
    const mockNodes = Array.from({ length: 5 }, (_, index) => ({
      item: {
        id: `test-item-${index}`,
        name: `Test Item ${index}`,
        category: 'Actions' as const,
        sourceFile: 'farm_actions.csv'
      },
      position: { x: 300, y: 100 + (index * 20) },
      lane: 'Farm',
      tier: 0,
      withinBounds: false
    }))
    
    const mockBoundary = {
      lane: 'Farm',
      startY: 100,
      endY: 200,
      centerY: 150,
      height: 100,
      usableHeight: 60
    }
    
    const analysis = errorSystem.analyzeLaneOvercrowding('Farm', mockNodes, mockBoundary)
    const { recoveredNodes, recoveryContexts } = errorSystem.recoverOvercrowdedLane(analysis, mockNodes)
    
    expect(recoveredNodes.length).toBe(5)
    expect(recoveryContexts.length).toBeGreaterThan(0)
    
    // Check that nodes are properly spaced
    const yPositions = recoveredNodes.map(n => n.position.y).sort((a, b) => a - b)
    for (let i = 1; i < yPositions.length; i++) {
      const spacing = yPositions[i] - yPositions[i - 1]
      expect(spacing).toBeGreaterThanOrEqual(5) // Should have at least minimum spacing
    }
  })

  it('should create emergency spacing for extreme cases', () => {
    const errorSystem = getErrorHandlingSystem()
    
    // Create extreme overcrowding scenario
    const mockNodes = Array.from({ length: 10 }, (_, index) => ({
      item: {
        id: `test-item-${index}`,
        name: `Test Item ${index}`,
        category: 'Actions' as const,
        sourceFile: 'farm_actions.csv'
      },
      position: { x: 300, y: 100 + (index * 5) },
      lane: 'Farm',
      tier: 0,
      withinBounds: false
    }))
    
    const availableHeight = 200 // Limited height
    const emergencyNodes = errorSystem.createEmergencySpacingAlgorithm(mockNodes, availableHeight)
    
    expect(emergencyNodes.length).toBe(10)
    
    // Check that all nodes fit within available height
    const maxY = Math.max(...emergencyNodes.map(n => n.position.y))
    const nodeHalfHeight = LAYOUT_CONSTANTS.NODE_HEIGHT / 2
    expect(maxY + nodeHalfHeight).toBeLessThanOrEqual(availableHeight)
  })

  it('should generate user-friendly error messages', () => {
    const errorSystem = getErrorHandlingSystem()
    
    // Trigger an error by handling boundary failure
    const mockBoundary = {
      lane: 'Farm',
      startY: 100,
      endY: 200,
      centerY: 150,
      height: 100,
      usableHeight: 60
    }
    
    const boundaries = new Map([['Farm', mockBoundary]])
    const violatingPosition = { x: 300, y: 50 }
    
    errorSystem.handleBoundaryEnforcementFailure(
      violatingPosition,
      'Farm',
      boundaries,
      'test-node-1'
    )
    
    const errors = getUserFriendlyErrors()
    expect(errors.length).toBeGreaterThan(0)
    
    const error = errors[0]
    expect(error.title).toBeTruthy()
    expect(error.message).toBeTruthy()
    expect(error.suggestedActions.length).toBeGreaterThan(0)
    expect(error.recoveryApplied).toBe(true)
  })

  it('should generate comprehensive error recovery report', () => {
    const errorSystem = getErrorHandlingSystem()
    
    // Trigger multiple errors
    const mockBoundary = {
      lane: 'Farm',
      startY: 100,
      endY: 200,
      centerY: 150,
      height: 100,
      usableHeight: 60
    }
    
    const boundaries = new Map([['Farm', mockBoundary]])
    
    // Trigger boundary violations
    errorSystem.handleBoundaryEnforcementFailure(
      { x: 300, y: 50 },
      'Farm',
      boundaries,
      'test-node-1'
    )
    
    errorSystem.handleBoundaryEnforcementFailure(
      { x: 300, y: 250 },
      'Farm',
      boundaries,
      'test-node-2'
    )
    
    const report = generateErrorRecoveryReport()
    
    expect(report.totalErrors).toBeGreaterThan(0)
    expect(report.totalRecoveries).toBeGreaterThan(0)
    expect(report.summary).toBeTruthy()
    expect(report.errorsBySeverity).toBeTruthy()
    expect(report.recoveriesByStrategy).toBeTruthy()
  })

  it('should clear errors and recovery contexts', () => {
    const errorSystem = getErrorHandlingSystem()
    
    // Generate some errors first
    const mockBoundary = {
      lane: 'Farm',
      startY: 100,
      endY: 200,
      centerY: 150,
      height: 100,
      usableHeight: 60
    }
    
    const boundaries = new Map([['Farm', mockBoundary]])
    
    errorSystem.handleBoundaryEnforcementFailure(
      { x: 300, y: 50 },
      'Farm',
      boundaries,
      'test-node-1'
    )
    
    // Verify errors exist
    expect(getUserFriendlyErrors().length).toBeGreaterThan(0)
    expect(getRecoveryContext('test-node-1')).toBeTruthy()
    
    // Clear errors
    errorSystem.clearErrorsAndRecovery()
    
    // Verify errors are cleared
    expect(getUserFriendlyErrors().length).toBe(0)
    expect(getRecoveryContext('test-node-1')).toBeUndefined()
  })
})