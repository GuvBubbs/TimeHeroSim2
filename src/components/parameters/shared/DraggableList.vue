<template>
  <div class="space-y-4">
    <h4 class="font-medium text-sim-text">{{ title }}</h4>
    <div class="bg-sim-card-dark p-4 rounded border border-sim-border">
      <p v-if="description" class="text-sim-muted text-sm mb-3">
        {{ description }}
      </p>
      <div class="grid grid-cols-3 gap-2">
        <div 
          v-for="(item, index) in localItems" 
          :key="`${item}-${index}`"
          :draggable="true"
          @dragstart="onDragStart(index)"
          @dragover.prevent
          @drop="onDrop(index)"
          @dragenter.prevent
          :class="[
            'p-2 rounded text-center text-sm cursor-move transition-all duration-200',
            backgroundColor,
            draggedIndex === index 
              ? 'opacity-50 scale-95' 
              : 'hover:scale-105 hover:shadow-md'
          ]"
        >
          <div class="flex items-center justify-center space-x-2">
            <i class="fas fa-grip-vertical text-xs opacity-50"></i>
            <span>{{ index + 1 }}. {{ formatItem(item) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  title: string
  description?: string
  items: string[]
  backgroundColor?: string
  path: string
}

interface Emits {
  (e: 'update', path: string, value: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  backgroundColor: 'bg-sim-primary/20'
})

const emit = defineEmits<Emits>()

const localItems = ref([...props.items])
const draggedIndex = ref<number | null>(null)

// Watch for external changes to items
watch(() => props.items, (newItems) => {
  localItems.value = [...newItems]
})

function formatItem(item: string): string {
  // Capitalize first letter and replace underscores with spaces
  return item.charAt(0).toUpperCase() + item.slice(1).replace(/_/g, ' ')
}

function onDragStart(index: number) {
  draggedIndex.value = index
}

function onDrop(dropIndex: number) {
  if (draggedIndex.value === null || draggedIndex.value === dropIndex) {
    draggedIndex.value = null
    return
  }

  const draggedItem = localItems.value[draggedIndex.value]
  const newItems = [...localItems.value]
  
  // Remove the dragged item
  newItems.splice(draggedIndex.value, 1)
  
  // Insert it at the new position
  newItems.splice(dropIndex, 0, draggedItem)
  
  localItems.value = newItems
  draggedIndex.value = null
  
  // Emit the change
  emit('update', props.path, newItems)
}
</script>

<style scoped>
.cursor-move {
  cursor: grab;
}

.cursor-move:active {
  cursor: grabbing;
}
</style>
