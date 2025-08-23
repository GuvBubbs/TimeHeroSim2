import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  validatePositionWithinBounds, 
  enforceBoundaryConstraints,
  runAutomatedBoundaryTests,
  runAutomatedPerformanceTests
} from '@/utils/graphBuilder'
import { mockFarmItems } from '../fixtures/gameDataFixtures'

// Mock console methods
vi.mock('console', () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
}))

describe('Core Validation Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Validation Functions', () => {
    it('should validate positions within boundaries', () => {
      const boundary = {
        lane: 'Farm',
        startY: 0,
        endY: 200,
        centerY: 100,
        height: 200,
        usableHeight: 160
      }
      const boundaries = new Map([['Farm', boundary]])
      
      const validPosition = { x: 200, y: 100 }
      const result = validatePositionWithinBounds(validPosition, 'Farm', boundaries)
      
      expect(result.withinBounds).toBe(true)
      expect(result.violation).toBeUndefined()
    })

    it('should enforce boundary constraints', () => {
      const boundary = {
        lane: 'Farm',
        startY: 100,
        endY: 300,
        centerY: 200,
        height: 200,
        usableHeight: 160
      }
      const boundaries = new Map([['Farm', boundary]])
      
      const positionAbove = { x: 200, y: 50 }
      const adjustedPosition = enforceBoundaryConstraints(positionAbove, 'Farm', boundaries)
      
      expect(adjustedPosition.y).toBeGreaterThan(positionAbove.y)
      expect(adjustedPosition.x).toBe(positionAbove.x)
    })
  })

  describe('Automated Tests', () => {
    it('should run boundary tests successfully', () => {
      const result = runAutomatedBoundaryTests(mockFarmItems)
      
      expect(result.testName).toBe('Automated Boundary Tests')
      expect(result.passed).toBeDefined()
      expect(result.issues).toBeDefined()
      expect(result.recommendations).toBeDefined()
    })

    it('should run performance tests successfully', () => {
      const result = runAutomatedPerformanceTests(mockFarmItems)
      
      expect(result.testName).toBe('Automated Performance Tests')
      expect(result.passed).toBeDefined()
      expect(result.metrics).toBeDefined()
      expect(result.metrics?.validationTime).toBeGreaterThan(0)
    })
  })
})