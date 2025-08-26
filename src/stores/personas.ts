// Player Personas Store - Phase 4 Implementation
// Using Composition API pattern from completed phases

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  SimplePersona, 
  PersonaTemplate, 
  PersonaValidationError,
  PersonaState,
  PersonaEditorState,
  SimulationPersonaConfig
} from '@/types'

// Preset persona data
const createPresetPersonas = (): Map<string, SimplePersona> => {
  const speedrunner: SimplePersona = {
    id: 'speedrunner',
    name: 'Speedrunner Sam',
    description: 'Optimizes every action, knows all mechanics, plays efficiently',
    icon: 'fa-bolt',
    color: '#f59e0b', // amber
    efficiency: 0.95,
    riskTolerance: 0.8,
    optimization: 1.0,
    learningRate: 0.1, // Already knows everything
    weekdayCheckIns: 10,
    weekendCheckIns: 10,
    avgSessionLength: 30,
    isPreset: true
  }

  const casual: SimplePersona = {
    id: 'casual',
    name: 'Casual Casey',
    description: 'Plays for fun, makes sub-optimal choices, limited time',
    icon: 'fa-user',
    color: '#10b981', // emerald
    efficiency: 0.7,
    riskTolerance: 0.3,
    optimization: 0.6,
    learningRate: 0.4,
    weekdayCheckIns: 2,
    weekendCheckIns: 2,
    avgSessionLength: 15,
    isPreset: true
  }

  const weekendWarrior: SimplePersona = {
    id: 'weekend-warrior',
    name: 'Weekend Warrior Wade',
    description: 'Minimal weekday play, binges on weekends',
    icon: 'fa-calendar-week',
    color: '#3b82f6', // blue
    efficiency: 0.8,
    riskTolerance: 0.4,
    optimization: 0.8,
    learningRate: 0.3,
    weekdayCheckIns: 1,
    weekendCheckIns: 8,
    avgSessionLength: 45,
    isPreset: true
  }

  return new Map([
    ['speedrunner', speedrunner],
    ['casual', casual],
    ['weekend-warrior', weekendWarrior]
  ])
}

// Persona templates for quick persona creation
const createPersonaTemplates = (): PersonaTemplate[] => [
  {
    id: 'balanced',
    name: 'Balanced Player',
    description: 'Even mix of all behaviors',
    basePersona: {
      efficiency: 0.75,
      riskTolerance: 0.5,
      optimization: 0.7,
      learningRate: 0.5,
      weekdayCheckIns: 3,
      weekendCheckIns: 5,
      avgSessionLength: 25
    }
  },
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Patient and thorough, wants to see everything',
    basePersona: {
      efficiency: 0.85,
      riskTolerance: 0.2,
      optimization: 0.9,
      learningRate: 0.6,
      weekdayCheckIns: 5,
      weekendCheckIns: 8,
      avgSessionLength: 40
    }
  },
  {
    id: 'risk-taker',
    name: 'Risk Taker',
    description: 'Loves high-risk, high-reward strategies',
    basePersona: {
      efficiency: 0.65,
      riskTolerance: 0.9,
      optimization: 0.5,
      learningRate: 0.7,
      weekdayCheckIns: 4,
      weekendCheckIns: 6,
      avgSessionLength: 20
    }
  }
]

