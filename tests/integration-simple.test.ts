/**
 * Simple Integration Test - Phase 8G
 * Tests basic simulation functionality without complex system interactions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SimulationOrchestrator } from '../src/utils/SimulationOrchestrator'
import type { SimulationConfig } from '../src/types'

// Simple mock game data store
const mockGameDataStore = {
  itemsByCategory: {
    cleanup: [],
    crops: []
  },
  itemsByGameFeature: {
    Adventure: []
  },
  getItemById: vi.fn(() => null)
}

function createSimpleConfig(): SimulationConfig {
  return {
    id: 'simple-test',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    quickSetup: {
      name: 'Simple Test',
      personaId: 'casual',
      duration: { mode: 'fixed', maxDays: 1 },
      dataSource: 'current',
      enableParameterOverrides: false,
      generateDetailedLogs: false
    },
    parameterOverrides: new Map(),
    isValid: true,
    validationErrors: []
  }
}

describe('Simple Integration Tests', () => {
  let engine: SimulationOrchestrator

  beforeEach(() => {
    const config = createSimpleConfig()
    engine = new SimulationOrchestrator(config, mockGameDataStore)
  })

  it('should initialize without errors', () => {
    expect(engine).toBeDefined()
    const gameState = engine.getGameState()
    expect(gameState).toBeDefined()
    expect(gameState.time.day).toBe(1)
    expect(gameState.resources.energy.current).toBeGreaterThan(0)
  })

  it('should process ticks without crashing', () => {
    let successfulTicks = 0
    
    for (let i = 0; i < 100; i++) {
      try {
        const result = engine.tick()
        expect(result).toBeDefined()
        expect(result.gameState).toBeDefined()
        successfulTicks++
        
        if (result.isComplete || result.isStuck) {
          break
        }
      } catch (error) {
        console.error(`Tick ${i} failed:`, error)
        break
      }
    }
    
    expect(successfulTicks).toBeGreaterThan(50) // Should run for at least 50 ticks
  })

  it('should advance time correctly', () => {
    const initialTime = engine.getGameState().time.totalMinutes
    
    // Run 10 ticks
    for (let i = 0; i < 10; i++) {
      engine.tick()
    }
    
    const finalTime = engine.getGameState().time.totalMinutes
    expect(finalTime).toBeGreaterThan(initialTime)
  })

  it('should regenerate energy over time', () => {
    const gameState = engine.getGameState()
    gameState.resources.energy.current = 50 // Set to half
    
    // Run several ticks
    for (let i = 0; i < 20; i++) {
      engine.tick()
    }
    
    // Energy should have regenerated
    expect(gameState.resources.energy.current).toBeGreaterThan(50)
  })

  it('should detect victory conditions', () => {
    const gameState = engine.getGameState()
    
    // Set victory condition
    gameState.progression.farmPlots = 90
    
    const result = engine.tick()
    expect(result.isComplete).toBe(true)
  })

  it('should handle different personas', () => {
    const personas = ['speedrunner', 'casual', 'weekend-warrior']
    
    for (const personaId of personas) {
      const config = createSimpleConfig()
      config.quickSetup.personaId = personaId as any
      
      const testEngine = new SimulationOrchestrator(config, mockGameDataStore)
      
      // Should initialize without errors
      expect(testEngine).toBeDefined()
      
      // Should process at least one tick
      const result = testEngine.tick()
      expect(result).toBeDefined()
    }
  })

  it('should maintain game state consistency', () => {
    const gameState = engine.getGameState()
    const initialEnergy = gameState.resources.energy.current
    const initialGold = gameState.resources.gold
    
    // Run simulation
    for (let i = 0; i < 50; i++) {
      const result = engine.tick()
      
      // Basic consistency checks
      expect(gameState.resources.energy.current).toBeGreaterThanOrEqual(0)
      expect(gameState.resources.energy.current).toBeLessThanOrEqual(gameState.resources.energy.max)
      expect(gameState.resources.gold).toBeGreaterThanOrEqual(0)
      expect(gameState.time.totalMinutes).toBeGreaterThan(0)
      
      if (result.isComplete || result.isStuck) {
        break
      }
    }
  })
})

describe('System Error Resilience', () => {
  it('should handle missing game data gracefully', () => {
    const emptyGameDataStore = {
      itemsByCategory: {},
      itemsByGameFeature: {},
      getItemById: vi.fn(() => null)
    }
    
    const config = createSimpleConfig()
    const engine = new SimulationOrchestrator(config, emptyGameDataStore)
    
    // Should not crash even with empty data
    expect(() => {
      for (let i = 0; i < 10; i++) {
        engine.tick()
      }
    }).not.toThrow()
  })

  it('should handle parameter overrides', () => {
    const config = createSimpleConfig()
    config.parameterOverrides = new Map([
      ['farm.efficiency.energyValue', 2.0],
      ['adventure.thresholds.riskTolerance', 0.8]
    ])
    
    const engine = new SimulationOrchestrator(config, mockGameDataStore)
    
    // Should initialize with overrides
    expect(engine).toBeDefined()
    
    // Should process ticks normally
    const result = engine.tick()
    expect(result).toBeDefined()
  })
})
