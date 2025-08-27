<template>
  <div
    v-if="simulationStore.showParameterEditor"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="closeEditor"
  >
    <div class="bg-sim-surface border border-sim-border rounded-lg w-[95vw] h-[90vh] max-w-7xl flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-sim-border">
        <div>
          <h2 class="text-2xl font-bold">Parameter Editor</h2>
          <p class="text-sm text-sim-muted mt-1">
            Fine-tune simulation behavior across all game systems
          </p>
        </div>
        
        <div class="flex items-center space-x-4">
          <!-- Override Badge -->
          <div
            v-if="parameterStore.hasOverrides"
            class="px-3 py-1 bg-sim-primary/20 border border-sim-primary/30 rounded-full text-sm"
          >
            {{ parameterStore.overrideCount }} overrides
          </div>
          
          <!-- Controls -->
          <button
            @click="saveParameters"
            :disabled="!parameterStore.isDirty"
            class="btn btn-primary"
          >
            <i class="fas fa-save mr-2"></i>
            Save Changes
          </button>
          
          <button
            @click="resetParameters"
            v-if="parameterStore.hasOverrides"
            class="btn btn-secondary"
          >
            <i class="fas fa-undo mr-2"></i>
            Reset All
          </button>
          
          <button
            @click="closeEditor"
            class="btn btn-ghost"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar Navigation -->
        <div class="w-80 border-r border-sim-border bg-sim-surface/50 flex flex-col">
          <!-- Search -->
          <div class="p-4 border-b border-sim-border">
            <div class="relative">
              <input
                v-model="parameterStore.searchQuery"
                type="text"
                placeholder="Search parameter screens..."
                class="w-full pl-10 pr-4 py-2 bg-sim-surface border border-sim-border rounded-lg focus:ring-2 focus:ring-sim-primary focus:border-transparent"
              />
              <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-sim-muted"></i>
            </div>
          </div>
          
          <!-- Screen List -->
          <div class="flex-1 overflow-y-auto p-4 space-y-2">
            <button
              v-for="screen in parameterStore.filteredScreens"
              :key="screen.id"
              @click="parameterStore.setCurrentScreen(screen.id)"
              :class="[
                'w-full p-4 rounded-lg text-left transition-all',
                parameterStore.currentScreen === screen.id
                  ? 'bg-sim-primary/20 border border-sim-primary/30'
                  : 'bg-sim-surface border border-sim-border hover:border-sim-muted'
              ]"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-center space-x-3">
                  <i :class="['text-lg', screen.icon]"></i>
                  <div>
                    <div class="font-medium">{{ screen.name }}</div>
                    <div class="text-xs text-sim-muted mt-1 leading-relaxed">
                      {{ screen.description }}
                    </div>
                  </div>
                </div>
                
                <!-- Override indicator -->
                <div
                  v-if="getScreenOverrideCount(screen.id) > 0"
                  class="flex-shrink-0 w-6 h-6 bg-sim-primary rounded-full flex items-center justify-center text-xs font-bold"
                >
                  {{ getScreenOverrideCount(screen.id) }}
                </div>
              </div>
            </button>
          </div>
          
          <!-- Footer Actions -->
          <div class="p-4 border-t border-sim-border space-y-2">
            <button
              @click="exportConfiguration"
              class="w-full btn btn-secondary text-sm"
            >
              <i class="fas fa-download mr-2"></i>
              Export Config
            </button>
            <button
              @click="importConfiguration"
              class="w-full btn btn-secondary text-sm"
            >
              <i class="fas fa-upload mr-2"></i>
              Import Config
            </button>
          </div>
        </div>
        
        <!-- Main Content Area -->
        <div class="flex-1 overflow-hidden">
          <component
            :is="currentScreenComponent"
            :key="parameterStore.currentScreen"
          />
        </div>
      </div>
    </div>
    
    <!-- Import Modal -->
    <div
      v-if="showImportModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-60"
      @click.self="showImportModal = false"
    >
      <div class="bg-sim-surface border border-sim-border rounded-lg p-6 w-96">
        <h3 class="text-lg font-bold mb-4">Import Configuration</h3>
        <textarea
          v-model="importData"
          class="w-full h-32 bg-sim-surface border border-sim-border rounded-lg p-3 text-sm font-mono"
          placeholder="Paste configuration JSON here..."
        ></textarea>
        <div class="flex justify-end space-x-3 mt-4">
          <button
            @click="showImportModal = false"
            class="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            @click="doImport"
            :disabled="!importData"
            class="btn btn-primary"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSimulationStore } from '@/stores/simulation'
import { useParameterStore } from '@/stores/parameters'

// Lazy-loaded parameter screen components
import FarmParameters from '@/components/parameters/FarmParameters.vue'
import TowerParameters from '@/components/parameters/TowerParameters.vue'
import TownParameters from '@/components/parameters/TownParameters.vue'
import AdventureParameters from '@/components/parameters/AdventureParameters.vue'
import ForgeParameters from '@/components/parameters/ForgeParameters.vue'
import MineParameters from '@/components/parameters/MineParameters.vue'
import HelperParameters from '@/components/parameters/HelperParameters.vue'
import ResourceParameters from '@/components/parameters/ResourceParameters.vue'
import DecisionParameters from '@/components/parameters/DecisionParameters.vue'

const simulationStore = useSimulationStore()
const parameterStore = useParameterStore()

const showImportModal = ref(false)
const importData = ref('')

// Component mapping
const components = {
  FarmParameters,
  TowerParameters,
  TownParameters,
  AdventureParameters,
  ForgeParameters,
  MineParameters,
  HelperParameters,
  ResourceParameters,
  DecisionParameters
}

const currentScreenComponent = computed(() => {
  const screenInfo = parameterStore.filteredScreens.find(s => s.id === parameterStore.currentScreen)
  return screenInfo ? components[screenInfo.component as keyof typeof components] : FarmParameters
})

function getScreenOverrideCount(screenId: string): number {
  let count = 0
  for (const override of parameterStore.overrides.values()) {
    if (override.path.startsWith(`${screenId}.`)) {
      count++
    }
  }
  return count
}

function closeEditor() {
  if (parameterStore.isDirty) {
    if (confirm('You have unsaved changes. Are you sure you want to close?')) {
      simulationStore.showParameterEditor = false
    }
  } else {
    simulationStore.showParameterEditor = false
  }
}

function saveParameters() {
  parameterStore.saveToLocalStorage()
}

function resetParameters() {
  if (confirm('This will reset all parameters to defaults and remove all overrides. Continue?')) {
    parameterStore.resetParameters()
  }
}

function exportConfiguration() {
  const config = parameterStore.exportConfiguration()
  const data = JSON.stringify(config, null, 2)
  
  // Download as file
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `timehero-sim-parameters-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function importConfiguration() {
  showImportModal.value = true
  importData.value = ''
}

function doImport() {
  try {
    const config = JSON.parse(importData.value)
    parameterStore.importConfiguration(config)
    showImportModal.value = false
    importData.value = ''
  } catch (error) {
    alert('Invalid JSON format. Please check your configuration data.')
  }
}
</script>

<style scoped>
/* Custom scrollbar for sidebar */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgb(var(--sim-surface));
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgb(var(--sim-border));
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--sim-muted));
}
</style>
