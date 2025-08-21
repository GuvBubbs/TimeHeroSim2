# Dashboard As-Built Documentation - TimeHero Sim

## Overview

The TimeHero Sim Dashboard serves as the central monitoring and control hub for the application's data health, system status, and quick actions. Built with Vue 3 Composition API and integrated with Pinia stores, it provides real-time insights into data loading, validation, and system performance.

## Component Architecture

```
DashboardView.vue
├── System Status Card
│   ├── Loading state with progress tracking
│   ├── Data statistics display
│   └── Error state handling
├── Quick Actions Card
│   ├── Data reload functionality
│   ├── Manual validation trigger
│   └── Configuration state display
├── Data Health Card ⭐ (Primary widget)
│   ├── Validation issues summary
│   ├── File count monitoring (17 unified + 10 specialized)
│   ├── Health scoring algorithm
│   └── Debug/troubleshooting tools
└── Recent Simulations Card
    └── Placeholder for Phase 5 implementation
```

**File Location**: `src/views/DashboardView.vue`

## Data Health Widget (Detailed)

### Architecture

The Data Health Widget is the core monitoring component with sophisticated file tracking and validation display capabilities.

### Key Computed Properties

```typescript
// File counting system
const expectedFileCount = UNIFIED_SCHEMA_FILES.length // 17
const totalSpecializedFiles = specializedSchemaFiles.length // 10

// Validation tracking
const totalIssues = computed(() => gameData.validationIssues.length)
const errorCount = computed(() => 
  gameData.validationIssues.filter(issue => issue.level === 'error').length
)
const warningCount = computed(() => 
  gameData.validationIssues.filter(issue => issue.level === 'warning').length
)
```

### Health Scoring Algorithm

**Unified Schema Score (70% weight):**
```typescript
const unifiedSchemaScore = computed(() => {
  if (gameData.stats.totalItems === 0) return 0
  
  const loadedFiles = Object.keys(gameData.stats.itemsByFile).length
  let score = (loadedFiles / expectedFileCount) * 100
  
  // Deduct for validation issues
  const errorPenalty = errorCount.value * 5 // 5 points per error
  const warningPenalty = warningCount.value * 1 // 1 point per warning
  score = Math.max(0, score - errorPenalty - warningPenalty)
  
  return score
})
```

**Specialized Schema Score (30% weight):**
```typescript
const specializedSchemaScore = computed(() => {
  // Specialized files are always healthy if they exist
  return (specializedFilesCount.value / totalSpecializedFiles) * 100
})
```

**Overall Health Score:**
```typescript
const overallHealth = computed(() => {
  const unifiedWeight = 0.7
  const specializedWeight = 0.3
  
  return (unifiedSchemaScore.value * unifiedWeight) + 
         (specializedSchemaScore.value * specializedWeight)
})
```

### File Count Monitoring System

#### Expected vs Actual File Tracking

The system monitors file loading with precise expectations:

```typescript
// Debug helpers for file count mismatch
const expectedUnifiedFiles = computed(() => {
  return UNIFIED_SCHEMA_FILES.map(file => file.filename).sort()
})

const missingFiles = computed(() => {
  const actualFiles = Object.keys(gameData.stats.itemsByFile)
  return expectedUnifiedFiles.value.filter(file => !actualFiles.includes(file))
})
```

#### Debug Display System

When file counts don't match expectations, an expandable debug section appears:

```html
<!-- Debug info for file counting -->
<div v-if="Object.keys(gameData.stats.itemsByFile).length !== expectedFileCount" 
     class="text-xs text-sim-error mt-1">
  <details>
    <summary>File count mismatch (click to debug)</summary>
    <div class="mt-1 text-xs">
      <!-- Expected unified schema files -->
      <div class="mt-2">
        <p class="font-medium">Expected unified schema files:</p>
        <ul class="ml-2 text-green-400">
          <li v-for="expectedFile in expectedUnifiedFiles" :key="expectedFile">
            {{ expectedFile }}
          </li>
        </ul>
      </div>

      <!-- Actually loaded files -->
      <div class="mt-2">
        <p class="font-medium">Actually loaded files:</p>
        <ul class="ml-2">
          <li v-for="file in Object.keys(gameData.stats.itemsByFile)" 
              :key="file"
              :class="{
                'text-green-400': expectedUnifiedFiles.includes(file),
                'text-red-400 font-bold': !expectedUnifiedFiles.includes(file)
              }">
            {{ file }} 
            <span v-if="!expectedUnifiedFiles.includes(file)" 
                  class="text-red-300">← EXTRA FILE</span>
          </li>
        </ul>
      </div>

      <!-- Missing files if any -->
      <div v-if="missingFiles.length > 0" class="mt-2">
        <p class="font-medium text-red-400">Missing files:</p>
        <ul class="ml-2 text-red-400">
          <li v-for="missingFile in missingFiles" :key="missingFile">
            {{ missingFile }}
          </li>
        </ul>
      </div>
    </div>
  </details>
</div>
```

