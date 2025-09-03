// Simulation Web Worker - Phase 6B
// Runs the simulation engine in a separate thread

import { SimulationOrchestrator } from '../utils/orchestration/SimulationOrchestrator'
import { MapSerializer } from '../utils/MapSerializer'
import type { 
  WorkerInputMessage,
  WorkerOutputMessage,
  WorkerState,
  SimulationStats
} from '../types/worker-messages'
import type { 
  GameState,
  SerializedGameState
} from '../types/game-state'

// Worker state
let workerState: WorkerState = {
  initialized: false,
  running: false,
  engine: null,
  startTime: 0,
  lastTickTime: 0,
  tickTimes: [],
  errorCount: 0
}

let tickInterval: number | null = null

/**
 * Sends a message to the main thread
 */
function postMessage(message: WorkerOutputMessage) {
  self.postMessage(message)
}

/**
 * Handles incoming messages from main thread
 */
function handleMessage(event: MessageEvent<WorkerInputMessage>) {
  try {
    const message = event.data
    
    switch (message.type) {
      case 'initialize':
        handleInitialize(message.data.config, message.data.serializedParameters, message.data.gameData)
        break
        
      case 'start':
        handleStart(message.data?.speed)
        break
        
      case 'pause':
        handlePause()
        break
        
      case 'setSpeed':
        handleSetSpeed(message.data.speed)
        break
        
      case 'stop':
        handleStop()
        break
        
      case 'getState':
        handleGetState()
        break
        
      default:
        throw new Error(`Unknown message type: ${(message as any).type}`)
    }
  } catch (error) {
    handleError(error, false)
  }
}

/**
 * Initializes the simulation engine with configuration
 */
function handleInitialize(serializedConfig: any, serializedParameters?: any, gameData?: any) {
  try {
    console.log('🔧 Worker: Initializing simulation engine...')
    
    // Deserialize the configuration
    const config = MapSerializer.deserialize(serializedConfig)
    console.log('✅ Worker: Configuration deserialized', {
      hasQuickSetup: !!config.quickSetup,
      personaId: config.quickSetup?.personaId,
      parameterOverrides: config.parameterOverrides?.size || 0
    })
    
    // Detailed CSV data validation
    console.log('🔍 Worker: Validating CSV data...', {
      hasGameData: !!gameData,
      hasAllItems: !!(gameData?.allItems),
      itemCount: gameData?.allItems?.length || 0,
      hasItemsById: !!(gameData?.itemsById),
      itemsByIdCount: gameData?.itemsById ? Object.keys(gameData.itemsById).length : 0,
      hasItemsByGameFeature: !!(gameData?.itemsByGameFeature),
      gameFeatureCount: gameData?.itemsByGameFeature ? Object.keys(gameData.itemsByGameFeature).length : 0,
      hasItemsByCategory: !!(gameData?.itemsByCategory),
      categoryCount: gameData?.itemsByCategory ? Object.keys(gameData.itemsByCategory).length : 0
    })
    
    // Create game data store from passed data
    if (!gameData) {
      throw new Error('Worker initialization failed: No gameData object provided')
    }
    
    if (!gameData.allItems || gameData.allItems.length === 0) {
      throw new Error('Worker initialization failed: No CSV items in allItems array. CSV data must be loaded before initializing simulation.')
    }
    
    if (!gameData.itemsById || Object.keys(gameData.itemsById).length === 0) {
      throw new Error('Worker initialization failed: itemsById lookup is empty. CSV data structure is invalid.')
    }
    
    // Sample some items for validation
    const sampleItems = gameData.allItems.slice(0, 3)
    console.log('📋 Worker: Sample CSV items:', sampleItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      sourceFile: item.sourceFile
    })))
    
    // Validate CSV data structure
    const requiredProperties = ['id', 'name', 'category']
    const invalidItems = gameData.allItems.filter(item => {
      return !requiredProperties.every(prop => item[prop])
    })
    
    if (invalidItems.length > 0) {
      console.warn('⚠️ Worker: Found items with missing required properties:', 
        invalidItems.slice(0, 3).map(item => ({ id: item.id, missing: requiredProperties.filter(prop => !item[prop]) }))
      )
    }
    
    const gameDataStore = {
      itemsByGameFeature: gameData.itemsByGameFeature || {},
      itemsByCategory: gameData.itemsByCategory || {},
      allItems: gameData.allItems || [],
      getItemById: (id: string) => {
        const item = gameData.itemsById?.[id] || null
        if (!item) {
          console.warn(`⚠️ Worker: Item not found: ${id}`)
        }
        return item
      },
      getSpecializedDataByFile: (filename: string) => gameData.specializedData?.[filename] || []
    }
    
    console.log('✅ Worker: Game data store created successfully', {
      totalItems: gameData.allItems.length,
      gameFeatures: Object.keys(gameDataStore.itemsByGameFeature),
      categories: Object.keys(gameDataStore.itemsByCategory)
    })
    
    // Create simulation engine with game data
    console.log('🔧 Worker: Creating SimulationOrchestrator with validated CSV data...')
    workerState.engine = new SimulationOrchestrator(config, gameDataStore)
    workerState.initialized = true
    workerState.errorCount = 0
    
    console.log('✅ Worker: Simulation engine initialized successfully')
    
    // Notify main thread we're ready
    postMessage({
      type: 'ready',
      data: {
        initialized: true,
        engineVersion: '6B.2.0',
        csvItemCount: gameData.allItems.length,
        gameFeatures: Object.keys(gameDataStore.itemsByGameFeature).length,
        categories: Object.keys(gameDataStore.itemsByCategory).length
      }
    })
    
  } catch (error) {
    console.error('❌ Worker: Initialization failed:', error)
    
    // Send detailed error information
    postMessage({
      type: 'error',
      data: {
        message: `Initialization failed: ${error}`,
        details: {
          hasGameData: !!gameData,
          itemCount: gameData?.allItems?.length || 0,
          configDeserialized: !!serializedConfig
        },
        fatal: true
      }
    })
  }
}

