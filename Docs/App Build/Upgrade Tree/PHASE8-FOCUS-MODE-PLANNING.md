# Phase 8: Focus Mode Enhancement - DEBUGGING IN PROGRESS 🔧

## Overview
Enhancement to the existing highlight mode system that allows users to focus exclusively on a node's dependency family tree by hiding all unrelated nodes and collapsing empty swimlanes.

**STATUS**: 🔧 DEBUGGING - Core filtering issue identified

## Current Status: Debugging Phase

### ✅ Working Components
1. **Focus Mode State Management**: Focus mode activates correctly
2. **Node Position Compression**: Row positions calculate correctly in focus mode
3. **Height Calculations**: Both GridStyle and getSwimlaneStartY use consistent compressed calculations
4. **Y-Position Alignment**: No gaps between swimlanes (fixed)

### 🔧 Active Issues
1. **Primary Issue**: UpgradeTreeView passes **13 swimlanes** instead of **2** in focus mode
   - Expected: `['farm', 'town-agronomist']` (2 swimlanes)
   - Actual: `['farm', 'town-vendors', 'town-blacksmith', 'town-agronomist', 'town-carpenter', 'town-land', 'town-trader', 'town-skills', 'adventure', 'forge', 'mining', 'tower', 'other']` (13 swimlanes)
2. **Consequence**: Extra swimlane backgrounds still render despite having 0 nodes

### 🔍 Debug Evidence
**Focus Mode Logs:**
```
🚨 UpgradeTreeView: Passing 13 swimlanes to TreeGrid: (13) ['farm', 'town-vendors', ...]
🎯 FOCUS MODE ACTIVE - should only see 2 swimlane backgrounds
🎭 GridStyle: FOCUS MODE - Processing 2 swimlanes with 10 total nodes  // ← Wrong count
🌊 SwimLane farm RENDERED with height=180px at Y=0px
🌊 SwimLane town-agronomist RENDERED with height=120px at Y=180px  // ← Correct Y position
```

**Root Cause**: The `debugSwimlanes` computed property in UpgradeTreeView.vue is not properly filtering swimlanes in focus mode

### ✅ Technical Implementation - Partial Success

#### Store Changes (upgradeTree.ts) ✅
- Added focus mode state variables
- Implemented `enterFocusMode()`, `exitFocusMode()`, `calculateVisibleNodes()`
- Added `getVisibleSwimlanes()`, `getVisibleNodes()`, `getVisibleConnections()`
- **Fixed**: Row compression and Y-position calculations

#### Component Updates - Needs Fix 🔧
- **UpgradeTreeView.vue**: ❌ Not properly filtering swimlanes in focus mode
- **TreeGrid.vue**: ✅ Correct height calculations and grid styling
- **SwimLane.vue**: ✅ Proper component rendering with correct positions

#### Layout System ✅
- **Row Compression**: Working correctly (maxRow calculation)
- **Height Calculation**: Consistent between GridStyle and getSwimlaneStartY
- **Y-Position Alignment**: No gaps between swimlanes

## Requirements

### User Interaction Flow
1. **First Click**: Node highlights with family tree (existing behavior)
2. **Second Click**: Enter "Focus Mode" - hide all nodes NOT part of the family tree
3. **Exit Focus**: Click empty space to return to full view with all nodes visible

### Visual Behavior
- **Focus Mode State**: Only nodes in the selected family tree remain visible
- **Swimlane Management**: Empty swimlanes completely hidden
- **Layout Adjustment**: Grid recalculates to accommodate visible nodes only
- **Highlight Preservation**: Existing highlight states (selected, highlighted, dimmed) continue to work within focus mode
- **Visual Feedback**: Selected node outline changes color to indicate focus mode (different from highlight mode)

### Scope Definition
- **Family Tree**: All prerequisites (upward chain) + all dependents (downward chain) of the selected node
- **Cross-Swimlane**: Preserve connections that span multiple swimlanes
- **Multi-Select**: REMOVED - Multi-select feature will be disabled/removed from the system

