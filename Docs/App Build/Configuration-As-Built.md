# Configuration As-Built Documentation - TimeHero Sim

## Overview

The Configuration system provides a comprehensive interface for viewing and editing game data across all TimeHero Sim systems. Built around a two-tier navigation system with sophisticated modal editing capabilities, it handles both unified schema items and specialized data structures while maintaining data integrity and user experience.

## Architecture Overview

```
ConfigurationView.vue (Main Container)
├── Two-Tier Navigation System
│   ├── Main Tabs: Farm, Tower, Town, Adventure, Combat, Forge, Mining, General
│   └── Sub-Tabs: Per-category breakdown with data type badges
├── Data Display & Management
│   ├── DataTable.vue → Item grid/list display
│   ├── DataFilters.vue → Search and filter controls
│   └── CategorySidebar.vue → Legacy sidebar (if needed)
├── Modal System ⭐ (Core editing interface)
│   ├── EditItemModal.vue → Complex form with material arrays
│   ├── AddItemModal.vue → New item creation
│   └── Material Cost/Gain management system
├── Data Integration
│   ├── gameData store → Source data (17 unified + 10 specialized files)
│   ├── configuration store → User modifications tracking
│   └── Real-time validation and dirty state management
└── UX Features
    ├── Force refresh functionality
    ├── Click-outside-to-close modals  
    ├── Unsaved changes tracking
    └── Dark theme integration
```

## Two-Tier Navigation System

### Main Tab Configuration

**Ordered Tab Array** (User-requested order):
```typescript
const gameScreens = computed(() => [
  { id: 'Farm', name: 'Farm', icon: 'fas fa-seedling' },
  { id: 'Tower', name: 'Tower', icon: 'fas fa-building' },
  { id: 'Town', name: 'Town', icon: 'fas fa-city' },
  { id: 'Adventure', name: 'Adventure', icon: 'fas fa-map' },
  { id: 'Combat', name: 'Combat', icon: 'fas fa-shield-alt' },     // Moved after Adventure
  { id: 'Forge', name: 'Forge', icon: 'fas fa-hammer' },         // Moved after Combat
  { id: 'Mining', name: 'Mine', icon: 'fas fa-tools' },
  { id: 'General', name: 'General', icon: 'fas fa-cogs' }
])
```

### Sub-Tab Generation Logic

Dynamic sub-tab creation based on CSV file metadata:

```typescript
const screenCategories = computed(() => {
  const categories: Record<string, Array<{id: string, name: string, files: string[], count: number}>> = {}
  
  gameScreens.value.forEach(screen => {
    if (screen.id === 'Combat') {
      // Special handling: Show all combat-related files separately
      const combatFiles = CSV_FILE_LIST.filter(file => file.gameFeature === 'Combat')
      categories[screen.id] = combatFiles.map(file => ({
        id: file.displayName.toLowerCase().replace(/\s+/g, '_'),
        name: file.displayName,
        files: [file.filename],
        count: getItemCountForCategory('Combat', [file.filename])
      }))
    } else {
      // Normal handling: Group by displayName
      const files = CSV_FILE_LIST.filter(file => file.gameFeature === screen.id)
      // ... grouping logic
    }
  })
  
  return categories
})
```

### Data Type Badges

Each sub-tab displays a badge indicating its data type:

```typescript
// Badge determination logic
const getDataTypeForCategory = (files: string[]) => {
  if (files.length === 0) return 'Data'
  
  const fileMetadata = CSV_FILE_LIST.find(f => f.filename === files[0])
  return fileMetadata?.category || 'Data'  // 'Actions' | 'Data' | 'Unlocks'
}

// Badge styling
const getDataTypeBadgeClass = (dataType: 'Actions' | 'Data' | 'Unlocks') => {
  switch (dataType) {
    case 'Actions':
      return 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
    case 'Unlocks':  
      return 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
    case 'Data':
      return 'bg-green-600/20 text-green-300 border border-green-500/30'
    default:
      return 'bg-gray-600/20 text-gray-300 border border-gray-500/30'
  }
}
```

