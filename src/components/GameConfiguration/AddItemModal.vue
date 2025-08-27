<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
      <div class="modal-header">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-sim-text">
            Add New {{ itemTypeDisplay }}
          </h2>
          <button
            @click="$emit('close')"
            class="text-sim-muted hover:text-slate-200 transition-colors"
          >
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Required Fields -->
          <div class="md:col-span-2">
            <h3 class="form-section-header">Required Information</h3>
          </div>
          
          <div>
            <label class="label">
              ID <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.id"
              type="text"
              required
              placeholder="unique_identifier"
              class="input w-full"
              :class="{ 'border-red-500': errors.id }"
            />
            <p v-if="errors.id" class="error-text">{{ errors.id }}</p>
          </div>

          <div>
            <label class="label">
              Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.name"
              type="text"
              required
              placeholder="Display Name"
              class="input w-full"
              :class="{ 'border-red-500': errors.name }"
            />
            <p v-if="errors.name" class="error-text">{{ errors.name }}</p>
          </div>

          <!-- Type and Category -->
          <div>
            <label class="label">Type</label>
            <select
              v-model="formData.type"
              class="input w-full"
            >
              <option value="">Select type...</option>
              <option v-for="type in availableTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>

          <div>
            <label class="label">Level</label>
            <input
              v-model.number="formData.level"
              type="number"
              min="1"
              max="20"
              placeholder="1"
              class="input w-full"
            />
          </div>

          <!-- Cost and Gain Fields -->
          <div class="md:col-span-2">
            <h3 class="form-section-header mt-6">Costs and Gains</h3>
          </div>

          <div>
            <label class="label">Gold Cost</label>
            <input
              v-model.number="formData.goldCost"
              type="number"
              min="0"
              placeholder="0"
              class="input w-full"
            />
          </div>

          <div>
            <label class="label">Gold Gain</label>
            <input
              v-model.number="formData.goldGain"
              type="number"
              min="0"
              placeholder="0"
              class="input w-full"
            />
          </div>

          <div>
            <label class="label">Energy Cost</label>
            <input
              v-model.number="formData.energyCost"
              type="number"
              min="0"
              placeholder="0"
              class="input w-full"
            />
          </div>

          <div>
            <label class="label">Time</label>
            <input
              v-model.number="formData.time"
              type="number"
              min="0"
              placeholder="0"
              class="input w-full"
            />
          </div>

          <div class="md:col-span-2">
            <label class="label">Materials Cost</label>
            <textarea
              v-model="formData.materialsCostString"
              rows="2"
              class="input w-full resize-y"
              placeholder="Material x5; Material2 x10"
            ></textarea>
            <p class="help-text">Format: Material x5; Another Material x10</p>
          </div>

          <div class="md:col-span-2">
            <label class="label">Materials Gain</label>
            <textarea
              v-model="formData.materialsGainString"
              rows="2"
              class="input w-full resize-y"
              placeholder="Material x5; Material2 x10"
            ></textarea>
            <p class="help-text">Format: Material x5; Another Material x10</p>
          </div>

          <!-- Prerequisites -->
          <div class="md:col-span-2">
            <label class="label">Prerequisites</label>
            <div class="space-y-2">
              <div v-for="(prereq, index) in formData.prerequisites" :key="index" class="flex items-center space-x-2">
                <input
                  v-model="formData.prerequisites[index]"
                  type="text"
                  placeholder="prerequisite_id"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  @click="removePrerequisite(index)"
                  class="text-red-500 hover:text-red-700 px-2 py-2"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <button
                type="button"
                @click="addPrerequisite"
                class="text-blue-500 hover:text-blue-700 text-sm flex items-center"
              >
                <i class="fas fa-plus mr-1"></i>
                Add Prerequisite
              </button>
            </div>
          </div>

          <!-- Game-specific fields based on category -->
          <template v-if="showCombatFields">
            <div class="md:col-span-2">
              <h3 class="form-section-header mt-6">Combat Properties</h3>
            </div>
            
            <div>
              <label class="label">Damage</label>
              <input
                v-model.number="formData.damage"
                type="number"
                min="0"
                placeholder="0"
                class="input w-full"
              />
            </div>

            <div>
              <label class="label">Attack Speed</label>
              <input
                v-model.number="formData.attackSpeed"
                type="number"
                min="0"
                step="0.1"
                placeholder="1.0"
                class="input w-full"
              />
            </div>

            <div>
              <label class="label">Advantage Vs</label>
              <input
                v-model="formData.advantageVs"
                type="text"
                placeholder="enemy_type"
                class="input w-full"
              />
            </div>
          </template>

          <template v-if="showFarmFields">
            <div class="md:col-span-2">
              <h3 class="form-section-header mt-6">Farm Properties</h3>
            </div>
            
            <div>
              <label class="label">Wind Level</label>
              <input
                v-model.number="formData.windLevel"
                type="number"
                min="0"
                max="5"
                placeholder="0"
                class="input w-full"
              />
            </div>

            <div>
              <label class="label">Seed Level</label>
              <input
                v-model.number="formData.seedLevel"
                type="number"
                min="0"
                max="5"
                placeholder="0"
                class="input w-full"
              />
            </div>
          </template>

          <!-- Effect and Notes -->
          <div class="md:col-span-2">
            <label class="label">Effect</label>
            <textarea
              v-model="formData.effect"
              rows="2"
              placeholder="Describe the effect or ability..."
              class="input w-full"
            ></textarea>
          </div>

          <div class="md:col-span-2">
            <label class="label">Notes</label>
            <textarea
              v-model="formData.notes"
              rows="2"
              placeholder="Additional notes or comments..."
              class="input w-full"
            ></textarea>
          </div>

          <!-- Repeatable checkbox -->
          <div class="md:col-span-2">
            <label class="flex items-center">
              <input
                v-model="formData.repeatable"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm font-medium text-gray-700">Repeatable action</span>
            </label>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-3 mt-8 pt-6 border-t border-sim-border">
          <button
            type="button"
            @click="$emit('close')"
            class="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="!canSubmit"
            class="btn btn-primary"
            :class="{ 'opacity-50 cursor-not-allowed': !canSubmit }"
          >
            <i class="fas fa-plus mr-2"></i>
            Add {{ itemTypeDisplay }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useConfigurationStore } from '@/stores/configuration'