**Color Coding System:**
- 🟢 **Green files**: Expected and loaded correctly
- 🔴 **Red files**: Extra files that shouldn't be counted
- 🔴 **Missing files**: Expected files that failed to load

### Validation Issues Display

#### Summary Indicators

```typescript
// Validation issue color coding
:class="{
  'text-sim-success': totalIssues === 0,
  'text-sim-warning': totalIssues > 0 && errorCount === 0,
  'text-sim-error': errorCount > 0
}"
```

#### Detailed Issue Display

Expandable details section showing all validation issues:

```html
<div v-if="totalIssues > 0" class="mt-2 text-xs">
  <details>
    <summary class="cursor-pointer text-sim-muted hover:text-sim-text">
      View {{ totalIssues }} validation issue(s)
    </summary>
    <div class="mt-2 space-y-1">
      <div v-for="issue in gameData.validationIssues" 
           :key="issue.id"
           class="p-2 rounded text-xs"
           :class="{
             'bg-red-800/20 text-red-300 border border-red-600/30': issue.level === 'error',
             'bg-amber-800/20 text-amber-300 border border-amber-600/30': issue.level === 'warning',
             'bg-blue-800/20 text-blue-300 border border-blue-600/30': issue.level === 'info'
           }">
        <div class="font-medium">{{ issue.level.toUpperCase() }}</div>
        <div>{{ issue.message }}</div>
        <div v-if="issue.sourceFile" class="text-xs opacity-75 mt-1">
          File: {{ issue.sourceFile }}
        </div>
      </div>
    </div>
  </details>
</div>
```

**Issue Level Color Coding:**
- 🔴 **Error**: Critical issues requiring immediate attention
- 🟠 **Warning**: Important issues that should be addressed  
- 🔵 **Info**: Informational notices

### Progress Bar System

Dynamic progress bars with color-coded health states:

```html
<!-- Unified Schema Progress Bar -->
<div class="w-full bg-gray-200 rounded-full h-2">
  <div class="h-2 rounded-full transition-all duration-300"
       :class="{
         'bg-sim-success': unifiedSchemaScore >= 90,
         'bg-sim-warning': unifiedSchemaScore >= 70 && unifiedSchemaScore < 90,
         'bg-sim-error': unifiedSchemaScore < 70
       }"
       :style="{ width: `${unifiedSchemaScore}%` }">
  </div>
</div>

<!-- Specialized Schema Progress Bar -->
<div class="w-full bg-gray-200 rounded-full h-2">
  <div class="h-2 rounded-full transition-all duration-300"
       :class="{
         'bg-sim-accent': specializedSchemaScore >= 90,
         'bg-orange-400': specializedSchemaScore >= 70 && specializedSchemaScore < 90,
         'bg-sim-error': specializedSchemaScore < 70
       }"
       :style="{ width: `${specializedSchemaScore}%` }">
  </div>
</div>
```

**Health Thresholds:**
- **90-100%**: 🟢 Green (Healthy)
- **70-89%**: 🟠 Orange/Yellow (Warning)
- **0-69%**: 🔴 Red (Critical)

## System Status Card

### Loading States

