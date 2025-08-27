# Phase 6: Edit Integration - TimeHero Upgrade Tree

## Objective
Integrate the existing Configuration screen's edit modal system into the Upgrade Tree, enabling users to edit nodes directly from the tree visualization with seamless data flow and real-time updates.

## Current State
- ✅ **Phase 5 Complete**: Full highlight mode with dependency traversal, interactive connections, and multi-level visual hierarchy
- ✅ **Edit Button Present**: TreeNode.vue has edit button that currently logs to console
- ✅ **Configuration System**: Fully functional EditItemModal.vue exists in Configuration screen
- ✅ **Data Architecture**: gameData store handles CSV loading, editing, and saving

## Phase 6 Goals

### 1. Modal Integration
**Reuse Existing EditItemModal.vue**:
- Import and integrate `EditItemModal.vue` from `src/components/GameConfiguration/`
- Ensure all dependencies (validation, material management, etc.) are available
- Maintain the same UI/UX as Configuration screen for consistency

### 2. Event System
**Wire Edit Button Click Events**:
- Enhance TreeNode.vue edit button to emit structured events
- Pass complete node data and context to parent components
- Handle event propagation through TreeGrid → UpgradeTreeView

### 3. Data Flow Architecture
**Seamless Integration with gameData Store**:
```
TreeNode Edit Click → UpgradeTreeView → EditItemModal → gameData Store → Tree Refresh
```

**File Mapping System**:
- Determine source CSV file for each node based on swimlane and type
- Map TreeNode data structure to EditItemModal expected format
- Handle data conversion between tree representation and CSV structure

### 4. Real-time Updates
**Automatic Tree Refresh**:
- Detect changes in gameData store
- Trigger tree data reload after successful saves
- Maintain user's current view state (scroll position, highlight mode)
- Preserve any active highlighting after refresh

## Technical Implementation

### Component Integration

#### UpgradeTreeView.vue Updates
```vue
<template>
  <div class="upgrade-tree-container">
    <!-- Existing tree structure -->
    <div class="tree-scroll-area card">
      <TreeGrid 
        @edit-node="handleEditNode"
        :nodes="processedNodes" 
      />
    </div>
    
    <!-- NEW: Edit Modal Integration -->
    <EditItemModal 
      v-if="editingNode"
      :item="editingNodeData"
      :file-name="getNodeFileName(editingNode)"
      @save="handleSaveNode"
      @close="handleCloseEdit"
    />
  </div>
</template>

<script setup lang="ts">
import EditItemModal from '@/components/GameConfiguration/EditItemModal.vue'
import { useUpgradeTreeStore } from '@/stores/upgradeTree'
import { useGameDataStore } from '@/stores/gameData'

const upgradeTreeStore = useUpgradeTreeStore()
const gameDataStore = useGameDataStore()

// Edit modal state
const editingNode = ref<TreeNode | null>(null)
const editingNodeData = ref<GameDataItem | null>(null)

// Handle edit button clicks from tree nodes
async function handleEditNode(node: TreeNode) {
  editingNode.value = node
  
  // Convert TreeNode back to GameDataItem for modal
  editingNodeData.value = await convertTreeNodeToGameDataItem(node)
}

// Handle modal save
async function handleSaveNode(updatedItem: GameDataItem) {
  if (!editingNode.value) return
  
  const fileName = getNodeFileName(editingNode.value)
  
  try {
    // Save through gameData store (same as Configuration screen)
    await gameDataStore.updateItem(fileName, updatedItem)
    
    // Close modal
    handleCloseEdit()
    
    // Reload tree data to reflect changes
    await upgradeTreeStore.loadTreeData()
    
    // Optionally restore highlight state if it was active
    // ... highlight state restoration logic
    
  } catch (error) {
    console.error('Failed to save node changes:', error)
    // TODO: Add error handling/notification
  }
}

// Handle modal close/cancel
function handleCloseEdit() {
  editingNode.value = null
  editingNodeData.value = null
}

// Map node to source CSV file
function getNodeFileName(node: TreeNode): string {
  // Use the same mapping logic as upgradeTree store
  return upgradeTreeStore.getSourceFileForNode(node)
}

// Convert TreeNode representation back to GameDataItem
async function convertTreeNodeToGameDataItem(node: TreeNode): Promise<GameDataItem> {
  // Get the original item from gameData store
  const fileName = getNodeFileName(node)
  const originalItem = gameDataStore.findItemById(fileName, node.id)
  
  if (!originalItem) {
    throw new Error(`Original data not found for node: ${node.id}`)
  }
  
  return originalItem
}
</script>
```

