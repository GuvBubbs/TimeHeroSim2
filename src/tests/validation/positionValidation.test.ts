import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  runPositionValidation,
  getValidationSummary,
  getNodeDebugInfo,
  runAutomatedBoundaryTests,
  runAutomatedPerformanceTests,
  runAllAutomatedTests,
  validateAllPositions,
  validatePositionWithinBounds,
  enforceBoundaryConstraints
} from '@/utils/graphBuilder'
import {
  mockFarmItems,
  mockBlacksmithItems,
  mockMixedItems,
  mockOvercrowdedLaneItems
} from '../fixtures/gameDataFixtures'
import type { GameDataItem } from '@/types/game-data'

// Mock console methods to avoid noise in tests
vi.mock('console', () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
}))

describe('Position Validation System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validatePositionWithinBounds', () => {
    it('should validate position within lane boundaries', () => {
      const boundary = {
        lane: 'Farm',
        startY: 0,
        endY: 200,
        centerY: 100,
        height: 200,
        usableHeight: 160
      }
      const boundaries = new Map([['Farm', boundary]])
      
      // Position within bounds
      const validPosition = { x: 200, y: 100 }
      const validResult = validatePositionWithinBounds(validPosition, 'Farm', boundaries)
      
      expect(validResult.withinBounds).toBe(true)
      expect(validResult.violation).toBeUndefined()
    })

    it('should detect boundary violations', () => {
      const boundary = {
        lane: 'Farm',
        startY: 0,
        endY: 200,
        centerY: 100,
        height: 200,
        usableHeight: 160
      }
      const boundaries = new Map([['Farm', boundary]])
      
      // Position above bounds
      const invalidPosition = { x: 200, y: -50 }
      const invalidResult = validatePositionWithinBounds(invalidPosition, 'Farm', boundaries)
      
      expect(invalidResult.withinBounds).toBe(false)
      expect(invalidResult.violation).toBeDefined()
      expect(invalidResult.violation?.violationType).toBe('top')
    })

    it('should handle missing lane boundaries', () => {
      const boundaries = new Map()
      const position = { x: 200, y: 100 }
      
      const result = validatePositionWithinBounds(position, 'NonExistentLane', boundaries)
      
      expect(result.withinBounds).toBe(false)
      expect(result.violation).toBeUndefined()
    })
  })

  describe('enforceBoundaryConstraints', () => {
    it('should adjust position to fit within boundaries', () => {
      const boundary = {
        lane: 'Farm',
        startY: 100,
        endY: 300,
        centerY: 200,
        height: 200,
        usableHeight: 160
      }
      const boundaries = new Map([['Farm', boundary]])
      
      // Position above bounds - should be adjusted down
      const positionAbove = { x: 200, y: 50 }
      const adjustedAbove = enforceBoundaryConstraints(positionAbove, 'Farm', boundaries)
      
      expect(adjustedAbove.y).toBeGreaterThan(positionAbove.y)
      expect(adjustedAbove.x).toBe(positionAbove.x)
      
      // Position below bounds - should be adjusted up
      const positionBelow = { x: 200, y: 400 }
      const adjustedBelow = enforceBoundaryConstraints(positionBelow, 'Farm', boundaries)
      
      expect(adjustedBelow.y).toBeLessThan(positionBelow.y)
      expect(adjustedBelow.x).toBe(positionBelow.x)
    })

    it('should not adjust position already within bounds', () => {
      const boundary = {
        lane: 'Farm',
        startY: 100,
        endY: 300,
        centerY: 200,
        height: 200,
        usableHeight: 160
      }
      const boundaries = new Map([['Farm', boundary]])
      
      const validPosition = { x: 200, y: 200 }
      const result = enforceBoundaryConstraints(validPosition, 'Farm', boundaries)
      
      expect(result).toEqual(validPosition)
    })
  })

  describe('runAutomatedBoundaryTests', () => {
    it('should run boundary compliance tests on game items', () => {
      const result = runAutomatedBoundaryTests(mockMixedItems)
      
      expect(result.testName).toBe('Automated Boundary Tests')
      expect(result.passed).toBeDefined()
      expect(result.issues).toBeDefined()
      expect(result.recommendations).toBeDefined()
      expect(result.metrics).toBeDefined()
      expect(result.metrics?.testedNodes).toBeGreaterThan(0)
    })

    it('should handle empty item list', () => {
      const result = runAutomatedBoundaryTests([])
      
      expect(result.passed).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].message).toContain('No tree items found')
    })

    it('should test only Actions and Unlocks categories', () => {
      const mixedCategoryItems: GameDataItem[] = [
        ...mockFarmItems,
        {
          id: 'data-item',
          name: 'Data Item',
          category: 'Data',
          sourceFile: 'weapons.csv',
          goldCost: 100,
          energyCost: 10,
          level: 1,
          prerequisites: [],
          categories: ['weapon'],
          type: 'weapon'
        }
      ]
      
      const result = runAutomatedBoundaryTests(mixedCategoryItems)
      
      // Should only test the Actions items, not the Data item
      expect(result.metrics?.testedNodes).toBe(mockFarmItems.length)
    })
  })

  describe('runAutomatedPerformanceTests', () => {
    it('should measure validation performance', () => {
      const result = runAutomatedPerformanceTests(mockMixedItems)
      
      expect(result.testName).toBe('Automated Performance Tests')
      expect(result.passed).toBeDefined()
      expect(result.metrics).toBeDefined()
      expect(result.metrics?.validationTime).toBeGreaterThan(0)
      expect(result.metrics?.nodesProcessed).toBeGreaterThan(0)
    })

    it('should detect performance issues', () => {
      // Mock performance.now to simulate slow execution
      const originalNow = performance.now
      let callCount = 0
      vi.mocked(performance.now).mockImplementation(() => {
        callCount++
        // First call (start): 0ms, Second call (end): 3000ms (3 seconds)
        return callCount === 1 ? 0 : 3000
      })
      
      const result = runAutomatedPerformanceTests(mockMixedItems)
      
      expect(result.passed).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].severity).toBe('error')
      expect(result.issues[0].message).toContain('exceeds')
      
      // Restore original function
      vi.mocked(performance.now).mockImplementation(originalNow)
    })
  })

  describe('runAllAutomatedTests', () => {
    it('should run all validation tests', () => {
      const results = runAllAutomatedTests(mockMixedItems)
      
      expect(results).toHaveLength(2) // Boundary + Performance tests
      expect(results[0].testName).toBe('Automated Boundary Tests')
      expect(results[1].testName).toBe('Automated Performance Tests')
    })

    it('should provide summary of all test results', () => {
      const results = runAllAutomatedTests(mockMixedItems)
      
      const passedTests = results.filter(r => r.passed).length
      const totalTests = results.length
      
      expect(totalTests).toBe(2)
      expect(passedTests).toBeGreaterThanOrEqual(0)
      expect(passedTests).toBeLessThanOrEqual(totalTests)
    })
  })

  describe('Integration Tests', () => {
    it('should handle overcrowded lane scenarios', () => {
      const result = runAutomatedBoundaryTests(mockOvercrowdedLaneItems)
      
      expect(result.testName).toBe('Automated Boundary Tests')
      expect(result.metrics?.testedNodes).toBe(mockOvercrowdedLaneItems.length)
      
      // May have boundary violations due to overcrowding
      if (!result.passed) {
        expect(result.recommendations).toContain('Review lane height calculations')
      }
    })

    it('should validate mixed item types correctly', () => {
      const result = runAutomatedBoundaryTests(mockMixedItems)
      
      expect(result.metrics?.testedNodes).toBeGreaterThan(0)
      
      // Should test farm and blacksmith items (Actions/Unlocks) but not adventure items (Data)
      const expectedTestCount = mockFarmItems.length + mockBlacksmithItems.length + 1 // +1 for tower item
      expect(result.metrics?.testedNodes).toBe(expectedTestCount)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid game data gracefully', () => {
      const invalidItems: GameDataItem[] = [
        {
          id: '',
          name: '',
          category: 'Actions',
          sourceFile: '',
          goldCost: 0,
          energyCost: 0,
          level: 0,
          prerequisites: [],
          categories: [],
          type: ''
        }
      ]
      
      const result = runAutomatedBoundaryTests(invalidItems)
      
      expect(result.testName).toBe('Automated Boundary Tests')
      expect(result.metrics?.testedNodes).toBe(1)
    })

    it('should handle missing prerequisites gracefully', () => {
      const itemsWithMissingPrereqs: GameDataItem[] = [
        {
          id: 'dependent-item',
          name: 'Dependent Item',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 100,
          energyCost: 10,
          level: 1,
          prerequisites: ['non-existent-prereq'],
          categories: ['farm'],
          type: 'action'
        }
      ]
      
      const result = runAutomatedBoundaryTests(itemsWithMissingPrereqs)
      
      expect(result.testName).toBe('Automated Boundary Tests')
      expect(result.metrics?.testedNodes).toBe(1)
    })
  })
})