# Data Architecture Reference - TimeHero Sim

## Overview

The TimeHero Sim data architecture is built around a dual-schema approach that handles both unified game data and specialized configuration files. This design allows for consistent item management across game features while supporting unique data structures for specific subsystems.

## Architecture Summary

```
TimeHero Sim Data Architecture
├── CSV File System
│   ├── Unified Schema Files (17 files) → GameDataItem interface
│   └── Specialized Schema Files (10 files) → Custom interfaces
├── Loading Pipeline
│   ├── loadAllCSVFiles() → Unified items
│   └── loadAllSpecializedCSVFiles() → Custom data
├── Data Store (Pinia)
│   ├── gameData.ts → Main game items + validation
│   └── configuration.ts → User modifications
└── Validation System
    ├── Prerequisites validation
    ├── Data consistency checks
    └── Circular dependency detection
```

## File Structure

### Physical File Organization

All CSV files are stored in:
```
/public/Data/
├── Actions/        (6 files)
├── Data/           (12 files)  
└── Unlocks/        (6 files)
```

### Logical File Classification

**Total Files: 27**
- **Unified Schema**: 17 files (contribute to GameDataItem loading)
- **Specialized Schema**: 10 files (custom data structures)

## CSV File Types

### 1. Unified Schema Files (17 files)

These files conform to the standardized `CSVGameDataRow` interface and are processed into `GameDataItem` objects:

```typescript
// Unified files are loaded by loadAllCSVFiles()
export const UNIFIED_SCHEMA_FILES = CSV_FILE_LIST.filter(file => file.hasUnifiedSchema)
```

**Examples:**
- `crops.csv` - Farm crop definitions
- `forge_actions.csv` - Blacksmith crafting actions  
- `weapons.csv` - Combat weapon statistics
- `town_blacksmith.csv` - Building unlock definitions

**Key Properties:**
- All have `hasUnifiedSchema: true` 
- Follow standardized column structure
- Processed through `processCSVRow()` function
- Support materials parsing (`"Crystal x2;Silver x5"`)
- Include prerequisite chains

### 2. Specialized Schema Files (10 files)

These files have unique structures for specific game systems:

**Examples:**
- `boss_materials.csv` - Boss loot tables
- `xp_progression.csv` - Level progression curves
- `armor_effects.csv` - Equipment effect definitions
- `phase_transitions.csv` - Game progression rules

**Key Properties:**
- Have `hasUnifiedSchema: false`
- Custom column structures per file
- Loaded via `loadAllSpecializedCSVFiles()`
- Stored in `specializedData` object
- Raw data preserved for specialized UI components

## Core Interfaces

### CSVGameDataRow (Raw CSV Structure)

```typescript
export interface CSVGameDataRow {
  id: string
  name: string
  prerequisite: string                    // Semicolon-separated
  type: string
  categories: string                      // Semicolon-separated
  gold_cost: string
  gold_gain: string
  energy_cost: string
  time: string
  materials_cost: string                  // "Material x5;Material2 x10"
  materials_gain: string                  // Same format
  level: string
  effect: string
  // ... 30+ additional fields
  repeatable: string                      // "TRUE" or "FALSE"
  notes: string
}
```

### GameDataItem (Processed Structure)

```typescript
export interface GameDataItem {
  id: string
  name: string
  prerequisites: string[]                 // Parsed array
  type: string
  categories: string[]                    // Parsed array
  
  // Costs and gains (parsed numbers)
  goldCost?: number
  goldGain?: number
  energyCost?: number
  time?: number
  materialsCost?: MaterialCost            // Object: {materialName: quantity}
  materialsGain?: MaterialCost
  
  // Properties
  level?: number
  effect?: string
  
  // ... specialized fields for different item types
  
  // Metadata
  sourceFile: string                      // Which CSV file
  category: 'Actions' | 'Data' | 'Unlocks'
}
```

### MaterialCost Structure

```typescript
export interface MaterialCost {
  [materialName: string]: number
}

// Example transformation:
// CSV: "Crystal x2;Silver x5;Cave Crystal x2"
// Object: { "Crystal": 2, "Silver": 5, "Cave Crystal": 2 }
```

## Data Loading Pipeline

### 1. Unified Schema Loading

```typescript
// src/utils/csvLoader.ts - loadAllCSVFiles()
const unifiedSchemaFiles = CSV_FILE_LIST.filter(file => file.hasUnifiedSchema)
const totalFiles = unifiedSchemaFiles.length // 17 files

for (const fileMetadata of unifiedSchemaFiles) {
  const result = await loadCSVFile(fileMetadata)
  // Process through processCSVRow() → GameDataItem
}
```

