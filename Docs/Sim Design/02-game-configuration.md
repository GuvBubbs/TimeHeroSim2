# Time Hero Simulator - Game Configuration
## Document 2: Data Management & Editor

### Purpose & Goals
The Game Configuration page is the **data control center** for the Time Hero Simulator, providing comprehensive access to all game balance values stored in CSV files. It enables developers to view, edit, validate, and experiment with game parameters without modifying source files, serving as both a reference tool and a balance testing workspace.

### Integration with Simulator Goals
- **Data Transparency**: Full visibility into all game systems and values
- **Rapid Iteration**: Modify values and immediately test impact
- **Version Control**: Track changes and compare configurations
- **Validation Safety**: Prevent invalid data from breaking simulations
- **Bulk Operations**: Efficiently adjust related values together

### Data Architecture

#### CSV File Organization
```typescript
interface CSVCategory {
  screen: 'Farm' | 'Tower' | 'Town' | 'Adventure' | 'Forge' | 'Mine' | 'General';
  files: CSVFile[];
}

interface CSVFile {
  id: string;
  name: string;
  path: string;
  rowCount: number;
  columns: ColumnSchema[];
  lastModified: Date;
  hasChanges: boolean;
  validationStatus: 'valid' | 'warning' | 'error';
}

interface ColumnSchema {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'reference';
  required: boolean;
  unique?: boolean;
  foreignKey?: { file: string; column: string; };
  validation?: (value: any) => boolean;
}
```

### Layout Structure

#### Two-Tier Tab System
```
┌─────────────────────────────────────────────────────────────┐
│                    Configuration Header                     │
├─────────────────────────────────────────────────────────────┤
│ [Farm] [Tower] [Town] [Adventure] [Forge] [Mine] [General] │ ← Primary Tabs
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐│
│ │[Crops][Stages][Cleanups][Projects][Water]    [Search]  ││ ← Secondary Tabs
│ └─────────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────────┐│
│ │                    Data Table Editor                    ││
│ │  ┌──┬─────────┬──────────┬──────────┬───────────────┐  ││
│ │  │ID│  Name   │ Energy   │ Time     │ Prerequisites │  ││
│ │  ├──┼─────────┼──────────┼──────────┼───────────────┤  ││
│ │  │1 │ Carrot  │    1     │   6m     │     none      │  ││
│ │  │2 │ Potato  │    2     │   8m     │     none      │  ││
│ │  └──┴─────────┴──────────┴──────────┴───────────────┘  ││
│ └─────────────────────────────────────────────────────────┘│
│ [Add Row] [Delete Selected] [Import CSV] [Export] [Reset]  │
└─────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### 1. Primary Navigation Tabs
```typescript
const screenTabs = [
  { id: 'farm', label: 'Farm', icon: 'fa-seedling', fileCount: 5 },
  { id: 'tower', label: 'Tower', icon: 'fa-tower-broadcast', fileCount: 3 },
  { id: 'town', label: 'Town', icon: 'fa-store', fileCount: 12 },
  { id: 'adventure', label: 'Adventure', icon: 'fa-sword', fileCount: 4 },
  { id: 'forge', label: 'Forge', icon: 'fa-hammer', fileCount: 6 },
  { id: 'mine', label: 'Mine', icon: 'fa-gem', fileCount: 2 },
  { id: 'general', label: 'General', icon: 'fa-cog', fileCount: 3 },
];
```

**Visual Design**:
- Dark tab bar with screen icons
- Active tab highlighted with indigo-500
- Badge showing file count per screen
- Smooth slide transition between tabs

#### 2. Secondary File Tabs
```typescript
interface FileTab {
  id: string;
  label: string;
  file: string;
  rowCount: number;
  modified: boolean;
  errors: number;
}

// Example for Town screen
const townFiles: FileTab[] = [
  { id: 'blacksmith-tools', label: 'Tools', file: 'blacksmith_tools.csv' },
  { id: 'blacksmith-weapons', label: 'Weapons', file: 'weapons.csv' },
  { id: 'agronomist-storage', label: 'Storage', file: 'storage_upgrades.csv' },
  { id: 'agronomist-water', label: 'Water', file: 'water_systems.csv' },
  // ... more files
];
```

**Features**:
- Scrollable horizontal tab bar for many files
- Modified indicator (orange dot)
- Error badge (red count)
- Right-click context menu for file operations

#### 3. Data Table Editor
```typescript
interface TableConfig {
  columns: ColumnConfig[];
  data: Record<string, any>[];
  sorting: { column: string; direction: 'asc' | 'desc' };
  filtering: { column: string; value: string }[];
  selection: Set<string>; // row IDs
  editMode: 'inline' | 'modal' | 'bulk';
}

