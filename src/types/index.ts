// TypeScript type definitions for the Time Hero Simulator

export interface NavigationTab {
  path: string
  label: string
  icon: string
}

export interface AppState {
  appVersion: string
  currentPhase: string
  isLoading: boolean
  error: string | null
}

// Phase 0 stub types - will be expanded in later phases
export interface GameData {
  // Placeholder for future game data structures
}

export interface SimulationConfig {
  // Placeholder for future simulation configuration
}

export interface PlayerPersona {
  // Placeholder for future player persona data
}

export interface SimulationReport {
  // Placeholder for future simulation reports
}
