<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-bold">Simulation Setup</h2>
      <div class="flex items-center space-x-4">
        <button
          @click="simulationStore.showParameterEditor = true"
          class="btn btn-secondary"
        >
          <i class="fas fa-sliders-h mr-2"></i>
          Parameter Editor
        </button>
        <div class="text-sm text-sim-muted">
          Configuration Wizard
        </div>
      </div>
    </div>
    
    <!-- Quick Setup Card -->
    <div class="card">
      <div class="card-header">
        <i class="fas fa-cogs mr-2"></i>
        Simulation Configuration
      </div>
      <div class="card-body space-y-4">
        
        <!-- Quick Presets -->
        <div>
          <label class="block text-sm font-medium mb-3">Quick Presets</label>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              v-for="preset in simulationStore.presets"
              :key="preset.id"
              @click="simulationStore.applyPreset(preset.id)"
              :class="[
                'p-3 rounded-lg border text-left transition-all h-20 flex flex-col justify-between',
                simulationStore.currentPreset?.id === preset.id
                  ? 'border-sim-primary bg-sim-primary/10'
                  : 'border-sim-border bg-sim-surface hover:border-sim-muted'
              ]"
            >
              <div class="flex items-center justify-between">
                <i :class="['text-base', preset.icon]"></i>
                <div v-if="simulationStore.currentPreset?.id === preset.id" class="text-sim-primary">
                  <i class="fas fa-check text-sm"></i>
                </div>
              </div>
              <div>
                <div class="font-medium text-sm leading-tight">{{ preset.name }}</div>
                <div class="text-xs text-sim-muted mt-1 line-clamp-2">{{ preset.description }}</div>
              </div>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left Column -->
          <div class="space-y-4">
            <!-- Simulation Name (Auto-generated) -->
            <div>
              <label class="block text-sm font-medium mb-2">
                Simulation Name
              </label>
              <input
                v-model="simulationStore.currentConfig.name"
                type="text"
                class="w-full px-3 py-2 bg-sim-surface border border-sim-border rounded-lg focus:ring-2 focus:ring-sim-primary focus:border-transparent"
                readonly
              />
              <div class="text-xs text-sim-muted mt-1">Auto-generated based on persona and time</div>
            </div>

            <!-- Persona Selection (Dropdown) -->
            <div>
              <label class="block text-sm font-medium mb-2">Select Persona</label>
              <select
                v-model="simulationStore.currentConfig.personaId"
                class="w-full px-3 py-2 bg-sim-surface border border-sim-border rounded-lg focus:ring-2 focus:ring-sim-primary focus:border-transparent"
                @change="handlePersonaChange"
              >
                <option
                  v-for="persona in personaStore.allPersonas"
                  :key="persona.id"
                  :value="persona.id"
                >
                  {{ persona.name }} - {{ Math.round(persona.efficiency * 100) }}% Efficiency
                </option>
              </select>
              <div class="text-xs text-sim-muted mt-1">{{ selectedPersonaDescription }}</div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-4">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Duration Settings -->
              <div>
                <label class="block text-sm font-medium mb-3">Duration</label>
                <div class="space-y-2">
                  <div
                    v-for="mode in durationModeOptions"
                    :key="mode.value"
                    class="flex items-start space-x-3"
                  >
                    <input
                      :id="`duration-${mode.value}`"
                      v-model="simulationStore.currentConfig.duration.mode"
                      :value="mode.value"
                      type="radio"
                      class="mt-1"
                      @change="handleDurationModeChange(mode)"
                    />
                    <div class="flex-1">
                      <label
                        :for="`duration-${mode.value}`"
                        class="font-medium cursor-pointer text-sm"
                      >
                        {{ mode.label }}
                      </label>
                      <div class="text-xs text-sim-muted">{{ mode.description }}</div>
                      
                      <!-- Duration-specific inputs -->
                      <div v-if="simulationStore.currentConfig.duration.mode === mode.value" class="mt-2">
                        <div v-if="mode.value === 'fixed'" class="flex items-center space-x-2">
                          <input
                            v-model.number="simulationStore.currentConfig.duration.maxDays"
                            type="number"
                            min="1"
                            max="365"
                            class="w-20 px-2 py-1 bg-sim-surface border border-sim-border rounded text-sm"
                            @input="simulationStore.isDirty = true"
                          />
                          <span class="text-sm">days</span>
                        </div>
                        
                        <div v-if="mode.value === 'bottleneck'" class="flex items-center space-x-2">
                          <span class="text-sm">Stop if stuck for</span>
                          <input
                            v-model.number="simulationStore.currentConfig.duration.bottleneckThreshold"
                            type="number"
                            min="1"
                            max="30"
                            class="w-16 px-2 py-1 bg-sim-surface border border-sim-border rounded text-sm"
                            @input="simulationStore.isDirty = true"
                          />
                          <span class="text-sm">days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Options -->
              <div>
                <label class="block text-sm font-medium mb-3">Options</label>
                <div class="space-y-2">
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input
                      v-model="simulationStore.currentConfig.generateDetailedLogs"
                      type="checkbox"
                      @change="simulationStore.isDirty = true"
                    />
                    <div>
                      <span class="text-sm">Generate detailed logs</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Validation Errors -->
        <div v-if="simulationStore.validationErrors.length > 0" class="border border-red-500 rounded-lg p-3 bg-red-500/10">
          <div class="font-medium text-red-400 mb-2 text-sm">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            Configuration Issues
          </div>
          <ul class="text-sm text-red-300 space-y-1">
            <li v-for="error in simulationStore.validationErrors" :key="error">
              • {{ error }}
            </li>
          </ul>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between pt-4 border-t border-sim-border">
          <div class="flex items-center space-x-3">
            <button
              @click="simulationStore.resetConfig()"
              class="btn btn-secondary"
              :disabled="!simulationStore.isDirty"
            >
              <i class="fas fa-undo mr-2"></i>
              Reset
            </button>
            
            <button
              @click="saveConfiguration"
              class="btn btn-secondary"
              :disabled="!simulationStore.isValid || !simulationStore.isDirty"
            >
              <i class="fas fa-save mr-2"></i>
              Save Config
            </button>
          </div>
          
          <button
            @click="launchSimulation"
            class="btn btn-primary"
            :disabled="!simulationStore.isValid"
          >
            <i class="fas fa-rocket mr-2"></i>
            Launch Simulation
          </button>
        </div>
      </div>
    </div>

    <!-- Parameter Editor Modal -->
    <ParameterEditor />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSimulationStore, durationModeOptions } from '@/stores/simulation'
import { usePersonaStore } from '@/stores/personas'
import type { DurationModeOption } from '@/types'
import ParameterEditor from '@/components/ParameterEditor.vue'

const simulationStore = useSimulationStore()
const personaStore = usePersonaStore()

const selectedPersonaDescription = computed(() => {
  const persona = personaStore.allPersonas.find(p => p.id === simulationStore.currentConfig.personaId)
  return persona?.description || ''
})

function handlePersonaChange() {
  simulationStore.updateConfig({ personaId: simulationStore.currentConfig.personaId })
}

function handleDurationModeChange(mode: DurationModeOption) {
  if (mode.defaultConfig) {
    simulationStore.updateDuration(mode.defaultConfig)
  }
  simulationStore.isDirty = true
}

function saveConfiguration() {
  const config = simulationStore.saveConfig()
  if (config) {
    // TODO: Show success toast
    console.log('Configuration saved:', config.id)
  }
}

function launchSimulation() {
  const config = simulationStore.launchSimulation()
  if (config) {
    // TODO: Navigate to live monitor or show launch confirmation
    console.log('Simulation launched with config:', config.id)
  }
}
</script>

<style scoped>
/* Ensure consistent styling */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