/**
 * Starts the simulation loop
 */
function handleStart(speed?: number) {
  if (!workerState.initialized || !workerState.engine) {
    handleError(new Error('Engine not initialized'), false)
    return
  }
  
  console.log('▶️ Worker: Starting simulation...')
  
  workerState.running = true
  workerState.startTime = Date.now()
  workerState.lastTickTime = Date.now()
  
  if (speed) {
    workerState.engine.setSpeed(speed)
  }
  
  // Start the simulation loop
  startSimulationLoop()
}

/**
 * Pauses the simulation
 */
function handlePause() {
  console.log('⏸️ Worker: Pausing simulation...')
  workerState.running = false
  
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = null
  }
}

/**
 * Sets simulation speed
 */
function handleSetSpeed(speed: number) {
  if (workerState.engine) {
    workerState.engine.setSpeed(speed)
    console.log(`🚀 Worker: Speed set to ${speed}x`)
  }
}

/**
 * Stops the simulation completely
 */
function handleStop() {
  console.log('⏹️ Worker: Stopping simulation...')
  workerState.running = false
  
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = null
  }
  
  // Send completion message
  if (workerState.engine) {
    const gameState = workerState.engine.getGameState()
    const serializedState = serializeGameState(gameState)
    
    postMessage({
      type: 'complete',
      data: {
        reason: 'manual',
        finalState: serializedState,
        stats: calculateStats(),
        summary: `Simulation stopped manually after ${workerState.engine.getStats().daysPassed} days`
      }
    })
  }
}

/**
 * Gets current state without affecting simulation
 */
function handleGetState() {
  if (workerState.engine) {
    const gameState = workerState.engine.getGameState()
    const serializedState = serializeGameState(gameState)
    
    postMessage({
      type: 'state',
      data: {
        gameState: serializedState,
        stats: calculateStats()
      }
    })
  }
}

/**
 * Calculates the correct tick delay for different simulation speeds
 * Phase 8L: Fixed speed calibration - 1 tick = 0.5 minutes of game time
 * Game day = 1440 minutes = 2880 ticks total
 */