export const usePersonaStore = defineStore('personas', () => {
  // State - following established pattern from gameDataStore
  const presets = ref<Map<string, SimplePersona>>(createPresetPersonas())
  const custom = ref<Map<string, SimplePersona>>(new Map())
  const selected = ref<string>('casual')
  const isLoading = ref(false)
  const lastError = ref<string | null>(null)
  
  // Editor state - similar to configuration store pattern
  const editorState = ref<PersonaEditorState>({
    current: null,
    originalData: null,
    isDirty: false,
    validation: [],
    activeTemplate: null
  })
  
  // Templates
  const templates = ref<PersonaTemplate[]>(createPersonaTemplates())
  
  // Computed - following established patterns
  const currentPersona = computed(() => 
    presets.value.get(selected.value) || 
    custom.value.get(selected.value) ||
    presets.value.get('casual')!
  )
  
  const allPersonas = computed(() => [
    ...Array.from(presets.value.values()),
    ...Array.from(custom.value.values())
  ])
  
  const customPersonas = computed(() => Array.from(custom.value.values()))
  
  const canSave = computed(() => 
    editorState.value.isDirty && 
    editorState.value.validation.length === 0 &&
    editorState.value.current !== null
  )
  
  const personaCount = computed(() => ({
    presets: presets.value.size,
    custom: custom.value.size,
    total: presets.value.size + custom.value.size
  }))
  
  // Validation functions
  function validatePersona(persona: SimplePersona): PersonaValidationError[] {
    const errors: PersonaValidationError[] = []
    
    // Name validation
    if (!persona.name.trim()) {
      errors.push({ field: 'name', message: 'Name is required', severity: 'error' })
    }
    
    // Behavior parameter validation (0-1 scale)
    const behaviorFields = ['efficiency', 'riskTolerance', 'optimization', 'learningRate']
    for (const field of behaviorFields) {
      const value = (persona as any)[field]
      if (value < 0 || value > 1) {
        errors.push({ 
          field, 
          message: `${field} must be between 0 and 1`, 
          severity: 'error' 
        })
      }
    }
    
    // Schedule validation
    if (persona.weekdayCheckIns < 1 || persona.weekdayCheckIns > 20) {
      errors.push({ 
        field: 'weekdayCheckIns', 
        message: 'Weekday check-ins must be between 1 and 20', 
        severity: 'error' 
      })
    }
    
    if (persona.weekendCheckIns < 1 || persona.weekendCheckIns > 20) {
      errors.push({ 
        field: 'weekendCheckIns', 
        message: 'Weekend check-ins must be between 1 and 20', 
        severity: 'error' 
      })
    }
    
    if (persona.avgSessionLength < 5 || persona.avgSessionLength > 120) {
      errors.push({ 
        field: 'avgSessionLength', 
        message: 'Session length must be between 5 and 120 minutes', 
        severity: 'error' 
      })
    }
    
    // Uniqueness check for custom personas
    if (!persona.isPreset) {
      const exists = Array.from(custom.value.values()).some(p => 
        p.id !== persona.id && p.name.toLowerCase() === persona.name.toLowerCase()
      )
      if (exists) {
        errors.push({ 
          field: 'name', 
          message: 'A persona with this name already exists', 
          severity: 'error' 
        })
      }
    }
    
    return errors
  }
  
  // Actions - async pattern from gameDataStore
  async function loadPersonas() {
    isLoading.value = true
    lastError.value = null
    
    try {
      // Load custom personas from LocalStorage
      const saved = localStorage.getItem('timeHeroSim-customPersonas')
      if (saved) {
        const parsed = JSON.parse(saved)
        custom.value = new Map(Object.entries(parsed))
      }
      
      // Load selected persona from LocalStorage
      const savedSelected = localStorage.getItem('timeHeroSim-selectedPersona')
      if (savedSelected && (presets.value.has(savedSelected) || custom.value.has(savedSelected))) {
        selected.value = savedSelected
      }
      
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : 'Failed to load personas'
      console.error('Error loading personas:', error)
    } finally {
      isLoading.value = false
    }
  }
  
  function selectPersona(personaId: string) {
    if (presets.value.has(personaId) || custom.value.has(personaId)) {
      selected.value = personaId
      localStorage.setItem('timeHeroSim-selectedPersona', personaId)
    }
  }
  
  function createPersona(templateId?: string) {
    const template = templateId ? templates.value.find(t => t.id === templateId) : null
    const basePersona = template?.basePersona || {}
    
    const newPersona: SimplePersona = {
      id: `custom-${Date.now()}`,
      name: '',
      description: '',
      icon: 'fa-user',
      color: '#6b7280', // gray
      efficiency: 0.75,
      riskTolerance: 0.5,
      optimization: 0.7,
      learningRate: 0.5,
      weekdayCheckIns: 3,
      weekendCheckIns: 5,
      avgSessionLength: 25,
      isPreset: false,
      createdAt: new Date().toISOString(),
      ...basePersona
    }
    
    editorState.value = {
      current: { ...newPersona },
      originalData: null, // New persona
      isDirty: false,
      validation: [],
      activeTemplate: templateId || null
    }
  }
  
  function editPersona(personaId: string) {
    const persona = presets.value.get(personaId) || custom.value.get(personaId)
    if (!persona) return
    
    // Create copy for editing (preset personas become custom when edited)
    const editablePersona: SimplePersona = {
      ...persona,
      id: persona.isPreset ? `custom-${Date.now()}` : persona.id,
      isPreset: false,
      lastModified: new Date().toISOString()
    }
    
    editorState.value = {
      current: { ...editablePersona },
      originalData: persona.isPreset ? null : { ...persona },
      isDirty: false,
      validation: [],
      activeTemplate: null
    }
  }
  
  function updatePersonaField(field: keyof SimplePersona, value: any) {
    if (!editorState.value.current) return
    
    (editorState.value.current as any)[field] = value
    editorState.value.isDirty = true
    editorState.value.validation = validatePersona(editorState.value.current)
  }
  
  function savePersona() {
    if (!canSave.value || !editorState.value.current) return false
    
    const persona = editorState.value.current
    persona.lastModified = new Date().toISOString()
    
    // Add to custom personas
    custom.value.set(persona.id, { ...persona })
    
    // Save to LocalStorage
    const customObj = Object.fromEntries(custom.value)
    localStorage.setItem('timeHeroSim-customPersonas', JSON.stringify(customObj))
    
    // Select the saved persona
    selectPersona(persona.id)
    
    // Reset editor state
    editorState.value = {
      current: null,
      originalData: null,
      isDirty: false,
      validation: [],
      activeTemplate: null
    }
    
    return true
  }
  
  function deletePersona(personaId: string) {
    if (presets.value.has(personaId)) {
      // Cannot delete preset personas
      return false
    }
    
    custom.value.delete(personaId)
    
    // Save to LocalStorage
    const customObj = Object.fromEntries(custom.value)
    localStorage.setItem('timeHeroSim-customPersonas', JSON.stringify(customObj))
    
    // If deleted persona was selected, select default
    if (selected.value === personaId) {
      selectPersona('casual')
    }
    
    return true
  }
  
  function cancelEdit() {
    editorState.value = {
      current: null,
      originalData: null,
      isDirty: false,
      validation: [],
      activeTemplate: null
    }
  }
  
  // Phase 5 Integration Hooks
  function getSimulationConfig(personaId?: string): SimulationPersonaConfig {
    const targetPersonaId = personaId || selected.value
    return {
      personaId: targetPersonaId,
      enableBehaviorTracking: true
    }
  }
  
  function applySimulationOverrides(config: SimulationPersonaConfig) {
    // Hook for Phase 5 - apply runtime overrides to persona behavior
    console.log('Simulation overrides applied:', config)
  }
  
  // Calculate estimated completion time based on persona parameters
  function calculateEstimatedCompletion(persona: SimplePersona): number {
    // Simple estimation formula based on efficiency and play frequency
    const baseCompletionDays = 35 // Game baseline
    const efficiencyMultiplier = 1 / persona.efficiency
    const playFrequencyBonus = Math.min(
      (persona.weekdayCheckIns * 5 + persona.weekendCheckIns * 2) / 30, // Weekly check-ins normalized
      2.0 // Cap bonus at 2x
    )
    
    return Math.round(baseCompletionDays * efficiencyMultiplier / playFrequencyBonus)
  }
  
  // Initialize store
  loadPersonas()
  
  return {
    // State
    presets,
    custom,
    selected,
    isLoading,
    lastError,
    editorState,
    templates,
    
    // Computed
    currentPersona,
    allPersonas,
    customPersonas,
    canSave,
    personaCount,
    
    // Actions
    loadPersonas,
    selectPersona,
    createPersona,
    editPersona,
    updatePersonaField,
    savePersona,
    deletePersona,
    cancelEdit,
    validatePersona,
    calculateEstimatedCompletion,
    
    // Phase 5 Integration
    getSimulationConfig,
    applySimulationOverrides
  }
})
