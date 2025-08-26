// Player Personas Types for Phase 4
// Based on MVP requirements from 04-player-personas.md

export interface SimplePersona {
  id: string
  name: string
  description: string
  icon: string // Font Awesome class
  color: string // Theme color
  
  // Core behavior (0-1 scale)
  efficiency: number        // How optimal their decisions are
  riskTolerance: number    // Willingness to try dangerous routes
  optimization: number     // How much they min-max
  learningRate: number     // How fast they improve
  
  // Simple schedule
  weekdayCheckIns: number  // Times per weekday
  weekendCheckIns: number  // Times per weekend day
  avgSessionLength: number // Minutes per check-in
  
  // Metadata
  isPreset: boolean
  createdAt?: string
  lastModified?: string
}

export interface PersonaTemplate {
  id: string
  name: string
  description: string
  basePersona: Partial<SimplePersona>
}

export interface PersonaValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface PersonaComparison {
  personas: SimplePersona[]
  metrics: ComparisonMetric[]
}

export interface ComparisonMetric {
  name: string
  unit: string
  values: Map<string, number> // persona ID -> value
}

// Phase 5 Integration Hooks
export interface SimulationPersonaConfig {
  personaId: string
  overrides?: Partial<SimplePersona>
  enableBehaviorTracking: boolean
}

export interface PersonaBehaviorEvent {
  timestamp: number
  personaId: string
  action: string
  efficiency: number
  context: Record<string, any>
}

// Store state interfaces
export interface PersonaState {
  presets: Map<string, SimplePersona>
  custom: Map<string, SimplePersona>
  selected: string
  isLoading: boolean
  lastError: string | null
}

export interface PersonaEditorState {
  current: SimplePersona | null
  originalData: SimplePersona | null
  isDirty: boolean
  validation: PersonaValidationError[]
  activeTemplate: string | null
}
