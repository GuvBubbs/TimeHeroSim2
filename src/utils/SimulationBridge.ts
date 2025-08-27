// SimulationBridge - Phase 6B
// Main thread communication bridge to Web Worker

import { MapSerializer } from '@/utils/MapSerializer'
import type { 
  SimulationConfig,
  GameState,
  GameAction,
  GameEvent
} from '@/types'
import type { 
  WorkerInputMessage,
  WorkerOutputMessage,
  SimulationStats
} from '@/types/worker-messages'

// Event handler types
export type TickHandler = (data: {
  gameState: GameState
  executedActions: GameAction[]
  events: GameEvent[]
  deltaTime: number
  tickCount: number
  isComplete: boolean
  isStuck: boolean
}) => void

export type CompleteHandler = (data: {
  reason: 'victory' | 'bottleneck' | 'manual' | 'error'
  finalState: GameState
  stats: SimulationStats
  summary: string
}) => void

export type ErrorHandler = (data: {
  message: string
  stack?: string
  fatal: boolean
}) => void

export type StatsHandler = (stats: SimulationStats) => void

/**
 * Bridge for communication with simulation Web Worker
 */
export class SimulationBridge {
  private worker: Worker | null = null
  private isInitialized = false
  private isRunning = false
  
  // Event handlers
  private tickHandlers: TickHandler[] = []
  private completeHandlers: CompleteHandler[] = []
  private errorHandlers: ErrorHandler[] = []
  private statsHandlers: StatsHandler[] = []
  
  constructor() {
    console.log('🌉 SimulationBridge: Initializing...')
  }

  /**
   * Initializes the Web Worker and sets up communication
   */
  async initialize(config: SimulationConfig): Promise<void> {
    try {
      console.log('🚀 SimulationBridge: Starting worker initialization...')
      
      // Terminate existing worker if any
      if (this.worker) {
        this.terminate()
      }
      
      // Create new worker
      this.worker = new Worker(
        new URL('../workers/simulation.worker.ts', import.meta.url),
        { type: 'module' }
      )
      
      console.log('✅ SimulationBridge: Worker created')
      
      // Set up message handling
      this.worker.addEventListener('message', this.handleWorkerMessage.bind(this))
      this.worker.addEventListener('error', this.handleWorkerError.bind(this))
      
      // Wait for worker to be ready
      await this.waitForWorkerReady()
      
      // Serialize configuration for worker
      const serializedConfig = MapSerializer.serialize(config)
      console.log('🔧 SimulationBridge: Sending configuration to worker...')
      
      // Send initialization message
      this.sendMessage({
        type: 'initialize',
        data: {
          config: serializedConfig
        }
      })
      
      // Wait for initialization complete
      await this.waitForInitialization()
      
      this.isInitialized = true
      console.log('✅ SimulationBridge: Initialization complete')
      
    } catch (error) {
      console.error('❌ SimulationBridge: Initialization failed:', error)
      throw error
    }
  }