function calculateTickDelay(speed: number): number {
  // Speed configurations as per Phase 8L requirements
  const SPEED_CONFIGURATIONS: { [key: string]: number } = {
    '0.5': 200,   // 5 ticks/second = 2880 ticks / 5 = 576 seconds = 9.6 minutes per day
    '1': 100,     // 10 ticks/second = 2880 ticks / 10 = 288 seconds = 4.8 minutes per day  
    '2': 50,      // 20 ticks/second = 2880 ticks / 20 = 144 seconds = 2.4 minutes per day
    '5': 20,      // 50 ticks/second = 2880 ticks / 50 = 57.6 seconds = ~1 minute per day
    '10': 10,     // 100 ticks/second
    '50': 2,      // 500 ticks/second  
    '100': 1,     // 1000 ticks/second
    'max': 4.17   // 240 ticks/second = 2880 ticks / 240 = 12 seconds per day
  }
  
  // Find exact match first
  const speedKey = speed.toString()
  if (SPEED_CONFIGURATIONS[speedKey]) {
    return Math.max(1, Math.floor(SPEED_CONFIGURATIONS[speedKey]))
  }
  
  // Handle 'max' speed specially
  if (speed >= 1000) {
    return Math.max(1, Math.floor(SPEED_CONFIGURATIONS['max']))
  }
  
  // For other speeds, interpolate based on base formula
  // Base: 0.5x = 200ms, so delay = 100ms / speed
  const baseDelay = 100 / speed
  return Math.max(1, Math.floor(baseDelay))
}

/**
 * Starts the main simulation loop
 */
function startSimulationLoop() {
  if (!workerState.running || !workerState.engine) {
    return
  }
  
  // Use requestAnimationFrame equivalent for workers (setTimeout with 0)
  const tick = () => {
    if (!workerState.running || !workerState.engine) {
      return
    }
    
    try {
      const tickStartTime = Date.now()
      
      // Execute simulation tick
      const tickResult = workerState.engine.tick()
      
      // Track performance
      const tickTime = Date.now() - tickStartTime
      workerState.tickTimes.push(tickTime)
      if (workerState.tickTimes.length > 100) {
        workerState.tickTimes.shift() // Keep only last 100 tick times
      }
      
      // Log tick execution (throttled to avoid spam)
      const stats = workerState.engine.getStats()
      if (stats.tickCount % 10 === 0) { // Log every 10th tick
        console.log(`🔄 Worker: Tick ${stats.tickCount}`, {
          day: tickResult.gameState.time?.day,
          energy: tickResult.gameState.resources?.energy?.current,
          gold: tickResult.gameState.resources?.gold,
          actions: tickResult.executedActions.length,
          events: tickResult.events.length,
          tickTime: `${tickTime}ms`
        })
      }
      
      // Serialize game state for transmission
      const serializedState = serializeGameState(tickResult.gameState)
      
      // Validate serialization
      if (!serializedState.time || !serializedState.resources) {
        console.error('❌ Worker: Invalid serialized state structure', {
          hasTime: !!serializedState.time,
          hasResources: !!serializedState.resources,
          hasProgression: !!serializedState.progression
        })
      }
      
      // Send tick update to main thread
      postMessage({
        type: 'tick',
        data: {
          gameState: serializedState,
          executedActions: tickResult.executedActions || [],
          events: tickResult.events || [],
          deltaTime: tickResult.deltaTime || 1,
          tickCount: stats.tickCount,
          isComplete: tickResult.isComplete || false,
          isStuck: tickResult.isStuck || false
        }
      })
      
      // Check completion conditions
      if (tickResult.isComplete) {
        handleCompletion('victory', tickResult.gameState)
        return
      }
      
      if (tickResult.isStuck) {
        handleCompletion('bottleneck', tickResult.gameState)
        return
      }
      
      // Schedule next tick with corrected timing system
      const speed = tickResult.gameState.time.speed
      const nextTickDelay = calculateTickDelay(speed)
      
      setTimeout(tick, nextTickDelay)
      
    } catch (error) {
      handleError(error, false)
    }
  }
  
  // Start the first tick
  tick()
}

/**
 * Handles simulation completion
 */
