// Configuration Compiler - Phase 5E Implementation
// Merges quick setup + parameters + overrides into final SimulationConfig

import type { 
  QuickSetup, 
  AllParameters, 
  ParameterOverride, 
  SimulationConfig 
} from '@/types'
import { useParameterStore } from '@/stores/parameters'
import { usePersonaStore } from '@/stores/personas'

/**
 * Compiles a complete simulation configuration from quick setup and parameter overrides
 */
export class ConfigurationCompiler {
  /**
   * Compiles the final configuration for the simulation engine
   */
  static compile(quickSetup: QuickSetup): SimulationConfig | null {
    try {
      const parameterStore = useParameterStore()
      const personaStore = usePersonaStore()
      
      // Get the selected persona
      const persona = personaStore.allPersonas.find(p => p.id === quickSetup.personaId)
      if (!persona) {
        throw new Error(`Persona not found: ${quickSetup.personaId}`)
      }
      
      // Validate quick setup
      const validationErrors = this.validateQuickSetup(quickSetup)
      if (validationErrors.length > 0) {
        console.error('Quick setup validation failed:', validationErrors)
        return null
      }
      
      // Get effective parameters (defaults + overrides)
      const effectiveParameters = this.getEffectiveParameters(parameterStore)
      
      // Apply persona multipliers to parameters
      const personaAdjustedParameters = this.applyPersonaMultipliers(
        effectiveParameters, 
        persona
      )
      
      // Create the final configuration
      const config: SimulationConfig = {
        id: this.generateConfigId(),
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        quickSetup,
        parameterOverrides: new Map(parameterStore.overrides.entries()),
        isValid: true,
        validationErrors: []
      }
      
      // Final validation
      const finalValidation = this.validateConfiguration(config, effectiveParameters)
      config.isValid = finalValidation.isValid
      config.validationErrors = finalValidation.errors
      
      return config
    } catch (error) {
      console.error('Configuration compilation failed:', error)
      return null
    }
  }
  
  /**
   * Validates the quick setup configuration
   */
  private static validateQuickSetup(quickSetup: QuickSetup): string[] {
    const errors: string[] = []
    
    if (!quickSetup.name?.trim()) {
      errors.push('Simulation name is required')
    }
    
    if (!quickSetup.personaId) {
      errors.push('Persona selection is required')
    }
    
    if (!quickSetup.duration.mode) {
      errors.push('Duration mode is required')
    }
    
    if (quickSetup.duration.mode === 'fixed' && (!quickSetup.duration.maxDays || quickSetup.duration.maxDays < 1)) {
      errors.push('Fixed duration must be at least 1 day')
    }
    
    if (quickSetup.duration.mode === 'bottleneck' && (!quickSetup.duration.bottleneckThreshold || quickSetup.duration.bottleneckThreshold < 1)) {
      errors.push('Bottleneck threshold must be at least 1 day')
    }
    
    return errors
  }
  
  /**
   * Gets the effective parameters combining defaults and overrides
   */
  private static getEffectiveParameters(parameterStore: any): AllParameters {
    return parameterStore.effectiveParameters
  }
  
  /**
   * Applies persona-specific multipliers to parameters
   */
  private static applyPersonaMultipliers(
    parameters: AllParameters, 
    persona: any
  ): AllParameters {
    // Deep clone to avoid mutating original
    const adjusted = JSON.parse(JSON.stringify(parameters))
    
    // Apply efficiency multiplier to relevant parameters
    const efficiency = persona.efficiency
    
    // Apply to farm system
    if (adjusted.farm?.automation?.priorityWeights) {
      Object.keys(adjusted.farm.automation.priorityWeights).forEach(key => {
        adjusted.farm.automation.priorityWeights[key] *= efficiency
      })
    }
    
    // Apply to helper efficiency
    if (adjusted.farm?.helperEfficiency) {
      Object.keys(adjusted.farm.helperEfficiency).forEach(key => {
        adjusted.farm.helperEfficiency[key] *= efficiency
      })
    }
    
    // Apply to tower catch rates
    if (adjusted.tower?.catchMechanics) {
      adjusted.tower.catchMechanics.manualCatchRate *= efficiency
    }
    
    // Apply to decision making speed
    if (adjusted.decisions?.responseTime) {
      adjusted.decisions.responseTime.normal /= efficiency
      adjusted.decisions.responseTime.urgent /= efficiency
    }
    
    return adjusted
  }
  
