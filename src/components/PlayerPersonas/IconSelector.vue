<!-- IconSelector.vue - Custom dropdown with inline Font Awesome icons -->
<template>
  <div class="relative">
    <!-- Selected value display -->
    <button
      @click="toggleDropdown"
      class="w-full p-3 bg-sim-bg border border-sim-border rounded-lg text-sim-text focus:ring-2 focus:ring-sim-accent focus:border-sim-accent text-left flex items-center justify-between"
    >
      <div class="flex items-center space-x-2">
        <i :class="`fas ${selectedIcon}`" class="text-sim-accent"></i>
        <span>{{ getIconLabel(selectedIcon) }}</span>
      </div>
      <i class="fas fa-chevron-down text-sim-muted transition-transform duration-200" :class="{ 'rotate-180': isOpen }"></i>
    </button>
    
    <!-- Dropdown options -->
    <div
      v-if="isOpen"
      class="absolute top-full left-0 right-0 mt-1 bg-sim-surface border border-sim-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
    >
      <button
        v-for="option in iconOptions"
        :key="option.value"
        @click="selectIcon(option.value)"
        class="w-full p-3 text-left hover:bg-sim-accent/10 flex items-center space-x-2 transition-colors"
        :class="{ 'bg-sim-accent/5': selectedIcon === option.value }"
      >
        <i :class="`fas ${option.value}`" class="text-sim-accent w-4"></i>
        <span class="text-sim-text">{{ option.label }}</span>
        <i v-if="selectedIcon === option.value" class="fas fa-check text-sim-accent ml-auto"></i>
      </button>
    </div>
  </div>
  
  <!-- Backdrop to close dropdown -->
  <div
    v-if="isOpen"
    @click="closeDropdown"
    class="fixed inset-0 z-40"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  modelValue: string
}

interface IconOption {
  value: string
  label: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)

const iconOptions: IconOption[] = [
  { value: 'fa-user', label: 'User' },
  { value: 'fa-bolt', label: 'Bolt' },
  { value: 'fa-calendar-week', label: 'Calendar' },
  { value: 'fa-star', label: 'Star' },
  { value: 'fa-crown', label: 'Crown' },
  { value: 'fa-rocket', label: 'Rocket' },
  { value: 'fa-heart', label: 'Heart' },
  { value: 'fa-brain', label: 'Brain' }
]

const selectedIcon = computed(() => props.modelValue)

function getIconLabel(iconValue: string): string {
  const option = iconOptions.find(opt => opt.value === iconValue)
  return option?.label || 'Select Icon'
}

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function selectIcon(iconValue: string) {
  emit('update:modelValue', iconValue)
  closeDropdown()
}

// Close dropdown on escape key
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>
