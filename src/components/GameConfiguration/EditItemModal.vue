<template>
  <div v-if="show" class="modal-overlay p-4" @click.self="handleCancel">
    <div class="modal max-w-4xl w-full max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="modal-header">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-sim-text">
              Edit: {{ formData.name || 'Unnamed Item' }}
            </h2>
            <p class="text-sm text-sim-muted">{{ formData.id || 'No ID' }}</p>
          </div>
          <button
            @click="handleCancel"
            class="text-sim-muted hover:text-slate-200 transition-colors"
          >
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="modal-body max-h-[calc(90vh-180px)]">
        <form @submit.prevent="handleSave">
          <!-- Basic Information Section -->
          <div class="form-section">
            <h3 class="form-section-header">
              <i class="fas fa-info-circle form-section-icon"></i>
              Basic Information
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="label label-required">ID</label>
                <input
                  v-model="formData.id"
                  type="text"
                  required
                  :disabled="!isNewItem"
                  class="input w-full"
                  :class="{ 'error': errors.id }"
                />
                <p v-if="errors.id" class="error-text">{{ errors.id }}</p>
              </div>

              <div>
                <label class="label label-required">Name</label>
                <input
                  v-model="formData.name"
                  type="text"
                  required
                  class="input w-full"
                  :class="{ 'error': errors.name }"
                />
                <p v-if="errors.name" class="error-text">{{ errors.name }}</p>
              </div>

              <div>
                <label class="label">Type</label>
                <input
                  v-model="formData.type"
                  type="text"
                  class="input w-full"
                />
              </div>

              <div v-if="hasField('level')">
                <label class="label">Level</label>
                <input
                  v-model.number="formData.level"
                  type="number"
                  min="1"
                  max="20"
                  class="input w-full"
                />
              </div>
            </div>
          </div>

          <!-- Costs & Gains Section -->
          <div v-if="hasCostFields" class="form-section">
            <h3 class="form-section-header">
              <i class="fas fa-coins form-section-icon"></i>
              Costs & Gains
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div v-if="hasField('goldCost')">
                <label class="label">Gold Cost</label>
                <input
                  v-model.number="formData.goldCost"
                  type="number"
                  min="0"
                  class="input w-full"
                />
              </div>

              <div v-if="hasField('goldGain')">
                <label class="label">Gold Gain</label>
                <input
                  v-model.number="formData.goldGain"
                  type="number"
                  min="0"
                  class="input w-full"
                />
              </div>

              <div v-if="hasField('energyCost')">
                <label class="label">Energy Cost</label>
                <input
                  v-model.number="formData.energyCost"
                  type="number"
                  min="0"
                  class="input w-full"
                />
              </div>

              <div v-if="hasField('time')">
                <label class="label">Time</label>
                <input
                  v-model.number="formData.time"
                  type="number"
                  min="0"
                  class="input w-full"
                />
              </div>
            </div>
            
            <!-- Material costs (full width) -->
            <div v-if="hasField('materialsCost')" class="mt-3">
              <h4 class="form-section-header">
                <i class="fas fa-hammer form-section-icon"></i>
                Materials Cost
              </h4>
              <div class="space-y-2">
                <div v-for="(material, index) in formData.materialsCostArray" :key="index" class="flex items-center space-x-2">
                  <input
                    v-model="material.name"
                    type="text"
                    placeholder="Material name"
                    class="input flex-1"
                  />
                  <span class="text-sim-muted">x</span>
                  <input
                    v-model.number="material.quantity"
                    type="number"
                    min="1"
                    placeholder="1"
                    class="input w-20"
                  />
                  <button
                    type="button"
                    @click="removeMaterialCost(index)"
                    class="text-sim-error hover:text-red-400 px-2 py-2 transition-colors"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <button
                  type="button"
                  @click="addMaterialCost"
                  class="text-sim-accent hover:text-blue-400 text-sm transition-colors"
                >
                  <i class="fas fa-plus mr-1"></i>
                  Add Material Cost
                </button>
              </div>
            </div>

            <div v-if="hasField('materialsGain')" class="mt-3">
              <h4 class="form-section-header">
                <i class="fas fa-gift form-section-icon"></i>
                Materials Gain
              </h4>
              <div class="space-y-2">
                <div v-for="(material, index) in formData.materialsGainArray" :key="index" class="flex items-center space-x-2">
                  <input
                    v-model="material.name"
                    type="text"
                    placeholder="Material name"
                    class="input flex-1"
                  />
                  <span class="text-sim-muted">x</span>
                  <input
                    v-model.number="material.quantity"
                    type="number"
                    min="1"
                    placeholder="1"
                    class="input w-20"
                  />
                  <button
                    type="button"
                    @click="removeMaterialGain(index)"
                    class="text-sim-error hover:text-red-400 px-2 py-2 transition-colors"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <button
                  type="button"
                  @click="addMaterialGain"
                  class="text-sim-accent hover:text-blue-400 text-sm transition-colors"
                >
                  <i class="fas fa-plus mr-1"></i>
                  Add Material Gain
                </button>
              </div>
            </div>
          </div>

          <!-- Prerequisites Section -->
          <div v-if="hasField('prerequisites')" class="form-section">
            <h3 class="form-section-header">
              <i class="fas fa-link form-section-icon"></i>
              Prerequisites
            </h3>
            
            <div class="space-y-2">
              <div v-for="(prereq, index) in formData.prerequisites" :key="index" class="flex items-center space-x-2">
                <input
                  v-model="formData.prerequisites[index]"
                  type="text"
                  placeholder="prerequisite_id"
                  class="input flex-1"
                />
                <button
                  type="button"
                  @click="removePrerequisite(index)"
                  class="text-sim-error hover:text-red-400 px-2 py-2 transition-colors"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <button
                type="button"
                @click="addPrerequisite"
                class="text-sim-accent hover:text-blue-400 text-sm flex items-center transition-colors"
              >
                <i class="fas fa-plus mr-1"></i>
                Add Prerequisite
              </button>
            </div>
          </div>

          <!-- Combat Properties -->
          <div v-if="hasCombatFields" class="form-section">
            <h3 class="form-section-header">
              <i class="fas fa-sword form-section-icon"></i>
              Combat Properties
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div v-if="hasField('damage')">
                <label class="label">Damage</label>
                <input
                  v-model.number="formData.damage"
                  type="number"
                  min="0"
                  class="input w-full"
                />
              </div>

              <div v-if="hasField('attackSpeed')">
                <label class="label">Attack Speed</label>
                <input
                  v-model.number="formData.attackSpeed"
                  type="number"
                  min="0"
                  step="0.1"
                  class="input w-full"
                />
              </div>

              <div v-if="hasField('advantageVs')">
                <label class="label">Advantage Vs</label>
                <input
                  v-model="formData.advantageVs"
                  type="text"
                  class="input w-full"
                />
              </div>
            </div>
          </div>

          <!-- Farm Properties -->
          <div v-if="hasFarmFields" class="form-section">
            <h3 class="form-section-header">
              <i class="fas fa-seedling form-section-icon"></i>
              Farm Properties
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div v-if="hasField('windLevel')">
                <label class="label">Wind Level</label>
                <input
                  v-model.number="formData.windLevel"
                  type="number"
                  min="0"
                  max="5"
                  class="input w-full"
                />
              </div>

              <div v-if="hasField('seedLevel')">
                <label class="label">Seed Level</label>
                <input
                  v-model.number="formData.seedLevel"
                  type="number"
                  min="0"
                  max="5"
                  class="input w-full"
                />
              </div>

              <div v-if="hasField('seedPool')">
                <label class="label">Seed Pool</label>
                <input
                  v-model="formData.seedPool"
                  type="text"
                  class="input w-full"
                />
              </div>
            </div>
          </div>

          <!-- Specialized Fields (for non-unified schema) -->
          <div v-if="isSpecialized && specializedFields.length > 0" class="form-section">
            <h3 class="form-section-header">
              <i class="fas fa-cogs form-section-icon"></i>
              Additional Properties
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div v-for="field in specializedFields" :key="field" class="space-y-2">
                <label class="label">
                  {{ formatFieldLabel(field) }}
                </label>
                <input
                  v-model="formData[field]"
                  :type="getFieldInputType(field, formData[field])"
                  class="input w-full"
                />
              </div>
            </div>
          </div>

          <!-- Advanced Properties -->
          <div class="form-section">
            <h3 class="form-section-header">
              <i class="fas fa-cog form-section-icon"></i>
              Advanced Properties
            </h3>
            
            <div class="space-y-3">
              <div v-if="hasField('effect')">
                <label class="label">Effect</label>
                <textarea
                  v-model="formData.effect"
                  rows="2"
                  class="input w-full resize-y"
                  placeholder="Describe the effect or ability..."
                ></textarea>
              </div>

              <div v-if="hasField('notes')">
                <label class="label">Notes</label>
                <textarea
                  v-model="formData.notes"
                  rows="2"
                  class="input w-full resize-y"
                  placeholder="Additional notes or comments..."
                ></textarea>
              </div>

              <div v-if="hasField('repeatable')" class="flex items-center">
                <input
                  v-model="formData.repeatable"
                  type="checkbox"
                  class="mr-2 accent-sim-accent"
                />
                <label class="label mb-0">Repeatable action</label>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <div class="flex justify-between items-center">
          <div class="text-sm">
            <span v-if="isDirty" class="text-sim-warning">● Unsaved changes</span>
            <span v-else class="text-sim-success">✓ No changes</span>
          </div>
          <div class="flex space-x-3">
            <button
              type="button"
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
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, watchEffect } from 'vue'
import { useConfigurationStore } from '@/stores/configuration'
import type { GameDataItem } from '@/types/game-data'

