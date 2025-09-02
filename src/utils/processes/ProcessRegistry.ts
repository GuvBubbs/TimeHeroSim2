// ProcessRegistry - Phase 9G Implementation
// Process metadata management and registration system

import type { 
  ProcessType, 
  ProcessMetadata, 
  ProcessHandle,
  IProcessHandler 
} from './types/ProcessTypes'

/**
 * Registry for process types and their handlers
 */
export class ProcessRegistry {
  private registry: Map<ProcessType, ProcessMetadata>
  private handlers: Map<ProcessType, IProcessHandler>
  private activeProcesses: Map<string, ProcessHandle>
  private processCounters: Map<ProcessType, number>
  
  constructor() {
    this.registry = new Map()
    this.handlers = new Map()
    this.activeProcesses = new Map()
    this.processCounters = new Map()
  }
  
  /**
   * Register a process type with its metadata and handler
   */
  register(type: ProcessType, metadata: ProcessMetadata, handler: IProcessHandler): void {
    this.registry.set(type, metadata)
    this.handlers.set(type, handler)
    this.processCounters.set(type, 0)
  }
  
  /**
   * Get metadata for a process type
   */
  getMetadata(type: ProcessType): ProcessMetadata | undefined {
    return this.registry.get(type)
  }
  
  /**
   * Get handler for a process type
   */
  getHandler(type: ProcessType): IProcessHandler | undefined {
    return this.handlers.get(type)
  }
  
  /**
   * Check if a process type is registered
   */
  isRegistered(type: ProcessType): boolean {
    return this.registry.has(type)
  }
  
  /**
   * Register an active process
   */
  addActiveProcess(handle: ProcessHandle): void {
    this.activeProcesses.set(handle.id, handle)
    const currentCount = this.processCounters.get(handle.type) || 0
    this.processCounters.set(handle.type, currentCount + 1)
  }
  
  /**
   * Remove an active process
   */
  removeActiveProcess(processId: string): void {
    const handle = this.activeProcesses.get(processId)
    if (handle) {
      this.activeProcesses.delete(processId)
      const currentCount = this.processCounters.get(handle.type) || 0
      this.processCounters.set(handle.type, Math.max(0, currentCount - 1))
    }
  }
  
  /**
   * Get active process by ID
   */
  getActiveProcess(processId: string): ProcessHandle | undefined {
    return this.activeProcesses.get(processId)
  }
  
  /**
   * Get all active processes
   */
  getActiveProcesses(): ProcessHandle[] {
    return Array.from(this.activeProcesses.values())
  }
  
  /**
   * Get active processes by type
   */
  getActiveProcessesByType(type: ProcessType): ProcessHandle[] {
    return Array.from(this.activeProcesses.values())
      .filter(handle => handle.type === type)
  }
  
  /**
   * Check if we can start another process of the given type
   */
  canStartProcess(type: ProcessType): boolean {
    const metadata = this.getMetadata(type)
    if (!metadata) return false
    
    const currentCount = this.processCounters.get(type) || 0
    return currentCount < metadata.maxConcurrent
  }
  
  /**
   * Get current process count for a type
   */
  getActiveCount(type: ProcessType): number {
    return this.processCounters.get(type) || 0
  }
  
  /**
   * Get all registered process types
   */
  getRegisteredTypes(): ProcessType[] {
    return Array.from(this.registry.keys())
  }
  
  /**
   * Clear all active processes (for reset/cleanup)
   */
  clearActiveProcesses(): void {
    this.activeProcesses.clear()
    for (const type of Array.from(this.processCounters.keys())) {
      this.processCounters.set(type, 0)
    }
  }
  
  /**
   * Get registry statistics
   */
  getStats(): {
    totalRegistered: number
    totalActive: number
    byType: Map<ProcessType, { active: number; max: number }>
  } {
    const byType = new Map<ProcessType, { active: number; max: number }>()
    
    for (const [type, metadata] of Array.from(this.registry.entries())) {
      byType.set(type, {
        active: this.getActiveCount(type),
        max: metadata.maxConcurrent
      })
    }
    
    return {
      totalRegistered: this.registry.size,
      totalActive: this.activeProcesses.size,
      byType
    }
  }
}