## Technical Approach

### State Management (upgradeTree.ts)
```typescript
// New state variables
const focusMode = ref<boolean>(false)
const focusedNodeId = ref<string | null>(null)
const visibleNodeIds = ref<Set<string>>(new Set())

// New functions
function enterFocusMode(nodeId: string): void
function exitFocusMode(): void
function getVisibleSwimlanes(): Swimlane[]
function calculateVisibleNodes(nodeId: string): Set<string>
function recalculateLayoutForFocus(): void
```

### Component Changes

#### TreeGrid.vue
- Filter rendered nodes based on `visibleNodeIds`
- Hide swimlanes with no visible nodes
- Recalculate grid dimensions for visible content only
- Adjust scrolling and positioning

#### TreeNode.vue
- Detect second click on already selected node
- Add focus mode visual styling
- Handle focus mode click interactions

#### ConnectionLayer.vue
- Only render connections between visible nodes
- Maintain proper path calculations for focused view

### Layout Algorithm Updates
- **Virtual Layout**: Create separate layout calculation for focus mode
- **Column Reassignment**: Recalculate columns for visible nodes only
- **Row Compaction**: Remove gaps from hidden nodes
- **Swimlane Sizing**: Adjust heights based on visible content

### Animation Strategy
- **No Animation**: Instant hide/show for immediate response
- **Performance Priority**: Instant response over visual effects
- **Layout Shift**: Immediate repositioning of remaining nodes

## Technical Risks & Considerations

### High Risk Areas
1. **Layout Recalculation**: Complex interaction with existing topological sort algorithm
2. **Performance Impact**: Frequent layout changes with 460+ nodes
3. **State Complexity**: Managing focus mode alongside existing highlight system
4. **Edge Cases**: Circular dependencies, orphaned nodes, massive family trees

### Data Integrity
- **Preserve Original Layout**: Focus mode should not affect underlying data structure
- **State Restoration**: Exiting focus mode must restore exact previous state
- **Connection Consistency**: All relationships must remain intact

### User Experience
- **Mode Confusion**: Clear visual distinction between highlight and focus modes
- **Performance**: Smooth transitions without lag
- **Accessibility**: Keyboard navigation and screen reader support

## Implementation Plan

### Phase 8.1: Core State Management
- Add focus mode state variables to store
- Implement `calculateVisibleNodes()` function
- Add focus mode entry/exit functions
- Unit tests for family tree calculation

### Phase 8.2: Layout System Updates
- Modify layout algorithm to handle visible node filtering
- Implement virtual layout calculation for focus mode
- Add swimlane visibility management
- Test layout integrity

### Phase 8.3: Component Integration
- Update TreeGrid.vue for node filtering and swimlane hiding
- Modify TreeNode.vue for focus mode interactions
- Update ConnectionLayer.vue for visible connections only
- Implement visual feedback system

### Phase 8.4: Animation & Polish
- Add smooth transitions for focus mode entry/exit
- Implement staggered node animations
- Add visual indicators for current mode
- Performance optimization

### Phase 8.5: Testing & Edge Cases
- Test with complex dependency trees
- Validate circular dependency handling
- Test multi-select behavior in focus mode
- Performance testing with large datasets

## Open Questions for User - RESOLVED

### 1. Exit Mechanism ✅
**DECISION**: Click empty space to exit focus mode

### 2. Multi-Select Behavior ✅
**DECISION**: Remove multi-select feature entirely - not needed

### 3. Visual Feedback ✅
**DECISION**: Node outline color change for focus mode, hidden swimlanes/nodes provide sufficient feedback

### 4. Empty Swimlanes ✅
**DECISION**: Completely hidden

### 5. Animation Preference ✅
**DECISION**: Instant (no animation)