**Visual Implementation:**
```html
<button class="px-3 py-1 text-sm rounded transition-colors flex items-center space-x-2"
        :class="{ 
          'bg-sim-accent text-white border border-blue-400 shadow-sm': currentCategory === category.id,
          'bg-sim-surface hover:bg-slate-800 border border-transparent': currentCategory !== category.id
        }">
  <span>{{ category.name }}</span>
  <span :class="getDataTypeBadgeClass(getDataTypeForCategory(category.files))"
        class="px-1.5 py-0.5 text-xs rounded-full font-medium">
    {{ getDataTypeForCategory(category.files) }}
  </span>
  <span class="text-xs opacity-75">({{ category.count }})</span>
</button>
```

## Modal System Architecture

### EditItemModal.vue (Primary Editor)

**File**: `src/components/GameConfiguration/EditItemModal.vue`

The EditItemModal is the most complex component, handling sophisticated form management with dual data structures for materials.

#### Form Data Management

```typescript
// Core form state
const formData = ref<any>({})         // Current form data
const originalData = ref<any>({})     // Original state for dirty detection
const errors = ref<Record<string, string>>({})

// Key computed properties
const isDirty = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

const canSave = computed(() => {
  return isDirty.value && formData.value.id && formData.value.name && Object.keys(errors.value).length === 0
})
```

#### Critical: Form Initialization Sequence

**The Problem**: Modal showed "unsaved changes" even when nothing was modified.

**The Solution**: Proper initialization sequence to ensure `originalData` matches `formData` structure:

```typescript
const initializeForm = () => {
  if (props.item) {
    formData.value = JSON.parse(JSON.stringify(props.item))
    
    // Ensure prerequisites is an array
    if (!formData.value.prerequisites) {
      formData.value.prerequisites = []
    }
    
    // Convert materials to arrays for UI (CRITICAL: Do this first)
    formData.value.materialsCostArray = materialsCostToArray(formData.value.materialsCost)
    formData.value.materialsGainArray = materialsCostToArray(formData.value.materialsGain)
    
    // CRITICAL: Set originalData AFTER array conversion
    originalData.value = JSON.parse(JSON.stringify(formData.value))
  }
}
```

**Why This Order Matters:**
1. `formData` gets UI-specific arrays (`materialsCostArray`, `materialsGainArray`)
2. `originalData` must match the EXACT same structure
3. If `originalData` lacks these arrays, `isDirty` will always be `true`

### Material Cost/Gain Management System

This is the most sophisticated part of the modal system, handling conversion between different data formats for CSV storage, object manipulation, and UI editing.

#### Data Format Transformations

**1. CSV Format** (Storage):
```csv
materials_cost,materials_gain
"Crystal x2;Silver x5","Iron x3;Wood x10"
```

**2. Object Format** (GameDataItem):
```typescript
interface MaterialCost {
  [materialName: string]: number
}

// Example:
materialsCost: { "Crystal": 2, "Silver": 5 }
materialsGain: { "Iron": 3, "Wood": 10 }
```

**3. Array Format** (UI Editing):
```typescript
// For individual input fields in the modal
materialsCostArray: [
  { name: "Crystal", quantity: 2 },
  { name: "Silver", quantity: 5 }
]
```

#### Conversion Functions

```typescript
// Object → Array (for UI display)
const materialsCostToArray = (materialsCost: any) => {
  if (!materialsCost || typeof materialsCost !== 'object') return []
  return Object.entries(materialsCost).map(([name, quantity]) => ({ 
    name, 
    quantity: Number(quantity) 
  }))
}

// Array → Object (for saving)
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
```

#### Dynamic Material Management

```typescript
// Add new material cost entry
const addMaterialCost = () => {
  if (!formData.value.materialsCostArray) {
    formData.value.materialsCostArray = []
  }
  formData.value.materialsCostArray.push({ name: '', quantity: 1 })
}

// Remove material cost entry  
const removeMaterialCost = (index: number) => {
  if (formData.value.materialsCostArray) {
    formData.value.materialsCostArray.splice(index, 1)
    // Sync with object format
    formData.value.materialsCost = arrayToMaterialsCost(formData.value.materialsCostArray)
  }
}
```

#### UI Implementation