#### TreeGrid.vue Updates
```vue
<script setup lang="ts">
// Add edit event emission
const emit = defineEmits<{
  'edit-node': [node: TreeNode]
  'node-click': [node: TreeNode] 
  'background-click': []
}>()

// Handle edit events from TreeNode components
function handleNodeEdit(node: TreeNode) {
  emit('edit-node', node)
}
</script>
```

#### TreeNode.vue Updates
```vue
<script setup lang="ts">
// Update emit definition
const emit = defineEmits<{
  'node-click': [event: MouseEvent]
  'edit-click': [node: TreeNode]  // Pass full node data
}>()

// Enhanced edit button handler
function handleEditClick() {
  emit('edit-click', props.node)
}
</script>
```

### Store Enhancements

#### upgradeTree.ts Additions
```typescript
// Add method to get source file for a node
function getSourceFileForNode(node: TreeNode): string {
  // Reverse lookup from swimlane/type to CSV file
  const swimlane = node.swimlane
  const type = node.type
  
  // Use existing mapping logic in reverse
  if (swimlane === 'farm') return 'farm_actions.csv'
  if (swimlane === 'forge') return 'forge_actions.csv'
  if (swimlane === 'tower') return 'tower_actions.csv'
  if (swimlane === 'town-vendors') return 'vendors.csv'
  if (swimlane === 'town-blacksmith') return 'town_blacksmith.csv'
  if (swimlane === 'town-agronomist') return 'town_agronomist.csv'
  if (swimlane === 'town-carpenter') return 'town_carpenter.csv'
  if (swimlane === 'town-land') return 'town_land_steward.csv'
  if (swimlane === 'town-trader') return 'town_material_trader.csv'
  if (swimlane === 'town-skills') return 'town_skills_trainer.csv'
  if (swimlane === 'adventure') return 'adventures.csv'
  if (swimlane === 'mining') return 'mining.csv'
  
  throw new Error(`Unknown source file for swimlane: ${swimlane}`)
}

// Add reactive data reload method
async function reloadAfterEdit(): Promise<void> {
  // Store current state
  const wasHighlighted = highlightMode.value
  const selectedId = selectedNodeId.value
  const highlightedSet = new Set(highlightedNodes.value)
  
  // Reload data
  await loadTreeData()
  
  // Restore highlight state if applicable
  if (wasHighlighted && selectedId) {
    // Only restore if the node still exists after edit
    const nodeExists = nodes.value.some(n => n.id === selectedId)
    if (nodeExists) {
      enterHighlightMode(selectedId)
    }
  }
}
```

#### gameData.ts Integration
```typescript
// Add method to find item by ID within a specific file
function findItemById(fileName: string, itemId: string): GameDataItem | null {
  const fileItems = items.value.filter(item => item.sourceFile === fileName)
  return fileItems.find(item => item.id === itemId) || null
}

// Ensure tree refresh after updates
const upgradeTreeStore = useUpgradeTreeStore()

// Add watcher for data changes
watch(items, () => {
  // Trigger tree reload when gameData changes
  upgradeTreeStore.reloadAfterEdit()
}, { deep: true })
```

## Data Conversion Strategy