interface ColumnConfig {
  key: string;
  label: string;
  type: DataType;
  width?: number;
  editable: boolean;
  sortable: boolean;
  filterable: boolean;
  renderer?: (value: any) => VNode;
  editor?: ComponentType;
  validator?: (value: any) => ValidationResult;
}
```

**Table Features**:
- **Virtual Scrolling**: Handles 1000+ rows smoothly
- **Inline Editing**: Click cell to edit directly
- **Bulk Editing**: Select multiple rows, edit all
- **Column Resizing**: Drag column borders
- **Column Hiding**: Right-click to show/hide
- **Smart Columns**: Hide empty columns automatically
- **Copy/Paste**: Excel-like clipboard support

#### 4. Cell Editors
```typescript
// Different editor types based on data
type CellEditor = 
  | TextEditor
  | NumberEditor
  | SelectEditor
  | MultiSelectEditor
  | ReferenceEditor
  | FormulaEditor;

interface TextEditor {
  type: 'text';
  maxLength?: number;
  pattern?: RegExp;
  suggestions?: string[];
}

interface NumberEditor {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

interface ReferenceEditor {
  type: 'reference';
  targetFile: string;
  targetColumn: string;
  allowMultiple: boolean;
  searchable: boolean;
}
```

**Editor Behaviors**:
- Tab/Enter to commit and move
- Escape to cancel edit
- Auto-complete for references
- Validation on blur
- Undo/Redo support (Cmd+Z)

#### 5. Edit Modal
```typescript
interface EditModal {
  title: string;
  record: Record<string, any>;
  fields: FormField[];
  validation: ValidationSchema;
  isDirty: boolean;
  canSave: boolean;
}

interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  helpText?: string;
  dependencies?: string[]; // Other fields that affect this one
  visible?: (record: any) => boolean;
}
```

**Modal Layout**:
```
┌─────────────────────────────────────┐
│        Edit: Carrot (crop_001)      │
├─────────────────────────────────────┤
│ Name:        [Carrot              ] │
│ Energy:      [1          ] energy   │
│ Growth Time: [6          ] minutes  │
│ Seed Level:  [0          ] ▼        │
│ Stages:      [3          ]          │
│                                      │
│ Prerequisites:                       │
│ [x] None                            │
│ [ ] tower_reach_2                   │
│                                      │
│ Special Properties:                  │
│ □ Requires Water                    │
│ □ Night Growth Bonus                │
├─────────────────────────────────────┤
│      [Cancel]           [Save]       │
└─────────────────────────────────────┘
```

### Data Validation System

#### Validation Rules
```typescript
interface ValidationRule {
  type: 'required' | 'unique' | 'range' | 'reference' | 'custom';
  field: string;
  message: string;
  severity: 'error' | 'warning';
  validate: (value: any, record: any, allRecords: any[]) => boolean;
}

const cropValidation: ValidationRule[] = [
  {
    type: 'required',
    field: 'name',
    message: 'Crop name is required',
    severity: 'error'
  },
  {
    type: 'range',
    field: 'energy',
    message: 'Energy must be between 1-100',
    severity: 'error',
    validate: (v) => v >= 1 && v <= 100
  },
  {
    type: 'reference',
    field: 'prerequisite',
    message: 'Invalid prerequisite reference',
    severity: 'error',
    validate: (v) => !v || gameStore.isValidId(v)
  }
];
```

#### Cross-File Validation
```typescript
interface CrossFileValidation {
  name: string;
  files: string[];
  validate: (data: Map<string, any[]>) => ValidationResult[];
}

