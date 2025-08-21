<template>
  <div class="bg-sim-background rounded-lg border border-sim-border overflow-hidden">
    <!-- Table Header -->
    <div class="bg-sim-surface px-4 py-3 border-b border-sim-border">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold">{{ title }}</h3>
          <p class="text-sm text-sim-muted">{{ items.length }} items</p>
        </div>
        <div class="flex items-center space-x-2">
          <!-- View Options -->
          <div class="flex border border-sim-border rounded-md">
            <button
              @click="viewMode = 'table'"
              :class="[
                'px-3 py-1.5 text-sm transition-colors',
                viewMode === 'table' 
                  ? 'bg-sim-primary text-white' 
                  : 'hover:bg-sim-muted hover:bg-opacity-10'
              ]"
            >
              <i class="fas fa-table mr-1"></i>
              Table
            </button>
            <button
              @click="viewMode = 'grid'"
              :class="[
                'px-3 py-1.5 text-sm border-l border-sim-border transition-colors',
                viewMode === 'grid' 
                  ? 'bg-sim-primary text-white' 
                  : 'hover:bg-sim-muted hover:bg-opacity-10'
              ]"
            >
              <i class="fas fa-th-large mr-1"></i>
              Grid
            </button>
          </div>
          
          <!-- Column Selector -->
          <div class="relative">
            <button
              @click="showColumnSelector = !showColumnSelector"
              class="px-3 py-1.5 text-sm border border-sim-border rounded-md hover:bg-sim-muted hover:bg-opacity-10 transition-colors"
            >
              <i class="fas fa-columns mr-1"></i>
              Columns
            </button>
            <div v-if="showColumnSelector" class="absolute right-0 top-full mt-1 bg-sim-background border border-sim-border rounded-lg shadow-lg z-10 w-64">
              <div class="p-3">
                <h4 class="font-medium mb-2 text-sim-foreground">Show Columns</h4>
                <div class="space-y-1 max-h-64 overflow-y-auto">
                  <label v-for="column in availableColumns" :key="column.key" class="flex items-center text-sm text-sim-foreground">
                    <input
                      type="checkbox"
                      :checked="visibleColumns.includes(column.key)"
                      @change="toggleColumn(column.key)"
                      class="mr-2"
                    />
                    {{ column.label }}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Content -->
    <div class="overflow-x-auto">
      <div v-if="viewMode === 'table'">
        <table class="w-full">
          <thead class="bg-sim-muted bg-opacity-20">
            <tr>
              <th
                v-for="column in displayColumns"
                :key="column.key"
                class="px-4 py-3 text-left text-xs font-medium text-sim-muted uppercase tracking-wider cursor-pointer hover:bg-sim-muted hover:bg-opacity-10 transition-colors"
                @click="handleSort(column.key)"
              >
                <div class="flex items-center space-x-1">
                  <span>{{ column.label }}</span>
                  <i
                    v-if="sortField === column.key"
                    :class="[
                      'fas text-xs',
                      sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down'
                    ]"
                  ></i>
                  <i v-else class="fas fa-sort text-xs opacity-30"></i>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-sim-border">
            <tr
              v-for="item in paginatedItems"
              :key="item.id"
              class="hover:bg-sim-muted hover:bg-opacity-5 transition-colors"
            >
              <td
                v-for="column in displayColumns"
                :key="column.key"
                class="px-4 py-3 whitespace-nowrap text-sm text-sim-foreground"
              >
                <component
                  :is="getCellComponent(column.key)"
                  :item="item"
                  :field="column.key"
                  :value="getFieldValue(item, column.key)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Grid View -->
      <div v-else-if="viewMode === 'grid'" class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="item in paginatedItems"
            :key="item.id"
            class="bg-sim-surface border border-sim-border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="space-y-2">
              <div class="font-medium">{{ item.name }}</div>
              <div class="text-xs text-sim-muted">{{ item.id }}</div>
              <div v-if="item.type" class="text-xs bg-sim-primary bg-opacity-20 text-sim-primary px-2 py-1 rounded inline-block">
                {{ item.type }}
              </div>
              <div v-if="item.level" class="text-sm">Level {{ item.level }}</div>
              <div v-if="item.prerequisites.length > 0" class="text-xs text-sim-warning">
                <i class="fas fa-lock mr-1"></i>
                {{ item.prerequisites.length }} prerequisite{{ item.prerequisites.length > 1 ? 's' : '' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="items.length === 0" class="text-center py-12 text-sim-muted">
      <i class="fas fa-inbox text-4xl mb-4"></i>
      <p>No items to display</p>
      <p class="text-xs mt-2">Try adjusting your filters</p>
    </div>

    <!-- Pagination -->
    <div v-if="items.length > pageSize" class="bg-sim-surface px-4 py-3 border-t border-sim-border">
      <div class="flex items-center justify-between">
        <div class="text-sm text-sim-muted">
          Showing {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, items.length) }} of {{ items.length }} items
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1 text-sm border border-sim-border rounded hover:bg-sim-muted hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span class="text-sm text-sim-muted">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 text-sm border border-sim-border rounded hover:bg-sim-muted hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineComponent, h } from 'vue'
import type { GameDataItem } from '@/types/game-data'