**Individual Material Fields:**
```html
<div v-if="hasField('materialsCost')" class="mt-3">
  <h4 class="form-section-header">
    <i class="fas fa-hammer form-section-icon"></i>
    Materials Cost
  </h4>
  <div class="space-y-2">
    <!-- Dynamic material entries -->
    <div v-for="(material, index) in formData.materialsCostArray" 
         :key="index" 
         class="flex items-center space-x-2">
      <input v-model="material.name"
             type="text"
             placeholder="Material name"
             class="input flex-1" />
      <span class="text-sim-muted">x</span>
      <input v-model.number="material.quantity"
             type="number"
             min="1"
             placeholder="1"
             class="input w-20" />
      <button type="button"
              @click="removeMaterialCost(index)"
              class="text-sim-error hover:text-red-400 px-2 py-2 transition-colors">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <!-- Add new material button -->
    <button type="button"
            @click="addMaterialCost"
            class="text-sim-accent hover:text-blue-400 text-sm transition-colors">
      <i class="fas fa-plus mr-1"></i>
      Add Material Cost
    </button>
  </div>
</div>
```

#### Real-time Synchronization

Deep watchers keep object and array formats synchronized:

```typescript
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
```

#### Save Process

**Data Cleanup Before Saving:**
```typescript
const handleSave = () => {
  if (!validateForm()) return

  // Convert arrays back to objects for storage
  formData.value.materialsCost = arrayToMaterialsCost(formData.value.materialsCostArray)
  formData.value.materialsGain = arrayToMaterialsCost(formData.value.materialsGainArray)

  // Clean up the data
  const cleanData = { ...formData.value }
  
  // Remove UI-specific arrays from saved data
  delete cleanData.materialsCostArray
  delete cleanData.materialsGainArray

  emit('save', cleanData)
}
```

### UX Features

#### Click-Outside-to-Close

```html
<div v-if="show" class="modal-overlay p-4" @click.self="handleCancel">
  <div class="modal max-w-4xl w-full max-h-[90vh] overflow-hidden">
    <!-- Modal content -->
  </div>
</div>
```

**Key Points:**
- `@click.self` ensures only overlay clicks trigger close
- Actual modal content clicks don't bubble up
- Respects dirty state (shows confirmation if unsaved changes)

#### Compact Spacing

User-requested tighter spacing for more information on screen:

```scss
// Reduced gaps throughout modal
.form-section {
  @apply space-y-3;  // Was space-y-4
}

.modal-body {
  @apply space-y-3;  // Tighter vertical rhythm
}

.grid {
  @apply gap-3;      // Reduced from gap-4
}
```

#### Dirty State Management

```typescript
const handleCancel = () => {
  if (isDirty.value) {
    if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      emit('close')
    }
  } else {
    emit('close')
  }
}
```

**Visual Indicator:**
```html
<div class="flex justify-between items-center">
  <div class="text-sm">
    <span v-if="isDirty" class="text-sim-warning">● Unsaved changes</span>
    <span v-else class="text-sim-success">✓ No changes</span>
  </div>
  <!-- Save/Cancel buttons -->
</div>
```

## Data Refresh System

### Force Reload Functionality

**Header Implementation:**
```html
<div class="flex items-center gap-4">
  <button @click="forceReloadData"
          :disabled="gameData.isLoading"
          class="px-3 py-1 text-sm bg-sim-accent text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
    <i class="fas fa-sync mr-1"></i>
    {{ gameData.isLoading ? 'Loading...' : 'Refresh Data' }}
  </button>
  <div class="text-sm text-sim-muted">
    Data Management
    <span v-if="gameData.stats.totalItems > 0" class="ml-2">
      • {{ gameData.stats.totalItems }} items loaded
    </span>
    <span v-if="gameData.lastLoadTime" class="ml-2">
      • Updated {{ formatLastUpdate(gameData.lastLoadTime) }}
    </span>
  </div>
</div>
```

**Implementation:**
```typescript
const forceReloadData = async () => {
  console.log('🔄 Force reloading game data...')
  await gameData.loadGameData()        // 17 unified files
  await gameData.loadSpecializedData() // 10 specialized files
  console.log('✅ Data reload complete:', gameData.stats.totalItems, 'items')
}
```