  /**
   * Validates the final configuration
   */
  private static validateConfiguration(config: SimulationConfig, parameters?: AllParameters): { isValid: boolean, errors: string[] } {
    const errors: string[] = []
    
    // Check for circular dependencies in parameters (if provided)
    if (parameters) {
      try {
        this.checkCircularDependencies(parameters)
      } catch (error: any) {
        errors.push(`Circular dependency detected: ${error?.message || 'Unknown error'}`)
      }
      
      // Validate parameter ranges
      const rangeErrors = this.validateParameterRanges(parameters)
      errors.push(...rangeErrors)
    }
    
    // Check for conflicting overrides
    if (config.parameterOverrides) {
      const conflictErrors = this.checkOverrideConflicts(Array.from(config.parameterOverrides.entries()))
      errors.push(...conflictErrors)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Checks for circular dependencies in parameter references
   */
  private static checkCircularDependencies(parameters: AllParameters): void {
    // Implementation for detecting circular dependencies
    // This is a simplified check - could be expanded based on specific parameter relationships
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    function checkNode(path: string, value: any): void {
      if (recursionStack.has(path)) {
        throw new Error(`Circular dependency involving ${path}`)
      }
      
      if (visited.has(path)) return
      
      visited.add(path)
      recursionStack.add(path)
      
      // Check if this parameter references other parameters
      if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach(key => {
          checkNode(`${path}.${key}`, value[key])
        })
      }
      
      recursionStack.delete(path)
    }
    
    // Check each top-level system
    Object.keys(parameters).forEach(system => {
      checkNode(system, parameters[system as keyof AllParameters])
    })
  }
  
  /**
   * Validates parameter values are within acceptable ranges
   */
  private static validateParameterRanges(parameters: AllParameters): string[] {
    const errors: string[] = []
    
    // Farm system validations
    if (parameters.farm) {
      if (parameters.farm.cropMechanics?.growthTimeMultiplier < 0.1 || parameters.farm.cropMechanics?.growthTimeMultiplier > 10) {
        errors.push('Farm growth time multiplier must be between 0.1 and 10')
      }
      
      if (parameters.farm.waterSystem?.autoPumpThreshold < 0 || parameters.farm.waterSystem?.autoPumpThreshold > 1) {
        errors.push('Auto pump threshold must be between 0 and 1')
      }
    }
    
    // Tower system validations
    if (parameters.tower) {
      if (parameters.tower.catchMechanics?.manualCatchRate < 1 || parameters.tower.catchMechanics?.manualCatchRate > 300) {
        errors.push('Manual catch rate must be between 1 and 300 seeds/min')
      }
    }
    
    // Add more validations as needed for other systems
    
    return errors
  }
  
  /**
   * Checks for conflicting parameter overrides
   */
  private static checkOverrideConflicts(overrides: Array<[string, ParameterOverride]>): string[] {
    const errors: string[] = []
    const pathCounts = new Map<string, number>()
    
    // Count overrides per path
    overrides.forEach(([path]) => {
      pathCounts.set(path, (pathCounts.get(path) || 0) + 1)
    })
    
    // Check for duplicate paths (should not happen with proper implementation)
    pathCounts.forEach((count, path) => {
      if (count > 1) {
        errors.push(`Multiple overrides found for parameter: ${path}`)
      }
    })
    
    return errors
  }
  
  /**
   * Determines which game systems are enabled based on parameters
   */
  private static getEnabledSystems(parameters: AllParameters): string[] {
    const enabled: string[] = []
    
    // Check each system for active/enabled state
    if (parameters.farm) enabled.push('farm')
    if (parameters.tower) enabled.push('tower')
    if (parameters.town) enabled.push('town')
    if (parameters.adventure) enabled.push('adventure')
    if (parameters.forge) enabled.push('forge')
    if (parameters.mine) enabled.push('mine')
    if (parameters.helpers) enabled.push('helpers')
    if (parameters.resources) enabled.push('resources')
    if (parameters.decisions) enabled.push('decisions')
    
    return enabled
  }
  
  /**
   * Generates a unique configuration ID
   */
  private static generateConfigId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `sim_${timestamp}_${random}`
  }
  
  /**
   * Exports configuration as JSON for sharing or storage
   */
  static exportConfiguration(config: SimulationConfig): string {
    try {
      return JSON.stringify(config, null, 2)
    } catch (error) {
      console.error('Failed to export configuration:', error)
      throw new Error('Configuration export failed')
    }
  }
  
  /**
   * Imports configuration from JSON
   */
  static importConfiguration(jsonString: string): SimulationConfig | null {
    try {
      const config = JSON.parse(jsonString) as SimulationConfig
      
      // Validate imported configuration structure
      if (!config.id || !config.quickSetup) {
        throw new Error('Invalid configuration format')
      }
      
      // Re-validate the configuration
      const validation = this.validateConfiguration(config)
      config.isValid = validation.isValid
      config.validationErrors = validation.errors
      
      return config
    } catch (error) {
      console.error('Failed to import configuration:', error)
      return null
    }
  }
}

// Export utility functions for direct use
export const compileConfiguration = ConfigurationCompiler.compile
export const exportConfiguration = ConfigurationCompiler.exportConfiguration
export const importConfiguration = ConfigurationCompiler.importConfiguration