**During Data Loading:**
```html
<div v-if="gameData.isLoading" class="text-center py-8">
  <i class="fas fa-spinner fa-spin text-4xl text-sim-accent mb-2"></i>
  <p class="text-sim-muted">Loading game data...</p>
  
  <!-- Progress tracking -->
  <div v-if="gameData.loadProgress" class="mt-2">
    <div class="text-xs text-sim-muted">{{ gameData.loadProgress.currentFile }}</div>
    <div class="w-full bg-gray-200 rounded-full h-1 mt-1">
      <div class="bg-sim-accent h-1 rounded-full transition-all duration-300"
           :style="{ width: `${(gameData.loadProgress.loaded / gameData.loadProgress.total) * 100}%` }">
      </div>
    </div>
    <div class="text-xs text-sim-muted mt-1">
      {{ gameData.loadProgress.loaded }} / {{ gameData.loadProgress.total }} files
    </div>
  </div>
</div>
```

**Loaded State Statistics:**
```html
<div v-else-if="gameData.stats.totalItems > 0" class="py-4">
  <div class="grid grid-cols-2 gap-4">
    <div class="text-center">
      <div class="text-2xl font-bold text-sim-success">{{ gameData.stats.totalItems }}</div>
      <div class="text-xs text-sim-muted">Items Loaded</div>
    </div>
    <div class="text-center">
      <div class="text-2xl font-bold text-sim-accent">{{ Object.keys(gameData.stats.itemsByFile).length }}</div>
      <div class="text-xs text-sim-muted">Item Files</div>
    </div>
    <div class="text-center">
      <div class="text-sm font-bold text-sim-accent">{{ formatBytes(gameData.stats.memoryUsage) }}</div>
      <div class="text-xs text-sim-muted">Memory</div>
    </div>
    <div class="text-center">
      <div class="text-sm font-bold">{{ Object.keys(gameData.stats.itemsByCategory).length }}</div>
      <div class="text-xs text-sim-muted">Categories</div>
    </div>
  </div>
</div>
```

## Quick Actions Card

### Data Management Actions

```html
<div class="space-y-2">
  <!-- Reload Data Button -->
  <button @click="loadData"
          :disabled="gameData.isLoading"
          class="w-full px-3 py-2 bg-sim-accent text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
    <i class="fas fa-sync mr-2"></i>
    {{ gameData.isLoading ? 'Loading...' : 'Reload Data' }}
  </button>
  
  <!-- Manual Validation Button -->
  <button @click="validateData"
          :disabled="gameData.isLoading || gameData.stats.totalItems === 0"
          class="w-full px-3 py-2 bg-sim-accent text-white rounded hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
    <i class="fas fa-check mr-2"></i>
    Validate Data
  </button>
</div>
```

### Configuration State Display

```html
<div class="pt-2 text-xs text-sim-muted">
  <div v-if="configStore.hasChanges">
    <i class="fas fa-edit mr-1"></i>
    {{ configStore.changeCount }} changes pending
  </div>
  <div v-else>
    <i class="fas fa-check mr-1"></i>
    Configuration clean
  </div>
</div>
```

## Store Integration

### gameData Store Dependencies

```typescript
import { useGameDataStore } from '@/stores/gameData'
import { useConfigurationStore } from '@/stores/configuration'

const gameData = useGameDataStore()
const configStore = useConfigurationStore()
```

**Key Store Properties Used:**
- `gameData.stats` - File counts, memory usage, totals
- `gameData.validationIssues` - All validation problems
- `gameData.isLoading` - Loading state
- `gameData.loadProgress` - Progress tracking
- `gameData.lastLoadTime` - Data freshness tracking

### Data Loading Methods

```typescript
const loadData = async () => {
  await gameData.loadGameData()    // 17 unified files
  await gameData.loadSpecializedData()  // 10 specialized files
}

const validateData = async () => {
  await gameData.validateData()    // Run all validation checks
}
```

## Utility Functions

### Time Formatting

```typescript
const formatLastUpdate = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}
```

### Memory Formatting

```typescript
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
```

## Lifecycle Management

```typescript
onMounted(() => {
  // Auto-load data if not already loaded
  if (gameData.stats.totalItems === 0 && !gameData.isLoading) {
    loadData()
  }
  
  // Load saved configuration
  configStore.loadFromLocalStorage()
})
```

## Dark Theme Integration

### Color System Usage

**Status Colors:**
- `text-sim-success` - Green for healthy states
- `text-sim-warning` - Yellow/orange for warnings  
- `text-sim-error` - Red for critical issues
- `text-sim-accent` - Blue for primary actions
- `text-sim-muted` - Gray for secondary information