// Example: Ensure weapon materials exist
const weaponMaterialValidation: CrossFileValidation = {
  name: 'Weapon Materials Exist',
  files: ['weapons.csv', 'materials.csv'],
  validate: (data) => {
    const weapons = data.get('weapons.csv');
    const materials = data.get('materials.csv');
    const materialIds = new Set(materials.map(m => m.id));
    
    return weapons.flatMap(weapon => 
      weapon.materials
        .filter(mat => !materialIds.has(mat))
        .map(mat => ({
          file: 'weapons.csv',
          row: weapon.id,
          message: `Material ${mat} not found`
        }))
    );
  }
};
```

### State Management

#### Configuration Store
```typescript
export const useConfigStore = defineStore('configuration', {
  state: () => ({
    currentScreen: 'farm',
    currentFile: '',
    loadedData: new Map<string, any[]>(),
    originalData: new Map<string, any[]>(), // For reset
    changes: new Map<string, ChangeSet>(),
    validationErrors: new Map<string, ValidationError[]>(),
    selection: new Set<string>(),
  }),
  
  getters: {
    hasUnsavedChanges: (state) => 
      Array.from(state.changes.values()).some(cs => cs.changes.length > 0),
    
    currentTableData: (state) => 
      state.loadedData.get(state.currentFile) || [],
    
    canSave: (state) => 
      state.hasUnsavedChanges && state.validationErrors.size === 0,
  },
  
  actions: {
    async loadCSVFile(filename: string) {
      const response = await fetch(`/data/${filename}`);
      const text = await response.text();
      const { data, errors } = Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });
      
      if (errors.length === 0) {
        this.loadedData.set(filename, data);
        this.originalData.set(filename, structuredClone(data));
        await this.validateFile(filename);
      }
    },
    
    updateCell(file: string, rowId: string, column: string, value: any) {
      const data = this.loadedData.get(file);
      const row = data.find(r => r.id === rowId);
      
      if (row) {
        const oldValue = row[column];
        row[column] = value;
        
        this.trackChange(file, {
          type: 'update',
          rowId,
          column,
          oldValue,
          newValue: value
        });
        
        this.validateFile(file);
      }
    },
  }
});
```

### Import/Export System

#### CSV Import
```typescript
interface ImportOptions {
  mode: 'replace' | 'merge' | 'append';
  keyColumn: string;
  validateBeforeImport: boolean;
  backupCurrent: boolean;
}