interface Props {
  items: GameDataItem[]
  title: string
}

const props = defineProps<Props>()

// State
const viewMode = ref<'table' | 'grid'>('table')
const showColumnSelector = ref(false)
const currentPage = ref(1)
const pageSize = ref(50)
const sortField = ref<string>('name')
const sortDirection = ref<'asc' | 'desc'>('asc')

// Column configuration
const availableColumns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'level', label: 'Level' },
  { key: 'goldCost', label: 'Gold Cost' },
  { key: 'energyCost', label: 'Energy Cost' },
  { key: 'time', label: 'Time' },
  { key: 'prerequisites', label: 'Prerequisites' },
  { key: 'materialsCost', label: 'Materials Cost' },
  { key: 'damage', label: 'Damage' },
  { key: 'attackSpeed', label: 'Attack Speed' },
  { key: 'sourceFile', label: 'Source File' },
  { key: 'notes', label: 'Notes' }
]

const visibleColumns = ref(['id', 'name', 'type', 'level', 'goldCost', 'energyCost', 'prerequisites'])

const displayColumns = computed(() => 
  availableColumns.filter(col => visibleColumns.value.includes(col.key))
)

// Sorting and pagination
const sortedItems = computed(() => {
  const items = [...props.items]
  
  return items.sort((a, b) => {
    const aVal = getFieldValue(a, sortField.value)
    const bVal = getFieldValue(b, sortField.value)
    
    // Handle null/undefined values
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1
    
    let comparison = 0
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal)
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal
    } else {
      comparison = String(aVal).localeCompare(String(bVal))
    }
    
    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

const totalPages = computed(() => Math.ceil(props.items.length / pageSize.value))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedItems.value.slice(start, end)
})

// Helper functions
const getFieldValue = (item: GameDataItem, field: string): any => {
  if (field === 'prerequisites') {
    return item.prerequisites.join(', ') || '-'
  }
  if (field === 'materialsCost' && item.materialsCost) {
    return Object.entries(item.materialsCost)
      .map(([mat, qty]) => `${mat} x${qty}`)
      .join(', ')
  }
  return (item as any)[field] ?? '-'
}

const getCellComponent = (field: string) => {
  // Simple cell components for different field types
  if (field === 'prerequisites') {
    return defineComponent({
      props: ['item', 'field', 'value'],
      render() {
        const prereqs = this.item.prerequisites
        if (prereqs.length === 0) return h('span', { class: 'text-sim-muted' }, '-')
        return h('div', { class: 'space-y-1' }, 
          prereqs.slice(0, 3).map((prereq: string) => 
            h('div', { class: 'text-xs bg-sim-warning bg-opacity-20 text-sim-warning px-2 py-1 rounded inline-block mr-1' }, prereq)
          ).concat(prereqs.length > 3 ? [h('div', { class: 'text-xs text-sim-muted' }, `+${prereqs.length - 3} more`)] : [])
        )
      }
    })
  }
  
  if (field === 'level') {
    return defineComponent({
      props: ['item', 'field', 'value'],
      render() {
        const level = this.item.level
        if (!level) return h('span', { class: 'text-sim-muted' }, '-')
        return h('span', { 
          class: [
            'px-2 py-1 rounded text-xs font-medium',
            level <= 3 ? 'bg-green-100 text-green-800' :
            level <= 6 ? 'bg-yellow-100 text-yellow-800' :
            level <= 9 ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          ]
        }, `Level ${level}`)
      }
    })
  }

  if (field === 'type') {
    return defineComponent({
      props: ['item', 'field', 'value'],
      render() {
        const type = this.item.type
        if (!type) return h('span', { class: 'text-sim-muted' }, '-')
        return h('span', { 
          class: 'px-2 py-1 bg-sim-primary bg-opacity-20 text-sim-primary rounded text-xs font-medium capitalize'
        }, type)
      }
    })
  }

  // Default text cell
  return defineComponent({
    props: ['item', 'field', 'value'],
    render() {
      return h('span', {}, this.value || '-')
    }
  })
}

const handleSort = (field: string) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
  currentPage.value = 1 // Reset to first page when sorting
}

const toggleColumn = (columnKey: string) => {
  const index = visibleColumns.value.indexOf(columnKey)
  if (index > -1) {
    // Don't allow removing all columns
    if (visibleColumns.value.length > 1) {
      visibleColumns.value.splice(index, 1)
    }
  } else {
    visibleColumns.value.push(columnKey)
  }
}

// Close column selector when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Element
  if (!target.closest('.relative')) {
    showColumnSelector.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