**Interactive Elements:**
- `bg-sim-accent hover:bg-blue-600` - Primary buttons
- `hover:text-sim-text` - Subtle hover effects
- `bg-sim-surface` - Card backgrounds
- `border-sim-border` - Card borders

## Error Handling

### Loading Error Display

```html
<div v-else-if="gameData.loadErrors.length > 0" class="text-center py-8">
  <i class="fas fa-exclamation-triangle text-4xl text-sim-warning mb-2"></i>
  <p class="text-sim-muted">Data loading issues</p>
  <p class="text-xs mt-2 text-sim-error">{{ gameData.loadErrors.length }} errors</p>
</div>
```

### Comprehensive Error Details

Full error display with context:

```html
<div v-if="gameData.loadErrors.length > 0" class="card border-sim-error">
  <div class="card-header text-sim-error">
    <i class="fas fa-exclamation-triangle mr-2"></i>
    Loading Errors
  </div>
  <div class="card-body">
    <div class="space-y-2 max-h-40 overflow-y-auto">
      <div v-for="(error, index) in gameData.loadErrors" 
           :key="index"
           class="text-sm text-sim-error bg-sim-error bg-opacity-10 p-2 rounded">
        {{ error }}
      </div>
    </div>
  </div>
</div>
```

## Common Tasks

### Adding New Health Metrics

1. **Add computed property** in DashboardView:
```typescript
const customMetric = computed(() => {
  // Calculate your metric from gameData
  return calculatedValue
})
```

2. **Add display section** in template:
```html
<div class="flex justify-between items-center text-sm">
  <span class="text-sim-muted">Custom Metric</span>
  <span class="font-bold">{{ customMetric }}</span>
</div>
```

### Debugging File Count Issues

1. **Check Console Output**:
   - Look for "✅ Loaded X items from Y/Z files"
   - Check for file loading errors

2. **Use Dashboard Debug Section**:
   - Click "File count mismatch (click to debug)"
   - Review expected vs actual files
   - Look for red "← EXTRA FILE" markers

3. **Verify CSV_FILE_LIST**:
   - Check `hasUnifiedSchema` property
   - Ensure file exists in correct directory
   - Verify category/gameFeature mapping

### Customizing Health Thresholds

Modify the computed properties for different health ranges:

```typescript
const unifiedSchemaScore = computed(() => {
  // Adjust penalty values
  const errorPenalty = errorCount.value * 10  // Increase penalty
  const warningPenalty = warningCount.value * 2
  
  // Custom threshold logic
})
```

## Performance Considerations

### Computed Property Efficiency

All dashboard metrics use Vue's computed properties for automatic reactivity without manual watchers:

```typescript
// Efficient: Only recalculates when gameData.validationIssues changes
const errorCount = computed(() => 
  gameData.validationIssues.filter(issue => issue.level === 'error').length
)
```

### Memory Monitoring

The dashboard tracks memory usage via `calculateDataMemoryUsage()`:
- JSON stringification for size estimation
- UTF-16 byte calculation (characters × 2)
- Real-time updates on data changes

### Async Operation Handling

Loading and validation operations are properly async:
```typescript
const loadData = async () => {
  // Prevents multiple simultaneous loads
  // Provides user feedback during operations
  // Handles errors gracefully
}
```

## Troubleshooting Guide

### Issue: Health Widget Shows Wrong File Count

**Symptoms**: Shows "18/17" instead of "17/17"
**Cause**: Specialized file incorrectly marked as unified
**Solution**: Check CSV_FILE_LIST for `hasUnifiedSchema: false`

### Issue: Validation Errors Not Displaying

**Symptoms**: Console logs errors but Dashboard doesn't show them
**Check**: 
1. `gameData.validationIssues` array population
2. Issue level filtering in template
3. Expandable details section functionality

### Issue: Progress Bars Stuck

**Symptoms**: Health bars don't update after data reload
**Solution**: Verify computed property dependencies on gameData reactive state

### Issue: Memory Usage Seems Wrong

**Symptoms**: Memory display shows unexpected values
**Check**:
1. `calculateDataMemoryUsage()` function
2. Items array size in gameData store
3. JSON stringification edge cases

The Dashboard serves as the system's nerve center, providing comprehensive monitoring and quick access to essential data management functions while maintaining excellent performance and user experience.