import { useGameDataStore } from '@/stores/gameData'
import type { GameDataItem } from '@/types/game-data'

interface Props {
  show: boolean
  gameFeature: string
  category: string
}

interface Emits {
  (e: 'close'): void
  (e: 'item-added', item: GameDataItem): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const configStore = useConfigurationStore()
const gameData = useGameDataStore()

// Form data
const formData = ref({
  id: '',
  name: '',
  type: '',
  level: 1,
  goldCost: 0,
  goldGain: 0,
  energyCost: 0,
  time: 0,
  materialsCostString: '',
  materialsGainString: '',
  prerequisites: [] as string[],
  damage: 0,
  attackSpeed: 1.0,
  advantageVs: '',
  windLevel: 0,
  seedLevel: 0,
  effect: '',
  notes: '',
  repeatable: false
})

const errors = ref<Record<string, string>>({})

// Computed properties
const itemTypeDisplay = computed(() => {
  return props.category || 'Item'
})

const showCombatFields = computed(() => {
  return props.gameFeature === 'Combat' || props.gameFeature === 'Forge'
})

const showFarmFields = computed(() => {
  return props.gameFeature === 'Farm'
})

const availableTypes = computed(() => {
  // Get types from existing items in the same game feature
  const items = gameData.itemsByGameFeature[props.gameFeature] || []
  const types = new Set(items.map(item => item.type).filter(Boolean))
  return Array.from(types).sort()
})

const canSubmit = computed(() => {
  return formData.value.id.trim() !== '' && 
         formData.value.name.trim() !== '' && 
         Object.keys(errors.value).length === 0
})

// Validation
const validateForm = () => {
  errors.value = {}

  // ID validation
  if (!formData.value.id.trim()) {
    errors.value.id = 'ID is required'
  } else if (!/^[a-z0-9_]+$/.test(formData.value.id)) {
    errors.value.id = 'ID must contain only lowercase letters, numbers, and underscores'
  } else if (gameData.getItemById(formData.value.id)) {
    errors.value.id = 'ID already exists'
  }

  // Name validation
  if (!formData.value.name.trim()) {
    errors.value.name = 'Name is required'
  }

  return Object.keys(errors.value).length === 0
}

// Prerequisites management
const addPrerequisite = () => {
  formData.value.prerequisites.push('')
}

const removePrerequisite = (index: number) => {
  formData.value.prerequisites.splice(index, 1)
}

// Material cost conversion helper
const stringToMaterialsCost = (str: string) => {
  if (!str || typeof str !== 'string') return undefined
  const result: any = {}
  const parts = str.split(';').map(s => s.trim()).filter(Boolean)
  
  for (const part of parts) {
    const match = part.match(/^(.+?)\s+x(\d+)$/i)
    if (match) {
      const material = match[1].trim()
      const amount = parseInt(match[2])
      if (material && !isNaN(amount)) {
        result[material] = amount
      }
    }
  }
  return Object.keys(result).length > 0 ? result : undefined
}

// Form submission
const handleSubmit = () => {
  if (!validateForm()) {
    return
  }

  // Create new item based on current game feature and category
  const newItem: GameDataItem = {
    id: formData.value.id.trim(),
    name: formData.value.name.trim(),
    prerequisites: formData.value.prerequisites.filter(p => p.trim()),
    type: formData.value.type || 'item',
    categories: [props.category],
    level: formData.value.level || undefined,
    goldCost: formData.value.goldCost || undefined,
    goldGain: formData.value.goldGain || undefined,
    energyCost: formData.value.energyCost || undefined,
    time: formData.value.time || undefined,
    materialsCost: stringToMaterialsCost(formData.value.materialsCostString),
    materialsGain: stringToMaterialsCost(formData.value.materialsGainString),
    damage: formData.value.damage || undefined,
    attackSpeed: formData.value.attackSpeed || undefined,
    advantageVs: formData.value.advantageVs || undefined,
    windLevel: formData.value.windLevel || undefined,
    seedLevel: formData.value.seedLevel || undefined,
    effect: formData.value.effect || undefined,
    notes: formData.value.notes || undefined,
    repeatable: formData.value.repeatable,
    sourceFile: `${props.gameFeature.toLowerCase()}_custom.csv`, // Mark as custom
    category: 'Data' as const
  }

  // Clean up undefined values
  Object.keys(newItem).forEach(key => {
    if ((newItem as any)[key] === undefined || (newItem as any)[key] === '') {
      delete (newItem as any)[key]
    }
  })

  // Add to configuration store as a new item
  configStore.setItemValue(newItem.id, 'id', newItem.id, newItem.id)
  
  // Add the complete item data
  Object.entries(newItem).forEach(([field, value]) => {
    if (field !== 'id') {
      configStore.setItemValue(newItem.id, field as keyof GameDataItem, value, undefined)
    }
  })

  emit('item-added', newItem)
  resetForm()
  emit('close')
}

// Reset form
const resetForm = () => {
  formData.value = {
    id: '',
    name: '',
    type: '',
    level: 1,
    goldCost: 0,
    goldGain: 0,
    energyCost: 0,
    time: 0,
    materialsCostString: '',
    materialsGainString: '',
    prerequisites: [],
    damage: 0,
    attackSpeed: 1.0,
    advantageVs: '',
    windLevel: 0,
    seedLevel: 0,
    effect: '',
    notes: '',
    repeatable: false
  }
  errors.value = {}
}

// Watch ID field for validation
watch(() => formData.value.id, () => {
  if (formData.value.id) {
    validateForm()
  }
})

// Auto-generate ID from name
watch(() => formData.value.name, (newName) => {
  if (newName && !formData.value.id) {
    formData.value.id = newName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30)
  }
})

// Reset form when modal opens
watch(() => props.show, (newShow) => {
  if (newShow) {
    resetForm()
  }
})
</script>

<style scoped>
/* Modal transitions could be added here */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
</style>