interface Props {
  show: boolean
  item: GameDataItem | Record<string, any> | null
  isSpecialized?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'save', item: GameDataItem | Record<string, any>): void
}

const props = withDefaults(defineProps<Props>(), {
  isSpecialized: false
})

const emit = defineEmits<Emits>()
const configStore = useConfigurationStore()

// Form state
const formData = ref<any>({})
const originalData = ref<any>({})
const errors = ref<Record<string, string>>({})

// Computed properties
const isNewItem = computed(() => !props.item || !props.item.id)

const isDirty = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

const canSave = computed(() => {
  return isDirty.value && formData.value.id && formData.value.name && Object.keys(errors.value).length === 0
})

const hasCostFields = computed(() => {
  return hasField('goldCost') || hasField('goldGain') || hasField('energyCost') || hasField('time') || 
         hasField('materialsCost') || hasField('materialsGain')
})

const hasCombatFields = computed(() => {
  return hasField('damage') || hasField('attackSpeed') || hasField('advantageVs')
})

const hasFarmFields = computed(() => {
  return hasField('windLevel') || hasField('seedLevel') || hasField('seedPool')
})

const specializedFields = computed(() => {
  if (!props.isSpecialized || !props.item) return []
  
  const standardFields = ['id', 'name', 'type', 'level', 'goldCost', 'goldGain', 'energyCost', 'time', 
                         'materialsCost', 'materialsGain', 'materialsCostArray', 'materialsGainArray', 'prerequisites', 'damage', 'attackSpeed', 'advantageVs', 
                         'windLevel', 'seedLevel', 'seedPool', 'effect', 'notes', 'repeatable']
  
  return Object.keys(props.item).filter(key => !standardFields.includes(key))
})