**Use Cases:**
- User manually edited CSV files  
- Data inconsistencies detected
- Development/testing scenarios
- Recovery from loading errors

## Data Display Components

### DataTable.vue Integration

**Unified vs Specialized Data Handling:**
```html
<DataTable :items="filteredData"
           :title="getTableTitle()"
           :is-specialized="isSpecializedFile"
           :specialized-columns="specializedColumns"
           @edit-item="handleEditItem" />
```

**Dynamic Data Source:**
```typescript
const filteredData = computed(() => {
  const category = currentCategories.value.find(c => c.id === currentCategory.value)
  if (!category) return []
  
  if (isSpecializedFile.value) {
    // Handle specialized files (raw data)
    let items = specializedItems.value
    
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      items = items.filter((item: any) => {
        return Object.values(item).some(value => 
          String(value).toLowerCase().includes(query)
        )
      })
    }
    return items
  }
  
  // Handle unified schema files (GameDataItem[])
  let items = gameData.items.filter(item => {
    return category.files.includes(item.sourceFile)
  })
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      (item.effect && item.effect.toLowerCase().includes(query))
    )
  }
  
  return items
})
```

### Search and Filter System

**Global Search Implementation:**
```html
<div class="flex-1 relative">
  <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-sim-muted text-sm"></i>
  <input v-model="searchQuery" 
         @input="debouncedSearch"
         placeholder="Search across all data..."
         class="w-full pl-10 pr-4 py-2 border border-sim-border rounded-lg bg-sim-surface text-sim-text placeholder-sim-muted focus:outline-none focus:ring-2 focus:ring-sim-accent focus:border-transparent" />
  <button v-if="searchQuery"
          @click="clearSearch"
          class="absolute right-3 top-1/2 transform -translate-y-1/2 text-sim-muted hover:text-slate-200">
    <i class="fas fa-times"></i>
  </button>
</div>
```

**Debounced Search:**
```typescript
let searchTimeout: NodeJS.Timeout | null = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    // Search is handled by filteredData computed
  }, 300)
}
```

## Configuration State Management

### Unsaved Changes Tracking

**Global Change Indicator:**
```html
<div v-if="configStore.hasChanges" 
     class="fixed bottom-4 right-4 bg-yellow-500 text-white p-4 rounded-lg shadow-lg z-50 flex items-center space-x-4">
  <div class="flex items-center space-x-2">
    <i class="fas fa-exclamation-triangle"></i>
    <span class="font-medium">
      {{ configStore.changeCount }} unsaved change{{ configStore.changeCount !== 1 ? 's' : '' }}
    </span>
  </div>
  <div class="flex items-center space-x-2">
    <button @click="resetChanges"
            class="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors text-sm">
      <i class="fas fa-undo mr-1"></i>
      Reset
    </button>
    <button @click="saveChanges"
            class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-sm">
      <i class="fas fa-save mr-1"></i>
      Save
    </button>
  </div>
</div>
```

### Save/Reset Operations

```typescript
const saveChanges = () => {
  try {
    configStore.saveToLocalStorage()
    showToast('Changes saved successfully!', 'success')
  } catch (error) {
    console.error('Failed to save changes:', error)
    showToast('Failed to save changes', 'error')
  }
}

const resetChanges = () => {
  if (confirm('Are you sure you want to reset all changes? This cannot be undone.')) {
    configStore.resetAllChanges()
    showToast('All changes have been reset', 'info')
  }
}
```

## Item Count System

### Dynamic Count Calculation

```typescript
const getItemCountForCategory = (gameFeature: string, files: string[]) => {
  let count = 0
  files.forEach(filename => {
    const fileMetadata = CSV_FILE_LIST.find(f => f.filename === filename)
    if (!fileMetadata) return
    
    if (!fileMetadata.hasUnifiedSchema) {
      // Specialized files: get row count from store
      count += gameData.getSpecializedRowCount(filename)
    } else {
      // Unified files: count GameDataItems
      const items = gameData.itemsByGameFeature[gameFeature] || []
      count += items.filter(item => item.sourceFile === filename).length
    }
  })
  return count
}
```

**Display Integration:**
```html
<span class="text-xs opacity-75">({{ category.count }})</span>
```