function handleCompletion(reason: 'victory' | 'bottleneck', gameState: GameState) {
  console.log(`🏁 Worker: Simulation complete (${reason})`)
  
  workerState.running = false
  
  const serializedState = serializeGameState(gameState)
  const stats = calculateStats()
  
  let summary = ''
  switch (reason) {
    case 'victory':
      summary = `Victory achieved after ${stats.daysPassed} days!`
      break
    case 'bottleneck':
      summary = `Bottleneck detected after ${stats.daysPassed} days - simulation stuck`
      break
  }
  
  postMessage({
    type: 'complete',
    data: {
      reason,
      finalState: serializedState,
      stats,
      summary
    }
  })
}

/**
 * Serializes GameState for transmission to main thread
 */
function serializeGameState(gameState: GameState): SerializedGameState {
  return {
    time: gameState.time,
    resources: gameState.resources,
    progression: gameState.progression,
    inventory: {
      tools: Array.from(gameState.inventory.tools.entries()),
      weapons: Array.from(gameState.inventory.weapons.entries()),
      armor: Array.from(gameState.inventory.armor.entries()),
      capacity: gameState.inventory.capacity,
      currentWeight: gameState.inventory.currentWeight
    },
    processes: gameState.processes,
    helpers: gameState.helpers,
    location: gameState.location,
    automation: {
      plantingEnabled: gameState.automation.plantingEnabled,
      plantingStrategy: gameState.automation.plantingStrategy,
      wateringEnabled: gameState.automation.wateringEnabled,
      harvestingEnabled: gameState.automation.harvestingEnabled,
      autoCleanupEnabled: gameState.automation.autoCleanupEnabled,
      targetCrops: Array.from(gameState.automation.targetCrops.entries()),
      wateringThreshold: gameState.automation.wateringThreshold,
      energyReserve: gameState.automation.energyReserve
    },
    priorities: gameState.priorities
  }
}

/**
 * Calculates current simulation statistics
 */
function calculateStats(): SimulationStats {
  const now = Date.now()
  const engineStats = workerState.engine?.getStats() || {
    tickCount: 0,
    daysPassed: 0,
    currentPhase: 'Unknown'
  }
  
  const averageTickTime = workerState.tickTimes.length > 0
    ? workerState.tickTimes.reduce((sum, time) => sum + time, 0) / workerState.tickTimes.length
    : 0
  
  return {
    tickCount: engineStats.tickCount,
    daysPassed: engineStats.daysPassed,
    realTimeElapsed: now - workerState.startTime,
    simulationTimeElapsed: engineStats.daysPassed * 24 * 60, // Convert days to minutes
    currentSpeed: workerState.engine?.getGameState()?.time?.speed || 1,
    averageTickTime,
    isRunning: workerState.running,
    phase: engineStats.currentPhase,
    memoryUsage: (performance as any)?.memory?.usedJSHeapSize ? 
      (performance as any).memory.usedJSHeapSize / 1024 / 1024 : undefined
  }
}

/**
 * Handles errors in the worker
 */
function handleError(error: any, fatal: boolean) {
  workerState.errorCount++
  
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined
  
  console.error(`❌ Worker Error (${fatal ? 'FATAL' : 'NON-FATAL'}):`, errorMessage)
  
  if (fatal) {
    workerState.running = false
    if (tickInterval) {
      clearInterval(tickInterval)
      tickInterval = null
    }
  }
  
  postMessage({
    type: 'error',
    data: {
      message: errorMessage,
      stack: errorStack,
      fatal
    }
  })
  
  // If too many errors, stop simulation
  if (workerState.errorCount > 10) {
    console.error('❌ Worker: Too many errors, stopping simulation')
    handleStop()
  }
}

/**
 * Set up message listener
 */
self.addEventListener('message', handleMessage)

/**
 * Handle uncaught errors
 */
self.addEventListener('error', (event) => {
  handleError(new Error(`Uncaught error: ${event.message}`), true)
})

/**
 * Handle unhandled promise rejections
 */
self.addEventListener('unhandledrejection', (event) => {
  handleError(new Error(`Unhandled promise rejection: ${event.reason}`), true)
})

// Notify that worker is loaded
console.log('🔧 Simulation Worker loaded and ready')
postMessage({
  type: 'ready',
  data: {
    initialized: false,
    engineVersion: '6B.1.0'
  }
})
