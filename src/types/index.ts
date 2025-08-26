// Re-export all types for clean imports
export * from './csv-data'
export * from './game-data'
export * from './personas'

// Navigation types
export interface NavigationTab {
  path: string
  label: string
  icon?: string
  active?: boolean
}

// Validation types with optional metrics
export interface ValidationIssue {
  type: string
  message: string
  severity: 'error' | 'warning' | 'info'
  metrics?: Record<string, any>
  timestamp?: number
}