// Helper functions
const hasField = (fieldName: string) => {
  return props.item && (fieldName in props.item) && (props.item as any)[fieldName] !== undefined && (props.item as any)[fieldName] !== null && (props.item as any)[fieldName] !== ''
}

const formatFieldLabel = (field: string) => {
  return field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const getFieldInputType = (field: string, value: any) => {
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'checkbox'
  return 'text'
}

// Material cost helpers
const materialsCostToArray = (materialsCost: any) => {
  if (!materialsCost || typeof materialsCost !== 'object') return []
  return Object.entries(materialsCost).map(([name, quantity]) => ({ 
    name, 
    quantity: Number(quantity) 
  }))
}

const arrayToMaterialsCost = (arr: Array<{name: string, quantity: number}>) => {
  if (!arr || !Array.isArray(arr)) return {}
  const result: any = {}
  arr.forEach(item => {
    if (item.name && item.quantity > 0) {
      result[item.name] = item.quantity
    }
  })
  return Object.keys(result).length > 0 ? result : undefined
}

// Material management functions
const addMaterialCost = () => {
  if (!formData.value.materialsCostArray) {
    formData.value.materialsCostArray = []
  }
  formData.value.materialsCostArray.push({ name: '', quantity: 1 })
}

const removeMaterialCost = (index: number) => {
  if (formData.value.materialsCostArray) {
    formData.value.materialsCostArray.splice(index, 1)
    // Update the materialsCost object
    formData.value.materialsCost = arrayToMaterialsCost(formData.value.materialsCostArray)
  }
}

const addMaterialGain = () => {
  if (!formData.value.materialsGainArray) {
    formData.value.materialsGainArray = []
  }
  formData.value.materialsGainArray.push({ name: '', quantity: 1 })
}

const removeMaterialGain = (index: number) => {
  if (formData.value.materialsGainArray) {
    formData.value.materialsGainArray.splice(index, 1)
    // Update the materialsGain object
    formData.value.materialsGain = arrayToMaterialsCost(formData.value.materialsGainArray)
  }
}

// Prerequisites management
const addPrerequisite = () => {
  if (!formData.value.prerequisites) {
    formData.value.prerequisites = []
  }
  formData.value.prerequisites.push('')
}

const removePrerequisite = (index: number) => {
  formData.value.prerequisites.splice(index, 1)
}

// Form handling
const initializeForm = () => {
  if (props.item) {
    formData.value = JSON.parse(JSON.stringify(props.item))
    
    // Ensure prerequisites is an array
    if (!formData.value.prerequisites) {
      formData.value.prerequisites = []
    } else if (typeof formData.value.prerequisites === 'string') {
      formData.value.prerequisites = formData.value.prerequisites.split(';').filter(Boolean)
    }
    
    // Convert materials to arrays for UI
    formData.value.materialsCostArray = materialsCostToArray(formData.value.materialsCost)
    formData.value.materialsGainArray = materialsCostToArray(formData.value.materialsGain)
    
    // Now set originalData to match the same structure as formData
    originalData.value = JSON.parse(JSON.stringify(formData.value))
  } else {
    // New item
    formData.value = {
      id: '',
      name: '',
      type: '',
      prerequisites: [],
      materialsCostArray: [],
      materialsGainArray: [],
      repeatable: false
    }
    originalData.value = {}
  }
  errors.value = {}
}

const validateForm = () => {
  errors.value = {}

  if (!formData.value.id?.trim()) {
    errors.value.id = 'ID is required'
  }

  if (!formData.value.name?.trim()) {
    errors.value.name = 'Name is required'
  }

  return Object.keys(errors.value).length === 0
}

const handleSave = () => {
  if (!validateForm()) return

  // Convert arrays back to MaterialsCost objects
  formData.value.materialsCost = arrayToMaterialsCost(formData.value.materialsCostArray)
  formData.value.materialsGain = arrayToMaterialsCost(formData.value.materialsGainArray)

  // Clean up the data before saving
  const cleanData = { ...formData.value }
  
  // Convert prerequisites back to the expected format
  if (cleanData.prerequisites && Array.isArray(cleanData.prerequisites)) {
    cleanData.prerequisites = cleanData.prerequisites.filter((p: string) => p.trim())
  }

  // Remove the UI-specific arrays from the saved data
  delete cleanData.materialsCostArray
  delete cleanData.materialsGainArray

  emit('save', cleanData)
}

const handleCancel = () => {
  if (isDirty.value) {
    if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      emit('close')
    }
  } else {
    emit('close')
  }
}

// Watch material arrays to sync with objects
watch(() => formData.value.materialsCostArray, (newArray) => {
  if (newArray) {
    formData.value.materialsCost = arrayToMaterialsCost(newArray)
  }
}, { deep: true })

watch(() => formData.value.materialsGainArray, (newArray) => {
  if (newArray) {
    formData.value.materialsGain = arrayToMaterialsCost(newArray)
  }
}, { deep: true })

// Watch for prop changes
watch(() => props.show, (newShow) => {
  if (newShow && props.item) {
    initializeForm()
    nextTick(() => {
      // Focus first input
      const firstInput = document.querySelector('.modal input:not([disabled])')
      if (firstInput) {
        (firstInput as HTMLElement).focus()
      }
    })
  }
})

watch(() => props.item, (newItem) => {
  if (props.show && newItem) {
    initializeForm()
  }
})

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.show) return
  
  if (event.key === 'Escape') {
    handleCancel()
  } else if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    handleSave()
  }
}

// Add event listener for keyboard shortcuts
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown)
}
</script>

<style scoped>
/* Custom styles for the modal */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

/* Ensure proper scrolling */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f7fafc;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 3px;
}
</style>
