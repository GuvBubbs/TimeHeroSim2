// Simulation Setup Types for Phase 5
// Based on design specs from 05-simulation-setup-updated.md

export interface QuickSetup {
  // Basic identification
  name: string
  
  // Persona selection (from Phase 4)
  personaId: 'speedrunner' | 'casual' | 'weekend-warrior' | 'custom'
  customPersonaId?: string // If using custom persona
  
  // Duration
  duration: {
    mode: 'fixed' | 'completion' | 'bottleneck'
    maxDays?: number
    bottleneckThreshold?: number // Days without progress
  }
  
  // Data source
  dataSource: 'current' | 'default' | 'saved'
  savedConfigId?: string
  
  // Launch options
  enableParameterOverrides: boolean
  generateDetailedLogs: boolean
}

export interface SimulationConfig {
  // Combined configuration for the simulation engine
  id: string
  createdAt: string
  lastModified: string
  
  // Quick setup
  quickSetup: QuickSetup
  
  // Parameter overrides (Phase 5B-5D)
  parameterOverrides?: Map<string, any>
  
  // Validation state
  isValid: boolean
  validationErrors: string[]
}

export interface SimulationPreset {
  id: string
  name: string
  description: string
  icon: string
  quickSetup: Partial<QuickSetup>
}

export interface SimulationSetupState {
  // Current configuration being edited
  currentConfig: QuickSetup
  
  // Available presets
  presets: SimulationPreset[]
  
  // Saved configurations
  savedConfigs: Map<string, SimulationConfig>
  
  // UI state
  showParameterEditor: boolean
  validationErrors: string[]
  isDirty: boolean
}

// Duration mode options
export interface DurationModeOption {
  value: 'fixed' | 'completion' | 'bottleneck'
  label: string
  description: string
  defaultConfig?: Partial<QuickSetup['duration']>
}
