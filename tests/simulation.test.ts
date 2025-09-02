/**
 * Comprehensive Simulation Engine Tests - Phase 8G
 * Tests all major systems integration and persona behaviors
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SimulationEngine } from '../src/utils/SimulationEngine'
import { FarmSystem } from '../src/utils/systems/FarmSystem'
import { HelperSystem } from '../src/utils/systems/HelperSystem'
import { CombatSystem } from '../src/utils/systems/CombatSystem'
import { CraftingSystem } from '../src/utils/systems/CraftingSystem'
import { MineSystem } from '../src/utils/systems/MineSystem'
import { CSVDataParser } from '../src/utils/CSVDataParser'
import type { SimulationConfig, GameState } from '../src/types'

// Mock game data store
const mockGameDataStore = {
  itemsByCategory: {
    cleanup: [
      {
        id: 'clear_weeds_1',
        name: 'Clear Weeds #1',
        plots_added: '2',
        energy_cost: '15',
        tool_required: 'hands',
        materials_gain: ''
      }
    ],
    crops: [
      {
        id: 'turnip',
        name: 'Turnip',
        time: '7',
        stages: '3',
        energy_value: '2'
      }
    ]
  },
  itemsByGameFeature: {
    Adventure: [
      {
        id: 'meadow_path_short',
        name: 'Meadow Path Short',
        duration: '3',
        energy_cost: '10',
        gold_gain: '25',
        boss: 'giant_slime'
      }
    ]
  },
  getItemById: vi.fn((id: string) => {
    if (id === 'clear_weeds_1') {
      return {
        id: 'clear_weeds_1',
        plots_added: '2',
        energy_cost: '15',
        tool_required: 'hands'
      }
    }
    if (id === 'turnip') {
      return {
        id: 'turnip',
        time: '7',
        stages: '3',
        energy_value: '2'
      }
    }
    return null
  })
}

// Test configuration factory
function createTestConfig(personaId: string = 'casual'): SimulationConfig {
  return {
    id: 'test-sim',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    quickSetup: {
      name: `Test ${personaId}`,
      personaId: personaId as any,
      duration: { mode: 'fixed', maxDays: 7 },
      dataSource: 'current',
      enableParameterOverrides: false,
      generateDetailedLogs: true
    },
    parameterOverrides: new Map(),
    isValid: true,
    validationErrors: []
  }
}

describe('SimulationEngine Integration Tests', () => {
  let engine: SimulationEngine
  let gameState: GameState

  beforeEach(() => {
    const config = createTestConfig()
    engine = new SimulationEngine(config, mockGameDataStore)
    gameState = engine.getGameState()
  })

  describe('CSV Data Parsing', () => {
    it('should parse material requirements correctly', () => {
      const materials = CSVDataParser.parseMaterials('Wood x5;Stone x3')
      expect(materials.get('wood')).toBe(5)
      expect(materials.get('stone')).toBe(3)
    })

    it('should handle different separators', () => {
      const materials = CSVDataParser.parseMaterials('Crystal×2;Silver×5')
      expect(materials.get('crystal')).toBe(2)
      expect(materials.get('silver')).toBe(5)
    })

    it('should parse numeric values with defaults', () => {
      expect(CSVDataParser.parseNumericValue('15')).toBe(15)
      expect(CSVDataParser.parseNumericValue('')).toBe(0)
      expect(CSVDataParser.parseNumericValue('invalid', 10)).toBe(10)
    })
  })

  describe('Farm System Integration', () => {
    it('should increase plots when cleanup actions are completed', () => {
      const initialPlots = gameState.progression.farmPlots
      
      // Execute cleanup action
      const result = engine.executeAction({
        id: 'test_cleanup',
        type: 'cleanup',
        screen: 'farm',
        target: 'clear_weeds_1',
        energyCost: 15,
        goldCost: 0,
        prerequisites: []
      })

      expect(result.success).toBe(true)
      expect(gameState.progression.farmPlots).toBe(initialPlots + 2)
      expect(gameState.progression.completedCleanups.has('clear_weeds_1')).toBe(true)
    })

    it('should process crop growth with water', () => {
      // Add a crop to test
      gameState.processes.crops.push({
        plotId: 1,
        cropType: 'turnip',
        plantedAt: gameState.time.totalMinutes - 5, // 5 minutes ago
        growthTimeRequired: 7,
        waterLevel: 1.0,
        growthStage: 1,
        readyToHarvest: false
      })

      // Process crop growth
      FarmSystem.processCropGrowth(gameState, 3, mockGameDataStore) // 3 minutes

      const crop = gameState.processes.crops[0]
      expect(crop.growthStage).toBeGreaterThan(1)
      expect(crop.waterLevel).toBeLessThan(1.0) // Water should be consumed
    })
  })

  describe('Helper System Integration', () => {
    it('should provide automation benefits', () => {
      // Add a helper
      gameState.helpers.gnomes.push({
        id: 'gnome_1',
        name: 'Test Gnome',
        role: 'waterer',
        level: 5,
        isHoused: true,
        experience: 0
      })

      // Add dry crops
      gameState.processes.crops.push({
        plotId: 1,
        cropType: 'turnip',
        plantedAt: gameState.time.totalMinutes,
        growthTimeRequired: 7,
        waterLevel: 0.1, // Dry
        growthStage: 1,
        readyToHarvest: false
      })

      // Set water available
      gameState.resources.water.current = 50

      // Process helpers
      HelperSystem.processHelpers(gameState, 1, mockGameDataStore)

      // Helper should have watered the crop
      expect(gameState.processes.crops[0].waterLevel).toBe(1.0)
      expect(gameState.resources.water.current).toBe(49) // Water consumed
    })
  })

  describe('Combat System Integration', () => {
    it('should produce reasonable combat results', () => {
      const route = {
        id: 'meadow_path',
        length: 'Short' as const,
        waveCount: 3,
        boss: { type: 'giant_slime', hp: 150, damage: 8 },
        enemyRolls: 'fixed',
        goldGain: 25,
        xpGain: 30
      }

      const weapons = new Map([
        ['sword', { type: 'sword', damage: 10, attackSpeed: 1.0, level: 1 }]
      ])

      const armor = { defense: 10, effect: 'none' }

      const result = CombatSystem.simulateAdventure(
        route,
        weapons,
        armor,
        5, // Hero level
        [], // Helpers
        {} // Parameters
      )

      expect(result.success).toBe(true)
      expect(result.finalHP).toBeGreaterThan(0)
      expect(result.totalGold).toBeGreaterThan(0)
      expect(result.totalXP).toBeGreaterThan(0)
    })
  })

  describe('Crafting and Mining Integration', () => {
    it('should process crafting operations', () => {
      // Add a crafting job
      gameState.processes.crafting.push({
        itemId: 'hoe',
        startedAt: gameState.time.totalMinutes,
        duration: 5,
        progress: 0,
        energyCost: 20,
        materials: new Map([['stone', 5], ['wood', 3]])
      })

      // Process crafting
      CraftingSystem.processCrafting(gameState, 3, mockGameDataStore) // 3 minutes

      const craft = gameState.processes.crafting[0]
      expect(craft.progress).toBe(0.6) // 3/5 = 0.6
    })

    it('should process mining operations', () => {
      // Start mining
      gameState.processes.mining = {
        depth: 0,
        startedAt: gameState.time.totalMinutes,
        energyDrainRate: 2,
        materialTimer: 0
      }

      gameState.resources.energy.current = 100

      // Process mining
      MineSystem.processMining(gameState, 1) // 1 minute

      expect(gameState.processes.mining.depth).toBe(10) // 10 meters per minute
      expect(gameState.resources.energy.current).toBe(98) // 2 energy drained
    })
  })

  describe('Resource Regeneration', () => {
    it('should regenerate energy over time', () => {
      const initialEnergy = gameState.resources.energy.current
      gameState.resources.energy.current = 50 // Set to half

      // Simulate several ticks
      for (let i = 0; i < 10; i++) {
        engine.tick()
      }

      // Energy should have regenerated (0.5 per minute * 10 minutes = 5)
      expect(gameState.resources.energy.current).toBeGreaterThan(50)
    })

    it('should regenerate water with auto-pump', () => {
      gameState.resources.water.current = 10
      gameState.resources.water.autoGenRate = 2 // 2 per minute

      // Simulate several ticks
      for (let i = 0; i < 5; i++) {
        engine.tick()
      }

      // Water should have regenerated (2 per minute * 5 minutes = 10)
      expect(gameState.resources.water.current).toBeGreaterThan(10)
    })
  })

  describe('Victory and Bottleneck Conditions', () => {
    it('should detect victory when Great Estate is reached', () => {
      gameState.progression.farmPlots = 90

      const result = engine.tick()
      expect(result.isComplete).toBe(true)
    })

    it('should detect victory when hero reaches max level', () => {
      gameState.progression.heroLevel = 15

      const result = engine.tick()
      expect(result.isComplete).toBe(true)
    })

    it('should detect bottlenecks after 3 days without progress', () => {
      // Set up a stagnant state
      gameState.time.day = 5
      gameState.resources.energy.current = 5 // Low energy
      gameState.resources.gold = 10 // Low gold
      
      // Force bottleneck detection by running multiple ticks
      let result
      for (let i = 0; i < 5; i++) {
        result = engine.tick()
      }

      // Should eventually detect bottleneck
      expect(result?.isStuck).toBe(true)
    })
  })

  describe('7-Day Full Simulation', () => {
    it('should complete a 7-day simulation without errors', () => {
      const config = createTestConfig('casual')
      const testEngine = new SimulationEngine(config, mockGameDataStore)
      
      let tickCount = 0
      let errors = 0
      const maxTicks = 7 * 24 * 60 // 7 days in minutes

      while (tickCount < maxTicks) {
        try {
          const result = testEngine.tick()
          tickCount++

          // Stop if victory or stuck
          if (result.isComplete || result.isStuck) {
            break
          }

          // Check for error events
          const errorEvents = result.events.filter(e => e.type === 'error')
          errors += errorEvents.length

        } catch (error) {
          errors++
          console.error('Simulation error:', error)
          break
        }
      }

      expect(errors).toBe(0)
      expect(tickCount).toBeGreaterThan(100) // Should run for a reasonable time
    })
  })

  describe('Persona Behavior Differences', () => {
    it('should show different behaviors between personas', async () => {
      const personas = ['speedrunner', 'casual', 'weekend-warrior']
      const results: Record<string, any> = {}

      for (const personaId of personas) {
        const config = createTestConfig(personaId)
        const testEngine = new SimulationEngine(config, mockGameDataStore)
        
        // Run for 100 ticks
        let finalState
        for (let i = 0; i < 100; i++) {
          const result = testEngine.tick()
          finalState = result.gameState
          
          if (result.isComplete || result.isStuck) break
        }

        results[personaId] = {
          plots: finalState?.progression.farmPlots || 0,
          level: finalState?.progression.heroLevel || 1,
          gold: finalState?.resources.gold || 0,
          day: finalState?.time.day || 1
        }
      }

      // Speedrunner should generally progress faster
      expect(results.speedrunner.plots).toBeGreaterThanOrEqual(results.casual.plots)
      
      // All personas should make some progress
      for (const persona of personas) {
        expect(results[persona].day).toBeGreaterThan(1)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle system errors gracefully', () => {
      // Mock a system to throw an error
      const originalProcessCropGrowth = FarmSystem.processCropGrowth
      FarmSystem.processCropGrowth = vi.fn(() => {
        throw new Error('Test error')
      })

      // Should not crash the simulation
      const result = engine.tick()
      expect(result).toBeDefined()
      expect(result.gameState).toBeDefined()

      // Restore original function
      FarmSystem.processCropGrowth = originalProcessCropGrowth
    })

    it('should return safe fallback on critical errors', () => {
      // Mock the entire tick to throw
      const originalMakeDecisions = engine['makeDecisions']
      engine['makeDecisions'] = vi.fn(() => {
        throw new Error('Critical error')
      })

      const result = engine.tick()
      expect(result.isStuck).toBe(true)
      expect(result.events).toHaveLength(1)
      expect(result.events[0].type).toBe('error')
    })
  })
})

describe('CSVDataParser Utility Tests', () => {
  describe('Material Parsing', () => {
    it('should parse complex material strings', () => {
      const materials = CSVDataParser.parseMaterials('Enchanted Wood x1;Crystal x3;Mythril x2')
      expect(materials.get('enchanted_wood')).toBe(1)
      expect(materials.get('crystal')).toBe(3)
      expect(materials.get('mythril')).toBe(2)
    })

    it('should handle empty and invalid strings', () => {
      expect(CSVDataParser.parseMaterials('')).toEqual(new Map())
      expect(CSVDataParser.parseMaterials('invalid')).toEqual(new Map())
      expect(CSVDataParser.parseMaterials('Wood')).toEqual(new Map()) // No quantity
    })
  })

  describe('Numeric Parsing', () => {
    it('should parse various numeric formats', () => {
      expect(CSVDataParser.parseNumericValue('123')).toBe(123)
      expect(CSVDataParser.parseNumericValue('1,234')).toBe(1234)
      expect(CSVDataParser.parseNumericValue('$50')).toBe(50)
      expect(CSVDataParser.parseNumericValue('15 minutes')).toBe(15)
    })
  })
})