### 6. Performance vs Visual Quality ✅
**DECISION**: Instant response priority

## Success Criteria - Current Progress

### Functional Requirements
- 🔧 **IN PROGRESS**: Double-click enters focus mode showing only family tree
  - ✅ Focus mode activates correctly  
  - ❌ Still shows 13 swimlanes instead of 2
- ❌ Empty swimlanes still visible (consequence of above issue)
- ✅ Layout calculations work correctly when data is filtered properly
- ✅ All existing highlight functionality preserved
- ✅ Smooth exit back to full view

### Performance Requirements
- ✅ Focus mode entry/exit completes instantly
- ✅ No noticeable lag during transitions
- ✅ Proper Vue component recreation with key changes

### User Experience Requirements
- 🔧 **PARTIAL**: Clear visual feedback for current mode
- ✅ Intuitive interaction patterns (double-click working)
- ✅ No loss of user context when exiting focus mode

## Next Steps for New Chat

### Immediate Priority
1. **Fix UpgradeTreeView.vue swimlane filtering**: The `debugSwimlanes` computed property needs to return `treeStore.getVisibleSwimlanes()` in focus mode
2. **Verify filtering works end-to-end**: Ensure only 2 swimlanes render for Well Pump I focus mode
3. **Clean up debug logging**: Remove console.log statements once working

### Technical Investigation Required
- Why is `debugSwimlanes` not using the store's `getVisibleSwimlanes()` method?
- Is the computed property reactivity working correctly with focus mode changes?
- Verify the TreeGrid receives the correctly filtered data

## Testing Status

### How to Reproduce Issue
1. Navigate to: http://localhost:5177/TimeHeroSim2/#/upgrade-tree
2. Click "Well Pump I" once (highlight)
3. Click "Well Pump I" again (focus mode)
4. **Expected**: Only 2 swimlanes (farm, town-agronomist)
5. **Actual**: 13 swimlanes with 11 empty backgrounds

## Risk Mitigation

### Backup Plan
If focus mode proves too complex:
1. **Fallback Option**: Enhanced highlight mode with better visual distinction
2. **Simplified Version**: Focus mode without layout recalculation (just hide nodes in place)
3. **Progressive Enhancement**: Ship basic version first, enhance with animations later

### Testing Strategy
1. **Development**: Extensive testing with various dependency patterns
2. **Edge Cases**: Test with nodes having 0, 1, and 20+ connections
3. **Performance**: Stress test with maximum node count
4. **User Testing**: Validate interaction patterns with real usage scenarios

## Testing Instructions

### How to Test Focus Mode
1. **Start the application**: `npm run dev`
2. **Navigate to**: http://localhost:[PORT]/TimeHeroSim2/#/upgrade-tree
3. **Test the interaction flow**:
   - Click any node once → should highlight family tree (existing behavior)
   - Click same node again → should enter focus mode (only family tree nodes visible)
   - Click empty space → should exit focus mode (return to full view)

### Expected Behavior
- **Focus Mode Entry**: Only nodes in the dependency chain remain visible
- **Empty Swimlanes**: Completely hidden when they contain no visible nodes
- **Visual Feedback**: Focused node has purple border instead of gold
- **Instant Response**: No animations, immediate hide/show
- **Layout Adjustment**: Grid recalculates for visible nodes only
- **Connection Filtering**: Only arrows between visible nodes display

### Success Criteria
- ✅ Double-click enters focus mode showing only family tree
- ✅ Empty swimlanes collapse/hide appropriately  
- ✅ Layout remains visually organized and readable
- ✅ All existing highlight functionality preserved
- ✅ Smooth exit back to full view
- ✅ Focus mode entry/exit completes instantly
- ✅ Purple border distinguishes focus mode from highlight mode

---

**Current Status**: Ready for new chat to resolve the final filtering issue in UpgradeTreeView.vue. The core architecture is working, but the component isn't properly using the store's filtered data in focus mode.