**Processing Steps:**
1. **Fetch** CSV file from `/TimeHeroSim2/Data/{category}/{filename}`
2. **Parse** with PapaParse (header: true, skipEmptyLines: true)
3. **Transform** each row through `processCSVRow()`
4. **Type conversion**:
   - Numbers: `parseNumber()` with fallback to undefined
   - Booleans: `parseBoolean()` for "TRUE"/"FALSE" strings
   - Materials: `parseMaterials()` for "Material x5" format
   - Prerequisites: `parsePrerequisites()` for semicolon separation

### 2. Specialized Schema Loading

```typescript
// src/utils/csvLoader.ts - loadAllSpecializedCSVFiles()
const specializedFiles = CSV_FILE_LIST.filter(file => !file.hasUnifiedSchema)

for (const fileMetadata of specializedFiles) {
  // Raw parsing only - no GameDataItem transformation
  const parseResult = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim()
  })
}
```

**Key Differences:**
- No type transformation (preserves raw strings)
- No GameDataItem structure enforcement
- Stored separately in `specializedData` object
- Direct access via filename key

## Data Store Architecture

### gameData Store (Primary)

**File**: `src/stores/gameData.ts`

```typescript
// State Management
const items = ref<GameDataItem[]>([])              // Unified schema items
const specializedData = ref<Record<string, Record<string, any>[]>>({})
const validationIssues = ref<ValidationIssue[]>([])
const isLoading = ref(false)

// Computed Getters  
const stats = computed(() => ({
  totalItems: items.value.length,
  itemsByFile: { /* file counts */ },
  itemsByCategory: { /* category counts */ }
}))

const itemsByGameFeature = computed(() => {
  // Groups items by 'Farm', 'Tower', 'Combat', etc.
})
```

**Key Methods:**
- `loadGameData()` - Loads 17 unified files → GameDataItem[]
- `loadSpecializedData()` - Loads 10 specialized files → Raw objects
- `validateData()` - Runs prerequisite/consistency checks
- `getItemById()` - Fast lookup by item ID

### configuration Store (Modifications)

**File**: `src/stores/configuration.ts`

Tracks user modifications to base game data:
- Field-level change tracking
- Dirty state management  
- LocalStorage persistence
- Rollback capability

## Validation System

### Validation Types

```typescript
export interface ValidationIssue {
  id: string
  level: 'error' | 'warning' | 'info'
  message: string
  itemId?: string
  sourceFile?: string
}
```

### 1. Prerequisite Validation

```typescript
// Check missing prerequisites
items.value.forEach(item => {
  item.prerequisites.forEach(prereqId => {
    if (!itemIds.has(prereqId)) {
      issues.push({
        level: 'error',
        message: `Item ${item.name} (${item.id}) has missing prerequisite: ${prereqId}`,
        sourceFile: item.sourceFile
      })
    }
  })
})
```

### 2. Circular Dependency Detection

Recursive algorithm to detect prerequisite cycles:
```typescript
const checkCircularDeps = (itemId: string, visited: Set<string>, path: string[])
// Detects: A → B → C → A patterns
```

### 3. Data Consistency Checks

- **Level ranges**: 1-20 validation
- **Negative values**: Cost/energy validation  
- **Duplicate IDs**: Cross-file uniqueness
- **File integrity**: Expected vs actual file counts

## Material System Architecture

### CSV Format
```csv
materials_cost,materials_gain
"Crystal x2;Silver x5","Iron x3"
```

### Processing Pipeline

1. **CSV → Raw String**: `"Crystal x2;Silver x5"`
2. **Parse → Object**: `{ "Crystal": 2, "Silver": 5 }`
3. **UI → Array**: `[{name: "Crystal", quantity: 2}, {name: "Silver", quantity: 5}]`
4. **Save → Object**: Back to step 2 format

### UI Management (EditItemModal)

```typescript
// Dual data structures for editing
const materialsCostToArray = (materialsCost) => {
  return Object.entries(materialsCost).map(([name, quantity]) => ({ name, quantity }))
}

const arrayToMaterialsCost = (arr) => {
  const result = {}
  arr.forEach(item => {
    if (item.name && item.quantity > 0) {
      result[item.name] = item.quantity
    }
  })
  return result
}
```

## File Count Logic

### Expected Counts

