// Simulation Web Worker - Phase 6B
// Runs the simulation engine in a separate thread

import { SimulationEngine } from '../utils/SimulationEngine'
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
    console.log('✅ Worker: Configuration deserialized', config)
    
    // Create game data store from passed data
    if (!gameData || !gameData.allItems || gameData.allItems.length === 0) {
      throw new Error('Worker initialization failed: No CSV data provided. Simulation requires real game data.')
    }
    
    const gameDataStore = {
      itemsByGameFeature: gameData.itemsByGameFeature || {},
      itemsByCategory: gameData.itemsByCategory || {},
      allItems: gameData.allItems || [],
      getItemById: (id: string) => gameData.itemsById?.[id] || null,
      getSpecializedDataByFile: (filename: string) => gameData.specializedData?.[filename] || []
    }
    
    console.log('✅ Worker: Game data store created with', gameData.allItems.length, 'items')
    
    // Create simulation engine with game data
    workerState.engine = new SimulationEngine(config, gameDataStore)
    workerState.initialized = true
    workerState.errorCount = 0
    
    console.log('✅ Worker: Simulation engine initialized')
    
    // Notify main thread we're ready
    postMessage({
      type: 'ready',
      data: {
        initialized: true,
        engineVersion: '6B.1.0'
      }
    })
    
  } catch (error) {
    console.error('❌ Worker: Initialization failed:', error)
    handleError(error, true)
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
      
      // Serialize game state for transmission
      const serializedState = serializeGameState(tickResult.gameState)
      
      // Send tick update to main thread
      postMessage({
        type: 'tick',
        data: {
          gameState: serializedState,
          executedActions: tickResult.executedActions,
          events: tickResult.events,
          deltaTime: tickResult.deltaTime,
          tickCount: workerState.engine.getStats().tickCount,
          isComplete: tickResult.isComplete,
          isStuck: tickResult.isStuck
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
      
      // Schedule next tick
      const speed = tickResult.gameState.time.speed
      const nextTickDelay = Math.max(1, Math.floor(16 / speed)) // Minimum 1ms, scaled by speed
      
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