async function importCSV(file: File, options: ImportOptions) {
  // 1. Parse uploaded file
  const text = await file.text();
  const { data, meta } = Papa.parse(text, { header: true });
  
  // 2. Validate structure
  const expectedColumns = getExpectedColumns(file.name);
  const missingColumns = expectedColumns.filter(
    col => !meta.fields.includes(col)
  );
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing columns: ${missingColumns.join(', ')}`);
  }
  
  // 3. Validate data
  if (options.validateBeforeImport) {
    const errors = validateData(data);
    if (errors.length > 0) {
      return { success: false, errors };
    }
  }
  
  // 4. Apply import based on mode
  switch (options.mode) {
    case 'replace':
      replaceData(data);
      break;
    case 'merge':
      mergeData(data, options.keyColumn);
      break;
    case 'append':
      appendData(data);
      break;
  }
}
```

#### Configuration Export
```typescript
interface ExportOptions {
  format: 'csv' | 'json' | 'markdown';
  includeMetadata: boolean;
  selectedFiles?: string[];
  compression: boolean;
}

async function exportConfiguration(options: ExportOptions) {
  const configData = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    files: {} as Record<string, any>
  };
  
  const files = options.selectedFiles || getAllFiles();
  
  for (const file of files) {
    const data = configStore.loadedData.get(file);
    
    switch (options.format) {
      case 'csv':
        configData.files[file] = Papa.unparse(data);
        break;
      case 'json':
        configData.files[file] = data;
        break;
      case 'markdown':
        configData.files[file] = generateMarkdownTable(data);
        break;
    }
  }
  
  if (options.compression) {
    return compressAndDownload(configData);
  } else {
    return downloadAsFile(configData);
  }
}
```

### Search & Filter System

#### Global Search
```typescript
interface SearchOptions {
  query: string;
  searchIn: 'current' | 'screen' | 'all';
  matchType: 'exact' | 'contains' | 'regex';
  caseSensitive: boolean;
  columns?: string[];
}

function searchData(options: SearchOptions): SearchResult[] {
  const results: SearchResult[] = [];
  const regex = options.matchType === 'regex' 
    ? new RegExp(options.query, options.caseSensitive ? 'g' : 'gi')
    : null;
  
  const filesToSearch = getSearchScope(options.searchIn);
  
  for (const file of filesToSearch) {
    const data = configStore.loadedData.get(file);
    
    data.forEach((row, index) => {
      const columnsToSearch = options.columns || Object.keys(row);
      
      for (const column of columnsToSearch) {
        const value = String(row[column]);
        let matches = false;
        
        switch (options.matchType) {
          case 'exact':
            matches = value === options.query;
            break;
          case 'contains':
            matches = value.includes(options.query);
            break;
          case 'regex':
            matches = regex.test(value);
            break;
        }
        
        if (matches) {
          results.push({
            file,
            rowId: row.id,
            column,
            value,
            context: getRowContext(row)
          });
        }
      }
    });
  }
  
  return results;
}
```

### Relationship Visualization

#### Prerequisite Viewer
```typescript
interface PrerequisiteGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout: 'hierarchical' | 'force' | 'circular';
}

interface GraphNode {
  id: string;
  label: string;
  type: string;
  file: string;
  level: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'requires' | 'unlocks';
}

function buildPrerequisiteGraph(itemId: string): PrerequisiteGraph {
  const visited = new Set<string>();
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  
  function traverse(id: string, level: number) {
    if (visited.has(id)) return;
    visited.add(id);
    
    const item = findItemById(id);
    nodes.push({
      id,
      label: item.name,
      type: item.type,
      file: item.file,
      level
    });
    
    // Add prerequisites
    if (item.prerequisites) {
      for (const prereq of item.prerequisites) {
        edges.push({ source: prereq, target: id, type: 'requires' });
        traverse(prereq, level - 1);
      }
    }
    
    // Add unlocks
    const unlocks = findItemsWithPrerequisite(id);
    for (const unlock of unlocks) {
      edges.push({ source: id, target: unlock.id, type: 'unlocks' });
      traverse(unlock.id, level + 1);
    }
  }
  
  traverse(itemId, 0);
  return { nodes, edges, layout: 'hierarchical' };
}
```

### Performance Optimizations

#### Data Virtualization
```typescript
// Only render visible rows
const visibleRows = computed(() => {
  const scrollTop = tableScrollTop.value;
  const viewportHeight = tableHeight.value;
  const rowHeight = 40;
  
  const startIndex = Math.floor(scrollTop / rowHeight);
  const endIndex = Math.ceil((scrollTop + viewportHeight) / rowHeight);
  
  return tableData.value.slice(startIndex, endIndex);
});
```

#### Change Tracking
```typescript
// Efficient diff tracking
class ChangeSet {
  private changes = new Map<string, Change>();
  
  track(rowId: string, column: string, oldValue: any, newValue: any) {
    const key = `${rowId}.${column}`;
    
    if (this.changes.has(key)) {
      const existing = this.changes.get(key);
      if (existing.oldValue === newValue) {
        // Reverted to original, remove change
        this.changes.delete(key);
      } else {
        // Update new value
        existing.newValue = newValue;
      }
    } else {
      this.changes.set(key, { rowId, column, oldValue, newValue });
    }
  }
  
  get hasChanges() {
    return this.changes.size > 0;
  }
}
```

### Visual Design

#### Color Coding
```css
/* Data type colors */
--type-number: #60a5fa;    /* blue-400 */
--type-string: #34d399;    /* emerald-400 */
--type-boolean: #fbbf24;   /* amber-400 */
--type-reference: #c084fc; /* purple-400 */
--type-array: #f87171;     /* red-400 */

/* State colors */
--modified: #fb923c;       /* orange-400 */
--error: #ef4444;         /* red-500 */
--valid: #10b981;         /* emerald-500 */
```

### Keyboard Shortcuts
```typescript
const shortcuts = {
  'Cmd+S': () => saveChanges(),
  'Cmd+Z': () => undo(),
  'Cmd+Shift+Z': () => redo(),
  'Cmd+F': () => openSearch(),
  'Cmd+A': () => selectAll(),
  'Delete': () => deleteSelected(),
  'Enter': () => editSelected(),
  'Escape': () => cancelEdit(),
  'Tab': () => moveToNextCell(),
  'Shift+Tab': () => moveToPreviousCell(),
};
```

### Testing Requirements

#### Data Integrity Tests
- CSV parsing with various formats
- Data type coercion
- Reference validation
- Cross-file consistency

#### UI Tests
- Table virtualization performance
- Edit/save workflows
- Bulk operations
- Import/export cycles

### Future Enhancements
1. **Version History**: Track all changes with rollback
2. **Diff Viewer**: Compare configurations side-by-side
3. **Templates**: Save/load configuration presets
4. **Collaborative Editing**: Real-time multi-user support
5. **AI Suggestions**: Balance recommendations based on patterns

### Conclusion
The Game Configuration page provides comprehensive data management capabilities essential for game balance testing. Its robust editing features, validation system, and performance optimizations enable developers to confidently experiment with game values while maintaining data integrity.
