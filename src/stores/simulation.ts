// Simulation Setup Store - Phase 5A Implementation
// Using Composition API pattern from completed phases

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { compileConfiguration } from '@/utils/ConfigurationCompiler'
import type { 
  QuickSetup, 
  SimulationConfig, 
  SimulationPreset, 
  SimulationSetupState,
  DurationModeOption
} from '@/types'

// Generate auto name based on date, time, and persona
const generateSimulationName = (personaId: string): string => {
  const now = new Date()
  const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  
  const personaNames = {
    'speedrunner': 'Speed',
    'casual': 'Casual', 
    'weekend-warrior': 'Weekend',
    'custom': 'Custom'
  }
  
  const personaName = personaNames[personaId as keyof typeof personaNames] || 'Custom'
  return `${personaName} ${date} ${time}`
}

// Default quick setup configuration
const createDefaultQuickSetup = (): QuickSetup => ({
  name: generateSimulationName('casual'),
  personaId: 'casual',
  duration: {
    mode: 'completion'
  },
  dataSource: 'current',
  enableParameterOverrides: true,
  generateDetailedLogs: false
})

// Predefined simulation presets
const createSimulationPresets = (): SimulationPreset[] => [
  {
    id: 'quick-test',
    name: 'Quick Test',
    description: 'Fast 7-day test run with casual player',
    icon: 'fa-bolt',
    quickSetup: {
      personaId: 'casual',
      duration: { mode: 'fixed', maxDays: 7 },
      generateDetailedLogs: false
    }
  },
  {
    id: 'full-playthrough',
    name: 'Full Playthrough',
    description: 'Complete game simulation until victory',
    icon: 'fa-trophy',
    quickSetup: {
      personaId: 'speedrunner',
      duration: { mode: 'completion' },
      generateDetailedLogs: true
    }
  },
  {
    id: 'bottleneck-finder',
    name: 'Bottleneck Finder',
    description: 'Identify progression bottlenecks',
    icon: 'fa-search',
    quickSetup: {
      personaId: 'weekend-warrior',
      duration: { mode: 'bottleneck', bottleneckThreshold: 3 },
      generateDetailedLogs: true
    }
  },
  {
    id: 'parameter-testing',
    name: 'Parameter Testing',
    description: 'Custom simulation with parameter overrides',
    icon: 'fa-sliders-h',
    quickSetup: {
      personaId: 'casual',
      duration: { mode: 'fixed', maxDays: 14 },
      enableParameterOverrides: true,
      generateDetailedLogs: true
    }
  }
]

// Duration mode options
export const durationModeOptions: DurationModeOption[] = [
  {
    value: 'fixed',
    label: 'Fixed Duration',
    description: 'Run for a specific number of days',
    defaultConfig: { maxDays: 35 }
  },
  {
    value: 'completion',
    label: 'Run Until Complete',
    description: 'Continue until game is finished',
    defaultConfig: {}
  },
  {
    value: 'bottleneck',
    label: 'Stop If Stuck',
    description: 'Stop if no progress for several days',
    defaultConfig: { bottleneckThreshold: 3 }
  }
]