  /**
   * Starts the simulation
   */
  async start(speed: number = 1): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Bridge not initialized')
    }
    
    console.log(`▶️ SimulationBridge: Starting simulation at ${speed}x speed`)
    
    this.sendMessage({
      type: 'start',
      data: { speed }
    })
    
    this.isRunning = true
  }

  /**
   * Pauses the simulation
   */
  pause(): void {
    console.log('⏸️ SimulationBridge: Pausing simulation')
    
    this.sendMessage({
      type: 'pause'
    })
    
    this.isRunning = false
  }

  /**
   * Sets simulation speed
   */
  setSpeed(speed: number): void {
    if (!this.isInitialized) {
      throw new Error('Bridge not initialized')
    }
    
    console.log(`🚀 SimulationBridge: Setting speed to ${speed}x`)
    
    this.sendMessage({
      type: 'setSpeed',
      data: { speed }
    })
  }

  /**
   * Stops the simulation completely
   */
  stop(): void {
    console.log('⏹️ SimulationBridge: Stopping simulation')
    
    this.sendMessage({
      type: 'stop'
    })
    
    this.isRunning = false
  }

  /**
   * Gets current simulation state
   */
  async getState(): Promise<{ gameState: GameState; stats: SimulationStats }> {
    if (!this.isInitialized) {
      throw new Error('Bridge not initialized')
    }
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('State request timeout'))
      }, 5000)
      
      const handler = (event: MessageEvent<WorkerOutputMessage>) => {
        if (event.data.type === 'state') {
          clearTimeout(timeout)
          this.worker?.removeEventListener('message', handler)
          
          const gameState = this.deserializeGameState(event.data.data.gameState)
          resolve({
            gameState,
            stats: event.data.data.stats
          })
        }
      }
      
      this.worker?.addEventListener('message', handler)
      this.sendMessage({ type: 'getState' })
    })
  }

  /**
   * Terminates the worker and cleans up
   */
  terminate(): void {
    console.log('🔚 SimulationBridge: Terminating worker')
    
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    
    this.isInitialized = false
    this.isRunning = false
  }

  /**
   * Event handler registration
   */
  onTick(handler: TickHandler): void {
    this.tickHandlers.push(handler)
  }

  onComplete(handler: CompleteHandler): void {
    this.completeHandlers.push(handler)
  }

  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler)
  }

  onStats(handler: StatsHandler): void {
    this.statsHandlers.push(handler)
  }

  /**
   * Remove event handlers
   */
  removeTickHandler(handler: TickHandler): void {
    const index = this.tickHandlers.indexOf(handler)
    if (index > -1) {
      this.tickHandlers.splice(index, 1)
    }
  }

  removeCompleteHandler(handler: CompleteHandler): void {
    const index = this.completeHandlers.indexOf(handler)
    if (index > -1) {
      this.completeHandlers.splice(index, 1)
    }
  }

  removeErrorHandler(handler: ErrorHandler): void {
    const index = this.errorHandlers.indexOf(handler)
    if (index > -1) {
      this.errorHandlers.splice(index, 1)
    }
  }

  removeStatsHandler(handler: StatsHandler): void {
    const index = this.statsHandlers.indexOf(handler)
    if (index > -1) {
      this.statsHandlers.splice(index, 1)
    }
  }

  /**
   * Gets current status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      hasWorker: this.worker !== null
    }
  }

  // Private methods

  /**
   * Sends a message to the worker
   */
  private sendMessage(message: WorkerInputMessage): void {
    if (!this.worker) {
      throw new Error('Worker not available')
    }
    
    this.worker.postMessage(message)
  }

  /**
   * Handles messages from the worker
   */
  private handleWorkerMessage(event: MessageEvent<WorkerOutputMessage>): void {
    const message = event.data
    
    switch (message.type) {
      case 'ready':
        // Worker ready events are handled by waitForWorkerReady
        break
        
      case 'tick':
        this.handleTickMessage(message.data)
        break
        
      case 'state':
        // State messages are handled by getState promise
        break
        
      case 'complete':
        this.handleCompleteMessage(message.data)
        break
        
      case 'error':
        this.handleErrorMessage(message.data)
        break
        
      case 'stats':
        this.handleStatsMessage(message.data)
        break
        
      default:
        console.warn('🤔 SimulationBridge: Unknown message type:', (message as any).type)
    }
  }

  /**
   * Handles tick messages from worker
   */
  private handleTickMessage(data: any): void {
    const gameState = this.deserializeGameState(data.gameState)
    
    for (const handler of this.tickHandlers) {
      try {
        handler({
          gameState,
          executedActions: data.executedActions,
          events: data.events,
          deltaTime: data.deltaTime,
          tickCount: data.tickCount,
          isComplete: data.isComplete,
          isStuck: data.isStuck
        })
      } catch (error) {
        console.error('❌ SimulationBridge: Tick handler error:', error)
      }
    }
  }

  /**
   * Handles completion messages from worker
   */
  private handleCompleteMessage(data: any): void {
    this.isRunning = false
    
    const finalState = this.deserializeGameState(data.finalState)
    
    for (const handler of this.completeHandlers) {
      try {
        handler({
          reason: data.reason,
          finalState,
          stats: data.stats,
          summary: data.summary
        })
      } catch (error) {
        console.error('❌ SimulationBridge: Complete handler error:', error)
      }
    }
  }

  /**
   * Handles error messages from worker
   */
  private handleErrorMessage(data: any): void {
    if (data.fatal) {
      this.isRunning = false
    }
    
    for (const handler of this.errorHandlers) {
      try {
        handler(data)
      } catch (error) {
        console.error('❌ SimulationBridge: Error handler error:', error)
      }
    }
  }

  /**
   * Handles stats messages from worker
   */
  private handleStatsMessage(data: SimulationStats): void {
    for (const handler of this.statsHandlers) {
      try {
        handler(data)
      } catch (error) {
        console.error('❌ SimulationBridge: Stats handler error:', error)
      }
    }
  }

  /**
   * Handles worker errors
   */
  private handleWorkerError(event: ErrorEvent): void {
    console.error('❌ SimulationBridge: Worker error:', event)
    
    for (const handler of this.errorHandlers) {
      try {
        handler({
          message: `Worker error: ${event.message}`,
          fatal: true
        })
      } catch (error) {
        console.error('❌ SimulationBridge: Error handler error:', error)
      }
    }
  }

  /**
   * Waits for worker to be ready
   */
  private waitForWorkerReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker ready timeout'))
      }, 10000)
      
      const handler = (event: MessageEvent<WorkerOutputMessage>) => {
        if (event.data.type === 'ready') {
          clearTimeout(timeout)
          this.worker?.removeEventListener('message', handler)
          resolve()
        }
      }
      
      this.worker?.addEventListener('message', handler)
    })
  }

  /**
   * Waits for initialization to complete
   */
  private waitForInitialization(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Initialization timeout'))
      }, 15000)
      
      const handler = (event: MessageEvent<WorkerOutputMessage>) => {
        if (event.data.type === 'ready' && event.data.data.initialized) {
          clearTimeout(timeout)
          this.worker?.removeEventListener('message', handler)
          resolve()
        } else if (event.data.type === 'error') {
          clearTimeout(timeout)
          this.worker?.removeEventListener('message', handler)
          reject(new Error(`Worker initialization failed: ${event.data.data.message}`))
        }
      }
      
      this.worker?.addEventListener('message', handler)
    })
  }

  /**
   * Deserializes GameState from worker
   */
  private deserializeGameState(serializedState: any): GameState {
    return {
      ...serializedState,
      inventory: {
        ...serializedState.inventory,
        tools: new Map(serializedState.inventory.tools),
        weapons: new Map(serializedState.inventory.weapons),
        armor: new Map(serializedState.inventory.armor)
      },
      automation: {
        ...serializedState.automation,
        targetCrops: new Map(serializedState.automation.targetCrops)
      }
    }
  }
}