**Dashboard Health Widget Logic:**
```typescript
// Total: 27 files
// Unified: 17 files (counted in "Item Files")  
// Specialized: 10 files (counted in "Config Files")

const expectedFileCount = UNIFIED_SCHEMA_FILES.length // 17
const totalSpecializedFiles = CSV_FILE_LIST.filter(file => !file.hasUnifiedSchema).length // 10
```

### Health Scoring

```typescript
const unifiedSchemaScore = computed(() => {
  const loadedFiles = Object.keys(gameData.stats.itemsByFile).length
  let score = (loadedFiles / expectedFileCount) * 100
  
  // Deduct for validation issues
  const errorPenalty = errorCount.value * 5    // 5 points per error
  const warningPenalty = warningCount.value * 1 // 1 point per warning
  score = Math.max(0, score - errorPenalty - warningPenalty)
})

const overallHealth = computed(() => {
  // Weighted: unified schemas 70%, specialized 30%
  return (unifiedSchemaScore.value * 0.7) + (specializedSchemaScore.value * 0.3)
})
```

## Error Handling Patterns

### Loading Errors

```typescript
// File-level errors
return {
  success: false,
  data: [],
  errors: [`Failed to fetch ${filename}: ${response.statusText}`],
  filename
}

// Row-level errors  
errors.push(`Error processing row ${i + 1} in ${filename}: ${error.message}`)
```

### Validation Errors

All validation issues are collected and displayed in the Dashboard:
- **Color coding**: Red (error), Amber (warning), Blue (info)
- **Detailed display**: Message, source file, affected item
- **Console logging**: Structured error output

## Performance Considerations

### Memory Management

```typescript
export function calculateDataMemoryUsage(items: GameDataItem[]): number {
  const jsonStr = JSON.stringify(items)
  return jsonStr.length * 2 // UTF-16 bytes estimate
}
```

### Loading Strategy

- **Sequential loading**: Prevents browser overwhelming
- **Progress tracking**: User feedback during long loads
- **Separation of concerns**: Unified vs specialized loading
- **Error isolation**: Failed files don't block others

## Integration Points

### With Dashboard

- **File count validation**: 17/17 unified files expected
- **Health scoring**: Weighted validation system
- **Debug display**: File-by-file breakdown

### With Configuration

- **Tab system**: Maps to `gameFeature` property
- **Modal editing**: Material array ↔ object conversion
- **Data type badges**: Based on file `category` property

### With Validation

- **Real-time checks**: On data load completion
- **User feedback**: Dashboard health display
- **Error details**: Expandable validation issue list

## Common Tasks

### Adding New CSV File

1. **Add to CSV_FILE_LIST** in `src/types/csv-data.ts`:
```typescript
{ 
  filename: 'new_file.csv', 
  category: 'Data', 
  gameFeature: 'Farm', 
  displayName: 'New Data', 
  description: 'New data type',
  hasUnifiedSchema: true  // or false for custom schema
}
```

2. **Place file** in `/public/Data/{category}/new_file.csv`
3. **Reload data** - automatic detection and loading

### Debugging File Count Issues

Check Dashboard debug section for:
- **Expected files**: List of unified schema files
- **Actually loaded**: Files found in itemsByFile
- **Extra files**: Highlighted in red with "← EXTRA FILE"
- **Missing files**: Listed separately if any

### Adding Validation Rules

In `gameData.ts` `validateData()` method:
```typescript
// Add custom validation
items.value.forEach(item => {
  if (customCondition(item)) {
    issues.push({
      id: `custom-rule-${item.id}`,
      level: 'warning',
      message: `Custom validation failed for ${item.name}`,
      itemId: item.id,
      sourceFile: item.sourceFile
    })
  }
})
```

## Troubleshooting

### File Count Mismatch

**Symptom**: Dashboard shows "18/17" instead of "17/17"

**Cause**: A specialized file is being loaded as unified

**Fix**: Check file's `hasUnifiedSchema` property in CSV_FILE_LIST

### Validation Errors Not Displaying

**Symptom**: Console shows errors but Dashboard doesn't

**Check**: 
1. `validationIssues` array population
2. Dashboard validation display component
3. Issue level filtering (error/warning/info)

### Material Parsing Failures

**Symptom**: Materials not displaying in modals

**Check**:
1. CSV format: `"Material x5;Material2 x10"`
2. Parse function: `parseMaterials()` in csvLoader
3. Modal array conversion: `materialsCostToArray()`

This architecture provides a robust, scalable foundation for managing TimeHero Sim's complex game data while maintaining performance and data integrity.