export const useSimulationStore = defineStore('simulation', () => {
  // State
  const currentConfig = ref<QuickSetup>(createDefaultQuickSetup())
  const presets = ref<SimulationPreset[]>(createSimulationPresets())
  const savedConfigs = ref<Map<string, SimulationConfig>>(new Map())
  const showParameterEditor = ref(false)
  const validationErrors = ref<string[]>([])
  const isDirty = ref(false)

  // Computed
  const isValid = computed(() => {
    validateCurrentConfig()
    return validationErrors.value.length === 0
  })

  const currentPreset = computed(() => {
    // Check if current config matches any preset
    return presets.value.find(preset => 
      configMatchesPreset(currentConfig.value, preset)
    )
  })

  // Actions
  function validateCurrentConfig() {
    const errors: string[] = []
    
    if (!currentConfig.value.name.trim()) {
      errors.push('Simulation name is required')
    }
    
    if (currentConfig.value.duration.mode === 'fixed' && 
        (!currentConfig.value.duration.maxDays || currentConfig.value.duration.maxDays < 1)) {
      errors.push('Fixed duration must be at least 1 day')
    }
    
    if (currentConfig.value.duration.mode === 'bottleneck' && 
        (!currentConfig.value.duration.bottleneckThreshold || currentConfig.value.duration.bottleneckThreshold < 1)) {
      errors.push('Bottleneck threshold must be at least 1 day')
    }
    
    if (currentConfig.value.dataSource === 'saved' && !currentConfig.value.savedConfigId) {
      errors.push('Must select a saved configuration when using saved data source')
    }
    
    validationErrors.value = errors
  }

  function configMatchesPreset(config: QuickSetup, preset: SimulationPreset): boolean {
    // Simple matching - check key properties
    const presetSetup = preset.quickSetup
    return (
      (!presetSetup.personaId || config.personaId === presetSetup.personaId) &&
      (!presetSetup.duration?.mode || config.duration.mode === presetSetup.duration.mode)
    )
  }

  function applyPreset(presetId: string) {
    const preset = presets.value.find(p => p.id === presetId)
    if (!preset) return

    // Apply preset configuration and auto-generate name
    const newConfig = { ...createDefaultQuickSetup() }
    Object.assign(newConfig, preset.quickSetup)
    
    // Auto-generate name based on persona
    newConfig.name = generateSimulationName(newConfig.personaId)
    
    // Ensure duration object is properly structured
    if (preset.quickSetup.duration) {
      newConfig.duration = { ...newConfig.duration, ...preset.quickSetup.duration }
    }
    
    currentConfig.value = newConfig
    isDirty.value = true
    validateCurrentConfig()
  }

  function updateConfig(updates: Partial<QuickSetup>) {
    const newConfig = { ...currentConfig.value, ...updates }
    
    // Auto-generate name if persona changed
    if (updates.personaId && updates.personaId !== currentConfig.value.personaId) {
      newConfig.name = generateSimulationName(updates.personaId)
    }
    
    currentConfig.value = newConfig
    isDirty.value = true
    validateCurrentConfig()
  }

  function updateDuration(updates: Partial<QuickSetup['duration']>) {
    currentConfig.value.duration = { ...currentConfig.value.duration, ...updates }
    isDirty.value = true
    validateCurrentConfig()
  }

  function resetConfig() {
    currentConfig.value = createDefaultQuickSetup()
    isDirty.value = false
    validationErrors.value = []
  }

  function saveConfig(): SimulationConfig | null {
    if (!isValid.value) return null

    const config: SimulationConfig = {
      id: `sim_${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      quickSetup: { ...currentConfig.value },
      isValid: true,
      validationErrors: []
    }

    savedConfigs.value.set(config.id, config)
    
    // Save to localStorage
    try {
      const savedData = Array.from(savedConfigs.value.entries())
      localStorage.setItem('timeHeroSim_savedConfigs', JSON.stringify(savedData))
    } catch (error) {
      console.warn('Failed to save configuration to localStorage:', error)
    }

    isDirty.value = false
    return config
  }

  function loadSavedConfigs() {
    try {
      const saved = localStorage.getItem('timeHeroSim_savedConfigs')
      if (saved) {
        const savedData = JSON.parse(saved)
        savedConfigs.value = new Map(savedData)
      }
    } catch (error) {
      console.warn('Failed to load saved configurations:', error)
      savedConfigs.value = new Map()
    }
  }

  function loadConfig(configId: string) {
    const config = savedConfigs.value.get(configId)
    if (config) {
      currentConfig.value = { ...config.quickSetup }
      isDirty.value = false
      validateCurrentConfig()
    }
  }

  function deleteConfig(configId: string) {
    savedConfigs.value.delete(configId)
    
    // Update localStorage
    try {
      const savedData = Array.from(savedConfigs.value.entries())
      localStorage.setItem('timeHeroSim_savedConfigs', JSON.stringify(savedData))
    } catch (error) {
      console.warn('Failed to update localStorage:', error)
    }
  }

  function launchSimulation(): SimulationConfig | null {
    if (!isValid.value) return null

    // Use Configuration Compiler to create the final simulation config
    const compiledConfig = compileConfiguration(currentConfig.value)
    
    if (!compiledConfig) {
      console.error('Failed to compile simulation configuration')
      return null
    }
    
    // Save the compiled configuration
    const savedConfig = saveConfig()
    
    if (savedConfig && compiledConfig) {
      // TODO: Phase 6 - Actually launch the simulation engine
      console.log('Launching simulation with compiled config:', {
        basic: savedConfig,
        compiled: compiledConfig,
        overrideCount: compiledConfig.parameterOverrides?.size || 0
      })
      
      // The compiled config contains all the data needed for the simulation engine:
      // - quickSetup: Basic simulation settings
      // - parameterOverrides: All parameter modifications
      // - isValid: Whether configuration passed validation
      // - validationErrors: Any issues that need to be addressed
    }
    
    return compiledConfig
  }

  // Initialize
  loadSavedConfigs()

  return {
    // State
    currentConfig,
    presets,
    savedConfigs,
    showParameterEditor,
    validationErrors,
    isDirty,
    
    // Computed
    isValid,
    currentPreset,
    
    // Actions
    validateCurrentConfig,
    applyPreset,
    updateConfig,
    updateDuration,
    resetConfig,
    saveConfig,
    loadConfig,
    deleteConfig,
    launchSimulation,
    loadSavedConfigs
  }
})