### TreeNode ↔ GameDataItem Mapping
```typescript
interface DataConversionService {
  // Convert TreeNode display format back to editable GameDataItem
  treeNodeToGameDataItem(node: TreeNode, originalItem: GameDataItem): GameDataItem
  
  // Validate that edits don't break tree structure
  validateEdit(originalItem: GameDataItem, editedItem: GameDataItem): ValidationResult
  
  // Handle prerequisite updates
  updatePrerequisites(editedItem: GameDataItem): void
}
```

**Key Conversion Points**:
- **ID**: Must remain unchanged (primary key)
- **Name**: Can be edited freely
- **Prerequisites**: Changes may affect tree structure
- **Type/Categories**: Changes may affect swimlane placement
- **Costs**: Direct mapping to cost object

## User Experience Flow

### Edit Workflow
1. **User clicks edit button** on any tree node
2. **Modal opens** with current node data pre-populated
3. **User makes changes** using familiar Configuration screen interface
4. **User saves** → Data persists to CSV → Tree refreshes
5. **Tree maintains context** (scroll position, any highlighting)

### State Preservation
- **Scroll Position**: Maintain user's current view
- **Highlight Mode**: Restore if the edited node still exists
- **Visual Feedback**: Brief indication of successful save
- **Error Handling**: Clear messaging if save fails

## Validation & Error Handling

### Edit Validation
- **Prerequisite Cycles**: Prevent edits that create circular dependencies
- **Swimlane Consistency**: Warn if type/category changes affect placement
- **ID Conflicts**: Prevent duplicate IDs within same file
- **Required Fields**: Maintain same validation as Configuration screen

### Error States
- **Save Failure**: Show error message, keep modal open
- **Data Corruption**: Rollback and show detailed error
- **Missing Dependencies**: Warn about broken prerequisites

## Testing Strategy

### Manual Testing
- ✅ Edit button opens modal with correct data
- ✅ Modal shows all fields as in Configuration screen
- ✅ Save updates CSV file correctly
- ✅ Tree refreshes with changes visible
- ✅ Highlight state preserved after edit
- ✅ Scroll position maintained
- ✅ Cancel/close works without saving

### Edge Cases
- ✅ Edit node that's currently highlighted
- ✅ Edit node with many dependencies
- ✅ Change type that affects swimlane
- ✅ Edit prerequisites (add/remove)
- ✅ Network failure during save
- ✅ Concurrent edits (if applicable)

## Success Criteria

### Functional Requirements
- ✅ **Modal Integration**: EditItemModal opens from tree edit buttons
- ✅ **Data Consistency**: Changes save to CSV and appear in tree
- ✅ **UX Continuity**: Same edit experience as Configuration screen
- ✅ **State Management**: Tree state preserved through edit operations

### Technical Requirements
- ✅ **Clean Architecture**: No duplication of edit logic
- ✅ **Error Handling**: Graceful failure modes
- ✅ **Performance**: No noticeable lag during save/refresh
- ✅ **Type Safety**: Full TypeScript coverage

### User Experience
- ✅ **Intuitive Flow**: Edit → Save → See Changes immediately
- ✅ **Context Preservation**: User doesn't lose their place
- ✅ **Feedback**: Clear success/error indicators
- ✅ **Consistency**: Same validation and UI as Configuration

## Implementation Notes

### File Dependencies
**New Imports Required**:
- `EditItemModal.vue` in UpgradeTreeView.vue
- Validation utilities from Configuration system
- Error handling components

**Data Flow Integration**:
- gameData store already handles CSV persistence
- upgradeTree store handles tree-specific data conversion
- No changes needed to CSV loading/saving logic

### Backward Compatibility
- Edit modal changes should not affect Configuration screen
- Shared components (EditItemModal) must support both contexts
- gameData store API remains unchanged

### Future Enhancements
- **Bulk Edit**: Edit multiple nodes at once
- **Edit History**: Track and show recent changes
- **Conflict Resolution**: Handle multiple users editing same data
- **Advanced Validation**: Real-time prerequisite cycle detection

---

*Phase 6 Goal: Complete integration of edit functionality, enabling users to modify upgrade tree nodes directly from the visualization with the same powerful editing capabilities available in the Configuration screen.*
