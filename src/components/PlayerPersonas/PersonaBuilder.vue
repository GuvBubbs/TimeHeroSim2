<!-- PersonaBuilder.vue - Modal for creating/editing custom personas -->
<template>
  <!-- Modal backdrop -->
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click="handleBackdropClick"
  >
    <!-- Modal content -->
    <div
      class="bg-sim-surface border border-sim-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-sim-border flex-shrink-0">
        <div>
          <h2 class="text-lg font-semibold text-sim-text">
            {{ isEditing ? 'Edit Persona' : 'Create Custom Persona' }}
          </h2>
          <p class="text-sm text-sim-muted">
            Configure player behavior and schedule patterns
          </p>
        </div>
        <button
          @click="handleCancel"
          class="text-sim-muted hover:text-sim-text transition-colors"
        >
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      
      <!-- Content -->
      <div class="overflow-y-auto flex-1 min-h-0">
        <div class="p-6 space-y-6">
          <!-- Basic Information -->
          <div>
            <h3 class="text-sm font-medium text-sim-text mb-4">Basic Information</h3>
            
            <!-- Template Selection -->
            <div v-if="!isEditing" class="mb-4">
              <label class="block text-sm font-medium text-sim-text mb-2">
                Base Template
              </label>
              <select
                v-model="selectedTemplate"
                @change="applyTemplate"
                class="w-full p-3 bg-sim-bg border border-sim-border rounded-lg text-sim-text focus:ring-2 focus:ring-sim-accent focus:border-sim-accent"
              >
                <option value="">Custom Configuration</option>
                <option
                  v-for="template in templates"
                  :key="template.id"
                  :value="template.id"
                >
                  {{ template.name }} - {{ template.description }}
                </option>
              </select>
            </div>
            
            <!-- Name -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-sim-text mb-2">
                Name *
              </label>
              <input
                v-model="formData.name"
                type="text"
                placeholder="Enter persona name"
                class="w-full p-3 bg-sim-bg border border-sim-border rounded-lg text-sim-text focus:ring-2 focus:ring-sim-accent focus:border-sim-accent"
                :class="{ 'border-red-500': hasError('name') }"
              />
              <div v-if="hasError('name')" class="text-red-500 text-xs mt-1">
                {{ getError('name') }}
              </div>
            </div>
            
            <!-- Description -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-sim-text mb-2">
                Description
              </label>
              <textarea
                v-model="formData.description"
                placeholder="Describe this persona's playstyle"
                rows="3"
                class="w-full p-3 bg-sim-bg border border-sim-border rounded-lg text-sim-text focus:ring-2 focus:ring-sim-accent focus:border-sim-accent resize-none"
              ></textarea>
            </div>
            
            <!-- Icon & Color -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-sim-text mb-2">
                  Icon
                </label>
                <IconSelector
                  v-model="formData.icon"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-sim-text mb-2">
                  Color
                </label>
                <select
                  v-model="formData.color"
                  class="w-full p-3 bg-sim-bg border border-sim-border rounded-lg text-sim-text focus:ring-2 focus:ring-sim-accent focus:border-sim-accent"
                >
                  <option value="#3b82f6">Blue</option>
                  <option value="#10b981">Emerald</option>
                  <option value="#f59e0b">Amber</option>
                  <option value="#ef4444">Red</option>
                  <option value="#8b5cf6">Purple</option>
                  <option value="#06b6d4">Cyan</option>
                  <option value="#84cc16">Lime</option>
                  <option value="#f97316">Orange</option>
                </select>
              </div>
            </div>
          </div>
          
          <!-- Behavior Settings -->
          <div>
            <h3 class="text-sm font-medium text-sim-text mb-4">Behavior Settings</h3>
            <div class="space-y-4">
              <PersonaSlider
                v-model="formData.efficiency"
                label="Efficiency"
                description="How optimal their decisions are (higher = better choices)"
                :min="0"
                :max="1"
                color="green"
              />
              
              <PersonaSlider
                v-model="formData.riskTolerance"
                label="Risk Tolerance"
                description="Willingness to try dangerous routes (higher = more risky)"
                :min="0"
                :max="1"
                color="red"
              />
              
              <PersonaSlider
                v-model="formData.optimization"
                label="Optimization"
                description="How much they min-max and calculate (higher = more strategic)"
                :min="0"
                :max="1"
                color="blue"
              />
              
              <PersonaSlider
                v-model="formData.learningRate"
                label="Learning Rate"
                description="How fast they improve over time (higher = learns faster)"
                :min="0"
                :max="1"
                color="purple"
              />
            </div>
          </div>
          
          <!-- Play Schedule -->
          <div>
            <h3 class="text-sm font-medium text-sim-text mb-4">Play Schedule</h3>
            <div class="space-y-4">
              <PersonaSlider
                v-model="formData.weekdayCheckIns"
                label="Weekday Check-ins"
                description="Number of times per weekday they check the game"
                :min="1"
                :max="20"
                :step="1"
                unit="times"
                color="blue"
              />
              
              <PersonaSlider
                v-model="formData.weekendCheckIns"
                label="Weekend Check-ins"
                description="Number of times per weekend day they check the game"
                :min="1"
                :max="20"
                :step="1"
                unit="times"
                color="green"
              />
              
              <PersonaSlider
                v-model="formData.avgSessionLength"
                label="Session Length"
                description="Average minutes spent per game session"
                :min="5"
                :max="120"
                :step="5"
                unit="min"
                color="amber"
              />
            </div>
          </div>
          
          <!-- Focus Areas -->
          <!-- REMOVED: Focus areas simplified to use efficiency metric for decisions -->
          
          <!-- Target Completion -->
          <!-- REMOVED: Target expectations removed, using calculated estimates for Phase 5 -->
        </div>
      </div>
      
      <!-- Footer -->
      <div class="flex items-center justify-between p-6 border-t border-sim-border bg-sim-bg flex-shrink-0">
        <div class="flex space-x-2">
          <button
            @click="randomizePersona"
            class="btn btn-secondary"
          >
            <i class="fas fa-dice mr-2"></i>
            Random
          </button>
          
          <button
            @click="resetPersona"
            class="btn btn-secondary"
          >
            <i class="fas fa-undo mr-2"></i>
            Reset
          </button>
        </div>
        
        <div class="flex space-x-3">
          <button
            @click="handleCancel"
            class="btn btn-secondary"
          >
            Cancel
          </button>
          
          <button
            @click="handleSave"
            :disabled="!canSave"
            class="btn btn-primary"
            :class="{ 'opacity-50 cursor-not-allowed': !canSave }"
          >
            <i class="fas fa-save mr-2"></i>
            {{ isEditing ? 'Save Changes' : 'Create Persona' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePersonaStore } from '@/stores/personas'
import type { SimplePersona, PersonaTemplate } from '@/types'
import PersonaSlider from './PersonaSlider.vue'
import IconSelector from './IconSelector.vue'

interface Props {
  show: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [persona: SimplePersona]
}>()

const personaStore = usePersonaStore()

// Form state
const formData = ref<SimplePersona>({
  id: '',
  name: '',
  description: '',
  icon: 'fa-user',
  color: '#6b7280',
  efficiency: 0.75,
  riskTolerance: 0.5,
  optimization: 0.7,
  learningRate: 0.5,
  weekdayCheckIns: 3,
  weekendCheckIns: 5,
  avgSessionLength: 25,
  isPreset: false
})

const selectedTemplate = ref<string>('')
const templates = computed(() => personaStore.templates)

// Computed
const isEditing = computed(() => personaStore.editorState.originalData !== null)

const canSave = computed(() => {
  const hasName = formData.value.name.trim() !== ''
  return hasName
})

// Watch for store changes (one-way: store → form)
watch(() => personaStore.editorState.current, (newPersona) => {
  if (newPersona) {
    formData.value = { ...newPersona }
    selectedTemplate.value = personaStore.editorState.activeTemplate || ''
  }
}, { immediate: true })

// Don't watch form changes - use manual sync instead to avoid infinite loops

function hasError(field: string): boolean {
  return personaStore.editorState.validation.some(v => v.field === field && v.severity === 'error')
}

function getError(field: string): string {
  const error = personaStore.editorState.validation.find(v => v.field === field && v.severity === 'error')
  return error?.message || ''
}

function applyTemplate() {
  if (!selectedTemplate.value) return
  
  const template = templates.value.find(t => t.id === selectedTemplate.value)
  if (template) {
    Object.assign(formData.value, template.basePersona)
    personaStore.editorState.activeTemplate = selectedTemplate.value
  }
}

function randomizePersona() {
  formData.value.efficiency = Math.round(Math.random() * 0.6 + 0.4 * 100) / 100 // 0.4-1.0
  formData.value.riskTolerance = Math.round(Math.random() * 100) / 100 // 0.0-1.0
  formData.value.optimization = Math.round(Math.random() * 0.7 + 0.3 * 100) / 100 // 0.3-1.0
  formData.value.learningRate = Math.round(Math.random() * 0.8 + 0.2 * 100) / 100 // 0.2-1.0
  formData.value.weekdayCheckIns = Math.floor(Math.random() * 10) + 1 // 1-10
  formData.value.weekendCheckIns = Math.floor(Math.random() * 12) + 1 // 1-12
  formData.value.avgSessionLength = (Math.floor(Math.random() * 12) + 1) * 10 // 10-120
}

function resetPersona() {
  const template = selectedTemplate.value ? 
    templates.value.find(t => t.id === selectedTemplate.value) : null
  
  if (template) {
    Object.assign(formData.value, template.basePersona)
  } else {
    formData.value.efficiency = 0.75
    formData.value.riskTolerance = 0.5
    formData.value.optimization = 0.7
    formData.value.learningRate = 0.5
    formData.value.weekdayCheckIns = 3
    formData.value.weekendCheckIns = 5
    formData.value.avgSessionLength = 25
  }
}

function handleBackdropClick() {
  if (personaStore.editorState.isDirty) {
    if (confirm('You have unsaved changes. Are you sure you want to close?')) {
      handleCancel()
    }
  } else {
    handleCancel()
  }
}

function handleCancel() {
  personaStore.cancelEdit()
  selectedTemplate.value = ''
  emit('close')
}

function handleSave() {
  // Manually sync form data to store before saving
  if (personaStore.editorState.current) {
    personaStore.editorState.current = { ...formData.value }
    personaStore.editorState.isDirty = true
  }
  
  if (canSave.value) {
    const success = personaStore.savePersona()
    if (success) {
      selectedTemplate.value = ''
      emit('close')
    }
  }
}
</script>