## Dark Theme Integration

### Color System Usage

**Navigation Elements:**
```scss
// Main tabs
.bg-blue-500.text-white.border-2.border-blue-600.shadow-md  // Active state
.bg-sim-surface.hover:bg-slate-800.border-2.border-transparent  // Inactive state

// Sub-tabs  
.bg-sim-accent.text-white.border.border-blue-400.shadow-sm  // Active state
.bg-sim-surface.hover:bg-slate-800.border.border-transparent  // Inactive state
```

**Modal Styling:**
```scss
// Modal overlay
.fixed.inset-0.bg-black/50.flex.items-center.justify-center.z-50

// Modal content
.bg-sim-surface.rounded-lg.shadow-xl.border.border-sim-border
```

**Form Elements:**
```scss
// Input fields
.border.border-sim-border.rounded-lg.bg-sim-bg.text-sim-text
.focus:outline-none.focus:ring-2.focus:ring-sim-accent.focus:border-transparent

// Buttons
.bg-sim-accent.text-white.rounded.hover:bg-blue-600  // Primary
.bg-sim-surface.text-sim-text.border.border-sim-border.hover:bg-slate-700  // Secondary
```

## Error Handling

### Loading State Management

```html
<!-- Loading State -->
<div v-if="gameData.isLoading" class="card">
  <div class="card-body">
    <div class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-4xl text-sim-accent mb-4"></i>
      <p>Loading game data...</p>
      <div v-if="gameData.loadProgress" class="mt-2 max-w-md mx-auto">
        <div class="text-sm text-sim-muted mb-2">{{ gameData.loadProgress.currentFile }}</div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-sim-accent h-2 rounded-full transition-all duration-300"
               :style="{ width: `${(gameData.loadProgress.loaded / gameData.loadProgress.total) * 100}%` }">
          </div>
        </div>
        <div class="text-sm text-sim-muted mt-1">
          {{ gameData.loadProgress.loaded }} / {{ gameData.loadProgress.total }} files
        </div>
      </div>
    </div>
  </div>
</div>
```

### Validation Integration

Modal validation is integrated with the global validation system:

```typescript
// Form-level validation
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
```

## Common Tasks

### Adding New Tab

1. **Update gameScreens array:**
```typescript
{ id: 'NewFeature', name: 'New Feature', icon: 'fas fa-new-icon' }
```

2. **Create CSV files** with `gameFeature: 'NewFeature'`

3. **Auto-detection**: Categories will be generated automatically

### Adding New Form Fields

1. **Add to hasField logic:**
```typescript
const hasNewFields = computed(() => {
  return hasField('newField1') || hasField('newField2')
})
```

2. **Add form section:**
```html
<div v-if="hasNewFields" class="form-section">
  <h3 class="form-section-header">New Fields</h3>
  <!-- Field inputs -->
</div>
```

### Debugging Modal Issues

**Dirty State Problems:**
1. Check `initializeForm()` order
2. Verify `originalData` structure matches `formData`
3. Ensure UI arrays are populated before `originalData` assignment

**Material Handling Issues:**
1. Verify conversion functions work both directions
2. Check deep watchers are triggering
3. Ensure save process removes UI arrays

### Adding Validation Rules

In modal validation:
```typescript
// Custom validation in validateForm()
if (formData.value.customField && !isValidCustomValue(formData.value.customField)) {
  errors.value.customField = 'Custom validation message'
}
```

## Performance Considerations

### Computed Property Optimization

```typescript
// Efficient: Only recalculates when dependencies change
const currentCategories = computed(() => {
  const categories = screenCategories.value[currentScreen.value] || []
  return categories
})
```

### Modal Lazy Loading

Modals only initialize when opened:
```typescript
watch(() => props.show, (newShow) => {
  if (newShow) {
    initializeForm()
    // Focus management, etc.
  }
})
```

### Search Performance

Debounced search prevents excessive filtering:
```typescript
// 300ms delay prevents search on every keystroke
setTimeout(() => {
  // filteredData computed handles the actual filtering
}, 300)
```

The Configuration system provides a comprehensive, user-friendly interface for managing all game data while maintaining data integrity through sophisticate